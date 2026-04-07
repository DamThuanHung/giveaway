import 'package:flutter/material.dart';
import '../../models/post.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../post_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchCtrl = TextEditingController();
  List<Post> _results = [];
  bool _isLoading = false;
  bool _hasSearched = false;

  String? _selectedCategory;
  String? _selectedType;

  final _categories = const [
    {'value': 'furniture', 'label': 'Nội thất'},
    {'value': 'appliances', 'label': 'Gia dụng'},
    {'value': 'bicycle', 'label': 'Xe đạp'},
    {'value': 'motorbike', 'label': 'Xe máy'},
    {'value': 'computer', 'label': 'Máy tính'},
    {'value': 'phone', 'label': 'Điện thoại'},
    {'value': 'fashion', 'label': 'Thời trang'},
    {'value': 'other', 'label': 'Khác'},
  ];

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    setState(() { _isLoading = true; _hasSearched = true; });
    final result = await ApiService.getPosts(
      search: _searchCtrl.text.trim(),
      listingType: _selectedType,
      itemCategory: _selectedCategory,
      limit: 30,
    );
    if (!mounted) return;
    final List<dynamic> data = result['data'] ?? [];
    setState(() {
      _results = data.map((j) => Post.fromJson(j)).toList();
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: TextField(
          controller: _searchCtrl,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onSubmitted: (_) => _search(),
          decoration: InputDecoration(
            hintText: 'Tìm kiếm...',
            border: InputBorder.none,
            filled: false,
            suffixIcon: _searchCtrl.text.isNotEmpty
                ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _searchCtrl.clear(); setState(() {}); })
                : null,
          ),
          onChanged: (_) => setState(() {}),
        ),
        actions: [
          TextButton(onPressed: _search, child: const Text('Tìm', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600))),
        ],
      ),
      body: Column(
        children: [
          // Filter bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedType,
                    hint: const Text('Loại đăng', style: TextStyle(fontSize: 13)),
                    decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8), isDense: true),
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Tất cả')),
                      DropdownMenuItem(value: 'give', child: Text('Cho tặng')),
                      DropdownMenuItem(value: 'sell', child: Text('Thanh lý')),
                    ],
                    onChanged: (v) => setState(() => _selectedType = v),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _selectedCategory,
                    hint: const Text('Danh mục', style: TextStyle(fontSize: 13)),
                    decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 10, vertical: 8), isDense: true),
                    items: [
                      const DropdownMenuItem<String>(value: null, child: Text('Tất cả')),
                      ..._categories.map((c) => DropdownMenuItem<String>(value: c['value'], child: Text(c['label']!))),
                    ],
                    onChanged: (v) => setState(() => _selectedCategory = v),
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Results
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : !_hasSearched
                    ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: const [
                        Icon(Icons.search, size: 64, color: AppTheme.border),
                        SizedBox(height: 12),
                        Text('Nhập từ khóa để tìm kiếm', style: TextStyle(color: AppTheme.textSecondary)),
                      ]))
                    : _results.isEmpty
                        ? const Center(child: Text('Không tìm thấy kết quả', style: TextStyle(color: AppTheme.textSecondary)))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _results.length,
                            itemBuilder: (ctx, i) {
                              final post = _results[i];
                              return _SearchResultItem(
                                post: post,
                                onTap: () => Navigator.push(context, MaterialPageRoute(
                                  builder: (_) => PostDetailScreen(post: post, isFavorite: false, onToggleFavorite: () async {}),
                                )),
                              );
                            },
                          ),
          ),
        ],
      ),
    );
  }
}

class _SearchResultItem extends StatelessWidget {
  final Post post;
  final VoidCallback onTap;
  const _SearchResultItem({required this.post, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 72, height: 72,
                child: post.imageLabel.isNotEmpty
                    ? Image.network('${ApiService.baseUrl}/uploads/${post.imageLabel}', fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(color: AppTheme.border))
                    : Container(color: AppTheme.border),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(post.title, maxLines: 2, overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  const SizedBox(height: 6),
                  Text(post.displayPrice, style: TextStyle(
                    color: post.price == 0 ? AppTheme.success : AppTheme.warning,
                    fontWeight: FontWeight.bold,
                  )),
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.location_on_outlined, size: 12, color: AppTheme.textSecondary),
                    const SizedBox(width: 2),
                    Expanded(child: Text(post.province.isNotEmpty ? post.province : 'Chưa cập nhật',
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
                  ]),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
