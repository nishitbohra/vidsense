import express from 'express'
import Joi from 'joi'
import { spawn } from 'child_process'
import path from 'path'
import Video from '../models/Video'
import Summary from '../models/Summary'

const router = express.Router()

// Validation schema
const searchSchema = Joi.object({
  query: Joi.string()
    .min(1)
    .max(500)
    .required()
    .messages({
      'string.min': 'Search query cannot be empty',
      'string.max': 'Search query is too long (max 500 characters)',
      'any.required': 'Search query is required'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50'
    })
})

// Execute Python semantic search
const executeSemanticSearch = (query: string, limit: number): Promise<any> => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, '../../python', 'semantic_search.py')
    console.log(`Executing semantic search: python ${scriptPath} "${query}" ${limit}`)
    
    const pythonProcess = spawn('python', [scriptPath, query, limit.toString()], {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 120000 // 120 seconds timeout (TensorFlow model loading can be slow)
    })

    let stdout = ''
    let stderr = ''

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    pythonProcess.on('close', (code, signal) => {
      // Handle timeout explicitly
      if (signal === 'SIGTERM') {
        console.error('Semantic search process timed out')
        reject(new Error('Semantic search timed out - consider optimizing or increasing timeout'))
        return
      }
      
      console.log(`Semantic search process exited with code ${code}`)
      if (stderr) console.log(`Semantic search stderr: ${stderr.substring(0, 500)}`)
      
      if (code === 0) {
        try {
          const result = JSON.parse(stdout)
          console.log(`Successfully parsed semantic search result`)
          resolve(result)
        } catch (error) {
          console.error(`Failed to parse semantic search output: ${error}`)
          console.error(`stdout was: ${stdout.substring(0, 500)}`)
          reject(new Error(`Failed to parse semantic search output: ${error}`))
        }
      } else {
        console.error(`Semantic search process failed with code ${code}`)
        reject(new Error(`Semantic search failed with code ${code}: ${stderr}`))
      }
    })

    pythonProcess.on('error', (error) => {
      console.error(`Failed to spawn semantic search process: ${error.message}`)
      reject(new Error(`Failed to execute semantic search: ${error.message}`))
    })
  })
}

// Main search endpoint
router.post('/', async (req, res) => {
  try {
    // Validate request
    const { error, value } = searchSchema.validate(req.body)
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message
      })
    }

    const { query, limit } = value

    console.log(`Searching for: "${query}" (limit: ${limit})`)

    // Try semantic search first (if ChromaDB is available)
    let semanticResults: any[] = []
    try {
      const semanticSearchResult = await executeSemanticSearch(query, limit)
      console.log('Semantic search result:', JSON.stringify(semanticSearchResult, null, 2))
      if (semanticSearchResult.success) {
        semanticResults = semanticSearchResult.results || []
        console.log(`Semantic search returned ${semanticResults.length} results`)
      } else {
        console.warn('Semantic search returned success=false:', semanticSearchResult.error)
      }
    } catch (error) {
      console.error('Semantic search failed with exception, falling back to text search:', error)
    }

    // Fallback to MongoDB text search if semantic search fails or returns no results
    let fallbackResults: any[] = []
    if (semanticResults.length === 0) {
      console.log('Semantic search returned no results. Performing fallback text search...')
      
      // Search in summaries
      const summaryResults = await Summary.searchSummaries(query, limit)
      
      // Search in video titles
      const videoResults = await Video.searchByTitle(query, limit)
      
      // Combine and deduplicate results
      const allResults = [
        ...summaryResults.map(summary => ({
          video_id: summary.video_id,
          source: 'summary',
          score: (summary as any).score || 0.5,
          summary
        })),
        ...videoResults.map(video => ({
          video_id: video.video_id,
          source: 'title',
          score: (video as any).score || 0.3,
          video
        }))
      ]
      
      // Remove duplicates and sort by score
      const uniqueResults = allResults.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.video_id === current.video_id)
        if (existingIndex >= 0) {
          // Keep the one with higher score
          if (current.score > acc[existingIndex].score) {
            acc[existingIndex] = current
          }
        } else {
          acc.push(current)
        }
        return acc
      }, [] as any[])
      
      fallbackResults = uniqueResults
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    }

    // Format results
    const results = semanticResults.length > 0 ? semanticResults : fallbackResults
    const formattedResults = []

    for (const result of results) {
      try {
        // Get video and summary data
        const video = await Video.findByVideoId(result.video_id)
        const summary = await Summary.findByVideoId(result.video_id)
        
        if (video && summary) {
          formattedResults.push({
            video_id: result.video_id,
            title: video.title,
            similarity_score: result.similarity_score || result.score || 0,
            url: video.url,
            summary_short: summary.summary_short,
            topics: summary.topics,
            created_at: summary.created_at
          })
        }
      } catch (error) {
        console.error(`Error formatting result for video ${result.video_id}:`, error)
      }
    }

    // Sort by similarity score (descending)
    formattedResults.sort((a, b) => b.similarity_score - a.similarity_score)

    res.json({
      results: formattedResults,
      total: formattedResults.length,
      query,
      search_type: semanticResults.length > 0 ? 'semantic' : 'text',
      message: formattedResults.length === 0 
        ? 'No similar videos found. Try analyzing more videos or using different keywords.'
        : undefined
    })

  } catch (error) {
    console.error('Search error:', error)
    res.status(500).json({
      error: 'Search Failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    })
  }
})

// Get similar videos by video ID
router.get('/similar/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params
    const limit = parseInt(req.query.limit as string) || 5

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return res.status(400).json({
        error: 'Invalid video ID format'
      })
    }

    // Get the video's summary to use as search query
    const summary = await Summary.findByVideoId(videoId)
    if (!summary) {
      return res.status(404).json({
        error: 'Video not found',
        message: 'The specified video has not been analyzed yet'
      })
    }

    // Use the summary as search query
    const searchQuery = summary.summary_short
    
    console.log(`Finding similar videos to ${videoId}`)

    // Execute semantic search
    let semanticResults: any[] = []
    try {
      const semanticSearchResult = await executeSemanticSearch(searchQuery, limit + 1) // +1 to account for self
      if (semanticSearchResult.success) {
        semanticResults = semanticSearchResult.results || []
        // Remove the original video from results
        semanticResults = semanticResults.filter(result => result.video_id !== videoId)
      }
    } catch (error) {
      console.warn('Semantic search failed for similar videos:', error)
    }

    // Fallback to topic-based search
    let fallbackResults: any[] = []
    if (semanticResults.length === 0 && summary.topics.length > 0) {
      console.log('Using topic-based fallback search...')
      
      const topicQuery = summary.topics.slice(0, 3).join(' ') // Use top 3 topics
      const summaryResults = await Summary.searchSummaries(topicQuery, limit + 1)
      
      fallbackResults = summaryResults
        .filter(s => s.video_id !== videoId) // Exclude original video
        .slice(0, limit)
        .map(s => ({
          video_id: s.video_id,
          similarity_score: 0.6, // Default score for topic-based results
          source: 'topics'
        }))
    }

    const results = semanticResults.length > 0 ? semanticResults : fallbackResults
    const formattedResults = []

    for (const result of results.slice(0, limit)) {
      try {
        const video = await Video.findByVideoId(result.video_id)
        const resultSummary = await Summary.findByVideoId(result.video_id)
        
        if (video && resultSummary) {
          formattedResults.push({
            video_id: result.video_id,
            title: video.title,
            similarity_score: result.similarity_score || 0.6,
            url: video.url,
            summary_short: resultSummary.summary_short,
            topics: resultSummary.topics,
            created_at: resultSummary.created_at
          })
        }
      } catch (error) {
        console.error(`Error formatting similar video result for ${result.video_id}:`, error)
      }
    }

    res.json({
      results: formattedResults,
      total: formattedResults.length,
      reference_video_id: videoId,
      search_type: semanticResults.length > 0 ? 'semantic' : 'topic-based'
    })

  } catch (error) {
    console.error('Similar videos search error:', error)
    res.status(500).json({
      error: 'Similar Videos Search Failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Search suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query
    const query = q as string

    if (!query || query.length < 2) {
      return res.json({ suggestions: [] })
    }

    // Get topic suggestions from existing summaries
    const topicAggregation = await Summary.aggregate([
      { $unwind: '$topics' },
      { 
        $match: { 
          topics: { $regex: query, $options: 'i' } 
        } 
      },
      { 
        $group: { 
          _id: '$topics', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])

    const suggestions = topicAggregation.map(item => ({
      text: item._id,
      type: 'topic',
      count: item.count
    }))

    res.json({ suggestions })

  } catch (error) {
    console.error('Search suggestions error:', error)
    res.status(500).json({
      error: 'Suggestions Failed',
      suggestions: []
    })
  }
})

export default router