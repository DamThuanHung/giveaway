import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class BlockedUsersScreen extends StatefulWidget {
  const BlockedUsersScreen({super.key});

  @override
  State<BlockedUsersScreen> createState() => _BlockedUsersScreenState();
}

class _BlockedUsersScreenState extends State<BlockedUsersScreen> {
  List<dynamic> _blocked = [];
  bool _isLoading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _isLoading = true; _error = false; });
    try {
      final res = await ApiService.getBlockedUsers();
      if (!mounted) return;
      setState(() { _blocked = res; _isLoading = false; });
    } catch (e) {
      debugPrint('❌ BlockedUsersScreen._load error: $e');
      if (mounted) setState(() { _isLoading = false; _error = true; });
    }
  }

  Future<void> _unblock(String userId, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Bỏ chặn'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Bài đăng của $name sẽ hiển thị lại với bạn.'),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: OutlinedButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Hủy'),
            )),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Bỏ chặn'),
            )),
          ],
        ),
      ),
    );
    if (confirm != true) return;

    final ok = await ApiService.unblockUser(userId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? 'Đã bỏ chặn $name' : 'Có lỗi xảy ra'),
      backgroundColor: ok ? AppTheme.success : AppTheme.error,
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ));
    if (ok) setState(() => _blocked.removeWhere((b) => b['blocked']?['id']?.toString() == userId));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(title: const Text('Danh sách đã chặn')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : _error
              ? RefreshIndicator(
                  onRefresh: _load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.wifi_off, size: 48, color: AppTheme.textSecondary),
                        const SizedBox(height: 12),
                        const Text('Không tải được danh sách', style: TextStyle(color: AppTheme.textSecondary)),
                        const SizedBox(height: 16),
                        OutlinedButton(onPressed: _load, child: const Text('Thử lại')),
                      ]),
                    )),
                  )),
                )
          : _blocked.isEmpty
              ? RefreshIndicator(
                  onRefresh: _load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: const Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.block, size: 64, color: AppTheme.border),
                        SizedBox(height: 12),
                        Text('Bạn chưa chặn ai', style: TextStyle(color: AppTheme.textSecondary)),
                      ]),
                    )),
                  )),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: _blocked.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      final user = _blocked[i]['blocked'] as Map<String, dynamic>? ?? {};
                      final name = user['name']?.toString() ?? 'Người dùng';
                      final userId = user['id']?.toString() ?? '';
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Row(children: [
                          CircleAvatar(
                            radius: 20,
                            backgroundColor: AppTheme.primary.withOpacity(0.1),
                            child: Text(
                              name[0].toUpperCase(),
                              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.w600))),
                          TextButton(
                            onPressed: () => _unblock(userId, name),
                            child: const Text('Bỏ chặn', style: TextStyle(color: AppTheme.primary)),
                          ),
                        ]),
                      );
                    },
                  ),
                ),
    );
  }
}
