class Attendance {
  final String id;
  final String studentId;
  final String subjectId;
  final String date;
  final AttendanceStatus status;
  final String? markedAt;
  final String? markedBy;
  final AttendanceStudent student;
  final AttendanceSubject subject;
  final AttendanceTeacher? teacher;
  final String createdAt;
  final String updatedAt;

  Attendance({
    required this.id,
    required this.studentId,
    required this.subjectId,
    required this.date,
    required this.status,
    this.markedAt,
    this.markedBy,
    required this.student,
    required this.subject,
    this.teacher,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'] ?? '',
      studentId: json['studentId'] ?? '',
      subjectId: json['subjectId'] ?? '',
      date: json['date'] ?? '',
      status: AttendanceStatus.values.firstWhere(
        (e) => e.name == (json['status'] ?? 'absent'),
        orElse: () => AttendanceStatus.absent,
      ),
      markedAt: json['markedAt'],
      markedBy: json['markedBy'],
      student: AttendanceStudent.fromJson(json['student'] ?? {}),
      subject: AttendanceSubject.fromJson(json['subject'] ?? {}),
      teacher: json['teacher'] != null ? AttendanceTeacher.fromJson(json['teacher']) : null,
      createdAt: json['createdAt'] ?? '',
      updatedAt: json['updatedAt'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'studentId': studentId,
      'subjectId': subjectId,
      'date': date,
      'status': status.name,
      'markedAt': markedAt,
      'markedBy': markedBy,
      'student': student.toJson(),
      'subject': subject.toJson(),
      'teacher': teacher?.toJson(),
      'createdAt': createdAt,
      'updatedAt': updatedAt,
    };
  }
}

enum AttendanceStatus {
  present,
  absent,
}

class AttendanceStudent {
  final String id;
  final String name;
  final String code;

  AttendanceStudent({
    required this.id,
    required this.name,
    required this.code,
  });

  factory AttendanceStudent.fromJson(Map<String, dynamic> json) {
    return AttendanceStudent(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
    };
  }
}

class AttendanceSubject {
  final String id;
  final String name;

  AttendanceSubject({
    required this.id,
    required this.name,
  });

  factory AttendanceSubject.fromJson(Map<String, dynamic> json) {
    return AttendanceSubject(
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

class AttendanceTeacher {
  final String id;
  final String name;

  AttendanceTeacher({
    required this.id,
    required this.name,
  });

  factory AttendanceTeacher.fromJson(Map<String, dynamic> json) {
    return AttendanceTeacher(
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

class AttendanceRecord {
  final String studentId;
  final String studentName;
  final String studentCode;
  final AttendanceStatus status;

  AttendanceRecord({
    required this.studentId,
    required this.studentName,
    required this.studentCode,
    required this.status,
  });

  AttendanceRecord copyWith({
    String? studentId,
    String? studentName,
    String? studentCode,
    AttendanceStatus? status,
  }) {
    return AttendanceRecord(
      studentId: studentId ?? this.studentId,
      studentName: studentName ?? this.studentName,
      studentCode: studentCode ?? this.studentCode,
      status: status ?? this.status,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'studentId': studentId,
      'subjectId': '', // Will be set when submitting
      'status': status.name,
    };
  }
} 