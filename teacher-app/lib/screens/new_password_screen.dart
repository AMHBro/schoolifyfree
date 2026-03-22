import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../theme/design_system.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

class NewPasswordScreen extends StatefulWidget {
  final String phoneNumber;
  final String verificationCode;
  final String schoolCode;
  final String teacherPhoneNumber;
  final String? resetToken;

  const NewPasswordScreen({
    super.key,
    required this.phoneNumber,
    required this.verificationCode,
    required this.schoolCode,
    required this.teacherPhoneNumber,
    this.resetToken,
  });

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _handlePasswordReset() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ApiService.resetPassword(
        phoneNumber: widget.phoneNumber,
        verificationCode: widget.verificationCode,
        newPassword: _passwordController.text,
        schoolCode: widget.schoolCode,
        teacherPhoneNumber: widget.teacherPhoneNumber,
        resetToken: widget.resetToken,
      );

      if (result['success'] && mounted) {
        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              result['data']['message'] ??
                  context.tr('new_password.success_title'),
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );

        // Show success dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext context) {
            return AlertDialog(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              icon: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green.shade100,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.check_circle,
                  color: Colors.green.shade600,
                  size: 48,
                ),
              ),
              title: Text(
                context.tr('new_password.success_title'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              content: Text(
                context.tr('new_password.success_message'),
                textAlign: TextAlign.center,
              ),
              actions: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop(); // Close dialog
                      // Return to app root so AuthWrapper controls navigation
                      Navigator.of(context).popUntil((route) => route.isFirst);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green.shade600,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(context.tr('new_password.login_now')),
                  ),
                ),
              ],
            );
          },
        );
      } else if (mounted) {
        final isOffline =
            (result['code'] == 'NETWORK_OFFLINE') ||
            (result['message']?.toString().toUpperCase().contains('NETWORK') ==
                true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isOffline
                  ? context.tr('common.offline_message')
                  : (result['message'] ?? context.tr('common.error')),
            ),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('common.offline_message')),
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

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return context.tr('new_password.validation_password_required');
    }
    if (value.length < 6) {
      return context.tr('new_password.validation_password_length');
    }
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return context.tr('new_password.validation_confirm_password_required');
    }
    if (value != _passwordController.text) {
      return context.tr('new_password.validation_passwords_dont_match');
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            backgroundColor: DSColors.lightGray,
            appBar: AppBar(
              title: Text(
                context.tr('new_password.title'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: DSColors.white,
              foregroundColor: DSColors.charcoal,
              elevation: 1,
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
                      decoration: const BoxDecoration(
                        color: DSColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [DSShadows.card],
                      ),
                      child: Icon(
                        LineAwesomeIcons.lock_solid,
                        size: 50,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 32),
                    // Title
                    Text(
                      context.tr('new_password.subtitle'),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: DSColors.charcoal,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    // Description
                    Text(
                      context.tr('new_password.description'),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: DSColors.darkGray,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 48),
                    // Form Card
                    Container(
                      decoration: BoxDecoration(
                        color: DSColors.white,
                        borderRadius: BorderRadius.circular(DSRadii.large),
                        boxShadow: const [DSShadows.card],
                      ),
                      padding: const EdgeInsets.all(24),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: <Widget>[
                            // New Password Field
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: context.tr(
                                  'new_password.new_password',
                                ),
                                hintText: context.tr(
                                  'new_password.new_password_hint',
                                ),
                                prefixIcon: Icon(LineAwesomeIcons.lock_solid),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? LineAwesomeIcons.eye_slash_solid
                                        : LineAwesomeIcons.eye_solid,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    DSRadii.medium,
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    DSRadii.medium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: DSColors.mediumGray,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    DSRadii.medium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: DSColors.primary,
                                    width: 2,
                                  ),
                                ),
                                filled: true,
                                fillColor: Colors.white,
                              ),
                              validator: _validatePassword,
                              onChanged: (_) {
                                if (_confirmPasswordController
                                    .text
                                    .isNotEmpty) {
                                  _formKey.currentState?.validate();
                                }
                              },
                            ),
                            const SizedBox(height: 20),
                            // Confirm Password Field
                            TextFormField(
                              controller: _confirmPasswordController,
                              obscureText: _obscureConfirmPassword,
                              decoration: InputDecoration(
                                labelText: context.tr(
                                  'new_password.confirm_password',
                                ),
                                hintText: context.tr(
                                  'new_password.confirm_password_hint',
                                ),
                                prefixIcon: Icon(LineAwesomeIcons.lock_solid),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscureConfirmPassword
                                        ? LineAwesomeIcons.eye_slash_solid
                                        : LineAwesomeIcons.eye_solid,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscureConfirmPassword =
                                          !_obscureConfirmPassword;
                                    });
                                  },
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    DSRadii.medium,
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    DSRadii.medium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: DSColors.mediumGray,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    DSRadii.medium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: DSColors.primary,
                                    width: 2,
                                  ),
                                ),
                                filled: true,
                                fillColor: Colors.white,
                              ),
                              validator: _validateConfirmPassword,
                            ),
                            const SizedBox(height: 32),
                            // Reset Password Button
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: ElevatedButton(
                                onPressed: _isLoading
                                    ? null
                                    : _handlePasswordReset,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: DSColors.primary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(
                                      DSRadii.medium,
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
                                          'new_password.reset_password_button',
                                        ),
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 24),
                            // Password Requirements
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: DSColors.primary.withOpacity(0.05),
                                borderRadius: BorderRadius.circular(
                                  DSRadii.medium,
                                ),
                                border: Border.all(
                                  color: DSColors.primary.withOpacity(0.2),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: <Widget>[
                                  Text(
                                    context.tr(
                                      'new_password.requirements_title',
                                    ),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                      color: DSColors.charcoal,
                                    ),
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    context.tr(
                                      'new_password.requirements_list',
                                    ),
                                    style: const TextStyle(
                                      color: DSColors.darkGray,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
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
