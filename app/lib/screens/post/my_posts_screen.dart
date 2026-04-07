import 'package:flutter/material.dart';
import '../../models/post.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import 'edit_post_screen.dart';

class MyPostsScreen extends StatefulWidget {
  const MyPostsScreen({super.key});

  @override
  State<MyPostsScreen> createState() => _MyPostsScreenState();
}

class _MyPostsScreenState extends State<MyPostsScreen> {
  List<Post> _posts = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final data = await ApiService.getMyPosts();
      if (!mounted) return;
      setState(() {
        _posts = data.map((j) => Post.fromJson(j)).toList();
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = 'Không tải được danh sách'; _isLoading = false; });
    }
  }

  Future<void> _deletePost(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xóa bài đăng'),
        content: const Text('Bài đăng sẽ bị xóa vĩnh viễn. Tiếp tục?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Hủy')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Xóa', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    final ok = await ApiService.deletePost(id);
    if (!mounted) return;
    if (ok) {
      setState(() => _posts.removeWhere((p) => p.id == id));
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Đã xóa bài đăng'),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Tin đăng của tôi')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error != null
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.wifi_off, size: 48, color: AppTheme.textSecondary),
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 16),
                  OutlinedButton(onPressed: _loadPosts, child: const Text('Thử lại')),
                ]))
              : _posts.isEmpty
                  ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.inbox_outlined, size: 64, color: AppTheme.border),
                      SizedBox(height: 12),
                      Text('Bạn chưa đăng tin nào', style: TextStyle(color: AppTheme.textSecondary)),
                    ]))
                  : RefreshIndicator(
                      onRefresh: _loadPosts,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _posts.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) => _PostItem(
                          post: _posts[i],
                          onDelete: () => _deletePost(_posts[i].id),
                          onEdit: () async {
                            final updated = await Navigator.push<bool>(ctx, MaterialPageRoute(
                              builder: (_) => EditPostScreen(post: _posts[i]),
                            ));
                            if (updated == true) _loadPosts();
                          },
                        ),
                      ),
                    ),
    );
  }
}

class _PostItem extends StatelessWidget {
  final Post post;
  final VoidCallback onDelete;
  final VoidCallback onEdit;
  const _PostItem({required this.post, required this.onDelete, required this.onEdit});

  @override
  Widget build(BuildContext context) {
    Color statusColor = post.status == 'available' ? AppTheme.success : post.status == 'reserved' ? AppTheme.warning : AppTheme.textSecondary;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 72, height: 72,
              child: post.imageLabel.isNotEmpty
                  ? Image.network(
                      '${ApiService.baseUrl}/uploads/${post.imageLabel}',
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(color: AppTheme.border, child: const Icon(Icons.image_outlined, color: AppTheme.textSecondary)),
                    )
                  : Container(color: AppTheme.border, child: const Icon(Icons.image_outlined, color: AppTheme.textSecondary)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(post.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 4),
                Text(post.displayPrice, style: TextStyle(
                  color: post.price == 0 ? AppTheme.success : AppTheme.textPrimary,
                  fontWeight: FontWeight.bold, fontSize: 14,
                )),
                const SizedBox(height: 4),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                  child: Text(post.statusLabel, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            onSelected: (val) {
              if (val == 'edit') onEdit();
              if (val == 'delete') onDelete();
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'edit', child: Row(children: [
                Icon(Icons.edit_outlined, color: AppTheme.primary, size: 18),
                SizedBox(width: 8),
                Text('Sửa'),
              ])),
              const PopupMenuItem(value: 'delete', child: Row(children: [
                Icon(Icons.delete_outline, color: AppTheme.error, size: 18),
                SizedBox(width: 8),
                Text('Xóa', style: TextStyle(color: AppTheme.error)),
              ])),
            ],
          ),
        ],
      ),
    );
  }
}
