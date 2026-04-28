import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:http/http.dart' as http;
import 'package:latlong2/latlong.dart';
import '../../data/province_coords.dart';
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
