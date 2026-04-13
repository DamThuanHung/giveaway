import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'home_tab.dart';
import 'messages_tab.dart';
import 'search_tab.dart';
import 'profile_tab.dart';
import 'post/create_post_tab.dart';
import 'notifications_screen.dart';
import 'auth/phone_login_screen.dart';
import '../providers/post_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  late final List<Widget> _pages = [
    const HomeTab(),
    const SearchTab(),
    const SizedBox(),
    const MessagesTab(),
    const ProfileTab(),
  ];

  @override
  void initState() {
    super.initState();
    // Bắt đầu polling thông báo sau khi widget mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuth && auth.userId != null) {
        context.read<NotificationProvider>().start(auth.userId!);
        _registerFcmToken();
      }
    });
  }

  Future<void> _registerFcmToken() async {
    if (kIsWeb) return;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await ApiService.saveFcmToken(token);
    } catch (_) {}
  }

  @override
  void dispose() {
    context.read<NotificationProvider>().stop();
    super.dispose();
  }

  void _onItemTapped(int index) async {
    if (index == 2) {
      final auth = context.read<AuthProvider>();
      if (!auth.isAuth) {
        Navigator.push(context, MaterialPageRoute(builder: (_) => const PhoneLoginScreen()));
        return;
      }
      final result = await Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const CreatePostTab()),
      );
      if (result == true) {
        if (!mounted) return;
        // BUG FIX: dùng refresh() để giữ nguyên filter province/category của HomeTab
        context.read<PostProvider>().refresh();
        setState(() => _selectedIndex = 0);
      }
    } else {
      setState(() => _selectedIndex = index);
    }
  }

  void _openNotifications() {
    context.read<NotificationProvider>().clearBadge();
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
    ).then((_) => context.read<NotificationProvider>().refresh());
  }

  @override
  Widget build(BuildContext context) {
    final notifProvider = context.watch<NotificationProvider>();
    final unreadCount = notifProvider.unreadCount;
    final unreadMsgCount = notifProvider.unreadMessageCount;

    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _pages),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        selectedItemColor: AppTheme.primary,
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped,
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Trang chủ'),
          const BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Tìm kiếm'),
          const BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline), label: 'Đăng tin'),
          BottomNavigationBarItem(
            icon: Stack(clipBehavior: Clip.none, children: [
              const Icon(Icons.chat_bubble_outline),
              if (unreadMsgCount > 0)
                Positioned(
                  top: -4, right: -6,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      unreadMsgCount > 99 ? '99+' : '$unreadMsgCount',
                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ]),
            label: 'Tin nhắn',
          ),
          const BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Cá nhân'),
        ],
      ),
    );
  }
}
