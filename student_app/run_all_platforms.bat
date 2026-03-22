@echo off
REM Run Student App on All Supported Platforms
echo 🚀 Student App - Universal Platform Launcher
echo Backend URL: https://sms-backend-production-eedb.up.railway.app
echo Supported Platforms: Android, iOS (iPhone/iPad), macOS
echo.

REM Check available devices
echo 📱 Available devices:
flutter devices

echo.
echo Select platform to run:
echo 1) Android
echo 2) iOS (iPhone/iPad/Simulator)
echo 3) macOS
echo 4) All platforms (if available)
echo.

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo 🤖 Running on Android...
    flutter run -d android
) else if "%choice%"=="2" (
    echo 🍎 Running on iOS...
    flutter devices | findstr "iOS" >nul
    if errorlevel 1 (
        echo ❌ No iOS simulator found. Please start an iOS simulator first.
        echo You can start one from Xcode or run: open -a Simulator
    ) else (
        flutter run -d ios
    )
) else if "%choice%"=="3" (
    echo 💻 Running on macOS...
    flutter run -d macos
) else if "%choice%"=="4" (
    echo 🌐 Running on all available platforms...
    if flutter devices | findstr "android" >nul (
        echo Starting Android...
        start "Android" cmd /c "flutter run -d android"
    )
    if flutter devices | findstr "iOS" >nul (
        echo Starting iOS...
        start "iOS" cmd /c "flutter run -d ios"
    )
    if flutter devices | findstr "macos" >nul (
        echo Starting macOS...
        start "macOS" cmd /c "flutter run -d macos"
    )
) else (
    echo ❌ Invalid choice. Please run the script again.
    pause
    exit /b 1
)
