import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureConfig {
  static const _secureStorage = FlutterSecureStorage();

  // Initialize configuration
  static Future<void> init() async {
    try {
      await dotenv.load(fileName: ".env");
    } catch (e) {
      // .env file doesn't exist, which is fine - we'll use hardcoded values
    }
  }

  // Get base URL from environment or fallback to hardcoded
  static String get baseUrl {
    // In production, you might want to fetch this from secure storage
      // or use diffe
    return dotenv.env['API_BASE_URL'] ??
        'https://sms-backend-production-eedb.up.railway.app';
  }

  // Get WebSocket URL
  static String get wsBaseUrl {
    return dotenv.env['WS_BASE_URL'] ??
        'wss://sms-backend-production-eedb.up.railway.app';
  }

  // Get environment
  static String get environment {
    return dotenv.env['ENVIRONMENT'] ?? 'production';
  }

  // API Endpoints
  static String get loginEndpoint =>
      dotenv.env['LOGIN_ENDPOINT'] ?? '/api/mobile/auth/login';
  static String get verifyTokenEndpoint =>
      dotenv.env['VERIFY_TOKEN_ENDPOINT'] ?? '/api/mobile/auth/verify';
  static String get profileEndpoint =>
      dotenv.env['PROFILE_ENDPOINT'] ?? '/api/mobile/auth/profile';

  // App Information
  static String get appName => dotenv.env['APP_NAME'] ?? 'Teacher App';
  static String get appVersion => dotenv.env['APP_VERSION'] ?? '1.0.0';

  // Development helpers
  static bool get isDevelopment => environment == 'development';
  static bool get isProduction => environment == 'production';

  // For extremely sensitive data, use secure storage
  static Future<void> storeSecureData(String key, String value) async {
    await _secureStorage.write(key: key, value: value);
  }

  static Future<String?> getSecureData(String key) async {
    return await _secureStorage.read(key: key);
  }

  // Get platform-specific base URL - DISABLED (production only)
  static String get platformSpecificBaseUrl {
    // Localhost development disabled - always use production Railway URL
    return baseUrl;
  }

  // Network configuration
  static Duration get connectionTimeout => const Duration(seconds: 30);
  static Duration get receiveTimeout => const Duration(seconds: 30);

  // Security headers
  static Map<String, String> get defaultHeaders => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': '$appName/$appVersion',
  };

  // Get authenticated headers
  static Future<Map<String, String>> getAuthenticatedHeaders() async {
    final token = await getSecureData('auth_token');
    final headers = Map<String, String>.from(defaultHeaders);
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }
}
