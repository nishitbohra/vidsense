# VidSense - AI-Powered YouTube Content Analyzer

# VidSense - AI-Powered YouTube Content Analyzer

VidSense is a comprehensive AI-powered application that analyzes YouTube videos to extract transcripts, generate intelligent summaries, perform sentiment analysis, and enable semantic search across video content.

## 🚀 Features

- **Transcript Extraction**: Automatically extracts and processes YouTube video transcripts
- **AI Summarization**: Generates concise and detailed summaries using Groq's Llama models
- **Sentiment Analysis**: Analyzes emotional tone throughout video segments using DistilBERT
- **Topic Extraction**: Identifies and visualizes key topics and themes
- **Semantic Search**: Enables intelligent search across analyzed video content
- **Interactive Dashboard**: Modern React interface with real-time visualizations

## 🛠 Tech Stack

### Frontend
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Chart.js** for data visualizations
- **Axios** for API communication

### Backend
- **Express.js** with TypeScript
- **MongoDB Atlas** for data persistence
- **Mongoose** for ODM
- **Rate limiting** and security middleware
- **RESTful API** design

### AI/ML Pipeline
- **Python 3.8+** for AI processing
- **Groq API** (Llama models) for summarization
- **Hugging Face Transformers** (DistilBERT) for sentiment analysis
- **Sentence Transformers** (all-MiniLM-L6-v2) for embeddings
- **ChromaDB** for vector storage and semantic search
- **YouTube Transcript API** for transcript extraction

## 📋 Prerequisites

- **Node.js 18+**
- **Python 3.8+**
- **MongoDB Atlas** account
- **Groq API** key

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd VidSense
```

### 2. Backend Setup
```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies
pip install -r python/requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your API keys and database URLs
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your backend URL
```

### 4. Environment Configuration

#### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vidsense
GROQ_API_KEY=your_groq_api_key_here
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🚀 Running the Application

### Development Mode

1. **Start the Backend:**
```bash
cd backend
npm run dev
```

2. **Start the Frontend:**
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Production Build

1. **Backend:**
```bash
cd backend
npm run build
npm start
```

2. **Frontend:**
```bash
cd frontend
npm run build
npm start
```

## 📚 API Documentation

### POST /api/analyze
Analyzes a YouTube video and returns comprehensive insights.

**Request:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "video_id": "VIDEO_ID",
  "title": "Video Title",
  "summary_short": "Brief summary...",
  "summary_detailed": "Detailed summary...",
  "topics": ["topic1", "topic2"],
  "sentiment_timeline": [
    {
      "timestamp": "00:00:30",
      "sentiment_label": "POSITIVE",
      "sentiment_score": 0.85,
      "text_segment": "..."
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "cached": false
}
```

### GET /api/search
Performs semantic search across analyzed videos.

**Query Parameters:**
- `query`: Search query string
- `limit`: Number of results (default: 10)

### GET /api/videos
Retrieves list of analyzed videos with pagination.

### GET /api/health
Health check endpoint.

## 🏗 Project Structure

```
VidSense/
├── frontend/                 # Next.js React application
│   ├── app/
│   │   ├── components/      # React components
│   │   ├── lib/            # Utility functions
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Main page
│   ├── styles/
│   └── package.json
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── python/             # AI/ML Python scripts
│   │   ├── transcript_extractor.py
│   │   ├── summarizer.py
│   │   ├── sentiment_analyzer.py
│   │   ├── embedding_generator.py
│   │   └── semantic_search.py
│   └── package.json
└── README.md
```

## 🔍 How It Works

1. **Input**: User provides a YouTube video URL
2. **Transcript Extraction**: Python script extracts video transcript using YouTube API
3. **AI Processing**: 
   - Groq API generates summaries and extracts topics
   - DistilBERT analyzes sentiment across segments
   - Sentence transformers create embeddings for semantic search
4. **Storage**: Results stored in MongoDB, embeddings in ChromaDB
5. **Visualization**: Frontend displays interactive charts and insights

## 🚢 Deployment

### Frontend (Vercel)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Backend (Render)
1. Connect your repository to Render
2. Set up environment variables
3. Configure build and start commands:
   - Build: `npm install && npm run build && pip install -r python/requirements.txt`
   - Start: `npm start`

## 🔒 Security Features

- Rate limiting on API endpoints
- CORS protection
- Environment variable security
- Input validation with Joi
- MongoDB injection prevention

## 🐛 Troubleshooting

### Common Issues

1. **Python Dependencies**: Ensure Python 3.8+ and pip are installed
2. **API Keys**: Verify Groq API key is valid and has sufficient credits
3. **Database Connection**: Check MongoDB Atlas connection string and network access
4. **Port Conflicts**: Ensure ports 3000 and 5000 are available

### Debug Mode
Set `LOG_LEVEL=debug` in backend .env for detailed logging.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Groq for powerful LLM APIs
- Hugging Face for transformer models
- MongoDB Atlas for database hosting
- Vercel and Render for deployment platforms