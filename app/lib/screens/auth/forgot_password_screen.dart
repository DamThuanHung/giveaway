import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  // Bước 1: nhập email — Bước 2: nhập OTP + mật khẩu mới
  int _step = 1;
  bool _isLoading = false;

  final _emailCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  final _formKey1 = GlobalKey<FormState>();
  final _formKey2 = GlobalKey<FormState>();
  bool _obscurePass = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _otpCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    if (!_formKey1.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final error = await ApiService.sendForgotPasswordOtp(_emailCtrl.text.trim());
    if (!mounted) return;
    setState(() => _isLoading = false);
    if (error != null) {
      _showError(error);
    } else {
      setState(() => _step = 2);
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey2.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final error = await ApiService.resetPassword(
      _emailCtrl.text.trim(),
      _otpCtrl.text.trim(),
      _passCtrl.text.trim(),
    );
    if (!mounted) return;
    setState(() => _isLoading = false);
    if (error != null) {
      _showError(error);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.'),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
      Navigator.pop(context);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: AppTheme.error,
      behavior: SnackBarBehavior.floating,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Quên mật khẩu', style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600)),
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: _step == 1 ? _buildStep1() : _buildStep2(),
      ),
    );
  }

  Widget _buildStep1() {
    return Form(
      key: _formKey1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Nhập email của bạn', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
          const SizedBox(height: 8),
          const Text('Chúng tôi sẽ gửi mã OTP đến email để xác nhận.', style: TextStyle(color: AppTheme.textSecondary, fontSize: 14)),
          const SizedBox(height: 32),
          TextFormField(
            controller: _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _sendOtp(),
            decoration: _deco('Email', Icons.email_outlined),
            validator: (v) {
              if (v == null || v.trim().isEmpty) return 'Vui lòng nhập email';
              if (!v.contains('@')) return 'Email không hợp lệ';
              return null;
            },
          ),
          const SizedBox(height: 32),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _sendOtp,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: _isLoading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Gửi mã OTP', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep2() {
    return Form(
      key: _formKey2,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Đặt lại mật khẩu', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
          const SizedBox(height: 8),
          RichText(text: TextSpan(
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
            children: [
              const TextSpan(text: 'Mã OTP đã được gửi đến '),
              TextSpan(text: _emailCtrl.text.trim(), style: const TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600)),
            ],
          )),
          const SizedBox(height: 32),

          // OTP
          TextFormField(
            controller: _otpCtrl,
            keyboardType: TextInputType.number,
            textInputAction: TextInputAction.next,
            maxLength: 6,
            style: const TextStyle(fontSize: 22, letterSpacing: 8, fontWeight: FontWeight.bold),
            textAlign: TextAlign.center,
            decoration: _deco('Mã OTP (6 chữ số)', Icons.key_outlined).copyWith(counterText: ''),
            validator: (v) {
              if (v == null || v.trim().length != 6) return 'Mã OTP gồm 6 chữ số';
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Mật khẩu mới
          TextFormField(
            controller: _passCtrl,
            obscureText: _obscurePass,
            textInputAction: TextInputAction.next,
            decoration: _deco('Mật khẩu mới', Icons.lock_outlined).copyWith(
              suffixIcon: IconButton(
                icon: Icon(_obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                onPressed: () => setState(() => _obscurePass = !_obscurePass),
              ),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return 'Vui lòng nhập mật khẩu mới';
              if (v.length < 6) return 'Tối thiểu 6 ký tự';
              return null;
            },
          ),
          const SizedBox(height: 16),

          // Xác nhận mật khẩu
          TextFormField(
            controller: _confirmCtrl,
            obscureText: true,
            textInputAction: TextInputAction.done,
            onFieldSubmitted: (_) => _resetPassword(),
            decoration: _deco('Xác nhận mật khẩu mới', Icons.lock_outlined),
            validator: (v) => v != _passCtrl.text ? 'Mật khẩu không khớp' : null,
          ),
          const SizedBox(height: 32),

          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _resetPassword,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: _isLoading
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Đặt lại mật khẩu', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 16),
          Center(
            child: TextButton(
              onPressed: _isLoading ? null : () => setState(() { _step = 1; _otpCtrl.clear(); _passCtrl.clear(); _confirmCtrl.clear(); }),
              child: const Text('Gửi lại mã OTP', style: TextStyle(color: AppTheme.primary)),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _deco(String label, IconData icon) => InputDecoration(
    labelText: label,
    prefixIcon: Icon(icon, color: AppTheme.textSecondary),
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
    errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.error)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  );
}
