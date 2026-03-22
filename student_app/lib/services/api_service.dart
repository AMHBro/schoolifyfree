import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class ApiService {
  static String get baseUrl {
    final url = AppConfig.baseUrl;

    return url;
  }

  // Helpers: safer JSON handling for backends that may return plain text
  static dynamic _safeJsonDecode(String body) {
    try {
      return jsonDecode(body);
    } catch (_) {
      return null;
    }
  }

  static Map<String, dynamic> _networkError(Object e) {
    return {
      'success': false,
      'code': 'NETWORK_OFFLINE',
      'message': 'NETWORK_OFFLINE',
    };
  }

  // Normalize Arabic/Persian digits to English digits
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

  // Sanitize backend-provided messages to avoid leaking raw URLs/stack traces
  static String _sanitizeMessage(Object? message, {required String fallback}) {
    final raw = (message ?? '').toString().trim();
    if (raw.isEmpty) return fallback;
    String text = raw;
    // Strip URLs
    text = text.replaceAll(
      RegExp(r'https?:\\/\\/[^\s]+', caseSensitive: false),
      '',
    );
    text = text.replaceAll(
      RegExp(r'https?:\/\/[^\s]+', caseSensitive: false),
      '',
    );
    text = text.replaceAll(
      RegExp(r'https?://[^\s]+', caseSensitive: false),
      '',
    );
    // Collapse whitespace and newlines
    text = text.replaceAll(RegExp(r'\s+'), ' ').trim();
    if (text.isEmpty) return fallback;
    // Limit overly long messages
    if (text.length > 180) {
      text = text.substring(0, 180).trim();
    }
    return text;
  }

  static String _extractMessage(
    http.Response response,
    dynamic data, {
    required String fallback,
  }) {
    if (data is Map && data['message'] is String) {
      return _sanitizeMessage(data['message'], fallback: fallback);
    }
    final contentType = response.headers['content-type'] ?? '';
    if (contentType.contains('text/plain')) {
      final text = response.body.trim();
      if (text.isNotEmpty) return _sanitizeMessage(text, fallback: fallback);
    }
    if ((response.reasonPhrase ?? '').isNotEmpty) {
      return _sanitizeMessage(response.reasonPhrase, fallback: fallback);
    }
    return _sanitizeMessage('HTTP ${response.statusCode}', fallback: fallback);
  }

  // New: send central delete-account request for student using studentCode
  static Future<Map<String, dynamic>> sendStudentDeleteRequest({
    required String studentCode,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/central/requests'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Backend requires phoneNumber and schoolCode; pass studentCode as phoneNumber and leave schoolCode empty.
        body: jsonEncode({
          'phoneNumber': studentCode.trim(),
          'schoolCode': '',
          'type': 'DELETE_ACCOUNT_STUDENT',
        }),
      );

      final data = _safeJsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data ?? response.body};
      } else {
        return {
          'success': false,
          'message': _extractMessage(
            response,
            data,
            fallback: 'Failed to submit delete account request',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Login method
  static Future<Map<String, dynamic>> login({
    required String studentCode,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/auth/student-login'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({'studentCode': studentCode, 'password': password}),
      );

      final data = _safeJsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data ?? response.body};
      } else {
        return {
          'success': false,
          'message': _extractMessage(response, data, fallback: 'Login failed'),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Forgot password - Request verification code
  static Future<Map<String, dynamic>> requestPasswordReset({
    required String schoolCode,
    required String studentCode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/auth/forgot-password'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'schoolCode': schoolCode,
          'studentCode': studentCode,
        }),
      );

      final data = _safeJsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data ?? response.body};
      } else {
        if (response.statusCode == 404) {
          return {
            'success': false,
            'message': _sanitizeMessage(
              'Invalid school code or student code',
              fallback: 'Password reset request failed',
            ),
          };
        }
        return {
          'success': false,
          'message': _extractMessage(
            response,
            data,
            fallback: 'Password reset request failed',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Verify reset code
  static Future<Map<String, dynamic>> verifyResetCode({
    required String phoneNumber,
    required String verificationCode,
    String? schoolCode,
    String? studentCode,
  }) async {
    try {
      final normalizedCode = _normalizeDigits(verificationCode).trim();

      // Debug logging
      print('=== API SERVICE DEBUG ===');
      print('Original Code: "$verificationCode"');
      print('Normalized Code: "$normalizedCode"');
      print('Phone Number: "$phoneNumber"');
      print('=== END API DEBUG ===');

      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/auth/verify-code'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'phoneNumber': phoneNumber,
          'verificationCode': normalizedCode,
          if (schoolCode != null) 'schoolCode': schoolCode,
          if (studentCode != null) 'studentCode': studentCode,
        }),
      );

      final data = _safeJsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data ?? response.body};
      } else {
        return {
          'success': false,
          'message': _extractMessage(
            response,
            data,
            fallback: 'Code verification failed',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Reset password
  static Future<Map<String, dynamic>> resetPassword({
    required String phoneNumber,
    required String verificationCode,
    required String newPassword,
    required String schoolCode,
    required String studentCode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/auth/reset-password'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'phoneNumber': phoneNumber,
          'verificationCode': verificationCode,
          'newPassword': newPassword,
          'schoolCode': schoolCode,
          'studentCode': studentCode,
        }),
      );

      final data = _safeJsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data ?? response.body};
      } else {
        return {
          'success': false,
          'message': _extractMessage(
            response,
            data,
            fallback: 'Password reset failed',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Verify token method
  static Future<Map<String, dynamic>> verifyToken(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/auth/student-verify'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Token verification failed',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get weekly schedule
  static Future<Map<String, dynamic>> getWeeklySchedule(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/schedule'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get weekly schedule',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get student profile
  static Future<Map<String, dynamic>> getProfile(String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/auth/student-verify'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get profile',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get daily schedule for a specific day
  static Future<Map<String, dynamic>> getDailySchedule(
    String token,
    String day,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/schedule/$day'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get daily schedule',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get student's subjects
  static Future<Map<String, dynamic>> getSubjects(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/subjects'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get subjects',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get posts for a specific subject
  static Future<Map<String, dynamic>> getPostsForSubject(
    String token,
    String subjectId, {
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
          '$baseUrl/api/mobile/student/posts/$subjectId?page=$page&limit=$limit',
        ),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get posts',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Like or unlike a post
  static Future<Map<String, dynamic>> togglePostLike(
    String token,
    String postId,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/student/posts/$postId/like'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to toggle like',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Add a comment to a post
  static Future<Map<String, dynamic>> addComment(
    String token,
    String postId,
    String content,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/student/posts/$postId/comment'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to add comment',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get student grades
  static Future<Map<String, dynamic>> getGrades(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/grades'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get grades',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get student's chats
  static Future<Map<String, dynamic>> getChats(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/chats'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get chats',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get teachers from student's stage
  static Future<Map<String, dynamic>> getTeachers(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/teachers'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get teachers',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Start chat with teacher
  static Future<Map<String, dynamic>> startChat(
    String token,
    String teacherId,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/student/chats'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'teacherId': teacherId}),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to start chat',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get messages',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to send message',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get student's exams
  static Future<Map<String, dynamic>> getExams(
    String token, {
    int page = 1,
    int limit = 10,
    bool upcomingOnly = false,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/mobile/student/exams').replace(
        queryParameters: {
          'page': page.toString(),
          'limit': limit.toString(),
          'upcoming': upcomingOnly.toString(),
        },
      );

      final response = await http.get(
        uri,
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get exams',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get a single post by ID
  static Future<Map<String, dynamic>> getPostById(
    String token,
    String postId,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/posts/$postId'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get post',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get a single exam by ID
  static Future<Map<String, dynamic>> getExamById(
    String token,
    String examId,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/student/exams/$examId'),
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get exam',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }

  // Get student's attendance records
  static Future<Map<String, dynamic>> getAttendance(
    String token, {
    String? fromDate,
    String? toDate,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (fromDate != null) queryParams['fromDate'] = fromDate;
      if (toDate != null) queryParams['toDate'] = toDate;

      final uri = Uri.parse('$baseUrl/api/mobile/student/attendance')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);

      final response = await http.get(
        uri,
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
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to get attendance',
          ),
        };
      }
    } catch (e) {
      return _networkError(e);
    }
  }
}
