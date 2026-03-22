import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import 'new_password_screen.dart';
import 'dart:async';

// Design system colors
const Color kPrimary = Color(0xFF742FB5); // Primary brand color
const Color kNeutralLight = Color(0xFFF9FAFB);
const Color kNeutralMedium = Color(0xFFE5E7EB);
const Color kNeutralDark = Color(0xFF6B7280);
const Color kCharcoal = Color(0xFF374151);
const Color kSuccess = Color(0xFF10B981);
const Color kError = Color(0xFFEF4444);

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
          backgroundColor: kError,
        ),
      );
      return;
    }

    // Debug logging
    print('=== STUDENT VERIFICATION DEBUG ===');
    print('Phone Number: "${widget.phoneNumber}"');
    print('Verification Code: "$code"');
    print('School Code: "${widget.schoolCode}"');
    print('Student Code: "${widget.studentCode}"');
    print('=== END STUDENT DEBUG ===');

    setState(() {
      _isLoading = true;
    });

    try {
      final result = await ApiService.verifyResetCode(
        phoneNumber: widget.phoneNumber,
        verificationCode: code,
        schoolCode: widget.schoolCode,
        studentCode: widget.studentCode,
      );

      if (result['success'] && mounted) {
        // Navigate to new password screen
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

        final message = _translateVerifyError(result['message']?.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: kError),
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
            backgroundColor: kSuccess,
          ),
        );
        _startResendCountdown();
      } else if (mounted) {
        final message = _translateVerifyError(result['message']?.toString());
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: kError),
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
          _isResending = false;
        });
      }
    }
  }

  String _translateVerifyError(String? raw) {
    final msg = (raw ?? '').toLowerCase();
    if (msg.contains('student not found') ||
        msg.contains('no verification code requested') ||
        msg == 'not_found' ||
        msg.contains('invalid')) {
      return context.tr('verification.invalid_code');
    }
    if (msg.contains('network') || msg.contains('failed host lookup')) {
      return context.tr('common.offline_message');
    }
    return context.tr('verification.code_resend_failed');
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
                context.tr('verification.title'),
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              backgroundColor: Colors.white,
              foregroundColor: kCharcoal,
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
                          const SizedBox(height: 8),
                          Center(
                            child: CircleAvatar(
                              radius: 40,
                              backgroundColor: kPrimary.withOpacity(0.12),
                              child: const Icon(
                                LineAwesomeIcons.envelope_solid,
                                size: 40,
                                color: kPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            context.tr('verification.subtitle'),
                            style: Theme.of(context).textTheme.headlineSmall
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  color: kCharcoal,
                                ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 12),
                          Text(
                            context
                                .tr('verification.description')
                                .replaceAll('{phone}', widget.phoneNumber),
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(color: kNeutralDark),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 32),
                          Directionality(
                            textDirection: TextDirection.ltr,
                            child: Row(
                              children: List.generate(6, (index) {
                                return Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 4,
                                    ),
                                    child: SizedBox(
                                      height: 56,
                                      child: Directionality(
                                        textDirection: TextDirection.ltr,
                                        child: TextField(
                                          controller: _controllers[index],
                                          focusNode: _focusNodes[index],
                                          textAlign: TextAlign.center,
                                          textDirection: TextDirection.ltr,
                                          style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w700,
                                          ),
                                          keyboardType: TextInputType.number,
                                          inputFormatters: [
                                            LengthLimitingTextInputFormatter(1),
                                            FilteringTextInputFormatter
                                                .digitsOnly,
                                          ],
                                          decoration: InputDecoration(
                                            isDense: true,
                                            border: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: const BorderSide(
                                                color: kNeutralMedium,
                                              ),
                                            ),
                                            enabledBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: const BorderSide(
                                                color: kNeutralMedium,
                                              ),
                                            ),
                                            focusedBorder: OutlineInputBorder(
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                              borderSide: const BorderSide(
                                                color: kPrimary,
                                                width: 2,
                                              ),
                                            ),
                                            filled: true,
                                            fillColor: Colors.white,
                                          ),
                                          onChanged: (value) =>
                                              _onDigitChanged(index, value),
                                          onEditingComplete: () {
                                            if (_controllers[index]
                                                .text
                                                .isEmpty) {
                                              _onDigitBackspace(index);
                                            }
                                          },
                                          onTap: () {
                                            _controllers[index].selection =
                                                TextSelection.fromPosition(
                                                  TextPosition(
                                                    offset: _controllers[index]
                                                        .text
                                                        .length,
                                                  ),
                                                );
                                          },
                                        ),
                                      ),
                                    ),
                                  ),
                                );
                              }),
                            ),
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            height: 56,
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _verifyCode,
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
                                      context.tr('verification.verify_button'),
                                      style: const TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                context.tr('verification.didnt_receive'),
                                style: const TextStyle(color: kNeutralDark),
                              ),
                              const SizedBox(width: 8),
                              if (_resendCountdown > 0)
                                Text(
                                  '($_resendCountdown${context.tr('verification.seconds')})',
                                  style: const TextStyle(
                                    color: kNeutralDark,
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
                                      : Text(
                                          context.tr('verification.resend'),
                                          style: const TextStyle(
                                            color: kPrimary,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: () {
                              Navigator.of(context).pop();
                            },
                            child: Text(
                              context.tr('verification.back'),
                              style: const TextStyle(
                                color: kNeutralDark,
                                fontSize: 16,
                              ),
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
