'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink, FileText } from 'lucide-react'

interface SummaryDisplayProps {
  title: string
  summaryShort: string
  summaryDetailed: string
  videoId: string
}

export default function SummaryDisplay({ title, summaryShort, summaryDetailed, videoId }: SummaryDisplayProps) {
  const [activeTab, setActiveTab] = useState<'short' | 'detailed'>('short')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(type)
      setTimeout(() => setCopiedText(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const getYouTubeUrl = (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
            {title}
          </h3>
          <a
            href={getYouTubeUrl(videoId)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View on YouTube
          </a>
        </div>
        <div className="ml-4">
          <FileText className="h-6 w-6 text-gray-400" />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-900/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('short')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'short'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          Quick Summary
        </button>
        <button
          onClick={() => setActiveTab('detailed')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'detailed'
              ? 'bg-purple-600 text-white shadow-lg'
              : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
          }`}
        >
          Detailed Summary
        </button>
      </div>

      {/* Summary Content */}
      <div className="relative">
        <div className="bg-gray-900/40 rounded-lg p-4 min-h-[120px] border border-gray-700/50">
          <p className="text-gray-100 leading-relaxed">
            {activeTab === 'short' ? summaryShort : summaryDetailed}
          </p>
        </div>

        {/* Copy Button */}
        <button
          onClick={() => handleCopy(
            activeTab === 'short' ? summaryShort : summaryDetailed,
            activeTab
          )}
          className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-md transition-colors"
          title="Copy to clipboard"
        >
          {copiedText === activeTab ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Word Count */}
      <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
        <span>
          {activeTab === 'short' ? 'Quick' : 'Detailed'} Summary
        </span>
        <span>
          {(activeTab === 'short' ? summaryShort : summaryDetailed).split(' ').length} words
        </span>
      </div>

      {/* Export Options */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="flex space-x-2">
          <button
            onClick={() => handleCopy(`${title}\n\n${summaryShort}\n\n${summaryDetailed}`, 'full')}
            className="btn btn-secondary text-xs flex items-center"
          >
            {copiedText === 'full' ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy All
              </>
            )}
          </button>
          <button
            onClick={() => {
              const content = `${title}\n\n${summaryShort}\n\n${summaryDetailed}`
              const blob = new Blob([content], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }}
            className="btn btn-secondary text-xs flex items-center"
          >
            <FileText className="h-3 w-3 mr-1" />
            Download
          </button>
        </div>
      </div>
    </div>
  )
}