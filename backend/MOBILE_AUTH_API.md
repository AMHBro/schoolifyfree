# Mobile Authentication API Documentation

This document describes the authentication endpoints for the Teacher Mobile Application.

## Overview

The mobile authentication system uses JWT (JSON Web Tokens) for secure authentication. Teachers can log in using their phone number and password that were created in the web dashboard.

## Base URL

```
http://localhost:3000/api/mobile/auth
```

## Authentication Flow

1. **Login**: Teacher provides phone number and password
2. **Receive Token**: Server returns JWT token and teacher information
3. **Use Token**: Include token in Authorization header for protected endpoints
4. **Token Verification**: Optionally verify token validity

## Endpoints

### 1. Login

**POST** `/api/mobile/auth/login`

Authenticate a teacher using phone number and password.

#### Request Body

```json
{
  "phoneNumber": "string",
  "password": "string"
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
      "id": "uuid",
      "name": "Teacher Name",
      "phoneNumber": "1234567890",
      "age": 30,
      "gender": "male",
      "birthdate": "1993-01-01T00:00:00.000Z",
      "stages": [
        {
          "id": "stage-uuid",
          "name": "Stage 1",
          "students": [
            {
              "id": "student-uuid",
              "name": "Student Name",
              "age": 16,
              "gender": "male",
              "phoneNumber": "9876543210",
              "code": "STU001"
            }
          ]
        }
      ],
      "subjects": [
        {
          "id": "subject-uuid",
          "name": "Mathematics"
        }
      ]
    }
  }
}
```

#### Error Responses

**400 Bad Request** - Missing required fields

```json
{
  "success": false,
  "message": "Phone number and password are required"
}
```

**401 Unauthorized** - Invalid credentials

```json
{
  "success": false,
  "message": "Invalid phone number or password"
}
```

**500 Internal Server Error** - Server error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

### 2. Get Profile

**GET** `/api/mobile/auth/profile`

Get the authenticated teacher's profile information.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "success": true,
  "data": {
    "teacher": {
      "id": "uuid",
      "name": "Teacher Name",
      "phoneNumber": "1234567890",
      "age": 30,
      "gender": "male",
      "birthdate": "1993-01-01T00:00:00.000Z",
      "stages": [
        {
          "id": "stage-uuid",
          "name": "Stage 1",
          "students": [
            {
              "id": "student-uuid",
              "name": "Student Name",
              "age": 16,
              "gender": "male",
              "phoneNumber": "9876543210",
              "code": "STU001"
            }
          ]
        }
      ],
      "subjects": [
        {
          "id": "subject-uuid",
          "name": "Mathematics"
        }
      ]
    }
  }
}
```

#### Error Response

**401 Unauthorized** - Missing or invalid token

```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 3. Verify Token

**POST** `/api/mobile/auth/verify`

Verify if the provided JWT token is valid.

#### Headers

```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)

```json
{
  "success": true,
  "message": "Token is valid",
  "data": {
    "teacher": {
      "id": "uuid",
      "name": "Teacher Name",
      "phoneNumber": "1234567890"
    }
  }
}
```

#### Error Response

**401 Unauthorized** - Invalid or expired token

```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

## Security Features

### Password Hashing

- All passwords are hashed using bcrypt with a salt rounds of 10
- Backward compatibility: Plain text passwords are automatically upgraded to hashed passwords on successful login

### JWT Token

- Tokens contain teacher ID, phone number, and name
- Tokens are signed with a secret key (configurable via `JWT_SECRET` environment variable)
- No expiration time is set by default (consider adding for production)

### Authentication Middleware

- Automatically parses Authorization header
- Validates JWT token
- Fetches teacher information from database
- Excludes password from all responses

## Usage Examples

### Mobile App Login Flow

```javascript
// 1. Login
const loginResponse = await fetch(
  "http://localhost:3000/api/mobile/auth/login",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      phoneNumber: "1234567890",
      password: "teacher_password",
    }),
  }
);

const loginData = await loginResponse.json();

if (loginData.success) {
  // Store token securely (e.g., in secure storage)
  const token = loginData.data.token;
  const teacher = loginData.data.teacher;

  // 2. Use token for authenticated requests
  const profileResponse = await fetch(
    "http://localhost:3000/api/mobile/auth/profile",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const profileData = await profileResponse.json();
}
```

### React Native Example

```javascript
import AsyncStorage from "@react-native-async-storage/async-storage";

class AuthService {
  static async login(phoneNumber, password) {
    try {
      const response = await fetch(
        "http://localhost:3000/api/mobile/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber, password }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Store token securely
        await AsyncStorage.setItem("auth_token", data.data.token);
        await AsyncStorage.setItem(
          "teacher_data",
          JSON.stringify(data.data.teacher)
        );
        return data;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      throw error;
    }
  }

  static async getProfile() {
    try {
      const token = await AsyncStorage.getItem("auth_token");

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        "http://localhost:3000/api/mobile/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message);
      }

      return data.data.teacher;
    } catch (error) {
      throw error;
    }
  }

  static async logout() {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("teacher_data");
  }
}
```

## Production Considerations

1. **Environment Variables**: Set `JWT_SECRET` to a strong, random secret in production
2. **HTTPS**: Always use HTTPS in production
3. **Token Expiration**: Consider adding token expiration for better security
4. **Rate Limiting**: Implement rate limiting on login endpoint
5. **Logging**: Add proper logging for security events
6. **Error Handling**: Don't expose sensitive information in error messages

## Testing

Use the provided `test-auth.js` script to test the authentication endpoints:

```bash
cd backend
node test-auth.js
```

This will test various scenarios including invalid credentials, missing fields, and unauthorized access attempts.
