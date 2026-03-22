class TeacherPost {
  final String id;
  final String title;
  final String content;
  final PostStage stage;
  final PostSubject subject;
  final PostTeacher teacher;
  final int likesCount;
  final int commentsCount;
  final bool isLikedByMe;
  final List<PostLike> likes;
  final List<PostComment> comments;
  final DateTime createdAt;
  final DateTime updatedAt;

  TeacherPost({
    required this.id,
    required this.title,
    required this.content,
    required this.stage,
    required this.subject,
    required this.teacher,
    required this.likesCount,
    required this.commentsCount,
    required this.isLikedByMe,
    required this.likes,
    required this.comments,
    required this.createdAt,
    required this.updatedAt,
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
      isLikedByMe: json['isLikedByMe'] ?? false,
      likes: (json['likes'] as List? ?? [])
          .map((like) => PostLike.fromJson(like ?? {}))
          .toList(),
      comments: (json['comments'] as List? ?? [])
          .map((comment) => PostComment.fromJson(comment ?? {}))
          .toList(),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      updatedAt: DateTime.parse(json['updatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'content': content,
      'stage': stage.toJson(),
      'subject': subject.toJson(),
      'teacher': teacher.toJson(),
      'likesCount': likesCount,
      'commentsCount': commentsCount,
      'isLikedByMe': isLikedByMe,
      'likes': likes.map((like) => like.toJson()).toList(),
      'comments': comments.map((comment) => comment.toJson()).toList(),
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}

class PostStage {
  final String id;
  final String name;

  PostStage({
    required this.id,
    required this.name,
  });

  factory PostStage.fromJson(Map<String, dynamic> json) {
    return PostStage(
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

class PostSubject {
  final String id;
  final String name;

  PostSubject({
    required this.id,
    required this.name,
  });

  factory PostSubject.fromJson(Map<String, dynamic> json) {
    return PostSubject(
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

class PostTeacher {
  final String id;
  final String name;

  PostTeacher({
    required this.id,
    required this.name,
  });

  factory PostTeacher.fromJson(Map<String, dynamic> json) {
    return PostTeacher(
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

class PostUser {
  final String id;
  final String name;
  final String type; // 'teacher', 'student', or 'unknown'

  PostUser({
    required this.id,
    required this.name,
    required this.type,
  });

  factory PostUser.fromJson(Map<String, dynamic> json) {
    return PostUser(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Unknown',
      type: json['type'] ?? 'unknown',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
    };
  }
}

class PostLike {
  final String id;
  final PostUser user;
  final DateTime createdAt;

  PostLike({
    required this.id,
    required this.user,
    required this.createdAt,
  });

  factory PostLike.fromJson(Map<String, dynamic> json) {
    return PostLike(
      id: json['id'] ?? '',
      user: PostUser.fromJson(json['user'] ?? {}),
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user': user.toJson(),
      'createdAt': createdAt.toIso8601String(),
    };
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
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'user': user.toJson(),
      'createdAt': createdAt.toIso8601String(),
    };
  }
}

class PostPagination {
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasNext;
  final bool hasPrev;

  PostPagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasNext,
    required this.hasPrev,
  });

  factory PostPagination.fromJson(Map<String, dynamic> json) {
    return PostPagination(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 10,
      total: json['total'] ?? 0,
      totalPages: json['totalPages'] ?? 0,
      hasNext: json['hasNext'] ?? false,
      hasPrev: json['hasPrev'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'page': page,
      'limit': limit,
      'total': total,
      'totalPages': totalPages,
      'hasNext': hasNext,
      'hasPrev': hasPrev,
    };
  }
}

class PostsResponse {
  final List<TeacherPost> posts;
  final PostPagination pagination;

  PostsResponse({
    required this.posts,
    required this.pagination,
  });

  factory PostsResponse.fromJson(Map<String, dynamic> json) {
    return PostsResponse(
      posts: (json['posts'] as List? ?? [])
          .map((post) => TeacherPost.fromJson(post ?? {}))
          .toList(),
      pagination: PostPagination.fromJson(json['pagination'] ?? {}),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'posts': posts.map((post) => post.toJson()).toList(),
      'pagination': pagination.toJson(),
    };
  }
} 