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

  List<Post> get posts => _posts;
  bool get isLoading => _isLoading;
  bool get hasError => _hasError;
  bool get hasMore => _hasMore;
  int get total => _total;

  Future<void> fetchPosts({
    bool refresh = true,
    String? listingType,
    String? itemCategory,
  }) async {
    if (refresh) {
      _currentPage = 1;
      _hasMore = true;
      _listingType = listingType;
      _itemCategory = itemCategory;
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
      );
}
