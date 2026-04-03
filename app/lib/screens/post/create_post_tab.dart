import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:image_picker/image_picker.dart';

// ĐƯỜNG DẪN CHUẨN THEO CẤU TRÚC FOLDER CỦA ANH HÙNG
import 'map_picker_screen.dart';
import '../../services/api_service.dart';

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

  // BIẾN LƯU TRỮ ĐỊA CHỈ THẬT
  LatLng? _selectedPosition;
  String _selectedAddress = "";
  String _selectedProvince = "";
  String _selectedDistrict = "";
  String _selectedWard = "";

  bool _isSubmitting = false;

  // 1. HÀM CHỌN ẢNH
  void _showPickerOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Chọn từ Thư viện'),
              onTap: () async {
                Navigator.pop(context);
                final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 50);
                if (picked != null) setState(() => _selectedImages.add(picked));
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Chụp ảnh mới'),
              onTap: () async {
                Navigator.pop(context);
                final picked = await ImagePicker().pickImage(source: ImageSource.camera, imageQuality: 50);
                if (picked != null) setState(() => _selectedImages.add(picked));
              },
            ),
          ],
        ),
      ),
    );
  }

  // 2. HÀM XỬ LÝ ĐĂNG TIN (TỐI ƯU 2.6)
  Future<void> _handlePost() async {
    if (!_formKey.currentState!.validate() || _selectedImages.isEmpty || _selectedPosition == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Vui lòng điền đủ thông tin, ảnh và ghim vị trí!"))
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final postData = {
      "title": _titleController.text.trim(),
      "description": _descController.text.trim(),
      "price": int.tryParse(_priceController.text) ?? 0,
      "latitude": _selectedPosition!.latitude,
      "longitude": _selectedPosition!.longitude,
      "itemCategory": "appliances",
      "province": _selectedProvince.isNotEmpty ? _selectedProvince : "Tỉnh/Thành",
      "district": _selectedDistrict.isNotEmpty ? _selectedDistrict : "Quận/Huyện",
      "ward": _selectedWard.isNotEmpty ? _selectedWard : "Phường/Xã",
      "addressDetail": _selectedAddress,
    };

    try {
      bool success = await ApiService.createPost(postData, _selectedImages);

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text("🎉 Đăng tin thành công!"),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            )
        );

        _titleController.clear(); _descController.clear(); _priceController.clear();
        setState(() {
          _selectedImages = [];
          _selectedPosition = null;
          _selectedAddress = "";
        });

        await Future.delayed(const Duration(milliseconds: 500));

        if (mounted) {
          Navigator.pop(context, true);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("🆘 Lỗi kết nối Server"), backgroundColor: Colors.red)
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Đăng tin mới")),
      body: _isSubmitting
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              _buildImageArea(),
              const SizedBox(height: 20),
              TextFormField(controller: _titleController, decoration: const InputDecoration(labelText: "Tiêu đề *", border: OutlineInputBorder()), validator: (v) => v!.isEmpty ? "Vui lòng nhập tiêu đề" : null),
              const SizedBox(height: 15),
              TextFormField(controller: _priceController, decoration: const InputDecoration(labelText: "Giá (VNĐ)", border: OutlineInputBorder()), keyboardType: TextInputType.number),
              const SizedBox(height: 15),
              TextFormField(controller: _descController, decoration: const InputDecoration(labelText: "Mô tả", border: OutlineInputBorder()), maxLines: 3),
              const SizedBox(height: 20),
              _buildLocationTile(),
              const SizedBox(height: 30),
              _buildSubmitButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageArea() {
    return Wrap(spacing: 10, children: [
      GestureDetector(
        onTap: _showPickerOptions,
        child: Container(width: 80, height: 80, decoration: BoxDecoration(color: Colors.grey[200], borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.add_a_photo)),
      ),
      ..._selectedImages.map((img) => ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.file(File(img.path), width: 80, height: 80, fit: BoxFit.cover))),
    ]);
  }

  Widget _buildLocationTile() {
    return ListTile(
      tileColor: Colors.orange[50],
      leading: const Icon(Icons.location_on, color: Colors.orange),
      title: Text(_selectedPosition == null ? "Bấm chọn vị trí" : "Vị trí đã ghim"),
      subtitle: _selectedAddress.isNotEmpty ? Text(_selectedAddress, maxLines: 1, overflow: TextOverflow.ellipsis) : null,
      onTap: () async {
        final result = await Navigator.push(context, MaterialPageRoute(builder: (c) => const MapPickerScreen()));

        if (result != null && result is Map) {
          setState(() {
            _selectedPosition = result['latlng'];
            _selectedAddress = result['address'] ?? "";
            _selectedProvince = result['province'] ?? "";
            _selectedDistrict = result['district'] ?? "";
            _selectedWard = result['ward'] ?? "";
          });
        }
      },
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(width: double.infinity, height: 50, child: ElevatedButton(style: ElevatedButton.styleFrom(backgroundColor: Colors.orange), onPressed: _handlePost, child: const Text("XÁC NHẬN ĐĂNG TIN", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))));
  }
}
