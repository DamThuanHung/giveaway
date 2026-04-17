import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart' as app_auth;
import '../../theme/app_theme.dart';
import '../app_shell.dart';
import '../../widgets/app_logo.dart';
import 'complete_profile_screen.dart';
import 'login_screen.dart';

class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _phoneFocus = FocusNode();
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
    _phoneFocus.dispose();
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
        setState(() { _isLoading = false; _errorMsg = _mapError(e.code); });
      },
      codeSent: (String verificationId, int? resendToken) {
        setState(() {
          _isLoading = false;
          _otpSent = true;
          _verificationId = verificationId;
          if (isResend) for (final c in _otpCtrls) c.clear();
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
        final auth = context.read<app_auth.AuthProvider>();
        final dest = auth.isNewUser ? const CompleteProfileScreen() : const AppShell();
        Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => dest), (_) => false);
      }
    } on FirebaseAuthException catch (e) {
      setState(() { _isLoading = false; _errorMsg = _mapError(e.code); });
    } catch (_) {
      setState(() { _isLoading = false; _errorMsg = 'Đã xảy ra lỗi. Vui lòng thử lại.'; });
    }
  }

  String _mapError(String code) {
    switch (code) {
      case 'invalid-phone-number': return 'Số điện thoại không hợp lệ';
      case 'too-many-requests': return 'Quá nhiều yêu cầu. Vui lòng thử lại sau';
      case 'invalid-verification-code': return 'Mã OTP không đúng';
      case 'session-expired': return 'Mã OTP đã hết hạn. Vui lòng gửi lại';
      default: return 'Đã xảy ra lỗi ($code)';
    }
  }

  void _onOtpChanged(String value, int index) {
    if (value.length == 1) {
      if (index < 5) _otpFocuses[index + 1].requestFocus();
      else { _otpFocuses[index].unfocus(); _verifyOtp(); }
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

                    // ── Branding ──
                    if (!_otpSent) ...[
                      Center(
                        child: Column(children: [
                          const AppLogo(size: 72),
                          const SizedBox(height: 16),
                          Text('Trao Tay', style: TextStyle(
                            fontSize: 26, fontWeight: FontWeight.bold, color: AppTheme.primary,
                            letterSpacing: -0.5,
                          )),
                          const SizedBox(height: 6),
                          Text('Mua bán & trao tặng đồ cũ cộng đồng',
                              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                        ]),
                      ),
                      const SizedBox(height: 48),
                      Text('Đăng nhập', style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary,
                      )),
                      const SizedBox(height: 6),
                      Text('Nhập số điện thoại để nhận mã xác nhận',
                          style: TextStyle(fontSize: 14, color: AppTheme.textSecondary)),
                    ] else ...[
                      const SizedBox(height: 8),
                      Text('Nhập mã xác nhận', style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.textPrimary,
                      )),
                      const SizedBox(height: 6),
                      RichText(text: TextSpan(
                        style: TextStyle(fontSize: 14, color: AppTheme.textSecondary, height: 1.5),
                        children: [
                          const TextSpan(text: 'Mã OTP đã được gửi đến '),
                          TextSpan(
                            text: '+84 ${_phoneCtrl.text.trim().replaceAll(RegExp(r'^0'), '')}',
                            style: TextStyle(fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                          ),
                        ],
                      )),
                    ],

                    const SizedBox(height: 28),

                    // ── Input ──
                    if (!_otpSent) ...[
                      Container(
                        decoration: BoxDecoration(
                          color: AppTheme.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
                            decoration: BoxDecoration(
                              border: Border(right: BorderSide(color: AppTheme.border)),
                            ),
                            child: Row(children: [
                              const Text('🇻🇳', style: TextStyle(fontSize: 18)),
                              const SizedBox(width: 6),
                              Text('+84', style: TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimary,
                              )),
                            ]),
                          ),
                          Expanded(
                            child: TextField(
                              controller: _phoneCtrl,
                              focusNode: _phoneFocus,
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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: List.generate(6, (i) => _OtpBox(
                          controller: _otpCtrls[i],
                          focusNode: _otpFocuses[i],
                          onChanged: (v) => _onOtpChanged(v, i),
                          onKey: (e) => _onOtpKeyDown(e, i),
                          enabled: !_isLoading,
                        )),
                      ),
                    ],

                    // ── Error ──
                    if (_errorMsg != null) ...[
                      const SizedBox(height: 12),
                      Row(children: [
                        Icon(Icons.error_outline, color: AppTheme.error, size: 15),
                        const SizedBox(width: 6),
                        Flexible(child: Text(_errorMsg!,
                            style: TextStyle(color: AppTheme.error, fontSize: 13))),
                      ]),
                    ],

                    const SizedBox(height: 24),

                    // ── Nút chính ──
                    SizedBox(
                      width: double.infinity, height: 52,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : (_otpSent ? _verifyOtp : _sendOtp),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
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

                    // ── Sau khi gửi OTP ──
                    if (_otpSent) ...[
                      const SizedBox(height: 16),
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        if (_countdown > 0)
                          Text('Gửi lại mã sau ${_countdown}s',
                              style: TextStyle(color: AppTheme.textSecondary, fontSize: 13))
                        else
                          TextButton(
                            onPressed: _isLoading ? null : () => _sendOtp(isResend: true),
                            child: Text('Gửi lại mã OTP',
                                style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w600)),
                          ),
                        const SizedBox(width: 4),
                        Text('·', style: TextStyle(color: AppTheme.textSecondary)),
                        const SizedBox(width: 4),
                        TextButton(
                          onPressed: _isLoading ? null : () {
                            _timer?.cancel();
                            setState(() {
                              _otpSent = false; _countdown = 0; _errorMsg = null;
                              for (final c in _otpCtrls) c.clear();
                            });
                          },
                          child: Text('Đổi số', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                        ),
                      ]),
                    ],

                    // ── Đăng nhập bằng email ──
                    if (!_otpSent) ...[
                      const SizedBox(height: 24),
                      Row(children: [
                        Expanded(child: Divider(color: AppTheme.border)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('hoặc', style: TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                        ),
                        Expanded(child: Divider(color: AppTheme.border)),
                      ]),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity, height: 52,
                        child: OutlinedButton.icon(
                          onPressed: () => Navigator.push(context,
                              MaterialPageRoute(builder: (_) => const LoginScreen())),
                          icon: Icon(Icons.email_outlined, size: 20, color: AppTheme.textPrimary),
                          label: Text('Đăng nhập bằng email',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500,
                                  color: AppTheme.textPrimary)),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: AppTheme.border),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),

            // ── Footer ghi chú ──
            Padding(
              padding: const EdgeInsets.only(bottom: 24),
              child: Text(
                'Nhập SĐT để đăng ký hoặc đăng nhập',
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
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.primary, width: 2)),
            contentPadding: EdgeInsets.zero,
          ),
        ),
      ),
    );
  }
}
