@echo off
echo ========================================
echo Resolute Plan - Google Play Build
echo ========================================
echo.

echo Step 1: Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install from: https://nodejs.org/
    pause
    exit /b 1
)
echo Node.js OK!
echo.

echo Step 2: Checking npm installation...
npm --version
if %errorlevel% neq 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)
echo npm OK!
echo.

echo Step 3: Navigating to project directory...
cd /d "%~dp0"
echo Current directory: %cd%
echo.

echo Step 4: Checking if logged in to Expo...
npx eas-cli whoami
if %errorlevel% neq 0 (
    echo.
    echo You are not logged in to Expo.
    echo Please login with your credentials...
    echo.
    npx eas-cli login
    if %errorlevel% neq 0 (
        echo ERROR: Login failed!
        pause
        exit /b 1
    )
)
echo Logged in successfully!
echo.

echo ========================================
echo Starting Build for Google Play Store
echo ========================================
echo.
echo This will take 10-20 minutes...
echo You can close this window and check progress at:
echo https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds
echo.

npx eas-cli build --platform android --profile production

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo BUILD FAILED!
    echo ========================================
    echo.
    echo Check the error messages above.
    echo You can also view logs at: https://expo.dev
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo BUILD SUCCESS!
echo ========================================
echo.
echo Next steps:
echo 1. Download the .aab file from the link above
echo 2. Go to Google Play Console: https://play.google.com/console
echo 3. Upload the .aab file to Production
echo 4. Add release notes from RELEASE_NOTES_v1.0.5.txt
echo 5. Review and publish!
echo.
pause

