import 'package:flutter/material.dart';

import '../theme/design_system.dart';

class RoundedIconAction extends StatelessWidget {
  final Widget icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final Color? backgroundColor;
  final EdgeInsetsGeometry? padding;

  const RoundedIconAction({
    super.key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.backgroundColor,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    final Color bg =
        backgroundColor ?? DSColors.primary.withValues(alpha: 0.10);
    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [DSShadows.micro],
      ),
      child: IconButton(
        icon: icon,
        padding: padding ?? EdgeInsets.zero,
        visualDensity: VisualDensity.compact,
        constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
        splashRadius: 20,
        tooltip: tooltip,
        onPressed: onPressed,
      ),
    );
  }
}
