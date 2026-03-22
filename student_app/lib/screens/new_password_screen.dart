import 'package:flutter/material.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

// Design system tokens
const Color kPrimary = Color(0xFF742FB5); // Primary brand color
const Color kNeutralLight = Color(0xFFF9FAFB);
const Color kNeutralMedium = Color(0xFFE5E7EB);
const Color kNeutralDark = Color(0xFF6B7280);
const Color kCharcoal = Color(0xFF374151);
const Color kSuccess = Color(0xFF10B981);
const Color kError = Color(0xFFEF4444);

class NewPasswordScreen extends StatefulWidget {
  final String phoneNumber;
  final String verificationCode;
  final String schoolCode;
  final String studentCode;

  const NewPasswordScreen({
    super.key,
    required this.phoneNumber,
    required this.verificationCode,
    required this.schoolCode,
    required this.studentCode,
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
        studentCode: widget.studentCode,
      );

      if (result['success'] && mounted) {
        // Show success message (localized)
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('new_password.success_message')),
            backgroundColor: kSuccess,
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
                  color: kSuccess.withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  LineAwesomeIcons.check_circle_solid,
                  color: kSuccess,
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
                      Navigator.of(context).pushAndRemoveUntil(
                        MaterialPageRoute(
                          builder: (context) => const LoginScreen(),
                        ),
                        (route) => false,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: kPrimary,
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
        final isOffline = result['code'] == 'NETWORK_OFFLINE';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isOffline
                  ? context.tr('common.offline_message')
                  : context.tr('new_password.failed_to_reset'),
            ),
            backgroundColor: kError,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('common.error')),
            backgroundColor: kError,
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
            backgroundColor: kNeutralLight,
            appBar: AppBar(
              title: Text(
                context.tr('new_password.title'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: Colors.white,
              foregroundColor: kCharcoal,
              elevation: 1,
            ),
            body: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.08),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Center(
                            child: CircleAvatar(
                              radius: 40,
                              backgroundColor: kPrimary.withOpacity(0.12),
                              child: const Icon(
                                LineAwesomeIcons.lock_solid,
                                size: 40,
                                color: kPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            context.tr('new_password.subtitle'),
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: kCharcoal,
                                ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            context.tr('new_password.description'),
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(color: kNeutralDark),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 32),
                          Form(
                            key: _formKey,
                            child: Column(
                              children: [
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
                                    prefixIcon: const Icon(
                                      LineAwesomeIcons.lock_solid,
                                    ),
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
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: kNeutralMedium,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: kNeutralMedium,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: kPrimary,
                                        width: 2,
                                      ),
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                  ),
                                  validator: _validatePassword,
                                  onChanged: (value) {
                                    if (_confirmPasswordController
                                        .text
                                        .isNotEmpty) {
                                      _formKey.currentState?.validate();
                                    }
                                  },
                                ),
                                const SizedBox(height: 20),
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
                                    prefixIcon: const Icon(
                                      LineAwesomeIcons.lock_solid,
                                    ),
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
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: kNeutralMedium,
                                      ),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: kNeutralMedium,
                                      ),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(12),
                                      borderSide: const BorderSide(
                                        color: kPrimary,
                                        width: 2,
                                      ),
                                    ),
                                    filled: true,
                                    fillColor: Colors.white,
                                  ),
                                  validator: _validateConfirmPassword,
                                ),
                                const SizedBox(height: 32),
                                SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: ElevatedButton(
                                    onPressed: _isLoading
                                        ? null
                                        : _handlePasswordReset,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: kPrimary,
                                      foregroundColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
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
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: kPrimary.withOpacity(0.05),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: kPrimary.withOpacity(0.2),
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        context.tr(
                                          'new_password.requirements_title',
                                        ),
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          color: kCharcoal,
                                        ),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        context.tr(
                                          'new_password.requirements_list',
                                        ),
                                        style: const TextStyle(
                                          color: kNeutralDark,
                                          fontSize: 12,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
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
