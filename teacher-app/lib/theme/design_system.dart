import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// Design system tokens adapted from education_design_system.json
class DSColors {
  static const Color primary = Color(0xFF742FB5); // Updated primary
  static const Color blue = Color(0xFF6366F1);
  static const Color orange = Color(0xFFFF6B47);
  static const Color white = Color(0xFFFFFFFF);
  static const Color lightGray = Color(0xFFF9FAFB);
  static const Color mediumGray = Color(0xFFE5E7EB);
  static const Color darkGray = Color(0xFF6B7280);
  static const Color charcoal = Color(0xFF374151);
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
}

class DSSpacing {
  static const double unit = 4;
  static const double containerPadding = 24;
  static const double sectionSpacing = 32;
}

class DSRadii {
  static const double small = 8;
  static const double medium = 12;
  static const double large = 16;
  static const double xl = 20;
}

class DSShadows {
  static const BoxShadow card = BoxShadow(
    color: Color(0x14000000), // rgba(0,0,0,0.08)
    blurRadius: 8,
    spreadRadius: 0,
    offset: Offset(0, 2),
  );
  static const BoxShadow micro = BoxShadow(
    color: Color(0x0D000000), // ~0.05
    blurRadius: 4,
    spreadRadius: 0,
    offset: Offset(0, 1),
  );
  static const BoxShadow nano = BoxShadow(
    color: Color(0x0A000000), // ~0.04
    blurRadius: 2,
    spreadRadius: 0,
    offset: Offset(0, 1),
  );
}

class DSTypography {
  static const String fontFamily = 'Tajawal';

  static TextStyle get h1 => GoogleFonts.tajawal(
    fontSize: 32,
    fontWeight: FontWeight.w700,
    height: 1.2,
    letterSpacing: -0.02,
  );

  static TextStyle get h2 => GoogleFonts.tajawal(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    height: 1.3,
    letterSpacing: -0.01,
  );

  static TextStyle get h3 => GoogleFonts.tajawal(
    fontSize: 18,
    fontWeight: FontWeight.w600,
    height: 1.4,
  );

  static TextStyle get body => GoogleFonts.tajawal(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    height: 1.5,
  );

  static TextStyle get caption => GoogleFonts.tajawal(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    height: 1.4,
    color: DSColors.darkGray,
  );
}

class DSTheme {
  static ThemeData themeData(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: DSColors.primary,
      primary: DSColors.primary,
      brightness: Brightness.light,
    );

    final baseTextTheme = GoogleFonts.tajawalTextTheme(
      ThemeData(brightness: Brightness.light).textTheme,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: DSColors.lightGray,
      fontFamily: DSTypography.fontFamily,
      appBarTheme: AppBarTheme(
        backgroundColor: DSColors.white,
        foregroundColor: DSColors.charcoal,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        surfaceTintColor: Colors.transparent,
        toolbarHeight: 60,
        iconTheme: const IconThemeData(color: DSColors.charcoal, size: 22),
        actionsIconTheme: const IconThemeData(
          color: DSColors.charcoal,
          size: 22,
        ),
        titleTextStyle: DSTypography.h2.copyWith(color: DSColors.charcoal),
      ),
      cardTheme: const CardThemeData(
        color: DSColors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(DSRadii.large)),
        ),
        margin: EdgeInsets.zero,
      ),
      dividerColor: DSColors.mediumGray,
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: DSColors.primary,
      ),
      textTheme: baseTextTheme.copyWith(
        titleLarge: DSTypography.h2,
        titleMedium: DSTypography.h3,
        bodyMedium: DSTypography.body,
        bodySmall: DSTypography.caption,
      ),
    );
  }
}
