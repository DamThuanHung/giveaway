import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';

// Widget xương cơ bản — hình chữ nhật mờ nhấp nháy
class SkeletonBox extends StatelessWidget {
  final double width;
  final double height;
  final double radius;

  const SkeletonBox({
    super.key,
    this.width = double.infinity,
    this.height = 16,
    this.radius = 6,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE5E7EB),
      highlightColor: const Color(0xFFF9FAFB),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(radius),
        ),
      ),
    );
  }
}

// Skeleton card bài đăng (dùng trong grid trang chủ)
class PostCardSkeleton extends StatelessWidget {
  const PostCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Ảnh
          const SkeletonBox(height: 140, radius: 0),
          Padding(
            padding: const EdgeInsets.all(8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SkeletonBox(height: 14),
                const SizedBox(height: 6),
                const SkeletonBox(width: 80, height: 14),
                const SizedBox(height: 8),
                const SkeletonBox(height: 18, width: 100),
                const SizedBox(height: 6),
                const SkeletonBox(height: 11, width: 120),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Grid skeleton cho trang chủ (6 card)
class PostGridSkeleton extends StatelessWidget {
  const PostGridSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(10),
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 0.72,
      ),
      itemCount: 6,
      itemBuilder: (_, __) => const PostCardSkeleton(),
    );
  }
}

// Skeleton dòng kết quả tìm kiếm (list item ngang)
class SearchResultSkeleton extends StatelessWidget {
  const SearchResultSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE5E7EB),
      highlightColor: const Color(0xFFF9FAFB),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          Container(width: 72, height: 72, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(height: 14, color: Colors.white),
            const SizedBox(height: 6),
            Container(height: 14, width: 120, color: Colors.white),
            const SizedBox(height: 8),
            Container(height: 18, width: 80, color: Colors.white),
            const SizedBox(height: 6),
            Container(height: 12, width: 100, color: Colors.white),
          ])),
        ]),
      ),
    );
  }
}

class SearchListSkeleton extends StatelessWidget {
  const SearchListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 6,
      itemBuilder: (_, __) => const SearchResultSkeleton(),
    );
  }
}

// Skeleton dòng chat
class ChatRoomSkeleton extends StatelessWidget {
  const ChatRoomSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: const Color(0xFFE5E7EB),
      highlightColor: const Color(0xFFF9FAFB),
      child: ListTile(
        leading: const CircleAvatar(backgroundColor: Colors.white, radius: 26),
        title: Container(height: 14, color: Colors.white, margin: const EdgeInsets.only(right: 80)),
        subtitle: Container(height: 12, color: Colors.white, margin: const EdgeInsets.only(right: 40, top: 6)),
      ),
    );
  }
}
