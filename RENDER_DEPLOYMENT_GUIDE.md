# VidSense - Render Deployment Guide (Free Tier)

## 🎯 What You'll Deploy
- **Frontend**: Next.js app on Render Static Site (FREE)
- **Backend**: Express + Python AI on Render Web Service (FREE)  
- **Database**: MongoDB Atlas M0 Cluster (FREE)
- **AI**: Groq API for summarization (FREE)

**Total Cost: $0/month** ✨

---

## ✅ Quick Checklist

- [ ] GitHub account + code pushed to public repo
- [ ] Render account created
- [ ] MongoDB Atlas account + cluster created
- [ ] Groq API key obtained
- [ ] Environment variables ready

---


## STEP 1: Get Groq API Key (2 minutes)

1. Go to https://console.groq.com/
2. Sign up with Google/GitHub
3. Click profile → "API Keys" → "Create API Key"
4. Name it `VidSense` and copy the key
5. **Save it**: `gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## STEP 2: Setup MongoDB Atlas (5 minutes)

1. **Create Account**: https://www.mongodb.com/cloud/atlas/register
2. **Create Cluster**:
   - Click "Build a Database" → Choose **FREE** M0 tier
   - Provider: AWS, Region: closest to you
   - Cluster Name: `VidSense-Cluster`
3. **Create User**:
   - Database Access → Add User
   - Username: `vidsense_admin`
   - Password: Auto-generate → **COPY AND SAVE IT**
   - Role: Read/Write to any database
4. **Network Access**:
   - Network Access → Add IP → "Allow Access from Anywhere" (0.0.0.0/0)
5. **Get Connection String**:
   - Database → Connect → Connect your application
   - Copy connection string:
   ```
   mongodb+srv://vidsense_admin:<password>@vidsense-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your saved password
   - Add database name: `.../vidsense?retryWrites=...`

**Final string looks like**:
```
mongodb+srv://vidsense_admin:YOUR_PASSWORD@vidsense-cluster.xxxxx.mongodb.net/vidsense?retryWrites=true&w=majority
```

---

## STEP 3: Push Code to GitHub (3 minutes)


```bash
# In VidSense directory
git init
git add .
git commit -m "Initial commit for Render deployment"
```

**Create GitHub Repo**:
1. Go to https://github.com/new
2. Name: `vidsense`, Visibility: **Public** (required for free tier)
3. Don't initialize with README
4. Create repository

**Push code**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/vidsense.git
git branch -M main
git push -u origin main
```

---

## STEP 4: Create Render Account (1 minute)

1. Go to https://render.com/
2. Click "Get Started" → Sign up with GitHub
3. Authorize Render to access repositories

---

## STEP 5: Deploy Backend (10 minutes)

1. **Render Dashboard** → "New +" → "Web Service"
2. **Connect** your `vidsense` repository
3. **Configure**:
   ```
   Name:           vidsense-backend
   Region:         Oregon (US West) or closest
   Branch:         main
   Root Directory: backend
   Runtime:        Node
   Build Command:  npm install && cd python && pip install -r requirements.txt && cd .. && npm run build
   Start Command:  npm start
   Instance Type:  Free
   ```

4. **Environment Variables** (click "Add Environment Variable"):
   
   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `10000` |
   | `MONGODB_URI` | Your MongoDB connection string from Step 2 |
   | `GROQ_API_KEY` | Your Groq API key from Step 1 |
   | `FRONTEND_URL` | `https://vidsense-frontend.onrender.com` |
   | `CHROMA_PERSIST_DIR` | `/opt/render/project/src/chromadb` |

5. **Create Web Service** (build takes ~5-10 minutes)

6. **Wait for "Live" status**, then note your backend URL:
   ```
   https://vidsense-backend.onrender.com
   ```

7. **Test**: Visit `https://vidsense-backend.onrender.com/api/health`
   - Should see: `{"status":"healthy","mongodb":"connected"}`

---

## STEP 6: Deploy Frontend (5 minutes)

1. **Render Dashboard** → "New +" → "Static Site"
2. **Connect** your `vidsense` repository
3. **Configure**:
   ```
   Name:            vidsense-frontend
   Branch:          main
   Root Directory:  frontend
   Build Command:   npm install && npm run build
   Publish Directory: .next
   ```

4. **Environment Variable**:
   
   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Your backend URL from Step 5 (e.g., `https://vidsense-backend.onrender.com`) |

5. **Create Static Site** (build takes ~3-5 minutes)

6. **Frontend URL**: 
   ```
   https://vidsense-frontend.onrender.com
   ```

---

## STEP 7: Update Backend CORS (2 minutes)

1. Go to **Backend service** in Render
2. **Environment** tab
3. **Edit** `FRONTEND_URL` → Set to your actual frontend URL:
   ```
   https://vidsense-frontend.onrender.com
   ```
4. **Save Changes** (auto-redeploys)

---

## STEP 8: Test Your App! 🎉

1. Visit your frontend: `https://vidsense-frontend.onrender.com`
2. Enter a YouTube URL (try a short video first):
   ```
   https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```
3. Click "Analyze"
4. Wait 30-60 seconds (first request after deploy)
5. See results: Summary, Sentiment Chart, Topics!

---

## 🚨 Troubleshooting

### Backend won't start
- Check all environment variables are set
- Verify MongoDB connection string is correct (with password and database name)
- Check logs: Render Dashboard → Backend → Logs

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` matches your backend URL
- Check backend `FRONTEND_URL` matches your frontend URL
- Ensure backend is "Live" (not spun down)

### Analysis takes forever
- First request after 15 min of inactivity takes 30-60 seconds (cold start)
- This is normal on free tier
- Subsequent requests are faster

### "CORS error" in browser
- Backend `FRONTEND_URL` must exactly match your frontend URL
- No trailing slash in URLs
- Check both services are deployed successfully

---

## 📝 Save These URLs

```
Frontend:  https://vidsense-frontend.onrender.com
Backend:   https://vidsense-backend.onrender.com
Health:    https://vidsense-backend.onrender.com/api/health

MongoDB:   https://cloud.mongodb.com
Groq:      https://console.groq.com
Render:    https://dashboard.render.com
GitHub:    https://github.com/YOUR_USERNAME/vidsense
```

---

## ⚡ Important Notes

**Free Tier Limitations**:
- Backend spins down after 15 min of inactivity
- First request after spin-down: 30-60 seconds
- 512 MB RAM (enough for this project)
- 750 hours/month (plenty for 24/7 uptime)

**To Prevent Spin-Down**:
- Use UptimeRobot (free) to ping your backend every 14 minutes
- Or upgrade to Starter plan ($7/month) for no spin-down

**Future Updates**:
```bash
# Make changes, then:
git add .
git commit -m "Your update message"
git push

# Render auto-deploys (if enabled) or manual deploy from dashboard
```

---

## 🎯 You're Done!

Your VidSense app is now live and analyzing YouTube videos with AI! 🚀

**Next Steps**:
- Test with different videos
- Monitor usage on Groq and MongoDB dashboards  
- Share your app with friends
- Consider upgrading when you need more resources

---

**Need Help?** Check Render docs at https://render.com/docs
