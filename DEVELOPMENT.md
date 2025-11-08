# VidSense Development Setup Guide

Complete guide for setting up VidSense development environment on Windows, macOS, and Linux.

## System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **Node.js**: Version 18.0+ 
- **Python**: Version 3.8+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space

### Required Accounts
- **GitHub**: For code repository
- **MongoDB Atlas**: For database (free tier available)
- **Groq**: For AI API access (free tier available)

## Pre-Installation Steps

### 1. Install Node.js
```bash
# Windows (using Chocolatey)
choco install nodejs

# macOS (using Homebrew)
brew install node

# Linux (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.0+
npm --version   # Should show v9.0+
```

### 2. Install Python
```bash
# Windows (using Chocolatey)
choco install python

# macOS (using Homebrew)
brew install python@3.11

# Linux (Ubuntu/Debian)
sudo apt update
sudo apt install python3 python3-pip

# Verify installation
python --version  # Should show 3.8+
pip --version     # Should show pip 20.0+
```

### 3. Install Git
```bash
# Windows (using Chocolatey)
choco install git

# macOS (using Homebrew)
brew install git

# Linux (Ubuntu/Debian)
sudo apt install git

# Verify installation
git --version
```

## Project Setup

### 1. Clone Repository
```bash
# Clone the repository
git clone <your-repository-url>
cd VidSense

# Create development branch
git checkout -b development
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r python/requirements.txt

# Create environment file
cp .env.example .env
```

### 3. Frontend Setup

```bash
# Navigate to frontend (in new terminal)
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

## Environment Configuration

### Backend Environment (.env)

```env
# Development Configuration
NODE_ENV=development
PORT=5000

# Database (Replace with your MongoDB Atlas connection string)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vidsense?retryWrites=true&w=majority

# API Keys (Replace with your actual Groq API key)
GROQ_API_KEY=gsk_your_groq_api_key_here

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting (Relaxed for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Python Configuration
PYTHON_SCRIPTS_PATH=./python

# ChromaDB Configuration
CHROMADB_PERSIST_DIRECTORY=./chroma_db

# Logging
LOG_LEVEL=debug
```

### Frontend Environment (.env.local)

```env
# Development Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## API Key Setup

### 1. MongoDB Atlas

1. **Sign Up**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create free account
   - Verify email address

2. **Create Cluster**
   - Choose "Build a Database"
   - Select "Shared" (free tier)
   - Choose cloud provider and region
   - Keep default settings
   - Click "Create Cluster"

3. **Database Access**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and strong password
   - Grant "Read and write to any database" role
   - Click "Add User"

4. **Network Access**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" and click "Connect"
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - Replace `<username>`, `<password>`, and `myFirstDatabase` with your values

### 2. Groq API Key

1. **Sign Up**
   - Go to [console.groq.com](https://console.groq.com)
   - Sign up with email or GitHub
   - Verify account

2. **Create API Key**
   - Go to "API Keys" section
   - Click "Create API Key"
   - Name it "VidSense Development"
   - Copy the key (starts with `gsk_`)
   - Store securely - you won't see it again

3. **Verify Key**
   ```bash
   # Test API key with curl
   curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
     -H "Authorization: Bearer YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [{"role": "user", "content": "Hello!"}],
       "model": "llama-3.1-70b-versatile",
       "max_tokens": 50
     }'
   ```

## Running the Application

### Development Mode

1. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```
   
   Expected output:
   ```
   🚀 Server running on port 5000
   📚 Environment: development
   🔌 MongoDB connected successfully
   🐍 Python scripts initialized
   ✅ Server ready to accept connections
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   
   Expected output:
   ```
   ready - started server on 0.0.0.0:3000
   info  - Loaded env from .env.local
   event - compiled client and server successfully
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health: http://localhost:5000/api/health

### Testing the Setup

1. **Backend Health Check**
   ```bash
   curl http://localhost:5000/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "uptime": 123.45,
     "environment": "development",
     "database": "connected",
     "python": "available"
   }
   ```

2. **Frontend Test**
   - Open http://localhost:3000
   - Verify the page loads without errors
   - Check browser console for any error messages

3. **Full Pipeline Test**
   - Try analyzing a YouTube video (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)
   - Verify all components load data correctly
   - Check both frontend and backend console logs

## Development Workflow

### 1. Code Organization

```bash
# Feature branch workflow
git checkout -b feature/new-component
# Make changes
git add .
git commit -m "Add new component with tests"
git push origin feature/new-component
# Create pull request
```

### 2. Hot Reloading

- **Frontend**: Changes automatically reload the browser
- **Backend**: Nodemon restarts server on file changes
- **Python**: Manual restart required for Python script changes

### 3. Debugging

#### Frontend Debugging
```bash
# Enable verbose logging
export DEBUG=*
npm run dev

# Or add to .env.local
DEBUG=*
```

#### Backend Debugging
```bash
# Set log level to debug in .env
LOG_LEVEL=debug

# Enable Node.js debugging
npm run dev -- --inspect
```

#### Python Debugging
```bash
# Test individual Python scripts
cd backend/python
python transcript_extractor.py VIDEO_ID
python summarizer.py "test transcript"
python sentiment_analyzer.py "test transcript"
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   
   # Kill process on port 5000
   npx kill-port 5000
   ```

2. **Python Dependencies Issues**
   ```bash
   # Create virtual environment
   python -m venv venv
   
   # Activate virtual environment
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **MongoDB Connection Issues**
   - Verify connection string format
   - Check network access settings in MongoDB Atlas
   - Ensure IP whitelist includes your current IP

4. **API Key Issues**
   - Verify .env file format (no spaces around =)
   - Restart development servers after changing .env
   - Check API key hasn't expired

5. **CORS Issues**
   - Ensure FRONTEND_URL in backend .env matches frontend URL
   - Clear browser cache and cookies
   - Check browser console for specific CORS errors

### Debug Commands

```bash
# Check Node.js and npm versions
node --version && npm --version

# Check Python and pip versions
python --version && pip --version

# Check environment variables
node -e "console.log(process.env)"

# Test database connection
mongo "your-connection-string"

# Verify package installations
npm list
pip list
```

## IDE Setup

### VS Code Recommended Extensions

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "ms-python.python",
    "ms-python.pylint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-eslint"
  ]
}
```

### VS Code Settings
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "python.defaultInterpreterPath": "./backend/venv/bin/python"
}
```

## Performance Optimization

### Development Performance

1. **Enable Source Maps**
   ```javascript
   // next.config.js
   module.exports = {
     productionBrowserSourceMaps: true
   }
   ```

2. **Optimize Dependencies**
   ```bash
   # Analyze bundle size
   npm run build
   npm run analyze
   ```

3. **Database Indexing**
   ```javascript
   // Add indexes for development
   db.videos.createIndex({ video_id: 1 })
   db.summaries.createIndex({ video_id: 1 })
   db.sentiments.createIndex({ video_id: 1 })
   ```

This development guide ensures a smooth setup process for all team members and operating systems.