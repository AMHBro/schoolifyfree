#!/bin/bash

echo "🔍 Testing actual API responses..."
echo ""

# Test 1: Check if backend is running
echo "1️⃣ Testing if backend is running on port 3000..."
if curl -s http://localhost:3000/hello > /dev/null 2>&1; then
    echo "   ✅ Backend is running on port 3000"
else
    echo "   ❌ Backend is NOT running on port 3000"
    echo "   Please start it with: cd backend && bun run index.ts"
    exit 1
fi
echo ""

# Test 2: Try to get school profile (will fail without token, but shows endpoint exists)
echo "2️⃣ Testing /school/profile endpoint..."
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" http://localhost:3000/school/profile)
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

echo "   HTTP Status: $HTTP_STATUS"
if [ "$HTTP_STATUS" = "401" ]; then
    echo "   ✅ Endpoint exists (401 means needs authentication - expected)"
elif [ "$HTTP_STATUS" = "404" ]; then
    echo "   ❌ Endpoint NOT FOUND - backend might not have the new code"
else
    echo "   Response: $BODY"
fi
echo ""

# Test 3: Check which processes are using port 3000
echo "3️⃣ Checking what's running on port 3000..."
lsof -ti:3000 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    PID=$(lsof -ti:3000)
    PROCESS=$(ps -p $PID -o comm=)
    echo "   Process: $PROCESS (PID: $PID)"
    echo "   ⚠️  If this is an old process, kill it and restart:"
    echo "   kill $PID && cd backend && bun run index.ts"
else
    echo "   ❌ No process on port 3000"
fi
echo ""

echo "="
echo "Next steps:"
echo "1. If backend is not running or old: Restart it"
echo "2. If backend is running with new code: Check the school dashboard token"
echo "="

