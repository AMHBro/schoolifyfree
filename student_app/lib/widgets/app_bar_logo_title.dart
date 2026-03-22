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

    final logoHeightUnclamped = kToolbarHeight * 0.1;
    final logoHeight = logoHeightUnclamped < 50.0
        ? 50.0
        : (logoHeightUnclamped > 50.0 ? 50.0 : logoHeightUnclamped);

    final logo = Padding(
      padding: const EdgeInsetsDirectional.only(start: 0, end: 1),
      child: Image.asset(
        'assets/images/schollify-purple.png',
        height: logoHeight,
        fit: BoxFit.contain,
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

    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        logo,
        Transform.translate(
          offset: Offset(isRtl ? 6 : -6, 0),
          child: textBlock,
        ),
      ],
    );

    return content;
  }
}
