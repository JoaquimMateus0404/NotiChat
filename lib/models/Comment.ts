import { Schema, model, models } from 'mongoose'

export interface IComment {
  _id: string
  author: string // User ID
  post: string // Post ID
  parentComment?: string // For nested comments/replies
  content: string
  image?: string
  likes: string[] // Array of user IDs
  replies: string[] // Array of comment IDs
  mentions: string[] // Array of user IDs
  isEdited: boolean
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  post: {
    type: Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  image: String,
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date
}, {
  timestamps: true
})

// Indexes
CommentSchema.index({ post: 1, createdAt: 1 })
CommentSchema.index({ author: 1, createdAt: -1 })
CommentSchema.index({ parentComment: 1 })

export const Comment = models.Comment ?? model<IComment>('Comment', CommentSchema)
