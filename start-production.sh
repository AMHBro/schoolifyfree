#!/bin/bash

echo "🚀 Starting SMS Production Server"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to stop existing servers
stop_servers() {
    echo -e "${YELLOW}🛑 Stopping existing servers...${NC}"
    
    # Stop nginx if running
    if pgrep nginx > /dev/null; then
        echo "Stopping nginx..."
        sudo /opt/homebrew/bin/nginx -s quit 2>/dev/null || true
    fi
    
    # Stop any process on port 3000 (backend)
    if check_port 3000; then
        echo "Stopping process on port 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Stop any process on port 80 (nginx)
    if check_port 80; then
        echo "Stopping process on port 80..."
        sudo lsof -ti:80 | xargs sudo kill -9 2>/dev/null || true
    fi
    
    sleep 2
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}📦 Starting Backend Server (Port 3000)...${NC}"
    cd backend
    
    # Start backend in background
    bun run start &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"
    
    # Wait for backend to start
    echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
    sleep 3
    
    # Test backend
    echo -e "${BLUE}🔍 Testing backend connectivity...${NC}"
    if curl -s http://localhost:3000/hello > /dev/null; then
        echo -e "${GREEN}✅ Backend is running successfully!${NC}"
        cd ..
        return 0
    else
        echo -e "${RED}❌ Backend failed to start or is not accessible${NC}"
        cd ..
        return 1
    fi
}

# Function to start nginx
start_nginx() {
    echo -e "${BLUE}🌐 Starting Nginx Server (Port 80)...${NC}"
    
    # Test nginx configuration
    echo "Testing nginx configuration..."
    sudo /opt/homebrew/bin/nginx -t -c $(pwd)/nginx.conf
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
        
        # Start nginx
        sudo /opt/homebrew/bin/nginx -c $(pwd)/nginx.conf
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Nginx started successfully!${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed to start nginx${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Nginx configuration is invalid${NC}"
        return 1
    fi
}

# Function to display server info
show_server_info() {
    echo ""
    echo -e "${GREEN}🎉 Production servers are running!${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo -e "Frontend: ${BLUE}http://localhost${NC}"
    echo -e "Frontend (External): ${BLUE}http://192.168.3.84${NC}"
    echo -e "Backend API: ${BLUE}http://localhost/api${NC}"
    echo -e "Backend Health: ${BLUE}http://localhost/hello${NC}"
    echo ""
    echo -e "${YELLOW}📱 Your friend can access the app at: ${BLUE}http://192.168.3.84${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    
    # Stop nginx
    sudo /opt/homebrew/bin/nginx -s quit 2>/dev/null || true
    
    # Stop backend
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    # Kill any remaining processes
    pkill -f "bun.*index.ts" 2>/dev/null || true
    
    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Main execution
echo -e "${YELLOW}🔄 Preparing production environment...${NC}"

# Stop any existing servers
stop_servers

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo -e "${RED}❌ Backend directory not found!${NC}"
    exit 1
fi

# Check if dist directory exists
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Dist directory not found! Please run 'bun run build' first.${NC}"
    exit 1
fi

# Start backend
if ! start_backend; then
    echo -e "${RED}❌ Failed to start backend. Exiting.${NC}"
    exit 1
fi

# Start nginx
if ! start_nginx; then
    echo -e "${RED}❌ Failed to start nginx. Stopping backend.${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Show server information
show_server_info

# Keep script running
while true; do
    sleep 1
done 