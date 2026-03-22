import 'package:flutter/material.dart';

import '../theme/design_system.dart';

class AppBarLogoTitle extends StatelessWidget {
  const AppBarLogoTitle({super.key});

  @override
  Widget build(BuildContext context) {
    final textDirection = Directionality.of(context);
    final isRtl = textDirection == TextDirection.rtl;

    final textTheme = Theme.of(context).textTheme;
    final primaryTitleStyle = (textTheme.titleMedium ?? const TextStyle())
        .copyWith(
          fontWeight: FontWeight.w700,
          height: 0.9,
          color: DSColors.charcoal,
          fontSize: (textTheme.titleMedium?.fontSize ?? 16) * 0.75,
        );
    final secondaryTitleStyle = (textTheme.bodyMedium ?? const TextStyle())
        .copyWith(
          fontWeight: FontWeight.w400,
          height: 0.9,
          color: DSColors.charcoal,
          fontSize: (textTheme.bodyMedium?.fontSize ?? 14) * 0.75,
        );

    final toolbarHeight = kToolbarHeight;
    final maxLogo = toolbarHeight - 16;
    final logoSize = maxLogo.clamp(28.0, 40.0);

    final logo = Padding(
      padding: const EdgeInsetsDirectional.only(start: 0, end: 1),
      child: Image(
        image: const AssetImage('assets/locales/images/schollify-purple.png'),
        height: logoSize,
        width: logoSize,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stack) {
          return Container(
            width: logoSize,
            height: logoSize,
            decoration: BoxDecoration(
              color: DSColors.primary.withValues(alpha: 0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.school, color: DSColors.primary, size: 24),
          );
        },
      ),
    );

    final textBlock = Column(
      crossAxisAlignment: isRtl
          ? CrossAxisAlignment.end
          : CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('Schoolify', style: primaryTitleStyle),
        const SizedBox(height: 2),
        Text('سكولي فاي', style: secondaryTitleStyle),
      ],
    );

    return Row(
      mainAxisAlignment: MainAxisAlignment.start,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        logo,
        const SizedBox(width: 4),
        Flexible(
          child: Transform.translate(
            offset: Offset(isRtl ? 4 : -4, 0),
            child: textBlock,
          ),
        ),
      ],
    );
  }
}
