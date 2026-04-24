import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';

class ApiService {
  static const String baseUrl = 'http://192.168.0.108:3800';

  /// Xây URL ảnh an toàn: nếu label đã là full URL thì dùng luôn, không prepend baseUrl
  static String buildImageUrl(String label) {
    if (label.isEmpty) return '';
    if (label.startsWith('http')) return label;
    return '$baseUrl/uploads/$label';
  }

  static Future<String?> _getToken() async {
    final p = await SharedPreferences.getInstance();
    return p.getString('auth_token');
  }

  static Future<Map<String, String>> _authHeaders() async {
    final t = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (t != null) 'Authorization': 'Bearer $t',
    };
  }

  // ─── AUTH ────────────────────────────────────────────
  static Future<Map<String, dynamic>?> login(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final d = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', d['accessToken'] ?? d['access_token'] ?? '');
        await prefs.setString('user_id', d['user']['id'] ?? '');
        await prefs.setString('user_name', d['user']['name'] ?? '');
        await prefs.setString('user_email', d['user']['email'] ?? '');
        await prefs.setString('user_avatar', d['user']['avatar'] ?? '');
        await prefs.setString('user_role', d['user']['role'] ?? 'user');
        return d['user'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // ─── Email OTP Login ──────────────────────────────────────────────────────

  static Future<String?> sendEmailLoginOtp(String email) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/email-login/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) return null;
      final d = jsonDecode(res.body);
      return d['message'] ?? 'Đã xảy ra lỗi';
    } catch (_) {
      return 'Không thể kết nối máy chủ';
    }
  }

  static Future<Map<String, dynamic>?> verifyEmailLoginOtp(String email, String otp) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/email-login/verify'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': otp}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final d = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', d['accessToken'] ?? '');
        await prefs.setString('user_id', d['user']['id'] ?? '');
        await prefs.setString('user_name', d['user']['name'] ?? '');
        await prefs.setString('user_email', d['user']['email'] ?? '');
        await prefs.setString('user_avatar', d['user']['avatar'] ?? '');
        await prefs.setString('user_role', d['user']['role'] ?? 'user');
        await prefs.setBool('is_phone_verified', d['user']['isPhoneVerified'] == true);
        return <String, dynamic>{
          ...Map<String, dynamic>.from(d['user']),
          'isNewUser': d['isNewUser'] == true,
        };
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  static Future<String?> sendLinkEmailOtp(String email) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/link-email/send'),
        headers: await _authHeaders(),
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) return null;
      final d = jsonDecode(res.body);
      return d['message'] ?? 'Đã xảy ra lỗi';
    } catch (_) {
      return 'Không thể kết nối máy chủ';
    }
  }

  static Future<String?> confirmLinkEmail(String email, String otp) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/link-email/confirm'),
        headers: await _authHeaders(),
        body: jsonEncode({'email': email, 'otp': otp}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) return null;
      final d = jsonDecode(res.body);
      return d['message'] ?? 'Đã xảy ra lỗi';
    } catch (_) {
      return 'Không thể kết nối máy chủ';
    }
  }

  static Future<Map<String, dynamic>?> phoneLogin(String idToken) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/phone-login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': idToken}),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final d = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', d['accessToken'] ?? '');
        await prefs.setString('user_id', d['user']['id'] ?? '');
        await prefs.setString('user_name', d['user']['name'] ?? '');
        await prefs.setString('user_avatar', d['user']['avatar'] ?? '');
        await prefs.setString('user_role', d['user']['role'] ?? 'user');
        await prefs.setBool('is_phone_verified', d['user']['isPhoneVerified'] == true);
        return {
          ...Map<String, dynamic>.from(d['user']),
          'isNewUser': d['isNewUser'] == true,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static bool get isLocal => baseUrl.contains('localhost') || baseUrl.contains('192.168') || baseUrl.contains('10.0');

  static const String _devSecret = 'traotay_dev_2024';

  static Future<Map<String, dynamic>?> devLogin(String email) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/dev/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'secret': _devSecret}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) {
        final d = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', d['accessToken'] ?? '');
        await prefs.setString('user_id', d['user']['id'] ?? '');
        await prefs.setString('user_name', d['user']['name'] ?? '');
        await prefs.setString('user_email', d['user']['email'] ?? '');
        await prefs.setString('user_avatar', '');
        await prefs.setString('user_role', 'user');
        return d['user'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> register(String name, String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'name': name, 'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 15));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final d = jsonDecode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', d['accessToken'] ?? '');
        await prefs.setString('user_id', d['user']['id'] ?? '');
        await prefs.setString('user_name', d['user']['name'] ?? '');
        await prefs.setString('user_email', d['user']['email'] ?? '');
        return d['user'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('user_id');
    await prefs.remove('user_name');
    await prefs.remove('user_email');
    await prefs.remove('user_avatar');
  }

  static Future<bool> deleteAccount() async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/user/me'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200 || res.statusCode == 201) {
        await logout();
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  // ─── USER ────────────────────────────────────────────
  static Future<Map<String, dynamic>?> getMe() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/user/me'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<Map<String, dynamic>?> getUserById(String userId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/user/$userId'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<bool> updateUser(String userId, Map<String, dynamic> data) async {
    try {
      final res = await http.patch(
        Uri.parse('$baseUrl/user/$userId'),
        headers: await _authHeaders(),
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<String?> uploadAvatar(String filePath) async {
    try {
      final headers = await _authHeaders();
      final request = http.MultipartRequest('POST', Uri.parse('$baseUrl/user/avatar'));
      request.headers.addAll(headers);
      request.files.add(await http.MultipartFile.fromPath('avatar', filePath));
      final streamed = await request.send().timeout(const Duration(seconds: 20));
      final res = await http.Response.fromStream(streamed);
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        return data['avatar']?.toString();
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  // ─── POST ────────────────────────────────────────────
  static Future<Map<String, dynamic>> getPosts({
    int page = 1,
    int limit = 20,
    String? search,
    String? province,
    List<String>? provinces,
    String? listingType,
    String? itemCategory,
    int? minPrice,
    int? maxPrice,
    double? lat,
    double? lng,
    double? radius,
    String? sortBy,
    String? postType,
    String? subType,
  }) async {
    try {
      final params = <String, String>{
        'page': page.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
        if (province != null && province.isNotEmpty) 'province': province,
        if (provinces != null && provinces.isNotEmpty) 'provinces': provinces.join(','),
        if (listingType != null) 'listingType': listingType,
        if (itemCategory != null) 'itemCategory': itemCategory,
        if (minPrice != null) 'minPrice': minPrice.toString(),
        if (maxPrice != null) 'maxPrice': maxPrice.toString(),
        if (lat != null) 'lat': lat.toString(),
        if (lng != null) 'lng': lng.toString(),
        if (radius != null) 'radius': radius.toString(),
        if (sortBy != null) 'sortBy': sortBy,
        if (postType != null) 'postType': postType,
        if (subType != null) 'subType': subType,
      };
      final uri = Uri.parse('$baseUrl/post').replace(queryParameters: params);
      final res = await http.get(uri, headers: await _authHeaders()).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return {'data': [], 'meta': {'total': 0}};
    } catch (e) {
      return {'data': [], 'meta': {'total': 0}, '_isError': true};
    }
  }

  static Future<Map<String, dynamic>?> getPostById(String id) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/post/$id'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<dynamic>> getMyPosts({String? status}) async {
    try {
      final params = status != null ? '?status=$status' : '';
      final res = await http.get(
        Uri.parse('$baseUrl/post/my$params'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<String?> createPost(Map<String, dynamic> data, List<XFile> images) async {
    try {
      final t = await _getToken();
      var request = http.MultipartRequest('POST', Uri.parse('$baseUrl/post'));
      if (t != null) request.headers['Authorization'] = 'Bearer $t';

      data.forEach((key, value) {
        if (value != null) request.fields[key] = value.toString();
      });

      for (var image in images) {
        final bytes = await image.readAsBytes();
        final filename = image.name.isNotEmpty ? image.name : 'image.jpg';
        request.files.add(http.MultipartFile.fromBytes('images', bytes, filename: filename));
      }

      final resp = await request.send().timeout(const Duration(seconds: 45));
      if (resp.statusCode == 201 || resp.statusCode == 200) return null;
      final body = await resp.stream.bytesToString();
      try {
        final d = jsonDecode(body);
        final msg = d['message'];
        if (msg is List) return msg.join(', ');
        return msg?.toString() ?? 'Lỗi ${resp.statusCode}';
      } catch (_) {
        return 'Lỗi ${resp.statusCode}';
      }
    } catch (e) {
      return 'Không thể kết nối máy chủ';
    }
  }

  static Future<bool> updatePost(String id, Map<String, dynamic> data) async {
    try {
      final res = await http.patch(
        Uri.parse('$baseUrl/post/$id'),
        headers: await _authHeaders(),
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> updatePostStatus(String id, String status) async {
    try {
      final res = await http.patch(
        Uri.parse('$baseUrl/post/$id/status'),
        headers: await _authHeaders(),
        body: jsonEncode({'status': status}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> deletePost(String id) async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/post/$id'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<Map<String, dynamic>?> bumpPost(String postId) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/post/$postId/bump'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) return jsonDecode(res.body);
      final body = jsonDecode(res.body);
      return {'error': body['message'] ?? 'Không thể đẩy bài'};
    } catch (e) {
      return {'error': 'Lỗi kết nối'};
    }
  }

  static Future<Map<String, dynamic>> createBumpOrder(String postId, String package) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/bump/$postId/order'),
        headers: {...await _authHeaders(), 'Content-Type': 'application/json'},
        body: jsonEncode({'package': package}),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200 || res.statusCode == 201) return jsonDecode(res.body);
      final body = jsonDecode(res.body);
      return {'error': body['message'] ?? 'Không thể tạo đơn'};
    } catch (e) {
      return {'error': 'Lỗi kết nối'};
    }
  }

  static Future<Map<String, dynamic>> getBoostStatus(String postId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/bump/$postId/status'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return {'error': 'Không lấy được trạng thái'};
    } catch (e) {
      return {'error': 'Lỗi kết nối'};
    }
  }

  // ─── FAVORITE ────────────────────────────────────────
  static Future<bool> addFavorite(String userId, String postId) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/favorite'),
        headers: await _authHeaders(),
        body: jsonEncode({'userId': userId, 'postId': postId}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> removeFavorite(String userId, String postId) async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/favorite'),
        headers: await _authHeaders(),
        body: jsonEncode({'userId': userId, 'postId': postId}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<List<dynamic>> getFavorites(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/favorite/$userId'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  // ─── REPORT ──────────────────────────────────────────
  static Future<bool> reportPost({required String postId, required String reason}) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/report'),
        headers: await _authHeaders(),
        body: jsonEncode({'postId': postId, 'reason': reason}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  // ─── CHAT ────────────────────────────────────────────
  static Future<Map<String, dynamic>?> getOrCreateRoom(
    String postId,
    String sellerId, {
    String? postTitle,
    List<Map<String, String>>? extraPosts,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/chat/room'),
        headers: await _authHeaders(),
        body: jsonEncode({
          'postId': postId,
          'sellerId': sellerId,
          if (postTitle != null) 'postTitle': postTitle,
          if (extraPosts != null && extraPosts.isNotEmpty) 'extraPosts': extraPosts,
        }),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<dynamic>> getMyRooms() async {
    final res = await http.get(
      Uri.parse('$baseUrl/chat/rooms'),
      headers: await _authHeaders(),
    ).timeout(const Duration(seconds: 10));
    if (res.statusCode == 200) return jsonDecode(res.body);
    return [];
  }

  static Future<Map<String, dynamic>?> getRoomById(String roomId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/chat/room/$roomId'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<dynamic>> getMessages(String roomId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/chat/room/$roomId/messages'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  // ─── DEAL ────────────────────────────────────────────
  static Future<Map<String, dynamic>?> createDeal(String postId, {String? message}) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/deal'),
        headers: await _authHeaders(),
        body: jsonEncode({'postId': postId, if (message != null) 'message': message}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 201 || res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  static Future<List<dynamic>> getIncomingDeals() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/deal/incoming'), headers: await _authHeaders())
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getOutgoingDeals() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/deal/outgoing'), headers: await _authHeaders())
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<bool> updateDealStatus(String dealId, String status) async {
    try {
      final res = await http.patch(
        Uri.parse('$baseUrl/deal/$dealId/status'),
        headers: await _authHeaders(),
        body: jsonEncode({'status': status}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  // ─── REVIEW ──────────────────────────────────────────
  static Future<bool> createReview(String dealId, int rating, {String? comment}) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/review'),
        headers: await _authHeaders(),
        body: jsonEncode({'dealId': dealId, 'rating': rating, if (comment != null) 'comment': comment}),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 201 || res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> checkReviewed(String dealId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/review/check/$dealId'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body)['hasReviewed'] == true;
      return false;
    } catch (_) {
      return false;
    }
  }

  static Future<Map<String, dynamic>?> getUserReviews(String userId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/review/user/$userId'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  // ─── ADMIN ───────────────────────────────────────────
  static Future<Map<String, dynamic>> adminGet(String path) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/admin/$path'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return {'error': 'Lỗi ${res.statusCode}'};
    } catch (e) {
      return {'error': 'Lỗi kết nối'};
    }
  }

  static Future<Map<String, dynamic>> adminGetPosts({int page = 1, String? status, String? search}) async {
    try {
      final params = <String, String>{'page': '$page', 'limit': '20'};
      if (status != null) params['status'] = status;
      if (search != null) params['search'] = search;
      final uri = Uri.parse('$baseUrl/admin/posts').replace(queryParameters: params);
      final res = await http.get(uri, headers: await _authHeaders()).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        return {'data': body['data'] ?? [], 'meta': body['meta'] ?? {}};
      }
      return {'data': [], 'meta': {}};
    } catch (e) { return {'data': [], 'meta': {}}; }
  }

  static Future<Map<String, dynamic>> adminGetUsers({int page = 1, String? search}) async {
    try {
      final params = <String, String>{'page': '$page', 'limit': '20'};
      if (search != null) params['search'] = search;
      final uri = Uri.parse('$baseUrl/admin/users').replace(queryParameters: params);
      final res = await http.get(uri, headers: await _authHeaders()).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        return {'data': body['data'] ?? [], 'meta': body['meta'] ?? {}};
      }
      return {'data': [], 'meta': {}};
    } catch (e) { return {'data': [], 'meta': {}}; }
  }

  static Future<Map<String, dynamic>> adminGetReports({int page = 1, String? status}) async {
    try {
      final params = <String, String>{'page': '$page', 'limit': '20'};
      if (status != null) params['status'] = status;
      final uri = Uri.parse('$baseUrl/admin/reports').replace(queryParameters: params);
      final res = await http.get(uri, headers: await _authHeaders()).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final body = jsonDecode(res.body);
        return {'data': body['data'] ?? [], 'meta': body['meta'] ?? {}};
      }
      return {'data': [], 'meta': {}};
    } catch (e) { return {'data': [], 'meta': {}}; }
  }

  static Future<bool> adminHidePost(String id) async {
    try {
      final res = await http.patch(Uri.parse('$baseUrl/admin/posts/$id/hide'), headers: await _authHeaders()).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> adminDeletePost(String id) async {
    try {
      final res = await http.delete(Uri.parse('$baseUrl/admin/posts/$id'), headers: await _authHeaders()).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> adminBanUser(String id, bool isBanned) async {
    try {
      final res = await http.patch(Uri.parse('$baseUrl/admin/users/$id/ban'),
        headers: await _authHeaders(), body: jsonEncode({'isBanned': isBanned})).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  static Future<bool> adminResolveReport(String id, String action) async {
    try {
      final res = await http.patch(Uri.parse('$baseUrl/admin/reports/$id'),
        headers: await _authHeaders(), body: jsonEncode({'action': action})).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) { return false; }
  }

  // ─── SELLER STATS ────────────────────────────────────
  static Future<Map<String, dynamic>?> getMyStats() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/post/my/stats'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  // ─── ADMIN ───────────────────────────────────────────
  static Future<Map<String, dynamic>?> getAdminStats() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/admin/stats'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return null;
    } catch (e) {
      return null;
    }
  }

  // ─── NOTIFICATION ─────────────────────────────────────
  static Future<List<dynamic>> getNotifications() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/notification'), headers: await _authHeaders())
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<bool> markNotificationRead(String id) async {
    try {
      final res = await http.patch(
        Uri.parse('$baseUrl/notification/$id/read'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<bool> markAllNotificationsRead() async {
    try {
      final res = await http.patch(
        Uri.parse('$baseUrl/notification/read-all'),
        headers: await _authHeaders(),
      ).timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  static Future<int> getUnreadNotificationCount() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/notification/unread-count'), headers: await _authHeaders())
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body)['count'] ?? 0;
      return 0;
    } catch (e) {
      return 0;
    }
  }

  static Future<int> getUnreadMessageCount() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/chat/unread-count'), headers: await _authHeaders())
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body)['count'] ?? 0;
      return 0;
    } catch (e) {
      return 0;
    }
  }

  static Future<void> markRoomAsRead(String roomId) async {
    try {
      await http.post(Uri.parse('$baseUrl/chat/room/$roomId/read'), headers: await _authHeaders())
          .timeout(const Duration(seconds: 5));
    } catch (_) {}
  }

  static Future<void> saveFcmToken(String token) async {
    try {
      await http.post(
        Uri.parse('$baseUrl/notification/fcm-token'),
        headers: await _authHeaders(),
        body: jsonEncode({'token': token}),
      ).timeout(const Duration(seconds: 5));
    } catch (_) {}
  }

  static Future<String?> sendForgotPasswordOtp(String email) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/forgot-password/send'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200 || res.statusCode == 201) return null; // null = success
      final body = jsonDecode(res.body);
      return body['message'] ?? 'Không gửi được OTP';
    } catch (_) {
      return 'Không kết nối được server';
    }
  }

  static Future<String?> resetPassword(String email, String otp, String newPassword) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/forgot-password/reset'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'otp': otp, 'newPassword': newPassword}),
      ).timeout(const Duration(seconds: 15));
      if (res.statusCode == 200 || res.statusCode == 201) return null; // null = success
      final body = jsonDecode(res.body);
      return body['message'] ?? 'Đặt lại mật khẩu thất bại';
    } catch (_) {
      return 'Không kết nối được server';
    }
  }

  static Future<bool> changePassword(String oldPassword, String newPassword) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/change-password'),
        headers: await _authHeaders(),
        body: jsonEncode({'oldPassword': oldPassword, 'newPassword': newPassword}),
      );
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) { return false; }
  }

  static Future<List<dynamic>> getSimilarPosts(String postId, {String? category, String? province}) async {
    try {
      final params = <String, String>{
        'limit': '6',
        if (category != null && category.isNotEmpty) 'itemCategory': category,
        if (province != null && province.isNotEmpty) 'province': province,
        'exclude': postId,
      };
      final uri = Uri.parse('$baseUrl/post').replace(queryParameters: params);
      final res = await http.get(uri).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = data['data'] ?? data;
        if (list is List) return list.where((p) => p['id'] != postId).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<List<dynamic>> getUserPosts(String userId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/post/user/$userId'));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (_) { return []; }
  }

  static Future<List<dynamic>> getBlockedUsers() async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/user/blocked/list'),
        headers: await _authHeaders(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (_) { return []; }
  }

  static Future<bool> blockUser(String userId) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/user/block/$userId'),
        headers: await _authHeaders(),
      );
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) { return false; }
  }

  static Future<bool> unblockUser(String userId) async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/user/block/$userId'),
        headers: await _authHeaders(),
      );
      return res.statusCode == 200 || res.statusCode == 204;
    } catch (_) { return false; }
  }

  static Future<bool> checkBlocked(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/user/block/check/$userId'),
        headers: await _authHeaders(),
      );
      if (res.statusCode == 200) {
        return jsonDecode(res.body)['isBlocked'] == true;
      }
      return false;
    } catch (_) { return false; }
  }

  // ─── FOLLOW ──────────────────────────────────────────
  static Future<bool> followUser(String userId) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/follow/$userId'),
        headers: await _authHeaders(),
      );
      return res.statusCode == 200 || res.statusCode == 201;
    } catch (_) { return false; }
  }

  static Future<bool> unfollowUser(String userId) async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/follow/$userId'),
        headers: await _authHeaders(),
      );
      return res.statusCode == 200 || res.statusCode == 204;
    } catch (_) { return false; }
  }

  static Future<bool> getFollowStatus(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/follow/$userId/status'),
        headers: await _authHeaders(),
      );
      if (res.statusCode == 200) {
        return jsonDecode(res.body)['isFollowing'] == true;
      }
      return false;
    } catch (_) { return false; }
  }

  static Future<Map<String, dynamic>> getFollowCounts(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/follow/$userId/counts'),
        headers: await _authHeaders(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      return {'followersCount': 0, 'followingCount': 0};
    } catch (_) { return {'followersCount': 0, 'followingCount': 0}; }
  }

  static Future<List<dynamic>> getFollowers(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/follow/$userId/followers'),
        headers: await _authHeaders(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (_) { return []; }
  }

  static Future<List<dynamic>> getFollowing(String userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/follow/$userId/following'),
        headers: await _authHeaders(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (_) { return []; }
  }

  static Future<Map<String, dynamic>> getFollowFeed({int page = 1, int limit = 20}) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/follow/feed?page=$page&limit=$limit'),
        headers: await _authHeaders(),
      );
      if (res.statusCode == 200) return jsonDecode(res.body);
      return {'data': [], 'total': 0};
    } catch (_) { return {'data': [], 'total': 0}; }
  }

  // ─── Keyword Alert ────────────────────────────────────────────────────────

  static Future<List<dynamic>> getKeywordAlerts() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/keyword-alert'), headers: await _authHeaders())
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body);
      return [];
    } catch (_) { return []; }
  }

  static Future<String?> subscribeKeyword(String keyword) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/keyword-alert'),
        headers: {...await _authHeaders(), 'Content-Type': 'application/json'},
        body: jsonEncode({'keyword': keyword}),
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200 || res.statusCode == 201) return null;
      final d = jsonDecode(res.body);
      return d['message'] ?? 'Đã xảy ra lỗi';
    } catch (_) { return 'Không thể kết nối máy chủ'; }
  }

  static Future<void> unsubscribeKeyword(String keyword) async {
    try {
      await http.delete(
        Uri.parse('$baseUrl/keyword-alert'),
        headers: {...await _authHeaders(), 'Content-Type': 'application/json'},
        body: jsonEncode({'keyword': keyword}),
      ).timeout(const Duration(seconds: 10));
    } catch (_) {}
  }
}
