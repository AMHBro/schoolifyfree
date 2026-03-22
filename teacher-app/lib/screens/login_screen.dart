import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../main.dart'; // Import for global navigator key
import 'forgot_password_screen.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../config/app_config.dart';
import 'main_navigation_screen.dart';

// Design system tokens (subset) mapped for Flutter UI
const Color _dsPrimary = Color(0xFF742FB5);
const Color _dsWhite = Color(0xFFFFFFFF);
const Color _dsLightGray = Color(0xFFF9FAFB);
const Color _dsMediumGray = Color(0xFFE5E7EB);
const Color _dsDarkGray = Color(0xFF6B7280);
const Color _dsCharcoal = Color(0xFF374151);
const Color _dsError = Color(0xFFEF4444);
const Color _dsInfo = Color(0xFF3B82F6);

const double _dsRadiusMedium = 12;
const double _dsRadiusLarge = 16;

final List<BoxShadow> _dsCardShadow = [
  BoxShadow(
    color: Colors.black.withOpacity(0.08),
    blurRadius: 8,
    offset: const Offset(0, 2),
  ),
];

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

// Separate widget for the form to prevent rebuilds
class _LoginForm extends StatefulWidget {
  final VoidCallback onLoginStart;
  final Function(String, String) onLoginSubmit;
  final String? errorMessage;
  final bool isLoading;

  const _LoginForm({
    required this.onLoginStart,
    required this.onLoginSubmit,
    this.errorMessage,
    required this.isLoading,
  });

  @override
  State<_LoginForm> createState() => _LoginFormState();
}

class _LoginFormState extends State<_LoginForm> with RestorationMixin {
  final _formKey = GlobalKey<FormState>();
  late RestorableTextEditingController _phoneController;
  late RestorableTextEditingController _passwordController;
  late RestorableBool _obscurePassword;
  late RestorableBool _rememberMe;

  @override
  String? get restorationId => 'login_form';

  @override
  void initState() {
    super.initState();
    _phoneController = RestorableTextEditingController();
    _passwordController = RestorableTextEditingController();
    _obscurePassword = RestorableBool(true);
    _rememberMe = RestorableBool(false);
  }

  @override
  void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_phoneController, 'phone');
    registerForRestoration(_passwordController, 'password');
    registerForRestoration(_obscurePassword, 'obscure_password');
    registerForRestoration(_rememberMe, 'remember_me');
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _obscurePassword.dispose();
    _rememberMe.dispose();
    super.dispose();
  }

  void _handleLogin() {
    if (!_formKey.currentState!.validate()) return;

    widget.onLoginStart();
    widget.onLoginSubmit(
      _phoneController.value.text.trim(),
      _passwordController.value.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: EdgeInsets.fromLTRB(
              24.0,
              24.0,
              24.0,
              24.0 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),
                Container(
                  height: 120,
                  decoration: BoxDecoration(
                    color: _dsPrimary,
                    shape: BoxShape.circle,
                    boxShadow: _dsCardShadow,
                  ),
                  child: const Icon(
                    LineAwesomeIcons.school_solid,
                    size: 60,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  context.tr('login.welcome_title'),
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                    color: _dsCharcoal,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  context.tr('login.welcome_subtitle'),
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    fontSize: 14,
                    color: _dsDarkGray,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 48),
                if (widget.errorMessage != null &&
                    widget.errorMessage!.isNotEmpty) ...[
                  const SizedBox.shrink(),
                ],
                Container(
                  decoration: BoxDecoration(
                    color: _dsWhite,
                    borderRadius: BorderRadius.circular(_dsRadiusLarge),
                    boxShadow: _dsCardShadow,
                  ),
                  padding: const EdgeInsets.all(24),
                  child: Builder(
                    builder: (context) {
                      final String msg = widget.errorMessage ?? '';
                      final String msgLower = msg.toLowerCase();
                      final bool highlightPhone =
                          msg.contains('رقم الهاتف') ||
                          msgLower.contains('phone');
                      final bool highlightPassword =
                          msg.contains('كلمة المرور') ||
                          msgLower.contains('password');

                      return Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            TextFormField(
                              key: const Key('phone_field'),
                              controller: _phoneController.value,
                              keyboardType: TextInputType.phone,
                              textDirection: TextDirection.ltr,
                              textAlign: TextAlign.left,
                              decoration: InputDecoration(
                                labelText: context.tr('login.phone_number'),
                                hintText: context.tr('login.phone_number_hint'),
                                prefixIcon: const Icon(
                                  LineAwesomeIcons.phone_solid,
                                ),
                                prefixIconColor: _dsDarkGray,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    _dsRadiusMedium,
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    _dsRadiusMedium,
                                  ),
                                  borderSide: BorderSide(
                                    color: highlightPhone
                                        ? _dsError.withOpacity(0.4)
                                        : _dsMediumGray,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    _dsRadiusMedium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: _dsPrimary,
                                    width: 2,
                                  ),
                                ),
                                filled: true,
                                fillColor: _dsWhite,
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return context.tr(
                                    'login.validation.phone_required',
                                  );
                                }
                                if (value.length < 10) {
                                  return context.tr(
                                    'login.validation.phone_invalid',
                                  );
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 20),
                            TextFormField(
                              key: const Key('password_field'),
                              controller: _passwordController.value,
                              obscureText: _obscurePassword.value,
                              decoration: InputDecoration(
                                labelText: context.tr('login.password'),
                                hintText: context.tr('login.password_hint'),
                                prefixIcon: const Icon(
                                  LineAwesomeIcons.lock_solid,
                                ),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword.value
                                        ? LineAwesomeIcons.eye_slash_solid
                                        : LineAwesomeIcons.eye_solid,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword.value =
                                          !_obscurePassword.value;
                                    });
                                  },
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    _dsRadiusMedium,
                                  ),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    _dsRadiusMedium,
                                  ),
                                  borderSide: BorderSide(
                                    color: highlightPassword
                                        ? _dsError.withOpacity(0.4)
                                        : _dsMediumGray,
                                  ),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    _dsRadiusMedium,
                                  ),
                                  borderSide: const BorderSide(
                                    color: _dsPrimary,
                                    width: 2,
                                  ),
                                ),
                                filled: true,
                                fillColor: _dsWhite,
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return context.tr(
                                    'login.validation.password_required',
                                  );
                                }
                                if (value.length < 6) {
                                  return context.tr(
                                    'login.validation.password_length',
                                  );
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),
                            // Remember me under the password
                            Row(
                              mainAxisAlignment: MainAxisAlignment.start,
                              children: [
                                Checkbox(
                                  value: _rememberMe.value,
                                  onChanged: (value) {
                                    setState(() {
                                      _rememberMe.value = value ?? false;
                                    });
                                  },
                                  activeColor: _dsPrimary,
                                ),
                                Text(context.tr('login.remember_me')),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Align(
                              alignment: AlignmentDirectional.centerEnd,
                              child: TextButton(
                                onPressed: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (context) =>
                                          const ForgotPasswordScreen(),
                                    ),
                                  );
                                },
                                style: TextButton.styleFrom(
                                  foregroundColor: _dsPrimary,
                                ),
                                child: Text(
                                  context.tr('login.forgot_password'),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            const SizedBox(height: 32),
                            SizedBox(
                              width: double.infinity,
                              height: 56,
                              child: ElevatedButton(
                                onPressed: widget.isLoading
                                    ? null
                                    : _handleLogin,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _dsPrimary,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(
                                      _dsRadiusMedium,
                                    ),
                                  ),
                                  elevation: 2,
                                ),
                                child: widget.isLoading
                                    ? const CircularProgressIndicator(
                                        color: Colors.white,
                                      )
                                    : Text(
                                        context.tr('login.sign_in'),
                                        style: const TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              height: 48,
                              child: OutlinedButton(
                                onPressed: widget.isLoading
                                    ? null
                                    : () {
                                        Navigator.of(
                                          context,
                                        ).pushAndRemoveUntil(
                                          MaterialPageRoute(
                                            builder: (_) =>
                                                const MainNavigationScreen(),
                                          ),
                                          (route) => false,
                                        );
                                      },
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: _dsPrimary,
                                  side: const BorderSide(
                                    color: _dsPrimary,
                                    width: 1.5,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(
                                      _dsRadiusMedium,
                                    ),
                                  ),
                                ),
                                child: Text(
                                  context.tr(
                                    'login.continue_as_guest',
                                    fallback: 'Continue as Guest',
                                  ),
                                  style: const TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 32),
                Text(
                  AppConfig.appName + ' ' + AppConfig.appVersion,
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: _dsDarkGray, fontSize: 12),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _LoginScreenState extends State<LoginScreen> {
  String? _loginError;
  bool _isLoading = false;

  String _translateServerError(String serverError) {
    final String s = serverError.toLowerCase();

    if (s.contains('invalid credentials') ||
        s.contains('invalid phone number or password')) {
      return context.tr('login.errors.invalid_phone_or_password');
    }

    if (s.contains('too many')) {
      return context.tr('login.errors.too_many_attempts');
    }

    if (s.contains('network')) {
      return context.tr('login.errors.network_error');
    }

    if (s.contains('internal server error') || s.contains('server error')) {
      return context.tr('login.errors.server_error');
    }

    return context.tr('login.errors.unknown_error');
  }

  void _onLoginStart() {
    setState(() {
      _loginError = null;
      _isLoading = true;
    });
  }

  void _showErrorDialog(String errorMessage) {
    final context = navigatorKey.currentContext;
    if (context == null) {
      return;
    }

    final dir = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    ).textDirection;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(_dsRadiusLarge),
          ),
          title: Row(
            children: [
              const Icon(
                LineAwesomeIcons.exclamation_circle_solid,
                color: _dsError,
                size: 28,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  context.tr(
                    'login.error_dialog.title',
                    fallback: 'Login Error',
                  ),
                  style: const TextStyle(
                    color: _dsCharcoal,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  textDirection: dir,
                ),
              ),
            ],
          ),
          content: Container(
            constraints: const BoxConstraints(maxWidth: 350),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: _dsError.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: _dsError.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(
                        LineAwesomeIcons.exclamation_triangle_solid,
                        color: _dsError,
                        size: 24,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        errorMessage,
                        style: TextStyle(
                          color: _dsError,
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                        textDirection: dir,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _dsInfo.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: _dsInfo.withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            LineAwesomeIcons.info_circle_solid,
                            color: _dsInfo,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            context.tr(
                              'login.error_dialog.check_title',
                              fallback: 'Please check:',
                            ),
                            style: TextStyle(
                              color: _dsCharcoal,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                            textDirection: dir,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        context.tr(
                          'login.error_dialog.check_items_no_school',
                          fallback:
                              '• Phone number\n• Password\n• Internet connection',
                        ),
                        style: const TextStyle(
                          color: _dsDarkGray,
                          fontSize: 13,
                        ),
                        textDirection: dir,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          actions: [
            Container(
              width: double.infinity,
              margin: const EdgeInsets.only(top: 16),
              child: ElevatedButton(
                onPressed: () {
                  Navigator.of(dialogContext).pop();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: _dsPrimary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(_dsRadiusMedium),
                  ),
                  elevation: 2,
                ),
                child: Text(
                  context.tr('common.ok', fallback: 'OK'),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    ).then((_) {}).catchError((error) {});
  }

  void _handleLogin(String phone, String password) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);

      final error = await authProvider.login(phone, password);

      if (error != null) {
        final translatedError = _translateServerError(error);
        _showErrorDialog(translatedError);
        if (mounted) {
          setState(() {
            _loginError = translatedError;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _loginError = null;
            _isLoading = false;
          });
        }
        if (mounted) {
          Navigator.of(context).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const MainNavigationScreen()),
            (route) => false,
          );
        }
      }
    } catch (e) {
      final errorMessage = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      _showErrorDialog(errorMessage);
      if (mounted) {
        setState(() {
          _loginError = errorMessage;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _dsLightGray,
      body: SafeArea(
        child: _LoginForm(
          onLoginStart: _onLoginStart,
          onLoginSubmit: _handleLogin,
          errorMessage: _loginError,
          isLoading: _isLoading,
        ),
      ),
    );
  }
}
