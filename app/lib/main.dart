import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

// 1. Import các Provider (Giữ nguyên vì đã đúng)
import 'providers/auth_provider.dart';
import 'providers/post_provider.dart';
import 'providers/chat_provider.dart';

// 2. SỬA LỖI ĐỎ TẠI ĐÂY: Bỏ chữ 'post/' vì file của anh nằm ở ngoài screens
import 'screens/home_tab.dart';
import 'screens/login_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PostProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Jimoty Clone',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.green),
        useMaterial3: true,
      ),
      home: Consumer<AuthProvider>(
        builder: (ctx, auth, _) {
          // Vì auth_provider của anh đang để mặc định isAuth = true nên sẽ vào HomeTab
          if (auth.isAuth) {
            return const HomeTab();
          } else {
            return const LoginScreen(onLoginSuccess: _dummyCallback);
          }
        },
      ),
    );
  }
}

// Hàm giả lập để tránh lỗi logic
void _dummyCallback() {}