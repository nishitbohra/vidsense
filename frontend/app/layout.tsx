import '../styles/globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Navigation from './components/Navigation'
import { AuthProvider } from './context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VidSense - AI-Powered YouTube Analyzer',
  description: 'Extract transcripts, generate summaries, and analyze sentiment from YouTube videos using AI',
  keywords: ['YouTube', 'AI', 'transcript', 'summary', 'sentiment analysis', 'video analysis'],
  authors: [{ name: 'VidSense Team' }],
  openGraph: {
    title: 'VidSense - AI-Powered YouTube Analyzer',
    description: 'Extract transcripts, generate summaries, and analyze sentiment from YouTube videos using AI',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen">
            <header className="sticky top-0 z-50 backdrop-blur-lg bg-gray-900/80 shadow-2xl border-b border-purple-500/30">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-5">
                  <Link href="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                    <div className="text-4xl animate-float">🎥</div>
                    <h1 className="text-3xl font-extrabold">
                      <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                        VidSense
                      </span>
                    </h1>
                  </Link>
                  <Navigation />
                </div>
              </div>
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}