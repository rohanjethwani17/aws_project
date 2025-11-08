# 🎓 AI-Powered Learning Management System

A full-stack, cloud-native Learning Management System (LMS) with AI-powered course content generation, built with modern technologies and deployed on AWS and Vercel.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20S3-orange?style=flat-square&logo=amazon-aws)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black?style=flat-square&logo=vercel)

## 🌟 Live Demo

- **Frontend**: [https://learning-management-app-pi.vercel.app](https://learning-management-app-pi.vercel.app)
- **Backend API**: AWS Lambda Function URL (serverless)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [AI Integration](#-ai-integration)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🎯 Core Features
- **User Authentication**: Secure authentication with Clerk (supports email, social login)
- **Role-Based Access**: Separate interfaces for students and instructors
- **Course Management**: Create, edit, and publish courses with rich content
- **Video Streaming**: CloudFront CDN integration for optimized video delivery
- **Progress Tracking**: Real-time course progress and completion tracking
- **Payment Integration**: Stripe integration for course purchases
- **Responsive Design**: Mobile-first design with dark mode support

### 🤖 AI-Powered Features
- **AI Content Generation**: Generate complete course content from outlines using Google Gemini or Hugging Face
- **Smart Recommendations**: ML-based course recommendations using collaborative and content-based filtering
- **Automated Quiz Creation**: AI-generated quizzes with explanations
- **Video Script Generation**: AI-generated video scripts with timestamps and talking points
- **Chapter Regeneration**: Regenerate individual chapters if not satisfied with AI output

### 📊 Advanced Features
- **Real-time Job Tracking**: Monitor AI content generation progress
- **Rate Limiting**: Prevent abuse with intelligent rate limiting (5 generations/hour per instructor)
- **Caching**: In-memory caching for recommendations (5-minute TTL)
- **Async Processing**: Background job processing for content generation
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15.5 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Redux Toolkit + RTK Query
- **Authentication**: Clerk
- **Payments**: Stripe
- **Animations**: Framer Motion
- **File Upload**: FilePond
- **Video Player**: React Player

### Backend
- **Runtime**: Node.js 20 (AWS Lambda)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: AWS DynamoDB
- **Storage**: AWS S3 + CloudFront CDN
- **Authentication**: Clerk Express SDK
- **Payments**: Stripe
- **AI/ML**: Google Gemini API, Hugging Face API

### Infrastructure
- **Hosting**: Vercel (Frontend), AWS Lambda (Backend)
- **Database**: AWS DynamoDB (NoSQL)
- **Storage**: AWS S3 + CloudFront
- **Container**: Docker (for Lambda deployment)
- **CI/CD**: GitHub Actions + Vercel Auto-Deploy

### AI/ML Services
- **Primary LLM**: Google Gemini Pro
- **Fallback LLM**: Hugging Face (Mistral-7B-Instruct-v0.2)
- **Local Option**: Ollama (for development)

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Vercel)                         │
│  Next.js 15 + React 19 + TypeScript + Tailwind CSS             │
│  - Server-Side Rendering (SSR)                                  │
│  - Static Site Generation (SSG)                                 │
│  - API Routes for client-side logic                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS/REST API
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    AWS Lambda (Backend)                         │
│  Express.js + TypeScript + Serverless                           │
│  - RESTful API endpoints                                        │
│  - Authentication middleware (Clerk)                            │
│  - CORS configuration                                           │
│  - Rate limiting                                                │
└─────┬──────────┬──────────┬──────────┬──────────┬──────────────┘
      │          │          │          │          │
      │          │          │          │          │
┌─────▼──┐  ┌───▼────┐  ┌──▼─────┐  ┌▼────┐  ┌──▼──────────┐
│DynamoDB│  │   S3   │  │Clerk   │  │Stripe│ │AI Services  │
│        │  │+CloudFr│  │Auth    │  │      │ │- Gemini     │
│Courses │  │ont CDN │  │        │  │      │ │- HuggingFace│
│Users   │  │Videos  │  │        │  │      │ │             │
│Progress│  │Images  │  │        │  │      │ │             │
└────────┘  └────────┘  └────────┘  └──────┘ └─────────────┘
```

### Data Flow

1. **User Request**: Client makes request to Next.js frontend
2. **API Call**: Frontend calls AWS Lambda backend via Function URL
3. **Authentication**: Clerk validates user session
4. **Business Logic**: Express routes handle request logic
5. **Data Access**: DynamoDB stores/retrieves data
6. **AI Processing**: AI services generate content (async)
7. **Response**: Data returned to client and rendered

## 🤖 AI Integration

### Content Generation Pipeline

```
Instructor Creates Outline
         ↓
AI Service Receives Request
         ↓
Rate Limit Check (5/hour)
         ↓
Job Created in DynamoDB
         ↓
Async Processing Starts
         ↓
For Each Chapter:
  ├─ Generate Prompt
  ├─ Call Gemini API
  ├─ Parse Response
  ├─ Format Content
  └─ Update Progress
         ↓
Course Updated with Content
         ↓
Job Marked Complete
```

### AI Providers

1. **Google Gemini** (Primary)
   - Model: `gemini-pro`
   - Rate: 60 requests/minute
   - Use: Text lessons, quizzes, video scripts

2. **Hugging Face** (Fallback)
   - Model: `mistralai/Mistral-7B-Instruct-v0.2`
   - Rate: 30,000 requests/month
   - Use: Automatic fallback if Gemini fails

3. **Ollama** (Development)
   - Model: `llama2`
   - Rate: Unlimited (local)
   - Use: Local development only

### Recommendation Algorithm

```typescript
Score = (Content Similarity × 0.4) +
        (Collaborative Filtering × 0.3) +
        (Popularity × 0.2) +
        (Instructor Match × 0.1) +
        (User Feedback Adjustment)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker (for Lambda deployment)
- AWS Account
- Clerk Account
- Stripe Account
- Google Gemini API Key or Hugging Face API Key

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/learning-management-system.git
   cd learning-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install

   # Install client dependencies
   cd client
   npm install

   # Install server dependencies
   cd ../server
   npm install
   ```

3. **Set up environment variables**

   Create `.env` files in both `client` and `server` directories:

   **client/.env.local**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   NEXT_PUBLIC_STRIPE_PUBLIC_KEY=your_stripe_key
   ```

   **server/.env**
   ```env
   PORT=3000
   NODE_ENV=development
   
   # AWS
   AWS_REGION=us-east-1
   DYNAMODB_ENDPOINT=http://localhost:8000
   S3_BUCKET_NAME=your-bucket
   CLOUDFRONT_DOMAIN=your-cloudfront-domain
   
   # Authentication
   CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   
   # Payments
   STRIPE_SECRET_KEY=your_stripe_secret
   
   # AI Services
   GEMINI_API_KEY=your_gemini_key
   HUGGINGFACE_API_KEY=your_huggingface_key
   ```

4. **Start DynamoDB Local** (optional for local development)
   ```bash
   cd server
   npm run dynamodb:start
   ```

5. **Seed the database** (optional)
   ```bash
   cd server
   npm run seed
   ```

6. **Start the development servers**

   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

7. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📦 Deployment

### Frontend (Vercel)

1. **Connect GitHub repository to Vercel**
2. **Configure environment variables** in Vercel dashboard
3. **Deploy** - Vercel auto-deploys on push to main branch

### Backend (AWS Lambda)

1. **Build the Docker image**
   ```bash
   cd server
   docker build --platform linux/amd64 -t lm-server:latest .
   ```

2. **Push to AWS ECR**
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
   
   docker tag lm-server:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lm-server:latest
   
   docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lm-server:latest --platform linux/amd64
   ```

3. **Update Lambda function**
   ```bash
   aws lambda update-function-code \
     --function-name lm_lambda \
     --image-uri YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/lm-server:latest \
     --region us-east-1
   ```

4. **Configure Lambda environment variables** via AWS Console

## 📁 Project Structure

```
learning-management-system/
├── client/                      # Next.js frontend
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── app/                 # Next.js app directory
│   │   │   ├── (dashboard)/     # Dashboard routes
│   │   │   ├── (nondashboard)/  # Public routes
│   │   │   └── layout.tsx       # Root layout
│   │   ├── components/          # React components
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   └── ...              # Custom components
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # Utility functions
│   │   ├── state/               # Redux store & API
│   │   └── types/               # TypeScript types
│   ├── .env.local               # Local environment variables
│   ├── .env.production          # Production environment variables
│   ├── next.config.js           # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   └── package.json
│
├── server/                      # Express.js backend
│   ├── src/
│   │   ├── controllers/         # Route controllers
│   │   │   ├── aiContentController.ts
│   │   │   ├── courseController.ts
│   │   │   ├── recommendationController.ts
│   │   │   └── ...
│   │   ├── models/              # DynamoDB models
│   │   │   ├── courseModel.ts
│   │   │   ├── userCourseProgressModel.ts
│   │   │   ├── contentGenerationJobModel.ts
│   │   │   └── ...
│   │   ├── routes/              # Express routes
│   │   │   ├── aiContentRoutes.ts
│   │   │   ├── courseRoutes.ts
│   │   │   ├── recommendationRoutes.ts
│   │   │   └── ...
│   │   ├── services/            # Business logic
│   │   │   ├── aiContentGenerationService.ts
│   │   │   ├── llmService.ts
│   │   │   ├── recommendationService.ts
│   │   │   └── promptTemplates.ts
│   │   ├── seed/                # Database seeding
│   │   │   ├── data/            # Seed data
│   │   │   └── seedDynamodb.ts
│   │   └── index.ts             # Express app entry
│   ├── .env                     # Environment variables
│   ├── Dockerfile               # Docker configuration
│   ├── tsconfig.json            # TypeScript configuration
│   └── package.json
│
├── .gitignore
├── package.json                 # Root package.json
└── README.md                    # This file
```

## 📚 API Documentation

### Base URL
- **Production**: `https://56uxxj3tmzl7zn5osjy3iq65pq0pahzk.lambda-url.us-east-1.on.aws`
- **Development**: `http://localhost:3001`

### Authentication
All protected routes require a Bearer token from Clerk:
```
Authorization: Bearer <clerk_token>
```

### Endpoints

#### Courses
- `GET /courses` - Get all courses (with optional category filter)
- `GET /courses/:id` - Get course by ID
- `POST /courses` - Create new course (auth required)
- `PUT /courses/:id` - Update course (auth required)
- `DELETE /courses/:id` - Delete course (auth required)

#### AI Content Generation
- `POST /ai/courses/:courseId/generate-content` - Generate course content (auth required)
- `GET /ai/generation-jobs/:jobId` - Get generation job status (auth required)
- `POST /ai/courses/:courseId/sections/:sectionId/chapters/:chapterId/regenerate` - Regenerate chapter (auth required)
- `DELETE /ai/generation-jobs/:jobId` - Cancel generation job (auth required)

#### Recommendations
- `GET /recommendations/for-you` - Get personalized recommendations
- `GET /recommendations/similar/:courseId` - Get similar courses
- `POST /recommendations/feedback` - Record recommendation feedback
- `GET /recommendations/trending` - Get trending courses

#### User Progress
- `GET /users/course-progress/:userId/enrolled-courses` - Get enrolled courses (auth required)
- `GET /users/course-progress/:userId/courses/:courseId` - Get course progress (auth required)
- `PUT /users/course-progress/:userId/courses/:courseId` - Update course progress (auth required)

#### Transactions
- `GET /transactions?userId=:userId` - Get user transactions (auth required)
- `POST /transactions` - Create transaction (auth required)
- `POST /transactions/stripe/payment-intent` - Create Stripe payment intent (auth required)

#### Users
- `PUT /users/clerk/:userId` - Update user profile (auth required)

## 🔐 Environment Variables

### Client (.env.local / .env.production)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_LOCAL_URL` | Frontend URL | Yes |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLIC_KEY` | Stripe public key | Yes |
| `NEXT_PUBLIC_STRIPE_REDIRECT_URL` | Stripe redirect URL | Yes |

### Server (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 3000) |
| `NODE_ENV` | Environment (development/production) | Yes |
| `AWS_REGION` | AWS region | Yes |
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint (local dev) | No |
| `S3_BUCKET_NAME` | S3 bucket name | Yes |
| `CLOUDFRONT_DOMAIN` | CloudFront domain | Yes |
| `CLERK_PUBLISHABLE_KEY` | Clerk public key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `GEMINI_API_KEY` | Google Gemini API key | Yes* |
| `HUGGINGFACE_API_KEY` | Hugging Face API key | Yes* |

*At least one AI provider API key is required

## 🎨 Features in Detail

### AI Content Generation

Instructors can generate complete course content from a simple outline:

1. **Create Course Outline**: Define sections and chapters
2. **Generate Content**: Click "Generate with AI"
3. **Monitor Progress**: Real-time progress tracking
4. **Review & Edit**: Review generated content and make edits
5. **Publish**: Publish course when satisfied

**Generated Content Types**:
- **Text Lessons**: 500-1500 word comprehensive lessons with examples
- **Quizzes**: 5-7 multiple choice questions with explanations
- **Video Scripts**: Detailed scripts with timestamps and visual suggestions

### Smart Recommendations

The system provides personalized course recommendations using:

- **Content-Based Filtering**: Analyzes course categories, levels, and descriptions
- **Collaborative Filtering**: Finds users with similar interests
- **Popularity Metrics**: Considers enrollment counts
- **Instructor Matching**: Recommends courses from instructors you've learned from
- **User Feedback**: Learns from positive/negative feedback

### Progress Tracking

Students can track their learning journey:

- **Course Progress**: Overall completion percentage
- **Section Progress**: Progress within each section
- **Chapter Completion**: Mark chapters as complete
- **Resume Learning**: Pick up where you left off
- **Certificates**: Earn certificates upon completion (coming soon)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Rohan Jethwani**

- GitHub: [@rohanjethwani17](https://github.com/rohanjethwani17)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [AWS](https://aws.amazon.com/) - Cloud infrastructure
- [Clerk](https://clerk.com/) - Authentication
- [Stripe](https://stripe.com/) - Payment processing
- [Google Gemini](https://ai.google.dev/) - AI content generation
- [Hugging Face](https://huggingface.co/) - AI models
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Vercel](https://vercel.com/) - Frontend hosting

## 📞 Support

For support, email your-email@example.com or open an issue in the GitHub repository.

---

⭐ If you found this project helpful, please give it a star!
