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

// Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
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
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      error.userMessage = 'Cannot connect to the server. Please ensure the backend is running.'
    } else if (error.response?.status === 401) {
      error.userMessage = 'Authentication failed. Please login again.'
    } else if (error.response?.status === 403) {
      error.userMessage = 'Access denied. You do not have permission for this action.'
    } else if (error.response?.data?.error) {
      error.userMessage = error.response.data.error
    } else {
      error.userMessage = error.message || 'An unexpected error occurred'
    }
    
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

// Authentication types
export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  message: string
  user: {
    id: string
    name: string
    email: string
    role: 'admin' | 'customer'
  }
  access_token: string
  refresh_token: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
  created_at: string
  updated_at: string
}

export interface ChangePasswordRequest {
  current_password: string
  new_password: string
}

// Admin types
export interface SystemStats {
  users: {
    total: number
    admins: number
    customers: number
  }
  videos: {
    total: number
    analyzed_today: number
    total_duration: number
  }
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
 * Check analysis status for a video
 */
export const getAnalysisStatus = async (videoId: string): Promise<{ status: string; progress?: number }> => {
  try {
    const response: AxiosResponse<{ status: string; progress?: number }> = await apiClient.get(`/api/analyze/status/${videoId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get analysis status')
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
 * Create video manually (without analysis)
 */
export const createVideo = async (data: {
  video_id: string
  title: string
  url: string
  summary_short?: string
  summary_detailed?: string
  topics?: string[]
}): Promise<VideoDetails> => {
  try {
    const response: AxiosResponse<VideoDetails> = await apiClient.post('/api/videos', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create video')
  }
}

/**
 * Health check endpoint
 */
export const healthCheck = async (): Promise<{ status: string; timestamp: string; database: string }> => {
  try {
    const response: AxiosResponse<{ status: string; timestamp: string; database: string }> = await apiClient.get('/api/health')
    return response.data
  } catch (error) {
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'Health check failed'
    )
  }
}

/**
 * Detailed health check endpoint
 */
export const detailedHealthCheck = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.get('/api/health/detailed')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Detailed health check failed')
  }
}

// ==================== AUTHENTICATION API ====================

/**
 * Register a new user
 */
export const register = async (name: string, email: string, password: string): Promise<AuthResponse> => {
  try {
    const response: AxiosResponse<AuthResponse> = await apiClient.post('/api/auth/register', {
      name,
      email,
      password,
    })
    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Registration failed')
  }
}

/**
 * Login user
 */
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log('Attempting login with:', { email, apiUrl: API_BASE_URL })
    const response: AxiosResponse<AuthResponse> = await apiClient.post('/api/auth/login', {
      email,
      password,
    })
    console.log('Login response:', response.data)
    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token)
      localStorage.setItem('refresh_token', response.data.refresh_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response.data
  } catch (error: any) {
    console.error('Login error:', error)
    console.error('Error response:', error.response?.data)
    console.error('Error message:', error.message)
    throw new Error(error.userMessage || error.response?.data?.error || 'Login failed')
  }
}

/**
 * Logout user
 */
export const logout = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
  }
}

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  try {
    const response: AxiosResponse<User> = await apiClient.get('/api/auth/me')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get user profile')
  }
}

/**
 * Update user profile
 */
export const updateProfile = async (data: { name?: string; email?: string }): Promise<User> => {
  try {
    const response: AxiosResponse<User> = await apiClient.put('/api/auth/me', data)
    // Update stored user
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.data))
    }
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update profile')
  }
}

/**
 * Change password
 */
export const changePassword = async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await apiClient.put('/api/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    })
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to change password')
  }
}

/**
 * Refresh access token
 */
export const refreshToken = async (): Promise<{ access_token: string }> => {
  try {
    const refresh_token = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null
    const response: AxiosResponse<{ access_token: string }> = await apiClient.post('/api/auth/refresh', {
      refresh_token,
    })
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', response.data.access_token)
    }
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to refresh token')
  }
}

// ==================== VIDEO CRUD API ====================

/**
 * Update video metadata
 */
export const updateVideo = async (videoId: string, data: { title?: string; notes?: string }): Promise<VideoDetails> => {
  try {
    const response: AxiosResponse<VideoDetails> = await apiClient.put(`/api/videos/${videoId}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update video')
  }
}

/**
 * Delete video
 */
export const deleteVideo = async (videoId: string): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await apiClient.delete(`/api/videos/${videoId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete video')
  }
}

/**
 * Get video transcript
 */
export const getVideoTranscript = async (videoId: string): Promise<Array<{ text: string; start: number; duration: number }>> => {
  try {
    const response: AxiosResponse<{ transcript: Array<{ text: string; start: number; duration: number }> }> = await apiClient.get(`/api/videos/${videoId}/transcript`)
    return response.data.transcript
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get transcript')
  }
}

/**
 * Get video sentiment data
 */
export const getVideoSentiment = async (videoId: string): Promise<SentimentDataPoint[]> => {
  try {
    const response: AxiosResponse<{ sentiment_timeline: SentimentDataPoint[] }> = await apiClient.get(`/api/videos/${videoId}/sentiment`)
    return response.data.sentiment_timeline
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get sentiment data')
  }
}

/**
 * Get video statistics overview
 */
export const getVideoStats = async (): Promise<any> => {
  try {
    const response: AxiosResponse<any> = await apiClient.get('/api/videos/stats/overview')
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get video stats')
  }
}

// ==================== ADMIN API ====================

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const response: AxiosResponse<{ users: User[] }> = await apiClient.get('/api/admin/users')
    return response.data.users
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get users')
  }
}

/**
 * Get user by ID (admin only)
 */
export const getUserById = async (userId: string): Promise<User> => {
  try {
    const response: AxiosResponse<User> = await apiClient.get(`/api/admin/users/${userId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get user')
  }
}

/**
 * Create new user (admin only)
 */
export const createUser = async (data: { name: string; email: string; password: string; role: 'admin' | 'customer' }): Promise<User> => {
  try {
    const response: AxiosResponse<User> = await apiClient.post('/api/admin/users', data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to create user')
  }
}

/**
 * Update user (admin only)
 */
export const updateUser = async (userId: string, data: { name?: string; email?: string; role?: 'admin' | 'customer' }): Promise<User> => {
  try {
    const response: AxiosResponse<User> = await apiClient.put(`/api/admin/users/${userId}`, data)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to update user')
  }
}

/**
 * Delete user (admin only)
 */
export const deleteUser = async (userId: string): Promise<{ message: string }> => {
  try {
    console.log('API: Deleting user with ID:', userId)
    const response: AxiosResponse<{ message: string }> = await apiClient.delete(`/api/admin/users/${userId}`)
    console.log('API: Delete response:', response.data)
    return response.data
  } catch (error: any) {
    console.error('API: Delete user error:', error)
    console.error('API: Error response:', error.response?.data)
    const errorMessage = error.userMessage || error.response?.data?.error || error.response?.data?.message || 'Failed to delete user'
    throw new Error(errorMessage)
  }
}

/**
 * Get all videos (admin only)
 */
export const getAllVideosAdmin = async (): Promise<VideoDetails[]> => {
  try {
    const response: AxiosResponse<{ videos: VideoDetails[] }> = await apiClient.get('/api/admin/videos')
    return response.data.videos
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get videos')
  }
}

/**
 * Delete video (admin only)
 */
export const deleteVideoAdmin = async (videoId: string): Promise<{ message: string }> => {
  try {
    const response: AxiosResponse<{ message: string }> = await apiClient.delete(`/api/admin/videos/${videoId}`)
    return response.data
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to delete video')
  }
}

/**
 * Get system statistics (admin only)
 */
export const getSystemStats = async (): Promise<SystemStats> => {
  try {
    const response: AxiosResponse<SystemStats> = await apiClient.get('/api/admin/stats')
    return response.data
  } catch (error: any) {
    throw new Error(error.userMessage || error.response?.data?.error || 'Failed to get system stats')
  }
}

// ==================== SEARCH API ====================

/**
 * Find similar videos
 */
export const findSimilarVideos = async (videoId: string, limit = 5): Promise<SearchResult[]> => {
  try {
    const response: AxiosResponse<{ results: SearchResult[] }> = await apiClient.get(`/api/search/similar/${videoId}`, {
      params: { limit }
    })
    return response.data.results
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to find similar videos')
  }
}

/**
 * Get search suggestions
 */
export const getSearchSuggestions = async (): Promise<string[]> => {
  try {
    const response: AxiosResponse<{ suggestions: string[] }> = await apiClient.get('/api/search/suggestions')
    return response.data.suggestions
  } catch (error: any) {
    throw new Error(error.response?.data?.error || 'Failed to get search suggestions')
  }
}

// Utility functions