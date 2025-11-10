# VidSense API Testing Script
# Run this script to test all authentication and CRUD endpoints

$baseUrl = "http://localhost:5000/api"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   VidSense API Testing Script" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Server is healthy" -ForegroundColor Green
    Write-Host "   Status: $($health.status)" -ForegroundColor White
    Write-Host "   Database: $($health.database)" -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Admin Login
Write-Host "`nTest 2: Admin Login" -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@vidsense.com"
        password = "Admin123!@#"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $adminToken = $loginResponse.token
    
    Write-Host "✅ Admin login successful" -ForegroundColor Green
    Write-Host "   User: $($loginResponse.user.name)" -ForegroundColor White
    Write-Host "   Email: $($loginResponse.user.email)" -ForegroundColor White
    Write-Host "   Role: $($loginResponse.user.role)" -ForegroundColor White
    Write-Host "   Token: $($adminToken.Substring(0,50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ Admin login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This is expected if admin user doesn't exist yet" -ForegroundColor Yellow
    
    # Try to register admin user
    Write-Host "`nAttempting to register admin user..." -ForegroundColor Yellow
    try {
        $registerBody = @{
            email = "admin@vidsense.com"
            password = "Admin123!@#"
            name = "Admin User"
            role = "admin"
        } | ConvertTo-Json

        $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
        $adminToken = $registerResponse.token
        
        Write-Host "✅ Admin user registered successfully" -ForegroundColor Green
        Write-Host "   User: $($registerResponse.user.name)" -ForegroundColor White
        Write-Host "   Email: $($registerResponse.user.email)" -ForegroundColor White
    } catch {
        Write-Host "❌ Admin registration failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Test 3: Get Profile
Write-Host "`nTest 3: Get Profile" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    $profile = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method GET -Headers $headers
    Write-Host "✅ Profile retrieved successfully" -ForegroundColor Green
    Write-Host "   Name: $($profile.user.name)" -ForegroundColor White
    Write-Host "   Email: $($profile.user.email)" -ForegroundColor White
    Write-Host "   Role: $($profile.user.role)" -ForegroundColor White
} catch {
    Write-Host "❌ Get profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Register Customer User
Write-Host "`nTest 4: Register Customer User" -ForegroundColor Yellow
try {
    $customerBody = @{
        email = "customer@vidsense.com"
        password = "Customer123!@#"
        name = "Customer User"
        role = "customer"
    } | ConvertTo-Json

    $customerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $customerBody -ContentType "application/json"
    $customerToken = $customerResponse.token
    
    Write-Host "✅ Customer registered successfully" -ForegroundColor Green
    Write-Host "   User: $($customerResponse.user.name)" -ForegroundColor White
    Write-Host "   Email: $($customerResponse.user.email)" -ForegroundColor White
    Write-Host "   Role: $($customerResponse.user.role)" -ForegroundColor White
} catch {
    if ($_.Exception.Message -match "409") {
        Write-Host "⚠️  Customer already exists, logging in instead..." -ForegroundColor Yellow
        $loginBody = @{
            email = "customer@vidsense.com"
            password = "Customer123!@#"
        } | ConvertTo-Json
        
        $customerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
        $customerToken = $customerResponse.token
        Write-Host "✅ Customer login successful" -ForegroundColor Green
    } else {
        Write-Host "❌ Customer registration failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 5: List Users (Admin only)
Write-Host "`nTest 5: List Users (Admin)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    $users = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method GET -Headers $headers
    Write-Host "✅ Users listed successfully" -ForegroundColor Green
    Write-Host "   Total users: $($users.pagination.totalItems)" -ForegroundColor White
    foreach ($user in $users.users) {
        Write-Host "   - $($user.name) ($($user.email)) - Role: $($user.role)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ List users failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Get Analytics (Admin only)
Write-Host "`nTest 6: Get Analytics (Admin)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    $analytics = Invoke-RestMethod -Uri "$baseUrl/admin/stats" -Method GET -Headers $headers
    Write-Host "✅ Analytics retrieved successfully" -ForegroundColor Green
    Write-Host "   Total users: $($analytics.users.total)" -ForegroundColor White
    Write-Host "   Admins: $($analytics.users.admins)" -ForegroundColor White
    Write-Host "   Customers: $($analytics.users.customers)" -ForegroundColor White
    Write-Host "   Total videos: $($analytics.videos.total)" -ForegroundColor White
} catch {
    Write-Host "❌ Get analytics failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Try Admin Endpoint with Customer Token (Should Fail)
Write-Host "`nTest 7: Authorization Test (Customer accessing Admin endpoint)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $customerToken"
    }
    
    $result = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method GET -Headers $headers
    Write-Host "❌ Authorization test failed - customer was able to access admin endpoint!" -ForegroundColor Red
} catch {
    if ($_.Exception.Message -match "403") {
        Write-Host "✅ Authorization working correctly - customer blocked from admin endpoint" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unexpected error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Test 8: Create Video (Customer)
Write-Host "`nTest 8: Create Video (Customer)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $customerToken"
        "Content-Type" = "application/json"
    }
    
    $videoBody = @{
        videoId = "dQw4w9WgXcQ"
        title = "Test Video - Rick Astley"
        channelTitle = "Rick Astley"
        description = "Test video for API testing"
        thumbnail = "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg"
    } | ConvertTo-Json

    $video = Invoke-RestMethod -Uri "$baseUrl/videos" -Method POST -Body $videoBody -Headers $headers
    $videoId = $video._id
    
    Write-Host "✅ Video created successfully" -ForegroundColor Green
    Write-Host "   Video ID: $($video._id)" -ForegroundColor White
    Write-Host "   Title: $($video.title)" -ForegroundColor White
    Write-Host "   Channel: $($video.channelTitle)" -ForegroundColor White
} catch {
    Write-Host "❌ Create video failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: List Videos (Customer)
Write-Host "`nTest 9: List Videos (Customer)" -ForegroundColor Yellow
try {
    $headers = @{
        "Authorization" = "Bearer $customerToken"
    }
    
    $videos = Invoke-RestMethod -Uri "$baseUrl/videos" -Method GET -Headers $headers
    Write-Host "✅ Videos listed successfully" -ForegroundColor Green
    Write-Host "   Total videos: $($videos.pagination.totalItems)" -ForegroundColor White
    foreach ($video in $videos.videos) {
        Write-Host "   - $($video.title)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ List videos failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Update Video (Customer - Own Video)
Write-Host "`nTest 10: Update Video (Customer)" -ForegroundColor Yellow
if ($videoId) {
    try {
        $headers = @{
            "Authorization" = "Bearer $customerToken"
            "Content-Type" = "application/json"
        }
        
        $updateBody = @{
            title = "Updated Test Video Title"
            description = "Updated description"
        } | ConvertTo-Json

        $updated = Invoke-RestMethod -Uri "$baseUrl/videos/$videoId" -Method PUT -Body $updateBody -Headers $headers
        Write-Host "✅ Video updated successfully" -ForegroundColor Green
        Write-Host "   New title: $($updated.video.title)" -ForegroundColor White
    } catch {
        Write-Host "❌ Update video failed: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  Skipped - no video ID available" -ForegroundColor Yellow
}

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "   Testing Complete!" -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

Write-Host "Tokens for manual testing:" -ForegroundColor Yellow
Write-Host "Admin Token: $($adminToken.Substring(0,50))..." -ForegroundColor Gray
Write-Host "Customer Token: $($customerToken.Substring(0,50))..." -ForegroundColor Gray

Write-Host "`nTo use tokens in PowerShell:" -ForegroundColor Yellow
Write-Host '$adminToken = "' -NoNewline -ForegroundColor Gray
Write-Host $adminToken -NoNewline -ForegroundColor White
Write-Host '"' -ForegroundColor Gray

Write-Host "`nTest individual endpoints:" -ForegroundColor Yellow
Write-Host 'Invoke-RestMethod -Uri "http://localhost:5000/api/auth/profile" -Headers @{"Authorization"="Bearer $adminToken"}' -ForegroundColor Gray
