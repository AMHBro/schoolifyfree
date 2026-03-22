import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';

class NotesGradesService {
  // Use environment-aware base URL (local in debug, prod in release)
  static String get baseUrl => AppConfig.baseUrl;

  // Get notes for a student
  static Future<List<Map<String, dynamic>>> getNotes(
    String studentId,
    String token,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/notes/student/$studentId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return List<Map<String, dynamic>>.from(data['data']['notes'] ?? []);
        }
      }

      throw Exception('Failed to load notes');
    } catch (e) {
      throw Exception('Failed to load notes: $e');
    }
  }

  // Add a note for a student
  static Future<bool> addNote(
    String studentId,
    String title,
    String content,
    String token,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/notes/student/$studentId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'title': title, 'content': content}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }

      return false;
    } catch (e) {
      throw Exception('Failed to add note: $e');
    }
  }

  // Get grades for a student
  static Future<List<Map<String, dynamic>>> getGrades(
    String studentId,
    String token,
  ) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/api/mobile/grades/student/$studentId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true) {
          return List<Map<String, dynamic>>.from(data['data']['grades'] ?? []);
        }
      }

      throw Exception('Failed to load grades');
    } catch (e) {
      throw Exception('Failed to load grades: $e');
    }
  }

  // Add a grade for a student
  static Future<bool> addGrade(
    String studentId,
    String gradeType,
    String subject,
    String grade,
    String token,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/mobile/grades/student/$studentId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'gradeType': gradeType,
          'subject': subject,
          'grade': grade,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }

      return false;
    } catch (e) {
      throw Exception('Failed to add grade: $e');
    }
  }

  // Update a note
  static Future<bool> updateNote(
    String noteId,
    String title,
    String content,
    String token,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/mobile/notes/$noteId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({'title': title, 'content': content}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }

      return false;
    } catch (e) {
      throw Exception('Failed to update note: $e');
    }
  }

  // Delete a note
  static Future<bool> deleteNote(String noteId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/mobile/notes/$noteId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }

      return false;
    } catch (e) {
      throw Exception('Failed to delete note: $e');
    }
  }

  // Update a grade
  static Future<bool> updateGrade(
    String gradeId,
    String gradeType,
    String subject,
    String grade,
    String token,
  ) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/api/mobile/grades/$gradeId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'gradeType': gradeType,
          'subject': subject,
          'grade': grade,
        }),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }

      return false;
    } catch (e) {
      throw Exception('Failed to update grade: $e');
    }
  }

  // Delete a grade
  static Future<bool> deleteGrade(String gradeId, String token) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/api/mobile/grades/$gradeId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['success'] == true;
      }

      return false;
    } catch (e) {
      throw Exception('Failed to delete grade: $e');
    }
  }
}
