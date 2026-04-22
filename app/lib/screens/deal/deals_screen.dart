import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/skeleton.dart';
import '../../widgets/user_avatar.dart';

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
  bool _error = false;

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
    setState(() { _loading = true; _error = false; });
    try {
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
    } catch (e) {
      debugPrint('❌ DealsScreen._load error: $e');
      if (!mounted) return;
      setState(() { _loading = false; _error = true; });
    }
  }

  Future<void> _updateStatus(String dealId, String status) async {
    final ok = await ApiService.updateDealStatus(dealId, status);
    if (!mounted) return;
    if (ok) {
      setState(() {
        final iIdx = _incoming.indexWhere((d) => d['id'] == dealId);
        if (iIdx != -1) _incoming[iIdx] = {..._incoming[iIdx], 'status': status};
        final oIdx = _outgoing.indexWhere((d) => d['id'] == dealId);
        if (oIdx != -1) _outgoing[oIdx] = {..._outgoing[oIdx], 'status': status};
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(_statusMessage(status)),
        backgroundColor: AppTheme.success,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Text('Không thể cập nhật, thử lại sau'),
        backgroundColor: AppTheme.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
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

  Future<void> _confirmReject(String dealId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Từ chối yêu cầu'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bạn có chắc muốn từ chối yêu cầu này không?'),
            const SizedBox(height: 20),
            SizedBox(width: double.infinity, child: OutlinedButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Hủy'),
            )),
            const SizedBox(height: 8),
            SizedBox(width: double.infinity, child: ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error, foregroundColor: Colors.white),
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Từ chối'),
            )),
          ],
        ),
      ),
    );
    if (confirm == true) _updateStatus(dealId, 'rejected');
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
          ? const DealListSkeleton()
          : _error
              ? RefreshIndicator(
                  onRefresh: _load,
                  child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: SizedBox(height: c.maxHeight, child: Center(
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        const Icon(Icons.wifi_off, size: 48, color: AppTheme.textSecondary),
                        const SizedBox(height: 12),
                        const Text('Không tải được dữ liệu', style: TextStyle(color: AppTheme.textSecondary)),
                        const SizedBox(height: 16),
                        OutlinedButton(onPressed: _load, child: const Text('Thử lại')),
                      ]),
                    )),
                  )),
                )
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
    if (_incoming.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(height: c.maxHeight, child: _emptyState('Chưa có ai gửi yêu cầu')),
        )),
      );
    }
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: _incoming.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => _IncomingCard(
          deal: _incoming[i],
          onAccept: () => _updateStatus(_incoming[i]['id'], 'accepted'),
          onReject: () => _confirmReject(_incoming[i]['id']),
          onComplete: () => _updateStatus(_incoming[i]['id'], 'completed'),
        ),
      ),
    );
  }

  Widget _buildOutgoingList() {
    if (_outgoing.isEmpty) {
      return RefreshIndicator(
        onRefresh: _load,
        child: LayoutBuilder(builder: (_, c) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(height: c.maxHeight, child: _emptyState('Bạn chưa gửi yêu cầu nào')),
        )),
      );
    }
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
          onReviewed: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: const Text('Cảm ơn bạn đã đánh giá!'),
            backgroundColor: AppTheme.success,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          )),
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
          UserAvatar(
            imageUrl: requester['avatar']?.toString(),
            name: requester['name']?.toString(),
            radius: 16,
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
      case 'pending': return AppTheme.warning.withOpacity(0.4);
      case 'accepted': return AppTheme.primary.withOpacity(0.4);
      case 'completed': return AppTheme.success.withOpacity(0.4);
      default: return AppTheme.border;
    }
  }
}

class _OutgoingCard extends StatefulWidget {
  final Map<String, dynamic> deal;
  final VoidCallback? onCancel;
  final VoidCallback? onReviewed;

  const _OutgoingCard({required this.deal, this.onCancel, this.onReviewed});

  @override
  State<_OutgoingCard> createState() => _OutgoingCardState();
}

class _OutgoingCardState extends State<_OutgoingCard> {
  bool _hasReviewed = false;
  bool _checkingReview = false;

  @override
  void initState() {
    super.initState();
    if (widget.deal['status'] == 'completed') _checkReview();
  }

  Future<void> _checkReview() async {
    setState(() => _checkingReview = true);
    final result = await ApiService.checkReviewed(widget.deal['id']);
    if (!mounted) return;
    setState(() { _hasReviewed = result; _checkingReview = false; });
  }

  Future<void> _openReviewSheet() async {
    final owner = widget.deal['owner'] as Map<String, dynamic>? ?? {};
    final dealId = widget.deal['id'] as String;
    final reviewed = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ReviewSheet(
        dealId: dealId,
        ownerName: owner['name']?.toString() ?? 'Người đăng',
      ),
    );
    if (reviewed == true) {
      setState(() => _hasReviewed = true);
      widget.onReviewed?.call();
    }
  }

  @override
  Widget build(BuildContext context) {
    final post = widget.deal['post'] as Map<String, dynamic>? ?? {};
    final owner = widget.deal['owner'] as Map<String, dynamic>? ?? {};
    final status = widget.deal['status'] as String? ?? 'pending';
    final message = widget.deal['message'] as String?;

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
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: AppTheme.background, borderRadius: BorderRadius.circular(8)),
            child: Text('"$message"',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, fontStyle: FontStyle.italic)),
          ),
        ],
        if (widget.onCancel != null) ...[
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: OutlinedButton(
            style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.error, side: const BorderSide(color: AppTheme.error)),
            onPressed: widget.onCancel,
            child: const Text('Huỷ yêu cầu'),
          )),
        ],
        if (status == 'completed' && !_checkingReview) ...[
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: _hasReviewed
              ? OutlinedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.check_circle_outline, size: 16),
                  label: const Text('Đã đánh giá'),
                  style: OutlinedButton.styleFrom(foregroundColor: AppTheme.textSecondary),
                )
              : ElevatedButton.icon(
                  onPressed: _openReviewSheet,
                  icon: const Icon(Icons.star_outline_rounded, size: 16, color: Colors.white),
                  label: const Text('Viết đánh giá', style: TextStyle(color: Colors.white)),
                  style: ElevatedButton.styleFrom(backgroundColor: AppTheme.warning),
                )),
        ],
      ]),
    );
  }
}

class _ReviewSheet extends StatefulWidget {
  final String dealId;
  final String ownerName;
  const _ReviewSheet({required this.dealId, required this.ownerName});

  @override
  State<_ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<_ReviewSheet> {
  int _rating = 5;
  final _commentCtrl = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _commentCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_rating == 0) return;
    setState(() => _submitting = true);
    final ok = await ApiService.createReview(widget.dealId, _rating, comment: _commentCtrl.text.trim());
    if (!mounted) return;
    setState(() => _submitting = false);
    if (ok) {
      Navigator.pop(context, true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Không gửi được đánh giá, thử lại sau'),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppTheme.border, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 16),
          Text('Đánh giá ${widget.ownerName}',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.center, children: List.generate(5, (i) => GestureDetector(
            onTap: () => setState(() => _rating = i + 1),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Icon(
                i < _rating ? Icons.star_rounded : Icons.star_outline_rounded,
                color: Colors.amber, size: 40,
              ),
            ),
          ))),
          const SizedBox(height: 20),
          TextField(
            controller: _commentCtrl,
            maxLines: 3,
            maxLength: 200,
            decoration: InputDecoration(
              hintText: 'Nhận xét của bạn (không bắt buộc)',
              filled: true,
              fillColor: AppTheme.background,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: _submitting ? null : _submit,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primary,
              minimumSize: const Size(double.infinity, 50),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: _submitting
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Text('Gửi đánh giá', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 15)),
          )),
        ]),
      ),
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
