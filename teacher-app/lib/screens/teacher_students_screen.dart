import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import 'student_detail_screen.dart';
import 'chats_screen.dart';
import 'settings_screen.dart';
import '../widgets/app_bar_logo_title.dart';
import '../widgets/rounded_icon_action.dart';
import 'login_screen.dart';
import '../theme/design_system.dart';

class TeacherStudentsScreen extends StatefulWidget {
  const TeacherStudentsScreen({super.key});

  @override
  State<TeacherStudentsScreen> createState() => _TeacherStudentsScreenState();
}

class _TeacherStudentsScreenState extends State<TeacherStudentsScreen> {
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
        automaticallyImplyLeading: false,
        toolbarHeight: 56,
        titleSpacing: 16,
        actions: [
          RoundedIconAction(
            tooltip: context.tr('navigation.chats'),
            icon: const Icon(LineAwesomeIcons.comment_alt_solid, size: 22),
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
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
              },
            ),
          ),
        ],
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final teacher = authProvider.teacher;

          if (teacher == null) {
            return _buildGuestBody(context);
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
                  Icon(Icons.people, size: 80, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    context.tr('students.no_students_found'),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    context.tr('students.no_students_subtitle'),
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
                student.name.toLowerCase().contains(
                  _searchQuery.toLowerCase(),
                ) ||
                student.code.toLowerCase().contains(_searchQuery.toLowerCase());

            final matchesStage =
                _selectedStageFilter == null ||
                student.stageName == _selectedStageFilter;

            return matchesSearch && matchesStage;
          }).toList();

          // Sort students by name
          filteredStudents.sort((a, b) => a.name.compareTo(b.name));

          return RefreshIndicator(
            onRefresh: () async {
              // Refresh profile to update embedded students in stages
              await authProvider.refreshProfile();
              setState(() {});
            },
            child: Column(
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
                          hintText: context.tr('students.search_placeholder'),
                          prefixIcon: const Icon(
                            Icons.search,
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
                            borderSide: const BorderSide(
                              color: DSColors.primary,
                            ),
                          ),
                          filled: true,
                          fillColor: DSColors.lightGray,
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Stage Filter
                      Row(
                        children: [
                          const Icon(
                            Icons.filter_list,
                            color: DSColors.primary,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            context.tr('students.filter_by_stage'),
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
                              hint: Text(context.tr('students.all_stages')),
                              onChanged: (value) {
                                setState(() {
                                  _selectedStageFilter = value;
                                });
                              },
                              items: [
                                DropdownMenuItem<String?>(
                                  value: null,
                                  child: Text(
                                    context.tr('students.all_stages'),
                                  ),
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
                  color: DSColors.primary.withOpacity(0.06),
                  child: Text(
                    context.tr(
                      'students.students_found',
                      params: {
                        'count': filteredStudents.length.toString(),
                        'plural': filteredStudents.length != 1 ? 's' : '',
                      },
                    ),
                    style: DSTypography.body.copyWith(
                      fontWeight: FontWeight.w600,
                      color: DSColors.primary,
                    ),
                  ),
                ),

                // Students List
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    physics: const AlwaysScrollableScrollPhysics(),
                    itemCount: filteredStudents.length,
                    itemBuilder: (context, index) {
                      final student = filteredStudents[index];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: GestureDetector(
                          onTap: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) =>
                                  StudentDetailScreen(student: student),
                            ),
                          ),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: DSColors.white,
                              borderRadius: BorderRadius.circular(
                                DSRadii.large,
                              ),
                              boxShadow: const [DSShadows.card],
                            ),
                            child: Row(
                              children: [
                                // Student Avatar
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: DSColors.primary.withOpacity(
                                    0.15,
                                  ),
                                  child: Text(
                                    student.name.isNotEmpty
                                        ? student.name[0].toUpperCase()
                                        : 'S',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: DSColors.primary,
                                      fontSize: 16,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 16),

                                // Student Info
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        student.name,
                                        style: DSTypography.h3,
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                              horizontal: 8,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: DSColors.primary
                                                  .withOpacity(0.08),
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              border: Border.all(
                                                color: DSColors.primary
                                                    .withOpacity(0.25),
                                                width: 1,
                                              ),
                                            ),
                                            child: Text(
                                              student.stageName,
                                              style: DSTypography.caption
                                                  .copyWith(
                                                    color: DSColors.primary,
                                                    fontWeight: FontWeight.w600,
                                                  ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Row(
                                        children: [
                                          Icon(
                                            student.gender == 'male'
                                                ? Icons.male
                                                : Icons.female,
                                            size: 14,
                                            color: DSColors.darkGray,
                                          ),
                                          const SizedBox(width: 4),
                                          Text(
                                            '${student.gender == 'male' ? context.tr('students.student_info.male') : context.tr('students.student_info.female')} • ${context.tr('students.student_info.age')} ${student.age}',
                                            style: DSTypography.caption
                                                .copyWith(
                                                  color: DSColors.darkGray,
                                                ),
                                          ),
                                          if (student
                                              .phoneNumber
                                              .isNotEmpty) ...[
                                            const SizedBox(width: 8),
                                            Icon(
                                              Icons.phone,
                                              size: 14,
                                              color: DSColors.darkGray,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              student.phoneNumber,
                                              style: DSTypography.caption
                                                  .copyWith(
                                                    color: DSColors.darkGray,
                                                  ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    ],
                                  ),
                                ),

                                // Arrow indicator
                                Icon(
                                  Icons.arrow_forward_ios,
                                  color: DSColors.mediumGray,
                                  size: 16,
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
            ),
          );
        },
      ),
    );
  }

  Widget _buildGuestBody(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.people_alt_outlined,
              size: 80,
              color: DSColors.primary.withOpacity(0.8),
            ),
            const SizedBox(height: 16),
            Text(
              context.tr('guest.students_title', fallback: 'Students'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr(
                'guest.students_message',
                fallback: 'Login to view your students list.',
              ),
              textAlign: TextAlign.center,
              style: DSTypography.caption.copyWith(color: DSColors.darkGray),
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
}

// Helper class to include stage information with student
class StudentWithStage {
  final String id;
  final String name;
  final String code;
  final int age;
  final String? gender;
  final String phoneNumber;
  final String stageName;

  StudentWithStage({
    required this.id,
    required this.name,
    required this.code,
    required this.age,
    required this.gender,
    required this.phoneNumber,
    required this.stageName,
  });
}
