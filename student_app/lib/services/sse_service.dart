import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/app_config.dart';
import '../models/chat.dart';

class SSEService {
  http.Client? _client;
  StreamController<ChatMessage>? _messageController;
  StreamController<bool>? _connectionController;
  String? _currentChatId;
  bool _isConnected = false;

  Stream<ChatMessage> get messageStream =>
      _messageController?.stream ?? const Stream.empty();
  Stream<bool> get connectionStream =>
      _connectionController?.stream ?? const Stream.empty();
  bool get isConnected => _isConnected;

  void connect({required String token, required String chatId}) {
    // log removed

    // Disconnect any existing connection
    disconnect();

    _currentChatId = chatId;
    _client = http.Client();
    _messageController = StreamController<ChatMessage>.broadcast();
    _connectionController = StreamController<bool>.broadcast();

    _startSSEConnection(token, chatId);
  }

  void _startSSEConnection(String token, String chatId) async {
    try {
      final uri = Uri.parse(
        '${AppConfig.baseUrl}/api/mobile/student/chats/$chatId/sse',
      );
      final request = http.Request('GET', uri);
      request.headers.addAll({
        'Authorization': 'Bearer $token',
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
      });

      // log removed
      final response = await _client!.send(request);

      if (response.statusCode == 200) {
        // log removed
        _isConnected = true;
        _connectionController?.add(true);

        // Listen to the SSE stream
        response.stream
            .transform(utf8.decoder)
            .transform(const LineSplitter())
            .listen(
              (line) {
                _handleSSEMessage(line);
              },
              onError: (error) {
                _handleConnectionError();
              },
              onDone: () {
                // log removed
                _handleConnectionError();
              },
            );
      } else {
        _handleConnectionError();
      }
    } catch (e) {
      _handleConnectionError();
    }
  }

  void _handleSSEMessage(String line) {
    if (line.startsWith('data: ')) {
      try {
        final jsonData = line.substring(6); // Remove 'data: ' prefix
        final data = json.decode(jsonData);

        if (data['type'] == 'connected') {
          // log removed
        } else if (data['type'] == 'message') {
          final message = ChatMessage(
            id: data['id'],
            content: data['content'],
            senderType: data['senderType'],
            senderId: data['senderId'],
            isMe: data['isMe'] ?? false,
            readAt: data['readAt'] != null
                ? DateTime.parse(data['readAt'])
                : null,
            createdAt: DateTime.parse(data['createdAt']),
          );

          _messageController?.add(message);
        }
      } catch (e) {}
    }
  }

  void _handleConnectionError() {
    _isConnected = false;
    _connectionController?.add(false);

    // Auto-reconnect after 5 seconds
    Timer(const Duration(seconds: 5), () {
      if (_currentChatId != null && _client != null) {
        // reconnection attempt
      }
    });
  }

  void disconnect() {
    // log removed
    _isConnected = false;
    _client?.close();
    _client = null;
    _messageController?.close();
    _connectionController?.close();
    _messageController = null;
    _connectionController = null;
    _currentChatId = null;
  }

  void dispose() {
    disconnect();
  }
}
