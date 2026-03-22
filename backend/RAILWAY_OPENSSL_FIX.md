# Railway OpenSSL 3.0.x Fix

## Problem

Railway deployment was failing with:
```
PrismaClientInitializationError: Unable to require('/app/node_modules/.prisma/client/libquery_engine-debian-openssl-3.0.x.so.node')
Prisma cannot find the required 'libssl' system library in your system. Please install openssl-3.0.x and try again.
Details: libssl.so.3: cannot open shared object file: No such file or directory
```

## Root Cause

The Dockerfile was using `oven/bun:1.2-alpine`, which includes OpenSSL 1.x. However, Prisma's query engine requires OpenSSL 3.0.x (`libssl.so.3`).

## Solution

### 1. Updated Dockerfile
Switched from Alpine to Debian-based Bun image:
- Changed from `oven/bun:1.2-alpine` to `oven/bun:1.2-debian`
- Debian-based images include OpenSSL 3.0.x by default
- Added proper OpenSSL installation and cleanup
- **Removed build-time Prisma generation** - Prisma client is generated at runtime via the start script
  - This avoids build failures when DATABASE_URL might not be available
  - Ensures Prisma client is always fresh when the container starts

### 2. Updated nixpacks.toml
If Railway uses Nixpacks instead of Dockerfile:
- Changed `openssl` to `openssl_3` in nixPkgs
- This ensures OpenSSL 3.0.x is installed

## Verification

After deployment, verify OpenSSL version:

```bash
# Inside the Railway container
openssl version
# Should show: OpenSSL 3.x.x

# Verify libssl.so.3 exists
ldconfig -p | grep libssl
# Should show: libssl.so.3

# Check Prisma can find it
ls -la /app/node_modules/.prisma/client/libquery_engine-*
# Should show the Debian OpenSSL 3.0.x binary
```

## Next Steps

1. **Commit and push changes:**
   ```bash
   git add backend/Dockerfile backend/nixpacks.toml
   git commit -m "Fix OpenSSL 3.0.x dependency for Railway deployment"
   git push
   ```

2. **Redeploy on Railway:**
   - Railway will automatically rebuild with the new Dockerfile
   - Monitor the deployment logs to ensure Prisma initializes correctly

3. **Verify the fix:**
   - Check Railway logs for successful Prisma client initialization
   - Test your API endpoints

## Alternative Solutions (if Debian doesn't work)

If you need to stick with Alpine, you can install OpenSSL 3 manually:

```dockerfile
FROM oven/bun:1.2-alpine

# Install OpenSSL 3 from edge/testing repository
RUN apk add --no-cache \
    openssl3 \
    || (echo "http://dl-cdn.alpinelinux.org/alpine/edge/testing" >> /etc/apk/repositories && \
        apk add --no-cache openssl3)

# Rest of Dockerfile...
```

However, Debian-based approach is recommended as it's more stable and better supported.

