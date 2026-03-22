import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';

class LocalizationProvider extends ChangeNotifier {
  static const String _languageKey = 'selected_language';

  Locale _currentLocale = const Locale('ar');
  Map<String, dynamic> _localizedStrings = {};
  bool _isLoading = true; // Start in loading state to avoid initial flash

  Locale get currentLocale => _currentLocale;
  bool get isLoading => _isLoading;
  bool get isArabic => _currentLocale.languageCode == 'ar';
  TextDirection get textDirection =>
      isArabic ? TextDirection.rtl : TextDirection.ltr;

  // Initialize the provider
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Load saved language preference
      final prefs = await SharedPreferences.getInstance();
      final savedLanguage = prefs.getString(_languageKey) ?? 'ar';
      _currentLocale = Locale(savedLanguage);

      // Load the language strings
      await _loadLanguageStrings();
    } catch (e) {
      debugPrint('Error initializing localization: $e');
      // Fall back to Arabic if there's an error
      _currentLocale = const Locale('ar');
      await _loadLanguageStrings();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Load language strings from JSON file
  Future<void> _loadLanguageStrings() async {
    try {
      debugPrint(
        'Loading language strings for: ${_currentLocale.languageCode}',
      );
      final String jsonString = await rootBundle.loadString(
        'assets/locales/${_currentLocale.languageCode}.json',
      );
      _localizedStrings = json.decode(jsonString);
      debugPrint(
        'Successfully loaded ${_localizedStrings.keys.length} translation keys',
      );
    } catch (e) {
      debugPrint(
        'Error loading language strings for ${_currentLocale.languageCode}: $e',
      );
      // Fall back to Arabic if the file doesn't exist
      if (_currentLocale.languageCode != 'ar') {
        try {
          debugPrint('Falling back to Arabic...');
          _currentLocale = const Locale('ar');
          final String jsonString = await rootBundle.loadString(
            'assets/locales/ar.json',
          );
          _localizedStrings = json.decode(jsonString);
          debugPrint(
            'Successfully loaded Arabic fallback with ${_localizedStrings.keys.length} keys',
          );
        } catch (fallbackError) {
          debugPrint(
            'Error loading Arabic fallback, trying English: $fallbackError',
          );
          // Fall back to English if Arabic also fails
          try {
            _currentLocale = const Locale('en');
            final String jsonString = await rootBundle.loadString(
              'assets/locales/en.json',
            );
            _localizedStrings = json.decode(jsonString);
            debugPrint(
              'Successfully loaded English fallback with ${_localizedStrings.keys.length} keys',
            );
          } catch (englishError) {
            debugPrint('Error loading English fallback: $englishError');
            // Create minimal Arabic fallback
            _localizedStrings = {
              'app_name': 'تطبيق الطالب',
              'home.title': 'بوابة الطالب',
              'navigation.home': 'الرئيسية',
              'navigation.profile': 'الملف الشخصي',
            };
          }
        }
      } else {
        // If Arabic also fails, create minimal Arabic fallback
        _localizedStrings = {
          'app_name': 'تطبيق الطالب',
          'home.title': 'بوابة الطالب',
          'navigation.home': 'الرئيسية',
          'navigation.profile': 'الملف الشخصي',
        };
      }
    }
  }

  // Change language
  Future<void> changeLanguage(String languageCode) async {
    if (_currentLocale.languageCode == languageCode) return;

    _isLoading = true;
    notifyListeners();

    try {
      _currentLocale = Locale(languageCode);
      await _loadLanguageStrings();

      // Save the preference
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, languageCode);
    } catch (e) {
      debugPrint('Error changing language: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Get localized string with nested path support
  String getString(
    String key, {
    Map<String, dynamic>? params,
    List<dynamic>? args,
  }) {
    if (_localizedStrings.isEmpty) return key;

    final keys = key.split('.');
    dynamic value = _localizedStrings;

    for (final k in keys) {
      if (value is Map<String, dynamic> && value.containsKey(k)) {
        value = value[k];
      } else {
        return key; // Return key if not found
      }
    }

    String result = value.toString();

    // Replace parameters if provided
    if (params != null) {
      params.forEach((paramKey, paramValue) {
        result = result.replaceAll('{$paramKey}', paramValue.toString());
      });
    }

    // Replace indexed arguments if provided
    if (args != null) {
      for (int i = 0; i < args.length; i++) {
        result = result.replaceAll('{$i}', args[i].toString());
      }
    }

    return result;
  }

  // Get available languages
  List<LanguageOption> getAvailableLanguages() {
    return [
      LanguageOption(
        code: 'ar',
        name: 'Arabic',
        nativeName: 'العربية',
        flag: '🇮🇶',
      ),
      LanguageOption(
        code: 'en',
        name: 'English',
        nativeName: 'English',
        flag: '🇺🇸',
      ),
    ];
  }

  // Get current language name
  String getCurrentLanguageName() {
    final languages = getAvailableLanguages();
    final current = languages.firstWhere(
      (lang) => lang.code == _currentLocale.languageCode,
      orElse: () => languages.first,
    );
    return current.nativeName;
  }
}

// Helper class for language options
class LanguageOption {
  final String code;
  final String name;
  final String nativeName;
  final String flag;

  LanguageOption({
    required this.code,
    required this.name,
    required this.nativeName,
    required this.flag,
  });
}

// Extension for easy access to localized strings
extension LocalizationContext on BuildContext {
  LocalizationProvider get localization =>
      Provider.of<LocalizationProvider>(this, listen: false);

  String tr(String key, {Map<String, dynamic>? params, List<dynamic>? args}) {
    final provider = Provider.of<LocalizationProvider>(this, listen: false);
    return provider.getString(key, params: params, args: args);
  }
}
