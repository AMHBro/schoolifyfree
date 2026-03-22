import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../models/teacher.dart';
import '../theme/design_system.dart';

class CreatePostScreen extends StatefulWidget {
  final Teacher teacher;

  const CreatePostScreen({super.key, required this.teacher});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();

  String? _selectedStageId;
  String? _selectedSubjectId;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeDefaults();
  }

  void _initializeDefaults() {
    // Set default stage (first stage if available)
    if (widget.teacher.stages.isNotEmpty) {
      _selectedStageId = widget.teacher.stages.first.id;

      // Filter subjects for the selected stage and set first as default
      final stageSubjects = widget.teacher.subjects.where((subject) {
        // For now, we'll just use the first subject as default
        return true;
      }).toList();

      if (stageSubjects.isNotEmpty) {
        _selectedSubjectId = stageSubjects.first.id;
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  Future<void> _createPost() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedStageId == null || _selectedSubjectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('posts.stage_required')),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) {
      setState(() {
        _isLoading = false;
      });
      return;
    }

    try {
      final response = await ApiService.createPost(
        token: authProvider.token!,
        title: _titleController.text.trim(),
        content: _contentController.text.trim(),
        stageId: _selectedStageId!,
        subjectId: _selectedSubjectId!,
      );

      setState(() {
        _isLoading = false;
      });

      if (response['success']) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response['message'] ?? context.tr('posts.post_created'),
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context, true); // Return true to indicate success
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              response['message'] ?? context.tr('posts.failed_to_create'),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('posts.network_error')),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DSColors.lightGray,
      appBar: AppBar(title: Text(context.tr('posts.create_post'))),
      body: Form(
        key: _formKey,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Stage selection
              _buildSectionTitle(context.tr('posts.select_stage')),
              const SizedBox(height: 8),
              _buildStageDropdown(),
              const SizedBox(height: 20),

              // Subject selection
              _buildSectionTitle(context.tr('posts.select_subject')),
              const SizedBox(height: 8),
              _buildSubjectDropdown(),
              const SizedBox(height: 20),

              // Title input
              _buildSectionTitle(context.tr('posts.post_title')),
              const SizedBox(height: 8),
              _buildTitleField(),
              const SizedBox(height: 20),

              // Content input
              _buildSectionTitle(context.tr('posts.post_content')),
              const SizedBox(height: 8),
              _buildContentField(),
              const SizedBox(height: 32),

              // Create button
              _buildCreateButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: DSTypography.h3.copyWith(color: DSColors.charcoal),
    );
  }

  Widget _buildStageDropdown() {
    return Container(
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: DropdownButtonFormField<String>(
        value: _selectedStageId,
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          border: InputBorder.none,
          hintText: context.tr('posts.select_stage'),
        ),
        items: widget.teacher.stages.map((stage) {
          return DropdownMenuItem<String>(
            value: stage.id,
            child: Text(stage.name),
          );
        }).toList(),
        onChanged: (value) {
          setState(() {
            _selectedStageId = value;
          });
        },
        validator: (value) {
          if (value == null || value.isEmpty) {
            return context.tr('posts.stage_required');
          }
          return null;
        },
      ),
    );
  }

  Widget _buildSubjectDropdown() {
    return Container(
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: DropdownButtonFormField<String>(
        value: _selectedSubjectId,
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          border: InputBorder.none,
          hintText: context.tr('posts.select_subject'),
        ),
        items: widget.teacher.subjects.map((subject) {
          return DropdownMenuItem<String>(
            value: subject.id,
            child: Text(subject.name),
          );
        }).toList(),
        onChanged: (value) {
          setState(() {
            _selectedSubjectId = value;
          });
        },
        validator: (value) {
          if (value == null || value.isEmpty) {
            return context.tr('posts.subject_required');
          }
          return null;
        },
      ),
    );
  }

  Widget _buildTitleField() {
    return Container(
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: TextFormField(
        controller: _titleController,
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          border: InputBorder.none,
          hintText: context.tr('posts.post_title'),
        ),
        validator: (value) {
          if (value == null || value.trim().isEmpty) {
            return context.tr('posts.title_required');
          }
          if (value.trim().length < 3) {
            return context.tr('posts.title_required');
          }
          return null;
        },
      ),
    );
  }

  Widget _buildContentField() {
    return Container(
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: TextFormField(
        controller: _contentController,
        maxLines: 6,
        decoration: InputDecoration(
          contentPadding: const EdgeInsets.all(16),
          border: InputBorder.none,
          hintText: context.tr('posts.post_content'),
          alignLabelWithHint: true,
        ),
        validator: (value) {
          if (value == null || value.trim().isEmpty) {
            return context.tr('posts.content_required');
          }
          if (value.trim().length < 10) {
            return context.tr('posts.content_required');
          }
          return null;
        },
      ),
    );
  }

  Widget _buildCreateButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _isLoading ? null : _createPost,
        style: ElevatedButton.styleFrom(
          backgroundColor: DSColors.primary,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(DSRadii.large),
          ),
          elevation: 2,
        ),
        child: _isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(
                context.tr('posts.create'),
                style: DSTypography.h3.copyWith(
                  color: DSColors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
      ),
    );
  }
}
