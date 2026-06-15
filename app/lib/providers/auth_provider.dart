import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';
import '../services/analytics.dart';
import '../services/token_storage.dart';

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
    // Bug fix: nếu TokenStorage.getToken() throw PlatformException (Android
    // Keystore corrupt sau upgrade, một số ROM custom, hoặc EncryptedSharedPrefs
    // init lỗi) → _isLoading vĩnh viễn true → splash treo vô tận vì SplashScreen
    // có while(auth.isLoading) loop. Wrap try/finally đảm bảo isLoading=false
    // luôn được set, dù bất kỳ lỗi nào xảy ra.
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = await TokenStorage.getToken();

      // Token expired (JWT exp claim) → xóa local, user thấy login screen
      // thay vì empty screens do mọi API trả 401.
      if (token != null && token.isNotEmpty && ApiService.isTokenExpired(token)) {
        await ApiService.logout();
        _isAuthenticated = false;
        return;
      }

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
    } catch (e, st) {
      debugPrint('[AuthProvider._tryAutoLogin] error: $e\n$st');
      // Fallback: coi như user chưa login → cho user thấy login screen
      _isAuthenticated = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _sendFcmToken() async {
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) {
        await ApiService.saveFcmToken(token);
      } else {
        debugPrint('[FCM] getToken() returned null');
      }
    } catch (e) {
      debugPrint('[FCM] _sendFcmToken error: $e');
    }
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
      Analytics.setUser(_userId!);
      _isNewUser ? Analytics.signUp(method: 'email_otp') : Analytics.login(method: 'email_otp');
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
      Analytics.setUser(_userId!);
      _isNewUser ? Analytics.signUp(method: 'phone') : Analytics.login(method: 'phone');
      return null;
    }
    return 'Đăng nhập bằng SĐT thất bại. Vui lòng thử lại.';
  }

  Future<void> logout() async {
    await ApiService.logout();
    _isAuthenticated = false;
    _userId = null;
    _userName = null;
    _userEmail = null;
    _userAvatar = null;
    Analytics.clearUser();
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
