@echo off
REM Production Build Script for Google Play Store
REM Use Command Prompt (cmd.exe) to avoid PowerShell execution policy issues

echo ========================================
echo Resolute Plan - Production Build
echo ========================================
echo.

echo Current configuration:
echo - Version: 1.0.6
echo - Version Code: 2
echo.

echo Step 1: Setting Android version...
call npx eas-cli build:version --platform android

echo.
echo Step 2: Starting production build...
echo This will take 15-30 minutes...
echo.

call npx eas-cli build --platform android --profile production --clear-cache

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Go to https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
echo 2. Download the .aab file
echo 3. Upload to Google Play Console
echo.
pause
