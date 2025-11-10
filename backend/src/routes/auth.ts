import express from 'express'
import User from '../models/User'
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt'
import { authenticate } from '../middleware/auth'

const router = express.Router()

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body

    // Validate input
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
        error: 'Registration failed',
        message: 'User with this email already exists'
      })
    }

    // Create new user (role defaults to 'customer' if not specified)
    const user = new User({
      email,
      password,
      name,
      role: role || 'customer'
    })

    await user.save()

    // Generate tokens
    const token = generateToken({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role
    })

    const refreshToken = generateRefreshToken({
      userId: (user._id as any).toString(),
      email: user.email,
      role: user.role
    })

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      access_token: token,
      refresh_token: refreshToken
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Email and password are required'
      })
    }

    // Find user (include password field)
    const user = await User.findByEmailWithPassword(email)
    
    if (!user) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        error: 'Authentication failed',
        message: 'Account is inactive. Please contact support.'
      })
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      })
    }

    // Generate tokens
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role
    })

    const refreshToken = generateRefreshToken({
      userId: String(user._id),
      email: user.email,
      role: user.role
    })

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferences: user.preferences
      },
      access_token: token,
      refresh_token: refreshToken
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Refresh token is required'
      })
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken)

    // Check if user still exists and is active
    const user = await User.findById(decoded.userId)
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Token refresh failed',
        message: 'User not found or inactive'
      })
    }

    // Generate new tokens
    const newToken = generateToken({
      userId: String(user._id),
      email: user.email,
      role: user.role
    })

    const newRefreshToken = generateRefreshToken({
      userId: String(user._id),
      email: user.email,
      role: user.role
    })

    res.json({
      access_token: newToken,
      refresh_token: newRefreshToken
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({
      error: 'Token refresh failed',
      message: error instanceof Error ? error.message : 'Invalid refresh token'
    })
  }
})

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user!.userId)
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile could not be found'
      })
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      preferences: user.preferences,
      created_at: user.created_at,
      updated_at: user.updated_at
    })

  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({
      error: 'Failed to fetch profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update current user profile
router.put('/me', authenticate, async (req, res) => {
  try {
    const { name, preferences } = req.body

    const user = await User.findById(req.user!.userId)
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        message: 'User profile could not be found'
      })
    }

    // Update fields
    if (name) user.name = name
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences
      }
    }

    await user.save()

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        preferences: user.preferences
      }
    })

  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      error: 'Failed to update profile',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Change password
router.put('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'Current password and new password are required'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'New password must be at least 6 characters long'
      })
    }

    const user = await User.findById(req.user!.userId).select('+password')
    
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      })
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword)
    
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Current password is incorrect'
      })
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.json({
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      error: 'Failed to change password',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router
