'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Clock, ExternalLink, FileText, TrendingUp, Calendar, Search } from 'lucide-react'

interface Video {
  video_id: string
  title: string
  url: string
  summary_short?: string
  topics?: string[]
  transcript_length?: number
  duration?: number
  created_at: string
  has_summary: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export default function HistoryPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [pagination, setPagination] = useState<PaginationInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    fetchVideos(currentPage)
  }, [currentPage])

  const fetchVideos = async (page: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/videos?page=${page}&limit=12`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch videos: ${response.statusText}`)
      }

      const data = await response.json()
      setVideos(data.videos)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load video history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    return `${minutes}m`
  }

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    video.topics?.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-pink-900 to-red-900 p-12 text-white shadow-2xl border border-pink-500/30">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative text-center">
          <div className="inline-block mb-6 animate-float">
            <div className="text-6xl drop-shadow-2xl">📚</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Analysis History
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Browse all your analyzed videos and revisit insights anytime.
          </p>
        </div>
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      {/* Stats Bar */}
      {pagination && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-gradient text-center">
            <div className="text-3xl mb-2">📹</div>
            <div className="text-3xl font-bold text-white">{pagination.total}</div>
            <div className="text-sm text-gray-300">Total Videos Analyzed</div>
          </div>
          <div className="card-gradient text-center">
            <div className="text-3xl mb-2">📄</div>
            <div className="text-3xl font-bold text-white">{pagination.totalPages}</div>
            <div className="text-sm text-gray-300">Pages</div>
          </div>
          <div className="card-gradient text-center">
            <div className="text-3xl mb-2">🎬</div>
            <div className="text-3xl font-bold text-white">{filteredVideos.length}</div>
            <div className="text-sm text-gray-300">Showing Now</div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="card-gradient">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search videos by title or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="card-gradient text-center py-12">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent absolute top-0"></div>
            </div>
          </div>
          <p className="text-gray-300">Loading video history...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card-gradient bg-red-900/20 border-red-500/50">
          <div className="flex items-center">
            <span className="text-3xl mr-4">⚠️</span>
            <div>
              <h3 className="text-xl font-bold text-red-400 mb-1">Error Loading Videos</h3>
              <p className="text-gray-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Videos Grid */}
      {!isLoading && !error && filteredVideos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div
              key={video.video_id}
              className="card group hover:scale-105 transition-all duration-300 hover:shadow-purple-500/30"
            >
              {/* Video Thumbnail */}
              <div className="relative mb-4 rounded-xl overflow-hidden bg-gray-900/50">
                <img
                  src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                  alt={video.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                {video.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-purple-400 transition-colors">
                {video.title}
              </h3>

              {/* Summary Preview */}
              {video.summary_short && (
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                  {video.summary_short}
                </p>
              )}

              {/* Topics */}
              {video.topics && video.topics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {video.topics.slice(0, 3).map((topic, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-600/30 border border-purple-500/50 rounded-full text-xs text-purple-200"
                    >
                      {topic}
                    </span>
                  ))}
                  {video.topics.length > 3 && (
                    <span className="px-2 py-1 bg-gray-700/50 rounded-full text-xs text-gray-300">
                      +{video.topics.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Meta Info */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(video.created_at)}
                </div>
                {video.has_summary && (
                  <div className="flex items-center text-green-400">
                    <FileText className="h-3 w-3 mr-1" />
                    Analyzed
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 btn btn-secondary text-xs flex items-center justify-center"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Watch
                </a>
                <Link
                  href={`/dashboard?video=${video.video_id}`}
                  className="flex-1 btn btn-primary text-xs flex items-center justify-center"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredVideos.length === 0 && videos.length === 0 && (
        <div className="card-gradient text-center py-12">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Videos Yet</h3>
          <p className="text-gray-300 mb-6">
            Start analyzing YouTube videos to build your history.
          </p>
          <Link href="/dashboard" className="btn btn-primary inline-flex items-center">
            Analyze Your First Video
          </Link>
        </div>
      )}

      {/* No Search Results */}
      {!isLoading && !error && filteredVideos.length === 0 && videos.length > 0 && (
        <div className="card-gradient text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Results Found</h3>
          <p className="text-gray-300">
            No videos match your search query "{searchQuery}"
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && !isLoading && (
        <div className="card-gradient">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={!pagination.hasPrev}
              className="btn btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
              disabled={!pagination.hasNext}
              className="btn btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
