# Teacher App

A Flutter mobile application for teachers to manage their classes, students, and schedules. This app connects to the SMS (School Management System) backend.

## Features

- **Authentication**: Secure login using phone number and password
- **Dashboard**: Overview of assigned stages, subjects, and students
- **Profile Management**: View and manage teacher profile
- **Auto-login**: Remembers login state using secure token storage

## Screenshots

_Login Screen_: Beautiful, modern login interface with validation
_Home Screen_: Dashboard showing teacher's stages, subjects, and student counts

## Prerequisites

- Flutter SDK (3.8.1 or higher)
- Dart SDK
- Android Studio / VS Code with Flutter extensions
- SMS Backend running (see backend setup)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd teacher-app
flutter pub get
```

### 2. Configure Backend URL

Edit `lib/config/app_config.dart` and update the `baseUrl`:

```dart
// For local development
static const String baseUrl = 'http://localhost:3000';

// For Android emulator
static const String baseUrl = 'http://10.0.2.2:3000';

// For real device (replace with your computer's IP)
static const String baseUrl = 'http://192.168.1.XXX:3000';
```

### 3. Start the Backend

Make sure your SMS backend is running on the configured URL. The backend should have the following endpoints available:

- `POST /api/mobile/auth/login` - Teacher login
- `POST /api/mobile/auth/verify` - Token verification
- `GET /api/mobile/auth/profile` - Get teacher profile

### 4. Run the App

```bash
# For development
flutter run

# For release build
flutter build apk --release
```

## Demo Login

The app includes a demo login button for testing:

- **Phone Number**: 1234567890
- **Password**: password

_Note: Make sure you have a teacher with these credentials in your backend database._

## Project Structure

```
lib/
├── config/
│   └── app_config.dart          # App configuration and constants
├── models/
│   ├── teacher.dart             # Teacher data models
│   ├── schedule.dart            # Schedule and related data models
│   └── attendance.dart          # Attendance data models
├── providers/
│   └── auth_provider.dart       # Authentication & schedule state management
├── screens/
│   ├── login_screen.dart        # Login interface
│   ├── home_screen.dart         # Dashboard with schedule navigation
│   └── class_screen.dart        # Attendance marking interface
├── services/
│   └── api_service.dart         # Backend API communication
└── main.dart                    # App entry point
```

## Key Components

### Authentication Flow

1. **Login Screen**: Validates phone number and password
2. **API Service**: Handles HTTP requests to backend
3. **Auth Provider**: Manages authentication state using Provider pattern
4. **Token Storage**: Securely stores JWT tokens using SharedPreferences
5. **Auto-login**: Automatically verifies stored tokens on app startup

### State Management

The app uses the Provider pattern for state management:

- `AuthProvider`: Handles login, logout, and authentication state
- `Consumer<AuthProvider>`: Widgets that react to authentication changes

### Security Features

- JWT token-based authentication
- Secure token storage using SharedPreferences
- Automatic token verification on app startup
- Context-safe async operations

## API Integration

The app integrates with the SMS backend using the following endpoints:

### Login

```http
POST /api/mobile/auth/login
Content-Type: application/json

{
  "phoneNumber": "1234567890",
  "password": "password"
}
```

### Token Verification

```http
POST /api/mobile/auth/verify
Authorization: Bearer <token>
```

### Get Profile

```http
GET /api/mobile/auth/profile
Authorization: Bearer <token>
```

### Schedule Management

```http
GET /api/mobile/schedule/today
Authorization: Bearer <token>

GET /api/mobile/schedule/daily/:dayOfWeek
Authorization: Bearer <token>

GET /api/mobile/schedule/weekly
Authorization: Bearer <token>
```

### Attendance Management

```http
GET /api/attendance/daily/:stageId/:date
Authorization: Bearer <token>

POST /api/attendance/bulk
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "stageId": "stage-uuid",
  "attendanceData": [
    {
      "studentId": "student-uuid",
      "subjectId": "subject-uuid",
      "status": "present"
    }
  ],
  "markedBy": "teacher-uuid"
}
```

## Development

### Adding New Features

1. Create new screens in `lib/screens/`
2. Add new API endpoints in `lib/services/api_service.dart`
3. Update models in `lib/models/` if needed
4. Use Provider pattern for state management

### Testing

```bash
# Run tests
flutter test

# Run analysis
flutter analyze
```

### Building for Production

```bash
# Android
flutter build apk --release

# iOS
flutter build ios --release
```

## Troubleshooting

### Common Issues

1. **Network Error**: Check if backend is running and URL is correct
2. **Login Failed**: Verify teacher credentials exist in database
3. **Token Issues**: Clear app data or reinstall to reset stored tokens

### Debug Mode

The app includes debug prints for development. Check the console for:

- Authentication status
- API request/response details
- Error messages

## ✨ Current Features

### 🔐 **Authentication System**

- Secure JWT-based login with phone number and password
- Token-based session management with auto-refresh
- Remember login functionality
- Secure token storage using SharedPreferences

### 🏠 **Teacher Dashboard**

- Personalized welcome screen with teacher information
- Real-time statistics showing assigned stages, subjects, and student counts
- Professional Material Design 3 interface

### 📅 **Schedule Management**

- View today's schedule automatically on login
- Navigate through different days of the week
- Visual indicators for current day and selected day
- Detailed class information with time slots, subjects, and stages
- Student count display for each class

### ✅ **Attendance Management**

- Mark attendance for individual students in each class
- Bulk attendance options (mark all present/absent)
- Visual attendance status indicators (present/absent)
- Real-time attendance count display
- Save attendance data to backend with bulk operations
- Date-specific attendance tracking
- Navigate to attendance screen by tapping on any class

### 📱 **Mobile-Optimized Design**

- Responsive design that works on all screen sizes
- Material Design 3 components and styling
- Smooth animations and transitions
- Loading states and error handling

## Future Enhancements

- [ ] Attendance reports and analytics
- [ ] Student profile management
- [ ] Push notifications
- [ ] Offline support
- [ ] Dark mode theme
- [ ] Exam management
- [ ] Grade recording

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the SMS (School Management System) and is proprietary software.
