@echo off
REM Run Student App on iOS (iPhone, iPad, Simulator)
echo 🍎 Running Student App on iOS...
echo Backend URL: https://sms-backend-production-eedb.up.railway.app
echo Supported: iPhone, iPad, iOS Simulator
echo Note: Localhost development has been disabled. App only works with Railway backend.

REM Check if iOS simulator is available
flutter devices | findstr "iOS" >nul
if errorlevel 1 (
    echo ❌ No iOS simulator found. Please start an iOS simulator first.
    echo You can start one from Xcode or run: open -a Simulator
    pause
    exit /b 1
)

REM Run the app on iOS
flutter run -d ios
