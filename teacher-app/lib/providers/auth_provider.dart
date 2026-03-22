// ignore_for_file: empty_catches

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../services/api_service.dart';
import '../services/websocket_service.dart';
import '../models/teacher.dart';
import '../models/schedule.dart';
import '../config/app_config.dart';

class AuthProvider with ChangeNotifier {
  Teacher? _teacher;
  String? _token;
  bool _isLoading = false;
  bool _isAuthenticated = false;
  DailySchedule? _todaySchedule;
  DailySchedule? _selectedDaySchedule;
  String _selectedDay = _getCurrentDay();
  bool _isLoadingSchedule = false;

  // WebSocket service
  final WebSocketService _webSocketService = WebSocketService();

  // Getters
  Teacher? get teacher => _teacher;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  DailySchedule? get todaySchedule => _todaySchedule;
  DailySchedule? get selectedDaySchedule => _selectedDaySchedule;
  String get selectedDay => _selectedDay;
  bool get isLoadingSchedule => _isLoadingSchedule;
  WebSocketService get webSocketService => _webSocketService;

  // Internal reentrancy guard
  bool _isChecking = false;

  // Constructor
  AuthProvider() {
    _checkAuthStatus();
  }

  // Check if user is already authenticated (offline resilient)
  Future<void> _checkAuthStatus() async {
    if (_isChecking) return; // avoid overlapping checks
    _isChecking = true;
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString(AppConfig.authTokenKey);
      // Migrate from legacy keys if needed
      if (token == null) {
        for (final key in AppConfig.legacyAuthTokenKeys) {
          token = prefs.getString(key);
          if (token != null) {
            await prefs.setString(AppConfig.authTokenKey, token);
            await prefs.remove(key);
            break;
          }
        }
      }

      final teacherJson = prefs.getString(AppConfig.teacherDataKey);

      if (token != null) {
        // Optimistically authenticate for instant resume even when offline
        _token = token;
        _isAuthenticated = true;

        if (teacherJson != null) {
          try {
            _teacher = Teacher.fromJson(jsonDecode(teacherJson));
          } catch (_) {}
        }

        _isLoading = false;
        notifyListeners();

        // Verify token and hydrate in background, but be tolerant to network
        _verifyAndHydrate(token);
      }
    } catch (e) {}

    _isLoading = false;
    _isChecking = false;
    notifyListeners();
  }

  Future<void> _verifyAndHydrate(String token) async {
    try {
      final result = await ApiService.verifyToken(token);
      if (result['success']) {
        final profile = await ApiService.getProfile(token);
        if (profile['success']) {
          final data = profile['data'];
          final teacherMap = data is Map<String, dynamic>
              ? (data['teacher'] as Map<String, dynamic>?)
              : null;
          if (teacherMap != null) {
            _teacher = Teacher.fromJson(teacherMap);
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString(
              AppConfig.teacherDataKey,
              jsonEncode(_teacher!.toJson()),
            );
            notifyListeners();
          }
        }

        // Ensure WebSocket is connected after verification
        await _webSocketService.connect(_token!);
      } else {
        final message = (result['message'] ?? '').toString().toLowerCase();
        final isNetworkLike =
            message.contains('network') ||
            message.contains('connection refused') ||
            message.contains('failed host lookup') ||
            message.contains('socketexception') ||
            message.contains('unreachable') ||
            message.contains('timed out') ||
            message.contains('timeout');
        if (!isNetworkLike) {
          // Probably an auth error → clear credentials
          final prefs = await SharedPreferences.getInstance();
          await prefs.remove(AppConfig.authTokenKey);
          for (final key in AppConfig.legacyAuthTokenKeys) {
            await prefs.remove(key);
          }
          await logout();
        }
      }
    } catch (e) {
      // If it's a network error, keep the optimistic session
      final s = e.toString().toLowerCase();
      final isNetwork =
          s.contains('connection') ||
          s.contains('failed host lookup') ||
          s.contains('socketexception') ||
          s.contains('network');
      if (!isNetwork) {
        await logout();
      }
    }
  }

  // Public method to trigger a re-check (e.g., after hot reload)
  Future<void> recheckAuth() async {
    // If already authenticated and not loading, nothing to do
    if (_isAuthenticated && !_isLoading) return;
    await _checkAuthStatus();
  }

  // Login method
  Future<String?> login(String phoneNumber, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final result = await ApiService.login(
        phoneNumber: phoneNumber,
        password: password,
      );

      if (result['success']) {
        try {
          // Check if result['data'] exists and is not null
          if (result['data'] == null) {
            _isLoading = false;
            notifyListeners();
            return 'خطأ في الخادم: لا توجد بيانات في الاستجابة';
          }

          // Check if token exists
          if (result['data']['token'] == null) {
            _isLoading = false;
            notifyListeners();
            return 'خطأ في الخادم: لا يوجد رمز مصادقة';
          }

          _token = result['data']['token'];

          // Check if teacher data exists
          if (result['data']['teacher'] == null) {
            _isLoading = false;
            notifyListeners();
            return 'خطأ في الخادم: لا توجد بيانات المعلم';
          }

          _teacher = Teacher.fromJson(result['data']['teacher']);

          _isAuthenticated = true;

          // Save token to SharedPreferences
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(AppConfig.authTokenKey, _token!);
          // mirror student app: write to legacy keys too
          for (final key in AppConfig.legacyAuthTokenKeys) {
            await prefs.setString(key, _token!);
          }
          await prefs.setString(
            AppConfig.teacherDataKey,
            jsonEncode(_teacher!.toJson()),
          );

          // Connect to WebSocket
          await _webSocketService.connect(_token!);

          _isLoading = false;

          notifyListeners();
          return null; // Success
        } catch (e) {
          _isLoading = false;
          notifyListeners();
          return 'حدث خطأ في معالجة البيانات: ${e.toString()}';
        }
      } else {
        _isLoading = false;
        notifyListeners();
        return result['message'];
      }
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return 'NETWORK_OFFLINE';
    }
  }

  // Logout method
  Future<void> logout() async {
    // Disconnect WebSocket
    _webSocketService.disconnect();

    _teacher = null;
    _token = null;
    _isAuthenticated = false;
    _isLoading = false; // ensure loading is cleared
    _isLoadingSchedule = false; // clear schedule loading as well
    _todaySchedule = null;
    _selectedDaySchedule = null;

    // Clear token from SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConfig.authTokenKey);
    for (final key in AppConfig.legacyAuthTokenKeys) {
      await prefs.remove(key);
    }
    await prefs.remove(AppConfig.teacherDataKey);

    notifyListeners();
  }

  // Refresh profile
  Future<void> refreshProfile() async {
    if (_token == null) return;

    try {
      final result = await ApiService.getProfile(_token!);
      if (result['success']) {
        final teacherMap = (result['data'] as Map<String, dynamic>)['teacher'];
        if (teacherMap != null) {
          _teacher = Teacher.fromJson(teacherMap);
          final prefs = await SharedPreferences.getInstance();
          await prefs.setString(
            AppConfig.teacherDataKey,
            jsonEncode(_teacher!.toJson()),
          );
          notifyListeners();
        }
      }
    } catch (e) {}
  }

  // Get today's schedule
  Future<void> loadTodaySchedule() async {
    if (_token == null) {
      return;
    }

    _isLoadingSchedule = true;
    notifyListeners();

    try {
      final result = await ApiService.getTodaySchedule(_token!);

      if (result['success']) {
        _todaySchedule = result['data'] as DailySchedule;

        // If selected day is today, update selected day schedule too
        if (_selectedDay == _getCurrentDay()) {
          _selectedDaySchedule = _todaySchedule;
        }
      } else {}
    } catch (e) {}

    _isLoadingSchedule = false;
    notifyListeners();
  }

  // Get schedule for a specific day
  Future<void> loadDailySchedule(String dayOfWeek) async {
    if (_token == null) {
      return;
    }

    _selectedDay = dayOfWeek;
    _isLoadingSchedule = true;
    notifyListeners();

    try {
      final result = await ApiService.getDailySchedule(_token!, dayOfWeek);

      if (result['success']) {
        _selectedDaySchedule = result['data'] as DailySchedule;
      } else {}
    } catch (e) {}

    _isLoadingSchedule = false;
    notifyListeners();
  }

  // Select a day (if today's schedule is already loaded, use it)
  void selectDay(String dayOfWeek) {
    _selectedDay = dayOfWeek;

    if (dayOfWeek == _getCurrentDay() && _todaySchedule != null) {
      _selectedDaySchedule = _todaySchedule;
      notifyListeners();
    } else {
      loadDailySchedule(dayOfWeek);
    }
  }

  // Helper method to get current day
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
    // weekday is 1 (Monday) to 7 (Sunday)
    final dayIndex = now.weekday - 1;
    final currentDay = days[dayIndex];

    return currentDay;
  }
}
