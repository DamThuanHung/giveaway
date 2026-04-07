import 'dart:async';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class NotificationProvider extends ChangeNotifier {
  int _unreadCount = 0;
  int _unreadMessageCount = 0;
  Timer? _timer;

  int get unreadCount => _unreadCount;
  int get unreadMessageCount => _unreadMessageCount;

  void startPolling() {
    _fetchUnread();
    _timer = Timer.periodic(const Duration(seconds: 10), (_) => _fetchUnread());
  }

  void stopPolling() {
    _timer?.cancel();
    _timer = null;
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
    stopPolling();
    super.dispose();
  }
}
