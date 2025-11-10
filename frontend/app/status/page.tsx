'use client'

import { useState, useEffect } from 'react'
import { healthCheck, detailedHealthCheck } from '@/lib/api'

export default function SystemStatusPage() {
  const [basicHealth, setBasicHealth] = useState<any>(null)
  const [detailedHealth, setDetailedHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHealthStatus()
  }, [])

  const fetchHealthStatus = async () => {
    setLoading(true)
    try {
      const basic = await healthCheck()
      setBasicHealth(basic)
      
      try {
        const detailed = await detailedHealthCheck()
        setDetailedHealth(detailed)
      } catch (err) {
        console.log('Detailed health check not available')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health status')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    if (status === 'healthy' || status === 'connected') return 'text-green-400'
    if (status === 'degraded') return 'text-yellow-400'
    return 'text-red-400'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'healthy' || status === 'connected') return '✅'
    if (status === 'degraded') return '⚠️'
    return '❌'
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="text-6xl mb-4">🏥</div>
        <h1 className="text-4xl font-bold text-white mb-2">System Status</h1>
        <p className="text-gray-300">Real-time system health monitoring</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-purple-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Checking system health...</p>
        </div>
      ) : error ? (
        <div className="card-gradient text-center py-12">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-400 mb-2">System Error</h2>
          <p className="text-gray-300">{error}</p>
          <button onClick={fetchHealthStatus} className="btn-primary mt-6">
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Basic Health */}
          {basicHealth && (
            <div className="card-gradient">
              <h2 className="text-2xl font-bold text-white mb-6">System Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-4xl mb-2">{getStatusIcon(basicHealth.status)}</div>
                  <div className={`text-2xl font-bold ${getStatusColor(basicHealth.status)}`}>
                    {basicHealth.status.toUpperCase()}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">API Status</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">{getStatusIcon(basicHealth.database)}</div>
                  <div className={`text-2xl font-bold ${getStatusColor(basicHealth.database)}`}>
                    {basicHealth.database.toUpperCase()}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Database</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl mb-2">⏱️</div>
                  <div className="text-2xl font-bold text-white">
                    {new Date(basicHealth.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Last Check</div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Health */}
          {detailedHealth && (
            <div className="card-gradient">
              <h2 className="text-2xl font-bold text-white mb-6">Detailed Metrics</h2>
              <div className="space-y-4">
                {Object.entries(detailedHealth).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                    <span className="text-gray-300 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white font-mono">{JSON.stringify(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="card-gradient">
            <h2 className="text-2xl font-bold text-white mb-6">Actions</h2>
            <div className="flex space-x-4">
              <button onClick={fetchHealthStatus} className="btn-primary">
                🔄 Refresh Status
              </button>
              <button onClick={() => window.location.href = 'http://localhost:5000/api/health'} className="btn-secondary">
                📊 Raw API Response
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
