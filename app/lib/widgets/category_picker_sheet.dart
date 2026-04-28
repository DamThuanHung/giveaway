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
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => CategoryPickerSheet(selected: selected),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.7,
      child: Column(
        children: [
          Container(
            margin: const EdgeInsets.only(top: 8),
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Text(
              'Chọn danh mục',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 0.95,
              ),
              itemCount: AppCategories.list.length,
              itemBuilder: (_, i) {
                final cat = AppCategories.list[i];
                final isSelected = cat['value'] == selected;
                return InkWell(
                  onTap: () => Navigator.pop(context, cat['value']),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppTheme.primary.withOpacity(0.1)
                          : AppTheme.background,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected ? AppTheme.primary : Colors.transparent,
                        width: 1.5,
                      ),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Image.asset(
                          cat['icon']!,
                          width: 32,
                          height: 32,
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.category_outlined,
                            color: isSelected ? AppTheme.primary : AppTheme.textSecondary,
                            size: 32,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          cat['label']!,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                            color: isSelected ? AppTheme.primary : AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
