# Quick Build Guide - Google Play Store

## ✅ Current Configuration
- **Version:** 1.0.6
- **Version Code:** 2
- **File:** `app.json` is already updated ✓

## 🚀 Build Steps (Choose One Method)

### Method 1: Command Prompt (Recommended - No PowerShell Issues)

1. **Open Command Prompt:**
   - Press `Win + R`
   - Type `cmd` and press Enter

2. **Navigate to project:**
   ```bat
   cd "C:\Users\Shilley Pc\packq\New Year Resolutions Tracker"
   ```

3. **Set Android version (if needed):**
   ```bat
   npx eas-cli build:version:set --platform android
   ```
   - When prompted, enter:
   - Version name: `1.0.6`
   - Version code: `2`

4. **Start production build:**
   ```bat
   npx eas-cli build --platform android --profile production --clear-cache
   ```

   OR use the batch file:
   ```bat
   build-production-cmd.bat
   ```

5. **Wait for build** (15-30 minutes)

6. **Download AAB:**
   - Go to: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
   - Download the newest Android build (.aab file)

7. **Upload to Google Play:**
   - Go to Google Play Console
   - Production → Create new release
   - Upload the .aab file

---

### Method 2: Expo Dashboard (No CLI Needed)

1. Go to: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/settings

2. Click **General** in left sidebar

3. Find **App versions / Versions** section

4. Edit **Android** version:
   - Version name: `1.0.6`
   - Version code: `2`
   - Click **Save**

5. Then run build (in Command Prompt):
   ```bat
   npx eas-cli build --platform android --profile production --clear-cache
   ```

---

### Method 3: PowerShell (If You Prefer)

1. In PowerShell, run:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
   ```

2. Then:
   ```powershell
   npx eas-cli build --platform android --profile production --clear-cache
   ```

---

## ✅ Verification

After build completes, verify on expo.dev:
- Version: `1.0.6` ✓
- Version Code: `2` ✓

Then upload to Google Play - it will accept version code 2!

---

## 📝 Notes

- `app.json` is already configured correctly
- Version code must be > 1 (currently set to 2)
- Build takes 15-30 minutes
- AAB file is required for Play Store (not APK)
