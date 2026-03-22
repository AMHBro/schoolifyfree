import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/notes_grades_service.dart';
import 'teacher_students_screen.dart';
import '../theme/design_system.dart';

class StudentDetailScreen extends StatefulWidget {
  final StudentWithStage student;

  const StudentDetailScreen({super.key, required this.student});

  @override
  State<StudentDetailScreen> createState() => _StudentDetailScreenState();
}

class _StudentDetailScreenState extends State<StudentDetailScreen> {
  String _localizedGender(String? raw) {
    final value = (raw ?? '').toLowerCase().trim();
    if (value == 'male' || value == 'm' || value == 'ذكر') {
      return Directionality.of(context) == TextDirection.rtl ? 'ذكر' : 'Male';
    }
    if (value == 'female' || value == 'f' || value == 'أنثى') {
      return Directionality.of(context) == TextDirection.rtl
          ? 'أنثى'
          : 'Female';
    }
    return Directionality.of(context) == TextDirection.rtl ? 'غير محدد' : 'N/A';
  }

  List<StudentNote> notes = [];
  List<StudentGrade> grades = [];
  bool isLoadingNotes = true;
  bool isLoadingGrades = true;

  @override
  void initState() {
    super.initState();
    _loadStudentData();
  }

  Future<void> _loadStudentData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) return;

    try {
      // Load notes and grades from API
      final notesData = await NotesGradesService.getNotes(
        widget.student.id,
        token,
      );
      final gradesData = await NotesGradesService.getGrades(
        widget.student.id,
        token,
      );

      if (mounted) {
        setState(() {
          notes = notesData
              .map(
                (noteData) => StudentNote(
                  id: noteData['id'] ?? '',
                  title: noteData['title'] ?? '',
                  content: noteData['content'] ?? '',
                  createdAt: noteData['createdAt'] ?? '',
                ),
              )
              .toList();

          grades = gradesData
              .map(
                (gradeData) => StudentGrade(
                  id: gradeData['id'] ?? '',
                  gradeType: gradeData['gradeType'] ?? 'MONTH_1_EXAM',
                  subject: gradeData['subject'] ?? '',
                  grade: gradeData['grade'] ?? '',
                  createdAt: gradeData['createdAt'] ?? '',
                ),
              )
              .toList();

          isLoadingNotes = false;
          isLoadingGrades = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          isLoadingNotes = false;
          isLoadingGrades = false;
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.tr('students.detail.failed_to_load')}: $e',
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: DSColors.lightGray,
      appBar: AppBar(title: Text(widget.student.name)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Student Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: DSColors.white,
                borderRadius: BorderRadius.circular(DSRadii.large),
                boxShadow: const [DSShadows.card],
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: DSColors.primary.withOpacity(0.15),
                    child: Text(
                      widget.student.name.isNotEmpty
                          ? widget.student.name[0].toUpperCase()
                          : 'S',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: DSColors.primary,
                        fontSize: 32,
                      ),
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(widget.student.name, style: DSTypography.h2),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: DSColors.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: DSColors.primary.withOpacity(0.25),
                              width: 1,
                            ),
                          ),
                          child: Text(
                            widget.student.stageName,
                            style: DSTypography.caption.copyWith(
                              color: DSColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Student Information Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: DSColors.white,
                borderRadius: BorderRadius.circular(DSRadii.large),
                boxShadow: const [DSShadows.card],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.info_outline, color: DSColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        context.tr('students.detail.student_information'),
                        style: DSTypography.h3.copyWith(
                          color: DSColors.primary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildDetailRow(
                    context.tr('students.detail.full_name'),
                    widget.student.name,
                  ),
                  _buildDetailRow(
                    context.tr('students.detail.stage'),
                    widget.student.stageName,
                  ),
                  _buildDetailRow(
                    context.tr('students.detail.age'),
                    '${widget.student.age} ${context.tr('students.detail.years_old')}',
                  ),
                  _buildDetailRow(
                    context.tr('students.detail.gender'),
                    _localizedGender(widget.student.gender),
                  ),
                  if (widget.student.phoneNumber.isNotEmpty)
                    _buildDetailRow(
                      context.tr('students.detail.phone_number'),
                      widget.student.phoneNumber,
                    ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Notes Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: DSColors.white,
                borderRadius: BorderRadius.circular(DSRadii.large),
                boxShadow: const [DSShadows.card],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.note_alt, color: DSColors.warning),
                      const SizedBox(width: 8),
                      Text(
                        context.tr('students.detail.notes'),
                        style: DSTypography.h3.copyWith(
                          color: DSColors.warning,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => _showAddNoteDialog(context),
                        icon: const Icon(Icons.add, color: DSColors.warning),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (isLoadingNotes)
                    const Center(child: CircularProgressIndicator())
                  else if (notes.isEmpty)
                    Text(
                      context.tr('students.detail.no_notes_available'),
                      style: DSTypography.caption.copyWith(
                        color: DSColors.darkGray,
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: notes.length,
                      itemBuilder: (context, index) {
                        final note = notes[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: DSColors.warning.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: DSColors.warning.withOpacity(0.3),
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      note.title,
                                      style: DSTypography.body.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  Text(
                                    note.createdAt,
                                    style: DSTypography.caption.copyWith(
                                      color: DSColors.darkGray,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  PopupMenuButton<String>(
                                    onSelected: (String value) {
                                      if (value == 'edit') {
                                        _showEditNoteDialog(context, note);
                                      } else if (value == 'delete') {
                                        _showDeleteNoteConfirmation(
                                          context,
                                          note,
                                        );
                                      }
                                    },
                                    itemBuilder: (BuildContext context) => [
                                      PopupMenuItem<String>(
                                        value: 'edit',
                                        child: Text(
                                          context.tr('students.detail.edit'),
                                        ),
                                      ),
                                      PopupMenuItem<String>(
                                        value: 'delete',
                                        child: Text(
                                          context.tr('students.detail.delete'),
                                        ),
                                      ),
                                    ],
                                    child: Icon(
                                      Icons.more_vert,
                                      color: DSColors.darkGray,
                                      size: 20,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(note.content, style: DSTypography.body),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Grades Section
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: DSColors.white,
                borderRadius: BorderRadius.circular(DSRadii.large),
                boxShadow: const [DSShadows.card],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.grade, color: DSColors.success),
                      const SizedBox(width: 8),
                      Text(
                        context.tr('students.detail.grades'),
                        style: DSTypography.h3.copyWith(
                          color: DSColors.success,
                        ),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: () => _showAddGradeDialog(context),
                        icon: const Icon(Icons.add, color: DSColors.success),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (isLoadingGrades)
                    const Center(child: CircularProgressIndicator())
                  else if (grades.isEmpty)
                    Text(
                      context.tr('students.detail.no_grades_recorded'),
                      style: DSTypography.caption.copyWith(
                        color: DSColors.darkGray,
                        fontStyle: FontStyle.italic,
                      ),
                    )
                  else
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: grades.length,
                      itemBuilder: (context, index) {
                        final grade = grades[index];
                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: DSColors.success.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: DSColors.success.withOpacity(0.3),
                            ),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      _getGradeTypeDisplayName(grade.gradeType),
                                      style: DSTypography.body.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      grade.subject,
                                      style: DSTypography.body.copyWith(
                                        color: DSColors.charcoal,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      grade.createdAt,
                                      style: DSTypography.caption.copyWith(
                                        color: DSColors.darkGray,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: DSColors.success.withOpacity(0.15),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Text(
                                  grade.grade,
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: DSColors.success,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              PopupMenuButton<String>(
                                onSelected: (String value) {
                                  if (value == 'edit') {
                                    _showEditGradeDialog(context, grade);
                                  } else if (value == 'delete') {
                                    _showDeleteGradeConfirmation(
                                      context,
                                      grade,
                                    );
                                  }
                                },
                                itemBuilder: (BuildContext context) => [
                                  PopupMenuItem<String>(
                                    value: 'edit',
                                    child: Text(
                                      context.tr('students.detail.edit'),
                                    ),
                                  ),
                                  PopupMenuItem<String>(
                                    value: 'delete',
                                    child: Text(
                                      context.tr('students.detail.delete'),
                                    ),
                                  ),
                                ],
                                child: Icon(
                                  Icons.more_vert,
                                  color: DSColors.darkGray,
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.grey,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w500),
            ),
          ),
        ],
      ),
    );
  }

  void _showAddNoteDialog(BuildContext context) {
    final titleController = TextEditingController();
    final contentController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        scrollable: true,
        title: Text(
          '${context.tr('students.detail.add_note')} ${widget.student.name}',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: context.tr('students.detail.note_title'),
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: contentController,
                maxLines: 4,
                decoration: InputDecoration(
                  labelText: context.tr('students.detail.note_content'),
                  hintText: context.tr('students.detail.enter_note_here'),
                  border: const OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.tr('students.detail.cancel')),
          ),
          ElevatedButton(
            onPressed: () async {
              if (titleController.text.isNotEmpty &&
                  contentController.text.isNotEmpty) {
                final navigator = Navigator.of(context);
                await _addNote(titleController.text, contentController.text);
                if (mounted) {
                  navigator.pop();
                }
              }
            },
            child: Text(context.tr('students.detail.save_note')),
          ),
        ],
      ),
    );
  }

  void _showAddGradeDialog(BuildContext context) {
    final gradeController = TextEditingController();

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final teacher = authProvider.teacher;
    final subjects =
        teacher?.subjects.map((s) => s.name).toList() ??
        ['Math', 'Science', 'English'];

    // Make sure we have subjects and set a valid default
    if (subjects.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('students.detail.no_subjects_available')),
        ),
      );
      return;
    }

    final gradeTypes = {
      'MONTH_1_EXAM': context.tr('grades.grade_types.month_1_exam'),
      'MONTH_2_EXAM': context.tr('grades.grade_types.month_2_exam'),
      'MID_TERM_EXAM': context.tr('grades.grade_types.mid_term_exam'),
      'MONTH_3_EXAM': context.tr('grades.grade_types.month_3_exam'),
      'MONTH_4_EXAM': context.tr('grades.grade_types.month_4_exam'),
      'FINAL_EXAM': context.tr('grades.grade_types.final_exam'),
    };

    String selectedSubject = subjects.first;
    String selectedGradeType = 'MONTH_1_EXAM';

    // Function to check if student has existing grade for the selected type and subject
    bool hasExistingGrade(String gradeType, String subject) {
      return grades.any(
        (grade) => grade.gradeType == gradeType && grade.subject == subject,
      );
    }

    // Function to get existing grade value
    String? getExistingGradeValue(String gradeType, String subject) {
      final existingGrade = grades.firstWhere(
        (grade) => grade.gradeType == gradeType && grade.subject == subject,
        orElse: () => StudentGrade(
          id: '',
          gradeType: '',
          subject: '',
          grade: '',
          createdAt: '',
        ),
      );
      return existingGrade.id.isNotEmpty ? existingGrade.grade : null;
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
            scrollable: true,
            title: Text(
              '${context.tr('students.detail.add_grade')} ${widget.student.name}',
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: selectedGradeType,
                    decoration: InputDecoration(
                      labelText: context.tr('students.detail.grade_type'),
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
                              '${context.tr('students.detail.student_already_has_grade_prefix')} ${gradeTypes[selectedGradeType]} ${context.tr('students.detail.student_already_has_grade_suffix')}: $existingGradeValue',
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
                      labelText: context.tr('students.detail.subject'),
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
                    keyboardType: const TextInputType.numberWithOptions(
                      decimal: true,
                    ),
                    textInputAction: TextInputAction.done,
                    decoration: InputDecoration(
                      hintText: context.tr('students.detail.enter_grade_hint'),
                      labelText: context.tr('students.detail.grade'),
                      border: const OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text(context.tr('students.detail.cancel')),
              ),
              ElevatedButton(
                onPressed: () async {
                  if (gradeController.text.isNotEmpty) {
                    final navigator = Navigator.of(context);
                    await _addGrade(
                      selectedGradeType,
                      selectedSubject,
                      gradeController.text,
                    );
                    if (mounted) {
                      navigator.pop();
                    }
                  }
                },
                child: Text(context.tr('students.detail.save_grade')),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showSendMessageDialog(BuildContext context) {
    final messageController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        scrollable: true,
        title: Text(
          '${context.tr('students.detail.send_message')} ${widget.student.name}',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        content: SingleChildScrollView(
          child: TextField(
            controller: messageController,
            maxLines: 4,
            decoration: InputDecoration(
              hintText: context.tr('students.detail.type_message_here'),
              border: const OutlineInputBorder(),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Message sent to ${widget.student.name}'),
                ),
              );
            },
            child: const Text('Send Message'),
          ),
        ],
      ),
    );
  }

  Future<void> _addNote(String title, String content) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('chats.auth_required'))),
        );
      }
      return;
    }

    try {
      final success = await NotesGradesService.addNote(
        widget.student.id,
        title,
        content,
        token,
      );

      if (success) {
        // Reload data to get the latest notes
        await _loadStudentData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr(
                  'students.detail.note_added',
                  params: {'studentName': widget.student.name},
                ),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.tr('students.detail.failed_to_add_note')),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.tr('students.detail.failed_to_add_note')}: $e',
            ),
          ),
        );
      }
    }
  }

  Future<void> _addGrade(String gradeType, String subject, String grade) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('chats.auth_required'))),
        );
      }
      return;
    }

    try {
      final success = await NotesGradesService.addGrade(
        widget.student.id,
        gradeType,
        subject,
        grade,
        token,
      );

      if (success) {
        // Reload data to get the latest grades
        await _loadStudentData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Grade added for ${widget.student.name} in $subject',
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(context.tr('students.detail.failed_to_add_grade')),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.tr('students.detail.failed_to_add_grade')}: $e',
            ),
          ),
        );
      }
    }
  }

  String _getGradeTypeDisplayName(String gradeType) {
    final gradeTypeNames = {
      'MONTH_1_EXAM': context.tr('grades.grade_types.month_1_exam'),
      'MONTH_2_EXAM': context.tr('grades.grade_types.month_2_exam'),
      'MID_TERM_EXAM': context.tr('grades.grade_types.mid_term_exam'),
      'MONTH_3_EXAM': context.tr('grades.grade_types.month_3_exam'),
      'MONTH_4_EXAM': context.tr('grades.grade_types.month_4_exam'),
      'FINAL_EXAM': context.tr('grades.grade_types.final_exam'),
    };
    return gradeTypeNames[gradeType] ?? gradeType;
  }

  void _showEditNoteDialog(BuildContext context, StudentNote note) {
    final titleController = TextEditingController(text: note.title);
    final contentController = TextEditingController(text: note.content);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        scrollable: true,
        title: Text(
          context.tr(
            'students.detail.edit_note',
            params: {'studentName': widget.student.name},
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: context.tr('students.detail.note_title'),
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: contentController,
                maxLines: 4,
                decoration: InputDecoration(
                  labelText: context.tr('students.detail.note_content'),
                  hintText: context.tr('students.detail.enter_note_here'),
                  border: const OutlineInputBorder(),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(context.tr('students.detail.cancel')),
          ),
          ElevatedButton(
            onPressed: () async {
              if (titleController.text.isNotEmpty &&
                  contentController.text.isNotEmpty) {
                final navigator = Navigator.of(context);
                await _updateNote(
                  note.id,
                  titleController.text,
                  contentController.text,
                );
                if (mounted) {
                  navigator.pop();
                }
              }
            },
            child: Text(context.tr('students.detail.update_note')),
          ),
        ],
      ),
    );
  }

  void _showDeleteNoteConfirmation(BuildContext context, StudentNote note) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Note'),
        content: Text(
          'Are you sure you want to delete the note "${note.title}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              await _deleteNote(note.id);
              if (mounted) {
                navigator.pop();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(context.tr('students.detail.delete')),
          ),
        ],
      ),
    );
  }

  void _showEditGradeDialog(BuildContext context, StudentGrade grade) {
    final gradeController = TextEditingController(text: grade.grade);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final teacher = authProvider.teacher;
    final subjects =
        teacher?.subjects.map((s) => s.name).toList() ??
        ['Math', 'Science', 'English'];

    final gradeTypes = {
      'MONTH_1_EXAM': context.tr('grades.grade_types.month_1_exam'),
      'MONTH_2_EXAM': context.tr('grades.grade_types.month_2_exam'),
      'MID_TERM_EXAM': context.tr('grades.grade_types.mid_term_exam'),
      'MONTH_3_EXAM': context.tr('grades.grade_types.month_3_exam'),
      'MONTH_4_EXAM': context.tr('grades.grade_types.month_4_exam'),
      'FINAL_EXAM': context.tr('grades.grade_types.final_exam'),
    };

    String selectedSubject = subjects.contains(grade.subject)
        ? grade.subject
        : subjects.first;
    String selectedGradeType = grade.gradeType;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          scrollable: true,
          title: Text(
            context.tr(
              'students.detail.edit_grade',
              params: {'studentName': widget.student.name},
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                DropdownButtonFormField<String>(
                  value: selectedGradeType,
                  decoration: InputDecoration(
                    labelText: context.tr('students.detail.grade_type'),
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
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedSubject,
                  decoration: InputDecoration(
                    labelText: context.tr('students.detail.subject'),
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
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(
                    hintText: context.tr('students.detail.enter_grade_hint'),
                    labelText: context.tr('students.detail.grade'),
                    border: const OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(context.tr('students.detail.cancel')),
            ),
            ElevatedButton(
              onPressed: () async {
                if (gradeController.text.isNotEmpty) {
                  final navigator = Navigator.of(context);
                  await _updateGrade(
                    grade.id,
                    selectedGradeType,
                    selectedSubject,
                    gradeController.text,
                  );
                  if (mounted) {
                    navigator.pop();
                  }
                }
              },
              child: Text(context.tr('students.detail.update_grade')),
            ),
          ],
        ),
      ),
    );
  }

  void _showDeleteGradeConfirmation(BuildContext context, StudentGrade grade) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Grade'),
        content: Text(
          'Are you sure you want to delete the ${_getGradeTypeDisplayName(grade.gradeType)} grade for ${grade.subject}? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              await _deleteGrade(grade.id);
              if (mounted) {
                navigator.pop();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: Text(context.tr('students.detail.delete')),
          ),
        ],
      ),
    );
  }

  Future<void> _updateNote(String noteId, String title, String content) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('chats.auth_required'))),
        );
      }
      return;
    }

    try {
      final success = await NotesGradesService.updateNote(
        noteId,
        title,
        content,
        token,
      );

      if (success) {
        await _loadStudentData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr(
                  'students.detail.note_updated',
                  params: {'studentName': widget.student.name},
                ),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr('students.detail.failed_to_update_note'),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.tr('students.detail.failed_to_update_note')}: $e',
            ),
          ),
        );
      }
    }
  }

  Future<void> _deleteNote(String noteId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('chats.auth_required'))),
        );
      }
      return;
    }

    try {
      final success = await NotesGradesService.deleteNote(noteId, token);

      if (success) {
        await _loadStudentData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr(
                  'students.detail.note_deleted',
                  params: {'studentName': widget.student.name},
                ),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr('students.detail.failed_to_delete_note'),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.tr('students.detail.failed_to_delete_note')}: $e',
            ),
          ),
        );
      }
    }
  }

  Future<void> _updateGrade(
    String gradeId,
    String gradeType,
    String subject,
    String grade,
  ) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('chats.auth_required'))),
        );
      }
      return;
    }

    try {
      final success = await NotesGradesService.updateGrade(
        gradeId,
        gradeType,
        subject,
        grade,
        token,
      );

      if (success) {
        await _loadStudentData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                'Grade updated for ${widget.student.name} in $subject',
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr('students.detail.failed_to_update_grade'),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.tr('students.detail.failed_to_update_grade')}: $e',
            ),
          ),
        );
      }
    }
  }

  Future<void> _deleteGrade(String gradeId) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Authentication required')),
        );
      }
      return;
    }

    try {
      final success = await NotesGradesService.deleteGrade(gradeId, token);

      if (success) {
        await _loadStudentData();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr(
                  'students.detail.grade_deleted',
                  params: {'studentName': widget.student.name},
                ),
              ),
            ),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr('students.detail.failed_to_delete_grade'),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${context.tr('students.detail.failed_to_delete_grade')}: $e',
            ),
          ),
        );
      }
    }
  }
}

class StudentNote {
  final String id;
  final String title;
  final String content;
  final String createdAt;

  StudentNote({
    required this.id,
    required this.title,
    required this.content,
    required this.createdAt,
  });
}

class StudentGrade {
  final String id;
  final String gradeType;
  final String subject;
  final String grade;
  final String createdAt;

  StudentGrade({
    required this.id,
    required this.gradeType,
    required this.subject,
    required this.grade,
    required this.createdAt,
  });
}
