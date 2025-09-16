// This file ensures all models are registered in the correct order
// Import this file in any API route that uses models with references

import '@/lib/models/User'
import '@/lib/models/Comment'
import '@/lib/models/Post'
import '@/lib/models/ConnectionRequest'
import '@/lib/models/Notification'
import '@/lib/models/Conversation'
import '@/lib/models/Message'

export * from '@/lib/models/User'
export * from '@/lib/models/Comment'
export * from '@/lib/models/Post'
export * from '@/lib/models/ConnectionRequest'
export * from '@/lib/models/Notification'
export * from '@/lib/models/Conversation'
export * from '@/lib/models/Message'
