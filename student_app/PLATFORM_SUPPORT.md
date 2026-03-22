# Student App - Universal Platform Support

## 🚀 Supported Platforms

The Student App now supports all major Apple platforms with Railway backend integration:

### 📱 iOS Devices
- **iPhone** (all models and screen sizes)
- **iPad** (all models including iPad Pro, iPad Air, iPad mini)
- **iOS Simulator** (for development and testing)

### 💻 macOS
- **Intel Macs** (x86_64 architecture)
- **Apple Silicon Macs** (M1, M2, M3, etc.)
- **macOS Simulator** (for development and testing)

### 🤖 Android
- **Android Phones** (all screen sizes)
- **Android Tablets** (all screen sizes)
- **Android Emulator** (for development and testing)

## 🔧 Configuration Features

### Universal Backend Support
- ✅ **Railway Backend Only** - `https://sms-backend-production-eedb.up.railway.app`
- ✅ **No Localhost Support** - Completely disabled for production-only deployment
- ✅ **Secure HTTPS Connections** - TLS 1.2+ required
- ✅ **Cross-Platform Consistency** - Same behavior on all platforms

### iOS-Specific Features
- ✅ **Universal App** - Works on both iPhone and iPad
- ✅ **Multiple Orientations** - Portrait and landscape support
- ✅ **Device Family Support** - iPhone (1) and iPad (2)
- ✅ **Network Security** - Railway domain only allowed

### macOS-Specific Features
- ✅ **Native macOS App** - Full desktop experience
- ✅ **Network Security** - Railway domain only allowed
- ✅ **Apple Silicon Support** - Optimized for M1/M2/M3 chips
- ✅ **Intel Mac Support** - Compatible with older Macs

## 🚀 How to Run

### Quick Start
```bash
# Universal launcher (recommended)
./run_all_platforms.sh    # macOS/Linux
run_all_platforms.bat     # Windows

# Or run directly
flutter run
```

### Platform-Specific Commands

#### iOS (iPhone, iPad, Simulator)
```bash
# macOS/Linux
./run_ios.sh

# Windows
run_ios.bat

# Direct Flutter
flutter run -d ios
```

#### macOS
```bash
# macOS/Linux
./run_macos.sh

# Windows
run_macos.bat

# Direct Flutter
flutter run -d macos
```

#### Android
```bash
# macOS/Linux
./run_local.sh

# Windows
run_local.bat

# Direct Flutter
flutter run -d android
```

## 🔍 Debug Output

When you run the app, you'll see configuration details:

```
🚀 Student App starting...
🔧 Student AppConfig baseUrl called
🔧 Compile-time env: null
🔧 Using production URL: https://sms-backend-production-eedb.up.railway.app
🌐 Student ApiService using baseUrl: https://sms-backend-production-eedb.up.railway.app
```

## 📋 Requirements

### Development Environment
- **Flutter SDK** 3.8.1 or higher
- **Xcode** (for iOS/macOS development)
- **Android Studio** (for Android development)
- **macOS** (for iOS/macOS development)

### Runtime Requirements
- **iOS** 12.0 or higher
- **macOS** 10.14 or higher
- **Android** API 21 or higher

## 🛠️ Platform-Specific Notes

### iOS Development
- Requires Xcode for building and testing
- iOS Simulator must be running for testing
- Supports both iPhone and iPad layouts
- Automatic orientation handling

### macOS Development
- Native macOS app experience
- Supports both Intel and Apple Silicon Macs
- Full desktop window management
- Native macOS UI elements

### Android Development
- Works with Android Studio or VS Code
- Supports both phones and tablets
- Android emulator or physical device required
- Material Design UI

## 🔒 Security Features

All platforms include:
- **HTTPS Only** - No HTTP connections allowed
- **Railway Domain Only** - No other domains permitted
- **TLS 1.2+** - Modern encryption standards
- **No Localhost** - Production-only deployment

## 📱 Testing

To test on different platforms:

1. **iOS Simulator**: Start iOS Simulator from Xcode
2. **macOS**: Run directly on macOS
3. **Android Emulator**: Start Android emulator from Android Studio
4. **Physical Devices**: Connect via USB or wireless debugging

The app will automatically detect the platform and configure itself accordingly while maintaining the same Railway backend connectivity across all platforms.
