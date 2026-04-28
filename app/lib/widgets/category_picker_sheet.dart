import 'package:flutter/material.dart';
import '../data/categories.dart';
import '../theme/app_theme.dart';

/// Bottom sheet chọn danh mục dạng grid 3 cột với icon — thay cho DropdownButton
/// 18 mục flat (vi phạm Miller's Law 7±2 và Hick's Law).
///
/// Trả về `value` của category được chọn (null nếu bấm Đóng), dùng:
/// ```dart
/// final cat = await CategoryPickerSheet.show(context, selected: _itemCategory);
/// if (cat != null) setState(() => _itemCategory = cat);
/// ```
class CategoryPickerSheet extends StatelessWidget {
  final String? selected;
  const CategoryPickerSheet({super.key, this.selected});

  static Future<String?> show(BuildContext context, {String? selected}) {
    return showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      barrierColor: Colors.black.withOpacity(0.4),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => CategoryPickerSheet(selected: selected),
    );
  }

  /// Phân nhóm 18 categories thành 5 section dễ quét (Hick's Law: giảm choice).
  static const _sections = [
    ('Đồ gia dụng', ['electronics', 'furniture', 'kitchen', 'tools']),
    ('Cá nhân', ['clothing', 'beauty', 'baby', 'pets']),
    ('Giải trí', ['books', 'toys', 'sports', 'music']),
    ('Phương tiện & BĐS', ['vehicles', 'realestate']),
    ('Khác', ['food', 'service', 'jobs', 'other']),
  ];

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.78,
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 16, 12),
            child: Row(
              children: [
                const Expanded(
                  child: Text(
                    'Chọn danh mục',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close, color: AppTheme.textSecondary),
                  tooltip: 'Đóng',
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Grouped grid
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.only(bottom: 16),
              itemCount: _sections.length,
              itemBuilder: (_, sectionIdx) {
                final (sectionLabel, keys) = _sections[sectionIdx];
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 18, 16, 8),
                      child: Text(
                        sectionLabel,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textSecondary,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                    GridView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4,
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        childAspectRatio: 0.85,
                      ),
                      itemCount: keys.length,
                      itemBuilder: (_, i) {
                        final value = keys[i];
                        final label = AppCategories.labelOf(value);
                        final icon = AppCategories.iconOf(value);
                        final isSelected = value == selected;
                        return _CategoryTile(
                          value: value,
                          label: label,
                          iconAsset: icon,
                          isSelected: isSelected,
                        );
                      },
                    ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Tile con — animation tap + visual khi selected.
class _CategoryTile extends StatelessWidget {
  final String value;
  final String label;
  final String iconAsset;
  final bool isSelected;

  const _CategoryTile({
    required this.value,
    required this.label,
    required this.iconAsset,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => Navigator.pop(context, value),
        borderRadius: BorderRadius.circular(14),
        splashColor: AppTheme.primary.withOpacity(0.1),
        highlightColor: AppTheme.primary.withOpacity(0.05),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          decoration: BoxDecoration(
            color: isSelected
                ? AppTheme.primary.withOpacity(0.12)
                : AppTheme.background,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isSelected ? AppTheme.primary : Colors.transparent,
              width: 1.8,
            ),
          ),
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Icon container — màu nhạt giúp nổi
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: isSelected
                      ? AppTheme.primary.withOpacity(0.15)
                      : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Image.asset(
                    iconAsset,
                    fit: BoxFit.contain,
                    errorBuilder: (_, __, ___) => Icon(
                      Icons.category_outlined,
                      color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
                      size: 22,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                  color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                  height: 1.15,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
