import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/post_provider.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import '../theme/app_theme.dart';
import '../widgets/skeleton.dart';
import '../widgets/app_image.dart';
import 'post_detail_screen.dart';
import 'post/search_screen.dart';
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

  @override
  void initState() {
    super.initState();
    _loadFavorites();
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
    return DefaultTabController(
      length: 4,
      child: Scaffold(
        backgroundColor: const Color(0xFFF6F6F6),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          title: Row(
            children: [
              const Icon(Icons.location_on, color: Colors.green),
              const SizedBox(width: 5),
              const Text('Khu vực của bạn', style: TextStyle(color: Colors.black87, fontSize: 16, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.map_outlined, color: Colors.black54),
                tooltip: 'Xem bản đồ',
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MapViewScreen())),
              ),
              IconButton(
                icon: const Icon(Icons.search, color: Colors.black54),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchScreen())),
              )
            ],
          ),
          bottom: const TabBar(
            isScrollable: true,
            labelColor: Colors.green,
            unselectedLabelColor: Colors.grey,
            indicatorColor: Colors.green,
            tabs: [
              Tab(text: 'Tất cả'),
              Tab(text: '0đ - Cho tặng'),
              Tab(text: 'Gia dụng'),
              Tab(text: 'Xe cộ'),
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
              children: [
                _buildGridView(postProv.posts, postProv),
                _buildGridView(_filterPosts(postProv.posts, isFree: true), postProv),
                _buildGridView(_filterPosts(postProv.posts, category: 'appliances'), postProv),
                _buildGridView(_filterPosts(postProv.posts, category: 'motorbike'), postProv),
              ],
            );
          },
        ),
      ),
    );
  }

  List<Post> _filterPosts(List<Post> allPosts, {bool isFree = false, String? category}) {
    return allPosts.where((post) {
      if (isFree) return post.price == 0 || post.listingType == 'give' || post.listingType == 'donated';
      if (category != null) return post.itemCategory.toLowerCase().contains(category.toLowerCase());
      return true;
    }).toList();
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