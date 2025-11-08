'use client'

import { useState } from 'react'
import VideoInput from '../components/VideoInput'
import SummaryDisplay from '../components/SummaryDisplay'
import SentimentChart from '../components/SentimentChart'
import TopicCloud from '../components/TopicCloud'
import SearchInterface from '../components/SearchInterface'

interface AnalysisResult {
  video_id: string
  title: string
  summary_short: string
  summary_detailed: string
  topics: string[]
  sentiment_timeline: Array<{
    timestamp: number
    sentiment_label: 'positive' | 'neutral' | 'negative'
    sentiment_score: number
    text_segment: string
  }>
  created_at: string
}

export default function Dashboard() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalysis = async (youtubeUrl: string) => {
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ youtube_url: youtubeUrl }),
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      setAnalysisResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during analysis')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero Section with Dark Gradient */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 p-12 text-white shadow-2xl border border-purple-500/30">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
        <div className="relative text-center">
          <div className="inline-block mb-6 animate-float">
            <div className="text-6xl drop-shadow-2xl">🎥</div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in-up drop-shadow-lg">
            Unlock the Power of
            <span className="block mt-2 bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Video Intelligence
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
            Transform YouTube videos into actionable insights with AI-powered transcription, 
            summarization, and sentiment analysis.
          </p>
        </div>
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      {/* Video Input Section with Enhanced Card */}
      <div className="card-gradient max-w-2xl mx-auto transform hover:scale-105 transition-transform duration-300">
        <VideoInput 
          onAnalyze={handleAnalysis} 
          isLoading={isLoading}
        />
        {error && (
          <div className="mt-4 p-4 bg-gradient-to-r from-red-900/80 to-pink-900/80 border border-red-500/50 rounded-xl animate-shake backdrop-blur-sm">
            <div className="flex items-center">
              <span className="text-2xl mr-3">❌</span>
              <p className="text-red-200 font-medium">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading State with Modern Animation */}
      {isLoading && (
        <div className="card-gradient max-w-2xl mx-auto animate-fade-in">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600"></div>
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent absolute top-0"></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-100 mb-4">Analyzing your video...</h3>
            <p className="text-gray-300 mb-6">This may take a few minutes. Please wait.</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-gradient-to-br from-blue-900/60 to-cyan-900/60 rounded-xl animate-pulse border border-blue-500/30">
                <span className="text-3xl mb-2 block">📝</span>
                <p className="font-medium text-gray-200">Extracting Transcript</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-900/60 to-pink-900/60 rounded-xl animate-pulse animation-delay-200 border border-purple-500/30">
                <span className="text-3xl mb-2 block">🤖</span>
                <p className="font-medium text-gray-200">AI Summary</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-900/60 to-emerald-900/60 rounded-xl animate-pulse animation-delay-300 border border-green-500/30">
                <span className="text-3xl mb-2 block">💭</span>
                <p className="font-medium text-gray-200">Sentiment Analysis</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-900/60 to-yellow-900/60 rounded-xl animate-pulse animation-delay-500 border border-orange-500/30">
                <span className="text-3xl mb-2 block">🔍</span>
                <p className="font-medium text-gray-200">Creating Embeddings</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-8 animate-fade-in">
          {/* Video Title Card */}
          <div className="card-gradient text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 via-blue-900/30 to-cyan-900/30"></div>
            <div className="relative">
              <span className="text-4xl mb-4 block drop-shadow-lg">🎬</span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-2 drop-shadow-lg">
                {analysisResult.title}
              </h2>
              <p className="text-sm text-gray-400">Video ID: {analysisResult.video_id}</p>
            </div>
          </div>

          {/* Summary and Topics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="transform hover:scale-105 transition-transform duration-300">
              <SummaryDisplay 
                title={analysisResult.title}
                summaryShort={analysisResult.summary_short}
                summaryDetailed={analysisResult.summary_detailed}
                videoId={analysisResult.video_id}
              />
            </div>
            <div className="transform hover:scale-105 transition-transform duration-300">
              <TopicCloud topics={analysisResult.topics} />
            </div>
          </div>

          {/* Sentiment Chart */}
          <div className="card-gradient transform hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <span className="text-3xl mr-3">📊</span>
              <h3 className="text-2xl font-bold text-gray-100">
                Sentiment Analysis Timeline
              </h3>
            </div>
            <SentimentChart sentimentData={analysisResult.sentiment_timeline} />
          </div>
        </div>
      )}

      {/* Search Section */}
      <div className="card-gradient">
        <div className="flex items-center mb-6">
          <span className="text-3xl mr-3">🔍</span>
          <div>
            <h3 className="text-2xl font-bold text-gray-100">Semantic Search</h3>
            <p className="text-gray-300 mt-1">
              Find similar videos using AI-powered semantic search
            </p>
          </div>
        </div>
        <SearchInterface />
      </div>

      {/* Features Section with Gradient Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="card-feature group bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">🎯</div>
          <h3 className="text-xl font-bold text-white mb-3">Smart Analysis</h3>
          <p className="text-blue-100">
            Automatically extract transcripts and generate intelligent summaries using advanced AI models.
          </p>
        </div>
        <div className="card-feature group bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700">
          <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">💭</div>
          <h3 className="text-xl font-bold text-white mb-3">Sentiment Insights</h3>
          <p className="text-purple-100">
            Track emotional sentiment throughout the video timeline to understand audience engagement.
          </p>
        </div>
        <div className="card-feature group bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
          <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">🔍</div>
          <h3 className="text-xl font-bold text-white mb-3">Semantic Search</h3>
          <p className="text-cyan-100">
            Discover related content using AI-powered embeddings and similarity matching.
          </p>
        </div>
      </div>
    </div>
  )
}
