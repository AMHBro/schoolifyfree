import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart' as intl;
import 'package:intl/date_symbol_data_local.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../models/attendance.dart';
import '../models/schedule.dart';
import '../theme/design_system.dart';
import '../widgets/schoolify_app_bar.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime _selectedDay = DateTime.now();
  CalendarFormat _calendarFormat = CalendarFormat.month;

  List<Attendance> _attendanceRecords = [];
  Map<String, List<Schedule>> _scheduleByDay = {};
  bool _isLoadingAttendance = false;
  bool _isLoadingSchedule = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeDateFormatting();
    _loadData();
  }

  Future<void> _initializeDateFormatting() async {
    final localizationProvider = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    );
    final locale = localizationProvider.currentLocale;

    // Initialize date formatting for the current locale
    await initializeDateFormatting(locale.languageCode, null);
  }

  Future<void> _loadData() async {
    await Future.wait([_loadAttendance(), _loadSchedule()]);
  }

  Future<void> _loadAttendance() async {
    setState(() {
      _isLoadingAttendance = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;

      if (token == null) {
        setState(() {
          _error = 'Authentication required';
          _isLoadingAttendance = false;
        });
        return;
      }

      // Load attendance for the current month
      final firstDay = DateTime(_focusedDay.year, _focusedDay.month, 1);
      final lastDay = DateTime(_focusedDay.year, _focusedDay.month + 1, 0);

      print(
        'Fetching attendance from ${firstDay.toIso8601String().split('T')[0]} to ${lastDay.toIso8601String().split('T')[0]}',
      );

      final result = await ApiService.getAttendance(
        token,
        fromDate: firstDay.toIso8601String().split('T')[0],
        toDate: lastDay.toIso8601String().split('T')[0],
      );

      print(
        'Attendance API response: success=${result['success']}, data count=${result['success'] ? (result['data'] as List).length : 0}',
      );

      if (result['success']) {
        final data = result['data'] as List;
        print('Loaded ${data.length} attendance records');
        setState(() {
          _attendanceRecords = data
              .map((json) => Attendance.fromJson(json))
              .toList();
          _isLoadingAttendance = false;
        });
        print('Attendance records updated in state');
      } else {
        setState(() {
          _error = result['message'] ?? 'Failed to load attendance';
          _isLoadingAttendance = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error loading attendance: $e';
        _isLoadingAttendance = false;
      });
    }
  }

  Future<void> _loadSchedule() async {
    setState(() {
      _isLoadingSchedule = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;

      if (token == null) {
        setState(() {
          _isLoadingSchedule = false;
        });
        return;
      }

      final result = await ApiService.getWeeklySchedule(token);

      if (result['success']) {
        final data = result['data'] as Map<String, dynamic>;
        // The schedule is nested under 'schedule' key
        final scheduleData = data['schedule'] as Map<String, dynamic>? ?? {};
        print('Schedule data received: ${scheduleData.keys.toList()}');

        setState(() {
          _scheduleByDay = scheduleData.map((day, schedules) {
            final scheduleList = (schedules as List)
                .map((json) => Schedule.fromJson(json))
                .toList();
            print('Day: $day, Schedule count: ${scheduleList.length}');
            return MapEntry(day, scheduleList);
          });
          _isLoadingSchedule = false;
        });

        print('Total schedule days loaded: ${_scheduleByDay.keys.length}');
      } else {
        print('Failed to load schedule: ${result['message']}');
        setState(() {
          _isLoadingSchedule = false;
        });
      }
    } catch (e) {
      setState(() {
        _isLoadingSchedule = false;
      });
    }
  }

  String _getDayOfWeek(DateTime date) {
    // Dart's weekday: Monday = 1, Sunday = 7
    // Backend uses: Monday, Tuesday, Wednesday, etc. (first letter capitalized)
    final days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return days[date.weekday - 1];
  }

  List<Attendance> _getAttendanceForDay(DateTime day) {
    final dateString = day.toIso8601String().split('T')[0];
    return _attendanceRecords
        .where((attendance) => attendance.date == dateString)
        .toList();
  }

  List<Schedule> _getScheduleForDay(DateTime day) {
    final dayOfWeek = _getDayOfWeek(day);
    return _scheduleByDay[dayOfWeek] ?? [];
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return Colors.green;
      case 'ABSENT':
        return Colors.red;
      case 'LATE':
        return Colors.orange;
      case 'EXCUSED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status.toUpperCase()) {
      case 'PRESENT':
        return context.tr('attendance.present');
      case 'ABSENT':
        return context.tr('attendance.absent');
      case 'LATE':
        return context.tr('attendance.late');
      case 'EXCUSED':
        return context.tr('attendance.excused');
      default:
        return status;
    }
  }

  // Helper method to determine text direction based on content
  TextDirection _getTextDirection(String text) {
    // Check if text contains Arabic characters
    final arabicRegex = RegExp(r'[\u0600-\u06FF]');
    return arabicRegex.hasMatch(text) ? TextDirection.rtl : TextDirection.ltr;
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = _isLoadingAttendance || _isLoadingSchedule;

    return Scaffold(
      appBar: const SchoolifyAppBar(),
      body: RefreshIndicator(
        onRefresh: _loadData,
        child: isLoading && _attendanceRecords.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? Center(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        _error!,
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadData,
                        child: Text(context.tr('common.retry')),
                      ),
                    ],
                  ),
                ),
              )
            : Column(
                children: [
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Text(
                      context.tr('attendance.title'),
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: DSColors.charcoal,
                      ),
                    ),
                  ),
                  _buildCalendar(),
                  const Divider(height: 1),
                  Expanded(child: _buildDayDetails()),
                ],
              ),
      ),
    );
  }

  Widget _buildCalendar() {
    final localizationProvider = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    );
    final locale = localizationProvider.currentLocale;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Directionality(
        textDirection: localizationProvider.textDirection,
        child: TableCalendar(
          firstDay: DateTime.utc(2020, 1, 1),
          lastDay: DateTime.utc(2030, 12, 31),
          focusedDay: _focusedDay,
          selectedDayPredicate: (day) => isSameDay(_selectedDay, day),
          calendarFormat: _calendarFormat,
          startingDayOfWeek:
              StartingDayOfWeek.saturday, // Start with Saturday for Arabic
          locale: locale.languageCode,
          calendarStyle: CalendarStyle(
            selectedDecoration: BoxDecoration(
              color: DSColors.primary,
              shape: BoxShape.circle,
            ),
            todayDecoration: BoxDecoration(
              color: DSColors.primary.withValues(alpha: 0.3),
              shape: BoxShape.circle,
            ),
            markerDecoration: const BoxDecoration(
              color: DSColors.success,
              shape: BoxShape.circle,
            ),
            outsideDaysVisible: false,
            weekendTextStyle: const TextStyle(color: DSColors.charcoal),
            defaultTextStyle: const TextStyle(color: DSColors.charcoal),
            markersMaxCount: 3,
            cellMargin: const EdgeInsets.all(4.0),
            cellPadding: const EdgeInsets.all(8.0),
          ),
          headerStyle: HeaderStyle(
            formatButtonVisible: false,
            titleCentered: true,
            titleTextStyle: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: DSColors.charcoal,
            ),
            leftChevronIcon: Icon(
              localizationProvider.isArabic
                  ? Icons.chevron_left
                  : Icons.chevron_right,
              color: DSColors.primary,
            ),
            rightChevronIcon: Icon(
              localizationProvider.isArabic
                  ? Icons.chevron_right
                  : Icons.chevron_left,
              color: DSColors.primary,
            ),
            headerPadding: const EdgeInsets.symmetric(vertical: 8.0),
            headerMargin: const EdgeInsets.only(bottom: 8.0),
          ),
          daysOfWeekStyle: DaysOfWeekStyle(
            weekdayStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              color: DSColors.charcoal,
            ),
            weekendStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              color: DSColors.charcoal,
            ),
          ),
          onDaySelected: (selectedDay, focusedDay) {
            if (!mounted) return;
            setState(() {
              _selectedDay = selectedDay;
              _focusedDay = focusedDay;
            });
            // Debug: Print selected day and schedule
            final dayOfWeek = _getDayOfWeek(selectedDay);
            final schedule = _getScheduleForDay(selectedDay);
            print('Selected day: ${selectedDay.toString().split(' ')[0]}');
            print('Day of week: $dayOfWeek');
            print('Schedule count: ${schedule.length}');
            print('Available schedule days: ${_scheduleByDay.keys.toList()}');
          },
          onFormatChanged: (format) {
            setState(() {
              _calendarFormat = format;
            });
          },
          onPageChanged: (focusedDay) {
            if (!mounted) return;
            setState(() {
              _focusedDay = focusedDay;
            });
            print(
              'Calendar page changed to: ${focusedDay.month}/${focusedDay.year}',
            );
            _loadAttendance();
          },
          eventLoader: (day) {
            // Show markers for days with attendance records
            final attendance = _getAttendanceForDay(day);
            return attendance;
          },
        ),
      ),
    );
  }

  Widget _buildDayDetails() {
    final schedule = _getScheduleForDay(_selectedDay);
    final attendance = _getAttendanceForDay(_selectedDay);

    print('Building day details for: ${_selectedDay.toString().split(' ')[0]}');
    print(
      'Schedule items: ${schedule.length}, Attendance items: ${attendance.length}',
    );

    // Show loading indicator while fetching data
    if (_isLoadingAttendance || _isLoadingSchedule) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading schedule...'),
          ],
        ),
      );
    }

    if (schedule.isEmpty) {
      final dayOfWeek = _getDayOfWeek(_selectedDay);
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.calendar_today, size: 64, color: Colors.grey[300]),
              const SizedBox(height: 16),
              Text(
                context.tr('attendance.no_schedule'),
                style: TextStyle(fontSize: 16, color: Colors.grey[600]),
              ),
              const SizedBox(height: 8),
              Text(
                'Day: $dayOfWeek',
                style: TextStyle(fontSize: 14, color: Colors.grey[500]),
              ),
              if (_scheduleByDay.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Available days: ${_scheduleByDay.keys.join(", ")}',
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16.0),
      children: [
        _buildDateHeader(),
        const SizedBox(height: 16),
        ...schedule.map((scheduleItem) {
          // Find matching attendance record
          final attendanceRecord = attendance.firstWhere(
            (a) => a.subjectId == scheduleItem.subject.id,
            orElse: () => Attendance(
              id: '',
              studentId: '',
              subjectId: scheduleItem.subject.id,
              date: '',
              status: 'NOT_MARKED',
              subject: AttendanceSubject(
                id: scheduleItem.subject.id,
                name: scheduleItem.subject.name,
              ),
              teacher: null,
              createdAt: '',
              updatedAt: '',
            ),
          );

          return _buildScheduleCard(scheduleItem, attendanceRecord);
        }),
      ],
    );
  }

  Widget _buildDateHeader() {
    final localizationProvider = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    );
    final locale = localizationProvider.currentLocale;

    // Use locale-specific date formatting
    final formatter = intl.DateFormat(
      'EEEE, MMMM d, yyyy',
      locale.languageCode,
    );

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [DSColors.primary, DSColors.primary.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: DSColors.primary.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        formatter.format(_selectedDay),
        style: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
        textDirection: localizationProvider.textDirection,
      ),
    );
  }

  Widget _buildScheduleCard(Schedule schedule, Attendance attendance) {
    final hasAttendance = attendance.status != 'NOT_MARKED';
    final statusColor = hasAttendance
        ? _getStatusColor(attendance.status)
        : Colors.grey;
    final localizationProvider = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    );

    return Card(
      margin: const EdgeInsets.only(bottom: 12.0),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: statusColor.withValues(alpha: 0.3), width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Directionality(
          textDirection: localizationProvider.textDirection,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: DSColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      schedule.timeSlotString,
                      style: const TextStyle(
                        color: DSColors.primary,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                      textDirection: TextDirection.ltr, // Time is always LTR
                    ),
                  ),
                  const Spacer(),
                  if (hasAttendance)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            attendance.isPresent
                                ? Icons.check_circle
                                : attendance.isAbsent
                                ? Icons.cancel
                                : attendance.isLate
                                ? Icons.access_time
                                : Icons.info,
                            color: statusColor,
                            size: 16,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _getStatusText(attendance.status),
                            style: TextStyle(
                              color: statusColor,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                            textDirection: localizationProvider.textDirection,
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.grey.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        context.tr('attendance.not_marked'),
                        style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        textDirection: localizationProvider.textDirection,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.book, size: 20, color: DSColors.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      schedule.subject.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                      textDirection: _getTextDirection(schedule.subject.name),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.person, size: 20, color: Colors.grey[600]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      schedule.teacher.name,
                      style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                      textDirection: _getTextDirection(schedule.teacher.name),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
