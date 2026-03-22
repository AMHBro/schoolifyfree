#!/bin/bash

# Run Teacher App on iOS with Railway Backend
echo "🍎 Running Teacher App on iOS with Railway Backend..."
echo "Backend URL: https://sms-backend-production-eedb.up.railway.app"
echo "Note: Localhost development has been disabled. App only works with Railway backend."

# Check if iOS simulator is available
if ! flutter devices | grep -q "iOS"; then
    echo "❌ No iOS simulator found. Please start an iOS simulator first."
    echo "You can start one from Xcode or run: open -a Simulator"
    exit 1
fi

# Run the app on iOS
flutter run -d ios
