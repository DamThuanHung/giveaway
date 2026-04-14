import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../app_shell.dart';

class EmailLoginScreen extends StatefulWidget {
  const EmailLoginScreen({super.key});

  @override
  State<EmailLoginScreen> createState() => _EmailLoginScreenState();
}

class _EmailLoginScreenState extends State<EmailLoginScreen> {
  final _emailCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrls =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocuses = List.generate(6, (_) => FocusNode());

  bool _isLoading = false;
  bool _otpSent = false;
  String? _errorMsg;
  int _countdown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _emailCtrl.dispose();
    for (final c in _otpCtrls) c.dispose();
    for (final f in _otpFocuses) f.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _countdown = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() { if (_countdown > 0) _countdown--; else t.cancel(); });
    });
  }

  Future<void> _sendOtp({bool isResend = false}) async {
    final email = _emailCtrl.text.trim().toLowerCase();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMsg = 'Vui lòng nhập email hợp lệ');
      return;
    }
    setState(() { _isLoading = true; _errorMsg = null; });
    final err = await ApiService.sendEmailLoginOtp(email);
    if (!mounted) return;
    if (err != null) {
      setState(() { _isLoading = false; _errorMsg = err; });
      return;
    }
    setState(() {
      _isLoading = false;
      _otpSent = true;
      if (isResend) for (final c in _otpCtrls) c.clear();
    });
    _startCountdown();
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) _otpFocuses[0].requestFocus();
    });
  }

  Future<void> _verifyOtp() async {
    final code = _otpCtrls.map((c) => c.text).join();
    if (code.length != 6) {
      setState(() => _errorMsg = 'Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setState(() { _isLoading = true; _errorMsg = null; });
    final user = await ApiService.verifyEmailLoginOtp(_emailCtrl.text.trim().toLowerCase(), code);
    if (!mounted) return;
    if (user == null) {
      setState(() { _isLoading = false; _errorMsg = 'Mã OTP không đúng hoặc đã hết hạn'; });
      return;
    }
    await context.read<AuthProvider>().loadFromPrefs();
    if (!mounted) return;
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const AppShell()),
      (_) => false,
    );
  }

  void _onOtpChanged(String value, int index) {
    if (value.length == 1) {
      if (index < 5) _otpFocuses[index + 1].requestFocus();
      else { _otpFocuses[index].unfocus(); _verifyOtp(); }
    }
  }

  void _onOtpKey(RawKeyEvent event, int index) {
    if (event is RawKeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _otpCtrls[index].text.isEmpty && index > 0) {
      _otpFocuses[index - 1].requestFocus();
      _otpCtrls[index - 1].clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Email dự phòng'),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.email_outlined, color: AppTheme.primary, size: 36),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                _otpSent ? 'Nhập mã xác nhận' : 'Đăng nhập bằng email',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                _otpSent
                    ? 'Mã OTP đã được gửi đến\n${_emailCtrl.text.trim()}'
                    : 'Nhập email dự phòng đã liên kết với tài khoản',
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 32),

              if (!_otpSent) ...[
                TextField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  enabled: !_isLoading,
                  onSubmitted: (_) => _sendOtp(),
                  decoration: InputDecoration(
                    hintText: 'email@example.com',
                    prefixIcon: const Icon(Icons.email_outlined, size: 20),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                  ),
                ),
              ] else ...[
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(6, (i) => _OtpBox(
                    controller: _otpCtrls[i],
                    focusNode: _otpFocuses[i],
                    onChanged: (v) => _onOtpChanged(v, i),
                    onKey: (e) => _onOtpKey(e, i),
                    enabled: !_isLoading,
                  )),
                ),
              ],

              if (_errorMsg != null) ...[
                const SizedBox(height: 12),
                Row(children: [
                  Icon(Icons.error_outline, color: AppTheme.error, size: 15),
                  const SizedBox(width: 6),
                  Expanded(child: Text(_errorMsg!, style: TextStyle(color: AppTheme.error, fontSize: 13))),
                ]),
              ],

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : (_otpSent ? _verifyOtp : _sendOtp),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_otpSent ? 'Xác nhận' : 'Tiếp tục',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                ),
              ),

              if (_otpSent) ...[
                const SizedBox(height: 16),
                Center(
                  child: _countdown > 0
                      ? Text('Gửi lại mã sau ${_countdown}s',
                          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13))
                      : TextButton(
                          onPressed: _isLoading ? null : () => _sendOtp(isResend: true),
                          child: Text('Gửi lại mã OTP',
                              style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                        ),
                ),
                Center(
                  child: TextButton(
                    onPressed: _isLoading ? null : () {
                      _timer?.cancel();
                      setState(() { _otpSent = false; _countdown = 0; _errorMsg = null;
                        for (final c in _otpCtrls) c.clear(); });
                    },
                    child: const Text('Đổi email', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;
  final ValueChanged<RawKeyEvent> onKey;
  final bool enabled;
  const _OtpBox({required this.controller, required this.focusNode, required this.onChanged, required this.onKey, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return RawKeyboardListener(
      focusNode: FocusNode(),
      onKey: onKey,
      child: SizedBox(
        width: 44, height: 54,
        child: TextField(
          controller: controller,
          focusNode: focusNode,
          enabled: enabled,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 1,
          onChanged: onChanged,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            counterText: '',
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}
