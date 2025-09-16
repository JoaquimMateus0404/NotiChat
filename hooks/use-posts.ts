"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface Post {
  _id: string
  content: string
  author: {
    _id: string
    name: string
    username: string
    profilePicture?: string
    title?: string
    verified?: boolean
  }
  image?: string
  images?: string[]
  tags?: string[]
  likes: string[] // Array de user IDs
  comments: string[] // Array de comment IDs
  shares: string[] // Array de user IDs
  visibility?: 'public' | 'connections' | 'private' | 'friends'
  isEdited?: boolean
  editedAt?: string
  isPinned?: boolean
  isArchived?: boolean
  location?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  content: string
  author: {
    _id: string
    name: string
    username: string
    profilePicture?: string
  }
  post: string
  likes: string[] // Array de user IDs
  parentComment?: string
  image?: string
  replies: string[] // Array de comment IDs
  mentions: string[] // Array de user IDs
  isEdited?: boolean
  editedAt?: string
  createdAt: string
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchPosts = async () => {
    if (!session) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/posts')
      if (!response.ok) throw new Error('Erro ao buscar posts')
      
      const data = await response.json()
      setPosts(data.posts ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao buscar posts:', err)
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (content: string, image?: string, tags?: string[]) => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, image, tags }),
      })
      
      if (!response.ok) throw new Error('Erro ao criar post')
      
      const newPost = await response.json()
      setPosts(prev => [newPost, ...prev])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar post')
      console.error('Erro ao criar post:', err)
      return false
    }
  }

  const toggleLike = async (postId: string) => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Erro ao curtir post')
      
      const updatedPost = await response.json()
      setPosts(prev => prev.map(post => 
        post._id === postId ? updatedPost : post
      ))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao curtir post')
      console.error('Erro ao curtir post:', err)
      return false
    }
  }

  const deletePost = async (postId: string) => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erro ao deletar post')
      
      setPosts(prev => prev.filter(post => post._id !== postId))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar post')
      console.error('Erro ao deletar post:', err)
      return false
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [session])

  return {
    posts,
    loading,
    error,
    createPost,
    toggleLike,
    deletePost,
    refreshPosts: fetchPosts
  }
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session } = useSession()

  const fetchComments = async () => {
    if (!session || !postId) return
    
    setLoading(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (!response.ok) throw new Error('Erro ao buscar comentários')
      
      const data = await response.json()
      setComments(data.comments ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao buscar comentários:', err)
    } finally {
      setLoading(false)
    }
  }

  const addComment = async (content: string) => {
    if (!session?.user?.id || !postId) return false
    
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })
      
      if (!response.ok) throw new Error('Erro ao adicionar comentário')
      
      const newComment = await response.json()
      setComments(prev => [...prev, newComment])
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar comentário')
      console.error('Erro ao adicionar comentário:', err)
      return false
    }
  }

  const toggleLike = async (commentId: string) => {
    if (!session?.user?.id) return false
    
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Erro ao curtir comentário')
      
      const updatedComment = await response.json()
      setComments(prev => prev.map(comment => 
        comment._id === commentId ? updatedComment : comment
      ))
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao curtir comentário')
      console.error('Erro ao curtir comentário:', err)
      return false
    }
  }

  useEffect(() => {
    fetchComments()
  }, [postId, session])

  return {
    comments,
    loading,
    error,
    addComment,
    toggleLike,
    refreshComments: fetchComments
  }
}
