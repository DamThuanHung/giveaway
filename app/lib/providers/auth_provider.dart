import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  bool _isAuthenticated = false;
  String? _userId;
  String? _userName;
  String? _userEmail;
  String? _userAvatar;
  String? _userRole;
  bool _isLoading = true;

  bool get isAuth => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  String? get userAvatar => _userAvatar;
  String? get userRole => _userRole;

  AuthProvider() {
    _tryAutoLogin();
  }

  Future<void> _tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token != null && token.isNotEmpty) {
      _userId = prefs.getString('user_id');
      _userName = prefs.getString('user_name');
      _userEmail = prefs.getString('user_email');
      _userAvatar = prefs.getString('user_avatar');
      _userRole = prefs.getString('user_role');
      _isAuthenticated = true;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<String?> login(String email, String password) async {
    final user = await ApiService.login(email, password);
    if (user != null) {
      _userId = user['id'];
      _userName = user['name'];
      _userEmail = user['email'];
      _userAvatar = user['avatar'];
      _userRole = user['role'];
      _isAuthenticated = true;
      notifyListeners();
      return null; // null = success
    }
    return 'Email hoặc mật khẩu không đúng';
  }

  Future<String?> register(String name, String email, String password) async {
    final user = await ApiService.register(name, email, password);
    if (user != null) {
      _userId = user['id'];
      _userName = user['name'];
      _userEmail = user['email'];
      _isAuthenticated = true;
      notifyListeners();
      return null;
    }
    return 'Đăng ký thất bại. Email có thể đã tồn tại.';
  }

  Future<void> logout() async {
    await ApiService.logout();
    _isAuthenticated = false;
    _userId = null;
    _userName = null;
    _userEmail = null;
    _userAvatar = null;
    notifyListeners();
  }

  void updateAvatar(String url) {
    _userAvatar = url;
    notifyListeners();
  }

  void updateName(String name) {
    _userName = name;
    notifyListeners();
  }
}
