import 'package:flutter/material.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key}); // Đã xóa onOpenCreatePost cũ

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Cá nhân")),
      body: const Center(child: Text("Thông tin cá nhân")),
    );
  }
}