import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISentiment extends Document {
  segment_id: string
  video_id: string
  timestamp: number
  sentiment_label: 'positive' | 'neutral' | 'negative'
  sentiment_score: number
  text_segment: string
  created_at: Date
}

export interface ISentimentModel extends Model<ISentiment> {
  findByVideoId(videoId: string): Promise<ISentiment[]>
  getVideoSentimentStats(videoId: string): Promise<any[]>
  getSentimentTimeline(videoId: string, intervalSeconds?: number): Promise<any[]>
  findBySentimentRange(videoId: string, minScore: number, maxScore: number): Promise<ISentiment[]>
}

const SentimentSchema = new Schema<ISentiment>({
  segment_id: {
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
  timestamp: {
    type: Number,
    required: true,
    min: 0,
    index: true
  },
  sentiment_label: {
    type: String,
    required: true,
    enum: ['positive', 'neutral', 'negative']
  },
  sentiment_score: {
    type: Number,
    required: true,
    min: -1,
    max: 1
  },
  text_segment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: false
  },
  collection: 'sentiments'
})

// Compound indexes for efficient queries
SentimentSchema.index({ video_id: 1, timestamp: 1 })
SentimentSchema.index({ video_id: 1, sentiment_label: 1 })
SentimentSchema.index({ created_at: -1 })
SentimentSchema.index({ sentiment_score: 1 })

// Instance methods
SentimentSchema.methods.getSentimentCategory = function(): string {
  if (this.sentiment_score > 0.1) return 'positive'
  if (this.sentiment_score < -0.1) return 'negative'
  return 'neutral'
}

SentimentSchema.methods.getFormattedTimestamp = function(): string {
  const minutes = Math.floor(this.timestamp / 60)
  const seconds = Math.floor(this.timestamp % 60)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Static methods
SentimentSchema.statics.findByVideoId = function(videoId: string) {
  return this.find({ video_id: videoId }).sort({ timestamp: 1 })
}

SentimentSchema.statics.getVideoSentimentStats = function(videoId: string) {
  return this.aggregate([
    { $match: { video_id: videoId } },
    {
      $group: {
        _id: '$sentiment_label',
        count: { $sum: 1 },
        averageScore: { $avg: '$sentiment_score' },
        maxScore: { $max: '$sentiment_score' },
        minScore: { $min: '$sentiment_score' }
      }
    }
  ])
}

SentimentSchema.statics.getSentimentTimeline = function(videoId: string, intervalSeconds: number = 30) {
  return this.aggregate([
    { $match: { video_id: videoId } },
    {
      $group: {
        _id: {
          interval: {
            $floor: {
              $divide: ['$timestamp', intervalSeconds]
            }
          }
        },
        avgSentiment: { $avg: '$sentiment_score' },
        count: { $sum: 1 },
        timestamp: { $min: '$timestamp' }
      }
    },
    { $sort: { timestamp: 1 } }
  ])
}

SentimentSchema.statics.findBySentimentRange = function(
  videoId: string, 
  minScore: number, 
  maxScore: number
) {
  return this.find({
    video_id: videoId,
    sentiment_score: { $gte: minScore, $lte: maxScore }
  }).sort({ timestamp: 1 })
}

// Virtual for getting related video
SentimentSchema.virtual('video', {
  ref: 'Video',
  localField: 'video_id',
  foreignField: 'video_id',
  justOne: true
})

export const Sentiment = mongoose.model<ISentiment, ISentimentModel>('Sentiment', SentimentSchema)
export default Sentiment