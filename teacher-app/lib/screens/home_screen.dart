import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../models/schedule.dart';
import '../models/teacher.dart';
import 'class_screen.dart';
import '../widgets/app_bar_logo_title.dart';
import '../widgets/rounded_icon_action.dart';
import 'chats_screen.dart';
import 'settings_screen.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'teacher_subjects_screen.dart';
// Removed direct navigation to students from home; available in bottom bar
import 'grades_management_screen.dart';
import '../theme/design_system.dart';
import 'login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    // Load today's schedule when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      authProvider.loadTodaySchedule();
    });
  }

  String _getLessonsHeader(String englishDay) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    final dayFull = _getTranslatedDay(englishDay);
    if (isRtl) {
      return 'دروس $dayFull';
    } else {
      return 'Lessons $dayFull';
    }
  }

  Widget _buildSubjectsCarousel(Teacher teacher, bool isRtl) {
    final scrollDirection = Axis.horizontal;
    final controller = ScrollController();
    // Removed gradient helper; subject cards use white background with purple trailing icon

    return Directionality(
      textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
      child: SizedBox(
        height: 132,
        child: ListView.separated(
          controller: controller,
          scrollDirection: scrollDirection,
          padding: const EdgeInsets.symmetric(
            horizontal: DSSpacing.containerPadding,
          ),
          itemCount: teacher.subjects.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (context, index) {
            final subject = teacher.subjects[index];
            return GestureDetector(
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) =>
                        TeacherSubjectsScreen(filterSubjectName: subject.name),
                  ),
                );
              },
              child: Container(
                width: 200,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: DSColors.white,
                  borderRadius: BorderRadius.circular(DSRadii.large),
                  boxShadow: const [DSShadows.card],
                ),
                child: Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    // Text content with right padding to avoid overlap with trailing icon
                    Padding(
                      padding: const EdgeInsets.only(right: 60),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            subject.name,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            textAlign: TextAlign.start,
                            style: DSTypography.body.copyWith(
                              fontWeight: FontWeight.w700,
                              color: DSColors.charcoal,
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Trailing circular purple icon (always on the physical right)
                    Align(
                      alignment: Alignment.centerRight,
                      child: Container(
                        width: 48,
                        height: 48,
                        decoration: const BoxDecoration(
                          color: DSColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Center(
                          child: Icon(
                            LineAwesomeIcons.book_solid,
                            color: DSColors.white,
                            size: 24,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
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
            return _buildGuestHome(context);
          }

          final isRtl = Directionality.of(context) == TextDirection.rtl;

          return RefreshIndicator(
            onRefresh: () async {
              // Reload profile and today's schedule, and refresh selected day
              await authProvider.refreshProfile();
              await authProvider.loadTodaySchedule();
              // Re-fetch the selected day to ensure the section updates
              await authProvider.loadDailySchedule(authProvider.selectedDay);
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  const SizedBox(height: 16),

                  // Title: My subjects
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: DSSpacing.containerPadding,
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          LineAwesomeIcons.book_solid,
                          color: DSColors.primary,
                          size: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          context.tr('home.subjects'),
                          style: DSTypography.h3.copyWith(
                            color: DSColors.charcoal,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Subjects horizontal cards
                  _buildSubjectsCarousel(teacher, isRtl),
                  // Grades card directly under subjects
                  const SizedBox(height: 12),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: DSSpacing.containerPadding,
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          LineAwesomeIcons.award_solid,
                          color: DSColors.primary,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          context.tr('home.grades'),
                          style: DSTypography.h3.copyWith(
                            color: DSColors.charcoal,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: DSSpacing.containerPadding,
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: _buildStatCard(
                            title: context.tr('home.grades'),
                            count: _getTotalGrades(teacher).toString(),
                            icon: LineAwesomeIcons.award_solid,
                            color: DSColors.primary,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) =>
                                      const GradesManagementScreen(),
                                ),
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Week Days Navigation
                  _buildWeekDaysNavigation(authProvider),
                  const SizedBox(height: 16),

                  // Schedule Section
                  _buildScheduleSection(authProvider),
                  const SizedBox(height: 24),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildGuestHome(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(DSSpacing.containerPadding),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: DSColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(24),
              ),
              child: const Icon(
                Icons.lock_outline,
                size: 80,
                color: DSColors.primary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              context.tr('guest.home_title', fallback: 'Welcome'),
              style: DSTypography.h2.copyWith(color: DSColors.charcoal),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr(
                'guest.home_message',
                fallback: 'Login to view your schedule and subjects.',
              ),
              textAlign: TextAlign.center,
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
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

  Widget _buildWeekDaysNavigation(AuthProvider authProvider) {
    const weekDays = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];

    final weekDaysTranslated = weekDays.map(_getTranslatedDay).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: DSSpacing.containerPadding,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                LineAwesomeIcons.calendar_alt_solid,
                color: DSColors.primary,
              ),
              const SizedBox(width: 8),
              Text(
                context.tr('home.schedule'),
                style: DSTypography.h3.copyWith(color: DSColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: weekDays.length,
              itemBuilder: (context, index) {
                final day = weekDays[index];
                final isSelected = authProvider.selectedDay == day;
                final isToday = day == _getCurrentDay();

                return Padding(
                  padding: EdgeInsets.only(
                    right: index < weekDays.length - 1 ? 12 : 0,
                  ),
                  child: GestureDetector(
                    onTap: () => authProvider.selectDay(day),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected ? DSColors.primary : DSColors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: isToday
                              ? DSColors.orange
                              : DSColors.mediumGray,
                          width: isToday ? 2 : 1,
                        ),
                        boxShadow: const [DSShadows.micro],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            weekDaysTranslated[index],
                            style: DSTypography.caption.copyWith(
                              color: isSelected
                                  ? DSColors.white
                                  : DSColors.charcoal,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          if (isToday)
                            Container(
                              margin: const EdgeInsets.only(top: 2),
                              width: 4,
                              height: 4,
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? DSColors.white
                                    : DSColors.orange,
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
      ),
    );
  }

  Widget _buildScheduleSection(AuthProvider authProvider) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: DSSpacing.containerPadding,
      ),
      child: Container(
        decoration: BoxDecoration(
          color: DSColors.white,
          borderRadius: BorderRadius.circular(DSRadii.large),
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
                    LineAwesomeIcons.calendar_alt_solid,
                    color: DSColors.primary,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _getLessonsHeader(authProvider.selectedDay),
                    style: DSTypography.h3.copyWith(color: DSColors.primary),
                  ),
                  const Spacer(),
                  if (authProvider.isLoadingSchedule)
                    SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          DSColors.primary,
                        ),
                      ),
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
                    Directionality.of(context) == TextDirection.rtl
                        ? 'لا يوجد جدول متاح'
                        : 'No schedule available',
                    style: const TextStyle(color: DSColors.darkGray),
                  ),
                ),
              )
            else if (authProvider.selectedDaySchedule!.classes.isEmpty)
              Padding(
                padding: const EdgeInsets.all(32),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(
                        LineAwesomeIcons.coffee_solid,
                        size: 48,
                        color: DSColors.darkGray,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        Directionality.of(context) == TextDirection.rtl
                            ? 'لا توجد دروس اليوم'
                            : 'No lessons today',
                        style: const TextStyle(
                          color: DSColors.darkGray,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.6,
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: authProvider.selectedDaySchedule!.classes.length,
                  separatorBuilder: (context, index) =>
                      const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final schedule =
                        authProvider.selectedDaySchedule!.classes[index];
                    return _buildScheduleItem(schedule, authProvider, index);
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildScheduleItem(
    Schedule schedule,
    AuthProvider authProvider,
    int index,
  ) {
    return InkWell(
      onTap: () => _navigateToClassScreen(schedule, authProvider),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 90,
              height: 60,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: DSColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: DSColors.primary.withValues(alpha: 0.25),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Text(
                  schedule.timeSlotString.isNotEmpty
                      ? schedule.timeSlotString
                      : '',
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
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    schedule.subject.name,
                    style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        LineAwesomeIcons.chalkboard_teacher_solid,
                        size: 14,
                        color: DSColors.darkGray,
                      ),
                      const SizedBox(width: 4),
                      Flexible(
                        child: Text(
                          schedule.stage.name,
                          style: DSTypography.body.copyWith(
                            color: DSColors.darkGray,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (schedule.stage.studentCount != null) ...[
                        const SizedBox(width: 8),
                        const Icon(
                          LineAwesomeIcons.users_solid,
                          size: 14,
                          color: DSColors.darkGray,
                        ),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(
                            Directionality.of(context) == TextDirection.rtl
                                ? 'طلاب ${schedule.stage.studentCount}'
                                : '${schedule.stage.studentCount} students',
                            style: DSTypography.body.copyWith(
                              color: DSColors.darkGray,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              Directionality.of(context) == TextDirection.rtl
                  ? LineAwesomeIcons.angle_left_solid
                  : LineAwesomeIcons.angle_right_solid,
              color: DSColors.mediumGray,
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  void _navigateToClassScreen(Schedule schedule, AuthProvider authProvider) {
    // Get current date for selected day
    final now = DateTime.now();
    String selectedDate;

    if (authProvider.selectedDay == _getCurrentDay()) {
      // If it's today, use today's date
      selectedDate =
          '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    } else {
      // Calculate the date for the selected day
      final currentWeekday = now.weekday;
      final targetWeekday = _getWeekdayNumber(authProvider.selectedDay);
      final daysDifference = targetWeekday - currentWeekday;
      final targetDate = now.add(Duration(days: daysDifference));
      selectedDate =
          '${targetDate.year}-${targetDate.month.toString().padLeft(2, '0')}-${targetDate.day.toString().padLeft(2, '0')}';
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            ClassScreen(schedule: schedule, selectedDate: selectedDate),
      ),
    );
  }

  int _getWeekdayNumber(String dayName) {
    const dayMap = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7,
    };
    return dayMap[dayName] ?? 1;
  }

  String _getCurrentDay() {
    final now = DateTime.now();
    const days = [
      'Monday', // weekday 1
      'Tuesday', // weekday 2
      'Wednesday', // weekday 3
      'Thursday', // weekday 4
      'Friday', // weekday 5
      'Saturday', // weekday 6
      'Sunday', // weekday 7
    ];
    // weekday is 1 (Monday) to 7 (Sunday)
    return days[now.weekday - 1];
  }

  Widget _buildStatCard({
    required String title,
    required String count,
    required IconData icon,
    required Color color,
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: DSColors.white,
          borderRadius: BorderRadius.circular(DSRadii.large),
          boxShadow: const [DSShadows.card],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: DSColors.lightGray,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(count, style: DSTypography.h2),
            Text(
              title,
              style: DSTypography.caption.copyWith(color: DSColors.darkGray),
            ),
            if (onTap != null) const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }

  // Removed _getTotalStudents since the Students card is no longer on Home

  int _getTotalGrades(Teacher teacher) {
    // For now, return the number of subjects as we don't have grade data in the teacher model
    // This could be updated later to fetch actual grade counts from the API
    return teacher.subjects.length;
  }

  String _getTranslatedDay(String englishDay) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    if (!isRtl) return englishDay; // Full English day name
    switch (englishDay) {
      case 'Monday':
        return 'الاثنين';
      case 'Tuesday':
        return 'الثلاثاء';
      case 'Wednesday':
        return 'الأربعاء';
      case 'Thursday':
        return 'الخميس';
      case 'Friday':
        return 'الجمعة';
      case 'Saturday':
        return 'السبت';
      case 'Sunday':
        return 'الأحد';
      default:
        return englishDay;
    }
  }
}
