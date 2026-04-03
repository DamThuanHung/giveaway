import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Sửa đường dẫn import cho đúng vị trí thực tế của anh
import '../../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  final VoidCallback onLoginSuccess;

  const LoginScreen({
    super.key,
    required this.onLoginSuccess,
  });

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  bool isLoading = false;

  Future<void> handleLogin() async {
    if (emailController.text.isEmpty || passwordController.text.isEmpty) return;

    setState(() {
      isLoading = true;
    });

    try {
      // Sửa lại cách gọi hàm login cho khớp với ApiService của anh
      final result = await ApiService.login(
        emailController.text.trim(),
        passwordController.text.trim(),
      );

      final prefs = await SharedPreferences.getInstance();

      // Giả lập lưu token và thông tin để vào App
      await prefs.setString('token', 'fake_token');
      await prefs.setString('userName', 'Người dùng Test');

      if (!mounted) return;

      // Thông báo cho main.dart biết đã thành công để mở HomeTab
      widget.onLoginSuccess();

    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi đăng nhập: $e')),
      );
    } finally {
      if (!mounted) return;
      setState(() {
        isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Đăng nhập')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: emailController,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Mật khẩu'),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: isLoading ? null : handleLogin,
              child: isLoading
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Đăng nhập'),
            ),
          ],
        ),
      ),
    );
  }
}