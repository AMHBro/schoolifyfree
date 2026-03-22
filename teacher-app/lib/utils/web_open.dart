// Only compiled on web. Opens URL synchronously to avoid popup blockers.
// ignore_for_file: avoid_web_libraries_in_flutter
import 'dart:html' as html;

Future<bool> webOpenUrl(Uri uri) async {
  try {
    final isHttp = uri.scheme == 'http' || uri.scheme == 'https';
    final target = isHttp ? '_blank' : '_self';
    html.window.open(uri.toString(), target);
    return true;
  } catch (_) {
    return false;
  }
}
