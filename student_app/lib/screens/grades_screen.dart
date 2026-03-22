import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../models/grade.dart';
import '../services/api_service.dart';
import '../widgets/schoolify_app_bar.dart';
import '../theme/design_system.dart';

class GradesScreen extends StatefulWidget {
  const GradesScreen({super.key});

  @override
  State<GradesScreen> createState() => _GradesScreenState();
}

class _GradesScreenState extends State<GradesScreen> {
  StudentGrades? _studentGrades;
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadGrades();
  }

  Future<void> _loadGrades() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) {
      setState(() {
        _studentGrades = null;
        _isLoading = false;
        _error = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await ApiService.getGrades(authProvider.token!);

      if (response['success']) {
        setState(() {
          _studentGrades = StudentGrades.fromJson(response['data']);
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (response['message'] ?? context.tr('grades.failed_to_load'));
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = context.tr('grades.error_occurred');
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, LocalizationProvider>(
      builder: (context, authProvider, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            appBar: const SchoolifyAppBar(),
            body: RefreshIndicator(onRefresh: _loadGrades, child: _buildBody()),
          ),
        );
      },
    );
  }

  Widget _buildBody() {
    if (Provider.of<AuthProvider>(context, listen: false).token == null) {
      return _guestPlaceholder();
    }
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(strokeWidth: 3),
            const SizedBox(height: 16),
            Text(
              context.tr('grades.loading'),
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
                context.tr('grades.error_occurred'),
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
                onPressed: _loadGrades,
                icon: const Icon(LineAwesomeIcons.sync_solid),
                label: Text(context.tr('grades.try_again')),
              ),
            ],
          ),
        ),
      );
    }

    if (_studentGrades == null) {
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
              child: Icon(
                LineAwesomeIcons.graduation_cap_solid,
                size: 48,
                color: DSColors.darkGray,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              context.tr('grades.no_grades_available'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('grades.grades_appear_here'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.all(DSSpacing.containerPadding / 1.5),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Academic Performance Summary
            _buildPerformanceSummary(),
            const SizedBox(height: DSSpacing.sectionSpacing / 2),

            // Subject Grades
            _buildSubjectGrades(),
          ],
        ),
      ),
    );
  }

  Widget _guestPlaceholder() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(DSSpacing.containerPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LineAwesomeIcons.award_solid,
              size: 64,
              color: DSColors.primary,
            ),
            const SizedBox(height: 16),
            Text(
              context.tr('guest.grades_title'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('guest.grades_message'),
              textAlign: TextAlign.center,
              style: DSTypography.caption.copyWith(color: DSColors.darkGray),
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

  Widget _buildPerformanceSummary() {
    final summary = _studentGrades!.summary;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: DSColors.primary,
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                LineAwesomeIcons.chart_line_solid,
                color: Colors.white,
                size: 24,
              ),
              const SizedBox(width: 8),
              Text(
                context.tr('grades.academic_performance'),
                style: DSTypography.h3.copyWith(color: Colors.white),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  context.tr('grades.overall_average'),
                  summary.overallAverage > 0
                      ? '${summary.overallAverage.toStringAsFixed(1)}% (${summary.overallLetterGrade})'
                      : context.tr('grades.no_grades_yet'),
                  LineAwesomeIcons.graduation_cap_solid,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildStatCard(
                  context.tr('grades.subjects'),
                  '${summary.subjectsWithGrades}/${summary.totalSubjects}',
                  LineAwesomeIcons.book_solid,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(DSRadii.medium),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: DSTypography.h3.copyWith(color: Colors.white),
            textAlign: TextAlign.center,
          ),
          Text(
            title,
            style: DSTypography.caption.copyWith(color: Colors.white),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectGrades() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(context.tr('grades.subject_grades'), style: DSTypography.h2),
        const SizedBox(height: 16),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _studentGrades!.subjects.length,
          separatorBuilder: (context, index) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final subject = _studentGrades!.subjects[index];
            return _buildSubjectCard(subject);
          },
        ),
      ],
    );
  }

  Widget _buildSubjectCard(SubjectGrade subject) {
    final hasGrades = subject.totalGrades > 0;
    final color = _getSubjectColor(subject.subjectName);

    return GestureDetector(
      onTap: hasGrades ? () => _showSubjectDetails(subject) : null,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: DSColors.white,
          borderRadius: BorderRadius.circular(DSRadii.large),
          boxShadow: const [DSShadows.card],
        ),
        child: Row(
          children: [
            // Subject icon
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: color.withValues(alpha: 0.2)),
              ),
              child: Icon(LineAwesomeIcons.book_solid, color: color, size: 24),
            ),
            const SizedBox(width: 16),

            // Subject details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    subject.subjectName,
                    style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                  ),
                  const SizedBox(height: 4),
                  if (hasGrades) ...[
                    Row(
                      children: [
                        Text(
                          '${subject.average.toStringAsFixed(1)}%',
                          style: DSTypography.body.copyWith(
                            color: DSColors.darkGray,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: LinearProgressIndicator(
                            value: subject.average / 100,
                            backgroundColor: DSColors.mediumGray,
                            valueColor: AlwaysStoppedAnimation<Color>(color),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${subject.totalGrades} ${subject.totalGrades == 1 ? context.tr('grades.grade_singular') : context.tr('grades.grades_plural')}',
                      style: DSTypography.caption.copyWith(
                        color: DSColors.darkGray,
                      ),
                    ),
                  ] else ...[
                    Text(
                      context.tr('grades.no_grades_yet'),
                      style: DSTypography.body.copyWith(
                        color: DSColors.darkGray,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Grade badge or tap indicator
            if (hasGrades) ...[
              Column(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      _getLetterGrade(subject.average),
                      style: TextStyle(
                        color: color,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  const SizedBox(height: 4),
                  _directionalIcon(
                    LineAwesomeIcons.angle_right_solid,
                    size: 12,
                    color: DSColors.darkGray,
                  ),
                ],
              ),
            ] else ...[
              const Icon(
                LineAwesomeIcons.hourglass_half_solid,
                color: DSColors.darkGray,
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showSubjectDetails(SubjectGrade subject) {
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
            initialChildSize: 0.75,
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
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: _getSubjectColor(
                                  subject.subjectName,
                                ).withValues(alpha: 0.10),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(
                                LineAwesomeIcons.book_solid,
                                color: _getSubjectColor(subject.subjectName),
                                size: 22,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    subject.subjectName,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: DSTypography.h3.copyWith(
                                      color: DSColors.charcoal,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${context.tr('grades.average')}: ${subject.average.toStringAsFixed(1)}% (${_getLetterGrade(subject.average)})',
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
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          // Use the provided controller to allow drag/scroll sync
                          child: _buildExamGradesList(subject),
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

  Widget _buildExamGradesList(SubjectGrade subject) {
    final examTypes = [
      {
        'key': 'month1Exam',
        'name': context.tr('grades.month1_exam'),
        'grade': subject.grades.month1Exam,
      },
      {
        'key': 'month2Exam',
        'name': context.tr('grades.month2_exam'),
        'grade': subject.grades.month2Exam,
      },
      {
        'key': 'midTermExam',
        'name': context.tr('grades.midterm_exam'),
        'grade': subject.grades.midTermExam,
      },
      {
        'key': 'month3Exam',
        'name': context.tr('grades.month3_exam'),
        'grade': subject.grades.month3Exam,
      },
      {
        'key': 'month4Exam',
        'name': context.tr('grades.month4_exam'),
        'grade': subject.grades.month4Exam,
      },
      {
        'key': 'finalExam',
        'name': context.tr('grades.final_exam'),
        'grade': subject.grades.finalExam,
      },
    ];

    return ListView.separated(
      itemCount: examTypes.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final exam = examTypes[index];
        final grade = exam['grade'] as Grade?;
        final examName = exam['name'] as String;

        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: grade != null ? DSColors.white : DSColors.lightGray,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: grade != null ? DSColors.mediumGray : DSColors.mediumGray,
              width: 1,
            ),
          ),
          child: Row(
            children: [
              // Exam icon
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: grade != null
                      ? _getSubjectColor(
                          subject.subjectName,
                        ).withValues(alpha: 0.1)
                      : DSColors.mediumGray,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  grade != null
                      ? LineAwesomeIcons.clipboard_check_solid
                      : LineAwesomeIcons.clipboard_solid,
                  color: grade != null
                      ? _getSubjectColor(subject.subjectName)
                      : DSColors.charcoal,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),

              // Exam details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      examName,
                      style: DSTypography.h3.copyWith(
                        fontSize: 14,
                        color: grade != null
                            ? DSColors.charcoal
                            : DSColors.darkGray,
                      ),
                    ),
                    const SizedBox(height: 4),
                    if (grade != null) ...[
                      Text(
                        '${context.tr('grades.teacher')}: ${grade.teacher}',
                        style: DSTypography.caption.copyWith(
                          color: DSColors.darkGray,
                        ),
                      ),
                      Text(
                        '${context.tr('grades.date')}: ${_formatDate(grade.createdAt)}',
                        style: DSTypography.caption.copyWith(
                          color: DSColors.darkGray,
                        ),
                      ),
                    ] else ...[
                      Text(
                        context.tr('grades.not_graded_yet'),
                        style: DSTypography.caption.copyWith(
                          color: DSColors.darkGray,
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              // Grade
              if (grade != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: _getSubjectColor(
                      subject.subjectName,
                    ).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      Text(
                        '${grade.grade.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: _getSubjectColor(subject.subjectName),
                        ),
                      ),
                      Text(
                        grade.letterGrade,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: _getSubjectColor(subject.subjectName),
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: DSColors.mediumGray,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Text(
                    '--',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: DSColors.darkGray,
                    ),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Color _getSubjectColor(String subjectName) {
    final palette = DSColors.subjectPalette;
    final index = subjectName.hashCode % palette.length;
    return palette[index.abs()];
  }

  String _getLetterGrade(double grade) {
    if (grade >= 90) return 'A+';
    if (grade >= 85) return 'A';
    if (grade >= 80) return 'A-';
    if (grade >= 75) return 'B+';
    if (grade >= 70) return 'B';
    if (grade >= 65) return 'B-';
    if (grade >= 60) return 'C+';
    if (grade >= 55) return 'C';
    if (grade >= 50) return 'C-';
    return 'F';
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
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
