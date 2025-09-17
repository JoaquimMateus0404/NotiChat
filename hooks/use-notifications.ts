"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  tag?: string
  requireInteraction?: boolean
}

export function useNotifications() {
  const { data: session } = useSession()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Verificar se o browser suporta notificações
    setIsSupported('Notification' in window)
    
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Notificações não são suportadas neste navegador')
      return 'denied'
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    } catch (error) {
      console.warn('Erro ao solicitar permissão para notificações:', error)
      setPermission('denied')
      return 'denied'
    }
  }

  const showNotification = (options: NotificationOptions) => {
    if (!isSupported) {
      console.log('Notificação ignorada - navegador não suporta:', options.title)
      return null
    }
    
    if (permission !== 'granted') {
      console.log('Notificação ignorada - permissão não concedida:', options.title)
      return null
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: false
      })

      // Auto-fechar após 5 segundos se não for requireInteraction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      return notification
    } catch (error) {
      console.warn('Erro ao mostrar notificação:', error)
      return null
    }
  }

  const notifyNewMessage = (senderName: string, message: string, conversationId: string) => {
    return showNotification({
      title: `Nova mensagem de ${senderName}`,
      body: message.length > 50 ? message.substring(0, 50) + '...' : message,
      tag: `message-${conversationId}`,
      requireInteraction: false
    })
  }

  const notifyNewConnection = (senderName: string) => {
    return showNotification({
      title: 'Nova solicitação de conexão',
      body: `${senderName} quer se conectar com você`,
      tag: 'connection-request',
      requireInteraction: true
    })
  }

  const notifyNewReaction = (senderName: string, emoji: string) => {
    return showNotification({
      title: 'Nova reação',
      body: `${senderName} reagiu com ${emoji}`,
      tag: 'reaction',
      requireInteraction: false
    })
  }

  // Service Worker para notificações em background (quando a aba não está ativa)
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registrado:', registration)
        return registration
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error)
      }
    }
  }

  useEffect(() => {
    registerServiceWorker()
  }, [])

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    notifyNewMessage,
    notifyNewConnection,
    notifyNewReaction
  }
}
