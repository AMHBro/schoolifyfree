class AppConfig {
  // Environment-based configuration
  // Production URL
  static const String _prodUrl =
      'https://sms-backend-production-eedb.up.railway.app';

  //development url
  //static const String _devUrl =
  //  'https://backend-production-563f.up.railway.app';
  // Environment override (can be set via --dart-define)
  static const String? _envUrl = String.fromEnvironment('API_BASE_URL');

  // Final base URL - always use production Railway URL
  // Localhost support has been disabled for production-only deployment
  static String get baseUrl {
    // Only allow Railway production URL or explicit environment override
    final compileTimeEnv = _envUrl;

    if (compileTimeEnv != null &&
        compileTimeEnv.isNotEmpty &&
        compileTimeEnv.contains('railway.app')) {
      return compileTimeEnv;
    }

    //return _prodUrl;
    // Default to development URL
    return _prodUrl;

    // return _devUrl;
  }

  // WebSocket URL
  static String get wsBaseUrl => baseUrl.replaceFirst('http', 'ws');

  // Environment info
  static bool get isDevelopment => false; // Localhost development disabled
  static bool get isProduction => true; // Always production mode
  static String get environment => 'production';

  // App information
  static const String appName = 'Teacher App';
  static const String appVersion = '1.0.0';

  // API endpoints
  static const String loginEndpoint = '/api/mobile/auth/login';
  static const String verifyTokenEndpoint = '/api/mobile/auth/verify';
  static const String profileEndpoint = '/api/mobile/auth/profile';

  // Shared preferences keys
  static const String authTokenKey = 'auth_token';
  static const String teacherDataKey = 'teacher_data';
  static const List<String> legacyAuthTokenKeys = <String>[
    'token',
    'authToken',
    'teacher_token',
  ];

  // Demo credentials (remove in production)
  static const String demoPhoneNumber = '+1234567890';
  static const String demoPassword = 'password123';
}
