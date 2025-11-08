'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface SentimentDataPoint {
  timestamp: number
  sentiment_label: 'positive' | 'neutral' | 'negative'
  sentiment_score: number
  text_segment: string
}

interface SentimentChartProps {
  sentimentData: SentimentDataPoint[]
}

export default function SentimentChart({ sentimentData }: SentimentChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null)

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getColorForSentiment = (score: number): string => {
    if (score > 0.1) return 'rgba(34, 197, 94, 0.8)' // Green for positive
    if (score < -0.1) return 'rgba(239, 68, 68, 0.8)' // Red for negative
    return 'rgba(234, 179, 8, 0.8)' // Yellow for neutral
  }

  const getBorderColorForSentiment = (score: number): string => {
    if (score > 0.1) return 'rgba(34, 197, 94, 1)'
    if (score < -0.1) return 'rgba(239, 68, 68, 1)'
    return 'rgba(234, 179, 8, 1)'
  }

  // Prepare data for Chart.js
  const chartData = {
    labels: sentimentData.map(point => formatTimestamp(Math.floor(point.timestamp))),
    datasets: [
      {
        label: 'Sentiment Score',
        data: sentimentData.map(point => point.sentiment_score),
        borderColor: sentimentData.map(point => getBorderColorForSentiment(point.sentiment_score)),
        backgroundColor: sentimentData.map(point => getColorForSentiment(point.sentiment_score)),
        pointBackgroundColor: sentimentData.map(point => getBorderColorForSentiment(point.sentiment_score)),
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
        tension: 0.3,
        segment: {
          borderColor: (ctx: any) => {
            const point = sentimentData[ctx.p0DataIndex]
            return point ? getBorderColorForSentiment(point.sentiment_score) : 'rgba(156, 163, 175, 1)'
          }
        }
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: false,
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: TooltipItem<'line'>[]) => {
            const index = tooltipItems[0].dataIndex
            const point = sentimentData[index]
            return `Time: ${formatTimestamp(Math.floor(point.timestamp))}`
          },
          label: (tooltipItem: TooltipItem<'line'>) => {
            const index = tooltipItem.dataIndex
            const point = sentimentData[index]
            const score = point.sentiment_score.toFixed(3)
            const label = point.sentiment_label.charAt(0).toUpperCase() + point.sentiment_label.slice(1)
            return [
              `Sentiment: ${label} (${score})`,
              `Text: "${point.text_segment.substring(0, 100)}${point.text_segment.length > 100 ? '...' : ''}"`
            ]
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Video Timeline',
          color: '#e5e7eb', // Light gray for dark theme
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        ticks: {
          color: '#d1d5db', // Light gray for timestamps
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.1)' // Very subtle grid lines
        }
      },
      y: {
        title: {
          display: true,
          text: 'Sentiment Score',
          color: '#e5e7eb', // Light gray for dark theme
          font: {
            size: 14,
            weight: 'bold' as const
          }
        },
        min: -1,
        max: 1,
        ticks: {
          color: '#d1d5db', // Light gray for values
          font: {
            size: 12
          },
          callback: (value: any) => {
            if (value === 1) return 'Positive (+1)'
            if (value === 0) return 'Neutral (0)'
            if (value === -1) return 'Negative (-1)'
            return value.toFixed(1)
          }
        },
        grid: {
          color: (context: any) => {
            if (context.tick.value === 0) {
              return 'rgba(255, 255, 255, 0.3)' // More visible zero line
            }
            return 'rgba(255, 255, 255, 0.1)' // Subtle grid lines
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }

  const getSentimentSummary = () => {
    const positive = sentimentData.filter(point => point.sentiment_score > 0.1).length
    const negative = sentimentData.filter(point => point.sentiment_score < -0.1).length
    const neutral = sentimentData.length - positive - negative
    const total = sentimentData.length

    return {
      positive: ((positive / total) * 100).toFixed(1),
      negative: ((negative / total) * 100).toFixed(1),
      neutral: ((neutral / total) * 100).toFixed(1),
      averageScore: (sentimentData.reduce((sum, point) => sum + point.sentiment_score, 0) / total).toFixed(3)
    }
  }

  const summary = getSentimentSummary()

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="text-center p-3 bg-green-900/30 rounded-lg border border-green-500/50 backdrop-blur-sm">
          <div className="text-lg font-semibold text-green-400">{summary.positive}%</div>
          <div className="text-sm text-green-300">Positive</div>
        </div>
        <div className="text-center p-3 bg-yellow-900/30 rounded-lg border border-yellow-500/50 backdrop-blur-sm">
          <div className="text-lg font-semibold text-yellow-400">{summary.neutral}%</div>
          <div className="text-sm text-yellow-300">Neutral</div>
        </div>
        <div className="text-center p-3 bg-red-900/30 rounded-lg border border-red-500/50 backdrop-blur-sm">
          <div className="text-lg font-semibold text-red-400">{summary.negative}%</div>
          <div className="text-sm text-red-300">Negative</div>
        </div>
        <div className="text-center p-3 bg-blue-900/30 rounded-lg border border-blue-500/50 backdrop-blur-sm">
          <div className="text-lg font-semibold text-blue-400">{summary.averageScore}</div>
          <div className="text-sm text-blue-300">Avg Score</div>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm text-gray-300">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Positive</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span>Neutral</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Negative</span>
        </div>
      </div>
    </div>
  )
}