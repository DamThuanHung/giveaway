import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/post.dart';

class ViewedPostsService {
  static const _key = 'viewed_posts';
  static const _maxItems = 20;

  static Future<void> save(Post post) async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];

    // Serialize tối thiểu để tiết kiệm bộ nhớ
    final entry = jsonEncode({
      'id': post.id,
      'title': post.title,
      'price': post.price,
      'listingType': post.listingType,
      'imageLabel': post.imageLabel,
      'images': post.images?.take(1).toList() ?? [],
      'province': post.province,
    });

    // Loại bỏ bản ghi cũ của cùng post (nếu có)
    final updated = [
      entry,
      ...raw.where((e) {
        try {
          return jsonDecode(e)['id'] != post.id;
        } catch (_) {
          return false;
        }
      }),
    ].take(_maxItems).toList();

    await prefs.setStringList(_key, updated);
  }

  static Future<List<Map<String, dynamic>>> load() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_key) ?? [];
    return raw.map((e) {
      try {
        return jsonDecode(e) as Map<String, dynamic>;
      } catch (_) {
        return <String, dynamic>{};
      }
    }).where((e) => e.isNotEmpty).toList();
  }

  static Future<void> clear() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
