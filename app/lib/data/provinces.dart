/// 34 đơn vị hành chính cấp tỉnh sau Nghị quyết 202/2025/QH15
/// Hiệu lực từ 1/7/2025: 6 thành phố trực thuộc TW + 28 tỉnh.
class AppProvinces {
  static const List<String> list = [
    'Toàn quốc',

    // 6 thành phố trực thuộc Trung ương
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Hải Phòng',
    'Đà Nẵng',
    'Cần Thơ',
    'Huế',

    // 28 tỉnh
    'An Giang',
    'Bắc Ninh',
    'Cà Mau',
    'Cao Bằng',
    'Đắk Lắk',
    'Điện Biên',
    'Đồng Nai',
    'Đồng Tháp',
    'Gia Lai',
    'Hà Tĩnh',
    'Hưng Yên',
    'Khánh Hòa',
    'Lai Châu',
    'Lâm Đồng',
    'Lạng Sơn',
    'Lào Cai',
    'Nghệ An',
    'Ninh Bình',
    'Phú Thọ',
    'Quảng Ngãi',
    'Quảng Ninh',
    'Quảng Trị',
    'Sơn La',
    'Tây Ninh',
    'Thái Nguyên',
    'Thanh Hóa',
    'Tuyên Quang',
    'Vĩnh Long',
  ];

  /// Map từ tên tỉnh CŨ (trước 1/7/2025) → tên đơn vị MỚI sau sáp nhập.
  /// Dùng cho DB migration + chuẩn hoá data cũ trong app.
  static const Map<String, String> legacyMerge = {
    // Sáp nhập vào TP trực thuộc TW
    'Hải Dương': 'Hải Phòng',
    'Quảng Nam': 'Đà Nẵng',
    'Bình Dương': 'TP. Hồ Chí Minh',
    'Bà Rịa - Vũng Tàu': 'TP. Hồ Chí Minh',
    'Sóc Trăng': 'Cần Thơ',
    'Hậu Giang': 'Cần Thơ',
    'Thừa Thiên Huế': 'Huế',

    // Sáp nhập vào tỉnh
    'Hà Giang': 'Tuyên Quang',
    'Yên Bái': 'Lào Cai',
    'Bắc Kạn': 'Thái Nguyên',
    'Vĩnh Phúc': 'Phú Thọ',
    'Hòa Bình': 'Phú Thọ',
    'Bắc Giang': 'Bắc Ninh',
    'Thái Bình': 'Hưng Yên',
    'Hà Nam': 'Ninh Bình',
    'Nam Định': 'Ninh Bình',
    'Quảng Bình': 'Quảng Trị',
    'Kon Tum': 'Quảng Ngãi',
    'Bình Định': 'Gia Lai',
    'Ninh Thuận': 'Khánh Hòa',
    'Đắk Nông': 'Lâm Đồng',
    'Bình Thuận': 'Lâm Đồng',
    'Phú Yên': 'Đắk Lắk',
    'Bình Phước': 'Đồng Nai',
    'Long An': 'Tây Ninh',
    'Bến Tre': 'Vĩnh Long',
    'Trà Vinh': 'Vĩnh Long',
    'Tiền Giang': 'Đồng Tháp',
    'Bạc Liêu': 'Cà Mau',
    'Kiên Giang': 'An Giang',
  };

  /// Chuẩn hoá tên tỉnh: nếu là tên cũ → trả về tên mới; nếu đã đúng → giữ nguyên.
  static String normalize(String name) => legacyMerge[name] ?? name;
}
