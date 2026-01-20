# Google Play Store Update Guide - Version 1.0.5

## What's New in This Version

### 🔐 Password Recovery Feature
- **Forgot Password**: Users can now reset their password if they forget it
- Email-based password reset with secure token verification
- Easy-to-use recovery flow directly from the sign-in page
- Works seamlessly on both mobile and web versions

### 🎨 UI Improvements
- **Refined Welcome Screen**: Lighter, more subtle background circles for better readability
- Improved visual hierarchy and reduced visual clutter
- Enhanced user experience with cleaner design

### 🛠️ Technical Improvements
- Better error handling for authentication flows
- Improved session management
- Enhanced security for password reset functionality

---

## Release Notes for Google Play Console

### English (Copy this to Google Play Console)

```
🎉 What's New in Version 1.0.5

NEW FEATURES:
✅ Password Recovery - Forgot your password? No problem! Now you can easily reset it via email
✅ Improved Welcome Screen - Cleaner, more refined design with subtle background elements

IMPROVEMENTS:
🔧 Enhanced authentication security
🔧 Better error handling
🔧 Improved user experience

Update now for the best Resolute Plan experience!
```

### Spanish (Español)

```
🎉 Novedades en la Versión 1.0.5

NUEVAS FUNCIONES:
✅ Recuperación de Contraseña - ¿Olvidaste tu contraseña? ¡No hay problema! Ahora puedes restablecerla fácilmente por correo electrónico
✅ Pantalla de Bienvenida Mejorada - Diseño más limpio y refinado con elementos de fondo sutiles

MEJORAS:
🔧 Seguridad de autenticación mejorada
🔧 Mejor manejo de errores
🔧 Experiencia de usuario mejorada

¡Actualiza ahora para disfrutar de la mejor experiencia en Resolute Plan!
```

### French (Français)

```
🎉 Nouveautés de la Version 1.0.5

NOUVELLES FONCTIONNALITÉS :
✅ Récupération de Mot de Passe - Mot de passe oublié ? Pas de problème ! Vous pouvez maintenant le réinitialiser facilement par e-mail
✅ Écran d'Accueil Amélioré - Design plus épuré avec des éléments d'arrière-plan subtils

AMÉLIORATIONS :
🔧 Sécurité d'authentification renforcée
🔧 Meilleure gestion des erreurs
🔧 Expérience utilisateur améliorée

Mettez à jour maintenant pour profiter de la meilleure expérience Resolute Plan !
```

---

## Step-by-Step Update Process

### Step 1: Build the Production APK/AAB

```bash
# Make sure you're in your project directory
cd "C:\Users\Shilley Pc\packq\New Year Resolutions Tracker"

# Login to Expo (if not already logged in)
npx eas-cli login

# Build for Android Production (App Bundle for Google Play)
npm run eas:build:android -- --profile production
```

**What happens:**
- EAS Build will create an AAB (Android App Bundle) file
- This process takes about 10-20 minutes
- You'll get a download link when it's done

### Step 2: Download the Build

After the build completes:
1. You'll see a link in the terminal
2. Or go to: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
3. Download the `.aab` file to your computer

### Step 3: Upload to Google Play Console

1. **Go to Google Play Console**
   - Visit: https://play.google.com/console
   - Select "Resolute Plan" app

2. **Navigate to Production Release**
   - Click **"Production"** in the left sidebar
   - Click **"Create new release"**

3. **Upload the AAB**
   - Click **"Upload"**
   - Select the `.aab` file you downloaded
   - Wait for upload to complete

4. **Add Release Notes**
   - Copy the release notes above (choose your language)
   - Paste in the "Release notes" field
   - You can add notes for multiple languages

5. **Review and Rollout**
   - Click **"Review release"**
   - Check everything looks correct
   - Click **"Start rollout to Production"**
   - Confirm the rollout

### Step 4: Monitor the Release

- **Review Status**: Takes 1-3 days for Google to review
- **Rollout**: After approval, it goes live to users
- **Updates**: Users will see the update in Google Play Store

---

## Alternative: Internal Testing First (Recommended)

Before pushing to production, you can test with internal testers:

```bash
# Build for internal testing
npm run eas:build:android -- --profile production
```

Then in Google Play Console:
1. Go to **"Internal testing"** instead of Production
2. Upload the AAB
3. Add release notes
4. Share with your testers
5. After testing, promote to Production

---

## Quick Commands Reference

```bash
# Check if EAS CLI is installed
npx eas-cli --version

# Login to Expo
npx eas-cli login

# Build for Android (Production)
npm run eas:build:android -- --profile production

# Build for both Android and iOS
npm run eas:build:all -- --profile production

# Check build status
npx eas-cli build:list

# View build details
npx eas-cli build:view [build-id]
```

---

## Troubleshooting

### If build fails:

1. **Check credentials**
   ```bash
   npx eas-cli credentials
   ```

2. **Clear cache and retry**
   ```bash
   npx eas-cli build:cancel
   npm run eas:build:android -- --profile production --clear-cache
   ```

3. **Check for errors**
   - Review the build logs in Expo dashboard
   - Common issues: missing dependencies, configuration errors

### If upload fails:

1. **Check version code**
   - Must be higher than previous version (now 5)
   - Check app.json: `"versionCode": 5`

2. **Check file format**
   - Must be `.aab` for production (not `.apk`)
   - APK is only for testing

3. **Check signing**
   - EAS handles signing automatically
   - If issues, regenerate keystore in EAS

---

## Important Notes

✅ **Version Updated**: 1.0.4 → 1.0.5
✅ **Version Code Updated**: 4 → 5
✅ **Build Number Updated**: 4 → 5

🔔 **Notify Users**: Consider sending a push notification about the new password reset feature

📊 **Monitor**: Watch crash reports and user feedback after release

🎯 **Next Steps**: After this update, consider:
- Adding more authentication options
- Implementing biometric login
- Adding social media sign-in

---

## Need Help?

- **Expo Docs**: https://docs.expo.dev/submit/android/
- **Google Play Docs**: https://support.google.com/googleplay/android-developer/
- **EAS Build Status**: https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds

