import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
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

  // Danh sách tỉnh thành phổ biến để chọn nhanh
  static const _cities = [
    ('Hà Nội', LatLng(21.0285, 105.8542)),
    ('TP. Hồ Chí Minh', LatLng(10.7769, 106.7009)),
    ('Đà Nẵng', LatLng(16.0544, 108.2022)),
    ('Hải Phòng', LatLng(20.8449, 106.6881)),
    ('Cần Thơ', LatLng(10.0452, 105.7469)),
    ('Huế', LatLng(16.4637, 107.5909)),
    ('Nha Trang', LatLng(12.2388, 109.1968)),
  ];

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
      final province = (addr['city'] ?? addr['state'] ?? _cityName).toString();

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
                userAgentPackageName: 'vn.chovatang.app',
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

          // Chọn thành phố nhanh
          Positioned(
            top: 12,
            left: 12,
            right: 12,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 6)],
              ),
              child: Row(
                children: [
                  const Icon(Icons.location_city, size: 18, color: AppTheme.primary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _cityName,
                        isExpanded: true,
                        style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                        items: _cities.map((c) => DropdownMenuItem(value: c.$1, child: Text(c.$1))).toList(),
                        onChanged: (name) {
                          if (name == null) return;
                          final city = _cities.firstWhere((c) => c.$1 == name);
                          _moveToCity(city.$1, city.$2);
                        },
                      ),
                    ),
                  ),
                ],
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
