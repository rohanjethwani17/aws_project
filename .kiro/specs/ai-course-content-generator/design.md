# Design Document

## Overview

This design document outlines the architecture and implementation approach for adding AI-powered course content generation and intelligent course recommendations to the existing Learning Management System. The solution integrates Large Language Models (LLMs) for content generation and implements a recommendation engine using collaborative filtering and content-based algorithms. The design emphasizes scalability, cost-efficiency, and seamless integration with the existing Next.js/Express/DynamoDB stack while showcasing production-ready GenAI capabilities suitable for Amazon's technical standards.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Next.js)                        │
│  ┌──────────────────┐              ┌──────────────────────────┐ │
│  │ Course Creation  │              │  Course Discovery        │ │
│  │ with AI Generate │              │  with Recommendations    │ │
│  └────────┬─────────┘              └──────────┬───────────────┘ │
└───────────┼────────────────────────────────────┼─────────────────┘
            │                                    │
            │ HTTPS/REST                         │ HTTPS/REST
            │                                    │
┌───────────▼────────────────────────────────────▼─────────────────┐
│                    API Gateway / Express Server                  │
│  ┌──────────────────┐              ┌──────────────────────────┐ │
│  │ AI Content       │              │  Recommendation          │ │
│  │ Controller       │              │  Controller              │ │
│  └────────┬─────────┘              └──────────┬───────────────┘ │
└───────────┼────────────────────────────────────┼─────────────────┘
            │                                    │
            │                                    │
┌───────────▼────────────────────────────────────▼─────────────────┐
│                         Service Layer                            │
│  ┌──────────────────┐              ┌──────────────────────────┐ │
│  │ Content          │              │  Recommendation          │ │
│  │ Generation       │              │  Engine Service          │ │
│  │ Service          │              │                          │ │
│  └────────┬─────────┘              └──────────┬───────────────┘ │
└───────────┼────────────────────────────────────┼─────────────────┘
            │                                    │
            │                                    │
    ┌───────▼────────┐                  ┌────────▼────────┐
    │  Free LLM      │                  │   DynamoDB      │
    │  - Gemini API  │                  │   - Courses     │
    │  - HuggingFace │                  │   - Users       │
    │  - Ollama      │                  │   - Progress    │
    └────────────────┘                  │   - Jobs        │
                                        │   - Feedback    │
                                        └─────────────────┘
```

### Technology Stack Integration

**Existing Stack:**
- Frontend: Next.js 15, React 19, TypeScript, Redux Toolkit, Tailwind CSS
- Backend: Express.js, TypeScript, Node.js
- Database: AWS DynamoDB with Dynamoose ORM
- Auth: Clerk
- Storage: AWS S3 + CloudFront
- Payment: Stripe

**New AI Components:**
- LLM Integration: **Free Options:**
  - Primary: Hugging Face Inference API (free tier: 30,000 requests/month)
  - Alternative: Google Gemini API (free tier: 60 requests/minute)
  - Fallback: Ollama (local LLM - completely free, runs on your machine)
- Queue System: In-memory queue (sufficient for personal project)
- Caching: In-memory cache for recommendations (no cost)
- Monitoring: Console logging and simple file-based metrics (no cost)

## Components and Interfaces

### 1. AI Content Generation Service

**Purpose:** Manages the entire lifecycle of AI-powered content generation from request to completion.

**Location:** `server/src/services/aiContentGenerationService.ts`

**Key Methods:**

```typescript
interface AIContentGenerationService {
  // Generate complete course content from outline
  generateCourseContent(
    courseId: string,
    outline: CourseOutline,
    options: GenerationOptions
  ): Promise<ContentGenerationJob>;
  
  // Generate single chapter content
  generateChapterContent(
    courseId: string,
    sectionId: string,
    chapterType: ChapterType,
    context: ChapterContext
  ): Promise<Chapter>;
  
  // Check generation job status
  getJobStatus(jobId: string): Promise<ContentGenerationJob>;
  
  // Cancel ongoing generation
  cancelGeneration(jobId: string): Promise<void>;
  
  // Estimate token usage and cost
  estimateGenerationCost(outline: CourseOutline): Promise<CostEstimate>;
}

interface CourseOutline {
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  sections: SectionOutline[];
}

interface SectionOutline {
  sectionTitle: string;
  sectionDescription?: string;
  chapters: ChapterOutline[];
}

interface ChapterOutline {
  title: string;
  type: 'Text' | 'Quiz' | 'Video';
  learningObjectives?: string[];
}

interface GenerationOptions {
  tone?: 'professional' | 'casual' | 'academic';
  detailLevel?: 'concise' | 'detailed' | 'comprehensive';
  includeExamples?: boolean;
  targetAudience?: string;
}

interface ContentGenerationJob {
  jobId: string;
  courseId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentSection?: number;
  currentChapter?: number;
  totalSections: number;
  totalChapters: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  apiCallsUsed: number;
  provider: 'gemini' | 'huggingface' | 'ollama';
}
```

**Implementation Strategy:**

1. **Prompt Engineering:** Use structured prompts with few-shot examples for consistent output
2. **Streaming:** Process sections sequentially to provide progress updates
3. **Error Handling:** Implement retry logic with exponential backoff for API failures
4. **Rate Limiting:** Enforce per-instructor limits to stay within free tier limits
5. **Free Tier Management:** 
   - Google Gemini: 60 requests/minute (free forever)
   - Hugging Face: 30,000 requests/month (free tier)
   - Ollama: Unlimited (runs locally, no API costs)
6. **Smart Provider Selection:** Use Gemini for quick generations, Ollama for bulk/offline work

**Free LLM Provider Integration:**

```typescript
// LLM Provider Factory Pattern
interface LLMProvider {
  generateContent(prompt: string, options?: any): Promise<string>;
  isAvailable(): Promise<boolean>;
  getRateLimit(): { requests: number; period: string };
}

class GeminiProvider implements LLMProvider {
  // Google Gemini - Free tier: 60 req/min
  // Best for: Real-time generation, production use
  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }
  
  getRateLimit() {
    return { requests: 60, period: 'minute' };
  }
}

class HuggingFaceProvider implements LLMProvider {
  // Hugging Face - Free tier: 30k req/month
  // Best for: Backup, specific models
  async generateContent(prompt: string): Promise<string> {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ inputs: prompt })
      }
    );
    const data = await response.json();
    return data[0].generated_text;
  }
  
  getRateLimit() {
    return { requests: 30000, period: 'month' };
  }
}

class OllamaProvider implements LLMProvider {
  // Ollama - Unlimited, runs locally
  // Best for: Development, bulk generation, offline work
  async generateContent(prompt: string): Promise<string> {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama2',
        prompt: prompt,
        stream: false
      })
    });
    const data = await response.json();
    return data.response;
  }
  
  async isAvailable(): Promise<boolean> {
    try {
      await fetch('http://localhost:11434/api/tags');
      return true;
    } catch {
      return false;
    }
  }
  
  getRateLimit() {
    return { requests: Infinity, period: 'unlimited' };
  }
}

// Smart provider selection
class LLMService {
  private providers: LLMProvider[];
  
  constructor() {
    this.providers = [
      new GeminiProvider(),      // Primary: Fast, reliable
      new HuggingFaceProvider(), // Backup: Good quality
      new OllamaProvider()       // Fallback: Always available if installed
    ];
  }
  
  async generateContent(prompt: string): Promise<string> {
    for (const provider of this.providers) {
      try {
        if (await provider.isAvailable()) {
          return await provider.generateContent(prompt);
        }
      } catch (error) {
        console.log(`Provider failed, trying next...`);
        continue;
      }
    }
    throw new Error('All LLM providers failed');
  }
}
```

**LLM Prompt Templates:**

```typescript
const CONTENT_TEMPLATES = {
  textLesson: `You are an expert course instructor creating educational content.
  
Course Context:
- Title: {courseTitle}
- Level: {courseLevel}
- Category: {category}

Chapter Details:
- Section: {sectionTitle}
- Chapter: {chapterTitle}
- Learning Objectives: {objectives}

Generate a comprehensive lesson that:
1. Starts with a clear introduction
2. Covers key concepts with explanations
3. Includes practical examples
4. Ends with a summary of key takeaways

Format the content in markdown with proper headings, bullet points, and code blocks where appropriate.

Lesson Content:`,

  quiz: `You are creating assessment questions for an online course.

Course Context:
- Title: {courseTitle}
- Level: {courseLevel}
- Chapter: {chapterTitle}
- Content Summary: {contentSummary}

Generate 5-8 multiple choice questions that:
1. Test understanding of key concepts
2. Are appropriate for {courseLevel} level
3. Have 4 answer options each
4. Include explanations for correct answers

Return as JSON array:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "..."
  }
]`,

  videoScript: `You are creating a video script for an educational course.

Course Context:
- Title: {courseTitle}
- Chapter: {chapterTitle}
- Duration Target: 5-10 minutes

Create a video script with:
1. Timestamps for each section
2. Talking points for the instructor
3. Visual suggestions (diagrams, code, slides)
4. Engagement prompts (questions, activities)

Format:
[00:00] Introduction
- Talking points...
- Visual: ...

[01:30] Main Content
...`
};
```

### 2. Course Recommendation Engine Service

**Purpose:** Provides personalized course recommendations using collaborative filtering and content-based algorithms.

**Location:** `server/src/services/recommendationService.ts`

**Key Methods:**

```typescript
interface RecommendationService {
  // Get personalized recommendations for a student
  getRecommendations(
    userId: string,
    limit: number
  ): Promise<CourseRecommendation[]>;
  
  // Get similar courses based on a specific course
  getSimilarCourses(
    courseId: string,
    limit: number
  ): Promise<CourseRecommendation[]>;
  
  // Record user feedback on recommendations
  recordFeedback(
    userId: string,
    courseId: string,
    feedback: 'positive' | 'negative'
  ): Promise<void>;
  
  // Get trending/popular courses
  getTrendingCourses(limit: number): Promise<Course[]>;
  
  // Refresh recommendation cache for a user
  refreshRecommendations(userId: string): Promise<void>;
}

interface CourseRecommendation {
  course: Course;
  score: number; // 0-100
  reasons: RecommendationReason[];
}

interface RecommendationReason {
  type: 'category_match' | 'similar_users' | 'trending' | 'instructor_match';
  description: string;
  weight: number;
}
```

**Algorithm Design:**

**Hybrid Recommendation Approach:**

1. **Content-Based Filtering (40% weight):**
   - Compare course categories with user's enrolled courses
   - Analyze course descriptions using keyword matching
   - Consider course level progression (Beginner → Intermediate → Advanced)

2. **Collaborative Filtering (30% weight):**
   - Find users with similar enrollment patterns
   - Recommend courses that similar users enrolled in
   - Use Jaccard similarity for user comparison

3. **Popularity-Based (20% weight):**
   - Factor in enrollment count
   - Consider recent enrollment trends
   - Boost newly published courses slightly

4. **Instructor-Based (10% weight):**
   - Recommend other courses by instructors of enrolled courses
   - Consider instructor rating if available

**Scoring Formula:**

```typescript
function calculateRecommendationScore(
  userId: string,
  course: Course,
  userHistory: UserCourseProgress[]
): number {
  const contentScore = calculateContentSimilarity(course, userHistory);
  const collaborativeScore = calculateCollaborativeScore(userId, course);
  const popularityScore = calculatePopularityScore(course);
  const instructorScore = calculateInstructorScore(course, userHistory);
  
  const finalScore = 
    (contentScore * 0.4) +
    (collaborativeScore * 0.3) +
    (popularityScore * 0.2) +
    (instructorScore * 0.1);
  
  // Apply feedback adjustments
  const feedbackAdjustment = getUserFeedbackAdjustment(userId, course);
  
  return Math.min(100, Math.max(0, finalScore + feedbackAdjustment));
}
```

### 3. Content Generation Controller

**Purpose:** HTTP endpoints for AI content generation operations.

**Location:** `server/src/controllers/aiContentController.ts`

**Endpoints:**

```typescript
// POST /courses/:courseId/generate-content
// Generate complete course content from outline
async generateCourseContent(req: Request, res: Response): Promise<void>;

// POST /courses/:courseId/sections/:sectionId/chapters/:chapterId/regenerate
// Regenerate specific chapter content
async regenerateChapter(req: Request, res: Response): Promise<void>;

// GET /courses/:courseId/generation-jobs/:jobId
// Get status of content generation job
async getGenerationJobStatus(req: Request, res: Response): Promise<void>;

// DELETE /courses/:courseId/generation-jobs/:jobId
// Cancel ongoing content generation
async cancelGenerationJob(req: Request, res: Response): Promise<void>;

// POST /courses/:courseId/estimate-generation-cost
// Estimate cost before generating
async estimateGenerationCost(req: Request, res: Response): Promise<void>;
```

### 4. Recommendation Controller

**Purpose:** HTTP endpoints for course recommendations.

**Location:** `server/src/controllers/recommendationController.ts`

**Endpoints:**

```typescript
// GET /recommendations/for-you
// Get personalized recommendations for authenticated user
async getPersonalizedRecommendations(req: Request, res: Response): Promise<void>;

// GET /recommendations/similar/:courseId
// Get courses similar to a specific course
async getSimilarCourses(req: Request, res: Response): Promise<void>;

// POST /recommendations/feedback
// Record user feedback on recommendations
async recordRecommendationFeedback(req: Request, res: Response): Promise<void>;

// GET /recommendations/trending
// Get trending/popular courses
async getTrendingCourses(req: Request, res: Response): Promise<void>;
```

## Data Models

### ContentGenerationJob Model

**Location:** `server/src/models/contentGenerationJobModel.ts`

```typescript
const contentGenerationJobSchema = new Schema({
  jobId: {
    type: String,
    hashKey: true,
    required: true,
  },
  courseId: {
    type: String,
    required: true,
    index: {
      name: 'CourseIdIndex',
      type: 'global',
    },
  },
  instructorId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  outline: {
    type: Object,
    required: true,
  },
  options: {
    type: Object,
  },
  currentSection: {
    type: Number,
  },
  currentChapter: {
    type: Number,
  },
  totalSections: {
    type: Number,
    required: true,
  },
  totalChapters: {
    type: Number,
    required: true,
  },
  startedAt: {
    type: String,
    required: true,
  },
  completedAt: {
    type: String,
  },
  error: {
    type: String,
  },
  apiCallsUsed: {
    type: Number,
    default: 0,
  },
  llmProvider: {
    type: String,
    enum: ['gemini', 'huggingface', 'ollama'],
    default: 'gemini',
  },
}, {
  timestamps: true,
});
```

### RecommendationFeedback Model

**Location:** `server/src/models/recommendationFeedbackModel.ts`

```typescript
const recommendationFeedbackSchema = new Schema({
  feedbackId: {
    type: String,
    hashKey: true,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    index: {
      name: 'UserIdIndex',
      type: 'global',
    },
  },
  courseId: {
    type: String,
    required: true,
  },
  feedback: {
    type: String,
    enum: ['positive', 'negative'],
    required: true,
  },
  recommendationScore: {
    type: Number,
  },
  recommendationReasons: {
    type: Array,
    schema: [new Schema({
      type: String,
      description: String,
    })],
  },
}, {
  timestamps: true,
});
```

### Course Model Extensions

**Extend existing Course model** to include AI-related metadata:

```typescript
// Add to existing courseSchema
aiGenerated: {
  type: Boolean,
  default: false,
},
generationJobId: {
  type: String,
},
aiMetadata: {
  type: Object,
  schema: new Schema({
    generatedAt: String,
    llmProvider: String,
    modelVersion: String,
    tokensUsed: Number,
    modificationPercentage: {
      type: Number,
      default: 0,
    },
  }),
},
```

### Chapter Model Extensions

**Extend existing Chapter schema** within Course model:

```typescript
// Add to existing chapterSchema
aiGenerated: {
  type: Boolean,
  default: false,
},
aiMetadata: {
  type: Object,
  schema: new Schema({
    generatedAt: String,
    prompt: String,
    tokensUsed: Number,
    modified: Boolean,
  }),
},
```

## Error Handling

### LLM API Error Handling

```typescript
class LLMError extends Error {
  constructor(
    message: string,
    public provider: string,
    public statusCode?: number,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
  }
}

async function callLLMWithRetry(
  prompt: string,
  options: LLMOptions,
  maxRetries: number = 3
): Promise<string> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await callLLM(prompt, options);
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof LLMError && !error.retryable) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new LLMError(
    `Failed after ${maxRetries} attempts: ${lastError.message}`,
    'unknown',
    undefined,
    false
  );
}
```

### Error Response Patterns

```typescript
// Rate limit exceeded
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "You have reached the maximum of 10 content generations per hour",
  "retryAfter": 3600
}

// LLM API failure
{
  "error": "LLM_API_ERROR",
  "message": "Content generation failed due to API error",
  "jobId": "job_123",
  "retryable": true
}

// Invalid outline
{
  "error": "INVALID_OUTLINE",
  "message": "Course outline must contain at least one section",
  "validationErrors": [...]
}

// Free tier limit approaching
{
  "error": "FREE_TIER_LIMIT_WARNING",
  "message": "Approaching free tier limit. Consider using Ollama for unlimited generations.",
  "apiCallsUsed": 25000,
  "freeLimit": 30000,
  "provider": "huggingface"
}
```

## Testing Strategy

### Unit Tests

**Content Generation Service Tests:**
- Test prompt template generation with various course outlines
- Test token counting and cost estimation
- Test error handling and retry logic
- Mock LLM API responses for consistent testing

**Recommendation Service Tests:**
- Test scoring algorithm with known user histories
- Test edge cases (new users, no enrollments)
- Test feedback adjustment calculations
- Test similarity calculations

### Integration Tests

**API Endpoint Tests:**
- Test complete content generation flow
- Test job status polling
- Test recommendation retrieval with various user profiles
- Test feedback recording and score adjustments

**Database Tests:**
- Test ContentGenerationJob CRUD operations
- Test RecommendationFeedback storage and retrieval
- Test Course model extensions

### End-to-End Tests

**Content Generation Flow:**
1. Instructor creates course outline
2. Initiates content generation
3. Polls job status until completion
4. Verifies generated content structure
5. Edits generated content
6. Publishes course

**Recommendation Flow:**
1. Student enrolls in courses
2. Views recommendations
3. Provides feedback
4. Verifies recommendations update
5. Enrolls in recommended course

### Performance Tests

- Load test: 50 concurrent content generation requests
- Measure: Average generation time per chapter
- Target: < 10 seconds per text chapter, < 15 seconds per quiz
- Recommendation retrieval: < 500ms for cached, < 2s for fresh calculation

### Cost Monitoring Tests

- Track token usage across different course types
- Verify cost estimates match actual costs within 10%
- Test rate limiting enforcement
- Test cost alert triggers

## Security Considerations

### API Key Management

- Store LLM API keys in environment variables (.env file)
- Use free tier API keys (Google Gemini, Hugging Face)
- No rotation needed for personal project
- Simple usage tracking in application logs

### Rate Limiting (Free Tier Compliance)

- Google Gemini: Max 60 requests/minute (enforced by API)
- Hugging Face: Max 30,000 requests/month (enforced by API)
- Ollama: No limits (local execution)
- Per-instructor: 5 generations/hour (to stay well within free limits)
- Implement queue system to batch requests and avoid rate limits

### Content Validation

- Sanitize all LLM-generated content before storage
- Basic content filtering using regex patterns (free)
- Validate JSON structure for quiz questions
- Limit generated content length (max 10,000 characters per chapter)

### Authorization

- Only course instructors can generate content for their courses
- Only authenticated users can access recommendations
- Validate courseId ownership before generation

## Deployment Strategy

### Free Deployment Approach

**Development & Production (Same Setup):**
- Use Google Gemini API (free tier) as primary LLM
- Optionally install Ollama locally for offline development
- In-memory job queue (sufficient for personal project)
- Existing DynamoDB setup (already configured)
- Simple file-based logging (no CloudWatch costs)
- Deploy to existing AWS infrastructure (no additional costs)

**LLM Provider Setup:**

1. **Google Gemini (Recommended - Free Forever):**
   ```bash
   # Get free API key from: https://makersuite.google.com/app/apikey
   # Add to .env: GEMINI_API_KEY=your_key_here
   # Free tier: 60 requests/minute, no credit card required
   ```

2. **Hugging Face (Backup - Free Tier):**
   ```bash
   # Get free API key from: https://huggingface.co/settings/tokens
   # Add to .env: HUGGINGFACE_API_KEY=your_key_here
   # Free tier: 30,000 requests/month
   ```

3. **Ollama (Optional - Completely Free, Offline):**
   ```bash
   # Install locally: https://ollama.ai/download
   # Run: ollama pull llama2
   # No API key needed, runs on your machine
   ```

### Rollout Plan

1. **Phase 1:** Implement with Gemini API (1-2 days)
2. **Phase 2:** Add recommendation engine (1 day)
3. **Phase 3:** Test and demo (1 day)
4. **Total:** Ready for resume in 4-5 days

## Monitoring and Observability (Free Approach)

### Simple Logging Strategy

**Content Generation Metrics:**
- Log to console and simple JSON file
- Track: generations count, success/failure, duration
- No cost, easy to demo in interviews

```typescript
// Simple metrics tracking
const metrics = {
  generations: {
    total: 0,
    successful: 0,
    failed: 0,
    averageDuration: 0
  },
  recommendations: {
    served: 0,
    clicked: 0,
    enrolled: 0
  }
};

// Save to file periodically
fs.writeFileSync('metrics.json', JSON.stringify(metrics, null, 2));
```

**Demo Dashboard (Optional):**
- Simple React component showing metrics
- Reads from metrics.json
- Great for showcasing in interviews

### Free Tier Monitoring

- Google Gemini: Check usage at https://makersuite.google.com/app/apikey
- Hugging Face: Check usage in account dashboard
- Ollama: No monitoring needed (local, unlimited)
- Set up simple alerts in code when approaching 80% of free tier limits

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **AI Study Assistant Chatbot:**
   - Course-specific Q&A using RAG
   - Vector database for course content
   - Streaming responses

2. **Content Quality Scoring:**
   - Automated assessment of generated content quality
   - Suggestions for improvement
   - Plagiarism detection

3. **Multi-language Support:**
   - Generate content in multiple languages
   - Automatic translation of courses

4. **Advanced Recommendations:**
   - Learning path suggestions
   - Skill gap analysis
   - Career-oriented course sequences

5. **A/B Testing Framework:**
   - Test different prompt templates
   - Compare recommendation algorithms
   - Optimize for engagement and completion rates
