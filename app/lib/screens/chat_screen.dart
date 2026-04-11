import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import 'review/write_review_screen.dart';

class ChatScreen extends StatefulWidget {
  final String roomId;
  final String otherUserName;
  final String postTitle;
  final String postImageLabel;

  const ChatScreen({
    super.key,
    required this.roomId,
    required this.otherUserName,
    required this.postTitle,
    this.postImageLabel = '',
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<dynamic> _messages = [];
  bool _isLoading = true;
  bool _showSafetyBanner = true;
  late IO.Socket _socket;
  String? _myId;

  @override
  void initState() {
    super.initState();
    _myId = context.read<AuthProvider>().userId;
    _loadHistory();
    _connectSocket();
  }

  Future<void> _loadHistory() async {
    final msgs = await ApiService.getMessages(widget.roomId);
    if (!mounted) return;
    setState(() { _messages = msgs; _isLoading = false; });
    _scrollToBottom();
    // Đánh dấu đã đọc & cập nhật badge
    ApiService.markRoomAsRead(widget.roomId);
    if (mounted) context.read<NotificationProvider>().refresh();
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
    });

    _socket.on('receive_message', (data) {
      if (!mounted) return;
      setState(() => _messages.add(data));
      _scrollToBottom();
      // Đang xem chat này → mark as read ngay
      ApiService.markRoomAsRead(widget.roomId);
      context.read<NotificationProvider>().refresh();
    });
  }

  @override
  void dispose() {
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

  void _sendMessage() {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _myId == null) return;

    _socket.emit('sendMessage', {
      'roomId': widget.roomId,
      'senderId': _myId,
      'text': text,
    });

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
              color: const Color(0xFFFFF8E1),
              child: Row(children: [
                const Icon(Icons.shield_outlined, size: 16, color: Color(0xFFF59E0B)),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text(
                    'Gợi ý: Gặp ở nơi công cộng, ban ngày. Không chuyển tiền trước khi nhận hàng.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _showSafetyBanner = false),
                  child: const Icon(Icons.close, size: 16, color: Color(0xFFF59E0B)),
                ),
              ]),
            ),

          // Banner sản phẩm
          if (widget.postTitle.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: AppTheme.primary.withOpacity(0.06),
              child: Row(children: [
                if (widget.postImageLabel.isNotEmpty)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: SizedBox(
                      width: 40, height: 40,
                      child: AppImage(url: '${ApiService.baseUrl}/uploads/${widget.postImageLabel}'),
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
              ]),
            ),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
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
                          return _MessageBubble(message: msg, isMe: isMe);
                        },
                      ),
          ),
          _InputBar(controller: _msgCtrl, onSend: _sendMessage),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final dynamic message;
  final bool isMe;
  const _MessageBubble({required this.message, required this.isMe});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
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
  const _InputBar({required this.controller, required this.onSend});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 16, right: 8, top: 10, bottom: MediaQuery.of(context).viewInsets.bottom + 10,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              textInputAction: TextInputAction.send,
              onSubmitted: (_) => onSend(),
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
    );
  }
}
