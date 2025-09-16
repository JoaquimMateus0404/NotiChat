import { Schema, model, models } from 'mongoose'

export interface INotification {
  _id: string
  recipient: string // User ID
  sender: string // User ID
  type: 'like' | 'comment' | 'connection_request' | 'connection_accepted' | 'mention' | 'follow' | 'message' | 'post_share' | 'birthday' | 'job_alert'
  title: string
  message: string
  data?: {
    postId?: string
    commentId?: string
    conversationId?: string
    messageId?: string
    connectionRequestId?: string
    url?: string
  }
  isRead: boolean
  readAt?: Date
  actionTaken: boolean // For connection requests, etc.
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'connection_request', 'connection_accepted', 'mention', 'follow', 'message', 'post_share', 'birthday', 'job_alert'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post'
    },
    commentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment'
    },
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    connectionRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ConnectionRequest'
    },
    url: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  actionTaken: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Indexes
NotificationSchema.index({ recipient: 1, createdAt: -1 })
NotificationSchema.index({ recipient: 1, isRead: 1 })

export const Notification = models.Notification ?? model<INotification>('Notification', NotificationSchema)
