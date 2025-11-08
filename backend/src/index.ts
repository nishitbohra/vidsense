import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { connectDatabase } from './config/database'
import { env } from './config/env'
import analyzeRoutes from './routes/analyze'
import searchRoutes from './routes/search'
import videoRoutes from './routes/videos'
import healthRoute from './routes/health'

// Load environment variables
dotenv.config()

const app = express()
const PORT = env.PORT || 3001

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

app.use(limiter)

// Stricter rate limiting for analysis endpoint
const analysisLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 analysis requests per hour
  message: {
    error: 'Too many analysis requests. Please wait before analyzing more videos.',
  },
})

// CORS configuration - Allow frontend origin
const allowedOrigins = [
  env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:3001'
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  maxAge: 86400, // 24 hours
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Compression middleware
app.use(compression())

// Logging middleware
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Health check endpoint (before rate limiting)
app.use('/api/health', healthRoute)

// API routes
app.use('/api/analyze', analysisLimiter, analyzeRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/videos', videoRoutes)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'VidSense API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      analyze: 'POST /api/analyze',
      search: 'POST /api/search',
      videos: 'GET /api/videos',
      videoDetails: 'GET /api/videos/:id',
      health: 'GET /api/health'
    },
    documentation: 'https://github.com/yourusername/vidsense#api-documentation'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /api/health',
      'POST /api/analyze',
      'POST /api/search',
      'GET /api/videos',
      'GET /api/videos/:id'
    ]
  })
})

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err)
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: Object.values(err.errors).map((e: any) => e.message)
    })
  }
  
  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    })
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'The provided token is invalid'
    })
  }
  
  // Default error
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase()
    console.log('Database connected successfully')
    
    // Start server with increased timeout for long-running requests
    const server = app.listen(PORT, () => {
      console.log(`🚀 VidSense API Server running on port ${PORT}`)
      console.log(`📊 Environment: ${env.NODE_ENV}`)
      console.log(`🌐 CORS enabled for: ${env.FRONTEND_URL}`)
      console.log(`📝 API Documentation: http://localhost:${PORT}/`)
    })
    
    // Increase server timeout to 5 minutes for long-running analysis requests
    server.timeout = 300000 // 5 minutes
    server.keepAliveTimeout = 305000 // Slightly longer than timeout
    server.headersTimeout = 306000 // Slightly longer than keepAliveTimeout
    
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app