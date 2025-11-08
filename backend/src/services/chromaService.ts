/**
 * ChromaDB Connection and Utility Functions
 * Handles vector database operations for semantic search
 */

import { spawn } from 'child_process'
import path from 'path'

export interface SearchResult {
  video_id: string
  similarity_score: number
  text_segment: string
  timestamp?: string
}

export interface EmbeddingResult {
  success: boolean
  error?: string
  collection_count?: number
}

export class ChromaDBService {
  private pythonScriptPath: string

  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../python')
  }

  /**
   * Search for similar content using semantic embeddings
   */
  async searchSimilar(query: string, limit: number = 10): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        path.join(this.pythonScriptPath, 'semantic_search.py'),
        query,
        limit.toString()
      ])

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('ChromaDB search error:', errorOutput)
          reject(new Error(`ChromaDB search failed: ${errorOutput}`))
          return
        }

        try {
          const result = JSON.parse(output)
          if (result.success) {
            resolve(result.results || [])
          } else {
            reject(new Error(result.error || 'Search failed'))
          }
        } catch (error) {
          console.error('Failed to parse ChromaDB search result:', error)
          reject(new Error('Invalid search response format'))
        }
      })
    })
  }

  /**
   * Generate embeddings for video content
   */
  async generateEmbeddings(videoId: string, transcript: string): Promise<EmbeddingResult> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        path.join(this.pythonScriptPath, 'embedding_generator.py'),
        videoId,
        transcript
      ])

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Embedding generation error:', errorOutput)
          resolve({ success: false, error: errorOutput })
          return
        }

        try {
          const result = JSON.parse(output)
          resolve(result)
        } catch (error) {
          console.error('Failed to parse embedding result:', error)
          resolve({ success: false, error: 'Invalid response format' })
        }
      })
    })
  }

  /**
   * Check ChromaDB connection and collection status
   */
  async getStatus(): Promise<{ connected: boolean; collections: number; error?: string }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python', [
        path.join(this.pythonScriptPath, 'semantic_search.py'),
        '--status'
      ])

      let output = ''
      let errorOutput = ''

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({ connected: false, collections: 0, error: errorOutput })
          return
        }

        try {
          const result = JSON.parse(output)
          resolve({
            connected: result.success || false,
            collections: result.collection_count || 0,
            error: result.error
          })
        } catch (error) {
          resolve({ connected: false, collections: 0, error: 'Status check failed' })
        }
      })
    })
  }
}

export const chromaDB = new ChromaDBService()