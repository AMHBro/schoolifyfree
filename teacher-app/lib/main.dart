import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'providers/auth_provider.dart';
import 'providers/localization_provider.dart';
import 'theme/design_system.dart';
import 'widgets/loading_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'config/secure_config.dart';
import 'config/app_config.dart';

// Global navigator key for showing dialogs without context dependency
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait only
  await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);

  // Initialize secure configuration
  await SecureConfig.init();

  // Debug: Print configuration

  runApp(const TeacherApp());
}

class TeacherApp extends StatelessWidget {
  const TeacherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AuthProvider()),
        ChangeNotifierProvider(create: (context) => LocalizationProvider()),
      ],
      child: Consumer<LocalizationProvider>(
        builder: (context, localizationProvider, child) {
          return MaterialApp(
            key: ValueKey<String>(localizationProvider.locale.languageCode),
            title: 'Teacher App',
            debugShowCheckedModeBanner: false,
            restorationScopeId: 'teacher_app_root', // Enable state restoration
            theme: DSTheme.themeData(context),
            useInheritedMediaQuery: true,
            builder: (context, child) {
              final media = MediaQuery.of(context);
              // Clamp text scale to avoid overflows on accessibility extremes
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
            locale: localizationProvider.locale,
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [Locale('ar'), Locale('en')],
            home: const AppInitializer(),
            navigatorKey: navigatorKey, // Add global navigator key
          );
        },
      ),
    );
  }
}

class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  State<AppInitializer> createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // On hot reload, re-check auth to avoid stuck loading states
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    authProvider.recheckAuth();
  }

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    final localizationProvider = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    );
    await localizationProvider.initialize();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        if (localizationProvider.isLoading) {
          return const LoadingScreen();
        }

        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: const AuthWrapper(),
        );
      },
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        // Show loading screen while checking authentication
        if (authProvider.isLoading) {
          return const LoadingScreen();
        }

        // Show Home (MainNavigationScreen) for both guest and authenticated users.
        // Other screens handle guest placeholders and CTA to login.
        return const MainNavigationScreen();
      },
    );
  }
}
