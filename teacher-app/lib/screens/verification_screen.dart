import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../theme/design_system.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import 'new_password_screen.dart';
import 'dart:async';

class VerificationScreen extends StatefulWidget {
  final String phoneNumber;
  final String schoolCode;
  final String teacherPhoneNumber;

  const VerificationScreen({
    super.key,
    required this.phoneNumber,
    required this.schoolCode,
    required this.teacherPhoneNumber,
  });

  @override
  State<VerificationScreen> createState() => _VerificationScreenState();
}

class _VerificationScreenState extends State<VerificationScreen> {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (index) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (index) => FocusNode());
  bool _isLoading = false;
  bool _isResending = false;
  int _resendCountdown = 0;
  Timer? _countdownTimer;

  @override
  void initState() {
    super.initState();
    _startResendCountdown();
  }

  @override
  void dispose() {
    for (var controller in _controllers) {
      controller.dispose();
    }
    for (var focusNode in _focusNodes) {
      focusNode.dispose();
    }
    _countdownTimer?.cancel();
    super.dispose();
  }

  void _startResendCountdown() {
    setState(() {
      _resendCountdown = 60; // 60 seconds countdown
    });

    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      setState(() {
        _resendCountdown--;
      });

      if (_resendCountdown <= 0) {
        timer.cancel();
      }
    });
  }

  String get _verificationCode {
    return _controllers.map((controller) => controller.text).join();
  }

  void _onDigitChanged(int index, String value) {
    if (value.isNotEmpty && index < 5) {
      _focusNodes[index + 1].requestFocus();
    }

    // Check if all digits are entered
    if (_verificationCode.length == 6) {
      _verifyCode();
    }
  }

  void _onDigitBackspace(int index) {
    if (index > 0 && _controllers[index].text.isEmpty) {
      _focusNodes[index - 1].requestFocus();
    }
  }

  void _verifyCode() async {
    final code = _verificationCode;
    if (code.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('verification.invalid_code_length')),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ApiService.verifyResetCode(
        phoneNumber: widget.phoneNumber,
        verificationCode: code,
      );

      if (result['success'] && mounted) {
        // Navigate to new password screen
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => NewPasswordScreen(
              phoneNumber: widget.phoneNumber,
              verificationCode: code,
              schoolCode: widget.schoolCode,
              teacherPhoneNumber: widget.teacherPhoneNumber,
              resetToken: (result['data'] is Map)
                  ? result['data']['resetToken']
                  : null,
            ),
          ),
        );
      } else if (mounted) {
        // Clear the code fields on error
        for (var controller in _controllers) {
          controller.clear();
        }
        _focusNodes[0].requestFocus();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              (result['code'] == 'NETWORK_OFFLINE' ||
                      (result['message']?.toString().toUpperCase().contains(
                            'NETWORK',
                          ) ??
                          false))
                  ? context.tr('common.offline_message')
                  : (result['message'] ??
                        context.tr('verification.invalid_code')),
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

  void _resendCode() async {
    if (_resendCountdown > 0 || _isResending) return;

    setState(() {
      _isResending = true;
    });

    try {
      final result = await ApiService.requestPasswordReset(
        schoolCode: widget.schoolCode,
        phoneNumber: widget.teacherPhoneNumber,
      );

      if (result['success'] && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Verification code resent'),
            backgroundColor: Colors.green,
          ),
        );
        _startResendCountdown();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message'] ?? 'Failed to resend code'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isResending = false;
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
              title: Text(
                context.tr('verification.title'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: DSColors.white,
              foregroundColor: DSColors.charcoal,
              elevation: 1,
              actions: const [
                Padding(
                  padding: EdgeInsetsDirectional.only(end: 8),
                  child: Icon(LineAwesomeIcons.shield_alt_solid),
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
                      decoration: const BoxDecoration(
                        color: DSColors.primary,
                        shape: BoxShape.circle,
                        boxShadow: [DSShadows.card],
                      ),
                      child: const Icon(
                        LineAwesomeIcons.envelope_solid,
                        size: 50,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Title
                    Text(
                      context.tr('verification.subtitle'),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: DSColors.charcoal,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 16),

                    // Description
                    Text(
                      context
                          .tr('verification.description')
                          .replaceAll('{phoneNumber}', widget.phoneNumber),
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: DSColors.darkGray,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 48),

                    // Verification Code Input - Force LTR layout
                    Directionality(
                      textDirection:
                          TextDirection.ltr, // Force entire section to be LTR
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: List.generate(6, (index) {
                          return SizedBox(
                            width: 45,
                            height: 60,
                            child: Directionality(
                              textDirection: TextDirection
                                  .ltr, // Force each field to be LTR
                              child: TextField(
                                controller: _controllers[index],
                                focusNode: _focusNodes[index],
                                textAlign: TextAlign.center,
                                textDirection: TextDirection
                                    .ltr, // Force left-to-right text direction
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                ),
                                keyboardType: TextInputType.number,
                                inputFormatters: [
                                  LengthLimitingTextInputFormatter(1),
                                  FilteringTextInputFormatter.digitsOnly,
                                ],
                                decoration: InputDecoration(
                                  isDense: true,
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                      color: DSColors.mediumGray,
                                    ),
                                  ),
                                  enabledBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                      color: DSColors.mediumGray,
                                    ),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(12),
                                    borderSide: const BorderSide(
                                      color: DSColors.primary,
                                      width: 2,
                                    ),
                                  ),
                                  filled: true,
                                  fillColor: Colors.white,
                                ),
                                onChanged: (value) =>
                                    _onDigitChanged(index, value),
                                onTap: () {
                                  _controllers[index]
                                      .selection = TextSelection.fromPosition(
                                    TextPosition(
                                      offset: _controllers[index].text.length,
                                    ),
                                  );
                                },
                              ),
                            ),
                          );
                        }),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Verify Button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _verifyCode,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: DSColors.primary,
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
                                context.tr('verification.verify_button'),
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Resend Code Section
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          context.tr('verification.didnt_receive'),
                          style: const TextStyle(color: DSColors.darkGray),
                        ),
                        const SizedBox(width: 8),
                        if (_resendCountdown > 0)
                          Text(
                            '($_resendCountdown${context.tr('verification.seconds')})',
                            style: const TextStyle(
                              color: DSColors.darkGray,
                              fontWeight: FontWeight.w600,
                            ),
                          )
                        else
                          TextButton(
                            onPressed: _isResending ? null : _resendCode,
                            child: _isResending
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'أعد الإرسال',
                                    style: TextStyle(
                                      color: DSColors.primary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                          ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // Back Button
                    TextButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      child: const Text(
                        'رجوع',
                        style: TextStyle(
                          color: DSColors.darkGray,
                          fontSize: 16,
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
