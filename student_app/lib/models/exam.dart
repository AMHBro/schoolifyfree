class Exam {
  final String id;
  final String title;
  final String? description;
  final DateTime examDate;
  final String classNumber;
  final ExamStage stage;
  final ExamSubject subject;
  final ExamTeacher teacher;
  final DateTime createdAt;
  final DateTime updatedAt;

  Exam({
    required this.id,
    required this.title,
    this.description,
    required this.examDate,
    required this.classNumber,
    required this.stage,
    required this.subject,
    required this.teacher,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Exam.fromJson(Map<String, dynamic> json) {
    return Exam(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      description: json['description'],
      examDate: DateTime.parse(json['examDate'] ?? DateTime.now().toIso8601String()),
      classNumber: json['classNumber'] ?? '',
      stage: ExamStage.fromJson(json['stage'] ?? {}),
      subject: ExamSubject.fromJson(json['subject'] ?? {}),
      teacher: ExamTeacher.fromJson(json['teacher'] ?? {}),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'examDate': examDate.toIso8601String(),
      'classNumber': classNumber,
      'stage': stage.toJson(),
      'subject': subject.toJson(),
      'teacher': teacher.toJson(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }

  // Helper method to check if exam is upcoming
  bool get isUpcoming => examDate.isAfter(DateTime.now());

  // Helper method to check if exam is today
  bool get isToday {
    final now = DateTime.now();
    return examDate.year == now.year &&
           examDate.month == now.month &&
           examDate.day == now.day;
  }

  // Helper method to get time until exam
  Duration get timeUntilExam => examDate.difference(DateTime.now());

  // Helper method to get formatted date
  String get formattedDate {
    final now = DateTime.now();
    final difference = examDate.difference(now);
    
    if (difference.inDays == 0) {
      return 'Today';
    } else if (difference.inDays == 1) {
      return 'Tomorrow';
    } else if (difference.inDays > 0 && difference.inDays <= 7) {
      return 'In ${difference.inDays} days';
    } else if (difference.inDays < 0) {
      final daysPassed = -difference.inDays;
      if (daysPassed == 1) {
        return 'Yesterday';
      } else {
        return '$daysPassed days ago';
      }
    } else {
      return '${examDate.day}/${examDate.month}/${examDate.year}';
    }
  }
}

class ExamStage {
  final String id;
  final String name;

  ExamStage({
    required this.id,
    required this.name,
  });

  factory ExamStage.fromJson(Map<String, dynamic> json) {
    return ExamStage(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class ExamSubject {
  final String id;
  final String name;

  ExamSubject({
    required this.id,
    required this.name,
  });

  factory ExamSubject.fromJson(Map<String, dynamic> json) {
    return ExamSubject(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class ExamTeacher {
  final String id;
  final String name;

  ExamTeacher({
    required this.id,
    required this.name,
  });

  factory ExamTeacher.fromJson(Map<String, dynamic> json) {
    return ExamTeacher(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class ExamPagination {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasNext;
  final bool hasPrev;

  ExamPagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrev,
  });

  factory ExamPagination.fromJson(Map<String, dynamic> json) {
    return ExamPagination(
      page: json['page'],
      limit: json['limit'],
      total: json['total'],
      totalPages: json['totalPages'],
      hasNext: json['hasNext'],
      hasPrev: json['hasPrev'],
    );
  }
}

class ExamResponse {
  final List<Exam> exams;
  final ExamPagination pagination;

  ExamResponse({
    required this.exams,
    required this.pagination,
  });

  factory ExamResponse.fromJson(Map<String, dynamic> json) {
    return ExamResponse(
      exams: (json['exams'] as List)
          .map((exam) => Exam.fromJson(exam))
          .toList(),
      pagination: ExamPagination.fromJson(json['pagination']),
    );
  }
} 