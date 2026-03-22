#!/bin/bash

echo "🚀 Starting SMS Development Environment"
echo "======================================"

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

# Start backend
echo "📦 Starting Backend Server (Port 3000)..."
cd backend
bun run dev &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Test backend
echo "🔍 Testing backend connectivity..."
if curl -s http://localhost:3000/hello > /dev/null; then
    echo "✅ Backend is running successfully!"
else
    echo "❌ Backend failed to start or is not accessible"
fi

# Start frontend
echo "🎨 Starting Frontend Server (Port 5173)..."
cd ..
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "🎉 Both servers are starting!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
echo "Settings: http://localhost:5173/settings"
echo ""
echo "Press Ctrl+C to stop both servers"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

trap cleanup INT TERM

# Wait for any process to exit
wait 