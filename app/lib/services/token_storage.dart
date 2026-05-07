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
  static const _secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Lấy token. Ưu tiên SecureStorage, fallback SharedPreferences (legacy) +
  /// auto-migrate sang SecureStorage để lần sau lấy nhanh hơn.
  ///
  /// Bug fix: SecureStorage có thể throw PlatformException trên 1 số device
  /// (Android Keystore corrupt, EncryptedSharedPrefs init lỗi, ROM custom).
  /// Trước đây throw → AuthProvider._tryAutoLogin treo, splash vô tận. Giờ
  /// catch + fallback SharedPreferences plain text → user vẫn login được dù
  /// keystore lỗi (security degraded nhưng app không bị brick).
  static Future<String?> getToken() async {
    try {
      final secure = await _secure.read(key: _key);
      if (secure != null && secure.isNotEmpty) return secure;
    } catch (e) {
      // Keystore corrupt — fallback đọc legacy SharedPreferences
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final legacy = prefs.getString(_legacyKey);
      if (legacy != null && legacy.isNotEmpty) {
        // Thử migrate sang SecureStorage; nếu fail thì giữ legacy
        try {
          await _secure.write(key: _key, value: legacy);
          await prefs.remove(_legacyKey);
        } catch (_) {}
        return legacy;
      }
    } catch (_) {}
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
