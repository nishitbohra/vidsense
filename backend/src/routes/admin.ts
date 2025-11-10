import express from 'express'
import User from '../models/User'
import Video from '../models/Video'
import Summary from '../models/Summary'
import Sentiment from '../models/Sentiment'
import { authenticate, requireAdmin } from '../middleware/auth'

const router = express.Router()

// All routes require admin authentication
router.use(authenticate)
router.use(requireAdmin)

// ==================== USER MANAGEMENT ====================

// Get all users with pagination
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const role = req.query.role as string | undefined
    const skip = (page - 1) * limit

    const filter: any = {}
    if (role && ['admin', 'customer'].includes(role)) {
      filter.role = role
    }
    
    // Only show active users (exclude soft-deleted users)
    filter.isActive = true

    const users = await User.find(filter)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')

    const total = await User.countDocuments(filter)

    res.json({
      users: users.map(user => ({
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        created_at: user.created_at,
        updated_at: user.updated_at
      })),
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
    console.error('Get users error:', error)
    res.status(500).json({
      error: 'Failed to fetch users',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get specific user
router.get('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password')

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    })

  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      error: 'Failed to fetch user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Create new user (admin can create users)
router.post('/users', async (req, res) => {
  try {
    const { email, password, name, role, isActive } = req.body

    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email, password, and name are required'
      })
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        error: 'User creation failed',
        message: 'User with this email already exists'
      })
    }

    const user = new User({
      email,
      password,
      name,
      role: role || 'customer',
      isActive: isActive !== undefined ? isActive : true
    })

    await user.save()

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      }
    })

  } catch (error: any) {
    console.error('Create user error:', error)
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message)
      return res.status(400).json({
        error: 'Validation failed',
        message: validationErrors.join(', ')
      })
    }
    
    res.status(500).json({
      error: 'Failed to create user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update user
router.put('/users/:userId', async (req, res) => {
  try {
    const { name, role, isActive, preferences } = req.body

    const user = await User.findById(req.params.userId)

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    // Update fields
    if (name !== undefined) user.name = name
    if (role !== undefined && ['admin', 'customer'].includes(role)) {
      user.role = role
    }
    if (isActive !== undefined) user.isActive = isActive
    if (preferences !== undefined) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      }
    }

    await user.save()

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        preferences: user.preferences
      }
    })

  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      error: 'Failed to update user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete user (soft delete by setting isActive to false)
router.delete('/users/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    // Prevent self-deletion
    if (String(user._id) === req.user!.userId) {
      return res.status(400).json({
        error: 'Cannot delete your own account',
        message: 'Please use another admin account to delete this user'
      })
    }

    // Soft delete
    user.isActive = false
    await user.save()

    res.json({
      message: 'User deactivated successfully'
    })

  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      error: 'Failed to delete user',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ==================== VIDEO MANAGEMENT ====================

// Get all videos (admin view with more details)
router.get('/videos', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const skip = (page - 1) * limit

    const videos = await Video.find({})
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const total = await Video.countDocuments({})

    // Enrich with related data
    const enrichedVideos = await Promise.all(
      videos.map(async (video) => {
        const summary = await Summary.findByVideoId(video.video_id)
        const sentiments = await Sentiment.findByVideoId(video.video_id)

        return {
          video_id: video.video_id,
          title: video.title,
          url: video.url,
          has_summary: !!summary,
          has_sentiments: sentiments.length > 0,
          transcript_segments: video.transcript?.length || 0,
          duration: video.transcript?.reduce((total, segment) => total + segment.duration, 0) || 0,
          created_at: video.created_at,
          updated_at: video.updated_at
        }
      })
    )

    res.json({
      videos: enrichedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Admin get videos error:', error)
    res.status(500).json({
      error: 'Failed to fetch videos',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete video (hard delete with embeddings)
router.delete('/videos/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params

    // Delete video and all related data
    const video = await Video.findOne({ video_id: videoId })
    
    if (!video) {
      return res.status(404).json({
        error: 'Video not found'
      })
    }

    // Delete associated data
    await Promise.all([
      Video.deleteOne({ video_id: videoId }),
      Summary.deleteOne({ video_id: videoId }),
      Sentiment.deleteMany({ video_id: videoId })
      // TODO: Call Python service to delete embeddings from ChromaDB
    ])

    res.json({
      message: 'Video and all associated data deleted successfully',
      video_id: videoId
    })

  } catch (error) {
    console.error('Delete video error:', error)
    res.status(500).json({
      error: 'Failed to delete video',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// ==================== ANALYTICS ====================

// Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      adminCount,
      customerCount,
      totalVideos,
      totalSummaries,
      recentVideos
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'customer' }),
      Video.countDocuments({}),
      Summary.countDocuments({}),
      Video.find({}).sort({ created_at: -1 }).limit(5).lean()
    ])

    res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        admins: adminCount,
        customers: customerCount
      },
      videos: {
        total: totalVideos,
        with_summaries: totalSummaries
      },
      recent_activity: {
        videos: recentVideos.map(v => ({
          video_id: v.video_id,
          title: v.title,
          created_at: v.created_at
        }))
      }
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
