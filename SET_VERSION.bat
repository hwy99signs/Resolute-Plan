@echo off
REM Set Android Version for Google Play Store
REM Run this in Command Prompt (cmd.exe)

echo ========================================
echo Setting Android Version
echo ========================================
echo.
echo This will set:
echo - Version name: 1.0.6
echo - Version code: 2
echo.

npx eas-cli build:version:set --platform android

echo.
echo ========================================
echo Version set complete!
echo ========================================
echo.
echo Next step: Run the production build
echo Command: npx eas-cli build --platform android --profile production --clear-cache
echo.
pause
