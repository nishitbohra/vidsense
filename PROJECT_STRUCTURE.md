# 📁 VidSense - Complete Project Structure Documentation

This document provides detailed information about every file and directory in the VidSense project, explaining their purpose, functionality, and key components.

---

## 📑 Table of Contents

1. [Root Directory](#root-directory)
2. [Frontend Structure](#frontend-structure)
3. [Backend Structure](#backend-structure)
4. [Configuration Files](#configuration-files)

---

## 🏠 Root Directory

### `README.md`
**Purpose**: Main project documentation and single source of truth

**Contains**:
- Project overview and features
- Installation instructions
- API documentation
- Deployment guide
- Troubleshooting tips
- Architecture details
- Performance metrics
- Contributing guidelines

**When to Update**: Whenever features change, new APIs are added, or deployment process changes

---

### `WORKSPACE_CLEANUP.md`
**Purpose**: Guide for cleaning up the workspace and removing unnecessary files

**Contains**:
- List of files safe to remove
- Build artifacts cleanup commands
- .gitignore best practices
- Post-cleanup verification steps

**Use Case**: When organizing the project or preparing for fresh deployment

---

### `.gitignore`
**Purpose**: Specifies which files Git should ignore

**Key Entries**:
- `node_modules/` - Dependencies
- `.env`, `.env.local` - Environment variables with secrets
- `dist/`, `.next/`, `build/` - Build outputs
- `chromadb/` - Vector database files
- `__pycache__/` - Python cache files
- `.vscode/`, `.idea/` - IDE configurations

**Why Important**: Prevents committing sensitive data and large binary files

---

### `setup.ps1`
**Purpose**: Automated setup script for Windows (PowerShell)

**What It Does**:
1. Checks if Node.js and Python are installed
2. Installs backend Node.js dependencies
3. Installs Python AI/ML dependencies
4. Creates `.env` files from templates
5. Verifies installation success

**Usage**: 
```powershell
.\setup.ps1
```

**When to Use**: First-time setup or after cloning the repository

---

### `run-dev.ps1`
**Purpose**: Starts both frontend and backend development servers concurrently

**What It Does**:
1. Opens two PowerShell windows
2. Starts backend server (`cd backend && npm run dev`)
3. Starts frontend server (`cd frontend && npm run dev`)
4. Keeps both running simultaneously

**Usage**:
```powershell
.\run-dev.ps1
```

**When to Use**: Daily development work

---

### `pre-deploy-check.ps1`
**Purpose**: Validates project before deployment to production

**What It Checks**:
- Environment variables are set
- Dependencies are installed
- TypeScript compiles without errors
- Database connection works
- API keys are valid
- Build process succeeds

**Usage**:
```powershell
.\pre-deploy-check.ps1
```

**When to Use**: Before deploying to Render or other cloud platforms

---

### `package.json` (Root)
**Purpose**: Root package configuration (if using monorepo setup)

**Contains**:
- Scripts for running both frontend and backend
- Workspace configuration (if applicable)
- Shared dependencies

**Note**: Currently, frontend and backend have their own separate `package.json` files

---

## 🎨 Frontend Structure

### 📂 `frontend/`

Root directory for the Next.js React application.

---

### `frontend/package.json`
**Purpose**: Frontend dependencies and scripts configuration

**Key Dependencies**:
- `next@14.x` - React framework
- `react@18.x` - UI library
- `typescript` - Type safety
- `tailwindcss` - Styling framework
- `axios` - HTTP client for API calls
- `chart.js`, `react-chartjs-2` - Data visualizations
- `lucide-react` - Icon library

**Scripts**:
- `npm run dev` - Start development server (port 3000)
- `npm run build` - Create production build
- `npm start` - Start production server
- `npm run lint` - Run ESLint

---

### `frontend/next.config.js`
**Purpose**: Next.js framework configuration

**Key Configurations**:
- API rewrites and redirects
- Environment variable exposure
- Image optimization settings
- Webpack customizations
- Output configuration (standalone for deployment)

**Example**:
```javascript
module.exports = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
}
```

---

### `frontend/tsconfig.json`
**Purpose**: TypeScript compiler configuration for frontend

**Key Settings**:
- `target: "ES2020"` - JavaScript version
- `module: "esnext"` - Module system
- `jsx: "preserve"` - React JSX handling
- `strict: true` - Strict type checking
- Path aliases: `@/*` maps to `./`

**Why Important**: Ensures type safety and proper module resolution

---

### `frontend/tailwind.config.js`
**Purpose**: Tailwind CSS framework configuration

**Key Configurations**:
- Content paths (where to look for class names)
- Theme extensions (custom colors, fonts)
- Dark mode configuration
- Custom animations (fade-in, slide-up, pulse)
- Breakpoints for responsive design

**Custom Theme**:
```javascript
theme: {
  extend: {
    colors: {
      primary: {...},
      secondary: {...},
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in',
      'float': 'float 3s ease-in-out infinite',
    }
  }
}
```

---

### `frontend/postcss.config.js`
**Purpose**: PostCSS configuration for processing CSS

**Plugins**:
- `tailwindcss` - Tailwind CSS processing
- `autoprefixer` - Vendor prefix addition

**Why Needed**: Required for Tailwind CSS to work properly

---

### `frontend/.env.local` *(Not committed)*
**Purpose**: Frontend environment variables (development/production)

**Variables**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_GA_ID=your_google_analytics_id (optional)
```

**Why Not Committed**: May contain sensitive configuration

---

### `frontend/.env.local.example`
**Purpose**: Template for `.env.local` file

**Usage**: Copy to `.env.local` and fill in actual values

---

### 📂 `frontend/app/`

Next.js 14 App Router directory (replaces old `pages/` directory).

---

### `frontend/app/layout.tsx`
**Purpose**: Root layout component that wraps all pages

**Key Features**:
- HTML structure (`<html>`, `<body>`)
- Global metadata (title, description, favicon)
- Navigation component inclusion
- Global styles import
- Font configuration (if any)

**Code Structure**:
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

**Why Important**: Every page inherits this layout

---

### `frontend/app/page.tsx`
**Purpose**: Home/Landing page (`/` route)

**Functionality**:
- Redirects users to `/dashboard` automatically
- Shows loading spinner during redirect
- Uses `useRouter` from Next.js for navigation

**User Experience**: Seamless redirect to main application

---

### 📂 `frontend/app/dashboard/`

Dashboard page directory.

---

### `frontend/app/dashboard/page.tsx`
**Purpose**: Main analysis interface

**Key Components**:
1. **Video Input Section**
   - YouTube URL input field
   - Validation logic
   - Submit button

2. **Loading State**
   - Animated spinner
   - Progress indicators
   - Status messages

3. **Analysis Results Display**
   - Summary cards (short + detailed)
   - Key points list
   - Topic visualization
   - Sentiment chart
   - Interactive visualizations

**State Management**:
```typescript
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
```

**API Integration**:
- Calls `analyzeVideo()` from `lib/api.ts`
- Handles success/error responses
- Updates UI based on state

**Why Central**: Main user interaction point

---

### 📂 `frontend/app/search/`

Semantic search page directory.

---

### `frontend/app/search/page.tsx`
**Purpose**: AI-powered semantic search interface

**Key Features**:
1. **Search Input**
   - Natural language query field
   - Search suggestions
   - Advanced filters

2. **Results Display**
   - Relevance scores
   - Video thumbnails
   - Matched text segments
   - Links to original videos

3. **Educational Section**
   - "How It Works" cards
   - Benefits of semantic search

**Search Flow**:
1. User enters query
2. Frontend sends to `/api/search`
3. Backend queries ChromaDB
4. Results displayed with relevance scores

---

### 📂 `frontend/app/history/`

History/library page directory.

---

### `frontend/app/history/page.tsx`
**Purpose**: Browse and manage previously analyzed videos

**Key Features**:
1. **Video Grid**
   - Card layout for each video
   - Thumbnail, title, metadata
   - Quick stats display

2. **Filtering & Sorting**
   - Sort by date, title, sentiment
   - Filter by topics, date range
   - Search within history

3. **Pagination**
   - Page controls
   - Items per page selector
   - Total count display

4. **Actions**
   - View full analysis
   - Re-analyze video
   - Export/Delete options

**State Management**:
```typescript
const [videos, setVideos] = useState<Video[]>([])
const [pagination, setPagination] = useState<PaginationInfo | null>(null)
const [currentPage, setCurrentPage] = useState(1)
```

**API Integration**:
- Fetches from `/api/videos?page=X&limit=Y`
- Handles pagination parameters

---

### 📂 `frontend/app/components/`

Reusable React components directory.

---

### `frontend/app/components/Navigation.tsx`
**Purpose**: Application navigation bar

**Features**:
- Logo/branding
- Navigation links (Dashboard, Search, History)
- Active link highlighting
- Responsive menu (mobile hamburger)
- Smooth transitions

**Code Pattern**:
```typescript
<nav className="bg-gray-900 border-b border-gray-800">
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/search">Search</Link>
  <Link href="/history">History</Link>
</nav>
```

---

### `frontend/app/components/VideoInput.tsx`
**Purpose**: YouTube URL input component

**Features**:
- URL input field with validation
- Real-time format checking
- Submit button with loading state
- Error message display
- Placeholder text and examples

**Props**:
```typescript
interface VideoInputProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}
```

**Validation**:
- Checks for valid YouTube URL formats
- Supports youtube.com, youtu.be, m.youtube.com

---

### `frontend/app/components/SummaryDisplay.tsx`
**Purpose**: Display video summary and key points

**Features**:
- Tabbed interface (Concise / Detailed)
- Key points bullet list
- Topic tags with colors
- Expandable sections
- Copy to clipboard button

**Data Structure**:
```typescript
interface SummaryProps {
  summary_short: string;
  summary_detailed: string;
  key_points: string[];
  topics: string[];
}
```

---

### `frontend/app/components/SentimentChart.tsx`
**Purpose**: Visualize sentiment analysis timeline

**Features**:
- Line chart showing sentiment over time
- Color-coded (Green=Positive, Yellow=Neutral, Red=Negative)
- Interactive tooltips
- Time-based x-axis
- Sentiment score y-axis

**Chart Library**: Chart.js with react-chartjs-2

**Data Format**:
```typescript
sentiment_timeline: Array<{
  timestamp: number;
  sentiment_label: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
}>
```

---

### `frontend/app/components/TopicCloud.tsx`
**Purpose**: Display extracted topics as visual tags

**Features**:
- Color-coded topic badges
- Hover effects
- Responsive grid layout
- Font size variation by importance

**Visual Style**:
```typescript
<div className="flex flex-wrap gap-2">
  {topics.map(topic => (
    <span className="px-3 py-1 bg-purple-500 rounded-full">
      {topic}
    </span>
  ))}
</div>
```

---

### `frontend/app/components/SearchInterface.tsx`
**Purpose**: Semantic search UI component

**Features**:
1. **Search Bar**
   - Query input
   - Search button
   - Loading state

2. **Filters**
   - Date range picker
   - Sentiment filter
   - Topic filter

3. **Results List**
   - Video cards
   - Relevance scores
   - Matched segments highlighted

**State**:
```typescript
const [query, setQuery] = useState('')
const [results, setResults] = useState([])
const [isSearching, setIsSearching] = useState(false)
```

---

### 📂 `frontend/lib/`

Utility functions and helper modules.

---

### `frontend/lib/api.ts`
**Purpose**: Centralized API client for backend communication

**Key Functions**:

1. **`analyzeVideo(url: string)`**
   - Endpoint: `POST /api/analyze`
   - Sends YouTube URL for analysis
   - Returns complete analysis result

2. **`searchVideos(query: string, limit?: number)`**
   - Endpoint: `GET /api/search`
   - Performs semantic search
   - Returns matching videos

3. **`getVideos(page?: number, limit?: number)`**
   - Endpoint: `GET /api/videos`
   - Fetches video history with pagination
   - Returns videos array + pagination info

4. **`getHealthStatus()`**
   - Endpoint: `GET /api/health`
   - Checks backend health
   - Returns service status

**Implementation**:
```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeVideo = async (youtubeUrl: string) => {
  const response = await apiClient.post('/api/analyze', { youtube_url: youtubeUrl });
  return response.data;
};
```

**Error Handling**:
- Catches network errors
- Parses API error messages
- Provides user-friendly error messages

---

### 📂 `frontend/styles/`

Global styling directory.

---

### `frontend/styles/globals.css`
**Purpose**: Global CSS styles and Tailwind directives

**Contains**:
1. **Tailwind Directives**:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```

2. **Custom CSS Classes**:
   ```css
   .card {
     @apply bg-gray-800 rounded-xl p-6 border border-gray-700;
   }
   
   .card-gradient {
     @apply bg-gradient-to-br from-gray-900 to-gray-800;
   }
   ```

3. **Custom Animations**:
   ```css
   @keyframes fadeIn {
     from { opacity: 0; }
     to { opacity: 1; }
   }
   
   @keyframes float {
     0%, 100% { transform: translateY(0); }
     50% { transform: translateY(-10px); }
   }
   ```

4. **Global Resets**:
   - Smooth scrolling
   - Dark theme defaults
   - Typography base styles

---

### 📂 `frontend/.next/`

**Purpose**: Next.js build output directory (auto-generated)

**Contains**:
- Compiled JavaScript bundles
- Static assets
- Server-side rendering files
- Build manifests

**Important**: Never commit this folder (in .gitignore)

---

## ⚙️ Backend Structure

### 📂 `backend/`

Root directory for Express.js API server and Python AI services.

---

### `backend/package.json`
**Purpose**: Backend dependencies and scripts configuration

**Key Dependencies**:
- `express` - Web framework
- `typescript` - Type safety
- `mongoose` - MongoDB ODM
- `dotenv` - Environment variables
- `cors` - Cross-origin resource sharing
- `express-rate-limit` - Rate limiting
- `helmet` - Security headers
- `nodemon` - Auto-restart during development

**Scripts**:
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint

---

### `backend/tsconfig.json`
**Purpose**: TypeScript compiler configuration for backend

**Key Settings**:
- `target: "ES2020"` - JavaScript version
- `module: "commonjs"` - Node.js module system
- `outDir: "./dist"` - Compiled output directory
- `rootDir: "./src"` - Source directory
- `strict: true` - Strict type checking
- `esModuleInterop: true` - CommonJS/ES module compatibility

---

### `backend/nodemon.json`
**Purpose**: Nodemon configuration for auto-restart during development

**Configuration**:
```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts", "node_modules"],
  "exec": "ts-node src/index.ts"
}
```

**What It Does**: Watches `src/` folder and restarts server on file changes

---

### `backend/render.yaml`
**Purpose**: Render.com deployment configuration

**Key Settings**:
- Service type (web service)
- Build command
- Start command
- Environment variables
- Python runtime version
- Health check endpoint

**Example**:
```yaml
services:
  - type: web
    name: vidsense-backend
    env: node
    buildCommand: npm install && npm run build && pip install -r python/requirements.txt
    startCommand: npm start
    healthCheckPath: /api/health
```

---

### `backend/.env` *(Not committed)*
**Purpose**: Backend environment variables

**Required Variables**:
```env
# Server
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/vidsense

# AI/ML
GROQ_API_KEY=gsk_your_key_here

# Security
FRONTEND_URL=http://localhost:3000
TRUST_PROXY=true

# Optional
YOUTUBE_PROXY=http://proxy:port
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Why Critical**: Contains all secrets and configuration

---

### `backend/.env.example`
**Purpose**: Template for `.env` file

**Usage**: Copy to `.env` and fill in actual values

---

### 📂 `backend/src/`

Main backend source code directory.

---

### `backend/src/index.ts`
**Purpose**: Main entry point for Express.js application

**Key Responsibilities**:

1. **Import Dependencies**:
   ```typescript
   import express from 'express';
   import cors from 'cors';
   import helmet from 'helmet';
   import rateLimit from 'express-rate-limit';
   ```

2. **Initialize Express App**:
   ```typescript
   const app = express();
   app.set('trust proxy', 1); // Important for Render
   ```

3. **Apply Middleware**:
   ```typescript
   app.use(helmet()); // Security headers
   app.use(cors(corsOptions)); // CORS
   app.use(express.json()); // JSON parsing
   app.use(rateLimiter); // Rate limiting
   ```

4. **Mount Routes**:
   ```typescript
   app.use('/api/analyze', analyzeRouter);
   app.use('/api/search', searchRouter);
   app.use('/api/videos', videosRouter);
   app.use('/api/health', healthRouter);
   ```

5. **Connect to Database**:
   ```typescript
   import { connectDB } from './config/database';
   await connectDB();
   ```

6. **Start Server**:
   ```typescript
   const PORT = process.env.PORT || 5000;
   app.listen(PORT, () => {
     console.log(`Server running on port ${PORT}`);
   });
   ```

**Error Handling**:
- Global error handler middleware
- Graceful shutdown on SIGTERM/SIGINT

---

### 📂 `backend/src/config/`

Configuration files directory.

---

### `backend/src/config/database.ts`
**Purpose**: MongoDB Atlas connection configuration

**Key Functions**:

1. **`connectDB()`**:
   ```typescript
   export const connectDB = async () => {
     try {
       await mongoose.connect(process.env.MONGODB_URI!, {
         useNewUrlParser: true,
         useUnifiedTopology: true,
       });
       console.log('MongoDB Connected');
     } catch (error) {
       console.error('MongoDB connection failed:', error);
       process.exit(1);
     }
   };
   ```

2. **Connection Event Handlers**:
   - `connected` - Log success
   - `error` - Log errors
   - `disconnected` - Log disconnection

**Why Important**: Database must be connected before handling requests

---

### `backend/src/config/env.ts`
**Purpose**: Environment variable validation and type-safe access

**Key Functions**:

1. **`validateEnv()`**:
   ```typescript
   export const validateEnv = () => {
     const required = ['MONGODB_URI', 'GROQ_API_KEY'];
     for (const key of required) {
       if (!process.env[key]) {
         throw new Error(`Missing required env variable: ${key}`);
       }
     }
   };
   ```

2. **`getEnvVar(key: string, defaultValue?: string)`**:
   ```typescript
   export const getEnvVar = (key: string, defaultValue?: string): string => {
     const value = process.env[key];
     if (!value && !defaultValue) {
       throw new Error(`Environment variable ${key} is not set`);
     }
     return value || defaultValue!;
   };
   ```

**Why Important**: Prevents runtime errors from missing configuration

---

### 📂 `backend/src/models/`

MongoDB Mongoose models directory.

---

### `backend/src/models/Video.ts`
**Purpose**: Video document schema and model

**Schema Fields**:
```typescript
const videoSchema = new Schema({
  video_id: { type: String, required: true, unique: true },
  title: { type: String, default: '' },
  url: { type: String, required: true },
  transcript: { type: String, default: '' },
  transcript_length: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});
```

**Indexes**:
- `video_id` (unique) - Fast lookups
- `created_at` - Sorting by date

**Methods**:
```typescript
videoSchema.methods.toJSON = function() {
  // Custom JSON serialization
};
```

**Why Important**: Defines how video data is stored in MongoDB

---

### `backend/src/models/Summary.ts`
**Purpose**: Summary data schema and model

**Schema Fields**:
```typescript
const summarySchema = new Schema({
  video_id: { type: String, required: true, ref: 'Video' },
  summary_short: { type: String, required: true },
  summary_detailed: { type: String, required: true },
  key_points: [{ type: String }],
  topics: [{ type: String }],
  created_at: { type: Date, default: Date.now },
});
```

**Relationships**:
- References `Video` model via `video_id`

**Why Important**: Stores AI-generated summaries separately for flexibility

---

### `backend/src/models/Sentiment.ts`
**Purpose**: Sentiment analysis data schema

**Schema Fields**:
```typescript
const sentimentSchema = new Schema({
  video_id: { type: String, required: true, ref: 'Video' },
  overall_sentiment: { 
    type: String, 
    enum: ['positive', 'neutral', 'negative'],
    required: true 
  },
  confidence: { type: Number, required: true },
  sentiment_timeline: [{
    timestamp: { type: Number, required: true },
    sentiment_label: { 
      type: String, 
      enum: ['positive', 'neutral', 'negative'] 
    },
    sentiment_score: { type: Number },
    text_segment: { type: String }
  }],
  created_at: { type: Date, default: Date.now },
});
```

**Why Important**: Stores detailed sentiment analysis results

---

### 📂 `backend/src/routes/`

API route handlers directory.

---

### `backend/src/routes/analyze.ts`
**Purpose**: Video analysis endpoint

**Endpoint**: `POST /api/analyze`

**Request Body**:
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Workflow**:
1. **Validate URL**:
   ```typescript
   const videoId = extractVideoId(youtube_url);
   if (!videoId) {
     return res.status(400).json({ error: 'Invalid URL' });
   }
   ```

2. **Check Cache**:
   ```typescript
   const existingVideo = await Video.findOne({ video_id: videoId });
   if (existingVideo && !isStale(existingVideo)) {
     return res.json({ ...existingVideo, cached: true });
   }
   ```

3. **Extract Transcript**:
   ```typescript
   const transcript = await pythonBridge.extractTranscript(videoId);
   ```

4. **Run AI Analysis** (parallel):
   ```typescript
   const [summary, sentiment] = await Promise.all([
     pythonBridge.generateSummary(transcript),
     pythonBridge.analyzeSentiment(transcript)
   ]);
   ```

5. **Store Results**:
   ```typescript
   await Video.create({ video_id: videoId, transcript, ... });
   await Summary.create({ video_id: videoId, ...summary });
   await Sentiment.create({ video_id: videoId, ...sentiment });
   ```

6. **Generate Embeddings**:
   ```typescript
   await pythonBridge.generateEmbedding(videoId, transcript);
   ```

7. **Return Response**:
   ```typescript
   res.json({ success: true, data: { ...video, ...summary, ...sentiment } });
   ```

**Error Handling**:
- Try-catch blocks
- Specific error messages
- HTTP status codes (400, 500)

---

### `backend/src/routes/search.ts`
**Purpose**: Semantic search endpoint

**Endpoint**: `GET /api/search?query=TEXT&limit=10`

**Query Parameters**:
- `query` (required): Search string
- `limit` (optional): Number of results (default: 10, max: 50)

**Workflow**:
1. **Validate Query**:
   ```typescript
   if (!query || query.trim() === '') {
     return res.status(400).json({ error: 'Query required' });
   }
   ```

2. **Search ChromaDB**:
   ```typescript
   const results = await chromaService.searchSimilar(query, limit);
   ```

3. **Fetch Video Details**:
   ```typescript
   const videoIds = results.map(r => r.video_id);
   const videos = await Video.find({ video_id: { $in: videoIds } });
   ```

4. **Merge Results**:
   ```typescript
   const enrichedResults = results.map(r => ({
     ...r,
     ...videos.find(v => v.video_id === r.video_id)
   }));
   ```

5. **Return Response**:
   ```typescript
   res.json({ success: true, data: { query, results: enrichedResults } });
   ```

---

### `backend/src/routes/videos.ts`
**Purpose**: Video history endpoint

**Endpoint**: `GET /api/videos?page=1&limit=20`

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `sort` (optional): Sort field (default: 'created_at')
- `order` (optional): 'asc' or 'desc' (default: 'desc')

**Workflow**:
1. **Parse Parameters**:
   ```typescript
   const page = parseInt(req.query.page as string) || 1;
   const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
   const skip = (page - 1) * limit;
   ```

2. **Query Database**:
   ```typescript
   const videos = await Video.find()
     .sort({ [sort]: order === 'asc' ? 1 : -1 })
     .skip(skip)
     .limit(limit)
     .lean();
   ```

3. **Get Total Count**:
   ```typescript
   const total = await Video.countDocuments();
   ```

4. **Calculate Pagination**:
   ```typescript
   const pagination = {
     page,
     limit,
     total,
     totalPages: Math.ceil(total / limit),
     hasNext: page * limit < total,
     hasPrev: page > 1
   };
   ```

5. **Return Response**:
   ```typescript
   res.json({ success: true, data: { videos, pagination } });
   ```

---

### `backend/src/routes/health.ts`
**Purpose**: Health check endpoint

**Endpoint**: `GET /api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T12:34:56.789Z",
  "uptime": 3600,
  "services": {
    "database": "connected",
    "ai_service": "operational",
    "python_bridge": "ready"
  }
}
```

**Checks**:
1. **Database Connection**:
   ```typescript
   const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
   ```

2. **Python Bridge**:
   ```typescript
   const pythonStatus = await pythonBridge.healthCheck();
   ```

3. **AI Service**:
   ```typescript
   const aiStatus = process.env.GROQ_API_KEY ? 'operational' : 'unavailable';
   ```

**Why Important**: Used by Render for health checks and monitoring

---

### 📂 `backend/src/services/`

Business logic and service layer directory.

---

### `backend/src/services/pythonBridge.ts`
**Purpose**: Bridge between Node.js and Python AI scripts

**Key Functions**:

1. **`extractTranscript(videoId: string)`**:
   ```typescript
   export const extractTranscript = async (videoId: string): Promise<string> => {
     return new Promise((resolve, reject) => {
       const pythonProcess = spawn('python', [
         'python/transcript_extractor.py',
         videoId
       ]);
       
       let output = '';
       pythonProcess.stdout.on('data', (data) => {
         output += data.toString();
       });
       
       pythonProcess.on('close', (code) => {
         if (code === 0) {
           const result = JSON.parse(output);
           resolve(result.transcript);
         } else {
           reject(new Error('Transcript extraction failed'));
         }
       });
     });
   };
   ```

2. **`generateSummary(transcript: string)`**:
   - Spawns `python/summarizer.py`
   - Passes transcript as stdin
   - Returns summary object

3. **`analyzeSentiment(transcript: string)`**:
   - Spawns `python/sentiment_analyzer.py`
   - Returns sentiment analysis

4. **`generateEmbedding(videoId: string, transcript: string)`**:
   - Spawns `python/embedding_generator.py`
   - Stores vector in ChromaDB
   - No return value (fire-and-forget)

**Error Handling**:
- Captures stderr
- Parses Python exceptions
- Provides meaningful error messages

**Why Important**: Enables Node.js to leverage Python AI libraries

---

### `backend/src/services/chromaService.ts`
**Purpose**: ChromaDB vector database operations

**Key Functions**:

1. **`initializeCollection()`**:
   ```typescript
   export const initializeCollection = async () => {
     const client = new ChromaClient();
     const collection = await client.getOrCreateCollection({
       name: 'video_transcripts',
       metadata: { description: 'Video transcript embeddings' }
     });
     return collection;
   };
   ```

2. **`searchSimilar(query: string, limit: number = 10)`**:
   ```typescript
   export const searchSimilar = async (query: string, limit: number) => {
     const collection = await initializeCollection();
     
     // Generate query embedding (via Python)
     const queryEmbedding = await pythonBridge.generateQueryEmbedding(query);
     
     // Search ChromaDB
     const results = await collection.query({
       queryEmbeddings: [queryEmbedding],
       nResults: limit
     });
     
     return results;
   };
   ```

3. **`deleteVideo(videoId: string)`**:
   - Removes embedding from ChromaDB
   - Used when deleting video from history

**Why Important**: Enables semantic search functionality

---

### 📂 `backend/src/utils/`

Utility functions directory.

---

### `backend/src/utils/videoUtils.ts`
**Purpose**: YouTube video URL parsing and validation

**Key Functions**:

1. **`extractVideoId(url: string)`**:
   ```typescript
   export const extractVideoId = (url: string): string | null => {
     const patterns = [
       /youtube\.com\/watch\?v=([^&]+)/,
       /youtu\.be\/([^?]+)/,
       /youtube\.com\/embed\/([^?]+)/,
       /m\.youtube\.com\/watch\?v=([^&]+)/
     ];
     
     for (const pattern of patterns) {
       const match = url.match(pattern);
       if (match) return match[1];
     }
     
     return null;
   };
   ```

2. **`validateYouTubeUrl(url: string)`**:
   ```typescript
   export const validateYouTubeUrl = (url: string): boolean => {
     return extractVideoId(url) !== null;
   };
   ```

3. **`formatDuration(seconds: number)`**:
   ```typescript
   export const formatDuration = (seconds: number): string => {
     const hours = Math.floor(seconds / 3600);
     const minutes = Math.floor((seconds % 3600) / 60);
     const secs = seconds % 60;
     
     if (hours > 0) {
       return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
     }
     return `${minutes}:${String(secs).padStart(2, '0')}`;
   };
   ```

**Why Important**: Ensures valid YouTube URLs are processed

---

### 📂 `backend/python/`

Python AI/ML scripts directory.

---

### `backend/python/requirements.txt`
**Purpose**: Python dependencies specification

**Key Dependencies**:
```txt
youtube-transcript-api==1.2.3  # Transcript extraction
groq>=0.33.0                   # LLM API
transformers>=4.30.0           # NLP models
sentence-transformers>=2.2.0   # Embeddings
torch>=2.0.0                   # Deep learning
chromadb>=0.4.0                # Vector database
nltk>=3.8.0                    # Text processing
numpy>=1.24.0                  # Numerical computing
requests>=2.31.0               # HTTP requests
python-dotenv>=1.0.0           # Environment variables
```

**Installation**:
```bash
pip install -r requirements.txt
```

---

### `backend/python/transcript_extractor.py`
**Purpose**: Extract YouTube video transcripts

**Functionality**:

1. **Import Libraries**:
   ```python
   from youtube_transcript_api import YouTubeTranscriptApi
   import sys
   import json
   import os
   ```

2. **Extract Transcript**:
   ```python
   def extract_transcript(video_id):
       try:
           # Check for proxy
           proxy = os.getenv('YOUTUBE_PROXY')
           proxies = None
           if proxy:
               proxies = {'http': proxy, 'https': proxy}
           
           # Extract transcript
           transcript = YouTubeTranscriptApi.get_transcript(
               video_id,
               proxies=proxies
           )
           
           # Format text
           text = ' '.join([entry['text'] for entry in transcript])
           
           return {
               'success': True,
               'transcript': text,
               'video_id': video_id
           }
       except Exception as e:
           return {
               'success': False,
               'error': str(e),
               'error_type': type(e).__name__,
               'video_id': video_id
           }
   ```

3. **Main Execution**:
   ```python
   if __name__ == '__main__':
       video_id = sys.argv[1]
       result = extract_transcript(video_id)
       print(json.dumps(result))
   ```

**Input**: Video ID as command-line argument  
**Output**: JSON to stdout

**Error Handling**:
- Catches YouTube API errors
- Returns structured error messages
- Includes error types for debugging

---

### `backend/python/summarizer.py`
**Purpose**: Generate AI summaries using Groq API

**Functionality**:

1. **Initialize Groq Client**:
   ```python
   from groq import Groq
   import os
   
   client = Groq(api_key=os.getenv('GROQ_API_KEY'))
   ```

2. **Generate Summary**:
   ```python
   def generate_summary(transcript):
       prompt = f"""
       Analyze this video transcript and provide:
       
       1. CONCISE SUMMARY (200-300 words):
       A brief overview of the main content.
       
       2. DETAILED SUMMARY (500+ words):
       A comprehensive analysis with key details.
       
       3. KEY POINTS (5-7 bullet points):
       - Most important takeaways
       
       4. TOPICS (3-5 topics):
       Main themes discussed
       
       Transcript:
       {transcript}
       """
       
       response = client.chat.completions.create(
           model="llama-3.1-70b-versatile",
           messages=[{"role": "user", "content": prompt}],
           max_tokens=2000,
           temperature=0.7
       )
       
       return parse_response(response.choices[0].message.content)
   ```

3. **Parse Response**:
   ```python
   def parse_response(content):
       # Extract sections using regex or string parsing
       # Return structured dict
       return {
           'summary_short': '...',
           'summary_detailed': '...',
           'key_points': ['...'],
           'topics': ['...']
       }
   ```

**Input**: Transcript via stdin  
**Output**: JSON with summary data

---

### `backend/python/sentiment_analyzer.py`
**Purpose**: Analyze sentiment using DistilBERT

**Functionality**:

1. **Load Model**:
   ```python
   from transformers import pipeline
   
   analyzer = pipeline(
       "sentiment-analysis",
       model="distilbert-base-uncased-finetuned-sst-2-english"
   )
   ```

2. **Segment Transcript**:
   ```python
   def segment_transcript(transcript, interval_seconds=30):
       # Split into ~30 second segments
       words_per_segment = interval_seconds * 2  # ~2 words/sec
       words = transcript.split()
       
       segments = []
       for i in range(0, len(words), words_per_segment):
           segment_words = words[i:i+words_per_segment]
           segments.append({
               'timestamp': i * 15,  # Approximate timestamp
               'text': ' '.join(segment_words)
           })
       
       return segments
   ```

3. **Analyze Sentiment**:
   ```python
   def analyze_sentiment(transcript):
       segments = segment_transcript(transcript)
       
       timeline = []
       for segment in segments:
           result = analyzer(segment['text'])[0]
           timeline.append({
               'timestamp': segment['timestamp'],
               'sentiment_label': result['label'].lower(),
               'sentiment_score': result['score'],
               'text_segment': segment['text'][:100]
           })
       
       # Calculate overall sentiment
       overall = calculate_overall(timeline)
       
       return {
           'overall_sentiment': overall['label'],
           'confidence': overall['score'],
           'sentiment_timeline': timeline
       }
   ```

**Input**: Transcript via stdin  
**Output**: JSON with sentiment data

**Models Used**:
- DistilBERT (268MB)
- Pre-trained on SST-2 dataset
- ~87% accuracy

---

### `backend/python/embedding_generator.py`
**Purpose**: Generate and store embeddings in ChromaDB

**Functionality**:

1. **Initialize Models**:
   ```python
   from sentence_transformers import SentenceTransformer
   import chromadb
   
   # Load embedding model
   model = SentenceTransformer('all-MiniLM-L6-v2')
   
   # Connect to ChromaDB
   client = chromadb.PersistentClient(path="./chromadb")
   collection = client.get_or_create_collection("video_transcripts")
   ```

2. **Generate Embedding**:
   ```python
   def generate_embedding(video_id, transcript, metadata=None):
       # Generate vector
       embedding = model.encode(transcript).tolist()
       
       # Store in ChromaDB
       collection.add(
           ids=[video_id],
           embeddings=[embedding],
           documents=[transcript],
           metadatas=[metadata or {}]
       )
       
       return {
           'success': True,
           'video_id': video_id,
           'embedding_size': len(embedding)
       }
   ```

**Input**: Video ID, transcript, metadata via stdin  
**Output**: JSON confirmation

**Model Details**:
- all-MiniLM-L6-v2 (90MB)
- 384-dimensional vectors
- Optimized for semantic similarity

---

### `backend/python/semantic_search.py`
**Purpose**: Query ChromaDB for similar videos

**Functionality**:

1. **Initialize**:
   ```python
   from sentence_transformers import SentenceTransformer
   import chromadb
   
   model = SentenceTransformer('all-MiniLM-L6-v2')
   client = chromadb.PersistentClient(path="./chromadb")
   collection = client.get_collection("video_transcripts")
   ```

2. **Search Similar**:
   ```python
   def search_similar(query, limit=10):
       # Generate query embedding
       query_embedding = model.encode(query).tolist()
       
       # Query ChromaDB
       results = collection.query(
           query_embeddings=[query_embedding],
           n_results=limit
       )
       
       # Format results
       formatted = []
       for i in range(len(results['ids'][0])):
           formatted.append({
               'video_id': results['ids'][0][i],
               'relevance_score': 1 - results['distances'][0][i],  # Convert distance to similarity
               'matched_segment': results['documents'][0][i][:200],
               'metadata': results['metadatas'][0][i]
           })
       
       return {
           'success': True,
           'query': query,
           'results': formatted
       }
   ```

**Input**: Search query via stdin  
**Output**: JSON with matching videos

**Search Algorithm**:
- Cosine similarity in vector space
- Returns top-N most similar videos
- Includes relevance scores (0-1)

---

### 📂 `backend/chromadb/`

**Purpose**: ChromaDB persistent storage (auto-generated)

**Contains**:
- Vector indexes
- Metadata
- Collection configurations
- SQLite database files

**Important**: Excluded from git (in .gitignore)

---

### 📂 `backend/dist/`

**Purpose**: Compiled TypeScript output (auto-generated)

**Contains**:
- JavaScript files compiled from TypeScript
- Source maps
- Module declarations

**Usage**: Production server runs from this directory

**Important**: Excluded from git (in .gitignore)

---

## 📄 Configuration Files

### Root-Level Configuration

---

### `.gitignore`
See [Root Directory](#gitignore) section above.

---

### `package.json` (Root)
See [Root Directory](#packagejson-root) section above.

---

## 🔍 File Relationships

### Data Flow Between Files

```
User Input (frontend/app/dashboard/page.tsx)
    ↓
API Call (frontend/lib/api.ts)
    ↓
Express Route (backend/src/routes/analyze.ts)
    ↓
Python Bridge (backend/src/services/pythonBridge.ts)
    ↓
Python Scripts (backend/python/*.py)
    ↓
Database Models (backend/src/models/*.ts)
    ↓
Response back to Frontend
```

---

## 📊 File Size Reference

| File/Directory | Approximate Size |
|----------------|------------------|
| `node_modules/` | ~300-500MB (not committed) |
| `python models` | ~500MB (downloaded on first run) |
| `backend/dist/` | ~5-10MB (generated) |
| `frontend/.next/` | ~50-100MB (generated) |
| `chromadb/` | Scales with data (~10MB per 100 videos) |
| Source code | ~5-10MB |

---

## 🔄 File Update Frequency

| File | Update Frequency |
|------|------------------|
| `frontend/app/components/*.tsx` | High (during feature development) |
| `backend/src/routes/*.ts` | Medium (when adding endpoints) |
| `backend/python/*.py` | Low (stable AI logic) |
| `README.md` | Medium (documentation updates) |
| `package.json` | Low (dependency updates) |
| `*.config.js` | Very Low (configuration changes) |

---

## 🎯 Critical Files

**Never Delete**:
- `package.json` files
- `tsconfig.json` files
- `.env.example` files
- Python scripts in `backend/python/`
- MongoDB models in `backend/src/models/`

**Can Regenerate**:
- `node_modules/`
- `dist/`
- `.next/`
- `chromadb/` (data will be lost)

---

## 📝 Notes

1. **TypeScript Compilation**: `.ts` files in backend compile to `.js` in `dist/` folder
2. **Next.js Build**: `.tsx` files compile to optimized bundles in `.next/` folder
3. **Python Models**: Downloaded automatically on first run (takes 2-3 minutes)
4. **Environment Variables**: Always use `.env.example` as template, never commit `.env`
5. **Database Files**: ChromaDB and MongoDB store data separately from code

---

## 🔗 Related Documentation

- **README.md** - Main project documentation
- **WORKSPACE_CLEANUP.md** - Cleanup guide
- **API Documentation** - See README.md § API Documentation
- **Deployment Guide** - See README.md § Deployment Guide

---

**Last Updated**: November 10, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
