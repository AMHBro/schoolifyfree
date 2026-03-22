import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:ui' as ui;
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';
import '../services/polling_service.dart';
import '../models/chat.dart';
import '../theme/design_system.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import '../widgets/app_bar_logo_title.dart';
import 'settings_screen.dart';
import '../widgets/rounded_icon_action.dart';
import 'login_screen.dart';
import 'package:intl/intl.dart';

class ChatsScreen extends StatefulWidget {
  const ChatsScreen({super.key});

  @override
  State<ChatsScreen> createState() => _ChatsScreenState();
}

class _ChatsScreenState extends State<ChatsScreen> {
  List<Chat> _chats = [];
  bool _isLoading = true;
  String? _error;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadChats();
  }

  String _offlineMessageIfNetwork(Object e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('socketexception') ||
        msg.contains('failed host lookup') ||
        msg.contains('clientexception') ||
        msg.contains('network')) {
      return context.tr('common.offline_message');
    }
    return context.tr('common.offline_message');
  }

  String _sanitizeText(Object? raw) {
    final text = (raw ?? '').toString();
    final noUrls = text
        .replaceAll(RegExp(r'https?:\\/\\/[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'https?:\/\/[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'https?://[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    return noUrls.isEmpty ? context.tr('common.offline_message') : noUrls;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadChats() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;

      if (token == null) {
        setState(() {
          _error = context.tr('chats.auth_required');
          _isLoading = false;
        });
        return;
      }

      final response = await ApiService.getChats(token);

      if (!mounted) return;

      if (response['success']) {
        final chatsData = response['data'] as List;
        setState(() {
          _chats = chatsData.map((chat) => Chat.fromJson(chat)).toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          final msg = (response['message'] ?? '').toString().toLowerCase();
          final offline =
              response['code'] == 'NETWORK_OFFLINE' ||
              msg.contains('network') ||
              msg.contains('socketexception') ||
              msg.contains('failed host lookup');
          _error = offline
              ? context.tr('common.offline_message')
              : _sanitizeText(response['message']);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = context.tr('common.offline_message');
        _isLoading = false;
      });
    }
  }

  void _openChat(String chatId, String studentName) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            ChatDetailScreen(chatId: chatId, studentName: studentName),
      ),
    ).then((_) => _loadChats()); // Refresh chats when returning
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Scaffold(
          backgroundColor: DSColors.lightGray,
          appBar: AppBar(
            title: const AppBarLogoTitle(),
            automaticallyImplyLeading: true,
            titleSpacing: 8,
            actions: [
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 8),
                child: RoundedIconAction(
                  tooltip: context.tr('settings.title'),
                  icon: const Icon(LineAwesomeIcons.user_solid, size: 22),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SettingsScreen()),
                    );
                  },
                ),
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: _loadChats,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                // Search Bar
                Container(
                  margin: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: DSColors.white,
                    borderRadius: BorderRadius.circular(DSRadii.xl),
                    boxShadow: const [DSShadows.card],
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) {
                      setState(() {
                        _searchQuery = value.toLowerCase();
                      });
                    },
                    decoration: InputDecoration(
                      hintText: context.tr('chats.search_placeholder'),
                      hintStyle: DSTypography.body.copyWith(
                        color: DSColors.darkGray,
                      ),
                      prefixIcon:
                          Directionality.of(context) == ui.TextDirection.rtl
                          ? null
                          : const Icon(
                              LineAwesomeIcons.search_solid,
                              color: DSColors.darkGray,
                            ),
                      suffixIcon:
                          Directionality.of(context) == ui.TextDirection.rtl
                          ? const Icon(
                              LineAwesomeIcons.search_solid,
                              color: DSColors.darkGray,
                            )
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                // Chats List
                Container(
                  decoration: const BoxDecoration(
                    color: DSColors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(DSRadii.xl + 10),
                      topRight: Radius.circular(DSRadii.xl + 10),
                    ),
                  ),
                  height: MediaQuery.of(context).size.height - 220,
                  child: _buildChatsList(),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildChatsList() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.loading'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: DSColors.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(DSRadii.xl),
              ),
              child: Icon(Icons.error_outline, size: 64, color: DSColors.error),
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Consumer<AuthProvider>(
              builder: (context, auth, _) {
                final isGuest = auth.token == null;
                return ElevatedButton.icon(
                  onPressed: () {
                    if (isGuest) {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(builder: (_) => const LoginScreen()),
                      );
                    } else {
                      _loadChats();
                    }
                  },
                  icon: Icon(isGuest ? Icons.login : Icons.refresh),
                  label: Text(
                    isGuest
                        ? context.tr('common.login', fallback: 'Login')
                        : context.tr('chats.retry'),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: DSColors.primary,
                    foregroundColor: DSColors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(DSRadii.medium),
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      );
    }

    final filteredChats = _chats.where((chat) {
      return chat.studentName.toLowerCase().contains(_searchQuery) ||
          (chat.lastMessage?.toLowerCase().contains(_searchQuery) ?? false);
    }).toList();

    if (filteredChats.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: DSColors.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(DSRadii.xl),
              ),
              child: Icon(
                Icons.chat_bubble_outline,
                size: 64,
                color: DSColors.primary.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.empty_title'),
              style: DSTypography.h3.copyWith(color: DSColors.darkGray),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('chats.empty_subtitle'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: filteredChats.length,
      itemBuilder: (context, index) {
        final chat = filteredChats[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _openChat(chat.id, chat.studentName),
              borderRadius: BorderRadius.circular(DSRadii.large),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: DSColors.white,
                  borderRadius: BorderRadius.circular(DSRadii.large),
                  boxShadow: const [DSShadows.card],
                ),
                child: Row(
                  children: [
                    // Avatar
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: DSColors.primary.withOpacity(0.12),
                      child: Text(
                        chat.studentName.isNotEmpty
                            ? chat.studentName[0].toUpperCase()
                            : 'S',
                        style: DSTypography.h3.copyWith(
                          color: DSColors.primary,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Chat content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  chat.studentName,
                                  style: DSTypography.h3.copyWith(
                                    color: DSColors.charcoal,
                                  ),
                                ),
                              ),
                              if (chat.lastMessageAt != null)
                                Text(
                                  _formatMessageTime(chat.lastMessageAt!),
                                  style: DSTypography.caption.copyWith(
                                    color: DSColors.darkGray,
                                  ),
                                ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  chat.lastMessage ??
                                      context.tr('chats.no_messages'),
                                  style: DSTypography.body.copyWith(
                                    color: DSColors.darkGray,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              const Icon(
                                Icons.arrow_forward_ios,
                                size: 14,
                                color: DSColors.mediumGray,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  String _formatMessageTime(DateTime dateTime) {
    // Convert to Iraq time (UTC+3) regardless of device timezone
    final DateTime iraqNow = DateTime.now().toUtc().add(
      const Duration(hours: 3),
    );
    final DateTime iraqTime = (dateTime.isUtc
        ? dateTime.add(const Duration(hours: 3))
        : dateTime.toUtc().add(const Duration(hours: 3)));

    final String localeCode = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    ).locale.languageCode;

    if (iraqNow.difference(iraqTime).inDays > 0) {
      return DateFormat('d/M h:mm a', localeCode).format(iraqTime);
    }
    return DateFormat('h:mm a', localeCode).format(iraqTime);
  }
}

// Chat Detail Screen
class ChatDetailScreen extends StatefulWidget {
  final String chatId;
  final String studentName;

  const ChatDetailScreen({
    super.key,
    required this.chatId,
    required this.studentName,
  });

  @override
  State<ChatDetailScreen> createState() => _ChatDetailScreenState();
}

class _ChatDetailScreenState extends State<ChatDetailScreen>
    with TickerProviderStateMixin {
  List<ChatMessage> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  String? _error;
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  WebSocketService? _webSocketService;
  StreamSubscription<ChatMessage>? _messageSubscription;
  StreamSubscription<bool>? _connectionSubscription;
  Timer? _typingTimer;
  bool _isTyping = false;
  Set<String> _typingUsers = {};
  final PollingService _pollingService = PollingService();
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;

  String _offlineMessageIfNetwork(Object e) {
    final msg = e.toString().toLowerCase();
    if (msg.contains('socketexception') ||
        msg.contains('failed host lookup') ||
        msg.contains('clientexception') ||
        msg.contains('network')) {
      return context.tr('common.offline_message');
    }
    return context.tr('common.offline_message');
  }

  String _sanitizeText(Object? raw) {
    final text = (raw ?? '').toString();
    final noUrls = text
        .replaceAll(RegExp(r'https?:\\/\\/[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'https?:\/\/[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'https?://[^\s]+', caseSensitive: false), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
    return noUrls.isEmpty ? context.tr('common.offline_message') : noUrls;
  }

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _initializeWebSocket();
    _loadMessages();
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _messageSubscription?.cancel();
    _connectionSubscription?.cancel();
    _typingTimer?.cancel();
    _webSocketService?.leaveChat(widget.chatId);
    _pollingService.dispose();
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _initializeWebSocket() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    _webSocketService = authProvider.webSocketService;

    if (_webSocketService != null) {
      // Wait a bit for WebSocket to be fully connected
      await Future.delayed(const Duration(milliseconds: 500));

      // Join this chat room
      await _webSocketService!.joinChat(widget.chatId);

      // Listen for real-time messages
      _messageSubscription = _webSocketService!.messageStream.listen((message) {
        if (mounted) {
          setState(() {
            // Check if message already exists to avoid duplicates
            final existingIndex = _messages.indexWhere(
              (m) => m.id == message.id,
            );
            if (existingIndex == -1) {
              // Add new message and sort by creation time
              _messages.add(message);
              _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
            } else {}
          });
          _scrollToBottom();
        }
      });

      // Listen for typing indicators
      _webSocketService!.typingStream.listen((userId) {
        if (mounted) {
          setState(() {
            _typingUsers.add(userId);
          });
        }
      });

      _webSocketService!.stopTypingStream.listen((userId) {
        if (mounted) {
          setState(() {
            _typingUsers.remove(userId);
          });
        }
      });

      // No UI reconnection notifications to keep the screen clean
      _connectionSubscription = _webSocketService!.connectionStream.listen((
        isConnected,
      ) {
        // Intentionally no SnackBar; logic could be added for silent retries
      });
    } else {
      // Fallback to polling if WebSocket is not available
      _startPollingFallback();
    }
  }

  void _startPollingFallback() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final token = authProvider.token;

    if (token != null) {
      _pollingService.startPolling(
        token: token,
        chatId: widget.chatId,
        onNewMessages: (newMessages) {
          if (mounted && newMessages.isNotEmpty) {
            setState(() {
              for (final message in newMessages) {
                // Check if message already exists to avoid duplicates
                final existingIndex = _messages.indexWhere(
                  (m) => m.id == message.id,
                );
                if (existingIndex == -1) {
                  _messages.add(message);
                }
              }
              // Sort messages by creation time
              _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
            });
            _scrollToBottom();
          }
        },
      );
    }
  }

  Future<void> _loadMessages() async {
    if (!mounted) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;

      if (token == null) {
        setState(() {
          _error = context.tr('chats.auth_required');
          _isLoading = false;
        });
        return;
      }

      final response = await ApiService.getChatMessages(token, widget.chatId);

      if (!mounted) return;

      if (response['success']) {
        final messagesData = response['data'] as List;
        setState(() {
          _messages = messagesData
              .map((message) => ChatMessage.fromJson(message))
              .toList();
          _isLoading = false;
        });
        _animationController.forward();
        _scrollToBottom();
      } else {
        setState(() {
          final msg = (response['message'] ?? '').toString().toLowerCase();
          final offline =
              response['code'] == 'NETWORK_OFFLINE' ||
              msg.contains('network') ||
              msg.contains('socketexception') ||
              msg.contains('failed host lookup');
          _error = offline
              ? context.tr('common.offline_message')
              : _sanitizeText(response['message']);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = _offlineMessageIfNetwork(e);
        _isLoading = false;
      });
    }
  }

  Future<void> _sendMessage() async {
    final content = _messageController.text.trim();
    if (content.isEmpty || _isSending) return;

    setState(() {
      _isSending = true;
    });

    try {
      // Always send via HTTP API first for reliability
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;

      if (token == null) {
        setState(() {
          _isSending = false;
        });
        return;
      }

      final response = await ApiService.sendMessage(
        token,
        widget.chatId,
        content,
      );

      if (!mounted) return;

      if (response['success']) {
        _messageController.clear();
        _stopTyping();

        // Immediately add the message to UI for instant feedback
        final newMessage = ChatMessage(
          id: response['data']['id'],
          content: content,
          senderType: 'TEACHER',
          senderId: authProvider.teacher?.id ?? '',
          isMe: true,
          readAt: null,
          createdAt: DateTime.now(),
        );

        setState(() {
          // Check if message already exists to avoid duplicates
          final existingIndex = _messages.indexWhere(
            (m) => m.id == newMessage.id,
          );
          if (existingIndex == -1) {
            _messages.add(newMessage);
            _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
          }
        });
        _scrollToBottom();

        // Also send via WebSocket for real-time delivery to other users
        if (_webSocketService?.isConnected == true) {
          await _webSocketService!.sendMessage(widget.chatId, content);
        }
      } else {
        if (context.mounted) {
          final offline =
              response['code'] == 'NETWORK_OFFLINE' ||
              (response['message'] ?? '').toString().toUpperCase().contains(
                'NETWORK_OFFLINE',
              );
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                offline
                    ? context.tr('common.offline_message')
                    : (response['message'] ?? 'Failed to send message'),
              ),
              backgroundColor: Colors.red.shade600,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_offlineMessageIfNetwork(e)),
            backgroundColor: Colors.red.shade600,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  void _onTyping() {
    if (!_isTyping && _webSocketService?.isConnected == true) {
      _isTyping = true;
      _webSocketService!.sendTyping(widget.chatId);
    }

    // Reset typing timer
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), _stopTyping);
  }

  void _stopTyping() {
    if (_isTyping && _webSocketService?.isConnected == true) {
      _isTyping = false;
      _webSocketService!.sendStopTyping(widget.chatId);
    }
    _typingTimer?.cancel();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<LocalizationProvider>(
      builder: (context, localizationProvider, child) {
        return Scaffold(
          backgroundColor: DSColors.lightGray,
          appBar: AppBar(
            title: Text(widget.studentName),
            automaticallyImplyLeading: true,
            titleSpacing: 8,
            actions: [
              Padding(
                padding: const EdgeInsetsDirectional.only(end: 8),
                child: RoundedIconAction(
                  tooltip: context.tr('settings.title'),
                  icon: const Icon(LineAwesomeIcons.user_solid, size: 22),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const SettingsScreen()),
                    );
                  },
                ),
              ),
            ],
          ),
          body: Column(
            children: [
              // Messages Area
              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: DSColors.white,
                    borderRadius: BorderRadius.only(
                      topLeft: Radius.circular(DSRadii.xl + 10),
                      topRight: Radius.circular(DSRadii.xl + 10),
                    ),
                  ),
                  child: FadeTransition(
                    opacity: _fadeAnimation,
                    child: _buildMessagesList(),
                  ),
                ),
              ),

              // Message Input
              Container(color: DSColors.white, child: _buildMessageInput()),
            ],
          ),
        );
      },
    );
  }

  Widget _buildMessagesList() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.detail.loading_messages'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: DSColors.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(DSRadii.xl),
              ),
              child: Icon(Icons.error_outline, size: 64, color: DSColors.error),
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadMessages,
              icon: const Icon(Icons.refresh),
              label: Text(context.tr('chats.retry')),
              style: ElevatedButton.styleFrom(
                backgroundColor: DSColors.primary,
                foregroundColor: DSColors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(DSRadii.medium),
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: DSColors.primary.withOpacity(0.06),
                borderRadius: BorderRadius.circular(DSRadii.xl),
              ),
              child: Icon(
                Icons.chat_bubble_outline,
                size: 64,
                color: DSColors.primary.withOpacity(0.5),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.detail.empty_title'),
              style: DSTypography.h3.copyWith(color: DSColors.darkGray),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('chats.detail.empty_subtitle'),
              style: DSTypography.body.copyWith(color: DSColors.darkGray),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(20),
      itemCount: _messages.length,
      itemBuilder: (context, index) {
        final message = _messages[index];
        return _buildMessageBubble(message, index);
      },
    );
  }

  Widget _buildMessageBubble(ChatMessage message, int index) {
    final isMe = message.isMe;
    final isFirstInGroup = index == 0 || _messages[index - 1].isMe != isMe;
    final isLastInGroup =
        index == _messages.length - 1 || _messages[index + 1].isMe != isMe;

    return Container(
      margin: EdgeInsets.only(
        bottom: isLastInGroup ? 16 : 4,
        top: isFirstInGroup ? 8 : 0,
      ),
      child: Row(
        mainAxisAlignment: isMe
            ? MainAxisAlignment.end
            : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe && isLastInGroup) ...[
            CircleAvatar(
              radius: 16,
              backgroundColor: DSColors.lightGray,
              child: Text(
                widget.studentName.isNotEmpty
                    ? widget.studentName[0].toUpperCase()
                    : 'S',
                style: DSTypography.caption.copyWith(color: DSColors.darkGray),
              ),
            ),
            const SizedBox(width: 8),
          ] else if (!isMe) ...[
            const SizedBox(width: 40),
          ],

          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isMe ? DSColors.primary : DSColors.lightGray,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(
                    isMe || !isFirstInGroup ? DSRadii.large : DSRadii.small,
                  ),
                  topRight: Radius.circular(
                    !isMe || !isFirstInGroup ? DSRadii.large : DSRadii.small,
                  ),
                  bottomLeft: Radius.circular(
                    isMe || !isLastInGroup ? DSRadii.large : DSRadii.small,
                  ),
                  bottomRight: Radius.circular(
                    !isMe || !isLastInGroup ? DSRadii.large : DSRadii.small,
                  ),
                ),
                boxShadow: const [DSShadows.micro],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    message.content,
                    style: DSTypography.body.copyWith(
                      color: isMe ? DSColors.white : DSColors.charcoal,
                    ),
                  ),
                  if (isLastInGroup) ...[
                    const SizedBox(height: 4),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _formatMessageTime(message.createdAt),
                          style: DSTypography.caption.copyWith(
                            color: isMe
                                ? DSColors.white.withOpacity(0.8)
                                : DSColors.darkGray,
                          ),
                        ),
                        if (isMe) ...[
                          const SizedBox(width: 4),
                          Icon(
                            Icons.done_all,
                            size: 14,
                            color: DSColors.white.withOpacity(0.8),
                          ),
                        ],
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),

          if (isMe && isLastInGroup) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: DSColors.primary.withOpacity(0.12),
              child: const Icon(
                Icons.person,
                size: 16,
                color: DSColors.primary,
              ),
            ),
          ] else if (isMe) ...[
            const SizedBox(width: 40),
          ],
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DSColors.white,
        boxShadow: const [DSShadows.card],
      ),
      child: Column(
        children: [
          // Typing indicator
          if (_typingUsers.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              margin: const EdgeInsets.only(bottom: 8),
              decoration: BoxDecoration(
                color: DSColors.lightGray,
                borderRadius: BorderRadius.circular(DSRadii.xl),
              ),
              child: Row(
                children: [
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        DSColors.darkGray,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    context.tr(
                      'chats.detail.typing_indicator',
                      params: {'name': widget.studentName},
                    ),
                    style: DSTypography.caption.copyWith(
                      color: DSColors.darkGray,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          Row(
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    color: DSColors.lightGray,
                    borderRadius: BorderRadius.circular(DSRadii.xl),
                    border: Border.all(color: DSColors.mediumGray),
                  ),
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: context.tr('chats.detail.type_placeholder'),
                      hintStyle: DSTypography.body.copyWith(
                        color: DSColors.darkGray,
                      ),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 12,
                      ),
                    ),
                    maxLines: null,
                    textCapitalization: TextCapitalization.sentences,
                    onChanged: (_) => _onTyping(),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                decoration: const BoxDecoration(
                  color: DSColors.primary,
                  shape: BoxShape.circle,
                  boxShadow: [DSShadows.micro],
                ),
                child: IconButton(
                  onPressed: _isSending ? null : _sendMessage,
                  icon: _isSending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              DSColors.white,
                            ),
                          ),
                        )
                      : const Icon(Icons.send, color: DSColors.white, size: 20),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatMessageTime(DateTime dateTime) {
    // Convert to Iraq time (UTC+3) regardless of device timezone
    final DateTime iraqNow = DateTime.now().toUtc().add(
      const Duration(hours: 3),
    );
    final DateTime iraqTime = (dateTime.isUtc
        ? dateTime.add(const Duration(hours: 3))
        : dateTime.toUtc().add(const Duration(hours: 3)));

    final String localeCode = Provider.of<LocalizationProvider>(
      context,
      listen: false,
    ).locale.languageCode;

    if (iraqNow.difference(iraqTime).inDays > 0) {
      return DateFormat('d/M h:mm a', localeCode).format(iraqTime);
    }
    return DateFormat('h:mm a', localeCode).format(iraqTime);
  }
}
