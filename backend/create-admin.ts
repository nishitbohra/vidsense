import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vidsense'

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
})

const User = mongoose.model('User', UserSchema)

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@vidsense.com' })
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists!')
      console.log('Email:', existingAdmin.email)
      console.log('Role:', existingAdmin.role)
      console.log('Active:', (existingAdmin as any).isActive)
      
      // Update password and ensure active
      const newPassword = 'admin123'
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      existingAdmin.password = hashedPassword;
      (existingAdmin as any).isActive = true
      await existingAdmin.save()
      console.log('✅ Password updated to: admin123')
      console.log('✅ User activated')
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10)
      const admin = new User({
        name: 'Admin User',
        email: 'admin@vidsense.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      })

      await admin.save()
      console.log('✅ Admin user created successfully!')
      console.log('Email: admin@vidsense.com')
      console.log('Password: admin123')
      console.log('Role: admin')
    }

    // Also create a test customer
    const existingCustomer = await User.findOne({ email: 'user@vidsense.com' })
    if (!existingCustomer) {
      const hashedPassword = await bcrypt.hash('user123', 10)
      const customer = new User({
        name: 'Test User',
        email: 'user@vidsense.com',
        password: hashedPassword,
        role: 'customer',
        isActive: true,
      })
      await customer.save()
      console.log('✅ Test customer created successfully!')
      console.log('Email: user@vidsense.com')
      console.log('Password: user123')
      console.log('Role: customer')
    }

    await mongoose.connection.close()
    console.log('\n✅ Done! You can now login with:')
    console.log('Admin: admin@vidsense.com / admin123')
    console.log('User: user@vidsense.com / user123')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

createAdmin()
