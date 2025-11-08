'use client'

import { useState } from 'react'
import { Search, ExternalLink, Clock, TrendingUp } from 'lucide-react'

interface SearchResult {
  video_id: string
  title: string
  similarity_score: number
  url?: string
  thumbnail?: string
}

interface SearchInterfaceProps {
  onSearch?: (query: string) => Promise<SearchResult[]>
}

export default function SearchInterface({ onSearch }: SearchInterfaceProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      let searchResults: SearchResult[]

      if (onSearch) {
        searchResults = await onSearch(query.trim())
      } else {
        // Default API call
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: query.trim(),
            limit: 10 
          }),
        })

        if (!response.ok) {
          throw new Error(`Search failed: ${response.statusText}`)
        }

        const data = await response.json()
        searchResults = data.results || []
      }

      setResults(searchResults)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getSimilarityColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-50'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getSimilarityLabel = (score: number): string => {
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Medium'
    return 'Low'
  }

  const getYouTubeUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`

  const recentSearches = [
    'machine learning basics',
    'react tutorial',
    'climate change solutions',
    'cooking techniques'
  ]

  return (
    <div className="space-y-6">
      {/* Search Form with Gradient */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition-opacity"></div>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for similar videos by topic, content, or theme..."
              className="input pl-14 pr-36 text-lg shadow-lg"
              disabled={isLoading}
            />
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-purple-500" />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 btn btn-primary px-6 py-2 text-sm disabled:opacity-50 shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Searching...
                </span>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Recent Searches with Modern Cards */}
      {!query && results.length === 0 && !isLoading && (
        <div className="bg-gradient-to-br from-gray-800/80 to-blue-900/80 rounded-2xl p-6 border border-gray-700">
          <h4 className="text-base font-semibold text-gray-100 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-purple-400" />
            Try searching for:
          </h4>
          <div className="flex flex-wrap gap-3">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => setQuery(search)}
                className="px-4 py-2 text-sm font-medium bg-gray-700 border-2 border-purple-500/50 rounded-xl hover:bg-gray-600 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 shadow-sm text-gray-200"
              >
                🔍 {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error State with Animation */}
      {error && (
        <div className="bg-gradient-to-r from-red-900/80 to-pink-900/80 border-2 border-red-500/50 rounded-2xl p-4 animate-shake backdrop-blur-sm">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <p className="text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State with Modern Animation */}
      {isLoading && (
        <div className="text-center py-12 bg-gradient-to-br from-purple-900/60 to-blue-900/60 rounded-2xl border border-purple-500/30">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-800"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-400 border-t-transparent absolute top-0"></div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-100">Searching similar videos...</p>
              <p className="text-sm text-gray-300">Using AI-powered semantic search</p>
            </div>
          </div>
        </div>
      )}

      {/* Search Results with Modern Cards */}
      {results.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-gradient-to-r from-purple-900/60 to-blue-900/60 rounded-xl p-4 border border-purple-500/30">
            <h4 className="text-lg font-semibold text-gray-100 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-400" />
              Found {results.length} similar video{results.length !== 1 ? 's' : ''}
            </h4>
            <div className="text-sm text-gray-300 font-medium">
              Sorted by similarity
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {results.map((result, index) => (
              <div
                key={`${result.video_id}-${index}`}
                className="group bg-gradient-to-br from-gray-800/90 to-gray-900/90 border-2 border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:shadow-purple-500/20 hover:border-purple-500 transition-all duration-300 transform hover:scale-102"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 mr-4">
                    <h5 className="text-base font-semibold text-gray-100 line-clamp-2 mb-3 group-hover:text-purple-400 transition-colors">
                      {result.title}
                    </h5>
                    <div className="flex items-center space-x-3">
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm ${getSimilarityColor(result.similarity_score)}`}>
                        {getSimilarityLabel(result.similarity_score)} similarity
                      </div>
                      <span className="text-sm text-gray-300 font-medium">
                        {(result.similarity_score * 100).toFixed(1)}% match
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <a
                      href={result.url || getYouTubeUrl(result.video_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results with Modern Design */}
      {!isLoading && query && results.length === 0 && !error && (
        <div className="text-center py-16 bg-gradient-to-br from-gray-800/80 to-blue-900/80 rounded-2xl border-2 border-dashed border-gray-600">
          <div className="animate-float mb-6">
            <Search className="h-16 w-16 mx-auto text-gray-400" />
          </div>
          <h4 className="text-xl font-bold text-gray-100 mb-2">No similar videos found</h4>
          <p className="text-sm text-gray-300 mb-6 max-w-md mx-auto">
            Try different keywords or analyze more videos to build the database.
          </p>
          <button
            onClick={() => setQuery('')}
            className="btn btn-secondary text-sm shadow-lg"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Search Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Search Tips:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use descriptive keywords about the video content</li>
          <li>• Try broader terms if you don't find results</li>
          <li>• Search works best with analyzed videos in our database</li>
          <li>• Results are ranked by semantic similarity</li>
        </ul>
      </div>
    </div>
  )
}