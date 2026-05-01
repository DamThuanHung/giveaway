import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:photo_view/photo_view.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../providers/auth_provider.dart';
import '../services/analytics.dart';
import '../providers/notification_provider.dart';
import '../services/api_service.dart';
import '../services/token_storage.dart';
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
  // Nullable: nếu token null khi mở ChatScreen → _socket không được init
  // → mọi access phải qua `?.` để tránh LateInitializationError ở dispose/typing.
  IO.Socket? _socket;
  String? _myId;
  bool _otherIsTyping = false;
  bool _otherHasRead = false;
  Timer? _typingTimer;

  // Post info — fetch khi mở chat để biết tôi là author hay buyer.
  // Author = sellerId của room (người đăng bài).
  String? _postAuthorId;
  String? _partnerId;        // user còn lại trong room
  String _postStatus = 'available';
  bool _completing = false;

  bool get _iAmAuthor => _myId != null && _postAuthorId != null && _myId == _postAuthorId;
  bool get _canComplete => _iAmAuthor && (_postStatus == 'available' || _postStatus == 'reserved') && _partnerId != null;

  @override
  void initState() {
    super.initState();
    _myId = context.read<AuthProvider>().userId;
    _loadHistory();
    _loadRoomMeta();
    _connectSocket();
  }

  /// Lấy meta của room → biết tôi là seller hay buyer + status post hiện tại.
  /// Cần để hiện nút "Hoàn thành" cho author + ẩn cho người mua.
  Future<void> _loadRoomMeta() async {
    try {
      final room = await ApiService.getRoomById(widget.roomId);
      if (!mounted || room == null) return;
      final post = room['post'] as Map?;
      setState(() {
        _postAuthorId = room['sellerId']?.toString();
        _partnerId = room['buyerId']?.toString() == _myId
            ? room['sellerId']?.toString()
            : room['buyerId']?.toString();
        _postStatus = (post?['status']?.toString()) ?? 'available';
      });
    } catch (e) {
      debugPrint('❌ _loadRoomMeta error: $e');
    }
  }

  /// Author bấm "Hoàn thành giao dịch" → confirm dialog → API → snackbar +
  /// auto-prompt review. Memory feedback_self_test_before_handoff: confirm rõ
  /// hành động không thể huỷ để tránh user bấm nhầm.
  Future<void> _completeTransaction() async {
    if (!_canComplete || _completing) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xác nhận giao dịch hoàn tất?'),
        content: Text(
          'Bạn xác nhận đã giao dịch xong với ${widget.otherUserName}?\n\n'
          'Sau khi xác nhận, bài đăng sẽ chuyển sang "Đã giao dịch" và '
          'không thể quay lại trạng thái cũ.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Huỷ')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xác nhận', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;

    setState(() => _completing = true);
    final result = await ApiService.completePost(widget.postId!, _partnerId!);
    if (!mounted) return;
    setState(() => _completing = false);

    if (result == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Không thể đánh dấu hoàn thành. Vui lòng thử lại.'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    setState(() => _postStatus = 'done');
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Text('🎉 Đã đánh dấu giao dịch xong!'),
      backgroundColor: AppTheme.success,
      behavior: SnackBarBehavior.floating,
    ));

    // Prompt review — tự nguyện, không force
    final wantsReview = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text('Đánh giá ${widget.otherUserName}?'),
        content: const Text(
          'Đánh giá giúp cộng đồng tin tưởng hơn.\n'
          'Bạn có thể quay lại đánh giá sau từ trang cá nhân của họ.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Để sau')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Đánh giá ngay'),
          ),
        ],
      ),
    );
    if (wantsReview != true || !mounted) return;

    Navigator.push(context, MaterialPageRoute(
      builder: (_) => WriteReviewScreen(
        postId: widget.postId!,
        revieweeName: widget.otherUserName,
        postTitle: widget.postTitle,
      ),
    ));
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
      // TM3 (Tier 2): wrap fire-and-forget vào catch — chống uncaught async error
      // gây crash background isolate. markRoomAsRead fail = không ảnh hưởng chat.
      ApiService.markRoomAsRead(widget.roomId).catchError((_) {});
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

  Future<void> _connectSocket() async {
    // Backend bắt buộc JWT trong handshake — chặn impersonate qua senderId giả
    final token = await TokenStorage.getToken();
    if (token == null) return;

    _socket = IO.io(
      ApiService.baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          // setExtraHeaders chỉ hoạt động cho polling transport, không cho WS-only.
          // Pass token qua QUERY là cách tin cậy nhất — luôn truyền qua mọi
          // transport. Backend chat.gateway.ts đọc handshake.query.token làm
          // fallback chính cho WebSocket-only mode.
          .setQuery({'roomId': widget.roomId, 'token': token})
          .build(),
    );

    _socket?.onConnect((_) {
      _socket?.emit('joinRoom', {'roomId': widget.roomId});
      // Thông báo cho người kia biết mình đã đọc (server lấy userId từ JWT)
      _socket?.emit('markRead', {'roomId': widget.roomId});
    });

    _socket?.on('receive_message', (data) {
      if (!mounted) return;
      setState(() {
        _messages.add(data);
        // Khi nhận tin nhắn mới từ người kia → reset trạng thái đã xem của mình
        if (data['senderId'] != _myId) _otherHasRead = false;
      });
      _scrollToBottom();
      // Đánh dấu đã đọc và thông báo cho người kia (best-effort, fire-and-forget)
      ApiService.markRoomAsRead(widget.roomId).catchError((_) {});
      _socket?.emit('markRead', {'roomId': widget.roomId});
      if (mounted) context.read<NotificationProvider>().refresh();
    });

    _socket?.on('messages_read', (data) {
      if (!mounted) return;
      // Người kia vừa đọc tin nhắn của mình
      setState(() => _otherHasRead = true);
    });

    _socket?.on('typing', (data) {
      if (!mounted) return;
      if (data['senderId'] != _myId) {
        setState(() => _otherIsTyping = true);
        _scrollToBottom();
      }
    });

    _socket?.on('stop_typing', (data) {
      if (!mounted) return;
      if (data['senderId'] != _myId) {
        setState(() => _otherIsTyping = false);
      }
    });
  }

  void _onTextChanged(String text) {
    if (_myId == null) return;
    if (text.isNotEmpty) {
      _socket?.emit('typing', {'roomId': widget.roomId});
      _typingTimer?.cancel();
      _typingTimer = Timer(const Duration(seconds: 2), () {
        _socket?.emit('stop_typing', {'roomId': widget.roomId});
      });
    } else {
      _typingTimer?.cancel();
      _socket?.emit('stop_typing', {'roomId': widget.roomId});
    }
  }

  @override
  void dispose() {
    _typingTimer?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _socket?.disconnect();
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
    // Server lấy senderId từ JWT, không gửi từ client để chống impersonate
    _socket?.emit('sendMessage', {
      'roomId': widget.roomId,
      'text': text,
    });
    Analytics.chatMessageSend(roomId: widget.roomId);

    // Thêm tin nhắn vào list ngay, không chờ server echo lại
    setState(() {
      _messages.add({'text': text, 'senderId': _myId, 'createdAt': DateTime.now().toIso8601String()});
    });
    _scrollToBottom();
    _msgCtrl.clear();
  }

  /// Mở bottom sheet hỏi nguồn ảnh: chụp camera hay chọn từ thư viện.
  /// "Gửi ảnh thực tế" rất quan trọng trong chợ đồ cũ — phải có CẢ 2 option:
  /// chụp tươi để chứng minh đồ thật, hoặc chọn ảnh có sẵn.
  Future<ImageSource?> _askImageSource() async {
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              margin: const EdgeInsets.only(top: 8),
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 8),
            ListTile(
              leading: const Icon(Icons.photo_camera, color: AppTheme.primary),
              title: const Text('Chụp ảnh'),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: AppTheme.primary),
              title: const Text('Chọn từ thư viện'),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  /// Pick ảnh (camera hoặc gallery) → upload qua MinIO → emit message với imageUrl.
  /// Trong chợ đồ cũ, người mua thường yêu cầu "ảnh thực tế" của sản phẩm —
  /// quick reply có sẵn gợi ý này nhưng trước đây user không có cách gửi ảnh
  /// trong chat → phải chuyển sang Zalo (mất user).
  Future<void> _pickAndSendImage() async {
    if (_myId == null) return;
    final source = await _askImageSource();
    if (source == null || !mounted) return;
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: source,
      imageQuality: 80,
      maxWidth: 1600,
    );
    if (picked == null || !mounted) return;

    // Hiện loading bubble tạm thời với placeholder local
    setState(() {
      _messages.add({
        'text': '',
        'senderId': _myId,
        'metadata': '{"type":"image","url":"_uploading_"}',
        'createdAt': DateTime.now().toIso8601String(),
        '_uploading': true,
      });
    });
    _scrollToBottom();

    final url = await ApiService.uploadChatImage(picked.path);
    if (!mounted) return;
    if (url == null) {
      setState(() {
        _messages.removeWhere((m) => m['_uploading'] == true);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không gửi được ảnh, vui lòng thử lại')),
      );
      return;
    }

    _socket?.emit('sendMessage', {
      'roomId': widget.roomId,
      'text': '',
      'imageUrl': url,
    });
    Analytics.chatMessageSend(roomId: widget.roomId);

    // Replace placeholder bằng message thật với URL
    setState(() {
      final idx = _messages.indexWhere((m) => m['_uploading'] == true);
      if (idx >= 0) {
        _messages[idx] = {
          'text': '',
          'senderId': _myId,
          'metadata': '{"type":"image","url":"$url"}',
          'createdAt': DateTime.now().toIso8601String(),
        };
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(widget.otherUserName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        actions: [
          if (_canComplete)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: TextButton.icon(
                onPressed: _completing ? null : _completeTransaction,
                icon: _completing
                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.check_circle_outline, size: 18, color: AppTheme.success),
                label: const Text('Hoàn thành',
                    style: TextStyle(color: AppTheme.success, fontWeight: FontWeight.w600)),
              ),
            ),
          if (_postStatus == 'done')
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Row(children: const [
                Icon(Icons.check_circle, size: 18, color: AppTheme.success),
                SizedBox(width: 4),
                Text('Đã giao dịch',
                    style: TextStyle(color: AppTheme.success, fontWeight: FontWeight.w600, fontSize: 13)),
              ]),
            ),
        ],
      ),
      body: Column(
        children: [
          // Banner an toàn giao dịch
          if (_showSafetyBanner)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: AppTheme.warning.withOpacity(0.12),
              child: Row(children: [
                const Icon(Icons.shield_outlined, size: 16, color: AppTheme.warning),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Gợi ý: Gặp ở nơi công cộng, ban ngày. Không chuyển tiền trước khi nhận hàng.',
                    style: TextStyle(fontSize: 12, color: AppTheme.warning.withOpacity(0.85)),
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _showSafetyBanner = false),
                  child: const Icon(Icons.close, size: 16, color: AppTheme.warning),
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
                          final metaStr = msg['metadata']?.toString();
                          // Tin nhắn hệ thống (vd: "Đã đánh dấu giao dịch xong")
                          if (metaStr == 'system') {
                            return _SystemMessage(text: msg['text']?.toString() ?? '');
                          }
                          // Legacy deal cards từ data cũ — render thành plain bubble (deal feature đã bỏ)
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
            onPickImage: _pickAndSendImage,
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

  /// Parse metadata JSON nếu có. Trả về null nếu không phải image message.
  String? _imageUrlFromMeta() {
    final meta = message['metadata'];
    if (meta is! String || meta.isEmpty || !meta.contains('"image"')) return null;
    try {
      final parsed = jsonDecode(meta) as Map<String, dynamic>;
      if (parsed['type'] == 'image' && parsed['url'] is String) {
        return parsed['url'] as String;
      }
    } catch (_) {}
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final imageUrl = _imageUrlFromMeta();
    final hasText = (message['text'] as String? ?? '').isNotEmpty;

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // Image bubble: render fullwidth ảnh, optional text caption bên dưới
          if (imageUrl != null)
            Container(
              margin: const EdgeInsets.only(bottom: 2),
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.6),
              child: ClipRRect(
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 16),
                ),
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(context, MaterialPageRoute(
                      builder: (_) => Scaffold(
                        backgroundColor: Colors.black,
                        appBar: AppBar(backgroundColor: Colors.black, iconTheme: const IconThemeData(color: Colors.white)),
                        body: Center(
                          child: PhotoView(imageProvider: NetworkImage(imageUrl)),
                        ),
                      ),
                    ));
                  },
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    loadingBuilder: (_, child, progress) => progress == null
                        ? child
                        : Container(
                            width: 160, height: 160,
                            color: AppTheme.background,
                            alignment: Alignment.center,
                            child: const CircularProgressIndicator(strokeWidth: 2),
                          ),
                    errorBuilder: (_, __, ___) => Container(
                      width: 160, height: 160,
                      color: AppTheme.background,
                      alignment: Alignment.center,
                      child: const Icon(Icons.broken_image_outlined, color: AppTheme.textSecondary),
                    ),
                  ),
                ),
              ),
            ),
          // Text bubble (nếu có): cùng image hoặc đứng riêng
          if (hasText)
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
            const Padding(
              padding: EdgeInsets.only(bottom: 6, right: 2),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
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

class _InputBar extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final VoidCallback? onPickImage;
  final ValueChanged<String>? onChanged;
  final List<String> quickReplies;

  const _InputBar({
    required this.controller,
    required this.onSend,
    this.onPickImage,
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
                if (onPickImage != null)
                  IconButton(
                    onPressed: onPickImage,
                    icon: const Icon(Icons.photo_camera_outlined, color: AppTheme.textSecondary),
                    tooltip: 'Gửi ảnh',
                  ),
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
    for (final c in _controllers) {
      c.dispose();
    }
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
                    decoration: const BoxDecoration(color: AppTheme.textSecondary, shape: BoxShape.circle),
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
