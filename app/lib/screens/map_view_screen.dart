import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import '../theme/app_theme.dart';
import 'post_detail_screen.dart';

class MapViewScreen extends StatefulWidget {
  const MapViewScreen({super.key});

  @override
  State<MapViewScreen> createState() => _MapViewScreenState();
}

class _MapViewScreenState extends State<MapViewScreen> {
  List<Post> _posts = [];
  bool _isLoading = true;
  Post? _selectedPost;
  final MapController _mapController = MapController();

  // Trung tâm Việt Nam
  static const _defaultCenter = LatLng(16.047079, 108.206230);

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    final result = await ApiService.getPosts(limit: 100);
    if (!mounted) return;
    final raw = result['data'] as List? ?? [];
    setState(() {
      _posts = raw.map((e) => Post.fromJson(e)).where((p) => p.latitude != 0 && p.longitude != 0).toList();
      _isLoading = false;
    });
  }

  String _getImageUrl(Post post) {
    if (post.images != null && post.images!.isNotEmpty) return post.images!.first;
    if (post.imageLabel.isNotEmpty) return '${ApiService.baseUrl}/uploads/${post.imageLabel}';
    return '';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bản đồ bài đăng'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location),
            tooltip: 'Về trung tâm',
            onPressed: () => _mapController.move(_defaultCenter, 6),
          ),
        ],
      ),
      body: Stack(
        children: [
          _isLoading
              ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
              : FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _defaultCenter,
                    initialZoom: 6,
                    onTap: (_, __) => setState(() => _selectedPost = null),
                  ),
                  children: [
                    // Lớp nền bản đồ OpenStreetMap
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'vn.chovatang.app',
                    ),
                    // Các marker bài đăng
                    MarkerLayer(
                      markers: _posts.map((post) {
                        final isFree = post.listingType == 'give' || post.price == 0;
                        return Marker(
                          point: LatLng(post.latitude, post.longitude),
                          width: 44,
                          height: 44,
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _selectedPost = post);
                              _mapController.move(LatLng(post.latitude, post.longitude), 14);
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                color: isFree ? Colors.red : AppTheme.primary,
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 2),
                                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.25), blurRadius: 6)],
                              ),
                              child: Icon(
                                isFree ? Icons.card_giftcard : Icons.sell_outlined,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),

          // Chú thích
          Positioned(
            bottom: _selectedPost != null ? 190 : 16,
            left: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Legend(color: Colors.red, label: 'Cho tặng miễn phí'),
                const SizedBox(height: 4),
                _Legend(color: AppTheme.primary, label: 'Bán thanh lý'),
              ],
            ),
          ),

          // Số lượng bài
          Positioned(
            top: 12,
            left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 6)],
              ),
              child: Text(
                '${_posts.length} bài đăng',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
            ),
          ),

          // Card bài đăng khi tap marker
          if (_selectedPost != null)
            Positioned(
              bottom: 16,
              left: 16,
              right: 16,
              child: _PostCard(
                post: _selectedPost!,
                imageUrl: _getImageUrl(_selectedPost!),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => PostDetailScreen(
                    post: _selectedPost!,
                    isFavorite: false,
                    onToggleFavorite: () async {},
                  )),
                ),
                onClose: () => setState(() => _selectedPost = null),
              ),
            ),
        ],
      ),
    );
  }
}

class _Legend extends StatelessWidget {
  final Color color;
  final String label;
  const _Legend({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Container(
        width: 14, height: 14,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 1.5),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 3)],
        ),
      ),
      const SizedBox(width: 6),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textPrimary)),
      ),
    ]);
  }
}

class _PostCard extends StatelessWidget {
  final Post post;
  final String imageUrl;
  final VoidCallback onTap;
  final VoidCallback onClose;

  const _PostCard({required this.post, required this.imageUrl, required this.onTap, required this.onClose});

  @override
  Widget build(BuildContext context) {
    final isFree = post.listingType == 'give' || post.price == 0;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            // Ảnh
            ClipRRect(
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
              child: imageUrl.isNotEmpty
                  ? Image.network(imageUrl, width: 100, height: 100, fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _placeholder())
                  : _placeholder(),
            ),
            // Thông tin
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(post.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        maxLines: 2, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 6),
                    Text(
                      isFree ? 'Miễn phí' : '${post.price}đ',
                      style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.bold,
                        color: isFree ? Colors.red : AppTheme.primary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.location_on, size: 12, color: AppTheme.textSecondary),
                      const SizedBox(width: 2),
                      Expanded(child: Text(
                        post.district.isNotEmpty ? post.district : post.province,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                      )),
                    ]),
                  ],
                ),
              ),
            ),
            // Nút đóng
            Padding(
              padding: const EdgeInsets.only(right: 8, top: 8),
              child: Align(
                alignment: Alignment.topRight,
                child: GestureDetector(
                  onTap: onClose,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                    child: const Icon(Icons.close, size: 16, color: AppTheme.textSecondary),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() => Container(
    width: 100, height: 100, color: const Color(0xFFF3F4F6),
    child: const Icon(Icons.image_outlined, color: Colors.grey),
  );
}
