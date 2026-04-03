import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';

class ApiService {
  // ĐÃ CẬP NHẬT THEO IP MỚI NHẤT TỪ IPCONFIG CỦA ANH HÙNG
  static const String baseUrl = 'http://192.168.0.108:3800';

  static Future<String?> _getToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString('auth_token');
  }

  // --- 1. LẤY DANH SÁCH TIN ĐĂNG ---
  static Future<List<dynamic>> getPosts() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/post'))
          .timeout(const Duration(seconds: 15));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
      return [];
    } catch (e) {
      print("❌ Lỗi kết nối getPosts: $e");
      return [];
    }
  }

  // --- 2. BÁO CÁO BÀI ĐĂNG ---
  static Future<void> reportPost({required String postId, required String reason}) async {
    final t = await _getToken();
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/post/report'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $t',
        },
        body: jsonEncode({'postId': postId, 'reason': reason}),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode != 200 && res.statusCode != 201) {
        throw Exception('Server error: ${res.statusCode}');
      }
    } catch (e) {
      print("❌ Lỗi hàm reportPost: $e");
      rethrow;
    }
  }

  // --- 3. ĐĂNG TIN MỚI ---
  static Future<bool> createPost(Map<String, dynamic> d, List<XFile> images) async {
    final t = await _getToken();
    try {
      print("🚀 GT Neo 5 đang gửi dữ liệu tới: $baseUrl/post");
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/post'));
      request.headers['Authorization'] = 'Bearer $t';

      request.fields['title'] = d['title'].toString();
      request.fields['description'] = d['description'].toString();
      request.fields['price'] = (d['price'] ?? 0).toString();
      request.fields['itemCategory'] = d['itemCategory'] ?? "other";
      request.fields['province'] = d['province'] ?? "";
      request.fields['district'] = d['district'] ?? "";
      request.fields['ward'] = d['ward'] ?? "";
      request.fields['addressDetail'] = d['addressDetail'] ?? "";
      request.fields['listingType'] = d['listingType'] ?? "sell";

      for (var image in images) {
        request.files.add(await http.MultipartFile.fromPath('images', image.path));
      }

      // Tăng timeout lên 45s cho máy thật khi upload qua Wifi
      var streamedResponse = await request.send().timeout(const Duration(seconds: 45));

      print("📩 Phản hồi từ Server: ${streamedResponse.statusCode}");
      return streamedResponse.statusCode == 201 || streamedResponse.statusCode == 200;
    } catch (e) {
      print('❌ Lỗi hàm createPost (Máy thật): $e');
      return false;
    }
  }

  // --- 4. ĐĂNG NHẬP ---
  static Future<bool> login(String e, String p) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': e, 'password': p}),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final d = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', d['access_token']);
        return true;
      }
      return false;
    } catch (e) {
      print("❌ Lỗi login máy thật: $e");
      return false;
    }
  }
}