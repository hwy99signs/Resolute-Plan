# Password Reset Setup Guide

## Issue
Password reset emails are currently sending links to `localhost:3000` instead of your live domain.

## Solution

### Step 1: Configure Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project: `mirpnmrsjjmmiqbbawab`

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **URL Configuration** tab

3. **Update Site URL**
   - Find the **Site URL** field
   - Change from: `http://localhost:3000`
   - Change to: `https://your-live-domain.com` (your actual deployed website URL)
   - Click **Save**

4. **Add Redirect URLs**
   - In the **Redirect URLs** section
   - Add these URLs (one per line):
     ```
     http://localhost:3000/reset-password
     https://your-live-domain.com/reset-password
     https://your-live-domain.vercel.app/reset-password (if using Vercel)
     https://your-live-domain.netlify.app/reset-password (if using Netlify)
     resolutionstracker://reset-password (for mobile app)
     ```
   - Click **Save**

### Step 2: Deploy Your Website

You need to deploy your web app to get a live domain. Here are free hosting options:

#### Option A: Vercel (Recommended)
1. Create account at https://vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. Run: `vercel` in your project directory
4. Follow prompts
5. Your site will be at: `https://your-app.vercel.app`

#### Option B: Netlify
1. Create account at https://netlify.com
2. Install Netlify CLI: `npm i -g netlify-cli`
3. Run: `netlify deploy` in your project directory
4. Follow prompts
5. Your site will be at: `https://your-app.netlify.app`

#### Option C: GitHub Pages
1. Push your code to GitHub
2. Enable GitHub Pages in repository settings
3. Your site will be at: `https://yourusername.github.io/repo-name`

### Step 3: Update Environment Variable

After deploying, create a `.env` file in your project root:

```env
# Production Website URL
EXPO_PUBLIC_SITE_URL=https://your-actual-domain.com
```

Replace `https://your-actual-domain.com` with your actual deployed URL.

### Step 4: Build for Web

```bash
# Install dependencies if needed
npm install

# Build the web version
npm run build

# Or start development server
npm run dev
```

### Step 5: Test Password Reset

1. Go to your sign-in page (on mobile or web)
2. Click "Forgot Password?"
3. Enter your email
4. Check your email for the reset link
5. Click the link - it should now go to your live domain
6. Enter new password
7. Sign in with new password

## Important Notes

### For Mobile App
- The mobile app uses deep linking: `resolutionstracker://reset-password`
- This is already configured in `app.json`
- No additional changes needed for mobile

### For Web App
- The web app uses your live domain URL
- Make sure to update `EXPO_PUBLIC_SITE_URL` after deployment
- Add all possible URLs to Supabase Redirect URLs

### Security
- Never commit `.env` file to Git (it's already in `.gitignore`)
- Keep your Supabase keys secure
- Use environment variables for production

## Current Status

✅ Reset password page created: `app/reset-password.tsx`
✅ Auth service updated to support production URLs
⏳ **Action Required:** Deploy website and update Supabase settings

## What You've Just Received

The password reset email contains a URL like this:
```
http://localhost:3000/#access_token=...&type=recovery
```

After following this guide, it will be:
```
https://your-domain.com/#access_token=...&type=recovery
```

## Quick Deployment Commands

```bash
# For Vercel
npm run build
vercel --prod

# For Netlify
npm run build
netlify deploy --prod

# The build output is in 'dist' folder
```

## Hosting Recommendations

1. **Vercel** - Best for React/Next.js (Free tier available)
2. **Netlify** - Great for static sites (Free tier available)
3. **Firebase Hosting** - Good integration with Supabase
4. **Render** - Simple deployment (Free tier available)

## Need Help?

If you encounter issues:
1. Check Supabase Dashboard → Authentication → Users (confirm user exists)
2. Check Supabase Dashboard → Authentication → URL Configuration
3. Verify your site is deployed and accessible
4. Check browser console for errors
5. Verify email was sent (check spam folder)

