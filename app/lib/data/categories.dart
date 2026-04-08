class AppCategories {
  static const List<Map<String, String>> list = [
    {'value': 'electronics', 'label': 'Điện tử & Công nghệ'},
    {'value': 'furniture', 'label': 'Nội thất & Trang trí'},
    {'value': 'clothing', 'label': 'Thời trang & Phụ kiện'},
    {'value': 'kitchen', 'label': 'Nhà bếp & Gia dụng'},
    {'value': 'books', 'label': 'Sách & Văn phòng phẩm'},
    {'value': 'toys', 'label': 'Đồ chơi & Trẻ em'},
    {'value': 'sports', 'label': 'Thể thao & Dã ngoại'},
    {'value': 'vehicles', 'label': 'Xe cộ & Phụ tùng'},
    {'value': 'beauty', 'label': 'Mỹ phẩm & Làm đẹp'},
    {'value': 'pets', 'label': 'Thú cưng & Phụ kiện'},
    {'value': 'tools', 'label': 'Dụng cụ & Đồ nghề'},
    {'value': 'food', 'label': 'Thực phẩm & Đồ uống'},
    {'value': 'baby', 'label': 'Mẹ & Bé'},
    {'value': 'music', 'label': 'Nhạc cụ & Âm thanh'},
    {'value': 'other', 'label': 'Khác'},
  ];

  static String labelOf(String value) {
    return list.firstWhere(
      (c) => c['value'] == value,
      orElse: () => {'label': value},
    )['label']!;
  }
}
