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
import { Send, Search, MoreVertical, Phone, Video, Info, Smile, Paperclip, MessageCircle, Plus, X, Upload, Image as ImageIcon, FileText, Check, CheckCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useConversations, useMessages, type Conversation } from "@/hooks/use-chat"
import { useSession } from "next-auth/react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function ChatInterface() {
  const { data: session } = useSession()
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { conversations, loading: conversationsLoading } = useConversations()
  const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedConversation?._id || null)

  // Lista de emojis comuns
  const commonEmojis = ['😀', '😂', '😍', '🥰', '😊', '😎', '🤔', '😢', '😮', '👍', '👎', '❤️', '🔥', '🎉', '👏', '🙏']

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
    const messageDate = new Date(date)
    const now = new Date()
    const isToday = messageDate.toDateString() === now.toDateString()
    
    if (isToday) {
      return messageDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return messageDate.toLocaleDateString('pt-BR', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Selecionar primeira conversa automaticamente se não houver uma selecionada
    if (conversations.length > 0 && !selectedConversation) {
      setSelectedConversation(conversations[0])
    }
  }, [conversations, selectedConversation])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return
    
    let fileUrl = null
    
    // Upload do arquivo se houver um selecionado
    if (selectedFile) {
      fileUrl = await uploadFile(selectedFile)
      if (!fileUrl) {
        alert('Erro ao fazer upload do arquivo')
        return
      }
    }
    
    const messageContent = newMessage.trim()
    const success = await sendMessage(messageContent)
    
    if (success) {
      setNewMessage("")
      handleRemoveFile()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

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
    <div className="h-[calc(100vh-4rem)] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Left Sidebar - Chat List */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Conversas</h2>
                <div className="flex items-center space-x-1">
                  <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" title="Nova conversa">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
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
                          />
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Em breve: busca de usuários para iniciar conversas
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
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
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation._id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                          selectedConversation?._id === conversation._id 
                            ? "bg-accent/10 border border-accent/20" 
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={conversation.participant.profilePicture || "/placeholder.svg"} />
                            <AvatarFallback>
                              {conversation.participant.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          {/* Indicador de status online */}
                          <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-foreground truncate">
                              {conversation.participant.name}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {conversation.lastMessage 
                                ? new Date(conversation.updatedAt).toLocaleTimeString('pt-BR', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : ''
                              }
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            @{conversation.participant.username}
                          </p>
                          {conversation.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Chat Window */}
        <div className="lg:col-span-3">
          {selectedConversation ? (
            <Card className="h-full flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={selectedConversation.participant.profilePicture || "/placeholder.svg"} />
                        <AvatarFallback>
                          {selectedConversation.participant.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{selectedConversation.participant.name}</h3>
                      <p className="text-sm text-muted-foreground">@{selectedConversation.participant.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages Area */}
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-full">
                  {messagesLoading ? (
                    <div className="p-4 text-center text-muted-foreground">
                      Carregando mensagens...
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
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
                                    <AvatarImage src={selectedConversation.participant.profilePicture || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs">
                                      {selectedConversation.participant.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div
                                  className={cn(
                                    "px-4 py-2 rounded-lg",
                                    isOwn 
                                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                                      : "bg-muted text-foreground rounded-bl-sm"
                                  )}
                                >
                                  {/* Conteúdo da mensagem */}
                                  {message.content && (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  )}
                                  
                                  {/* Preview de imagem se houver */}
                                  {message.fileUrl && message.fileType?.startsWith('image/') && (
                                    <div className="mt-2">
                                      <img 
                                        src={message.fileUrl} 
                                        alt="Imagem compartilhada"
                                        className="max-w-full h-auto rounded cursor-pointer hover:opacity-90"
                                        onClick={() => window.open(message.fileUrl, '_blank')}
                                      />
                                    </div>
                                  )}
                                  
                                  {/* Arquivo não-imagem */}
                                  {message.fileUrl && !message.fileType?.startsWith('image/') && (
                                    <div className="mt-2 flex items-center space-x-2 p-2 bg-background/10 rounded">
                                      <FileText className="h-4 w-4" />
                                      <a 
                                        href={message.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-sm underline hover:no-underline"
                                      >
                                        Abrir arquivo
                                      </a>
                                    </div>
                                  )}
                                  
                                  <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs opacity-70">
                                      {formatMessageTime(message.createdAt)}
                                    </p>
                                    {isOwn && (
                                      <div className="ml-2">
                                        {message.readBy?.includes(selectedConversation.participant._id) ? (
                                          <CheckCheck className="h-3 w-3 text-blue-400" />
                                        ) : (
                                          <Check className="h-3 w-3 opacity-50" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t border-border">
                <div className="flex items-end space-x-2">
                  <Button variant="ghost" size="sm" className="mb-2">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      className="min-h-[40px] max-h-[120px] resize-none"
                      rows={1}
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="mb-2">
                    <Smile className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim()}
                    className="mb-2"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
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
  )
}
