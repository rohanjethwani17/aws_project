# Implementation Plan

- [ ] 1. Set up free LLM provider infrastructure
  - Create LLM provider abstraction layer with interface for multiple providers
  - Implement Google Gemini API integration with free tier (60 req/min)
  - Implement Hugging Face API integration with free tier (30k req/month)
  - Implement Ollama local LLM integration (optional, unlimited)
  - Add provider fallback logic to automatically switch between providers on failure
  - Create environment variable configuration for API keys (GEMINI_API_KEY, HUGGINGFACE_API_KEY)
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 2. Create AI content generation data models
  - [ ] 2.1 Create ContentGenerationJob model in DynamoDB
    - Define schema with jobId, courseId, instructorId, status, progress, outline, options
    - Add fields for tracking API calls used and LLM provider
    - Create CourseIdIndex for querying jobs by course
    - Implement CRUD operations using Dynamoose
    - _Requirements: 1.1, 1.4, 6.1_

  - [ ] 2.2 Extend Course model with AI metadata
    - Add aiGenerated boolean field to Course schema
    - Add generationJobId reference field
    - Add aiMetadata object with generatedAt, llmProvider, modelVersion, apiCallsUsed, modificationPercentage
    - Update existing course controller to handle new fields
    - _Requirements: 1.4, 8.1, 8.3_

  - [ ] 2.3 Extend Chapter schema with AI metadata
    - Add aiGenerated boolean field to Chapter schema within Course model
    - Add aiMetadata object with generatedAt, prompt, apiCallsUsed, modified flag
    - Ensure backward compatibility with existing courses
    - _Requirements: 1.4, 8.1, 8.2_

- [ ] 3. Implement AI content generation service
  - [ ] 3.1 Create prompt templates for different content types
    - Design text lesson prompt template with course context and learning objectives
    - Design quiz generation prompt template with JSON output format
    - Design video script prompt template with timestamps and visual suggestions
    - Implement template variable substitution (courseTitle, level, category, etc.)
    - Add few-shot examples to prompts for consistent output quality
    - _Requirements: 1.2, 3.1, 3.2, 3.3_

  - [ ] 3.2 Build content generation service core logic
    - Create AIContentGenerationService class with generateCourseContent method
    - Implement sequential section and chapter processing with progress tracking
    - Add generateChapterContent method for single chapter regeneration
    - Implement content validation to ensure required fields (title, content, type)
    - Add content sanitization to remove potentially harmful content
    - Limit generated content length to 10,000 characters per chapter
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 3.5_

  - [ ] 3.3 Implement async job processing
    - Create in-memory job queue for managing generation requests
    - Implement background processing that doesn't block API responses
    - Add job status tracking (pending, processing, completed, failed)
    - Implement progress updates showing current section and chapter being generated
    - Support concurrent processing with maximum 5 simultaneous jobs
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ] 3.4 Add error handling and retry logic
    - Implement exponential backoff retry for LLM API failures (3 attempts max)
    - Handle rate limit errors by switching to backup provider
    - Log all errors with context (jobId, provider, error message)
    - Update job status to "failed" with error details on permanent failure
    - Send notification to instructor on job completion or failure
    - _Requirements: 1.5, 1.6_

  - [ ] 3.5 Implement rate limiting for free tier compliance
    - Add per-instructor rate limit of 5 generations per hour
    - Track API calls per provider to stay within free tier limits
    - Display warning when approaching 80% of free tier limits (Gemini: 48/min, HF: 24k/month)
    - Implement request queuing to avoid exceeding rate limits
    - _Requirements: 6.3, 6.4, 6.5_

- [ ] 4. Create AI content generation API endpoints
  - [ ] 4.1 Implement POST /courses/:courseId/generate-content endpoint
    - Validate request body contains valid course outline with sections and chapters
    - Check authorization - only course instructor can generate content
    - Create ContentGenerationJob with status "pending"
    - Queue job for async processing
    - Return job ID and status immediately (non-blocking)
    - _Requirements: 1.1, 7.1_

  - [ ] 4.2 Implement GET /courses/:courseId/generation-jobs/:jobId endpoint
    - Retrieve job status from database
    - Return progress percentage, current section/chapter, and status
    - Include error details if job failed
    - _Requirements: 7.3_

  - [ ] 4.3 Implement POST /courses/:courseId/sections/:sectionId/chapters/:chapterId/regenerate endpoint
    - Validate chapter exists in course
    - Check authorization - only course instructor can regenerate
    - Generate single chapter content using existing course context
    - Update chapter in database with new AI-generated content
    - Return generated chapter within 30 seconds
    - _Requirements: 2.3, 2.4_

  - [ ] 4.4 Implement DELETE /courses/:courseId/generation-jobs/:jobId endpoint
    - Check authorization - only job creator can cancel
    - Stop ongoing generation process
    - Update job status to "cancelled"
    - _Requirements: 7.1_

- [ ] 5. Build course recommendation engine
  - [ ] 5.1 Create RecommendationFeedback model
    - Define schema with feedbackId, userId, courseId, feedback (positive/negative)
    - Add recommendationScore and recommendationReasons fields
    - Create UserIdIndex for querying feedback by user
    - Implement CRUD operations
    - _Requirements: 5.3, 5.4_

  - [ ] 5.2 Implement content-based filtering algorithm
    - Calculate category similarity between courses and user's enrolled courses
    - Analyze course descriptions using keyword matching
    - Consider course level progression (Beginner → Intermediate → Advanced)
    - Return content similarity score (0-100)
    - Weight: 40% of final recommendation score
    - _Requirements: 4.1, 4.2, 5.2_

  - [ ] 5.3 Implement collaborative filtering algorithm
    - Find users with similar enrollment patterns using Jaccard similarity
    - Identify courses that similar users enrolled in
    - Calculate collaborative score based on overlap
    - Weight: 30% of final recommendation score
    - _Requirements: 4.1, 4.2, 5.2_

  - [ ] 5.4 Implement popularity-based scoring
    - Count total enrollments per course
    - Calculate recent enrollment trends (last 30 days)
    - Apply slight boost to newly published courses
    - Weight: 20% of final recommendation score
    - _Requirements: 4.3_

  - [ ] 5.5 Implement instructor-based scoring
    - Identify instructors of user's enrolled courses
    - Recommend other courses by same instructors
    - Weight: 10% of final recommendation score
    - _Requirements: 4.1, 5.2_

  - [ ] 5.6 Build hybrid recommendation scoring system
    - Combine all algorithm scores with weighted formula
    - Apply user feedback adjustments (reduce score by 20 points for negative feedback)
    - Generate recommendation reasons (category match, similar users, trending, instructor)
    - Return top N courses with scores and reasons
    - Implement in-memory caching for 5-minute TTL to improve performance
    - _Requirements: 4.1, 4.2, 4.4, 5.1, 5.2, 5.4_

- [ ] 6. Create recommendation API endpoints
  - [ ] 6.1 Implement GET /recommendations/for-you endpoint
    - Require authentication to get userId
    - Fetch user's enrollment history and course progress
    - Calculate recommendations using hybrid algorithm
    - Return top 5 courses with scores and reasons
    - Handle new users with no history by returning trending courses
    - Cache results for 5 minutes
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 6.2 Implement GET /recommendations/similar/:courseId endpoint
    - Fetch course details by courseId
    - Find courses with similar category, level, and description
    - Return top 5 similar courses with similarity scores
    - _Requirements: 5.2_

  - [ ] 6.3 Implement POST /recommendations/feedback endpoint
    - Validate request body contains userId, courseId, feedback (positive/negative)
    - Store feedback in RecommendationFeedback model
    - Update recommendation cache to reflect feedback
    - Return success confirmation
    - _Requirements: 5.3, 5.4_

  - [ ] 6.4 Implement GET /recommendations/trending endpoint
    - Calculate trending courses based on recent enrollments
    - Return top 10 trending courses
    - Cache results for 1 hour
    - _Requirements: 4.3_

- [ ] 7. Build frontend components for AI content generation
  - [ ] 7.1 Create AI content generation wizard component
    - Build multi-step form for course outline input (title, description, sections, chapters)
    - Add chapter type selection (Text, Quiz, Video) for each chapter
    - Include generation options (tone, detail level, include examples)
    - Add "Generate Content" button that calls API endpoint
    - Display loading state while job is queued
    - _Requirements: 1.1, 3.1, 3.2, 3.3_

  - [ ] 7.2 Create generation progress component
    - Display real-time progress bar showing percentage complete
    - Show current section and chapter being generated
    - Poll job status endpoint every 2 seconds for updates
    - Display success notification with link to view content when complete
    - Show error message if generation fails with retry option
    - _Requirements: 7.2, 7.3, 7.4_

  - [ ] 7.3 Add AI-generated content badges and disclaimers
    - Display "AI-Generated" badge on chapters with aiGenerated flag
    - Show disclaimer "This content was generated using AI and reviewed by the instructor"
    - Add toggle in instructor settings to show/hide badges
    - Remove badge automatically when content is 50%+ modified
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ] 7.4 Enhance course editor with regeneration feature
    - Add "Regenerate with AI" button on each chapter in edit mode
    - Show confirmation dialog before regenerating (warns about overwriting)
    - Display loading spinner during regeneration
    - Update chapter content in editor when regeneration completes
    - _Requirements: 2.2, 2.3, 2.4_

- [ ] 8. Build frontend components for course recommendations
  - [ ] 8.1 Create "Recommended For You" section on course catalog page
    - Fetch recommendations from /recommendations/for-you endpoint
    - Display top 5 recommended courses in horizontal carousel
    - Show recommendation score as percentage match (e.g., "85% match")
    - Display recommendation reasons below each course card
    - _Requirements: 4.1, 4.2, 4.5, 5.1_

  - [ ] 8.2 Add recommendation feedback buttons
    - Add thumbs up/down buttons on each recommended course card
    - Call /recommendations/feedback endpoint when clicked
    - Update UI to show feedback was recorded
    - Refresh recommendations after feedback is submitted
    - _Requirements: 5.3, 5.4_

  - [ ] 8.3 Create "Similar Courses" section on course detail page
    - Fetch similar courses from /recommendations/similar/:courseId endpoint
    - Display 3-5 similar courses below course description
    - Show similarity score and matching attributes (category, level, instructor)
    - _Requirements: 5.2_

  - [ ] 8.4 Add "Trending Courses" section on homepage
    - Fetch trending courses from /recommendations/trending endpoint
    - Display in grid layout with enrollment count
    - Update every hour
    - _Requirements: 4.3_

- [ ] 9. Implement simple metrics and monitoring
  - [ ] 9.1 Create metrics tracking service
    - Track total generations, successful, failed, average duration
    - Track recommendations served, clicked, enrolled
    - Track API calls per provider (Gemini, HuggingFace, Ollama)
    - Save metrics to JSON file periodically
    - _Requirements: 6.1, 6.2_

  - [ ] 9.2 Create admin metrics dashboard component
    - Display total content generations per day/week/month
    - Show success rate and average generation time
    - Display API usage vs free tier limits with progress bars
    - Show recommendation engagement metrics (CTR, enrollment rate)
    - Read metrics from JSON file
    - _Requirements: 6.2, 6.3_

  - [ ] 9.3 Add free tier limit warnings
    - Check API usage against limits (Gemini: 60/min, HF: 30k/month)
    - Display warning banner when reaching 80% of limits
    - Suggest switching to Ollama for unlimited generations
    - Log warnings to console and metrics file
    - _Requirements: 6.4_

- [ ] 10. Add API routes and integrate with Express server
  - Create new route files for AI content and recommendations
  - Register routes in server/src/index.ts with proper middleware
  - Add authentication middleware to protected endpoints
  - Add request validation middleware
  - _Requirements: 1.1, 4.1, 6.1_

- [ ] 11. Update Redux state management for AI features
  - Add API endpoints to client/src/state/api.ts using RTK Query
  - Create endpoints for generateCourseContent, getGenerationJobStatus, regenerateChapter
  - Create endpoints for getRecommendations, getSimilarCourses, recordFeedback, getTrendingCourses
  - Add proper TypeScript types for all requests and responses
  - Implement optimistic updates for feedback recording
  - _Requirements: 1.1, 4.1, 5.3_

- [ ] 12. Create environment setup documentation
  - Document how to get free Google Gemini API key from https://makersuite.google.com/app/apikey
  - Document how to get free Hugging Face API key from https://huggingface.co/settings/tokens
  - Document optional Ollama installation for local LLM (https://ollama.ai/download)
  - Add .env.example file with required environment variables
  - Create README section explaining AI features and setup
  - _Requirements: 1.1, 6.1_
