import 'package:firebase_messaging/firebase_messaging.dart';
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
  bool _isPhoneVerified = false;
  bool _isLoading = true;
  bool _isNewUser = false;

  bool get isAuth => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get userId => _userId;
  String? get userName => _userName;
  String? get userEmail => _userEmail;
  String? get userAvatar => _userAvatar;
  String? get userRole => _userRole;
  bool get isPhoneVerified => _isPhoneVerified;
  bool get isNewUser => _isNewUser;

  AuthProvider() {
    _tryAutoLogin();
  }

  Future<void> loadFromPrefs() => _tryAutoLogin();

  Future<void> _tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    if (token != null && token.isNotEmpty) {
      _userId = prefs.getString('user_id');
      _userName = prefs.getString('user_name');
      _userEmail = prefs.getString('user_email');
      _userAvatar = prefs.getString('user_avatar');
      _userRole = prefs.getString('user_role');
      _isPhoneVerified = prefs.getBool('is_phone_verified') ?? false;
      _isAuthenticated = true;
      _sendFcmToken();
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<void> _sendFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await ApiService.saveFcmToken(token);
    } catch (_) {}
  }

  Future<String?> devLogin(String email) async {
    final user = await ApiService.devLogin(email);
    if (user != null) {
      _userId = user['id'];
      _userName = user['name'];
      _userEmail = user['email'];
      _userAvatar = user['avatar'] ?? '';
      _userRole = user['role'] ?? 'user';
      _isAuthenticated = true;
      notifyListeners();
      return null;
    }
    return 'Đăng nhập thất bại';
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
      _sendFcmToken();
      return null;
    }
    return 'Email hoặc mật khẩu không đúng';
  }

  Future<String?> loginWithEmailOtp(String email, String otp) async {
    final result = await ApiService.verifyEmailLoginOtp(email, otp);
    if (result != null) {
      _userId = result['id'];
      _userName = result['name'];
      _userEmail = result['email'];
      _userAvatar = result['avatar'];
      _userRole = result['role'];
      _isPhoneVerified = result['isPhoneVerified'] == true;
      _isNewUser = result['isNewUser'] == true;
      _isAuthenticated = true;
      notifyListeners();
      _sendFcmToken();
      return null;
    }
    return 'Mã OTP không đúng hoặc đã hết hạn';
  }

  Future<String?> loginWithPhone(String idToken) async {
    final user = await ApiService.phoneLogin(idToken);
    if (user != null) {
      _userId = user['id'];
      _userName = user['name'];
      _userAvatar = user['avatar'];
      _userRole = user['role'];
      _isPhoneVerified = user['isPhoneVerified'] == true;
      _isNewUser = user['isNewUser'] == true;
      _isAuthenticated = true;
      notifyListeners();
      _sendFcmToken();
      return null;
    }
    return 'Đăng nhập bằng SĐT thất bại. Vui lòng thử lại.';
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

  Future<bool> deleteAccount() async {
    final ok = await ApiService.deleteAccount();
    if (ok) {
      _isAuthenticated = false;
      _userId = null;
      _userName = null;
      _userEmail = null;
      _userAvatar = null;
      notifyListeners();
    }
    return ok;
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
