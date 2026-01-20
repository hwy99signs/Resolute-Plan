@echo off
echo.
echo ============================================
echo  BUILDING RESOLUTE PLAN v1.0.5
echo  Production Build for Google Play Store
echo ============================================
echo.
echo This will take about 15-20 minutes...
echo.
pause

cd /d "%~dp0"

echo.
echo Step 1: Checking if you're logged into Expo...
echo.
npx eas-cli whoami
if %errorlevel% neq 0 (
    echo.
    echo You need to login to Expo first.
    echo Please enter your Expo account credentials:
    echo.
    npx eas-cli login
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Login failed!
        echo.
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo  STARTING PRODUCTION BUILD
echo ============================================
echo.
echo Build Configuration:
echo - Platform: Android
echo - Profile: Production  
echo - Version: 1.0.5
echo - Version Code: 5
echo - Build Type: AAB (App Bundle)
echo.
echo The build will be uploaded to Expo servers.
echo You can close this window and monitor progress at:
echo https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
echo.
echo Press any key to start the build...
pause

npx eas-cli build --platform android --profile production --non-interactive

echo.
echo ============================================
echo  BUILD SUBMITTED!
echo ============================================
echo.
echo Check your build status at:
echo https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
echo.
echo You will receive:
echo 1. A download link when the build completes
echo 2. Email notification from Expo
echo.
echo Next Steps:
echo 1. Download the .aab file
echo 2. Upload to Google Play Console
echo 3. Add release notes (see RELEASE_NOTES_v1.0.5.txt)
echo 4. Submit for review
echo.
pause

