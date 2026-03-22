# 🔧 MOBILE APP FIX FOR RESET PASSWORD

## The Problem

Your mobile app is sending `verificationCode` to the reset-password endpoint, but it should send `resetToken` from the verify-code response.

## Files to Fix

### 1. Fix `lib/screens/verification_screen.dart`

**CHANGE:** Lines 110-121

```dart
// OLD CODE (WRONG):
if (result['success'] && mounted) {
  Navigator.of(context).pushReplacement(
    MaterialPageRoute(
      builder: (context) => NewPasswordScreen(
        phoneNumber: widget.phoneNumber,
        verificationCode: code,  // ❌ WRONG!
        schoolCode: widget.schoolCode,
        studentCode: widget.studentCode,
      ),
    ),
  );
}

// NEW CODE (FIXED):
if (result['success'] && mounted) {
  final resetToken = result['data']['resetToken']; // ✅ Get resetToken from response
  Navigator.of(context).pushReplacement(
    MaterialPageRoute(
      builder: (context) => NewPasswordScreen(
        phoneNumber: widget.phoneNumber,
        resetToken: resetToken,  // ✅ Pass resetToken instead
        schoolCode: widget.schoolCode,
        studentCode: widget.studentCode,
      ),
    ),
  );
}
```

### 2. Fix `lib/screens/new_password_screen.dart`

**CHANGE:** Lines 8-19 and 47-52

```dart
// OLD CODE (WRONG):
class NewPasswordScreen extends StatefulWidget {
  final String phoneNumber;
  final String verificationCode;  // ❌ WRONG!
  final String schoolCode;
  final String studentCode;

  const NewPasswordScreen({
    super.key,
    required this.phoneNumber,
    required this.verificationCode,  // ❌ WRONG!
    required this.schoolCode,
    required this.studentCode,
  });

// NEW CODE (FIXED):
class NewPasswordScreen extends StatefulWidget {
  final String phoneNumber;
  final String resetToken;  // ✅ Use resetToken instead
  final String schoolCode;
  final String studentCode;

  const NewPasswordScreen({
    super.key,
    required this.phoneNumber,
    required this.resetToken,  // ✅ Use resetToken instead
    required this.schoolCode,
    required this.studentCode,
  });
```

**ALSO CHANGE:** Lines 47-52

```dart
// OLD CODE (WRONG):
final result = await ApiService.resetPassword(
  phoneNumber: widget.phoneNumber,
  verificationCode: widget.verificationCode,  // ❌ WRONG!
  newPassword: _passwordController.text,
);

// NEW CODE (FIXED):
final result = await ApiService.resetPassword(
  phoneNumber: widget.phoneNumber,
  resetToken: widget.resetToken,  // ✅ Use resetToken instead
  newPassword: _passwordController.text,
);
```

### 3. Fix `lib/services/api_service.dart`

**CHANGE:** Lines 124-140

```dart
// OLD CODE (WRONG):
static Future<Map<String, dynamic>> resetPassword({
  required String phoneNumber,
  required String verificationCode,  // ❌ WRONG!
  required String newPassword,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/mobile/auth/reset-password'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'phoneNumber': phoneNumber,
        'verificationCode': verificationCode,  // ❌ WRONG!
        'newPassword': newPassword,
      }),
    );

// NEW CODE (FIXED):
static Future<Map<String, dynamic>> resetPassword({
  required String phoneNumber,
  required String resetToken,  // ✅ Use resetToken instead
  required String newPassword,
}) async {
  try {
    final response = await http.post(
      Uri.parse('$baseUrl/api/mobile/auth/reset-password'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'phoneNumber': phoneNumber,
        'resetToken': resetToken,  // ✅ Use resetToken instead
        'newPassword': newPassword,
      }),
    );
```

## Summary of Changes

1. **verification_screen.dart**: Extract `resetToken` from verify-code response and pass it to NewPasswordScreen
2. **new_password_screen.dart**: Change parameter from `verificationCode` to `resetToken`
3. **api_service.dart**: Change API call to send `resetToken` instead of `verificationCode`

## Why This Fixes It

- **verificationCode** is only used to verify the user received the WhatsApp message
- **resetToken** contains the student ID and expiry information needed to reset the password
- The backend expects `resetToken` for the reset-password endpoint, not `verificationCode`

After these changes, your forgot password flow will work perfectly! 🎉
