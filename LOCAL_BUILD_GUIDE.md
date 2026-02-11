# Local Build Guide - Production AAB

## Current Situation

### Option 1: EAS Build (Cloud - Recommended)
- ✅ No local setup required
- ❌ Currently failing (check dashboard for error details)
- ⏰ Free plan resets in 11 days

### Option 2: Local Build (Requires Java)
- ✅ Builds immediately
- ✅ No plan limits
- ❌ Requires Java JDK installation

---

## Local Build Setup

### Step 1: Install Java JDK

**Download Java JDK 17 or 21:**
1. Visit: https://adoptium.net/ (or https://www.oracle.com/java/technologies/downloads/)
2. Download **JDK 17** or **JDK 21** for Windows
3. Install the JDK
4. **Set JAVA_HOME environment variable:**
   - Open **System Properties** → **Environment Variables**
   - Add new **System Variable**:
     - Name: `JAVA_HOME`
     - Value: `C:\Program Files\Java\jdk-17` (or your JDK installation path)
   - Add to **Path** variable:
     - Add: `%JAVA_HOME%\bin`

**Verify installation:**
```powershell
java -version
```

### Step 2: Build Production AAB

Once Java is installed, run:

```powershell
cd android
.\gradlew.bat bundleRelease
```

**Output location:**
```
android\app\build\outputs\bundle\release\app-release.aab
```

**Mapping file location:**
```
android\app\build\outputs\mapping\release\mapping.txt
```

### Step 3: Build APK (for phone installation)

```powershell
cd android
.\gradlew.bat assembleRelease
```

**Output location:**
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## Alternative: Check EAS Build Error

Before setting up local build, check the actual error:

1. **Visit EAS Dashboard:**
   ```
   https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
   ```

2. **Find the latest failed build**

3. **Click to view logs** - look for the actual error message

4. **Common issues:**
   - Free plan limit (wait 11 days or upgrade)
   - Build configuration error
   - Dependency issue
   - Gradle version mismatch

---

## Quick Commands Summary

### Using npm (still uses EAS):
```bash
# Production AAB
npm run eas:build:android -- --profile production

# Preview APK
npm run eas:build:android -- --profile preview
```

### Using Gradle (local, requires Java):
```bash
# Production AAB
cd android
.\gradlew.bat bundleRelease

# Production APK
cd android
.\gradlew.bat assembleRelease
```

---

## Note About Google Play Account Issue

Based on the screenshot you shared, there are **account issues preventing publishing** to Google Play. This is separate from building:

- ✅ **Building** = Creating the AAB/APK file (what we're doing)
- ❌ **Publishing** = Uploading to Google Play (blocked by account issues)

You can still build the app, but you'll need to resolve the account issues in Google Play Console before you can upload it.

**To fix account issues:**
1. Go to Google Play Console
2. Click "View details" on the red error message
3. Resolve the issues (usually payment, verification, or compliance issues)

---

## Recommendation

1. **First**: Check EAS dashboard for the actual build error
2. **If EAS continues to fail**: Install Java and build locally
3. **Then**: Resolve Google Play account issues to enable publishing

---

**Status**: 
- ✅ Configuration ready
- ⏳ Waiting for build (EAS) or Java setup (local)
- ⚠️ Google Play account issues need resolution

