import 'dart:convert';
import 'package:flutter/material.dart';
import '../config/app_config.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';

class AuthProvider with ChangeNotifier {
  Map<String, dynamic>? _studentData;
  String? _token;
  bool _isLoading = false;
  bool _isAuthenticated = false;

  // Schedule related state
  bool _isLoadingSchedule = false;
  String _selectedDay = _getCurrentDay();
  Map<String, dynamic>? _weeklySchedule;
  Map<String, dynamic>? _selectedDaySchedule;

  // WebSocket service
  final WebSocketService _webSocketService = WebSocketService();

  // Getters
  Map<String, dynamic>? get studentData => _studentData;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoadingSchedule => _isLoadingSchedule;
  String get selectedDay => _selectedDay;
  Map<String, dynamic>? get weeklySchedule => _weeklySchedule;
  Map<String, dynamic>? get selectedDaySchedule => _selectedDaySchedule;
  WebSocketService get webSocketService => _webSocketService;

  // Constructor
  AuthProvider() {
    debugPrint('AuthProvider initialized');
    _checkAuthStatus();
  }

  // Check if user is already authenticated
  Future<void> _checkAuthStatus() async {
    debugPrint('Checking auth status...');
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString(AppConfig.authTokenKey);
      if (token == null) {
        for (final key in AppConfig.legacyAuthTokenKeys) {
          token = prefs.getString(key);
          if (token != null) {
            debugPrint('Found token under legacy key: $key; migrating...');
            await prefs.setString(AppConfig.authTokenKey, token);
            await prefs.remove(key);
            break;
          }
        }
      }
      final studentDataString = prefs.getString(AppConfig.studentDataKey);

      debugPrint('Stored token: ${token != null ? 'exists' : 'not found'}');

      if (token != null) {
        // Optimistically authenticate to render UI immediately
        _token = token;
        _isAuthenticated = true;

        if (studentDataString != null) {
          try {
            final parsed = jsonDecode(studentDataString);
            if (parsed is Map<String, dynamic>) {
              _studentData = Map<String, dynamic>.from(parsed);
              final displayName =
                  _studentData?['name'] ?? _studentData?['fullName'] ?? '';
              debugPrint('Loaded student data from cache: $displayName');
            } else {
              debugPrint(
                'Cached student data has unexpected format, ignoring.',
              );
            }
          } catch (e) {
            debugPrint('Failed to parse cached student data: $e');
          }
        }

        _isLoading = false;
        notifyListeners();

        // Verify token and load profile in background
        _verifyAndHydrate(token);
      } else {
        debugPrint('No token found');
        _isAuthenticated = false;
        _isLoading = false;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error checking auth status: $e');
      // Do not force logout on unexpected local errors; keep current state
      if (_token == null) {
        _isAuthenticated = false;
      }
      _isLoading = false;
      notifyListeners();
    }

    debugPrint(
      'Auth status check scheduled. Authenticated (optimistic): $_isAuthenticated',
    );
  }

  Future<void> _verifyAndHydrate(String token) async {
    try {
      debugPrint('Verifying token in background...');
      final result = await ApiService.verifyToken(token);
      debugPrint('Token verification result: $result');

      if (result['success']) {
        // Get full profile data
        debugPrint('Getting full profile data...');
        final profileResult = await ApiService.getProfile(token);
        debugPrint('Profile result: $profileResult');

        if (profileResult['success']) {
          final data = profileResult['data']['data'];
          if (data != null && data['student'] != null) {
            _studentData = data['student'];
            debugPrint('Student data loaded: ${_studentData!['name']}');
          }
        } else {
          debugPrint('Failed to get profile data: ${profileResult['message']}');
          final data = result['data']['data'];
          if (data != null && data['student'] != null) {
            _studentData = data['student'];
            debugPrint('Using basic student data from token verification');
          }
        }

        // Connect to WebSocket and load schedule after verification
        await _webSocketService.connect(_token!);
        await loadWeeklySchedule();

        // Persist the latest student data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(
          AppConfig.studentDataKey,
          jsonEncode(_studentData),
        );

        notifyListeners();
      } else {
        // Handle verify failure: distinguish network vs auth errors
        final message = (result['message'] ?? '').toString().toLowerCase();
        final isNetworkLike =
            message.contains('network error') ||
            message.contains('connection refused') ||
            message.contains('failed host lookup') ||
            message.contains('socketexception') ||
            message.contains('network is unreachable') ||
            message.contains('timed out');

        final isAuthError =
            message.contains('unauthorized') ||
            message.contains('forbidden') ||
            message.contains('invalid') ||
            message.contains('expired') ||
            message.contains('authentication');

        if (isNetworkLike) {
          debugPrint('Verify failed due to network; keeping cached session.');
          // Keep current authenticated state and cached data
          return;
        }

        if (isAuthError) {
          debugPrint('Token invalid during background verify, logging out...');
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove(AppConfig.authTokenKey);
          for (final key in AppConfig.legacyAuthTokenKeys) {
            await prefs.remove(key);
          }
          await logout();
        } else {
          // Unknown error type: be conservative and keep session
          debugPrint('Verify failed with non-auth error; keeping session.');
        }
      }
    } catch (e) {
      debugPrint('Background verification error: $e');
      if (!_isNetworkError(e)) {
        debugPrint('Non-network error during verification, logging out...');
        await logout();
      } else {
        debugPrint('Network error during verification, keeping cached data.');
      }
    }
  }

  // Login method
  Future<String?> login(String studentCode, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.login(
        studentCode: studentCode,
        password: password,
      );

      if (result['success']) {
        final data = result['data']['data'];
        _token = data['token'];
        _studentData = data['student'];
        _isAuthenticated = true;

        // Save token to SharedPreferences
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConfig.authTokenKey, _token!);
        // Also write to legacy keys for safety in older app versions
        for (final key in AppConfig.legacyAuthTokenKeys) {
          await prefs.setString(key, _token!);
        }
        await prefs.setString(
          AppConfig.studentDataKey,
          jsonEncode(_studentData),
        );

        // Connect to WebSocket
        await _webSocketService.connect(_token!);

        // Load schedule data
        loadWeeklySchedule();

        _isLoading = false;
        notifyListeners();
        return null; // Success
      } else {
        _isAuthenticated = false;
        _token = null;
        _isLoading = false;
        notifyListeners();
        if (result['code'] == 'NETWORK_OFFLINE') {
          return 'NETWORK_OFFLINE';
        }
        final msg = (result['message'] ?? '').toString().toLowerCase();
        if (msg.contains('invalid') || msg.contains('unauthorized')) {
          return 'Invalid student code or password';
        }
        return result['message'] ?? 'Login failed';
      }
    } catch (e) {
      _isAuthenticated = false;
      _token = null;
      _isLoading = false;
      notifyListeners();

      // Handle network errors
      if (e.toString().contains('Connection refused') ||
          e.toString().contains('Failed host lookup') ||
          e.toString().toLowerCase().contains('network')) {
        return 'NETWORK_OFFLINE';
      }

      return 'Login failed';
    }
  }

  // Logout method
  Future<void> logout() async {
    debugPrint('Logging out...');

    // Disconnect WebSocket
    _webSocketService.disconnect();

    _studentData = null;
    _token = null;
    _isAuthenticated = false;
    _weeklySchedule = null;
    _selectedDaySchedule = null;

    // Clear token from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.authTokenKey);
    for (final key in AppConfig.legacyAuthTokenKeys) {
      await prefs.remove(key);
    }
    await prefs.remove(AppConfig.studentDataKey);

    notifyListeners();
    debugPrint('Logout complete');
  }

  // Helper to check for network-related errors
  bool _isNetworkError(dynamic e) {
    final errorString = e.toString().toLowerCase();
    return errorString.contains('connection refused') ||
        errorString.contains('failed host lookup') ||
        errorString.contains('socketexception') ||
        errorString.contains('network is unreachable');
  }

  // Refresh profile
  Future<void> refreshProfile() async {
    if (_token == null) {
      debugPrint('Cannot refresh profile: no token');
      return;
    }

    debugPrint('Refreshing profile...');
    try {
      final result = await ApiService.getProfile(_token!);
      debugPrint('Profile refresh result: $result');

      if (result['success']) {
        final data = result['data']['data'];
        if (data != null && data['student'] != null) {
          _studentData = data['student'];
          debugPrint('Profile refreshed successfully');
          notifyListeners();
        }
      } else {
        debugPrint('Failed to refresh profile: ${result['message']}');

        // If we get an authentication error, the token might be invalid
        if (result['message']?.contains('authentication') == true ||
            result['message']?.contains('unauthorized') == true ||
            result['message']?.contains('Invalid') == true) {
          debugPrint(
            'Authentication error detected during refresh, logging out...',
          );
          await logout();
        }
      }
    } catch (e) {
      debugPrint('Error refreshing profile: $e');
      if (!_isNetworkError(e)) {
        debugPrint('Non-network error during refresh, logging out...');
        await logout();
      } else {
        debugPrint('Network error during refresh, keeping cached data.');
      }
    }
  }

  // Schedule methods
  static String _getCurrentDay() {
    final now = DateTime.now();
    const days = [
      'Monday', // weekday 1
      'Tuesday', // weekday 2
      'Wednesday', // weekday 3
      'Thursday', // weekday 4
      'Friday', // weekday 5
      'Saturday', // weekday 6
      'Sunday', // weekday 7
    ];
    return days[now.weekday - 1];
  }

  Future<void> loadWeeklySchedule() async {
    if (!_isAuthenticated || _token == null) {
      debugPrint('Cannot load schedule: not authenticated or no token');
      return;
    }

    debugPrint('Loading weekly schedule...');
    _isLoadingSchedule = true;
    notifyListeners();

    try {
      final result = await ApiService.getWeeklySchedule(_token!);
      debugPrint('Weekly schedule result: $result');

      if (result['success']) {
        _weeklySchedule = result['data'];
        // Load today's schedule by default
        await loadDaySchedule(_selectedDay);
        debugPrint('Weekly schedule loaded successfully');
      } else {
        debugPrint('Failed to load weekly schedule: ${result['message']}');

        // If we get an authentication error, the token might be invalid
        if (result['message']?.contains('authentication') == true ||
            result['message']?.contains('unauthorized') == true ||
            result['message']?.contains('Invalid') == true ||
            result['message']?.contains('expired') == true) {
          debugPrint('Authentication error detected, logging out...');
          await logout();
        }
      }
    } catch (e) {
      debugPrint('Error loading weekly schedule: $e');
      if (!_isNetworkError(e)) {
        debugPrint('Non-network error during schedule load, logging out...');
        await logout();
      } else {
        debugPrint('Network error during schedule load, keeping cached data.');
      }
    } finally {
      _isLoadingSchedule = false;
      notifyListeners();
    }
  }

  Future<void> loadDaySchedule(String day) async {
    if (!_isAuthenticated || _token == null) {
      debugPrint('Cannot load day schedule: not authenticated or no token');
      return;
    }

    debugPrint('Loading schedule for $day...');
    _selectedDay = day;
    _isLoadingSchedule = true;
    notifyListeners();

    try {
      final result = await ApiService.getDailySchedule(_token!, day);
      debugPrint('Daily schedule result for $day: $result');

      if (result['success']) {
        _selectedDaySchedule = result['data'];
        debugPrint('Schedule loaded for $day successfully');
      } else {
        debugPrint('Failed to load schedule for $day: ${result['message']}');

        // If we get an authentication error, the token might be invalid
        if (result['message']?.contains('authentication') == true ||
            result['message']?.contains('unauthorized') == true ||
            result['message']?.contains('Invalid') == true ||
            result['message']?.contains('expired') == true) {
          debugPrint('Authentication error detected, logging out...');
          await logout();
        }
      }
    } catch (e) {
      debugPrint('Error loading daily schedule for $day: $e');
      if (!_isNetworkError(e)) {
        debugPrint(
          'Non-network error during day schedule load, logging out...',
        );
        await logout();
      } else {
        debugPrint(
          'Network error during day schedule load, keeping cached data.',
        );
      }
    } finally {
      _isLoadingSchedule = false;
      notifyListeners();
    }
  }

  void selectDay(String day) {
    debugPrint('Selecting day: $day');
    loadDaySchedule(day);
  }

  // Method to initialize/refresh authentication - can be called when app regains focus
  Future<void> initializeAuth() async {
    if (_isLoading) {
      debugPrint('Auth check already in progress, skipping...');
      return;
    }

    debugPrint('Initializing authentication...');
    await _checkAuthStatus();
  }

  // Method to handle app lifecycle changes
  Future<void> handleAppResumed() async {
    if (_isAuthenticated && _token != null) {
      debugPrint('App resumed, refreshing profile...');
      await refreshProfile();
    } else {
      debugPrint('App resumed, checking auth status...');
      await _checkAuthStatus();
    }
  }
}
