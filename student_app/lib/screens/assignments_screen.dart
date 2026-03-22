import 'package:flutter/material.dart';
import 'package:line_awesome_flutter/line_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:math' as math;
import '../providers/auth_provider.dart';
import '../providers/localization_provider.dart';
import '../services/api_service.dart';
import '../services/websocket_service.dart';
import '../services/polling_service.dart';
import '../models/chat.dart';
import '../theme/design_system.dart';
import '../widgets/schoolify_app_bar.dart';
// import removed: using inline app bar content for chat detail

class ChatsScreen extends StatefulWidget {
  const ChatsScreen({super.key});

  @override
  State<ChatsScreen> createState() => _ChatsScreenState();
}

class _ChatsScreenState extends State<ChatsScreen> {
  List<Chat> _chats = [];
  List<Teacher> _teachers = [];
  bool _isLoading = true;
  bool _isLoadingTeachers = false;
  String? _error;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _startChatSearchQuery = '';

  @override
  void initState() {
    super.initState();
    _loadChats();
    // Preload teachers list lazily (no-op if already loaded later)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted && _teachers.isEmpty) {
        _loadTeachers();
      }
    });
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
          _error = context.tr('chats.authentication_required');
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
          _error = response['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (response['message'] ?? context.tr('chats.failed_to_load'));
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = '${context.tr('chats.error_loading')}: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadTeachers() async {
    if (!mounted) return;

    setState(() {
      _isLoadingTeachers = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;

      if (token == null) {
        setState(() {
          _isLoadingTeachers = false;
        });
        return;
      }

      final response = await ApiService.getTeachers(token);

      if (!mounted) return;

      if (response['success']) {
        final teachersData = response['data'] as List;
        setState(() {
          _teachers = teachersData
              .map((teacher) => Teacher.fromJson(teacher))
              .toList();
          _isLoadingTeachers = false;
        });
      } else {
        setState(() {
          _isLoadingTeachers = false;
        });
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                response['code'] == 'NETWORK_OFFLINE'
                    ? context.tr('common.offline_message')
                    : (response['message'] ??
                          context.tr('chats.failed_to_load')),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoadingTeachers = false;
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('chats.failed_to_load'))),
        );
      }
    }
  }

  Future<void> _startChat(String teacherId) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.token;

      if (token == null) return;

      final response = await ApiService.startChat(token, teacherId);

      if (response['success']) {
        Navigator.of(context).pop(); // Close the teacher selection dialog
        _loadChats(); // Refresh chats list

        final chatId = response['data']['chatId'];
        if (context.mounted) {
          _openChat(
            chatId,
            _teachers.firstWhere((t) => t.id == teacherId).name,
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                response['code'] == 'NETWORK_OFFLINE'
                    ? context.tr('common.offline_message')
                    : (response['message'] ??
                          context.tr('chats.failed_to_start_chat')),
              ),
            ),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(context.tr('chats.failed_to_start_chat'))),
        );
      }
    }
  }

  void _openChat(String chatId, String teacherName) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            ChatDetailScreen(chatId: chatId, teacherName: teacherName),
      ),
    ).then((_) => _loadChats()); // Refresh chats when returning
  }

  void _showTeacherSelectionDialog() {
    final textDirection = Directionality.of(context);
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      isDismissible: true,
      enableDrag: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Directionality(
          textDirection: textDirection,
          child: StatefulBuilder(
            builder: (context, setSheetState) {
              List<Teacher> localTeachers = List<Teacher>.from(_teachers);
              bool localLoading = _isLoadingTeachers;

              Future<void> ensureTeachersLoaded() async {
                if (_teachers.isNotEmpty) {
                  localTeachers = List<Teacher>.from(_teachers);
                  return;
                }
                if (localLoading) return;
                setSheetState(() => localLoading = true);
                try {
                  final authProvider = Provider.of<AuthProvider>(
                    context,
                    listen: false,
                  );
                  final token = authProvider.token;
                  if (token != null) {
                    final response = await ApiService.getTeachers(token);
                    if (response['success']) {
                      final teachersData = response['data'] as List;
                      localTeachers = teachersData
                          .map((t) => Teacher.fromJson(t))
                          .toList();
                      // cache into widget state for later openings
                      setState(() => _teachers = localTeachers);
                    }
                  }
                } catch (_) {
                  // ignore
                } finally {
                  setSheetState(() => localLoading = false);
                }
              }

              // Trigger initial load
              ensureTeachersLoaded();

              List<Teacher> filtered = localTeachers
                  .where(
                    (t) => t.name.toLowerCase().contains(_startChatSearchQuery),
                  )
                  .toList();

              return DraggableScrollableSheet(
                initialChildSize: 0.6,
                minChildSize: 0.4,
                maxChildSize: 0.95,
                expand: false,
                builder: (context, scrollController) {
                  return Container(
                    decoration: const BoxDecoration(
                      color: DSColors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(20),
                        topRight: Radius.circular(20),
                      ),
                      boxShadow: [DSShadows.card],
                    ),
                    child: SafeArea(
                      top: false,
                      child: Column(
                        children: [
                          const SizedBox(height: 8),
                          Container(
                            width: 36,
                            height: 4,
                            decoration: BoxDecoration(
                              color: DSColors.mediumGray,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: DSColors.primary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    LineAwesomeIcons.comment_dots_solid,
                                    color: DSColors.primary,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    context.tr('chats.start_chat'),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 18,
                                      color: DSColors.charcoal,
                                    ),
                                  ),
                                ),
                                IconButton(
                                  tooltip: context.tr('common.close'),
                                  onPressed: () => Navigator.of(ctx).pop(),
                                  icon: const Icon(
                                    LineAwesomeIcons.times_solid,
                                    color: DSColors.darkGray,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Search inside sheet
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Container(
                              decoration: BoxDecoration(
                                color: DSColors.lightGray,
                                borderRadius: BorderRadius.circular(
                                  DSRadii.large,
                                ),
                                border: Border.all(color: DSColors.mediumGray),
                              ),
                              child: TextField(
                                onChanged: (v) => setSheetState(
                                  () => _startChatSearchQuery = v
                                      .toLowerCase()
                                      .trim(),
                                ),
                                decoration: InputDecoration(
                                  hintText: context.tr(
                                    'chats.search_placeholder',
                                  ),
                                  prefixIcon: textDirection == TextDirection.rtl
                                      ? null
                                      : const Icon(
                                          LineAwesomeIcons.search_solid,
                                          color: DSColors.darkGray,
                                        ),
                                  suffixIcon: textDirection == TextDirection.rtl
                                      ? const Icon(
                                          LineAwesomeIcons.search_solid,
                                          color: DSColors.darkGray,
                                        )
                                      : null,
                                  border: InputBorder.none,
                                  contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16,
                                    vertical: 12,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Expanded(
                            child: localLoading
                                ? const Center(
                                    child: CircularProgressIndicator(
                                      color: DSColors.primary,
                                    ),
                                  )
                                : filtered.isEmpty
                                ? Center(
                                    child: Text(
                                      context.tr('chats.no_teachers'),
                                      style: const TextStyle(
                                        color: DSColors.darkGray,
                                      ),
                                    ),
                                  )
                                : ListView.builder(
                                    controller: scrollController,
                                    itemCount: filtered.length,
                                    itemBuilder: (context, index) {
                                      final teacher = filtered[index];
                                      return Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 6,
                                        ),
                                        child: InkWell(
                                          borderRadius: BorderRadius.circular(
                                            16,
                                          ),
                                          onTap: () => _startChat(teacher.id),
                                          child: Container(
                                            padding: const EdgeInsets.all(12),
                                            decoration: BoxDecoration(
                                              color: DSColors.white,
                                              borderRadius:
                                                  BorderRadius.circular(16),
                                              boxShadow: const [DSShadows.card],
                                            ),
                                            child: Row(
                                              children: [
                                                CircleAvatar(
                                                  radius: 22,
                                                  backgroundColor: DSColors
                                                      .primary
                                                      .withOpacity(0.1),
                                                  child: Text(
                                                    teacher.name.isNotEmpty
                                                        ? teacher.name[0]
                                                              .toUpperCase()
                                                        : 'T',
                                                    style: const TextStyle(
                                                      color: DSColors.primary,
                                                      fontWeight:
                                                          FontWeight.bold,
                                                    ),
                                                  ),
                                                ),
                                                const SizedBox(width: 12),
                                                Expanded(
                                                  child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Text(
                                                        teacher.name,
                                                        maxLines: 1,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                        style: const TextStyle(
                                                          fontWeight:
                                                              FontWeight.w600,
                                                          fontSize: 16,
                                                          color:
                                                              DSColors.charcoal,
                                                        ),
                                                      ),
                                                      const SizedBox(height: 2),
                                                      Text(
                                                        context.tr(
                                                          'chats.tap_to_start',
                                                        ),
                                                        maxLines: 1,
                                                        overflow: TextOverflow
                                                            .ellipsis,
                                                        style: const TextStyle(
                                                          fontSize: 12,
                                                          color:
                                                              DSColors.darkGray,
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                                Icon(
                                                  textDirection ==
                                                          TextDirection.rtl
                                                      ? LineAwesomeIcons
                                                            .angle_left_solid
                                                      : LineAwesomeIcons
                                                            .angle_right_solid,
                                                  size: 18,
                                                  color: DSColors.darkGray,
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer2<AuthProvider, LocalizationProvider>(
      builder: (context, authProvider, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            appBar: SchoolifyAppBar(
              showBack: true,
              showChatsShortcut: false,
              bottom: const PreferredSize(
                preferredSize: Size.fromHeight(16),
                child: SizedBox(height: 16),
              ),
            ),
            body: Container(
              color: DSColors.lightGray,
              child: SafeArea(
                child: Column(
                  children: [
                    // Top bar is handled by AppBar

                    // Search Bar
                    Container(
                      margin: const EdgeInsets.fromLTRB(24, 8, 24, 0),
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
                          hintStyle: const TextStyle(color: DSColors.darkGray),
                          prefixIcon:
                              Directionality.of(context) == TextDirection.rtl
                              ? null
                              : const Icon(
                                  LineAwesomeIcons.search_solid,
                                  color: DSColors.darkGray,
                                ),
                          suffixIcon:
                              Directionality.of(context) == TextDirection.rtl
                              ? const Icon(
                                  LineAwesomeIcons.search_solid,
                                  color: DSColors.darkGray,
                                )
                              : null,
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            vertical: 16,
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Chats List
                    Expanded(
                      child: Container(
                        decoration: const BoxDecoration(
                          color: DSColors.white,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(30),
                            topRight: Radius.circular(30),
                          ),
                        ),
                        child: _buildChatsList(),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            floatingActionButton: FloatingActionButton(
              onPressed: _showTeacherSelectionDialog,
              backgroundColor: DSColors.primary,
              foregroundColor: DSColors.white,
              elevation: 8,
              tooltip: context.tr('chats.new_chat'),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  const Icon(LineAwesomeIcons.comment_medical_solid, size: 22),
                ],
              ),
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
            const CircularProgressIndicator(color: DSColors.primary),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.loading'),
              style: const TextStyle(color: DSColors.darkGray),
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
                borderRadius: BorderRadius.circular(DSRadii.large),
              ),
              child: const Icon(
                LineAwesomeIcons.exclamation_circle_solid,
                size: 64,
                color: DSColors.error,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(fontSize: 16, color: DSColors.darkGray),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadChats,
              icon: const Icon(LineAwesomeIcons.sync_solid),
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

    final filteredChats = _chats.where((chat) {
      return chat.teacherName.toLowerCase().contains(_searchQuery) ||
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
                color: DSColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(DSRadii.large),
              ),
              child: Icon(
                LineAwesomeIcons.comment_dots_solid,
                size: 64,
                color: DSColors.primary.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.no_chats'),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: DSColors.darkGray,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('chats.no_chats_subtitle'),
              style: const TextStyle(fontSize: 14, color: DSColors.darkGray),
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
              onTap: () => _openChat(chat.id, chat.teacherName),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: DSColors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [DSShadows.card],
                ),
                child: Row(
                  children: [
                    // Avatar with online indicator
                    Stack(
                      children: [
                        CircleAvatar(
                          radius: 28,
                          backgroundColor: DSColors.primary.withOpacity(0.1),
                          child: Text(
                            chat.teacherName.isNotEmpty
                                ? chat.teacherName[0].toUpperCase()
                                : 'T',
                            style: TextStyle(
                              color: DSColors.primary,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
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
                                  chat.teacherName,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: DSColors.charcoal,
                                  ),
                                ),
                              ),
                              if (chat.lastMessageAt != null)
                                Text(
                                  _formatMessageTime(chat.lastMessageAt!),
                                  style: TextStyle(
                                    fontSize: 12,
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
                                      context.tr('chats.no_messages_preview'),
                                  style: TextStyle(
                                    fontSize: 14,
                                    color: chat.lastMessage != null
                                        ? DSColors.darkGray
                                        : DSColors.darkGray,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              Icon(
                                Directionality.of(context) == TextDirection.rtl
                                    ? LineAwesomeIcons.angle_left_solid
                                    : LineAwesomeIcons.angle_right_solid,
                                size: 14,
                                color: DSColors.darkGray,
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
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${dateTime.day}/${dateTime.month}';
    } else if (difference.inHours > 0) {
      return context.tr(
        'chats.hours_ago',
        args: [difference.inHours.toString()],
      );
    } else if (difference.inMinutes > 0) {
      return context.tr(
        'chats.minutes_ago',
        args: [difference.inMinutes.toString()],
      );
    } else {
      return context.tr('chats.just_now');
    }
  }
}

// Chat Detail Screen
class ChatDetailScreen extends StatefulWidget {
  final String chatId;
  final String teacherName;

  const ChatDetailScreen({
    super.key,
    required this.chatId,
    required this.teacherName,
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
        // log removed
        if (mounted) {
          setState(() {
            // Check if message already exists to avoid duplicates
            final existingIndex = _messages.indexWhere(
              (m) => m.id == message.id,
            );
            if (existingIndex == -1) {
              // log removed
              // Add new message and sort by creation time
              _messages.add(message);
              _messages.sort((a, b) => a.createdAt.compareTo(b.createdAt));
            } else {
              // log removed
            }
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

      // Listen for connection status
      _connectionSubscription = _webSocketService!.connectionStream.listen((
        isConnected,
      ) {
        // Removed disruptive connection lost snackbar; silent auto-reconnect
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
      // log removed

      _pollingService.startPolling(
        token: token,
        chatId: widget.chatId,
        onNewMessages: (newMessages) {
          if (mounted && newMessages.isNotEmpty) {
            // log removed
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
          _error = 'Authentication required';
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
          _error = response['code'] == 'NETWORK_OFFLINE'
              ? context.tr('common.offline_message')
              : (response['message'] ??
                    context.tr('chats.error_loading_messages'));
          _isLoading = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Error loading messages: $e';
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
      // If WebSocket is connected, send via WS (server will persist and broadcast)
      if (_webSocketService?.isConnected == true) {
        _messageController.clear();
        _stopTyping();
        await _webSocketService!.sendMessage(widget.chatId, content);
      } else {
        // Fallback to HTTP API when WS not available
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
            senderType: 'STUDENT',
            senderId: authProvider.studentData?['id'] ?? '',
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
        } else {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  response['code'] == 'NETWORK_OFFLINE'
                      ? context.tr('common.offline_message')
                      : context.tr('chats.failed_to_send'),
                ),
                backgroundColor: Colors.red.shade600,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            );
          }
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(context.tr('chats.error_sending_message')),
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
    return Consumer2<AuthProvider, LocalizationProvider>(
      builder: (context, authProvider, localizationProvider, child) {
        return Directionality(
          textDirection: localizationProvider.textDirection,
          child: Scaffold(
            appBar: AppBar(
              leading: const BackButton(),
              centerTitle: false,
              titleSpacing: 0,
              title: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: DSColors.primary.withOpacity(0.1),
                    child: Text(
                      widget.teacherName.isNotEmpty
                          ? widget.teacherName[0].toUpperCase()
                          : 'T',
                      style: const TextStyle(
                        color: DSColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Flexible(
                    child: Text(
                      widget.teacherName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: DSColors.charcoal,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            body: Container(
              color: DSColors.lightGray,
              child: SafeArea(
                child: Column(
                  children: [
                    // Top bar is handled by AppBar

                    // Messages Area
                    Expanded(
                      child: Container(
                        decoration: const BoxDecoration(
                          color: DSColors.white,
                          borderRadius: BorderRadius.only(
                            topLeft: Radius.circular(30),
                            topRight: Radius.circular(30),
                          ),
                        ),
                        child: FadeTransition(
                          opacity: _fadeAnimation,
                          child: _buildMessagesList(),
                        ),
                      ),
                    ),

                    // Message Input
                    Container(
                      color: DSColors.white,
                      child: _buildMessageInput(),
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

  Widget _buildMessagesList() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: DSColors.primary),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.loading_messages'),
              style: const TextStyle(color: DSColors.darkGray),
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
                borderRadius: BorderRadius.circular(DSRadii.large),
              ),
              child: const Icon(
                LineAwesomeIcons.exclamation_circle_solid,
                size: 64,
                color: DSColors.error,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              style: const TextStyle(fontSize: 16, color: DSColors.darkGray),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadMessages,
              icon: const Icon(LineAwesomeIcons.sync_solid),
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
                color: DSColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(DSRadii.large),
              ),
              child: Icon(
                LineAwesomeIcons.comment_dots_solid,
                size: 64,
                color: DSColors.primary.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              context.tr('chats.no_messages'),
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: DSColors.darkGray,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              context.tr('chats.no_messages_subtitle'),
              style: const TextStyle(fontSize: 14, color: DSColors.darkGray),
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
                widget.teacherName.isNotEmpty
                    ? widget.teacherName[0].toUpperCase()
                    : 'T',
                style: TextStyle(
                  color: DSColors.darkGray,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
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
                  topLeft: Radius.circular(isMe || !isFirstInGroup ? 20 : 8),
                  topRight: Radius.circular(!isMe || !isFirstInGroup ? 20 : 8),
                  bottomLeft: Radius.circular(isMe || !isLastInGroup ? 20 : 8),
                  bottomRight: Radius.circular(
                    !isMe || !isLastInGroup ? 20 : 8,
                  ),
                ),
                boxShadow: const [DSShadows.nano],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          message.content,
                          style: TextStyle(
                            color: isMe ? DSColors.white : DSColors.charcoal,
                            fontSize: 16,
                            height: 1.4,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        message.formattedTime,
                        style: TextStyle(
                          color: isMe ? Colors.white70 : DSColors.darkGray,
                          fontSize: 11,
                        ),
                      ),
                      if (isMe) ...[
                        const SizedBox(width: 4),
                        const Icon(
                          LineAwesomeIcons.check_double_solid,
                          size: 14,
                          color: Colors.white70,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),

          if (isMe && isLastInGroup) ...[
            const SizedBox(width: 8),
            CircleAvatar(
              radius: 16,
              backgroundColor: DSColors.primary.withOpacity(0.1),
              child: const Icon(
                LineAwesomeIcons.user_solid,
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
    final bool isRtl = Directionality.of(context) == TextDirection.rtl;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: DSColors.white,
        boxShadow: [DSShadows.micro],
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
                borderRadius: BorderRadius.circular(DSRadii.large),
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
                    context.tr('chats.is_typing', args: [widget.teacherName]),
                    style: const TextStyle(
                      color: DSColors.darkGray,
                      fontSize: 12,
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
                    borderRadius: BorderRadius.circular(25),
                    border: Border.all(color: DSColors.mediumGray),
                  ),
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: context.tr('chats.message_placeholder'),
                      hintStyle: const TextStyle(color: DSColors.darkGray),
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
                      : Transform(
                          alignment: Alignment.center,
                          transform: Matrix4.rotationY(isRtl ? math.pi : 0.0),
                          child: const Icon(
                            LineAwesomeIcons.paper_plane_solid,
                            color: DSColors.white,
                            size: 20,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // kept for potential future uses; currently message.formattedTime is used
}
