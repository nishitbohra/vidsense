# VidSense Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Development Deployment](#development-deployment)
4. [Production Deployment](#production-deployment)
5. [Database Setup](#database-setup)
6. [Security Considerations](#security-considerations)
7. [Monitoring and Maintenance](#monitoring-and-maintenance)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements
- Node.js 18+ (LTS recommended)
- Python 3.8+
- MongoDB 5.0+
- Git
- 4GB RAM minimum (8GB recommended for production)
- 20GB free disk space

### Required Accounts
- YouTube Data API v3 key (from Google Cloud Console)
- MongoDB Atlas account (or local MongoDB installation)
- (Optional) Render/Vercel/AWS account for deployment

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/vidsense.git
cd vidsense
```

### 2. Backend Environment Variables

Create `backend/.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/vidsense
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vidsense?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# YouTube API
YOUTUBE_API_KEY=your-youtube-api-key-from-google-cloud-console

# Python Configuration
PYTHON_PATH=python
# OR specify full path:
# PYTHON_PATH=C:\Python312\python.exe  (Windows)
# PYTHON_PATH=/usr/bin/python3         (Linux/Mac)

# ChromaDB Configuration
CHROMA_DB_PATH=./chromadb
CHROMA_COLLECTION_NAME=video_transcripts

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ANALYSIS_RATE_LIMIT_WINDOW_MS=3600000
ANALYSIS_RATE_LIMIT_MAX_REQUESTS=10

# Logging
LOG_LEVEL=info
```

### 3. Frontend Environment Variables

Create `frontend/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=VidSense
NEXT_PUBLIC_APP_VERSION=1.0.0
```

---

## Development Deployment

### Quick Start (Windows)

1. **Install Dependencies and Start Development Servers:**
```powershell
# Run setup script (installs all dependencies)
.\setup.ps1

# Start development servers
.\run-dev.ps1
```

### Manual Setup

#### Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r python/requirements.txt

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Verify Development Setup

1. **Backend Health Check:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Frontend:**
   Open browser: `http://localhost:3000`

3. **Create Admin User:**
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@vidsense.com",
       "password": "Admin123!@#",
       "name": "Admin User",
       "role": "admin"
     }'
   ```

---

## Production Deployment

### Option 1: Render.com (Recommended for Backend)

#### Backend Deployment

1. **Create a new Web Service on Render**
   - Connect your GitHub repository
   - Root directory: `backend`
   - Build command: `npm install && pip install -r python/requirements.txt`
   - Start command: `npm start`

2. **Environment Variables on Render:**
   Add all variables from `backend/.env` (see above)
   
   **Important Production Changes:**
   ```env
   NODE_ENV=production
   PORT=10000  # Render default
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   MONGODB_URI=mongodb+srv://...  # Use MongoDB Atlas
   JWT_SECRET=<generate-strong-random-secret>
   JWT_REFRESH_SECRET=<generate-strong-random-secret>
   ```

3. **Generate Strong Secrets:**
   ```bash
   # Use this to generate secrets
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

#### Frontend Deployment (Vercel)

1. **Deploy to Vercel:**
   ```bash
   cd frontend
   npm install -g vercel
   vercel
   ```

2. **Environment Variables on Vercel:**
   ```env
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_APP_NAME=VidSense
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

### Option 2: Docker Deployment

#### Create Docker Compose File

Create `docker-compose.yml` in root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: vidsense-mongodb
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: admin123
      MONGO_INITDB_DATABASE: vidsense

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: vidsense-backend
    restart: always
    ports:
      - "3001:3001"
    depends_on:
      - mongodb
    environment:
      NODE_ENV: production
      PORT: 3001
      MONGODB_URI: mongodb://admin:admin123@mongodb:27017/vidsense?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      YOUTUBE_API_KEY: ${YOUTUBE_API_KEY}
    volumes:
      - ./backend/chromadb:/app/chromadb

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: vidsense-frontend
    restart: always
    ports:
      - "3000:3000"
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:3001/api

volumes:
  mongodb_data:
```

#### Backend Dockerfile

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY python/requirements.txt ./python/

# Install dependencies
RUN npm ci --only=production
RUN pip3 install --no-cache-dir -r python/requirements.txt

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

#### Frontend Dockerfile

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

#### Deploy with Docker

```bash
# Create .env file with secrets
echo "JWT_SECRET=$(openssl rand -hex 64)" > .env
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 64)" >> .env
echo "YOUTUBE_API_KEY=your-api-key" >> .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Option 3: VPS Deployment (Ubuntu)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python
sudo apt install -y python3 python3-pip

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

#### 2. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/vidsense.git
cd vidsense

# Setup backend
cd backend
npm install
pip3 install -r python/requirements.txt
npm run build

# Setup frontend
cd ../frontend
npm install
npm run build

# Create environment files
sudo nano backend/.env  # Add production environment variables
sudo nano frontend/.env.local  # Add production environment variables
```

#### 3. Configure PM2

Create `ecosystem.config.js` in root:

```javascript
module.exports = {
  apps: [
    {
      name: 'vidsense-backend',
      cwd: './backend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'vidsense-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 4. Configure Nginx

Create `/etc/nginx/sites-available/vidsense`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/vidsense /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Cluster:**
   - Go to https://cloud.mongodb.com
   - Create a new cluster (Free tier available)
   - Choose your region

2. **Configure Access:**
   - Add IP whitelist (0.0.0.0/0 for all IPs, or specific IPs)
   - Create database user

3. **Get Connection String:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/vidsense?retryWrites=true&w=majority
   ```

### Local MongoDB

```bash
# Windows
# Download from: https://www.mongodb.com/try/download/community
# Run MongoDB Compass for GUI

# Linux
sudo systemctl start mongod
sudo systemctl enable mongod

# Mac
brew services start mongodb-community
```

### Database Initialization

The application will automatically create collections on first use. To manually initialize:

```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/vidsense

# Create indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.videos.createIndex({ videoId: 1, userId: 1 })
db.videos.createIndex({ userId: 1 })
db.summaries.createIndex({ videoId: 1 })
db.sentiments.createIndex({ videoId: 1 })
```

---

## Security Considerations

### 1. Environment Variables
- Never commit `.env` files to Git
- Use strong, random secrets for JWT tokens
- Rotate secrets regularly (every 90 days recommended)

### 2. MongoDB Security
```javascript
// Enable authentication in MongoDB
mongod --auth

// Create admin user
use admin
db.createUser({
  user: "admin",
  pwd: "strong-password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase"]
})

// Create app user
use vidsense
db.createUser({
  user: "vidsense",
  pwd: "strong-password",
  roles: ["readWrite"]
})
```

### 3. Rate Limiting
Already configured in the application. Adjust in `.env` if needed.

### 4. HTTPS
Always use HTTPS in production:
- Use Let's Encrypt for free SSL certificates
- Configure HSTS headers
- Redirect HTTP to HTTPS

### 5. Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

### 6. Password Policy
Enforced in the application:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

## Monitoring and Maintenance

### PM2 Monitoring

```bash
# View status
pm2 status

# View logs
pm2 logs vidsense-backend
pm2 logs vidsense-frontend

# Restart services
pm2 restart all

# Monitor resources
pm2 monit
```

### Database Backups

```bash
# MongoDB backup script
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
mongodump --uri="mongodb://localhost:27017/vidsense" --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} +
```

Set up cron job:
```bash
crontab -e
# Add: 0 2 * * * /path/to/backup-script.sh
```

### Log Rotation

Create `/etc/logrotate.d/vidsense`:

```
/var/www/vidsense/backend/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### Health Monitoring

Set up a cron job to check health:

```bash
#!/bin/bash
HEALTH_URL="https://your-domain.com/api/health"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $STATUS -ne 200 ]; then
    echo "Health check failed with status: $STATUS"
    # Send alert (email, Slack, etc.)
    pm2 restart all
fi
```

---

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failed
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check connection string
mongosh "your-connection-string"

# Check firewall
sudo ufw status
```

#### 2. Python Scripts Not Running
```bash
# Check Python installation
python3 --version
pip3 --version

# Reinstall dependencies
cd backend
pip3 install -r python/requirements.txt

# Check Python path in .env
which python3
```

#### 3. Port Already in Use
```bash
# Find process using port
# Windows:
netstat -ano | findstr :3001

# Linux/Mac:
lsof -i :3001

# Kill process
# Windows:
taskkill /PID <pid> /F

# Linux/Mac:
kill -9 <pid>
```

#### 4. JWT Token Errors
- Ensure JWT_SECRET and JWT_REFRESH_SECRET are set in .env
- Check token expiration settings
- Clear browser localStorage

#### 5. CORS Errors
- Check FRONTEND_URL in backend .env
- Verify CORS configuration in backend/src/index.ts
- Check browser console for specific error

#### 6. Video Analysis Timeout
- Increase server timeout in backend/src/index.ts
- Check YouTube API quota
- Verify video is accessible and has captions

### Logs Location

```bash
# PM2 logs
~/.pm2/logs/

# Nginx logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# MongoDB logs
/var/log/mongodb/mongod.log

# Application logs
# Check your configured log directory
```

### Performance Optimization

1. **Enable MongoDB Indexes:**
   ```javascript
   db.videos.createIndex({ userId: 1, createdAt: -1 })
   db.videos.createIndex({ videoId: 1 })
   ```

2. **Enable Nginx Caching:**
   ```nginx
   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m;
   ```

3. **Optimize Next.js:**
   ```javascript
   // next.config.js
   module.exports = {
     compress: true,
     images: {
       domains: ['i.ytimg.com'],
     },
   }
   ```

---

## Support and Updates

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Update backend
cd backend
npm install
pip3 install -r python/requirements.txt
npm run build
pm2 restart vidsense-backend

# Update frontend
cd ../frontend
npm install
npm run build
pm2 restart vidsense-frontend
```

### Getting Help

- GitHub Issues: https://github.com/yourusername/vidsense/issues
- Documentation: Check README.md and API_DOCUMENTATION.md
- Email: support@vidsense.com

---

## License

See LICENSE file for details.
