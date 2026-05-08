import 'dart:convert';
import 'package:flutter/material.dart';
import '../models/post.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import '../widgets/skeleton.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';
import 'chat_screen.dart';
import 'post_detail_screen.dart';
import 'profile/my_reviews_screen.dart';
import 'profile/user_profile_screen.dart';
import 'package:provider/provider.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _hasError = false; });
    try {
      final data = await ApiService.getNotifications();
      if (!mounted) return;
      setState(() { _notifications = data; _isLoading = false; });
    } catch (e) {
      debugPrint('❌ NotificationsScreen._load error: $e');
      if (!mounted) return;
      setState(() { _isLoading = false; _hasError = true; });
    }
  }

  Future<void> _navigateToTarget(Map n) async {
    final dataStr = n['data']?.toString();
    final type = n['type']?.toString() ?? '';

    Map data = {};
    if (dataStr != null && dataStr.isNotEmpty) {
      try { data = jsonDecode(dataStr) as Map; } catch (_) {}
    }

    final roomId = data['roomId']?.toString();
    final postId = data['postId']?.toString();
    final followerId = data['followerId']?.toString();

    if (!mounted) return;

    if (type == 'chat' && roomId != null && roomId.isNotEmpty) {
      await _openChat(roomId);
      return;
    }
    if (type == 'review' || type == 'transaction_completed') {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const MyReviewsScreen()));
      return;
    }
    if (type == 'follow' && followerId != null && followerId.isNotEmpty) {
      Navigator.push(context, MaterialPageRoute(
        builder: (_) => UserProfileScreen(userId: followerId),
      ));
      return;
    }
    if (postId != null && postId.isNotEmpty) {
      await _openPost(postId);
    }
  }

  Future<void> _openPost(String postId) async {
    final data = await ApiService.getPostById(postId);
    if (!mounted || data == null) return;
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => PostDetailScreen(
        post: Post.fromJson(data),
        isFavorite: false,
        onToggleFavorite: () async {},
      ),
    ));
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
      case 'transaction_completed': return Icons.handshake_rounded;
      case 'chat':           return Icons.chat_bubble_rounded;
      case 'review':         return Icons.star_rounded;
      case 'follow':         return Icons.person_add_rounded;
      case 'favorite':       return Icons.favorite_rounded;
      case 'new_post':       return Icons.article_rounded;
      case 'post_reminder':  return Icons.edit_note_rounded;
      case 'welcome':        return Icons.waving_hand_rounded;
      case 'daily_digest':   return Icons.newspaper_rounded;
      default:               return Icons.notifications_rounded;
    }
  }

  Color _colorFor(String type) {
    switch (type) {
      case 'transaction_completed': return AppTheme.success;
      case 'chat':           return AppTheme.primary;
      case 'review':         return AppTheme.warning;
      case 'follow':         return const Color(0xFF9C27B0);
      case 'favorite':       return const Color(0xFFE91E63);
      case 'new_post':       return const Color(0xFF2196F3);
      case 'post_reminder':  return AppTheme.warning;
      case 'welcome':        return AppTheme.primary;
      case 'daily_digest':   return const Color(0xFF2196F3);
      default:               return AppTheme.textSecondary;
    }
  }

  String _timeAgo(String createdAt) {
    final dt = DateTime.tryParse(createdAt)?.toLocal();
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  String _dateLabel(String createdAt) {
    final dt = DateTime.tryParse(createdAt)?.toLocal();
    if (dt == null) return 'Trước đó';
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final d = DateTime(dt.year, dt.month, dt.day);
    if (d == today) return 'Hôm nay';
    if (d == today.subtract(const Duration(days: 1))) return 'Hôm qua';
    if (today.difference(d).inDays < 7) return 'Tuần này';
    return 'Trước đó';
  }

  List<dynamic> _buildGroupedList() {
    final result = <dynamic>[];
    String? lastLabel;
    for (final n in _notifications) {
      final label = _dateLabel(n['createdAt']?.toString() ?? '');
      if (label != lastLabel) {
        result.add(label);
        lastLabel = label;
      }
      result.add(n);
    }
    return result;
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
                  for (final n in _notifications) {
                    n['isRead'] = true;
                  }
                });
                if (mounted) context.read<NotificationProvider>().clearBadge();
              },
              child: const Text('Đọc tất cả', style: TextStyle(color: AppTheme.primary)),
            ),
        ],
      ),
      body: _isLoading
          ? const NotificationListSkeleton()
          : _hasError
              ? ErrorState(
                  icon: Icons.wifi_off,
                  message: 'Không tải được thông báo',
                  subMessage: 'Mạng yếu hoặc server tạm gián đoạn. Thử lại nhé.',
                  onRetry: _load,
                )
              : _notifications.isEmpty
              ? const EmptyState(
                  icon: Icons.notifications_off_outlined,
                  message: 'Chưa có thông báo nào',
                  subMessage: 'Khi có người tương tác, thông báo sẽ hiện ở đây.',
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: Builder(builder: (_) {
                    final items = _buildGroupedList();
                    return ListView.builder(
                      itemCount: items.length,
                      itemBuilder: (ctx, i) {
                        final item = items[i];

                        if (item is String) {
                          return Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 6),
                            child: Text(item, style: const TextStyle(
                              fontSize: 12, fontWeight: FontWeight.w600,
                              color: AppTheme.textSecondary,
                              letterSpacing: 0.5,
                            )),
                          );
                        }

                        final n = item as Map;
                        final isRead = n['isRead'] == true;
                        final type = n['type']?.toString() ?? 'system';
                        final isLast = i == items.length - 1 || items[i + 1] is String;

                        return Column(children: [
                          _buildNotifItem(n, isRead, type),
                          if (!isLast) const Divider(height: 1, indent: 72),
                        ]);
                      },
                    );
                  }),
                ),
    );
  }

  Widget _buildNotifItem(Map n, bool isRead, String type) {
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
            imageUrl.isNotEmpty
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: SizedBox(width: 48, height: 48, child: AppImage(url: imageUrl)),
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
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(child: Text(
                      n['title'] ?? '',
                      style: TextStyle(
                        fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                        fontSize: 14, color: AppTheme.textPrimary,
                      ),
                    )),
                    if (!isRead)
                      Container(width: 8, height: 8,
                        decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle)),
                  ]),
                  const SizedBox(height: 4),
                  Text(n['body'] ?? '',
                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 6),
                  Text(_timeAgo(n['createdAt'] ?? ''),
                    style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
