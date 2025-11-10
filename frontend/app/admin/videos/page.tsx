'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getAllVideosAdmin, deleteVideoAdmin } from '@/lib/api'

interface Video {
  video_id: string
  title: string
  url: string
  user_id?: string
  created_at: string
}

export default function AdminVideosPage() {
  const { isAdmin, isAuthenticated, loading: authLoading } = useAuth()
  const router = useRouter()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    // Redirect to dashboard if not admin
    if (!isAdmin) {
      router.push('/dashboard')
      return
    }

    fetchVideos()
  }, [isAdmin, isAuthenticated, authLoading, router])

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const data = await getAllVideosAdmin()
      setVideos(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load videos')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) return
    try {
      await deleteVideoAdmin(videoId)
      fetchVideos()
    } catch (err: any) {
      setError(err.message || 'Failed to delete video')
    }
  }

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-purple-500 mx-auto"></div>
        <p className="text-gray-400 mt-4">Checking authentication...</p>
      </div>
    )
  }

  // Don't render if not authenticated or not admin (will redirect)
  if (!isAuthenticated || !isAdmin) return null

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Video Management</h1>
        <p className="text-gray-300">Manage all videos across all users</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          {error}
          <button onClick={() => setError('')} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-purple-500 mx-auto"></div>
        </div>
      ) : (
        <div className="card-gradient">
          <div className="mb-4 text-sm text-gray-400">
            Total Videos: <span className="text-white font-semibold">{videos.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-300">Title</th>
                  <th className="text-left py-3 px-4 text-gray-300">Created</th>
                  <th className="text-right py-3 px-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video.video_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-white font-medium">{video.title}</div>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-purple-400 hover:text-purple-300"
                        >
                          {video.url}
                        </a>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(video.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/videos/${video.video_id}`}
                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-sm mr-2"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => handleDeleteVideo(video.video_id)}
                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
