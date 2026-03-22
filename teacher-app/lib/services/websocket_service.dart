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
  final StreamController<ChatMessage> _messageController = StreamController<ChatMessage>.broadcast();
  final StreamController<String> _typingController = StreamController<String>.broadcast();
  final StreamController<String> _stopTypingController = StreamController<String>.broadcast();
  final StreamController<bool> _connectionController = StreamController<bool>.broadcast();

  String? _currentChatId;
  bool _isConnected = false;
  String? _authToken;

  // Streams
  Stream<ChatMessage> get messageStream => _messageController.stream;
  Stream<String> get typingStream => _typingController.stream;
  Stream<String> get stopTypingStream => _stopTypingController.stream;
  Stream<bool> get connectionStream => _connectionController.stream;

  bool get isConnected => _isConnected;

  Future<void> connect(String authToken) async {
    if (_isConnected) {
    
      return;
    }

    _authToken = authToken;
   
    
    try {
      final wsUrl = Uri.parse('${AppConfig.wsBaseUrl}');
      _channel = WebSocketChannel.connect(wsUrl);
      
      // Listen to connection
      _subscription = _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
      );

      // Authenticate
      await _authenticate();
      
     
    } catch (e) {
      
      _handleError(e);
    }
  }

  Future<void> _authenticate() async {
    if (_channel == null || _authToken == null) return;

    final authMessage = {
      'type': 'authenticate',
      'token': _authToken,
    };

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
              readAt: message['readAt'] != null ? DateTime.parse(message['readAt']) : null,
              createdAt: DateTime.parse(message['createdAt']),
            );
           
            _messageController.add(chatMessage);
          } else {
         
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
         
          break;

        case 'left_chat':
         
          break;

        case 'error':
         
          break;

        default:
          
      }
    } catch (e) {
     
    }
  }

  void _handleError(dynamic error) {
  
    _isConnected = false;
    _connectionController.add(false);
  }

  void _handleDisconnection() {
   
    _isConnected = false;
    _connectionController.add(false);
    
    // Try to reconnect after a delay
    Future.delayed(const Duration(seconds: 5), () {
      if (_authToken != null && !_isConnected) {
        connect(_authToken!);
      }
    });
  }

  Future<void> joinChat(String chatId) async {
    if (!_isConnected || _channel == null) {
     
      return;
    }

    _currentChatId = chatId;
   
    
    final message = {
      'type': 'join_chat',
      'chatId': chatId,
    };

    _channel!.sink.add(jsonEncode(message));
  }

  Future<void> leaveChat(String chatId) async {
    if (!_isConnected || _channel == null) return;

    final message = {
      'type': 'leave_chat',
      'chatId': chatId,
    };

    _channel!.sink.add(jsonEncode(message));
    
    if (_currentChatId == chatId) {
      _currentChatId = null;
    }
  }

  Future<void> sendMessage(String chatId, String content) async {
    if (!_isConnected || _channel == null) return;

    final message = {
      'type': 'message',
      'chatId': chatId,
      'content': content,
    };

    _channel!.sink.add(jsonEncode(message));
  }

  Future<void> sendTyping(String chatId) async {
    if (!_isConnected || _channel == null) return;

    final message = {
      'type': 'typing',
      'chatId': chatId,
    };

    _channel!.sink.add(jsonEncode(message));
  }

  Future<void> sendStopTyping(String chatId) async {
    if (!_isConnected || _channel == null) return;

    final message = {
      'type': 'stop_typing',
      'chatId': chatId,
    };

    _channel!.sink.add(jsonEncode(message));
  }

  void disconnect() {
    _isConnected = false;
    _currentChatId = null;
    _subscription?.cancel();
    _channel?.sink.close(status.goingAway);
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