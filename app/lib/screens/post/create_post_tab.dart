import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';
import 'map_picker_screen.dart';
import '../../data/categories.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class CreatePostTab extends StatefulWidget {
  const CreatePostTab({super.key});

  @override
  State<CreatePostTab> createState() => _CreatePostTabState();
}

class _CreatePostTabState extends State<CreatePostTab> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();

  List<XFile> _selectedImages = [];
  List<Future<Uint8List>> _imageByteFutures = [];

  double? _lat;
  double? _lng;
  String _selectedAddress = '';
  String _selectedProvince = '';
  String _selectedDistrict = '';
  String _selectedWard = '';

  String _listingType = 'sell';
  String _itemCategory = 'electronics';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  bool get _hasUnsavedData =>
      _titleController.text.isNotEmpty ||
      _descController.text.isNotEmpty ||
      _priceController.text.isNotEmpty ||
      _selectedImages.isNotEmpty ||
      _lat != null;

  Future<void> _confirmLeave() async {
    if (_isSubmitting) return;
    if (!_hasUnsavedData) { Navigator.pop(context); return; }
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Thoát khỏi bài đăng?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Thông tin bạn đã nhập sẽ không được lưu.'),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => Navigator.pop(context, false),
                child: const Text('Tiếp tục soạn', style: TextStyle(color: Colors.white)),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.error,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => Navigator.pop(context, true),
                child: const Text('Hủy bài đăng', style: TextStyle(color: Colors.white)),
              ),
            ),
          ],
        ),
      ),
    );
    if (confirm == true && mounted) Navigator.pop(context);
  }

  Future<void> _pickImage() async {
    if (_selectedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bạn đã chọn đủ 5 ảnh rồi nhé'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    final remaining = 5 - _selectedImages.length;
    final picked = await ImagePicker().pickMultiImage(imageQuality: 75, limit: remaining);
    if (picked.isEmpty) return;
    final limited = picked.take(remaining).toList();
    setState(() {
      _selectedImages.addAll(limited);
      _imageByteFutures.addAll(limited.map((f) => f.readAsBytes()));
    });
    if (picked.length > remaining && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Bạn chỉ có thể thêm $remaining ảnh nữa (tối đa 5 ảnh mỗi bài)'),
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  void _removeImage(int index) {
    setState(() {
      _selectedImages.removeAt(index);
      _imageByteFutures.removeAt(index);
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn ít nhất 1 ảnh'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    if (_lat == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn vị trí bài đăng'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final postData = {
      'title': _titleController.text.trim(),
      'description': _descController.text.trim(),
      'price': _listingType == 'give' ? '0' : (_priceController.text.trim().isEmpty ? '0' : _priceController.text.trim()),
      'listingType': _listingType,
      'itemCategory': _itemCategory,
      'province': _selectedProvince,
      'district': _selectedDistrict,
      'ward': _selectedWard,
      'addressDetail': _selectedAddress,
      if (_lat != null) 'latitude': _lat.toString(),
      if (_lng != null) 'longitude': _lng.toString(),
    };

    try {
      final ok = await ApiService.createPost(postData, _selectedImages);
      if (!mounted) return;
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đăng tin thành công!'),
          backgroundColor: AppTheme.success,
          behavior: SnackBarBehavior.floating,
        ));
        _titleController.clear();
        _descController.clear();
        _priceController.clear();
        setState(() {
          _selectedImages = [];
          _imageByteFutures = [];
          _lat = null;
          _lng = null;
          _selectedAddress = '';
          _selectedProvince = '';
          _selectedDistrict = '';
          _selectedWard = '';
          _listingType = 'sell';
          _itemCategory = 'electronics';
        });
        if (mounted) Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đăng tin thất bại. Vui lòng thử lại.'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
      debugPrint('❌ CreatePostTab._submit error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Lỗi kết nối server'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (didPop) async {
        if (didPop) return;
        if (_isSubmitting) return;
        if (!_hasUnsavedData) { Navigator.pop(context); return; }
        await _confirmLeave();
      },
      child: Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Đăng tin mới'),
        leading: _isSubmitting
            ? const SizedBox.shrink()
            : IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => _confirmLeave(),
              ),
      ),
      body: _isSubmitting
          ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              CircularProgressIndicator(color: AppTheme.primary),
              SizedBox(height: 16),
              Text('Đang đăng tin...', style: TextStyle(color: AppTheme.textSecondary)),
            ]))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildImagePicker(),
                    const SizedBox(height: 20),
                    _buildTypeSelector(),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(labelText: 'Tiêu đề *', border: OutlineInputBorder()),
                      textInputAction: TextInputAction.next,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Vui lòng nhập tiêu đề';
                        if (v.trim().length < 5) return 'Tiêu đề quá ngắn (tối thiểu 5 ký tự)';
                        return null;
                      },
                      maxLength: 100,
                    ),
                    const SizedBox(height: 16),
                    if (_listingType != 'give')
                      TextFormField(
                        controller: _priceController,
                        decoration: const InputDecoration(
                          labelText: 'Giá (VNĐ)',
                          border: OutlineInputBorder(),
                          hintText: 'Để trống nếu muốn thương lượng',
                        ),
                        keyboardType: TextInputType.number,
                        textInputAction: TextInputAction.next,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(12),
                        ],
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) return null;
                          final price = int.tryParse(v.trim());
                          if (price == null || price < 0) return 'Vui lòng kiểm tra lại — giá không hợp lệ';
                          if (price > 999999999999) return 'Vui lòng kiểm tra lại — giá quá lớn';
                          return null;
                        },
                      ),
                    if (_listingType != 'give') const SizedBox(height: 16),
                    _buildCategoryDropdown(),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _descController,
                      decoration: const InputDecoration(labelText: 'Mô tả chi tiết', border: OutlineInputBorder()),
                      maxLines: 4,
                      maxLength: 1000,
                      textInputAction: TextInputAction.done,
                    ),
                    const SizedBox(height: 16),
                    _buildLocationTile(),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: _submit,
                        child: const Text('ĐĂNG TIN', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
      ),
    );
  }

  Widget _buildImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Ảnh *', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        SizedBox(
          height: 100,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              // Nút thêm ảnh — ẩn khi đủ 5
              if (_selectedImages.length < 5)
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 90, height: 90,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.border, width: 1.5),
                    ),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      const Icon(Icons.add_photo_alternate_outlined, color: AppTheme.primary, size: 28),
                      const SizedBox(height: 4),
                      const Text('Thêm ảnh', style: TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.w500)),
                      const SizedBox(height: 2),
                      Text(
                        'còn ${5 - _selectedImages.length} chỗ',
                        style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                      ),
                    ]),
                  ),
                ),
              // Ảnh đã chọn
              ...List.generate(_selectedImages.length, (i) => Stack(
                children: [
                  FutureBuilder<Uint8List>(
                    future: _imageByteFutures[i],
                    builder: (ctx, snap) {
                      if (snap.hasData) {
                        return Container(
                          width: 90, height: 90,
                          margin: const EdgeInsets.only(right: 8),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(10),
                            child: Image.memory(snap.data!, fit: BoxFit.cover),
                          ),
                        );
                      }
                      if (snap.hasError) {
                        return Container(
                          width: 90, height: 90,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(10)),
                          child: const Center(child: Icon(Icons.broken_image_outlined, color: AppTheme.textSecondary)),
                        );
                      }
                      return Container(
                        width: 90, height: 90,
                        margin: const EdgeInsets.only(right: 8),
                        decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(10)),
                        child: const Center(child: CircularProgressIndicator(strokeWidth: 2)),
                      );
                    },
                  ),
                  Positioned(
                    top: 2, right: 10,
                    child: GestureDetector(
                      onTap: () => _removeImage(i),
                      child: Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                        child: const Icon(Icons.close, color: Colors.white, size: 14),
                      ),
                    ),
                  ),
                ],
              )),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildTypeSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Hình thức *', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        Row(children: [
          _TypeChip(label: 'Bán', value: 'sell', selected: _listingType == 'sell', onTap: () => setState(() => _listingType = 'sell')),
          const SizedBox(width: 8),
          _TypeChip(label: 'Tặng miễn phí', value: 'give', selected: _listingType == 'give', onTap: () => setState(() => _listingType = 'give')),
        ]),
      ],
    );
  }

  Widget _buildCategoryDropdown() {
    return DropdownButtonFormField<String>(
      value: _itemCategory,
      decoration: const InputDecoration(labelText: 'Danh mục *', border: OutlineInputBorder()),
      items: AppCategories.list.map((c) => DropdownMenuItem(value: c['value'], child: Text(c['label']!))).toList(),
      onChanged: (v) => setState(() => _itemCategory = v!),
    );
  }

  Widget _buildLocationTile() {
    return GestureDetector(
      onTap: () async {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const MapPickerScreen()),
        );
        if (result != null && result is Map) {
          setState(() {
            final latlng = result['latlng'];
            if (latlng != null) {
              _lat = latlng.latitude;
              _lng = latlng.longitude;
            }
            _selectedAddress = result['address'] ?? '';
            _selectedProvince = result['province'] ?? '';
            _selectedDistrict = result['district'] ?? '';
            _selectedWard = result['ward'] ?? '';
          });
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: _lat != null ? AppTheme.primary.withOpacity(0.05) : AppTheme.warning.withOpacity(0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: _lat != null ? AppTheme.primary.withOpacity(0.3) : AppTheme.warning.withOpacity(0.3)),
        ),
        child: Row(children: [
          Icon(Icons.location_on_outlined, color: _lat != null ? AppTheme.primary : AppTheme.warning),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              _lat != null ? 'Đã chọn vị trí' : 'Chọn vị trí *',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: _lat != null ? AppTheme.primary : AppTheme.warning,
              ),
            ),
            if (_lat != null) ...[
              Text(
                [
                  if (_selectedAddress.isNotEmpty) _selectedAddress,
                  if (_selectedWard.isNotEmpty) _selectedWard,
                  if (_selectedDistrict.isNotEmpty) _selectedDistrict,
                  if (_selectedProvince.isNotEmpty) _selectedProvince,
                ].join(', '),
                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ])),
          Icon(Icons.chevron_right, color: AppTheme.textSecondary),
        ]),
      ),
    );
  }
}

class _TypeChip extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _TypeChip({required this.label, required this.value, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primary : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: selected ? AppTheme.primary : AppTheme.border),
        ),
        child: Text(label, style: TextStyle(
          color: selected ? Colors.white : AppTheme.textSecondary,
          fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
        )),
      ),
    );
  }
}

