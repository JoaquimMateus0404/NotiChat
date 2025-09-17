"use client"

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'

interface WebSocketMessage {
  type: 'message' | 'typing' | 'stop_typing' | 'user_online' | 'user_offline' | 'reaction' | 'user_connect'
  data: any
  conversationId?: string
  userId?: string
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
      // Em desenvolvimento, use ws://localhost:3001
      // Em produção, use wss://seu-dominio.com
      const wsUrl = process.env.NODE_ENV === 'development' 
        ? 'ws://localhost:3001' 
        : `wss://${window.location.host}`
      
      wsRef.current = new WebSocket(wsUrl)
      
      wsRef.current.onopen = () => {
        setIsConnected(true)
        console.log('WebSocket conectado')
        
        // Enviar identificação do usuário
        send({
          type: 'user_connect',
          data: {
            userId: session.user.id,
            username: session.user.username,
            name: session.user.name
          }
        })
      }

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
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

  const handleMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'message':
        messageCallbacks.current.forEach(callback => callback(message.data))
        break
        
      case 'typing':
        if (message.data.userId !== session?.user?.id) {
          setTypingUsers(prev => {
            const filtered = prev.filter(u => 
              u.userId !== message.data.userId || 
              u.conversationId !== message.conversationId
            )
            return [...filtered, {
              ...message.data,
              conversationId: message.conversationId!,
              timestamp: Date.now()
            }]
          })
        }
        break
        
      case 'stop_typing':
        setTypingUsers(prev => 
          prev.filter(u => 
            u.userId !== message.data.userId || 
            u.conversationId !== message.conversationId
          )
        )
        break
        
      case 'user_online':
        setOnlineUsers(prev => new Set([...prev, message.data.userId]))
        break
        
      case 'user_offline':
        setOnlineUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(message.data.userId)
          return newSet
        })
        break
        
      case 'reaction':
        reactionCallbacks.current.forEach(callback => callback(message.data))
        break
    }
  }

  // Função para enviar indicador de digitação
  const sendTyping = (conversationId: string) => {
    send({
      type: 'typing',
      conversationId,
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
      type: 'stop_typing',
      conversationId,
      data: {
        userId: session?.user?.id
      }
    })
  }

  // Função para enviar nova mensagem via WebSocket
  const sendMessage = (conversationId: string, message: any) => {
    send({
      type: 'message',
      conversationId,
      data: message
    })
  }

  // Função para enviar reação
  const sendReaction = (messageId: string, conversationId: string, emoji: string) => {
    send({
      type: 'reaction',
      conversationId,
      data: {
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
