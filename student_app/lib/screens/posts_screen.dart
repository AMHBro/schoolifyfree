import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../models/post.dart';
import '../services/api_service.dart';
import '../widgets/schoolify_app_bar.dart';
import '../widgets/linkified_text.dart';
import '../theme/design_system.dart';

class PostsScreen extends StatefulWidget {
  const PostsScreen({super.key});

  @override
  State<PostsScreen> createState() => _PostsScreenState();
}

class _PostsScreenState extends State<PostsScreen> {
  List<Subject> _subjects = [];
  List<TeacherPost> _posts = [];
  Subject? _selectedSubject;
  bool _isLoadingSubjects = false;
  bool _isLoadingPosts = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSubjects();
  }

  Future<void> _loadSubjects() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) {
      setState(() {
        _subjects = [];
        _error = null;
      });
      return;
    }

    setState(() {
      _isLoadingSubjects = true;
      _error = null;
    });

    try {
      final response = await ApiService.getSubjects(authProvider.token!);

      // debug log removed

      if (response['success']) {
        final data = response['data'];
        // debug log removed

        if (data != null && data['subjects'] != null) {
          setState(() {
            _subjects = (data['subjects'] as List)
                .where((subject) => subject != null) // Filter out null subjects
                .map((subject) {
                  // debug log removed
                  try {
                    return Subject.fromJson(subject as Map<String, dynamic>);
                  } catch (e) {
                    // debug log removed
                    return null;
                  }
                })
                .where(
                  (subject) => subject != null,
                ) // Filter out failed parsing
                .cast<Subject>()
                .toList();
            _isLoadingSubjects = false;
          });
        } else {
          setState(() {
            _error = 'No subjects data received';
            _isLoadingSubjects = false;
          });
        }
      } else {
        setState(() {
          _error = response['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (response['message'] ?? context.tr('posts.error_occurred'));
          _isLoadingSubjects = false;
        });
      }
    } catch (e) {
      // debug log removed
      setState(() {
        _error = context.tr('common.offline_message');
        _isLoadingSubjects = false;
      });
    }
  }

  Future<void> _loadPostsForSubject(Subject subject) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;

    setState(() {
      _selectedSubject = subject;
      _isLoadingPosts = true;
      _posts = [];
      _error = null;
    });

    try {
      final response = await ApiService.getPostsForSubject(
        authProvider.token!,
        subject.id,
      );

      if (response['success']) {
        final data = response['data'];
        setState(() {
          _posts = (data['posts'] as List)
              .map((post) => TeacherPost.fromJson(post))
              .toList();
          _isLoadingPosts = false;
        });
      } else {
        setState(() {
          _error = response['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (response['message'] ?? context.tr('posts.failed_load_posts'));
          _isLoadingPosts = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = context.tr('common.offline_message');
        _isLoadingPosts = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: SchoolifyAppBar(
        showBack: _selectedSubject != null,
        onBack: () {
          setState(() {
            _selectedSubject = null;
            _posts = [];
          });
        },
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          if (_selectedSubject != null) {
            await _loadPostsForSubject(_selectedSubject!);
          } else {
            await _loadSubjects();
          }
        },
        child: _selectedSubject == null
            ? _buildSubjectsView()
            : _buildPostsView(),
      ),
    );
  }

  Widget _buildSubjectsView() {
    final token = Provider.of<AuthProvider>(context, listen: false).token;
    if (token == null) {
      return _guestPlaceholder(
        icon: LineAwesomeIcons.chalkboard_teacher_solid,
        title: context.tr('guest.posts_title'),
        message: context.tr('guest.posts_message'),
      );
    }
    if (_isLoadingSubjects) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(strokeWidth: 3),
            const SizedBox(height: 16),
            Text(
              context.tr('posts.loading_subjects'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(DSSpacing.containerPadding),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: DSColors.white,
                  shape: BoxShape.circle,
                  boxShadow: [DSShadows.card],
                ),
                child: const Icon(
                  LineAwesomeIcons.exclamation_circle_solid,
                  size: 48,
                  color: DSColors.error,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                context.tr('posts.error_occurred'),
                style: DSTypography.h3.copyWith(color: DSColors.error),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: DSTypography.body.copyWith(color: DSColors.darkGray),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: _loadSubjects,
                icon: const Icon(LineAwesomeIcons.sync_solid),
                label: Text(context.tr('posts.try_again')),
              ),
            ],
          ),
        ),
      );
    }

    if (_subjects.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: DSColors.white,
                shape: BoxShape.circle,
                boxShadow: [DSShadows.card],
              ),
              child: const Icon(
                LineAwesomeIcons.book_open_solid,
                size: 48,
                color: DSColors.darkGray,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              context.tr('posts.no_subjects'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('posts.contact_admin'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.all(DSSpacing.containerPadding),
          sliver: SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: DSColors.white,
                    borderRadius: BorderRadius.circular(DSRadii.large),
                    boxShadow: const [DSShadows.card],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: DSColors.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          LineAwesomeIcons.book_reader_solid,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              context.tr('posts.your_subjects'),
                              style: DSTypography.h2.copyWith(
                                color: DSColors.charcoal,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              context.tr('posts.tap_subject_hint'),
                              style: DSTypography.body.copyWith(
                                color: DSColors.darkGray,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: DSColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          '${_subjects.length}',
                          style: DSTypography.body.copyWith(
                            fontWeight: FontWeight.bold,
                            color: DSColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: DSSpacing.sectionSpacing / 2),
              ],
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.symmetric(
            horizontal: DSSpacing.containerPadding,
          ),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              final subject = _subjects[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _buildSubjectCard(subject, index),
              );
            }, childCount: _subjects.length),
          ),
        ),
        const SliverPadding(
          padding: EdgeInsets.only(bottom: DSSpacing.containerPadding),
        ),
      ],
    );
  }

  Widget _guestPlaceholder({
    required IconData icon,
    required String title,
    required String message,
  }) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(DSSpacing.containerPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: DSColors.white,
                shape: BoxShape.circle,
                boxShadow: [DSShadows.card],
              ),
              child: Icon(icon, size: 48, color: DSColors.primary),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              textAlign: TextAlign.center,
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => Navigator.of(context).pushNamed('/login'),
              child: Text(context.tr('common.login')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectCard(Subject subject, int index) {
    final baseColor = _getSubjectColor(subject.name);

    // Check if there's an unseen post (for demo, we'll show indicator if there are posts)
    final hasUnseenPost = subject.latestPost != null && subject.postCount > 0;

    return GestureDetector(
      onTap: () => _loadPostsForSubject(subject),
      child: Container(
        decoration: BoxDecoration(
          color: DSColors.white,
          borderRadius: BorderRadius.circular(DSRadii.large),
          boxShadow: const [DSShadows.card],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(DSRadii.large),
          child: Stack(
            children: [
              // Background gradient
              Container(color: baseColor.withValues(alpha: 0.04)),

              // Content
              Padding(
                padding: const EdgeInsets.all(16), // Reduced from 20 to 16
                child: Row(
                  children: [
                    // Subject icon
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: baseColor,
                        borderRadius: BorderRadius.circular(14),
                        boxShadow: const [DSShadows.nano],
                      ),
                      child: const Icon(
                        LineAwesomeIcons.book_solid,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),

                    const SizedBox(width: 14),
                    // Subject info
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  subject.name,
                                  style: DSTypography.h3.copyWith(
                                    color: DSColors.charcoal,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (hasUnseenPost)
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: DSColors.error,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                            ],
                          ),

                          const SizedBox(height: 6),
                          // Teacher info and post count in one row to save space
                          Row(
                            children: [
                              if (subject.primaryTeacher != null) ...[
                                const Icon(
                                  LineAwesomeIcons.user_solid,
                                  size: 14,
                                  color: DSColors.darkGray,
                                ),
                                const SizedBox(width: 4), // Reduced from 6 to 4
                                Expanded(
                                  child: Text(
                                    subject.primaryTeacher!.name,
                                    style: DSTypography.caption.copyWith(
                                      color: DSColors.darkGray,
                                      fontWeight: FontWeight.w500,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8),
                              ],
                              const Icon(
                                LineAwesomeIcons.file_alt_solid,
                                size: 14,
                                color: DSColors.darkGray,
                              ),
                              const SizedBox(width: 4), // Reduced from 6 to 4
                              Text(
                                '${subject.postCount}',
                                style: DSTypography.caption.copyWith(
                                  color: DSColors.darkGray,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Arrow
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: baseColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: _directionalIcon(
                        LineAwesomeIcons.angle_right_solid,
                        size: 14,
                        color: baseColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPostsView() {
    if (_isLoadingPosts) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(strokeWidth: 3),
            const SizedBox(height: 16),
            Text(
              context.tr('posts.loading_posts'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(DSSpacing.containerPadding),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: DSColors.white,
                  shape: BoxShape.circle,
                  boxShadow: [DSShadows.card],
                ),
                child: const Icon(
                  LineAwesomeIcons.exclamation_circle_solid,
                  size: 48,
                  color: DSColors.error,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                context.tr('posts.failed_load_posts'),
                style: DSTypography.h3.copyWith(color: DSColors.error),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: DSTypography.body.copyWith(color: DSColors.darkGray),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton.icon(
                onPressed: () => _loadPostsForSubject(_selectedSubject!),
                icon: const Icon(LineAwesomeIcons.sync_solid),
                label: Text(context.tr('posts.try_again')),
              ),
            ],
          ),
        ),
      );
    }

    if (_posts.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: DSColors.white,
                shape: BoxShape.circle,
                boxShadow: [DSShadows.card],
              ),
              child: const Icon(
                LineAwesomeIcons.stream_solid,
                size: 48,
                color: DSColors.darkGray,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              context.tr('posts.no_posts_yet'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context
                  .tr('posts.no_posts_for_subject')
                  .replaceFirst('{0}', _selectedSubject!.name),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return CustomScrollView(
      slivers: [
        // Header
        SliverToBoxAdapter(
          child: Container(
            margin: const EdgeInsets.all(DSSpacing.containerPadding),
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: DSColors.white,
              borderRadius: BorderRadius.circular(DSRadii.large),
              boxShadow: const [DSShadows.card],
            ),
            child: Row(
              children: [
                // inline back was removed; header is purely descriptive now
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: DSColors.primary,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    LineAwesomeIcons.comments_solid,
                    color: Colors.white,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_selectedSubject!.name} ${context.tr('posts.posts_header')}',
                        style: DSTypography.h3.copyWith(
                          color: DSColors.charcoal,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${_posts.length} ${_posts.length == 1 ? context.tr('posts.post_singular') : context.tr('posts.posts_plural')} ${context.tr('posts.available')}',
                        style: DSTypography.body.copyWith(
                          color: DSColors.darkGray,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: DSColors.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    context.tr('posts.latest'),
                    style: DSTypography.caption.copyWith(
                      fontWeight: FontWeight.bold,
                      color: DSColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),

        // Posts
        SliverPadding(
          padding: const EdgeInsets.symmetric(
            horizontal: DSSpacing.containerPadding,
          ),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate((context, index) {
              final post = _posts[index];
              return _buildPostCard(post);
            }, childCount: _posts.length),
          ),
        ),

        const SliverPadding(
          padding: EdgeInsets.only(bottom: DSSpacing.containerPadding),
        ),
      ],
    );
  }

  Widget _buildPostCard(TeacherPost post) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(DSRadii.large),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with teacher info
            Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(color: DSColors.white),
              child: Row(
                children: [
                  // Teacher avatar
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: DSColors.primary,
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: const [DSShadows.micro],
                    ),
                    child: Center(
                      child: Text(
                        post.teacher.name[0].toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(width: 16),

                  // Teacher info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.teacher.name,
                          style: DSTypography.h3.copyWith(
                            fontSize: 16,
                            color: DSColors.charcoal,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(
                              LineAwesomeIcons.clock_solid,
                              size: 14,
                              color: DSColors.darkGray,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _formatDate(post.createdAt),
                              style: DSTypography.caption.copyWith(
                                color: DSColors.darkGray,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Subject badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: DSColors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: DSColors.mediumGray, width: 1),
                    ),
                    child: Text(
                      post.subject.name,
                      style: DSTypography.caption.copyWith(
                        fontWeight: FontWeight.bold,
                        color: DSColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Post content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Post title
                  if (post.title.isNotEmpty && post.title.trim().isNotEmpty)
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.title,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF2D3748),
                            height: 1.3,
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],
                    ),

                  // Post content
                  LinkifiedText(
                    text: post.content,
                    style: DSTypography.body.copyWith(
                      fontSize: 15,
                      height: 1.6,
                      color: DSColors.charcoal,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Engagement stats
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: DSColors.lightGray,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: DSColors.mediumGray, width: 1),
                    ),
                    child: Row(
                      children: [
                        // Likes
                        Expanded(
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: DSColors.error.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  LineAwesomeIcons.heart_solid,
                                  size: 16,
                                  color: DSColors.error,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${post.likesCount}',
                                style: DSTypography.body.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: DSColors.charcoal,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                post.likesCount == 1
                                    ? context.tr('posts.like_singular')
                                    : context.tr('posts.likes_plural'),
                                style: DSTypography.caption.copyWith(
                                  color: DSColors.darkGray,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Divider
                        Container(
                          width: 1,
                          height: 24,
                          color: DSColors.mediumGray,
                        ),

                        // Comments
                        Expanded(
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                post.commentsCount == 1
                                    ? context.tr('posts.comment_singular')
                                    : context.tr('posts.comments_plural'),
                                style: DSTypography.caption.copyWith(
                                  color: DSColors.darkGray,
                                ),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                '${post.commentsCount}',
                                style: DSTypography.body.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: DSColors.charcoal,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: DSColors.primary.withValues(
                                    alpha: 0.12,
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Icon(
                                  LineAwesomeIcons.comments_solid,
                                  size: 16,
                                  color: DSColors.primary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Action buttons
                  Row(
                    children: [
                      // Like button
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _toggleLike(post),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: post.isLikedByCurrentUser
                                  ? DSColors.error.withValues(alpha: 0.06)
                                  : DSColors.lightGray,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: post.isLikedByCurrentUser
                                    ? DSColors.error.withValues(alpha: 0.3)
                                    : DSColors.mediumGray,
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  post.isLikedByCurrentUser
                                      ? LineAwesomeIcons.heart_solid
                                      : LineAwesomeIcons.heart,
                                  size: 18,
                                  color: post.isLikedByCurrentUser
                                      ? DSColors.error
                                      : DSColors.darkGray,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  context.tr('posts.like_button'),
                                  style: DSTypography.body.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: post.isLikedByCurrentUser
                                        ? DSColors.error
                                        : DSColors.darkGray,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(width: 8),

                      // View Comments button
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _showCommentsDialog(post),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: DSColors.success.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: DSColors.success.withValues(alpha: 0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  LineAwesomeIcons.eye_solid,
                                  size: 18,
                                  color: DSColors.success,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  context.tr('posts.view_button'),
                                  style: DSTypography.body.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: DSColors.success,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),

                      const SizedBox(width: 8),

                      // Comment button
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _showCommentDialog(post),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              color: DSColors.primary.withValues(alpha: 0.06),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: DSColors.primary.withValues(alpha: 0.3),
                                width: 1,
                              ),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(
                                  LineAwesomeIcons.comment_dots_solid,
                                  size: 18,
                                  color: DSColors.primary,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  context.tr('posts.comment_button'),
                                  style: DSTypography.body.copyWith(
                                    fontWeight: FontWeight.w600,
                                    color: DSColors.primary,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return context
          .tr('posts.time_days_ago')
          .replaceFirst('{0}', difference.inDays.toString());
    } else if (difference.inHours > 0) {
      return context
          .tr('posts.time_hours_ago')
          .replaceFirst('{0}', difference.inHours.toString());
    } else if (difference.inMinutes > 0) {
      return context
          .tr('posts.time_minutes_ago')
          .replaceFirst('{0}', difference.inMinutes.toString());
    } else {
      return context.tr('posts.time_just_now');
    }
  }

  Future<void> _toggleLike(TeacherPost post) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;
      if (token == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('posts.login_to_like')),
            backgroundColor: DSColors.error,
          ),
        );
        return;
      }

      final response = await ApiService.togglePostLike(token, post.id);

      if (response['success']) {
        // Update UI immediately for better UX
        final wasLiked = post.isLikedByCurrentUser;
        setState(() {
          post.isLikedByCurrentUser = !post.isLikedByCurrentUser;
          if (post.isLikedByCurrentUser) {
            post.likesCount++;
          } else {
            post.likesCount--;
          }
        });

        // Refresh the posts to get updated data from server
        if (_selectedSubject != null) {
          _loadPostsForSubject(_selectedSubject!);
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              !wasLiked
                  ? context.tr('posts.post_liked')
                  : context.tr('posts.post_unliked'),
            ),
            backgroundColor: !wasLiked ? DSColors.success : DSColors.darkGray,
            duration: const Duration(seconds: 1),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response['message'] ?? context.tr('posts.failed_toggle_like'),
            ),
            backgroundColor: DSColors.error,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('common.error')),
          backgroundColor: DSColors.error,
        ),
      );
    }
  }

  void _showCommentDialog(TeacherPost post) {
    final TextEditingController commentController = TextEditingController();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: Row(
            children: [
              const Icon(
                LineAwesomeIcons.comment_dots_solid,
                color: DSColors.primary,
              ),
              const SizedBox(width: 8),
              Text(context.tr('posts.add_comment'), style: DSTypography.h3),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                context
                    .tr('posts.comment_on')
                    .replaceFirst(
                      '{0}',
                      post.title.isNotEmpty
                          ? post.title
                          : context.tr('posts.this_post'),
                    ),
                style: DSTypography.body.copyWith(color: DSColors.darkGray),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: commentController,
                maxLines: 3,
                decoration: InputDecoration(
                  hintText: context.tr('posts.write_comment'),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: DSColors.mediumGray),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: const BorderSide(color: DSColors.primary),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text(
                context.tr('posts.cancel'),
                style: DSTypography.body.copyWith(color: DSColors.darkGray),
              ),
            ),
            FilledButton(
              onPressed: () {
                if (commentController.text.trim().isNotEmpty) {
                  _addComment(post, commentController.text.trim());
                  Navigator.of(context).pop();
                }
              },
              child: Text(context.tr('posts.post_comment')),
            ),
          ],
        );
      },
    );
  }

  Future<void> _addComment(TeacherPost post, String content) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;
      if (token == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('posts.login_to_comment')),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      final response = await ApiService.addComment(token, post.id, content);

      if (response['success']) {
        // Refresh the posts to get updated comments
        if (_selectedSubject != null) {
          await _loadPostsForSubject(_selectedSubject!);
        }

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('posts.comment_added')),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response['message'] ?? context.tr('posts.failed_add_comment'),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('common.error')),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showCommentsDialog(TeacherPost post) {
    final textDirection = Directionality.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      backgroundColor: Colors.transparent,
      builder: (sheetCtx) {
        return Directionality(
          textDirection: textDirection,
          child: DraggableScrollableSheet(
            initialChildSize: 0.8,
            minChildSize: 0.5,
            maxChildSize: 0.95,
            expand: false,
            builder: (context, scrollController) {
              return Container(
                decoration: const BoxDecoration(
                  color: DSColors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(20),
                    topRight: Radius.circular(20),
                  ),
                  boxShadow: [DSShadows.card],
                ),
                child: SafeArea(
                  top: false,
                  child: Column(
                    children: [
                      const SizedBox(height: 8),
                      Container(
                        width: 36,
                        height: 4,
                        decoration: BoxDecoration(
                          color: DSColors.mediumGray,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
                        child: Row(
                          children: [
                            const Icon(
                              LineAwesomeIcons.comments_solid,
                              color: DSColors.primary,
                              size: 22,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    context.tr('posts.comments_title'),
                                    style: DSTypography.h3.copyWith(
                                      color: DSColors.charcoal,
                                    ),
                                  ),
                                  Text(
                                    '${post.commentsCount} ${post.commentsCount == 1 ? context.tr('posts.comment_singular') : context.tr('posts.comments_plural')}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: DSTypography.caption.copyWith(
                                      color: DSColors.darkGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              tooltip: context.tr('common.close'),
                              onPressed: () => Navigator.of(sheetCtx).pop(),
                              icon: const Icon(
                                LineAwesomeIcons.times_solid,
                                color: DSColors.darkGray,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Post preview
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: DSColors.lightGray,
                          border: Border(
                            bottom: BorderSide(
                              color: DSColors.mediumGray,
                              width: 1,
                            ),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: DSColors.primary,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Center(
                                child: Text(
                                  post.teacher.name[0].toUpperCase(),
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    post.title.isNotEmpty
                                        ? post.title
                                        : context
                                              .tr('posts.post_by')
                                              .replaceFirst(
                                                '{0}',
                                                post.teacher.name,
                                              ),
                                    style: DSTypography.h3.copyWith(
                                      fontSize: 14,
                                      color: DSColors.charcoal,
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    post.teacher.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: DSTypography.caption.copyWith(
                                      color: DSColors.darkGray,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: post.comments.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.chat_bubble_outline,
                                      size: 48,
                                      color: Colors.grey.shade400,
                                    ),
                                    const SizedBox(height: 16),
                                    Text(
                                      context.tr('posts.no_comments'),
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.grey.shade600,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      context.tr('posts.first_comment'),
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Colors.grey.shade500,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                controller: scrollController,
                                padding: const EdgeInsets.all(16),
                                itemCount: post.comments.length,
                                itemBuilder: (context, index) {
                                  final comment = post.comments[index];
                                  return _buildCommentItem(comment);
                                },
                              ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: DSColors.white,
                          border: Border(
                            top: BorderSide(
                              color: DSColors.mediumGray,
                              width: 1,
                            ),
                          ),
                        ),
                        child: SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () {
                              Navigator.of(sheetCtx).pop();
                              _showCommentDialog(post);
                            },
                            icon: const Icon(
                              LineAwesomeIcons.comment_dots_solid,
                            ),
                            label: Text(context.tr('posts.add_comment')),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildCommentItem(PostComment comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: DSColors.mediumGray, width: 1),
        boxShadow: const [DSShadows.nano],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Comment header
          Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: comment.user.type == 'teacher'
                      ? DSColors.primary
                      : DSColors.success,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Center(
                  child: Text(
                    comment.user.name[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            comment.user.name,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: DSTypography.h3.copyWith(
                              fontSize: 14,
                              color: DSColors.charcoal,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color:
                                (comment.user.type == 'teacher'
                                        ? DSColors.primary
                                        : DSColors.success)
                                    .withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            comment.user.type == 'teacher'
                                ? context.tr('posts.teacher')
                                : context.tr('posts.student'),
                            style: DSTypography.caption.copyWith(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: comment.user.type == 'teacher'
                                  ? DSColors.primary
                                  : DSColors.success,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      _formatDate(comment.createdAt),
                      style: DSTypography.caption.copyWith(
                        color: DSColors.darkGray,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Comment content
          Text(
            comment.content,
            style: DSTypography.body.copyWith(
              height: 1.5,
              color: DSColors.charcoal,
            ),
          ),
        ],
      ),
    );
  }

  Color _getSubjectColor(String subjectName) {
    final palette = DSColors.subjectPalette;
    final index = subjectName.hashCode % palette.length;
    return palette[index.abs()];
  }

  Widget _directionalIcon(IconData icon, {double size = 14, Color? color}) {
    final bool isRtl = Directionality.of(context) == TextDirection.rtl;
    return Transform(
      alignment: Alignment.center,
      transform: isRtl ? Matrix4.rotationY(math.pi) : Matrix4.identity(),
      child: Icon(icon, size: size, color: color),
    );
  }
}
