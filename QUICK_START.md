# 🚀 VidSense Quick Start Guide

Get VidSense up and running in 5 minutes!

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] Python 3.8+ installed
- [ ] MongoDB installed or MongoDB Atlas account
- [ ] YouTube API key from Google Cloud Console

---

## Option 1: Quick Start (Windows - Recommended)

### Step 1: Install Dependencies

```powershell
# Run setup script
.\setup.ps1
```

This automatically installs all backend and frontend dependencies.

### Step 2: Configure Environment

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# MongoDB (Local)
MONGODB_URI=mongodb://localhost:27017/vidsense

# JWT Secrets (generate strong random strings)
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-chars
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key-here

# Python
PYTHON_PATH=python

# ChromaDB
CHROMA_DB_PATH=./chromadb
CHROMA_COLLECTION_NAME=video_transcripts
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Step 3: Generate JWT Secrets

```powershell
# Run in PowerShell
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output to your `backend/.env` file.

### Step 4: Start Development Servers

```powershell
.\run-dev.ps1
```

This starts both backend (port 3001) and frontend (port 3000).

### Step 5: Create Admin User

Open a new PowerShell window:

```powershell
curl -X POST http://localhost:3001/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{
    \"email\": \"admin@vidsense.com\",
    \"password\": \"Admin123!@#\",
    \"name\": \"Admin User\",
    \"role\": \"admin\"
  }'
```

**Save the access token from the response!**

### Step 6: Test the Application

1. **Open frontend**: http://localhost:3000
2. **Check backend health**: http://localhost:3001/api/health
3. **View API docs**: http://localhost:3001/

---

## Option 2: Manual Setup

### Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r python/requirements.txt

# Create .env file (see above)

# Start backend
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file (see above)

# Start frontend
npm run dev
```

---

## Quick Test Commands

### 1. Health Check

```bash
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok",...}`

### 2. Register User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User",
    "role": "customer"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'
```

Save the `accessToken` from response.

### 4. Get Profile

```bash
# Replace <TOKEN> with actual token
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <TOKEN>"
```

### 5. Analyze a Video

```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

---

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Solution:**
```bash
# Windows: Start MongoDB service
net start MongoDB

# Linux/Mac
sudo systemctl start mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with Atlas connection string
```

### Issue: Python Command Not Found

**Solution:**
```bash
# Find Python path
where python  # Windows
which python3  # Linux/Mac

# Update PYTHON_PATH in backend/.env
# Example: PYTHON_PATH=C:\Python312\python.exe
```

### Issue: Port Already in Use

**Solution:**
```bash
# Find process on port 3001 (Windows)
netstat -ano | findstr :3001

# Kill process
taskkill /PID <pid> /F

# Linux/Mac
lsof -i :3001
kill -9 <pid>
```

### Issue: YouTube API Quota Exceeded

**Solution:**
- Wait 24 hours for quota reset
- Use a different API key
- Upgrade to higher quota limit in Google Cloud Console

### Issue: CORS Errors

**Solution:**
1. Check `FRONTEND_URL` in backend/.env matches frontend URL
2. Clear browser cache
3. Try in incognito mode

---

## Next Steps

1. **Create Admin Dashboard** (Frontend)
   - User management UI
   - Video oversight
   - Analytics dashboard

2. **Add More Features**
   - Email verification
   - Password reset
   - Video sharing
   - Favorites/bookmarks

3. **Deploy to Production**
   - See `DEPLOYMENT_GUIDE.md`
   - Set up MongoDB Atlas
   - Deploy backend to Render
   - Deploy frontend to Vercel

---

## Useful Resources

- **API Documentation**: `API_DOCUMENTATION.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUMMARY.md`
- **Project Structure**: `PROJECT_STRUCTURE.md`

---

## Testing API with Postman/Insomnia

### 1. Import Collection

Create a new collection with these endpoints:

**Auth:**
- POST `/api/auth/register` - Register
- POST `/api/auth/login` - Login
- POST `/api/auth/refresh` - Refresh Token
- GET `/api/auth/profile` - Get Profile
- PUT `/api/auth/change-password` - Change Password

**Videos:**
- GET `/api/videos` - List Videos
- GET `/api/videos/:id` - Get Video
- POST `/api/videos` - Create Video
- PUT `/api/videos/:id` - Update Video
- DELETE `/api/videos/:id` - Delete Video

**Admin:**
- GET `/api/admin/users` - List Users
- GET `/api/admin/users/:id` - Get User
- POST `/api/admin/users` - Create User
- PUT `/api/admin/users/:id` - Update User
- DELETE `/api/admin/users/:id` - Delete User
- GET `/api/admin/videos` - List All Videos
- DELETE `/api/admin/videos/:id` - Delete Any Video
- GET `/api/admin/analytics` - Get Analytics

**Analysis:**
- POST `/api/analyze` - Analyze Video
- POST `/api/search` - Semantic Search

### 2. Set Environment Variables

```json
{
  "baseUrl": "http://localhost:3001/api",
  "accessToken": "",
  "refreshToken": ""
}
```

### 3. Set Authorization Header

For protected endpoints, add:
```
Authorization: Bearer {{accessToken}}
```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` or `production` |
| `PORT` | Backend port | `3001` |
| `MONGODB_URI` | Database connection | `mongodb://localhost:27017/vidsense` |
| `JWT_SECRET` | Access token secret | `<64-char-random-string>` |
| `JWT_REFRESH_SECRET` | Refresh token secret | `<64-char-random-string>` |
| `YOUTUBE_API_KEY` | YouTube API key | `AIzaSy...` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_URL` | Frontend URL | `http://localhost:3000` |
| `JWT_EXPIRES_IN` | Access token expiry | `24h` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `PYTHON_PATH` | Python executable | `python` |
| `CHROMA_DB_PATH` | ChromaDB storage | `./chromadb` |

---

## Default Test Credentials

After setup, you can create these test accounts:

**Admin:**
- Email: `admin@vidsense.com`
- Password: `Admin123!@#`
- Role: `admin`

**Customer:**
- Email: `customer@vidsense.com`
- Password: `Customer123!@#`
- Role: `customer`

---

## Support

If you encounter issues:

1. Check `IMPLEMENTATION_SUMMARY.md` for detailed testing guide
2. Review `API_DOCUMENTATION.md` for API reference
3. See `DEPLOYMENT_GUIDE.md` troubleshooting section
4. Open an issue on GitHub

---

**Happy Coding! 🎉**
