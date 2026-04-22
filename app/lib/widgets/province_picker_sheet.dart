import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'radius_map_picker.dart';

export 'radius_map_picker.dart' show RadiusMapResult;

class _SegmentBtn extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _SegmentBtn({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            color: selected ? AppTheme.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(7),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: selected ? Colors.white : AppTheme.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class ProvincePickerSheet extends StatefulWidget {
  final String? selected;
  final RadiusMapResult? radiusResult;
  final ValueChanged<String?> onConfirm;
  final ValueChanged<RadiusMapResult>? onRadiusConfirm;

  const ProvincePickerSheet({
    super.key,
    this.selected,
    this.radiusResult,
    required this.onConfirm,
    this.onRadiusConfirm,
  });

  @override
  State<ProvincePickerSheet> createState() => _ProvincePickerSheetState();
}

class _ProvincePickerSheetState extends State<ProvincePickerSheet>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  String? _selected;

  @override
  void initState() {
    super.initState();
    _selected = widget.selected;
    // Nếu đang ở radius mode → mở tab bản đồ
    _tabCtrl = TabController(length: 2, vsync: this,
        initialIndex: widget.selected != null ? 1 : 0);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  static const _regions = [
    {
      'label': 'Miền Bắc',
      'all': 'Toàn miền Bắc',
      'provinces': [
        'Hà Nội', 'Hải Phòng', 'Quảng Ninh', 'Hải Dương', 'Hưng Yên',
        'Thái Bình', 'Nam Định', 'Ninh Bình', 'Hà Nam', 'Bắc Ninh',
        'Vĩnh Phúc', 'Phú Thọ', 'Thái Nguyên', 'Bắc Giang', 'Lạng Sơn',
        'Cao Bằng', 'Bắc Kạn', 'Tuyên Quang', 'Hà Giang', 'Yên Bái',
        'Lào Cai', 'Điện Biên', 'Lai Châu', 'Sơn La', 'Hòa Bình',
      ],
    },
    {
      'label': 'Miền Trung',
      'all': 'Toàn miền Trung',
      'provinces': [
        'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh', 'Quảng Bình', 'Quảng Trị',
        'Thừa Thiên Huế', 'Đà Nẵng', 'Quảng Nam', 'Quảng Ngãi', 'Bình Định',
        'Phú Yên', 'Khánh Hòa', 'Ninh Thuận', 'Bình Thuận',
        'Kon Tum', 'Gia Lai', 'Đắk Lắk', 'Đắk Nông', 'Lâm Đồng',
      ],
    },
    {
      'label': 'Miền Nam',
      'all': 'Toàn miền Nam',
      'provinces': [
        'TP. Hồ Chí Minh', 'Bình Dương', 'Đồng Nai', 'Bà Rịa - Vũng Tàu',
        'Tây Ninh', 'Bình Phước', 'Long An', 'Tiền Giang', 'Bến Tre',
        'Trà Vinh', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang',
        'Cần Thơ', 'Hậu Giang', 'Sóc Trăng', 'Bạc Liêu', 'Cà Mau',
      ],
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      child: Column(
        children: [
          // Handle
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 36, height: 4,
            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
          ),

          // Title
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 14),
            child: Text('Khu vực tìm kiếm', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          ),

          // Tab toggle — segmented control tự làm
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              height: 44,
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  _SegmentBtn(
                    label: 'Gần tôi',
                    selected: _tabCtrl.index == 0,
                    onTap: () => setState(() => _tabCtrl.animateTo(0)),
                  ),
                  _SegmentBtn(
                    label: 'Theo tỉnh/thành',
                    selected: _tabCtrl.index == 1,
                    onTap: () => setState(() => _tabCtrl.animateTo(1)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          const Divider(height: 1),

          // Tab content
          Expanded(
            child: TabBarView(
              controller: _tabCtrl,
              children: [
                // ── Tab Bản đồ ──
                RadiusMapPicker(
                  initial: widget.radiusResult,
                  onConfirm: (result) {
                    widget.onRadiusConfirm?.call(result);
                  },
                ),

                // ── Tab Khu vực ──
                Column(
                  children: [
                    Expanded(
                      child: ListView(
                        children: [
                          // Toggle Toàn quốc
                          _buildToggleRow(
                            label: 'Toàn quốc',
                            selected: _selected == null,
                            onTap: () => setState(() => _selected = null),
                          ),
                          const Divider(height: 1, indent: 16),

                          for (final region in _regions) ...[
                            Container(
                              color: AppTheme.background,
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              child: Text(
                                region['label'] as String,
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                              ),
                            ),
                            _buildRadioRow(
                              label: region['all'] as String,
                              value: region['all'] as String,
                              onTap: () => setState(() => _selected = region['all'] as String),
                            ),
                            const Divider(height: 1, indent: 56),
                            for (final p in region['provinces'] as List<String>) ...[
                              _buildRadioRow(
                                label: p,
                                value: p,
                                onTap: () => setState(() => _selected = p),
                              ),
                              if (p != (region['provinces'] as List<String>).last)
                                const Divider(height: 1, indent: 56),
                            ],
                          ],
                          const SizedBox(height: 16),
                        ],
                      ),
                    ),

                    // Bottom buttons cho tab Khu vực
                    const Divider(height: 1),
                    Padding(
                      padding: EdgeInsets.fromLTRB(16, 12, 16, MediaQuery.of(context).padding.bottom + 12),
                      child: Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                side: const BorderSide(color: AppTheme.border),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: () => setState(() => _selected = null),
                              child: const Text('Xóa', style: TextStyle(color: AppTheme.textPrimary, fontSize: 15)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.primary,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: () {
                                Navigator.pop(context);
                                widget.onConfirm(_selected);
                              },
                              child: const Text('Áp dụng', style: TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w600)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildToggleRow({required String label, required bool selected, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Expanded(child: Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500))),
            Switch(value: selected, onChanged: (_) => onTap(), activeColor: AppTheme.primary),
          ],
        ),
      ),
    );
  }

  Widget _buildRadioRow({required String label, required String value, required VoidCallback onTap}) {
    final isSelected = _selected == value;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        child: Row(
          children: [
            Container(
              width: 22, height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? AppTheme.primary : Colors.grey.shade400,
                  width: isSelected ? 6 : 1.5,
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(label, style: TextStyle(
              fontSize: 15,
              color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
              fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            ))),
          ],
        ),
      ),
    );
  }
}
