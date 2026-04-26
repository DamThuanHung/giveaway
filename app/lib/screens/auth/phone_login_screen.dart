import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart' as app_auth;
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../app_shell.dart';
import '../../widgets/app_logo.dart';
import 'complete_profile_screen.dart';

class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen> {
  int _tab = 0; // 0 = SĐT, 1 = Email

  void _onSuccess(bool isNewUser) {
    if (!mounted) return;
    final dest = isNewUser ? const CompleteProfileScreen() : const AppShell();
    Navigator.pushAndRemoveUntil(
        context, MaterialPageRoute(builder: (_) => dest), (_) => false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 40),

                    // Branding
                    const Center(
                      child: Column(children: [
                        AppLogo(size: 72),
                        SizedBox(height: 16),
                        Text('Trao Tay', style: TextStyle(
                          fontSize: 26, fontWeight: FontWeight.bold,
                          color: AppTheme.primary, letterSpacing: -0.5,
                        )),
                        SizedBox(height: 6),
                        Text('Mua bán & trao tặng đồ cũ cộng đồng',
                            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                      ]),
                    ),
                    const SizedBox(height: 36),

                    // Tab selector
                    Container(
                      height: 44,
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(children: [
                        _TabBtn(label: 'Số điện thoại', selected: _tab == 0,
                            onTap: () => setState(() => _tab = 0)),
                        _TabBtn(label: 'Email', selected: _tab == 1,
                            onTap: () => setState(() => _tab = 1)),
                        if (ApiService.isLocal)
                          _TabBtn(label: '🛠 Dev', selected: _tab == 2,
                              onTap: () => setState(() => _tab = 2)),
                      ]),
                    ),
                    const SizedBox(height: 28),

                    // Form
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: _tab == 0
                          ? _PhoneOtpForm(key: const ValueKey('phone'), onSuccess: _onSuccess)
                          : _tab == 1
                              ? _EmailOtpForm(key: const ValueKey('email'), onSuccess: _onSuccess)
                              : _DevLoginForm(key: const ValueKey('dev'), onSuccess: _onSuccess),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.only(bottom: 24),
              child: Text(
                'Nhập thông tin để đăng ký hoặc đăng nhập',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Tab button ────────────────────────────────────────────────────────────────

class _TabBtn extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _TabBtn({required this.label, required this.selected, required this.onTap});

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
            boxShadow: selected
                ? [BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 4, offset: const Offset(0, 1))]
                : [],
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

// ── Phone OTP Form ────────────────────────────────────────────────────────────

class _PhoneOtpForm extends StatefulWidget {
  final void Function(bool isNewUser) onSuccess;
  const _PhoneOtpForm({super.key, required this.onSuccess});

  @override
  State<_PhoneOtpForm> createState() => _PhoneOtpFormState();
}

class _PhoneOtpFormState extends State<_PhoneOtpForm> {
  final _phoneCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrls = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _otpFocuses = List.generate(6, (_) => FocusNode());

  bool _isLoading = false;
  bool _otpSent = false;
  String? _verificationId;
  String? _errorMsg;
  int _countdown = 0;
  Timer? _timer;

  @override
  void dispose() {
    _phoneCtrl.dispose();
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

  String _formatPhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('0')) return '+84${digits.substring(1)}';
    if (digits.startsWith('84')) return '+$digits';
    return '+84$digits';
  }

  Future<void> _sendOtp({bool isResend = false}) async {
    final phone = _phoneCtrl.text.trim();
    if (phone.isEmpty) {
      setState(() => _errorMsg = 'Vui lòng nhập số điện thoại');
      return;
    }
    setState(() { _isLoading = true; _errorMsg = null; });

    await FirebaseAuth.instance.verifyPhoneNumber(
      phoneNumber: _formatPhone(phone),
      timeout: const Duration(seconds: 60),
      verificationCompleted: (PhoneAuthCredential credential) async {
        await _signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        if (mounted) setState(() { _isLoading = false; _errorMsg = _mapError(e.code); });
      },
      codeSent: (String verificationId, int? resendToken) {
        if (!mounted) return;
        setState(() {
          _isLoading = false;
          _otpSent = true;
          _verificationId = verificationId;
          if (isResend) for (final c in _otpCtrls) {
            c.clear();
          }
        });
        _startCountdown();
        Future.delayed(const Duration(milliseconds: 100), () {
          if (mounted) _otpFocuses[0].requestFocus();
        });
      },
      codeAutoRetrievalTimeout: (_) {},
    );
  }

  Future<void> _verifyOtp() async {
    final code = _otpCtrls.map((c) => c.text).join();
    if (code.length != 6) {
      setState(() => _errorMsg = 'Vui lòng nhập đủ 6 chữ số');
      return;
    }
    setState(() { _isLoading = true; _errorMsg = null; });
    final credential = PhoneAuthProvider.credential(
      verificationId: _verificationId!,
      smsCode: code,
    );
    await _signInWithCredential(credential);
  }

  Future<void> _signInWithCredential(PhoneAuthCredential credential) async {
    try {
      final result = await FirebaseAuth.instance.signInWithCredential(credential);
      final idToken = await result.user!.getIdToken();
      if (!mounted) return;
      final error = await context.read<app_auth.AuthProvider>().loginWithPhone(idToken!);
      if (!mounted) return;
      if (error != null) {
        setState(() { _isLoading = false; _errorMsg = error; });
      } else {
        widget.onSuccess(context.read<app_auth.AuthProvider>().isNewUser);
      }
    } on FirebaseAuthException catch (e) {
      if (mounted) setState(() { _isLoading = false; _errorMsg = _mapError(e.code); });
    } catch (_) {
      if (mounted) setState(() { _isLoading = false; _errorMsg = 'Đã xảy ra lỗi. Vui lòng thử lại.'; });
    }
  }

  String _mapError(String code) {
    switch (code) {
      case 'invalid-phone-number':       return 'Số điện thoại không hợp lệ';
      case 'too-many-requests':          return 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
      case 'invalid-verification-code':  return 'Mã OTP không đúng';
      case 'session-expired':            return 'Mã OTP đã hết hạn. Vui lòng gửi lại';
      default:                           return 'Đã xảy ra lỗi ($code)';
    }
  }

  void _onOtpChanged(String value, int index) {
    if (value.length == 1) {
      if (index < 5) {
        _otpFocuses[index + 1].requestFocus();
      } else { _otpFocuses[index].unfocus(); _verifyOtp(); }
    }
  }

  void _onOtpKeyDown(RawKeyEvent event, int index) {
    if (event is RawKeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _otpCtrls[index].text.isEmpty && index > 0) {
      _otpFocuses[index - 1].requestFocus();
      _otpCtrls[index - 1].clear();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!_otpSent) ...[
          const Text('Nhập số điện thoại để nhận mã xác nhận',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.border),
            ),
            child: Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                decoration: const BoxDecoration(
                  border: Border(right: BorderSide(color: AppTheme.border)),
                ),
                child: const Row(children: [
                  Text('🇻🇳', style: TextStyle(fontSize: 18)),
                  SizedBox(width: 6),
                  Text('+84', style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimary,
                  )),
                ]),
              ),
              Expanded(
                child: TextField(
                  controller: _phoneCtrl,
                  keyboardType: TextInputType.phone,
                  enabled: !_isLoading,
                  style: const TextStyle(fontSize: 16),
                  onSubmitted: (_) => _sendOtp(),
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  decoration: const InputDecoration(
                    hintText: '912 345 678',
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                  ),
                ),
              ),
            ]),
          ),
        ] else ...[
          RichText(text: TextSpan(
            style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary, height: 1.5),
            children: [
              const TextSpan(text: 'Mã OTP đã được gửi đến '),
              TextSpan(
                text: '+84 ${_phoneCtrl.text.trim().replaceAll(RegExp(r'^0'), '')}',
                style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
              ),
            ],
          )),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: List.generate(6, (i) => _OtpBox(
              controller: _otpCtrls[i], focusNode: _otpFocuses[i],
              onChanged: (v) => _onOtpChanged(v, i),
              onKey: (e) => _onOtpKeyDown(e, i),
              enabled: !_isLoading,
            )),
          ),
        ],

        if (_errorMsg != null) ...[
          const SizedBox(height: 12),
          Row(children: [
            const Icon(Icons.error_outline, color: AppTheme.error, size: 15),
            const SizedBox(width: 6),
            Flexible(child: Text(_errorMsg!, style: const TextStyle(color: AppTheme.error, fontSize: 13))),
          ]),
        ],

        const SizedBox(height: 20),

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
                : Text(_otpSent ? 'Xác nhận' : 'Tiếp tục',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),

        if (_otpSent) ...[
          const SizedBox(height: 12),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            if (_countdown > 0)
              Text('Gửi lại mã sau ${_countdown}s',
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13))
            else
              TextButton(
                onPressed: _isLoading ? null : () => _sendOtp(isResend: true),
                child: const Text('Gửi lại mã OTP',
                    style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
              ),
            const SizedBox(width: 4),
            const Text('·', style: TextStyle(color: AppTheme.textSecondary)),
            const SizedBox(width: 4),
            TextButton(
              onPressed: _isLoading ? null : () {
                _timer?.cancel();
                setState(() {
                  _otpSent = false; _countdown = 0; _errorMsg = null;
                  for (final c in _otpCtrls) {
                    c.clear();
                  }
                });
              },
              child: const Text('Đổi số', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
            ),
          ]),
        ],
      ],
    );
  }
}

// ── Email OTP Form ────────────────────────────────────────────────────────────

class _EmailOtpForm extends StatefulWidget {
  final void Function(bool isNewUser) onSuccess;
  const _EmailOtpForm({super.key, required this.onSuccess});

  @override
  State<_EmailOtpForm> createState() => _EmailOtpFormState();
}

class _EmailOtpFormState extends State<_EmailOtpForm> {
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
    final err = await ApiService.sendEmailLoginOtp(email);
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
    if (isResend && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã gửi lại mã OTP, vui lòng kiểm tra email'), duration: Duration(seconds: 3)),
      );
    }
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
    final error = await context.read<app_auth.AuthProvider>().loginWithEmailOtp(
      _emailCtrl.text.trim().toLowerCase(), code,
    );
    if (!mounted) return;
    if (error != null) {
      setState(() { _isLoading = false; _errorMsg = error; });
      return;
    }
    widget.onSuccess(context.read<app_auth.AuthProvider>().isNewUser);
  }

  void _onOtpChanged(String value, int index) {
    if (value.length == 1) {
      if (index < 5) {
        _otpFocuses[index + 1].requestFocus();
      } else { _otpFocuses[index].unfocus(); _verifyOtp(); }
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!_otpSent) ...[
          const Text('Nhập email để nhận mã xác nhận',
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
            style: const TextStyle(fontSize: 14, color: AppTheme.textSecondary, height: 1.5),
            children: [
              const TextSpan(text: 'Mã OTP đã gửi đến '),
              TextSpan(text: _emailCtrl.text.trim(),
                  style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
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
            const Icon(Icons.error_outline, color: AppTheme.error, size: 15),
            const SizedBox(width: 6),
            Flexible(child: Text(_errorMsg!, style: const TextStyle(color: AppTheme.error, fontSize: 13))),
          ]),
        ],

        const SizedBox(height: 20),

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
                  style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13))
            else
              TextButton(
                onPressed: _isLoading ? null : () => _sendOtp(isResend: true),
                child: const Text('Gửi lại mã OTP',
                    style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600, fontSize: 13)),
              ),
            const SizedBox(width: 4),
            const Text('·', style: TextStyle(color: AppTheme.textSecondary)),
            TextButton(
              onPressed: _isLoading ? null : () {
                _timer?.cancel();
                setState(() {
                  _otpSent = false; _countdown = 0; _errorMsg = null;
                  for (final c in _otpCtrls) {
                    c.clear();
                  }
                });
              },
              child: const Text('Đổi email',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
            ),
          ]),
        ],
      ],
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
  const _OtpBox({required this.controller, required this.focusNode,
      required this.onChanged, required this.onKey, required this.enabled});

  @override
  Widget build(BuildContext context) {
    return RawKeyboardListener(
      focusNode: FocusNode(),
      onKey: onKey,
      child: SizedBox(
        width: 44, height: 56,
        child: TextField(
          controller: controller, focusNode: focusNode, enabled: enabled,
          keyboardType: TextInputType.number,
          textAlign: TextAlign.center,
          maxLength: 1, onChanged: onChanged,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
          decoration: InputDecoration(
            counterText: '', filled: true, fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.border)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.primary, width: 2)),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}

// ── Dev Login Form ────────────────────────────────────────────────────────────

class _DevLoginForm extends StatefulWidget {
  final void Function(bool isNewUser) onSuccess;
  const _DevLoginForm({super.key, required this.onSuccess});
  @override
  State<_DevLoginForm> createState() => _DevLoginFormState();
}

class _DevLoginFormState extends State<_DevLoginForm> {
  String _email = '1@test.com';
  bool _loading = false;
  String? _error;

  static const _accounts = [
    '1@test.com', '2@test.com', '3@test.com', '4@test.com', '5@test.com',
    '6@test.com', '7@test.com', '8@test.com', '9@test.com', '10@test.com',
  ];

  Future<void> _login() async {
    setState(() { _loading = true; _error = null; });
    final error = await context.read<app_auth.AuthProvider>().devLogin(_email);
    if (!mounted) return;
    setState(() => _loading = false);
    if (error == null) {
      widget.onSuccess(false);
    } else {
      setState(() => _error = error);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.orange.shade50,
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.orange.shade200),
          ),
          child: Row(children: [
            Icon(Icons.warning_amber, color: Colors.orange.shade700, size: 18),
            const SizedBox(width: 8),
            Text('Chỉ dùng khi test local', style: TextStyle(color: Colors.orange.shade700, fontSize: 13)),
          ]),
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: AppTheme.background,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppTheme.border),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _email,
              isExpanded: true,
              items: _accounts.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
              onChanged: (v) => setState(() => _email = v!),
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (_error != null) ...[
          Text(_error!, style: const TextStyle(color: AppTheme.error, fontSize: 13)),
          const SizedBox(height: 8),
        ],
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _loading ? null : _login,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: _loading
                ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                : const Text('Đăng nhập Dev', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ),
      ],
    );
  }
}

InputDecoration _inputDeco(String label, IconData icon) => InputDecoration(
  labelText: label,
  prefixIcon: Icon(icon, size: 20, color: AppTheme.textSecondary),
  filled: true, fillColor: AppTheme.background,
  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppTheme.border)),
  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppTheme.border)),
  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
);
