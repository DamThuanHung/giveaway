import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../../services/api_service.dart';
import '../../services/analytics.dart';
import '../../theme/app_theme.dart';

const _kGoldLight = Color(0xFFF4D36A);

// ─── Model ────────────────────────────────────────────────────────────────────

class BumpPackage {
  final String key;
  final String label;
  final String badge;
  final Color badgeColor;
  final Color badgeText;
  final int amount;
  final int days;
  final List<String> perks;

  const BumpPackage({
    required this.key,
    required this.label,
    required this.badge,
    required this.badgeColor,
    required this.badgeText,
    required this.amount,
    required this.days,
    required this.perks,
  });
}

const _packages = [
  BumpPackage(
    key: 'free',
    label: 'Miễn phí',
    badge: 'Free',
    badgeColor: AppTheme.primaryLight,
    badgeText: AppTheme.primary,
    amount: 0,
    days: 1,
    perks: ['Đẩy lên đầu 1 lần/24 giờ', 'Badge "Nổi bật" 24 giờ'],
  ),
  BumpPackage(
    key: 'plus_3d',
    label: 'Plus',
    badge: 'Plus',
    badgeColor: Color(0xFFFEF9E7),
    badgeText: Color(0xFF854F0B),
    amount: 5000,
    days: 3,
    perks: ['Hiệu ứng viền vàng 3 ngày', 'Luôn đứng trên bài thường', 'Badge "Plus" nổi bật'],
  ),
  BumpPackage(
    key: 'vip_7d',
    label: 'VIP',
    badge: 'VIP',
    badgeColor: Color(0xFF2A2418),
    badgeText: _kGoldLight,
    amount: 15000,
    days: 7,
    perks: ['Viền vàng chạy + sao lấp lánh', 'Card to hơn trong feed', 'Ưu tiên hiển thị cao nhất', 'Badge "VIP" 7 ngày'],
  ),
];

// ─── Screen ───────────────────────────────────────────────────────────────────

class BumpPackageScreen extends StatefulWidget {
  final String postId;
  final int currentTier;
  final VoidCallback? onSuccess;

  const BumpPackageScreen({
    super.key,
    required this.postId,
    this.currentTier = 0,
    this.onSuccess,
  });

  @override
  State<BumpPackageScreen> createState() => _BumpPackageScreenState();
}

class _BumpPackageScreenState extends State<BumpPackageScreen> {
  int _selected = 0;
  bool _loading = false;

  Future<void> _proceed() async {
    final pkg = _packages[_selected];

    // Free bump — gọi API bump thông thường
    if (pkg.key == 'free') {
      setState(() => _loading = true);
      try {
        final res = await ApiService.bumpPost(widget.postId);
        if (!mounted) return;
        if (res != null && res['ok'] == true) {
          widget.onSuccess?.call();
          Navigator.pop(context, true);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã đẩy bài lên đầu!')),
          );
        } else {
          final msg = res?['error'] ?? 'Không thể đẩy bài lúc này';
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
        }
      } finally {
        if (mounted) setState(() => _loading = false);
      }
      return;
    }

    // TM4 (Tier 2): confirm dialog trước khi mở PayOS — chống user bấm nhầm
    // mất tiền. Người Việt 30-50 tuổi nhìn nhanh dễ bấm sai gói.
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Xác nhận thanh toán'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Gói: ${pkg.label}', style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text('Số tiền: ${_formatPrice(pkg.amount)}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary)),
            const SizedBox(height: 12),
            const Text(
              'Bạn sẽ được chuyển đến trang thanh toán PayOS. '
              'Vui lòng kiểm tra số tiền trước khi xác nhận giao dịch ngân hàng.',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Huỷ')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Tiếp tục thanh toán'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;

    // Plus / VIP — tạo đơn PayOS
    setState(() => _loading = true);
    Analytics.bumpInitiate(tier: pkg.key, amount: pkg.amount);
    try {
      final res = await ApiService.createBumpOrder(widget.postId, pkg.key);
      if (!mounted) return;

      final checkoutUrl = res['checkoutUrl'] as String?;
      if (checkoutUrl == null || checkoutUrl.isEmpty) {
        final errorMsg = res['error'] as String? ?? 'Không rõ lỗi';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Không thể tạo đơn: $errorMsg')),
        );
        return;
      }

      // Mở WebView thanh toán
      final result = await Navigator.push<bool>(
        context,
        MaterialPageRoute(
          builder: (_) => PayOSWebView(
            url: checkoutUrl,
            postId: widget.postId,
          ),
        ),
      );

      if (result == true && mounted) {
        // Webhook PayOS có thể chậm hơn returnUrl redirect vài giây.
        // Polling boost status — chỉ báo thành công khi DB đã ghi boostTier.
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (_) => const AlertDialog(
            content: Padding(
              padding: EdgeInsets.symmetric(vertical: 8),
              child: Row(children: [
                SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2)),
                SizedBox(width: 16),
                Expanded(child: Text('Đang xác nhận thanh toán...')),
              ]),
            ),
          ),
        );

        // Poll boost status tối đa 45 giây — webhook PayOS qua MB Bank trên 3G/4G
        // VN giờ peak có thể chậm 20-30s. 45s cover 95% case mà không quá lâu để
        // user mất kiên nhẫn. Cron 5 phút sẽ catch các case còn lại.
        bool confirmed = false;
        for (int i = 0; i < 45; i++) {
          await Future.delayed(const Duration(seconds: 1));
          if (!mounted) return;
          final status = await ApiService.getBoostStatus(widget.postId);
          final tier = status['boostTier'] as int? ?? 0;
          if (tier > 0) { confirmed = true; break; }
        }

        if (!mounted) return;
        Navigator.pop(context); // đóng dialog loading

        widget.onSuccess?.call();
        if (confirmed) {
          // Track revenue chỉ khi DB confirm — không tin returnUrl đơn thuần
          Analytics.bumpComplete(tier: pkg.key, amount: pkg.amount);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Đã kích hoạt gói ${pkg.label}!')),
          );
          if (mounted) Navigator.pop(context, true);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Thanh toán đã được gửi. Nếu bài chưa boost sau 1-2 phút, kéo xuống để làm mới.'),
              duration: Duration(seconds: 6),
            ),
          );
          if (mounted) Navigator.pop(context, false);
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi: ${e.toString()}')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Chọn gói đẩy bài', style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppTheme.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          const Divider(height: 1),
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _packages.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (_, i) => _PackageCard(
                pkg: _packages[i],
                selected: _selected == i,
                isCurrent: widget.currentTier == (i == 0 ? 0 : i == 1 ? 2 : 3),
                onTap: () => setState(() => _selected = i),
              ),
            ),
          ),
          const Divider(height: 1),
          Padding(
            padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
            child: SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _loading ? null : _proceed,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(
                        _packages[_selected].amount == 0
                            ? 'Đẩy bài miễn phí'
                            : 'Thanh toán ${_formatPrice(_packages[_selected].amount)}',
                        style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Package Card ─────────────────────────────────────────────────────────────

class _PackageCard extends StatelessWidget {
  final BumpPackage pkg;
  final bool selected;
  final bool isCurrent;
  final VoidCallback onTap;

  const _PackageCard({
    required this.pkg,
    required this.selected,
    required this.isCurrent,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryLight.withOpacity(0.3) : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? AppTheme.primary : AppTheme.border,
            width: selected ? 2 : 1,
          ),
          boxShadow: selected ? [BoxShadow(color: AppTheme.primary.withOpacity(0.12), blurRadius: 8, offset: const Offset(0, 3))] : [],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Radio
            Container(
              margin: const EdgeInsets.only(top: 2),
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: selected ? AppTheme.primary : AppTheme.border,
                  width: selected ? 6 : 1.5,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(pkg.label, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: pkg.badgeColor,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(pkg.badge, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: pkg.badgeText)),
                      ),
                      if (isCurrent) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: AppTheme.primaryLight, borderRadius: BorderRadius.circular(4)),
                          child: const Text('Đang dùng', style: TextStyle(fontSize: 10, color: AppTheme.primary, fontWeight: FontWeight.w600)),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 6),
                  ...pkg.perks.map((p) => Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle_outline, size: 14, color: AppTheme.primary),
                        const SizedBox(width: 5),
                        Expanded(child: Text(p, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary))),
                      ],
                    ),
                  )),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Text(
              pkg.amount == 0 ? 'Miễn phí' : _formatPrice(pkg.amount),
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: pkg.amount == 0 ? AppTheme.primary : AppTheme.priceColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── PayOS WebView ────────────────────────────────────────────────────────────

class PayOSWebView extends StatefulWidget {
  final String url;
  final String postId;

  const PayOSWebView({super.key, required this.url, required this.postId});

  @override
  State<PayOSWebView> createState() => _PayOSWebViewState();
}

class _PayOSWebViewState extends State<PayOSWebView> {
  late final WebViewController _controller;
  bool _loading = true;
  String? _loadError;  // TM5 (Tier 2): track network/load error để show retry UI

  @override
  void initState() {
    super.initState();
    _initController();
  }

  void _initController() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) {
          if (mounted) setState(() { _loading = true; _loadError = null; });
        },
        onPageFinished: (_) {
          if (mounted) setState(() => _loading = false);
        },
        // TM5 (Tier 2): handle PayOS load fail — chỉ catch network error chính
        // (errorType.host/connection), KHÔNG catch sub-resource fail (favicon
        // miss, analytics blocked) để tránh false positive.
        onWebResourceError: (err) {
          if (!mounted) return;
          // Chỉ treat as fatal nếu là main frame error
          final isMainFrame = err.isForMainFrame ?? false;
          if (!isMainFrame) return;
          setState(() {
            _loading = false;
            _loadError = 'Không tải được trang thanh toán. Mạng yếu hoặc PayOS đang bảo trì.';
          });
        },
        onNavigationRequest: (req) {
          // Bắt URL callback ngay khi PayOS redirect (trước khi WebView
          // load ngrok interstitial hoặc đợi backend redirect về deep link)
          if (req.url.contains('/bump/return')) {
            Navigator.pop(context, true);
            return NavigationDecision.prevent;
          }
          if (req.url.contains('/bump/cancel')) {
            Navigator.pop(context, false);
            return NavigationDecision.prevent;
          }
          // Fallback — deep link scheme sau khi backend redirect
          if (req.url.startsWith('traotay://bump/success')) {
            Navigator.pop(context, true);
            return NavigationDecision.prevent;
          }
          if (req.url.startsWith('traotay://bump/cancel')) {
            Navigator.pop(context, false);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse(widget.url));
  }

  void _retry() {
    setState(() { _loadError = null; _loading = true; });
    _controller.loadRequest(Uri.parse(widget.url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text('Thanh toán', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppTheme.textPrimary),
          onPressed: () => Navigator.pop(context, false),
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_loading && _loadError == null)
            const Center(child: CircularProgressIndicator()),
          // TM5 (Tier 2): error state với nút retry
          if (_loadError != null)
            Container(
              color: Colors.white,
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.cloud_off_outlined, size: 64, color: Color(0xFFE57373)),
                    const SizedBox(height: 16),
                    Text(_loadError!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary)),
                    const SizedBox(height: 24),
                    ElevatedButton.icon(
                      onPressed: _retry,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Thử lại'),
                    ),
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const Text('Đóng và thanh toán sau'),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

String _formatPrice(int amount) {
  if (amount >= 1000) return '${(amount / 1000).round()}k';
  return '$amountđ';
}
