"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface User {
  _id: string
  name: string
  username: string
  email: string
  profilePicture?: string
  verified?: boolean
  title?: string
}

export function useUserSearch() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchUsers = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setUsers([])
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`)
      if (!response.ok) {
        throw new Error('Erro ao buscar usuários')
      }
      
      const data = await response.json()
      
      // Filtrar o próprio usuário dos resultados
      const filteredUsers = data.users.filter((user: User) => user._id !== session?.user?.id)
      setUsers(filteredUsers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const startConversation = async (userId: string) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          participantId: userId
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao iniciar conversa')
      }

      const conversation = await response.json()
      return conversation
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error)
      throw error
    }
  }

  const clearResults = () => {
    setUsers([])
    setError(null)
  }

  return {
    users,
    loading,
    error,
    searchUsers,
    startConversation,
    clearResults
  }
}
