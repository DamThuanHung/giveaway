import 'package:flutter/material.dart';
import '../services/api_service.dart'; // Đảm bảo import để lấy baseUrl

class PostCard extends StatelessWidget {
  final dynamic post;

  const PostCard({Key? key, required this.post}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // TẠO ĐƯỜNG DẪN ẢNH CHUẨN
    // Lấy ảnh đầu tiên trong mảng images, nếu không có thì để trống
    String imageName = (post['images'] != null && post['images'].length > 0)
        ? post['images'][0]
        : "";

    // Nối với IP máy tính của anh (192.168.0.108)
    String imageUrl = "${ApiService.baseUrl}/uploads/$imageName";

    return Card(
      margin: const EdgeInsets.all(8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // PHẦN HIỂN THỊ ẢNH
          AspectRatio(
            aspectRatio: 16 / 9,
            child: imageName.isNotEmpty
                ? Image.network(
              imageUrl,
              fit: BoxFit.cover,
              // Xử lý khi đang tải ảnh
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return const Center(child: CircularProgressIndicator());
              },
              // Xử lý khi ảnh lỗi (Quan trọng nhất)
              errorBuilder: (context, error, stackTrace) {
                print("❌ Lỗi tải ảnh tại: $imageUrl");
                return Container(
                  color: Colors.grey[200],
                  child: const Icon(Icons.broken_image, size: 50, color: Colors.grey),
                );
              },
            )
                : const Icon(Icons.image, size: 50),
          ),
          Padding(
            padding: const EdgeInsets.all(8.0),
            child: Text(
              post['title'] ?? 'Không có tiêu đề',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}