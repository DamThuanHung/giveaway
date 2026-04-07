import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/post.dart';
import '../services/api_service.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import 'chat_screen.dart';
import 'auth/login_screen.dart';
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

  @override
  void initState() {
    super.initState();
    localIsFavorite = widget.isFavorite;
  }

  Future<void> _openChat() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth) {
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }
    if (widget.post.authorId == null) return;
    if (widget.post.authorId == auth.userId) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đây là bài đăng của bạn'), behavior: SnackBarBehavior.floating),
      );
      return;
    }

    setState(() => _isChatLoading = true);
    final room = await ApiService.getOrCreateRoom(widget.post.id, widget.post.authorId!);
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
        otherUserName: widget.post.authorName ?? 'Người đăng',
        postTitle: widget.post.title,
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
            widget.post.itemCategoryLabel,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)),
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
                  await ApiService.reportPost(postId: widget.post.id, reason: selectedReason);
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
    final oldValue = localIsFavorite;
    setState(() {
      isUpdatingFavorite = true;
      localIsFavorite = !localIsFavorite;
    });
    try {
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
      Navigator.push(context, MaterialPageRoute(builder: (_) => const LoginScreen()));
      return;
    }

    // Bắt buộc nhập lời nhắn
    final msgCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Tôi muốn nhận'),
        content: Form(
          key: formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(widget.post.title,
                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            const Text('Hãy nhắn một lời để người đăng biết bạn quan tâm nhé!',
                style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            const SizedBox(height: 12),
            TextFormField(
              controller: msgCtrl,
              autofocus: true,
              decoration: const InputDecoration(
                hintText: 'VD: Chào bạn, mình muốn nhận món này...',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
              maxLength: 200,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập lời nhắn' : null,
            ),
          ]),
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
    final result = await ApiService.createDeal(widget.post.id, message: msgCtrl.text.trim());
    if (!mounted) return;
    setState(() => _isDealLoading = false);

    if (result != null) {
      final roomId = result['roomId']?.toString();
      if (roomId != null && mounted) {
        Navigator.push(context, MaterialPageRoute(
          builder: (_) => ChatScreen(
            roomId: roomId,
            otherUserName: widget.post.authorName ?? 'Người đăng',
            postTitle: widget.post.title,
            postImageLabel: widget.post.imageLabel,
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
    final isOwn = auth.isAuth && auth.userId == widget.post.authorId;
    final isAvailable = widget.post.status == 'available';

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
                      isAvailable ? 'Tôi muốn nhận' : 'Không còn nhận',
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
    if (widget.post.images != null && widget.post.images!.isNotEmpty) {
      validImages = widget.post.images!.map((e) => _getCleanImageUrl(e)).where((e) => e.isNotEmpty).toList();
    } else if (widget.post.imageUrl != null && widget.post.imageUrl!.isNotEmpty) {
      validImages.add(_getCleanImageUrl(widget.post.imageUrl!));
    } else if (widget.post.imageLabel.isNotEmpty) {
      validImages.add('${ApiService.baseUrl}/uploads/${widget.post.imageLabel}');
    }

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Chi tiết tin đăng', style: TextStyle(fontSize: 18)),
        centerTitle: true,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: isUpdatingFavorite ? null : handleFavoriteTap,
            icon: Icon(localIsFavorite ? Icons.favorite : Icons.favorite_border, color: localIsFavorite ? Colors.red : Colors.black87),
          ),
          IconButton(
            onPressed: () => _showReportDialog(context),
            icon: const Icon(Icons.flag_outlined, color: Colors.black87),
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
                    Expanded(child: Text(widget.post.title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, height: 1.3))),
                    const SizedBox(width: 8),
                    _StatusBadge(status: widget.post.status, label: widget.post.statusLabel),
                  ],
                ),
                const SizedBox(height: 12),
                Text(widget.post.displayPrice == "0" ? "Miễn phí" : "${widget.post.displayPrice} đ", style: TextStyle(fontSize: 22, color: widget.post.displayPrice == "0" ? Colors.redAccent : Colors.green, fontWeight: FontWeight.bold)),
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
                    Expanded(child: Text(widget.post.fullAddress, style: const TextStyle(fontSize: 15, color: Colors.black87))),
                  ],
                ),
                const SizedBox(height: 12),
                // Giao diện Placeholder Bản đồ
                Container(
                  height: 100,
                  width: double.infinity,
                  decoration: BoxDecoration(color: const Color(0xFFE5E7EB), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.grey.shade300)),
                  child: const Center(child: Text('Bản đồ (Tích hợp Google Maps sau)', style: TextStyle(color: Colors.grey))),
                ),

                const SizedBox(height: 16),
                const Divider(color: Color(0xFFF3F4F6), thickness: 2),

                // 4. MÔ TẢ
                const SizedBox(height: 16),
                const Text('Mô tả chi tiết', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(widget.post.description.isEmpty ? 'Chưa có mô tả' : widget.post.description, style: const TextStyle(fontSize: 15, height: 1.5, color: Colors.black87)),

                const SizedBox(height: 16),
                const Divider(color: Color(0xFFF3F4F6), thickness: 2),

                // 5. THÔNG TIN NGƯỜI ĐĂNG (SELLER PROFILE)
                const SizedBox(height: 16),
                const Text('Người đăng', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: widget.post.authorId != null
                      ? () => Navigator.push(context, MaterialPageRoute(
                            builder: (_) => UserProfileScreen(
                              userId: widget.post.authorId!,
                              userName: widget.post.authorName,
                            ),
                          ))
                      : null,
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: AppTheme.primaryLight,
                        backgroundImage: (widget.post.authorAvatar != null && widget.post.authorAvatar!.isNotEmpty)
                            ? NetworkImage(widget.post.authorAvatar!) : null,
                        child: (widget.post.authorAvatar == null || widget.post.authorAvatar!.isEmpty)
                            ? Text((widget.post.authorName ?? 'U')[0].toUpperCase(),
                                style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold))
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(widget.post.authorName ?? 'Người đăng',
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
    Color color = status == 'available' ? Colors.green : Colors.orange;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
      child: Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }
}