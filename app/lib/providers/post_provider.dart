import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/post.dart'; // Bắt buộc phải import Model

class PostProvider with ChangeNotifier {
  List<Post> _posts = []; // Đổi từ dynamic sang List<Post> chuẩn
  bool _isLoading = false;

  List<Post> get posts => _posts;
  bool get isLoading => _isLoading;

  Future<void> fetchPosts() async {
    _isLoading = true;
    _posts = [];
    notifyListeners();

    try {
      final List<dynamic> data = await ApiService.getPosts();
      // ĐÚNG LUẬT: Dùng factory Post.fromJson để dịch dữ liệu từ Backend
      _posts = data.map((json) => Post.fromJson(json)).toList();
    } catch (e) {
      debugPrint("❌ Lỗi kết nối PostProvider: $e");
      _posts = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}