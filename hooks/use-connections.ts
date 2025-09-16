"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface User {
  _id: string
  name: string
  username: string
  email: string
  profilePicture?: string
  title?: string
  verified?: boolean
  connections: string[]
  connectionCount: number
}

export interface ConnectionRequest {
  _id: string
  requester: User
  recipient: User
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export function useConnections() {
  const [users, setUsers] = useState<User[]>([])
  const [connections, setConnections] = useState<User[]>([])
  const [connectionRequests, setConnectionRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchSuggestedUsers = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/users?exclude=${session.user?.id}&limit=10`)
      if (!response.ok) throw new Error('Erro ao buscar usuários')
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao buscar usuários:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchConnections = async () => {
    if (!session?.user?.id) return
    
    try {
      const response = await fetch('/api/connections')
      if (!response.ok) throw new Error('Erro ao buscar conexões')
      
      const data = await response.json()
      setConnections(data.connections || [])
      setConnectionRequests(data.requests || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar conexões')
      console.error('Erro ao buscar conexões:', err)
    }
  }

  const sendConnectionRequest = async (userId: string) => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId: userId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao enviar solicitação')
      }
      
      const newRequest = await response.json()
      setConnectionRequests(prev => [...prev, newRequest])
      
      // Remove user from suggested list
      setUsers(prev => prev.filter(user => user._id !== userId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação')
      console.error('Erro ao enviar solicitação:', err)
      return false
    }
  }

  const respondToRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch(`/api/connections/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })
      
      if (!response.ok) throw new Error('Erro ao responder solicitação')
      
      const updatedRequest = await response.json()
      
      if (action === 'accept') {
        // Add to connections
        setConnections(prev => [...prev, updatedRequest.requester])
      }
      
      // Remove from pending requests
      setConnectionRequests(prev => 
        prev.filter(req => req._id !== requestId)
      )
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao responder solicitação')
      console.error('Erro ao responder solicitação:', err)
      return false
    }
  }

  const removeConnection = async (userId: string) => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch(`/api/connections/${userId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erro ao remover conexão')
      
      setConnections(prev => prev.filter(conn => conn._id !== userId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao remover conexão')
      console.error('Erro ao remover conexão:', err)
      return false
    }
  }

  useEffect(() => {
    if (session) {
      fetchSuggestedUsers()
      fetchConnections()
    }
  }, [session])

  return {
    suggestedUsers: users,
    connections,
    connectionRequests,
    loading,
    error,
    sendConnectionRequest,
    respondToRequest,
    removeConnection,
    refreshSuggestions: fetchSuggestedUsers,
    refreshConnections: fetchConnections
  }
}
