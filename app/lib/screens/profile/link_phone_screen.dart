import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

/// Liên kết SĐT dự phòng cho user đã đăng nhập (đối xứng với LinkEmailScreen).
/// Firebase verify SMS OTP ở client → gửi idToken lên backend POST /user/link-phone.
class LinkPhoneScreen extends StatefulWidget {
  const LinkPhoneScreen({super.key});

  @override
  State<LinkPhoneScreen> createState() => _LinkPhoneScreenState();
}

class _LinkPhoneScreenState extends State<LinkPhoneScreen> {
  final _phoneCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrls =
      List.generate(6, (_) => TextEditingController());
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
      setState(() {
        if (_countdown > 0) { _countdown--; } else { t.cancel(); }
      });
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
        await _confirmWithCredential(credential);
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
    await _confirmWithCredential(credential);
  }

  Future<void> _confirmWithCredential(PhoneAuthCredential credential) async {
    try {
      final result = await FirebaseAuth.instance.signInWithCredential(credential);
      final idToken = await result.user!.getIdToken();
      // App dùng JWT riêng (không phải Firebase auth), nên signOut ngay sau khi
      // lấy idToken để Firebase không giữ session dangling. Tránh trường hợp
      // user logout app nhưng Firebase vẫn nhớ phone account này.
      await FirebaseAuth.instance.signOut();
      if (!mounted) return;
      final err = await ApiService.linkPhone(idToken!);
      if (!mounted) return;
      if (err != null) {
        setState(() { _isLoading = false; _errorMsg = err; });
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Text('Liên kết số điện thoại thành công!'),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ));
      Navigator.pop(context, true);
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
      } else { _otpFocuses[index].unfocus(); /* không auto-verify — user xem lại rồi bấm Xác nhận */ }
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
        title: const Text('Liên kết SĐT dự phòng'),
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
                      'SĐT dự phòng giúp bạn đăng nhập khi mất quyền truy cập email.',
                      style: TextStyle(fontSize: 13, color: AppTheme.textPrimary, height: 1.4),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 28),

              Text(
                _otpSent ? 'Nhập mã xác nhận' : 'Nhập số điện thoại dự phòng',
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
              const SizedBox(height: 8),
              Text(
                _otpSent
                    ? 'Mã OTP đã gửi đến\n+84 ${_phoneCtrl.text.trim().replaceAll(RegExp(r"^0"), "")}'
                    : 'SĐT này sẽ dùng để khôi phục tài khoản khi cần',
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14, height: 1.5),
              ),
              const SizedBox(height: 28),

              if (!_otpSent) ...[
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
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
                      : Text(_otpSent ? 'Xác nhận liên kết' : 'Gửi mã OTP',
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
