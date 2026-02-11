# iOS Production Build Setup Guide

## Current Status

✅ **Configuration Updated:**
- Version: 1.0.4
- Build Number: 4
- iOS scheme: "App"
- Build configuration: Release

⚠️ **Required Setup:**
- Apple Developer account credentials
- Encryption compliance answer
- Code signing setup

---

## Step-by-Step Setup

### Step 1: Configure iOS Credentials

Run this command in your terminal (interactive):

```bash
eas credentials --platform ios
```

**What you'll need:**
1. Select build profile: **production**
2. Choose credential type: **Apple App Store Connect API Key** (recommended) or **Apple Distribution Certificate**
3. Provide Apple Developer account details:
   - Apple ID
   - App Store Connect API Key (or generate new one)
   - Team ID

**For App Store Connect API Key:**
1. Go to: https://appstoreconnect.apple.com/access/api
2. Create a new key with "App Manager" or "Admin" role
3. Download the `.p8` key file (you can only download once!)
4. Note the Key ID and Issuer ID

### Step 2: Answer Encryption Compliance

When building, you'll be asked:
> "iOS app only uses standard/exempt encryption?"

**Answer:** `false` (most apps use standard encryption)

This can be configured in your Apple Developer account or answered during build.

### Step 3: Build iOS Production App

Once credentials are configured, run:

```bash
npm run eas:build:ios -- --profile production
```

Or directly:

```bash
eas build --platform ios --profile production
```

---

## Alternative: Use Preview Profile First

If you want to test the build process first:

```bash
# Build for TestFlight (preview)
npm run eas:build:ios -- --profile preview
```

This uses the same credentials but is easier for testing.

---

## What Gets Built

### Production Build:
- **Output**: IPA file for App Store submission
- **Requires**: Apple Developer account ($99/year)
- **Distribution**: App Store Connect
- **Version**: 1.0.4
- **Build Number**: 4

### Preview Build:
- **Output**: IPA file for TestFlight
- **Requires**: Apple Developer account
- **Distribution**: TestFlight (beta testing)
- **Version**: 1.0.4
- **Build Number**: 4

---

## Prerequisites Checklist

Before building, ensure you have:

- [ ] Apple Developer account (paid, $99/year)
- [ ] App Store Connect access
- [ ] App created in App Store Connect
- [ ] Bundle ID matches: `com.resolutionstracker.app`
- [ ] iOS credentials configured in EAS
- [ ] Encryption compliance answered

---

## Quick Commands

```bash
# Configure credentials (interactive)
eas credentials --platform ios

# Build production iOS app
npm run eas:build:ios -- --profile production

# Build preview iOS app (TestFlight)
npm run eas:build:ios -- --profile preview

# Check build status
eas build:list --platform ios

# View build details
eas build:view [BUILD_ID]
```

---

## Troubleshooting

### Error: "No schemes found"
✅ **Fixed**: Added `"scheme": "App"` to eas.json

### Error: "Encryption compliance required"
**Solution**: Answer `false` when prompted, or configure in Apple Developer account

### Error: "Credentials not found"
**Solution**: Run `eas credentials --platform ios` to set up

### Error: "Apple Developer account required"
**Solution**: You need a paid Apple Developer account ($99/year)

---

## After Build Completes

1. **Download IPA** from EAS dashboard:
   ```
   https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
   ```

2. **Submit to App Store Connect**:
   ```bash
   eas submit --platform ios
   ```

3. **Or upload manually**:
   - Go to App Store Connect
   - Upload the IPA file
   - Submit for review

---

## Current Configuration

**app.json:**
- Version: 1.0.4
- iOS buildNumber: 4
- Bundle ID: com.resolutionstracker.app

**eas.json:**
- Production profile configured
- Scheme: "App"
- Build configuration: Release

---

**Next Step**: Run `eas credentials --platform ios` to configure your Apple Developer credentials, then build!
