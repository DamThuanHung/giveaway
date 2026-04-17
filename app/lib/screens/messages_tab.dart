import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import '../widgets/skeleton.dart';
import 'chat_screen.dart';
import 'auth/phone_login_screen.dart';

String _formatRoomTime(dynamic raw) {
  if (raw == null) return '';
  final dt = DateTime.tryParse(raw.toString())?.toLocal();
  if (dt == null) return '';
  final now = DateTime.now();
  final diff = now.difference(dt);
  if (diff.inDays == 0) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  } else if (diff.inDays == 1) {
    return 'Hôm qua';
  } else if (diff.inDays < 7) {
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    return days[dt.weekday - 1];
  } else if (diff.inDays < 365) {
    return '${dt.day}/${dt.month}';
  } else {
    return '${dt.day}/${dt.month}/${dt.year % 100}';
  }
}

class MessagesTab extends StatefulWidget {
  const MessagesTab({super.key});

  @override
  State<MessagesTab> createState() => _MessagesTabState();
}

class _MessagesTabState extends State<MessagesTab> {
  List<dynamic> _rooms = [];
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _loadRooms();
  }

  Future<void> _loadRooms() async {
    setState(() { _isLoading = true; _hasError = false; });
    try {
      final rooms = await ApiService.getMyRooms();
      if (!mounted) return;
      setState(() { _rooms = rooms; _isLoading = false; });
    } catch (e) {
      debugPrint('❌ MessagesTab._loadRooms error: $e');
      if (!mounted) return;
      setState(() { _isLoading = false; _hasError = true; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isAuth) {
      return Scaffold(
        backgroundColor: AppTheme.background,
        appBar: AppBar(title: const Text('Tin nhắn')),
        body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.chat_bubble_outline, size: 64, color: AppTheme.border),
          const SizedBox(height: 12),
          const Text('Đăng nhập để xem tin nhắn', style: TextStyle(color: AppTheme.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PhoneLoginScreen())),
            child: const Text('Đăng nhập'),
          ),
        ])),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Tin nhắn')),
      body: _isLoading
          ? ListView.builder(
              itemCount: 6,
              itemBuilder: (_, __) => const ChatRoomSkeleton(),
            )
          : _hasError
              ? RefreshIndicator(
                  onRefresh: _loadRooms,
                  child: LayoutBuilder(
                    builder: (ctx, constraints) => SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: constraints.maxHeight,
                        child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.wifi_off, size: 56, color: AppTheme.textSecondary),
                          const SizedBox(height: 12),
                          const Text('Không thể tải tin nhắn', style: TextStyle(color: AppTheme.textSecondary)),
                          const SizedBox(height: 16),
                          OutlinedButton(onPressed: _loadRooms, child: const Text('Thử lại')),
                        ])),
                      ),
                    ),
                  ),
                )
              : _rooms.isEmpty
              ? RefreshIndicator(
                  onRefresh: _loadRooms,
                  child: LayoutBuilder(
                    builder: (ctx, constraints) => SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: SizedBox(
                        height: constraints.maxHeight,
                        child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: const [
                          Icon(Icons.chat_bubble_outline, size: 64, color: AppTheme.border),
                          SizedBox(height: 12),
                          Text('Chưa có cuộc trò chuyện nào', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                          SizedBox(height: 6),
                          Text('Tìm đồ và liên hệ người đăng để bắt đầu', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                        ])),
                      ),
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadRooms,
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: _rooms.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, indent: 80),
                    itemBuilder: (ctx, i) {
                      final room = _rooms[i];
                      final other = room['buyerId'] == auth.userId ? room['seller'] : room['buyer'];
                      final msgs = room['messages'] as List? ?? [];
                      final lastMsg = msgs.isNotEmpty
                          ? (msgs[0]['text']?.toString().isNotEmpty == true
                              ? msgs[0]['text'].toString()
                              : 'Yêu cầu nhận đồ')
                          : 'Bắt đầu cuộc trò chuyện';
                      final lastMsgTime = msgs.isNotEmpty ? msgs[0]['createdAt'] : null;
                      final post = room['post'] as Map? ?? {};
                      final postTitle = post['title']?.toString() ?? '';
                      final postImageLabel = post['imageLabel']?.toString() ?? '';
                      final unread = ((room['unreadCount'] as num?)?.toInt() ?? 0) > 0;
                      final avatarUrl = other?['avatar']?.toString() ?? '';

                      return InkWell(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => ChatScreen(
                            roomId: room['id'],
                            otherUserName: other?['name'] ?? 'Người dùng',
                            postTitle: postTitle,
                            postImageLabel: postImageLabel,
                            postId: post['id']?.toString(),
                          )),
                        ).then((_) => _loadRooms()),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Row(children: [
                            // Avatar người chat
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: AppTheme.primaryLight,
                              backgroundImage: avatarUrl.isNotEmpty ? NetworkImage(avatarUrl) : null,
                              onBackgroundImageError: avatarUrl.isNotEmpty
                                  ? (_, __) {}
                                  : null,
                              child: avatarUrl.isEmpty
                                  ? const Icon(Icons.person, color: AppTheme.primary)
                                  : null,
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              // Tên + timestamp
                              Row(children: [
                                Expanded(
                                  child: Text(
                                    other?['name'] ?? 'Người dùng',
                                    style: TextStyle(
                                      fontWeight: unread ? FontWeight.w700 : FontWeight.w500,
                                      fontSize: 15,
                                      color: unread ? AppTheme.textPrimary : AppTheme.textSecondary,
                                    ),
                                  ),
                                ),
                                Text(
                                  _formatRoomTime(lastMsgTime),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: unread ? AppTheme.primary : AppTheme.textSecondary,
                                    fontWeight: unread ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              ]),
                              const SizedBox(height: 3),
                              // Tin nhắn cuối + unread dot
                              Row(children: [
                                Expanded(
                                  child: Text(
                                    lastMsg,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: TextStyle(
                                      color: unread ? AppTheme.textPrimary : AppTheme.textSecondary,
                                      fontSize: 13,
                                      fontWeight: unread ? FontWeight.w500 : FontWeight.normal,
                                    ),
                                  ),
                                ),
                                if (unread)
                                  Container(
                                    width: 8, height: 8,
                                    margin: const EdgeInsets.only(left: 6),
                                    decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                  ),
                              ]),
                              // Tag sản phẩm
                              if (postTitle.isNotEmpty) ...[
                                const SizedBox(height: 5),
                                Row(children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(4),
                                    child: SizedBox(
                                      width: 28, height: 28,
                                      child: AppImage(
                                        url: postImageLabel.isNotEmpty
                                            ? (postImageLabel.startsWith('http') ? postImageLabel : '${ApiService.baseUrl}/uploads/$postImageLabel')
                                            : '',
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(postTitle,
                                        maxLines: 1, overflow: TextOverflow.ellipsis,
                                        style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500)),
                                  ),
                                ]),
                              ],
                            ])),
                          ]),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
