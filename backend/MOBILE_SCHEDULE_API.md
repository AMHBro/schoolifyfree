# Mobile Schedule API Documentation

This document describes the schedule endpoints specifically designed for the Teacher Mobile Application.

## Overview

These endpoints allow teachers to view their schedules in formats optimized for mobile consumption. All endpoints require authentication via JWT token.

## Base URL

```
http://localhost:3000/api/mobile/schedule
```

## Authentication

All endpoints require the `Authorization` header with a valid JWT token:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### 1. Get Weekly Schedule

**GET** `/api/mobile/schedule/weekly`

Get the authenticated teacher's complete weekly schedule grouped by days.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "weeklySchedule": {
      "Monday": [
        {
          "id": "schedule-uuid",
          "timeSlot": 1,
          "stage": {
            "id": "stage-uuid",
            "name": "Stage 1"
          },
          "subject": {
            "id": "subject-uuid",
            "name": "Mathematics"
          }
        }
      ],
      "Tuesday": [],
      "Wednesday": [
        {
          "id": "schedule-uuid-2",
          "timeSlot": 2,
          "stage": {
            "id": "stage-uuid",
            "name": "Stage 1"
          },
          "subject": {
            "id": "subject-uuid-2",
            "name": "Physics"
          }
        }
      ],
      "Thursday": [],
      "Friday": [],
      "Saturday": [],
      "Sunday": []
    },
    "dayCounts": {
      "Monday": 1,
      "Tuesday": 0,
      "Wednesday": 1,
      "Thursday": 0,
      "Friday": 0,
      "Saturday": 0,
      "Sunday": 0
    },
    "totalClasses": 2
  }
}
```

### 2. Get Daily Schedule

**GET** `/api/mobile/schedule/daily/:dayOfWeek`

Get the authenticated teacher's schedule for a specific day with detailed student information.

#### Parameters

- `dayOfWeek` (string): Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "dayOfWeek": "Monday",
    "classes": [
      {
        "id": "schedule-uuid",
        "timeSlot": 1,
        "stage": {
          "id": "stage-uuid",
          "name": "Stage 1",
          "studentCount": 25
        },
        "subject": {
          "id": "subject-uuid",
          "name": "Mathematics"
        },
        "students": [
          {
            "id": "student-uuid",
            "name": "Student Name",
            "code": "STU001",
            "age": 16,
            "gender": "male",
            "phoneNumber": "1234567890"
          }
        ]
      }
    ],
    "totalClasses": 1
  }
}
```

#### Error Response (400)

```json
{
  "success": false,
  "message": "Invalid day of week. Must be one of: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday"
}
```

### 3. Get Today's Schedule

**GET** `/api/mobile/schedule/today`

Get the authenticated teacher's schedule for today with detailed student information.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "today": "Monday",
    "date": "2024-01-15",
    "classes": [
      {
        "id": "schedule-uuid",
        "timeSlot": 1,
        "stage": {
          "id": "stage-uuid",
          "name": "Stage 1",
          "studentCount": 25
        },
        "subject": {
          "id": "subject-uuid",
          "name": "Mathematics"
        },
        "students": [
          {
            "id": "student-uuid",
            "name": "Student Name",
            "code": "STU001",
            "age": 16,
            "gender": "male",
            "phoneNumber": "1234567890"
          }
        ]
      }
    ],
    "totalClasses": 1
  }
}
```

## Usage Examples

### Flutter/Dart Implementation

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class ScheduleService {
  static const String baseUrl = 'http://localhost:3000/api/mobile/schedule';

  // Get weekly schedule for home page
  static Future<Map<String, dynamic>> getWeeklySchedule(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/weekly'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load weekly schedule');
    }
  }

  // Get daily schedule when user taps a day
  static Future<Map<String, dynamic>> getDailySchedule(
      String token, String dayOfWeek) async {
    final response = await http.get(
      Uri.parse('$baseUrl/daily/$dayOfWeek'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load daily schedule');
    }
  }

  // Get today's schedule
  static Future<Map<String, dynamic>> getTodaySchedule(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/today'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load today\'s schedule');
    }
  }
}
```

### Home Page Implementation Example

```dart
class HomePage extends StatefulWidget {
  @override
  _HomePageState createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  Map<String, dynamic>? weeklyData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadWeeklySchedule();
  }

  Future<void> loadWeeklySchedule() async {
    try {
      final token = await getStoredToken(); // Your token storage method
      final data = await ScheduleService.getWeeklySchedule(token);

      if (data['success']) {
        setState(() {
          weeklyData = data['data'];
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading weekly schedule: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text('الجدول الأسبوعي')),
      body: ListView(
        children: [
          'Monday', 'Tuesday', 'Wednesday', 'Thursday',
          'Friday', 'Saturday', 'Sunday'
        ].map((day) {
          final dayNameArabic = getDayNameInArabic(day);
          final classCount = weeklyData?['dayCounts'][day] ?? 0;

          return ListTile(
            title: Text(dayNameArabic),
            subtitle: Text('$classCount صباحاً'),
            trailing: Icon(Icons.arrow_forward_ios),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => DailySchedulePage(dayOfWeek: day),
                ),
              );
            },
          );
        }).toList(),
      ),
    );
  }

  String getDayNameInArabic(String englishDay) {
    final arabicDays = {
      'Monday': 'الإثنين',
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت',
      'Sunday': 'الأحد',
    };
    return arabicDays[englishDay] ?? englishDay;
  }
}
```

### Daily Schedule Page Implementation Example

```dart
class DailySchedulePage extends StatefulWidget {
  final String dayOfWeek;

  DailySchedulePage({required this.dayOfWeek});

  @override
  _DailySchedulePageState createState() => _DailySchedulePageState();
}

class _DailySchedulePageState extends State<DailySchedulePage> {
  Map<String, dynamic>? dailyData;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    loadDailySchedule();
  }

  Future<void> loadDailySchedule() async {
    try {
      final token = await getStoredToken();
      final data = await ScheduleService.getDailySchedule(token, widget.dayOfWeek);

      if (data['success']) {
        setState(() {
          dailyData = data['data'];
          isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading daily schedule: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final classes = dailyData?['classes'] ?? [];

    return Scaffold(
      appBar: AppBar(
        title: Text('${getDayNameInArabic(widget.dayOfWeek)}'),
      ),
      body: classes.isEmpty
          ? Center(child: Text('لا توجد حصص لهذا اليوم'))
          : ListView.builder(
              itemCount: classes.length,
              itemBuilder: (context, index) {
                final classItem = classes[index];
                return Card(
                  margin: EdgeInsets.all(8),
                  child: ListTile(
                    title: Text('${classItem['subject']['name']}'),
                    subtitle: Text('${classItem['stage']['name']} - الحصة ${classItem['timeSlot']}'),
                    trailing: Text('${classItem['students'].length} طالب'),
                    onTap: () {
                      // Navigate to class details or attendance page
                    },
                  ),
                );
              },
            ),
    );
  }
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error scenarios:

- **401 Unauthorized**: Missing or invalid authentication token
- **400 Bad Request**: Invalid day of week parameter
- **500 Internal Server Error**: Server-side error

## Features

1. **Weekly Overview**: Perfect for the home page showing all days with class counts
2. **Daily Details**: Detailed view when user selects a specific day
3. **Student Information**: Complete student details for attendance and class management
4. **Today's Schedule**: Quick access to current day's schedule
5. **Arabic UI Support**: Easily adaptable for Arabic interface elements
6. **Offline-First Ready**: Structured data that can be easily cached for offline usage

## Production Considerations

1. **Caching**: Consider caching weekly schedule data to reduce API calls
2. **Offline Support**: Store schedule data locally for offline access
3. **Real-time Updates**: Consider implementing WebSocket connections for real-time schedule changes
4. **Performance**: Use pagination if a teacher has many classes per day
