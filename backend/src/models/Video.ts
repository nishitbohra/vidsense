import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IVideo extends Document {
  video_id: string
  title: string
  url: string
  transcript: Array<{
    text: string
    start: number
    duration: number
  }>
  created_at: Date
  updated_at: Date
  getTotalDuration(): number
  getTranscriptText(): string
}

export interface IVideoModel extends Model<IVideo> {
  findByVideoId(videoId: string): Promise<IVideo | null>
  searchByTitle(query: string, limit?: number): Promise<IVideo[]>
}

const TranscriptSegmentSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  start: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false })

const VideoSchema = new Schema<IVideo>({
  video_id: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9_-]{11}$/.test(v)
      },
      message: 'video_id must be a valid YouTube video ID (11 characters)'
    }
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  url: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(v)
      },
      message: 'url must be a valid YouTube URL'
    }
  },
  transcript: {
    type: [TranscriptSegmentSchema],
    default: []
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'videos'
})

// Indexes for better query performance
VideoSchema.index({ created_at: -1 })
VideoSchema.index({ title: 'text' }) // Text search index

// Instance methods
VideoSchema.methods.getTotalDuration = function(): number {
  return this.transcript.reduce((total: number, segment: any) => {
    return total + segment.duration
  }, 0)
}

VideoSchema.methods.getTranscriptText = function(): string {
  return this.transcript.map((segment: any) => segment.text).join(' ')
}

// Static methods
VideoSchema.statics.findByVideoId = function(videoId: string) {
  return this.findOne({ video_id: videoId })
}

VideoSchema.statics.searchByTitle = function(query: string, limit: number = 10) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
}

export const Video = mongoose.model<IVideo, IVideoModel>('Video', VideoSchema)
export default Video