'use client'

import { useState } from 'react'
import { Tag, Search } from 'lucide-react'

interface TopicCloudProps {
  topics: string[]
}

export default function TopicCloud({ topics }: TopicCloudProps) {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const getTopicFrequency = (topics: string[]) => {
    const frequency: { [key: string]: number } = {}
    topics.forEach(topic => {
      frequency[topic] = (frequency[topic] || 0) + 1
    })
    return frequency
  }

  const getTopicSize = (frequency: number, maxFrequency: number) => {
    const minSize = 12
    const maxSize = 24
    const ratio = frequency / maxFrequency
    return minSize + (maxSize - minSize) * ratio
  }

  const getTopicColor = (frequency: number, maxFrequency: number) => {
    const ratio = frequency / maxFrequency
    if (ratio > 0.7) return 'bg-purple-600 text-white'
    if (ratio > 0.4) return 'bg-purple-500 text-white'
    if (ratio > 0.2) return 'bg-purple-400 text-white'
    return 'bg-purple-300 text-purple-900'
  }

  const frequency = getTopicFrequency(topics)
  const maxFrequency = Math.max(...Object.values(frequency))
  const uniqueTopics = Object.keys(frequency)

  const filteredTopics = searchTerm
    ? uniqueTopics.filter(topic => 
        topic.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : uniqueTopics

  const handleTopicClick = (topic: string) => {
    if (selectedTopic === topic) {
      setSelectedTopic(null)
    } else {
      setSelectedTopic(topic)
    }
  }

  const handleSearch = (topic: string) => {
    // This would trigger a semantic search in a real application
    console.log('Searching for topic:', topic)
    // You could emit an event or call a parent function here
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Tag className="h-5 w-5 mr-2" />
          Topic Cloud
        </h3>
        <div className="text-sm text-gray-300">
          {uniqueTopics.length} topics
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Filter topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Topic Cloud */}
      <div className="min-h-[200px] p-4 bg-gray-900/40 rounded-lg border border-gray-700/50">
        {filteredTopics.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {filteredTopics.map((topic, index) => {
              const topicFreq = frequency[topic]
              const size = getTopicSize(topicFreq, maxFrequency)
              const colorClass = getTopicColor(topicFreq, maxFrequency)
              const isSelected = selectedTopic === topic

              return (
                <button
                  key={`${topic}-${index}`}
                  onClick={() => handleTopicClick(topic)}
                  className={`
                    px-3 py-1 rounded-full font-medium transition-all duration-200 
                    hover:scale-105 hover:shadow-md
                    ${isSelected ? 'ring-2 ring-purple-400 ring-offset-2 ring-offset-gray-800' : ''}
                    ${colorClass}
                  `}
                  style={{ fontSize: `${size}px` }}
                  title={`${topic} (appears ${topicFreq} time${topicFreq > 1 ? 's' : ''})`}
                >
                  {topic}
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-gray-400 py-8">
            <Tag className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No topics found matching "{searchTerm}"</p>
          </div>
        )}
      </div>

      {/* Selected Topic Details */}
      {selectedTopic && (
        <div className="mt-4 p-4 bg-purple-900/30 border border-purple-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-white">
                {selectedTopic}
              </h4>
              <p className="text-sm text-gray-300">
                Mentioned {frequency[selectedTopic]} time{frequency[selectedTopic] > 1 ? 's' : ''} in this video
              </p>
            </div>
            <button
              onClick={() => handleSearch(selectedTopic)}
              className="btn btn-primary text-sm flex items-center"
            >
              <Search className="h-3 w-3 mr-1" />
              Search Similar
            </button>
          </div>
        </div>
      )}

      {/* Topic Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Most Frequent:</span>
            <span className="ml-2 font-medium text-white">
              {uniqueTopics.reduce((prev, current) => 
                frequency[current] > frequency[prev] ? current : prev
              )}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Max Frequency:</span>
            <span className="ml-2 font-medium text-white">
              {maxFrequency} mentions
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-gray-700/50">
        <p className="text-xs text-gray-400 mb-2">Topic frequency:</p>
        <div className="flex items-center space-x-4 text-xs text-gray-300">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-300 rounded mr-1"></div>
            <span>Low</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
            <span>Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-600 rounded mr-1"></div>
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  )
}