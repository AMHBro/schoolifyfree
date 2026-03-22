# Railway Dockerfile Path Fix

## Problem

Railway build failing with:
```
Build Failed: bc.Build: failed to solve: failed to read dockerfile: open /backend/Dockerfile: no such file or directory
```

## Root Cause

The Railway UI settings have a mismatch:
- **Root Directory**: `/backend` (Railway uses `backend/` as the build context)
- **Dockerfile Path**: `/backend/Dockerfile` ❌ (This looks for `backend/backend/Dockerfile`)

Since the Root Directory is already set to `/backend`, the Dockerfile Path should be relative to that directory.

## Solution

### Option 1: Fix Railway UI Settings (Recommended)

1. Go to your Railway project settings
2. Navigate to **Build** section
3. Under **Dockerfile Path**, change from `/backend/Dockerfile` to `Dockerfile`
4. Keep **Root Directory** as `/backend`
5. Save changes

### Option 2: Use Repository Root

If you prefer to use the repository root:

1. Change **Root Directory** from `/backend` to `/` (or leave empty)
2. Change **Dockerfile Path** from `/backend/Dockerfile` to `backend/Dockerfile`
3. Save changes

### Option 3: Use railway.toml (Already Fixed)

The `railway.toml` file has been updated with:
```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"  # ✅ Fixed - relative to dockerContext
dockerContext = "backend"
```

However, if Railway UI settings override the config file, you'll still need to fix the UI settings.

## Verification

After fixing:
1. Trigger a new deployment
2. Check build logs - should see:
   - `Step 1/10 : FROM oven/bun:1.2-debian`
   - Build should complete successfully

## Why This Happens

Railway interprets paths relative to the build context:
- Build Context: `backend/` (set by Root Directory)
- Dockerfile Path: `/backend/Dockerfile` → looks for `backend/backend/Dockerfile` ❌
- Dockerfile Path: `Dockerfile` → looks for `backend/Dockerfile` ✅

