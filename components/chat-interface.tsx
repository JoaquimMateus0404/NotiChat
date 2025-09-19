"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Send, Search, MoreVertical, Phone, Video, Info, Smile, Paperclip, MessageCircle, Plus, X, Upload, FileText, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConversations, type Conversation } from "@/hooks/use-chat"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useWebSocket } from "@/hooks/use-websocket"
import { useNotifications } from "@/hooks/use-notifications"
import { useUserSearch } from "@/hooks/use-user-search"
import { useMessagesPagination } from "@/hooks/use-messages-pagination"
import { useWebRTCCall } from "@/hooks/use-webrtc-call"
import { CallInterface, IncomingCallDialog } from "@/components/call-interface"
import { ClientOnly } from "@/components/client-only"

export function ChatInterface() {
  const { data: session } = useSession()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set())
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread' | 'online'>('all')
  const [showUserInfoDialog, setShowUserInfoDialog] = useState(false)
  const [showIncomingCallDialog, setShowIncomingCallDialog] = useState(false)
  const [incomingCallData, setIncomingCallData] = useState<{
    from: any;
    callType: 'voice' | 'video';
    offer: RTCSessionDescriptionInit;
  } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Hooks
  const { conversations, loading: conversationsLoading, updateConversationWithMessage, markConversationAsRead, markAllConversationsAsRead } = useConversations()
  const { 
    isConnected, 
    typingUsers, 
    onlineUsers,
    incomingCall, 
    sendTyping, 
    sendStopTyping, 
    sendMessage: sendWebSocketMessage,
    sendReaction: sendWebSocketReaction,
    onMessage,
    onReaction,
    onMessageRead,
    onCall,
    onCallEnd,
    markMessageAsRead,
    forceReconnect
  } = useWebSocket()
  
  // WebRTC Hook
  const {
    callState,
    startCall,
    acceptCall: acceptWebRTCCall,
    rejectCall: rejectWebRTCCall,
    endCall: endWebRTCCall
  } = useWebRTCCall()
  
  const { 
    permission, 
    requestPermission, 
    notifyNewMessage, 
    notifyNewReaction 
  } = useNotifications()
  const { 
    users: searchResults, 
    loading: searchLoading, 
    searchUsers, 
    startConversation, 
    clearResults 
  } = useUserSearch()
  const {
    messages,
    loading: messagesLoading,
    loadingMore,
    hasMore,
    addNewMessage,
    addReaction,
    loadMoreMessages
  } = useMessagesPagination(selectedConversation?._id || null)

  // Lista de emojis comuns
  const commonEmojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😮', '👍', '👎', '❤️', '🔥', '🎉', '👏', '🙏']
  const reactionEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '🎉']

  const filteredConversations = conversations.filter((conv) => {
    // Filtro de busca por texto
    const matchesSearch = conv.participant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant?.username?.toLowerCase().includes(searchQuery.toLowerCase())
    
    if (!matchesSearch) return false
    
    // Filtros adicionais
    switch (conversationFilter) {
      case 'unread':
        return conv.unreadCount > 0
      case 'online':
        return conv.participant?._id && onlineUsers.has(conv.participant._id)
      case 'all':
      default:
        return true
    }
  })

  // Usuários que estão digitando na conversa atual
  const currentTypingUsers = typingUsers.filter(
    user => user.conversationId === selectedConversation?._id
  )

  // WebSocket callbacks
  useEffect(() => {
    const unsubscribeMessage = onMessage((message: any) => {
      if (message.conversation === selectedConversation?._id) {
        addNewMessage(message)
        
        // Notificar se a mensagem for de outro usuário
        if (message.sender._id !== session?.user?.id) {
          notifyNewMessage(message.sender.name, message.content, message.conversation)
          
          // Marcar como lida automaticamente após um breve delay
          setTimeout(() => {
            markMessageAsRead(message._id, message.conversation)
          }, 1000)
        }
      } else {
        // Se a mensagem é de outra conversa, atualizar a lista de conversas otimisticamente
        updateConversationWithMessage(message.conversation, message)
        
        // Notificar se a mensagem for de outro usuário
        if (message.sender._id !== session?.user?.id) {
          notifyNewMessage(message.sender.name, message.content, message.conversation)
        }
      }
    })

    const unsubscribeReaction = onReaction((reaction: any) => {
      if (reaction.messageId) {
        addReaction(reaction.messageId, {
          emoji: reaction.emoji,
          user: reaction.userId,
          createdAt: reaction.createdAt || new Date().toISOString()
        })
        
        // Notificar se a reação for de outro usuário
        if (reaction.userId !== session?.user?.id) {
          notifyNewReaction(reaction.name, reaction.emoji)
        }
      }
    })

    const unsubscribeMessageRead = onMessageRead((data: any) => {
      // Adicionar a mensagem à lista de lidas
      if (data.messageId) {
        setReadMessages(prev => new Set(prev).add(data.messageId))
      }
    })

    const unsubscribeCall = onCall((callData: any) => {
      // Lidar com eventos de chamada
      if (callData.callId || callData.type === 'incoming') {
        console.log('Evento de chamada recebido:', callData)
        
        // Se é uma chamada aceita, rejeitada, etc.
        if (callData.type === 'accepted') {
          console.log('Chamada aceita!')
          // Começar a chamada real
        } else if (callData.type === 'rejected') {
          console.log('Chamada rejeitada!')
          
          if (permission === 'granted') {
            new Notification('Chamada rejeitada', {
              body: 'O usuário rejeitou sua chamada',
              icon: "/placeholder.svg"
            })
          }
        }
      }
    })

    const unsubscribeCallEnd = onCallEnd((data: any) => {
      console.log('Chamada encerrada:', data)
      
      // Reset call states - estes valores não existem mais, são do WebRTC hook
      setShowIncomingCallDialog(false)
      
      if (permission === 'granted') {
        new Notification('Chamada encerrada', {
          body: data.reason === 'user_disconnected' ? 'O usuário se desconectou' : 'Chamada finalizada',
          icon: "/placeholder.svg"
        })
      }
    })

    return () => {
      unsubscribeMessage()
      unsubscribeReaction()
      unsubscribeMessageRead()
      unsubscribeCall()
      unsubscribeCallEnd()
    }
  }, [selectedConversation?._id, session?.user?.id, markMessageAsRead, addNewMessage, addReaction, notifyNewMessage, notifyNewReaction, onMessageRead, updateConversationWithMessage, onCall, onCallEnd])

  // Lidar com chamadas recebidas
  useEffect(() => {
    if (incomingCall) {
      console.log('Chamada recebida:', incomingCall)
      setShowIncomingCallDialog(true)
      
      // Notificar sobre chamada recebida
      if (permission === 'granted') {
        const callTypeText = incomingCall.callType === 'voice' ? 'voz' : 'vídeo'
        new Notification(`Chamada de ${callTypeText} recebida`, {
          body: `${incomingCall.fromUserName} está chamando você`,
          icon: incomingCall.fromUserAvatar || "/placeholder.svg"
        })
      }
    }
  }, [incomingCall, permission])

  // Solicitar permissão para notificações
  useEffect(() => {
    if (permission === 'default') {
      requestPermission().catch((error) => {
        console.warn('Erro ao solicitar permissão para notificações:', error)
      })
    }
  }, [permission])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      
      // Criar preview para imagens
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFilePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      setIsUploading(true)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        return data.url
      }
    } catch (error) {
      console.error('Erro no upload:', error)
    } finally {
      setIsUploading(false)
    }
    return null
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const formatMessageTime = (date: string) => {
    // Sempre retornar formato consistente para evitar mismatch de hidratação Não lidas
    try {
      const messageDate = new Date(date)
      if (isNaN(messageDate.getTime())) {
        return "--:--"
      }
      
      const now = new Date()
      const isToday = messageDate.toDateString() === now.toDateString()
      
      if (isToday) {
        return messageDate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        })
      } else {
        return messageDate.toLocaleDateString('pt-BR', { 
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Sao_Paulo'
        })
      }
    } catch (error) {
      return "--:--"
    }
  }

  const formatCallDuration = (startTime: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000)
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Removido: não queremos seleção automática de conversa

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return
    
    let attachments: any[] = []
    
    // Upload do arquivo se houver um selecionado
    if (selectedFile) {
      const fileUrl = await uploadFile(selectedFile)
      if (!fileUrl) {
        alert('Erro ao fazer upload do arquivo')
        return
      }
      
      // Determinar o tipo do arquivo
      let fileType: 'image' | 'video' | 'audio' | 'file' = 'file'
      if (selectedFile.type.startsWith('image/')) {
        fileType = 'image'
      } else if (selectedFile.type.startsWith('video/')) {
        fileType = 'video'
      } else if (selectedFile.type.startsWith('audio/')) {
        fileType = 'audio'
      }
      
      // Criar objeto de anexo no formato correto
      attachments.push({
        type: fileType,
        url: fileUrl,
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      })
    }
    
    const messageContent = newMessage.trim()
    
    try {
      // Enviar via API
      const response = await fetch(`/api/conversations/${selectedConversation._id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: messageContent,
          attachments: attachments
        }),
      })

      if (response.ok) {
        const message = await response.json()
        
        // Enviar via WebSocket para tempo real
        sendWebSocketMessage(selectedConversation._id, message)
        
        setNewMessage("")
        handleRemoveFile()
        
        // Parar indicador de digitação
        if (typingTimeout) {
          clearTimeout(typingTimeout)
          setTypingTimeout(null)
        }
        sendStopTyping(selectedConversation._id)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Erro ao enviar mensagem')
    }
  }

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    
    if (!selectedConversation) return
    
    // Enviar indicador de digitação
    sendTyping(selectedConversation._id)
    
    // Limpar timeout anterior
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }
    
    // Parar de digitar após 3 segundos de inatividade
    const timeout = setTimeout(() => {
      sendStopTyping(selectedConversation._id)
      setTypingTimeout(null)
    }, 3000)
    
    setTypingTimeout(timeout)
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!selectedConversation) return

    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      })

      if (response.ok) {
        // Enviar via WebSocket
        sendWebSocketReaction(messageId, selectedConversation._id, emoji)
        setShowReactionPicker(null)
      }
    } catch (error) {
      console.error('Erro ao reagir:', error)
    }
  }

  const handleStartConversation = async (userId: string) => {
    try {
      const conversation = await startConversation(userId)
      setSelectedConversation(conversation)
      setShowNewChatDialog(false)
      clearResults()
      setUserSearchQuery("")
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
      alert('Erro ao iniciar conversa')
    }
  }

  const handleUserSearch = (query: string) => {
    setUserSearchQuery(query)
    searchUsers(query)
  }

  const handleMarkAllAsRead = async () => {
    // Implementar lógica para marcar todas as conversas como lidas
    // Isso seria uma chamada à API para marcar mensagens como lidas
    try {
      const unreadConversations = conversations.filter(conv => conv.unreadCount > 0)
      
      // Atualizar estado local primeiro (atualização otimista)
      markAllConversationsAsRead()
      
      // Enviar via WebSocket para sincronizar com o servidor
      for (const conv of unreadConversations) {
        if (conv.lastMessage) {
          markMessageAsRead(conv.lastMessage._id, conv._id)
        }
      }
    } catch (error) {
      console.error('Erro ao marcar conversas como lidas:', error)
    }
  }

  const handleStartCall = async (type: 'voice' | 'video') => {
    if (!selectedConversation) return
    
    try {
      await startCall(
        selectedConversation.participant._id,
        selectedConversation.participant.name,
        selectedConversation.participant.profilePicture || "/placeholder.svg",
        type
      )
      
      // Notificar sobre o início da chamada
      const callTypeText = type === 'voice' ? 'voz' : 'vídeo'
      if (permission === 'granted') {
        new Notification(`Chamada de ${callTypeText} iniciada`, {
          body: `Conectando com ${selectedConversation.participant.name}...`,
          icon: selectedConversation.participant.profilePicture || "/placeholder.svg"
        })
      }
    } catch (error) {
      console.error('Erro ao iniciar chamada:', error)
    }
  }

  const handleEndCall = () => {
    endWebRTCCall()
  }

  const handleAcceptCall = async () => {
    if (!incomingCallData) return
    
    try {
      await acceptWebRTCCall(
        incomingCallData.offer,
        incomingCallData.from.id,
        incomingCallData.from.name,
        incomingCallData.from.avatar || "/placeholder.svg",
        incomingCallData.callType
      )
      setShowIncomingCallDialog(false)
      setIncomingCallData(null)
    } catch (error) {
      console.error('Erro ao aceitar chamada:', error)
    }
  }

  const handleRejectCall = () => {
    if (!incomingCallData) return
    
    rejectWebRTCCall(incomingCallData.from.id)
    setShowIncomingCallDialog(false)
    setIncomingCallData(null)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget
    
    // Se chegou ao topo e tem mais mensagens, carregar mais
    if (scrollTop === 0 && hasMore && !loadingMore) {
      loadMoreMessages()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Adicionar listener para tecla ESC e atalhos de chamada
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC para sair da conversa ou encerrar chamada
      if (e.key === "Escape") {
        if (callState.isInCall) {
          handleEndCall()
        } else if (selectedConversation) {
          setSelectedConversation(null)
        }
      }
      
      // Ctrl+1 para chamada de voz
      if (e.ctrlKey && e.key === "1" && selectedConversation && !callState.isInCall) {
        e.preventDefault()
        handleStartCall('voice')
      }
      
      // Ctrl+2 para chamada de vídeo
      if (e.ctrlKey && e.key === "2" && selectedConversation && !callState.isInCall) {
        e.preventDefault()
        handleStartCall('video')
      }
      
      // Ctrl+I para informações do usuário
      if (e.ctrlKey && e.key === "i" && selectedConversation) {
        e.preventDefault()
        setShowUserInfoDialog(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedConversation, callState.isInCall])

  // WebRTC callbacks são gerenciados pelo hook useWebRTCCall
  // Todas as funções de mídia foram movidas para o hook WebRTC

  if (!session) {
    return (
      <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-6">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Faça login para acessar o chat</h3>
            <p className="text-muted-foreground">
              Você precisa estar logado para conversar com outros usuários.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {/* Interface de chamada WebRTC */}
      <CallInterface onCallEnd={handleEndCall} />

      {/* Modal de chamada recebida */}
      {incomingCallData && (
        <IncomingCallDialog
          isOpen={showIncomingCallDialog}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
          callerName={incomingCallData.from.name}
          callerAvatar={incomingCallData.from.avatar}
          callType={incomingCallData.callType}
        />
      )}

      {/* Modal de informações do usuário */}
      <Dialog open={showUserInfoDialog} onOpenChange={setShowUserInfoDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Informações do Usuário</DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedConversation.participant.profilePicture || "/placeholder.svg"} />
                  <AvatarFallback className="text-xl">
                    {selectedConversation.participant.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{selectedConversation.participant.name}</h3>
                  <p className="text-muted-foreground">@{selectedConversation.participant.username}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedConversation.participant._id && onlineUsers.has(selectedConversation.participant._id) ? (
                      <span className="text-green-500">● Online</span>
                    ) : (
                      <span className="text-gray-500">● Offline</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">ID do Usuário</h4>
                    <p className="text-sm font-mono bg-muted p-2 rounded text-xs break-all">
                      {selectedConversation.participant._id}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Status</h4>
                    <p className="text-sm">
                      {selectedConversation.participant._id && onlineUsers.has(selectedConversation.participant._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Mensagens não lidas</h4>
                    <p className="text-sm">{selectedConversation.unreadCount}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground">Última atividade</h4>
                    <p className="text-sm">
                      <ClientOnly fallback="Carregando...">
                        {new Date(selectedConversation.updatedAt).toLocaleString('pt-BR')}
                      </ClientOnly>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Ações</h4>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowUserInfoDialog(false)
                      handleStartCall('voice')
                    }}
                    disabled={callState.isInCall}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Chamada de voz
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setShowUserInfoDialog(false)
                      handleStartCall('video')
                    }}
                    disabled={callState.isInCall}
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Chamada de vídeo
                  </Button>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm text-muted-foreground mb-3">Atalhos de Teclado</h4>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Chamada de voz</span>
                    <code className="bg-muted px-2 py-1 rounded">Ctrl + 1</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Chamada de vídeo</span>
                    <code className="bg-muted px-2 py-1 rounded">Ctrl + 2</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Informações do usuário</span>
                    <code className="bg-muted px-2 py-1 rounded">Ctrl + I</code>
                  </div>
                  <div className="flex justify-between">
                    <span>Encerrar chamada / Sair</span>
                    <code className="bg-muted px-2 py-1 rounded">Esc</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de chamada recebida */}
      <Dialog open={showIncomingCallDialog} onOpenChange={setShowIncomingCallDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Chamada Recebida</DialogTitle>
          </DialogHeader>
          {incomingCall && (
            <div className="space-y-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={incomingCall.fromUserAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-2xl">
                    {incomingCall.fromUserName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{incomingCall.fromUserName}</h3>
                  <p className="text-muted-foreground">
                    {incomingCall.callType === 'voice' ? 'Chamada de voz' : 'Chamada de vídeo'}
                  </p>
                </div>
              </div>
              
              {incomingCall.callType === 'video' && (
                <div className="bg-muted rounded-lg h-32 flex items-center justify-center">
                  <Video className="h-8 w-8 text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Chamada de vídeo</span>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="destructive" 
                  size="lg"
                  onClick={handleRejectCall}
                  className="rounded-full w-16 h-16"
                >
                  <X className="h-6 w-6" />
                </Button>
                <Button 
                  variant="default" 
                  size="lg"
                  onClick={handleAcceptCall}
                  className="rounded-full w-16 h-16 bg-green-500 hover:bg-green-600"
                >
                  {incomingCall.callType === 'voice' ? (
                    <Phone className="h-6 w-6" />
                  ) : (
                    <Video className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Left Sidebar - Chat List */}
        <div className={cn(
          "lg:col-span-1",
          selectedConversation ? "hidden lg:block" : "block"
        )}>
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
                  {/* Indicador de conexão WebSocket */}
                  <div className="flex items-center space-x-1">
                    <div className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      isConnected ? "bg-green-500" : "bg-red-500"
                    )} title={isConnected ? "Conectado" : "Desconectado"}></div>
                    {!isConnected && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={forceReconnect}
                        className="h-6 px-2 text-xs text-red-500 hover:text-red-700"
                        title="Tentar reconectar"
                      >
                        Reconectar
                      </Button>
                    )}
                  </div>
                 
                  
                </div>
                <div className="flex items-center space-x-1">
                  <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" title="Nova conversa">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    {/* ...resto do dialog... */}
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Nova Conversa</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="search-users">Buscar usuário</Label>
                          <Input 
                            id="search-users"
                            placeholder="Digite o nome ou @username..."
                            className="mt-2"
                            value={userSearchQuery}
                            onChange={(e) => handleUserSearch(e.target.value)}
                          />
                        </div>
                        
                        {/* Resultados da busca */}
                        <div className="max-h-60 overflow-y-auto">
                          {searchLoading ? (
                            <div className="text-center py-4 text-muted-foreground">
                              Buscando usuários...
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="space-y-2">
                              {searchResults.map((user) => (
                                <div
                                  key={user._id}
                                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                                  onClick={() => handleStartConversation(user._id)}
                                >
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.profilePicture || "/placeholder.svg"} />
                                    <AvatarFallback>
                                      {user.name.split(" ").map((n) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2">
                                      <p className="font-medium text-sm">{user.name}</p>
                                      {user.verified && (
                                        <Badge variant="secondary" className="text-xs">
                                          Verificado
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">@{user.username}</p>
                                    {user.title && (
                                      <p className="text-xs text-muted-foreground">{user.title}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : userSearchQuery.length >= 2 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              Nenhum usuário encontrado
                            </div>
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              Digite pelo menos 2 caracteres para buscar
                            </div>
                          )}
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm" title="Opções">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  {/* Botão para marcar todas como lidas */}
                  {conversations.filter(conv => conv.unreadCount > 0).length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleMarkAllAsRead}
                      title="Marcar todas como lidas"
                      className="text-xs"
                    >
                      ✓ Todas
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar conversas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {/* Filtros rápidos */}
                <div className="flex space-x-2 text-xs">
                  <Button
                    variant={conversationFilter === "all" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setConversationFilter("all")
                      setSearchQuery("")
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Todas
                  </Button>
                  <Button
                    variant={conversationFilter === "unread" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setConversationFilter("unread")
                      setSearchQuery("")
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Não lidas ({conversations.filter(conv => conv.unreadCount > 0).length})
                  </Button>
                  <Button
                    variant={conversationFilter === "online" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setConversationFilter("online")
                      setSearchQuery("")
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Online ({conversations.filter(conv => 
                      conv.participant?._id && onlineUsers.has(conv.participant._id)
                    ).length})
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                {conversationsLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Carregando conversas...
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {searchQuery ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
                  </div>
                ) : (
                  <div className="space-y-1 p-3">
                    {filteredConversations.map((conversation) => {
                      // Verificar se há usuários digitando nesta conversa
                      const typingInThisConv = typingUsers.filter(
                        user => user.conversationId === conversation._id
                      )
                      
                      // Verificar se a conversa tem mensagens não lidas
                      const hasUnreadMessages = conversation.unreadCount > 0
                      
                      return (
                        <div
                          key={conversation._id}
                          onClick={() => {
                            setSelectedConversation(conversation)
                            
                            // Marcar conversa como lida se tinha mensagens não lidas
                            if (conversation.unreadCount > 0) {
                              markConversationAsRead(conversation._id)
                              
                              // Marcar última mensagem como lida via WebSocket
                              if (conversation.lastMessage) {
                                markMessageAsRead(conversation.lastMessage._id, conversation._id)
                              }
                            }
                          }}
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200",
                            selectedConversation?._id === conversation._id 
                              ? "bg-accent/20 border border-accent/30 shadow-sm" 
                              : hasUnreadMessages
                                ? "hover:bg-muted bg-accent/5 border border-accent/10"
                                : "hover:bg-muted",
                            // Efeito de pulse para conversas com mensagens não lidas
                            hasUnreadMessages && selectedConversation?._id !== conversation._id && "animate-pulse"
                          )}
                        >
                          <div className="relative">
                            <Avatar className={cn(
                              "transition-all duration-200",
                              hasUnreadMessages ? "ring-2 ring-accent ring-offset-2" : ""
                            )}>
                              <AvatarImage src={conversation.participant.profilePicture || "/placeholder.svg"} />
                              <AvatarFallback>
                                {conversation.participant.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {/* Indicador de status online */}
                            <div className={cn(
                              "absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background rounded-full transition-colors",
                              conversation.participant?._id && onlineUsers.has(conversation.participant._id) ? "bg-green-500" : "bg-gray-400"
                            )}></div>
                            {/* Indicador de digitação para esta conversa */}
                            {typingInThisConv.length > 0 && (
                              <div className="absolute -top-1 -left-1 h-3 w-3 bg-blue-500 rounded-full animate-pulse border-2 border-background"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={cn(
                                "text-sm truncate transition-all duration-200",
                                hasUnreadMessages ? "font-bold text-foreground" : "font-medium text-foreground"
                              )}>
                                {conversation.participant?.name || "Usuário"}
                              </p>
                              <div className="flex items-center space-x-1">
                                {conversation.lastMessage && (
                                  <span className={cn(
                                    "text-xs transition-colors",
                                    hasUnreadMessages ? "text-accent font-medium" : "text-muted-foreground"
                                  )}>
                                    <ClientOnly fallback="--:--">
                                      {new Date(conversation.updatedAt).toLocaleTimeString('pt-BR', { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </ClientOnly>
                                  </span>
                                )}
                                {hasUnreadMessages && (
                                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">
                              @{conversation.participant?.username || "unknown"}
                              {/* Mostrar status de digitação */}
                              {typingInThisConv.length > 0 && (
                                <span className="text-blue-500 font-medium ml-2">
                                  • está digitando...
                                </span>
                              )}
                            </p>
                            {conversation.lastMessage ? (
                              <p className={cn(
                                "text-sm truncate transition-all duration-200",
                                hasUnreadMessages 
                                  ? "text-foreground font-medium" 
                                  : "text-muted-foreground"
                              )}>
                                {/* Prefixo para mostrar quem enviou */}
                                {conversation.lastMessage.sender?._id === session?.user?.id ? "Você: " : ""}
                                {conversation.lastMessage.content || 
                                  (conversation.lastMessage.attachments && conversation.lastMessage.attachments.length > 0 
                                    ? "📎 Anexo" 
                                    : "Mensagem")}
                              </p>
                            ) : typingInThisConv.length > 0 ? (
                              <p className="text-sm text-blue-500 font-medium">
                                <ClientOnly fallback="digitando...">
                                  <span className="inline-flex items-center">
                                    <span className="flex space-x-1 mr-2">
                                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce"></span>
                                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                                      <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                    </span>
                                    digitando...
                                  </span>
                                </ClientOnly>
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            {/* Contador de mensagens não lidas */}
                            {conversation.unreadCount > 0 && (
                              <Badge 
                                variant="default" 
                                className={cn(
                                  "h-5 min-w-5 px-1.5 flex items-center justify-center text-xs font-bold",
                                  "bg-accent text-accent-foreground",
                                  "animate-pulse"
                                )}
                              >
                                {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                              </Badge>
                            )}
                            {/* Indicadores de status da conversa */}
                            <div className="flex items-center space-x-1">
                              {/* Indicador de conversa ativa */}
                              {selectedConversation?._id === conversation._id && (
                                <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                              )}
                              {/* Indicador de nova atividade */}
                              {hasUnreadMessages && (
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Chat Window */}
        <div className={cn(
          "lg:col-span-3",
          !selectedConversation ? "hidden lg:block" : "block"
        )}>
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Botão de voltar no mobile */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="lg:hidden"
                      onClick={() => setSelectedConversation(null)}
                    >
                      ←
                    </Button>
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConversation?.participant?.profilePicture || "/placeholder.svg"} />
                        <AvatarFallback>
                          {selectedConversation?.participant?.name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      {/* Indicador de status online */}
                      <div className={cn(
                        "absolute -bottom-1 -right-1 h-3 w-3 border-2 border-background rounded-full",
                        selectedConversation?.participant?._id && onlineUsers.has(selectedConversation.participant._id) ? "bg-green-500" : "bg-gray-400"
                      )}></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground flex items-center">
                        {selectedConversation?.participant?.name || "Usuário"}
                        {callState.isInCall && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full flex items-center">
                            {callState.callType === 'voice' ? <Phone className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                            Em chamada
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        @{selectedConversation?.participant?.username || "unknown"} • {
                          selectedConversation?.participant?._id && onlineUsers.has(selectedConversation.participant._id) ? "Online" : "Offline"
                        } {!isConnected && "(Desconectado)"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleStartCall('voice')}
                      disabled={callState.isInCall}
                      title="Chamada de voz (Ctrl+1)"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleStartCall('video')}
                      disabled={callState.isInCall}
                      title="Chamada de vídeo (Ctrl+2)"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowUserInfoDialog(true)}
                      title="Informações do usuário (Ctrl+I)"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Banner de aviso de desconexão */}
              {!isConnected && (
                <div className="bg-red-50 border-b border-red-200 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-700">
                        Desconectado do servidor. Algumas funcionalidades podem não funcionar.
                      </span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={forceReconnect}
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      Reconectar
                    </Button>
                  </div>
                </div>
              )}

              {/* Messages Area */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full" onScrollCapture={handleScroll}>
                  {messagesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Carregando mensagens...
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {/* Botão carregar mais no topo */}
                      {hasMore && (
                        <div className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={loadMoreMessages}
                            disabled={loadingMore}
                          >
                            {loadingMore ? "Carregando..." : "Carregar mensagens anteriores"}
                          </Button>
                        </div>
                      )}
                      
                      {messages.length === 0 ? (
                        <div className="text-center text-muted-foreground">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Nenhuma mensagem ainda. Envie a primeira!</p>
                        </div>
                      ) : (
                        messages.map((message) => {
                          const isOwn = message.sender._id === session.user?.id
                          return (
                            <div key={message._id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                              <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                                {!isOwn && (
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={selectedConversation?.participant?.profilePicture || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs">
                                      {selectedConversation?.participant?.name?.charAt(0) || "?"}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="relative group">
                                  <div
                                    className={cn(
                                      "px-4 py-2 rounded-lg",
                                      isOwn 
                                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                                        : "bg-muted text-foreground rounded-bl-sm"
                                    )}
                                    onDoubleClick={() => setShowReactionPicker(message._id)}
                                  >
                                    {/* Conteúdo da mensagem */}
                                    {message.content && (
                                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                    )}
                                    
                                    {/* Anexos */}
                                    {message.attachments && message.attachments.length > 0 && (
                                      <div className={cn("space-y-2", message.content && "mt-2")}>
                                        {message.attachments.map((attachment: any, index: number) => (
                                          <div key={index} className="relative">
                                            {attachment.type === 'image' ? (
                                              <img 
                                                src={attachment.url} 
                                                alt={attachment.fileName || 'Imagem'}
                                                className="max-w-full max-h-48 rounded cursor-pointer"
                                                onClick={() => window.open(attachment.url, '_blank')}
                                              />
                                            ) : attachment.type === 'video' ? (
                                              <video 
                                                src={attachment.url} 
                                                controls
                                                className="max-w-full max-h-48 rounded"
                                              />
                                            ) : (
                                              <div className="flex items-center space-x-2 p-2 bg-background/10 rounded border">
                                                <FileText className="h-8 w-8 text-muted-foreground" />
                                                <div className="flex-1 min-w-0">
                                                  <p className="text-sm font-medium truncate">
                                                    {attachment.fileName || 'Arquivo'}
                                                  </p>
                                                  {attachment.fileSize && (
                                                    <p className="text-xs opacity-70">
                                                      {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                  )}
                                                </div>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => window.open(attachment.url, '_blank')}
                                                  className="h-8 w-8 p-0"
                                                >
                                                  <Upload className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-1">
                                      <p className="text-xs opacity-70">
                                        {formatMessageTime(message.createdAt)}
                                      </p>
                                      {isOwn && (
                                        <div className="ml-2">
                                          {readMessages.has(message._id) ? (
                                            <CheckCheck className="h-3 w-3 opacity-70 text-blue-500" />
                                          ) : (
                                            <Check className="h-3 w-3 opacity-50" />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Reações */}
                                  {message.reactions && message.reactions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {Object.entries(
                                        message.reactions.reduce((acc: any, reaction: any) => {
                                          if (!acc[reaction.emoji]) {
                                            acc[reaction.emoji] = { count: 0, users: [] }
                                          }
                                          acc[reaction.emoji].count += 1
                                          acc[reaction.emoji].users.push(reaction.user)
                                          return acc
                                        }, {})
                                      ).map(([emoji, data]: [string, any]) => (
                                        <button
                                          key={emoji}
                                          className="flex items-center space-x-1 px-2 py-1 bg-background border rounded-full text-xs hover:bg-accent"
                                          onClick={() => handleReaction(message._id, emoji)}
                                        >
                                          <span>{emoji}</span>
                                          <span>{data.count}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {/* Botão de reação (aparece no hover) */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                                    onClick={() => setShowReactionPicker(showReactionPicker === message._id ? null : message._id)}
                                  >
                                    <Smile className="h-3 w-3" />
                                  </Button>
                                  
                                  {/* Picker de reações */}
                                  {showReactionPicker === message._id && (
                                    <div className="absolute top-full left-0 mt-2 p-2 bg-background border rounded-lg shadow-lg z-10">
                                      <div className="flex space-x-1">
                                        {reactionEmojis.map((emoji) => (
                                          <Button
                                            key={emoji}
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-lg hover:bg-accent"
                                            onClick={() => handleReaction(message._id, emoji)}
                                          >
                                            {emoji}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      
                      {/* Indicador de digitação */}
                      {currentTypingUsers.length > 0 && (
                        <div className="flex justify-start">
                          <div className="flex items-end space-x-2 max-w-xs lg:max-w-md">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={selectedConversation?.participant?.profilePicture || "/placeholder.svg"} />
                              <AvatarFallback className="text-xs">
                                {selectedConversation?.participant?.name?.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="px-4 py-2 rounded-lg bg-muted text-foreground rounded-bl-sm">
                              <div className="flex items-center space-x-1">
                                <ClientOnly fallback={
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-current rounded-full"></div>
                                    <div className="w-2 h-2 bg-current rounded-full"></div>
                                    <div className="w-2 h-2 bg-current rounded-full"></div>
                                  </div>
                                }>
                                  <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                  </div>
                                </ClientOnly>
                                <span className="text-xs opacity-70 ml-2">
                                  {currentTypingUsers[0].name} está digitando...
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                {/* Preview do arquivo selecionado */}
                {selectedFile && (
                  <div className="mb-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {filePreview ? (
                          <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                        ) : (
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Picker de emojis */}
                {showEmojiPicker && (
                  <div className="mb-3 p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-8 gap-2">
                      {commonEmojis.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:bg-accent"
                          onClick={() => handleEmojiSelect(emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-end space-x-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mb-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    title="Anexar arquivo"
                  >
                    {isUploading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={handleTyping}
                      onKeyDown={handleKeyPress}
                      className="min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                      disabled={isUploading}
                    />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mb-2"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Emojis"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={(!newMessage.trim() && !selectedFile) || isUploading}
                    className="mb-2"
                    title="Enviar mensagem"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Indicador de digitação */}
                {currentTypingUsers.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {currentTypingUsers.length === 1 
                      ? `${currentTypingUsers[0].name} está digitando...`
                      : `${currentTypingUsers.length} pessoas estão digitando...`
                    }
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Selecione uma conversa</h3>
                <p className="text-muted-foreground">
                  Escolha uma conversa da lista para começar a conversar.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
