import 'package:latlong2/latlong.dart';

/// Toạ độ centroid (thủ phủ) 47 tỉnh Nhật Bản.
/// Dùng cho map picker để bay nhanh đến vùng tỉnh, song song với `ProvinceCoords`.
class PrefectureCoords {
  static const Map<String, LatLng> data = {
    'Hokkaido': LatLng(43.0642, 141.3469),
    'Aomori': LatLng(40.8244, 140.7400),
    'Iwate': LatLng(39.7036, 141.1527),
    'Miyagi': LatLng(38.2682, 140.8694),
    'Akita': LatLng(39.7186, 140.1024),
    'Yamagata': LatLng(38.2404, 140.3633),
    'Fukushima': LatLng(37.7500, 140.4678),
    'Ibaraki': LatLng(36.3418, 140.4468),
    'Tochigi': LatLng(36.5658, 139.8836),
    'Gunma': LatLng(36.3906, 139.0604),
    'Saitama': LatLng(35.8617, 139.6455),
    'Chiba': LatLng(35.6073, 140.1063),
    'Tokyo': LatLng(35.6762, 139.6503),
    'Kanagawa': LatLng(35.4478, 139.6425),
    'Niigata': LatLng(37.9161, 139.0364),
    'Toyama': LatLng(36.6953, 137.2113),
    'Ishikawa': LatLng(36.5947, 136.6256),
    'Fukui': LatLng(36.0652, 136.2216),
    'Yamanashi': LatLng(35.6642, 138.5684),
    'Nagano': LatLng(36.6513, 138.1810),
    'Gifu': LatLng(35.3912, 136.7223),
    'Shizuoka': LatLng(34.9769, 138.3831),
    'Aichi': LatLng(35.1802, 136.9066),
    'Mie': LatLng(34.7303, 136.5086),
    'Shiga': LatLng(35.0045, 135.8686),
    'Kyoto': LatLng(35.0116, 135.7681),
    'Osaka': LatLng(34.6937, 135.5023),
    'Hyogo': LatLng(34.6913, 135.1830),
    'Nara': LatLng(34.6851, 135.8048),
    'Wakayama': LatLng(34.2261, 135.1675),
    'Tottori': LatLng(35.5038, 134.2380),
    'Shimane': LatLng(35.4723, 133.0505),
    'Okayama': LatLng(34.6551, 133.9195),
    'Hiroshima': LatLng(34.3853, 132.4553),
    'Yamaguchi': LatLng(34.1859, 131.4714),
    'Tokushima': LatLng(34.0658, 134.5593),
    'Kagawa': LatLng(34.3401, 134.0434),
    'Ehime': LatLng(33.8416, 132.7657),
    'Kochi': LatLng(33.5597, 133.5311),
    'Fukuoka': LatLng(33.5904, 130.4017),
    'Saga': LatLng(33.2494, 130.2988),
    'Nagasaki': LatLng(32.7503, 129.8779),
    'Kumamoto': LatLng(32.7898, 130.7417),
    'Oita': LatLng(33.2382, 131.6126),
    'Miyazaki': LatLng(31.9111, 131.4239),
    'Kagoshima': LatLng(31.5602, 130.5581),
    'Okinawa': LatLng(26.2124, 127.6809),
  };

  /// Vài tỉnh phổ biến hiển thị riêng ở đầu bottom sheet (giống ProvinceCoords.popular).
  static const List<String> popular = ['Tokyo', 'Osaka', 'Kyoto', 'Kanagawa', 'Aichi', 'Fukuoka'];
}
