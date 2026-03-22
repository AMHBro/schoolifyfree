import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:intl/intl.dart' as intl;
import '../theme/design_system.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../providers/localization_provider.dart';
import '../models/post.dart';
import '../widgets/linkified_text.dart';

class PostDetailsScreen extends StatefulWidget {
  final String postId;
  final String subjectId;
  final String title;

  const PostDetailsScreen({
    super.key,
    required this.postId,
    required this.subjectId,
    required this.title,
  });

  @override
  State<PostDetailsScreen> createState() => _PostDetailsScreenState();
}

class _PostDetailsScreenState extends State<PostDetailsScreen> {
  bool _isLoading = true;
  String? _error;
  TeacherPost? _post;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final token = auth.token;
    if (token == null) {
      setState(() {
        _error = context.tr('chats.authentication_required');
        _isLoading = false;
      });
      return;
    }
    setState(() {
      _isLoading = true;
      _error = null;
      _post = null;
    });
    try {
      // Use the subject posts endpoint like PostsScreen and pick the matching post
      final listResp = await ApiService.getPostsForSubject(
        token,
        widget.subjectId,
        page: 1,
        limit: 50,
      );
      if (listResp['success'] == true) {
        final posts = (listResp['data']['posts'] as List? ?? [])
            .map((p) => TeacherPost.fromJson(p as Map<String, dynamic>))
            .toList();
        TeacherPost? found;
        for (final p in posts) {
          if (p.id == widget.postId) {
            found = p;
            break;
          }
        }
        setState(() {
          _post = found;
          if (_post == null) {
            _error = 'Post not found';
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = listResp['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (listResp['message'] ?? 'Failed to load post');
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = context.tr('common.offline_message');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final df = intl.DateFormat('dd MMM yyyy');
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.title),
        actions: const [
          Padding(
            padding: EdgeInsetsDirectional.only(end: 8),
            child: Icon(LineAwesomeIcons.bookmark_solid),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? _buildError(_error!)
            : _post == null
            ? _buildError(context.tr('common.n_a'))
            : SingleChildScrollView(
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: DSColors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: const [DSShadows.card],
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (_post!.imageUrl != null &&
                          _post!.imageUrl!.isNotEmpty)
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.network(
                            _post!.imageUrl!,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: 180,
                          ),
                        ),
                      if (_post!.imageUrl != null &&
                          _post!.imageUrl!.isNotEmpty)
                        const SizedBox(height: 12),
                      Text(
                        _post!.title,
                        style: DSTypography.h2.copyWith(
                          color: DSColors.charcoal,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(
                            Icons.access_time,
                            size: 14,
                            color: DSColors.darkGray,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            df.format(_post!.createdAt),
                            style: DSTypography.caption,
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      LinkifiedText(
                        text: _post!.content,
                        style: DSTypography.body.copyWith(
                          color: DSColors.charcoal,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildError(String msg) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [DSShadows.card],
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.error_outline, color: DSColors.error),
          const SizedBox(height: 8),
          Text(msg, style: DSTypography.body.copyWith(color: DSColors.error)),
        ],
      ),
    );
  }
}
