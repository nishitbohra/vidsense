import express from 'express'
import Video from '../models/Video'
import Summary from '../models/Summary'
import Sentiment from '../models/Sentiment'
import { authenticate } from '../middleware/auth'

const router = express.Router()

// Get all analyzed videos
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'Invalid pagination parameters',
        message: 'Page must be >= 1, limit must be between 1 and 100'
      })
    }

    console.log(`Fetching videos: page ${page}, limit ${limit}`)

    // Get videos with their summaries
    const videos = await Video.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Video.countDocuments({})

    // Enrich videos with summary data
    const enrichedVideos = []
    for (const video of videos) {
      try {
        const summary = await Summary.findByVideoId(video.video_id)
        
        enrichedVideos.push({
          video_id: video.video_id,
          title: video.title,
          url: video.url,
          summary_short: summary?.summary_short || null,
          summary_detailed: summary?.summary_detailed || null,
          topics: summary?.topics || [],
          transcript_length: video.transcript?.length || 0,
          duration: video.transcript?.reduce((total, segment) => total + segment.duration, 0) || 0,
          created_at: video.created_at,
          updated_at: video.updated_at,
          has_summary: !!summary,
          has_sentiments: false // Will be checked separately if needed
        })
      } catch (error) {
        console.error(`Error enriching video ${video.video_id}:`, error)
        // Include basic video data even if enrichment fails
        enrichedVideos.push({
          video_id: video.video_id,
          title: video.title,
          url: video.url,
          created_at: video.created_at,
          error: 'Failed to load additional data'
        })
      }
    }

    res.json({
      videos: enrichedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Get videos error:', error)
    res.status(500).json({
      error: 'Failed to fetch videos',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get specific video details
router.get('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params

    // Validate video ID format
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID format',
        message: 'Video ID must be an 11-character YouTube video ID'
      })
    }

    console.log(`Fetching details for video: ${videoId}`)

    // Get video data
    const video = await Video.findByVideoId(videoId)
    if (!video) {
      return res.status(404).json({
        error: 'Video not found',
        message: 'The specified video has not been analyzed yet'
      })
    }

    // Get summary data
    const summary = await Summary.findByVideoId(videoId)
    
    // Get sentiment data
    const sentiments = await Sentiment.findByVideoId(videoId)
    
    // Calculate video statistics
    const totalDuration = video.transcript.reduce((total, segment) => total + segment.duration, 0)
    const totalWords = video.transcript.reduce((total, segment) => total + segment.text.split(' ').length, 0)
    
    // Calculate sentiment statistics
    let sentimentStats = {
      positive: 0,
      neutral: 0,
      negative: 0,
      averageScore: 0
    }
    
    if (sentiments.length > 0) {
      const positiveCount = sentiments.filter(s => s.sentiment_score > 0.1).length
      const negativeCount = sentiments.filter(s => s.sentiment_score < -0.1).length
      const neutralCount = sentiments.length - positiveCount - negativeCount
      const totalScore = sentiments.reduce((sum, s) => sum + s.sentiment_score, 0)
      
      sentimentStats = {
        positive: Math.round((positiveCount / sentiments.length) * 100),
        neutral: Math.round((neutralCount / sentiments.length) * 100),
        negative: Math.round((negativeCount / sentiments.length) * 100),
        averageScore: Math.round((totalScore / sentiments.length) * 1000) / 1000
      }
    }

    // Format response
    const videoDetails = {
      video_id: videoId,
      title: video.title,
      url: video.url,
      summary_short: summary?.summary_short || null,
      summary_detailed: summary?.summary_detailed || null,
      topics: summary?.topics || [],
      transcript: video.transcript,
      sentiment_timeline: sentiments.map(s => ({
        timestamp: s.timestamp,
        sentiment_label: s.sentiment_label,
        sentiment_score: s.sentiment_score,
        text_segment: s.text_segment
      })),
      statistics: {
        duration_seconds: Math.round(totalDuration),
        transcript_segments: video.transcript.length,
        word_count: totalWords,
        sentiment_segments: sentiments.length,
        ...sentimentStats
      },
      created_at: video.created_at,
      updated_at: video.updated_at,
      summary_created_at: summary?.created_at || null
    }

    res.json(videoDetails)

  } catch (error) {
    console.error('Get video details error:', error)
    res.status(500).json({
      error: 'Failed to fetch video details',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get video transcript only
router.get('/:videoId/transcript', async (req, res) => {
  try {
    const { videoId } = req.params

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID format'
      })
    }

    const video = await Video.findByVideoId(videoId)
    if (!video) {
      return res.status(404).json({
        error: 'Video not found'
      })
    }

    res.json({
      video_id: videoId,
      title: video.title,
      transcript: video.transcript,
      total_segments: video.transcript.length,
      total_duration: video.transcript.reduce((total, segment) => total + segment.duration, 0)
    })

  } catch (error) {
    console.error('Get transcript error:', error)
    res.status(500).json({
      error: 'Failed to fetch transcript',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get video sentiment data only
router.get('/:videoId/sentiment', async (req, res) => {
  try {
    const { videoId } = req.params

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID format'
      })
    }

    const video = await Video.findByVideoId(videoId)
    if (!video) {
      return res.status(404).json({
        error: 'Video not found'
      })
    }

    const sentiments = await Sentiment.findByVideoId(videoId)

    // Get sentiment statistics
    const stats = await Sentiment.getVideoSentimentStats(videoId)

    res.json({
      video_id: videoId,
      title: video.title,
      sentiment_timeline: sentiments.map(s => ({
        timestamp: s.timestamp,
        sentiment_label: s.sentiment_label,
        sentiment_score: s.sentiment_score,
        text_segment: s.text_segment
      })),
      statistics: stats,
      total_segments: sentiments.length
    })

  } catch (error) {
    console.error('Get sentiment error:', error)
    res.status(500).json({
      error: 'Failed to fetch sentiment data',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete a video and all its associated data
router.delete('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID format'
      })
    }

    console.log(`Deleting video: ${videoId}`)

    // Check if video exists
    const video = await Video.findByVideoId(videoId)
    if (!video) {
      return res.status(404).json({
        error: 'Video not found'
      })
    }

    // Delete all associated data
    await Promise.all([
      Video.deleteOne({ video_id: videoId }),
      Summary.deleteOne({ video_id: videoId }),
      Sentiment.deleteMany({ video_id: videoId })
    ])

    // TODO: Also delete from ChromaDB if implemented
    // await deleteFromChromaDB(videoId)

    res.json({
      message: 'Video and all associated data deleted successfully',
      video_id: videoId,
      title: video.title
    })

  } catch (error) {
    console.error('Delete video error:', error)
    res.status(500).json({
      error: 'Failed to delete video',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update video metadata (title, etc.)
router.put('/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    const { title } = req.body

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID format'
      })
    }

    console.log(`Updating video: ${videoId}`)

    const video = await Video.findByVideoId(videoId)
    if (!video) {
      return res.status(404).json({
        error: 'Video not found'
      })
    }

    // Update fields
    if (title) {
      video.title = title
      await video.save()
    }

    res.json({
      message: 'Video updated successfully',
      video: {
        video_id: video.video_id,
        title: video.title,
        url: video.url,
        updated_at: video.updated_at
      }
    })

  } catch (error) {
    console.error('Update video error:', error)
    res.status(500).json({
      error: 'Failed to update video',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ==================== CRUD OPERATIONS ====================

// Create video
router.post('/', authenticate, async (req, res) => {
  try {
    const { videoId, title, url, channelTitle, description, publishedAt, duration, viewCount, thumbnail } = req.body

    if (!videoId || !title || !url) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'videoId, title, and url are required'
      })
    }

    // Check if video already exists
    const existingVideo = await Video.findByVideoId(videoId)
    if (existingVideo) {
      return res.status(409).json({
        error: 'Video already exists',
        message: `Video with ID ${videoId} is already in the database`
      })
    }

    // Create new video
    const video = new Video({
      video_id: videoId,
      title,
      url,
      transcript: []  // Transcript will be added separately via analyze endpoint
    })

    await video.save()

    res.status(201).json({
      message: 'Video created successfully',
      video: {
        video_id: video.video_id,
        title: video.title,
        url: video.url,
        created_at: video.created_at
      }
    })

  } catch (error) {
    console.error('Create video error:', error)
    res.status(500).json({
      error: 'Failed to create video',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update video
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params
    const { title, url } = req.body

    const video = await Video.findOne({ video_id: id })
    
    if (!video) {
      return res.status(404).json({
        error: 'Video not found',
        message: `Video with ID ${id} not found`
      })
    }

    // Update fields
    if (title) video.title = title
    if (url) video.url = url

    await video.save()

    res.json({
      message: 'Video updated successfully',
      video: {
        video_id: video.video_id,
        title: video.title,
        url: video.url,
        updated_at: video.updated_at
      }
    })

  } catch (error) {
    console.error('Update video error:', error)
    res.status(500).json({
      error: 'Failed to update video',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete video
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params

    const video = await Video.findOne({ video_id: id })
    
    if (!video) {
      return res.status(404).json({
        error: 'Video not found',
        message: `Video with ID ${id} not found`
      })
    }

    // Delete associated data
    const [summariesDeleted, sentimentsDeleted] = await Promise.all([
      Summary.deleteMany({ video_id: id }),
      Sentiment.deleteMany({ video_id: id })
    ])

    // Delete video
    await Video.deleteOne({ video_id: id })

    res.json({
      message: 'Video and associated data deleted successfully',
      deletedCounts: {
        summaries: summariesDeleted.deletedCount,
        sentiments: sentimentsDeleted.deletedCount
      }
    })

  } catch (error) {
    console.error('Delete video error:', error)
    res.status(500).json({
      error: 'Failed to delete video',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get database statistics
router.get('/stats/overview', async (req, res) => {
  try {
    console.log('Fetching database statistics...')

    const [
      totalVideos,
      totalSummaries,
      totalSentiments,
      recentVideos,
      topTopics
    ] = await Promise.all([
      Video.countDocuments({}),
      Summary.countDocuments({}),
      Sentiment.countDocuments({}),
      Video.find({}).sort({ created_at: -1 }).limit(5).select('video_id title created_at'),
      Summary.aggregate([
        { $unwind: '$topics' },
        { $group: { _id: '$topics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ])

    res.json({
      statistics: {
        total_videos: totalVideos,
        total_summaries: totalSummaries,
        total_sentiment_segments: totalSentiments,
        completion_rate: totalVideos > 0 ? Math.round((totalSummaries / totalVideos) * 100) : 0
      },
      recent_videos: recentVideos,
      popular_topics: topTopics.map(topic => ({
        name: topic._id,
        count: topic.count
      }))
    })

  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router