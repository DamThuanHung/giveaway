import 'package:latlong2/latlong.dart';

/// Toạ độ centroid 34 tỉnh thành VN (sau sáp nhập 1/7/2025).
/// Dùng cho map picker để bay nhanh đến vùng tỉnh.
class ProvinceCoords {
  static const Map<String, LatLng> data = {
    // 6 thành phố trực thuộc Trung ương
    'Hà Nội': LatLng(21.0285, 105.8542),
    'TP. Hồ Chí Minh': LatLng(10.7769, 106.7009),
    'Hải Phòng': LatLng(20.8449, 106.6881),
    'Đà Nẵng': LatLng(16.0544, 108.2022),
    'Cần Thơ': LatLng(10.0452, 105.7469),
    'Huế': LatLng(16.4637, 107.5909),

    // 28 tỉnh
    'An Giang': LatLng(10.5216, 105.1259),
    'Bắc Ninh': LatLng(21.1861, 106.0763),
    'Cà Mau': LatLng(9.1769, 105.1524),
    'Cao Bằng': LatLng(22.6356, 106.2522),
    'Đắk Lắk': LatLng(12.7100, 108.2378),
    'Điện Biên': LatLng(21.3855, 103.0150),
    'Đồng Nai': LatLng(11.0686, 107.1676),
    'Đồng Tháp': LatLng(10.4938, 105.6882),
    'Gia Lai': LatLng(13.8079, 108.1094),
    'Hà Tĩnh': LatLng(18.3559, 105.8877),
    'Hưng Yên': LatLng(20.6464, 106.0511),
    'Khánh Hòa': LatLng(12.2585, 109.0526),
    'Lai Châu': LatLng(22.3964, 103.4584),
    'Lâm Đồng': LatLng(11.9404, 108.4583),
    'Lạng Sơn': LatLng(21.8458, 106.7610),
    'Lào Cai': LatLng(22.4856, 103.9707),
    'Nghệ An': LatLng(19.2342, 104.9200),
    'Ninh Bình': LatLng(20.2506, 105.9745),
    'Phú Thọ': LatLng(21.3989, 105.2294),
    'Quảng Ngãi': LatLng(15.1214, 108.8044),
    'Quảng Ninh': LatLng(21.0064, 107.2925),
    'Quảng Trị': LatLng(16.7943, 107.0451),
    'Sơn La': LatLng(21.3258, 103.9188),
    'Tây Ninh': LatLng(11.3354, 106.1099),
    'Thái Nguyên': LatLng(21.5944, 105.8480),
    'Thanh Hóa': LatLng(19.8067, 105.7852),
    'Tuyên Quang': LatLng(21.8233, 105.2142),
    'Vĩnh Long': LatLng(10.2538, 105.9722),
  };

  /// Top thành phố lớn — hiện ở đầu danh sách trong picker để chọn nhanh.
  static const List<String> popular = [
    'Hà Nội',
    'TP. Hồ Chí Minh',
    'Đà Nẵng',
    'Hải Phòng',
    'Cần Thơ',
    'Huế',
  ];
}
