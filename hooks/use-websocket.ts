"use client"

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

// Tipos de mensagem que enviamos para o servidor
interface WebSocketMessage {
  type: 'message' | 'typing' | 'stop_typing' | 'user_online' | 'user_offline' | 'reaction' | 'user_connect' | 'user_join' | 'chat_message' | 'typing_start' | 'typing_stop' | 'custom_event' | 'message_read' | 'call_initiate' | 'call_accept' | 'call_reject' | 'call_end'
  data: any
  conversationId?: string
  userId?: string
  username?: string
  message?: string
  callType?: 'voice' | 'video'
}

// Interface para mensagens recebidas do servidor
interface ServerMessage {
  type: 'connection_established' | 'user_joined' | 'users_online' | 'update_users' | 'new_message' | 'user_typing' | 'user_left' | 'custom_response' | 'error' | 'message_read' | 'call_incoming' | 'call_accepted' | 'call_rejected' | 'call_ended' | 'pong'
  clientId?: string
  username?: string
  message?: string
  users?: any[]
  id?: string | number
  timestamp?: string
  userId?: string
  isTyping?: boolean
  data?: any
  conversationId?: string
  callType?: 'voice' | 'video'
  callId?: string
}

interface TypingUser {
  userId: string
  username: string
  name: string
  conversationId: string
  timestamp: number
}

interface IncomingCall {
  callId: string
  callType: 'voice' | 'video'
  fromUserId: string
  fromUserName: string
  fromUserAvatar?: string
  conversationId: string
  timestamp: number
}

export function useWebSocket() {
  const { data: session } = useSession()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  
  // Refs para controlar reconexão
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const isConnectingRef = useRef(false)
  const shouldConnectRef = useRef(false)
  
  // Callbacks que podem ser definidos pelos componentes
  const messageCallbacks = useRef<((message: any) => void)[]>([])
  const reactionCallbacks = useRef<((reaction: any) => void)[]>([])
  const messageReadCallbacks = useRef<((data: any) => void)[]>([])
  const callCallbacks = useRef<((call: any) => void)[]>([])
  const callEndCallbacks = useRef<((data: any) => void)[]>([])

  const HEARTBEAT_INTERVAL = 25000 // 25s (Render costuma fechar conexões ociosas em 30s)

  const connect = () => {
    if (!session?.user?.id || !shouldConnectRef.current) {
      console.log('❌ Não é possível conectar: usuário não logado ou não deve conectar')
      return
    }

    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('⚠️ Já existe uma conexão ativa ou em progresso')
      return
    }

    // Limpar timeouts anteriores
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }

    try {
      isConnectingRef.current = true
      const wsUrl = 'wss://socket-io-qhs6.onrender.com/ws'
      console.log('🔌 Conectando ao WebSocket:', wsUrl)
      
      // Fechar conexão anterior se existir
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onopen = () => {
        isConnectingRef.current = false
        setIsConnected(true)
        console.log('✅ WebSocket conectado ao servidor:', wsUrl)

        // Enviar identificação do usuário
        const userJoinMessage = {
          type: 'user_join' as const,
          username: session.user.username || session.user.name || 'Usuário',
          data: {
            userId: session.user.id,
            name: session.user.name,
            username: session.user.username
          }
        }
        console.log('📤 Enviando identificação do usuário:', userJoinMessage)
        send(userJoinMessage)

        // Iniciar heartbeat
        heartbeatRef.current = setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'ping' }))
            console.log('💓 Enviado ping para manter conexão viva')
          }
        }, HEARTBEAT_INTERVAL)
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data)

          if (message.type === 'pong') {
            console.log('💓 Pong recebido do servidor')
            return
          }

          handleMessage(message)
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error)
        }
      }

      wsRef.current.onclose = (event) => {
        isConnectingRef.current = false
        setIsConnected(false)
        console.log('❌ WebSocket desconectado do servidor. Código:', event.code, 'Razão:', event.reason)

        // Limpar heartbeat
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current)
          heartbeatRef.current = null
        }

        // Reconectar apenas se devemos estar conectados e não foi um fechamento intencional
        if (shouldConnectRef.current && event.code !== 1000) {
          console.log('🔄 Tentando reconectar em 3 segundos...')
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldConnectRef.current) {
              connect()
            }
          }, 3000)
        }
      }

      wsRef.current.onerror = (error) => {
        isConnectingRef.current = false
        console.error('❌ Erro WebSocket:', error)
        setIsConnected(false)
      }
    } catch (error) {
      isConnectingRef.current = false
      console.error('Erro ao conectar WebSocket:', error)
    }
  }


  const disconnect = () => {
    console.log('🔌 Desconectando WebSocket...')
    shouldConnectRef.current = false
    isConnectingRef.current = false

    // Limpar timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current)
      heartbeatRef.current = null
    }

    // Fechar conexão
    if (wsRef.current) {
      wsRef.current.close(1000, 'Disconnecting intentionally')
      wsRef.current = null
    }
    
    setIsConnected(false)
  }

  const send = (message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  const handleMessage = (message: ServerMessage) => {
    console.log('Mensagem recebida do servidor:', message)
    
    switch (message.type) {
      case 'connection_established':
        console.log('Conexão estabelecida:', message.clientId)
        break
        
      case 'user_joined':
        console.log('Usuário entrou:', message.username)
        break
        
      case 'users_online':
      case 'update_users':
        if (message.users) {
          const userIds = message.users.map(user => user.userId || user.id).filter(Boolean)
          setOnlineUsers(new Set(userIds))
        }
        break
        
      case 'new_message': {
        // Passar mensagem para os callbacks
        const messageData = {
          _id: message.data?._id || message.id,
          content: message.data?.content || message.message,
          sender: {
            _id: message.data?.sender?._id || message.userId,
            name: message.data?.sender?.name || message.username,
            username: message.data?.sender?.username || message.username
          },
          conversation: message.data?.conversationId || message.data?.conversation,
          createdAt: message.data?.createdAt || message.timestamp || new Date().toISOString(),
          attachments: message.data?.attachments || []
        }
        messageCallbacks.current.forEach(callback => callback(messageData))
        break
      }
        
      case 'user_typing':
        if (message.userId !== session?.user?.id) {
          if (message.isTyping) {
            setTypingUsers(prev => {
              const filtered = prev.filter(u => u.userId !== message.userId)
              return [...filtered, {
                userId: message.userId!,
                username: message.username!,
                name: message.username!,
                conversationId: message.conversationId || 'general',
                timestamp: Date.now()
              }]
            })
          } else {
            setTypingUsers(prev => prev.filter(u => u.userId !== message.userId))
          }
        }
        break
        
      case 'user_left':
        console.log('Usuário saiu:', message.username)
        if (message.userId) {
          setOnlineUsers(prev => {
            const newSet = new Set(prev)
            newSet.delete(message.userId!)
            return newSet
          })
          
          // Remover da lista de digitando
          setTypingUsers(prev => prev.filter(u => u.userId !== message.userId))
        }
        break
        
      case 'custom_response':
        // Tratamento para respostas customizadas do servidor
        console.log('Resposta customizada:', message.data)
        if (message.data?.event === 'reaction') {
          reactionCallbacks.current.forEach(callback => callback(message.data))
        }
        break
        
      case 'error':
        console.error('Erro do servidor:', message.message)
        break
        
      case 'message_read':
        // Notificar que uma mensagem foi lida
        console.log('Mensagem lida:', message.data)
        messageReadCallbacks.current.forEach(callback => callback(message.data))
        break
        
      case 'call_incoming':
        // Chamada recebida
        console.log('Chamada recebida:', message)
        if (message.data && message.data.callerId !== session?.user?.id) {
          const incomingCallData: IncomingCall = {
            callId: message.data.callId || Date.now().toString(),
            callType: message.data.callType || 'voice',
            fromUserId: message.data.callerId || '',
            fromUserName: message.data.callerName || message.data.callerUsername || 'Usuário',
            fromUserAvatar: message.data.avatar,
            conversationId: message.data.conversationId || '',
            timestamp: Date.now()
          }
          setIncomingCall(incomingCallData)
          callCallbacks.current.forEach(callback => callback(incomingCallData))
        }
        break
        
      case 'call_accepted':
        // Chamada aceita
        console.log('Chamada aceita:', message.data)
        callCallbacks.current.forEach(callback => callback({
          type: 'accepted',
          data: message.data
        }))
        break
        
      case 'call_rejected':
        // Chamada rejeitada
        console.log('Chamada rejeitada:', message.data)
        callCallbacks.current.forEach(callback => callback({
          type: 'rejected',
          data: message.data
        }))
        break
        
      case 'call_ended':
        // Chamada encerrada
        console.log('Chamada encerrada:', message.data)
        setIncomingCall(null)
        callEndCallbacks.current.forEach(callback => callback(message.data))
        break
    }
  }

  // Função para enviar indicador de digitação
  const sendTyping = (conversationId: string) => {
    send({
      type: 'typing_start',
      conversationId,
      username: session?.user?.username || session?.user?.name || 'Usuário',
      data: {
        userId: session?.user?.id,
        username: session?.user?.username,
        name: session?.user?.name
      }
    })
  }

  // Função para parar indicador de digitação
  const sendStopTyping = (conversationId: string) => {
    send({
      type: 'typing_stop',
      conversationId,
      username: session?.user?.username || session?.user?.name || 'Usuário',
      data: {
        userId: session?.user?.id
      }
    })
  }

  // Função para enviar nova mensagem via WebSocket
  const sendMessage = (conversationId: string, message: any) => {
    send({
      type: 'chat_message',
      conversationId,
      username: session?.user?.username || session?.user?.name || 'Usuário',
      message: message.content || message.message,
      data: message
    })
  }

  // Função para enviar reação
  const sendReaction = (messageId: string, conversationId: string, emoji: string) => {
    send({
      type: 'custom_event',
      conversationId,
      username: session?.user?.username || session?.user?.name || 'Usuário',
      data: {
        event: 'reaction',
        messageId,
        emoji,
        userId: session?.user?.id,
        username: session?.user?.username,
        name: session?.user?.name
      }
    })
  }

  // Função para marcar mensagem como lida
  const markMessageAsRead = (messageId: string, conversationId: string) => {
    send({
      type: 'message_read',
      data: {
        messageId,
        conversationId,
        userId: session?.user?.id
      }
    })
  }

  // Função para iniciar chamada
  const initiateCall = (conversationId: string, callType: 'voice' | 'video', targetUserId: string) => {
    const callId = Date.now().toString()
    const callMessage: WebSocketMessage = {
      type: 'call_initiate',
      conversationId,
      callType,
      username: session?.user?.username || session?.user?.name || 'Usuário',
      data: {
        callId,
        callType,
        targetUserId,
        conversationId,
        fromUserId: session?.user?.id,
        avatar: session?.user?.profilePicture
      }
    }
    console.log('📞 Iniciando chamada:', callMessage)
    send(callMessage)
    return callId
  }

  // Função para aceitar chamada
  const acceptCall = (callId: string, callerId: string) => {
    const acceptMessage: WebSocketMessage = {
      type: 'call_accept',
      username: session?.user?.username || session?.user?.name || 'Usuário',
      data: {
        callId,
        callerId,
        userId: session?.user?.id
      }
    }
    console.log('✅ Aceitando chamada:', acceptMessage)
    send(acceptMessage)
    setIncomingCall(null)
  }

  // Função para rejeitar chamada
  const rejectCall = (callId: string, callerId: string) => {
    send({
      type: 'call_reject',
      username: session?.user?.username || session?.user?.name || 'Usuário',
      data: {
        callId,
        callerId,
        userId: session?.user?.id
      }
    })
    setIncomingCall(null)
  }

  // Função para encerrar chamada
  const endCall = (callId: string, otherUserId: string) => {
    send({
      type: 'call_end',
      username: session?.user?.username || session?.user?.name || 'Usuário',
      data: {
        callId,
        otherUserId,
        userId: session?.user?.id
      }
    })
  }

  // Função para subscrever a mensagens
  const onMessage = (callback: (message: any) => void) => {
    messageCallbacks.current.push(callback)
    return () => {
      messageCallbacks.current = messageCallbacks.current.filter(cb => cb !== callback)
    }
  }

  // Função para subscrever a reações
  const onReaction = (callback: (reaction: any) => void) => {
    reactionCallbacks.current.push(callback)
    return () => {
      reactionCallbacks.current = reactionCallbacks.current.filter(cb => cb !== callback)
    }
  }

  // Função para subscrever a eventos de leitura de mensagem
  const onMessageRead = (callback: (data: any) => void) => {
    messageReadCallbacks.current.push(callback)
    return () => {
      messageReadCallbacks.current = messageReadCallbacks.current.filter(cb => cb !== callback)
    }
  }

  // Função para subscrever a eventos de chamada
  const onCall = (callback: (call: any) => void) => {
    callCallbacks.current.push(callback)
    return () => {
      callCallbacks.current = callCallbacks.current.filter(cb => cb !== callback)
    }
  }

  // Função para subscrever a eventos de fim de chamada
  const onCallEnd = (callback: (data: any) => void) => {
    callEndCallbacks.current.push(callback)
    return () => {
      callEndCallbacks.current = callEndCallbacks.current.filter(cb => cb !== callback)
    }
  }

  // Limpar usuários digitando antigos (mais de 10 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setTypingUsers(prev => 
        prev.filter(user => now - user.timestamp < 10000)
      )
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // UseEffect principal para gerenciar conexão
  useEffect(() => {
    console.log('🔄 Session changed:', !!session?.user?.id)
    
    if (session?.user?.id) {
      shouldConnectRef.current = true
      connect()
    } else {
      shouldConnectRef.current = false
      disconnect()
    }

    return () => {
      console.log('🧹 Cleanup: desconectando WebSocket')
      disconnect()
    }
  }, [session?.user?.id])

  return {
    isConnected,
    typingUsers,
    onlineUsers,
    incomingCall,
    send,
    sendTyping,
    sendStopTyping,
    sendMessage,
    sendReaction,
    onMessage,
    onReaction,
    onMessageRead,
    onCall,
    onCallEnd,
    markMessageAsRead,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall
  }
}
