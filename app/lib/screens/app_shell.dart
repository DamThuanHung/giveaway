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
      bottomNavigationBar: _BottomBar(
        selectedIndex: _selectedIndex,
        unreadMsgCount: unreadMsgCount,
        onTap: _onItemTapped,
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData iconFilled;
  final String label;
  const _NavItem(this.icon, this.iconFilled, this.label);
}

class _BottomBar extends StatefulWidget {
  final int selectedIndex;
  final int unreadMsgCount;
  final void Function(int) onTap;
  const _BottomBar({required this.selectedIndex, required this.unreadMsgCount, required this.onTap});

  @override
  State<_BottomBar> createState() => _BottomBarState();
}

class _BottomBarState extends State<_BottomBar> with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _scales;

  static const _items = [
    _NavItem(Icons.home_outlined, Icons.home, 'Trang chủ'),
    _NavItem(Icons.search_outlined, Icons.search, 'Tìm kiếm'),
    _NavItem(Icons.add_circle_outline, Icons.add_circle, 'Đăng tin'),
    _NavItem(Icons.chat_bubble_outline, Icons.chat_bubble, 'Tin nhắn'),
    _NavItem(Icons.person_outline, Icons.person, 'Cá nhân'),
  ];

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(_items.length, (_) => AnimationController(
      vsync: this, duration: const Duration(milliseconds: 200),
    ));
    _scales = _controllers.map((c) => Tween<double>(begin: 1, end: 1.25)
      .animate(CurvedAnimation(parent: c, curve: Curves.easeOut))).toList();
    _controllers[widget.selectedIndex].forward();
  }

  @override
  void didUpdateWidget(_BottomBar old) {
    super.didUpdateWidget(old);
    if (old.selectedIndex != widget.selectedIndex) {
      _controllers[old.selectedIndex].reverse();
      _controllers[widget.selectedIndex].forward();
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 60,
          child: Row(
            children: List.generate(_items.length, (i) {
              final selected = i == widget.selectedIndex;
              final item = _items[i];
              return Expanded(
                child: GestureDetector(
                  onTap: () => widget.onTap(i),
                  behavior: HitTestBehavior.opaque,
                  child: ScaleTransition(
                    scale: _scales[i],
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                          decoration: BoxDecoration(
                            color: selected ? AppTheme.primary.withOpacity(0.12) : Colors.transparent,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Stack(
                            clipBehavior: Clip.none,
                            children: [
                              Icon(
                                selected ? item.iconFilled : item.icon,
                                color: selected ? AppTheme.primary : Colors.grey,
                                size: 24,
                              ),
                              if (i == 3 && widget.unreadMsgCount > 0)
                                Positioned(
                                  top: -4, right: -6,
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                    child: Text(
                                      widget.unreadMsgCount > 99 ? '99+' : '${widget.unreadMsgCount}',
                                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 2),
                        AnimatedDefaultTextStyle(
                          duration: const Duration(milliseconds: 200),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                            color: selected ? AppTheme.primary : Colors.grey,
                          ),
                          child: Text(item.label),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }
}
