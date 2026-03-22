import 'package:flutter/material.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';

import '../providers/localization_provider.dart';
import '../theme/design_system.dart';
import '../screens/profile_screen.dart';
import '../screens/assignments_screen.dart';
import 'app_bar_logo_title.dart';

class SchoolifyAppBar extends StatelessWidget implements PreferredSizeWidget {
  final double height;
  final bool showBack;
  final PreferredSizeWidget? bottom;
  final VoidCallback? onBack;
  final List<Widget>? trailingActions;
  final bool showChatsShortcut;

  const SchoolifyAppBar({
    super.key,
    this.height = 60,
    this.showBack = false,
    this.bottom,
    this.onBack,
    this.trailingActions,
    this.showChatsShortcut = true,
  });

  @override
  Size get preferredSize =>
      Size.fromHeight(height + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context) {
    final isRtl = Directionality.of(context) == TextDirection.rtl;

    return AppBar(
      automaticallyImplyLeading: false,
      centerTitle: false,
      toolbarHeight: height,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      elevation: 0,
      titleSpacing: 0,
      title: Directionality(
        textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (showBack)
              IconButton(
                icon: Icon(
                  Icons.arrow_back,
                  size: 22,
                  textDirection: isRtl ? TextDirection.rtl : TextDirection.ltr,
                ),
                tooltip: _t(context, 'navigation.back', en: 'Back', ar: 'رجوع'),
                onPressed: () {
                  if (onBack != null) {
                    onBack!();
                  } else {
                    Navigator.of(context).maybePop();
                  }
                },
              ),
            const AppBarLogoTitle(),
          ],
        ),
      ),
      actions: [
        if (trailingActions != null) ...[
          ...trailingActions!,
          const SizedBox(width: 6),
        ],
        if (showChatsShortcut) ...[
          Container(
            decoration: BoxDecoration(
              color: DSColors.primary.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [DSShadows.micro],
            ),
            child: IconButton(
              icon: const Icon(LineAwesomeIcons.comment_alt_solid, size: 22),
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              splashRadius: 20,
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ChatsScreen()),
                );
              },
              tooltip: _t(
                context,
                'navigation.chats',
                en: 'Chats',
                ar: 'المحادثات',
              ),
            ),
          ),
          const SizedBox(width: 6),
        ],
        Padding(
          padding: const EdgeInsetsDirectional.only(end: 16),
          child: Container(
            decoration: BoxDecoration(
              color: DSColors.primary.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(12),
              boxShadow: const [DSShadows.micro],
            ),
            child: IconButton(
              icon: const Icon(LineAwesomeIcons.user_solid, size: 22),
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
              constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
              splashRadius: 20,
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                );
              },
              tooltip: _t(
                context,
                'navigation.profile',
                en: 'Profile',
                ar: 'الملف الشخصي',
              ),
            ),
          ),
        ),
      ],
      bottom: bottom,
    );
  }

  String _t(
    BuildContext context,
    String key, {
    required String en,
    required String ar,
  }) {
    try {
      final value = context.tr(key);
      if (value != key && value.trim().isNotEmpty) {
        return _sanitizeText(value);
      }
    } catch (_) {}
    final isRtl = Directionality.of(context) == TextDirection.rtl;
    return _sanitizeText(isRtl ? ar : en);
  }

  String _sanitizeText(String input) {
    if (input.isEmpty) return input;
    var output = input.replaceAll('+_', '');
    output = output.replaceAll('±', '');
    return output.trim();
  }
}
