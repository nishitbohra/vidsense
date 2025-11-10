# VidSense API Documentation

## Overview
VidSense is a video analysis platform that provides sentiment analysis, summarization, and semantic search capabilities for YouTube videos. This API provides full CRUD operations with role-based access control.

## Base URL
```
Development: http://localhost:3001/api
Production: https://your-domain.com/api
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## User Roles
- **customer**: Regular users who can manage their own videos
- **admin**: Administrators with full access to all resources

---

## Authentication Endpoints

### Register User
Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe",
  "role": "customer"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### Login
Authenticate a user and receive JWT tokens.

**Endpoint:** `POST /api/auth/login`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "customer"
  },
  "tokens": {
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

---

### Refresh Token
Get a new access token using a refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Body:**
```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

### Get Profile
Get the authenticated user's profile.

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "customer",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Change Password
Change the authenticated user's password.

**Endpoint:** `PUT /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Body:**
```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

---

## Video Endpoints

### List Videos
Get all videos for the authenticated user.

**Endpoint:** `GET /api/videos`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 100)
- `sort` (optional): Sort field (default: -createdAt)

**Response:** `200 OK`
```json
{
  "videos": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "videoId": "dQw4w9WgXcQ",
      "title": "Sample Video Title",
      "channelTitle": "Sample Channel",
      "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
      "userId": "507f1f77bcf86cd799439012",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

---

### Get Video Details
Get detailed information about a specific video.

**Endpoint:** `GET /api/videos/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "videoId": "dQw4w9WgXcQ",
  "title": "Sample Video Title",
  "channelTitle": "Sample Channel",
  "description": "Video description...",
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "duration": "PT3M30S",
  "viewCount": 1000000,
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
  "userId": "507f1f77bcf86cd799439012",
  "summaries": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "videoId": "507f1f77bcf86cd799439011",
      "summary": "This video discusses...",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "topics": ["topic1", "topic2"]
    }
  ],
  "sentiments": [
    {
      "_id": "507f1f77bcf86cd799439014",
      "videoId": "507f1f77bcf86cd799439011",
      "overallSentiment": "positive",
      "sentimentScore": 0.85,
      "emotions": {
        "joy": 0.7,
        "sadness": 0.1,
        "anger": 0.05
      }
    }
  ]
}
```

---

### Create Video
Add a new video for analysis.

**Endpoint:** `POST /api/videos`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Sample Video Title",
  "channelTitle": "Sample Channel",
  "description": "Video description...",
  "publishedAt": "2024-01-01T00:00:00.000Z",
  "duration": "PT3M30S",
  "viewCount": 1000000,
  "thumbnail": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg"
}
```

**Response:** `201 Created`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "videoId": "dQw4w9WgXcQ",
  "title": "Sample Video Title",
  "userId": "507f1f77bcf86cd799439012",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Update Video
Update video information.

**Endpoint:** `PUT /api/videos/:id`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Updated Video Title",
  "description": "Updated description..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Video updated successfully",
  "video": {
    "_id": "507f1f77bcf86cd799439011",
    "videoId": "dQw4w9WgXcQ",
    "title": "Updated Video Title",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### Delete Video
Delete a video and all associated data.

**Endpoint:** `DELETE /api/videos/:id`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Video and associated data deleted successfully",
  "deletedCounts": {
    "summaries": 1,
    "sentiments": 1
  }
}
```

---

## Analysis Endpoints

### Analyze Video
Analyze a YouTube video for sentiment and generate a summary.

**Endpoint:** `POST /api/analyze`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```

**Response:** `200 OK`
```json
{
  "video": {
    "_id": "507f1f77bcf86cd799439011",
    "videoId": "dQw4w9WgXcQ",
    "title": "Sample Video Title"
  },
  "summary": {
    "summary": "This video discusses...",
    "keyPoints": ["Point 1", "Point 2"],
    "topics": ["topic1", "topic2"]
  },
  "sentiment": {
    "overallSentiment": "positive",
    "sentimentScore": 0.85,
    "emotions": {
      "joy": 0.7,
      "sadness": 0.1
    }
  }
}
```

---

## Search Endpoints

### Semantic Search
Search for videos using semantic search.

**Endpoint:** `POST /api/search`

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "query": "videos about artificial intelligence",
  "limit": 10
}
```

**Response:** `200 OK`
```json
{
  "results": [
    {
      "videoId": "507f1f77bcf86cd799439011",
      "title": "AI Video Title",
      "score": 0.95,
      "metadata": {
        "channelTitle": "Tech Channel",
        "publishedAt": "2024-01-01"
      }
    }
  ]
}
```

---

## Admin Endpoints
**Note:** All admin endpoints require admin role authentication.

### List All Users
Get a list of all users in the system.

**Endpoint:** `GET /api/admin/users`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `role` (optional): Filter by role ('admin' or 'customer')

**Response:** `200 OK`
```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "customer",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 50,
    "itemsPerPage": 20
  }
}
```

---

### Get User by ID
Get detailed information about a specific user.

**Endpoint:** `GET /api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "customer",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "videoCount": 15
}
```

---

### Create User
Create a new user (admin only).

**Endpoint:** `POST /api/admin/users`

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Doe",
  "role": "customer"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "newuser@example.com",
    "name": "Jane Doe",
    "role": "customer",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### Update User
Update user information.

**Endpoint:** `PUT /api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "admin",
  "password": "NewPassword123!"
}
```

**Response:** `200 OK`
```json
{
  "message": "User updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "jane.smith@example.com",
    "name": "Jane Smith",
    "role": "admin",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

### Delete User
Delete a user and all associated data.

**Endpoint:** `DELETE /api/admin/users/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "message": "User and all associated data deleted successfully",
  "deletedCounts": {
    "videos": 15,
    "summaries": 15,
    "sentiments": 15
  }
}
```

---

### List All Videos (Admin)
Get all videos in the system across all users.

**Endpoint:** `GET /api/admin/videos`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `userId` (optional): Filter by user ID

**Response:** `200 OK`
```json
{
  "videos": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "videoId": "dQw4w9WgXcQ",
      "title": "Sample Video",
      "userId": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "John Doe",
        "email": "user@example.com"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 200,
    "itemsPerPage": 20
  }
}
```

---

### Delete Video (Admin)
Delete any video and its associated data.

**Endpoint:** `DELETE /api/admin/videos/:id`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "message": "Video and associated data deleted successfully",
  "deletedCounts": {
    "summaries": 1,
    "sentiments": 1
  }
}
```

---

### Get Analytics
Get system-wide analytics and statistics.

**Endpoint:** `GET /api/admin/analytics`

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response:** `200 OK`
```json
{
  "users": {
    "total": 150,
    "admins": 5,
    "customers": 145,
    "recentSignups": 12
  },
  "videos": {
    "total": 1250,
    "analyzedToday": 45,
    "analyzedThisWeek": 280,
    "analyzedThisMonth": 890
  },
  "summaries": {
    "total": 1200
  },
  "sentiments": {
    "total": 1200,
    "distribution": {
      "positive": 650,
      "neutral": 400,
      "negative": 150
    }
  },
  "topUsers": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "user@example.com",
      "videoCount": 85
    }
  ]
}
```

---

## Health Check

### Health Status
Check the health status of the API.

**Endpoint:** `GET /api/health`

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": ["Email is required", "Password must be at least 8 characters"]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication Error",
  "message": "Invalid or missing token"
}
```

### 403 Forbidden
```json
{
  "error": "Authorization Error",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Email already exists"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong"
}
```

---

## Rate Limiting

- **General endpoints**: 100 requests per 15 minutes per IP
- **Analysis endpoint**: 10 requests per hour per IP

---

## Notes

1. All dates are in ISO 8601 format
2. All IDs are MongoDB ObjectIds
3. Passwords must be at least 8 characters long
4. JWT tokens expire after 24 hours (access) and 7 days (refresh)
5. Video analysis may take 30-120 seconds depending on video length
6. Semantic search uses ChromaDB for vector similarity search
7. Deleting a user or video will cascade delete all associated data

---

## Example Usage

### Using cURL

**Register a new user:**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "name": "John Doe",
    "role": "customer"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }'
```

**Get videos:**
```bash
curl -X GET http://localhost:3001/api/videos \
  -H "Authorization: Bearer <your_token>"
```

**Analyze a video:**
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }'
```

### Using JavaScript/TypeScript

```typescript
const API_BASE_URL = 'http://localhost:3001/api';

// Login
const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePassword123!'
  })
});

const { tokens } = await loginResponse.json();

// Get videos
const videosResponse = await fetch(`${API_BASE_URL}/videos`, {
  headers: {
    'Authorization': `Bearer ${tokens.accessToken}`
  }
});

const videos = await videosResponse.json();
```

---

## Support

For issues or questions, please contact the development team or open an issue on GitHub.
