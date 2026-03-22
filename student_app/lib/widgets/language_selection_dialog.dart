import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/localization_provider.dart';
import '../theme/design_system.dart';

// Bottom sheet version using DS tokens (replaces dialog)
Future<void> showLanguageSelectionDialog(BuildContext context) async {
  final localizationProvider = Provider.of<LocalizationProvider>(
    context,
    listen: false,
  );
  final currentLanguage = localizationProvider.currentLocale.languageCode;
  final availableLanguages = localizationProvider.getAvailableLanguages();

  await showModalBottomSheet(
    context: context,
    useSafeArea: true,
    backgroundColor: DSColors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (ctx) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.language, color: DSColors.charcoal),
                const SizedBox(width: 8),
                Text(
                  context.tr('language.title'),
                  style: DSTypography.h3.copyWith(color: DSColors.charcoal),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: DSColors.mediumGray.withOpacity(0.6)),
            const SizedBox(height: 8),
            Text(
              context.tr('language.change_language'),
              style: DSTypography.caption,
            ),
            const SizedBox(height: 12),
            ...availableLanguages.map((language) {
              final isSelected = language.code == currentLanguage;
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? DSColors.primary : DSColors.mediumGray,
                    width: isSelected ? 2 : 1,
                  ),
                  color: isSelected ? DSColors.primary.withOpacity(0.06) : null,
                ),
                child: ListTile(
                  onTap: localizationProvider.isLoading
                      ? null
                      : () async {
                          if (!isSelected) {
                            await localizationProvider.changeLanguage(
                              language.code,
                            );
                          }
                          if (ctx.mounted) Navigator.of(ctx).pop();
                        },
                  leading: Text(
                    language.flag,
                    style: const TextStyle(fontSize: 24),
                  ),
                  title: Text(
                    language.nativeName,
                    style: DSTypography.body.copyWith(
                      fontWeight: isSelected
                          ? FontWeight.w700
                          : FontWeight.w600,
                      color: DSColors.charcoal,
                    ),
                  ),
                  subtitle: language.name != language.nativeName
                      ? Text(language.name, style: DSTypography.caption)
                      : null,
                  trailing: isSelected
                      ? const Icon(Icons.check_circle, color: DSColors.primary)
                      : (localizationProvider.isLoading
                            ? const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : null),
                ),
              );
            }).toList(),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.of(ctx).pop(),
                child: Text(
                  context.tr('common.cancel'),
                  style: const TextStyle(color: DSColors.darkGray),
                ),
              ),
            ),
          ],
        ),
      );
    },
  );
}
