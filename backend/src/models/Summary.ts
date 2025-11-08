import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISummary extends Document {
  summary_id: string
  video_id: string
  summary_short: string
  summary_detailed: string
  topics: string[]
  created_at: Date
  updated_at: Date
  getTopTopics(limit?: number): string[]
}

export interface ISummaryModel extends Model<ISummary> {
  findByVideoId(videoId: string): Promise<ISummary | null>
  findByTopic(topic: string, limit?: number): Promise<ISummary[]>
  searchSummaries(query: string, limit?: number): Promise<ISummary[]>
}

const SummarySchema = new Schema<ISummary>({
  summary_id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  video_id: {
    type: String,
    required: true,
    index: true,
    ref: 'Video',
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9_-]{11}$/.test(v)
      },
      message: 'video_id must be a valid YouTube video ID'
    }
  },
  summary_short: {
    type: String,
    required: true,
    trim: true,
    maxlength: 3000
  },
  summary_detailed: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000
  },
  topics: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr: string[]) {
        return arr.length <= 20 // Limit topics to 20
      },
      message: 'Topics array cannot exceed 20 items'
    }
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  collection: 'summaries'
})

// Indexes
SummarySchema.index({ video_id: 1 }, { unique: true })
SummarySchema.index({ created_at: -1 })
SummarySchema.index({ topics: 1 })
SummarySchema.index({ 
  summary_short: 'text', 
  summary_detailed: 'text', 
  topics: 'text' 
})

// Instance methods
SummarySchema.methods.getWordCount = function() {
  const shortWords = this.summary_short.split(/\s+/).length
  const detailedWords = this.summary_detailed.split(/\s+/).length
  return {
    short: shortWords,
    detailed: detailedWords,
    total: shortWords + detailedWords
  }
}

SummarySchema.methods.getTopTopics = function(limit: number = 5) {
  return this.topics.slice(0, limit)
}

// Static methods
SummarySchema.statics.findByVideoId = function(videoId: string) {
  return this.findOne({ video_id: videoId })
}

SummarySchema.statics.findByTopic = function(topic: string, limit: number = 10) {
  return this.find({ topics: { $in: [topic] } })
    .sort({ created_at: -1 })
    .limit(limit)
}

SummarySchema.statics.searchSummaries = function(query: string, limit: number = 10) {
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .limit(limit)
}

// Virtual for getting related video
SummarySchema.virtual('video', {
  ref: 'Video',
  localField: 'video_id',
  foreignField: 'video_id',
  justOne: true
})

export const Summary = mongoose.model<ISummary, ISummaryModel>('Summary', SummarySchema)
export default Summary