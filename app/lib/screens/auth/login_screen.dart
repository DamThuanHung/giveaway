import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../app_shell.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // 0 = OTP, 1 = Mật khẩu
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text('Đăng nhập bằng email',
            style: TextStyle(color: AppTheme.textPrimary, fontWeight: FontWeight.w600, fontSize: 17)),
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
      ),
      body: SafeArea(
        child: Column(
          children: [
            // ── Segment control ──
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(children: [
                  _SegmentTab(label: 'Mã OTP', selected: _tab == 0,
                      onTap: () => setState(() => _tab = 0)),
                  _SegmentTab(label: 'Mật khẩu', selected: _tab == 1,
                      onTap: () => setState(() => _tab = 1)),
                ]),
              ),
            ),

            // ── Form ──
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                child: _tab == 0
                    ? _OtpEmailForm(key: const ValueKey('otp'))
                    : _PasswordForm(key: const ValueKey('pass')),
              ),
            ),

            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ── Tab button ────────────────────────────────────────────────────────────────

class _SegmentTab extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _SegmentTab({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          margin: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: selected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(8),
            boxShadow: selected ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4, offset: const Offset(0, 1))] : [],
          ),
          child: Center(
            child: Text(label, style: TextStyle(
              fontSize: 14,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              color: selected ? AppTheme.primary : AppTheme.textSecondary,
            )),
          ),
        ),
      ),
    );
  }
}

// ── Tab OTP ───────────────────────────────────────────────────────────────────

class _OtpEmailForm extends StatefulWidget {
  const _OtpEmailForm({super.key});
  @override
  State<_OtpEmailForm> createState() => _OtpEmailFormState();
}

class _OtpEmailFormState extends State<_OtpEmailForm> {
  final _emailCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrls = List.generate(6, (_) => TextEditingController());
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
    Navigator.pushAndRemoveUntil(context,
        MaterialPageRoute(builder: (_) => const AppShell()), (_) => false);
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
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!_otpSent) ...[
            Text('Nhập email liên kết với tài khoản',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 12),
            TextField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              enabled: !_isLoading,
              onSubmitted: (_) => _sendOtp(),
              decoration: _inputDeco('Email', Icons.email_outlined),
            ),
          ] else ...[
            RichText(text: TextSpan(
              style: TextStyle(fontSize: 14, color: AppTheme.textSecondary, height: 1.5),
              children: [
                const TextSpan(text: 'Mã OTP đã gửi đến '),
                TextSpan(text: _emailCtrl.text.trim(),
                    style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
              ],
            )),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (i) => _OtpBox(
                controller: _otpCtrls[i], focusNode: _otpFocuses[i],
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
              Flexible(child: Text(_errorMsg!, style: TextStyle(color: AppTheme.error, fontSize: 13))),
            ]),
          ],

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity, height: 52,
            child: ElevatedButton(
              onPressed: _isLoading ? null : (_otpSent ? _verifyOtp : _sendOtp),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary, foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: _isLoading
                  ? const SizedBox(width: 22, height: 22,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text(_otpSent ? 'Xác nhận' : 'Gửi mã OTP',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),

          if (_otpSent) ...[
            const SizedBox(height: 12),
            Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              if (_countdown > 0)
                Text('Gửi lại sau ${_countdown}s',
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 13))
              else
                TextButton(
                  onPressed: _isLoading ? null : () => _sendOtp(isResend: true),
                  child: Text('Gửi lại mã OTP',
                      style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600, fontSize: 13)),
                ),
              const SizedBox(width: 4),
              Text('·', style: TextStyle(color: AppTheme.textSecondary)),
              TextButton(
                onPressed: _isLoading ? null : () {
                  _timer?.cancel();
                  setState(() { _otpSent = false; _countdown = 0; _errorMsg = null;
                    for (final c in _otpCtrls) c.clear(); });
                },
                child: Text('Đổi email',
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
              ),
            ]),
          ],
        ],
      ),
    );
  }
}

// ── Tab Mật khẩu ─────────────────────────────────────────────────────────────

class _PasswordForm extends StatefulWidget {
  const _PasswordForm({super.key});
  @override
  State<_PasswordForm> createState() => _PasswordFormState();
}

class _PasswordFormState extends State<_PasswordForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _isLoading = false;
  bool _obscurePass = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final error = await context.read<AuthProvider>().login(
      _emailCtrl.text.trim(),
      _passCtrl.text.trim(),
    );

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(error),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ));
    } else {
      Navigator.pushAndRemoveUntil(context,
          MaterialPageRoute(builder: (_) => const AppShell()), (_) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(24, 28, 24, 16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Nhập email và mật khẩu để đăng nhập',
                style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
            const SizedBox(height: 12),

            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              decoration: _inputDeco('Email', Icons.email_outlined),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return 'Vui lòng nhập email';
                if (!v.contains('@')) return 'Email không hợp lệ';
                return null;
              },
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _passCtrl,
              obscureText: _obscurePass,
              textInputAction: TextInputAction.done,
              onFieldSubmitted: (_) => _handleLogin(),
              decoration: _inputDeco('Mật khẩu', Icons.lock_outlined).copyWith(
                suffixIcon: IconButton(
                  icon: Icon(_obscurePass ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                      size: 20, color: AppTheme.textSecondary),
                  onPressed: () => setState(() => _obscurePass = !_obscurePass),
                ),
              ),
              validator: (v) {
                if (v == null || v.isEmpty) return 'Vui lòng nhập mật khẩu';
                if (v.length < 6) return 'Tối thiểu 6 ký tự';
                return null;
              },
            ),

            // Quên mật khẩu
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () => Navigator.push(context,
                    MaterialPageRoute(builder: (_) => const ForgotPasswordScreen())),
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8)),
                child: Text('Quên mật khẩu?',
                    style: TextStyle(color: AppTheme.primary, fontSize: 13, fontWeight: FontWeight.w500)),
              ),
            ),

            const SizedBox(height: 8),

            SizedBox(
              width: double.infinity, height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _handleLogin,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary, foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(width: 22, height: 22,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Đăng nhập',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── OTP Box ───────────────────────────────────────────────────────────────────

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
        width: 44, height: 56,
        child: TextField(
          controller: controller, focusNode: focusNode, enabled: enabled,
          keyboardType: TextInputType.number, textAlign: TextAlign.center,
          maxLength: 1, onChanged: onChanged,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            counterText: '', filled: true, fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.primary, width: 2)),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}

// ── Shared helpers ────────────────────────────────────────────────────────────

InputDecoration _inputDeco(String label, IconData icon) => InputDecoration(
  labelText: label,
  prefixIcon: Icon(icon, size: 20, color: AppTheme.textSecondary),
  filled: true, fillColor: AppTheme.background,
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
  errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.error)),
  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
);
