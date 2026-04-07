import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/post_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/notification_provider.dart';
import 'screens/app_shell.dart';
import 'screens/auth/login_screen.dart';
import 'services/api_service.dart';
import 'theme/app_theme.dart';

// Handler xử lý notification khi app đang bị tắt hoàn toàn (background isolate)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase chỉ khởi tạo trên mobile (Android/iOS), không phải web
  if (!kIsWeb) {
    await Firebase.initializeApp();
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
  @override
  void initState() {
    super.initState();
    _setupFcm();
  }

  Future<void> _setupFcm() async {
    if (kIsWeb) return;
    final messaging = FirebaseMessaging.instance;

    // Xin quyền (iOS)
    await messaging.requestPermission(alert: true, badge: true, sound: true);

    // Lấy token và lưu lên server khi user đã đăng nhập
    messaging.onTokenRefresh.listen(_sendTokenToServer);

    final token = await messaging.getToken();
    if (token != null) _sendTokenToServer(token);

    // Khi app foreground nhận notification — polling đã xử lý, không cần thêm
    FirebaseMessaging.onMessage.listen((_) {});
  }

  Future<void> _sendTokenToServer(String token) async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuth) return;
    await ApiService.saveFcmToken(token);
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
          return auth.isAuth ? const AppShell() : const LoginScreen();
        },
      ),
    );
  }
}
