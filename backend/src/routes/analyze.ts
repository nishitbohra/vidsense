import express, { Request, Response } from 'express'
import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import Video from '../models/Video'
import Summary from '../models/Summary'
import Sentiment from '../models/Sentiment'
import { pythonBridge } from '../services/pythonBridge'

const router = express.Router()

// Validation schema
const analyzeSchema = Joi.object({
  youtube_url: Joi.string()
    .pattern(/^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid YouTube URL format',
      'any.required': 'YouTube URL is required'
    })
})

// Extract video ID from YouTube URL
const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

// Main analyze endpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate request
    const { error, value } = analyzeSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      })
    }

    const { youtube_url } = value
    const videoId = extractVideoId(youtube_url)
    
    if (!videoId) {
      return res.status(400).json({
        error: 'Invalid URL',
        message: 'Could not extract video ID from YouTube URL'
      })
    }

    // Check if video is already analyzed
    const existingVideo = await Video.findOne({ video_id: videoId })
    const existingSummary = await Summary.findOne({ video_id: videoId })
    
    if (existingVideo && existingSummary) {
      const sentiments = await Sentiment.find({ video_id: videoId }).sort({ timestamp: 1 })
      
      return res.json({
        video_id: videoId,
        title: existingVideo.title,
        summary_short: existingSummary.summary_short,
        summary_detailed: existingSummary.summary_detailed,
        topics: existingSummary.topics,
        sentiment_timeline: sentiments.map((s: any) => ({
          timestamp: s.timestamp,
          sentiment_label: s.sentiment_label,
          sentiment_score: s.sentiment_score,
          text_segment: s.text_segment
        })),
        created_at: existingSummary.created_at,
        cached: true
      })
    }

    console.log(`Starting analysis for video: ${videoId}`)
    
    // Step 1: Extract transcript
    console.log('Extracting transcript...')
    const transcriptResult = await pythonBridge.extractTranscript(videoId)
    
    if (!transcriptResult.success || !transcriptResult.data?.success) {
      return res.status(400).json({
        error: 'Transcript Extraction Failed',
        message: transcriptResult.error || transcriptResult.data?.error || 'Could not extract transcript from video'
      })
    }

    // Step 2: Generate summary
    console.log('Generating summary...')
    const fullTranscript = transcriptResult.data.transcript
      .map((segment: any) => segment.text)
      .join(' ')
    
    console.log(`Transcript length: ${fullTranscript.length} characters`)
    console.log(`First 100 chars: ${fullTranscript.substring(0, 100)}`)
    
    const summaryResult = await pythonBridge.generateSummary(fullTranscript)
    
    console.log('Summary result:', JSON.stringify(summaryResult, null, 2))
    
    if (!summaryResult.success || !summaryResult.data?.success) {
      console.error('Summarization failed:', summaryResult.error, summaryResult.stderr)
      return res.status(500).json({
        error: 'Summarization Failed',
        message: summaryResult.error || summaryResult.data?.error || 'Could not generate summary',
        details: summaryResult.stderr || summaryResult.stdout
      })
    }

    // Step 3: Analyze sentiment
    console.log('Analyzing sentiment...')
    const sentimentResult = await pythonBridge.analyzeSentiment(transcriptResult.data.transcript)
    
    console.log('Sentiment result:', JSON.stringify(sentimentResult, null, 2))
    
    if (!sentimentResult.success || !sentimentResult.data?.success) {
      console.error('Sentiment analysis failed:', sentimentResult.error, sentimentResult.stderr, sentimentResult.stdout)
      return res.status(500).json({
        error: 'Sentiment Analysis Failed',
        message: sentimentResult.error || sentimentResult.data?.error || 'Could not analyze sentiment',
        details: sentimentResult.stderr || sentimentResult.stdout
      })
    }

    // Step 4: Generate embeddings
    console.log('Generating embeddings...')
    const embeddingResult = await pythonBridge.generateEmbeddings(
      videoId,
      fullTranscript,
      transcriptResult.data.transcript,
      transcriptResult.data.title,
      summaryResult.data.summary_short
    )
    
    if (!embeddingResult.success) {
      console.warn('Embedding generation failed:', embeddingResult.error)
      // Continue without embeddings - not critical for basic functionality
    }

    // Save to database
    console.log('Saving to database...')
    
    // Delete existing records if any (to avoid duplicate key errors)
    await Video.deleteOne({ video_id: videoId })
    await Summary.deleteOne({ video_id: videoId })
    await Sentiment.deleteMany({ video_id: videoId })
    
    // Save video
    const video = new Video({
      video_id: videoId,
      title: transcriptResult.data.title,
      url: youtube_url,
      transcript: transcriptResult.data.transcript
    })
    await video.save()

    // Save summary
    const summary = new Summary({
      summary_id: uuidv4(),
      video_id: videoId,
      summary_short: summaryResult.data.summary_short,
      summary_detailed: summaryResult.data.summary_detailed,
      topics: summaryResult.data.topics || []
    })
    await summary.save()

    // Save sentiment data
    const sentimentDocs = sentimentResult.data.sentiments.map((sentiment: any) => ({
      segment_id: uuidv4(),
      video_id: videoId,
      timestamp: sentiment.timestamp,
      sentiment_label: sentiment.sentiment_label,
      sentiment_score: sentiment.sentiment_score,
      text_segment: sentiment.text_segment
    }))
    
    await Sentiment.insertMany(sentimentDocs)

    console.log(`Analysis completed for video: ${videoId}`)

    // Return response
    res.json({
      video_id: videoId,
      title: transcriptResult.data.title,
      summary_short: summaryResult.data.summary_short,
      summary_detailed: summaryResult.data.summary_detailed,
      topics: summaryResult.data.topics || [],
      sentiment_timeline: sentimentResult.data.sentiments,
      created_at: summary.created_at,
      cached: false
    })

  } catch (error) {
    console.error('Analysis error:', error)
    res.status(500).json({
      error: 'Analysis Failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      details: 'Please check if the video is public and has captions available'
    })
  }
})

// Get analysis status (for long-running requests)
router.get('/status/:videoId', async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params
    
    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID format'
      })
    }

    const video = await Video.findOne({ video_id: videoId })
    const summary = await Summary.findOne({ video_id: videoId })
    const sentiments = await Sentiment.find({ video_id: videoId }).sort({ timestamp: 1 })

    if (!video) {
      return res.json({
        status: 'not_found',
        message: 'Video not found in database'
      })
    }

    if (!summary) {
      return res.json({
        status: 'processing',
        message: 'Video found, analysis in progress'
      })
    }

    res.json({
      status: 'completed',
      video_id: videoId,
      title: video.title,
      has_summary: !!summary,
      has_sentiments: sentiments.length > 0,
      created_at: video.created_at
    })

  } catch (error) {
    console.error('Status check error:', error)
    res.status(500).json({
      error: 'Status Check Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router