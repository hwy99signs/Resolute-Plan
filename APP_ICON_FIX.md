# App Icon Fix Guide

## ⚠️ Important: App Icons Don't Show in Expo Go

**App icons only appear in standalone builds**, not in Expo Go. This is a limitation of Expo Go.

## ✅ Your Configuration is Correct

Your `app.json` is properly configured:
- ✅ `icon.png` exists in `assets/` folder
- ✅ `adaptive-icon.png` exists in `assets/` folder
- ✅ Configuration points to correct files

## 🔧 Solutions to See Your App Icon

### Option 1: Create a Development Build (Recommended for Testing)

This creates a native app with your icon embedded:

```bash
# 1. Generate native code (embeds your icon)
npx expo prebuild --clean

# 2. Build for Android (requires Android Studio)
npm run android

# OR build for iOS (requires Xcode on Mac)
npm run ios
```

**Note:** This requires Android Studio (for Android) or Xcode (for iOS).

---

### Option 2: Build with EAS (Best for Distribution)

This creates a standalone app that can be installed on devices:

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build for Android (creates APK)
eas build --platform android --profile preview

# OR build for iOS
eas build --platform ios --profile preview
```

After building, download the APK/IPA and install it on your device. **Your icon will show!**

---

### Option 3: Verify Icon Files Are Correct Size

Make sure your icon files are the correct dimensions:

- **icon.png**: Should be 1024x1024 pixels
- **adaptive-icon.png**: Should be 1024x1024 pixels (important content in center 512x512)

You can check image dimensions using any image viewer or online tool.

---

## 🎯 Quick Test

To quickly verify your icon will work:

1. **Check files exist:**
   ```bash
   dir assets\icon.png
   dir assets\adaptive-icon.png
   ```

2. **Build a preview:**
   ```bash
   eas build --platform android --profile preview
   ```

3. **Download and install the APK** - your icon will appear!

---

## 📱 Why Expo Go Doesn't Show Icons

Expo Go is a generic app that runs multiple Expo projects. It uses its own icon, not your app's icon. To see your custom icon, you need a standalone build of your app.

---

## ✅ Next Steps

1. **For Development:** Use `npx expo prebuild` + `npm run android/ios`
2. **For Testing/Distribution:** Use `eas build --platform android --profile preview`
3. **For Production:** Use `eas build --platform android --profile production`

Your icon configuration is correct - you just need to build a standalone app to see it! 🚀

