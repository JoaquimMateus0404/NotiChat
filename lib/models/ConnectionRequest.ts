import { Schema, model, models } from 'mongoose'

export interface IConnectionRequest {
  _id: string
  requester: string // User ID who sent the request
  recipient: string // User ID who received the request
  message?: string // Optional message with the request
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  respondedAt?: Date
}

const ConnectionRequestSchema = new Schema<IConnectionRequest>({
  requester: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    maxlength: 300
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  respondedAt: Date
}, {
  timestamps: true
})

// Indexes
ConnectionRequestSchema.index({ recipient: 1, status: 1 })
ConnectionRequestSchema.index({ requester: 1, status: 1 })
ConnectionRequestSchema.index({ requester: 1, recipient: 1 }, { unique: true })

export const ConnectionRequest = models.ConnectionRequest ?? model<IConnectionRequest>('ConnectionRequest', ConnectionRequestSchema)
