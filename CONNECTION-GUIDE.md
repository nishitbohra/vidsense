# 🎯 VidSense - Connection Guide

## ✅ Current Configuration

### Port Configuration
- **Frontend**: `http://localhost:3000` (Next.js)
- **Backend**: `http://localhost:3001` (Express/Node.js)
- **MongoDB**: `mongodb://localhost:27017/vidsense`

### Environment Files

#### Backend (.env)
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/vidsense
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🚀 Quick Start

### Option 1: Use the Startup Script (Recommended)
```powershell
.\START-VIDSENSE.ps1
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

## 👤 Demo Accounts

| Role     | Email                  | Password  |
|----------|------------------------|-----------|
| Admin    | admin@vidsense.com     | admin123  |
| Customer | user@vidsense.com      | user123   |

## 🔗 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/change-password` - Change password

### Video Endpoints (Authenticated)
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get video details
- `POST /api/videos` - Create video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `GET /api/videos/:id/transcript` - Get transcript
- `GET /api/videos/:id/sentiment` - Get sentiment data
- `GET /api/videos/stats/overview` - Get stats

### Analysis Endpoints
- `POST /api/analyze` - Analyze YouTube video
- `GET /api/analyze/status/:videoId` - Get analysis status

### Search Endpoints
- `POST /api/search` - Search videos
- `GET /api/search/similar/:videoId` - Find similar videos
- `GET /api/search/suggestions` - Get search suggestions

### Admin Endpoints (Admin Only)
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/videos` - Get all videos
- `DELETE /api/admin/videos/:id` - Delete video

## 🐛 Troubleshooting

### "Cannot connect to server" Error

1. **Check if backend is running:**
   ```powershell
   Invoke-RestMethod -Uri http://localhost:3001/api/health
   ```

2. **Check if ports are in use:**
   ```powershell
   netstat -ano | findstr ":3001 :3000"
   ```

3. **Restart servers:**
   - Close both terminal windows
   - Run `.\START-VIDSENSE.ps1` again

### "Authentication failed" Error

1. **Clear browser localStorage:**
   - Press F12 > Application tab > Local Storage
   - Delete all items for `http://localhost:3000`
   
2. **Re-create admin user:**
   ```powershell
   cd backend
   npx ts-node create-admin.ts
   ```

3. **Login again with fresh credentials**

### Port Already in Use

```powershell
# Find process using port 3001
netstat -ano | findstr ":3001"

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

## ✅ Verify Setup

Test the complete flow:

```powershell
# 1. Test health
Invoke-RestMethod -Uri http://localhost:3001/api/health

# 2. Test login
$body = '{"email":"admin@vidsense.com","password":"admin123"}' 
$response = Invoke-RestMethod -Uri http://localhost:3001/api/auth/login -Method POST -Body $body -ContentType "application/json"
Write-Host "Login successful! User: $($response.user.name)"
```

## 📱 Frontend Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - User dashboard
- `/profile` - User profile
- `/history` - Video history
- `/search` - Search videos
- `/videos/:id` - Video details
- `/admin` - Admin dashboard (admin only)
- `/admin/users` - User management (admin only)
- `/admin/videos` - Video management (admin only)
- `/status` - System status

## 🔒 Security Notes

- JWT tokens expire after 7 days
- Passwords are hashed with bcrypt
- Admin routes require both authentication AND admin role
- CORS is configured for `http://localhost:3000` only

## 📊 Database

The application uses MongoDB with the following collections:
- `users` - User accounts
- `videos` - Video metadata and analysis
- `summaries` - Video summaries
- `sentiments` - Sentiment analysis data

To reset the database:
```powershell
# Using mongosh
mongosh
use vidsense
db.dropDatabase()
```

Then re-create admin user:
```powershell
cd backend
npx ts-node create-admin.ts
```
