# School Code Authentication System

## Overview

The School Code Authentication System provides secure multi-tenant access control for teachers logging into the mobile app. This system ensures complete data isolation between schools while maintaining excellent user experience.

## How It Works

### 1. Three-Factor Authentication

Teachers must provide:

1. **School Code** - Unique identifier for their school (e.g., "DEFAULT01")
2. **Phone Number** - Teacher's registered phone number
3. **Password** - Teacher's password

### 2. Security Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Teacher App   │    │   Backend API   │    │    Database     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. POST /api/mobile/   │                       │
         │    auth/login          │                       │
         │ {schoolCode, phone,    │                       │
         │  password}             │                       │
         ├──────────────────────>│                       │
         │                       │ 2. Validate school    │
         │                       │    code exists        │
         │                       ├──────────────────────>│
         │                       │ 3. Find teacher in    │
         │                       │    specific school    │
         │                       ├──────────────────────>│
         │                       │ 4. Verify password    │
         │                       │                       │
         │                       │ 5. Generate JWT with  │
         │                       │    schoolId           │
         │ 6. Return token +      │                       │
         │    isolated data       │                       │
         │<──────────────────────┤                       │
```

## Current School Codes

| School Name    | School Code | Username      | Teachers |
| -------------- | ----------- | ------------- | -------- |
| Default School | DEFAULT01   | defaultschool | 5        |
| testing        | TESTING01   | test          | 1        |
| test           | TEST01      | newtest       | 1        |

## API Documentation

### Mobile Login Endpoint

**POST** `/api/mobile/auth/login`

#### Request Body

```json
{
  "schoolCode": "DEFAULT01",
  "phoneNumber": "+1234567890",
  "password": "your_password"
}
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "teacher": {
      "id": "teacher-uuid",
      "name": "John Doe",
      "phoneNumber": "+1234567890",
      "age": 35,
      "gender": "male",
      "birthdate": "1989-01-01T00:00:00.000Z",
      "stages": [...],
      "subjects": [...]
    }
  }
}
```

#### Error Responses

**400 - Missing Fields**

```json
{
  "success": false,
  "message": "School code, phone number and password are required"
}
```

**401 - Invalid School Code**

```json
{
  "success": false,
  "message": "Invalid school code"
}
```

**401 - Invalid Credentials**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**429 - Rate Limited**

```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later."
}
```

## Security Features

### 1. Rate Limiting

- **5 attempts** per **15 minutes** per unique combination of:
  - IP address
  - Phone number
  - School code
- Automatic reset on successful login
- Prevents brute force attacks

### 2. Data Isolation

- Teachers can only access data from their assigned school
- Database queries are filtered by `schoolId`
- JWT tokens contain `schoolId` for session context
- Cross-school data leakage prevented

### 3. Input Validation

- School codes are case-insensitive (converted to uppercase)
- All required fields validated
- Proper error messages for different failure scenarios

### 4. Password Security

- Supports both hashed and plain-text passwords
- Automatically upgrades plain-text to hashed on successful login
- Uses bcrypt for password hashing

## Testing

### Manual Testing with curl

```bash
curl -X POST http://localhost:3000/api/mobile/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "schoolCode": "DEFAULT01",
    "phoneNumber": "+1234567890",
    "password": "your_password"
  }'
```

### Run Test Script

```bash
cd backend
node test-school-code-auth.cjs
```

## Flutter App Integration

### Update LoginScreen

```dart
class _LoginScreenState extends State<LoginScreen> {
  final _schoolCodeController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            // School Code Field
            TextFormField(
              controller: _schoolCodeController,
              decoration: InputDecoration(
                labelText: 'School Code',
                hintText: 'Enter your school code (e.g., DEFAULT01)',
                prefixIcon: Icon(Icons.school),
              ),
              textCapitalization: TextCapitalization.characters,
            ),

            // Phone Number Field
            TextFormField(
              controller: _phoneController,
              decoration: InputDecoration(
                labelText: 'Phone Number',
                prefixIcon: Icon(Icons.phone),
              ),
              keyboardType: TextInputType.phone,
            ),

            // Password Field
            TextFormField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: 'Password',
                prefixIcon: Icon(Icons.lock),
              ),
              obscureText: true,
            ),

            // Login Button
            ElevatedButton(
              onPressed: _login,
              child: Text('Login'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _login() async {
    final response = await http.post(
      Uri.parse('${ApiConfig.baseUrl}/api/mobile/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'schoolCode': _schoolCodeController.text.toUpperCase(),
        'phoneNumber': _phoneController.text,
        'password': _passwordController.text,
      }),
    );

    final data = jsonDecode(response.body);

    if (data['success']) {
      // Store token and teacher data
      await _authService.saveToken(data['data']['token']);
      await _authService.saveTeacherData(data['data']['teacher']);

      // Navigate to home
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      // Show error
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(data['message'])),
      );
    }
  }
}
```

## Advantages Over Other Solutions

### vs. Dropdown Menu

- ✅ **Secure**: Prevents teachers from accessing other schools
- ✅ **Scalable**: No need to update app for new schools
- ✅ **Private**: School codes not exposed in app

### vs. Shared Login

- ✅ **Isolated**: Complete data separation
- ✅ **Compliant**: Meets FERPA/GDPR requirements
- ✅ **Audit-ready**: Clear access trails

### vs. Separate Apps

- ✅ **Cost-effective**: Single codebase
- ✅ **Maintainable**: Centralized updates
- ✅ **User-friendly**: Consistent experience

## Best Practices

### For Schools

1. **Generate Secure Codes**: Use format like "SCHOOL##" (e.g., "OAKWOOD01")
2. **Share Privately**: Only distribute codes to authorized teachers
3. **Regular Updates**: Consider rotating codes annually
4. **Training**: Ensure teachers understand the login process

### For Developers

1. **Monitor Rate Limits**: Watch for suspicious login patterns
2. **Log Access**: Maintain audit trails for compliance
3. **Update Regularly**: Keep security measures current
4. **Test Thoroughly**: Verify isolation between schools

## Troubleshooting

### Common Issues

**"Invalid school code"**

- Verify the school code exists in database
- Check for typos (codes are case-insensitive)
- Ensure school is active

**"Invalid credentials"**

- Verify teacher exists in the specified school
- Check phone number format
- Confirm password is correct

**"Too many login attempts"**

- Wait 15 minutes for rate limit reset
- Check if someone is attempting brute force
- Contact support if legitimate use

### Support Commands

```bash
# Check school codes
node verify-school-codes.cjs

# Test authentication
node test-school-code-auth.cjs

# View teacher assignments
node check-teacher-assignments.ts
```

## Future Enhancements

1. **Two-Factor Authentication**: Add SMS/Email verification
2. **Biometric Login**: Support fingerprint/face recognition
3. **Single Sign-On**: Integration with school LDAP/AD
4. **Code Generation**: Automated school code generation
5. **Advanced Analytics**: Login pattern analysis

---

**Implementation Date**: January 2025  
**Security Level**: High  
**Compliance**: FERPA, GDPR Ready
