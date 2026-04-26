import 'dart:async';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
export '../widgets/province_picker_sheet.dart' show RadiusMapResult;
import '../models/post.dart';
import '../services/api_service.dart';
import '../services/viewed_posts_service.dart';
import '../theme/app_theme.dart';
import '../data/categories.dart';
import '../widgets/province_picker_sheet.dart';
import '../widgets/post_card.dart';
import '../widgets/app_image.dart';
import '../widgets/skeleton.dart';
import 'post_detail_screen.dart';
import 'profile/keyword_alerts_screen.dart';

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
  String? _selectedJobType;    // null = tất cả, 'full-time', 'part-time', 'freelance', 'intern', 'remote'
  String _sortBy = 'newest';   // newest, price_asc, price_desc
  RangeValues _priceRange = const RangeValues(0, 50000000);
  static const double _maxPrice = 50000000;

  // GPS state — dùng RadiusMapResult từ ProvincePickerSheet
  RadiusMapResult? _radiusResult;

  List<Map<String, dynamic>> _viewedPosts = [];
  int _searchVersion = 0;
  int _page = 1;
  int _totalResults = 0;
  bool _isLoadingMore = false;
  bool _hasMorePages = false;
  bool _hasError = false;
  final _scrollCtrl = ScrollController();

  static const _historyKey = 'search_history';
  static const _maxHistory = 12;

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _loadViewedPosts();
    _scrollCtrl.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 300 &&
        !_isLoadingMore && !_isLoading && _hasMorePages) {
      _loadMorePosts();
    }
  }

  Future<void> _loadMorePosts() async {
    if (_isLoadingMore || !_hasMorePages || _isLoading) return;
    final version = _searchVersion; // capture để detect search mới
    setState(() { _isLoadingMore = true; _page++; });

    try {
      final result = await ApiService.getPosts(
        search: _searchCtrl.text.trim().isEmpty ? null : _searchCtrl.text.trim(),
        listingType: _selectedType,
        itemCategory: _selectedCategory,
        province: _radiusResult != null ? null : _selectedProvince,
        minPrice: _isPriceFiltered ? _priceRange.start.toInt() : null,
        maxPrice: _priceRange.end < _maxPrice ? _priceRange.end.toInt() : null,
        lat: _radiusResult?.lat,
        lng: _radiusResult?.lng,
        radius: _radiusResult?.radius,
        sortBy: _radiusResult != null ? null : (_sortBy == 'newest' ? null : _sortBy),
        postType: _selectedCategory == 'jobs' ? 'job' : null,
        subType: _selectedJobType,
        page: _page,
        limit: 20,
      );

      if (!mounted || version != _searchVersion) return;

      final more = ((result['data'] ?? []) as List).map((j) => Post.fromJson(j)).toList();
      final totalPages = (result['meta']?['totalPages'] as int?) ?? 1;
      final nowHasMore = _page < totalPages;

      if (more.isEmpty) {
        setState(() { _hasMorePages = false; });
        return;
      }

      final combined = [..._results, ...more];
      // GPS mode: re-sort toàn bộ list sau khi append page mới
      if (_radiusResult != null) {
        combined.sort((a, b) {
          final da = Geolocator.distanceBetween(_radiusResult!.lat, _radiusResult!.lng, a.latitude, a.longitude);
          final db = Geolocator.distanceBetween(_radiusResult!.lat, _radiusResult!.lng, b.latitude, b.longitude);
          return da.compareTo(db);
        });
      }
      setState(() {
        _results = combined;
        _hasMorePages = nowHasMore;
      });
    } catch (e) {
      if (!mounted || version != _searchVersion) return;
      debugPrint('❌ SearchTab._loadMorePosts error: $e');
      setState(() { _hasMorePages = false; _page--; });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Không thể tải thêm. Thử lại sau.'), behavior: SnackBarBehavior.floating),
      );
    } finally {
      if (mounted) setState(() => _isLoadingMore = false);
    }
  }

  Future<void> _loadViewedPosts() async {
    final data = await ViewedPostsService.load();
    if (!mounted) return;
    setState(() => _viewedPosts = data);
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _focusNode.dispose();
    _debounce?.cancel();
    _scrollCtrl.dispose();
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
      setState(() { _hasSearched = false; _results = []; _hasError = false; });
      return;
    }
    final version = ++_searchVersion;
    setState(() { _isLoading = true; _hasSearched = true; _hasError = false; });
    if (query.trim().isNotEmpty) await _saveHistory(query.trim());

    _page = 1;
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
      sortBy: _radiusResult != null ? null : (_sortBy == 'newest' ? null : _sortBy),
      postType: _selectedCategory == 'jobs' ? 'job' : null,
      subType: _selectedJobType,
      page: 1,
      limit: 20,
    );
    if (!mounted || version != _searchVersion) return;

    // Phát hiện lỗi mạng / server
    if (result['_isError'] == true) {
      debugPrint('❌ SearchTab._search error: query="$query" filters=[type:$_selectedType, cat:$_selectedCategory, province:$_selectedProvince]');
      setState(() { _isLoading = false; _hasError = true; });
      return;
    }

    List<Post> posts = ((result['data'] ?? []) as List).map((j) => Post.fromJson(j)).toList();
    final total = (result['meta']?['total'] as int?) ?? posts.length;

    // GPS mode: sort by distance client-side
    if (_radiusResult != null) {
      posts.sort((a, b) {
        final da = Geolocator.distanceBetween(_radiusResult!.lat, _radiusResult!.lng, a.latitude, a.longitude);
        final db = Geolocator.distanceBetween(_radiusResult!.lat, _radiusResult!.lng, b.latitude, b.longitude);
        return da.compareTo(db);
      });
      // Gợi ý mở rộng nếu ít kết quả (chỉ khi có ít nhất 1 kết quả)
      if (posts.isNotEmpty && posts.length < 5 && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Chỉ tìm thấy ${posts.length} kết quả trong ${_radiusResult!.radius.toInt()}km. Thử mở rộng bán kính?'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }

    final totalPages = (result['meta']?['totalPages'] as int?) ?? 1;
    setState(() {
      _results = posts;
      _totalResults = total;
      _hasMorePages = _page < totalPages;
      _isLoading = false;
    });
  }

  void _onChanged(String val) {
    setState(() {});
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () => _search(val));
  }

  void _selectHistory(String item) {
    _searchCtrl.text = item;
    _searchCtrl.selection = TextSelection.fromPosition(TextPosition(offset: item.length));
    _focusNode.unfocus();
    _search(item);
  }

  void _clearSearch() {
    _searchCtrl.clear();
    _focusNode.requestFocus();
    // Nếu còn filter active → search lại theo filter; nếu không → về history
    _search('');
  }

  // ── Filter active count ──────────────────────────
  bool get _isPriceFiltered => _priceRange.start > 0 || _priceRange.end < _maxPrice;

  String _fmtPrice(int price) {
    if (price >= 1000000) return '${(price / 1000000).toStringAsFixed(price % 1000000 == 0 ? 0 : 1)}tr';
    if (price >= 1000) return '${(price / 1000).toStringAsFixed(0)}k';
    return '$priceđ';
  }

  String _jobTypeLabel(String type) {
    const map = {
      'full-time': 'Toàn thời gian',
      'part-time': 'Bán thời gian',
      'freelance': 'Freelance',
      'intern': 'Thực tập',
      'remote': 'Remote',
    };
    return map[type] ?? type;
  }

  int get _activeFilterCount => [_selectedType, _selectedCategory, _selectedJobType, if (_radiusResult == null) _selectedProvince]
      .where((v) => v != null).length +
      (_sortBy != 'newest' ? 1 : 0) +
      (_isPriceFiltered ? 1 : 0) +
      (_radiusResult != null ? 1 : 0);

  void _openFilterSheet() {
    // Temp state trong sheet
    String? tmpType = _selectedType;
    String? tmpCat = _selectedCategory;
    String? tmpJobType = _selectedJobType;
    String? tmpProvince = _selectedProvince;
    String tmpSort = _sortBy;
    RangeValues tmpPrice = _priceRange;
    RadiusMapResult? tmpRadius = _radiusResult;

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
                        tmpType = null; tmpCat = null; tmpProvince = null;
                        tmpSort = 'newest'; tmpPrice = const RangeValues(0, _maxPrice);
                        tmpRadius = null;
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
                      // ── Loại đăng (ẩn khi chọn Việc làm) ──
                      if (tmpCat != 'jobs') ...[
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
                      ],

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

                      // ── Hình thức làm việc (chỉ hiện khi chọn Việc làm) ──
                      if (tmpCat == 'jobs') ...[
                        const Text('Hình thức làm việc', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                        const SizedBox(height: 10),
                        Wrap(
                          spacing: 8, runSpacing: 8,
                          children: [
                            _FilterChip(label: 'Tất cả', selected: tmpJobType == null,
                                onTap: () => setSheet(() => tmpJobType = null)),
                            _FilterChip(label: 'Toàn thời gian', selected: tmpJobType == 'full-time',
                                onTap: () => setSheet(() => tmpJobType = 'full-time')),
                            _FilterChip(label: 'Bán thời gian', selected: tmpJobType == 'part-time',
                                onTap: () => setSheet(() => tmpJobType = 'part-time')),
                            _FilterChip(label: 'Freelance', selected: tmpJobType == 'freelance',
                                onTap: () => setSheet(() => tmpJobType = 'freelance')),
                            _FilterChip(label: 'Thực tập', selected: tmpJobType == 'intern',
                                onTap: () => setSheet(() => tmpJobType = 'intern')),
                            _FilterChip(label: 'Remote', selected: tmpJobType == 'remote',
                                onTap: () => setSheet(() => tmpJobType = 'remote')),
                          ],
                        ),
                        const SizedBox(height: 20),
                      ],

                      // ── Khu vực ──
                      const Text('Khu vực', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                      const SizedBox(height: 10),

                      // Province picker — mở trên filter sheet (không đóng sheet trước)
                      GestureDetector(
                        onTap: () {
                          showModalBottomSheet(
                            context: context,
                            useRootNavigator: true,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => ProvincePickerSheet(
                              selected: tmpProvince,
                              radiusResult: tmpRadius,
                              onConfirm: (val) {
                                setSheet(() { tmpProvince = val; tmpRadius = null; });
                              },
                              onRadiusConfirm: (result) {
                                setSheet(() { tmpRadius = result; tmpProvince = null; });
                              },
                            ),
                          );
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                          decoration: BoxDecoration(
                            border: Border.all(color: (tmpProvince != null || tmpRadius != null) ? AppTheme.primary : AppTheme.border),
                            borderRadius: BorderRadius.circular(10),
                            color: (tmpProvince != null || tmpRadius != null) ? AppTheme.primary.withOpacity(0.04) : Colors.white,
                          ),
                          child: Row(
                            children: [
                              Icon(
                                tmpRadius != null ? Icons.near_me : Icons.location_on_outlined,
                                color: (tmpProvince != null || tmpRadius != null) ? AppTheme.primary : AppTheme.textSecondary,
                                size: 18,
                              ),
                              const SizedBox(width: 8),
                              Expanded(child: Text(
                                tmpRadius != null
                                    ? '${tmpRadius!.label} • ${tmpRadius!.radius.toInt()}km'
                                    : (tmpProvince ?? 'Toàn quốc'),
                                style: TextStyle(
                                  fontSize: 14,
                                  color: (tmpProvince != null || tmpRadius != null) ? AppTheme.primary : AppTheme.textSecondary,
                                  fontWeight: (tmpProvince != null || tmpRadius != null) ? FontWeight.w600 : FontWeight.normal,
                                ),
                              )),
                              const Icon(Icons.chevron_right, color: AppTheme.textSecondary, size: 18),
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
                        _selectedType = tmpCat == 'jobs' ? null : tmpType;
                        _selectedCategory = tmpCat;
                        _selectedJobType = tmpCat == 'jobs' ? tmpJobType : null;
                        _selectedProvince = tmpProvince;
                        _sortBy = tmpSort;
                        _radiusResult = tmpRadius;
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
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: TextField(
                  controller: _searchCtrl,
                  focusNode: _focusNode,
                  textInputAction: TextInputAction.search,
                  maxLength: 100,
                  onSubmitted: _search,
                  onChanged: _onChanged,
                  decoration: InputDecoration(
                    counterText: '',
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
            // Nút filter — 48×48 tap target, có Tooltip cho accessibility
            Tooltip(
              message: 'Bộ lọc',
              child: GestureDetector(
                onTap: _openFilterSheet,
                child: Container(
                  height: 48, width: 48,
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
                            width: 12, height: 12,
                            decoration: const BoxDecoration(color: Colors.orange, shape: BoxShape.circle),
                          ),
                        ),
                    ],
                  ),
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
                        onRemove: () { setState(() { _selectedCategory = null; _selectedJobType = null; }); _search(_searchCtrl.text); },
                      ),
                    if (_selectedJobType != null)
                      _ActiveChip(
                        label: _jobTypeLabel(_selectedJobType!),
                        onRemove: () { setState(() => _selectedJobType = null); _search(_searchCtrl.text); },
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
                ? const SearchListSkeleton()
                : _hasError
                    ? _buildError()
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
    final hasViewed = _viewedPosts.isNotEmpty;
    final hasHistory = _history.isNotEmpty;

    if (!hasViewed && !hasHistory) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.manage_search, size: 64, color: AppTheme.border),
            SizedBox(height: 12),
            Text('Nhập từ khóa để bắt đầu tìm kiếm',
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
          ],
        ),
      );
    }

    return ListView(
      children: [
        // ── Đã xem gần đây ──
        if (hasViewed) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                const Text('Đã xem gần đây',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
                const Spacer(),
                GestureDetector(
                  onTap: () async {
                    await ViewedPostsService.clear();
                    setState(() => _viewedPosts = []);
                  },
                  child: const Text('Xóa',
                      style: TextStyle(fontSize: 13, color: AppTheme.primary, fontWeight: FontWeight.w500)),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 155,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _viewedPosts.length,
              itemBuilder: (_, i) {
                final p = _viewedPosts[i];
                final isFree = p['listingType'] == 'give' || (p['price'] as int? ?? 0) == 0;
                final imgUrl = (p['images'] as List?)?.isNotEmpty == true
                    ? p['images'][0].toString()
                    : p['imageLabel']?.toString().isNotEmpty == true
                        ? ApiService.buildImageUrl(p['imageLabel'].toString())
                        : '';
                return GestureDetector(
                  onTap: () {
                    final post = Post(
                      id: p['id'] ?? '',
                      title: p['title'] ?? '',
                      description: '',
                      price: p['price'] as int? ?? 0,
                      province: p['province'] ?? '',
                      district: '', ward: '', addressDetail: '',
                      listingType: p['listingType'] ?? 'sell',
                      itemCategory: 'other',
                      status: 'available',
                      imageLabel: p['imageLabel'] ?? '',
                      images: (p['images'] as List?)?.map((e) => e.toString()).toList(),
                    );
                    Navigator.push(context, MaterialPageRoute(
                      builder: (_) => PostDetailScreen(post: post, isFavorite: false, onToggleFavorite: () async {}),
                    )).then((_) => _loadViewedPosts());
                  },
                  child: Container(
                    width: 110,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                        child: AppImage(url: imgUrl, height: 80, width: double.infinity),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.all(6),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(p['title'] ?? '',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                                maxLines: 2, overflow: TextOverflow.ellipsis),
                            const Spacer(),
                            Text(
                              isFree ? 'Miễn phí' : PostCard.formatPrice(p['price'] as int? ?? 0, p['listingType'] ?? 'sell'),
                              style: TextStyle(
                                fontSize: 11, fontWeight: FontWeight.bold,
                                color: isFree ? AppTheme.freeColor : AppTheme.priceColor,
                              ),
                            ),
                          ]),
                        ),
                      ),
                    ]),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
        ],

        // ── Lịch sử tìm kiếm ──
        if (hasHistory) ...[
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
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
          ...List.generate(_history.length, (i) {
            final item = _history[i];
            return ListTile(
              leading: const Icon(Icons.history, color: AppTheme.textSecondary, size: 20),
              title: Text(item, style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary)),
              trailing: GestureDetector(
                onTap: () => _removeHistory(item),
                child: const Padding(
                  padding: EdgeInsets.all(8),
                  child: Icon(Icons.close, size: 16, color: AppTheme.textSecondary),
                ),
              ),
              dense: false,
              onTap: () => _selectHistory(item),
            );
          }),
        ],
      ],
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.wifi_off, size: 64, color: AppTheme.border),
          const SizedBox(height: 12),
          const Text('Không thể kết nối. Kiểm tra mạng và thử lại.',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
              textAlign: TextAlign.center),
          const SizedBox(height: 16),
          OutlinedButton.icon(
            onPressed: () => _search(_searchCtrl.text),
            icon: const Icon(Icons.refresh, size: 16),
            label: const Text('Thử lại'),
            style: OutlinedButton.styleFrom(foregroundColor: AppTheme.primary),
          ),
        ],
      ),
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
          if (_activeFilterCount > 0) ...[
            const SizedBox(height: 12),
            TextButton.icon(
              onPressed: () {
                setState(() {
                  _selectedType = null;
                  _selectedCategory = null;
                  _selectedJobType = null;
                  _selectedProvince = null;
                  _sortBy = 'newest';
                  _priceRange = const RangeValues(0, _maxPrice);
                  _radiusResult = null;
                });
                _search(_searchCtrl.text);
              },
              icon: const Icon(Icons.filter_alt_off, size: 16),
              label: const Text('Xóa bộ lọc'),
              style: TextButton.styleFrom(foregroundColor: AppTheme.primary),
            ),
          ],
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
          child: Row(
            children: [
              Expanded(
                child: Text(
                  _radiusResult != null
                      ? '${_results.length} kết quả'
                      : (_totalResults > 0 ? '$_totalResults kết quả' : '${_results.length} kết quả'),
                  style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                ),
              ),
              if (_searchCtrl.text.trim().isNotEmpty)
                _KeywordFollowButton(keyword: _searchCtrl.text.trim()),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            color: AppTheme.primary,
            onRefresh: () => _search(_searchCtrl.text),
            child: ListView.builder(
              controller: _scrollCtrl,
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
              itemCount: _results.length + (_hasMorePages ? 1 : 0),
              itemBuilder: (ctx, i) {
                // Footer load more
                if (i == _results.length) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: _isLoadingMore
                        ? const Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)))
                        : TextButton(
                            onPressed: _loadMorePosts,
                            child: const Text('Xem thêm'),
                          ),
                  );
                }
                final post = _results[i];
                String imgUrl = '';
                if (post.images != null && post.images!.isNotEmpty) {
                  imgUrl = post.images!.first;
                } else if (post.imageLabel.isNotEmpty) {
                  imgUrl = ApiService.buildImageUrl(post.imageLabel);
                }
                return GestureDetector(
                  onTap: () {
                    _focusNode.unfocus();
                    Navigator.push(ctx, MaterialPageRoute(
                      builder: (_) => PostDetailScreen(post: post, isFavorite: false, onToggleFavorite: () async {}),
                    )).then((_) => _loadViewedPosts());
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
                        // Ảnh + badge trạng thái
                        Stack(
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: AppImage(url: imgUrl, width: 90, height: 90),
                            ),
                            // Overlay "Đã bán/Tặng"
                            if (post.isDone)
                              Positioned.fill(
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.black.withOpacity(0.5),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  alignment: Alignment.center,
                                  child: const Text('Đã xong',
                                      style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            // Badge "Đang giữ"
                            if (post.isReserved)
                              Positioned(
                                bottom: 0, left: 0, right: 0,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.warning.withOpacity(0.88),
                                    borderRadius: const BorderRadius.only(
                                      bottomLeft: Radius.circular(8),
                                      bottomRight: Radius.circular(8),
                                    ),
                                  ),
                                  child: const Center(
                                    child: Text('Đang giữ',
                                        style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(post.title,
                                  maxLines: 2, overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                    color: post.isDone ? AppTheme.textSecondary : AppTheme.textPrimary,
                                  )),
                              const SizedBox(height: 6),
                              Text(
                                  PostCard.formatPrice(post.price, post.listingType),
                                  style: TextStyle(
                                    color: post.isFree ? AppTheme.freeColor : AppTheme.priceColor,
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
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(fontSize: 12, color: AppTheme.primary, fontWeight: FontWeight.w500)),
                                ],
                              ]),
                              if (post.formattedDate.isNotEmpty) ...[
                                const SizedBox(height: 3),
                                Text(
                                  post.formattedDate,
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                ),
                              ],
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

class _KeywordFollowButton extends StatefulWidget {
  final String keyword;
  const _KeywordFollowButton({required this.keyword});

  @override
  State<_KeywordFollowButton> createState() => _KeywordFollowButtonState();
}

class _KeywordFollowButtonState extends State<_KeywordFollowButton> {
  bool _following = false;
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _checkStatus();
  }

  @override
  void didUpdateWidget(_KeywordFollowButton old) {
    super.didUpdateWidget(old);
    if (old.keyword != widget.keyword) _checkStatus();
  }

  Future<void> _checkStatus() async {
    final list = await ApiService.getKeywordAlerts();
    if (!mounted) return;
    final kw = widget.keyword.trim().toLowerCase();
    setState(() => _following = list.any((e) => e['keyword'] == kw));
  }

  Future<void> _toggle() async {
    setState(() => _loading = true);
    if (_following) {
      await ApiService.unsubscribeKeyword(widget.keyword);
      if (mounted) {
        setState(() { _following = false; _loading = false; });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Đã bỏ theo dõi từ khóa'), duration: Duration(seconds: 2)),
        );
      }
    } else {
      final err = await ApiService.subscribeKeyword(widget.keyword);
      if (mounted) {
        setState(() { _loading = false; });
        if (err != null) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: AppTheme.error));
        } else {
          setState(() => _following = true);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Đang theo dõi "${widget.keyword}"'),
              duration: const Duration(seconds: 2),
              action: SnackBarAction(
                label: 'Quản lý',
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const KeywordAlertsScreen())),
              ),
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _loading ? null : _toggle,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: _following ? AppTheme.primary.withOpacity(0.12) : AppTheme.surface,
          border: Border.all(color: _following ? AppTheme.primary : AppTheme.border),
          borderRadius: BorderRadius.circular(20),
        ),
        child: _loading
            ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 1.5))
            : Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(_following ? Icons.notifications_active : Icons.notifications_none,
                    size: 14, color: _following ? AppTheme.primary : AppTheme.textSecondary),
                const SizedBox(width: 4),
                Text(
                  _following ? 'Đang theo dõi' : 'Theo dõi',
                  style: TextStyle(
                    fontSize: 12,
                    color: _following ? AppTheme.primary : AppTheme.textSecondary,
                    fontWeight: _following ? FontWeight.w600 : FontWeight.normal,
                  ),
                ),
              ]),
      ),
    );
  }
}
