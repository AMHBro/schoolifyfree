#!/bin/bash

echo "🚀 Starting Backend API with ngrok"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if backend is running
check_backend() {
    if curl -s http://localhost:3000/hello > /dev/null; then
        echo -e "${GREEN}✅ Backend API is running on port 3000${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend is not running on port 3000${NC}"
        echo -e "${YELLOW}💡 Start your backend first:${NC}"
        echo "cd backend && bun run start"
        return 1
    fi
}

# Check backend
echo -e "${BLUE}🔍 Checking backend API...${NC}"
if ! check_backend; then
    exit 1
fi

echo ""
echo -e "${BLUE}🌐 Starting ngrok tunnel for backend API...${NC}"
echo "This will expose your backend API publicly"
echo ""

# Start ngrok for backend API (port 3000)
echo -e "${YELLOW}⏳ Starting ngrok...${NC}"
ngrok http 3000 --log=stdout > ngrok_backend.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get the public URL
echo -e "${YELLOW}⏳ Getting public URL...${NC}"
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url' 2>/dev/null)

# Fallback if jq is not available
if [ "$PUBLIC_URL" = "null" ] || [ -z "$PUBLIC_URL" ]; then
    PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)
fi

if [ ! -z "$PUBLIC_URL" ] && [ "$PUBLIC_URL" != "null" ]; then
    echo ""
    echo -e "${GREEN}🎉 Success! Your backend API is now accessible worldwide!${NC}"
    echo -e "${GREEN}==========================================================${NC}"
    echo -e "Local API: ${BLUE}http://localhost:3000${NC}"
    echo -e "Public API: ${BLUE}$PUBLIC_URL${NC}"
    echo ""
    echo -e "${YELLOW}📱 Share this URL with your friend: ${GREEN}$PUBLIC_URL${NC}"
    echo ""
    echo -e "${YELLOW}🔗 Available endpoints:${NC}"
    echo -e "  • Health check: ${BLUE}$PUBLIC_URL/hello${NC}"
    echo -e "  • API routes: ${BLUE}$PUBLIC_URL/api/*${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Note: Free ngrok URLs change every time you restart${NC}"
    echo -e "${YELLOW}🔧 Web Interface: ${BLUE}http://localhost:4040${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop ngrok${NC}"
    
    # Keep running and monitor
    while true; do
        if ! kill -0 $NGROK_PID 2>/dev/null; then
            echo -e "${RED}❌ ngrok stopped unexpectedly${NC}"
            break
        fi
        sleep 30
    done
else
    echo -e "${RED}❌ Failed to get ngrok URL. Check ngrok_backend.log for details${NC}"
    echo -e "${YELLOW}💡 Make sure you've added your ngrok auth token:${NC}"
    echo "ngrok authtoken YOUR_TOKEN"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping ngrok...${NC}"
    kill $NGROK_PID 2>/dev/null
    echo -e "${GREEN}✅ ngrok stopped${NC}"
    exit 0
}

trap cleanup INT TERM 