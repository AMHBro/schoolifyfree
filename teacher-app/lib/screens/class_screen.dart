import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/schedule.dart';
import '../models/attendance.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../theme/design_system.dart';

class ClassScreen extends StatefulWidget {
  final Schedule schedule;
  final String selectedDate;

  const ClassScreen({
    super.key,
    required this.schedule,
    required this.selectedDate,
  });

  @override
  State<ClassScreen> createState() => _ClassScreenState();
}

class _ClassScreenState extends State<ClassScreen> {
  List<AttendanceRecord> attendanceRecords = [];
  bool isLoading = true;
  bool isSaving = false;
  String? errorMessage;
  Map<String, bool> savingStates = {}; // Track saving state for each student

  @override
  void initState() {
    super.initState();
    _loadAttendance();
  }

  Future<void> _loadAttendance() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      // Initialize attendance records from schedule students with default absent status
      if (widget.schedule.students != null) {
        attendanceRecords = widget.schedule.students!.map((student) {
          return AttendanceRecord(
            studentId: student.id,
            studentName: student.name,
            studentCode: student.code,
            status: AttendanceStatus.absent, // Default to absent
          );
        }).toList();
      }

      // Try to load existing attendance data from server
      final result = await ApiService.getDailyAttendance(
        authProvider.token!,
        widget.schedule.stage.id,
        widget.selectedDate,
      );

      if (result['success']) {
        final data = result['data'];
        if (data != null && data['students'] != null) {
          // Update attendance records with existing data
          final existingStudents = data['students'] as List;

          for (int i = 0; i < attendanceRecords.length; i++) {
            final record = attendanceRecords[i];

            // Find matching student in existing data
            final existingStudent = existingStudents.firstWhere(
              (student) => student['studentId'] == record.studentId,
              orElse: () => null,
            );

            if (existingStudent != null) {
              // Check if this subject has attendance data
              final subjects =
                  existingStudent['subjects'] as Map<String, dynamic>;
              final subjectStatus = subjects[widget.schedule.subject.id];

              if (subjectStatus != null) {
                // Update the record with existing status
                attendanceRecords[i] = record.copyWith(
                  status: subjectStatus == 'present'
                      ? AttendanceStatus.present
                      : AttendanceStatus.absent,
                );
              }
            }
          }
        }
      } else {
        // If no existing data, initialize attendance on server (all absent by default)
        await ApiService.initializeAttendance(
          authProvider.token!,
          widget.schedule.stage.id,
          widget.selectedDate,
        );
      }
    } catch (e) {
      setState(() {
        errorMessage = context.tr('common.offline_message');
      });
    } finally {
      setState(() {
        isLoading = false;
      });
    }
  }

  Future<void> _autoSaveAttendance(
    String studentId,
    AttendanceStatus status,
  ) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;

    // Set saving state for this student
    setState(() {
      savingStates[studentId] = true;
    });

    try {
      final result = await ApiService.markAttendance(
        token: authProvider.token!,
        studentId: studentId,
        subjectId: widget.schedule.subject.id,
        date: widget.selectedDate,
        status: status.name,
        markedBy: authProvider.teacher?.id,
      );

      if (result['success']) {
        // Show brief success indicator
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.check_circle, color: Colors.white, size: 16),
                  const SizedBox(width: 8),
                  Text(
                    '${context.tr('attendance.saved_status')}: ${_getStatusDisplayName(status)}',
                  ),
                ],
              ),
              backgroundColor: Colors.green.shade600,
              duration: const Duration(seconds: 1),
              behavior: SnackBarBehavior.floating,
              margin: const EdgeInsets.only(bottom: 80, left: 16, right: 16),
            ),
          );
        }
      } else {
        // Revert the change if save failed
        final recordIndex = attendanceRecords.indexWhere(
          (r) => r.studentId == studentId,
        );
        if (recordIndex != -1) {
          setState(() {
            attendanceRecords[recordIndex] = attendanceRecords[recordIndex]
                .copyWith(
                  status: status == AttendanceStatus.present
                      ? AttendanceStatus.absent
                      : AttendanceStatus.present,
                );
          });
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.error, color: Colors.white, size: 16),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(context.tr('attendance.failed_to_save')),
                  ),
                ],
              ),
              backgroundColor: Colors.red.shade600,
              action: SnackBarAction(
                label: context.tr('attendance.retry'),
                textColor: Colors.white,
                onPressed: () => _autoSaveAttendance(studentId, status),
              ),
            ),
          );
        }
      }
    } catch (e) {
      // Revert the change if save failed
      final recordIndex = attendanceRecords.indexWhere(
        (r) => r.studentId == studentId,
      );
      if (recordIndex != -1) {
        setState(() {
          attendanceRecords[recordIndex] = attendanceRecords[recordIndex]
              .copyWith(
                status: status == AttendanceStatus.present
                    ? AttendanceStatus.absent
                    : AttendanceStatus.present,
              );
        });
      }
    } finally {
      // Remove saving state for this student
      setState(() {
        savingStates.remove(studentId);
      });
    }
  }

  // Removed _saveAllAttendance since auto-save is enabled and manual sync is no longer needed.

  void _toggleAttendance(int index) {
    final currentRecord = attendanceRecords[index];
    final newStatus = currentRecord.status == AttendanceStatus.present
        ? AttendanceStatus.absent
        : AttendanceStatus.present;

    // Update UI immediately for better UX
    setState(() {
      attendanceRecords[index] = currentRecord.copyWith(status: newStatus);
    });

    // Auto-save to server
    _autoSaveAttendance(currentRecord.studentId, newStatus);
  }

  void _markAllPresent() {
    setState(() {
      attendanceRecords = attendanceRecords.map((record) {
        return record.copyWith(status: AttendanceStatus.present);
      }).toList();
    });

    // Auto-save all changes
    for (final record in attendanceRecords) {
      _autoSaveAttendance(record.studentId, AttendanceStatus.present);
    }
  }

  void _markAllAbsent() {
    setState(() {
      attendanceRecords = attendanceRecords.map((record) {
        return record.copyWith(status: AttendanceStatus.absent);
      }).toList();
    });

    // Auto-save all changes
    for (final record in attendanceRecords) {
      _autoSaveAttendance(record.studentId, AttendanceStatus.absent);
    }
  }

  String _getStatusDisplayName(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.present:
        return context.tr('attendance.present');
      case AttendanceStatus.absent:
        return context.tr('attendance.absent');
    }
  }

  @override
  Widget build(BuildContext context) {
    final presentCount = attendanceRecords
        .where((r) => r.status == AttendanceStatus.present)
        .length;
    final totalCount = attendanceRecords.length;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.schedule.subject.name,
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            Text(
              widget.schedule.stage.name,
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
        actions: [
          if (!isLoading)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert),
              onSelected: (value) {
                switch (value) {
                  case 'mark_all_present':
                    _markAllPresent();
                    break;
                  case 'mark_all_absent':
                    _markAllAbsent();
                    break;
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'mark_all_present',
                  child: Row(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: DSColors.success,
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(context.tr('attendance.mark_all_present')),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'mark_all_absent',
                  child: Row(
                    children: [
                      const Icon(Icons.cancel, color: DSColors.error, size: 20),
                      const SizedBox(width: 8),
                      Text(context.tr('attendance.mark_all_absent')),
                    ],
                  ),
                ),
              ],
            ),
        ],
      ),
      body: Column(
        children: [
          // Class Info Header (DS card)
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 8),
            child: Container(
              decoration: BoxDecoration(
                color: DSColors.white,
                borderRadius: BorderRadius.circular(DSRadii.large),
                boxShadow: const [DSShadows.card],
              ),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today,
                          color: DSColors.primary,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(widget.selectedDate),
                          style: DSTypography.body,
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: DSColors.primary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '$presentCount / $totalCount ${context.tr('attendance.present')}',
                            style: DSTypography.caption.copyWith(
                              color: DSColors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(
                          Icons.people,
                          color: DSColors.darkGray,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '${attendanceRecords.length} ${context.tr('attendance.students')}',
                          style: DSTypography.body.copyWith(
                            color: DSColors.charcoal,
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: DSColors.primary.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: DSColors.primary.withOpacity(0.2),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.save,
                                color: DSColors.primary,
                                size: 14,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                context.tr('attendance.auto_save_active'),
                                style: DSTypography.caption.copyWith(
                                  color: DSColors.charcoal,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Error Message
          if (errorMessage != null)
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red.shade200),
              ),
              child: Row(
                children: [
                  Icon(Icons.error, color: Colors.red.shade600, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      errorMessage!,
                      style: TextStyle(color: Colors.red.shade600),
                    ),
                  ),
                ],
              ),
            ),

          // Student List
          Expanded(
            child: isLoading
                ? const Center(child: CircularProgressIndicator())
                : attendanceRecords.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(
                          Icons.people_outline,
                          size: 64,
                          color: DSColors.darkGray,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          context.tr('attendance.no_students_found'),
                          style: DSTypography.h3.copyWith(
                            color: DSColors.darkGray,
                          ),
                        ),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: attendanceRecords.length,
                    itemBuilder: (context, index) {
                      final record = attendanceRecords[index];
                      final isPresent =
                          record.status == AttendanceStatus.present;
                      final isSavingThis =
                          savingStates[record.studentId] ?? false;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: DSColors.white,
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          boxShadow: const [DSShadows.card],
                        ),
                        child: InkWell(
                          onTap: isSavingThis
                              ? null
                              : () => _toggleAttendance(index),
                          borderRadius: BorderRadius.circular(DSRadii.large),
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              children: [
                                // Student Avatar
                                CircleAvatar(
                                  radius: 24,
                                  backgroundColor: isPresent
                                      ? DSColors.success.withOpacity(0.15)
                                      : DSColors.error.withOpacity(0.15),
                                  child: Text(
                                    record.studentName.isNotEmpty
                                        ? record.studentName[0].toUpperCase()
                                        : 'S',
                                    style: TextStyle(
                                      color: isPresent
                                          ? DSColors.success
                                          : DSColors.error,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18,
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
                                        record.studentName,
                                        style: DSTypography.h3,
                                      ),
                                      const SizedBox(height: 4),
                                      // Student code removed per requirements
                                      const SizedBox.shrink(),
                                    ],
                                  ),
                                ),

                                // Saving indicator or Attendance Status
                                if (isSavingThis)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: DSColors.primary.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                        color: DSColors.primary.withOpacity(
                                          0.25,
                                        ),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        SizedBox(
                                          width: 12,
                                          height: 12,
                                          child: CircularProgressIndicator(
                                            strokeWidth: 2,
                                            valueColor: AlwaysStoppedAnimation(
                                              DSColors.primary,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          context.tr('attendance.saving'),
                                          style: DSTypography.caption.copyWith(
                                            color: DSColors.primary,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  )
                                else
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: isPresent
                                          ? DSColors.success
                                          : DSColors.error,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          isPresent
                                              ? Icons.check_circle
                                              : Icons.cancel,
                                          color: DSColors.white,
                                          size: 16,
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          isPresent
                                              ? context.tr('attendance.present')
                                              : context.tr('attendance.absent'),
                                          style: DSTypography.caption.copyWith(
                                            color: DSColors.white,
                                            fontWeight: FontWeight.w600,
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
                    },
                  ),
          ),
        ],
      ),
      bottomNavigationBar: null,
    );
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      return '${date.day} ${months[date.month - 1]} ${date.year}';
    } catch (e) {
      return dateStr;
    }
  }
}
