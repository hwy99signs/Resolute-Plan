# Google Play Store Submission Guide

## Step 1: Create Google Play Service Account

### 1.1 Access Google Play Console
1. Go to [Google Play Console](https://play.google.com/console)
2. Sign in with your Google account
3. Select your app (or create a new app if you haven't already)

### 1.2 Create Service Account
1. In Google Play Console, go to **Setup** → **API access** (or **Settings** → **API access**)
2. Scroll down to **Service accounts** section
3. Click **Create service account**
4. This will open Google Cloud Console in a new tab

### 1.3 Create Service Account in Google Cloud
1. In Google Cloud Console, click **Create Service Account**
2. Enter a name (e.g., "expo-play-store-submission")
3. Click **Create and Continue**
4. Grant role: **Service Account User** (or leave default)
5. Click **Continue** then **Done**

### 1.4 Link Service Account to Play Console
1. Go back to Google Play Console → **API access**
2. Under **Service accounts**, find your newly created service account
3. Click **Grant access**
4. Select permissions:
   - ✅ **View app information and download bulk reports**
   - ✅ **Manage production releases**
   - ✅ **Manage testing track releases** (optional, for internal testing)
5. Click **Invite user**

### 1.5 Create and Download JSON Key
1. Go back to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** → **Service Accounts**
3. Find your service account and click on it
4. Go to **Keys** tab
5. Click **Add Key** → **Create new key**
6. Select **JSON** format
7. Click **Create** - the JSON file will download automatically
8. **IMPORTANT:** Save this file securely! You can only download it once.

### 1.6 Save the Key File
1. Rename the downloaded file to something like `google-play-service-account.json`
2. Place it in your project root directory (same level as `eas.json`)
3. **IMPORTANT:** Add it to `.gitignore` to keep it secure:
   ```
   google-play-service-account.json
   *.json
   !package.json
   !tsconfig.json
   ```

## Step 2: Update eas.json Configuration

Update the `submit.production.android` section in `eas.json`:

```json
{
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-play-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

**Track options:**
- `internal` - Internal testing track (fastest, for testing)
- `alpha` - Alpha testing track
- `beta` - Beta testing track  
- `production` - Production release (requires app to be published)

**For first submission, use `internal` or `alpha` track.**

## Step 3: Prepare Your App in Play Console

Before submitting, ensure:

1. **App is created in Play Console:**
   - Go to [Google Play Console](https://play.google.com/console)
   - Click **Create app**
   - Fill in app details (name, default language, app type, free/paid)
   - Accept declarations

2. **App details are complete:**
   - App name, description, screenshots
   - App icon (512x512px)
   - Feature graphic (1024x500px)
   - Privacy policy URL (required)
   - Content rating questionnaire completed

3. **Store listing is ready:**
   - At least 2 screenshots
   - Short and full description
   - App category

## Step 4: Submit Using EAS

### Option A: Submit Latest Production Build
```bash
eas submit --platform android --profile production
```

### Option B: Submit Specific Build
```bash
eas submit --platform android --latest
```

### Option C: Submit with Specific Track
```bash
eas submit --platform android --profile production --track alpha
```

## Step 5: Monitor Submission

1. Check submission status:
   ```bash
   eas submit:list
   ```

2. View in Play Console:
   - Go to [Google Play Console](https://play.google.com/console)
   - Select your app
   - Go to **Release** → **Production** (or your selected track)
   - Check submission status

## Troubleshooting

### Error: "Service account key not found"
- Verify the path in `eas.json` is correct
- Ensure the JSON file is in the project root
- Check file permissions

### Error: "Permission denied"
- Verify service account has correct permissions in Play Console
- Check that service account is linked to your app

### Error: "App not found"
- Ensure app is created in Play Console
- Verify package name matches: `com.resolutionstracker.app`

### Error: "Version code already exists"
- Increment `versionCode` in `app.json` (currently 3)
- Rebuild the app before submitting

## Quick Reference Commands

```bash
# Submit to internal testing
eas submit --platform android --profile production --track internal

# Submit to alpha
eas submit --platform android --profile production --track alpha

# Submit to production (after testing)
eas submit --platform android --profile production --track production

# Check submission status
eas submit:list

# View submission details
eas submit:view [SUBMISSION_ID]
```

## Important Notes

1. **First Submission:** Use `internal` or `alpha` track first
2. **Version Code:** Must be unique and incrementing (currently: 3)
3. **Version Name:** Should match `app.json` version (currently: 1.0.3)
4. **Review Time:** First submission can take 1-7 days for review
5. **Updates:** Subsequent updates are usually faster (hours to 1 day)

## Security Best Practices

- ✅ Never commit service account JSON to git
- ✅ Add `*.json` (except package.json, tsconfig.json) to `.gitignore`
- ✅ Store service account key securely
- ✅ Rotate keys periodically
- ✅ Use least privilege principle for service account permissions
