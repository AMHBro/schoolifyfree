#!/bin/bash

# Run Teacher App with Production Backend
echo "🚀 Running Teacher App with Production Backend..."
echo "Backend URL: https://sms-backend-production-eedb.up.railway.app"

flutter run --dart-define=API_BASE_URL=https://sms-backend-production-eedb.up.railway.app 