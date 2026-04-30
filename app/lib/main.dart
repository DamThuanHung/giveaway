import 'dart:async';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:provider/provider.dart';
import 'firebase_options.dart';
import 'services/analytics.dart';
import 'providers/auth_provider.dart';
import 'providers/post_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/splash_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/profile/my_reviews_screen.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';

const AndroidNotificationChannel _channel = AndroidNotificationChannel(
  'high_importance_channel',
  'Thông báo quan trọng',
  description: 'Kênh thông báo chính của Trao Tay',
  importance: Importance.max,
);

final FlutterLocalNotificationsPlugin _localNotif = FlutterLocalNotificationsPlugin();

const _androidNotifDetails = AndroidNotificationDetails(
  'high_importance_channel',
  'Thông báo quan trọng',
  importance: Importance.max,
  priority: Priority.high,
  playSound: true,
);

// Background / terminated: chạy trong isolate riêng
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  final title = message.data['title'] ?? '';
  final body = message.data['body'] ?? '';
  if (title.isEmpty) return;

  final plugin = FlutterLocalNotificationsPlugin();
  await plugin.initialize(
    const InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    ),
  );
  await plugin.show(
    message.hashCode,
    title,
    body,
    const NotificationDetails(android: _androidNotifDetails),
  );
}

class PendingFcmMessage {
  static RemoteMessage? value;
}

final _navigatorKey = GlobalKey<NavigatorState>();

Future<void> main() async {
  // runZonedGuarded để bắt async errors ngoài Flutter framework — gửi Crashlytics.
  // FlutterError.onError xử lý lỗi sync trong widget tree.
  await runZonedGuarded(() async {
    WidgetsFlutterBinding.ensureInitialized();

    if (!kIsWeb) {
      await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

      // Crashlytics — bắt lỗi widget + async + native (cần bật trên Firebase Console)
      FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
      // Tắt collection ở debug để không spam dashboard khi dev
      await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(!kDebugMode);

      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      await _localNotif.initialize(
        const InitializationSettings(
          android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        ),
      );
      await _localNotif
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_channel);

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
          ChangeNotifierProvider(create: (_) => NotificationProvider()),
        ],
        child: const MyApp(),
      ),
    );
  }, (error, stack) {
    // Catch tất cả lỗi async chưa handle — gửi Crashlytics
    if (!kIsWeb) {
      FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
    }
  });
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  String? _pendingFcmToken;

  @override
  void initState() {
    super.initState();
    _setupFcm();
  }

  Future<void> _setupFcm() async {
    if (kIsWeb) return;
    final messaging = FirebaseMessaging.instance;

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

    // Foreground: hiển thị local notification (đáng tin cậy hơn SnackBar trên Xiaomi)
    FirebaseMessaging.onMessage.listen((message) {
      final title = message.data['title'] ?? message.notification?.title ?? '';
      final body = message.data['body'] ?? message.notification?.body ?? '';
      if (title.isEmpty && body.isEmpty) return;

      if (mounted) {
        context.read<NotificationProvider>().refresh();
      }

      _localNotif.show(
        message.hashCode,
        title,
        body,
        const NotificationDetails(android: _androidNotifDetails),
      );
    });
  }

  Future<void> _handleFcmNavigation(RemoteMessage message) async {
    final data = message.data;
    final type = data['type']?.toString() ?? '';
    final roomId = data['roomId']?.toString();

    final nav = _navigatorKey.currentState;
    if (nav == null) return;

    if (type == 'chat' && roomId != null && roomId.isNotEmpty) {
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

    if (type == 'review' || type == 'transaction_completed') {
      nav.push(MaterialPageRoute(builder: (_) => const MyReviewsScreen()));
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
      navigatorKey: _navigatorKey,
      // Track screen view tự động khi navigate
      navigatorObservers: [Analytics.observer],
      home: const SplashScreen(),
    );
  }
}
