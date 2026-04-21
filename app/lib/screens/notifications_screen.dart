import 'dart:convert';
import 'package:flutter/material.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import '../widgets/skeleton.dart';
import '../widgets/empty_state.dart';
import 'chat_screen.dart';
import 'deal/deals_screen.dart';
import 'package:provider/provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    final data = await ApiService.getNotifications();
    if (!mounted) return;
    setState(() { _notifications = data; _isLoading = false; });
    // Không mark-read tự động — chỉ mark khi user tap từng item
  }

  Future<void> _navigateToTarget(Map n) async {
    final dataStr = n['data']?.toString();
    final type = n['type']?.toString() ?? '';
    if (dataStr == null || dataStr.isEmpty) return;
    try {
      final data = jsonDecode(dataStr) as Map;
      final roomId = data['roomId']?.toString();

      // Chat hoặc deal mới (có roomId) → mở màn hình chat
      if ((type == 'chat' || type == 'deal') && roomId != null && roomId.isNotEmpty) {
        await _openChat(roomId);
        return;
      }

      // Deal accepted/rejected (chỉ có dealId) → mở màn hình deals
      if (type == 'deal') {
        if (!mounted) return;
        Navigator.push(context, MaterialPageRoute(builder: (_) => const DealsScreen()));
        return;
      }

      // Review → giao dịch hoàn thành, mở deals để viết đánh giá
      if (type == 'review') {
        if (!mounted) return;
        Navigator.push(context, MaterialPageRoute(builder: (_) => const DealsScreen()));
        return;
      }
    } catch (_) {}
  }

  Future<void> _openChat(String roomId) async {
    final room = await ApiService.getRoomById(roomId);
    if (!mounted || room == null) return;
    final myId = context.read<AuthProvider>().userId;
    final other = room['buyerId'] == myId ? room['seller'] : room['buyer'];
    final post = room['post'] as Map? ?? {};
    Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(
      roomId: roomId,
      otherUserName: other?['name']?.toString() ?? 'Người dùng',
      postTitle: post['title']?.toString() ?? '',
      postImageLabel: post['imageLabel']?.toString() ?? '',
      postId: post['id']?.toString(),
    )));
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'deal':
      case 'deal_reminder':   return Icons.swap_horiz_rounded;
      case 'chat':            return Icons.chat_bubble_rounded;
      case 'review':          return Icons.star_rounded;
      case 'follow':          return Icons.person_add_rounded;
      case 'favorite':        return Icons.favorite_rounded;
      case 'new_post':        return Icons.article_rounded;
      case 'post_reminder':   return Icons.edit_note_rounded;
      case 'welcome':         return Icons.waving_hand_rounded;
      case 'daily_digest':    return Icons.newspaper_rounded;
      default:                return Icons.notifications_rounded;
    }
  }

  Color _colorFor(String type) {
    switch (type) {
      case 'deal':
      case 'deal_reminder':   return AppTheme.success;
      case 'chat':            return AppTheme.primary;
      case 'review':          return AppTheme.warning;
      case 'follow':          return const Color(0xFF9C27B0);
      case 'favorite':        return const Color(0xFFE91E63);
      case 'new_post':        return const Color(0xFF2196F3);
      case 'post_reminder':   return AppTheme.warning;
      case 'welcome':         return AppTheme.primary;
      case 'daily_digest':    return const Color(0xFF2196F3);
      default:                return AppTheme.textSecondary;
    }
  }

  String _timeAgo(String createdAt) {
    final dt = DateTime.tryParse(createdAt);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Thông báo'),
        actions: [
          if (_notifications.any((n) => n['isRead'] != true))
            TextButton(
              onPressed: () async {
                await ApiService.markAllNotificationsRead();
                setState(() {
                  for (final n in _notifications) n['isRead'] = true;
                });
                if (mounted) context.read<NotificationProvider>().clearBadge();
              },
              child: const Text('Đọc tất cả', style: TextStyle(color: AppTheme.primary)),
            ),
        ],
      ),
      body: _isLoading
          ? const NotificationListSkeleton()
          : _notifications.isEmpty
              ? const EmptyState(
                  icon: Icons.notifications_off_outlined,
                  message: 'Chưa có thông báo nào',
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    itemCount: _notifications.length,
                    separatorBuilder: (_, __) => const Divider(height: 1, indent: 72),
                    itemBuilder: (ctx, i) {
                      final n = _notifications[i];
                      final isRead = n['isRead'] == true;
                      final type = n['type'] ?? 'system';

                      // Parse data field để lấy ảnh bài đăng
                      String postImageLabel = '';
                      final dataStr = n['data']?.toString();
                      if (dataStr != null && dataStr.isNotEmpty) {
                        try {
                          final parsed = jsonDecode(dataStr) as Map;
                          postImageLabel = parsed['postImageLabel']?.toString() ?? '';
                        } catch (_) {}
                      }
                      final imageUrl = postImageLabel.isNotEmpty
                          ? (postImageLabel.startsWith('http') ? postImageLabel : '${ApiService.baseUrl}/uploads/$postImageLabel')
                          : '';

                      return InkWell(
                        onTap: () async {
                          if (n['isRead'] != true) {
                            await ApiService.markNotificationRead(n['id']);
                            setState(() => n['isRead'] = true);
                            if (_notifications.every((x) => x['isRead'] == true) && mounted) {
                              context.read<NotificationProvider>().clearBadge();
                            }
                          }
                          await _navigateToTarget(n);
                        },
                        child: Container(
                          color: isRead ? Colors.white : AppTheme.primary.withOpacity(0.04),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Ảnh bài đăng (nếu có) hoặc icon loại thông báo
                              imageUrl.isNotEmpty
                                  ? ClipRRect(
                                      borderRadius: BorderRadius.circular(10),
                                      child: SizedBox(
                                        width: 48, height: 48,
                                        child: AppImage(url: imageUrl),
                                      ),
                                    )
                                  : Container(
                                      width: 48, height: 48,
                                      decoration: BoxDecoration(
                                        color: _colorFor(type).withOpacity(0.12),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(_iconFor(type), color: _colorFor(type), size: 24),
                                    ),
                              const SizedBox(width: 12),
                              // Nội dung
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            n['title'] ?? '',
                                            style: TextStyle(
                                              fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                                              fontSize: 14,
                                              color: AppTheme.textPrimary,
                                            ),
                                          ),
                                        ),
                                        if (!isRead)
                                          Container(
                                            width: 8, height: 8,
                                            decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                          ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      n['body'] ?? '',
                                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      _timeAgo(n['createdAt'] ?? ''),
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }
}
