import { Schema, model, models } from 'mongoose'

export interface IMessage {
  _id: string
  conversation: string // Conversation ID
  sender: string // User ID
  content: string
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system'
  attachments?: {
    type: 'image' | 'video' | 'audio' | 'file'
    url: string
    fileName?: string
    fileSize?: number
    thumbnail?: string
  }[]
  replyTo?: string // Message ID
  mentions: string[] // Array of user IDs
  reactions: Map<string, string[]> // emoji -> array of user IDs
  readBy: Map<string, Date> // userId -> read timestamp
  deliveredTo: string[] // Array of user IDs
  isEdited: boolean
  editedAt?: Date
  deletedFor: string[] // Array of user IDs (for delete for me/everyone)
  isSystemMessage: boolean
  systemMessageType?: 'user_joined' | 'user_left' | 'group_created' | 'group_renamed' | 'admin_added' | 'admin_removed'
  createdAt: Date
  updatedAt: Date
}

const MessageSchema = new Schema<IMessage>({
  conversation: {
    type: Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file']
    },
    url: {
      type: String,
      required: true
    },
    fileName: String,
    fileSize: Number,
    thumbnail: String
  }],
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  reactions: {
    type: Map,
    of: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    default: {}
  },
  readBy: {
    type: Map,
    of: Date,
    default: {}
  },
  deliveredTo: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  deletedFor: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isSystemMessage: {
    type: Boolean,
    default: false
  },
  systemMessageType: {
    type: String,
    enum: ['user_joined', 'user_left', 'group_created', 'group_renamed', 'admin_added', 'admin_removed']
  }
}, {
  timestamps: true
})

// Indexes
MessageSchema.index({ conversation: 1, createdAt: -1 })
MessageSchema.index({ sender: 1, createdAt: -1 })

export const Message = models.Message ?? model<IMessage>('Message', MessageSchema)
