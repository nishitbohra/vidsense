# 🔧 VidSense Configuration Summary

**Last Updated:** November 10, 2025  
**Purpose:** Ensure consistent configuration across development and production environments

---

## 📍 Port Configuration

### Development Environment

| Service  | Port | URL                      | Configuration File            |
|----------|------|--------------------------|-------------------------------|
| Backend  | 3001 | http://localhost:3001    | `backend/src/config/env.ts`   |
| Frontend | 3000 | http://localhost:3000    | Next.js default               |

**Key Files:**
- `backend/src/config/env.ts`: Default PORT = `3001`
- `backend/src/index.ts`: Fallback PORT = `3001`
- `backend/.env.example`: PORT=`3001`
- `frontend/lib/api.ts`: API_BASE_URL = `http://localhost:3001`
- `frontend/.env.local.example`: NEXT_PUBLIC_API_URL=`http://localhost:3001`
- `START-VIDSENSE.ps1`: Backend=`3001`, Frontend=`3000`

### Production Environment (Render)

| Service  | Port  | Configuration              |
|----------|-------|----------------------------|
| Backend  | 10000 | Auto-assigned by Render    |
| Frontend | 3000  | Next.js default            |

**Key Files:**
- `backend/render.yaml`: PORT=`10000`
- Frontend deployed separately, communicates via NEXT_PUBLIC_API_URL env var

---

## 🐍 Python Dependencies

**File:** `backend/python/requirements.txt`

### Core Dependencies

```
# YouTube & Video Processing
youtube-transcript-api==0.6.1      # YouTube transcript extraction
requests>=2.31.0                    # HTTP requests

# AI/ML Models & APIs
groq>=0.4.0                         # Groq API for LLM
transformers>=4.35.0                # Hugging Face transformers
sentence-transformers>=2.2.2        # Sentence embeddings
torch>=2.1.0                        # PyTorch for ML models
numpy>=1.24.0                       # Numerical computing

# Vector Database
chromadb>=0.4.15                    # Vector store for semantic search

# Text Processing
nltk>=3.8.1                         # Natural language toolkit

# Utilities
python-dotenv>=1.0.0                # Environment variables
tqdm>=4.66.1                        # Progress bars

# Explicit Dependencies (for production stability)
safetensors>=0.4.0                  # Safe model serialization
huggingface-hub>=0.19.0             # Model downloading
tokenizers>=0.15.0                  # Fast tokenization
pydantic>=2.0.0                     # Data validation
typing-extensions>=4.8.0            # Type hints
```

**Version Strategy:**
- ✅ Use `==` for known stable versions (youtube-transcript-api)
- ✅ Use `>=` with tested minimum versions for flexibility
- ✅ All versions tested and compatible with Python 3.8+
- ✅ Production-ready and Render-compatible

---

## 📦 Node.js Dependencies

### Backend (`backend/package.json`)

**Runtime:** Node.js >= 18.0.0  
**TypeScript:** 5.2.2

**Core Dependencies:**
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^3.0.3",
  "cors": "^2.8.5",
  "helmet": "^7.1.0",
  "dotenv": "^16.3.1",
  "compression": "^1.7.4",
  "express-rate-limit": "^7.1.5",
  "morgan": "^1.10.0",
  "joi": "^17.11.0",
  "uuid": "^9.0.1"
}
```

### Frontend (`frontend/package.json`)

**Framework:** Next.js 14.2.8  
**React:** 18.x

**Core Dependencies:**
```json
{
  "next": "14.2.8",
  "react": "^18",
  "react-dom": "^18",
  "typescript": "^5",
  "tailwindcss": "^3.4.1",
  "axios": "^1.6.0",
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "lucide-react": "^0.292.0"
}
```

---

## 🔐 Environment Variables

### Backend Required Variables

**File:** `backend/.env` (copy from `.env.example`)

```bash
# Server
NODE_ENV=development
PORT=3001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vidsense

# API Keys
GROQ_API_KEY=your_groq_api_key_here

# CORS & Frontend
FRONTEND_URL=http://localhost:3000

# JWT Secrets
JWT_SECRET=your-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Storage
CHROMA_PERSIST_DIR=./chromadb
```

### Frontend Required Variables

**File:** `frontend/.env.local` (copy from `.env.local.example`)

```bash
# Development
NEXT_PUBLIC_API_URL=http://localhost:3001

# Production (when deploying)
# NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com
```

---

## 🚀 Startup Commands

### Development

**Using PowerShell Script (Recommended):**
```powershell
.\START-VIDSENSE.ps1
```

**Manual Startup:**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### Production Build

**Backend:**
```bash
cd backend
npm install
cd python && pip install -r requirements.txt
cd ..
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run build
npm start
```

---

## 🔄 Port Consistency Checklist

✅ **Backend:**
- [x] `backend/src/config/env.ts` → Default PORT: **3001**
- [x] `backend/src/index.ts` → Fallback PORT: **3001**
- [x] `backend/.env.example` → PORT=**3001**
- [x] `backend/render.yaml` → PORT=**10000** (production only)

✅ **Frontend:**
- [x] `frontend/lib/api.ts` → API_BASE_URL: **http://localhost:3001**
- [x] `frontend/.env.local.example` → NEXT_PUBLIC_API_URL: **http://localhost:3001**

✅ **Scripts:**
- [x] `START-VIDSENSE.ps1` → Backend: **3001**, Frontend: **3000**

✅ **Documentation:**
- [x] All README files reference correct ports
- [x] All guide documents use consistent ports

---

## 🎯 Deployment Configuration

### Render Backend Settings

**Environment Variables (Set in Render Dashboard):**
```
NODE_ENV=production
PORT=10000
MONGODB_URI=<your-mongodb-atlas-uri>
GROQ_API_KEY=<your-groq-api-key>
FRONTEND_URL=https://your-frontend-domain.onrender.com
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
CHROMA_PERSIST_DIR=/opt/render/project/src/chromadb
```

**Build Command:**
```bash
npm install && cd python && pip install -r requirements.txt && cd .. && npm run build
```

**Start Command:**
```bash
npm start
```

### Render Frontend Settings

**Environment Variables (Set in Render Dashboard):**
```
NEXT_PUBLIC_API_URL=https://your-backend-domain.onrender.com
```

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

---

## 📋 Version Compatibility Matrix

| Component              | Version       | Compatibility Notes                |
|------------------------|---------------|------------------------------------|
| Node.js                | >= 18.0.0     | Required for ES modules            |
| Python                 | >= 3.8        | Required for type hints            |
| MongoDB                | >= 5.0        | Atlas recommended                  |
| Next.js                | 14.2.8        | Stable release                     |
| TypeScript             | ~5.2          | Backend and frontend               |
| React                  | 18.x          | Latest stable                      |
| PyTorch                | >= 2.1.0      | For transformers models            |
| Transformers           | >= 4.35.0     | Hugging Face library               |
| ChromaDB               | >= 0.4.15     | Vector database                    |
| Groq API               | >= 0.4.0      | LLM API client                     |

---

## 🛠️ Troubleshooting

### Port Conflicts

**Symptom:** "Port already in use" error

**Solution:**
```powershell
# Check what's using the port
netstat -ano | findstr :3001
netstat -ano | findstr :3000

# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

### Version Mismatches

**Symptom:** Dependency errors during install

**Solution:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install

# Python
cd backend/python
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### Environment Variables Not Loading

**Symptom:** App can't connect to database or API

**Solution:**
1. Ensure `.env` files exist (not just `.env.example`)
2. Restart development servers after changing `.env`
3. Check for typos in variable names
4. Verify values don't have quotes or spaces

---

## ✅ Pre-Deployment Checklist

Before pushing to production:

- [ ] All ports configured consistently
- [ ] Environment variables set in Render dashboard
- [ ] MongoDB Atlas connection string updated
- [ ] Groq API key configured
- [ ] CORS frontend URL updated for production
- [ ] JWT secrets are strong and unique
- [ ] Python requirements.txt tested and working
- [ ] Build commands tested locally
- [ ] Git repository up to date
- [ ] Health check endpoint responding (`/api/health`)

---

## 📞 Support

If you encounter configuration issues:

1. Check this document first
2. Review error logs in terminal
3. Verify all environment variables are set
4. Test API connectivity with `test-connection.html`
5. Check Render deployment logs

---

**Configuration Last Verified:** November 10, 2025  
**Status:** ✅ All configurations aligned and tested
