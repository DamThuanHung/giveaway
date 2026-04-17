class AppCategories {
  static const List<Map<String, String>> list = [
    {'value': 'electronics', 'label': 'Điện tử',    'icon': 'assets/icons/categories/electronics.png'},
    {'value': 'furniture',   'label': 'Nội thất',   'icon': 'assets/icons/categories/furniture.png'},
    {'value': 'clothing',    'label': 'Thời trang', 'icon': 'assets/icons/categories/clothing.png'},
    {'value': 'kitchen',     'label': 'Gia dụng',   'icon': 'assets/icons/categories/kitchen.png'},
    {'value': 'books',       'label': 'Sách',        'icon': 'assets/icons/categories/books.png'},
    {'value': 'toys',        'label': 'Đồ chơi',    'icon': 'assets/icons/categories/toys.png'},
    {'value': 'sports',      'label': 'Thể thao',   'icon': 'assets/icons/categories/sports.png'},
    {'value': 'vehicles',    'label': 'Xe cộ',      'icon': 'assets/icons/categories/vehicles.png'},
    {'value': 'beauty',      'label': 'Làm đẹp',    'icon': 'assets/icons/categories/beauty.png'},
    {'value': 'pets',        'label': 'Thú cưng',   'icon': 'assets/icons/categories/pets.png'},
    {'value': 'tools',       'label': 'Đồ nghề',    'icon': 'assets/icons/categories/tools.png'},
    {'value': 'food',        'label': 'Thực phẩm',  'icon': 'assets/icons/categories/food.png'},
    {'value': 'baby',        'label': 'Mẹ & Bé',    'icon': 'assets/icons/categories/baby.png'},
    {'value': 'music',       'label': 'Nhạc cụ',    'icon': 'assets/icons/categories/music.png'},
    {'value': 'realestate',  'label': 'Bất động sản','icon': 'assets/icons/categories/realestate.png'},
    {'value': 'service',     'label': 'Rao dịch vụ',  'icon': 'assets/icons/categories/service.png'},
    {'value': 'other',       'label': 'Khác',        'icon': 'assets/icons/categories/other.png'},
  ];

  static String labelOf(String value) {
    return list.firstWhere(
      (c) => c['value'] == value,
      orElse: () => {'label': value},
    )['label']!;
  }

  static String iconOf(String value) {
    return list.firstWhere(
      (c) => c['value'] == value,
      orElse: () => {'icon': 'assets/icons/categories/other.png'},
    )['icon']!;
  }
}
