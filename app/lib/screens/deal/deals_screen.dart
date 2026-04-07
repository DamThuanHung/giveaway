import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';

class DealsScreen extends StatefulWidget {
  const DealsScreen({super.key});

  @override
  State<DealsScreen> createState() => _DealsScreenState();
}

class _DealsScreenState extends State<DealsScreen> with SingleTickerProviderStateMixin {
  late TabController _tab;
  List<dynamic> _incoming = [];
  List<dynamic> _outgoing = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tab = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tab.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final results = await Future.wait([
      ApiService.getIncomingDeals(),
      ApiService.getOutgoingDeals(),
    ]);
    if (!mounted) return;
    setState(() {
      _incoming = results[0];
      _outgoing = results[1];
      _loading = false;
    });
  }

  Future<void> _updateStatus(String dealId, String status) async {
    final ok = await ApiService.updateDealStatus(dealId, status);
    if (!mounted) return;
    if (ok) {
      _load();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_statusMessage(status)),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  String _statusMessage(String status) {
    switch (status) {
      case 'accepted': return 'Đã đồng ý yêu cầu';
      case 'rejected': return 'Đã từ chối yêu cầu';
      case 'completed': return 'Đã xác nhận giao xong!';
      case 'cancelled': return 'Đã huỷ yêu cầu';
      default: return 'Đã cập nhật';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Yêu cầu nhận đồ'),
        bottom: TabBar(
          controller: _tab,
          labelColor: AppTheme.primary,
          unselectedLabelColor: AppTheme.textSecondary,
          indicatorColor: AppTheme.primary,
          tabs: [
            Tab(text: 'Nhận được (${_incoming.length})'),
            Tab(text: 'Đã gửi (${_outgoing.length})'),
          ],
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primary))
          : TabBarView(
              controller: _tab,
              children: [
                _buildIncomingList(),
                _buildOutgoingList(),
              ],
            ),
    );
  }

  Widget _buildIncomingList() {
    if (_incoming.isEmpty) return _emptyState('Chưa có ai gửi yêu cầu');
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _incoming.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _IncomingCard(
          deal: _incoming[i],
          onAccept: () => _updateStatus(_incoming[i]['id'], 'accepted'),
          onReject: () => _updateStatus(_incoming[i]['id'], 'rejected'),
          onComplete: () => _updateStatus(_incoming[i]['id'], 'completed'),
        ),
      ),
    );
  }

  Widget _buildOutgoingList() {
    if (_outgoing.isEmpty) return _emptyState('Bạn chưa gửi yêu cầu nào');
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _outgoing.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _OutgoingCard(
          deal: _outgoing[i],
          onCancel: _outgoing[i]['status'] == 'pending'
              ? () => _updateStatus(_outgoing[i]['id'], 'cancelled')
              : null,
        ),
      ),
    );
  }

  Widget _emptyState(String msg) => Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
    const Icon(Icons.handshake_outlined, size: 64, color: AppTheme.border),
    const SizedBox(height: 12),
    Text(msg, style: const TextStyle(color: AppTheme.textSecondary)),
  ]));
}

class _IncomingCard extends StatelessWidget {
  final Map<String, dynamic> deal;
  final VoidCallback onAccept;
  final VoidCallback onReject;
  final VoidCallback onComplete;

  const _IncomingCard({required this.deal, required this.onAccept, required this.onReject, required this.onComplete});

  @override
  Widget build(BuildContext context) {
    final post = deal['post'] as Map<String, dynamic>? ?? {};
    final requester = deal['requester'] as Map<String, dynamic>? ?? {};
    final status = deal['status'] as String? ?? 'pending';
    final message = deal['message'] as String?;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _borderColor(status), width: 1.5),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.inventory_2_outlined, size: 16, color: AppTheme.textSecondary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(post['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
          _StatusChip(status: status),
        ]),
        const Divider(height: 16),
        Row(children: [
          CircleAvatar(
            radius: 16,
            backgroundColor: AppTheme.primary.withOpacity(0.1),
            child: Text(
              (requester['name'] ?? 'U')[0].toUpperCase(),
              style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 13),
            ),
          ),
          const SizedBox(width: 8),
          Text(requester['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w500)),
        ]),
        if (message != null && message.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppTheme.background, borderRadius: BorderRadius.circular(8)),
            child: Text('"$message"',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontStyle: FontStyle.italic)),
          ),
        ],
        if (status == 'pending') ...[
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(
              style: OutlinedButton.styleFrom(foregroundColor: AppTheme.error, side: const BorderSide(color: AppTheme.error)),
              onPressed: onReject,
              child: const Text('Từ chối'),
            )),
            const SizedBox(width: 10),
            Expanded(child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.success),
              onPressed: onAccept,
              child: const Text('Đồng ý', style: TextStyle(color: Colors.white)),
            )),
          ]),
        ],
        if (status == 'accepted') ...[
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: onComplete,
            icon: const Icon(Icons.check_circle_outline, color: Colors.white, size: 18),
            label: const Text('Đã giao xong', style: TextStyle(color: Colors.white)),
          )),
        ],
      ]),
    );
  }

  Color _borderColor(String status) {
    switch (status) {
      case 'pending': return Colors.orange.shade200;
      case 'accepted': return AppTheme.primary.withOpacity(0.4);
      case 'completed': return AppTheme.success.withOpacity(0.4);
      default: return AppTheme.border;
    }
  }
}

class _OutgoingCard extends StatelessWidget {
  final Map<String, dynamic> deal;
  final VoidCallback? onCancel;

  const _OutgoingCard({required this.deal, this.onCancel});

  @override
  Widget build(BuildContext context) {
    final post = deal['post'] as Map<String, dynamic>? ?? {};
    final owner = deal['owner'] as Map<String, dynamic>? ?? {};
    final status = deal['status'] as String? ?? 'pending';
    final message = deal['message'] as String?;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.inventory_2_outlined, size: 16, color: AppTheme.textSecondary),
          const SizedBox(width: 6),
          Expanded(
            child: Text(post['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
          _StatusChip(status: status),
        ]),
        const Divider(height: 16),
        Row(children: [
          const Icon(Icons.person_outline, size: 14, color: AppTheme.textSecondary),
          const SizedBox(width: 4),
          Text('Người đăng: ${owner['name'] ?? ''}',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        ]),
        if (message != null && message.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text('"$message"',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontStyle: FontStyle.italic)),
        ],
        if (onCancel != null) ...[
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: OutlinedButton(
            style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.error, side: const BorderSide(color: AppTheme.error)),
            onPressed: onCancel,
            child: const Text('Huỷ yêu cầu'),
          )),
        ],
      ]),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = _color();
    final label = _label();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }

  Color _color() {
    switch (status) {
      case 'pending': return Colors.orange;
      case 'accepted': return AppTheme.primary;
      case 'completed': return AppTheme.success;
      default: return AppTheme.textSecondary;
    }
  }

  String _label() {
    switch (status) {
      case 'pending': return 'Chờ phản hồi';
      case 'accepted': return 'Đã đồng ý';
      case 'completed': return 'Hoàn thành';
      case 'rejected': return 'Đã từ chối';
      case 'cancelled': return 'Đã huỷ';
      default: return status;
    }
  }
}
