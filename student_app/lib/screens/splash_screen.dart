import 'dart:async';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../providers/localization_provider.dart';
import '../config/app_config.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
      value: 0.0,
    );
    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    );

    // Start fade-in then bootstrap
    _controller.forward().whenComplete(() => _bootstrap());
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Future<void> _bootstrap() async {
    if (!mounted) return;

    // No-op: localization is initialized in main; not needed here

    // Check cached token (primary and legacy) to decide initial route
    final prefs = await SharedPreferences.getInstance();
    String? token = prefs.getString(AppConfig.authTokenKey);
    if (token == null) {
      for (final key in AppConfig.legacyAuthTokenKeys) {
        token = prefs.getString(key);
        if (token != null) break;
      }
    }

    if (!mounted) return;
    await _controller.reverse();

    if (!mounted) return;
    if (token != null && token.isNotEmpty) {
      Navigator.of(context).pushReplacementNamed('/home');
    } else {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Respect current language direction
    final localization = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    );

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Center(
          child: Directionality(
            textDirection: localization.textDirection,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Logo
                  Image.asset(
                    'assets/images/schollify-purple1.png',
                    width: 100,
                    fit: BoxFit.contain,
                  ),
                  const SizedBox(height: 20),

                  // Bilingual title
                  Text(
                    'Schoolify',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                      fontFamily: 'Tajawal',
                    ),
                  ),
                  Text(
                    'سكولي فاي',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.normal,
                      color: Colors.black54,
                      fontFamily: 'Tajawal',
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Progress indicator in brand color
                  CircularProgressIndicator(
                    strokeWidth: 3,
                    color: Theme.of(context).colorScheme.primary,
                  ),

                  const SizedBox(height: 12),

                  // Localized loading text
                  Text(
                    localization.isArabic ? 'جاري التحميل...' : 'Loading...',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.normal,
                      color: Colors.black54,
                      fontFamily: 'Tajawal',
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
