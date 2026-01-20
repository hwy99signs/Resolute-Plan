# Build New Production AAB for Google Play

## Current Status

**Production Build Status:** ❌ OUTDATED

- **Current Production Build:**
  - Version: 1.0.2
  - Version Code: 1
  - Built: December 15, 2025
  - Commit: 3fb0bfd6 (10 commits behind)

- **Latest Code:**
  - Version: 1.0.3
  - Latest Commit: 45a42722
  - Missing Features: 10 commits worth of changes

## Missing Features in Current Production Build

1. ✅ Journal media preview and download functionality
2. ✅ Notification feed translations
3. ✅ Welcome screen updates and metrics
4. ✅ Journal content truncation with read more feature
5. ✅ Push notification support for reminders
6. ✅ Bug fixes and refactoring
7. ✅ Updated project files

## Action Required: Build New Production AAB

### Step 1: Update Version Code

The current production build has version code 1, but your app.json shows version 1.0.3. You need to increment the version code for the new build.

**Current in app.json:**
- version: "1.0.3"
- versionCode: 3

**For new build, update to:**
- version: "1.0.3" (or increment to "1.0.4" if you prefer)
- versionCode: 4 (must be higher than previous builds)

### Step 2: Build New Production AAB

```bash
npm run eas:build:android -- --profile production
```

Or:

```bash
npx eas-cli build --platform android --profile production
```

### Step 3: Wait for Build to Complete

- Check build status: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
- Build typically takes 15-30 minutes
- You'll receive a notification when complete

### Step 4: Download New AAB

Once build completes:
1. Go to EAS Build dashboard
2. Download the new production AAB
3. Or use: `eas build:download --latest`

### Step 5: Submit to Google Play

Use the new AAB file for submission:

```bash
eas submit --platform android --path [new-aab-file] --profile production
```

## Quick Commands

```bash
# Check current version
cat app.json | grep -A 2 "version"

# Build new production AAB
npm run eas:build:android -- --profile production

# Check build status
npx eas-cli build:list --platform android --profile production --limit 1

# Download latest build
npx eas-cli build:download --latest
```

## Important Notes

1. **Version Code Must Increment:** Google Play requires each new build to have a higher version code than the previous one
2. **Version Name:** Can stay the same or increment (1.0.3 → 1.0.4)
3. **Build Time:** Allow 15-30 minutes for the build to complete
4. **Free Plan Limits:** You mentioned hitting free plan limits earlier - check if you have builds available
5. **Test First:** Consider testing with a preview build first before production

## Recommendation

✅ **Build a new production AAB now** to include all the latest features and fixes before submitting to Google Play Store.
