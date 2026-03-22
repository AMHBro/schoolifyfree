class AppConfig {
  // Environment-based configuration
  // Production URL
  static const String _prodUrl =
      'https://sms-backend-production-eedb.up.railway.app';

  //development url
  // static const String _devUrl =
  // 'https://backend-production-563f.up.railway.app';
  // Environment override (can be set via --dart-define)
  static const String? _envUrl = String.fromEnvironment('API_BASE_URL');

  // Final base URL - supports both development and production
  static String get baseUrl {
    final compileTimeEnv = _envUrl;

    // If environment variable is set, use it
    if (compileTimeEnv != null && compileTimeEnv.isNotEmpty) {
      return compileTimeEnv;
    }

    // Default to production URL
    return _prodUrl;

    // Default to development URL
    //return _devUrl;
  }

  // WebSocket URL - Railway production only
  static String get wsBaseUrl {
    return baseUrl.replaceFirst('http', 'ws');
  }

  // Environment info
  static bool get isDevelopment =>
      baseUrl.contains('localhost') ||
      baseUrl.contains('127.0.0.1') ||
      baseUrl.contains('10.0.2.2');
  static bool get isProduction => !isDevelopment;
  static String get environment => isDevelopment ? 'development' : 'production';

  // Demo credentials (for testing)
  static const String demoSchoolCode = 'DEFAULT01';
  static const String demoStudentCode = 'STU001';
  static const String demoPassword = 'student123';

  // App information
  static const String appName = 'Student App';
  static const String appVersion = '1.0.0';

  // Shared preferences keys
  static const String authTokenKey = 'student_auth_token';
  static const List<String> legacyAuthTokenKeys = ['auth_token'];

  // Key for storing the student data in SharedPreferences
  static const String studentDataKey = 'student_data';
}
