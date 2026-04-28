import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:photo_view/photo_view.dart';
import 'package:photo_view/photo_view_gallery.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/post.dart';
import '../services/api_service.dart';
import '../services/analytics.dart';
import '../services/viewed_posts_service.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import '../widgets/follow_button.dart';
import '../widgets/post_card.dart';
import 'chat_screen.dart';
import 'auth/phone_login_screen.dart';
import 'profile/user_profile_screen.dart';

class PostDetailScreen extends StatefulWidget {
  final Post post;
  final bool isFavorite;
  final Future<void> Function() onToggleFavorite;

  const PostDetailScreen({
    super.key,
    required this.post,
    required this.isFavorite,
    required this.onToggleFavorite,
  });

  @override
  State<PostDetailScreen> createState() => _PostDetailScreenState();
}

class _PostDetailScreenState extends State<PostDetailScreen> {
  late bool localIsFavorite;
  bool isUpdatingFavorite = false;
  bool _isChatLoading = false;
  bool _isDealLoading = false;
  int _currentImageIndex = 0;
  late Post _post;
  List<Post> _similarPosts = [];
  bool _similarLoading = true;
  List<Post> _sellerPosts = [];
  bool _sellerPostsLoading = true;
  final Set<String> _selectedExtraPostIds = {};
  bool _isFollowingSeller = false;
  bool _followSellerLoading = false;

  @override
  void initState() {
    super.initState();
    _post = widget.post;
    localIsFavorite = widget.isFavorite;
    _checkFavoriteStatus();
    ViewedPostsService.save(widget.post);
    Analytics.postView(postId: widget.post.id);
    _fetchLatestPost();
    _loadSimilarPosts();
    _loadSellerPosts();
    _checkFollowStatus();
  }

  Future<void> _checkFollowStatus() async {
    if (_post.authorId == null) return;
    final isFollowing = await ApiService.getFollowStatus(_post.authorId!);
    if (mounted) setState(() => _isFollowingSeller = isFollowing);
  }

  Future<void> _toggleFollowSeller() async {
    if (_followSellerLoading || _post.authorId == null) return;
    setState(() => _followSellerLoading = true);
    final success = _isFollowingSeller
        ? await ApiService.unfollowUser(_post.authorId!)
        : await ApiService.followUser(_post.authorId!);
    if (mounted && success) {
      setState(() => _isFollowingSeller = !_isFollowingSeller);
      // Track chỉ khi follow (không track unfollow để giảm noise)
      if (_isFollowingSeller && _post.authorId != null) {
        Analytics.followUser(targetUserId: _post.authorId!);
      }
    }
    if (mounted) setState(() => _followSellerLoading = false);
  }

  Future<void> _loadSellerPosts() async {
    if (widget.post.authorId == null) {
      setState(() => _sellerPostsLoading = false);
      return;
    }
    try {
      final data = await ApiService.getUserPosts(widget.post.authorId!);
      if (!mounted) return;
      setState(() {
        _sellerPosts = data
            .map((j) => Post.fromJson(j))
            .where((p) => p.id != widget.post.id)
            .toList();
        _sellerPostsLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _sellerPostsLoading = false);
    }
  }

  Future<void> _loadSimilarPosts() async {
    try {
      final data = await ApiService.getSimilarPosts(
        widget.post.id,
        category: widget.post.itemCategory,
        province: widget.post.province,
      );
      if (!mounted) return;
      setState(() {
        _similarPosts = data.map((j) => Post.fromJson(j)).toList();
        _similarLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _similarLoading = false);
    }
  }

  Future<void> _fetchLatestPost() async {
    try {
      final data = await ApiService.getPostById(widget.post.id);
      if (!mounted || data == null) return;
      setState(() => _post = Post.fromJson(data));
    } catch (e) {
      debugPrint('❌ PostDetailScreen._fetchLatestPost: $e');
    }
  }

  Future<void> _checkFavoriteStatus() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth || auth.userId == null) return;
    final favs = await ApiService.getFavorites(auth.userId!);
    if (!mounted) return;
    final isFav = favs.any((f) {
      final id = f['postId']?.toString() ?? f['post']?['id']?.toString();
      return id == _post.id;
    });
    if (isFav != localIsFavorite) setState(() => localIsFavorite = isFav);
  }

  Future<void> _openChat() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const PhoneLoginScreen()));
      return;
    }
    if (_post.authorId == null) return;
    if (_post.authorId == auth.userId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đây là bài đăng của bạn'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isChatLoading = true);
    final extraPostsList = _selectedExtraPostIds
        .map((id) {
          try { return _sellerPosts.firstWhere((p) => p.id == id); } catch (_) { return null; }
        })
        .where((p) => p != null)
        .map((p) => {'id': p!.id, 'title': p.title})
        .toList();
    final room = await ApiService.getOrCreateRoom(
      _post.id,
      _post.authorId!,
      postTitle: _post.title,
      extraPosts: extraPostsList.isNotEmpty ? extraPostsList : null,
    );
    if (!mounted) return;
    setState(() => _isChatLoading = false);

    if (room == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể mở chat'), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating),
      );
      return;
    }

    Navigator.push(context, MaterialPageRoute(
      builder: (_) => ChatScreen(
        roomId: room['id'],
        otherUserName: _post.authorName ?? 'Người đăng',
        postTitle: _post.title,
        postImageLabel: _post.imageLabel,
        postId: _post.id,
        listingType: _post.listingType,
      ),
    ));
  }

  // Chuẩn hóa URL ảnh chống lỗi
  String _getCleanImageUrl(String rawPath) {
    if (rawPath.isEmpty) return "";
    if (rawPath.startsWith('http')) return rawPath;
    String cleanPath = rawPath.startsWith('uploads/') ? rawPath.substring(8) : rawPath;
    return "${ApiService.baseUrl}/uploads/$cleanPath".replaceAll('//', '/').replaceFirst(':/', '://');
  }

  void _openFullscreen(List<String> images, int initialIndex) {
    Navigator.push(context, MaterialPageRoute(
      fullscreenDialog: true,
      builder: (_) => _FullscreenImageViewer(images: images, initialIndex: initialIndex),
    ));
  }

  Widget _buildImagePlaceholder() {
    return Container(
      color: AppTheme.background,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.image_not_supported, size: 60, color: AppTheme.border),
          const SizedBox(height: 12),
          Text(
            _post.itemCategoryLabel,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  void _showBlockDialog(BuildContext context) {
    final authorName = _post.authorName ?? 'người này';
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Chặn người dùng'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bài đăng của $authorName sẽ không hiển thị với bạn nữa. Bạn có chắc không?'),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: OutlinedButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Hủy'),
            )),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: TextButton(
              style: TextButton.styleFrom(foregroundColor: AppTheme.error),
              onPressed: () async {
                Navigator.pop(context);
                if (_post.authorId == null) return;
                final ok = await ApiService.blockUser(_post.authorId!);
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  content: Text(ok ? 'Đã chặn $authorName' : 'Có lỗi xảy ra'),
                  backgroundColor: ok ? AppTheme.success : AppTheme.error,
                  behavior: SnackBarBehavior.floating,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ));
                if (ok && mounted) Navigator.pop(context);
              },
              child: const Text('Chặn người này'),
            )),
          ],
        ),
      ),
    );
  }

  Future<void> _submitReport(String reason) async {
    try {
      final ok = await ApiService.reportPost(postId: _post.id, reason: reason);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(ok ? 'Đã gửi báo cáo. Cảm ơn bạn!' : 'Gửi báo cáo thất bại, thử lại sau'),
        backgroundColor: ok ? AppTheme.success : AppTheme.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ));
    } catch (e) {
      debugPrint('❌ _submitReport error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Có lỗi xảy ra, thử lại sau'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  void _showCustomReasonDialog() {
    final ctrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Mô tả vấn đề'),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Hãy mô tả ngắn gọn vấn đề bạn gặp phải với bài đăng này.',
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
              const SizedBox(height: 12),
              TextFormField(
                controller: ctrl,
                autofocus: true,
                maxLines: 3,
                maxLength: 200,
                decoration: const InputDecoration(hintText: 'Nhập lý do báo cáo...'),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập lý do' : null,
              ),
              const SizedBox(height: 12),
              SizedBox(width: double.infinity, child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white),
                onPressed: () {
                  if (!formKey.currentState!.validate()) return;
                  Navigator.pop(context);
                  _submitReport('Lý do khác: ${ctrl.text.trim()}');
                },
                child: const Text('Gửi báo cáo'),
              )),
              const SizedBox(height: 8),
              SizedBox(width: double.infinity, child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Hủy'),
              )),
            ],
          ),
        ),
      ),
    );
  }

  void _showReportBottomSheet(BuildContext context) {
    const reasons = [
      ('Spam', Icons.mark_email_unread_outlined),
      ('Lừa đảo', Icons.warning_amber_outlined),
      ('Sai nội dung', Icons.edit_off_outlined),
      ('Hình ảnh không phù hợp', Icons.no_photography_outlined),
      ('Lý do khác', Icons.more_horiz_outlined),
    ];

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 12),
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            const Text('Báo cáo bài đăng', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            const Text('Chọn lý do báo cáo', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
            const SizedBox(height: 8),
            ...reasons.map((r) => ListTile(
              leading: Icon(r.$2, color: AppTheme.error, size: 22),
              title: Text(r.$1),
              onTap: () async {
                Navigator.pop(context);
                if (r.$1 == 'Lý do khác') {
                  _showCustomReasonDialog();
                  return;
                }
                _submitReport(r.$1);
              },
            )),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> handleFavoriteTap() async {
    if (isUpdatingFavorite) return;
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth || auth.userId == null) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const PhoneLoginScreen()));
      return;
    }
    final oldValue = localIsFavorite;
    setState(() {
      isUpdatingFavorite = true;
      localIsFavorite = !localIsFavorite;
    });
    try {
      if (oldValue) {
        await ApiService.removeFavorite(auth.userId!, _post.id);
      } else {
        await ApiService.addFavorite(auth.userId!, _post.id);
      }
      // Notify parent list to refresh (no-op callbacks are fine here)
      await widget.onToggleFavorite();
    } catch (_) {
      if (mounted) {
        setState(() => localIsFavorite = oldValue);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Không thể cập nhật tin đã lưu')));
      }
    }
    if (mounted) setState(() => isUpdatingFavorite = false);
  }

  Future<void> _requestDeal() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const PhoneLoginScreen()));
      return;
    }

    // Bắt buộc nhập lời nhắn
    final msgCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(_post.listingType == 'give' ? 'Tôi muốn nhận' : 'Tôi quan tâm'),
        content: SingleChildScrollView(
          child: Form(
          key: formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(_post.title,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(
              _post.listingType == 'give'
                  ? 'Hãy nhắn một lời để người đăng biết bạn muốn nhận nhé!'
                  : 'Hãy nhắn một lời để người bán biết bạn quan tâm nhé!',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: msgCtrl,
              autofocus: true,
              decoration: InputDecoration(
                hintText: _post.listingType == 'give'
                    ? 'VD: Chào bạn, mình muốn nhận món này...'
                    : 'VD: Chào bạn, mình quan tâm đến món này...',
                border: const OutlineInputBorder(),
              ),
              maxLines: 3,
              maxLength: 200,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập lời nhắn' : null,
            ),
          ]),
        ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Huỷ')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
            onPressed: () {
              if (formKey.currentState!.validate()) Navigator.pop(context, true);
            },
            child: const Text('Gửi yêu cầu', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (confirm != true) return;

    setState(() => _isDealLoading = true);
    final result = await ApiService.createDeal(_post.id, message: msgCtrl.text.trim());
    if (!mounted) return;
    setState(() => _isDealLoading = false);

    if (result != null) {
      Analytics.dealCreate(postId: _post.id);
      final roomId = result['roomId']?.toString();
      if (roomId != null && mounted) {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(
            roomId: roomId,
            otherUserName: _post.authorName ?? 'Người đăng',
            postTitle: _post.title,
            postImageLabel: _post.imageLabel,
            postId: _post.id,
          ),
        ));
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Không thể gửi yêu cầu. Bạn có thể đã gửi rồi.'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  Widget _buildBottomBar(AuthProvider auth) {
    final isOwn = auth.isAuth && auth.userId == _post.authorId;
    final isAvailable = _post.status == 'available';
    final isDone = _post.status == 'done';
    final isGive = _post.listingType == 'give';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: isOwn
            ? ElevatedButton.icon(
                onPressed: null,
                icon: const Icon(Icons.storefront_outlined),
                label: const Text('Đây là bài đăng của bạn', style: TextStyle(fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.border,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              )
            : isDone
            ? ElevatedButton.icon(
                onPressed: null,
                icon: const Icon(Icons.check_circle_outline),
                label: const Text('Đã trao tặng', style: TextStyle(fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.border,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              )
            // Bài cho tặng còn hàng → chỉ nút Nhắn tin (deal flow diễn ra trong chat)
            : isGive && isAvailable
            ? ElevatedButton.icon(
                onPressed: _isChatLoading ? null : _openChat,
                icon: _isChatLoading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.chat_outlined, size: 18, color: Colors.white),
                label: const Text('Nhắn tin', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              )
            // Bài bán hoặc đã được đặt → chỉ nút Nhắn tin
            : ElevatedButton.icon(
                onPressed: _isChatLoading ? null : _openChat,
                icon: _isChatLoading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.chat_outlined, size: 18, color: Colors.white),
                label: Text(
                  _selectedExtraPostIds.isEmpty
                      ? 'Nhắn tin'
                      : 'Nhắn tin (${_selectedExtraPostIds.length + 1} sản phẩm)',
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    // Thu thập toàn bộ ảnh hợp lệ
    List<String> validImages = [];
    if (_post.images != null && _post.images!.isNotEmpty) {
      validImages = _post.images!.map((e) => _getCleanImageUrl(e)).where((e) => e.isNotEmpty).toList();
    } else if (_post.imageUrl != null && _post.imageUrl!.isNotEmpty) {
      validImages.add(_getCleanImageUrl(_post.imageUrl!));
    } else if (_post.imageLabel.isNotEmpty) {
      validImages.add(ApiService.buildImageUrl(_post.imageLabel));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Chi tiết', style: TextStyle(fontSize: 18)),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Colors.black87),
            onPressed: () {
              final price = PostCard.formatPrice(_post.price, _post.listingType);
              final text = '${_post.title}\n$price\n\nTìm thấy trên Trao Tay!';
              Share.share(text, subject: _post.title);
            },
          ),
          FavoriteButton(
            isFavorite: localIsFavorite,
            onTap: isUpdatingFavorite ? () {} : handleFavoriteTap,
            iconSize: 22,
            buttonSize: 38,
          ),
          if (auth.userId != _post.authorId)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: Colors.black87),
              onSelected: (value) {
                if (value == 'report') _showReportBottomSheet(context);
                if (value == 'block') _showBlockDialog(context);
              },
              itemBuilder: (_) => const [
                PopupMenuItem(value: 'report', child: Row(children: [
                  Icon(Icons.flag_outlined, size: 18, color: Colors.orange),
                  SizedBox(width: 10),
                  Text('Báo cáo bài đăng'),
                ])),
                PopupMenuItem(value: 'block', child: Row(children: [
                  Icon(Icons.block, size: 18, color: Colors.red),
                  SizedBox(width: 10),
                  Text('Chặn người này'),
                ])),
              ],
            ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.only(bottom: 100), // Khoảng trống cho nút Chat
        children: [
          // 0. BOOST BANNER (Plus/VIP)
          if (_post.effectiveTier >= 2) _BoostBanner(tier: _post.effectiveTier),

          // 1. SLIDER ẢNH — VIP có khung vàng
          Container(
            decoration: _post.effectiveTier == 3
                ? const BoxDecoration(
                    border: Border(
                      top: BorderSide(color: Color(0xFFC9A84A), width: 2),
                      bottom: BorderSide(color: Color(0xFFC9A84A), width: 2),
                    ),
                  )
                : null,
            child: SizedBox(
              height: 300,
              child: validImages.isEmpty
                ? _buildImagePlaceholder()
                : Stack(
              children: [
                PageView.builder(
                  itemCount: validImages.length,
                  onPageChanged: (index) => setState(() => _currentImageIndex = index),
                  itemBuilder: (context, index) {
                    return GestureDetector(
                      onTap: () => _openFullscreen(validImages, index),
                      child: AppImage(
                        url: validImages[index],
                        width: double.infinity,
                      ),
                    );
                  },
                ),
                // Chỉ báo số trang (VD: 1/3)
                if (validImages.length > 1)
                  Positioned(
                    bottom: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: Colors.black.withOpacity(0.6), borderRadius: BorderRadius.circular(12)),
                      child: Text('${_currentImageIndex + 1}/${validImages.length}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ),
                // Icon zoom góc dưới trái
                Positioned(
                  bottom: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.4),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.zoom_in, color: Colors.white, size: 18),
                  ),
                ),
              ],
            ),
            ),
          ),

          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 2. THÔNG TIN CƠ BẢN
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: Text(_post.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 1.3))),
                    const SizedBox(width: 8),
                    _StatusBadge(status: _post.status, label: _post.statusLabel),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      PostCard.formatPrice(_post.price, _post.listingType),
                      style: TextStyle(fontSize: 22, color: (_post.listingType == 'give' || _post.price == 0) ? AppTheme.freeColor : AppTheme.priceColor, fontWeight: FontWeight.bold),
                    ),
                    if (_post.priceUnit != null && _post.priceUnit!.isNotEmpty && _post.priceUnitLabel.isNotEmpty)
                      Text(
                        _post.priceUnitLabel,
                        style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary, fontWeight: FontWeight.w500),
                      ),
                  ],
                ),
                // BĐS: subType + area + bedrooms
                if (_post.isRealestate) ...[
                  const SizedBox(height: 8),
                  Wrap(spacing: 8, runSpacing: 6, children: [
                    if (_post.subTypeLabel.isNotEmpty)
                      _InfoChip(label: _post.subTypeLabel, icon: Icons.home_outlined, color: AppTheme.primary),
                    if (_post.area != null)
                      _InfoChip(label: '${_post.area!.toStringAsFixed(0)} m²', icon: Icons.straighten_outlined, color: AppTheme.textSecondary),
                    if (_post.bedrooms != null)
                      _InfoChip(
                        label: _post.bedrooms == 0 ? 'Studio' : '${_post.bedrooms} phòng ngủ',
                        icon: Icons.bed_outlined,
                        color: AppTheme.textSecondary,
                      ),
                  ]),
                ],
                // Dịch vụ: serviceArea
                if (_post.isService && _post.serviceArea != null && _post.serviceArea!.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Row(children: [
                    const Icon(Icons.place_outlined, size: 14, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(child: Text('Phạm vi: ${_post.serviceArea}', style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
                  ]),
                ],
                // Việc làm: job type + công ty + lương
                if (_post.isJob) ...[
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, runSpacing: 8, children: [
                    if (_post.subTypeLabel.isNotEmpty)
                      _InfoChip(label: _post.subTypeLabel, icon: Icons.work_outline, color: const Color(0xFF5C6BC0)),
                    if (_post.priceUnitLabel.isNotEmpty || _post.price > 0)
                      _InfoChip(
                        label: _post.price == 0 ? 'Thỏa thuận' : '${PostCard.formatPrice(_post.price, 'sell')}${_post.priceUnitLabel}',
                        icon: Icons.payments_outlined,
                        color: AppTheme.primary,
                      ),
                  ]),
                  if (_post.companyName != null && _post.companyName!.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Row(children: [
                      const Icon(Icons.business_outlined, size: 14, color: AppTheme.textSecondary),
                      const SizedBox(width: 4),
                      Expanded(child: Text(_post.companyName!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
                    ]),
                  ],
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        _post.formattedDateTime.isNotEmpty ? _post.formattedDateTime : '—',
                        style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 16),
                    const Icon(Icons.visibility_outlined, size: 13, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      '${_post.viewCount} lượt xem',
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(color: AppTheme.background, thickness: 2),

                // 3. THÔNG TIN GIAO DỊCH CHUẨN JIMOTY
                const SizedBox(height: 16),
                const Text('Khu vực giao dịch', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.location_on, color: Colors.grey, size: 20),
                    const SizedBox(width: 6),
                    Expanded(child: Text(_post.fullAddress, style: const TextStyle(fontSize: 15, color: Colors.black87))),
                  ],
                ),
                const SizedBox(height: 12),
                if (_post.latitude != 0.0 && _post.longitude != 0.0)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      height: 160,
                      child: FlutterMap(
                        options: MapOptions(
                          initialCenter: LatLng(_post.latitude, _post.longitude),
                          initialZoom: 15,
                          interactionOptions: const InteractionOptions(flags: InteractiveFlag.none),
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'vn.traotay.app',
                          ),
                          MarkerLayer(markers: [
                            Marker(
                              point: LatLng(_post.latitude, _post.longitude),
                              child: const Icon(Icons.location_pin, color: Colors.red, size: 36),
                            ),
                          ]),
                        ],
                      ),
                    ),
                  ),

                const SizedBox(height: 16),
                const Divider(color: AppTheme.background, thickness: 2),

                // 4. MÔ TẢ
                const SizedBox(height: 16),
                const Text('Mô tả chi tiết', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(_post.description.isEmpty ? 'Chưa có mô tả' : _post.description, style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87)),

                const SizedBox(height: 16),
                const Divider(color: AppTheme.background, thickness: 2),

                // 5. THÔNG TIN NGƯỜI ĐĂNG (SELLER PROFILE)
                const SizedBox(height: 16),
                const Text('Người đăng', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: _post.authorId != null
                      ? () => Navigator.push(context, MaterialPageRoute(
                            builder: (_) => UserProfileScreen(
                              userId: _post.authorId!,
                              userName: _post.authorName,
                            ),
                          ))
                      : null,
                  child: Row(
                    children: [
                      Builder(builder: (_) {
                        final raw = _post.authorAvatar;
                        final avatarUrl = (raw != null && raw.isNotEmpty)
                            ? (raw.startsWith('http') ? raw : '${ApiService.baseUrl}/$raw')
                            : null;
                        final initials = (_post.authorName ?? 'U')[0].toUpperCase();
                        return Container(
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: AppTheme.primaryLight,
                          ),
                          child: ClipOval(
                            child: avatarUrl != null
                                ? CachedNetworkImage(
                                    imageUrl: avatarUrl,
                                    fit: BoxFit.cover,
                                    errorWidget: (_, __, ___) => Center(
                                      child: Text(initials,
                                        style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                                    ),
                                  )
                                : Center(
                                    child: Text(initials,
                                      style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold)),
                                  ),
                          ),
                        );
                      }),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(_post.authorName ?? 'Người đăng',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const Text('Xem trang cá nhân →',
                              style: TextStyle(fontSize: 12, color: AppTheme.primary)),
                        ]),
                      ),
                      if (_post.authorId != null)
                        FollowButton(
                          isFollowing: _isFollowingSeller,
                          loading: _followSellerLoading,
                          onTap: _toggleFollowSeller,
                          style: FollowButtonStyle.compact,
                        ),
                      const SizedBox(width: 4),
                      Icon(Icons.chevron_right, color: Colors.grey.shade400),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 7. BÀI ĐĂNG KHÁC CỦA NGƯỜI NÀY
          if (_sellerPostsLoading || _sellerPosts.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(0, 0, 0, 4),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 0, 16, 0),
                    child: Divider(color: AppTheme.background, thickness: 2),
                  ),
                  const SizedBox(height: 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            'Bài đăng khác của ${_post.authorName ?? 'người này'}',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (_sellerPosts.length > 3 && _post.authorId != null)
                          GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(
                              builder: (_) => UserProfileScreen(
                                userId: _post.authorId!,
                                userName: _post.authorName,
                              ),
                            )),
                            child: const Text('Xem tất cả', style: TextStyle(
                              fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w500,
                            )),
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (_sellerPostsLoading)
                    const Padding(
                      padding: EdgeInsets.all(16),
                      child: Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2)),
                    )
                  else
                    SizedBox(
                      height: 200,
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: _sellerPosts.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (ctx, i) {
                          final p = _sellerPosts[i];
                          final isSelected = _selectedExtraPostIds.contains(p.id);
                          return GestureDetector(
                            onTap: () => Navigator.push(ctx, MaterialPageRoute(
                              builder: (_) => PostDetailScreen(
                                post: p,
                                isFavorite: false,
                                onToggleFavorite: () async {},
                              ),
                            )),
                            child: Stack(
                              children: [
                                Container(
                                  width: 140,
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(10),
                                    border: Border.all(
                                      color: isSelected ? AppTheme.primary : AppTheme.border,
                                      width: isSelected ? 2 : 1,
                                    ),
                                  ),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      ClipRRect(
                                        borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                                        child: AppImage(
                                          url: p.imageLabel.isNotEmpty
                                              ? ApiService.buildImageUrl(p.imageLabel)
                                              : (p.images != null && p.images!.isNotEmpty ? p.images!.first : ''),
                                          width: 140,
                                          height: 100,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.all(8),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(p.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                                                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, height: 1.3)),
                                            const SizedBox(height: 4),
                                            Text(
                                              p.displayPrice,
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                color: p.price == 0 ? AppTheme.freeColor : AppTheme.priceColor,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Checkbox góc trên phải — luôn hiển thị
                                Positioned(
                                  top: 6,
                                  right: 6,
                                  child: GestureDetector(
                                    onTap: () => setState(() {
                                      if (isSelected) {
                                        _selectedExtraPostIds.remove(p.id);
                                      } else {
                                        _selectedExtraPostIds.add(p.id);
                                      }
                                    }),
                                    child: Container(
                                      width: 28,
                                      height: 28,
                                      decoration: BoxDecoration(
                                        color: isSelected ? AppTheme.primary : Colors.white,
                                        shape: BoxShape.circle,
                                        border: Border.all(
                                          color: isSelected ? AppTheme.primary : AppTheme.border,
                                          width: 2,
                                        ),
                                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.2), blurRadius: 4)],
                                      ),
                                      child: isSelected
                                          ? const Icon(Icons.check, color: Colors.white, size: 16)
                                          : null,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 8),
                ],
              ),
            ),

          // 8. BÀI TƯƠNG TỰ
          if (_similarLoading || _similarPosts.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Divider(color: AppTheme.background, thickness: 2),
                  const SizedBox(height: 16),
                  const Text('Bài đăng tương tự', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (_similarLoading)
                    const Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2))
                  else
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 8,
                        mainAxisSpacing: 8,
                        childAspectRatio: 0.60,
                      ),
                      itemCount: _similarPosts.length,
                      itemBuilder: (ctx, i) {
                        final p = _similarPosts[i];
                        return PostCard(
                          post: p,
                          isFavorite: false,
                          onToggleFavorite: () async {},
                          onTap: () => Navigator.pushReplacement(
                            ctx,
                            MaterialPageRoute(builder: (_) => PostDetailScreen(
                              post: p,
                              isFavorite: false,
                              onToggleFavorite: () async {},
                            )),
                          ),
                        );
                      },
                    ),
                ],
              ),
            ),
        ],
      ),
      // 6. NÚT CHAT CỐ ĐỊNH Ở ĐÁY
      bottomSheet: _buildBottomBar(auth),
    );
  }
}

// ── Boost Banner (Plus/VIP) ──────────────────────────────────────────────────

class _BoostBanner extends StatelessWidget {
  final int tier;
  const _BoostBanner({required this.tier});

  @override
  Widget build(BuildContext context) {
    if (tier == 3) {
      // VIP — nền đen-vàng
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF2A2418), Color(0xFF1A1A1A)],
            begin: Alignment.centerLeft, end: Alignment.centerRight,
          ),
        ),
        child: const Row(children: [
          Icon(Icons.workspace_premium, color: Color(0xFFF4D36A), size: 20),
          SizedBox(width: 10),
          Expanded(child: Text(
            'Bài đăng VIP • Ưu tiên hiển thị cao nhất',
            style: TextStyle(color: Color(0xFFF4D36A), fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 0.3),
          )),
        ]),
      );
    }
    // Plus — nền vàng nhạt
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: const BoxDecoration(
        color: Color(0xFFFEF9E7),
        border: Border(bottom: BorderSide(color: Color(0xFFC9A84A), width: 0.5)),
      ),
      child: const Row(children: [
        Icon(Icons.star_rounded, color: Color(0xFFC9A84A), size: 18),
        SizedBox(width: 8),
        Expanded(child: Text(
          'Bài đăng Plus • Được ưu tiên hiển thị',
          style: TextStyle(color: Color(0xFF854F0B), fontSize: 13, fontWeight: FontWeight.w600),
        )),
      ]),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  final String label;
  const _StatusBadge({required this.status, required this.label});

  @override
  Widget build(BuildContext context) {
    final Color color = status == 'available'
        ? AppTheme.success
        : status == 'reserved'
            ? AppTheme.warning
            : AppTheme.textSecondary; // done
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
      child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final Color color;
  const _InfoChip({required this.label, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 13, color: color),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w500)),
      ]),
    );
  }
}

class _FullscreenImageViewer extends StatefulWidget {
  final List<String> images;
  final int initialIndex;
  const _FullscreenImageViewer({required this.images, required this.initialIndex});

  @override
  State<_FullscreenImageViewer> createState() => _FullscreenImageViewerState();
}

class _FullscreenImageViewerState extends State<_FullscreenImageViewer> {
  late int _current;
  late PageController _pageCtrl;

  @override
  void initState() {
    super.initState();
    _current = widget.initialIndex;
    _pageCtrl = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        title: Text(
          '${_current + 1} / ${widget.images.length}',
          style: const TextStyle(color: Colors.white, fontSize: 16),
        ),
        centerTitle: true,
      ),
      body: PhotoViewGallery.builder(
        pageController: _pageCtrl,
        itemCount: widget.images.length,
        onPageChanged: (i) => setState(() => _current = i),
        scrollPhysics: const BouncingScrollPhysics(),
        builder: (context, index) => PhotoViewGalleryPageOptions(
          imageProvider: NetworkImage(widget.images[index]),
          minScale: PhotoViewComputedScale.contained,
          maxScale: PhotoViewComputedScale.covered * 3,
          errorBuilder: (_, __, ___) => const Center(
            child: Icon(Icons.broken_image_outlined, color: Colors.white54, size: 64),
          ),
        ),
        loadingBuilder: (_, __) => const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      ),
    );
  }
}