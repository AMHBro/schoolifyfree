import 'package:intl/intl.dart';

DateTime _parseServerDateTime(String value) {
  try {
    final hasTz = RegExp(r'(Z|[+-]\d{2}:?\d{2})$').hasMatch(value);
    final parsed = DateTime.parse(value);
    if (hasTz) {
      return parsed.toLocal();
    }
    // Assume server sends UTC without timezone when missing. Convert accordingly.
    final utc = DateTime.utc(
      parsed.year,
      parsed.month,
      parsed.day,
      parsed.hour,
      parsed.minute,
      parsed.second,
      parsed.millisecond,
      parsed.microsecond,
    );
    return utc.toLocal();
  } catch (_) {
    return DateTime.now();
  }
}

class Chat {
  final String id;
  final String teacherId;
  final String teacherName;
  final String? lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;
  final DateTime createdAt;

  Chat({
    required this.id,
    required this.teacherId,
    required this.teacherName,
    this.lastMessage,
    this.lastMessageAt,
    required this.unreadCount,
    required this.createdAt,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      id: json['id'],
      teacherId: json['teacherId'],
      teacherName: json['teacherName'],
      lastMessage: json['lastMessage'],
      lastMessageAt: json['lastMessageAt'] != null
          ? _parseServerDateTime(json['lastMessageAt'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      createdAt: _parseServerDateTime(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'teacherId': teacherId,
      'teacherName': teacherName,
      'lastMessage': lastMessage,
      'lastMessageAt': lastMessageAt?.toIso8601String(),
      'unreadCount': unreadCount,
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class ChatMessage {
  final String id;
  final String content;
  final String senderType;
  final String senderId;
  final bool isMe;
  final DateTime? readAt;
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.content,
    required this.senderType,
    required this.senderId,
    required this.isMe,
    this.readAt,
    required this.createdAt,
  });

  // Returns localized short time string like 17:05
  String get formattedTime {
    try {
      final dt = createdAt.toLocal();
      return DateFormat('h:mm a', 'ar_IQ').format(dt);
    } catch (_) {
      final dt = createdAt.toLocal();
      final hour12 = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
      final period = dt.hour >= 12 ? 'م' : 'ص';
      return '$hour12:${dt.minute.toString().padLeft(2, '0')} $period';
    }
  }

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      content: json['content'],
      senderType: json['senderType'],
      senderId: json['senderId'],
      isMe: json['isMe'] ?? false,
      readAt: json['readAt'] != null
          ? _parseServerDateTime(json['readAt'])
          : null,
      createdAt: _parseServerDateTime(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'senderType': senderType,
      'senderId': senderId,
      'isMe': isMe,
      'readAt': readAt?.toIso8601String(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class Teacher {
  final String id;
  final String name;
  final List<String> subjects;

  Teacher({required this.id, required this.name, required this.subjects});

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(
      id: json['id'],
      name: json['name'],
      subjects: List<String>.from(json['subjects'] ?? []),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'subjects': subjects};
  }
}
