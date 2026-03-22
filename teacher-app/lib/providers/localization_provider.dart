import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';

class LocalizationProvider extends ChangeNotifier {
  Locale _locale = const Locale('ar'); // Arabic is default
  Map<String, dynamic> _translations = {};
  bool _isLoading = true;

  Locale get locale => _locale;
  bool get isLoading => _isLoading;

  // Direction for RTL/LTR support
  TextDirection get textDirection =>
      _locale.languageCode == 'ar' ? TextDirection.rtl : TextDirection.ltr;

  List<Map<String, String>> get availableLanguages => [
    {'code': 'ar', 'name': 'العربية', 'flag': '🇮🇶'}, // Iraq flag
    {'code': 'en', 'name': 'English', 'flag': '🇺🇸'},
  ];

  String get currentLanguageName {
    final lang = availableLanguages.firstWhere(
      (lang) => lang['code'] == _locale.languageCode,
      orElse: () => availableLanguages.first,
    );
    return lang['name']!;
  }

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      final languageCode =
          prefs.getString('language') ?? 'ar'; // Default to Arabic

      _locale = Locale(languageCode);
      await _loadTranslations(languageCode);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      // Fallback to Arabic if initialization fails
      _locale = const Locale('ar');
      await _loadTranslations('ar');
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadTranslations(String languageCode) async {
    try {
      final jsonString = await rootBundle.loadString(
        'assets/locales/$languageCode.json',
      );
      _translations = json.decode(jsonString);
    } catch (e) {
      // Fallback to Arabic if loading fails
      if (languageCode != 'ar') {
        try {
          final jsonString = await rootBundle.loadString(
            'assets/locales/ar.json',
          );
          _translations = json.decode(jsonString);
        } catch (fallbackError) {
          // Minimal fallback translations
          _translations = {
            'common': {'loading': 'جار التحميل...', 'error': 'خطأ'},
            'home': {'title': 'لوحة التحكم للمعلم'},
            'settings': {'title': 'الإعدادات'},
          };
        }
      }
    }
  }

  Future<void> changeLanguage(String languageCode) async {
    if (_locale.languageCode == languageCode) return;

    _locale = Locale(languageCode);
    await _loadTranslations(languageCode);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', languageCode);

    notifyListeners();
  }

  String translate(
    String key, {
    String? fallback,
    Map<String, dynamic>? params,
  }) {
    final keys = key.split('.');
    dynamic value = _translations;

    for (final k in keys) {
      if (value is Map<String, dynamic> && value.containsKey(k)) {
        value = value[k];
      } else {
        // Return fallback or Arabic default
        return fallback ?? _getArabicFallback(key);
      }
    }

    String result = value?.toString() ?? (fallback ?? _getArabicFallback(key));

    // Replace parameters if provided
    if (params != null) {
      params.forEach((paramKey, paramValue) {
        result = result.replaceAll('{$paramKey}', paramValue.toString());
      });
    }

    return result;
  }

  String _getArabicFallback(String key) {
    // Provide basic Arabic fallbacks for common keys
    final fallbacks = {
      'common.loading': 'جار التحميل...',
      'common.error': 'خطأ',
      'common.ok': 'موافق',
      'common.cancel': 'إلغاء',
      'home.title': 'لوحة التحكم للمعلم',
      'settings.title': 'الإعدادات',
      'settings.language': 'اللغة',
      // Settings – important labels used in SettingsScreen
      'settings.privacy': 'الخصوصية',
      'settings.privacy_desc': 'عرض سياسة الخصوصية',
      'settings.help_support': 'المساعدة والدعم',
      'settings.help_support_subtitle': 'الحصول على المساعدة والتواصل مع الدعم',
      'settings.profile_header.teacher_role': 'معلم',
      'language.arabic': 'العربية',
      'language.english': 'English',
    };

    return fallbacks[key] ?? key;
  }
}

// Extension to make translation calls easier
extension LocalizationExtension on BuildContext {
  String tr(String key, {String? fallback, Map<String, dynamic>? params}) {
    final provider = Provider.of<LocalizationProvider>(this, listen: false);
    return provider.translate(key, fallback: fallback, params: params);
  }

  LocalizationProvider get localization =>
      Provider.of<LocalizationProvider>(this, listen: false);
}
