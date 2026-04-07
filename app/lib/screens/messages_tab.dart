import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import 'chat_screen.dart';
import 'auth/login_screen.dart';

class MessagesTab extends StatefulWidget {
  const MessagesTab({super.key});

  @override
  State<MessagesTab> createState() => _MessagesTabState();
}

class _MessagesTabState extends State<MessagesTab> {
  List<dynamic> _rooms = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRooms();
  }

  Future<void> _loadRooms() async {
    setState(() => _isLoading = true);
    final rooms = await ApiService.getMyRooms();
    if (!mounted) return;
    setState(() { _rooms = rooms; _isLoading = false; });
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
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen())),
            child: const Text('Đăng nhập'),
          ),
        ])),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Tin nhắn')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _rooms.isEmpty
              ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.chat_bubble_outline, size: 64, color: AppTheme.border),
                  SizedBox(height: 12),
                  Text('Chưa có cuộc trò chuyện nào', style: TextStyle(color: AppTheme.textSecondary)),
                ]))
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
                      final lastMsg = msgs.isNotEmpty ? msgs[0]['text'] ?? '' : 'Bắt đầu cuộc trò chuyện';
                      final post = room['post'] as Map? ?? {};
                      final postTitle = post['title']?.toString() ?? '';
                      final postImageLabel = post['imageLabel']?.toString() ?? '';

                      return InkWell(
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => ChatScreen(
                            roomId: room['id'],
                            otherUserName: other?['name'] ?? 'Người dùng',
                            postTitle: postTitle,
                            postImageLabel: postImageLabel,
                          )),
                        ).then((_) => _loadRooms()),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          child: Row(children: [
                            // Avatar người chat
                            CircleAvatar(
                              radius: 24,
                              backgroundColor: AppTheme.primaryLight,
                              child: const Icon(Icons.person, color: AppTheme.primary),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              // Tên người chat
                              Text(other?['name'] ?? 'Người dùng',
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                              const SizedBox(height: 2),
                              // Tin nhắn cuối
                              Text(lastMsg, maxLines: 1, overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
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
                                            ? '${ApiService.baseUrl}/uploads/$postImageLabel'
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
