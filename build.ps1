# Resolute Plan - Google Play Build Script
# PowerShell version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Resolute Plan - Google Play Build" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check Node.js
Write-Host "Step 1: Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js OK! Version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please download and install from: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 2: Check npm
Write-Host "Step 2: Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm OK! Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ ERROR: npm is not installed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host ""

# Step 3: Navigate to project
Write-Host "Step 3: Navigating to project directory..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath
Write-Host "✓ Current directory: $scriptPath" -ForegroundColor Green
Write-Host ""

# Step 4: Check Expo login
Write-Host "Step 4: Checking if logged in to Expo..." -ForegroundColor Yellow
$loginCheck = npx eas-cli whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "You are not logged in to Expo." -ForegroundColor Yellow
    Write-Host "Please login with your credentials..." -ForegroundColor Yellow
    Write-Host ""
    npx eas-cli login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ ERROR: Login failed!" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}
Write-Host "✓ Logged in successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Start build
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Build for Google Play Store" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This will take 10-20 minutes..." -ForegroundColor Yellow
Write-Host "You can check progress at:" -ForegroundColor Yellow
Write-Host "https://expo.dev/accounts/resolute-plan/projects/resolute-plan/builds" -ForegroundColor Blue
Write-Host ""

npx eas-cli build --platform android --profile production

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BUILD FAILED!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check the error messages above." -ForegroundColor Yellow
    Write-Host "You can also view logs at: https://expo.dev" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Success
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "BUILD SUCCESS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Download the .aab file from the link above" -ForegroundColor White
Write-Host "2. Go to Google Play Console: https://play.google.com/console" -ForegroundColor White
Write-Host "3. Upload the .aab file to Production" -ForegroundColor White
Write-Host "4. Add release notes from RELEASE_NOTES_v1.0.5.txt" -ForegroundColor White
Write-Host "5. Review and publish!" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"

