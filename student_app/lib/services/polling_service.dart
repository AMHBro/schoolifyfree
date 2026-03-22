import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/chat.dart';

class PollingService {
  static const Duration _pollingInterval = Duration(seconds: 2);
  Timer? _timer;
  String? _token;
  String? _currentChatId;
  DateTime? _lastMessageTime;
  Function(List<ChatMessage>)? _onNewMessages;

  bool get isPolling => _timer?.isActive ?? false;

  void startPolling({
    required String token,
    required String chatId,
    required Function(List<ChatMessage>) onNewMessages,
  }) {
    // log removed

    _token = token;
    _currentChatId = chatId;
    _onNewMessages = onNewMessages;
    _lastMessageTime = DateTime.now().subtract(Duration(minutes: 1));

    stopPolling();
    _timer = Timer.periodic(_pollingInterval, (_) => _pollForMessages());
    _pollForMessages();
  }

  void stopPolling() {
    // log removed
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _pollForMessages() async {
    if (_token == null || _currentChatId == null || _onNewMessages == null) {
      return;
    }

    try {
      final response = await http
          .get(
            Uri.parse(
              '${AppConfig.baseUrl}/api/mobile/student/chats/$_currentChatId/messages',
            ),
            headers: {
              'Authorization': 'Bearer $_token',
              'Content-Type': 'application/json',
            },
          )
          .timeout(Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success']) {
          final messages = (data['data'] as List)
              .map((json) => ChatMessage.fromJson(json))
              .toList();

          final newMessages = messages.where((message) {
            return _lastMessageTime == null ||
                message.createdAt.isAfter(_lastMessageTime!);
          }).toList();

          if (newMessages.isNotEmpty) {
            _lastMessageTime = newMessages.last.createdAt;
            _onNewMessages!(newMessages);
          }
        }
      }
    } catch (e) {}
  }

  void updateLastMessageTime(DateTime time) {
    _lastMessageTime = time;
  }

  void dispose() {
    stopPolling();
  }
}
