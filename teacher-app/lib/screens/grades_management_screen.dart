import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/notes_grades_service.dart';
import '../widgets/app_bar_logo_title.dart';
import 'teacher_students_screen.dart';
import '../theme/design_system.dart';

class GradesManagementScreen extends StatefulWidget {
  const GradesManagementScreen({super.key});

  @override
  State<GradesManagementScreen> createState() => _GradesManagementScreenState();
}

class _GradesManagementScreenState extends State<GradesManagementScreen> {
  String _searchQuery = '';
  String? _selectedStageFilter;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DSColors.lightGray,
      appBar: AppBar(
        title: const AppBarLogoTitle(),
        backgroundColor: DSColors.white,
        elevation: 0,
        automaticallyImplyLeading: true,
        toolbarHeight: 56,
        titleSpacing: 16,
        iconTheme: const IconThemeData(color: DSColors.charcoal),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final teacher = authProvider.teacher;

          if (teacher == null) {
            return const Center(child: CircularProgressIndicator());
          }

          // Get all students from all stages
          final allStudents = <StudentWithStage>[];
          for (var stage in teacher.stages) {
            if (stage.students != null) {
              for (var student in stage.students!) {
                allStudents.add(
                  StudentWithStage(
                    id: student.id,
                    name: student.name,
                    code: student.code,
                    age: student.age,
                    gender: student.gender,
                    phoneNumber: student.phoneNumber,
                    stageName: stage.name,
                  ),
                );
              }
            }
          }

          if (allStudents.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.grade, size: 80, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    context.tr('grades.no_students_found'),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    context.tr('grades.no_students_subtitle'),
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                  ),
                ],
              ),
            );
          }

          // Filter students based on search and stage filter
          final filteredStudents = allStudents.where((student) {
            final matchesSearch =
                _searchQuery.isEmpty ||
                student.name.toLowerCase().contains(_searchQuery.toLowerCase());

            final matchesStage =
                _selectedStageFilter == null ||
                student.stageName == _selectedStageFilter;

            return matchesSearch && matchesStage;
          }).toList();

          // Sort students by name
          filteredStudents.sort((a, b) => a.name.compareTo(b.name));

          return Column(
            children: [
              // Search and Filter Section
              Container(
                color: DSColors.white,
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Search Bar
                    TextField(
                      onChanged: (value) {
                        setState(() {
                          _searchQuery = value;
                        });
                      },
                      decoration: InputDecoration(
                        hintText: context.tr('grades.search_placeholder'),
                        prefixIcon: const Icon(
                          Icons.search,
                          color: DSColors.success,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(
                            color: DSColors.mediumGray,
                          ),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          borderSide: const BorderSide(color: DSColors.success),
                        ),
                        filled: true,
                        fillColor: DSColors.lightGray,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Stage Filter
                    Row(
                      children: [
                        const Icon(Icons.filter_list, color: DSColors.success),
                        const SizedBox(width: 8),
                        Text(
                          context.tr('grades.filter_by_stage'),
                          style: DSTypography.body.copyWith(
                            fontWeight: FontWeight.w600,
                            color: DSColors.charcoal,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: DropdownButton<String?>(
                            value: _selectedStageFilter,
                            isExpanded: true,
                            hint: Text(context.tr('grades.all_stages')),
                            onChanged: (value) {
                              setState(() {
                                _selectedStageFilter = value;
                              });
                            },
                            items: [
                              DropdownMenuItem<String?>(
                                value: null,
                                child: Text(context.tr('grades.all_stages')),
                              ),
                              ...teacher.stages.map((stage) {
                                return DropdownMenuItem<String>(
                                  value: stage.name,
                                  child: Text(stage.name),
                                );
                              }),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Students Count
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 12,
                ),
                color: DSColors.success.withOpacity(0.06),
                child: Text(
                  context.tr(
                    'grades.students_found',
                    params: {
                      'count': filteredStudents.length.toString(),
                      'plural': filteredStudents.length != 1 ? 's' : '',
                    },
                  ),
                  style: DSTypography.body.copyWith(
                    fontWeight: FontWeight.w600,
                    color: DSColors.success,
                  ),
                ),
              ),

              // Students List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filteredStudents.length,
                  itemBuilder: (context, index) {
                    final student = filteredStudents[index];

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: GestureDetector(
                        onTap: () => _showAddGradeDialog(context, student),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: DSColors.white,
                            borderRadius: BorderRadius.circular(DSRadii.large),
                            boxShadow: const [DSShadows.card],
                          ),
                          child: Row(
                            children: [
                              // Student Avatar
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: DSColors.success.withOpacity(
                                  0.15,
                                ),
                                child: Text(
                                  student.name.isNotEmpty
                                      ? student.name[0].toUpperCase()
                                      : 'S',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: DSColors.success,
                                    fontSize: 16,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),

                              // Student Info
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(student.name, style: DSTypography.h3),
                                    const SizedBox(height: 4),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: DSColors.success.withOpacity(
                                          0.08,
                                        ),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(
                                          color: DSColors.success.withOpacity(
                                            0.25,
                                          ),
                                          width: 1,
                                        ),
                                      ),
                                      child: Text(
                                        student.stageName,
                                        style: DSTypography.caption.copyWith(
                                          color: DSColors.success,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              // Add Grade Icon
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: DSColors.success.withOpacity(0.08),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  Icons.grade,
                                  color: DSColors.success,
                                  size: 20,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showAddGradeDialog(
    BuildContext context,
    StudentWithStage student,
  ) async {
    final gradeController = TextEditingController();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final teacher = authProvider.teacher;
    final token = authProvider.token;

    if (teacher == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('grades.add_grade_dialog.teacher_info_unavailable'),
          ),
        ),
      );
      return;
    }

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

    // Get available subjects for this teacher
    final subjects = teacher.subjects.map((subject) => subject.name).toList();

    if (subjects.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.tr('grades.add_grade_dialog.no_subjects_available'),
          ),
        ),
      );
      return;
    }

    // Fetch student's existing grades
    List<Map<String, dynamic>> studentGrades = [];
    try {
      studentGrades = await NotesGradesService.getGrades(student.id, token);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('common.offline_message'))),
        );
      }
      return;
    }

    final gradeTypes = {
      'MONTH_1_EXAM': context.tr('grades.grade_types.MONTH_1_EXAM'),
      'MONTH_2_EXAM': context.tr('grades.grade_types.MONTH_2_EXAM'),
      'MID_TERM_EXAM': context.tr('grades.grade_types.MID_TERM_EXAM'),
      'MONTH_3_EXAM': context.tr('grades.grade_types.MONTH_3_EXAM'),
      'MONTH_4_EXAM': context.tr('grades.grade_types.MONTH_4_EXAM'),
      'FINAL_EXAM': context.tr('grades.grade_types.FINAL_EXAM'),
    };

    String selectedSubject = subjects.first;
    String selectedGradeType = 'MONTH_1_EXAM';

    // Function to check if student has existing grade for the selected type and subject
    bool hasExistingGrade(String gradeType, String subject) {
      return studentGrades.any(
        (grade) =>
            grade['gradeType'] == gradeType && grade['subject'] == subject,
      );
    }

    // Function to get existing grade value
    String? getExistingGradeValue(String gradeType, String subject) {
      final existingGrade = studentGrades.firstWhere(
        (grade) =>
            grade['gradeType'] == gradeType && grade['subject'] == subject,
        orElse: () => {},
      );
      return existingGrade.isNotEmpty
          ? existingGrade['grade'] as String?
          : null;
    }

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          final showWarning = hasExistingGrade(
            selectedGradeType,
            selectedSubject,
          );
          final existingGradeValue = getExistingGradeValue(
            selectedGradeType,
            selectedSubject,
          );

          return AlertDialog(
            title: Text(
              context.tr(
                'grades.add_grade_dialog.title',
                params: {'studentName': student.name},
              ),
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: selectedGradeType,
                    decoration: InputDecoration(
                      labelText: context.tr(
                        'grades.add_grade_dialog.grade_type',
                      ),
                      border: const OutlineInputBorder(),
                    ),
                    items: gradeTypes.entries.map((entry) {
                      return DropdownMenuItem(
                        value: entry.key,
                        child: Text(entry.value),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setDialogState(() {
                        selectedGradeType = value ?? 'MONTH_1_EXAM';
                      });
                    },
                  ),
                  if (showWarning) ...[
                    const SizedBox(height: 8),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: Colors.orange.shade200,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.warning_amber_rounded,
                            color: Colors.orange.shade700,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              context.tr(
                                'grades.add_grade_dialog.existing_grade_warning',
                              ),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.orange.shade700,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: selectedSubject,
                    decoration: InputDecoration(
                      labelText: context.tr('grades.add_grade_dialog.subject'),
                      border: const OutlineInputBorder(),
                    ),
                    items: subjects.map((subject) {
                      return DropdownMenuItem(
                        value: subject,
                        child: Text(subject),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setDialogState(() {
                        selectedSubject = value ?? subjects.first;
                      });
                    },
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: gradeController,
                    decoration: InputDecoration(
                      hintText: context.tr(
                        'grades.add_grade_dialog.grade_value',
                      ),
                      labelText: context.tr(
                        'grades.add_grade_dialog.grade_value',
                      ),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(context.tr('common.cancel')),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green.shade700,
                  foregroundColor: Colors.white,
                ),
                onPressed: () async {
                  if (gradeController.text.isNotEmpty) {
                    final navigator = Navigator.of(context);
                    await _addGrade(
                      student,
                      selectedGradeType,
                      selectedSubject,
                      gradeController.text,
                    );
                    if (mounted) {
                      navigator.pop();
                    }
                  }
                },
                child: Text(context.tr('common.save')),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _addGrade(
    StudentWithStage student,
    String gradeType,
    String subject,
    String grade,
  ) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.tr('grades.add_grade_dialog.authentication_required'),
            ),
          ),
        );
      }
      return;
    }

    try {
      final success = await NotesGradesService.addGrade(
        student.id,
        gradeType,
        subject,
        grade,
        token,
      );

      if (success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr('grades.add_grade_dialog.grade_added_success'),
              ),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr(
                  'grades.add_grade_dialog.grade_add_failed',
                  params: {'error': 'Unknown error'},
                ),
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('common.offline_message')),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
