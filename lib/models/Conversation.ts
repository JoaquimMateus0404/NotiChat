import { Schema, model, models } from 'mongoose'

export interface IConversation {
  _id: string
  participants: string[] // Array of user IDs
  isGroup: boolean
  groupName?: string
  groupAvatar?: string
  groupDescription?: string
  admins: string[] // Array of user IDs (for groups)
  lastMessage?: string // Message ID
  lastActivity: Date
  unreadCounts: Map<string, number> // userId -> unread count
  isArchived: Map<string, boolean> // userId -> archived status
  isPinned: Map<string, boolean> // userId -> pinned status
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: String,
  groupAvatar: String,
  groupDescription: String,
  admins: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  },
  isArchived: {
    type: Map,
    of: Boolean,
    default: {}
  },
  isPinned: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, {
  timestamps: true
})

// Indexes
ConversationSchema.index({ participants: 1 })
ConversationSchema.index({ lastActivity: -1 })

export const Conversation = models.Conversation ?? model<IConversation>('Conversation', ConversationSchema)
