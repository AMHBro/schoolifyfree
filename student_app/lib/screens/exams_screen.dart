import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:intl/intl.dart' as intl;
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../models/exam.dart';
import '../widgets/linkified_text.dart';
import '../widgets/schoolify_app_bar.dart';
import '../theme/design_system.dart';

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
  // Removed unused flag

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_onTabChanged);
    _loadExams();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    // Trigger rebuild on tab change; filtering is handled by separate lists
    setState(() {});
  }

  Future<void> _loadExams() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token == null) {
      setState(() {
        _allExams = [];
        _upcomingExams = [];
        _isLoading = false;
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
      final allExamsResult = await ApiService.getExams(
        token,
        page: 1,
        limit: 100,
        upcomingOnly: false,
      );

      // Load upcoming exams
      final upcomingExamsResult = await ApiService.getExams(
        token,
        page: 1,
        limit: 100,
        upcomingOnly: true,
      );

      if (allExamsResult['success'] && upcomingExamsResult['success']) {
        final allExamsData = ExamResponse.fromJson(allExamsResult['data']);
        final upcomingExamsData = ExamResponse.fromJson(
          upcomingExamsResult['data'],
        );

        if (mounted) {
          setState(() {
            _allExams = allExamsData.exams;
            _upcomingExams = upcomingExamsData.exams;
            _isLoading = false;
          });
        }
      } else {
        final offline =
            (allExamsResult['code'] == 'NETWORK_OFFLINE') ||
            (upcomingExamsResult['code'] == 'NETWORK_OFFLINE');
        if (mounted) {
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
          _errorMessage = context.tr('exams.failed_to_load');
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            backgroundColor: DSColors.lightGray,
            appBar: SchoolifyAppBar(
              bottom: TabBar(
                controller: _tabController,
                indicator: const UnderlineTabIndicator(
                  borderSide: BorderSide(color: DSColors.primary, width: 2),
                ),
                labelColor: DSColors.charcoal,
                unselectedLabelColor: DSColors.darkGray,
                labelStyle: DSTypography.body,
                tabs: [
                  Tab(
                    icon: const Icon(
                      LineAwesomeIcons.calendar_check_solid,
                      size: 18,
                    ),
                    text: context.tr('exams.tabs.upcoming'),
                  ),
                  Tab(
                    icon: const Icon(
                      LineAwesomeIcons.clipboard_list_solid,
                      size: 18,
                    ),
                    text: context.tr('exams.tabs.all_exams'),
                  ),
                ],
              ),
            ),
            body: TabBarView(
              controller: _tabController,
              children: [
                _buildExamsList(_upcomingExams, isUpcoming: true),
                _buildExamsList(_allExams, isUpcoming: false),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildExamsList(List<Exam> exams, {required bool isUpcoming}) {
    if (Provider.of<AuthProvider>(context, listen: false).token == null) {
      return _guestPlaceholder();
    }
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              context.tr('exams.loading_exams'),
              style: DSTypography.body.copyWith(color: DSColors.charcoal),
            ),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              LineAwesomeIcons.exclamation_circle_solid,
              size: 64,
              color: DSColors.error,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: DSTypography.body.copyWith(color: DSColors.error),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _loadExams,
              child: Text(
                context.tr('exams.retry'),
                style: DSTypography.body.copyWith(color: DSColors.white),
              ),
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
            const Icon(
              LineAwesomeIcons.clipboard_solid,
              size: 64,
              color: DSColors.mediumGray,
            ),
            const SizedBox(height: 16),
            Text(
              isUpcoming
                  ? context.tr('exams.no_upcoming_exams')
                  : context.tr('exams.no_exams'),
              style: DSTypography.h3.copyWith(color: DSColors.darkGray),
            ),
            const SizedBox(height: 8),
            Text(
              isUpcoming
                  ? context.tr('exams.no_upcoming_subtitle')
                  : context.tr('exams.no_exams_subtitle'),
              textAlign: TextAlign.center,
              style: DSTypography.caption,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      color: DSColors.primary,
      backgroundColor: DSColors.white,
      onRefresh: _loadExams,
      child: ListView.builder(
        padding: EdgeInsets.all(DSSpacing.containerPadding),
        itemCount: exams.length,
        itemBuilder: (context, index) {
          final exam = exams[index];
          return _buildExamCard(exam);
        },
      ),
    );
  }

  Widget _guestPlaceholder() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            LineAwesomeIcons.calendar_solid,
            size: 64,
            color: DSColors.primary,
          ),
          const SizedBox(height: 16),
          Text(
            context.tr('guest.exams_title'),
            style: DSTypography.h3.copyWith(color: DSColors.charcoal),
          ),
          const SizedBox(height: 8),
          Text(
            context.tr('guest.exams_message'),
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
        borderRadius: BorderRadius.circular(DSRadii.large),
        boxShadow: const [DSShadows.card],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with status
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.10),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(DSRadii.large),
                topRight: Radius.circular(DSRadii.large),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    statusText,
                    style: DSTypography.caption.copyWith(
                      color: DSColors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  _formatDateLocalized(exam.examDate),
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
                      icon: LineAwesomeIcons.school_solid,
                      label: exam.stage.name,
                      color: DSColors.primary,
                    ),
                    const SizedBox(width: 8),
                    _buildDetailChip(
                      icon: LineAwesomeIcons.book_solid,
                      label: exam.subject.name,
                      color: DSColors.success,
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                Row(
                  children: [
                    _buildDetailChip(
                      icon: LineAwesomeIcons.map_marker_solid,
                      label: exam.classNumber,
                      color: DSColors.primary,
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                _buildDetailChip(
                  icon: LineAwesomeIcons.user_solid,
                  label: exam.teacher.name,
                  color: DSColors.primary,
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: DSTypography.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  // Localized date formatter (day and month name), no time
  String _formatDateLocalized(DateTime date) {
    final locale = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    ).currentLocale.languageCode;
    // Numeric-only date, e.g., 12/01/2025 (locale aware digits)
    final formatter = intl.DateFormat('dd/MM/yyyy', locale);
    return formatter.format(date);
  }
}
