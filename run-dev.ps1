# VidSense Development Server Runner
# This script starts both frontend and backend servers

Write-Host "🚀 Starting VidSense Development Servers..." -ForegroundColor Green

# Check if environment files exist
if (-not (Test-Path "backend/.env")) {
    Write-Host "❌ Backend .env file not found!" -ForegroundColor Red
    Write-Host "Please run setup.ps1 first or create backend/.env manually" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path "frontend/.env.local")) {
    Write-Host "❌ Frontend .env.local file not found!" -ForegroundColor Red
    Write-Host "Please run setup.ps1 first or create frontend/.env.local manually" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n🔧 Starting Backend Server..." -ForegroundColor Yellow
# Start backend server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\R6RW5M6\OneDrive - Deere & Co\Desktop\VidSense\backend'; npm run dev"

Write-Host "⏳ Waiting 5 seconds for backend to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 5

Write-Host "`n🎨 Starting Frontend Server..." -ForegroundColor Yellow
# Start frontend server in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\R6RW5M6\OneDrive - Deere & Co\Desktop\VidSense\frontend'; npm run dev"

Write-Host "`n✅ Both servers are starting!" -ForegroundColor Green
Write-Host "`n📱 Access URLs:" -ForegroundColor Yellow
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "   API Health: http://localhost:5000/api/health" -ForegroundColor Cyan

Write-Host "`n💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Two new PowerShell windows will open for the servers" -ForegroundColor White
Write-Host "   - Close those windows to stop the servers" -ForegroundColor White
Write-Host "   - Check the server windows for any error messages" -ForegroundColor White
Write-Host "   - Make sure you've added your API keys to backend/.env" -ForegroundColor White

Write-Host "`nPress any key to exit this script..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")