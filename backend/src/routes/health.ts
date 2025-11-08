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

// Health check endpoint - Simple version for Render compatibility
// Always returns 200 if the process is running, detailed checks moved to /detailed
router.get('/', async (req, res) => {
  try {
    // Quick database status check without ping
    const databaseStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    
    // Return 200 OK even if database is temporarily disconnected
    // This prevents Render from marking the service as unhealthy during cold starts
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.NODE_ENV,
      uptime: Math.floor(process.uptime()),
      database: databaseStatus,
      message: 'Service is running'
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    // Still return 200 to prevent Render from killing the service
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      message: 'Service is running',
      note: 'Health check encountered an error but service is operational'
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