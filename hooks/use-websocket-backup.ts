"use client"

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface WebSocketMessage {
  type: 'message' | 'typing' | 'stop_typing' | 'user_online' | 'user_offline' | 'reaction' | 'user_connect' | 'user_join' | 'chat_message' | 'typing_start' | 'typing_stop' | 'custom_event'
  data: any
  conversationId?: string
  userId?: string
  username?: string
  message?: string
}

// Interface para mensagens recebidas do servidor
interface ServerMessage {
  type: 'connection_established' | 'user_joined' | 'users_online' | 'update_users' | 'new_message' | 'user_typing' | 'user_left' | 'custom_response' | 'error'
  clientId?: string
  username?: string
  message?: string
  users?: any[]
  id?: string | number
  timestamp?: string
  userId?: string
  isTyping?: boolean
  data?: any
}

interface TypingUser {
  userId: string
  username: string
  name: string
  conversationId: string
  timestamp: number
}

export function useWebSocket() {
  const { data: session } = useSession()
  const wsRef = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  
  // Callbacks que podem ser definidos pelos componentes
  const messageCallbacks = useRef<((message: any) => void)[]>([])
  const reactionCallbacks = useRef<((reaction: any) => void)[]>([])

  const connect = () => {
    if (!session?.user?.id) return

    try {
      // Em desenvolvimento, use ws://localhost:3001/ws (endpoint correto)
      // Em produção, use wss://seu-dominio.com/ws
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:3001/ws' 
        : `wss://${window.location.host}/ws`
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log('WebSocket conectado')
        
        // Enviar identificação do usuário usando o formato esperado pelo servidor
        send({
          type: 'user_join',
          username: session.user.username || session.user.name || 'Usuário',
          data: {
            userId: session.user.id,
            name: session.user.name
          }
        })
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data)
          handleMessage(message)
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error)
        }
      }

      wsRef.current.onclose = () => {
        setIsConnected(false)
        console.log('WebSocket desconectado')
        
        // Reconectar após 3 segundos
        setTimeout(() => {
          if (session?.user?.id) {
            connect()
          }
        }, 3000)
      }

      wsRef.current.onerror = (error) => {
        console.error('Erro WebSocket:', error)
      }
    } catch (error) {
      console.error('Erro ao conectar WebSocket:', error)
    }
  }

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
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
        
      case 'new_message':
        // Passar mensagem para os callbacks
        const messageData = {
          _id: message.id,
          content: message.message,
          sender: {
            _id: message.userId,
            name: message.username,
            username: message.username
          },
          conversation: message.data?.conversationId,
          createdAt: message.timestamp || new Date().toISOString(),
          attachments: message.data?.attachments || []
        }
        messageCallbacks.current.forEach(callback => callback(messageData))
        break
        
      case 'user_typing':
        if (message.userId !== session?.user?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => u.userId !== message.userId)
            return [...filtered, {
              userId: message.userId!,
              username: message.username!,
              name: message.username!,
              conversationId: 'general', // Para simplificar, usamos um canal geral
              timestamp: Date.now()
            }]
          })
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
        break
        
      case 'error':
        console.error('Erro do servidor:', message.message)
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

  useEffect(() => {
    if (session?.user?.id) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [session?.user?.id])

  return {
    isConnected,
    typingUsers,
    onlineUsers,
    sendTyping,
    sendStopTyping,
    sendMessage: sendMessage,
    sendReaction,
    onMessage,
    onReaction
  }
}
