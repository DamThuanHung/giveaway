import 'dart:async';
import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../services/api_service.dart';
import '../services/token_storage.dart';

class NotificationProvider extends ChangeNotifier {
  int _unreadCount = 0;
  int _unreadMessageCount = 0;
  IO.Socket? _socket;
  Timer? _fallbackTimer;

  int get unreadCount => _unreadCount;
  int get unreadMessageCount => _unreadMessageCount;

  /// Gọi sau khi user đã login — kết nối socket realtime + fetch lần đầu.
  /// Backend lấy userId từ JWT trong auth_token nên không cần truyền tham số.
  void start() {
    _fetchUnread();
    _connectSocket();
    // Fallback polling 60s để đồng bộ nếu socket mất kết nối
    _fallbackTimer = Timer.periodic(const Duration(seconds: 60), (_) => _fetchMessageCount());
  }

  void stop() {
    _fallbackTimer?.cancel();
    _fallbackTimer = null;
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  void _connectSocket() async {
    // Backend NotificationGateway lấy userId từ JWT (chống auth bypass).
    // Pass token qua query — đường tin cậy nhất qua WebSocket-only transport.
    final token = await TokenStorage.getToken();
    if (token == null) return;

    _socket = IO.io(
      ApiService.baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .setQuery({'token': token})
          .enableAutoConnect()
          .build(),
    );

    _socket!.on('unread_count', (data) {
      final count = (data['count'] as num?)?.toInt() ?? 0;
      if (count != _unreadCount) {
        _unreadCount = count;
        notifyListeners();
      }
    });
  }

  Future<void> _fetchUnread() async {
    final results = await Future.wait([
      ApiService.getUnreadNotificationCount(),
      ApiService.getUnreadMessageCount(),
    ]);
    final notifCount = results[0];
    final msgCount = results[1];
    if (notifCount != _unreadCount || msgCount != _unreadMessageCount) {
      _unreadCount = notifCount;
      _unreadMessageCount = msgCount;
      notifyListeners();
    }
  }

  Future<void> _fetchMessageCount() async {
    final count = await ApiService.getUnreadMessageCount();
    if (count != _unreadMessageCount) {
      _unreadMessageCount = count;
      notifyListeners();
    }
  }

  void clearBadge() {
    _unreadCount = 0;
    notifyListeners();
  }

  void clearMessageBadge() {
    _unreadMessageCount = 0;
    notifyListeners();
  }

  void refresh() => _fetchUnread();


  @override
  void dispose() {
    stop();
    super.dispose();
  }
}
