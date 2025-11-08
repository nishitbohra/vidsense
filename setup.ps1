# VidSense Quick Start Setup Script
# Run this script to set up and run VidSense

Write-Host "🚀 VidSense Quick Setup Starting..." -ForegroundColor Green

# Check if Node.js is installed
Write-Host "`n📦 Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js is not installed. Please install Node.js first." -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/en/download/" -ForegroundColor Cyan
    Write-Host "After installation, restart PowerShell and run this script again." -ForegroundColor Cyan
    exit 1
}

# Check if Python is installed
Write-Host "`n🐍 Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✅ Python is installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed. Please install Python first." -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Cyan
    exit 1
}

# Setup Backend
Write-Host "`n🔧 Setting up Backend..." -ForegroundColor Yellow
Set-Location "backend"

Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Installing Python dependencies..." -ForegroundColor Cyan
pip install -r python/requirements.txt

Write-Host "Creating environment file..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✅ Created .env file from template" -ForegroundColor Green
    Write-Host "⚠️  Please edit backend/.env and add your API keys!" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Setup Frontend
Write-Host "`n🎨 Setting up Frontend..." -ForegroundColor Yellow
Set-Location "../frontend"

Write-Host "Installing Node.js dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Creating environment file..." -ForegroundColor Cyan
if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.local.example" ".env.local"
    Write-Host "✅ Created .env.local file from template" -ForegroundColor Green
} else {
    Write-Host "✅ .env.local file already exists" -ForegroundColor Green
}

# Return to root directory
Set-Location ".."

Write-Host "`n🎉 Setup Complete!" -ForegroundColor Green
Write-Host "`n📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Get your API keys:" -ForegroundColor White
Write-Host "   - MongoDB Atlas: https://www.mongodb.com/atlas" -ForegroundColor Cyan
Write-Host "   - Groq API: https://console.groq.com/" -ForegroundColor Cyan
Write-Host "`n2. Edit your environment files:" -ForegroundColor White
Write-Host "   - backend/.env (add MONGODB_URI and GROQ_API_KEY)" -ForegroundColor Cyan
Write-Host "   - frontend/.env.local (should be ready)" -ForegroundColor Cyan
Write-Host "`n3. Run the application:" -ForegroundColor White
Write-Host "   - Run: .\run-dev.ps1" -ForegroundColor Cyan
Write-Host "   - Or manually start both servers (see instructions below)" -ForegroundColor Cyan

Write-Host "`n🚀 To start development servers manually:" -ForegroundColor Yellow
Write-Host "Terminal 1 - Backend:" -ForegroundColor Cyan
Write-Host "   cd backend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`nTerminal 2 - Frontend:" -ForegroundColor Cyan
Write-Host "   cd frontend" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "`n📱 Access URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan