import { Schema, model, models } from 'mongoose'

export interface IPost {
  _id: string
  author: string // User ID
  content: string
  images?: string[]
  video?: string
  document?: string
  tags: string[]
  mentions: string[] // Array of user IDs
  likes: string[] // Array of user IDs who liked
  comments: string[] // Array of comment IDs
  shares: string[] // Array of user IDs who shared
  visibility: 'public' | 'connections' | 'private'
  isEdited: boolean
  editedAt?: Date
  isPinned: boolean
  isArchived: boolean
  location?: string
  poll?: {
    question: string
    options: {
      text: string
      votes: string[] // Array of user IDs
    }[]
    endsAt?: Date
  }
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>({
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 3000
  },
  images: [{
    type: String
  }],
  video: {
    type: String
  },
  document: {
    type: String
  },
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  mentions: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  shares: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: Date,
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  location: String,
  poll: {
    question: String,
    options: [{
      text: {
        type: String,
        required: true
      },
      votes: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
    }],
    endsAt: Date
  }
}, {
  timestamps: true
})

// Indexes for better performance
PostSchema.index({ author: 1, createdAt: -1 })
PostSchema.index({ tags: 1 })
PostSchema.index({ createdAt: -1 })
PostSchema.index({ 'likes': 1 })

export const Post = models.Post ?? model<IPost>('Post', PostSchema)
