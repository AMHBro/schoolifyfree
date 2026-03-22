import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import 'new_password_screen.dart';
import 'dart:async';

class VerificationScreen extends StatefulWidget {
  final String phoneNumber;
  final String schoolCode;
  final String studentCode;

  const VerificationScreen({
    super.key,
    required this.phoneNumber,
    required this.schoolCode,
    required this.studentCode,
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

  // removed unused backspace handler

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
        // Token not required; navigate to new password screen directly
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => NewPasswordScreen(
              phoneNumber: widget.phoneNumber,
              verificationCode: code,
              schoolCode: widget.schoolCode,
              studentCode: widget.studentCode,
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
            content: Text(context.tr('verification.invalid_code')),
            backgroundColor: Colors.red,
          ),
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

  void _resendCode() async {
    if (_resendCountdown > 0 || _isResending) return;

    setState(() {
      _isResending = true;
    });

    try {
      final result = await ApiService.requestPasswordReset(
        schoolCode: widget.schoolCode,
        studentCode: widget.studentCode,
      );

      if (result['success'] && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('verification.code_resent')),
            backgroundColor: Colors.green,
          ),
        );
        _startResendCountdown();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('verification.code_resend_failed')),
            backgroundColor: Colors.red,
          ),
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
            backgroundColor: Colors.blue.shade50,
            appBar: AppBar(
              title: Text(context.tr('verification.title')),
              backgroundColor: Colors.blue.shade600,
              foregroundColor: Colors.white,
              elevation: 0,
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
                        color: Colors.blue.shade600,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(
                        Icons.verified_user,
                        size: 50,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Title
                    Text(
                      context.tr('verification.subtitle'),
                      style: Theme.of(context).textTheme.headlineSmall
                          ?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.blue.shade800,
                          ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 16),

                    // Description
                    Text(
                      context
                          .tr('verification.description')
                          .replaceFirst('{phoneNumber}', widget.phoneNumber),
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 48),

                    // OTP Input Fields - Force LTR layout
                    Directionality(
                      textDirection:
                          TextDirection.ltr, // Force entire section to be LTR
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: List.generate(6, (index) {
                          return SizedBox(
                            width: 50,
                            height: 60,
                            child: TextFormField(
                              controller: _controllers[index],
                              focusNode: _focusNodes[index],
                              keyboardType: TextInputType.number,
                              textAlign: TextAlign.center,
                              textDirection: TextDirection
                                  .ltr, // Force left-to-right text direction
                              maxLength: 1,
                              style: Theme.of(context).textTheme.headlineSmall
                                  ?.copyWith(fontWeight: FontWeight.bold),
                              decoration: InputDecoration(
                                counterText: '',
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: Colors.grey.shade300,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                    color: Colors.blue.shade600,
                                    width: 2,
                                  ),
                                ),
                                filled: true,
                                fillColor: Colors.white,
                              ),
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                              ],
                              onChanged: (value) =>
                                  _onDigitChanged(index, value),
                              onTap: () {
                                if (_controllers[index].text.isNotEmpty) {
                                  _controllers[index]
                                      .selection = TextSelection.fromPosition(
                                    TextPosition(
                                      offset: _controllers[index].text.length,
                                    ),
                                  );
                                }
                              },
                              onEditingComplete: () {
                                if (index < 5 &&
                                    _controllers[index].text.isNotEmpty) {
                                  _focusNodes[index + 1].requestFocus();
                                }
                              },
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
                          backgroundColor: Colors.blue.shade600,
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

                    // Resend Code Button
                    TextButton(
                      onPressed: _resendCountdown > 0 || _isResending
                          ? null
                          : _resendCode,
                      child: _isResending
                          ? const CircularProgressIndicator()
                          : Text(
                              _resendCountdown > 0
                                  ? context
                                        .tr('verification.resend_countdown')
                                        .replaceFirst(
                                          '{seconds}',
                                          _resendCountdown.toString(),
                                        )
                                  : context.tr('verification.resend_button'),
                              style: TextStyle(
                                color: _resendCountdown > 0
                                    ? Colors.grey.shade500
                                    : Colors.blue.shade600,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
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
