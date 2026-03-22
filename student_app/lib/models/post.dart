class TeacherPost {
  final String id;
  final String title;
  final String content;
  final PostStage stage;
  final PostSubject subject;
  final PostTeacher teacher;
  int likesCount;
  int commentsCount;
  final List<PostLike> likes;
  final List<PostComment> comments;
  final DateTime createdAt;
  final DateTime updatedAt;
  bool isLikedByCurrentUser;
  final String? imageUrl;

  TeacherPost({
    required this.id,
    required this.title,
    required this.content,
    required this.stage,
    required this.subject,
    required this.teacher,
    required this.likesCount,
    required this.commentsCount,
    required this.likes,
    required this.comments,
    required this.createdAt,
    required this.updatedAt,
    this.isLikedByCurrentUser = false,
    this.imageUrl,
  });

  factory TeacherPost.fromJson(Map<String, dynamic> json) {
    return TeacherPost(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      content: json['content'] ?? '',
      stage: PostStage.fromJson(json['stage'] ?? {}),
      subject: PostSubject.fromJson(json['subject'] ?? {}),
      teacher: PostTeacher.fromJson(json['teacher'] ?? {}),
      likesCount: json['likesCount'] ?? 0,
      commentsCount: json['commentsCount'] ?? 0,
      likes: (json['likes'] as List? ?? [])
          .map((like) => PostLike.fromJson(like))
          .toList(),
      comments: (json['comments'] as List? ?? [])
          .map((comment) => PostComment.fromJson(comment))
          .toList(),
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
      updatedAt: DateTime.parse(
        json['updatedAt'] ?? DateTime.now().toIso8601String(),
      ),
      isLikedByCurrentUser: json['isLikedByCurrentUser'] ?? false,
      imageUrl: json['imageUrl'] ?? json['thumbnail'] ?? json['image'] ?? null,
    );
  }
}

class PostStage {
  final String id;
  final String name;

  PostStage({required this.id, required this.name});

  factory PostStage.fromJson(Map<String, dynamic> json) {
    return PostStage(id: json['id'] ?? '', name: json['name'] ?? '');
  }
}

class PostSubject {
  final String id;
  final String name;

  PostSubject({required this.id, required this.name});

  factory PostSubject.fromJson(Map<String, dynamic> json) {
    return PostSubject(id: json['id'] ?? '', name: json['name'] ?? '');
  }
}

class PostTeacher {
  final String id;
  final String name;

  PostTeacher({required this.id, required this.name});

  factory PostTeacher.fromJson(Map<String, dynamic> json) {
    return PostTeacher(id: json['id'] ?? '', name: json['name'] ?? '');
  }
}

class PostUser {
  final String id;
  final String name;
  final String type; // 'teacher' or 'student'

  PostUser({required this.id, required this.name, required this.type});

  factory PostUser.fromJson(Map<String, dynamic> json) {
    return PostUser(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      type: json['type'] ?? 'teacher',
    );
  }
}

class PostLike {
  final String id;
  final PostUser user;
  final DateTime createdAt;

  PostLike({required this.id, required this.user, required this.createdAt});

  factory PostLike.fromJson(Map<String, dynamic> json) {
    return PostLike(
      id: json['id'] ?? '',
      user: PostUser.fromJson(json['user'] ?? {}),
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }
}

class PostComment {
  final String id;
  final String content;
  final PostUser user;
  final DateTime createdAt;

  PostComment({
    required this.id,
    required this.content,
    required this.user,
    required this.createdAt,
  });

  factory PostComment.fromJson(Map<String, dynamic> json) {
    return PostComment(
      id: json['id'] ?? '',
      content: json['content'] ?? '',
      user: PostUser.fromJson(json['user'] ?? {}),
      createdAt: DateTime.parse(
        json['createdAt'] ?? DateTime.now().toIso8601String(),
      ),
    );
  }
}

class Subject {
  final String id;
  final String name;
  final int postCount;
  final PostTeacher? primaryTeacher;
  final TeacherPost? latestPost;

  Subject({
    required this.id,
    required this.name,
    required this.postCount,
    this.primaryTeacher,
    this.latestPost,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      postCount: json['postCount'] ?? 0,
      primaryTeacher: json['primaryTeacher'] != null
          ? PostTeacher.fromJson(json['primaryTeacher'])
          : null,
      latestPost: json['latestPost'] != null
          ? TeacherPost.fromJson(json['latestPost'])
          : null,
    );
  }
}
