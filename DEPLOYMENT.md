# SMS Application Deployment Guide

This guide explains how to deploy your SMS application using nginx as a reverse proxy and Bun for the backend.

## Architecture

- **Frontend**: Built with Vite and served by nginx
- **Backend**: Bun with Elysia framework, managed by PM2
- **Reverse Proxy**: nginx routes requests and serves static files
- **External Access**: Available on your local network IP

## Prerequisites

1. **Bun** - Runtime for the backend
2. **Node.js & npm** - For PM2 process management
3. **nginx** - Web server and reverse proxy
4. **PM2** - Process manager for Node.js/Bun applications

```bash
# Install dependencies (already done)
brew install nginx
npm install -g pm2
```

## Deployment Steps

### 1. Build the Frontend

```bash
bun run build
```

This creates a `dist/` directory with optimized static files.

### 2. Start Production Servers

#### Option A: Using PM2 (Recommended)

```bash
./start-production-pm2.sh
```

#### Option B: Simple Background Process

```bash
./start-production.sh
```

### 3. Access Your Application

- **Local Access**: http://localhost
- **External Access**: http://192.168.3.84 (your friend can use this)
- **API Endpoint**: http://localhost/api
- **Health Check**: http://localhost/hello

## Configuration Details

### nginx Configuration

The `nginx.conf` file configures:

- **Port 80**: Main web server port
- **Static Files**: Serves frontend from `/dist` directory
- **API Proxy**: Routes `/api/*` requests to backend on port 3000
- **CORS Headers**: Enables cross-origin requests
- **Compression**: Gzip compression for better performance
- **Caching**: Static asset caching with long expiration

### PM2 Configuration

The `ecosystem.config.js` file configures:

- **Process Name**: `sms-backend`
- **Runtime**: Bun
- **Auto-restart**: Enabled
- **Memory Limit**: 1GB
- **Logging**: Separate error, output, and combined logs

## Managing the Deployment

### Backend Process Management

```bash
# View all PM2 processes
pm2 list

# View backend logs
pm2 logs sms-backend

# Restart backend
pm2 restart sms-backend

# Stop backend
pm2 stop sms-backend

# Delete backend process
pm2 delete sms-backend
```

### nginx Management

```bash
# Test nginx configuration
sudo nginx -t -c $(pwd)/nginx.conf

# Start nginx
sudo nginx -c $(pwd)/nginx.conf

# Reload nginx (after config changes)
sudo nginx -s reload

# Stop nginx
sudo nginx -s quit
```

## Network Configuration

### Making Your App Accessible to Friends

1. **Find Your IP Address**:

   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

   Current IP: `192.168.3.84`

2. **Firewall Settings**:

   - Ensure port 80 is open on your firewall
   - On macOS, go to System Preferences > Security & Privacy > Firewall

3. **Router Configuration** (if needed):
   - Some routers block inter-device communication
   - Check router settings for "AP Isolation" and disable if enabled

### Share with Friends

Give your friends this URL: **http://192.168.3.84**

## Development vs Production

### Development Mode

- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:3000 (Direct access)
- API calls: http://localhost:3000/api

### Production Mode

- Frontend: http://localhost (nginx)
- Backend: Internal on port 3000 (managed by PM2)
- API calls: http://localhost/api (proxied through nginx)

## Troubleshooting

### Common Issues

1. **Port 80 Access Denied**:

   ```bash
   sudo ./start-production-pm2.sh
   ```

2. **Backend Not Starting**:

   ```bash
   cd backend
   bun run dev  # Test in development mode
   ```

3. **nginx Configuration Errors**:

   ```bash
   sudo nginx -t -c $(pwd)/nginx.conf
   ```

4. **Permission Issues**:
   ```bash
   chmod +x start-production-pm2.sh
   sudo chown -R $(whoami) logs/
   ```

### Logs Location

- **nginx**: `/opt/homebrew/var/log/nginx/`
- **Backend**: `./logs/` (in project directory)
- **PM2**: `~/.pm2/logs/`

## Security Considerations

1. **Network Access**: Only devices on your local network can access the app
2. **Firewall**: Consider enabling firewall on your laptop
3. **HTTPS**: For production use, consider setting up SSL certificates
4. **API Security**: Backend includes CORS headers for web browser security

## Performance Tips

1. **Gzip Compression**: Enabled for all text-based content
2. **Static Asset Caching**: Long-term caching for JS/CSS/images
3. **Keep-Alive**: HTTP persistent connections enabled
4. **PM2 Memory Management**: Automatic restart on memory limit

## Stopping the Deployment

Press `Ctrl+C` in the terminal running the production script, or:

```bash
# Stop PM2 processes
pm2 stop ecosystem.config.js
pm2 delete ecosystem.config.js

# Stop nginx
sudo nginx -s quit
```
