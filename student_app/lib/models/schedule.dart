class Schedule {
  final String id;
  final int timeSlot;
  final String? startTime;
  final String? endTime;
  final Subject subject;
  final Teacher teacher;

  Schedule({
    required this.id,
    required this.timeSlot,
    this.startTime,
    this.endTime,
    required this.subject,
    required this.teacher,
  });

  factory Schedule.fromJson(Map<String, dynamic> json) {
    return Schedule(
      id: json['id'],
      timeSlot: json['timeSlot'],
      startTime: json['startTime'],
      endTime: json['endTime'],
      subject: Subject.fromJson(json['subject']),
      teacher: Teacher.fromJson(json['teacher']),
    );
  }

  String get timeSlotString {
    // Use actual times if available
    if (startTime != null && endTime != null) {
      return '$startTime - $endTime';
    }
    // Return empty string if times are not available
    return '';
  }
}

class Subject {
  final String id;
  final String name;

  Subject({required this.id, required this.name});

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(id: json['id'], name: json['name']);
  }
}

class Teacher {
  final String id;
  final String name;

  Teacher({required this.id, required this.name});

  factory Teacher.fromJson(Map<String, dynamic> json) {
    return Teacher(id: json['id'], name: json['name']);
  }
}
