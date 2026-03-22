import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as status;
import '../models/chat.dart';
import '../config/app_config.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  WebSocketChannel? _channel;
  StreamSubscription? _subscription;
  final StreamController<ChatMessage> _messageController =
      StreamController<ChatMessage>.broadcast();
  final StreamController<String> _typingController =
      StreamController<String>.broadcast();
  final StreamController<String> _stopTypingController =
      StreamController<String>.broadcast();
  final StreamController<bool> _connectionController =
      StreamController<bool>.broadcast();

  String? _currentChatId;
  bool _isConnected = false;
  String? _authToken;
  int _retrySeconds = 1;

  // Streams
  Stream<ChatMessage> get messageStream => _messageController.stream;
  Stream<String> get typingStream => _typingController.stream;
  Stream<String> get stopTypingStream => _stopTypingController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;

  bool get isConnected => _isConnected;

  Future<void> connect(String authToken) async {
    if (_isConnected) {
      // log removed
      return;
    }

    _authToken = authToken;

    try {
      final wsUrl = Uri.parse(AppConfig.wsBaseUrl);
      _channel = WebSocketChannel.connect(wsUrl);

      // Listen to connection
      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
      );

      // Authenticate
      await _authenticate();

      // log removed
      _retrySeconds = 1; // reset backoff on success
    } catch (e) {
      // log removed
      _handleError(e);
    }
  }

  Future<void> _authenticate() async {
    if (_channel == null || _authToken == null) {
      // log removed
      return;
    }

    final authMessage = {'type': 'authenticate', 'token': _authToken};

    // log removed
    _channel!.sink.add(jsonEncode(authMessage));
  }

  void _handleMessage(dynamic data) {
    try {
      final message = jsonDecode(data);
      final type = message['type'];

      switch (type) {
        case 'authenticated':
          _isConnected = true;
          _connectionController.add(true);
          break;

        case 'message':
          // Only process messages for the current chat
          if (message['chatId'] == _currentChatId) {
            final chatMessage = ChatMessage(
              id: message['messageId'],
              content: message['content'],
              senderType: message['senderType'],
              senderId: message['senderId'],
              isMe: message['isMe'] ?? false,
              readAt: message['readAt'] != null
                  ? DateTime.parse(message['readAt'])
                  : null,
              createdAt: DateTime.parse(message['createdAt']),
            );
            // log removed
            _messageController.add(chatMessage);
          } else {
            // log removed
          }
          break;

        case 'user_typing':
          if (message['chatId'] == _currentChatId) {
            _typingController.add(message['userId']);
          }
          break;

        case 'user_stop_typing':
          if (message['chatId'] == _currentChatId) {
            _stopTypingController.add(message['userId']);
          }
          break;

        case 'joined_chat':
          // log removed
          break;

        case 'left_chat':
          // log removed
          break;

        case 'error':
          // log removed
          break;

        default:
        // log removed
      }
    } catch (e) {
      // log removed
    }
  }

  void _handleError(dynamic error) {
    _isConnected = false;
    _connectionController.add(false);
  }

  void _handleDisconnection() {
    _isConnected = false;
    _connectionController.add(false);

    // Try to reconnect with exponential backoff
    final delay = Duration(seconds: _retrySeconds);
    Future.delayed(delay, () {
      if (_authToken != null && !_isConnected) {
        _retrySeconds = (_retrySeconds * 2).clamp(1, 64);
        connect(_authToken!);
      }
    });
  }

  Future<void> joinChat(String chatId) async {
    _currentChatId = chatId;

    if (!_isConnected || _channel == null) {
      // log removed
      // Wait for connection, then join
      _connectionController.stream.firstWhere((v) => v == true).then((_) {
        if (_currentChatId == chatId) {
          _sendJoin(chatId);
        }
      });
      return;
    }

    _sendJoin(chatId);
  }

  void _sendJoin(String chatId) {
    final message = {'type': 'join_chat', 'chatId': chatId};

    _channel!.sink.add(jsonEncode(message));
  }

  Future<void> leaveChat(String chatId) async {
    if (!_isConnected || _channel == null) return;

    final message = {'type': 'leave_chat', 'chatId': chatId};

    _channel!.sink.add(jsonEncode(message));

    if (_currentChatId == chatId) {
      _currentChatId = null;
    }
  }

  Future<void> sendMessage(String chatId, String content) async {
    if (!_isConnected || _channel == null) return;

    final message = {'type': 'message', 'chatId': chatId, 'content': content};

    _channel!.sink.add(jsonEncode(message));
  }

  Future<void> sendTyping(String chatId) async {
    if (!_isConnected || _channel == null) return;

    final message = {'type': 'typing', 'chatId': chatId};

    _channel!.sink.add(jsonEncode(message));
  }

  Future<void> sendStopTyping(String chatId) async {
    if (!_isConnected || _channel == null) return;

    final message = {'type': 'stop_typing', 'chatId': chatId};

    _channel!.sink.add(jsonEncode(message));
  }

  void disconnect() {
    _isConnected = false;
    _currentChatId = null;
    _subscription?.cancel();
    // Use a browser-allowed close code. 1001 (goingAway) causes an error on web.
    try {
      _channel?.sink.close(status.normalClosure); // 1000
    } catch (_) {
      // Ignore if already closed or channel is null
    }
    _channel = null;
    _connectionController.add(false);
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _stopTypingController.close();
    _connectionController.close();
  }
}
