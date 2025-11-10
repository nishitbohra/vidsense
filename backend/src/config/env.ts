import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface Environment {
  NODE_ENV: string
  PORT: number
  MONGODB_URI: string
  GROQ_API_KEY: string
  FRONTEND_URL: string
  CHROMA_PERSIST_DIR: string
  JWT_SECRET: string
  JWT_REFRESH_SECRET: string
  JWT_EXPIRES_IN: string
}

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name]
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value || defaultValue!
}

const getEnvNumber = (name: string, defaultValue: number): number => {
  const value = process.env[name]
  if (!value) return defaultValue
  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`)
  }
  return parsed
}

export const env: Environment = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: getEnvNumber('PORT', 5000),
  MONGODB_URI: getEnvVar('MONGODB_URI'),
  GROQ_API_KEY: getEnvVar('GROQ_API_KEY'),
  FRONTEND_URL: getEnvVar('FRONTEND_URL', 'http://localhost:3000'),
  CHROMA_PERSIST_DIR: getEnvVar('CHROMA_PERSIST_DIR', './chromadb'),
  JWT_SECRET: getEnvVar('JWT_SECRET', 'your-secret-jwt-key-change-in-production'),
  JWT_REFRESH_SECRET: getEnvVar('JWT_REFRESH_SECRET', 'your-refresh-secret-jwt-key-change-in-production'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '7d'),
}

// Validate critical environment variables
export const validateEnvironment = (): void => {
  const required = ['MONGODB_URI', 'GROQ_API_KEY']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '))
    console.error('Please check your .env file and ensure all required variables are set.')
    process.exit(1)
  }
  
  console.log('✅ Environment variables validated successfully')
}

export default env