import express from 'express'
import mongoose from 'mongoose'
import { env } from '../config/env'

const router = express.Router()

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  version: string
  environment: string
  services: {
    database: 'connected' | 'disconnected' | 'error'
    python: 'available' | 'unavailable'
  }
  uptime: number
  memory: {
    used: number
    total: number
    percentage: number
  }
}

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const startTime = Date.now()
    
    // Check database connection
    let databaseStatus: 'connected' | 'disconnected' | 'error' = 'disconnected'
    try {
      if (mongoose.connection.readyState === 1) {
        // Perform a simple query to test the connection
        await mongoose.connection.db?.admin().ping()
        databaseStatus = 'connected'
      }
    } catch (error) {
      databaseStatus = 'error'
    }
    
    // Check Python availability (basic check)
    let pythonStatus: 'available' | 'unavailable' = 'unavailable'
    try {
      const { spawn } = require('child_process')
      const pythonProcess = spawn('python', ['--version'], { 
        stdio: 'pipe',
        timeout: 5000 
      })
      
      await new Promise((resolve, reject) => {
        pythonProcess.on('close', (code: number) => {
          if (code === 0) {
            pythonStatus = 'available'
          }
          resolve(code)
        })
        pythonProcess.on('error', () => {
          reject()
        })
      })
    } catch (error) {
      // Python check failed, status remains unavailable
    }
    
    // Memory usage
    const memoryUsage = process.memoryUsage()
    const totalMemory = memoryUsage.heapTotal
    const usedMemory = memoryUsage.heapUsed
    const memoryPercentage = (usedMemory / totalMemory) * 100
    
    // Calculate uptime
    const uptime = process.uptime()
    
    const responseTime = Date.now() - startTime
    
    const healthStatus: HealthStatus = {
      status: databaseStatus === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      services: {
        database: databaseStatus,
        python: pythonStatus
      },
      uptime: Math.floor(uptime),
      memory: {
        used: Math.round(usedMemory / 1024 / 1024), // MB
        total: Math.round(totalMemory / 1024 / 1024), // MB
        percentage: Math.round(memoryPercentage * 100) / 100
      }
    }
    
    // Set appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503
    
    res.status(statusCode).json({
      ...healthStatus,
      responseTime: `${responseTime}ms`
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Detailed health check endpoint
router.get('/detailed', async (req, res) => {
  try {
    const checks = []
    
    // Database detailed check
    try {
      const dbStart = Date.now()
      await mongoose.connection.db?.admin().ping()
      const dbTime = Date.now() - dbStart
      checks.push({
        name: 'database',
        status: 'pass',
        responseTime: `${dbTime}ms`,
        details: {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name
        }
      })
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'fail',
        error: error instanceof Error ? error.message : 'Database connection failed'
      })
    }
    
    // Environment variables check
    const requiredEnvVars = ['MONGODB_URI', 'GROQ_API_KEY']
    const missingEnvVars = requiredEnvVars.filter(key => !process.env[key])
    checks.push({
      name: 'environment',
      status: missingEnvVars.length === 0 ? 'pass' : 'fail',
      details: {
        missing: missingEnvVars,
        nodeEnv: env.NODE_ENV,
        port: env.PORT
      }
    })
    
    // Python dependencies check
    try {
      const pythonCheck = await new Promise((resolve) => {
        const { spawn } = require('child_process')
        const pythonProcess = spawn('python', ['-c', 'import sys; print(sys.version)'], {
          stdio: 'pipe',
          timeout: 10000
        })
        
        let output = ''
        pythonProcess.stdout.on('data', (data: Buffer) => {
          output += data.toString()
        })
        
        pythonProcess.on('close', (code: number) => {
          resolve({
            status: code === 0 ? 'pass' : 'fail',
            version: output.trim(),
            exitCode: code
          })
        })
        
        pythonProcess.on('error', () => {
          resolve({
            status: 'fail',
            error: 'Python not found or not executable'
          })
        })
      })
      
      checks.push({
        name: 'python',
        ...(pythonCheck || {})
      })
    } catch (error) {
      checks.push({
        name: 'python',
        status: 'fail',
        error: 'Python check failed'
      })
    }
    
    const allPassed = checks.every(check => check.status === 'pass')
    
    res.status(allPassed ? 200 : 503).json({
      status: allPassed ? 'pass' : 'fail',
      timestamp: new Date().toISOString(),
      checks
    })
    
  } catch (error) {
    res.status(500).json({
      status: 'fail',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router