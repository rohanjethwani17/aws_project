# 📸 Vercel Dashboard - Step by Step Guide

## 🎯 Your Lambda URL (Copy This):
```
https://34qhamyk4bzz5gk4frxxeafxsu0pascl.lambda-url.us-east-1.on.aws
```

---

## Step 1: Go to Vercel Dashboard

1. Open: https://vercel.com/dashboard
2. Find your project: **learning-management-app-pi**
3. Click on it

---

## Step 2: Go to Settings

1. Click **"Settings"** tab (top navigation)
2. Click **"Environment Variables"** in left sidebar

---

## Step 3: Find NEXT_PUBLIC_API_BASE_URL

Look for a variable named: `NEXT_PUBLIC_API_BASE_URL`

### If it EXISTS:
1. Click the **"..."** menu next to it
2. Click **"Edit"**
3. Change the value to:
   ```
   https://34qhamyk4bzz5gk4frxxeafxsu0pascl.lambda-url.us-east-1.on.aws
   ```
4. Make sure **"Production"** is checked
5. Click **"Save"**

### If it DOESN'T EXIST:
1. Click **"Add New"** button
2. **Name:** `NEXT_PUBLIC_API_BASE_URL`
3. **Value:** `https://34qhamyk4bzz5gk4frxxeafxsu0pascl.lambda-url.us-east-1.on.aws`
4. **Environment:** Check **"Production"** (and optionally Preview, Development)
5. Click **"Save"**

---

## Step 4: Verify Other Environment Variables

Make sure these also exist:

### NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- Value: `pk_test_Y3JlYXRpdmUtcHJhd24tNzAuY2xlcmsuYWNjb3VudHMuZGV2JA`
- Environment: Production

### NEXT_PUBLIC_STRIPE_PUBLIC_KEY
- Value: `pk_test_51S8cYpBRGJtmPBRNC6MSAnKIG6LkjLGzIwwBsqtGDIZnQswyztqnqQffcag49fkGFlEUqNZiojBsRVo12Ls39qVY00qS3vMGTs`
- Environment: Production

### NEXT_PUBLIC_STRIPE_REDIRECT_URL
- Value: `https://learning-management-app-pi.vercel.app/checkout?step=3`
- Environment: Production

---

## Step 5: Redeploy

1. Click **"Deployments"** tab (top navigation)
2. Find the latest deployment (top of the list)
3. Click the **"..."** menu on the right
4. Click **"Redeploy"**
5. **IMPORTANT:** UNCHECK "Use existing Build Cache"
6. Click **"Redeploy"** button

---

## Step 6: Wait for Deployment

1. You'll see "Building..." status
2. Wait 2-3 minutes
3. Status will change to "Ready"
4. Click **"Visit"** button to test

---

## Step 7: Test Your App

1. Open: https://learning-management-app-pi.vercel.app/
2. You should see the homepage
3. Click on "Search" or "Courses"
4. You should see 5 courses
5. Click on any course
6. Course details should load

### If it works:
✅ You're done! Everything is fixed!

### If it still doesn't work:
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Refresh the page
4. Look for a request to `/courses`
5. Click on it
6. Check the **Request URL**
7. Take a screenshot and share it

---

## 🔍 How to Check if Environment Variable is Applied

### Method 1: Check Build Logs
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Building"** or **"Build Logs"**
4. Search for `NEXT_PUBLIC_API_BASE_URL` (Ctrl+F / Cmd+F)
5. You should see your Lambda URL

### Method 2: Check Browser Console
1. Open your Vercel app
2. Press F12 (DevTools)
3. Go to **Console** tab
4. Type: `process.env.NEXT_PUBLIC_API_BASE_URL`
5. Press Enter
6. You should see your Lambda URL

### Method 3: Check Network Requests
1. Open your Vercel app
2. Press F12 (DevTools)
3. Go to **Network** tab
4. Refresh the page
5. Look for requests to `/courses` or `/recommendations`
6. Click on one
7. Check the **Request URL** - should start with your Lambda URL

---

## ⚠️ Common Mistakes

### Mistake 1: Wrong Environment
- ❌ Variable set for "Preview" or "Development" only
- ✅ Must be set for "Production"

### Mistake 2: Trailing Slash
- ❌ `https://...amazonaws.com/` (with slash)
- ✅ `https://...amazonaws.com` (no slash)

### Mistake 3: Using Build Cache
- ❌ "Use existing Build Cache" checked
- ✅ "Use existing Build Cache" UNCHECKED

### Mistake 4: Wrong Variable Name
- ❌ `API_BASE_URL` (missing NEXT_PUBLIC_)
- ✅ `NEXT_PUBLIC_API_BASE_URL`

### Mistake 5: Not Waiting
- ❌ Testing immediately after clicking redeploy
- ✅ Wait 2-3 minutes for deployment to complete

---

## 📊 What You Should See

### In Vercel Environment Variables:
```
Name: NEXT_PUBLIC_API_BASE_URL
Value: https://34qhamyk4bzz5gk4frxxeafxsu0pascl.lambda-url.us-east-1.on.aws
Environment: Production ✓
```

### In Browser Network Tab:
```
Request URL: https://34qhamyk4bzz5gk4frxxeafxsu0pascl.lambda-url.us-east-1.on.aws/courses
Status: 200 OK
```

### In Browser:
```
✅ Homepage loads
✅ Courses page shows 5 courses
✅ No error messages
✅ Everything works like local
```

---

## 🆘 Still Not Working?

If you followed all steps and it's still not working:

1. Take a screenshot of:
   - Vercel Environment Variables page
   - Browser Network tab showing the request URL
   - Browser Console showing any errors

2. Check:
   - Is the environment variable name exactly: `NEXT_PUBLIC_API_BASE_URL`?
   - Is the value exactly: `https://34qhamyk4bzz5gk4frxxeafxsu0pascl.lambda-url.us-east-1.on.aws`?
   - Is "Production" checked?
   - Did you wait 2-3 minutes after redeploying?
   - Did you uncheck "Use existing Build Cache"?

3. Try:
   - Delete the environment variable completely
   - Add it again from scratch
   - Redeploy with no cache

---

**Follow these steps exactly and your app will work!** 🚀
