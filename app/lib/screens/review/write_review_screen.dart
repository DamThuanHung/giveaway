import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

/// Màn hình viết hoặc sửa đánh giá user-to-user gắn với 1 bài đăng cụ thể.
///
/// Flow:
/// - User mở từ chat sau khi bấm "Hoàn thành giao dịch"
/// - User mở từ notification "Đối tác đã đánh giá bạn"
/// - User mở từ list "Bài đã giao dịch" của profile
///
/// Edit window: 24h sau submit. Sau đó readonly.
class WriteReviewScreen extends StatefulWidget {
  final String postId;
  final String revieweeName;
  final String? postTitle; // hiển thị context "đánh giá cho bài 'Áo Zara'"

  const WriteReviewScreen({
    super.key,
    required this.postId,
    required this.revieweeName,
    this.postTitle,
  });

  @override
  State<WriteReviewScreen> createState() => _WriteReviewScreenState();
}

class _WriteReviewScreenState extends State<WriteReviewScreen> {
  int _rating = 5;
  final _commentCtrl = TextEditingController();
  bool _isLoading = false;
  bool _isEditing = false; // true nếu user đã review trước đó (trong 24h edit window)
  bool _checkingExisting = true;

  @override
  void initState() {
    super.initState();
    _checkExisting();
  }

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _checkExisting() async {
    final result = await ApiService.checkReviewed(widget.postId);
    if (!mounted) return;
    final existing = result['review'] as Map?;
    if (existing != null) {
      _isEditing = true;
      _rating = (existing['rating'] as int?) ?? 5;
      _commentCtrl.text = (existing['comment'] as String?) ?? '';
    }
    setState(() => _checkingExisting = false);
  }

  Future<void> _submit() async {
    setState(() => _isLoading = true);
    final ok = _isEditing
        ? await ApiService.updateReview(widget.postId, _rating, comment: _commentCtrl.text.trim())
        : await ApiService.createReview(widget.postId, _rating, comment: _commentCtrl.text.trim());
    if (!mounted) return;
    setState(() => _isLoading = false);
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_isEditing ? 'Đã cập nhật đánh giá' : 'Đã gửi đánh giá'),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_isEditing
            ? 'Sửa đánh giá thất bại — có thể đã quá 24 giờ'
            : 'Gửi đánh giá thất bại'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingExisting) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: Text(_isEditing ? 'Sửa đánh giá' : 'Đánh giá giao dịch')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(child: Column(children: [
              Text('Đánh giá cho ${widget.revieweeName}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              if (widget.postTitle != null && widget.postTitle!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text('Bài: ${widget.postTitle}',
                    style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
              const SizedBox(height: 16),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) {
                return GestureDetector(
                  onTap: () => setState(() => _rating = i + 1),
                  child: Icon(
                    i < _rating ? Icons.star : Icons.star_border,
                    color: AppTheme.warning,
                    size: 40,
                  ),
                );
              })),
              const SizedBox(height: 8),
              Text(_ratingLabel, style: const TextStyle(color: AppTheme.warning, fontWeight: FontWeight.w600)),
            ])),
            const SizedBox(height: 24),
            TextField(
              controller: _commentCtrl,
              maxLines: 4,
              maxLength: 1000,
              decoration: const InputDecoration(
                labelText: 'Nhận xét (tùy chọn)',
                alignLabelWithHint: true,
                helperText: 'Bạn có thể sửa đánh giá trong vòng 24 giờ',
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submit,
                child: _isLoading
                    ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : Text(_isEditing ? 'Cập nhật đánh giá' : 'Gửi đánh giá'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String get _ratingLabel {
    switch (_rating) {
      case 1: return 'Rất tệ';
      case 2: return 'Tệ';
      case 3: return 'Bình thường';
      case 4: return 'Tốt';
      case 5: return 'Tuyệt vời';
      default: return '';
    }
  }
}
