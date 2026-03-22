import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/exam_service.dart';
import '../models/exam.dart';
import '../models/teacher.dart';
import '../theme/design_system.dart';

class CreateExamScreen extends StatefulWidget {
  const CreateExamScreen({super.key});

  @override
  State<CreateExamScreen> createState() => _CreateExamScreenState();
}

class _CreateExamScreenState extends State<CreateExamScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _classNumberController = TextEditingController();

  DateTime? _selectedDate;
  String? _selectedStageId;
  String? _selectedSubjectId;
  bool _isLoading = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _classNumberController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _createExam() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.tr('exams.form.select_date'))),
      );
      return;
    }

    if (_selectedStageId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('exams.form.validation.stage_required')),
        ),
      );
      return;
    }

    if (_selectedSubjectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('exams.form.validation.subject_required')),
        ),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('grades.add_grade_dialog.authentication_required'),
          ),
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      // Use selected date at 12:00 PM as default time
      final examDateTime = DateTime(
        _selectedDate!.year,
        _selectedDate!.month,
        _selectedDate!.day,
        12, // Default to 12:00 PM
        0,
      );

      final examRequest = CreateExamRequest(
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim().isNotEmpty
            ? _descriptionController.text.trim()
            : null,
        examDate: examDateTime,
        classNumber: _classNumberController.text.trim(),
        stageId: _selectedStageId!,
        subjectId: _selectedSubjectId!,
      );

      final result = await ExamService.createExam(
        token: token,
        examRequest: examRequest,
      );

      if (result['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.tr('exams.success_messages.exam_created')),
            ),
          );
          Navigator.of(context).pop(true); // Return true to indicate success
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result['message'] ??
                    context.tr('exams.error_messages.create_failed'),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('exams.error_messages.create_failed')),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DSColors.lightGray,
      appBar: AppBar(title: Text(context.tr('exams.create_exam'))),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final teacher = authProvider.teacher;

          if (teacher == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Title Field
                    TextFormField(
                      controller: _titleController,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return context.tr(
                            'exams.form.validation.title_required',
                          );
                        }
                        return null;
                      },
                      decoration: InputDecoration(
                        labelText: context.tr('exams.form.title'),
                        hintText: context.tr('exams.form.title_hint'),
                        prefixIcon: const Icon(
                          Icons.title,
                          color: DSColors.primary,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(
                            color: DSColors.mediumGray,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(color: DSColors.primary),
                        ),
                        filled: true,
                        fillColor: DSColors.white,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Description Field
                    TextFormField(
                      controller: _descriptionController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        labelText: context.tr('exams.form.description'),
                        hintText: context.tr('exams.form.description_hint'),
                        prefixIcon: const Icon(
                          Icons.description,
                          color: DSColors.primary,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(
                            color: DSColors.mediumGray,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(color: DSColors.primary),
                        ),
                        filled: true,
                        fillColor: DSColors.white,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Date Selector
                    GestureDetector(
                      onTap: _selectDate,
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: DSColors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: DSColors.mediumGray),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.calendar_today,
                              color: DSColors.primary,
                            ),
                            const SizedBox(width: 16),
                            Text(
                              _selectedDate != null
                                  ? '${_selectedDate!.day}/${_selectedDate!.month}/${_selectedDate!.year}'
                                  : context.tr('exams.form.select_date'),
                              style: DSTypography.body.copyWith(
                                color: _selectedDate != null
                                    ? DSColors.charcoal
                                    : DSColors.darkGray,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Class Number Field
                    TextFormField(
                      controller: _classNumberController,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return context.tr(
                            'exams.form.validation.class_number_required',
                          );
                        }
                        return null;
                      },
                      decoration: InputDecoration(
                        labelText: context.tr('exams.form.class_number'),
                        hintText: context.tr('exams.form.class_number_hint'),
                        prefixIcon: const Icon(
                          Icons.location_on,
                          color: DSColors.primary,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(
                            color: DSColors.mediumGray,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(color: DSColors.primary),
                        ),
                        filled: true,
                        fillColor: DSColors.white,
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Stage Selector
                    Container(
                      decoration: BoxDecoration(
                        color: DSColors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: DSColors.mediumGray),
                      ),
                      child: DropdownButtonFormField<String>(
                        value: _selectedStageId,
                        items: teacher.stages
                            .map(
                              (stage) => DropdownMenuItem<String>(
                                value: stage.id,
                                child: Text(stage.name),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedStageId = value;
                            _selectedSubjectId = null;
                          });
                        },
                        decoration: InputDecoration(
                          labelText: context.tr('exams.form.stage'),
                          hintText: context.tr('exams.form.select_stage'),
                          prefixIcon: const Icon(
                            Icons.school,
                            color: DSColors.primary,
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Subject Selector
                    Container(
                      decoration: BoxDecoration(
                        color: DSColors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: DSColors.mediumGray),
                      ),
                      child: DropdownButtonFormField<String>(
                        value: _selectedSubjectId,
                        items: teacher.subjects
                            .map(
                              (subject) => DropdownMenuItem<String>(
                                value: subject.id,
                                child: Text(subject.name),
                              ),
                            )
                            .toList(),
                        onChanged: (value) {
                          setState(() {
                            _selectedSubjectId = value;
                          });
                        },
                        decoration: InputDecoration(
                          labelText: context.tr('exams.form.subject'),
                          hintText: context.tr('exams.form.select_subject'),
                          prefixIcon: const Icon(
                            Icons.book,
                            color: DSColors.primary,
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Create Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _createExam,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: DSColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(16),
                          ),
                          elevation: 2,
                        ),
                        child: _isLoading
                            ? const CircularProgressIndicator(
                                color: Colors.white,
                              )
                            : Text(
                                context.tr('exams.create_exam'),
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}
