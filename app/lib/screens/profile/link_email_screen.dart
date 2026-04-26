import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class LinkEmailScreen extends StatefulWidget {
  const LinkEmailScreen({super.key});

  @override
  State<LinkEmailScreen> createState() => _LinkEmailScreenState();
}

class _LinkEmailScreenState extends State<LinkEmailScreen> {
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
    for (final c in _otpCtrls) {
      c.dispose();
    }
    for (final f in _otpFocuses) {
      f.dispose();
    }
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _countdown = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() { if (_countdown > 0) {
        _countdown--;
      } else {
        t.cancel();
      } });
    });
  }

  Future<void> _sendOtp({bool isResend = false}) async {
    final email = _emailCtrl.text.trim().toLowerCase();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _errorMsg = 'Vui lòng nhập email hợp lệ');
      return;
    }
    setState(() { _isLoading = true; _errorMsg = null; });
    final err = await ApiService.sendLinkEmailOtp(email);
    if (!mounted) return;
    if (err != null) {
      setState(() { _isLoading = false; _errorMsg = err; });
      return;
    }
    setState(() {
      _isLoading = false;
      _otpSent = true;
      if (isResend) for (final c in _otpCtrls) {
        c.clear();
      }
    });
    _startCountdown();
    Future.delayed(const Duration(milliseconds: 100), () {
      if (mounted) _otpFocuses[0].requestFocus();
    });
  }

  Future<void> _confirm() async {
    final code = _otpCtrls.map((c) => c.text).join();
    if (code.length != 6) {
      setState(() => _errorMsg = 'Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setState(() { _isLoading = true; _errorMsg = null; });
    final err = await ApiService.confirmLinkEmail(_emailCtrl.text.trim().toLowerCase(), code);
    if (!mounted) return;
    if (err != null) {
      setState(() { _isLoading = false; _errorMsg = err; });
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: const Text('Liên kết email thành công!'),
      backgroundColor: AppTheme.success,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ));
    Navigator.pop(context, true);
  }

  void _onOtpChanged(String value, int index) {
    if (value.length == 1) {
      if (index < 5) {
        _otpFocuses[index + 1].requestFocus();
      } else { _otpFocuses[index].unfocus(); _confirm(); }
    }
  }

  void _onOtpKey(KeyEvent event, int index) {
    if (event is KeyDownEvent &&
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
        title: const Text('Liên kết email dự phòng'),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withOpacity(0.06),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.primary.withOpacity(0.15)),
                ),
                child: const Row(children: [
                  Icon(Icons.info_outline, color: AppTheme.primary, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Email dự phòng giúp bạn đăng nhập khi mất số điện thoại.',
                      style: TextStyle(fontSize: 13, color: AppTheme.textPrimary, height: 1.4),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 28),

              Text(
                _otpSent ? 'Nhập mã xác nhận' : 'Nhập email dự phòng',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                _otpSent
                    ? 'Mã OTP đã gửi đến\n${_emailCtrl.text.trim()}'
                    : 'Email này sẽ dùng để khôi phục tài khoản khi cần',
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 28),

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
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.border)),
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
                  const Icon(Icons.error_outline, color: AppTheme.error, size: 15),
                  const SizedBox(width: 6),
                  Expanded(child: Text(_errorMsg!, style: const TextStyle(color: AppTheme.error, fontSize: 13))),
                ]),
              ],

              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : (_otpSent ? _confirm : _sendOtp),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(_otpSent ? 'Xác nhận liên kết' : 'Gửi mã xác nhận',
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
                          child: const Text('Gửi lại mã OTP',
                              style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
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
  final ValueChanged<KeyEvent> onKey;
  final bool enabled;
  const _OtpBox({required this.controller, required this.focusNode, required this.onChanged, required this.onKey, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return KeyboardListener(
      focusNode: FocusNode(),
      onKeyEvent: onKey,
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
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}
