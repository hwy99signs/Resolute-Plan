# Production Build for Google Play Store

## Prerequisites

1. **EAS CLI installed globally:**
   ```bash
   npm install -g eas-cli
   ```

2. **EAS Account Setup:**
   ```bash
   eas login
   ```

3. **Configure EAS Build (if not already done):**
   ```bash
   eas build:configure
   ```

## Current Configuration

- **App Version:** 1.0.5
- **Version Code:** 5
- **Package Name:** com.resolutionstracker.app
- **Build Type:** app-bundle (AAB) - Required for Play Store

## Production Build Steps

### Option 1: Using npm script (Recommended)

```bash
npm run build:production:android
```

This will:
- Build an Android App Bundle (AAB) for production
- Use the production profile from `eas.json`
- Generate a signed AAB ready for Play Store upload

### Option 2: Using EAS CLI directly

```bash
npx eas-cli build --platform android --profile production
```

### Option 3: Interactive build

```bash
npx eas-cli build
# Select: Android
# Select: Production
```

## Build Process

1. **EAS will:**
   - Upload your project to Expo servers
   - Build the Android App Bundle (AAB) in the cloud
   - Sign it with your keystore
   - Provide download link when complete

2. **Build Time:** Typically 15-30 minutes

3. **You'll receive:**
   - A download link for the AAB file
   - Build logs and details

## After Build Completes

### Download the AAB file

1. Visit the build URL provided in terminal
2. Or check: https://expo.dev/accounts/[your-account]/builds
3. Download the `.aab` file

### Upload to Google Play Console

1. Go to Google Play Console: https://play.google.com/console
2. Select your app
3. Go to **Production** → **Create new release**
4. Upload the `.aab` file
5. Fill in release notes
6. Review and publish

## Version Management

Before each new build, update version in `app.json`:

```json
{
  "expo": {
    "version": "1.0.6",  // Increment this
    "android": {
      "versionCode": 6  // Increment this (must be higher than previous)
    }
  }
}
```

**Important:** 
- `version` = User-facing version (e.g., "1.0.6")
- `versionCode` = Internal version number (must always increase)

## Troubleshooting

### Build fails with signing error
- Ensure you have a keystore configured
- Run: `eas credentials` to manage credentials

### Need to update keystore
```bash
eas credentials
# Select: Android
# Select: Set up new credentials
```

### Check build status
```bash
eas build:list
```

### View build logs
```bash
eas build:view [build-id]
```

## Quick Commands Reference

```bash
# Production build for Android
npm run build:production:android

# Check build status
eas build:list

# View credentials
eas credentials

# Submit to Play Store (if configured)
npm run eas:submit
```

## Notes

- **AAB vs APK:** Google Play requires AAB format (already configured)
- **Signing:** EAS handles signing automatically
- **Testing:** Test the build before submitting to production track
- **Internal Testing:** Use `preview` profile for internal testing first

---

**Ready to build?** Run: `npm run build:production:android`
