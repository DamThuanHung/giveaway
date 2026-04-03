import 'package:flutter/material.dart';

// Class này giúp main.dart nhận diện được người dùng đã đăng nhập hay chưa
class AuthProvider with ChangeNotifier {
  // Mặc định cho là đã đăng nhập (true) để anh vào thẳng App test ảnh con mèo
  bool _isAuthenticated = true;

  bool get isAuth {
    return _isAuthenticated;
  }

  // Hàm đăng nhập giả lập
  Future<void> login() async {
    _isAuthenticated = true;
    notifyListeners();
  }

  // Hàm đăng xuất
  void logout() {
    _isAuthenticated = false;
    notifyListeners();
  }
}