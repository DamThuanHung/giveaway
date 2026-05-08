import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '../providers/post_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import 'notifications_screen.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import '../theme/app_theme.dart';
import '../widgets/skeleton.dart';
import '../widgets/post_card.dart';
import '../widgets/empty_state.dart';
import '../widgets/error_state.dart';
import '../data/categories.dart';
import '../data/provinces.dart';
import '../widgets/province_picker_sheet.dart';
import 'post_detail_screen.dart';
import 'map_view_screen.dart';
import 'auth/phone_login_screen.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<PostProvider>().fetchPosts());
  }

  @override
  Widget build(BuildContext context) {
    return const _HomeFeedJimoty();
  }
}

class _HomeFeedJimoty extends StatefulWidget {
  const _HomeFeedJimoty();

  @override
  State<_HomeFeedJimoty> createState() => _HomeFeedJimotyState();
}

class _HomeFeedJimotyState extends State<_HomeFeedJimoty> {
  final Set<String> _favoriteIds = {};
  String _selectedProvince = 'Toàn quốc';
  RadiusMapResult? _radiusResult;

  // -1 = Đang theo dõi, 0 = Tất cả, 1 = Miễn phí
  int _selectedChip = 0;
  String? _selectedCategory; // null = không lọc theo danh mục
  static const _categories = AppCategories.list;

  // 0 = Dành cho bạn, 1 = Mới nhất, 2 = Gần bạn
  int _feedTab = 0;

  // Feed riêng cho tab "Đang theo dõi"
  List<Post> _followFeed = [];
  bool _followFeedLoading = false;

  // Cập nhật theo Nghị quyết 202/2025/QH15 — 34 đơn vị hành chính cấp tỉnh.
  static const _regionProvinces = {
    'Toàn miền Bắc': [
      'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Hưng Yên', 'Ninh Bình',
      'Bắc Ninh', 'Phú Thọ', 'Thái Nguyên', 'Lạng Sơn', 'Cao Bằng',
      'Tuyên Quang', 'Lào Cai', 'Điện Biên', 'Lai Châu', 'Sơn La',
    ],
    'Toàn miền Trung': [
      'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Trị', 'Huế',
      'Đà Nẵng', 'Quảng Ngãi', 'Khánh Hòa', 'Lâm Đồng',
      'Gia Lai', 'Đắk Lắk',
    ],
    'Toàn miền Nam': [
      'TP. Hồ Chí Minh', 'Đồng Nai', 'Tây Ninh', 'Vĩnh Long',
      'Đồng Tháp', 'An Giang', 'Cần Thơ', 'Cà Mau',
    ],
  };

  @override
  void initState() {
    super.initState();
    _loadFavorites();
    _detectLocation();
  }

  Future<void> _detectLocation() async {
    try {
      final permission = await Geolocator.checkPermission();
      LocationPermission perm = permission;
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return;

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.low,
      ).timeout(const Duration(seconds: 8));

      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse'
        '?lat=${pos.latitude}&lon=${pos.longitude}'
        '&format=json&addressdetails=1&accept-language=vi',
      );
      final res = await http.get(uri, headers: {'User-Agent': 'ChoVaTangApp/1.0'})
          .timeout(const Duration(seconds: 6));
      if (!mounted) return;

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final addr = data['address'] as Map<String, dynamic>? ?? {};
      final rawProvince = (addr['city'] ?? addr['state'] ?? '').toString().trim();
      if (rawProvince.isEmpty) return;

      // Map tỉnh cũ (Nominatim có thể trả về tên cũ) → tên mới sau sáp nhập.
      final province = AppProvinces.normalize(rawProvince);

      String normalize(String s) => s
          .toLowerCase()
          .replaceAll('tp. ', '')
          .replaceAll('tỉnh ', '')
          .replaceAll('thành phố ', '')
          .trim();

      final provinceNorm = normalize(province);
      final matched = AppProvinces.list.firstWhere(
        (p) {
          if (p == 'Toàn quốc') return false;
          final pNorm = normalize(p);
          return provinceNorm.contains(pNorm) || pNorm.contains(provinceNorm);
        },
        orElse: () => '',
      );

      if (matched.isNotEmpty && matched != _selectedProvince) {
        setState(() => _selectedProvince = matched);
        _refetch();
      }
    } catch (_) {}
  }

  // Filter 1 tỉnh cụ thể
  String? get _provinceFilter {
    if (_radiusResult != null) return null;
    if (_selectedProvince == 'Toàn quốc') return null;
    if (_regionProvinces.containsKey(_selectedProvince)) return null;
    return _selectedProvince;
  }

  // Filter theo vùng miền (danh sách tỉnh)
  List<String>? get _provincesFilter {
    if (_radiusResult != null) return null;
    return _regionProvinces[_selectedProvince];
  }

  void _refetch() {
    final postProv = context.read<PostProvider>();
    final lat = _radiusResult?.lat;
    final lng = _radiusResult?.lng;
    final radius = _radiusResult?.radius;

    // "Mới nhất" = toàn quốc, bỏ filter tỉnh
    // "Gần bạn"  = chỉ tỉnh cụ thể đang chọn (không lọc vùng miền)
    // "Dành cho bạn" = behavior mặc định (province + region)
    final String? province;
    final List<String>? provinces;
    if (_feedTab == 1) {
      province = null;
      provinces = null;
    } else if (_feedTab == 2) {
      province = _selectedProvince != 'Toàn quốc' && !_regionProvinces.containsKey(_selectedProvince)
          ? _selectedProvince
          : null;
      provinces = null;
    } else {
      province = _provinceFilter;
      provinces = _provincesFilter;
    }

    postProv.fetchPosts(
      listingType: _selectedChip == 1 ? 'give' : null,
      itemCategory: _selectedCategory,
      province: province,
      provinces: provinces,
      lat: lat, lng: lng, radius: radius,
    );
  }

  void _onFeedTab(int index) {
    if (_feedTab == index) return;
    setState(() => _feedTab = index);
    _refetch();
  }

  void _onChipTap(int index) {
    if (_selectedChip == index && _selectedCategory == null) return;
    setState(() { _selectedChip = index; _selectedCategory = null; });
    if (index == -1) {
      _loadFollowFeed();
    } else {
      _refetch();
    }
  }

  void _onCategoryTap(String value) {
    final newCat = _selectedCategory == value ? null : value;
    setState(() { _selectedCategory = newCat; _selectedChip = 0; });
    _refetch();
  }

  Future<void> _loadFollowFeed() async {
    setState(() => _followFeedLoading = true);
    final result = await ApiService.getFollowFeed();
    if (!mounted) return;
    final raw = result['data'] as List<dynamic>? ?? [];
    setState(() {
      _followFeed = raw.map((e) => Post.fromJson(e as Map<String, dynamic>)).toList();
      _followFeedLoading = false;
    });
  }

  void _showProvincePicker() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ProvincePickerSheet(
        selected: _selectedProvince == 'Toàn quốc' ? null : _selectedProvince,
        radiusResult: _radiusResult,
        onConfirm: (val) {
          final newProvince = val ?? 'Toàn quốc';
          setState(() {
            _selectedProvince = newProvince;
            _radiusResult = null;
          });
          _refetch();
        },
        onRadiusConfirm: (result) {
          setState(() {
            _radiusResult = result;
            _selectedProvince = result.label;
          });
          _refetch();
        },
      ),
    );
  }

  Future<void> _loadFavorites() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth || auth.userId == null) return;
    final data = await ApiService.getFavorites(auth.userId!);
    if (!mounted) return;
    setState(() {
      _favoriteIds.clear();
      for (final item in data) {
        final postId = item['postId']?.toString() ?? item['post']?['id']?.toString();
        if (postId != null) _favoriteIds.add(postId);
      }
    });
  }

  Future<void> _toggleFavorite(String postId) async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth || auth.userId == null) return;
    final isFav = _favoriteIds.contains(postId);
    setState(() {
      if (isFav) {
        _favoriteIds.remove(postId);
      } else {
        _favoriteIds.add(postId);
      }
    });
    if (isFav) {
      await ApiService.removeFavorite(auth.userId!, postId);
    } else {
      await ApiService.addFavorite(auth.userId!, postId);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: AppTheme.surface,
        elevation: 0.5,
        centerTitle: false,
        titleSpacing: 12,
        title: GestureDetector(
          onTap: _showProvincePicker,
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.location_on_outlined, color: AppTheme.primary, size: 18),
            const SizedBox(width: 4),
            Flexible(
              child: Text(
                _selectedProvince,
                style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ),
            const Icon(Icons.arrow_drop_down, color: AppTheme.textSecondary),
          ]),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined, color: AppTheme.textSecondary),
            tooltip: 'Xem bản đồ',
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapViewScreen())),
          ),
          _BellButton(),
        ],
      ),
      body: Column(
        children: [
          // ── Chip filter (trạng thái) ──────────────────────
          Container(
            color: AppTheme.surface,
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _FilterChip(label: 'Tất cả', emoji: '✨', selected: _selectedChip == 0 && _selectedCategory == null, onTap: () => _onChipTap(0)),
                  const SizedBox(width: 8),
                  _FilterChip(label: 'Miễn phí', emoji: '🎁', selected: _selectedChip == 1, onTap: () => _onChipTap(1)),
                  const SizedBox(width: 8),
                  _FilterChip(label: 'Theo dõi', emoji: '👥', selected: _selectedChip == -1, onTap: () {
                    final auth = context.read<AuthProvider>();
                    if (!auth.isAuth) { _showLoginPrompt(); return; }
                    _onChipTap(-1);
                  }),
                ],
              ),
            ),
          ),

          // ── Hàng icon danh mục ────────────────────────────
          Container(
            color: AppTheme.surface,
            padding: const EdgeInsets.only(bottom: 10),
            child: ShaderMask(
              shaderCallback: (bounds) => const LinearGradient(
                colors: [Colors.white, Colors.white, Colors.transparent],
                stops: [0.0, 0.88, 1.0],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ).createShader(bounds),
              blendMode: BlendMode.dstIn,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: _categories.map((cat) {
                    final isSelected = _selectedCategory == cat['value'];
                    return GestureDetector(
                      onTap: () => _onCategoryTap(cat['value']!),
                      child: Container(
                        margin: const EdgeInsets.only(right: 12),
                        width: 60,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 48, height: 48,
                              decoration: BoxDecoration(
                                color: isSelected ? AppTheme.primary.withOpacity(0.12) : AppTheme.background,
                                borderRadius: BorderRadius.circular(14),
                                border: isSelected ? Border.all(color: AppTheme.primary, width: 1.5) : null,
                              ),
                              child: Padding(
                                padding: const EdgeInsets.all(10),
                                child: Image.asset(cat['icon']!, fit: BoxFit.contain,
                                    errorBuilder: (_, __, ___) => const Icon(Icons.category_outlined, size: 22, color: AppTheme.textSecondary)),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              cat['label']!,
                              textAlign: TextAlign.center,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                                color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
          const Divider(height: 1),

          // ── Feed tabs ────────────────────────────────────
          if (_selectedChip != -1)
            Container(
              color: AppTheme.surface,
              child: Row(
                children: [
                  _FeedTab(label: 'Dành cho bạn', index: 0, selected: _feedTab == 0, onTap: _onFeedTab),
                  _FeedTab(label: 'Mới nhất', index: 1, selected: _feedTab == 1, onTap: _onFeedTab),
                  _FeedTab(label: 'Gần bạn', index: 2, selected: _feedTab == 2, onTap: _onFeedTab),
                ],
              ),
            ),

          // ── Feed ─────────────────────────────────────────
          Expanded(
            child: _selectedChip == -1
                ? _buildFollowFeed()
                : Consumer<PostProvider>(
                    builder: (ctx, postProv, _) {
                      final auth = context.watch<AuthProvider>();
                      if (postProv.isLoading && postProv.posts.isEmpty) {
                        return const PostGridSkeleton();
                      }
                      if (postProv.hasError && postProv.posts.isEmpty) {
                        return ErrorState(
                          icon: Icons.wifi_off,
                          message: 'Không tải được bài đăng',
                          subMessage: 'Kiểm tra mạng rồi thử lại nhé.',
                          onRetry: _refetch,
                        );
                      }
                      return _buildGridView(postProv.posts, postProv, auth.isAuth);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _showLoginPrompt() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Vui lòng đăng nhập để sử dụng tính năng này'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        action: SnackBarAction(
          label: 'Đăng nhập',
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const PhoneLoginScreen(popOnSuccess: true)),
          ),
        ),
      ),
    );
  }

  Widget _buildFollowFeed() {
    if (_followFeedLoading) return const PostGridSkeleton();
    if (_followFeed.isEmpty) {
      return RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: _loadFollowFeed,
        child: LayoutBuilder(
          builder: (_, c) => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: SizedBox(
              height: c.maxHeight,
              child: Center(
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.people_outline, size: 56, color: Colors.grey.shade300),
                  const SizedBox(height: 12),
                  const Text('Bạn chưa theo dõi ai', style: TextStyle(color: AppTheme.textSecondary, fontSize: 15)),
                  const SizedBox(height: 8),
                  const Text(
                    'Hãy theo dõi một số người để xem\nbài đăng mới của họ tại đây',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                  ),
                ]),
              ),
            ),
          ),
        ),
      );
    }
    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: _loadFollowFeed,
      child: GridView.builder(
        padding: const EdgeInsets.all(10),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 0.72,
        ),
        itemCount: _followFeed.length,
        itemBuilder: (ctx, i) {
          final post = _followFeed[i];
          final isFav = _favoriteIds.contains(post.id);
          final auth = context.read<AuthProvider>();
          return PostCard(
            post: post,
            isFavorite: isFav,
            onToggleFavorite: () async {
              if (isFav) {
                await ApiService.removeFavorite(auth.userId!, post.id);
                setState(() => _favoriteIds.remove(post.id));
              } else {
                await ApiService.addFavorite(auth.userId!, post.id);
                setState(() => _favoriteIds.add(post.id));
              }
            },
            onTap: () => Navigator.push(ctx, MaterialPageRoute(
              builder: (_) => PostDetailScreen(
                post: post,
                isFavorite: isFav,
                onToggleFavorite: () async {
                  if (isFav) {
                    await ApiService.removeFavorite(auth.userId!, post.id);
                    setState(() => _favoriteIds.remove(post.id));
                  } else {
                    await ApiService.addFavorite(auth.userId!, post.id);
                    setState(() => _favoriteIds.add(post.id));
                  }
                },
              ),
            )),
          );
        },
      ),
    );
  }

  Widget _buildGridView(List<Post> posts, PostProvider postProv, bool isAuth) {
    if (posts.isEmpty && !postProv.isLoading) {
      return RefreshIndicator(
        color: AppTheme.primary,
        onRefresh: () async => _refetch(),
        child: LayoutBuilder(
          builder: (ctx, constraints) => SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: SizedBox(
              height: constraints.maxHeight,
              child: EmptyState(
                icon: Icons.inbox_outlined,
                message: 'Khu vực này chưa có bài đăng',
                subMessage: 'Kéo xuống để làm mới hoặc xem tất cả khu vực khác.',
                actionLabel: 'Xem tất cả',
                onAction: () { setState(() => _selectedChip = 0); _refetch(); },
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: () async => _refetch(),
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollEndNotification &&
              notification.metrics.pixels >= notification.metrics.maxScrollExtent - 300 &&
              postProv.hasMore &&
              !postProv.isLoading) {
            postProv.loadMore();
          }
          return false;
        },
        child: CustomScrollView(
          slivers: [
            // Banner Miễn phí — chỉ hiện ở tab Tất cả
            if (_selectedChip == 0)
              SliverToBoxAdapter(child: _buildGiveBanner()),

            if (postProv.total > 0)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
                  child: Text(
                    '${postProv.total} tin đăng',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                ),
              ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(10, 6, 10, 0),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  // Bug #002 fix: 0.58 quá cao → ảnh:content 58:42 (ngược chuẩn ngành
                  // Jimoty/Chợ Tốt 75:25). Tăng 0.70 → ảnh chiếm trội + content gọn,
                  // khắc phục cảm giác "khoảng trống thừa" tester báo.
                  childAspectRatio: 0.70,
                ),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => PostCard(
                    post: posts[i],
                    // BUG FIX: khi logout, không hiện tim đỏ
                    isFavorite: isAuth && _favoriteIds.contains(posts[i].id),
                    onTap: () => Navigator.push(ctx, MaterialPageRoute(
                      builder: (_) => PostDetailScreen(
                        post: posts[i],
                        isFavorite: isAuth && _favoriteIds.contains(posts[i].id),
                        // BUG FIX: gọi _toggleFavorite để thực sự gọi API
                        onToggleFavorite: () async => _toggleFavorite(posts[i].id),
                      ),
                    )).then((_) => _loadFavorites()),
                    // BUG FIX: user chưa đăng nhập → hiện login prompt thay vì silent fail
                    onToggleFavorite: () => isAuth
                        ? _toggleFavorite(posts[i].id)
                        : _showLoginPrompt(),
                  ),
                  childCount: posts.length,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: postProv.isLoading && posts.isNotEmpty
                    ? const Center(child: CircularProgressIndicator(color: AppTheme.primary, strokeWidth: 2))
                    : !postProv.hasMore && posts.isNotEmpty
                        ? Center(child: Text(
                            'Đã hiển thị tất cả ${posts.length} tin đăng',
                            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          ))
                        : const SizedBox.shrink(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGiveBanner() {
    return GestureDetector(
      onTap: () => _onChipTap(1),
      child: Container(
        margin: const EdgeInsets.fromLTRB(10, 10, 10, 0),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppTheme.primaryDark, AppTheme.primary],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: AppTheme.primary.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Row(children: [
          const Text('🎁', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Miễn phí', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
              SizedBox(height: 2),
              Text('Khám phá đồ miễn phí gần bạn!', style: TextStyle(color: Colors.white70, fontSize: 12)),
            ]),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(20)),
            child: const Text('Xem ngay', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ]),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  final String? emoji;
  final String? iconAsset;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
    this.emoji,
    this.iconAsset,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : AppTheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppTheme.primary : AppTheme.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (iconAsset != null)
              Image.asset(iconAsset!, width: 26, height: 26)
            else if (emoji != null)
              Text(emoji!, style: const TextStyle(fontSize: 18)),
            if (iconAsset != null || emoji != null) const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                color: selected ? Colors.white : AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _FeedTab extends StatelessWidget {
  final String label;
  final int index;
  final bool selected;
  final void Function(int) onTap;

  const _FeedTab({required this.label, required this.index, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: () => onTap(index),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: selected ? AppTheme.primary : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
              color: selected ? AppTheme.primary : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _BellButton extends StatefulWidget {
  @override
  State<_BellButton> createState() => _BellButtonState();
}

class _BellButtonState extends State<_BellButton> with SingleTickerProviderStateMixin {
  late AnimationController _shakeCtrl;
  late Animation<double> _shakeAnim;
  int _lastCount = 0;

  @override
  void initState() {
    super.initState();
    _shakeCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400));
    _shakeAnim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeCtrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _shakeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = context.watch<NotificationProvider>().unreadCount;
    if (unreadCount > _lastCount) {
      _lastCount = unreadCount;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        for (int i = 0; i < 3; i++) {
          await _shakeCtrl.forward(from: 0);
          await _shakeCtrl.reverse();
          await Future.delayed(const Duration(milliseconds: 80));
        }
      });
    } else if (unreadCount == 0) {
      _lastCount = 0;
    }

    return IconButton(
      icon: AnimatedBuilder(
        animation: _shakeAnim,
        builder: (_, child) {
          final angle = math.sin(_shakeAnim.value * math.pi * 6) * 0.3;
          return Transform.rotate(angle: angle, child: child);
        },
        child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(unreadCount > 0 ? Icons.notifications : Icons.notifications_outlined, color: unreadCount > 0 ? AppTheme.primary : AppTheme.textSecondary),
          if (unreadCount > 0)
            Positioned(
              top: -4, right: -4,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(color: AppTheme.error, shape: BoxShape.circle),
                constraints: const BoxConstraints(minWidth: 15, minHeight: 15),
                child: Text(
                  unreadCount > 99 ? '99+' : '$unreadCount',
                  style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
      ),
      onPressed: () {
        context.read<NotificationProvider>().clearBadge();
        Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()))
            .then((_) => context.read<NotificationProvider>().refresh());
      },
    );
  }
}
