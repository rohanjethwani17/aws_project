# AI Features Setup Guide

## 🎯 What's Been Implemented

Your LMS now has two powerful AI features:

### 1. **AI-Powered Course Content Generation**
- Automatically generate complete course content from a simple outline
- Support for Text Lessons, Quizzes, and Video Scripts
- Async job processing with real-time progress tracking
- Rate limiting (5 generations per instructor per hour)
- Multi-provider support with automatic fallback

### 2. **Intelligent Course Recommendations**
- Personalized course recommendations for each student
- Based on enrollment history, interests, and similar users
- Trending courses section
- Feedback system to improve recommendations

---

## 🔑 Required API Keys

### Step 1: Get Free LLM API Keys

#### **Google Gemini** (Primary - Recommended)
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the key (starts with `AIzaSy...`)
5. **Free tier**: 60 requests/minute forever (no credit card needed)

#### **Hugging Face** (Backup)
1. Visit: https://huggingface.co/settings/tokens
2. Sign up or login
3. Click **"New token"**
4. Name it "LMS-AI" and select **"Read"** access
5. Copy the token (starts with `hf_...`)
6. **Free tier**: 30,000 requests/month

#### **Ollama** (Optional - Unlimited Local)
1. Visit: https://ollama.ai/download
2. Download for your OS (Mac/Linux/Windows)
3. Install and run: `ollama pull llama2`
4. No API key needed - runs on your machine
5. **Free tier**: Unlimited (runs locally)

### Step 2: Get Clerk Keys (Authentication)
1. Visit: https://dashboard.clerk.com
2. Go to **API Keys** section
3. Copy both:
   - **Secret Key** (starts with `sk_...`)
   - **Publishable Key** (starts with `pk_...`)

### Step 3: Add Keys to Environment File

Edit `/app/server/.env` and add your keys:

```bash
# AI LLM Provider API Keys
GEMINI_API_KEY=AIzaSy...your_actual_key_here
HUGGINGFACE_API_KEY=hf_...your_actual_key_here

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_...your_actual_key_here
CLERK_PUBLISHABLE_KEY=pk_...your_actual_key_here
```

---

## 🚀 Starting the Application

### Backend (Server)

1. Make sure DynamoDB Local is running:
```bash
cd /tmp/dynamodb_local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -inMemory &
```

2. Start the backend:
```bash
cd /app/server
npm run build
node dist/index.js
```

Server will run on `http://localhost:8001`

### Frontend (Client)

```bash
cd /app/client
yarn install  # if not already installed
yarn dev
```

Frontend will run on `http://localhost:3000`

---

## 📋 API Endpoints Added

### AI Content Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ai/courses/:courseId/generate-content` | Generate complete course content |
| GET | `/ai/generation-jobs/:jobId` | Get job status and progress |
| POST | `/ai/courses/:courseId/sections/:sectionId/chapters/:chapterId/regenerate` | Regenerate single chapter |
| DELETE | `/ai/generation-jobs/:jobId` | Cancel ongoing generation |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/recommendations/for-you?limit=5` | Get personalized recommendations |
| GET | `/recommendations/similar/:courseId?limit=5` | Get similar courses |
| POST | `/recommendations/feedback` | Record user feedback |
| GET | `/recommendations/trending?limit=10` | Get trending courses |

---

## 🧪 Testing the AI Features

### Test Content Generation (using curl)

```bash
# 1. Generate course content
curl -X POST http://localhost:8001/ai/courses/COURSE_ID/generate-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "outline": {
      "title": "Introduction to JavaScript",
      "description": "Learn JavaScript basics",
      "category": "Programming",
      "level": "Beginner",
      "sections": [
        {
          "sectionTitle": "Getting Started",
          "chapters": [
            {
              "title": "What is JavaScript?",
              "type": "Text"
            },
            {
              "title": "JavaScript Basics Quiz",
              "type": "Quiz"
            }
          ]
        }
      ]
    }
  }'

# 2. Check generation progress
curl http://localhost:8001/ai/generation-jobs/JOB_ID \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

### Test Recommendations

```bash
# Get personalized recommendations
curl http://localhost:8001/recommendations/for-you?limit=5 \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"

# Get trending courses
curl http://localhost:8001/recommendations/trending?limit=10 \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

---

## 🎨 Frontend Components (To Be Added)

The following components need to be created in the frontend:

### 1. **AI Content Generation Wizard**
- Location: `/app/client/src/components/ai/AIContentWizard.tsx`
- Features:
  - Multi-step form for course outline
  - Section and chapter builder
  - Generation options (tone, detail level)
  - Start generation button

### 2. **Generation Progress Component**
- Location: `/app/client/src/components/ai/GenerationProgress.tsx`
- Features:
  - Real-time progress bar
  - Current section/chapter indicator
  - Success/error notifications
  - Link to view generated content

### 3. **AI Badge Component**
- Location: `/app/client/src/components/ai/AIGeneratedBadge.tsx`
- Features:
  - "AI-Generated" badge for chapters
  - Disclaimer text
  - Toggle visibility option

### 4. **Recommendations Section**
- Location: `/app/client/src/components/recommendations/RecommendedCourses.tsx`
- Features:
  - Horizontal carousel of recommended courses
  - Match percentage display
  - Recommendation reasons
  - Thumbs up/down feedback buttons

### 5. **Similar Courses Component**
- Location: `/app/client/src/components/recommendations/SimilarCourses.tsx`
- Features:
  - Display on course detail page
  - Similarity score
  - Matching attributes

---

## 📊 Database Models Added

### ContentGenerationJob
Tracks AI content generation jobs with status and progress.

### RecommendationFeedback
Stores user feedback on recommendations to improve future suggestions.

### Course Model Extensions
- `aiGenerated`: Boolean flag
- `generationJobId`: Reference to generation job
- `aiMetadata`: Generation details (provider, date, tokens used)

### Chapter Model Extensions
- `aiGenerated`: Boolean flag
- `aiMetadata`: Chapter generation details

---

## 🔧 Troubleshooting

### Issue: "Rate limit exceeded"
**Solution**: You can only generate 5 courses per hour per instructor (to stay within free tier limits). Wait 1 hour or use Ollama for unlimited generations.

### Issue: "All LLM providers failed"
**Solution**: 
1. Check that at least one API key is configured in `.env`
2. Verify API keys are correct
3. Check API provider status pages
4. As a fallback, install Ollama locally

### Issue: "Could not connect to DynamoDB"
**Solution**: Start DynamoDB Local:
```bash
cd /tmp/dynamodb_local
java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb -inMemory &
```

### Issue: "Clerk authentication error"
**Solution**: Add valid Clerk keys to `/app/server/.env`

---

## 📈 Next Steps

1. **Add Your API Keys**: Edit `/app/server/.env` with your actual keys
2. **Restart Backend**: Kill and restart the server to load new keys
3. **Test AI Generation**: Try generating content for a test course
4. **Build Frontend Components**: Create the UI components listed above
5. **Test End-to-End**: Generate content and view recommendations in the UI

---

## 💡 Tips for Production

1. **Monitor API Usage**: Check your free tier limits regularly
2. **Rate Limiting**: Current limit is 5 generations/hour per instructor
3. **Content Quality**: Always review AI-generated content before publishing
4. **Feedback Loop**: Encourage students to rate recommendations
5. **Caching**: Recommendations are cached for 5 minutes to reduce API calls

---

## 🎓 Example Usage Flow

### For Instructors:
1. Create a new course
2. Define course outline (sections and chapters)
3. Click "Generate with AI"
4. Monitor progress in real-time
5. Review and edit generated content
6. Publish course

### For Students:
1. Browse course catalog
2. See personalized "Recommended For You" section
3. View match percentage and reasons
4. Provide feedback (👍/👎)
5. Discover similar courses on detail pages
6. Check trending courses

---

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Review `/tmp/server.log` for backend errors
3. Check browser console for frontend errors
4. Verify all API keys are correct and active

---

**Backend Implementation**: ✅ Complete
**Frontend Implementation**: ⏳ In Progress (Next Step)

All backend services, models, and API endpoints are ready. The system supports multiple LLM providers with automatic fallback and includes a sophisticated recommendation engine!
