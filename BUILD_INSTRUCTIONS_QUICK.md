# Quick Build Instructions

## 🚀 START BUILD NOW

### Method 1: Double-Click Script
1. Double-click **`START_BUILD_NOW.bat`** in your project folder
2. Follow the prompts
3. Wait 15-20 minutes for build to complete

### Method 2: Copy-Paste Command
Open PowerShell and paste this:

```powershell
cd "C:\Users\Shilley Pc\packq\New Year Resolutions Tracker"
npx eas-cli build --platform android --profile production
```

---

## 📋 What Happens Next?

1. **Login Prompt** (if not logged in)
   - Enter your Expo email
   - Enter your Expo password

2. **Build Configuration**
   - Expo will ask a few questions
   - Just press Enter for defaults

3. **Upload** (2-3 minutes)
   - Your code uploads to Expo servers

4. **Build** (10-15 minutes)
   - Expo builds your app
   - You'll get a progress URL

5. **Download Link** 
   - You'll receive a download link
   - Download the `.aab` file

---

## 📱 After Build Completes

### Upload to Google Play:

1. Go to: https://play.google.com/console
2. Select "Resolute Plan"
3. Click "Production" → "Create new release"
4. Upload the `.aab` file
5. Copy release notes from `RELEASE_NOTES_v1.0.5.txt`
6. Click "Review release" → "Start rollout"

---

## 🔗 Important Links

- **Build Status**: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
- **Google Play Console**: https://play.google.com/console
- **Release Notes**: See `RELEASE_NOTES_v1.0.5.txt` file

---

## ⚡ Super Quick Version

**Just run:**
```bash
npx eas-cli build -p android
```

**That's it!** ✅

Build started! Check progress at: https://expo.dev

