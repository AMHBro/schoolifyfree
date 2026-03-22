import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/localization_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'theme/design_system.dart';
import 'screens/splash_screen.dart';
import 'config/app_config.dart';

Future<void> main() async {
  // Ensure Flutter bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait only
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Configure GoogleFonts: allow runtime fetching on web since fonts aren't bundled
  if (kIsWeb) {
    GoogleFonts.config.allowRuntimeFetching = true;
  }

  // Pre-initialize localization to avoid in-app loading screen and flashes
  final localizationProvider = LocalizationProvider();
  await localizationProvider.initialize();

  // No explicit preload API available; rely on runtime fetching on web

  runApp(MyApp(localizationProvider: localizationProvider));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.localizationProvider});

  final LocalizationProvider localizationProvider;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AuthProvider()),
        ChangeNotifierProvider.value(value: localizationProvider),
      ],
      child: Consumer<LocalizationProvider>(
        builder: (context, localizationProvider, child) {
          return MaterialApp(
            title: 'Schoolify-Student',
            debugShowCheckedModeBanner: false,
            theme: DSTheme.themeData(context),
            useInheritedMediaQuery: true,
            builder: (context, child) {
              final media = MediaQuery.of(context);
              final double clampedTextScale = media.textScaleFactor
                  .clamp(0.85, 1.2)
                  .toDouble();
              return MediaQuery(
                data: media.copyWith(textScaleFactor: clampedTextScale),
                child: SafeArea(
                  top: false,
                  bottom: false,
                  child: child ?? const SizedBox.shrink(),
                ),
              );
            },
            // Localization settingss
            locale: localizationProvider.currentLocale,
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en', ''), // English
              Locale('ar', ''), // Arabic
            ],
            initialRoute: '/home',
            routes: {
              '/': (context) => const SplashScreen(),
              '/home': (context) => const AuthWrapper(),
              '/login': (context) => const LoginScreen(),
            },
            // Fallback for unexpected URLs (e.g., deep-links)
            onUnknownRoute: (_) =>
                MaterialPageRoute(builder: (_) => const AuthWrapper()),
          );
        },
      ),
    );
  }
}

// _InitializingScreen is no longer needed due to pre-initialization

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    if (state == AppLifecycleState.resumed) {
      // App resumed from background
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      authProvider.handleAppResumed();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // Show loading screen while checking authentication
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  // Localized loading text
                  _LocalizedLoadingText(),
                ],
              ),
            ),
          );
        }

        // Always show app shell. Screens handle guest placeholders and login CTA.
        return const MainNavigationScreen();
      },
    );
  }
}

// Small widget to access localization safely in const parent
class _LocalizedLoadingText extends StatelessWidget {
  const _LocalizedLoadingText();
  @override
  Widget build(BuildContext context) {
    return Text(context.tr('common.loading'));
  }
}
