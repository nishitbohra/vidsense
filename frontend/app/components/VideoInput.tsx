'use client'

import { useState } from 'react'
import { Play, AlertCircle } from 'lucide-react'

interface VideoInputProps {
  onAnalyze: (url: string) => void
  isLoading: boolean
}

export default function VideoInput({ onAnalyze, isLoading }: VideoInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const validateYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/watch\?.*v=[\w-]+/
    ]
    return patterns.some(pattern => pattern.test(url))
  }

  const extractVideoId = (url: string): string | null => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    if (!validateYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL')
      return
    }

    const videoId = extractVideoId(url)
    if (!videoId) {
      setError('Could not extract video ID from URL')
      return
    }

    onAnalyze(url)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    if (error) setError('')
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="youtube-url" className="block text-sm font-medium text-white mb-2">
            YouTube Video URL
          </label>
          <div className="relative">
            <input
              type="url"
              id="youtube-url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`input pr-12 text-white placeholder:text-gray-400 ${error ? 'border-red-300 focus:border-red-300 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <Play className="h-5 w-5 text-gray-300" />
            </div>
          </div>
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Analyzing Video...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Analyze Video (Only English Supported)
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg backdrop-blur-sm">
        <h4 className="text-sm font-medium text-white mb-2">What happens when you analyze a video?</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Extract complete transcript with timestamps</li>
          <li>• Generate AI-powered summary (short & detailed)</li>
          <li>• Perform sentiment analysis throughout the video</li>
          <li>• Create semantic embeddings for search</li>
          <li>• Identify key topics and themes</li>
        </ul>
      </div>
    </div>
  )
}