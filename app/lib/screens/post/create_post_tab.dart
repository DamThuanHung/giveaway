import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'map_picker_screen.dart';
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
  String _itemCategory = 'appliances';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    if (_selectedImages.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tối đa 5 ảnh')),
      );
      return;
    }
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 75,
    );
    if (picked != null) {
      setState(() {
        _selectedImages.add(picked);
        _imageByteFutures.add(picked.readAsBytes());
      });
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
        const SnackBar(content: Text('Vui lòng chọn ít nhất 1 ảnh')),
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
      'province': _selectedProvince.isNotEmpty ? _selectedProvince : 'Toàn quốc',
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
          _listingType = 'sell';
          _itemCategory = 'appliances';
        });
        if (mounted) Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Đăng tin thất bại, thử lại'),
          backgroundColor: AppTheme.error,
          behavior: SnackBarBehavior.floating,
        ));
      }
    } catch (e) {
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
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Đăng tin mới'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => Navigator.pop(context),
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
                    _buildCategoryDropdown(),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(labelText: 'Tiêu đề *', border: OutlineInputBorder()),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Nhập tiêu đề' : null,
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
                      ),
                    if (_listingType != 'give') const SizedBox(height: 16),
                    TextFormField(
                      controller: _descController,
                      decoration: const InputDecoration(labelText: 'Mô tả chi tiết', border: OutlineInputBorder()),
                      maxLines: 4,
                      maxLength: 1000,
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
              // Nút thêm ảnh
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
                    Icon(Icons.add_photo_alternate_outlined, color: AppTheme.primary, size: 28),
                    const SizedBox(height: 4),
                    Text('${_selectedImages.length}/5',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
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
          _TypeChip(label: 'Cho tặng', value: 'give', selected: _listingType == 'give', onTap: () => setState(() => _listingType = 'give')),
        ]),
      ],
    );
  }

  Widget _buildCategoryDropdown() {
    const categories = {
      'appliances': 'Gia dụng',
      'electronics': 'Điện tử',
      'clothing': 'Thời trang',
      'furniture': 'Nội thất',
      'vehicle': 'Xe cộ',
      'book': 'Sách & Tài liệu',
      'toy': 'Đồ chơi & Trẻ em',
      'other': 'Khác',
    };
    return DropdownButtonFormField<String>(
      value: _itemCategory,
      decoration: const InputDecoration(labelText: 'Danh mục *', border: OutlineInputBorder()),
      items: categories.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
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
          color: _lat != null ? AppTheme.primary.withOpacity(0.05) : Colors.orange.withOpacity(0.05),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: _lat != null ? AppTheme.primary.withOpacity(0.3) : Colors.orange.withOpacity(0.3)),
        ),
        child: Row(children: [
          Icon(Icons.location_on_outlined, color: _lat != null ? AppTheme.primary : Colors.orange),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              _lat != null ? 'Đã chọn vị trí' : 'Chọn vị trí (tuỳ chọn)',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: _lat != null ? AppTheme.primary : Colors.orange,
              ),
            ),
            if (_selectedAddress.isNotEmpty)
              Text(_selectedAddress, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary), maxLines: 1, overflow: TextOverflow.ellipsis),
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

