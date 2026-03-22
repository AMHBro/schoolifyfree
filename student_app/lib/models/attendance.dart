class Attendance {
  final String id;
  final String studentId;
  final String subjectId;
  final String date;
  final String status; // "PRESENT", "ABSENT", "LATE", "EXCUSED"
  final String? markedAt;
  final String? markedBy;
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
    required this.subject,
    this.teacher,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['id'],
      studentId: json['studentId'],
      subjectId: json['subjectId'],
      date: json['date'],
      status: json['status'],
      markedAt: json['markedAt'],
      markedBy: json['markedBy'],
      subject: AttendanceSubject.fromJson(json['subject']),
      teacher: json['teacher'] != null
          ? AttendanceTeacher.fromJson(json['teacher'])
          : null,
      createdAt: json['createdAt'],
      updatedAt: json['updatedAt'],
    );
  }

  bool get isPresent => status == 'PRESENT';
  bool get isAbsent => status == 'ABSENT';
  bool get isLate => status == 'LATE';
  bool get isExcused => status == 'EXCUSED';
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
      id: json['id'],
      name: json['name'],
    );
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
      id: json['id'],
      name: json['name'],
    );
  }
}

