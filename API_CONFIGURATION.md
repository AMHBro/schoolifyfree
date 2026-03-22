# API Configuration Guide

This guide explains the multiple ways to configure API backend URLs in your Flutter teacher and student apps. You no longer need to manually comment/uncomment URLs in config files!

## 🎯 Quick Start

### Option 1: Automatic Detection (Recommended)

The apps now automatically detect the environment:

- **Debug Mode**: Uses local backend (`http://localhost:3000` or `http://10.0.2.2:3000` for Android)
- **Release Mode**: Uses production backend

Simply run:

```bash
flutter run                    # Auto-detects environment
```

### Option 2: Command Line Override

Force a specific backend URL:

```bash
# Use local backend
flutter run --dart-define=API_BASE_URL=http://localhost:3000

# Use production backend
flutter run --dart-define=API_BASE_URL=https://sms-backend-production-eedb.up.railway.app

# Use custom URL
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:3000
```

### Option 3: Shell Scripts

Use the provided scripts for common configurations:

**Teacher App:**

```bash
./teacher-app/run_local.sh      # Local backend
./teacher-app/run_prod.sh       # Production backend
```

**Student App:**

```bash
./student_app/run_local.sh      # Local backend
./student_app/run_prod.sh       # Production backend
```

### Option 4: VS Code Launch Configurations

Use the built-in VS Code configurations:

- `Teacher App - Local Backend`
- `Teacher App - Production Backend`
- `Student App - Local Backend`
- `Student App - Production Backend`

Press `F5` or use the Run and Debug panel to select your preferred configuration.

### Option 5: Developer Settings (Runtime)

In debug builds, access developer settings through the app UI to switch backends at runtime.

## 📱 Platform-Specific URLs

The system automatically handles platform differences:

| Platform             | Local URL                                              |
| -------------------- | ------------------------------------------------------ |
| **iOS Simulator**    | `http://localhost:3000`                                |
| **Android Emulator** | `http://10.0.2.2:3000`                                 |
| **Real Device**      | Your computer's IP (e.g., `http://192.168.1.100:3000`) |

## ⚙️ Configuration Priority

URLs are resolved in this order (highest to lowest priority):

1. **Command line** `--dart-define=API_BASE_URL=...`
2. **Environment detection** (debug vs release mode)
3. **Default fallback** (production URL)

## 🔧 Advanced Configuration

### Environment Variables

You can set environment variables for consistent configuration:

```bash
# Set environment variable (Unix/Linux/macOS)
export API_BASE_URL=http://localhost:3000
flutter run

# Windows
set API_BASE_URL=http://localhost:3000
flutter run
```

### Build Configurations

For different build flavors:

```bash
# Development build
flutter build apk --dart-define=API_BASE_URL=http://localhost:3000

# Staging build
flutter build apk --dart-define=API_BASE_URL=https://staging.yourapp.com

# Production build
flutter build apk --dart-define=API_BASE_URL=https://sms-backend-production-eedb.up.railway.app
```

## 🚀 Deployment

### For Testing

```bash
# Test with local backend
./teacher-app/run_local.sh
./student_app/run_local.sh
```

### For Production

```bash
# Test with production backend
./teacher-app/run_prod.sh
./student_app/run_prod.sh

# Build release
cd teacher-app && flutter build apk --release
cd student_app && flutter build apk --release
```

## 🐛 Troubleshooting

### Common Issues

**1. "Connection refused" on Android Emulator**

- Use `http://10.0.2.2:3000` instead of `localhost`
- The scripts handle this automatically

**2. Real device can't connect to local backend**

- Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
- Use: `flutter run --dart-define=API_BASE_URL=http://YOUR_IP:3000`

**3. VS Code configurations not working**

- Make sure Flutter extension is installed
- Check that the launch.json file exists in `.vscode/`

### Debug Information

The apps display current configuration in debug mode:

- Current backend URL
- Environment (development/production)
- WebSocket URL

### Network Security (Android)

For HTTP URLs on Android, network security is configured in:

- `android/app/src/main/res/xml/network_security_config.xml`

## 📝 Files Modified

The following files were updated to support the new configuration system:

**Teacher App:**

- `lib/config/app_config.dart` - Smart environment detection
- `lib/services/websocket_service.dart` - Uses AppConfig
- `lib/widgets/developer_settings.dart` - Runtime switching (new)

**Student App:**

- `lib/config/app_config.dart` - Smart environment detection
- `lib/services/websocket_service.dart` - Uses AppConfig
- `lib/widgets/developer_settings.dart` - Runtime switching (new)

**Shared:**

- `.vscode/launch.json` - VS Code configurations
- Shell scripts for easy launching

## ✅ Benefits

✅ **No more manual editing** of config files  
✅ **Automatic environment detection**  
✅ **Multiple configuration methods**  
✅ **Platform-aware URLs**  
✅ **VS Code integration**  
✅ **Debug-only developer settings**  
✅ **Production-safe** (no debug features in release)

## 🔄 Migration from Old System

If you were manually commenting/uncommenting URLs:

1. **Stop** editing `app_config.dart` files manually
2. **Use** any of the new methods above
3. **Keep** your existing local backend running on port 3000
4. **Enjoy** the automated switching! 🎉
