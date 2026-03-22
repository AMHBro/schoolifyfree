import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/app_bar_logo_title.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';

class TeacherSubjectsScreen extends StatelessWidget {
  final String? filterSubjectName;

  const TeacherSubjectsScreen({super.key, this.filterSubjectName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: context.tr('navigation.back'),
          padding: EdgeInsets.zero,
          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        leadingWidth: 36,
        titleSpacing: 0,
        title: const AppBarLogoTitle(),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          final teacher = authProvider.teacher;

          if (teacher == null) {
            return const Center(child: CircularProgressIndicator());
          }

          // Derive subject list (optionally filtered)
          final subjects = filterSubjectName == null
              ? teacher.subjects
              : teacher.subjects
                    .where((s) => s.name == filterSubjectName)
                    .toList();

          if (subjects.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.book, size: 80, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    context.tr('subjects.no_subjects_assigned'),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    context.tr('subjects.no_subjects_subtitle'),
                    style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(24),
            itemCount: subjects.length,
            itemBuilder: (context, index) {
              final subject = subjects[index];

              // Find which stages this subject is taught in
              final stagesForSubject = teacher.stages.where((stage) {
                // Check if this stage has any connection to this subject
                // Since we don't have direct stage-subject relationship in the current model,
                // we'll show all stages where the teacher teaches
                return true;
              }).toList();

              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.grey.withValues(alpha: 0.1),
                        spreadRadius: 1,
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.indigo.shade50,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              Icons.book,
                              color: Colors.indigo.shade600,
                              size: 24,
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  subject.name,
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
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
                              color: Colors.indigo.shade50,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: Colors.indigo.shade200,
                                width: 1,
                              ),
                            ),
                            child: Text(
                              context.tr('subjects.active'),
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.indigo.shade700,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (stagesForSubject.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        const Divider(),
                        const SizedBox(height: 16),
                        Text(
                          context.tr('subjects.teaching_in_stages'),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey.shade700,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: stagesForSubject.map((stage) {
                            return Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.indigo.shade50,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.indigo.shade200,
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                stage.name,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.indigo.shade700,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Icon(
                            Icons.schedule,
                            size: 16,
                            color: Colors.grey.shade500,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            context.tr('subjects.check_schedule'),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey.shade500,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
