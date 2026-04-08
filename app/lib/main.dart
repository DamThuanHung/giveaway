import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'firebase_options.dart';
import 'providers/auth_provider.dart';
import 'providers/post_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/app_shell.dart';
import 'screens/auth/login_screen.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (!kIsWeb) {
    await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
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

    // Lưu token tạm, gửi lên server sau khi auth load xong
    messaging.onTokenRefresh.listen((token) {
      _pendingFcmToken = token;
      _trySendToken();
    });

    final token = await messaging.getToken();
    if (token != null) {
      _pendingFcmToken = token;
      _trySendToken();
    }

    FirebaseMessaging.onMessage.listen((_) {});
  }

  void _trySendToken() {
    if (_pendingFcmToken == null) return;
    final auth = context.read<AuthProvider>();
    if (auth.isAuth) {
      ApiService.saveFcmToken(_pendingFcmToken!);
      _pendingFcmToken = null;
    }
    // Nếu chưa auth → sẽ được gọi lại khi auth thay đổi (xem build bên dưới)
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Cho và Tặng',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: Consumer<AuthProvider>(
        builder: (ctx, auth, _) {
          if (auth.isLoading) {
            return const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          }
          // Khi auth vừa load xong và user đã đăng nhập → gửi token nếu còn pending
          if (auth.isAuth && _pendingFcmToken != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) => _trySendToken());
          }
          return auth.isAuth ? const AppShell() : const LoginScreen();
        },
      ),
    );
  }
}
