'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in on mount
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (token) {
          console.log('Checking auth on mount...')
          const currentUser = await getCurrentUser()
          console.log('User fetched:', currentUser)
          setUser(currentUser)
        } else {
          console.log('No token found')
        }
      } catch (error: any) {
        console.error('Auth check failed:', error)
        console.error('Error message:', error.message)
        // Only logout if token is invalid (401), not on network errors
        if (error.message?.includes('401') || error.message?.toLowerCase().includes('unauthorized')) {
          console.log('Token invalid, logging out')
          apiLogout()
          setUser(null)
        } else {
          console.log('Auth check failed but keeping token (might be network issue)')
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await apiLogin(email, password)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiRegister(name, email, password)
      setUser(response.user)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    apiLogout()
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role === 'admin',
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
