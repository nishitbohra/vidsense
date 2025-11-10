'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function TestPage() {
  const { user, isAdmin, isAuthenticated, loading } = useAuth()
  const [logs, setLogs] = useState<string[]>([])
  const [testResult, setTestResult] = useState('')

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`])
    console.log(message)
  }

  useEffect(() => {
    addLog('Component mounted')
    addLog(`Auth loading: ${loading}`)
    addLog(`Is authenticated: ${isAuthenticated}`)
    addLog(`User: ${JSON.stringify(user)}`)
    addLog(`Is admin: ${isAdmin}`)
    
    const token = localStorage.getItem('access_token')
    addLog(`Token exists: ${!!token}`)
    if (token) {
      addLog(`Token preview: ${token.substring(0, 50)}...`)
    }
  }, [loading, isAuthenticated, user, isAdmin])

  const testBackendHealth = async () => {
    addLog('Testing backend health...')
    try {
      const response = await fetch('http://localhost:3001/api/health')
      const data = await response.json()
      addLog(`✅ Backend health: ${data.status}`)
      setTestResult('Backend is healthy')
    } catch (error: any) {
      addLog(`❌ Backend health error: ${error.message}`)
      setTestResult(`Backend error: ${error.message}`)
    }
  }

  const testAdminStats = async () => {
    addLog('Testing admin stats...')
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      addLog('❌ No token found')
      setTestResult('No token found')
      return
    }

    try {
      const response = await fetch('http://localhost:3001/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      addLog(`Response status: ${response.status}`)
      const data = await response.json()
      addLog(`Response data: ${JSON.stringify(data)}`)
      
      if (response.ok) {
        addLog('✅ Admin stats retrieved')
        setTestResult(JSON.stringify(data, null, 2))
      } else {
        addLog(`❌ Admin stats error: ${data.error}`)
        setTestResult(`Error: ${data.error || data.message}`)
      }
    } catch (error: any) {
      addLog(`❌ Fetch error: ${error.message}`)
      setTestResult(`Fetch error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold text-white mb-6">🔧 VidSense Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Info */}
        <div className="card-gradient">
          <h2 className="text-xl font-bold text-white mb-4">🔐 Auth Status</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Loading:</span>
              <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
                {loading ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Authenticated:</span>
              <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
                {isAuthenticated ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Is Admin:</span>
              <span className={isAdmin ? 'text-green-400' : 'text-red-400'}>
                {isAdmin ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-gray-400 mb-2">User:</p>
              <pre className="bg-gray-800 p-2 rounded text-xs text-gray-300 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* Tests */}
        <div className="card-gradient">
          <h2 className="text-xl font-bold text-white mb-4">🧪 API Tests</h2>
          <div className="space-y-3">
            <button
              onClick={testBackendHealth}
              className="btn-primary w-full"
            >
              Test Backend Health
            </button>
            <button
              onClick={testAdminStats}
              className="btn-primary w-full"
              disabled={!isAuthenticated}
            >
              Test Admin Stats
            </button>
            
            {testResult && (
              <div className="mt-4 p-4 bg-gray-800 rounded">
                <p className="text-xs text-gray-400 mb-2">Result:</p>
                <pre className="text-xs text-white overflow-auto max-h-40">
                  {testResult}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs */}
      <div className="card-gradient mt-6">
        <h2 className="text-xl font-bold text-white mb-4">📋 Debug Logs</h2>
        <div className="bg-gray-900 p-4 rounded-lg max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="text-xs text-gray-300 font-mono mb-1">
                {log}
              </div>
            ))
          )}
        </div>
        <button
          onClick={() => setLogs([])}
          className="mt-4 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Clear Logs
        </button>
      </div>
    </div>
  )
}
