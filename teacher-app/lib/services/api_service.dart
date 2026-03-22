import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/schedule.dart';
import '../models/attendance.dart';
import '../models/post.dart';

class ApiService {
  static String get baseUrl {
    final url = AppConfig.baseUrl;
    return url;
  }

  static Map<String, dynamic> _offlineError(Object e) {
    return {
      'success': false,
      'code': 'NETWORK_OFFLINE',
      'message': 'NETWORK_OFFLINE',
    };
  }

  // Reserved for future: sanitize backend messages if we decide to surface them
  // Keeping a minimal implementation now to avoid unused lint.
  static String _sanitizeMessage(Object? message, {required String fallback}) {
    final raw = (message ?? '').toString().trim();
    return raw.isEmpty ? fallback : raw;
  }

  static String _normalizeDigits(String input) {
    const arabicIndic = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9',
    };
    return input.split('').map((ch) => arabicIndic[ch] ?? ch).join();
  }

  // Login method
  static Future<Map<String, dynamic>> login({
    required String phoneNumber,
    required String password,
  }) async {
    try {
      final normalizedPhone = _normalizeDigits(phoneNumber).trim();
      final body = {
        'identifier': normalizedPhone,
        // Include phoneNumber for older backends; both point to the same value
        'phoneNumber': normalizedPhone,
        'password': password,
      };

      final response = await http
          .post(
            Uri.parse('$baseUrl${AppConfig.loginEndpoint}'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 30));

      // Check if response body is empty or null
      if (response.body.isEmpty) {
        return {'success': false, 'message': 'Server returned empty response'};
      }

      dynamic data;
      try {
        data = jsonDecode(response.body);
      } catch (e) {
        return {
          'success': false,
          'message': 'Invalid response format: ${e.toString()}',
        };
      }

      // Check if data is null
      if (data == null) {
        return {'success': false, 'message': 'Server returned null data'};
      }

      // Check if data is a Map
      if (data is! Map<String, dynamic>) {
        return {
          'success': false,
          'message': 'Unexpected response format: ${data.runtimeType}',
        };
      }

      if (response.statusCode == 200) {
        // Double-check that data contains required fields
        if (data['data'] == null) {
          return {
            'success': false,
            'message': 'Server response missing data field',
          };
        }

        // Log the exact structure we're returning

        return {
          'success': true,
          'data':
              data['data'], // Return the inner 'data' object, not the whole response
        };
      } else {
        return {
          'success': false,
          'message': (data is Map && data['message'] != null)
              ? data['message']
              : 'Login failed',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Verify token method
  static Future<Map<String, dynamic>> verifyToken(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl${AppConfig.verifyTokenEndpoint}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Token verification failed',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Get profile method
  static Future<Map<String, dynamic>> getProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl${AppConfig.profileEndpoint}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Normalize to return the inner data payload, like login()
        final inner = (data is Map<String, dynamic>) ? data['data'] : null;
        if (inner == null) {
          return {
            'success': false,
            'message': 'Profile response missing data field',
          };
        }
        return {'success': true, 'data': inner};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get profile',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Send central delete-account request (public)
  static Future<Map<String, dynamic>> sendDeleteAccountRequest({
    required String phoneNumber,
    required String schoolCode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/central/requests'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phoneNumber': _normalizeDigits(phoneNumber).trim(),
          'schoolCode': schoolCode.trim().toUpperCase(),
          'type': 'DELETE_ACCOUNT',
        }),
      );

      if (response.body.isEmpty) {
        return {'success': false, 'message': 'Empty server response'};
      }

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
          'message': data['message'],
        };
      }
      return {
        'success': false,
        'message': (data is Map && data['message'] != null)
            ? data['message']
            : 'Failed to submit request',
      };
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Get today's schedule
  static Future<Map<String, dynamic>> getTodaySchedule(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/schedule/today'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': DailySchedule.fromJson(data['data'])};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get today\'s schedule',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Get daily schedule for a specific day
  static Future<Map<String, dynamic>> getDailySchedule(
    String token,
    String dayOfWeek,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/schedule/daily/$dayOfWeek'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': DailySchedule.fromJson(data['data'])};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get daily schedule',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Get weekly schedule
  static Future<Map<String, dynamic>> getWeeklySchedule(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/schedule/weekly'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data']};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get weekly schedule',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Get daily attendance for a stage
  static Future<Map<String, dynamic>> getDailyAttendance(
    String token,
    String stageId,
    String date,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/attendance/daily/$stageId/$date'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get daily attendance',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Mark attendance for a single student
  static Future<Map<String, dynamic>> markAttendance({
    required String token,
    required String studentId,
    required String subjectId,
    required String date,
    required String status,
    String? markedBy,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/attendance'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'studentId': studentId,
          'subjectId': subjectId,
          'date': date,
          'status': status,
          'markedBy': markedBy,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': Attendance.fromJson(data)};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to mark attendance',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Bulk mark attendance for multiple students
  static Future<Map<String, dynamic>> bulkMarkAttendance({
    required String token,
    required String date,
    required String stageId,
    required List<Map<String, dynamic>> attendanceData,
    String? markedBy,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/attendance/bulk'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'date': date,
          'stageId': stageId,
          'attendanceData': attendanceData,
          'markedBy': markedBy,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to bulk mark attendance',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Initialize attendance for a stage on a specific date
  static Future<Map<String, dynamic>> initializeAttendance(
    String token,
    String stageId,
    String date,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/attendance/initialize/$stageId/$date'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to initialize attendance',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // ================= POSTS METHODS =================

  // Get teacher's posts
  static Future<Map<String, dynamic>> getPosts(
    String token, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/posts?page=$page&limit=$limit'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': PostsResponse.fromJson(data['data'])};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get posts',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Create new post
  static Future<Map<String, dynamic>> createPost({
    required String token,
    required String title,
    required String content,
    required String stageId,
    required String subjectId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/posts'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'title': title,
          'content': content,
          'stageId': stageId,
          'subjectId': subjectId,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': TeacherPost.fromJson(data['data']['post']),
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to create post',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Get single post
  static Future<Map<String, dynamic>> getPost(
    String token,
    String postId,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/posts/$postId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': TeacherPost.fromJson(data['data']['post']),
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get post',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Like/Unlike post
  static Future<Map<String, dynamic>> togglePostLike(
    String token,
    String postId,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/posts/$postId/like'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to toggle like',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Add comment to post
  static Future<Map<String, dynamic>> addComment({
    required String token,
    required String postId,
    required String content,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/posts/$postId/comments'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'content': content}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': PostComment.fromJson(data['data']['comment']),
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to add comment',
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // ================= CHAT METHODS =================

  // Get teacher's chats
  static Future<Map<String, dynamic>> getChats(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/teacher/chats'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data']};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get chats',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'code': 'NETWORK_OFFLINE',
        'message': 'NETWORK_OFFLINE',
      };
    }
  }

  // Get chat messages
  static Future<Map<String, dynamic>> getChatMessages(
    String token,
    String chatId,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/chats/$chatId/messages'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data['data']};
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to get messages',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'code': 'NETWORK_OFFLINE',
        'message': 'NETWORK_OFFLINE',
      };
    }
  }

  // Send message
  static Future<Map<String, dynamic>> sendMessage(
    String token,
    String chatId,
    String content,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/chats/$chatId/messages'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'content': content}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to send message',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'code': 'NETWORK_OFFLINE',
        'message': 'NETWORK_OFFLINE',
      };
    }
  }

  // Forgot password - Request verification code
  static Future<Map<String, dynamic>> requestPasswordReset({
    required String schoolCode,
    required String phoneNumber,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/teacher/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'schoolCode': schoolCode,
          'phoneNumber': phoneNumber,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Failed to send verification code',
        };
      }
    } catch (e) {
      return {
        'success': false,
        'code': 'NETWORK_OFFLINE',
        'message': 'NETWORK_OFFLINE',
      };
    }
  }

  // Verify reset code
  static Future<Map<String, dynamic>> verifyResetCode({
    required String phoneNumber,
    required String verificationCode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/teacher/verify-code'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'phoneNumber': phoneNumber,
          // Normalize potential RTL digits before sending
          'verificationCode': _normalizeDigits(verificationCode).trim(),
        }),
      );

      // Guard against empty body
      if (response.body.isEmpty) {
        return {'success': false, 'message': 'Empty server response'};
      }

      dynamic data;
      try {
        data = jsonDecode(response.body);
      } catch (_) {
        return {'success': false, 'message': 'Invalid server response'};
      }

      // Respect backend 'success' flag even when status is 200
      if (response.statusCode == 200 && data is Map<String, dynamic>) {
        if (data['success'] == true) {
          return {
            'success': true,
            'data': data['data'], // expect optional resetToken here
            'message': data['message'],
          };
        }
        return {
          'success': false,
          'message': (data['message'] ?? 'Verification failed').toString(),
        };
      }

      return {
        'success': false,
        'message': (data is Map && data['message'] != null)
            ? data['message']
            : 'Token verification failed',
      };
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }

  // Reset password
  static Future<Map<String, dynamic>> resetPassword({
    required String phoneNumber,
    required String verificationCode,
    required String newPassword,
    required String schoolCode,
    required String teacherPhoneNumber,
    String? resetToken,
  }) async {
    try {
      final normalizedPhone = _normalizeDigits(
        (teacherPhoneNumber.isNotEmpty ? teacherPhoneNumber : phoneNumber)
            .trim(),
      );
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/teacher/reset-password'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          // Be tolerant: include the phone number as originally used during verification
          'phoneNumber': phoneNumber, // original
          // and also include normalized variants many backends expect
          'teacherPhoneNumber': normalizedPhone,
          'identifier': normalizedPhone,
          // Provide multiple aliases for the verification code
          'verificationCode': _normalizeDigits(verificationCode).trim(),
          'verification_code': _normalizeDigits(verificationCode).trim(),
          'code': _normalizeDigits(verificationCode).trim(),
          if (resetToken != null) 'resetToken': resetToken,
          'newPassword': newPassword,
          'schoolCode': schoolCode,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {
          'success': true,
          'data': data['data'],
          'message': data['message'],
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Password reset failed',
        };
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: ${e.toString()}'};
    }
  }
}
