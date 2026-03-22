class StudentGrades {
  final StudentInfo student;
  final List<SubjectGrade> subjects;
  final GradeSummary summary;

  StudentGrades({
    required this.student,
    required this.subjects,
    required this.summary,
  });

  factory StudentGrades.fromJson(Map<String, dynamic> json) {
    return StudentGrades(
      student: StudentInfo.fromJson(json['student'] ?? {}),
      subjects: (json['subjects'] as List? ?? [])
          .map((subject) => SubjectGrade.fromJson(subject))
          .toList(),
      summary: GradeSummary.fromJson(json['summary'] ?? {}),
    );
  }
}

class StudentInfo {
  final String id;
  final String name;
  final String code;
  final Stage stage;

  StudentInfo({
    required this.id,
    required this.name,
    required this.code,
    required this.stage,
  });

  factory StudentInfo.fromJson(Map<String, dynamic> json) {
    return StudentInfo(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      code: json['code'] ?? '',
      stage: Stage.fromJson(json['stage'] ?? {}),
    );
  }
}

class Stage {
  final String id;
  final String name;

  Stage({
    required this.id,
    required this.name,
  });

  factory Stage.fromJson(Map<String, dynamic> json) {
    return Stage(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
    );
  }
}

class SubjectGrade {
  final String subjectId;
  final String subjectName;
  final ExamGrades grades;
  final double average;
  final int totalGrades;

  SubjectGrade({
    required this.subjectId,
    required this.subjectName,
    required this.grades,
    required this.average,
    required this.totalGrades,
  });

  factory SubjectGrade.fromJson(Map<String, dynamic> json) {
    return SubjectGrade(
      subjectId: json['subjectId'] ?? '',
      subjectName: json['subjectName'] ?? '',
      grades: ExamGrades.fromJson(json['grades'] ?? {}),
      average: (json['average'] ?? 0).toDouble(),
      totalGrades: json['totalGrades'] ?? 0,
    );
  }
}

class ExamGrades {
  final Grade? month1Exam;
  final Grade? month2Exam;
  final Grade? midTermExam;
  final Grade? month3Exam;
  final Grade? month4Exam;
  final Grade? finalExam;

  ExamGrades({
    this.month1Exam,
    this.month2Exam,
    this.midTermExam,
    this.month3Exam,
    this.month4Exam,
    this.finalExam,
  });

  factory ExamGrades.fromJson(Map<String, dynamic> json) {
    return ExamGrades(
      month1Exam: json['MONTH_1_EXAM'] != null 
          ? Grade.fromJson(json['MONTH_1_EXAM']) 
          : null,
      month2Exam: json['MONTH_2_EXAM'] != null 
          ? Grade.fromJson(json['MONTH_2_EXAM']) 
          : null,
      midTermExam: json['MID_TERM_EXAM'] != null 
          ? Grade.fromJson(json['MID_TERM_EXAM']) 
          : null,
      month3Exam: json['MONTH_3_EXAM'] != null 
          ? Grade.fromJson(json['MONTH_3_EXAM']) 
          : null,
      month4Exam: json['MONTH_4_EXAM'] != null 
          ? Grade.fromJson(json['MONTH_4_EXAM']) 
          : null,
      finalExam: json['FINAL_EXAM'] != null 
          ? Grade.fromJson(json['FINAL_EXAM']) 
          : null,
    );
  }

  List<Grade> getAllGrades() {
    return [
      month1Exam,
      month2Exam,
      midTermExam,
      month3Exam,
      month4Exam,
      finalExam,
    ].where((grade) => grade != null).cast<Grade>().toList();
  }
}

class Grade {
  final String id;
  final double grade;
  final String teacher;
  final DateTime createdAt;

  Grade({
    required this.id,
    required this.grade,
    required this.teacher,
    required this.createdAt,
  });

  factory Grade.fromJson(Map<String, dynamic> json) {
    return Grade(
      id: json['id'] ?? '',
      grade: (json['grade'] ?? 0).toDouble(),
      teacher: json['teacher'] ?? '',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  String get letterGrade {
    if (grade >= 90) return 'A+';
    if (grade >= 85) return 'A';
    if (grade >= 80) return 'A-';
    if (grade >= 75) return 'B+';
    if (grade >= 70) return 'B';
    if (grade >= 65) return 'B-';
    if (grade >= 60) return 'C+';
    if (grade >= 55) return 'C';
    if (grade >= 50) return 'C-';
    return 'F';
  }
}

class GradeSummary {
  final double overallAverage;
  final int totalSubjects;
  final int subjectsWithGrades;

  GradeSummary({
    required this.overallAverage,
    required this.totalSubjects,
    required this.subjectsWithGrades,
  });

  factory GradeSummary.fromJson(Map<String, dynamic> json) {
    return GradeSummary(
      overallAverage: (json['overallAverage'] ?? 0).toDouble(),
      totalSubjects: json['totalSubjects'] ?? 0,
      subjectsWithGrades: json['subjectsWithGrades'] ?? 0,
    );
  }

  String get overallLetterGrade {
    if (overallAverage >= 90) return 'A+';
    if (overallAverage >= 85) return 'A';
    if (overallAverage >= 80) return 'A-';
    if (overallAverage >= 75) return 'B+';
    if (overallAverage >= 70) return 'B';
    if (overallAverage >= 65) return 'B-';
    if (overallAverage >= 60) return 'C+';
    if (overallAverage >= 55) return 'C';
    if (overallAverage >= 50) return 'C-';
    return 'F';
  }
} 