import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../../data/province_coords.dart';
import '../../data/provinces.dart';
import '../../theme/app_theme.dart';

class MapPickerScreen extends StatefulWidget {
  const MapPickerScreen({super.key});
  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  // Mặc định: Hà Nội
  LatLng _selectedPos = const LatLng(21.0285, 105.8542);
  final MapController _mapController = MapController();

  String _cityName = 'Hà Nội';
  String _ward = '';
  String _district = '';
  String _province = 'Hà Nội';
  String _displayAddress = 'Hà Nội';
  bool _isGeocoding = false;

  void _moveToCity(String name, LatLng pos) {
    setState(() {
      _selectedPos = pos;
      _cityName = name;
      _province = name;
      _district = '';
      _ward = '';
      _displayAddress = name;
    });
    _mapController.move(pos, 13);
  }

  Future<void> _onMapTap(LatLng latLng) async {
    setState(() {
      _selectedPos = latLng;
      _isGeocoding = true;
    });
    try {
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse'
        '?lat=${latLng.latitude}&lon=${latLng.longitude}'
        '&format=json&addressdetails=1&accept-language=vi',
      );
      final res = await http.get(uri, headers: {
        'User-Agent': 'ChoVaTangApp/1.0',
      }).timeout(const Duration(seconds: 8));

      if (!mounted) return;

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final addr = data['address'] as Map<String, dynamic>? ?? {};

      // Nominatim VN: road, suburb/quarter, city_district, state
      final street = (addr['road'] ?? addr['pedestrian'] ?? addr['footway'] ?? '').toString();
      final ward = (addr['suburb'] ?? addr['quarter'] ?? addr['neighbourhood'] ?? '').toString();
      final district = (addr['city_district'] ?? addr['county'] ?? '').toString();

      // Sanitize province: Nominatim đôi khi trả về "Tỉnh Bắc Ninh" hoặc "Phường XYZ"
      // (cấp xã, không phải tỉnh). Strip prefix + chuẩn hoá tên cũ → mới + validate
      // phải nằm trong list 34 tỉnh hợp lệ. Nếu không match thì fallback _cityName.
      final rawProvince = (addr['city'] ?? addr['state'] ?? '').toString().trim();
      final cleanedProvince = _cleanProvincePrefix(rawProvince);
      final normalizedProvince = AppProvinces.normalize(cleanedProvince);
      final province = AppProvinces.list.contains(normalizedProvince)
          ? normalizedProvince
          : _cityName;

      // Loại trùng liền kề
      final parts = [street, ward, district, province].where((s) => s.isNotEmpty).toList();
      final deduped = <String>[];
      for (final s in parts) {
        if (deduped.isEmpty || deduped.last != s) deduped.add(s);
      }

      setState(() {
        _ward = ward;
        _district = district;
        _province = province;
        _displayAddress = deduped.isNotEmpty ? deduped.join(', ') : province;
        _isGeocoding = false;
      });
    } catch (_) {
      setState(() => _isGeocoding = false);
    }
  }

  /// Bỏ prefix kiểu "Tỉnh ", "Thành phố ", "TP. " ở đầu (Nominatim hay trả về có prefix).
  static String _cleanProvincePrefix(String s) {
    var v = s.trim();
    const prefixes = ['Thành phố ', 'Tỉnh ', 'TP. ', 'TP '];
    for (final p in prefixes) {
      if (v.startsWith(p)) {
        v = v.substring(p.length).trim();
        break;
      }
    }
    return v;
  }

  /// Bay map đến vị trí GPS hiện tại của user. Dùng cho FAB "Vị trí của tôi".
  Future<void> _moveToMyLocation() async {
    try {
      // Check service GPS có bật không (user có thể tắt trong cài đặt nhanh)
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!mounted) return;
      if (!serviceEnabled) {
        await _showPermissionDialog(
          title: 'Định vị đang TẮT',
          message: 'Vui lòng bật Định vị (GPS) trong cài đặt nhanh hoặc Cài đặt → Vị trí.',
          openLocationSettings: true,
        );
        return;
      }

      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (!mounted) return;

      if (perm == LocationPermission.deniedForever) {
        // User đã chọn "Don't ask again" → không thể request thêm, chỉ vào Settings
        await _showPermissionDialog(
          title: 'Cần quyền vị trí',
          message: 'Bạn đã từ chối quyền vị trí vĩnh viễn. Mở Cài đặt → Quyền → Vị trí và bật cho Trao Tay.',
          openAppSettings: true,
        );
        return;
      }
      if (perm == LocationPermission.denied) {
        // User vừa từ chối → giải thích lý do cần quyền
        await _showPermissionDialog(
          title: 'Trao Tay cần quyền vị trí',
          message: 'Để tự động ghim vị trí món đồ, app cần truy cập GPS của bạn. Vui lòng cấp quyền.',
          retry: _moveToMyLocation,
        );
        return;
      }

      // Có quyền + GPS bật → lấy vị trí
      final pos = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(const Duration(seconds: 8));
      if (!mounted) return;
      final latLng = LatLng(pos.latitude, pos.longitude);
      _mapController.move(latLng, 15);
      _onMapTap(latLng); // Reverse geocode để hiện địa chỉ
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không lấy được vị trí: ${e.toString()}')),
      );
    }
  }

  /// Dialog yêu cầu quyền vị trí với CTA rõ ràng. Tuỳ tham số:
  /// - [openAppSettings]: mở Cài đặt → Quyền của app (cho deniedForever).
  /// - [openLocationSettings]: mở Cài đặt → Vị trí hệ thống (cho GPS off).
  /// - [retry]: callback để thử lại sau khi user cấp quyền.
  ///
  /// UI đồng nhất với theme app: rounded 20, primary button full width, icon
  /// vị trí ở title (visual cue user hiểu liên quan GPS).
  Future<void> _showPermissionDialog({
    required String title,
    required String message,
    bool openAppSettings = false,
    bool openLocationSettings = false,
    Future<void> Function()? retry,
  }) async {
    return showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.45),
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: Colors.white,
        insetPadding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Icon tròn primary nhạt
              Center(
                child: Container(
                  width: 56, height: 56,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.location_on_outlined, size: 30, color: AppTheme.primary),
                ),
              ),
              const SizedBox(height: 16),
              // Title
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              // Message
              Text(
                message,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              // Primary action
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    if (retry != null) {
                      await retry();
                    } else if (openAppSettings) {
                      await Geolocator.openAppSettings();
                    } else if (openLocationSettings) {
                      await Geolocator.openLocationSettings();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    retry != null ? 'Thử lại' : 'Mở Cài đặt',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              // Secondary action (Huỷ)
              SizedBox(
                height: 44,
                child: TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: TextButton.styleFrom(
                    foregroundColor: AppTheme.textSecondary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Huỷ', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _openProvinceSheet() async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => _ProvinceSearchSheet(currentName: _cityName),
    );
    if (picked == null) return;
    final pos = ProvinceCoords.data[picked];
    if (pos == null) return;
    _moveToCity(picked, pos);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ghim vị trí món đồ'),
        backgroundColor: Colors.white,
        elevation: 1,
      ),
      body: Stack(
        children: [
          // Bản đồ OpenStreetMap
          FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: _selectedPos,
              initialZoom: 13,
              onTap: (_, latLng) => _onMapTap(latLng),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'vn.traotay.app',
              ),
              MarkerLayer(
                markers: [
                  Marker(
                    point: _selectedPos,
                    width: 50,
                    height: 50,
                    child: const Icon(Icons.location_on, size: 50, color: Colors.red),
                  ),
                ],
              ),
            ],
          ),

          // Chọn tỉnh/thành nhanh — tap mở bottom sheet 34 tỉnh có search
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              elevation: 4,
              shadowColor: Colors.black.withOpacity(0.1),
              child: InkWell(
                onTap: _openProvinceSheet,
                borderRadius: BorderRadius.circular(10),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  child: Row(
                    children: [
                      const Icon(Icons.location_city, size: 18, color: AppTheme.primary),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _cityName,
                          style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const Icon(Icons.keyboard_arrow_down, size: 20, color: AppTheme.textSecondary),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // FAB "Vị trí của tôi" — bay map đến GPS hiện tại
          Positioned(
            top: 80,
            right: 12,
            child: Material(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              elevation: 4,
              shadowColor: Colors.black.withOpacity(0.15),
              child: InkWell(
                onTap: _moveToMyLocation,
                borderRadius: BorderRadius.circular(24),
                child: const Padding(
                  padding: EdgeInsets.all(10),
                  child: Icon(Icons.my_location, color: AppTheme.primary, size: 24),
                ),
              ),
            ),
          ),

          // Hướng dẫn
          Positioned(
            bottom: 110,
            left: 0, right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Tap vào bản đồ để chọn vị trí',
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
            ),
          ),

          // Toạ độ đã chọn
          Positioned(
            bottom: 82,
            left: 16, right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(children: [
                const Icon(Icons.pin_drop_outlined, size: 16, color: AppTheme.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: _isGeocoding
                      ? const Text('Đang xác định địa chỉ...', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary))
                      : Text(
                          _displayAddress,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                ),
              ]),
            ),
          ),

          // Nút xác nhận
          Positioned(
            bottom: 24,
            left: 16, right: 16,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                minimumSize: const Size(double.infinity, 50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: _isGeocoding ? null : () {
                Navigator.pop(context, {
                  'latlng': _selectedPos,
                  'address': _displayAddress,
                  'province': _province,
                  'district': _district,
                  'ward': _ward,
                  'latitude': _selectedPos.latitude,
                  'longitude': _selectedPos.longitude,
                });
              },

              icon: const Icon(Icons.check, color: Colors.white),
              label: const Text('XÁC NHẬN VỊ TRÍ', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProvinceSearchSheet extends StatefulWidget {
  final String currentName;
  const _ProvinceSearchSheet({required this.currentName});

  @override
  State<_ProvinceSearchSheet> createState() => _ProvinceSearchSheetState();
}

class _ProvinceSearchSheetState extends State<_ProvinceSearchSheet> {
  String _query = '';

  // Bỏ dấu để search không phụ thuộc dấu (vd "binh duong" tìm ra "Bình Dương")
  static String _stripDiacritics(String s) {
    const from = 'àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ';
    const to   = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD';
    final buf = StringBuffer();
    for (final ch in s.runes) {
      final i = from.indexOf(String.fromCharCode(ch));
      buf.write(i < 0 ? String.fromCharCode(ch) : to[i]);
    }
    return buf.toString().toLowerCase();
  }

  bool _match(String name) {
    if (_query.isEmpty) return true;
    return _stripDiacritics(name).contains(_stripDiacritics(_query));
  }

  @override
  Widget build(BuildContext context) {
    final allNames = ProvinceCoords.data.keys.toList();
    final popular = ProvinceCoords.popular.where(_match).toList();
    final others = allNames
        .where((n) => !ProvinceCoords.popular.contains(n) && _match(n))
        .toList()
      ..sort();

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: Column(
          children: [
            // Drag handle
            Container(
              margin: const EdgeInsets.only(top: 8),
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Text(
                'Chọn tỉnh / thành phố',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
              ),
            ),

            // Search box
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                autofocus: false,
                onChanged: (v) => setState(() => _query = v),
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search, size: 20),
                  hintText: 'Tìm tỉnh / thành (vd: Bình Dương, Lao Cai)',
                  hintStyle: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                  filled: true,
                  fillColor: AppTheme.background,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 0),
                ),
              ),
            ),

            const SizedBox(height: 8),

            // List
            Expanded(
              child: ListView(
                children: [
                  if (popular.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 12, 16, 6),
                      child: Text('Phổ biến', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                    ),
                    ...popular.map((n) => _ProvinceTile(name: n, selected: n == widget.currentName)),
                  ],
                  if (others.isNotEmpty) ...[
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 16, 16, 6),
                      child: Text('Tất cả', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary)),
                    ),
                    ...others.map((n) => _ProvinceTile(name: n, selected: n == widget.currentName)),
                  ],
                  if (popular.isEmpty && others.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(32),
                      child: Center(
                        child: Text('Không tìm thấy tỉnh nào', style: TextStyle(color: AppTheme.textSecondary)),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProvinceTile extends StatelessWidget {
  final String name;
  final bool selected;
  const _ProvinceTile({required this.name, required this.selected});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pop(context, name),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(
          children: [
            Icon(
              selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
              size: 18,
              color: selected ? AppTheme.primary : AppTheme.textSecondary,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                name,
                style: TextStyle(
                  fontSize: 15,
                  color: AppTheme.textPrimary,
                  fontWeight: selected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
