import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../app_shell.dart';
import '../post/create_post_tab.dart';

class CompleteProfileScreen extends StatefulWidget {
  const CompleteProfileScreen({super.key});

  @override
  State<CompleteProfileScreen> createState() => _CompleteProfileScreenState();
}

class _CompleteProfileScreenState extends State<CompleteProfileScreen> {
  final _nameCtrl = TextEditingController();
  bool _isLoading = false;
  bool _saved = false; // sau khi save thành công → hiển thị next-action options
  String? _errorMsg;

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      setState(() => _errorMsg = 'Vui lòng nhập tên hiển thị');
      return;
    }
    if (name.length < 2) {
      setState(() => _errorMsg = 'Tên tối thiểu 2 ký tự');
      return;
    }

    setState(() { _isLoading = true; _errorMsg = null; });

    final auth = context.read<AuthProvider>();
    final ok = await ApiService.updateUser(auth.userId!, {'name': name});

    if (!mounted) return;

    if (ok) {
      auth.updateName(name);
      // M-02 (2026-05-20): thay vì redirect thẳng AppShell, hiển thị 2 lối thoát
      // ("Đăng bài đầu tiên" + "Lướt feed trước") — guide user mới biết nên làm
      // gì tiếp theo, tăng activation rate.
      setState(() {
        _isLoading = false;
        _saved = true;
      });
    } else {
      setState(() {
        _isLoading = false;
        _errorMsg = 'Không thể lưu. Vui lòng thử lại.';
      });
    }
  }

  void _goHome() {
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const AppShell()),
      (_) => false,
    );
  }

  Future<void> _createFirstPost() async {
    // Vào AppShell rồi push CreatePostTab — để sau khi quay lại, user thấy
    // home feed bình thường (không stuck ở CreatePostTab).
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => const AppShell()),
      (_) => false,
    );
    if (!mounted) return;
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const CreatePostTab()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SafeArea(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              if (!_saved) ...[
                // Icon
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_outline_rounded, color: AppTheme.primary, size: 40),
                  ),
                ),
                const SizedBox(height: 28),

                Text(
                  'Chào mừng đến Trao Tay',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Đồ cũ người này, Báu vật người kia',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                ),
                const SizedBox(height: 28),

                // 3 USP intro
                _buildUspItem('🎁', 'Mục TẶNG MIỄN PHÍ riêng', 'Không lẫn với tin bán'),
                const SizedBox(height: 12),
                _buildUspItem('📍', 'Lọc theo tỉnh/quận chính xác', 'Đồ gần nhà, đi lấy nhanh trong ngày'),
                const SizedBox(height: 12),
                _buildUspItem('💬', 'Chat realtime + thông báo đẩy', 'Phản hồi trong vài giây'),
                const SizedBox(height: 32),

                const Text(
                  'Bạn tên gì?',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Tên hiển thị sẽ xuất hiện trên các bài đăng của bạn',
                  style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
                ),
                const SizedBox(height: 16),
              ],

              if (!_saved) ...[
                TextField(
                  controller: _nameCtrl,
                  autofocus: true,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _save(),
                  decoration: InputDecoration(
                    hintText: 'Ví dụ: Nguyễn Văn A',
                    prefixIcon: const Icon(Icons.badge_outlined, color: AppTheme.textSecondary),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.border),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.border),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: AppTheme.primary, width: 1.5),
                    ),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),

                if (_errorMsg != null) ...[
                  const SizedBox(height: 10),
                  Text(_errorMsg!, style: const TextStyle(color: AppTheme.error, fontSize: 13)),
                ],

                const SizedBox(height: 28),

                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _save,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: _isLoading
                        ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Text('Lưu và tiếp tục', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],

              if (_saved) ...[
                // Post-save next-action options (M-02)
                Center(
                  child: Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check_circle, color: AppTheme.primary, size: 48),
                  ),
                ),
                const SizedBox(height: 24),
                const Center(
                  child: Text(
                    'Sẵn sàng rồi!',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                ),
                const SizedBox(height: 8),
                const Center(
                  child: Text(
                    'Bạn có thể đăng bài đầu tiên ngay hoặc lướt feed xem bài người khác',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                  ),
                ),
                const SizedBox(height: 32),

                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton.icon(
                    onPressed: _createFirstPost,
                    icon: const Icon(Icons.add),
                    label: const Text('Đăng bài đầu tiên', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: OutlinedButton(
                    onPressed: _goHome,
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: AppTheme.border),
                      foregroundColor: AppTheme.textPrimary,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Lướt feed trước', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500)),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildUspItem(String emoji, String title, String subtitle) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: AppTheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          alignment: Alignment.center,
          child: Text(emoji, style: const TextStyle(fontSize: 20)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
              const SizedBox(height: 2),
              Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
            ],
          ),
        ),
      ],
    );
  }
}

