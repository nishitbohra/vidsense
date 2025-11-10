# Simple video CRUD test
$baseUrl = "http://localhost:5000/api"

Write-Host "`n🧪 Testing Video CRUD Operations" -ForegroundColor Cyan

# Login first
$loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body (@{
    email = "customer@vidsense.com"
    password = "Customer123!@#"
} | ConvertTo-Json) -ContentType "application/json"

$token = $loginResponse.token
Write-Host "✅ Logged in as: $($loginResponse.user.name)" -ForegroundColor Green

# Create video
Write-Host "`n📝 Creating video..." -ForegroundColor Yellow
try {
    $videoData = @{
        videoId = "newTest123"
        title = "Test Video"
        url = "https://www.youtube.com/watch?v=newTest123"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
    }

    $video = Invoke-RestMethod -Uri "$baseUrl/videos" -Method POST -Body $videoData -Headers $headers -ContentType "application/json"
    Write-Host "✅ Video created: $($video.video.video_id)" -ForegroundColor Green
    $videoId = $video.video.video_id
    
    # Update video
    Write-Host "`n📝 Updating video..." -ForegroundColor Yellow
    $updateData = @{
        title = "Updated Test Video Title"
    } | ConvertTo-Json

    $updated = Invoke-RestMethod -Uri "$baseUrl/videos/$videoId" -Method PUT -Body $updateData -Headers $headers -ContentType "application/json"
    Write-Host "✅ Video updated: $($updated.video.title)" -ForegroundColor Green
    
    # Delete video
    Write-Host "`n🗑️  Deleting video..." -ForegroundColor Yellow
    $deleted = Invoke-RestMethod -Uri "$baseUrl/videos/$videoId" -Method DELETE -Headers $headers
    Write-Host "✅ Video deleted successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ CRUD tests complete!" -ForegroundColor Green
