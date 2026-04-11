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

class _HomeFeedJimotyState extends State<_HomeFeedJimoty> with SingleTickerProviderStateMixin {
  final Set<String> _favoriteIds = {};
  late final TabController _tabController;
  String _selectedProvince = 'Toàn quốc';
  RadiusMapResult? _radiusResult;

  // tab 0 = Tất cả, tab 1 = 0đ Cho tặng, tab 2..N = categories
  static final _categories = AppCategories.list;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2 + _categories.length, vsync: this);
    _tabController.addListener(_onTabChanged);
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
    } catch (_) {
      // Không có GPS → giữ "Toàn quốc"
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_onTabChanged);
    _tabController.dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (_tabController.indexIsChanging) return;
    _refetch();
  }

  String? get _provinceFilter {
    if (_radiusResult != null) return null;
    if (_selectedProvince == 'Toàn quốc') return null;
    if (_selectedProvince.startsWith('Toàn miền')) return null;
    return _selectedProvince;
  }

  void _refetch() {
    final idx = _tabController.index;
    final postProv = context.read<PostProvider>();
    final lat = _radiusResult?.lat;
    final lng = _radiusResult?.lng;
    final radius = _radiusResult?.radius;
    if (idx == 0) {
      postProv.fetchPosts(province: _provinceFilter, lat: lat, lng: lng, radius: radius);
    } else if (idx == 1) {
      postProv.fetchPosts(listingType: 'give', province: _provinceFilter, lat: lat, lng: lng, radius: radius);
    } else {
      postProv.fetchPosts(itemCategory: _categories[idx - 2]['value'], province: _provinceFilter, lat: lat, lng: lng, radius: radius);
    }
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
        backgroundColor: const Color(0xFFF6F6F6),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          title: Row(
            children: [
              GestureDetector(
                onTap: _showProvincePicker,
                child: Row(children: [
                  const Icon(Icons.location_on, color: Colors.green),
                  const SizedBox(width: 4),
                  Text(
                    _selectedProvince,
                    style: const TextStyle(color: Colors.black87, fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                  const Icon(Icons.arrow_drop_down, color: Colors.black54),
                ]),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.map_outlined, color: Colors.black54),
                tooltip: 'Xem bản đồ',
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapViewScreen())),
              ),
              _BellButton(),
            ],
          ),
          bottom: TabBar(
            controller: _tabController,
            isScrollable: true,
            labelColor: Colors.green,
            unselectedLabelColor: Colors.grey,
            indicatorColor: Colors.green,
            tabs: [
              const Tab(text: 'Tất cả'),
              const Tab(icon: Icon(Icons.card_giftcard, size: 14), text: 'Miễn phí'),
              ..._categories.map((c) => Tab(text: c['label']!)),
            ],
          ),
        ),
        body: Consumer<PostProvider>(
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

            return TabBarView(
              controller: _tabController,
              children: List.generate(
                2 + _categories.length,
                (_) => _buildGridView(postProv.posts, postProv),
              ),
            );
          },
        ),
    );
  }

  Widget _buildGridView(List<Post> posts, PostProvider postProv) {
    final bool isAllTab = _tabController.index == 0;

    if (posts.isEmpty && !postProv.isLoading) {
      return const Center(child: Text('Không có tin đăng nào', style: TextStyle(color: AppTheme.textSecondary)));
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
            // Banner "Hàng cho không" — chỉ hiện ở tab Tất cả
            if (isAllTab)
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
                          // Chỉ sync state, API đã gọi trong PostDetailScreen
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
            // Footer: loading hoặc hết bài
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
      onTap: () {
        _tabController.animateTo(1);
        _refetch();
      },
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

class _BellButton extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final unreadCount = context.watch<NotificationProvider>().unreadCount;
    return IconButton(
      icon: Stack(
        clipBehavior: Clip.none,
        children: [
          const Icon(Icons.notifications_outlined, color: Colors.black54),
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