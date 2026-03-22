import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import 'verification_screen.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _schoolCodeController = TextEditingController();
  final _studentCodeController = TextEditingController();
  bool _isLoading = false;

  // Design system mappings
  static const Color primaryColor = Color(0xFF742FB5);
  static const Color neutralLightGray = Color(0xFFF9FAFB);
  static const Color neutralMediumGray = Color(0xFFE5E7EB);
  static const Color neutralDarkGray = Color(0xFF6B7280);
  static const Color neutralCharcoal = Color(0xFF374151);
  static const double radiusMedium = 12.0;
  static const double radiusLarge = 16.0;

  @override
  void dispose() {
    _schoolCodeController.dispose();
    _studentCodeController.dispose();
    super.dispose();
  }

  void _handleForgotPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ApiService.requestPasswordReset(
        schoolCode: _schoolCodeController.text.trim().toUpperCase(),
        studentCode: _studentCodeController.text.trim().toUpperCase(),
      );

      if (result['success'] && mounted) {
        final phoneNumber = result['data']['data']['phoneNumber'];

        // Show success message (localized)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('verification.code_sent')),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate to verification screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => VerificationScreen(
              phoneNumber: phoneNumber,
              schoolCode: _schoolCodeController.text.trim().toUpperCase(),
              studentCode: _studentCodeController.text.trim().toUpperCase(),
            ),
          ),
        );
      } else if (mounted) {
        final message = _translateForgotError(result['message']?.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('common.error')),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _translateForgotError(String? raw) {
    final msg = (raw ?? '').toLowerCase();
    if (msg.contains('invalid school code') ||
        msg.contains('student code') ||
        msg == 'not_found' ||
        msg.contains('not found')) {
      return context.tr('verification.invalid_school_or_student');
    }
    if (msg.contains('network')) {
      return context.tr('common.offline_message');
    }
    return context.tr('verification.code_send_failed');
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            backgroundColor: neutralLightGray,
            appBar: AppBar(
              title: Text(context.tr('forgot_password.title')),
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              elevation: 0,
              actions: const [
                Padding(
                  padding: EdgeInsetsDirectional.only(end: 8),
                  child: Icon(LineAwesomeIcons.lock_solid),
                ),
              ],
            ),
            body: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 40),

                    // Icon
                    Container(
                      height: 100,
                      decoration: BoxDecoration(
                        color: primaryColor,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 12,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: const Icon(
                        LineAwesomeIcons.lock_open_solid,
                        size: 50,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Title
                    Text(
                      context.tr('forgot_password.subtitle'),
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: neutralCharcoal,
                          ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 16),

                    // Description
                    Text(
                      context.tr('forgot_password.description'),
                      style: Theme.of(
                        context,
                      ).textTheme.bodyLarge?.copyWith(color: neutralDarkGray),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 48),

                    // Form
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(radiusLarge),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      padding: const EdgeInsets.all(24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            // School Code Field
                            TextFormField(
                              controller: _schoolCodeController,
                              textCapitalization: TextCapitalization.characters,
                              decoration: InputDecoration(
                                labelText: context.tr(
                                  'forgot_password.school_code',
                                ),
                                hintText: context.tr(
                                  'forgot_password.school_code_hint',
                                ),
                                prefixIcon: const Icon(Icons.school),
                                prefixIconColor: neutralDarkGray,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusMedium,
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusMedium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: neutralMediumGray,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusMedium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: primaryColor,
                                    width: 2,
                                  ),
                                ),
                                filled: true,
                                fillColor: Colors.white,
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return context.tr(
                                    'forgot_password.validation_school_code_required',
                                  );
                                }
                                if (value.length < 3) {
                                  return context.tr(
                                    'forgot_password.validation_school_code_length',
                                  );
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 20),

                            // Student Code Field
                            TextFormField(
                              controller: _studentCodeController,
                              textCapitalization: TextCapitalization.characters,
                              decoration: InputDecoration(
                                labelText: context.tr(
                                  'forgot_password.student_code',
                                ),
                                hintText: context.tr(
                                  'forgot_password.student_code_hint',
                                ),
                                prefixIcon: const Icon(Icons.person),
                                prefixIconColor: neutralDarkGray,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusMedium,
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusMedium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: neutralMediumGray,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    radiusMedium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: primaryColor,
                                    width: 2,
                                  ),
                                ),
                                filled: true,
                                fillColor: Colors.white,
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return context.tr(
                                    'forgot_password.validation_student_code_required',
                                  );
                                }
                                if (value.length < 3) {
                                  return context.tr(
                                    'forgot_password.validation_student_code_length',
                                  );
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 32),

                            // Send Code Button
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: ElevatedButton(
                                onPressed: _isLoading
                                    ? null
                                    : _handleForgotPassword,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: primaryColor,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(
                                      radiusMedium,
                                    ),
                                  ),
                                  elevation: 2,
                                ),
                                child: _isLoading
                                    ? const CircularProgressIndicator(
                                        color: Colors.white,
                                      )
                                    : Text(
                                        context.tr(
                                          'forgot_password.send_code_button',
                                        ),
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                              ),
                            ),

                            const SizedBox(height: 24),

                            // Back to Login Button
                            TextButton(
                              onPressed: () {
                                Navigator.of(context).pop();
                              },
                              child: Text(
                                context.tr('forgot_password.back_to_login'),
                                style: TextStyle(
                                  color: primaryColor,
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
