'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getSystemStats } from '@/lib/api'

interface SystemStats {
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

export default function AdminPage() {
  const { user, isAdmin, loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats | null>(null)
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

    const fetchStats = async () => {
      try {
        console.log('Fetching admin stats...')
        console.log('User:', user)
        console.log('Is Admin:', isAdmin)
        console.log('Token:', localStorage.getItem('access_token')?.substring(0, 50))
        
        const data = await getSystemStats()
        console.log('Stats received:', data)
        setStats(data)
      } catch (err: any) {
        console.error('Stats error:', err)
        console.error('Error message:', err.message)
        console.error('Error userMessage:', err.userMessage)
        setError(err.message || 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [isAdmin, isAuthenticated, authLoading, router])

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
  if (!isAuthenticated || !isAdmin) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="text-6xl mb-4">👑</div>
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-300">System management and analytics</p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading statistics...</p>
        </div>
      ) : error ? (
        <div className="card-gradient text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card-gradient text-center">
              <div className="text-4xl mb-2">👥</div>
              <div className="text-4xl font-bold text-white">{stats.users.total}</div>
              <div className="text-gray-300 mt-1">Total Users</div>
              <div className="mt-4 flex justify-center space-x-4 text-sm">
                <span className="text-yellow-400">{stats.users.admins} Admins</span>
                <span className="text-blue-400">{stats.users.customers} Customers</span>
              </div>
            </div>

            <div className="card-gradient text-center">
              <div className="text-4xl mb-2">📹</div>
              <div className="text-4xl font-bold text-white">{stats.videos.total}</div>
              <div className="text-gray-300 mt-1">Total Videos</div>
              <div className="mt-4 text-sm text-purple-400">
                {stats.videos.analyzed_today} analyzed today
              </div>
            </div>

            <div className="card-gradient text-center">
              <div className="text-4xl mb-2">⏱️</div>
              <div className="text-4xl font-bold text-white">
                {Math.floor(stats.videos.total_duration / 3600)}h
              </div>
              <div className="text-gray-300 mt-1">Total Content</div>
              <div className="mt-4 text-sm text-cyan-400">
                {Math.floor((stats.videos.total_duration % 3600) / 60)}m analyzed
              </div>
            </div>
          </div>

          {/* Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/admin/users" className="card group hover:scale-105 transition-transform duration-300">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">👤</div>
                <div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    User Management
                  </h3>
                  <p className="text-gray-300 mt-1">
                    View, create, edit, and delete users
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/admin/videos" className="card group hover:scale-105 transition-transform duration-300">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">🎬</div>
                <div>
                  <h3 className="text-2xl font-bold text-white group-hover:text-purple-400 transition-colors">
                    Video Management
                  </h3>
                  <p className="text-gray-300 mt-1">
                    Manage all videos across all users
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  )
}
