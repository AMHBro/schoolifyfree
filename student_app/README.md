# Student App

A Flutter application for students to access their school management system.

## Features

- **Student Login**: Secure authentication using school code, student code, and password
- **Student Portal**: Access to student-specific information and features
- **Modern UI**: Clean and intuitive user interface with Material Design 3
- **Responsive Design**: Works on mobile phones, tablets, and desktop

## Getting Started

### Prerequisites

- Flutter SDK (3.8.1 or higher)
- Dart SDK
- An IDE (VS Code, Android Studio, etc.)
- An emulator or physical device

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd student_app
   ```

2. Install dependencies:

   ```bash
   flutter pub get
   ```

3. Run the app:
   ```bash
   flutter run
   ```

## Backend Integration

This app now connects to the backend server running on `localhost:3000`.

### Prerequisites

- Backend server must be running on `localhost:3000`
- Student records must exist in the database with valid credentials
- Students must have their `username` field set as their student code
- Students must have a `password` field set

### Test Credentials

You'll need to create student records in the backend database or use existing ones. The app will authenticate against real data in the backend.

## App Structure

```
lib/
├── config/
│   └── app_config.dart          # App configuration and constants
├── providers/
│   └── auth_provider.dart       # Authentication state management
├── screens/
│   ├── login_screen.dart        # Student login interface
│   └── home_screen.dart         # Student dashboard
└── main.dart                    # App entry point
```

## Login Fields

The student login screen includes:

1. **School Code**: Institution identifier (e.g., DEFAULT01)
2. **Student Code**: Unique student identifier (e.g., STU001)
3. **Password**: Student's password
4. **Remember Me**: Option to save login state
5. **Forgot Password**: Link to password recovery (placeholder)

## Features Available

### Current Features

- ✅ Student authentication
- ✅ Student information display
- ✅ Weekly schedule view with day navigation
- ✅ Daily class schedule display
- ✅ Real-time schedule loading
- ✅ Clean, modern UI
- ✅ Logout functionality

### Coming Soon

- 🔄 Assignments view
- 🔄 Grades tracking
- 🔄 Attendance records
- 🔄 Class schedule
- 🔄 Notifications
- 🔄 Profile management

## Customization

### Changing Demo Credentials

Edit `lib/config/app_config.dart`:

```dart
class AppConfig {
  static const String demoSchoolCode = 'YOUR_SCHOOL_CODE';
  static const String demoStudentCode = 'YOUR_STUDENT_CODE';
  static const String demoPassword = 'your_password';
}
```

### API Integration

To connect with a real backend, update the `AuthProvider` in `lib/providers/auth_provider.dart`:

1. Uncomment the HTTP request code
2. Update the API endpoint in `AppConfig`
3. Modify the request/response handling as needed

## Building for Production

### Android

```bash
flutter build apk --release
```

### iOS

```bash
flutter build ios --release
```

### Web

```bash
flutter build web --release
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions, please contact the development team or create an issue in the repository.
