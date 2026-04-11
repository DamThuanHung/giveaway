import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
export '../widgets/province_picker_sheet.dart' show RadiusMapResult;
import '../models/post.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../data/categories.dart';
import '../widgets/province_picker_sheet.dart';
import '../widgets/post_card.dart';
import 'post_detail_screen.dart';

class SearchTab extends StatefulWidget {
  const SearchTab({super.key});

  @override
  State<SearchTab> createState() => _SearchTabState();
}

class _SearchTabState extends State<SearchTab> {
  final _searchCtrl = TextEditingController();
  final _focusNode = FocusNode();

  List<String> _history = [];
  List<Post> _results = [];
  bool _isLoading = false;
  bool _hasSearched = false;
  Timer? _debounce;

  // Filter state
  String? _selectedType;       // null = tất cả, 'give', 'sell'
  String? _selectedCategory;   // null = tất cả
  String? _selectedProvince;   // null = tất cả
  String _sortBy = 'newest';   // newest, price_asc, price_desc
  RangeValues _priceRange = const RangeValues(0, 50000000);
  static const double _maxPrice = 50000000;

  // GPS state — dùng RadiusMapResult từ ProvincePickerSheet
  RadiusMapResult? _radiusResult;

  static const _historyKey = 'search_history';
  static const _maxHistory = 12;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  // ── History ─────────────────────────────────────
  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() => _history = prefs.getStringList(_historyKey) ?? []);
  }

  Future<void> _saveHistory(String query) async {
    if (query.trim().isEmpty) return;
    final prefs = await SharedPreferences.getInstance();
    final updated = [
      query.trim(),
      ..._history.where((h) => h.toLowerCase() != query.trim().toLowerCase()),
    ].take(_maxHistory).toList();
    await prefs.setStringList(_historyKey, updated);
    setState(() => _history = updated);
  }

  Future<void> _removeHistory(String item) async {
    final prefs = await SharedPreferences.getInstance();
    final updated = _history.where((h) => h != item).toList();
    await prefs.setStringList(_historyKey, updated);
    setState(() => _history = updated);
  }

  Future<void> _clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_historyKey);
    setState(() => _history = []);
  }

  String _formatDistance(Post post) {
    if (_radiusResult == null || post.latitude == 0.0 || post.longitude == 0.0) return '';
    final dist = Geolocator.distanceBetween(
      _radiusResult!.lat, _radiusResult!.lng,
      post.latitude, post.longitude,
    );
    if (dist < 1000) return '${dist.toInt()}m';
    return '${(dist / 1000).toStringAsFixed(1)}km';
  }

  // ── Search ───────────────────────────────────────
  Future<void> _search(String query) async {
    _debounce?.cancel();
    if (query.trim().isEmpty && _selectedType == null && _selectedCategory == null && _selectedProvince == null && _radiusResult == null) {
      setState(() { _hasSearched = false; _results = []; });
      return;
    }
    setState(() { _isLoading = true; _hasSearched = true; });
    if (query.trim().isNotEmpty) await _saveHistory(query.trim());

    final result = await ApiService.getPosts(
      search: query.trim().isEmpty ? null : query.trim(),
      listingType: _selectedType,
      itemCategory: _selectedCategory,
      province: _radiusResult != null ? null : _selectedProvince,
      minPrice: _isPriceFiltered ? _priceRange.start.toInt() : null,
      maxPrice: _priceRange.end < _maxPrice ? _priceRange.end.toInt() : null,
      lat: _radiusResult?.lat,
      lng: _radiusResult?.lng,
      radius: _radiusResult?.radius,
      limit: 50,
    );
    if (!mounted) return;
    List<Post> posts = ((result['data'] ?? []) as List).map((j) => Post.fromJson(j)).toList();

    // Sort client-side
    if (_radiusResult != null) {
      posts.sort((a, b) {
        final da = Geolocator.distanceBetween(_radiusResult!.lat, _radiusResult!.lng, a.latitude, a.longitude);
        final db = Geolocator.distanceBetween(_radiusResult!.lat, _radiusResult!.lng, b.latitude, b.longitude);
        return da.compareTo(db);
      });
    } else if (_sortBy == 'price_asc') {
      posts.sort((a, b) => a.price.compareTo(b.price));
    } else if (_sortBy == 'price_desc') {
      posts.sort((a, b) => b.price.compareTo(a.price));
    }

    // Fallback: GPS < 5 kết quả → gợi ý mở rộng
    if (_radiusResult != null && posts.length < 5 && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Chỉ tìm thấy ${posts.length} kết quả trong ${_radiusResult!.radius.toInt()}km. Thử mở rộng bán kính?'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }

    setState(() { _results = posts; _isLoading = false; });
  }

  void _onChanged(String val) {
    setState(() {});
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () => _search(val));
  }

  void _selectHistory(String item) {
    _searchCtrl.text = item;
    _searchCtrl.selection = TextSelection.fromPosition(TextPosition(offset: item.length));
    _focusNode.unfocus();
    _search(item);
  }

  void _clearSearch() {
    _searchCtrl.clear();
    setState(() { _hasSearched = false; _results = []; });
    _focusNode.requestFocus();
  }

  // ── Filter active count ──────────────────────────
  bool get _isPriceFiltered => _priceRange.start > 0 || _priceRange.end < _maxPrice;

  String _fmtPrice(int price) {
    if (price >= 1000000) return '${(price / 1000000).toStringAsFixed(price % 1000000 == 0 ? 0 : 1)}tr';
    if (price >= 1000) return '${(price / 1000).toStringAsFixed(0)}k';
    return '${price}đ';
  }

  int get _activeFilterCount => [_selectedType, _selectedCategory, if (_radiusResult == null) _selectedProvince]
      .where((v) => v != null).length +
      (_sortBy != 'newest' ? 1 : 0) +
      (_isPriceFiltered ? 1 : 0) +
      (_radiusResult != null ? 1 : 0);

  void _openFilterSheet() {
    // Temp state trong sheet
    String? tmpType = _selectedType;
    String? tmpCat = _selectedCategory;
    String? tmpProvince = _selectedProvince;
    String tmpSort = _sortBy;
    RangeValues tmpPrice = _priceRange;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheet) => Container(
          height: MediaQuery.of(context).size.height * 0.82,
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
              ),
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Row(
                  children: [
                    const Text('Bộ lọc tìm kiếm', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold)),
                    const Spacer(),
                    TextButton(
                      onPressed: () => setSheet(() {
                        tmpType = null; tmpCat = null; tmpProvince = null; tmpSort = 'newest';
                      }),
                      child: const Text('Đặt lại', style: TextStyle(color: AppTheme.textSecondary)),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Loại đăng ──
                      const Text('Loại đăng', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        children: [
                          _FilterChip(label: 'Tất cả', selected: tmpType == null,
                              onTap: () => setSheet(() => tmpType = null)),
                          _FilterChip(label: '🎁 Tặng miễn phí', selected: tmpType == 'give',
                              onTap: () => setSheet(() => tmpType = 'give')),
                          _FilterChip(label: '💰 Thanh lý', selected: tmpType == 'sell',
                              onTap: () => setSheet(() => tmpType = 'sell')),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // ── Sắp xếp ──
                      const Text('Sắp xếp theo', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        children: [
                          _FilterChip(label: '🕐 Mới nhất', selected: tmpSort == 'newest',
                              onTap: () => setSheet(() => tmpSort = 'newest')),
                          _FilterChip(label: '💲 Giá tăng dần', selected: tmpSort == 'price_asc',
                              onTap: () => setSheet(() => tmpSort = 'price_asc')),
                          _FilterChip(label: '💲 Giá giảm dần', selected: tmpSort == 'price_desc',
                              onTap: () => setSheet(() => tmpSort = 'price_desc')),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // ── Khoảng giá (ẩn khi chọn Cho tặng) ──
                      if (tmpType != 'give') ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Khoảng giá', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            Text(
                              tmpPrice.start == 0 && tmpPrice.end >= _maxPrice
                                  ? 'Tất cả'
                                  : '${_fmtPrice(tmpPrice.start.toInt())} — ${tmpPrice.end >= _maxPrice ? '50tr+' : _fmtPrice(tmpPrice.end.toInt())}',
                              style: const TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w500),
                            ),
                          ],
                        ),
                        RangeSlider(
                          values: tmpPrice,
                          min: 0,
                          max: _maxPrice,
                          divisions: 100,
                          activeColor: AppTheme.primary,
                          inactiveColor: AppTheme.border,
                          labels: RangeLabels(
                            _fmtPrice(tmpPrice.start.toInt()),
                            tmpPrice.end >= _maxPrice ? '50tr+' : _fmtPrice(tmpPrice.end.toInt()),
                          ),
                          onChanged: (v) => setSheet(() => tmpPrice = v),
                        ),
                        const SizedBox(height: 8),
                      ],

                      // ── Danh mục ──
                      const Text('Danh mục', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          _FilterChip(label: 'Tất cả', selected: tmpCat == null,
                              onTap: () => setSheet(() => tmpCat = null)),
                          ...AppCategories.list.map((c) => _FilterChip(
                            label: c['label']!,
                            selected: tmpCat == c['value'],
                            onTap: () => setSheet(() => tmpCat = c['value']),
                          )),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // ── Khu vực ──
                      const Text('Khu vực', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 10),

                      // Province picker — tab Bản đồ bên trong đã có GPS
                      GestureDetector(
                        onTap: () {
                          Navigator.pop(context);
                          Future.delayed(const Duration(milliseconds: 300), () {
                            if (!mounted) return;
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => ProvincePickerSheet(
                                selected: _selectedProvince,
                                radiusResult: _radiusResult,
                                onConfirm: (val) {
                                  setState(() {
                                    _selectedProvince = val;
                                    _radiusResult = null;
                                  });
                                  _search(_searchCtrl.text);
                                },
                                onRadiusConfirm: (result) {
                                  setState(() {
                                    _radiusResult = result;
                                    _selectedProvince = null;
                                  });
                                  _search(_searchCtrl.text);
                                },
                              ),
                            );
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                          decoration: BoxDecoration(
                            border: Border.all(color: (_selectedProvince != null || _radiusResult != null) ? AppTheme.primary : AppTheme.border),
                            borderRadius: BorderRadius.circular(10),
                            color: (_selectedProvince != null || _radiusResult != null) ? AppTheme.primary.withOpacity(0.04) : Colors.white,
                          ),
                          child: Row(
                            children: [
                              Icon(
                                _radiusResult != null ? Icons.near_me : Icons.location_on_outlined,
                                color: (_selectedProvince != null || _radiusResult != null) ? AppTheme.primary : AppTheme.textSecondary,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Expanded(child: Text(
                                _radiusResult != null
                                    ? '${_radiusResult!.label} • ${_radiusResult!.radius.toInt()}km'
                                    : (_selectedProvince ?? 'Toàn quốc'),
                                style: TextStyle(
                                  fontSize: 14,
                                  color: (_selectedProvince != null || _radiusResult != null) ? AppTheme.primary : AppTheme.textSecondary,
                                  fontWeight: (_selectedProvince != null || _radiusResult != null) ? FontWeight.w600 : FontWeight.normal,
                                ),
                              )),
                              Icon(Icons.chevron_right, color: AppTheme.textSecondary, size: 18),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // ── Nút áp dụng ──
              Padding(
                padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).padding.bottom + 12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                      setState(() {
                        _selectedType = tmpType;
                        _selectedCategory = tmpCat;
                        _selectedProvince = tmpProvince;
                        _sortBy = tmpSort;
                        _priceRange = tmpType == 'give'
                            ? const RangeValues(0, _maxPrice)
                            : tmpPrice;
                      });
                      _search(_searchCtrl.text);
                    },
                    child: const Text('Áp dụng', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ── Build ────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final hasActiveFilter = _activeFilterCount > 0;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        titleSpacing: 12,
        title: Row(
          children: [
            Expanded(
              child: Container(
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFF2F2F2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  focusNode: _focusNode,
                  textInputAction: TextInputAction.search,
                  onSubmitted: _search,
                  onChanged: _onChanged,
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm đồ dùng...',
                    hintStyle: const TextStyle(color: Colors.grey, fontSize: 14),
                    border: InputBorder.none,
                    prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? GestureDetector(
                            onTap: _clearSearch,
                            child: const Icon(Icons.close, color: Colors.grey, size: 18),
                          )
                        : null,
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            // Nút filter
            GestureDetector(
              onTap: _openFilterSheet,
              child: Container(
                height: 40, width: 40,
                decoration: BoxDecoration(
                  color: hasActiveFilter ? AppTheme.primary : const Color(0xFFF2F2F2),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Icon(Icons.tune_rounded,
                        color: hasActiveFilter ? Colors.white : Colors.grey, size: 22),
                    if (hasActiveFilter)
                      Positioned(
                        top: 6, right: 6,
                        child: Container(
                          width: 8, height: 8,
                          decoration: const BoxDecoration(color: Colors.orange, shape: BoxShape.circle),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 4),
          ],
        ),
      ),
      body: Column(
        children: [
          // Active filter chips
          if (hasActiveFilter)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.fromLTRB(12, 6, 12, 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    if (_selectedType != null)
                      _ActiveChip(
                        label: _selectedType == 'give' ? 'Tặng miễn phí' : 'Thanh lý',
                        onRemove: () { setState(() => _selectedType = null); _search(_searchCtrl.text); },
                      ),
                    if (_selectedCategory != null)
                      _ActiveChip(
                        label: AppCategories.labelOf(_selectedCategory!),
                        onRemove: () { setState(() => _selectedCategory = null); _search(_searchCtrl.text); },
                      ),
                    if (_selectedProvince != null)
                      _ActiveChip(
                        label: _selectedProvince!,
                        onRemove: () { setState(() => _selectedProvince = null); _search(_searchCtrl.text); },
                      ),
                    if (_sortBy != 'newest')
                      _ActiveChip(
                        label: _sortBy == 'price_asc' ? 'Giá tăng dần' : 'Giá giảm dần',
                        onRemove: () { setState(() => _sortBy = 'newest'); _search(_searchCtrl.text); },
                      ),
                    if (_isPriceFiltered)
                      _ActiveChip(
                        label: '${_fmtPrice(_priceRange.start.toInt())} — ${_priceRange.end >= _maxPrice ? '50tr+' : _fmtPrice(_priceRange.end.toInt())}',
                        onRemove: () { setState(() => _priceRange = const RangeValues(0, _maxPrice)); _search(_searchCtrl.text); },
                      ),
                    if (_radiusResult != null)
                      _ActiveChip(
                        label: '📍 ${_radiusResult!.radius.toInt()}km',
                        onRemove: () { setState(() { _radiusResult = null; }); _search(_searchCtrl.text); },
                      ),
                  ],
                ),
              ),
            ),

          // Nội dung
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
                : !_hasSearched
                    ? _buildHistory()
                    : _results.isEmpty
                        ? _buildEmpty()
                        : _buildResults(),
          ),
        ],
      ),
    );
  }

  Widget _buildHistory() {
    if (_history.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.manage_search, size: 64, color: AppTheme.border),
            SizedBox(height: 12),
            Text('Nhập từ khóa để bắt đầu tìm kiếm',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Row(
            children: [
              const Text('Lịch sử tìm kiếm',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
              const Spacer(),
              GestureDetector(
                onTap: _clearHistory,
                child: const Text('Xóa tất cả',
                    style: TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w500)),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            itemCount: _history.length,
            itemBuilder: (_, i) {
              final item = _history[i];
              return ListTile(
                leading: const Icon(Icons.history, color: AppTheme.textSecondary, size: 20),
                title: Text(item, style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary)),
                trailing: GestureDetector(
                  onTap: () => _removeHistory(item),
                  child: const Icon(Icons.close, size: 16, color: AppTheme.textSecondary),
                ),
                dense: true,
                onTap: () => _selectHistory(item),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off, size: 64, color: AppTheme.border),
          const SizedBox(height: 12),
          Text(
            _searchCtrl.text.isNotEmpty
                ? 'Không tìm thấy kết quả cho "${_searchCtrl.text}"'
                : 'Không có kết quả phù hợp',
            style: const TextStyle(color: AppTheme.textSecondary),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildResults() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: Text('${_results.length} kết quả',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
            itemCount: _results.length,
            itemBuilder: (ctx, i) {
              final post = _results[i];
              final imgUrl = post.imageLabel.isNotEmpty
                  ? '${ApiService.baseUrl}/uploads/${post.imageLabel}'
                  : '';
              return GestureDetector(
                onTap: () {
                  _focusNode.unfocus();
                  Navigator.push(ctx, MaterialPageRoute(
                    builder: (_) => PostDetailScreen(post: post, isFavorite: false, onToggleFavorite: () async {}),
                  ));
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
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
                          child: imgUrl.isNotEmpty
                              ? Image.network(imgUrl, fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(color: AppTheme.border))
                              : Container(color: AppTheme.border,
                                  child: const Icon(Icons.image_outlined, color: AppTheme.textSecondary)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(post.title,
                                maxLines: 2, overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            const SizedBox(height: 6),
                            Text(
                                PostCard.formatPrice(post.price, post.listingType),
                                style: TextStyle(
                                  color: (post.listingType == 'give' || post.price == 0) ? AppTheme.freeColor : AppTheme.priceColor,
                                  fontWeight: FontWeight.bold, fontSize: 14,
                                )),
                            const SizedBox(height: 4),
                            Row(children: [
                              const Icon(Icons.location_on_outlined, size: 12, color: AppTheme.textSecondary),
                              const SizedBox(width: 2),
                              Expanded(child: Text(
                                post.province.isNotEmpty ? post.province : 'Chưa cập nhật',
                                maxLines: 1, overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                              )),
                              if (_radiusResult != null && _formatDistance(post).isNotEmpty) ...[
                                const SizedBox(width: 4),
                                Text('• ${_formatDistance(post)}',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500)),
                              ],
                            ]),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ── Widgets ──────────────────────────────────────────

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : const Color(0xFFF2F2F2),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.primary : Colors.transparent),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: selected ? Colors.white : AppTheme.textPrimary,
            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _ActiveChip extends StatelessWidget {
  final String label;
  final VoidCallback onRemove;
  const _ActiveChip({required this.label, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppTheme.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500)),
          const SizedBox(width: 4),
          GestureDetector(
            onTap: onRemove,
            child: const Icon(Icons.close, size: 14, color: AppTheme.primary),
          ),
        ],
      ),
    );
  }
}
