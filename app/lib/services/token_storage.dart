import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Lưu trữ JWT token an toàn qua Android Keystore / iOS Keychain.
///
/// Primary storage: FlutterSecureStorage (EncryptedSharedPreferences / Keychain).
/// Fallback storage: SharedPreferences plain text (key `_backupKey`).
///
/// Lý do cần fallback: Android Auto Backup có thể restore EncryptedSharedPreferences
/// sang thiết bị mới/cài lại app, nhưng Keystore key là device-specific → decrypt
/// fail hoàn toàn. Khi đó fallback SharedPreferences giữ user đăng nhập thay vì
/// bị đăng xuất đột ngột. AndroidManifest đã set allowBackup=false để giảm thiểu
/// khả năng xảy ra, nhưng fallback vẫn cần cho trường hợp Keystore lỗi khác
/// (ROM custom, OTA update, factory reset partial).
class TokenStorage {
  static const _key = 'auth_token';
  static const _legacyKey = 'auth_token';
  static const _backupKey = 'auth_token_backup';
  static const _secure = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
    iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
  );

  /// Lấy token. Ưu tiên SecureStorage, fallback SharedPreferences.
  static Future<String?> getToken() async {
    try {
      final secure = await _secure.read(key: _key);
      if (secure != null && secure.isNotEmpty) return secure;
    } catch (_) {
      // Keystore corrupt/inaccessible — fallback
    }

    try {
      final prefs = await SharedPreferences.getInstance();

      // 1. Legacy migration (token cũ lưu plain text trước khi có SecureStorage)
      final legacy = prefs.getString(_legacyKey);
      if (legacy != null && legacy.isNotEmpty) {
        try {
          await _secure.write(key: _key, value: legacy);
          await prefs.remove(_legacyKey);
        } catch (_) {}
        return legacy;
      }

      // 2. Backup plain text (fallback khi Keystore fail)
      final backup = prefs.getString(_backupKey);
      if (backup != null && backup.isNotEmpty) {
        try {
          await _secure.write(key: _key, value: backup);
        } catch (_) {}
        return backup;
      }
    } catch (_) {}
    return null;
  }

  /// Lưu token: ghi vào SecureStorage + giữ bản plain text backup trong
  /// SharedPreferences để fallback khi Keystore không đọc được.
  static Future<void> setToken(String token) async {
    try {
      await _secure.write(key: _key, value: token);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_legacyKey);
    await prefs.setString(_backupKey, token);
  }

  /// Xoá token (logout).
  static Future<void> clearToken() async {
    try {
      await _secure.delete(key: _key);
    } catch (_) {}
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_legacyKey);
    await prefs.remove(_backupKey);
  }
}
