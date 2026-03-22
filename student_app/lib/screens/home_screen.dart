import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:intl/intl.dart' as intl;
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../models/schedule.dart';
import '../theme/design_system.dart';
import '../services/api_service.dart';
// Removed subjects screen import since subjects section is no longer on Home
import '../models/post.dart';
import '../models/exam.dart';
import 'post_details_screen.dart';
import 'exam_details_screen.dart';
import '../widgets/schoolify_app_bar.dart';
import '../widgets/linkified_text.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Subjects section removed

  // Latest posts state
  bool _isLoadingPosts = false;
  String? _postsError;
  List<TeacherPost> _latestPosts = [];

  // Recent exams state
  bool _isLoadingExams = false;
  String? _examsError;
  List<Exam> _recentExams = [];

  // Cache: which days have lessons (computed from daily schedule API)
  final Map<String, bool> _hasLessonsByDay = {};
  bool _isCheckingDaysAvailability = false;

  @override
  void initState() {
    super.initState();
    // Load schedule when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      authProvider.loadWeeklySchedule();
      _loadLatestPosts();
      _loadRecentExams();
      _preloadDaysAvailability();
    });
  }

  bool _dayHasLessons(AuthProvider authProvider, String dayEnglish) {
    final weekly = authProvider.weeklySchedule;
    if (weekly == null) return false;
    final Map<String, dynamic> container = (weekly['data'] is Map)
        ? Map<String, dynamic>.from(weekly['data'])
        : Map<String, dynamic>.from(weekly);

    final String dayArabic = _getTranslatedDay(dayEnglish);
    final dynamic dayData =
        container[dayEnglish] ??
        container[dayEnglish.toLowerCase()] ??
        container[dayArabic];

    if (dayData == null) return false;
    if (dayData is Map) {
      final dynamic classes =
          dayData['classes'] ?? dayData['lessons'] ?? dayData['items'];
      if (classes is List) return classes.isNotEmpty;
    }
    if (dayData is List) {
      return dayData.isNotEmpty;
    }
    return false;
  }

  // Removed subjects loader

  Future<void> _loadLatestPosts() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) {
      await Future.delayed(const Duration(milliseconds: 200));
      if (!mounted || authProvider.token == null) return;
    }

    setState(() {
      _isLoadingPosts = true;
      _postsError = null;
      _latestPosts = [];
    });

    try {
      // Get student's subjects first
      final subjectsResp = await ApiService.getSubjects(authProvider.token!);
      if (subjectsResp['success'] != true) {
        setState(() {
          _postsError = subjectsResp['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (subjectsResp['message'] ?? context.tr('posts.error_occurred'));
        });
        return;
      }

      // Normalize subjects array
      List<dynamic> subjects = [];
      final data = subjectsResp['data'];
      if (data is List) {
        subjects = data;
      } else if (data is Map<String, dynamic> && data['subjects'] is List) {
        subjects = List<dynamic>.from(data['subjects']);
      }

      // Fetch a few recent posts per subject, then merge, filter last 7 days, sort, take top 5
      final now = DateTime.now();
      final sevenDaysAgo = now.subtract(const Duration(days: 7));
      final List<TeacherPost> collected = [];

      // Limit subjects to avoid excessive calls if many exist
      final int subjectLimit = subjects.length > 8 ? 8 : subjects.length;
      for (int i = 0; i < subjectLimit; i++) {
        final subj = subjects[i] as Map<String, dynamic>;
        final subjectId = (subj['id'] ?? '').toString();
        if (subjectId.isEmpty) continue;

        final postsResp = await ApiService.getPostsForSubject(
          authProvider.token!,
          subjectId,
          page: 1,
          limit: 5,
        );

        if (postsResp['success'] == true && postsResp['data'] != null) {
          final postsData = postsResp['data'];
          final postsList = (postsData['posts'] as List? ?? [])
              .map((p) => TeacherPost.fromJson(p as Map<String, dynamic>))
              .where((p) => p.createdAt.isAfter(sevenDaysAgo))
              .toList();
          collected.addAll(postsList);
        }
      }

      collected.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      setState(() {
        _latestPosts = collected.take(5).toList();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _postsError = context.tr('common.offline_message');
        _latestPosts = [];
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingPosts = false;
        });
      }
    }
  }

  Future<void> _loadRecentExams() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) {
      await Future.delayed(const Duration(milliseconds: 200));
      if (!mounted || authProvider.token == null) return;
    }

    setState(() {
      _isLoadingExams = true;
      _examsError = null;
      _recentExams = [];
    });

    try {
      final resp = await ApiService.getExams(
        authProvider.token!,
        page: 1,
        limit: 100,
        upcomingOnly: false,
      );
      if (resp['success'] != true) {
        setState(() {
          _examsError = resp['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (resp['message'] ?? context.tr('exams.failed_to_load'));
        });
        return;
      }

      final examsResponse = ExamResponse.fromJson(resp['data']);
      final now = DateTime.now();
      final sevenDaysAgo = now.subtract(const Duration(days: 7));
      final sevenDaysAhead = now.add(const Duration(days: 7));

      final recent =
          examsResponse.exams
              .where(
                (e) =>
                    !e.examDate.isBefore(sevenDaysAgo) &&
                    !e.examDate.isAfter(sevenDaysAhead),
              )
              .toList()
            ..sort((a, b) => b.examDate.compareTo(a.examDate));

      setState(() {
        _recentExams = recent.take(5).toList();
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _examsError = context.tr('common.offline_message');
        _recentExams = [];
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingExams = false;
        });
      }
    }
  }

  Future<void> _preloadDaysAvailability() async {
    if (_isCheckingDaysAvailability) return;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.token == null) return;
    setState(() {
      _isCheckingDaysAvailability = true;
    });
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    try {
      for (final d in days) {
        try {
          final resp = await ApiService.getDailySchedule(
            authProvider.token!,
            d,
          );
          bool has = false;
          if (resp['success'] == true) {
            final data = resp['data'];
            if (data is Map<String, dynamic>) {
              final classes =
                  data['classes'] ?? data['lessons'] ?? data['items'];
              if (classes is List) has = classes.isNotEmpty;
            }
          }
          _hasLessonsByDay[d] = has;
        } catch (_) {}
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCheckingDaysAvailability = false;
        });
      }
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
            body: RefreshIndicator(
              onRefresh: () async {
                await authProvider.loadWeeklySchedule();
                await _loadLatestPosts();
                await _loadRecentExams();
              },
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildLatestPostsSection(),
                      const SizedBox(height: 20),
                      _buildLatestExamsSection(),
                      const SizedBox(height: 20),
                      _buildWeekDaysNavigation(authProvider),
                      const SizedBox(height: 16),
                      _buildScheduleSection(authProvider),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  // Removed local AppBar builders in favor of reusable SchoolifyAppBar

  // Removed student info widgets and subjects section to keep Home screen focused on posts, exams, and schedule

  Widget _buildLatestPostsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.campaign_outlined, color: DSColors.primary),
            const SizedBox(width: 8),
            Text(
              _t(
                context,
                'home.latest_posts',
                en: 'Latest Posts',
                ar: 'أحدث المنشورات',
              ),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_isLoadingPosts)
          const SizedBox(
            height: 120,
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (_postsError != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [DSShadows.card],
            ),
            child: Text(
              _postsError!,
              style: DSTypography.body.copyWith(color: DSColors.error),
            ),
          )
        else if (_latestPosts.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [DSShadows.card],
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  color: DSColors.darkGray,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _t(
                      context,
                      'home.no_recent_posts',
                      en: 'No recent posts in the last 7 days',
                      ar: 'لا توجد منشورات حديثة خلال آخر 7 أيام',
                    ),
                    style: DSTypography.body.copyWith(color: DSColors.darkGray),
                  ),
                ),
              ],
            ),
          )
        else
          SizedBox(
            height: 160,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _latestPosts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final post = _latestPosts[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => PostDetailsScreen(
                          postId: post.id,
                          subjectId: post.subject.id,
                          title: post.title.isNotEmpty ? post.title : 'Post',
                        ),
                      ),
                    );
                  },
                  child: Material(
                    color: Colors.white,
                    elevation: 2,
                    shadowColor: DSColors.charcoal.withValues(alpha: 0.08),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: SizedBox(
                      width: 280,
                      child: Row(
                        children: [
                          // Decorative placeholder (no images for posts)
                          ClipRRect(
                            borderRadius: const BorderRadius.only(
                              topLeft: Radius.circular(16),
                              bottomLeft: Radius.circular(16),
                            ),
                            child: Container(
                              width: 84,
                              height: 160,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                  colors: [
                                    DSColors.primary.withValues(alpha: 0.10),
                                    DSColors.primary.withValues(alpha: 0.18),
                                  ],
                                ),
                              ),
                              child: const Center(
                                child: Icon(
                                  LineAwesomeIcons.chalkboard_solid,
                                  color: DSColors.primary,
                                  size: 28,
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.all(14),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    post.title.isNotEmpty
                                        ? post.title
                                        : 'Post from ${post.teacher.name}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: DSTypography.h3.copyWith(
                                      color: DSColors.charcoal,
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  LinkifiedText(
                                    text: post.content,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: DSTypography.body.copyWith(
                                      color: DSColors.darkGray,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(
                                        Icons.access_time,
                                        size: 14,
                                        color: DSColors.darkGray,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        intl.DateFormat(
                                          'dd MMM yyyy',
                                          Localizations.localeOf(
                                            context,
                                          ).languageCode,
                                        ).format(post.createdAt),
                                        style: DSTypography.caption,
                                      ),
                                    ],
                                  ),
                                ],
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
          ),
      ],
    );
  }

  Widget _buildLatestExamsSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              LineAwesomeIcons.calendar_check_solid,
              color: DSColors.primary,
            ),
            const SizedBox(width: 8),
            Text(
              _t(
                context,
                'home.latest_exams',
                en: 'Latest Exams',
                ar: 'أحدث الامتحانات',
              ),
              style: DSTypography.h3.copyWith(color: DSColors.charcoal),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (_isLoadingExams)
          const SizedBox(
            height: 120,
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          )
        else if (_examsError != null)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [DSShadows.card],
            ),
            child: Text(
              _examsError!,
              style: DSTypography.body.copyWith(color: DSColors.error),
            ),
          )
        else if (_recentExams.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [DSShadows.card],
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  color: DSColors.darkGray,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _t(
                      context,
                      'home.no_recent_exams',
                      en: 'No recent exams in the last 7 days',
                      ar: 'لا توجد امتحانات حديثة خلال آخر 7 أيام',
                    ),
                    style: DSTypography.body.copyWith(color: DSColors.darkGray),
                  ),
                ),
              ],
            ),
          )
        else
          SizedBox(
            height: 150,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: _recentExams.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final exam = _recentExams[index];
                return GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ExamDetailsScreen(
                          examId: exam.id,
                          name: exam.title,
                          // pass hint data if needed
                        ),
                      ),
                    );
                  },
                  child: Material(
                    color: Colors.white,
                    elevation: 2,
                    shadowColor: DSColors.charcoal.withValues(alpha: 0.08),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: SizedBox(
                      width: 260,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              exam.title,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: DSTypography.h3.copyWith(
                                color: DSColors.charcoal,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(
                                  LineAwesomeIcons.book_solid,
                                  size: 14,
                                  color: DSColors.darkGray,
                                ),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    exam.subject.name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: DSTypography.body.copyWith(
                                      color: DSColors.darkGray,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(
                                  LineAwesomeIcons.clock_solid,
                                  size: 14,
                                  color: DSColors.darkGray,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  _formatDateTime(context, exam.examDate),
                                  style: DSTypography.caption,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }

  // Subjects section removed

  Widget _buildWeekDaysNavigation(AuthProvider authProvider) {
    final weekDaysEnglish = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    final weekDaysTranslated = [
      context.tr('home.monday'),
      context.tr('home.tuesday'),
      context.tr('home.wednesday'),
      context.tr('home.thursday'),
      context.tr('home.friday'),
      context.tr('home.saturday'),
      context.tr('home.sunday'),
    ];

    // Determine the real current day to highlight with the warning border
    final String currentDayEnglish =
        weekDaysEnglish[DateTime.now().weekday - 1];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              LineAwesomeIcons.calendar_solid,
              color: DSColors.primary,
            ),
            const SizedBox(width: 8),
            Text(
              context.tr('home.weekly_schedule'),
              style: DSTypography.h3.copyWith(color: DSColors.primary),
            ),
          ],
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 48,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: weekDaysEnglish.length,
            itemBuilder: (context, index) {
              final dayEnglish = weekDaysEnglish[index];
              final dayTranslated = weekDaysTranslated[index];
              final bool hasLessons =
                  _hasLessonsByDay[dayEnglish] ??
                  _dayHasLessons(authProvider, dayEnglish);
              final bool isSelected = authProvider.selectedDay == dayEnglish;
              final bool isToday = dayEnglish == currentDayEnglish;

              return Padding(
                padding: EdgeInsetsDirectional.only(
                  end: index < weekDaysEnglish.length - 1 ? 12 : 0,
                ),
                child: GestureDetector(
                  onTap: () => authProvider.selectDay(dayEnglish),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected ? DSColors.primary : DSColors.white,
                      borderRadius: BorderRadius.circular(25),
                      border: Border.all(
                        color: isToday ? DSColors.warning : DSColors.mediumGray,
                        width: isToday ? 1.5 : 1,
                      ),
                      boxShadow: const [DSShadows.card],
                    ),
                    child: Row(
                      children: [
                        Text(
                          dayTranslated,
                          style: DSTypography.body.copyWith(
                            color: isSelected
                                ? DSColors.white
                                : DSColors.charcoal,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (hasLessons)
                          Container(
                            margin: const EdgeInsetsDirectional.only(start: 6),
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isSelected
                                  ? DSColors.white
                                  : DSColors.warning,
                              shape: BoxShape.circle,
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
  }

  Widget _buildScheduleSection(AuthProvider authProvider) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [DSShadows.card],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Icon(
                  LineAwesomeIcons.calendar_day_solid,
                  color: DSColors.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  context
                      .tr(
                        'home.day_classes',
                        args: [_getTranslatedDay(authProvider.selectedDay)],
                      )
                      .replaceAll('Classes', 'Lessons')
                      .replaceAll('حصص', 'دروس'),
                  style: DSTypography.h3.copyWith(color: DSColors.primary),
                ),
                const Spacer(),
                if (authProvider.isLoadingSchedule)
                  const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          if (authProvider.isLoadingSchedule &&
              authProvider.selectedDaySchedule == null)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (authProvider.selectedDaySchedule == null)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Center(
                child: Text(
                  context.tr('home.no_schedule'),
                  style: DSTypography.body.copyWith(color: DSColors.darkGray),
                ),
              ),
            )
          else if (authProvider.selectedDaySchedule!['classes']?.isEmpty ??
              true)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    LineAwesomeIcons.calendar_minus_solid,
                    size: 48,
                    color: DSColors.darkGray.withValues(alpha: 0.6),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _t(
                      context,
                      'home.no_classes_today',
                      en: 'No lessons today',
                      ar: 'لا يوجد دروس اليوم',
                    ),
                    style: DSTypography.body.copyWith(color: DSColors.darkGray),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: authProvider.selectedDaySchedule!['classes'].length,
              separatorBuilder: (context, index) => Divider(
                height: 1,
                color: DSColors.mediumGray.withValues(alpha: 0.6),
              ),
              itemBuilder: (context, index) {
                final scheduleData =
                    authProvider.selectedDaySchedule!['classes'][index];
                final schedule = Schedule.fromJson(scheduleData);
                return _buildScheduleItem(schedule);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildScheduleItem(Schedule schedule) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 90,
            height: 60,
            decoration: BoxDecoration(
              color: DSColors.primary.withValues(alpha: 0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: DSColors.primary.withValues(alpha: 0.25),
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  child: Text(
                    schedule.timeSlotString,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: DSTypography.caption.copyWith(
                      fontSize: Directionality.of(context) == TextDirection.rtl
                          ? 11
                          : 13,
                      fontWeight: FontWeight.w700,
                      color: DSColors.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  schedule.subject.name,
                  style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(
                      LineAwesomeIcons.user_solid,
                      size: 14,
                      color: DSColors.darkGray.withValues(alpha: 0.9),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      schedule.teacher.name,
                      style: DSTypography.body.copyWith(
                        color: DSColors.darkGray,
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

  // Current day helper removed as selection highlight now follows selected day only

  String _getTranslatedDay(String englishDay) {
    final dayMap = {
      'Monday': context.tr('home.monday'),
      'Tuesday': context.tr('home.tuesday'),
      'Wednesday': context.tr('home.wednesday'),
      'Thursday': context.tr('home.thursday'),
      'Friday': context.tr('home.friday'),
      'Saturday': context.tr('home.saturday'),
      'Sunday': context.tr('home.sunday'),
    };
    return dayMap[englishDay] ?? englishDay;
  }

  String _formatDateTime(BuildContext context, DateTime dt) {
    // Show date only (e.g., 12/08/2025) without time
    final locale = Localizations.localeOf(context).languageCode;
    return intl.DateFormat('dd/MM/yyyy', locale).format(dt);
  }

  // Helper: translation with safe fallback in case localization files miss keys
  String _t(
    BuildContext context,
    String key, {
    required String en,
    required String ar,
  }) {
    try {
      final value = context.tr(key);
      if (value != key && value.trim().isNotEmpty) {
        return _sanitizeText(value);
      }
    } catch (_) {}
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    return _sanitizeText(isRtl ? ar : en);
  }

  String _sanitizeText(String input) {
    if (input.isEmpty) return input;
    var output = input.replaceAll('+_', '');
    output = output.replaceAll('±', '');
    return output.trim();
  }

  // Logout dialog removed to keep Home screen focused on schedule-only view
}

class AppBarLogoTitle extends StatelessWidget {
  const AppBarLogoTitle({super.key});

  @override
  Widget build(BuildContext context) {
    final textDirection = Directionality.of(context);
    final isRtl = textDirection == TextDirection.rtl;

    // Theme-based sizes and colors
    final textTheme = Theme.of(context).textTheme;
    final primaryTitleStyle = (textTheme.titleMedium ?? const TextStyle())
        .copyWith(
          fontWeight: FontWeight.w700,
          height: 0.9,
          color: DSColors.charcoal,
          fontSize: (textTheme.titleMedium?.fontSize ?? 16) * 0.75,
        );
    final secondaryTitleStyle = (textTheme.bodyMedium ?? const TextStyle())
        .copyWith(
          fontWeight: FontWeight.w400,
          height: 0.9,
          color: DSColors.charcoal,
          fontSize: (textTheme.bodyMedium?.fontSize ?? 14) * 0.75,
        );

    // Make the logo more prominent in the AppBar
    final logoHeightUnclamped = kToolbarHeight * 0.2; // larger than before
    final logoHeight = logoHeightUnclamped < 100.0
        ? 100.0
        : (logoHeightUnclamped > 100.0 ? 100.0 : logoHeightUnclamped);

    final logo = Padding(
      padding: const EdgeInsetsDirectional.only(start: 0, end: 1),
      child: Image.asset(
        'assets/images/schollify-purple.png',
        height: logoHeight,
        fit: BoxFit.contain,
      ),
    );

    final textBlock = Column(
      crossAxisAlignment: isRtl
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('Schoolify', style: primaryTitleStyle),
        const SizedBox(height: 2),
        Text('سكولي فاي', style: secondaryTitleStyle),
      ],
    );

    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        logo,
        Transform.translate(
          offset: Offset(isRtl ? 6 : -6, 0),
          child: textBlock,
        ),
      ],
    );

    return content;
  }
}
