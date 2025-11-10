import mongoose, { Schema, Document, Model } from 'mongoose'
import bcrypt from 'bcryptjs'

export type UserRole = 'admin' | 'customer'

export interface IUser extends Document {
  email: string
  password: string
  name: string
  role: UserRole
  isActive: boolean
  preferences: {
    notifications: boolean
    theme: 'light' | 'dark'
    language: string
  }
  created_at: Date
  updated_at: Date
  comparePassword(candidatePassword: string): Promise<boolean>
}

export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>
  findByEmailWithPassword(email: string): Promise<IUser | null>
  findAdmins(): Promise<IUser[]>
  findCustomers(): Promise<IUser[]>
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Don't return password by default
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['admin', 'customer'],
    default: 'customer',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'users'
})

// Indexes
UserSchema.index({ role: 1 })
UserSchema.index({ created_at: -1 })

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error: any) {
    next(error)
  }
})

// Instance method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    return false
  }
}

// Static methods
UserSchema.statics.findByEmail = function(email: string) {
  return this.findOne({ email: email.toLowerCase() })
}

UserSchema.statics.findByEmailWithPassword = function(email: string) {
  return this.findOne({ email: email.toLowerCase() }).select('+password')
}

UserSchema.statics.findAdmins = function() {
  return this.find({ role: 'admin', isActive: true })
}

UserSchema.statics.findCustomers = function() {
  return this.find({ role: 'customer', isActive: true })
}

const User = mongoose.model<IUser, IUserModel>('User', UserSchema)

export default User
