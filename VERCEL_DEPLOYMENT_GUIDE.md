# 🚀 Vercel Deployment Guide - AI Features

## ✅ Step 1: Push to GitHub (DONE!)

Your changes are now pushed to GitHub. Vercel will automatically detect and deploy them.

---

## 🔑 Step 2: Add Environment Variables to Vercel

You need to add your API keys to Vercel so the AI features work in production.

### Go to Vercel Dashboard:

1. **Open:** https://vercel.com/dashboard
2. **Find your project** (aws_project or whatever you named it)
3. **Click on it**

### Add Environment Variables:

#### For the Backend (Server):

1. Click **"Settings"** tab
2. Click **"Environment Variables"** in the left sidebar
3. Add these variables:

```bash
# AI LLM Provider Keys
GEMINI_API_KEY=your_gemini_key_here
HUGGINGFACE_API_KEY=your_huggingface_key_here

# Existing keys (if not already added)
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_s3_bucket_name
CLOUDFRONT_DOMAIN=your_cloudfront_domain
STRIPE_SECRET_KEY=your_stripe_secret_key
DYNAMODB_ENDPOINT=leave_empty_for_production
NODE_ENV=production
PORT=8001
```

**Important Notes:**
- For `DYNAMODB_ENDPOINT`: Leave it **empty** or **don't add it** for production (it will use real AWS DynamoDB)
- For `NODE_ENV`: Set to `production`
- Make sure to add variables for **both Production and Preview** environments

#### For the Frontend (Client):

The client environment variables should already be in your `client/.env.local`, but verify these are set in Vercel:

```bash
NEXT_PUBLIC_API_BASE_URL=your_backend_api_url
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

---

## 📦 Step 3: Redeploy

### Option A: Automatic Deployment (Recommended)

Vercel automatically deploys when you push to GitHub. Just wait 2-3 minutes and check:

1. Go to **"Deployments"** tab in Vercel
2. You should see a new deployment in progress
3. Wait for it to complete (green checkmark)
4. Click on the deployment to see the live URL

### Option B: Manual Redeploy

If automatic deployment doesn't trigger:

1. Go to your project in Vercel
2. Click **"Deployments"** tab
3. Click the **"..."** menu on the latest deployment
4. Click **"Redeploy"**
5. Confirm

---

## 🗄️ Step 4: Database Setup (Production)

Since you're using DynamoDB Local for development, you need to set up production DynamoDB:

### Option 1: Use AWS DynamoDB (Recommended)

1. **Go to AWS Console:** https://console.aws.amazon.com/dynamodb
2. **Create Tables:**
   - Table name: `Course`
   - Partition key: `courseId` (String)
   
   - Table name: `Transaction`
   - Partition key: `transactionId` (String)
   
   - Table name: `UserCourseProgress`
   - Partition key: `userId` (String)
   - Sort key: `courseId` (String)
   
   - Table name: `ContentGenerationJob`
   - Partition key: `jobId` (String)
   
   - Table name: `RecommendationFeedback`
   - Partition key: `feedbackId` (String)

3. **Add Global Secondary Indexes:**
   - For `ContentGenerationJob`: Add GSI with `courseId` as partition key
   - For `RecommendationFeedback`: Add GSI with `userId` as partition key

4. **Update Vercel Environment Variables:**
   - Remove or leave empty: `DYNAMODB_ENDPOINT`
   - Add: `AWS_ACCESS_KEY_ID=your_aws_access_key`
   - Add: `AWS_SECRET_ACCESS_KEY=your_aws_secret_key`

### Option 2: Seed Production Database

Run the seed script against production:

```bash
# In your local terminal
cd server
NODE_ENV=production npm run seed
```

**Note:** Make sure your AWS credentials are configured locally first.

---

## 🧪 Step 5: Test the Deployment

Once deployment is complete:

### Test Recommendations:

1. **Go to:** https://your-app.vercel.app/search
2. **Look for:** "AI-Powered Recommendations" section
3. **Verify:** Match percentages and recommendation reasons appear
4. **Test:** Thumbs up/down feedback buttons

### Test Content Generation:

1. **Sign in** as a teacher
2. **Go to:** https://your-app.vercel.app/teacher/courses
3. **Click** on a course
4. **Look for:** "✨ Generate with AI" button
5. **Click it** and test the wizard

### Check for Errors:

1. **Open browser console** (F12)
2. **Look for** any red errors
3. **Check** Network tab for failed API calls

---

## 🐛 Troubleshooting

### Problem: "AI features not showing"

**Solutions:**
1. Check that environment variables are added in Vercel
2. Verify `GEMINI_API_KEY` and `HUGGINGFACE_API_KEY` are correct
3. Check Vercel deployment logs for errors
4. Make sure database tables exist in production

### Problem: "PARSING_ERROR" or API errors

**Solutions:**
1. Check Vercel Function logs:
   - Go to Vercel Dashboard → Your Project → Functions
   - Click on a function to see logs
2. Verify API keys are valid and not expired
3. Check that backend is deployed correctly
4. Verify `NEXT_PUBLIC_API_BASE_URL` points to correct backend URL

### Problem: "Database connection failed"

**Solutions:**
1. Make sure `DYNAMODB_ENDPOINT` is **not set** in production (or set to empty string)
2. Verify AWS credentials are correct
3. Check that DynamoDB tables exist in your AWS region
4. Verify `AWS_REGION` matches where your tables are

### Problem: "Rate limit exceeded"

**Solutions:**
1. Google Gemini: 60 requests/minute (should be enough)
2. Hugging Face: 30,000 requests/month
3. If hitting limits, the system will automatically fall back to next provider
4. Consider adding Ollama as local fallback (not available on Vercel)

---

## 📊 Monitor Your Deployment

### Vercel Analytics:

1. Go to **"Analytics"** tab in Vercel
2. Monitor:
   - Page views
   - API response times
   - Error rates

### Check Function Logs:

1. Go to **"Functions"** tab
2. Click on any function
3. View real-time logs
4. Look for errors or warnings

### API Usage Monitoring:

**Google Gemini:**
- Check usage: https://makersuite.google.com/app/apikey
- Monitor requests per minute

**Hugging Face:**
- Check usage: https://huggingface.co/settings/tokens
- Monitor monthly requests

---

## 🎯 Production Checklist

Before going live, verify:

- [ ] All environment variables added to Vercel
- [ ] API keys are valid and working
- [ ] Database tables created in AWS DynamoDB
- [ ] Database seeded with sample data (optional)
- [ ] Frontend deployed successfully
- [ ] Backend deployed successfully
- [ ] Can access the app at your Vercel URL
- [ ] AI recommendations showing on search page
- [ ] "Generate with AI" button visible in course editor
- [ ] No errors in browser console
- [ ] No errors in Vercel function logs
- [ ] API calls returning 200 status codes

---

## 🔄 Future Updates

When you make changes:

1. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

2. **Push to GitHub:**
   ```bash
   git push origin main
   ```

3. **Vercel auto-deploys** (wait 2-3 minutes)

4. **Check deployment** in Vercel dashboard

---

## 💡 Pro Tips

### Separate Environments:

Create separate Vercel projects for:
- **Development:** Connected to `dev` branch
- **Production:** Connected to `main` branch

### Preview Deployments:

- Every pull request gets a preview URL
- Test changes before merging to main
- Share preview URLs with others

### Environment Variables per Environment:

Set different values for:
- **Production:** Real API keys, production database
- **Preview:** Test API keys, staging database
- **Development:** Local development keys

---

## 📞 Need Help?

**Vercel Documentation:**
- Environment Variables: https://vercel.com/docs/environment-variables
- Deployments: https://vercel.com/docs/deployments
- Functions: https://vercel.com/docs/functions

**Check Logs:**
1. Vercel Dashboard → Your Project
2. Click "Functions" or "Deployments"
3. View real-time logs

**Common Issues:**
- Most issues are due to missing environment variables
- Check that API keys are correct
- Verify database connection settings

---

## ✅ Summary

**What you need to do:**

1. ✅ **Push to GitHub** (DONE!)
2. ⏳ **Add environment variables** to Vercel (API keys)
3. ⏳ **Set up production database** (AWS DynamoDB)
4. ⏳ **Wait for deployment** (2-3 minutes)
5. ⏳ **Test the AI features** on your live site

**Your changes will be live at:**
- https://your-app.vercel.app/search (Recommendations)
- https://your-app.vercel.app/teacher/courses (Content Generation)

---

**Good luck with your deployment! 🚀**

The AI features are production-ready and will work great on Vercel once you add the environment variables!
