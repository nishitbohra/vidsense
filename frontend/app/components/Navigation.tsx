'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout, isAdmin, isAuthenticated } = useAuth()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav className="flex items-center space-x-6">
      {isAuthenticated ? (
        <>
          <Link 
            href="/dashboard" 
            className={`font-medium transition-colors duration-300 hover:scale-110 transform ${
              isActive('/dashboard') 
                ? 'text-purple-400 font-bold' 
                : 'text-gray-300 hover:text-purple-400'
            }`}
          >
            Dashboard
          </Link>
          <Link 
            href="/search" 
            className={`font-medium transition-colors duration-300 hover:scale-110 transform ${
              isActive('/search') 
                ? 'text-purple-400 font-bold' 
                : 'text-gray-300 hover:text-purple-400'
            }`}
          >
            Search
          </Link>
          <Link 
            href="/history" 
            className={`font-medium transition-colors duration-300 hover:scale-110 transform ${
              isActive('/history') 
                ? 'text-purple-400 font-bold' 
                : 'text-gray-300 hover:text-purple-400'
            }`}
          >
            History
          </Link>
          {isAdmin && (
            <Link 
              href="/admin" 
              className={`font-medium transition-colors duration-300 hover:scale-110 transform ${
                isActive('/admin') 
                  ? 'text-yellow-400 font-bold' 
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            >
              Admin
            </Link>
          )}
          <div className="flex items-center space-x-4 border-l border-gray-700 pl-6">
            <Link 
              href="/profile" 
              className="flex items-center space-x-2 text-gray-300 hover:text-purple-400 transition-colors"
            >
              <span className="text-sm">{user?.name}</span>
              {isAdmin && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">Admin</span>}
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </>
      ) : (
        <>
          <Link 
            href="/login" 
            className="px-4 py-2 text-gray-300 hover:text-purple-400 transition-colors font-medium"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors font-medium"
          >
            Register
          </Link>
        </>
      )}
    </nav>
  )
}
