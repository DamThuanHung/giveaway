import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import '../widgets/skeleton.dart';
import '../models/post.dart';
import 'post_detail_screen.dart';
import 'review/write_review_screen.dart';

class ChatScreen extends StatefulWidget {
  final String roomId;
  final String otherUserName;
  final String postTitle;
  final String postImageLabel;
  final String? postId;
  final String? listingType;

  const ChatScreen({
    super.key,
    required this.roomId,
    required this.otherUserName,
    required this.postTitle,
    this.postImageLabel = '',
    this.postId,
    this.listingType,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<dynamic> _messages = [];
  bool _isLoading = true;
  bool _hasError = false;
  bool _showSafetyBanner = true;
  late IO.Socket _socket;
  String? _myId;
  bool _otherIsTyping = false;
  bool _otherHasRead = false;
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    _myId = context.read<AuthProvider>().userId;
    _loadHistory();
    _connectSocket();
  }

  Future<void> _loadHistory() async {
    setState(() { _isLoading = true; _hasError = false; });
    try {
      final msgs = await ApiService.getMessages(widget.roomId);
      if (!mounted) return;
      // Kiểm tra xem người kia đã đọc tin nhắn của mình chưa
      final myLastSent = msgs.lastWhere(
        (m) => m['senderId'] == _myId,
        orElse: () => null,
      );
      final alreadyRead = myLastSent != null && myLastSent['isRead'] == true;
      setState(() {
        _messages = msgs;
        _isLoading = false;
        _otherHasRead = alreadyRead;
      });
      _scrollToBottom();
      ApiService.markRoomAsRead(widget.roomId);
      if (mounted) context.read<NotificationProvider>().refresh();
    } catch (e) {
      debugPrint('❌ ChatScreen._loadHistory error: $e');
      if (!mounted) return;
      setState(() { _isLoading = false; _hasError = true; });
    }
  }

  Future<void> _openPost() async {
    if (widget.postId == null) return;
    try {
      final data = await ApiService.getPostById(widget.postId!);
      if (!mounted || data == null) return;
      final post = Post.fromJson(data);
      Navigator.push(context, MaterialPageRoute(
        builder: (_) => PostDetailScreen(post: post, isFavorite: false, onToggleFavorite: () async {}),
      ));
    } catch (e) {
      debugPrint('❌ _openPost error: $e');
    }
  }

  void _connectSocket() {
    _socket = IO.io(
      ApiService.baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setQuery({'roomId': widget.roomId})
          .build(),
    );

    _socket.onConnect((_) {
      _socket.emit('joinRoom', {'roomId': widget.roomId});
      // Thông báo cho người kia biết mình đã đọc
      if (_myId != null) {
        _socket.emit('markRead', {'roomId': widget.roomId, 'userId': _myId});
      }
    });

    _socket.on('receive_message', (data) {
      if (!mounted) return;
      setState(() {
        _messages.add(data);
        // Khi nhận tin nhắn mới từ người kia → reset trạng thái đã xem của mình
        if (data['senderId'] != _myId) _otherHasRead = false;
      });
      _scrollToBottom();
      // Đánh dấu đã đọc và thông báo cho người kia
      ApiService.markRoomAsRead(widget.roomId);
      if (_myId != null) {
        _socket.emit('markRead', {'roomId': widget.roomId, 'userId': _myId});
      }
      if (mounted) context.read<NotificationProvider>().refresh();
    });

    _socket.on('messages_read', (data) {
      if (!mounted) return;
      // Người kia vừa đọc tin nhắn của mình
      setState(() => _otherHasRead = true);
    });

    _socket.on('typing', (data) {
      if (!mounted) return;
      if (data['senderId'] != _myId) {
        setState(() => _otherIsTyping = true);
        _scrollToBottom();
      }
    });

    _socket.on('stop_typing', (data) {
      if (!mounted) return;
      if (data['senderId'] != _myId) {
        setState(() => _otherIsTyping = false);
      }
    });
  }

  void _onTextChanged(String text) {
    if (_myId == null) return;
    if (text.isNotEmpty) {
      _socket.emit('typing', {'roomId': widget.roomId, 'senderId': _myId});
      _typingTimer?.cancel();
      _typingTimer = Timer(const Duration(seconds: 2), () {
        _socket.emit('stop_typing', {'roomId': widget.roomId, 'senderId': _myId});
      });
    } else {
      _typingTimer?.cancel();
      _socket.emit('stop_typing', {'roomId': widget.roomId, 'senderId': _myId});
    }
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _socket.disconnect();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  List<String> _quickReplies() {
    if (widget.listingType == 'give') {
      return [
        'Bạn ơi, món này còn không ạ?',
        'Mình rất muốn nhận món này bạn ơi!',
        'Bạn cho mình hỏi tình trạng sản phẩm với ạ?',
        'Bạn có thể giao đến địa chỉ mình không ạ?',
        'Mình có thể đến lấy trực tiếp không bạn?',
      ];
    }
    return [
      'Bạn ơi, món này còn không ạ?',
      'Bạn cho mình hỏi tình trạng sản phẩm với ạ?',
      'Bạn có thể giảm giá được không ạ?',
      'Bạn cho mình xem thêm ảnh thực tế được không ạ?',
    ];
  }

  void _sendMessage() {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _myId == null) return;

    _typingTimer?.cancel();
    _socket.emit('sendMessage', {
      'roomId': widget.roomId,
      'senderId': _myId,
      'text': text,
    });

    // Thêm tin nhắn vào list ngay, không chờ server echo lại
    setState(() {
      _messages.add({'text': text, 'senderId': _myId, 'createdAt': DateTime.now().toIso8601String()});
    });
    _scrollToBottom();
    _msgCtrl.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.otherUserName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      ),
      body: Column(
        children: [
          // Banner an toàn giao dịch
          if (_showSafetyBanner)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: AppTheme.warning.withOpacity(0.12),
              child: Row(children: [
                Icon(Icons.shield_outlined, size: 16, color: AppTheme.warning),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Gợi ý: Gặp ở nơi công cộng, ban ngày. Không chuyển tiền trước khi nhận hàng.',
                    style: TextStyle(fontSize: 12, color: AppTheme.warning.withOpacity(0.85)),
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _showSafetyBanner = false),
                  child: Icon(Icons.close, size: 16, color: AppTheme.warning),
                ),
              ]),
            ),

          // Banner sản phẩm
          if (widget.postTitle.isNotEmpty)
            InkWell(
              onTap: widget.postId != null ? _openPost : null,
              child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: AppTheme.primary.withOpacity(0.06),
              child: Row(children: [
                if (widget.postImageLabel.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: SizedBox(
                      width: 44, height: 44,
                      child: AppImage(url: widget.postImageLabel.startsWith('http')
                          ? widget.postImageLabel
                          : '${ApiService.baseUrl}/uploads/${widget.postImageLabel}'),
                    ),
                  ),
                if (widget.postImageLabel.isNotEmpty) const SizedBox(width: 10),
                const Icon(Icons.inventory_2_outlined, size: 14, color: AppTheme.primary),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(widget.postTitle,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w500)),
                ),
                if (widget.postId != null)
                  const Icon(Icons.chevron_right, size: 16, color: AppTheme.primary),
              ]),
            )),
          Expanded(
            child: _isLoading
                ? const ChatMessagesSkeleton()
                : _hasError
                    ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.wifi_off, size: 56, color: AppTheme.textSecondary),
                        const SizedBox(height: 12),
                        const Text('Không thể tải tin nhắn', style: TextStyle(color: AppTheme.textSecondary)),
                        const SizedBox(height: 16),
                        OutlinedButton(onPressed: _loadHistory, child: const Text('Thử lại')),
                      ]))
                : _messages.isEmpty
                    ? const Center(child: Text('Hãy bắt đầu cuộc trò chuyện', style: TextStyle(color: AppTheme.textSecondary)))
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (ctx, i) {
                          final msg = _messages[i];
                          final isMe = msg['senderId'] == _myId;
                          // Detect deal card
                          final metaStr = msg['metadata']?.toString();
                          // Tin nhắn hệ thống (đổi sản phẩm hỏi)
                          if (metaStr == 'system') {
                            return _SystemMessage(text: msg['text']?.toString() ?? '');
                          }
                          if (metaStr != null && metaStr.isNotEmpty) {
                            try {
                              final meta = jsonDecode(metaStr) as Map;
                              if (meta['type'] == 'deal') {
                                return _DealCard(
                                  meta: meta,
                                  isMe: isMe,
                                  myId: _myId ?? '',
                                  otherUserName: widget.otherUserName,
                                  onUpdateStatus: (dealId, status) async {
                                    final ok = await ApiService.updateDealStatus(dealId, status);
                                    if (ok) _loadHistory();
                                  },
                                );
                              }
                            } catch (_) {}
                          }
                          final isLastMyMsg = isMe &&
                              i == _messages.lastIndexWhere((m) => m['senderId'] == _myId);
                          return _MessageBubble(
                            message: msg,
                            isMe: isMe,
                            showRead: isLastMyMsg && _otherHasRead,
                          );
                        },
                      ),
          ),
          if (_otherIsTyping) _TypingBubble(name: widget.otherUserName),
          _InputBar(
            controller: _msgCtrl,
            onSend: _sendMessage,
            onChanged: _onTextChanged,
            quickReplies: (!_isLoading && _messages.isEmpty) ? _quickReplies() : const [],
          ),
        ],
      ),
    );
  }
}

class _SystemMessage extends StatelessWidget {
  final String text;
  const _SystemMessage({required this.text});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: AppTheme.primaryLight,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(text, style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500)),
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final dynamic message;
  final bool isMe;
  final bool showRead;
  const _MessageBubble({required this.message, required this.isMe, this.showRead = false});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(bottom: 2),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
            decoration: BoxDecoration(
              color: isMe ? AppTheme.primary : Colors.white,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isMe ? 16 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 16),
              ),
              border: isMe ? null : Border.all(color: AppTheme.border),
            ),
            child: Text(
              message['text'] ?? '',
              style: TextStyle(color: isMe ? Colors.white : AppTheme.textPrimary, fontSize: 14),
            ),
          ),
          if (showRead)
            Padding(
              padding: const EdgeInsets.only(bottom: 6, right: 2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  Icon(Icons.done_all, size: 13, color: AppTheme.primary),
                  SizedBox(width: 3),
                  Text('Đã xem', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ],
              ),
            )
          else
            const SizedBox(height: 6),
        ],
      ),
    );
  }
}

class _DealCard extends StatefulWidget {
  final Map meta;
  final bool isMe;
  final String myId;
  final String otherUserName;
  final Future<void> Function(String dealId, String status) onUpdateStatus;

  const _DealCard({required this.meta, required this.isMe, required this.myId, required this.otherUserName, required this.onUpdateStatus});

  @override
  State<_DealCard> createState() => _DealCardState();
}

class _DealCardState extends State<_DealCard> {
  bool _reviewed = false;

  @override
  void initState() {
    super.initState();
    final status = widget.meta['status']?.toString() ?? '';
    final dealId = widget.meta['dealId']?.toString() ?? '';
    if (status == 'completed' && dealId.isNotEmpty) {
      ApiService.checkReviewed(dealId).then((has) {
        if (mounted && has) setState(() => _reviewed = true);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = widget.meta['status']?.toString() ?? 'pending';
    final dealId = widget.meta['dealId']?.toString() ?? '';
    final postTitle = widget.meta['postTitle']?.toString() ?? '';
    final userMessage = widget.meta['userMessage']?.toString();

    // Người bán = không phải người gửi deal (isMe = false với người bán)
    final isSeller = !widget.isMe;

    Color borderColor;
    String statusLabel;
    Color statusColor;
    switch (status) {
      case 'accepted':
        borderColor = AppTheme.success;
        statusLabel = '✅ Đã đồng ý';
        statusColor = AppTheme.success;
        break;
      case 'rejected':
        borderColor = AppTheme.error;
        statusLabel = '❌ Đã từ chối';
        statusColor = AppTheme.error;
        break;
      case 'completed':
        borderColor = AppTheme.primary;
        statusLabel = '🎉 Đã giao xong';
        statusColor = AppTheme.primary;
        break;
      default:
        borderColor = Colors.orange;
        statusLabel = '⏳ Chờ phản hồi';
        statusColor = Colors.orange;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Center(
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: borderColor, width: 1.5),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Header
            Row(children: [
              const Icon(Icons.handshake_outlined, size: 18, color: AppTheme.primary),
              const SizedBox(width: 6),
              const Text('Yêu cầu nhận đồ', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(statusLabel, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ]),
            if (postTitle.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(postTitle, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  maxLines: 1, overflow: TextOverflow.ellipsis),
            ],
            if (userMessage != null && userMessage.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppTheme.background, borderRadius: BorderRadius.circular(8)),
                child: Text('"$userMessage"',
                    style: const TextStyle(fontSize: 13, fontStyle: FontStyle.italic, color: AppTheme.textSecondary)),
              ),
            ],
            // Nút hành động — chỉ người bán thấy
            if (isSeller && status == 'pending') ...[
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: OutlinedButton(
                  style: OutlinedButton.styleFrom(foregroundColor: AppTheme.error, side: const BorderSide(color: AppTheme.error)),
                  onPressed: () => widget.onUpdateStatus(dealId, 'rejected'),
                  child: const Text('Từ chối'),
                )),
                const SizedBox(width: 10),
                Expanded(child: ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
                  onPressed: () => widget.onUpdateStatus(dealId, 'accepted'),
                  child: const Text('Đồng ý', style: TextStyle(color: Colors.white)),
                )),
              ]),
            ],
            if (isSeller && status == 'accepted') ...[
              const SizedBox(height: 12),
              SizedBox(width: double.infinity, child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
                onPressed: () => widget.onUpdateStatus(dealId, 'completed'),
                icon: const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
                label: const Text('Đã giao xong', style: TextStyle(color: Colors.white)),
              )),
            ],
            // Cả hai đều có thể viết đánh giá khi deal hoàn thành
            if (status == 'completed') ...[
              const SizedBox(height: 12),
              if (_reviewed)
                Row(mainAxisAlignment: MainAxisAlignment.center, children: const [
                  Icon(Icons.check_circle, color: AppTheme.success, size: 16),
                  SizedBox(width: 6),
                  Text('Đã gửi đánh giá', style: TextStyle(color: AppTheme.success, fontSize: 13, fontWeight: FontWeight.w500)),
                ])
              else
                SizedBox(width: double.infinity, child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.warning),
                  onPressed: () async {
                    final done = await Navigator.push<bool>(
                      context,
                      MaterialPageRoute(builder: (_) => WriteReviewScreen(
                        dealId: dealId,
                        revieweeName: widget.otherUserName,
                      )),
                    );
                    if (done == true) setState(() => _reviewed = true);
                  },
                  icon: const Icon(Icons.star_rounded, color: Colors.white, size: 18),
                  label: const Text('Viết đánh giá', style: TextStyle(color: Colors.white)),
                )),
            ],
          ]),
        ),
      ),
    );
  }
}

class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final ValueChanged<String>? onChanged;
  final List<String> quickReplies;

  const _InputBar({
    required this.controller,
    required this.onSend,
    this.onChanged,
    this.quickReplies = const [],
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Hàng mẫu tin nhắn nhanh
          if (quickReplies.isNotEmpty)
            SizedBox(
              height: 38,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                scrollDirection: Axis.horizontal,
                itemCount: quickReplies.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) => GestureDetector(
                  onTap: () {
                    controller.text = quickReplies[i];
                    controller.selection = TextSelection.fromPosition(
                      TextPosition(offset: controller.text.length),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryLight,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
                    ),
                    child: Text(
                      quickReplies[i],
                      style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500),
                    ),
                  ),
                ),
              ),
            ),
          // Ô nhập tin nhắn
          Padding(
            padding: EdgeInsets.only(
              left: 16, right: 8, top: 6,
              bottom: MediaQuery.of(context).viewInsets.bottom + MediaQuery.of(context).padding.bottom + 10,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => onSend(),
                    onChanged: onChanged,
                    decoration: InputDecoration(
                      hintText: 'Nhập tin nhắn...',
                      filled: true,
                      fillColor: AppTheme.background,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                CircleAvatar(
                  backgroundColor: AppTheme.primary,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white, size: 18),
                    onPressed: onSend,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Typing bubble — 3 chấm nhảy ─────────────────────────────────────────────

class _TypingBubble extends StatefulWidget {
  final String name;
  const _TypingBubble({required this.name});

  @override
  State<_TypingBubble> createState() => _TypingBubbleState();
}

class _TypingBubbleState extends State<_TypingBubble> with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;
  late final List<Animation<double>> _animations;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(3, (i) => AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    ));
    _animations = _controllers.map((c) =>
      Tween<double>(begin: 0, end: -6).animate(CurvedAnimation(parent: c, curve: Curves.easeInOut))
    ).toList();

    for (int i = 0; i < 3; i++) {
      Future.delayed(Duration(milliseconds: i * 150), () {
        if (mounted) _controllers[i].repeat(reverse: true);
      });
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, bottom: 6),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
              ),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 4, offset: const Offset(0, 2))],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) => AnimatedBuilder(
                animation: _animations[i],
                builder: (_, __) => Transform.translate(
                  offset: Offset(0, _animations[i].value),
                  child: Container(
                    margin: EdgeInsets.only(left: i > 0 ? 4 : 0),
                    width: 7, height: 7,
                    decoration: BoxDecoration(color: AppTheme.textSecondary, shape: BoxShape.circle),
                  ),
                ),
              )),
            ),
          ),
        ],
      ),
    );
  }
}
