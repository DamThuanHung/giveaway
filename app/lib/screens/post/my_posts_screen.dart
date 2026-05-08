import 'package:flutter/material.dart';
import 'package:flutter/services.dart';  // HapticFeedback theo UI_UX_STANDARDS §8.5
import '../../models/post.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_image.dart';
import '../../widgets/skeleton.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/error_state.dart';
import 'bump_package_screen.dart';
import 'edit_post_screen.dart';
import '../post_detail_screen.dart';

// Tier color tokens — khớp với bump_package_screen.dart + post_card.dart
const kGoldDark = Color(0xFFC9A84A);
const kGoldLight = Color(0xFFF4D36A);
const kGoldOrange = Color(0xFFFFA500);

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
      debugPrint('❌ MyPostsScreen._loadPosts error: $e');
      if (!mounted) return;
      setState(() { _error = 'Không tải được danh sách'; _isLoading = false; });
    }
  }

  void _showSnackBar(String msg, {bool isError = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: isError ? AppTheme.error : AppTheme.success,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ));
  }

  Future<void> _bumpPost(String id) async {
    final post = _posts.firstWhere((p) => p.id == id);
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BumpPackageScreen(
          postId: id,
          currentTier: post.effectiveTier,
          onSuccess: _loadPosts,
        ),
      ),
    );
  }

  Future<void> _markStatus(String id, String status) async {
    final ok = await ApiService.updatePostStatus(id, status);
    if (!mounted) return;
    if (ok) {
      setState(() {
        final idx = _posts.indexWhere((p) => p.id == id);
        if (idx != -1) _posts[idx] = _posts[idx].copyWith(status: status);
      });
      _showSnackBar(status == 'done' ? 'Đã đánh dấu hoàn thành' : 'Đã mở lại tin đăng');
    } else {
      _showSnackBar('Không thể cập nhật trạng thái, thử lại sau', isError: true);
    }
  }

  Future<void> _deletePost(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xóa bài đăng'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bài đăng sẽ bị xóa vĩnh viễn. Bạn có chắc không?'),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: OutlinedButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Hủy'),
            )),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Xóa bài đăng'),
            )),
          ],
        ),
      ),
    );
    if (confirm != true) return;
    // Haptic medium impact theo UI_UX_STANDARDS §8.5 — confirm destructive action
    HapticFeedback.mediumImpact();
    final ok = await ApiService.deletePost(id);
    if (!mounted) return;
    if (ok) {
      setState(() => _posts.removeWhere((p) => p.id == id));
      _showSnackBar('Đã xóa bài đăng');
    } else {
      _showSnackBar('Không thể xóa bài đăng, thử lại sau', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Bài đăng của tôi')),
      body: _isLoading
          ? const PostGridSkeleton()
          : _error != null
              ? RefreshIndicator(
                  onRefresh: _loadPosts,
                  child: LayoutBuilder(builder: (ctx, constraints) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: constraints.maxHeight, child: ErrorState(
                      icon: Icons.wifi_off,
                      message: _error!,
                      subMessage: 'Mạng yếu hoặc server tạm gián đoạn. Thử lại nhé.',
                      onRetry: _loadPosts,
                    )),
                  )),
                )
              : _posts.isEmpty
                  ? RefreshIndicator(
                      onRefresh: _loadPosts,
                      child: LayoutBuilder(builder: (ctx, constraints) => SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: SizedBox(height: constraints.maxHeight, child: EmptyState(
                          icon: Icons.inbox_outlined,
                          message: 'Bạn chưa đăng tin nào',
                          subMessage: 'Bắt đầu cho hành trình trao tay đồ cũ — bài đầu tiên thường về người nhanh nhất.',
                          actionLabel: 'Đăng tin ngay',
                          onAction: () => Navigator.pop(context),
                        )),
                      )),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadPosts,
                      child: ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _posts.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (ctx, i) => _PostItem(
                          post: _posts[i],
                          onDelete: () => _deletePost(_posts[i].id),
                          onMarkDone: () => _markStatus(_posts[i].id, 'done'),
                          onMarkAvailable: () => _markStatus(_posts[i].id, 'available'),
                          onBump: () => _bumpPost(_posts[i].id),
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

class _BumpButton extends StatelessWidget {
  final String? countdown;
  final VoidCallback onBump;
  final bool loading;
  const _BumpButton({required this.countdown, required this.onBump, this.loading = false});

  @override
  Widget build(BuildContext context) {
    final canBump = countdown == null && !loading;
    return SizedBox(
      width: double.infinity,
      height: 32,
      child: OutlinedButton.icon(
        onPressed: canBump ? onBump : null,
        icon: loading
            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
            : Icon(Icons.rocket_launch_outlined, size: 14,
                color: canBump ? AppTheme.primary : AppTheme.textSecondary),
        label: Text(
          loading ? 'Đang đẩy...' : (canBump ? 'Đẩy lên đầu' : countdown!),
          style: TextStyle(fontSize: 12,
              color: canBump ? AppTheme.primary : AppTheme.textSecondary),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: canBump ? AppTheme.primary : AppTheme.border),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          padding: const EdgeInsets.symmetric(horizontal: 12),
        ),
      ),
    );
  }
}

class _PostItem extends StatefulWidget {
  final Post post;
  final VoidCallback onDelete;
  final VoidCallback onEdit;
  final VoidCallback onMarkDone;
  final VoidCallback onMarkAvailable;
  final Future<void> Function() onBump;
  const _PostItem({required this.post, required this.onDelete, required this.onEdit, required this.onMarkDone, required this.onMarkAvailable, required this.onBump});

  @override
  State<_PostItem> createState() => _PostItemState();
}

class _PostItemState extends State<_PostItem> {
  bool _bumping = false;

  Future<void> _handleBump() async {
    if (_bumping) return;
    setState(() => _bumping = true);
    await widget.onBump();
    if (mounted) setState(() => _bumping = false);
  }

  Future<void> _checkBoostStatus() async {
    // Hiện dialog loading, gọi API, thay nội dung dialog bằng kết quả.
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AlertDialog(
        content: Row(children: [
          SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2)),
          SizedBox(width: 16),
          Expanded(child: Text('Đang kiểm tra trạng thái...')),
        ]),
      ),
    );

    final status = await ApiService.getBoostStatus(widget.post.id);
    if (!mounted) return;
    Navigator.pop(context); // đóng loading

    if (status['error'] != null) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text('Không kiểm tra được'),
          content: Text(status['error'].toString()),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng'))],
        ),
      );
      return;
    }

    final tier = status['boostTier'] as int? ?? 0;
    final remainingHours = status['remainingHours'] as int?;
    final tierLabel = tier == 3 ? 'VIP' : tier == 2 ? 'Plus' : tier == 1 ? 'Nổi bật (Free)' : 'Không boost';
    final body = tier > 0 && remainingHours != null
        ? 'Bài đang ở tier: $tierLabel\nCòn hiệu lực: $remainingHours giờ'
        : tier > 0
            ? 'Bài đang ở tier: $tierLabel'
            : 'Bài chưa được boost.\nNếu bạn vừa thanh toán mà chưa thấy cập nhật, vui lòng đợi 1-2 phút rồi kiểm tra lại.';

    if (!mounted) return;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Trạng thái boost'),
        content: Text(body),
        actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Đóng'))],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.post;
    Color statusColor = post.status == 'available' ? AppTheme.success : post.status == 'reserved' ? AppTheme.warning : AppTheme.textSecondary;

    final tier = post.effectiveTier;
    // Viền + nền + shadow theo tier. VIP glow mạnh, Plus nhẹ, Free bump xanh, không boost xám.
    final borderColor = tier == 3
        ? kGoldLight
        : tier == 2
            ? kGoldDark
            : tier == 1
                ? AppTheme.primary.withOpacity(0.4)
                : AppTheme.border;
    final borderWidth = tier == 3 ? 2.0 : (tier == 2 ? 1.5 : 1.0);
    final bgColor = tier == 2
        ? const Color(0xFFFFFDF5)
        : Colors.white;
    final shadows = tier == 3
        ? [
            BoxShadow(color: kGoldLight.withOpacity(0.45), blurRadius: 14, spreadRadius: 1),
            BoxShadow(color: kGoldOrange.withOpacity(0.22), blurRadius: 20, spreadRadius: 1),
          ]
        : tier == 2
            ? [BoxShadow(color: kGoldDark.withOpacity(0.15), blurRadius: 6, offset: const Offset(0, 2))]
            : <BoxShadow>[];

    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(
        builder: (_) => PostDetailScreen(
          post: post,
          isFavorite: false,
          onToggleFavorite: () async {},
        ),
      )),
      child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: shadows,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
        Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: SizedBox(
              width: 72, height: 72,
              child: AppImage(
                url: ApiService.buildImageUrl(post.imageLabel),
                fit: BoxFit.cover,
              ),
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
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(color: statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
                      child: Text(post.statusLabel, style: TextStyle(color: statusColor, fontSize: 11, fontWeight: FontWeight.w600)),
                    ),
                    if (tier == 2) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF9E7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('Plus', style: TextStyle(color: Color(0xFF854F0B), fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                    if (tier == 3) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF2A2418),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('VIP', style: TextStyle(color: kGoldLight, fontSize: 11, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          PopupMenuButton<String>(
            onSelected: (val) {
              if (val == 'edit') widget.onEdit();
              if (val == 'delete') widget.onDelete();
              if (val == 'done') widget.onMarkDone();
              if (val == 'available') widget.onMarkAvailable();
              if (val == 'check_status') _checkBoostStatus();
            },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'edit', child: Row(children: [
                Icon(Icons.edit_outlined, color: AppTheme.primary, size: 18),
                SizedBox(width: 8),
                Text('Chỉnh sửa bài đăng'),
              ])),
              const PopupMenuItem(value: 'check_status', child: Row(children: [
                Icon(Icons.verified_outlined, color: kGoldDark, size: 18),
                SizedBox(width: 8),
                Text('Kiểm tra trạng thái boost'),
              ])),
              if (post.status != 'done')
                const PopupMenuItem(value: 'done', child: Row(children: [
                  Icon(Icons.check_circle_outline, color: AppTheme.success, size: 18),
                  SizedBox(width: 8),
                  Text('Đánh dấu đã bán/tặng', style: TextStyle(color: AppTheme.success)),
                ])),
              if (post.status == 'done')
                const PopupMenuItem(value: 'available', child: Row(children: [
                  Icon(Icons.refresh, color: AppTheme.warning, size: 18),
                  SizedBox(width: 8),
                  Text('Mở lại tin đăng', style: TextStyle(color: AppTheme.warning)),
                ])),
              const PopupMenuItem(value: 'delete', child: Row(children: [
                Icon(Icons.delete_outline, color: AppTheme.error, size: 18),
                SizedBox(width: 8),
                Text('Xóa bài đăng', style: TextStyle(color: AppTheme.error)),
              ])),
            ],
          ),
        ],
      ),
        if (post.status == 'available') ...[
          const SizedBox(height: 8),
          _BumpButton(countdown: post.bumpCountdown, onBump: _handleBump, loading: _bumping),
        ],
        ],
      ),
    ),
    );
  }
}
