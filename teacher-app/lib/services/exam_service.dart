import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/exam.dart';

class ExamService {
  static String get baseUrl => AppConfig.baseUrl;
  static Map<String, dynamic> _offlineError(Object e) => {
    'success': false,
    'code': 'NETWORK_OFFLINE',
    'message': 'NETWORK_OFFLINE',
  };
  static String _sanitizeMessage(Object? message, {required String fallback}) {
    final raw = (message ?? '').toString().trim();
    if (raw.isEmpty) return fallback;
    String text = raw
        .replaceAll(RegExp(r'https?:\\/\\/[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'https?:\/\/[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'https?://[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    if (text.isEmpty) return fallback;
    if (text.length > 180) text = text.substring(0, 180).trim();
    return text;
  }

  // Get exams for authenticated teacher
  static Future<Map<String, dynamic>> getExams({
    required String token,
    int page = 1,
    int limit = 10,
    bool upcomingOnly = false,
  }) async {
    try {
      final uri = Uri.parse('$baseUrl/api/mobile/exams').replace(
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
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to fetch exams',
          ),
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Create new exam
  static Future<Map<String, dynamic>> createExam({
    required String token,
    required CreateExamRequest examRequest,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/exams'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(examRequest.toJson()),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to create exam',
          ),
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Update exam
  static Future<Map<String, dynamic>> updateExam({
    required String token,
    required String examId,
    required Map<String, dynamic> updates,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/mobile/exams/$examId'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode(updates),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return {'success': true, 'data': data};
      } else {
        return {
          'success': false,
          'message': _sanitizeMessage(
            (data is Map) ? data['message'] : null,
            fallback: 'Failed to update exam',
          ),
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }

  // Delete exam
  static Future<Map<String, dynamic>> deleteExam({
    required String token,
    required String examId,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/mobile/exams/$examId'),
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
            fallback: 'Failed to delete exam',
          ),
        };
      }
    } catch (e) {
      return _offlineError(e);
    }
  }
}
