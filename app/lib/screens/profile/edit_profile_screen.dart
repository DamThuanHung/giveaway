import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  bool _isLoading = false;
  File? _pickedImage;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();
    _nameCtrl = TextEditingController(text: auth.userName ?? '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(
      source: ImageSource.gallery,
      imageQuality: 80,
      maxWidth: 512,
    );
    if (picked != null) setState(() => _pickedImage = File(picked.path));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    if (auth.userId == null) return;

    setState(() => _isLoading = true);

    // Upload avatar nếu có chọn ảnh mới
    if (_pickedImage != null) {
      final avatarUrl = await ApiService.uploadAvatar(_pickedImage!.path);
      if (avatarUrl != null && mounted) {
        auth.updateAvatar(avatarUrl);
      }
    }

    // Cập nhật tên
    final ok = await ApiService.updateUser(auth.userId!, {'name': _nameCtrl.text.trim()});
    if (!mounted) return;
    setState(() => _isLoading = false);

    if (ok) {
      auth.updateName(_nameCtrl.text.trim());
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Đã cập nhật hồ sơ'),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Cập nhật thất bại'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final currentAvatar = auth.userAvatar ?? '';

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Chỉnh sửa hồ sơ')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Avatar
              GestureDetector(
                onTap: _pickImage,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 52,
                      backgroundColor: AppTheme.primaryLight,
                      backgroundImage: _pickedImage != null
                          ? FileImage(_pickedImage!)
                          : (currentAvatar.isNotEmpty ? NetworkImage(currentAvatar) : null) as ImageProvider?,
                      child: (_pickedImage == null && currentAvatar.isEmpty)
                          ? const Icon(Icons.person, size: 52, color: AppTheme.primary)
                          : null,
                    ),
                    Positioned(
                      bottom: 0, right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: AppTheme.primary,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.camera_alt, size: 16, color: Colors.white),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              const Text('Nhấn để đổi ảnh', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              const SizedBox(height: 28),

              // Tên
              TextFormField(
                controller: _nameCtrl,
                textInputAction: TextInputAction.done,
                decoration: const InputDecoration(
                  labelText: 'Họ và tên',
                  prefixIcon: Icon(Icons.person_outlined),
                ),
                validator: (v) => v == null || v.isEmpty ? 'Vui lòng nhập tên' : null,
              ),
              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _save,
                  child: _isLoading
                      ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Lưu thay đổi'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
