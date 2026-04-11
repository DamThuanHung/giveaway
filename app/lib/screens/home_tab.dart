import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';
import '../providers/post_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import 'notifications_screen.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import '../theme/app_theme.dart';
import '../widgets/skeleton.dart';
import '../widgets/post_card.dart';
import '../data/categories.dart';
import '../data/provinces.dart';
import '../widgets/province_picker_sheet.dart';
import 'post_detail_screen.dart';
import 'map_view_screen.dart';

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

  // 0 = Tất cả, 1 = Miễn phí, 2..N = categories
  int _selectedChip = 0;
  static final _categories = AppCategories.list;

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

      final placemarks = await placemarkFromCoordinates(pos.latitude, pos.longitude);
      if (placemarks.isEmpty || !mounted) return;

      final admin = placemarks.first.administrativeArea ?? '';
      if (admin.isEmpty) return;

      String normalize(String s) => s
          .toLowerCase()
          .replaceAll('tp. ', '')
          .replaceAll('tỉnh ', '')
          .replaceAll('thành phố ', '')
          .trim();

      final adminNorm = normalize(admin);
      final matched = AppProvinces.list.firstWhere(
        (p) {
          if (p == 'Toàn quốc') return false;
          final pNorm = normalize(p);
          return adminNorm.contains(pNorm) || pNorm.contains(adminNorm);
        },
        orElse: () => '',
      );

      if (matched.isNotEmpty && matched != _selectedProvince) {
        setState(() => _selectedProvince = matched);
        _refetch();
      }
    } catch (_) {}
  }

  String? get _provinceFilter {
    if (_radiusResult != null) return null;
    if (_selectedProvince == 'Toàn quốc') return null;
    if (_selectedProvince.startsWith('Toàn miền')) return null;
    return _selectedProvince;
  }

  void _refetch() {
    final postProv = context.read<PostProvider>();
    final lat = _radiusResult?.lat;
    final lng = _radiusResult?.lng;
    final radius = _radiusResult?.radius;

    if (_selectedChip == 0) {
      postProv.fetchPosts(province: _provinceFilter, lat: lat, lng: lng, radius: radius);
    } else if (_selectedChip == 1) {
      postProv.fetchPosts(listingType: 'give', province: _provinceFilter, lat: lat, lng: lng, radius: radius);
    } else {
      postProv.fetchPosts(
        itemCategory: _categories[_selectedChip - 2]['value'],
        province: _provinceFilter,
        lat: lat, lng: lng, radius: radius,
      );
    }
  }

  void _onChipTap(int index) {
    if (_selectedChip == index) return;
    setState(() => _selectedChip = index);
    _refetch();
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
      if (isFav) _favoriteIds.remove(postId);
      else _favoriteIds.add(postId);
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
        backgroundColor: Colors.white,
        elevation: 0.5,
        title: Row(
          children: [
            GestureDetector(
              onTap: _showProvincePicker,
              child: Row(children: [
                const Icon(Icons.location_on, color: AppTheme.primary),
                const SizedBox(width: 4),
                Text(
                  _selectedProvince,
                  style: const TextStyle(color: AppTheme.textPrimary, fontSize: 15, fontWeight: FontWeight.bold),
                ),
                const Icon(Icons.arrow_drop_down, color: AppTheme.textSecondary),
              ]),
            ),
            const Spacer(),
            IconButton(
              icon: const Icon(Icons.map_outlined, color: AppTheme.textSecondary),
              tooltip: 'Xem bản đồ',
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapViewScreen())),
            ),
            _BellButton(),
          ],
        ),
      ),
      body: Column(
        children: [
          // ── Chip filter ──────────────────────────────────
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 10),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                children: [
                  _FilterChip(label: 'Tất cả', selected: _selectedChip == 0, onTap: () => _onChipTap(0)),
                  const SizedBox(width: 8),
                  _FilterChip(
                    label: '🎁 Miễn phí',
                    selected: _selectedChip == 1,
                    onTap: () => _onChipTap(1),
                  ),
                  ..._categories.asMap().entries.map((e) {
                    final idx = e.key + 2;
                    return Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: _FilterChip(
                        label: e.value['label']!,
                        selected: _selectedChip == idx,
                        onTap: () => _onChipTap(idx),
                      ),
                    );
                  }),
                ],
              ),
            ),
          ),

          // ── Feed ─────────────────────────────────────────
          Expanded(
            child: Consumer<PostProvider>(
              builder: (ctx, postProv, _) {
                if (postProv.isLoading && postProv.posts.isEmpty) {
                  return const PostGridSkeleton();
                }
                if (postProv.hasError && postProv.posts.isEmpty) {
                  return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.wifi_off, size: 48, color: AppTheme.textSecondary),
                    const SizedBox(height: 12),
                    const Text('Không thể tải dữ liệu', style: TextStyle(color: AppTheme.textSecondary)),
                    const SizedBox(height: 16),
                    OutlinedButton(onPressed: () => postProv.fetchPosts(), child: const Text('Thử lại')),
                  ]));
                }
                return _buildGridView(postProv.posts, postProv);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGridView(List<Post> posts, PostProvider postProv) {
    if (posts.isEmpty && !postProv.isLoading) {
      return const Center(
        child: Text('Không có tin đăng nào', style: TextStyle(color: AppTheme.textSecondary)),
      );
    }

    return RefreshIndicator(
      color: AppTheme.primary,
      onRefresh: () => postProv.fetchPosts(),
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
            // Banner "Hàng miễn phí" — chỉ hiện ở tab Tất cả
            if (_selectedChip == 0)
              SliverToBoxAdapter(child: _buildGiveBanner()),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 0),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 0.62,
                ),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => PostCard(
                    post: posts[i],
                    isFavorite: _favoriteIds.contains(posts[i].id),
                    onTap: () => Navigator.push(ctx, MaterialPageRoute(
                      builder: (_) => PostDetailScreen(
                        post: posts[i],
                        isFavorite: _favoriteIds.contains(posts[i].id),
                        onToggleFavorite: () async {
                          setState(() {
                            if (_favoriteIds.contains(posts[i].id)) {
                              _favoriteIds.remove(posts[i].id);
                            } else {
                              _favoriteIds.add(posts[i].id);
                            }
                          });
                        },
                      ),
                    )),
                    onToggleFavorite: () => _toggleFavorite(posts[i].id),
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
            colors: [Color(0xFF2E7D32), Color(0xFF43A047)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.green.withOpacity(0.3), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Row(children: [
          const Text('🎁', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          const Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Hàng miễn phí', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
              SizedBox(height: 2),
              Text('Đồ miễn phí gần bạn — khám phá ngay!', style: TextStyle(color: Colors.white70, fontSize: 12)),
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

  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppTheme.primary : AppTheme.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
            color: selected ? Colors.white : AppTheme.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _BellButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final unreadCount = context.watch<NotificationProvider>().unreadCount;
    return IconButton(
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          const Icon(Icons.notifications_outlined, color: AppTheme.textSecondary),
          if (unreadCount > 0)
            Positioned(
              top: -4, right: -4,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
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
      onPressed: () {
        context.read<NotificationProvider>().clearBadge();
        Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationsScreen()))
            .then((_) => context.read<NotificationProvider>().refresh());
      },
    );
  }
}
