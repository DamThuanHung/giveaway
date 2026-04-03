import 'package:flutter/material.dart';

class FavoritesTab extends StatelessWidget {
  const FavoritesTab({super.key}); // Đã xóa favoritePosts cũ

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Yêu thích")),
      body: const Center(child: Text("Danh sách yêu thích trống")),
    );
  }
}