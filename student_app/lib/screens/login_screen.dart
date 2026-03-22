import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../config/app_config.dart';
// package_info_plus is optional; if unavailable, we fall back to AppConfig.appVersion
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _studentCodeController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _rememberMe = false;
  String? _appVersion;

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
    _studentCodeController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadVersion();
  }

  Future<void> _loadVersion() async {
    // Use configured version; replace with package_info_plus in future if added
    if (mounted) {
      setState(() {
        _appVersion = AppConfig.appVersion;
      });
    }
  }

  void _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    final error = await authProvider.login(
      _studentCodeController.text.trim().toUpperCase(),
      _passwordController.text,
    );

    if (error != null && mounted) {
      final message = _translateLoginError(error);
      await showDialog<void>(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(context.tr('common.error')),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: Text(context.tr('common.ok')),
            ),
          ],
        ),
      );
    } else if (mounted) {
      // Navigate to app shell (AuthWrapper → MainNavigationScreen) on success
      Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
    }
  }

  String _translateLoginError(String raw) {
    final lower = raw.toLowerCase();
    if (lower.contains('invalid student code or password')) {
      return context.tr('login.error_invalid_credentials');
    }
    if (lower.contains('network is unavailable') ||
        lower.contains('network error') ||
        lower.contains('failed host lookup') ||
        lower.contains('socketexception')) {
      return context.tr('common.offline_message');
    }
    return context.tr('login.error_generic');
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            backgroundColor: neutralLightGray,
            body: SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 60),

                    // Logo/Icon Section
                    Container(
                      height: 120,
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
                        Icons.school,
                        size: 60,
                        color: Colors.white,
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Welcome Text
                    Text(
                      context.tr('login.title'),
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: neutralCharcoal,
                          ),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 8),

                    Text(
                      context.tr('login.subtitle'),
                      style: Theme.of(
                        context,
                      ).textTheme.bodyLarge?.copyWith(color: neutralDarkGray),
                      textAlign: TextAlign.center,
                    ),

                    const SizedBox(height: 48),

                    // Login Form
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
                            // Student Code Field
                            TextFormField(
                              controller: _studentCodeController,
                              textCapitalization: TextCapitalization.characters,
                              decoration: InputDecoration(
                                labelText: context.tr('login.student_code'),
                                hintText: context.tr('login.student_code_hint'),
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
                                    'login.validation_student_code_required',
                                  );
                                }
                                if (value.length < 3) {
                                  return context.tr(
                                    'login.validation_student_code_length',
                                  );
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 20),

                            // Password Field
                            TextFormField(
                              controller: _passwordController,
                              obscureText: _obscurePassword,
                              decoration: InputDecoration(
                                labelText: context.tr('login.password'),
                                hintText: context.tr('login.password_hint'),
                                prefixIcon: const Icon(Icons.lock),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePassword
                                        ? Icons.visibility_off
                                        : Icons.visibility,
                                  ),
                                  onPressed: () {
                                    setState(() {
                                      _obscurePassword = !_obscurePassword;
                                    });
                                  },
                                ),
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
                                    'login.validation_password_required',
                                  );
                                }
                                if (value.length < 6) {
                                  return context.tr(
                                    'login.validation_password_length',
                                  );
                                }
                                return null;
                              },
                            ),

                            const SizedBox(height: 16),

                            // Remember Me Checkbox
                            Row(
                              children: [
                                Checkbox(
                                  value: _rememberMe,
                                  activeColor: primaryColor,
                                  onChanged: (value) {
                                    setState(() {
                                      _rememberMe = value ?? false;
                                    });
                                  },
                                ),
                                Text(
                                  context.tr('login.remember_me'),
                                  style: TextStyle(color: neutralCharcoal),
                                ),
                              ],
                            ),

                            const SizedBox(height: 8),

                            // Forgot Password - Right aligned
                            Align(
                              alignment: Alignment.centerRight,
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
                                  foregroundColor: primaryColor,
                                ),
                                child: Text(
                                  context.tr('login.forgot_password'),
                                ),
                              ),
                            ),

                            const SizedBox(height: 32),

                            // Login Button
                            Consumer<AuthProvider>(
                              builder: (context, authProvider, child) {
                                return SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: ElevatedButton(
                                    onPressed: authProvider.isLoading
                                        ? null
                                        : _handleLogin,
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
                                    child: authProvider.isLoading
                                        ? const CircularProgressIndicator(
                                            color: Colors.white,
                                          )
                                        : Text(
                                            context.tr('login.login_button'),
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                  ),
                                );
                              },
                            ),
                          ],
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Or divider
                    Row(
                      children: [
                        const Expanded(
                          child: Divider(color: Color(0xFFE5E7EB)),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            context.tr('login.or'),
                            style: const TextStyle(color: Color(0xFF6B7280)),
                          ),
                        ),
                        const Expanded(
                          child: Divider(color: Color(0xFFE5E7EB)),
                        ),
                      ],
                    ),

                    const SizedBox(height: 24),

                    // Continue as Guest
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.of(
                            context,
                          ).pushNamedAndRemoveUntil('/home', (route) => false);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: primaryColor,
                          side: const BorderSide(
                            color: primaryColor,
                            width: 1.5,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(radiusMedium),
                          ),
                        ),
                        child: Text(
                          context.tr('login.continue_as_guest'),
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Help/Info Button
                    OutlinedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(context.tr('login.help_message')),
                            duration: const Duration(seconds: 5),
                            backgroundColor: primaryColor,
                          ),
                        );
                      },
                      icon: const Icon(Icons.help_outline),
                      label: Text(context.tr('login.login_help')),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        foregroundColor: primaryColor,
                        side: const BorderSide(color: primaryColor),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(radiusMedium),
                        ),
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Footer
                    Text(
                      '${AppConfig.appName}\n${context.tr('login.version')}${_appVersion ?? AppConfig.appVersion}',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: neutralDarkGray, fontSize: 12),
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
