import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class LinkifiedText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextStyle? linkStyle;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;

  const LinkifiedText({
    super.key,
    required this.text,
    this.style,
    this.linkStyle,
    this.textAlign,
    this.maxLines,
    this.overflow,
  });

  static final RegExp _linkRegex = RegExp(
    r'(https?:\/\/[^\s<>()\[\]]+|www\.[^\s<>()\[\]]+)',
    caseSensitive: false,
  );

  Future<void> _openUrl(String raw) async {
    String url = raw.trim();
    if (!url.toLowerCase().startsWith('http')) {
      url = 'https://$url';
    }
    final uri = Uri.parse(url);
    await launchUrl(uri, mode: LaunchMode.externalApplication);
  }

  @override
  Widget build(BuildContext context) {
    final spans = <InlineSpan>[];
    int start = 0;
    for (final match in _linkRegex.allMatches(text)) {
      if (match.start > start) {
        spans.add(TextSpan(text: text.substring(start, match.start)));
      }
      final linkText = match.group(0)!;
      spans.add(
        TextSpan(
          text: linkText,
          style:
              linkStyle ??
              const TextStyle(
                color: Colors.blue,
                decoration: TextDecoration.underline,
                fontWeight: FontWeight.w600,
              ),
          recognizer: TapGestureRecognizer()
            ..onTap = () {
              _openUrl(linkText);
            },
        ),
      );
      start = match.end;
    }
    if (start < text.length) {
      spans.add(TextSpan(text: text.substring(start)));
    }

    return Text.rich(
      TextSpan(children: spans, style: style),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow ?? TextOverflow.visible,
    );
  }
}
