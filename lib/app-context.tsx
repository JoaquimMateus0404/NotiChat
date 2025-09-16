"use client"

import React, { createContext, useContext, useReducer, ReactNode, useMemo } from 'react'
import { Post, User, Message, ChatUser } from '@/lib/sample-data'

// Types
interface AppState {
  currentUser: User | null
  posts: Post[]
  chatUsers: ChatUser[]
  messages: { [userId: string]: Message[] }
  notifications: Notification[]
  connections: User[]
}

interface Notification {
  id: string
  type: 'like' | 'comment' | 'connection' | 'message' | 'mention'
  message: string
  time: string
  read: boolean
  userId?: string
  postId?: string
}

type AppAction =
  | { type: 'SET_CURRENT_USER'; payload: User }
  | { type: 'ADD_POST'; payload: Post }
  | { type: 'UPDATE_POST'; payload: { id: number; updates: Partial<Post> } }
  | { type: 'TOGGLE_LIKE'; payload: { postId: number; userId: string } }
  | { type: 'ADD_COMMENT'; payload: { postId: number; comment: any } }
  | { type: 'ADD_MESSAGE'; payload: { userId: string; message: Message } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'ADD_CONNECTION'; payload: User }
  | { type: 'REMOVE_CONNECTION'; payload: string }

// Initial state
const initialState: AppState = {
  currentUser: {
    id: 'current-user',
    name: 'João Silva',
    title: 'Full Stack Developer',
    company: 'Tech Solutions',
    avatar: '/professional-man-smiling.png',
    verified: true,
    location: 'São Paulo, Brasil',
    bio: 'Desenvolvedor Full Stack apaixonado por tecnologia e inovação. Especialista em React, Node.js e TypeScript.',
    connections: 127,
    followers: 89,
    following: 156
  },
  posts: [],
  chatUsers: [],
  messages: {},
  notifications: [
    {
      id: 'welcome-1',
      type: 'connection',
      message: 'Bem-vindo ao NotiChat! Explore e conecte-se com profissionais.',
      time: 'Agora',
      read: false
    }
  ],
  connections: []
}

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload }
    
    case 'ADD_POST':
      return { ...state, posts: [action.payload, ...state.posts] }
    
    case 'UPDATE_POST':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.id
            ? { ...post, ...action.payload.updates }
            : post
        )
      }
    
    case 'TOGGLE_LIKE':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? { ...post, likes: post.likes + 1 }
            : post
        )
      }
    
    case 'ADD_COMMENT':
      return {
        ...state,
        posts: state.posts.map(post =>
          post.id === action.payload.postId
            ? { ...post, comments: post.comments + 1 }
            : post
        )
      }
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.userId]: [
            ...(state.messages[action.payload.userId] || []),
            action.payload.message
          ]
        }
      }
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      }
    
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      }
    
    case 'ADD_CONNECTION':
      return {
        ...state,
        connections: [...state.connections, action.payload]
      }
    
    case 'REMOVE_CONNECTION':
      return {
        ...state,
        connections: state.connections.filter(conn => conn.id !== action.payload)
      }
    
    default:
      return state
  }
}

// Context
const AppContext = createContext<{
  state: AppState
  dispatch: React.Dispatch<AppAction>
} | undefined>(undefined)

// Provider
export function AppProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch])

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  )
}

// Hook
export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}

// Helper hooks
export function useCurrentUser() {
  const { state } = useApp()
  return state.currentUser
}

export function usePosts() {
  const { state, dispatch } = useApp()
  
  const addPost = (content: string, image?: string) => {
    if (!state.currentUser) return
    
    const newPost: Post = {
      id: Date.now(),
      author: state.currentUser,
      content,
      timestamp: new Date().toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      image,
      tags: []
    }
    
    dispatch({ type: 'ADD_POST', payload: newPost })
  }
  
  const toggleLike = (postId: number) => {
    if (!state.currentUser) return
    dispatch({ type: 'TOGGLE_LIKE', payload: { postId, userId: state.currentUser.id.toString() } })
  }
  
  const addComment = (postId: number, content: string) => {
    if (!state.currentUser) return
    dispatch({ type: 'ADD_COMMENT', payload: { postId, comment: { content, author: state.currentUser } } })
  }
  
  return {
    posts: state.posts,
    addPost,
    toggleLike,
    addComment
  }
}

export function useNotifications() {
  const { state, dispatch } = useApp()
  
  const addNotification = (notification: Omit<Notification, 'id'>) => {
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { ...notification, id: Date.now().toString() }
    })
  }
  
  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_NOTIFICATION_READ', payload: id })
  }
  
  return {
    notifications: state.notifications,
    unreadCount: state.notifications.filter(n => !n.read).length,
    addNotification,
    markAsRead
  }
}

export function useConnections() {
  const { state, dispatch } = useApp()
  
  const addConnection = (user: User) => {
    dispatch({ type: 'ADD_CONNECTION', payload: user })
  }
  
  const removeConnection = (userId: string) => {
    dispatch({ type: 'REMOVE_CONNECTION', payload: userId })
  }
  
  return {
    connections: state.connections,
    addConnection,
    removeConnection
  }
}
