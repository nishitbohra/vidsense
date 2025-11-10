'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getVideoDetails, deleteVideo, updateVideo, getVideoTranscript, findSimilarVideos } from '@/lib/api'
import SummaryDisplay from '@/app/components/SummaryDisplay'
import SentimentChart from '@/app/components/SentimentChart'
import TopicCloud from '@/app/components/TopicCloud'

interface VideoDetails {
  video_id: string
  title: string
  url: string
  summary_short: string
  summary_detailed: string
  topics: string[]
  sentiment_timeline: Array<{
    timestamp: number
    sentiment_label: 'positive' | 'neutral' | 'negative'
    sentiment_score: number
    text_segment: string
  }>
  transcript: Array<{
    text: string
    start: number
    duration: number
  }>
  created_at: string
  updated_at: string
}

interface SimilarVideo {
  video_id: string
  title: string
  similarity_score: number
  url?: string
}

export default function VideoDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const videoId = params.id as string

  const [video, setVideo] = useState<VideoDetails | null>(null)
  const [similarVideos, setSimilarVideos] = useState<SimilarVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetchVideoDetails()
    fetchSimilarVideos()
  }, [videoId])

  const fetchVideoDetails = async () => {
    try {
      const data = await getVideoDetails(videoId)
      setVideo(data)
      setEditTitle(data.title)
    } catch (err: any) {
      setError(err.message || 'Failed to load video')
    } finally {
      setLoading(false)
    }
  }

  const fetchSimilarVideos = async () => {
    try {
      const similar = await findSimilarVideos(videoId, 5)
      setSimilarVideos(similar)
    } catch (err) {
      console.error('Failed to load similar videos:', err)
    }
  }

  const handleUpdate = async () => {
    if (!video) return
    
    try {
      await updateVideo(videoId, { title: editTitle })
      setVideo({ ...video, title: editTitle })
      setShowEditDialog(false)
      setError('')
    } catch (err: any) {
      setError(err.message || 'Failed to update video')
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteVideo(videoId)
      router.push('/history')
    } catch (err: any) {
      setError(err.message || 'Failed to delete video')
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-purple-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading video details...</p>
      </div>
    )
  }

  if (error && !video) {
    return (
      <div className="card-gradient text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-red-400 mb-2">Error</h2>
        <p className="text-gray-300">{error}</p>
        <button onClick={() => router.push('/history')} className="btn-primary mt-6">
          Back to History
        </button>
      </div>
    )
  }

  if (!video) return null

  return (
    <div className="space-y-8">
      {/* Header with Actions */}
      <div className="card-gradient">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-4">{video.title}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <span>📅 {new Date(video.created_at).toLocaleDateString()}</span>
              <a 
                href={video.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 flex items-center space-x-1"
              >
                <span>🔗</span>
                <span>Watch on YouTube</span>
              </a>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowEditDialog(true)}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
            >
              ✏️ Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="card-gradient">
        <h2 className="text-2xl font-bold text-white mb-4">📝 Summary</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Short Summary</h3>
            <p className="text-gray-300">{video.summary_short}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Detailed Summary</h3>
            <p className="text-gray-300 whitespace-pre-wrap">{video.summary_detailed}</p>
          </div>
        </div>
      </div>

      {/* Topics */}
      {video.topics && video.topics.length > 0 && (
        <div className="card-gradient">
          <h2 className="text-2xl font-bold text-white mb-4">🏷️ Topics</h2>
          <TopicCloud topics={video.topics} />
        </div>
      )}

      {/* Sentiment Analysis */}
      {video.sentiment_timeline && video.sentiment_timeline.length > 0 && (
        <div className="card-gradient">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Sentiment Analysis</h2>
          <SentimentChart sentimentData={video.sentiment_timeline} />
        </div>
      )}

      {/* Transcript */}
      {video.transcript && video.transcript.length > 0 && (
        <div className="card-gradient">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">📜 Transcript</h2>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="btn-secondary text-sm"
            >
              {showTranscript ? 'Hide' : 'Show'} Transcript
            </button>
          </div>
          {showTranscript && (
            <div className="max-h-96 overflow-y-auto space-y-2 bg-gray-800/50 p-4 rounded-lg">
              {video.transcript.map((segment, index) => (
                <div key={index} className="border-l-2 border-purple-500/30 pl-4">
                  <span className="text-xs text-gray-500">
                    {Math.floor(segment.start / 60)}:{(segment.start % 60).toFixed(0).padStart(2, '0')}
                  </span>
                  <p className="text-gray-300 mt-1">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Similar Videos */}
      {similarVideos.length > 0 && (
        <div className="card-gradient">
          <h2 className="text-2xl font-bold text-white mb-4">🔍 Similar Videos</h2>
          <div className="grid grid-cols-1 gap-4">
            {similarVideos.map((similar) => (
              <div
                key={similar.video_id}
                onClick={() => router.push(`/videos/${similar.video_id}`)}
                className="p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-white font-medium">{similar.title}</h3>
                  <span className="text-sm text-purple-400">
                    {(similar.similarity_score * 100).toFixed(0)}% match
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card-gradient max-w-lg w-full">
            <h2 className="text-2xl font-bold text-white mb-4">Edit Video</h2>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="input mb-4"
              placeholder="Video title"
            />
            <div className="flex space-x-4">
              <button onClick={handleUpdate} className="btn-primary flex-1">
                Save Changes
              </button>
              <button
                onClick={() => setShowEditDialog(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card-gradient max-w-lg w-full">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-4">Delete Video?</h2>
              <p className="text-gray-300 mb-6">
                This will permanently delete this video and all associated data. This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="btn-primary flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary flex-1"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
