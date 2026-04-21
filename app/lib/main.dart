import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'providers/auth_provider.dart';
import 'providers/post_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/deal/deals_screen.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

// Lưu message khi app cold-start từ notification
class PendingFcmMessage {
  static RemoteMessage? value;
}

final _navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!kIsWeb) {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Cold start: lưu lại message để AppShell xử lý sau
    final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      PendingFcmMessage.value = initialMessage;
    }
  }

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PostProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String? _pendingFcmToken;
  final _messengerKey = GlobalKey<ScaffoldMessengerState>();

  @override
  void initState() {
    super.initState();
    _setupFcm();
  }

  Future<void> _setupFcm() async {
    if (kIsWeb) return;
    final messaging = FirebaseMessaging.instance;

    // Tạo notification channel HIGH importance cho Android 8+
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'high_importance_channel',
      'Thông báo quan trọng',
      description: 'Kênh thông báo chính của Trao Tay',
      importance: Importance.max,
    );
    final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    await messaging.setForegroundNotificationPresentationOptions(
      alert: true, badge: true, sound: true,
    );

    await messaging.requestPermission(alert: true, badge: true, sound: true);

    messaging.onTokenRefresh.listen((token) {
      _pendingFcmToken = token;
      _trySendToken();
    });

    final token = await messaging.getToken();
    if (token != null) {
      _pendingFcmToken = token;
      _trySendToken();
    }

    // Background → foreground: user tap vào notification
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      _handleFcmNavigation(message);
    });

    // In-app banner khi app đang mở và nhận notification
    FirebaseMessaging.onMessage.listen((message) {
      final title = message.notification?.title ?? '';
      final body = message.notification?.body ?? '';
      if (title.isEmpty && body.isEmpty) return;

      // Refresh unread count
      if (mounted) {
        context.read<NotificationProvider>().refresh();
      }

      // Hiện banner trượt xuống
      _messengerKey.currentState?.showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          margin: const EdgeInsets.fromLTRB(12, 0, 12, 0),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          backgroundColor: Colors.white,
          elevation: 6,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 4),
          content: Row(children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.notifications_rounded, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (title.isNotEmpty)
                  Text(title, style: const TextStyle(
                    fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary,
                  )),
                if (body.isNotEmpty)
                  Text(body, style: const TextStyle(
                    fontSize: 12, color: AppTheme.textSecondary,
                  ), maxLines: 2, overflow: TextOverflow.ellipsis),
              ],
            )),
          ]),
        ),
      );
    });
  }

  Future<void> _handleFcmNavigation(RemoteMessage message) async {
    final data = message.data;
    final type = data['type']?.toString() ?? '';
    final roomId = data['roomId']?.toString();

    final nav = _navigatorKey.currentState;
    if (nav == null) return;

    if ((type == 'chat' || type == 'deal') && roomId != null && roomId.isNotEmpty) {
      // Fetch room info để lấy tên người dùng và thông tin bài đăng
      try {
        final room = await ApiService.getRoomById(roomId);
        if (room == null) return;

        final ctx = nav.context;
        final auth = ctx.read<AuthProvider>();
        final myId = auth.userId;
        final other = room['buyerId'] == myId ? room['seller'] : room['buyer'];
        final post = room['post'] as Map? ?? {};

        nav.push(MaterialPageRoute(builder: (_) => ChatScreen(
          roomId: roomId,
          otherUserName: other?['name']?.toString() ?? 'Người dùng',
          postTitle: post['title']?.toString() ?? '',
          postImageLabel: post['imageLabel']?.toString() ?? '',
          postId: post['id']?.toString(),
        )));
      } catch (_) {}
      return;
    }

    if (type == 'deal' || type == 'review') {
      nav.push(MaterialPageRoute(builder: (_) => const DealsScreen()));
      return;
    }
  }

  void _trySendToken() {
    if (_pendingFcmToken == null) return;
    final auth = context.read<AuthProvider>();
    if (auth.isAuth) {
      ApiService.saveFcmToken(_pendingFcmToken!);
      _pendingFcmToken = null;
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Trao Tay',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      scaffoldMessengerKey: _messengerKey,
      navigatorKey: _navigatorKey,
      home: const SplashScreen(),
    );
  }
}
