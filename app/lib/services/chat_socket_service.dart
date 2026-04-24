import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/material.dart';

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

  void initConnection() {
    // Tránh khởi tạo chồng chéo nếu đã kết nối
    try {
      socket = IO.io(_serverUrl, IO.OptionBuilder()
          .setTransports(['websocket'])
          .enableAutoConnect()
          .build());

      socket.onConnect((_) => debugPrint('[Socket] ✅ Kết nối Backend thành công'));
      socket.onConnectError((err) => debugPrint('[Socket] 🆘 Lỗi kết nối: $err'));
      socket.onDisconnect((_) => debugPrint('[Socket] ❌ Đã ngắt kết nối'));
      
    } catch (e) {
      debugPrint('[Socket] 🆘 Lỗi khởi tạo: $e');
    }
  }

  // Các hàm hỗ trợ gửi/nhận dữ liệu chuẩn
  void joinRoom(int roomId) {
    socket.emit('joinRoom', {'roomId': roomId});
  }

  void sendMessage({required int roomId, required int senderId, required String text}) {
    if (text.trim().isEmpty) return;
    socket.emit('sendMessage', {
      'roomId': roomId,
      'senderId': senderId,
      'text': text.trim()
    });
  }

  void disconnect() {
    socket.disconnect();
  }
}