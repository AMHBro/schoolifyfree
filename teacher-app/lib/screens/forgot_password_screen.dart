import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../theme/design_system.dart';
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
  final _phoneNumberController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _schoolCodeController.dispose();
    _phoneNumberController.dispose();
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
        phoneNumber: _phoneNumberController.text.trim(),
      );

      if (result['success'] && mounted) {
        final phoneNumber = result['data']['phoneNumber'];

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Verification code sent'),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate to verification screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => VerificationScreen(
              phoneNumber: phoneNumber,
              schoolCode: _schoolCodeController.text.trim().toUpperCase(),
              teacherPhoneNumber: _phoneNumberController.text.trim(),
            ),
          ),
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
                  : (result['message'] ??
                        context.tr('forgot_password.error_sending')),
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

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            backgroundColor: DSColors.lightGray,
            appBar: AppBar(
              title: Text(context.tr('forgot_password.title')),
              backgroundColor: DSColors.primary,
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
                        color: DSColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: const [DSShadows.card],
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
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: DSColors.charcoal,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 16),

                    // Description
                    Text(
                      context.tr('forgot_password.description'),
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
                                prefixIconColor: DSColors.darkGray,
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

                            // Phone Number Field
                            TextFormField(
                              controller: _phoneNumberController,
                              keyboardType: TextInputType.phone,
                              decoration: InputDecoration(
                                labelText: context.tr(
                                  'forgot_password.phone_number',
                                ),
                                hintText: context.tr(
                                  'forgot_password.phone_number_hint',
                                ),
                                prefixIcon: const Icon(Icons.phone),
                                prefixIconColor: DSColors.darkGray,
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
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return context.tr(
                                    'forgot_password.validation_phone_number_required',
                                  );
                                }
                                if (value.length < 10) {
                                  return context.tr(
                                    'forgot_password.validation_phone_number_length',
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
                                  color: DSColors.primary,
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
