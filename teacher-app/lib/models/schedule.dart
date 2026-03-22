class Schedule {
  final String id;
  final String timeSlot;
  final String? startTime;
  final String? endTime;
  final ScheduleStage stage;
  final ScheduleSubject subject;
  final List<ScheduleStudent>? students;

  Schedule({
    required this.id,
    required this.timeSlot,
    this.startTime,
    this.endTime,
    required this.stage,
    required this.subject,
    this.students,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    return Schedule(
      id: json['id'] ?? '',
      timeSlot: _formatTimeSlot(json['timeSlot']),
      startTime: json['startTime'],
      endTime: json['endTime'],
      stage: ScheduleStage.fromJson(json['stage'] ?? {}),
      subject: ScheduleSubject.fromJson(json['subject'] ?? {}),
      students: json['students'] != null
          ? (json['students'] as List)
                .map((student) => ScheduleStudent.fromJson(student ?? {}))
                .toList()
          : null,
    );
  }

  static String _formatTimeSlot(dynamic timeSlot) {
    if (timeSlot is String) return timeSlot;
    if (timeSlot is int) {
      // Convert time slot number to time string
      final hour = 8 + (timeSlot - 1); // Assuming classes start at 8 AM
      return '${hour.toString().padLeft(2, '0')}:00';
    }
    return timeSlot.toString();
  }

  String get timeSlotString {
    // Use actual times if available
    if (startTime != null && endTime != null) {
      return '$startTime - $endTime';
    }
    // Return empty string if times are not available
    return '';
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'timeSlot': timeSlot,
      'startTime': startTime,
      'endTime': endTime,
      'stage': stage.toJson(),
      'subject': subject.toJson(),
      'students': students?.map((student) => student.toJson()).toList(),
    };
  }
}

class ScheduleStage {
  final String id;
  final String name;
  final int? studentCount;

  ScheduleStage({required this.id, required this.name, this.studentCount});

  factory ScheduleStage.fromJson(Map<String, dynamic> json) {
    return ScheduleStage(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      studentCount: json['studentCount'],
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'studentCount': studentCount};
  }
}

class ScheduleSubject {
  final String id;
  final String name;

  ScheduleSubject({required this.id, required this.name});

  factory ScheduleSubject.fromJson(Map<String, dynamic> json) {
    return ScheduleSubject(id: json['id'] ?? '', name: json['name'] ?? '');
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name};
  }
}

class ScheduleStudent {
  final String id;
  final String name;
  final String code;
  final int age;
  final String gender;
  final String phoneNumber;

  ScheduleStudent({
    required this.id,
    required this.name,
    required this.code,
    required this.age,
    required this.gender,
    required this.phoneNumber,
  });

  factory ScheduleStudent.fromJson(Map<String, dynamic> json) {
    return ScheduleStudent(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      age: json['age'] ?? 0,
      gender: json['gender'] ?? '',
      phoneNumber: json['phoneNumber'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'code': code,
      'age': age,
      'gender': gender,
      'phoneNumber': phoneNumber,
    };
  }
}

class DailySchedule {
  final String dayOfWeek;
  final String? date;
  final List<Schedule> classes;
  final int totalClasses;

  DailySchedule({
    required this.dayOfWeek,
    this.date,
    required this.classes,
    required this.totalClasses,
  });

  factory DailySchedule.fromJson(Map<String, dynamic> json) {
    return DailySchedule(
      dayOfWeek: json['dayOfWeek'] ?? json['today'] ?? '',
      date: json['date'],
      classes: (json['classes'] as List? ?? [])
          .map((schedule) => Schedule.fromJson(schedule ?? {}))
          .toList(),
      totalClasses: json['totalClasses'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'dayOfWeek': dayOfWeek,
      'date': date,
      'classes': classes.map((schedule) => schedule.toJson()).toList(),
      'totalClasses': totalClasses,
    };
  }
}
