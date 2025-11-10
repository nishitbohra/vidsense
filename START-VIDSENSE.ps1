#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Start VidSense application with both backend and frontend servers

.DESCRIPTION
    This script starts the VidSense backend API (port 3001) and frontend (port 3000)
    It checks if ports are already in use and handles the startup process

.EXAMPLE
    .\START-VIDSENSE.ps1
#>

Write-Host "🚀 Starting VidSense Application..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Check if ports are already in use
$backendPort = 3001
$frontendPort = 3000

function Test-Port {
    param($Port)
    $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue -InformationLevel Quiet
    return $connection
}

# Check backend port
Write-Host "`n📡 Checking Backend Port ($backendPort)..." -ForegroundColor Yellow
if (Test-Port $backendPort) {
    Write-Host "⚠️  Port $backendPort is already in use. Backend might already be running." -ForegroundColor Yellow
} else {
    Write-Host "✅ Port $backendPort is available" -ForegroundColor Green
}

# Check frontend port
Write-Host "`n🌐 Checking Frontend Port ($frontendPort)..." -ForegroundColor Yellow
if (Test-Port $frontendPort) {
    Write-Host "⚠️  Port $frontendPort is already in use. Frontend might already be running." -ForegroundColor Yellow
} else {
    Write-Host "✅ Port $frontendPort is available" -ForegroundColor Green
}

Write-Host "`n" -NoNewline

# Start Backend
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev" -WindowStyle Normal

Write-Host "`n✅ VidSense is starting up!" -ForegroundColor Green
Write-Host "`n📋 Application URLs:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor White
Write-Host "   API Docs: http://localhost:3001/api-docs" -ForegroundColor White

Write-Host "`n👤 Demo Accounts:" -ForegroundColor Cyan
Write-Host "   Admin:    admin@vidsense.com / admin123" -ForegroundColor Yellow
Write-Host "   Customer: user@vidsense.com / user123" -ForegroundColor Blue

Write-Host "`n⏳ Please wait 10-15 seconds for servers to fully start..." -ForegroundColor Yellow
Write-Host "Then open your browser to http://localhost:3000" -ForegroundColor Green
Write-Host "`n💡 Tip: Check the new terminal windows for server logs" -ForegroundColor Gray
