import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class PhoneLoginScreen extends StatefulWidget {
  const PhoneLoginScreen({super.key});

  @override
  State<PhoneLoginScreen> createState() => _PhoneLoginScreenState();
}

class _PhoneLoginScreenState extends State<PhoneLoginScreen> {
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();
  bool _isLoading = false;
  bool _otpSent = false;
  String? _verificationId;
  String? _errorMsg;

  @override
  void dispose() {
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  String _formatPhone(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('0')) return '+84${digits.substring(1)}';
    if (digits.startsWith('84')) return '+$digits';
    return '+84$digits';
  }

  Future<void> _sendOtp() async {
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
        // Auto-verify (Android only)
        await _signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        setState(() {
          _isLoading = false;
          _errorMsg = _mapError(e.code);
        });
      },
      codeSent: (String verificationId, int? resendToken) {
        setState(() {
          _isLoading = false;
          _otpSent = true;
          _verificationId = verificationId;
        });
      },
      codeAutoRetrievalTimeout: (_) {},
    );
  }

  Future<void> _verifyOtp() async {
    final code = _otpCtrl.text.trim();
    if (code.length != 6) {
      setState(() => _errorMsg = 'Mã OTP gồm 6 chữ số');
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

      final error = await context.read<AuthProvider>().loginWithPhone(idToken!);
      if (!mounted) return;

      if (error != null) {
        setState(() { _isLoading = false; _errorMsg = error; });
      }
      // Nếu thành công, main.dart sẽ tự điều hướng sang AppShell
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        foregroundColor: AppTheme.textPrimary,
        title: const Text('Đăng nhập bằng SĐT', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),

            // Icon
            Center(
              child: Container(
                width: 72, height: 72,
                decoration: BoxDecoration(color: AppTheme.primary.withOpacity(0.1), shape: BoxShape.circle),
                child: Icon(Icons.phone_android_rounded, color: AppTheme.primary, size: 36),
              ),
            ),
            const SizedBox(height: 24),

            Text(
              _otpSent ? 'Nhập mã xác nhận' : 'Xác minh số điện thoại',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _otpSent
                  ? 'Mã OTP đã được gửi đến ${_phoneCtrl.text.trim()}'
                  : 'Chúng tôi sẽ gửi mã OTP đến số điện thoại của bạn',
              style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
            ),
            const SizedBox(height: 32),

            if (!_otpSent) ...[
              // Phone input
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                enabled: !_isLoading,
                decoration: _inputDecoration('Số điện thoại', Icons.phone_outlined),
              ),
            ] else ...[
              // OTP input
              TextField(
                controller: _otpCtrl,
                keyboardType: TextInputType.number,
                maxLength: 6,
                enabled: !_isLoading,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                decoration: _inputDecoration('Mã OTP 6 số', Icons.lock_outlined).copyWith(counterText: ''),
              ),
            ],

            if (_errorMsg != null) ...[
              const SizedBox(height: 12),
              Text(_errorMsg!, style: TextStyle(color: AppTheme.error, fontSize: 13)),
            ],

            const SizedBox(height: 24),

            // Action button
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : (_otpSent ? _verifyOtp : _sendOtp),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: _isLoading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_otpSent ? 'Xác nhận' : 'Gửi mã OTP',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),

            if (_otpSent) ...[
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: _isLoading ? null : () => setState(() { _otpSent = false; _otpCtrl.clear(); _errorMsg = null; }),
                  child: Text('Đổi số điện thoại', style: TextStyle(color: AppTheme.textSecondary)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: AppTheme.textSecondary),
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }
}
