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
import '../services/exam_service.dart';
import '../models/exam.dart';
import 'create_exam_screen.dart';
import 'login_screen.dart';
import 'edit_exam_screen.dart';
import '../widgets/linkified_text.dart';

class ExamsScreen extends StatefulWidget {
  const ExamsScreen({super.key});

  @override
  State<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends State<ExamsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Exam> _allExams = [];
  List<Exam> _upcomingExams = [];
  bool _isLoading = true;
  String? _errorMessage;
  // bool _showUpcomingOnly = true; // reserved for future filtering UI

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadExams();
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

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {}

  Future<void> _loadExams() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      setState(() {
        _isLoading = false;
        _allExams = [];
        _upcomingExams = [];
        _errorMessage = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Load all exams
      final allExamsResult = await ExamService.getExams(
        token: token,
        page: 1,
        limit: 100,
        upcomingOnly: false,
      );

      // Load upcoming exams
      final upcomingExamsResult = await ExamService.getExams(
        token: token,
        page: 1,
        limit: 100,
        upcomingOnly: true,
      );

      if (allExamsResult['success'] && upcomingExamsResult['success']) {
        final allExamsData = ExamResponse.fromJson(
          allExamsResult['data']['data'],
        );
        final upcomingExamsData = ExamResponse.fromJson(
          upcomingExamsResult['data']['data'],
        );

        if (mounted) {
          setState(() {
            _allExams = allExamsData.exams;
            _upcomingExams = upcomingExamsData.exams;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          final offline =
              allExamsResult['code'] == 'NETWORK_OFFLINE' ||
              upcomingExamsResult['code'] == 'NETWORK_OFFLINE' ||
              ((allExamsResult['message'] ?? '')
                  .toString()
                  .toUpperCase()
                  .contains('NETWORK_OFFLINE')) ||
              ((upcomingExamsResult['message'] ?? '')
                  .toString()
                  .toUpperCase()
                  .contains('NETWORK_OFFLINE'));
          setState(() {
            _errorMessage = offline
                ? context.tr('common.offline_message')
                : (allExamsResult['message'] ??
                      upcomingExamsResult['message'] ??
                      context.tr('exams.failed_to_load'));
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = context.tr('common.offline_message');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _editExam(Exam exam) async {
    final result = await Navigator.of(
      context,
    ).push(MaterialPageRoute(builder: (context) => EditExamScreen(exam: exam)));

    if (result == true) {
      _loadExams(); // Reload exams if the exam was updated
    }
  }

  Future<void> _deleteExam(String examId, String examTitle) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) return;

    // Show confirmation dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(context.tr('exams.delete_dialog.title')),
        content: Text(
          context.tr(
            'exams.delete_dialog.message',
            params: {'examTitle': examTitle},
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text(context.tr('exams.delete_dialog.cancel')),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: Text(context.tr('exams.delete_dialog.confirm')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      final result = await ExamService.deleteExam(token: token, examId: examId);

      if (result['success']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                context.tr(
                  'exams.success_messages.exam_deleted',
                  params: {'examTitle': examTitle},
                ),
              ),
            ),
          );
          _loadExams(); // Reload exams
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                result['message'] ??
                    context.tr('exams.error_messages.delete_failed'),
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
              context.tr(
                'exams.error_messages.error_deleting',
                params: {'error': e.toString()},
              ),
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
            icon: Icon(LineAwesomeIcons.comment_alt_solid, size: 22),
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
              icon: Icon(LineAwesomeIcons.user_solid, size: 22),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const SettingsScreen()),
                );
              },
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: DSColors.primary,
          labelColor: DSColors.primary,
          unselectedLabelColor: DSColors.darkGray,
          tabs: [
            Tab(text: context.tr('exams.tabs.upcoming')),
            Tab(text: context.tr('exams.tabs.all_exams')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          RefreshIndicator(
            onRefresh: _loadExams,
            child: _buildExamsList(_upcomingExams, isUpcoming: true),
          ),
          RefreshIndicator(
            onRefresh: _loadExams,
            child: _buildExamsList(_allExams, isUpcoming: false),
          ),
        ],
      ),
      floatingActionButton:
          Provider.of<AuthProvider>(context, listen: false).token == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () async {
                final result = await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const CreateExamScreen(),
                  ),
                );

                if (result == true) {
                  _loadExams(); // Reload exams if a new one was created
                }
              },
              backgroundColor: DSColors.primary,
              label: Text(
                context.tr('exams.new_exam'),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
              icon: const Icon(Icons.add, color: Colors.white),
            ),
    );
  }

  Widget _buildExamsList(List<Exam> exams, {required bool isUpcoming}) {
    if (Provider.of<AuthProvider>(context, listen: false).token == null) {
      return _buildGuestPlaceholder();
    }

    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(context.tr('exams.loading_exams')),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: DSTypography.body.copyWith(color: DSColors.error),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadExams,
              style: ElevatedButton.styleFrom(
                backgroundColor: DSColors.primary,
                foregroundColor: Colors.white,
              ),
              child: Text(context.tr('exams.retry')),
            ),
          ],
        ),
      );
    }

    if (exams.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.assignment_outlined,
              size: 64,
              color: DSColors.mediumGray,
            ),
            const SizedBox(height: 16),
            Text(
              isUpcoming
                  ? context.tr('exams.no_upcoming_exams')
                  : context.tr('exams.no_exams'),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              isUpcoming
                  ? context.tr('exams.no_upcoming_subtitle')
                  : context.tr('exams.no_exams_subtitle'),
              textAlign: TextAlign.center,
              style: DSTypography.caption.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadExams,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        physics: const AlwaysScrollableScrollPhysics(),
        itemCount: exams.length,
        itemBuilder: (context, index) {
          final exam = exams[index];
          return _buildExamCard(exam);
        },
      ),
    );
  }

  Widget _buildGuestPlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.lock_outline, size: 64, color: DSColors.primary),
          const SizedBox(height: 16),
          Text(
            context.tr('guest.exams_title', fallback: 'Exams'),
            style: DSTypography.h3.copyWith(color: DSColors.charcoal),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr(
              'guest.exams_message',
              fallback: 'Login to view and manage exams.',
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
    );
  }

  Widget _buildExamCard(Exam exam) {
    final isUpcoming = exam.isUpcoming;
    final isToday = exam.isToday;

    Color statusColor = DSColors.darkGray;
    String statusText = context.tr('exams.status.past');

    if (isToday) {
      statusColor = DSColors.error;
      statusText = context.tr('exams.status.today');
    } else if (isUpcoming) {
      statusColor = DSColors.success;
      statusText = context.tr('exams.status.upcoming');
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: DSColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [DSShadows.card],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with status
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(16),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    statusText,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  exam.formattedDate,
                  style: DSTypography.body.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  exam.title,
                  style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                ),

                if (exam.description != null &&
                    exam.description!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  LinkifiedText(
                    text: exam.description!,
                    style: DSTypography.body.copyWith(color: DSColors.darkGray),
                  ),
                ],

                const SizedBox(height: 12),

                // Details row
                Row(
                  children: [
                    _buildDetailChip(
                      icon: Icons.school,
                      label: exam.stage.name,
                      color: DSColors.primary,
                    ),
                    const SizedBox(width: 8),
                    _buildDetailChip(
                      icon: Icons.book,
                      label: exam.subject.name,
                      color: DSColors.success,
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                Row(
                  children: [
                    _buildDetailChip(
                      icon: Icons.access_time,
                      label: _formatTime(exam.examDate),
                      color: DSColors.warning,
                    ),
                    const SizedBox(width: 8),
                    _buildDetailChip(
                      icon: Icons.location_on,
                      label: exam.classNumber,
                      color: DSColors.primary,
                    ),
                  ],
                ),

                const SizedBox(height: 16),

                // Actions
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton.icon(
                      onPressed: () => _deleteExam(exam.id, exam.title),
                      icon: const Icon(Icons.delete_outline, size: 18),
                      label: Text(context.tr('exams.actions.delete')),
                      style: TextButton.styleFrom(foregroundColor: Colors.red),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton.icon(
                      onPressed: () => _editExam(exam),
                      icon: const Icon(Icons.edit, size: 18),
                      label: Text(context.tr('exams.actions.edit')),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: DSColors.primary,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailChip({
    required IconData icon,
    required String label,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final hour = dateTime.hour;
    final minute = dateTime.minute;
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour > 12 ? hour - 12 : (hour == 0 ? 12 : hour);
    return '${displayHour.toString().padLeft(2, '0')}:${minute.toString().padLeft(2, '0')} $period';
  }
}
