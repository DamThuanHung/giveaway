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

  // BĐS & Dịch vụ
  String _subType = 'rent';          // rent | sell (BĐS)
  final _areaController = TextEditingController();
  int _bedrooms = 1;
  String _priceUnit = 'month';       // month | total | sqm | hour | day
  final _serviceAreaController = TextEditingController();

  bool get _isRealestate => _itemCategory == 'realestate';
  bool get _isService => _itemCategory == 'service';
  bool get _isJob => _itemCategory == 'jobs';
  String get _postType {
    if (_isRealestate) return 'realestate';
    if (_isService) return 'service';
    if (_isJob) return 'job';
    return 'item';
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _areaController.dispose();
    _serviceAreaController.dispose();
    super.dispose();
  }

  bool get _hasUnsavedData =>
      _titleController.text.isNotEmpty ||
      _descController.text.isNotEmpty ||
      _priceController.text.isNotEmpty ||
      _areaController.text.isNotEmpty ||
      _serviceAreaController.text.isNotEmpty ||
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
    if (_selectedImages.length >= 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Bạn đã chọn đủ 10 ảnh rồi nhé'),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    final remaining = 10 - _selectedImages.length;
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
          content: Text('Bạn chỉ có thể thêm $remaining ảnh nữa (tối đa 10 ảnh mỗi bài)'),
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
      'listingType': _isRealestate ? (_subType == 'rent' ? 'sell' : 'sell') : _listingType,
      'itemCategory': _itemCategory,
      'postType': _postType,
      'province': _selectedProvince,
      'district': _selectedDistrict,
      'ward': _selectedWard,
      'addressDetail': _selectedAddress,
      if (_lat != null) 'latitude': _lat.toString(),
      if (_lng != null) 'longitude': _lng.toString(),
      if (_isRealestate) 'subType': _subType,
      if (_isRealestate && _areaController.text.isNotEmpty) 'area': _areaController.text.trim(),
      if (_isRealestate) 'bedrooms': _bedrooms.toString(),
      if (_isRealestate || _isService || _isJob) 'priceUnit': _priceUnit,
      if (_isService && _serviceAreaController.text.isNotEmpty) 'serviceArea': _serviceAreaController.text.trim(),
      if (_isJob) 'subType': _subType,
      if (_isJob && _serviceAreaController.text.isNotEmpty) 'serviceArea': _serviceAreaController.text.trim(),
    };

    try {
      final errMsg = await ApiService.createPost(postData, _selectedImages);
      if (!mounted) return;
      if (errMsg == null) {
        _titleController.clear();
        _descController.clear();
        _priceController.clear();
        _areaController.clear();
        _serviceAreaController.clear();
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
          _subType = _itemCategory == 'jobs' ? 'full-time' : 'rent';
          _bedrooms = 1;
          _priceUnit = 'month';
        });
        if (mounted) Navigator.pop(context, true);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(errMsg ?? 'Đăng tin thất bại. Vui lòng thử lại.'),
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
                    _buildCategoryDropdown(),
                    const SizedBox(height: 16),
                    if (!_isRealestate && !_isService && !_isJob) ...[
                      _buildTypeSelector(),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _titleController,
                      decoration: InputDecoration(
                        labelText: 'Tiêu đề *',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
                      ),
                      textInputAction: TextInputAction.next,
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Vui lòng nhập tiêu đề';
                        if (v.trim().length < 5) return 'Tiêu đề quá ngắn (tối thiểu 5 ký tự)';
                        return null;
                      },
                      maxLength: 100,
                    ),
                    const SizedBox(height: 16),
                    if (!_isRealestate && !_isService && !_isJob && _listingType != 'give') ...[
                      TextFormField(
                        controller: _priceController,
                        decoration: InputDecoration(
                          labelText: 'Giá (VNĐ)',
                          hintText: 'Để trống nếu muốn thương lượng',
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
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
                      const SizedBox(height: 16),
                    ],
                    // --- BĐS fields ---
                    if (_isRealestate) ...[
                      _buildRealestateFields(),
                      const SizedBox(height: 16),
                    ],
                    // --- Dịch vụ fields ---
                    if (_isService) ...[
                      _buildServiceFields(),
                      const SizedBox(height: 16),
                    ],
                    // --- Việc làm fields ---
                    if (_isJob) ...[
                      _buildJobFields(),
                      const SizedBox(height: 16),
                    ],
                    TextFormField(
                      controller: _descController,
                      decoration: InputDecoration(
                        labelText: 'Mô tả chi tiết',
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
                        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
                      ),
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
                        child: const Text('Đăng tin', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
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

  Widget _buildRealestateFields() {
    final inputDeco = InputDecoration(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Loại BĐS: Cho thuê / Bán
        const Text('Loại tin *', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        Row(children: [
          _TypeChip(label: 'Cho thuê', value: 'rent', selected: _subType == 'rent', onTap: () => setState(() { _subType = 'rent'; _priceUnit = 'month'; })),
          const SizedBox(width: 8),
          _TypeChip(label: 'Bán', value: 'sell', selected: _subType == 'sell', onTap: () => setState(() { _subType = 'sell'; _priceUnit = 'total'; })),
        ]),
        const SizedBox(height: 16),

        // Giá + Đơn vị
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            flex: 3,
            child: TextFormField(
              controller: _priceController,
              decoration: inputDeco.copyWith(labelText: 'Giá (VNĐ)', hintText: 'Để trống = thương lượng'),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(12)],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: DropdownButtonFormField<String>(
              value: _priceUnit,
              decoration: inputDeco.copyWith(labelText: 'Đơn vị'),
              items: _subType == 'rent'
                  ? const [
                      DropdownMenuItem(value: 'month', child: Text('/tháng')),
                      DropdownMenuItem(value: 'day', child: Text('/ngày')),
                    ]
                  : const [
                      DropdownMenuItem(value: 'total', child: Text('Tổng')),
                      DropdownMenuItem(value: 'sqm', child: Text('/m²')),
                    ],
              onChanged: (v) => setState(() => _priceUnit = v!),
            ),
          ),
        ]),
        const SizedBox(height: 16),

        // Diện tích + Phòng ngủ
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: TextFormField(
              controller: _areaController,
              decoration: inputDeco.copyWith(labelText: 'Diện tích (m²)', hintText: 'VD: 45'),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[\d.]'))],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: DropdownButtonFormField<int>(
              value: _bedrooms,
              decoration: inputDeco.copyWith(labelText: 'Phòng ngủ'),
              items: [0, 1, 2, 3, 4, 5].map((n) => DropdownMenuItem(
                value: n,
                child: Text(n == 0 ? 'Studio' : '$n phòng'),
              )).toList(),
              onChanged: (v) => setState(() => _bedrooms = v!),
            ),
          ),
        ]),
      ],
    );
  }

  Widget _buildServiceFields() {
    final inputDeco = InputDecoration(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Giá + Đơn vị
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            flex: 3,
            child: TextFormField(
              controller: _priceController,
              decoration: inputDeco.copyWith(labelText: 'Giá (VNĐ)', hintText: 'Để trống = thương lượng'),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(12)],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: DropdownButtonFormField<String>(
              value: _priceUnit == 'month' || _priceUnit == 'total' || _priceUnit == 'sqm' ? 'hour' : _priceUnit,
              decoration: inputDeco.copyWith(labelText: 'Đơn vị'),
              items: const [
                DropdownMenuItem(value: 'hour', child: Text('/giờ')),
                DropdownMenuItem(value: 'day', child: Text('/ngày')),
                DropdownMenuItem(value: 'total', child: Text('Trọn gói')),
              ],
              onChanged: (v) => setState(() => _priceUnit = v!),
            ),
          ),
        ]),
        const SizedBox(height: 16),

        // Phạm vi phục vụ
        TextFormField(
          controller: _serviceAreaController,
          decoration: inputDeco.copyWith(
            labelText: 'Phạm vi phục vụ',
            hintText: 'VD: Quận 1, Quận 3, TP.HCM',
            prefixIcon: const Icon(Icons.place_outlined),
          ),
          textInputAction: TextInputAction.next,
          maxLength: 100,
        ),
      ],
    );
  }

  Widget _buildJobFields() {
    final inputDeco = InputDecoration(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.primary, width: 1.5)),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Loại công việc
        const Text('Hình thức làm việc *', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8, runSpacing: 8,
          children: [
            _TypeChip(label: 'Toàn thời gian', value: 'full-time', selected: _subType == 'full-time', onTap: () => setState(() => _subType = 'full-time')),
            _TypeChip(label: 'Bán thời gian',  value: 'part-time', selected: _subType == 'part-time', onTap: () => setState(() => _subType = 'part-time')),
            _TypeChip(label: 'Freelance',       value: 'freelance', selected: _subType == 'freelance', onTap: () => setState(() => _subType = 'freelance')),
            _TypeChip(label: 'Thực tập',        value: 'intern',    selected: _subType == 'intern',    onTap: () => setState(() => _subType = 'intern')),
            _TypeChip(label: 'Remote',          value: 'remote',    selected: _subType == 'remote',    onTap: () => setState(() => _subType = 'remote')),
          ],
        ),
        const SizedBox(height: 16),

        // Tên công ty
        TextFormField(
          controller: _serviceAreaController,
          decoration: inputDeco.copyWith(
            labelText: 'Tên công ty / Nhà tuyển dụng',
            hintText: 'VD: Công ty ABC',
            prefixIcon: const Icon(Icons.business_outlined),
          ),
          textInputAction: TextInputAction.next,
          maxLength: 100,
        ),
        const SizedBox(height: 8),

        // Mức lương + đơn vị
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            flex: 3,
            child: TextFormField(
              controller: _priceController,
              decoration: inputDeco.copyWith(
                labelText: 'Mức lương (VNĐ)',
                hintText: 'Để trống = thỏa thuận',
                prefixIcon: const Icon(Icons.payments_outlined),
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(12)],
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            flex: 2,
            child: DropdownButtonFormField<String>(
              value: (_priceUnit == 'month' || _priceUnit == 'hour') ? _priceUnit : 'month',
              decoration: inputDeco.copyWith(labelText: 'Đơn vị'),
              items: const [
                DropdownMenuItem(value: 'month', child: Text('/tháng')),
                DropdownMenuItem(value: 'hour',  child: Text('/giờ')),
              ],
              onChanged: (v) => setState(() => _priceUnit = v!),
            ),
          ),
        ]),
      ],
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
              if (_selectedImages.length < 10)
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
                        'còn ${10 - _selectedImages.length} chỗ',
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
                    top: 0, right: 6,
                    child: GestureDetector(
                      onTap: () => _removeImage(i),
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                          child: const Icon(Icons.close, color: Colors.white, size: 14),
                        ),
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
      decoration: InputDecoration(
        labelText: 'Danh mục *',
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 1.5)),
      ),
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
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
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
      ),
    );
  }
}

