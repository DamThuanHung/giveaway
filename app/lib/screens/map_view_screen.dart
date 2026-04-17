import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../services/api_service.dart';
import '../models/post.dart';
import '../theme/app_theme.dart';
import '../widgets/app_image.dart';
import '../widgets/post_card.dart';
import 'post_detail_screen.dart';

class MapViewScreen extends StatefulWidget {
  const MapViewScreen({super.key});

  @override
  State<MapViewScreen> createState() => _MapViewScreenState();
}

class _MapViewScreenState extends State<MapViewScreen> {
  List<Post> _allPosts = [];
  bool _isLoading = true;
  bool _isLocating = false;
  Post? _selectedPost;
  String _filter = 'all'; // all | give | sell
  final MapController _mapController = MapController();

  static const _defaultCenter = LatLng(16.047079, 108.206230);

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    final result = await ApiService.getPosts(limit: 200);
    if (!mounted) return;
    final raw = result['data'] as List? ?? [];
    setState(() {
      _allPosts = raw
          .map((e) => Post.fromJson(e))
          .where((p) => p.latitude != 0 && p.longitude != 0)
          .toList();
      _isLoading = false;
    });
  }

  List<Post> get _filteredPosts {
    switch (_filter) {
      case 'give': return _allPosts.where((p) => p.listingType == 'give' || p.price == 0).toList();
      case 'sell': return _allPosts.where((p) => p.listingType != 'give' && p.price > 0).toList();
      default: return _allPosts;
    }
  }

  Future<void> _goToMyLocation() async {
    setState(() => _isLocating = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _showSnack('Vui lòng bật GPS');
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _showSnack('Không có quyền truy cập vị trí');
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        _showSnack('Quyền vị trí bị từ chối vĩnh viễn');
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      );
      if (!mounted) return;
      _mapController.move(LatLng(pos.latitude, pos.longitude), 13);
    } catch (e) {
      _showSnack('Không lấy được vị trí');
    } finally {
      if (mounted) setState(() => _isLocating = false);
    }
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      behavior: SnackBarBehavior.floating,
      duration: const Duration(seconds: 2),
    ));
  }

  String _getImageUrl(Post post) {
    if (post.images != null && post.images!.isNotEmpty) return post.images!.first;
    if (post.imageLabel.isNotEmpty) return '${ApiService.baseUrl}/uploads/${post.imageLabel}';
    return '';
  }

  @override
  Widget build(BuildContext context) {
    final posts = _filteredPosts;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Bản đồ bài đăng'),
        actions: [
          IconButton(
            icon: _isLocating
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.my_location),
            tooltip: 'Vị trí của tôi',
            onPressed: _isLocating ? null : _goToMyLocation,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Về trung tâm',
            onPressed: () => _mapController.move(_defaultCenter, 6),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Bản đồ
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
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'vn.traotay.app',
                    ),
                    MarkerLayer(
                      markers: posts.map((post) {
                        final isFree = post.listingType == 'give' || post.price == 0;
                        final isSelected = _selectedPost?.id == post.id;
                        return Marker(
                          point: LatLng(post.latitude, post.longitude),
                          width: isSelected ? 52 : 44,
                          height: isSelected ? 52 : 44,
                          child: GestureDetector(
                            onTap: () {
                              setState(() => _selectedPost = post);
                              _mapController.move(LatLng(post.latitude, post.longitude), 14);
                            },
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              decoration: BoxDecoration(
                                color: isFree ? Colors.red : AppTheme.primary,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white,
                                  width: isSelected ? 3 : 2,
                                ),
                                boxShadow: [BoxShadow(
                                  color: (isFree ? Colors.red : AppTheme.primary).withOpacity(0.4),
                                  blurRadius: isSelected ? 10 : 6,
                                  spreadRadius: isSelected ? 2 : 0,
                                )],
                              ),
                              child: Icon(
                                isFree ? Icons.card_giftcard : Icons.sell_outlined,
                                color: Colors.white,
                                size: isSelected ? 24 : 20,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],
                ),

          // Filter chips — trên cùng
          Positioned(
            top: 12, left: 16, right: 16,
            child: Row(children: [
              // Số lượng
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 6)],
                ),
                child: Text('${posts.length} bài',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
              ),
              const SizedBox(width: 8),
              _FilterChip(label: 'Tất cả', value: 'all', current: _filter, onTap: (v) => setState(() { _filter = v; _selectedPost = null; })),
              const SizedBox(width: 6),
              _FilterChip(label: 'Tặng miễn phí', value: 'give', current: _filter, color: Colors.red, onTap: (v) => setState(() { _filter = v; _selectedPost = null; })),
              const SizedBox(width: 6),
              _FilterChip(label: 'Bán', value: 'sell', current: _filter, color: AppTheme.primary, onTap: (v) => setState(() { _filter = v; _selectedPost = null; })),
            ]),
          ),

          // Chú thích — góc dưới trái
          Positioned(
            bottom: _selectedPost != null ? 196 : 20,
            left: 16,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _Legend(color: Colors.red, label: 'Tặng miễn phí'),
              const SizedBox(height: 4),
              _Legend(color: AppTheme.primary, label: 'Bán'),
            ]),
          ),

          // Card bài đăng khi tap marker
          if (_selectedPost != null)
            Positioned(
              bottom: 16, left: 16, right: 16,
              child: _PostCard(
                post: _selectedPost!,
                imageUrl: _getImageUrl(_selectedPost!),
                onTap: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => PostDetailScreen(
                    post: _selectedPost!,
                    isFavorite: false,
                    onToggleFavorite: () async {},
                  ),
                )),
                onClose: () => setState(() => _selectedPost = null),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Widgets ─────────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final String value;
  final String current;
  final Color color;
  final void Function(String) onTap;

  const _FilterChip({
    required this.label,
    required this.value,
    required this.current,
    required this.onTap,
    this.color = AppTheme.primary,
  });

  @override
  Widget build(BuildContext context) {
    final isActive = current == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isActive ? color : Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 6)],
        ),
        child: Text(label, style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w600,
          color: isActive ? Colors.white : AppTheme.textPrimary,
        )),
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
        width: 12, height: 12,
        decoration: BoxDecoration(
          color: color, shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 1.5),
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
        child: Row(children: [
          ClipRRect(
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
            child: SizedBox(
              width: 100, height: 100,
              child: AppImage(url: imageUrl),
            ),
          ),
          Expanded(child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(post.title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                  maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 6),
              Text(
                PostCard.formatPrice(post.price, post.listingType),
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold,
                    color: isFree ? Colors.red : AppTheme.primary),
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
              const SizedBox(height: 4),
              Text('Nhấn để xem chi tiết →',
                  style: TextStyle(fontSize: 11, color: AppTheme.primary.withOpacity(0.8))),
            ]),
          )),
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: const EdgeInsets.only(right: 8, top: 8),
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
        ]),
      ),
    );
  }
}
