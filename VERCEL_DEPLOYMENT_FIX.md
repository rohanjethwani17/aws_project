# 🚀 Vercel Deployment Fix Guide

## Problem Identified

Your app works locally but shows "FETCH ERROR" on Vercel because:
1. ❌ Frontend doesn't know where your AWS backend is deployed
2. ❌ CORS configuration wasn't properly set up for production

## ✅ Fixes Applied

### 1. Backend CORS Configuration Updated
- ✅ Added proper CORS with origin validation
- ✅ Allows Vercel domains (`*.vercel.app`)
- ✅ Supports credentials for Clerk authentication
- ✅ Added proper HTTP methods and headers

### 2. Backend Rebuild
- ✅ Code compiled successfully with new CORS settings

---

## 🔧 Steps to Fix Your Vercel Deployment

### Step 1: Add Environment Variables to Vercel

Go to your Vercel project dashboard → Settings → Environment Variables and add:

#### **Required Frontend Environment Variables:**

```bash
# Backend API URL - THIS IS THE MOST IMPORTANT ONE
# Replace with your actual AWS backend URL
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod

# OR if using Lambda Function URL:
# NEXT_PUBLIC_API_BASE_URL=https://your-function-url.lambda-url.us-east-1.on.aws

# OR if using EC2/Load Balancer:
# NEXT_PUBLIC_API_BASE_URL=https://your-load-balancer-url.us-east-1.elb.amazonaws.com

# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y3JlYXRpdmUtcHJhd24tNzAuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_H59bQseJDF4ZgJRHCxe1ODYpwbBiVruQFnMNxcfJv7
```

**Important:** Make sure to set these for **Production**, **Preview**, and **Development** environments in Vercel.

---

### Step 2: Update Backend Environment Variables

Add this to your AWS backend environment (EC2, Lambda, or wherever it's deployed):

```bash
# Add your Vercel frontend URL
FRONTEND_URL=https://your-app-name.vercel.app

# Example:
# FRONTEND_URL=https://learning-management-system.vercel.app
```

---

### Step 3: Find Your AWS Backend URL

You mentioned everything is set up in AWS. Your backend URL depends on how you deployed it:

#### **Option A: API Gateway + Lambda**
1. Go to AWS Console → API Gateway
2. Find your API
3. Look for "Invoke URL" (e.g., `https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod`)

#### **Option B: Lambda Function URL**
1. Go to AWS Console → Lambda
2. Select your function
3. Go to Configuration → Function URL
4. Copy the Function URL (e.g., `https://abc123xyz.lambda-url.us-east-1.on.aws`)

#### **Option C: EC2 / Load Balancer**
1. Go to AWS Console → EC2 → Load Balancers
2. Find your load balancer
3. Copy the DNS name (e.g., `http://my-lb-123456789.us-east-1.elb.amazonaws.com`)

#### **Option D: Elastic Beanstalk**
1. Go to AWS Console → Elastic Beanstalk
2. Find your environment
3. Copy the Environment URL

---

### Step 4: Test Your Backend API

Before updating Vercel, make sure your AWS backend is accessible:

```bash
# Test health endpoint
curl https://YOUR_AWS_BACKEND_URL/

# Test courses endpoint (should return JSON)
curl https://YOUR_AWS_BACKEND_URL/courses

# If you get HTML error pages, your backend might not be deployed correctly
```

---

### Step 5: Update Vercel and Redeploy

1. Add the environment variables to Vercel (Step 1)
2. Go to Vercel → Deployments
3. Click on your latest deployment
4. Click "Redeploy" button
5. Wait for deployment to complete
6. Test your app!

---

## 🔍 Common Issues & Solutions

### Issue 1: "FETCH_ERROR" or "Failed to fetch"
**Cause:** Frontend can't reach backend
**Solution:** 
- Verify `NEXT_PUBLIC_API_BASE_URL` in Vercel is correct
- Test backend URL directly with curl
- Check if backend is running on AWS

### Issue 2: CORS Error in Browser Console
**Cause:** Backend not allowing Vercel domain
**Solution:**
- Add `FRONTEND_URL` to your AWS backend environment
- Make sure CORS is configured (already done in the fix)
- Redeploy backend with new CORS settings

### Issue 3: 401 Unauthorized
**Cause:** Clerk authentication issues
**Solution:**
- Verify Clerk keys in both frontend and backend
- Check Clerk dashboard → Allowed Origins includes your Vercel domain

### Issue 4: 500 Internal Server Error
**Cause:** Backend configuration issues
**Solution:**
- Check AWS CloudWatch logs for backend errors
- Verify all backend environment variables are set
- Check DynamoDB, S3, and other AWS service permissions

---

## 📝 Checklist for Successful Deployment

### Backend (AWS):
- [ ] Backend is deployed and accessible via URL
- [ ] All environment variables are set (Clerk, Stripe, AWS, AI keys)
- [ ] DynamoDB tables exist and have correct permissions
- [ ] S3 bucket exists and has correct permissions
- [ ] CORS is configured to allow Vercel domain
- [ ] Test backend API with curl (returns JSON, not HTML)

### Frontend (Vercel):
- [ ] `NEXT_PUBLIC_API_BASE_URL` points to AWS backend
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- [ ] `CLERK_SECRET_KEY` is set
- [ ] Environment variables are set for Production
- [ ] Redeploy after adding environment variables
- [ ] Test app in browser (check Network tab for API calls)

---

## 🧪 How to Test After Deployment

### Test Frontend:
1. Open your Vercel app in browser
2. Open DevTools → Network tab
3. Try to browse courses
4. Check if API calls are going to correct URL
5. Look for any red/failed requests

### Test Backend:
```bash
# Replace with your actual URLs
BACKEND_URL="https://your-backend-url.com"

# Test health
curl $BACKEND_URL/

# Test courses (no auth needed)
curl $BACKEND_URL/courses

# Test with authentication (get token from Clerk)
curl $BACKEND_URL/recommendations/for-you \
  -H "Authorization: Bearer YOUR_CLERK_TOKEN"
```

---

## 🎯 Quick Fix If You Don't Know Your Backend URL

If you're not sure where your backend is deployed:

### Check Your AWS Setup:

```bash
# 1. Check API Gateway
aws apigateway get-rest-apis --region us-east-1

# 2. Check Lambda Function URLs
aws lambda list-functions --region us-east-1

# 3. Check Load Balancers
aws elbv2 describe-load-balancers --region us-east-1

# 4. Check Elastic Beanstalk
aws elasticbeanstalk describe-environments --region us-east-1
```

Or simply:
1. Log into AWS Console
2. Check recent services you used
3. Look for API Gateway, Lambda, EC2, or Elastic Beanstalk
4. Find the endpoint URL

---

## 💡 Alternative: Deploy Backend to Vercel Too

If you want everything on Vercel (simpler setup):

1. Add backend as a serverless function in Vercel
2. Use Vercel's environment variables for backend
3. Both frontend and backend on same domain = no CORS issues

But since you already have AWS setup, just follow the steps above!

---

## 🆘 Still Not Working?

If you're still having issues after following these steps:

1. **Share your backend URL** so I can test it
2. **Check Vercel deployment logs** for errors
3. **Check AWS CloudWatch logs** for backend errors
4. **Share error messages** from browser console

---

## ✅ Once Working, Update .env.local for Local Development

After finding your AWS backend URL, update `/app/client/.env.local`:

```bash
# For local development, you can use local backend:
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001

# Or use production backend for testing:
# NEXT_PUBLIC_API_BASE_URL=https://your-aws-backend-url.com

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y3JlYXRpdmUtcHJhd24tNzAuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_H59bQseJDF4ZgJRHCxe1ODYpwbBiVruQFnMNxcfJv7
```

---

## 📚 Summary

**The main fix needed:**
1. Add `NEXT_PUBLIC_API_BASE_URL` to Vercel environment variables pointing to your AWS backend
2. CORS is now configured on backend to accept Vercel requests
3. Redeploy both frontend and backend

**What I fixed:**
- ✅ Backend CORS configuration
- ✅ Environment variable setup guide
- ✅ Comprehensive troubleshooting steps

**What you need to do:**
1. Find your AWS backend URL
2. Add it to Vercel as `NEXT_PUBLIC_API_BASE_URL`
3. Redeploy
4. Test!

Let me know your AWS backend URL and I can help you configure it correctly!
