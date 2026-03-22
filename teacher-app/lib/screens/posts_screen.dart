import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/app_bar_logo_title.dart';
import '../widgets/rounded_icon_action.dart';
import '../theme/design_system.dart';
import 'chats_screen.dart';
import 'settings_screen.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import 'create_post_screen.dart';
import 'login_screen.dart';
import '../widgets/linkified_text.dart';

class PostsScreen extends StatefulWidget {
  const PostsScreen({super.key});

  @override
  State<PostsScreen> createState() => _PostsScreenState();
}

class _PostsScreenState extends State<PostsScreen>
    with TickerProviderStateMixin {
  List<TeacherPost> _posts = [];
  bool _isLoading = true;
  String? _errorMessage;
  int _currentPage = 1;
  bool _hasMorePosts = true;
  final ScrollController _scrollController = ScrollController();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  Map<String, bool> _expandedComments = {};
  Map<String, TextEditingController> _commentControllers = {};
  Map<String, bool> _isAddingComment = {};

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _loadPosts();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _animationController.dispose();
    for (var controller in _commentControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  String _offlineMessageIfNetwork(Object e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('socketexception') ||
        msg.contains('failed host lookup') ||
        msg.contains('clientexception') ||
        msg.contains('network')) {
      return context.tr('common.offline_message');
    }
    return context.tr('common.offline_message');
  }

  void _onScroll() {
    if (_scrollController.position.pixels ==
        _scrollController.position.maxScrollExtent) {
      if (_hasMorePosts && !_isLoading) {
        _loadMorePosts();
      }
    }
  }

  Future<void> _loadPosts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) {
      setState(() {
        _isLoading = false;
        _posts = [];
        _errorMessage = null;
      });
      return;
    }

    try {
      final response = await ApiService.getPosts(
        authProvider.token!,
        page: 1,
        limit: 10,
      );

      if (response['success']) {
        final postsResponse = response['data'] as PostsResponse;
        setState(() {
          _posts = postsResponse.posts;
          _currentPage = 1;
          _hasMorePosts = postsResponse.pagination.hasNext;
          _isLoading = false;
        });
        _animationController.forward();
      } else {
        setState(() {
          final offline =
              response['code'] == 'NETWORK_OFFLINE' ||
              (response['message'] ?? '').toString().toUpperCase().contains(
                'NETWORK_OFFLINE',
              );
          _errorMessage = offline
              ? context.tr('common.offline_message')
              : (response['message'] ?? context.tr('posts.error'));
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _errorMessage = context.tr('common.offline_message');
        _isLoading = false;
      });
    }
  }

  Future<void> _loadMorePosts() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;

    try {
      final response = await ApiService.getPosts(
        authProvider.token!,
        page: _currentPage + 1,
        limit: 10,
      );

      if (response['success']) {
        final postsResponse = response['data'] as PostsResponse;
        setState(() {
          _posts.addAll(postsResponse.posts);
          _currentPage++;
          _hasMorePosts = postsResponse.pagination.hasNext;
        });
      }
    } catch (e) {
      // Handle error silently for pagination
    }
  }

  Future<void> _toggleLike(String postId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;

    try {
      final response = await ApiService.togglePostLike(
        authProvider.token!,
        postId,
      );

      if (response['success']) {
        setState(() {
          final postIndex = _posts.indexWhere((post) => post.id == postId);
          if (postIndex != -1) {
            final post = _posts[postIndex];
            final isLiked = response['data']['isLiked'] as bool;

            _posts[postIndex] = TeacherPost(
              id: post.id,
              title: post.title,
              content: post.content,
              stage: post.stage,
              subject: post.subject,
              teacher: post.teacher,
              likesCount: isLiked ? post.likesCount + 1 : post.likesCount - 1,
              commentsCount: post.commentsCount,
              isLikedByMe: isLiked,
              likes: post.likes,
              comments: post.comments,
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            );
          }
        });
      }
    } catch (e) {
      // Handle error silently
    }
  }

  Future<void> _addComment(String postId, String content) async {
    if (content.trim().isEmpty) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;

    setState(() {
      _isAddingComment[postId] = true;
    });

    try {
      final response = await ApiService.addComment(
        token: authProvider.token!,
        postId: postId,
        content: content.trim(),
      );

      if (response['success']) {
        setState(() {
          final postIndex = _posts.indexWhere((post) => post.id == postId);
          if (postIndex != -1) {
            final post = _posts[postIndex];
            final newComment = response['data'] as PostComment;

            _posts[postIndex] = TeacherPost(
              id: post.id,
              title: post.title,
              content: post.content,
              stage: post.stage,
              subject: post.subject,
              teacher: post.teacher,
              likesCount: post.likesCount,
              commentsCount: post.commentsCount + 1,
              isLikedByMe: post.isLikedByMe,
              likes: post.likes,
              comments: [...post.comments, newComment],
              createdAt: post.createdAt,
              updatedAt: post.updatedAt,
            );
          }
          _commentControllers[postId]?.clear();
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('posts.comment_added')),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response['message'] ?? context.tr('posts.failed_add_comment'),
            ),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('common.offline_message')),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
      );
    } finally {
      setState(() {
        _isAddingComment[postId] = false;
      });
    }
  }

  void _toggleComments(String postId) {
    setState(() {
      _expandedComments[postId] = !(_expandedComments[postId] ?? false);
      if (!_commentControllers.containsKey(postId)) {
        _commentControllers[postId] = TextEditingController();
      }
    });
  }

  Future<void> _showCreatePostDialog() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.teacher == null) return;

    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreatePostScreen(teacher: authProvider.teacher!),
      ),
    );

    if (result == true) {
      _loadPosts();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DSColors.lightGray,
      body: RefreshIndicator(
        onRefresh: _loadPosts,
        child: CustomScrollView(
          controller: _scrollController,
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverAppBar(
              expandedHeight: 56,
              pinned: true,
              elevation: 0,
              backgroundColor: DSColors.white,
              automaticallyImplyLeading: false,
              titleSpacing: 16,
              toolbarHeight: 56,
              title: const AppBarLogoTitle(),
              actions: [
                RoundedIconAction(
                  tooltip: context.tr('navigation.chats'),
                  icon: const Icon(
                    LineAwesomeIcons.comment_alt_solid,
                    size: 22,
                  ),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ChatsScreen()),
                    );
                  },
                ),
                const SizedBox(width: 6),
                Padding(
                  padding: const EdgeInsetsDirectional.only(end: 8),
                  child: RoundedIconAction(
                    tooltip: context.tr('settings.title'),
                    icon: const Icon(LineAwesomeIcons.user_solid, size: 22),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const SettingsScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
            SliverToBoxAdapter(child: _buildBody()),
          ],
        ),
      ),
      floatingActionButton: Provider.of<AuthProvider>(context).token == null
          ? null
          : FloatingActionButton(
              onPressed: _showCreatePostDialog,
              backgroundColor: DSColors.primary,
              elevation: 4,
              child: const Icon(Icons.add, color: DSColors.white, size: 28),
            ),
    );
  }

  Widget _buildBody() {
    final token = Provider.of<AuthProvider>(context).token;
    if (token == null) {
      return _buildGuestPlaceholder(
        title: context.tr('guest.posts_title', fallback: 'Posts'),
        message: context.tr(
          'guest.posts_message',
          fallback: 'Login to view and create posts.',
        ),
      );
    }

    if (_isLoading && _posts.isEmpty) {
      return Container(
        height: MediaQuery.of(context).size.height * 0.6,
        child: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(DSColors.primary),
          ),
        ),
      );
    }

    if (_errorMessage != null && _posts.isEmpty) {
      return Container(
        height: MediaQuery.of(context).size.height * 0.6,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  Icons.error_outline,
                  size: 64,
                  color: Colors.red.shade400,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                context.tr('posts.oops_error'),
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade800,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _errorMessage!,
                style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loadPosts,
                style: ElevatedButton.styleFrom(
                  backgroundColor: DSColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                    vertical: 16,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(context.tr('posts.try_again')),
              ),
            ],
          ),
        ),
      );
    }

    if (_posts.isEmpty) {
      return Container(
        height: MediaQuery.of(context).size.height * 0.6,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: DSColors.primary.withOpacity(0.08),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(
                  Icons.post_add,
                  size: 80,
                  color: DSColors.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                context.tr('posts.no_posts'),
                style: DSTypography.h2.copyWith(color: DSColors.charcoal),
              ),
              const SizedBox(height: 8),
              Text(
                context.tr('posts.no_posts_subtitle'),
                style: DSTypography.body.copyWith(color: DSColors.darkGray),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _posts.length,
              itemBuilder: (context, index) {
                final post = _posts[index];
                return _buildPostCard(post, index);
              },
            ),
            if (_hasMorePosts)
              Container(
                margin: const EdgeInsets.all(16),
                child: const CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(DSColors.primary),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuestPlaceholder({
    required String title,
    required String message,
  }) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: DSColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.lock_outline,
                size: 80,
                color: DSColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: DSTypography.h2.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: DSColors.primary,
                foregroundColor: Colors.white,
              ),
              child: Text(context.tr('common.login', fallback: 'Login')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPostCard(TeacherPost post, int index) {
    final isExpanded = _expandedComments[post.id] ?? false;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundColor: DSColors.primary,
                  child: Text(
                    post.teacher.name.isNotEmpty
                        ? post.teacher.name[0].toUpperCase()
                        : 'T',
                    style: DSTypography.h3.copyWith(color: DSColors.white),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        post.teacher.name,
                        style: DSTypography.h3.copyWith(
                          color: DSColors.charcoal,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: DSColors.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: DSColors.primary.withOpacity(0.25),
                          ),
                        ),
                        child: Text(
                          '${post.stage.name} • ${post.subject.name}',
                          style: DSTypography.caption.copyWith(
                            color: DSColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                          overflow: TextOverflow.ellipsis,
                          maxLines: 1,
                        ),
                      ),
                    ],
                  ),
                ),
                Text(
                  _formatDate(post.createdAt),
                  style: DSTypography.caption.copyWith(
                    color: DSColors.darkGray,
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  post.title,
                  style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 2,
                ),
                const SizedBox(height: 12),
                LinkifiedText(
                  text: post.content,
                  style: DSTypography.body.copyWith(color: DSColors.charcoal),
                  maxLines: 10,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Actions
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            decoration: BoxDecoration(
              color: DSColors.lightGray,
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(20),
                bottomRight: Radius.circular(20),
              ),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    // Like button
                    GestureDetector(
                      onTap: () => _toggleLike(post.id),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: post.isLikedByMe
                              ? DSColors.error.withOpacity(0.08)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: post.isLikedByMe
                                ? DSColors.error.withOpacity(0.35)
                                : DSColors.mediumGray,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              post.isLikedByMe
                                  ? Icons.favorite
                                  : Icons.favorite_border,
                              color: post.isLikedByMe
                                  ? DSColors.error
                                  : DSColors.darkGray,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${post.likesCount}',
                              style: TextStyle(
                                color: post.isLikedByMe
                                    ? DSColors.error
                                    : DSColors.darkGray,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(width: 16),

                    // Comment button
                    GestureDetector(
                      onTap: () => _toggleComments(post.id),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: isExpanded
                              ? DSColors.primary.withOpacity(0.08)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isExpanded
                                ? DSColors.primary.withOpacity(0.35)
                                : DSColors.mediumGray,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.chat_bubble_outline,
                              color: isExpanded
                                  ? DSColors.primary
                                  : DSColors.darkGray,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${post.commentsCount}',
                              style: TextStyle(
                                color: isExpanded
                                    ? DSColors.primary
                                    : DSColors.darkGray,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),

                // Comments section
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeInOut,
                  height: isExpanded ? null : 0,
                  child: isExpanded
                      ? _buildCommentsSection(post)
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCommentsSection(TeacherPost post) {
    final controller = _commentControllers[post.id];
    final isAdding = _isAddingComment[post.id] ?? false;

    return Container(
      margin: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Add comment input
          Container(
            decoration: BoxDecoration(
              color: DSColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: DSColors.mediumGray),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    decoration: InputDecoration(
                      hintText: context.tr('posts.add_comment'),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (value) {
                      if (value.trim().isNotEmpty) {
                        _addComment(post.id, value);
                      }
                    },
                  ),
                ),
                if (isAdding)
                  Container(
                    padding: const EdgeInsets.all(12),
                    child: const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          DSColors.primary,
                        ),
                      ),
                    ),
                  )
                else
                  IconButton(
                    onPressed: () {
                      if (controller?.text.trim().isNotEmpty == true) {
                        _addComment(post.id, controller!.text);
                      }
                    },
                    icon: const Icon(Icons.send, color: DSColors.primary),
                  ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // Comments list
          if (post.comments.isNotEmpty) ...[
            Text(
              context.tr(
                'posts.comments',
                params: {'count': post.comments.length.toString()},
              ),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 12),
            // Limit the height of comments section to prevent overflow
            ConstrainedBox(
              constraints: const BoxConstraints(
                maxHeight: 300, // Maximum height for comments section
              ),
              child: SingleChildScrollView(
                child: Column(
                  children: post.comments
                      .map((comment) => _buildCommentItem(comment))
                      .toList(),
                ),
              ),
            ),
          ] else
            Container(
              padding: const EdgeInsets.all(16),
              child: Text(
                context.tr('posts.no_comments'),
                style: TextStyle(
                  color: DSColors.darkGray,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildCommentItem(PostComment comment) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: DSColors.mediumGray),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: DSColors.primary,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                comment.user.name.isNotEmpty
                    ? comment.user.name[0].toUpperCase()
                    : 'U',
                style: DSTypography.caption.copyWith(
                  color: DSColors.white,
                  fontWeight: FontWeight.w700,
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
                    Flexible(
                      child: Text(
                        comment.user.name,
                        style: DSTypography.body.copyWith(
                          fontWeight: FontWeight.w600,
                          color: DSColors.charcoal,
                        ),
                        overflow: TextOverflow.ellipsis,
                        maxLines: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatDate(comment.createdAt),
                      style: DSTypography.caption.copyWith(
                        color: DSColors.darkGray,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                LinkifiedText(
                  text: comment.content,
                  style: DSTypography.body.copyWith(
                    color: DSColors.charcoal,
                    height: 1.4,
                  ),
                  maxLines: 5,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return '${date.day}/${date.month}/${date.year}';
    } else if (difference.inDays > 0) {
      return context.tr(
        'posts.time.days_ago',
        params: {'days': difference.inDays.toString()},
      );
    } else if (difference.inHours > 0) {
      return context.tr(
        'posts.time.hours_ago',
        params: {'hours': difference.inHours.toString()},
      );
    } else if (difference.inMinutes > 0) {
      return context.tr(
        'posts.time.minutes_ago',
        params: {'minutes': difference.inMinutes.toString()},
      );
    } else {
      return context.tr('posts.time.just_now');
    }
  }
}
