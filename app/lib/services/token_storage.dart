import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Lưu trữ JWT token an toàn qua Android Keystore / iOS Keychain.
///
/// Trước đây token lưu plain text trong SharedPreferences → trên Android root
/// hoặc iOS jailbreak có thể đọc được từ /data/data, attacker mạo danh user.
///
/// Migration tự động: nếu user có token cũ trong SharedPreferences (key `auth_token`),
/// `getToken()` sẽ copy sang SecureStorage rồi xoá khỏi SharedPreferences. User
/// không cần re-login.
class TokenStorage {
  static const _key = 'auth_token';
  static const _legacyKey = 'auth_token';
  static final _secure = const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Lấy token. Ưu tiên SecureStorage, fallback SharedPreferences (legacy) +
  /// auto-migrate sang SecureStorage để lần sau lấy nhanh hơn.
  static Future<String?> getToken() async {
    final secure = await _secure.read(key: _key);
    if (secure != null && secure.isNotEmpty) return secure;

    // Migration legacy: SharedPreferences → SecureStorage
    final prefs = await SharedPreferences.getInstance();
    final legacy = prefs.getString(_legacyKey);
    if (legacy != null && legacy.isNotEmpty) {
      await _secure.write(key: _key, value: legacy);
      await prefs.remove(_legacyKey);
      return legacy;
    }
    return null;
  }

  /// Lưu token mới + xoá khỏi SharedPreferences nếu còn.
  static Future<void> setToken(String token) async {
    await _secure.write(key: _key, value: token);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_legacyKey);
  }

  /// Xoá token (logout).
  static Future<void> clearToken() async {
    await _secure.delete(key: _key);
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_legacyKey);
  }
}
