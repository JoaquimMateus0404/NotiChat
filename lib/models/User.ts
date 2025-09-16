import { Schema, model, models } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface IUser {
  _id: string
  email: string
  password: string
  name: string
  username: string
  title: string
  company?: string
  location?: string
  bio?: string
  avatar?: string
  coverImage?: string
  verified: boolean
  isOnline: boolean
  lastSeen: Date
  connections: string[] // Array of user IDs
  followers: string[] // Array of user IDs
  following: string[] // Array of user IDs
  blockedUsers: string[] // Array of user IDs
  skills: string[]
  experience: {
    title: string
    company: string
    location: string
    startDate: Date
    endDate?: Date
    current: boolean
    description: string
  }[]
  education: {
    institution: string
    degree: string
    fieldOfStudy: string
    startDate: Date
    endDate?: Date
    current: boolean
  }[]
  socialLinks: {
    linkedin?: string
    github?: string
    twitter?: string
    website?: string
  }
  privacy: {
    profileVisibility: 'public' | 'connections' | 'private'
    contactInfo: 'public' | 'connections' | 'private'
    activityStatus: boolean
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-zA-Z0-9_]+$/
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  avatar: {
    type: String
  },
  coverImage: {
    type: String
  },
  verified: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  connections: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  skills: [{
    type: String,
    trim: true
  }],
  experience: [{
    title: {
      type: String,
      required: true
    },
    company: {
      type: String,
      required: true
    },
    location: String,
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  education: [{
    institution: {
      type: String,
      required: true
    },
    degree: {
      type: String,
      required: true
    },
    fieldOfStudy: String,
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    }
  }],
  socialLinks: {
    linkedin: String,
    github: String,
    twitter: String,
    website: String
  },
  privacy: {
    profileVisibility: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'public'
    },
    contactInfo: {
      type: String,
      enum: ['public', 'connections', 'private'],
      default: 'connections'
    },
    activityStatus: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
})

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// Remove password from JSON output
UserSchema.methods.toJSON = function() {
  const userObject = this.toObject()
  delete userObject.password
  return userObject
}

export const User = models.User || model<IUser>('User', UserSchema)
