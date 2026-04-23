import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  late final TextEditingController _companyCtrl; // jobs: tên công ty
  late String _listingType;
  late String _itemCategory;
  late String _status;
  late String _subType;     // jobs: job type | realestate: rent/sell
  late String _priceUnit;   // jobs/realestate/service: đơn vị giá
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

  bool get _isJob => _itemCategory == 'jobs';
  bool get _isRealestate => _itemCategory == 'realestate';
  bool get _isService => _itemCategory == 'service';

  @override
  void initState() {
    super.initState();
    final p = widget.post;
    _titleCtrl   = TextEditingController(text: p.title);
    _descCtrl    = TextEditingController(text: p.description);
    _priceCtrl   = TextEditingController(text: p.price == 0 ? '' : '${p.price}');
    _companyCtrl = TextEditingController(text: p.isJob ? (p.serviceArea ?? '') : '');
    final validCats = AppCategories.list.map((c) => c['value']!).toSet();
    _itemCategory = validCats.contains(p.itemCategory) ? p.itemCategory : 'other';
    _listingType  = p.listingType;
    _status       = p.status;
    _subType      = p.subType ?? (p.isJob ? 'full-time' : 'rent');
    _priceUnit    = p.priceUnit ?? 'month';
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    _companyCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    final data = <String, dynamic>{
      'title':       _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'price':       int.tryParse(_priceCtrl.text.trim()) ?? 0,
      'listingType': (_isJob || _isRealestate) ? 'sell' : _listingType,
      'itemCategory': _itemCategory,
      'status':      _status,
      if (_isJob) ...{
        'postType':   'job',
        'subType':    _subType,
        'priceUnit':  _priceUnit,
        'serviceArea': _companyCtrl.text.trim(),
      },
      if (_isRealestate) ...{
        'postType':  'realestate',
        'subType':   _subType,
        'priceUnit': _priceUnit,
      },
      if (_isService) ...{
        'postType':  'service',
        'priceUnit': _priceUnit,
      },
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
                decoration: _deco('Mô tả chi tiết...'),
                maxLines: 4,
                maxLength: 1000,
              ),
              const SizedBox(height: 16),

              // Danh mục
              _Label('Danh mục'),
              _DropdownField<String>(
                value: _itemCategory,
                items: _categories.map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$2))).toList(),
                onChanged: (v) => setState(() {
                  _itemCategory = v!;
                  if (v == 'jobs') { _subType = 'full-time'; _priceUnit = 'month'; }
                  else if (v == 'realestate') { _subType = 'rent'; _priceUnit = 'month'; }
                }),
              ),
              const SizedBox(height: 16),

              // ── Jobs fields ─────────────────────────────────
              if (_isJob) ...[
                _Label('Hình thức làm việc *'),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: [
                    _TypeChip('Toàn thời gian', 'full-time', _subType, (v) => setState(() => _subType = v)),
                    _TypeChip('Bán thời gian',  'part-time', _subType, (v) => setState(() => _subType = v)),
                    _TypeChip('Freelance',       'freelance', _subType, (v) => setState(() => _subType = v)),
                    _TypeChip('Thực tập',        'intern',    _subType, (v) => setState(() => _subType = v)),
                    _TypeChip('Remote',          'remote',    _subType, (v) => setState(() => _subType = v)),
                  ],
                ),
                const SizedBox(height: 16),
                _Label('Tên công ty / Nhà tuyển dụng'),
                TextFormField(
                  controller: _companyCtrl,
                  decoration: _deco('VD: Công ty ABC').copyWith(prefixIcon: const Icon(Icons.business_outlined)),
                  maxLength: 100,
                ),
                const SizedBox(height: 8),
                _Label('Mức lương (VNĐ)'),
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(flex: 3, child: TextFormField(
                    controller: _priceCtrl,
                    decoration: _deco('Để trống = thỏa thuận').copyWith(prefixIcon: const Icon(Icons.payments_outlined)),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return null;
                      final n = int.tryParse(v.trim());
                      if (n == null || n > 2000000000) return 'Tối đa 2 tỷ đồng';
                      return null;
                    },
                  )),
                  const SizedBox(width: 8),
                  Expanded(flex: 2, child: _DropdownField<String>(
                    value: (_priceUnit == 'month' || _priceUnit == 'hour') ? _priceUnit : 'month',
                    items: const [
                      DropdownMenuItem(value: 'month', child: Text('/tháng')),
                      DropdownMenuItem(value: 'hour',  child: Text('/giờ')),
                    ],
                    onChanged: (v) => setState(() => _priceUnit = v!),
                  )),
                ]),
                const SizedBox(height: 16),
              ],

              // ── Item thường / Service — loại đăng + giá ───
              if (!_isJob && !_isRealestate) ...[
                _Label('Loại đăng'),
                _SegmentRow(
                  options: _listingTypes.map((e) => (e.$1, e.$2)).toList(),
                  selected: _listingType,
                  onChanged: (v) => setState(() { _listingType = v; if (v == 'give') _priceCtrl.clear(); }),
                ),
                const SizedBox(height: 16),
                if (_listingType == 'sell') ...[
                  _Label('Giá (VNĐ)'),
                  TextFormField(
                    controller: _priceCtrl,
                    decoration: _deco('Để trống = thương lượng'),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(12)],
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return null;
                      final n = int.tryParse(v.trim());
                      if (n == null || n > 2000000000) return 'Giá không hợp lệ';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                ],
              ],

              // Trạng thái
              _Label('Trạng thái bài đăng'),
              _DropdownField<String>(
                value: _status,
                items: _statuses.map((s) => DropdownMenuItem(value: s.$1, child: Text(s.$2))).toList(),
                onChanged: (v) => setState(() => _status = v!),
              ),
              const SizedBox(height: 32),

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

// ── Widgets ───────────────────────────────────────────────────────────────────

class _Label extends StatelessWidget {
  final String text;
  const _Label(this.text);
  @override Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppTheme.textPrimary)),
  );
}

class _TypeChip extends StatelessWidget {
  final String label, value, selected;
  final Function(String) onTap;
  const _TypeChip(this.label, this.value, this.selected, this.onTap);

  @override Widget build(BuildContext context) {
    final isSelected = value == selected;
    return GestureDetector(
      onTap: () => onTap(value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppTheme.primary : AppTheme.border),
        ),
        child: Text(label, style: TextStyle(
          fontSize: 13, fontWeight: FontWeight.w600,
          color: isSelected ? Colors.white : AppTheme.textSecondary,
        )),
      ),
    );
  }
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
