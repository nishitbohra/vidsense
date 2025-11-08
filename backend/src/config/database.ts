import mongoose from 'mongoose'
import { env } from './env'

export const connectDatabase = async (): Promise<void> => {
  try {
    console.log('Connecting to MongoDB...')
    
    await mongoose.connect(env.MONGODB_URI, {
      // Connection options
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false // Disable mongoose buffering
    })
    
    console.log('✅ MongoDB connected successfully')
    
    // Handle connection events
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error)
    })
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected')
    })
    
    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected')
    })
    
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    throw error
  }
}

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect()
    console.log('MongoDB disconnected successfully')
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error)
    throw error
  }
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  try {
    await disconnectDatabase()
    process.exit(0)
  } catch (error) {
    console.error('Error during graceful shutdown:', error)
    process.exit(1)
  }
})

export default mongoose