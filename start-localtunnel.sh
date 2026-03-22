#!/bin/bash

echo "🚀 Starting Backend API with LocalTunnel (ngrok alternative)"
echo "==========================================================="

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

# Function to wait for LocalTunnel URL
wait_for_url() {
    local log_file=$1
    local max_attempts=15
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if [ -f "$log_file" ]; then
            # Look for the URL pattern in LocalTunnel output
            PUBLIC_URL=$(grep -o 'https://[^[:space:]]*\.loca\.lt' "$log_file" 2>/dev/null | head -1)
            if [ ! -z "$PUBLIC_URL" ]; then
                echo "$PUBLIC_URL"
                return 0
            fi
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    return 1
}

# Check backend
echo -e "${BLUE}🔍 Checking backend API...${NC}"
if ! check_backend; then
    exit 1
fi

echo ""
echo -e "${BLUE}🌐 Starting LocalTunnel for backend API...${NC}"
echo "This will expose your backend API publicly (ngrok alternative)"
echo ""

# Clean up any existing LocalTunnel processes
pkill -f localtunnel 2>/dev/null
sleep 1

# Clean up old log files
rm -f lt_output.log lt_output2.log test_lt.log 2>/dev/null

# Generate a unique subdomain for your tunnel
SUBDOMAIN="sms-backend-$(date +%s)"

echo -e "${YELLOW}⏳ Starting LocalTunnel...${NC}"
echo -e "${BLUE}Subdomain: ${SUBDOMAIN}${NC}"

# Start localtunnel with custom subdomain
npx localtunnel --port 3000 --subdomain "$SUBDOMAIN" > lt_output.log 2>&1 &
LT_PID=$!

# Wait for localtunnel to start and get URL
PUBLIC_URL=$(wait_for_url "lt_output.log")

if [ ! -z "$PUBLIC_URL" ]; then
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
    echo -e "${YELLOW}⚠️  Note: This URL is available for this session only${NC}"
    echo -e "${YELLOW}🔧 LocalTunnel is a free alternative to ngrok${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop LocalTunnel${NC}"
    
    # Keep running and monitor
    while true; do
        if ! kill -0 $LT_PID 2>/dev/null; then
            echo -e "${RED}❌ LocalTunnel stopped unexpectedly${NC}"
            break
        fi
        sleep 30
    done
else
    echo -e "${RED}❌ Failed to start LocalTunnel with custom subdomain${NC}"
    echo -e "${YELLOW}💡 Trying alternative method...${NC}"
    
    # Kill the failed process
    kill $LT_PID 2>/dev/null
    pkill -f localtunnel 2>/dev/null
    sleep 2
    
    echo -e "${YELLOW}⏳ Starting LocalTunnel without custom subdomain...${NC}"
    npx localtunnel --port 3000 > lt_output2.log 2>&1 &
    LT_PID=$!
    
    # Wait for localtunnel to start and get URL
    PUBLIC_URL=$(wait_for_url "lt_output2.log")
    
    if [ ! -z "$PUBLIC_URL" ]; then
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
        echo -e "${YELLOW}Press Ctrl+C to stop LocalTunnel${NC}"
        
        # Keep running and monitor
        while true; do
            if ! kill -0 $LT_PID 2>/dev/null; then
                echo -e "${RED}❌ LocalTunnel stopped unexpectedly${NC}"
                break
            fi
            sleep 30
        done
    else
        echo -e "${RED}❌ Failed to start LocalTunnel${NC}"
        echo -e "${YELLOW}Debug information:${NC}"
        echo "Contents of lt_output.log:"
        cat lt_output.log 2>/dev/null || echo "No lt_output.log found"
        echo "Contents of lt_output2.log:"
        cat lt_output2.log 2>/dev/null || echo "No lt_output2.log found"
        
        # Try one more time with basic settings
        echo -e "${YELLOW}⏳ Final attempt with basic LocalTunnel...${NC}"
        kill $LT_PID 2>/dev/null
        pkill -f localtunnel 2>/dev/null
        sleep 2
        
        npx localtunnel --port 3000 --print-requests > lt_output3.log 2>&1 &
        LT_PID=$!
        
        PUBLIC_URL=$(wait_for_url "lt_output3.log")
        
        if [ ! -z "$PUBLIC_URL" ]; then
            echo ""
            echo -e "${GREEN}🎉 Success! Your backend API is now accessible worldwide!${NC}"
            echo -e "${GREEN}==========================================================${NC}"
            echo -e "Local API: ${BLUE}http://localhost:3000${NC}"
            echo -e "Public API: ${BLUE}$PUBLIC_URL${NC}"
            echo ""
            echo -e "${YELLOW}📱 Share this URL with your friend: ${GREEN}$PUBLIC_URL${NC}"
            echo ""
            echo -e "${YELLOW}Press Ctrl+C to stop LocalTunnel${NC}"
            
            # Keep running and monitor
            while true; do
                if ! kill -0 $LT_PID 2>/dev/null; then
                    echo -e "${RED}❌ LocalTunnel stopped unexpectedly${NC}"
                    break
                fi
                sleep 30
            done
        else
            echo -e "${RED}❌ All LocalTunnel attempts failed${NC}"
            echo -e "${YELLOW}Final debug information:${NC}"
            cat lt_output3.log 2>/dev/null || echo "No lt_output3.log found"
            
            kill $LT_PID 2>/dev/null
            exit 1
        fi
    fi
fi

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping LocalTunnel...${NC}"
    kill $LT_PID 2>/dev/null
    pkill -f localtunnel 2>/dev/null
    echo -e "${GREEN}✅ LocalTunnel stopped${NC}"
    exit 0
}

trap cleanup INT TERM 