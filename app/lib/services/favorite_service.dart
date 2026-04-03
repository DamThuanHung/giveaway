import 'dart:convert';
import 'package:http/http.dart' as http;

class FavoriteService {
  static const String baseUrl = 'http://192.168.0.103:3000';

  static Future<List<dynamic>> getFavorites(int userId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/favorite/$userId'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final decodedBody = utf8.decode(response.bodyBytes);
      return jsonDecode(decodedBody) as List<dynamic>;
    }

    throw Exception('Không tải được danh sách tin đã lưu');
  }

  static Future<void> addFavorite({required int userId, required int postId}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/favorite'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        'postId': postId,
      }),
    );

    if (response.statusCode == 201) return;

    final decodedBody = utf8.decode(response.bodyBytes);
    if (response.statusCode == 400 && decodedBody.contains('Đã lưu')) return;

    throw Exception('Không lưu được tin');
  }

  static Future<void> removeFavorite({required int userId, required int postId}) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/favorite'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'userId': userId,
        'postId': postId,
      }),
    );

    if (response.statusCode == 200 || response.statusCode == 204) return;

    throw Exception('Không bỏ lưu được tin');
  }
}