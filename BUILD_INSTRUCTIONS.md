# Build Instructions for Google Play Update

## Step-by-Step Build Process

### Step 1: Check Your Setup

Open **PowerShell** or **Command Prompt** as Administrator and run these commands one by one:

```powershell
# Check Node.js version (should be 16 or higher)
node --version

# Check npm version
npm --version

# Navigate to your project
cd "C:\Users\Shilley Pc\packq\New Year Resolutions Tracker"

# Verify you're in the right folder (should show package.json)
dir package.json
```

### Step 2: Login to Expo

```powershell
# Login to your Expo account
npx eas-cli login
```

**What you'll see:**
- Prompt for email/username
- Prompt for password
- Success message when logged in

**Your Expo Account:**
- Username: `resolute-plan` (or your username)
- Use the same credentials you use for https://expo.dev

### Step 3: Build for Production

```powershell
# Build Android App Bundle for Google Play Store
npx eas-cli build --platform android --profile production
```

**What happens:**
1. EAS asks if you want to create a new build ➜ Select **YES**
2. Uploads your code to Expo servers
3. Builds your app (takes 10-20 minutes)
4. Provides download link when done

**Expected Output:**
```
✔ Build successful
🚀 Android app bundle: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds/[build-id]
```

### Step 4: Monitor Build Progress

**Option A: In Terminal**
- Watch the progress bar
- Wait for completion message

**Option B: In Browser**
- Visit: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
- See real-time build status
- Download when ready

### Step 5: Download the Build

1. Click the download link from terminal OR
2. Go to Expo dashboard → Builds → Click latest build → Download
3. Save the `.aab` file to your computer (e.g., Desktop)

---

## Alternative: Use npm Scripts

If the above doesn't work, try using the npm scripts:

```powershell
# Navigate to project
cd "C:\Users\Shilley Pc\packq\New Year Resolutions Tracker"

# Build using npm script
npm run eas:build:android -- --profile production
```

---

## Troubleshooting

### Issue 1: "npx not found" or "npm not found"

**Solution:** Install Node.js
1. Download from: https://nodejs.org/
2. Install LTS version (recommended)
3. Restart PowerShell/Command Prompt
4. Try again

### Issue 2: "eas-cli not found"

**Solution:** Use npx (no installation needed)
```powershell
npx eas-cli login
npx eas-cli build --platform android --profile production
```

### Issue 3: "Not logged in to Expo"

**Solution:** Login first
```powershell
npx eas-cli login
# Enter your Expo credentials
```

### Issue 4: "Build failed"

**Solution:** Check logs
1. Look at error message in terminal
2. Or check Expo dashboard for detailed logs
3. Common fixes:
   ```powershell
   # Clear cache and retry
   npx eas-cli build --platform android --profile production --clear-cache
   ```

### Issue 5: "Credentials not configured"

**Solution:** Let EAS handle it
- EAS will prompt you to generate credentials
- Select **"Yes, let EAS handle it automatically"**
- It will create and manage keystores for you

---

## Quick Reference Commands

```powershell
# Check if logged in
npx eas-cli whoami

# List all builds
npx eas-cli build:list

# View specific build
npx eas-cli build:view [build-id]

# Cancel a running build
npx eas-cli build:cancel

# Check build status
npx eas-cli build:list --status in-progress
```

---

## What You Need Ready

Before starting:
- ✅ Expo account credentials
- ✅ Internet connection (build uploads ~50-100MB)
- ✅ Time (build takes 10-20 minutes)

After build completes:
- ✅ Download the `.aab` file
- ✅ Have Google Play Console access ready
- ✅ Release notes ready (already in RELEASE_NOTES_v1.0.5.txt)

---

## Expected Timeline

1. **Login**: 1 minute
2. **Upload code**: 2-3 minutes
3. **Queue time**: 0-5 minutes (depends on Expo load)
4. **Build time**: 10-15 minutes
5. **Download**: 1-2 minutes

**Total: ~15-25 minutes**

---

## After Build Success

Once you have the `.aab` file:

1. **Go to Google Play Console**
   - https://play.google.com/console

2. **Select Your App**
   - "Resolute Plan"

3. **Create New Release**
   - Production → Create new release
   - Upload the `.aab` file
   - Add release notes from `RELEASE_NOTES_v1.0.5.txt`
   - Review and publish

4. **Wait for Review**
   - Google reviews in 1-3 days
   - You'll get email notification
   - Then it goes live to users!

---

## Need More Help?

If you encounter issues:

1. **Check Expo Status**: https://status.expo.dev/
2. **View Logs**: Go to Expo dashboard → Builds → Click build → View logs
3. **Expo Docs**: https://docs.expo.dev/build/setup/
4. **Expo Discord**: https://chat.expo.dev/

---

## Video Tutorial

If you prefer video instructions:
1. Search YouTube for: "EAS Build Android Tutorial"
2. Or visit: https://docs.expo.dev/build/setup/

---

## Summary

**Single command to build:**
```powershell
cd "C:\Users\Shilley Pc\packq\New Year Resolutions Tracker"
npx eas-cli build --platform android --profile production
```

That's it! The rest is handled by Expo. 🚀

