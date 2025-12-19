# Java JDK Setup Script for Windows
# Run this script in PowerShell as Administrator after installing JDK 17+

Write-Host "Java JDK Setup Script" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green
Write-Host ""

# Check if Java is already installed
$javaVersion = & java -version 2>&1 | Select-Object -First 1
if ($javaVersion -match "version") {
    Write-Host "Java is already installed:" -ForegroundColor Yellow
    Write-Host $javaVersion
    Write-Host ""
}

# Common JDK installation paths
$possiblePaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Java\jdk-19*",
    "C:\Program Files\Java\jdk-21*",
    "C:\Program Files\Microsoft\jdk-17*"
)

Write-Host "Searching for JDK installations..." -ForegroundColor Cyan
$foundJdk = $null

foreach ($path in $possiblePaths) {
    $jdkPath = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($jdkPath) {
        $foundJdk = $jdkPath.FullName
        Write-Host "Found JDK at: $foundJdk" -ForegroundColor Green
        break
    }
}

if (-not $foundJdk) {
    Write-Host ""
    Write-Host "JDK not found in common locations." -ForegroundColor Red
    Write-Host "Please install JDK 17 or higher from:" -ForegroundColor Yellow
    Write-Host "  - https://adoptium.net/ (Recommended: Temurin 17 LTS)" -ForegroundColor Cyan
    Write-Host "  - https://www.oracle.com/java/technologies/downloads/#java17" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "After installation, you can:" -ForegroundColor Yellow
    Write-Host "  1. Set JAVA_HOME environment variable manually" -ForegroundColor White
    Write-Host "  2. Add %JAVA_HOME%\bin to your PATH" -ForegroundColor White
    Write-Host "  3. Restart your terminal/IDE" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "To set JAVA_HOME manually:" -ForegroundColor Yellow
Write-Host "  1. Open System Properties > Environment Variables" -ForegroundColor White
Write-Host "  2. Add new System Variable:" -ForegroundColor White
Write-Host "     Name: JAVA_HOME" -ForegroundColor Cyan
Write-Host "     Value: $foundJdk" -ForegroundColor Cyan
Write-Host "  3. Edit Path variable and add: %JAVA_HOME%\bin" -ForegroundColor White
Write-Host "  4. Restart your terminal/IDE" -ForegroundColor White
Write-Host ""
Write-Host "For Cursor/VS Code Java Language Server:" -ForegroundColor Yellow
Write-Host "  Add to settings.json:" -ForegroundColor White
Write-Host "    `"java.jdt.ls.java.home`": `"$foundJdk`"" -ForegroundColor Cyan
Write-Host ""
