# 🚀 VERCEL DEPLOYMENT FIX - Step-by-Step Instructions

## ✅ Your Configuration

**Backend API Gateway URL:** `https://3ww2kmdkxi.execute-api.us-east-1.amazonaws.com/prod`
**Status:** ✅ Tested and working!

---

## 📋 Step-by-Step Fix

### Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Select your project
3. Click on **Settings** tab
4. Click on **Environment Variables** in the left sidebar
5. Add these **THREE** variables:

#### Variable 1: Backend API URL
```
Name: NEXT_PUBLIC_API_BASE_URL
Value: https://3ww2kmdkxi.execute-api.us-east-1.amazonaws.com/prod
```
✅ Check: Production, Preview, Development (all three)

#### Variable 2: Clerk Publishable Key
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_Y3JlYXRpdmUtcHJhd24tNzAuY2xlcmsuYWNjb3VudHMuZGV2JA
```
✅ Check: Production, Preview, Development (all three)

#### Variable 3: Clerk Secret Key
```
Name: CLERK_SECRET_KEY
Value: sk_test_H59bQseJDF4ZgJRHCxe1ODYpwbBiVruQFnMNxcfJv7
```
✅ Check: Production, Preview, Development (all three)

6. Click **Save** for each variable

---

### Step 2: Update AWS Lambda Environment Variables

Your AWS backend needs to know about your Vercel frontend URL.

1. Go to AWS Console: https://console.aws.amazon.com/lambda
2. Find your Lambda function
3. Click on **Configuration** tab
4. Click on **Environment variables**
5. Click **Edit**
6. Add this variable:

```
Key: FRONTEND_URL
Value: https://your-app-name.vercel.app
```

Replace `your-app-name` with your actual Vercel deployment URL (e.g., `learning-management-system.vercel.app`)

7. Click **Save**

---

### Step 3: Redeploy Backend (if needed)

The backend code has been updated with better CORS configuration. You need to redeploy it to AWS:

**Option A: If using Serverless Framework:**
```bash
cd /app/server
npm run build
serverless deploy
```

**Option B: If using AWS SAM:**
```bash
cd /app/server
npm run build
sam build
sam deploy
```

**Option C: If using AWS CDK:**
```bash
cd /app/server
npm run build
cdk deploy
```

**Option D: Manual Lambda Upload:**
1. Run: `cd /app/server && npm run build`
2. Create a zip file of the `dist` folder and `node_modules`
3. Upload to Lambda via AWS Console

---

### Step 4: Redeploy Frontend on Vercel

1. Go to Vercel dashboard
2. Click on your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Click **⋯ (three dots)** menu
6. Click **Redeploy**
7. Select **Use existing Build Cache** or **Redeploy without using cache** (recommended)
8. Click **Redeploy**

**Wait 2-3 minutes for deployment to complete**

---

### Step 5: Test Your Deployment

1. Open your Vercel app URL in browser: `https://your-app-name.vercel.app`
2. Open **DevTools** (F12) → **Console** tab
3. Open **Network** tab
4. Try to browse courses or click on any course
5. **Check Network tab** - You should see requests to:
   ```
   https://3ww2kmdkxi.execute-api.us-east-1.amazonaws.com/prod/courses
   ```
6. **Check if they return 200 status** with JSON data (not HTML errors)

---

## 🔍 Troubleshooting

### Issue: Still seeing "FETCH_ERROR"

**Cause:** Environment variables not loaded
**Solution:**
1. Verify all 3 environment variables are added to Vercel
2. Make sure you clicked **Save** for each
3. Try **Redeploy without cache**

### Issue: CORS Error in Console

**Cause:** Backend not allowing Vercel domain
**Solution:**
1. Add `FRONTEND_URL` to Lambda environment variables
2. Redeploy backend to AWS
3. Wait 2-3 minutes, then test again

### Issue: 401 Unauthorized

**Cause:** Clerk authentication issues
**Solution:**
1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **API Keys** section
3. Under **Allowed Origins**, add your Vercel domain:
   ```
   https://your-app-name.vercel.app
   ```
4. Save and wait a few minutes

### Issue: Courses not showing

**Cause:** API endpoint path issue
**Solution:**
The API URL is correct. Check:
1. Backend is returning data: `curl https://3ww2kmdkxi.execute-api.us-east-1.amazonaws.com/prod/courses`
2. Should return JSON with courses array
3. If returning HTML error page, check Lambda logs in CloudWatch

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Vercel environment variables are set (all 3)
- [ ] Backend deployed with updated CORS
- [ ] Frontend redeployed on Vercel
- [ ] Can browse courses without errors
- [ ] Can click on individual courses
- [ ] No CORS errors in browser console
- [ ] Network tab shows successful API calls

---

## 🎯 Quick Test Commands

Test your backend is working:

```bash
# Test health endpoint
curl https://3ww2kmdkxi.execute-api.us-east-1.amazonaws.com/prod/

# Test courses endpoint
curl https://3ww2kmdkxi.execute-api.us-east-1.amazonaws.com/prod/courses

# Should return: {"message":"Courses retrieved successfully","data":[...]}
```

---

## 📝 What Was Fixed

1. ✅ Updated CORS configuration in backend to allow Vercel domains
2. ✅ Created `.env.production` file with correct API Gateway URL
3. ✅ Updated `.env.local` for local testing with production backend
4. ✅ Tested API Gateway endpoint - confirmed working
5. ✅ Provided step-by-step Vercel configuration guide

---

## 🆘 Still Having Issues?

If you're still seeing errors after following all steps:

1. **Check Vercel Deployment Logs:**
   - Go to Vercel Dashboard → Deployments
   - Click on latest deployment
   - Check **Build Logs** and **Function Logs**

2. **Check AWS Lambda Logs:**
   - Go to AWS Console → CloudWatch
   - Find logs for your Lambda function
   - Look for CORS or authentication errors

3. **Share Error Details:**
   - Browser console error messages
   - Network tab screenshot showing failed requests
   - Vercel deployment logs
   - AWS Lambda CloudWatch logs

---

## 📚 Summary

**Your Backend:** ✅ Working at `https://3ww2kmdkxi.execute-api.us-east-1.amazonaws.com/prod`

**Required Vercel Variables:**
1. `NEXT_PUBLIC_API_BASE_URL` = Backend URL
2. `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Clerk auth
3. `CLERK_SECRET_KEY` = Clerk auth

**Next Step:** Add these 3 variables to Vercel and redeploy!

The fix is simple - your frontend just needs to know where your backend is! 🎉
