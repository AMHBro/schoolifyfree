class Teacher {
  final String id;
  final String name;
  final String phoneNumber;
  final int? age;
  final String? gender;
  final String? birthdate;
  final List<Stage> stages;
  final List<Subject> subjects;

  Teacher({
    required this.id,
    required this.name,
    required this.phoneNumber,
    this.age,
    this.gender,
    this.birthdate,
    required this.stages,
    required this.subjects,
  });

  factory Teacher.fromJson(Map<String, dynamic> json) {
    try {
      return Teacher(
        id: (json['id'] ?? '').toString(),
        name: (json['name'] ?? '').toString(),
        phoneNumber: (json['phoneNumber'] ?? '').toString(),
        age: json['age'] is int ? json['age'] : int.tryParse(json['age']?.toString() ?? ''),
        gender: json['gender']?.toString(),
        birthdate: json['birthdate']?.toString(),
        stages: (json['stages'] as List?)
            ?.map((stage) {
              try {
                return Stage.fromJson(stage ?? {});
              } catch (e) {
                
                return null;
              }
            })
            .where((stage) => stage != null)
            .cast<Stage>()
            .toList() ?? [],
        subjects: (json['subjects'] as List?)
            ?.map((subject) {
              try {
                return Subject.fromJson(subject ?? {});
              } catch (e) {
               
                return null;
              }
            })
            .where((subject) => subject != null)
            .cast<Subject>()
            .toList() ?? [],
      );
    } catch (e) {
    
      throw Exception('Failed to parse Teacher: $e');
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phoneNumber': phoneNumber,
      'age': age,
      'gender': gender,
      'birthdate': birthdate,
      'stages': stages.map((stage) => stage.toJson()).toList(),
      'subjects': subjects.map((subject) => subject.toJson()).toList(),
    };
  }
}

class Stage {
  final String id;
  final String name;
  final List<Student>? students;

  Stage({
    required this.id,
    required this.name,
    this.students,
  });

  factory Stage.fromJson(Map<String, dynamic> json) {
    try {
      return Stage(
        id: (json['id'] ?? '').toString(),
        name: (json['name'] ?? '').toString(),
        students: (json['students'] as List?)
            ?.map((student) {
              try {
                return Student.fromJson(student ?? {});
              } catch (e) {
                
                return null;
              }
            })
            .where((student) => student != null)
            .cast<Student>()
            .toList(),
      );
    } catch (e) {
    
      throw Exception('Failed to parse Stage: $e');
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'students': students?.map((student) => student.toJson()).toList(),
    };
  }
}

class Subject {
  final String id;
  final String name;

  Subject({
    required this.id,
    required this.name,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
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

class Student {
  final String id;
  final String name;
  final int age;
  final String gender;
  final String phoneNumber;
  final String code;

  Student({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.phoneNumber,
    required this.code,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    try {
      return Student(
        id: (json['id'] ?? '').toString(),
        name: (json['name'] ?? '').toString(),
        age: (json['age'] is int) ? json['age'] : int.tryParse(json['age']?.toString() ?? '0') ?? 0,
        gender: (json['gender'] ?? '').toString(),
        phoneNumber: (json['phoneNumber'] ?? '').toString(),
        code: (json['code'] ?? '').toString(),
      );
    } catch (e) {
   
      // Return a default student object to prevent the entire parsing from failing
      return Student(
        id: '',
        name: 'Unknown',
        age: 0,
        gender: '',
        phoneNumber: '',
        code: '',
      );
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'age': age,
      'gender': gender,
      'phoneNumber': phoneNumber,
      'code': code,
    };
  }
} 