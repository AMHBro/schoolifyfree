#!/bin/bash

echo "🚀 Starting SMS Production Server with PM2"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p logs

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
    
    # Stop PM2 processes
    pm2 stop ecosystem.config.cjs 2>/dev/null || true
    pm2 delete ecosystem.config.cjs 2>/dev/null || true
    
    # Stop nginx if running
    if pgrep nginx > /dev/null; then
        echo "Stopping nginx..."
        sudo /opt/homebrew/bin/nginx -s quit 2>/dev/null || true
        sleep 2
    fi
    
    # Stop any remaining process on port 3000
    if check_port 3000; then
        echo "Stopping remaining processes on port 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    fi
    
    # Stop any process on port 80
    if check_port 80; then
        echo "Stopping processes on port 80..."
        sudo lsof -ti:80 | xargs sudo kill -9 2>/dev/null || true
    fi
    
    sleep 2
}

# Function to start backend with PM2
start_backend() {
    echo -e "${BLUE}📦 Starting Backend with PM2...${NC}"
    
    # Start backend using PM2
    pm2 start ecosystem.config.cjs
    
    if [ $? -eq 0 ]; then
        echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
        sleep 5
        
        # Test backend
        echo -e "${BLUE}🔍 Testing backend connectivity...${NC}"
        if curl -s http://localhost:3000/hello > /dev/null; then
            echo -e "${GREEN}✅ Backend is running successfully with PM2!${NC}"
            return 0
        else
            echo -e "${RED}❌ Backend failed to start or is not accessible${NC}"
            pm2 logs sms-backend --lines 10
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to start backend with PM2${NC}"
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
    local_ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    
    echo ""
    echo -e "${GREEN}🎉 Production servers are running!${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo -e "Frontend: ${BLUE}http://localhost${NC}"
    echo -e "Frontend (External): ${BLUE}http://${local_ip}${NC}"
    echo -e "Backend API: ${BLUE}http://localhost/api${NC}"
    echo -e "Backend Health: ${BLUE}http://localhost/hello${NC}"
    echo ""
    echo -e "${YELLOW}📱 Your friend can access the app at: ${BLUE}http://${local_ip}${NC}"
    echo -e "${YELLOW}🔧 To view PM2 processes: ${BLUE}pm2 list${NC}"
    echo -e "${YELLOW}📋 To view backend logs: ${BLUE}pm2 logs sms-backend${NC}"
    echo -e "${YELLOW}🔄 To restart backend: ${BLUE}pm2 restart sms-backend${NC}"
    echo ""
    echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Shutting down servers...${NC}"
    
    # Stop nginx
    sudo /opt/homebrew/bin/nginx -s quit 2>/dev/null || true
    
    # Stop PM2 processes
    pm2 stop ecosystem.config.cjs 2>/dev/null || true
    pm2 delete ecosystem.config.cjs 2>/dev/null || true
    
    echo -e "${GREEN}✅ All servers stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Main execution
echo -e "${YELLOW}🔄 Preparing production environment...${NC}"

# Check dependencies
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed. Please run: npm install -g pm2${NC}"
    exit 1
fi

if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx is not installed. Please run: brew install nginx${NC}"
    exit 1
fi

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

# Start backend with PM2
if ! start_backend; then
    echo -e "${RED}❌ Failed to start backend. Exiting.${NC}"
    exit 1
fi

# Start nginx
if ! start_nginx; then
    echo -e "${RED}❌ Failed to start nginx. Stopping backend.${NC}"
    pm2 stop ecosystem.config.cjs 2>/dev/null || true
    pm2 delete ecosystem.config.cjs 2>/dev/null || true
    exit 1
fi

# Show server information
show_server_info

# Keep script running and show real-time status
echo -e "${BLUE}📊 Real-time status (Press Ctrl+C to stop):${NC}"
while true; do
    sleep 30
    # Check if services are still running
    if ! pm2 list | grep -q "sms-backend.*online"; then
        echo -e "${RED}⚠️  Backend process stopped unexpectedly!${NC}"
        break
    fi
    
    if ! pgrep nginx > /dev/null; then
        echo -e "${RED}⚠️  Nginx stopped unexpectedly!${NC}"
        break
    fi
    
    echo -e "${GREEN}✅ All services running $(date)${NC}"
done 