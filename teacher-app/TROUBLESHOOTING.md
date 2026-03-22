# Troubleshooting Guide

## Common Issues and Solutions

### ❌ **"No classes today" showing when teacher has classes**

**Possible Causes:**

1. **Wrong Phone Number Format**

   - **Problem**: Phone numbers in database include `+` prefix
   - **Solution**: Use `+1234567890` instead of `1234567890`
   - **Demo credentials**: `+1234567890` / `password123`

2. **Day Calculation Issue**

   - **Problem**: Incorrect weekday calculation
   - **Fixed**: Updated to use correct weekday mapping (1=Monday, 7=Sunday)

3. **Authentication Issues**
   - **Problem**: Token not being sent correctly
   - **Check**: Look at Flutter console for debug messages
   - **Solution**: Ensure you're logged in successfully

### 🔍 **Debugging Steps**

1. **Check Flutter Console**

   ```bash
   flutter run
   ```

   Look for debug messages like:

   - `Current day calculated: Monday (weekday: 1)`
   - `Loading today's schedule...`
   - `Today's schedule loaded: X classes`

2. **Verify Backend Connection**

   ```bash
   curl -X GET "http://localhost:3000/api/schedules"
   ```

3. **Test Login Manually**

   ```bash
   curl -X POST "http://localhost:3000/api/mobile/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber": "+1234567890", "password": "password123"}'
   ```

4. **Test Schedule API**
   ```bash
   # Replace TOKEN with actual token from login
   curl -X GET "http://localhost:3000/api/mobile/schedule/daily/Monday" \
     -H "Authorization: Bearer TOKEN"
   ```

### ⚙️ **Configuration Checks**

1. **Backend URL (lib/config/app_config.dart)**

   - Local: `http://localhost:3000`
   - Android Emulator: `http://10.0.2.2:3000`
   - Real Device: `http://YOUR_IP_ADDRESS:3000`

2. **Demo Credentials**
   - Phone: `+1234567890`
   - Password: `password123`

### 📱 **Device-Specific Issues**

**Android Emulator:**

- Change `baseUrl` to `http://10.0.2.2:3000`
- Ensure backend is running on localhost:3000

**iOS Simulator:**

- Use `http://localhost:3000`
- Check network permissions

**Real Device:**

- Use your computer's IP address
- Ensure both devices are on same WiFi network
- Backend should be accessible from the network

### 🐛 **Common Error Messages**

| Error                              | Solution                                |
| ---------------------------------- | --------------------------------------- |
| "Invalid phone number or password" | Check phone number format (include +)   |
| "Network error"                    | Check backend URL and connectivity      |
| "Token verification failed"        | Clear app data and login again          |
| "No schedule available"            | Check if teacher has assigned schedules |

### 📋 **Verification Checklist**

- [ ] Backend server is running
- [ ] Phone number includes `+` prefix
- [ ] Correct password is used
- [ ] Teacher has schedules assigned in database
- [ ] Backend URL is correct for your device
- [ ] App has network permissions

### 🔧 **Quick Fixes**

1. **Clear App Data**

   - Uninstall and reinstall the app
   - Or clear SharedPreferences data

2. **Restart Backend**

   ```bash
   cd backend
   bun run dev
   ```

3. **Check Teacher's Schedule in Database**

   - Login to admin panel
   - Verify teacher has assigned schedules
   - Check the day names match exactly

4. **Force Refresh**
   - Use the refresh button in app
   - Or restart the app completely

### 📞 **Getting Help**

If issues persist:

1. Check Flutter console output
2. Verify API responses using curl commands
3. Ensure backend is running and accessible
4. Check network configuration

**Debug Mode:**
Run with `flutter run` to see detailed console output with our debug messages.
