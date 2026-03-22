# Forgot Password with WhatsApp Integration Setup

This document explains how to set up and use the forgot password feature that uses WhatsApp for verification.

## Overview

The forgot password feature allows students to reset their passwords by receiving a verification code through WhatsApp. The flow works as follows:

1. Student enters school code and student code
2. System finds the student and sends a 6-digit verification code to their registered WhatsApp number
3. Student enters the verification code
4. Student sets a new password
5. Password is updated in the database

## Backend Setup

### 1. WhatsApp API Configuration

You need to set up a WhatsApp Business API account and get the following credentials:

- **WhatsApp Access Token**: Your WhatsApp API access token
- **Phone Number ID**: The ID of your WhatsApp Business phone number

### 2. Environment Variables

Add the following environment variables to your `.env` file:

```env
WHATSAPP_TOKEN="your-whatsapp-access-token"
WHATSAPP_PHONE_NUMBER_ID="your-whatsapp-phone-number-id"
```

### 3. API Endpoints

The following endpoints have been added:

- `POST /api/mobile/auth/forgot-password` - Request verification code
- `POST /api/mobile/auth/verify-code` - Verify the code
- `POST /api/mobile/auth/reset-password` - Reset password with verified code

## Frontend Integration

### New Screens Added

1. **ForgotPasswordScreen** (`forgot_password_screen.dart`)

   - Allows user to enter school code and student code
   - Requests verification code from backend

2. **VerificationScreen** (`verification_screen.dart`)

   - 6-digit code input interface
   - Resend code functionality with countdown
   - Auto-verification when all digits are entered

3. **NewPasswordScreen** (`new_password_screen.dart`)
   - New password input with confirmation
   - Password strength requirements
   - Success dialog and redirect to login

### Navigation Flow

```
LoginScreen → ForgotPasswordScreen → VerificationScreen → NewPasswordScreen → LoginScreen
```

## Usage Instructions

### For Students

1. On the login screen, tap "Forgot Password?"
2. Enter your school code and student code
3. Check your WhatsApp for a verification code
4. Enter the 6-digit code in the app
5. Set your new password
6. Login with your new password

### For Administrators

1. Ensure students have valid phone numbers in the database
2. Make sure WhatsApp API is properly configured
3. Monitor the backend logs for any WhatsApp API errors

## Security Features

- **Rate Limiting**: Prevents spam requests for verification codes
- **Code Expiration**: Verification codes expire after 10 minutes
- **Password Hashing**: New passwords are properly hashed before storage
- **Input Validation**: All inputs are validated on both frontend and backend

## Localization

The feature supports both Arabic and English languages with complete translations for all screens and messages.

## Testing

To test the feature:

1. Make sure you have a student record with a valid WhatsApp phone number
2. Configure the WhatsApp API credentials
3. Try the forgot password flow from the mobile app
4. Check that verification codes are received on WhatsApp
5. Verify that password reset works correctly

## Troubleshooting

### Common Issues

1. **500 Internal Server Error when sending verification code**

   - **This is usually caused by an expired WhatsApp access token** (most common issue)
   - Go to Meta Developer Console and generate a new access token
   - Update your `.env` file with the new token

2. **WhatsApp messages not sending**

   - Check your WhatsApp API credentials
   - Ensure the phone number format is correct (include country code)
   - Check API rate limits

3. **Phone number format issues**

   - The system automatically formats phone numbers for Iraq (+964)
   - Numbers without country code are assumed to be Iraqi and will be formatted with +964
   - Numbers starting with 0 will have the 0 removed and +964 added
   - International numbers should include the country code (e.g., +1, +44)

4. **Verification code not working**

   - Check if the code has expired (10-minute limit)
   - Ensure the phone number matches exactly

5. **Student not found**
   - Verify the school code and student code are correct
   - Check that the student exists in the database

### Logs

Check the backend logs for detailed error messages:

```bash
# In the backend directory
bun run dev
```

## Production Considerations

1. **Use Redis**: Replace in-memory verification code storage with Redis for production
2. **Rate Limiting**: Implement more sophisticated rate limiting
3. **Monitoring**: Set up monitoring for WhatsApp API usage and costs
4. **Backup**: Ensure proper backup procedures for password resets
