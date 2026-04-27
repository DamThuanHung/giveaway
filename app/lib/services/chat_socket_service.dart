import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ChatSocketService {
  // KIẾN TRÚC SINGLETON: Đảm bảo chỉ có 1 kết nối duy nhất
  static final ChatSocketService _instance = ChatSocketService._internal();
  factory ChatSocketService() => _instance;
  ChatSocketService._internal();

  late IO.Socket socket; // Đổi thành công khai để Provider truy cập
  static const String _serverUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://192.168.0.108:3800',
  );

  Future<void> initConnection() async {
    // Server bắt buộc JWT trong handshake — lấy từ SharedPreferences
    final p = await SharedPreferences.getInstance();
    final token = p.getString('auth_token');
    if (token == null) {
      debugPrint('[Socket] 🆘 Chưa có token — chưa đăng nhập?');
      return;
    }

    try {
      socket = IO.io(_serverUrl, IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          // Fallback Authorization header — đường truyền tin cậy hơn setAuth
          // qua CF Proxy + WS-only transport
          .setExtraHeaders({'Authorization': 'Bearer $token'})
          .enableAutoConnect()
          .build());

      socket.onConnect((_) => debugPrint('[Socket] ✅ Kết nối Backend thành công'));
      socket.onConnectError((err) => debugPrint('[Socket] 🆘 Lỗi kết nối: $err'));
      socket.onDisconnect((_) => debugPrint('[Socket] ❌ Đã ngắt kết nối'));

    } catch (e) {
      debugPrint('[Socket] 🆘 Lỗi khởi tạo: $e');
    }
  }

  // Các hàm hỗ trợ gửi/nhận dữ liệu chuẩn. senderId được server lấy từ JWT,
  // không gửi từ client → chống impersonate.
  void joinRoom(String roomId) {
    socket.emit('joinRoom', {'roomId': roomId});
  }

  void sendMessage({required String roomId, required String text}) {
    if (text.trim().isEmpty) return;
    socket.emit('sendMessage', {
      'roomId': roomId,
      'text': text.trim()
    });
  }

  void disconnect() {
    socket.disconnect();
  }
}