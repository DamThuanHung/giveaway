import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/post.dart';

class PostProvider with ChangeNotifier {
  List<Post> _posts = [];
  bool _isLoading = false;
  bool _hasError = false;
  int _currentPage = 1;
  bool _hasMore = true;
  int _total = 0;

  String? _listingType;
  String? _itemCategory;
  String? _province;
  List<String>? _provinces;
  double? _lat;
  double? _lng;
  double? _radius;

  List<Post> get posts => _posts;
  bool get isLoading => _isLoading;
  bool get hasError => _hasError;
  bool get hasMore => _hasMore;
  int get total => _total;
  String? get province => _province;
  double? get lat => _lat;
  double? get lng => _lng;
  double? get radius => _radius;
  bool get isRadiusMode => _lat != null && _lng != null && _radius != null;

  Future<void> fetchPosts({
    bool refresh = true,
    String? listingType,
    String? itemCategory,
    String? province,
    List<String>? provinces,
    double? lat,
    double? lng,
    double? radius,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _listingType = listingType;
      _itemCategory = itemCategory;
      _province = province;
      _provinces = provinces;
      _lat = lat;
      _lng = lng;
      _radius = radius;
    } else if (!_hasMore || _isLoading) {
      return;
    }

    _isLoading = true;
    _hasError = false;
    if (refresh) _posts = [];
    notifyListeners();

    try {
      final result = await ApiService.getPosts(
        page: _currentPage,
        limit: 20,
        listingType: _listingType,
        itemCategory: _itemCategory,
        province: isRadiusMode ? null : _province,
        provinces: isRadiusMode ? null : _provinces,
        lat: _lat,
        lng: _lng,
        radius: _radius,
      );
      final List<dynamic> data = result['data'] ?? [];
      final meta = result['meta'] ?? {};

      _total = meta['total'] ?? 0;
      final totalPages = meta['totalPages'] ?? 1;
      _hasMore = _currentPage < totalPages;

      final newPosts = data.map((json) => Post.fromJson(json)).toList();

      if (refresh) {
        _posts = newPosts;
      } else {
        _posts = [..._posts, ...newPosts];
        _currentPage++;
      }
    } catch (e) {
      _hasError = true;
      debugPrint('❌ PostProvider error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() => fetchPosts(
        refresh: false,
        listingType: _listingType,
        itemCategory: _itemCategory,
        province: _province,
        provinces: _provinces,
        lat: _lat,
        lng: _lng,
        radius: _radius,
      );
}
