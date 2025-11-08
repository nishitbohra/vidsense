'use client'

import SearchInterface from '../components/SearchInterface'

export default function SearchPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-900 via-blue-900 to-purple-900 p-12 text-white shadow-2xl border border-cyan-500/30">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative text-center">
          <div className="inline-block mb-6 animate-float">
            <div className="text-6xl drop-shadow-2xl">🔍</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 drop-shadow-lg">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Semantic Search
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            Find similar videos using AI-powered semantic search. Search by topics, themes, or natural language queries.
          </p>
        </div>
        {/* Animated background elements */}
        <div className="absolute top-10 right-10 w-32 h-32 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      {/* Search Interface */}
      <div className="card-gradient">
        <SearchInterface />
      </div>

      {/* How It Works Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card group hover:scale-105 transition-transform duration-300">
          <div className="text-4xl mb-4">🧠</div>
          <h3 className="text-xl font-bold text-white mb-3">AI-Powered</h3>
          <p className="text-gray-300">
            Uses advanced embeddings to understand the semantic meaning of your search query.
          </p>
        </div>
        <div className="card group hover:scale-105 transition-transform duration-300">
          <div className="text-4xl mb-4">⚡</div>
          <h3 className="text-xl font-bold text-white mb-3">Lightning Fast</h3>
          <p className="text-gray-300">
            Powered by ChromaDB vector database for instant similarity search across thousands of videos.
          </p>
        </div>
        <div className="card group hover:scale-105 transition-transform duration-300">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-xl font-bold text-white mb-3">Highly Accurate</h3>
          <p className="text-gray-300">
            Finds videos based on content similarity, not just keyword matching.
          </p>
        </div>
      </div>

      {/* Tips Section */}
      <div className="card-gradient">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="text-3xl mr-3">💡</span>
          Search Tips
        </h2>
        <div className="space-y-4 text-gray-300">
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">•</span>
            <p>
              <strong className="text-white">Use natural language:</strong> Type complete sentences or phrases like "how to build a website" or "cooking recipes for beginners"
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">•</span>
            <p>
              <strong className="text-white">Be specific:</strong> More detailed queries often yield better results
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">•</span>
            <p>
              <strong className="text-white">Topic-based search:</strong> Search for themes like "machine learning", "travel vlogs", or "product reviews"
            </p>
          </div>
          <div className="flex items-start space-x-3">
            <span className="text-purple-400 font-bold">•</span>
            <p>
              <strong className="text-white">Similarity scores:</strong> Higher scores (closer to 1.0) indicate stronger content similarity
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
