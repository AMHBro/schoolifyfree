#!/bin/bash

# Run Student App on All Supported Platforms
echo "🚀 Student App - Universal Platform Launcher"
echo "Backend URL: https://sms-backend-production-eedb.up.railway.app"
echo "Supported Platforms: Android, iOS (iPhone/iPad), macOS"
echo ""

# Check available devices
echo "📱 Available devices:"
flutter devices

echo ""
echo "Select platform to run:"
echo "1) Android"
echo "2) iOS (iPhone/iPad/Simulator)"
echo "3) macOS"
echo "4) All platforms (if available)"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🤖 Running on Android..."
        flutter run -d android
        ;;
    2)
        echo "🍎 Running on iOS..."
        if flutter devices | grep -q "iOS"; then
            flutter run -d ios
        else
            echo "❌ No iOS simulator found. Please start an iOS simulator first."
            echo "You can start one from Xcode or run: open -a Simulator"
        fi
        ;;
    3)
        echo "💻 Running on macOS..."
        flutter run -d macos
        ;;
    4)
        echo "🌐 Running on all available platforms..."
        if flutter devices | grep -q "android"; then
            echo "Starting Android..."
            flutter run -d android &
        fi
        if flutter devices | grep -q "iOS"; then
            echo "Starting iOS..."
            flutter run -d ios &
        fi
        if flutter devices | grep -q "macos"; then
            echo "Starting macOS..."
            flutter run -d macos &
        fi
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac
