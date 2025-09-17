"use client"

import { useState, useEffect, useCallback } from 'react'

interface Message {
  _id: string
  content: string
  sender: {
    _id: string
    name: string
    username: string
    profilePicture?: string
  }
  conversation: string
  createdAt: string
  reactions?: Array<{
    emoji: string
    user: string
    createdAt: string
  }>
  readBy?: string[]
}

interface PaginatedMessages {
  messages: Message[]
  hasMore: boolean
  totalCount: number
  currentPage: number
}

export function useMessagesPagination(conversationId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const MESSAGES_PER_PAGE = 20

  const fetchMessages = async (page: number = 1, append: boolean = false) => {
    if (!conversationId) return

    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      setError(null)

      const response = await fetch(
        `/api/conversations/${conversationId}/messages?page=${page}&limit=${MESSAGES_PER_PAGE}&sort=desc`
      )

      if (!response.ok) {
        throw new Error('Erro ao carregar mensagens')
      }

      const data: PaginatedMessages = await response.json()

      if (append && page > 1) {
        // Adicionar mensagens antigas no início da lista
        setMessages(prev => [...data.messages.reverse(), ...prev])
      } else {
        // Primeira carga ou refresh - mensagens mais recentes primeiro
        setMessages(data.messages.reverse())
      }

      setHasMore(data.hasMore)
      setTotalCount(data.totalCount)
      setCurentPage(page)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreMessages = () => {
    if (hasMore && !loadingMore) {
      fetchMessages(currentPage + 1, true)
    }
  }

  const addNewMessage = (message: Message) => {
    setMessages(prev => [...prev, message])
    setTotalCount(prev => prev + 1)
  }

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev =>
      prev.map(msg =>
        msg._id === messageId ? { ...msg, ...updates } : msg
      )
    )
  }

  const addReaction = (messageId: string, reaction: { emoji: string; user: string; createdAt: string }) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg._id === messageId) {
          const reactions = msg.reactions || []
          
          // Remover reação anterior do mesmo usuário com o mesmo emoji
          const filteredReactions = reactions.filter(r => 
            !(r.user === reaction.user && r.emoji === reaction.emoji)
          )
          
          return {
            ...msg,
            reactions: [...filteredReactions, reaction]
          }
        }
        return msg
      })
    )
  }

  const removeReaction = (messageId: string, emoji: string, userId: string) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg._id === messageId) {
          const reactions = msg.reactions || []
          return {
            ...msg,
            reactions: reactions.filter(r => 
              !(r.user === userId && r.emoji === emoji)
            )
          }
        }
        return msg
      })
    )
  }

  const markAsRead = (messageIds: string[]) => {
    setMessages(prev =>
      prev.map(msg => {
        if (messageIds.includes(msg._id)) {
          const readBy = msg.readBy || []
          return {
            ...msg,
            readBy: [...new Set([...readBy, 'current-user-id'])] // Aqui você pegaria o ID do usuário atual
          }
        }
        return msg
      })
    )
  }

  const resetMessages = () => {
    setMessages([])
    setHasMore(true)
    setCurentPage(1)
    setTotalCount(0)
    setError(null)
  }

  // Carregar mensagens quando a conversa mudar
  useEffect(() => {
    if (conversationId) {
      resetMessages()
      fetchMessages(1)
    } else {
      resetMessages()
    }
  }, [conversationId])

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    totalCount,
    currentPage,
    error,
    fetchMessages,
    loadMoreMessages,
    addNewMessage,
    updateMessage,
    addReaction,
    removeReaction,
    markAsRead,
    resetMessages
  }
}
