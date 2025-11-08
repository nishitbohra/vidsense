'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + '/')
  }

  return (
    <nav className="hidden md:flex space-x-8">
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
    </nav>
  )
}
