import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_theme.dart';

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
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
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
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
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
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
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

// Skeleton item yêu thích (ngang: ảnh + thông tin)
class FavoriteItemSkeleton extends StatelessWidget {
  const FavoriteItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(children: [
          Container(width: 90, height: 90, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10))),
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
          const SizedBox(width: 8),
          Container(width: 36, height: 36, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
        ]),
      ),
    );
  }
}

// Skeleton tin nhắn chat (bong bóng xen kẽ trái/phải)
class ChatMessagesSkeleton extends StatelessWidget {
  const ChatMessagesSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      reverse: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 8,
      itemBuilder: (_, i) => _ChatBubbleSkeleton(isMe: i % 3 != 0),
    );
  }
}

class _ChatBubbleSkeleton extends StatelessWidget {
  final bool isMe;
  const _ChatBubbleSkeleton({required this.isMe});

  @override
  Widget build(BuildContext context) {
    final widths = [140.0, 200.0, 100.0, 180.0, 120.0];
    final w = widths[isMe ? 1 : 0 % widths.length];
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
      child: Align(
        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
        child: Container(
          width: w + (isMe ? 20 : 0),
          height: 38,
          margin: const EdgeInsets.only(bottom: 10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
  }
}

// Skeleton trang cá nhân người dùng
class UserProfileSkeleton extends StatelessWidget {
  const UserProfileSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      physics: const NeverScrollableScrollPhysics(),
      child: Column(children: [
        // Header
        Shimmer.fromColors(
          baseColor: AppTheme.border,
          highlightColor: AppTheme.background,
          child: Container(
            height: 200,
            color: Colors.white,
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const CircleAvatar(radius: 36, backgroundColor: Colors.white),
              const SizedBox(height: 10),
              Container(height: 16, width: 120, color: Colors.white),
              const SizedBox(height: 6),
              Container(height: 12, width: 160, color: Colors.white),
            ]),
          ),
        ),
        // Stats row
        Shimmer.fromColors(
          baseColor: AppTheme.border,
          highlightColor: AppTheme.background,
          child: Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(children: List.generate(4, (i) => Expanded(
              child: Column(children: [
                Container(height: 22, width: 40, color: Colors.white),
                const SizedBox(height: 4),
                Container(height: 12, width: 60, color: Colors.white),
              ]),
            ))),
          ),
        ),
        const SizedBox(height: 8),
        // Grid
        GridView.builder(
          padding: const EdgeInsets.all(10),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2, crossAxisSpacing: 10, mainAxisSpacing: 10, childAspectRatio: 0.80,
          ),
          itemCount: 4,
          itemBuilder: (_, __) => const PostCardSkeleton(),
        ),
      ]),
    );
  }
}

// Skeleton dòng chat
class ChatRoomSkeleton extends StatelessWidget {
  const ChatRoomSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
      child: ListTile(
        leading: const CircleAvatar(backgroundColor: Colors.white, radius: 26),
        title: Container(height: 14, color: Colors.white, margin: const EdgeInsets.only(right: 80)),
        subtitle: Container(height: 12, color: Colors.white, margin: const EdgeInsets.only(right: 40, top: 6)),
      ),
    );
  }
}

// Skeleton dòng thông báo
class NotificationItemSkeleton extends StatelessWidget {
  const NotificationItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(children: [
          Container(width: 48, height: 48, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(height: 13, color: Colors.white),
            const SizedBox(height: 6),
            Container(height: 13, width: 200, color: Colors.white),
            const SizedBox(height: 5),
            Container(height: 11, width: 80, color: Colors.white),
          ])),
        ]),
      ),
    );
  }
}

class NotificationListSkeleton extends StatelessWidget {
  const NotificationListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 8,
      separatorBuilder: (_, __) => const Divider(height: 1, indent: 76),
      itemBuilder: (_, __) => const NotificationItemSkeleton(),
    );
  }
}

// Skeleton dòng deal
class DealItemSkeleton extends StatelessWidget {
  const DealItemSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
        child: Row(children: [
          Container(width: 64, height: 64, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(8))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(height: 13, color: AppTheme.border),
            const SizedBox(height: 6),
            Container(height: 13, width: 150, color: AppTheme.border),
            const SizedBox(height: 8),
            Container(height: 24, width: 80, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(12))),
          ])),
        ]),
      ),
    );
  }
}

class DealListSkeleton extends StatelessWidget {
  const DealListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 6,
      itemBuilder: (_, __) => const DealItemSkeleton(),
    );
  }
}

class AdminCardSkeleton extends StatelessWidget {
  const AdminCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.border,
      highlightColor: AppTheme.background,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Container(height: 13, color: AppTheme.border)),
            const SizedBox(width: 40),
            Container(width: 52, height: 20, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(6))),
          ]),
          const SizedBox(height: 8),
          Container(height: 11, width: 200, color: AppTheme.border),
          const SizedBox(height: 10),
          Row(children: [
            Container(width: 70, height: 28, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(6))),
            const SizedBox(width: 8),
            Container(width: 70, height: 28, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(6))),
          ]),
        ]),
      ),
    );
  }
}

class AdminListSkeleton extends StatelessWidget {
  const AdminListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 6,
      itemBuilder: (_, __) => const AdminCardSkeleton(),
    );
  }
}
