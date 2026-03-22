#!/bin/bash

echo "🚀 Starting SMS App with ngrok (External Access)"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if servers are running
check_backend() {
    if curl -s http://localhost:3000/hello > /dev/null; then
        echo -e "${GREEN}✅ Backend is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend is not running. Please start it first:${NC}"
        echo "cd backend && bun run start"
        return 1
    fi
}

check_nginx() {
    if curl -s http://localhost/ > /dev/null; then
        echo -e "${GREEN}✅ Nginx is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Nginx is not running. Please start it first:${NC}"
        echo "sudo /opt/homebrew/bin/nginx -c $(pwd)/nginx.conf"
        return 1
    fi
}

# Check if servers are running
echo -e "${BLUE}🔍 Checking servers...${NC}"
if ! check_backend || ! check_nginx; then
    echo ""
    echo -e "${YELLOW}💡 Quick start your servers:${NC}"
    echo "./start-production.sh"
    exit 1
fi

echo ""
echo -e "${BLUE}🌐 Starting ngrok tunnel...${NC}"
echo "This will create a public URL for your friend to access"
echo ""

# Start ngrok in the background and capture output
ngrok http 80 --log=stdout > ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start
sleep 5

# Get the public URL
echo -e "${YELLOW}⏳ Getting public URL...${NC}"
PUBLIC_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok-free\.app' | head -1)

if [ ! -z "$PUBLIC_URL" ]; then
    echo ""
    echo -e "${GREEN}🎉 Success! Your app is now accessible worldwide!${NC}"
    echo -e "${GREEN}=================================================${NC}"
    echo -e "Local Access: ${BLUE}http://localhost${NC}"
    echo -e "Network Access: ${BLUE}http://192.168.3.84${NC}"
    echo -e "Public Access: ${BLUE}$PUBLIC_URL${NC}"
    echo ""
    echo -e "${YELLOW}📱 Share this URL with your friend: ${GREEN}$PUBLIC_URL${NC}"
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
    echo -e "${RED}❌ Failed to get ngrok URL. Check ngrok.log for details${NC}"
    kill $NGROK_PID 2>/dev/null
    exit 1
fi

# Cleanup
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping ngrok...${NC}"
    kill $NGROK_PID 2>/dev/null
    echo -e "${GREEN}✅ ngrok stopped${NC}"
    exit 0
}

trap cleanup INT TERM 