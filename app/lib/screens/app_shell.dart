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
import 'chat_screen.dart';
import 'profile/my_reviews_screen.dart';
import 'auth/phone_login_screen.dart';
import '../providers/post_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../main.dart' show PendingFcmMessage;

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> with WidgetsBindingObserver {
  int _selectedIndex = 0;
  DateTime? _lastFcmRegistration;

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
    WidgetsBinding.instance.addObserver(this);
    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      if (mounted) ApiService.saveFcmToken(token);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuth && auth.userId != null) {
        context.read<NotificationProvider>().start();
        _registerFcmToken();
      }
      // Cold-start: xử lý pending FCM message
      _handlePendingFcmMessage();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && mounted) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuth) _registerFcmToken();
    }
  }

  Future<void> _handlePendingFcmMessage() async {
    final message = PendingFcmMessage.value;
    if (message == null) return;
    PendingFcmMessage.value = null;

    final data = message.data;
    final type = data['type']?.toString() ?? '';
    final roomId = data['roomId']?.toString();

    if (type == 'chat' && roomId != null && roomId.isNotEmpty) {
      await _openChatFromRoomId(roomId);
      return;
    }
    if (type == 'review' || type == 'transaction_completed') {
      setState(() => _selectedIndex = 4);
      await Future.delayed(const Duration(milliseconds: 100));
      if (!mounted) return;
      Navigator.push(context, MaterialPageRoute(builder: (_) => const MyReviewsScreen()));
      return;
    }
  }

  Future<void> _openChatFromRoomId(String roomId) async {
    try {
      final room = await ApiService.getRoomById(roomId);
      if (!mounted || room == null) return;
      final myId = context.read<AuthProvider>().userId;
      final other = room['buyerId'] == myId ? room['seller'] : room['buyer'];
      final post = room['post'] as Map? ?? {};
      Navigator.push(context, MaterialPageRoute(builder: (_) => ChatScreen(
        roomId: roomId,
        otherUserName: other?['name']?.toString() ?? 'Người dùng',
        postTitle: post['title']?.toString() ?? '',
        postImageLabel: post['imageLabel']?.toString() ?? '',
        postId: post['id']?.toString(),
      )));
    } catch (_) {}
  }

  Future<void> _registerFcmToken() async {
    if (kIsWeb) return;
    final now = DateTime.now();
    if (_lastFcmRegistration != null &&
        now.difference(_lastFcmRegistration!) < const Duration(minutes: 5)) {
      return;
    }
    _lastFcmRegistration = now;
    try {
      final token = await FirebaseMessaging.instance.getToken();
      if (!mounted) return;
      if (token != null) {
        await ApiService.saveFcmToken(token);
      } else {
        debugPrint('[FCM] AppShell: getToken() returned null');
      }
    } catch (e) {
      debugPrint('[FCM] AppShell: _registerFcmToken error: $e');
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
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
        context.read<PostProvider>().refresh();
        setState(() => _selectedIndex = 0);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đăng tin thành công!'),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
        ));
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
        unreadNotifCount: unreadCount,
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
  final int unreadNotifCount;
  final void Function(int) onTap;
  const _BottomBar({required this.selectedIndex, required this.unreadMsgCount, required this.unreadNotifCount, required this.onTap});

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
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [BoxShadow(color: AppTheme.primary.withOpacity(0.10), blurRadius: 12, offset: const Offset(0, -2))],
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
                                color: selected ? AppTheme.primary : AppTheme.textSecondary,
                                size: 24,
                              ),
                              // Badge tin nhắn (tab Tin nhắn)
                              if (i == 3 && widget.unreadMsgCount > 0)
                                Positioned(
                                  top: -4, right: -6,
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: const BoxDecoration(color: AppTheme.error, shape: BoxShape.circle),
                                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                    child: Text(
                                      widget.unreadMsgCount > 99 ? '99+' : '${widget.unreadMsgCount}',
                                      style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                ),
                              // Badge thông báo (tab Trang chủ)
                              if (i == 0 && widget.unreadNotifCount > 0)
                                Positioned(
                                  top: -4, right: -6,
                                  child: Container(
                                    padding: const EdgeInsets.all(3),
                                    decoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                    child: Text(
                                      widget.unreadNotifCount > 99 ? '99+' : '${widget.unreadNotifCount}',
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
