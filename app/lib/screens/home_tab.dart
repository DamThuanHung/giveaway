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
import '../widgets/app_image.dart';
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
              const Tab(text: '0đ - Cho tặng'),
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
    if (posts.isEmpty && !postProv.isLoading) {
      return const Center(child: Text('Không có tin đăng nào', style: TextStyle(color: AppTheme.textSecondary)));
    }

    return RefreshIndicator(
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
            SliverPadding(
              padding: const EdgeInsets.all(10),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 0.65,
                ),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _buildPostCard(ctx, posts[i]),
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

  Widget _buildPostCard(BuildContext ctx, Post item) {
    final bool isFree = item.price == 0 || item.listingType == 'give' || item.listingType == 'donated';
    final String location = item.ward.isNotEmpty ? item.ward
        : item.district.isNotEmpty ? item.district
        : item.province.isNotEmpty ? item.province
        : 'Đang cập nhật';

    String imgUrl = '';
    final rawImageUrl = item.imageUrl ?? '';
    if (rawImageUrl.isNotEmpty && rawImageUrl.startsWith('http') && !rawImageUrl.contains('10.0.2.2')) {
      imgUrl = rawImageUrl;
    } else if (item.imageLabel.isNotEmpty) {
      imgUrl = '${ApiService.baseUrl}/uploads/${item.imageLabel}';
    }

    return GestureDetector(
      onTap: () => Navigator.push(ctx, MaterialPageRoute(
        builder: (_) => PostDetailScreen(
          post: item,
          isFavorite: _favoriteIds.contains(item.id),
          onToggleFavorite: () => _toggleFavorite(item.id),
        ),
      )),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.grey.shade200),
        ),
        clipBehavior: Clip.hardEdge,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Stack(children: [
            AppImage(url: imgUrl, height: 140, width: double.infinity,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(8))),
            if (isFree)
              Positioned(
                top: 0, left: 0,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: const BoxDecoration(
                    color: Colors.redAccent,
                    borderRadius: BorderRadius.only(topLeft: Radius.circular(8), bottomRight: Radius.circular(8)),
                  ),
                  child: const Text('Tặng 0đ', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ),
          ]),
          Expanded(child: Padding(
            padding: const EdgeInsets.all(8),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
              const Spacer(),
              Text(
                isFree ? 'Miễn phí' : '${item.price} đ',
                style: TextStyle(fontSize: 15, color: isFree ? Colors.redAccent : Colors.black87, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.location_on, size: 12, color: Colors.grey),
                const SizedBox(width: 2),
                Expanded(child: Text(location, style: const TextStyle(fontSize: 11, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis)),
              ]),
            ]),
          )),
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