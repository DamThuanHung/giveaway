import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/post_provider.dart';
import '../services/api_service.dart';
import '../models/post.dart'; // Import Model
import 'post_detail_screen.dart'; // Import màn hình chi tiết

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<PostProvider>().fetchPosts());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F6F6),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          const _HomeFeedJimoty(), // Tab 0
          const Center(child: Text('Tin nhắn (Đang phát triển)')), // Tab 1
          const Center(child: Text('Đăng tin (Đang phát triển)')), // Tab 2
          const Center(child: Text('Cá nhân (Đang phát triển)')), // Tab 3
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        selectedItemColor: Colors.green,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.chat), label: 'Tin nhắn'),
          BottomNavigationBarItem(icon: Icon(Icons.add_box), label: 'Đăng tin'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Cá nhân'),
        ],
      ),
    );
  }
}

class _HomeFeedJimoty extends StatelessWidget {
  const _HomeFeedJimoty();

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
              IconButton(icon: const Icon(Icons.search, color: Colors.black54), onPressed: () {})
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
            if (postProv.posts.isEmpty) {
              return const Center(child: CircularProgressIndicator(color: Colors.green));
            }

            return TabBarView(
              children: [
                _buildGridView(postProv.posts, postProv),
                _buildGridView(_filterPosts(postProv.posts, isFree: true), postProv),
                _buildGridView(_filterPosts(postProv.posts, category: 'gia dụng'), postProv),
                _buildGridView(_filterPosts(postProv.posts, category: 'xe cộ'), postProv),
              ],
            );
          },
        ),
      ),
    );
  }

  List<dynamic> _filterPosts(List<dynamic> allPosts, {bool isFree = false, String? category}) {
    return allPosts.where((item) {
      if (isFree) {
        final priceStr = item['price']?.toString() ?? "0";
        return priceStr == "0";
      }
      if (category != null) {
        final catStr = item['category']?.toString().toLowerCase() ?? "";
        return catStr.contains(category.toLowerCase());
      }
      return true;
    }).toList();
  }

  Widget _buildGridView(List<dynamic> posts, PostProvider postProv) {
    if (posts.isEmpty) {
      return const Center(child: Text("Không có tin đăng nào"));
    }

    return RefreshIndicator(
      onRefresh: () => postProv.fetchPosts(),
      child: GridView.builder(
        padding: const EdgeInsets.all(10),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: 0.72,
        ),
        itemCount: posts.length,
        itemBuilder: (ctx, i) {
          final dynamic item = posts[i];

          final String title = item['title']?.toString() ?? "Tin đăng";
          final String priceStr = item['price']?.toString() ?? "0";
          final bool isFree = priceStr == "0";

          final String location = item['area']?.toString() ??
              item['ward']?.toString() ??
              item['address']?.toString() ?? "Địa chỉ đang cập nhật";

          String imgUrl = "";
          String rawPath = item['imageUrl']?.toString() ?? "";
          if (rawPath.isNotEmpty) {
            if (rawPath.startsWith('http')) {
              imgUrl = rawPath;
            } else {
              String cleanPath = rawPath.startsWith('uploads/') ? rawPath.substring(8) : rawPath;
              imgUrl = "${ApiService.baseUrl}/uploads/$cleanPath".replaceAll('//', '/').replaceFirst(':/', '://');
            }
          }

          return GestureDetector(
            onTap: () {
              // Ép kiểu an toàn từ JSON sang Model Post
              final Post postObj = Post.fromJson(item as Map<String, dynamic>);

              // Chuyển trang sang Chi tiết
              Navigator.push(
                ctx,
                MaterialPageRoute(
                  builder: (context) => PostDetailScreen(
                    post: postObj,
                    isFavorite: false, // Trạng thái yêu thích lưu tạm bằng false
                    onToggleFavorite: () async {
                      // Logic API cập nhật trạng thái lưu tin
                    },
                  ),
                ),
              );
            },
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                        child: imgUrl.isEmpty
                            ? Container(height: 140, width: double.infinity, color: Colors.grey[200], child: const Icon(Icons.image, color: Colors.grey))
                            : Image.network(
                          imgUrl,
                          height: 140,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (ctx, e, s) => Container(height: 140, width: double.infinity, color: Colors.grey[100], child: const Icon(Icons.broken_image, color: Colors.grey)),
                        ),
                      ),
                      if (isFree)
                        Positioned(
                          top: 0,
                          left: 0,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: const BoxDecoration(
                              color: Colors.redAccent,
                              borderRadius: BorderRadius.only(topLeft: Radius.circular(8), bottomRight: Radius.circular(8)),
                            ),
                            child: const Text('Tặng 0đ', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                        ),
                    ],
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.all(8.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600), maxLines: 2, overflow: TextOverflow.ellipsis),
                          const Spacer(),
                          Text(isFree ? 'Miễn phí' : '$priceStr đ', style: TextStyle(fontSize: 15, color: isFree ? Colors.redAccent : Colors.black87, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.location_on, size: 12, color: Colors.grey),
                              const SizedBox(width: 2),
                              Expanded(child: Text(location, style: const TextStyle(fontSize: 11, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}