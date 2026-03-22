# Debug Company Access Issue - Step by Step

## Current Status
✅ Backend restarted with new code (includes access code generation fix)  
✅ Database shows: aliameer school is ACTIVATED with access code `CpPwxWHs*kw7`  
✅ Frontend updated with debug logging  
❌ School dashboard UI still shows "Not Activated"

## Step-by-Step Debugging

### Step 1: Verify Backend is Running
```bash
curl http://localhost:3000/hello
```
Expected: `{"message":"Hello from Elysia!","timestamp":"..."}`

✅ If you see this, backend is running correctly.

---

### Step 2: Check School Dashboard Frontend

1. **Go to**: http://localhost:3002/settings
2. **Open DevTools**: Press `F12` or `Cmd+Option+I` (Mac)
3. **Go to Console tab**
4. **Look for these logs** when the page loads:

```
🔍 Fetching school profile from: http://localhost:3000/school/profile
✅ School profile response: {success: true, data: {...}}
📋 Setting school data: {accessCode: "CpPwxWHs*kw7", accessCodeActivated: true}
```

---

### Step 3: Click "Refresh Status" Button

1. **Click** the "Refresh Status" button (circular arrow icon)
2. **Watch the Console** for these logs:

```
🔄 Refresh Status button clicked
📡 Calling fetchSchoolData...
🔍 Fetching school profile from: http://localhost:3000/school/profile
✅ School profile response: {success: true, data: {...}}
📋 Setting school data: {accessCode: "CpPwxWHs*kw7", accessCodeActivated: true}
✅ Refresh completed, current schoolData: {accessCode: "CpPwxWHs*kw7", accessCodeActivated: true}
```

---

### Step 4: Check Network Tab

1. **Go to DevTools -> Network tab**
2. **Click "Refresh Status"** button
3. **Find** the request to `profile` (or `/school/profile`)
4. **Click on it**
5. **Go to Response tab**
6. **You should see**:

```json
{
  "success": true,
  "data": {
    "id": "2537975c-b5e5-4134-a438-c9c6e3efa150",
    "username": "ali_ameer",
    "schoolName": "aliameer",
    "schoolCode": "ALIAME464",
    "accessCode": "CpPwxWHs*kw7",
    "accessCodeActivated": true,
    "contactPhone": "07727256974",
    ...
  }
}
```

---

## Common Issues & Solutions

### Issue 1: Wrong API Base URL
**Symptoms**: Console shows error like "Failed to fetch" or wrong URL

**Check**: Look at the console log - what URL is it fetching from?
- Should be: `http://localhost:3000/school/profile`
- If different: Check `VITE_API_BASE_URL` environment variable

**Solution**:
```bash
# In school dashboard root directory
echo 'VITE_API_BASE_URL=http://localhost:3000' > .env.local
# Restart the frontend
```

---

### Issue 2: Token Authentication Failed
**Symptoms**: Console shows "401 Unauthorized" or "403 Access denied"

**Solution**: 
1. Logout from school dashboard
2. Login again with: `ali_ameer` / your password
3. Go back to Settings page

---

### Issue 3: Response Shows Wrong Data
**Symptoms**: Response shows `accessCodeActivated: false` or `accessCode: null`

**This means**: Frontend is connecting to a DIFFERENT backend/database

**Solution**: Check if you have multiple backend instances running
```bash
lsof -ti:3000
# Kill all processes on port 3000
kill $(lsof -ti:3000)
# Restart backend
cd /Users/alitalib/src/sms/backend && bun run index.ts
```

---

### Issue 4: UI Still Shows Old Data
**Symptoms**: Console shows correct data but UI doesn't update

**Solution**: React state might not be updating
1. Check if `setSchoolData` is actually being called (see console log)
2. Try hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
3. Try closing and reopening the tab

---

## Quick Test Command

Test the API directly with curl (replace YOUR_TOKEN with actual token):

```bash
# Get your token from browser console:
# localStorage.getItem('token')

curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:3000/school/profile | jq
```

Should return:
```json
{
  "success": true,
  "data": {
    "accessCode": "CpPwxWHs*kw7",
    "accessCodeActivated": true,
    ...
  }
}
```

---

## What to Share if Still Not Working

If still not working, share these details:

1. **Console logs** from DevTools Console tab (copy all logs)
2. **Network request** (right-click on the `profile` request -> Copy -> Copy as cURL)
3. **Response** from the Network tab
4. **Screenshots** of:
   - Settings page
   - Console tab with errors
   - Network tab showing the request/response

---

## Expected Final State

Once working, you should see:

### In School Dashboard (localhost:3002/settings):
```
✅ Company Access: Activated
📋 Access Code: CpPwxWHs*kw7
🔴 Button: Deactivate Company Access
```

### In Central Dashboard (localhost:3001):
```
✅ Company Access Code: Activated
📋 Access Code: CpPwxWHs*kw7
ℹ️  Company Access Enabled
```

### Login Test:
1. Logout from school dashboard
2. Go to login page
3. Enter access code: `CpPwxWHs*kw7`
4. Should login WITHOUT WhatsApp verification ✅

