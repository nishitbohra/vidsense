import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'

/**
 * Python Bridge Service
 * 
 * This service provides a bridge between Node.js and Python scripts,
 * handling the execution of Python AI/ML scripts with proper error handling.
 */

export interface PythonResult {
  success: boolean
  data?: any
  error?: string
  stderr?: string
  stdout?: string
}

export class PythonBridge {
  private pythonPath: string
  private scriptsPath: string

  constructor() {
    this.pythonPath = 'python' // Assumes python is in PATH
    // In production (compiled), __dirname is dist/services
    // We need to go up to the backend root and then into python folder
    const isDevelopment = __dirname.includes('src')
    if (isDevelopment) {
      // Development: src/services -> ../../python
      this.scriptsPath = path.join(__dirname, '../../python')
    } else {
      // Production: dist/services -> ../../python
      this.scriptsPath = path.join(__dirname, '../../python')
    }
  }

  /**
   * Execute a Python script with arguments
   */
  async executeScript(scriptName: string, args: string[] = [], timeout: number = 120000): Promise<PythonResult> {
    return new Promise((resolve) => {
      const scriptPath = path.join(this.scriptsPath, scriptName)
      const pythonProcess = spawn(this.pythonPath, [scriptPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout)
            resolve({
              success: true,
              data: result,
              stdout,
              stderr
            })
          } catch (error) {
            resolve({
              success: false,
              error: `Failed to parse Python script output: ${error}`,
              stdout,
              stderr
            })
          }
        } else {
          resolve({
            success: false,
            error: `Python script failed with code ${code}`,
            stdout,
            stderr
          })
        }
      })

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to execute Python script: ${error.message}`,
          stdout,
          stderr
        })
      })
    })
  }

  /**
   * Extract transcript from YouTube video
   */
  async extractTranscript(videoId: string): Promise<PythonResult> {
    return this.executeScript('transcript_extractor.py', [videoId], 60000)
  }

  /**
   * Generate summary from transcript text
   */
  async generateSummary(transcriptText: string): Promise<PythonResult> {
    // Write transcript to temp file to avoid Windows command line length limits
    const tempFile = path.join(os.tmpdir(), `summary-${Date.now()}.json`)
    try {
      const data = { transcript_text: transcriptText }
      await fs.writeFile(tempFile, JSON.stringify(data), 'utf-8')
      const result = await this.executeScript('summarizer.py', [tempFile], 180000) // 3 minutes for AI processing
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}) // Ignore errors on cleanup
      return result
    } catch (error: any) {
      // Clean up on error
      await fs.unlink(tempFile).catch(() => {})
      return {
        success: false,
        error: `Failed to generate summary: ${error.message}`
      }
    }
  }

  /**
   * Analyze sentiment of transcript segments
   */
  async analyzeSentiment(transcriptSegments: any[]): Promise<PythonResult> {
    // Write segments to temp file to avoid Windows PowerShell JSON escaping issues
    const tempFile = path.join(os.tmpdir(), `sentiment-${Date.now()}.json`)
    try {
      await fs.writeFile(tempFile, JSON.stringify(transcriptSegments), 'utf-8')
      const result = await this.executeScript('sentiment_analyzer.py', [tempFile], 300000) // 5 minutes for ML processing
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}) // Ignore errors on cleanup
      return result
    } catch (error: any) {
      // Clean up on error
      await fs.unlink(tempFile).catch(() => {})
      return {
        success: false,
        error: `Failed to process sentiment analysis: ${error.message}`
      }
    }
  }

  /**
   * Generate and store embeddings
   */
  async generateEmbeddings(videoId: string, transcriptText: string, transcriptSegments: any[], title?: string, summary?: string): Promise<PythonResult> {
    // Write data to temp file to avoid Windows command line length limits
    const tempFile = path.join(os.tmpdir(), `embeddings-${Date.now()}.json`)
    try {
      const data = {
        video_id: videoId,
        transcript_text: transcriptText,
        transcript_segments: transcriptSegments,
        title: title || '',
        summary: summary || ''
      }
      await fs.writeFile(tempFile, JSON.stringify(data), 'utf-8')
      const result = await this.executeScript('embedding_generator.py', ['store', tempFile], 180000)
      // Clean up temp file
      await fs.unlink(tempFile).catch(() => {}) // Ignore errors on cleanup
      return result
    } catch (error: any) {
      // Clean up on error
      await fs.unlink(tempFile).catch(() => {})
      return {
        success: false,
        error: `Failed to generate embeddings: ${error.message}`
      }
    }
  }

  /**
   * Perform semantic search
   */
  async semanticSearch(query: string, limit: number = 10): Promise<PythonResult> {
    return this.executeScript('semantic_search.py', [query, limit.toString()], 30000)
  }

  /**
   * Check if Python and required packages are available
   */
  async checkPythonEnvironment(): Promise<PythonResult> {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.pythonPath, ['--version'], {
        stdio: 'pipe',
        timeout: 5000
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            data: { version: stdout.trim() },
            stdout,
            stderr
          })
        } else {
          resolve({
            success: false,
            error: 'Python not found or not accessible',
            stdout,
            stderr
          })
        }
      })

      pythonProcess.on('error', () => {
        resolve({
          success: false,
          error: 'Python executable not found in PATH',
          stdout,
          stderr
        })
      })
    })
  }
}

// Singleton instance
export const pythonBridge = new PythonBridge()

export default pythonBridge