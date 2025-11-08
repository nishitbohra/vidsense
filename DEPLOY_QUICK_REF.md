# 🚀 Render Deployment - Quick Reference

## Environment Variables to Set

### Backend (6 variables)
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vidsense?retryWrites=true&w=majority
GROQ_API_KEY=gsk_your_key_here
FRONTEND_URL=https://vidsense-frontend.onrender.com
CHROMA_PERSIST_DIR=/opt/render/project/src/chromadb
```

### Frontend (1 variable)
```
NEXT_PUBLIC_API_URL=https://vidsense-backend.onrender.com
```

## Render Service Configuration

### Backend Web Service
```
Name:           vidsense-backend
Root Directory: backend
Build Command:  npm install && cd python && pip install -r requirements.txt && cd .. && npm run build
Start Command:  npm start
Instance Type:  Free
```

### Frontend Static Site
```
Name:            vidsense-frontend
Root Directory:  frontend
Build Command:   npm install && npm run build
Publish Directory: .next
```

## Test URLs
```
Health Check: https://YOUR-BACKEND.onrender.com/api/health
Frontend:     https://YOUR-FRONTEND.onrender.com
```

## Free Tier Limits
- Backend: 512 MB RAM, spins down after 15 min
- Cold start: 30-60 seconds
- MongoDB: 512 MB storage
- Groq API: 30 req/min, 14,400/day

---

**Full Guide**: See `RENDER_DEPLOYMENT_GUIDE.md`
