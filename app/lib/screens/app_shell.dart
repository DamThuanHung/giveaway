import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'home_tab.dart';
import 'messages_tab.dart';
import 'favorites_tab.dart';
import 'profile_tab.dart';
import 'post/create_post_tab.dart';
import '../providers/post_provider.dart'; // SỬA TẠI ĐÂY: Thêm ../ để đúng đường dẫn

class AppShell extends StatefulWidget {
  const AppShell({super.key});
  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  int _selectedIndex = 0;

  // 1. CHỈ GIỮ 4 TAB NỘI DUNG, TAB GIỮA ĐỂ TRỐNG
  final List<Widget> _pages = const [
    HomeTab(),
    FavoritesTab(),
    SizedBox(), // Index 2: Chỗ trống để xử lý Navigator.push
    MessagesTab(),
    ProfileTab()
  ];

  // 2. HÀM XỬ LÝ ĐIỀU HƯỚNG VÀ REFRESH
  void _onItemTapped(int index) async {
    // NẾU NHẤN VÀO TAB ĐĂNG TIN (INDEX 2)
    if (index == 2) {
      final result = await Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const CreatePostTab()),
      );

      // NẾU ĐĂNG THÀNH CÔNG (NHẬN TRUE TỪ POP)
      if (result == true) {
        if (!mounted) return;

        // GỌI PROVIDER ĐỂ LOAD LẠI TIN Ở TRANG CHỦ
        context.read<PostProvider>().fetchPosts();

        // CHUYỂN VỀ TAB TRANG CHỦ ĐỂ USER THẤY TIN MỚI
        setState(() => _selectedIndex = 0);
      }
    } else {
      setState(() => _selectedIndex = index);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _selectedIndex, children: _pages),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _selectedIndex,
        selectedItemColor: const Color(0xFF2563EB),
        unselectedItemColor: Colors.grey,
        onTap: _onItemTapped, // DÙNG HÀM XỬ LÝ RIÊNG
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined), label: 'Trang chủ'),
          BottomNavigationBarItem(icon: Icon(Icons.favorite_border), label: 'Yêu thích'),
          BottomNavigationBarItem(icon: Icon(Icons.add_circle_outline), label: 'Đăng tin'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: 'Tin nhắn'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: 'Cá nhân'),
        ],
      ),
    );
  }
}