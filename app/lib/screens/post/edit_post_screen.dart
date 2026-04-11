import 'package:flutter/material.dart';
import '../../data/categories.dart';
import '../../models/post.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class EditPostScreen extends StatefulWidget {
  final Post post;
  const EditPostScreen({super.key, required this.post});

  @override
  State<EditPostScreen> createState() => _EditPostScreenState();
}

class _EditPostScreenState extends State<EditPostScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _titleCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _priceCtrl;
  late String _listingType;
  late String _itemCategory;
  late String _status;
  bool _isSubmitting = false;

  static const _listingTypes = [
    ('sell', 'Bán thanh lý'),
    ('give', 'Tặng / Cho miễn phí'),
  ];

  static final _categories = AppCategories.list.map((c) => (c['value']!, c['label']!)).toList();

  static const _statuses = [
    ('available', 'Còn hàng'),
    ('reserved', 'Đang giữ chỗ'),
    ('done', 'Đã giao xong'),
  ];

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.post.title);
    _descCtrl = TextEditingController(text: widget.post.description);
    _priceCtrl = TextEditingController(text: widget.post.price == 0 ? '' : '${widget.post.price}');
    _listingType = widget.post.listingType;
    final validCategories = AppCategories.list.map((c) => c['value']!).toSet();
    _itemCategory = validCategories.contains(widget.post.itemCategory)
        ? widget.post.itemCategory
        : 'other';
    _status = widget.post.status;
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    final data = {
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'price': int.tryParse(_priceCtrl.text.trim()) ?? 0,
      'listingType': _listingType,
      'itemCategory': _itemCategory,
      'status': _status,
    };

    final ok = await ApiService.updatePost(widget.post.id, data);
    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã cập nhật bài đăng!'), backgroundColor: AppTheme.success, behavior: SnackBarBehavior.floating),
      );
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cập nhật thất bại. Vui lòng thử lại.'), backgroundColor: AppTheme.error, behavior: SnackBarBehavior.floating),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Sửa bài đăng'),
        actions: [
          TextButton(
            onPressed: _isSubmitting ? null : _submit,
            child: _isSubmitting
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
                : const Text('Lưu', style: TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Tiêu đề
              _Label('Tiêu đề *'),
              TextFormField(
                controller: _titleCtrl,
                decoration: _deco('VD: Bàn làm việc gỗ IKEA còn mới'),
                maxLength: 100,
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập tiêu đề' : null,
              ),
              const SizedBox(height: 16),

              // Mô tả
              _Label('Mô tả'),
              TextFormField(
                controller: _descCtrl,
                decoration: _deco('Mô tả chi tiết tình trạng, lý do bán...'),
                maxLines: 4,
                maxLength: 1000,
              ),
              const SizedBox(height: 16),

              // Loại đăng
              _Label('Loại đăng'),
              _SegmentRow(
                options: _listingTypes.map((e) => (e.$1, e.$2)).toList(),
                selected: _listingType,
                onChanged: (v) => setState(() { _listingType = v; if (v == 'give') _priceCtrl.clear(); }),
              ),
              const SizedBox(height: 16),

              // Giá
              if (_listingType == 'sell') ...[
                _Label('Giá (VNĐ)'),
                TextFormField(
                  controller: _priceCtrl,
                  decoration: _deco('VD: 500000'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
              ],

              // Danh mục
              _Label('Danh mục'),
              _DropdownField<String>(
                value: _itemCategory,
                items: _categories.map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$2))).toList(),
                onChanged: (v) => setState(() => _itemCategory = v!),
              ),
              const SizedBox(height: 16),

              // Trạng thái
              _Label('Trạng thái bài đăng'),
              _DropdownField<String>(
                value: _status,
                items: _statuses.map((s) => DropdownMenuItem(value: s.$1, child: Text(s.$2))).toList(),
                onChanged: (v) => setState(() => _status = v!),
              ),
              const SizedBox(height: 32),

              // Nút lưu
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                      : const Text('Lưu thay đổi', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _deco(String hint) => InputDecoration(
    hintText: hint,
    filled: true,
    fillColor: Colors.white,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.border)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
  );
}

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.textPrimary)),
  );
}

class _SegmentRow extends StatelessWidget {
  final List<(String, String)> options;
  final String selected;
  final Function(String) onChanged;
  const _SegmentRow({required this.options, required this.selected, required this.onChanged});

  @override Widget build(BuildContext context) => Row(
    children: options.map((o) {
      final isSelected = o.$1 == selected;
      return Expanded(child: GestureDetector(
        onTap: () => onChanged(o.$1),
        child: Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppTheme.primary : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border),
          ),
          child: Text(o.$2, textAlign: TextAlign.center,
            style: TextStyle(color: isSelected ? Colors.white : AppTheme.textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
        ),
      ));
    }).toList(),
  );
}

class _DropdownField<T> extends StatelessWidget {
  final T value;
  final List<DropdownMenuItem<T>> items;
  final Function(T?) onChanged;
  const _DropdownField({required this.value, required this.items, required this.onChanged});

  @override Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(10),
      border: Border.all(color: AppTheme.border),
    ),
    child: DropdownButtonHideUnderline(
      child: DropdownButton<T>(value: value, items: items, onChanged: onChanged, isExpanded: true),
    ),
  );
}
