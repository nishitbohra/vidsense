import axios, { AxiosResponse } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes for video analysis
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// Types
export interface AnalysisRequest {
  youtube_url: string
}

export interface SentimentDataPoint {
  timestamp: number
  sentiment_label: 'positive' | 'neutral' | 'negative'
  sentiment_score: number
  text_segment: string
}

export interface AnalysisResponse {
  video_id: string
  title: string
  summary_short: string
  summary_detailed: string
  topics: string[]
  sentiment_timeline: SentimentDataPoint[]
  created_at: string
}

export interface SearchRequest {
  query: string
  limit?: number
}

export interface SearchResult {
  video_id: string
  title: string
  similarity_score: number
  url?: string
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
}

export interface VideoDetails {
  video_id: string
  title: string
  url: string
  summary_short: string
  summary_detailed: string
  topics: string[]
  sentiment_timeline: SentimentDataPoint[]
  transcript: Array<{
    text: string
    start: number
    duration: number
  }>
  created_at: string
  updated_at: string
}

// API Functions

/**
 * Analyze a YouTube video
 */
export const analyzeVideo = async (youtubeUrl: string): Promise<AnalysisResponse> => {
  try {
    const response: AxiosResponse<AnalysisResponse> = await apiClient.post('/api/analyze', {
      youtube_url: youtubeUrl,
    })
    return response.data
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to analyze video'
    )
  }
}

/**
 * Search for similar videos
 */
export const searchVideos = async (query: string, limit = 10): Promise<SearchResult[]> => {
  try {
    const response: AxiosResponse<SearchResponse> = await apiClient.post('/api/search', {
      query,
      limit,
    })
    return response.data.results
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to search videos'
    )
  }
}

/**
 * Get video details by ID
 */
export const getVideoDetails = async (videoId: string): Promise<VideoDetails> => {
  try {
    const response: AxiosResponse<VideoDetails> = await apiClient.get(`/api/videos/${videoId}`)
    return response.data
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to get video details'
    )
  }
}

/**
 * Get all analyzed videos
 */
export const getAnalyzedVideos = async (): Promise<VideoDetails[]> => {
  try {
    const response: AxiosResponse<{ videos: VideoDetails[] }> = await apiClient.get('/api/videos')
    return response.data.videos
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Failed to get analyzed videos'
    )
  }
}

/**
 * Health check endpoint
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  try {
    const response: AxiosResponse<{ status: string; timestamp: string }> = await apiClient.get('/api/health')
    return response.data
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Health check failed'
    )
  }
}

// Utility functions

/**
 * Extract video ID from YouTube URL
 */
export const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

/**
 * Validate YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=[\w-]+/
  ]
  return patterns.some(pattern => pattern.test(url))
}

/**
 * Format timestamp for display
 */
export const formatTimestamp = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Get YouTube thumbnail URL
 */
export const getYouTubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'medium'): string => {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`
}

/**
 * Calculate reading time for text
 */
export const calculateReadingTime = (text: string, wordsPerMinute = 200): number => {
  const wordCount = text.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '...'
}

export default apiClient