import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../models/post.dart';
import '../services/api_service.dart';
import '../services/viewed_posts_service.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
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

  @override
  void initState() {
    super.initState();
    _post = widget.post;
    localIsFavorite = widget.isFavorite;
    _checkFavoriteStatus();
    ViewedPostsService.save(widget.post);
    _fetchLatestPost();
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
    final room = await ApiService.getOrCreateRoom(_post.id, _post.authorId!);
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

  Widget _buildImagePlaceholder() {
    return Container(
      color: const Color(0xFFF3F4F6),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.image_not_supported, size: 60, color: Colors.grey),
          const SizedBox(height: 12),
          Text(
            _post.itemCategoryLabel,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)),
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
        content: Text('Bài đăng của $authorName sẽ không hiển thị với bạn nữa. Bạn có chắc không?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () async {
              Navigator.pop(context);
              if (_post.authorId == null) return;
              final ok = await ApiService.blockUser(_post.authorId!);
              if (!mounted) return;
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                content: Text(ok ? 'Đã chặn $authorName' : 'Có lỗi xảy ra'),
                backgroundColor: ok ? AppTheme.success : AppTheme.error,
                behavior: SnackBarBehavior.floating,
              ));
              if (ok) Navigator.pop(context);
            },
            child: const Text('Chặn', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showReportDialog(BuildContext context) {
    String selectedReason = 'Spam';
    showDialog(
      context: context,
      builder: (_) {
        return AlertDialog(
          title: const Text('Báo cáo bài đăng'),
          content: StatefulBuilder(
            builder: (context, setState) {
              return DropdownButton<String>(
                value: selectedReason,
                isExpanded: true,
                items: const [
                  DropdownMenuItem(value: 'Spam', child: Text('Spam')),
                  DropdownMenuItem(value: 'Lừa đảo', child: Text('Lừa đảo')),
                  DropdownMenuItem(value: 'Sai nội dung', child: Text('Sai nội dung')),
                ],
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => selectedReason = value);
                },
              );
            },
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Hủy', style: TextStyle(color: Colors.grey))),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
              onPressed: () async {
                try {
                  await ApiService.reportPost(postId: _post.id, reason: selectedReason);
                  if (context.mounted) {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Đã gửi báo cáo')));
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Gửi báo cáo thất bại')));
                  }
                }
              },
              child: const Text('Gửi', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
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
      final roomId = result['roomId']?.toString();
      if (roomId != null && mounted) {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(
            roomId: roomId,
            otherUserName: _post.authorName ?? 'Người đăng',
            postTitle: _post.title,
            postImageLabel: _post.imageLabel,
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
    final isReserved = _post.status == 'reserved';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
      ),
      child: SafeArea(
        child: isOwn
            // Bài của mình: chỉ hiện nút chat (disabled)
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
            : Row(children: [
                // Nút nhắn tin
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isChatLoading ? null : _openChat,
                    icon: _isChatLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.chat_outlined, size: 18),
                    label: const Text('Nhắn tin'),
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(0, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                // Nút muốn nhận
                Expanded(
                  flex: 2,
                  child: ElevatedButton.icon(
                    onPressed: (!isAvailable || _isDealLoading) ? null : _requestDeal,
                    icon: _isDealLoading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.handshake_outlined, color: Colors.white, size: 18),
                    label: Text(
                      isReserved
                          ? 'Đang được giữ'
                          : !isAvailable
                              ? (_post.listingType == 'give' ? 'Đã được nhận' : 'Đã bán')
                              : (_post.listingType == 'give' ? 'Tôi muốn nhận' : 'Tôi quan tâm'),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isAvailable ? AppTheme.success : AppTheme.textSecondary,
                      minimumSize: const Size(0, 50),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                  ),
                ),
              ]),
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
      validImages.add('${ApiService.baseUrl}/uploads/${_post.imageLabel}');
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Chi tiết tin đăng', style: TextStyle(fontSize: 18)),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined, color: Colors.black87),
            onPressed: () {
              final price = PostCard.formatPrice(_post.price, _post.listingType);
              final text = '${_post.title}\n$price\n\nTìm thấy trên Cho và Tặng!';
              Share.share(text, subject: _post.title);
            },
          ),
          IconButton(
            onPressed: isUpdatingFavorite ? null : handleFavoriteTap,
            icon: Icon(localIsFavorite ? Icons.favorite : Icons.favorite_border, color: localIsFavorite ? Colors.red : Colors.black87),
          ),
          if (auth.userId != _post.authorId)
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert, color: Colors.black87),
              onSelected: (value) {
                if (value == 'report') _showReportDialog(context);
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
          // 1. SLIDER ẢNH
          SizedBox(
            height: 300,
            child: validImages.isEmpty
                ? _buildImagePlaceholder()
                : Stack(
              children: [
                PageView.builder(
                  itemCount: validImages.length,
                  onPageChanged: (index) => setState(() => _currentImageIndex = index),
                  itemBuilder: (context, index) {
                    return AppImage(
                      url: validImages[index],
                      width: double.infinity,
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
              ],
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
                Text(PostCard.formatPrice(_post.price, _post.listingType), style: TextStyle(fontSize: 22, color: (_post.listingType == 'give' || _post.price == 0) ? AppTheme.freeColor : AppTheme.priceColor, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 13, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Text(
                      _post.formattedDateTime.isNotEmpty ? _post.formattedDateTime : '—',
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
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
                const Divider(color: Color(0xFFF3F4F6), thickness: 2),

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
                            userAgentPackageName: 'com.chovatang.app',
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
                const Divider(color: Color(0xFFF3F4F6), thickness: 2),

                // 4. MÔ TẢ
                const SizedBox(height: 16),
                const Text('Mô tả chi tiết', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(_post.description.isEmpty ? 'Chưa có mô tả' : _post.description, style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87)),

                const SizedBox(height: 16),
                const Divider(color: Color(0xFFF3F4F6), thickness: 2),

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
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppTheme.primaryLight,
                        backgroundImage: (_post.authorAvatar != null && _post.authorAvatar!.isNotEmpty)
                            ? CachedNetworkImageProvider(_post.authorAvatar!) : null,
                        child: (_post.authorAvatar == null || _post.authorAvatar!.isEmpty)
                            ? Text((_post.authorName ?? 'U')[0].toUpperCase(),
                                style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold))
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(_post.authorName ?? 'Người đăng',
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          const Text('Xem trang cá nhân →',
                              style: TextStyle(fontSize: 12, color: AppTheme.primary)),
                        ]),
                      ),
                      Icon(Icons.chevron_right, color: Colors.grey.shade400),
                    ],
                  ),
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