import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geocoding/geocoding.dart';

class MapPickerScreen extends StatefulWidget {
  const MapPickerScreen({super.key});
  @override
  State<MapPickerScreen> createState() => _MapPickerScreenState();
}

class _MapPickerScreenState extends State<MapPickerScreen> {
  LatLng _lastPos = const LatLng(21.0285, 105.8542); // Mặc định Hà Nội
  String _address = "Đang xác định...";
  String _province = "";
  String _district = "";
  String _ward = "";

  // HÀM QUAN TRỌNG: Lấy thông tin chi tiết Phường/Quận/Tỉnh
  Future<void> _updateAddress(LatLng pos) async {
    try {
      List<Placemark> p = await placemarkFromCoordinates(pos.latitude, pos.longitude);
      if (p.isNotEmpty) {
        Placemark place = p[0];
        setState(() {
          _province = place.administrativeArea ?? "";
          _district = place.subAdministrativeArea ?? "";
          _ward = place.subLocality ?? "";
          _address = "${place.street}, $_ward, $_district, $_province";
        });
      }
    } catch (e) {
      setState(() => _address = "Không xác định được địa chỉ");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Ghim vị trí món đồ"), backgroundColor: Colors.white, elevation: 1),
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(target: _lastPos, zoom: 16),
            myLocationEnabled: true,
            onCameraMove: (pos) => _lastPos = pos.target,
            onCameraIdle: () => _updateAddress(_lastPos), // Dừng lướt mới lấy địa chỉ
          ),
          // Marker tâm cố định
          const Center(child: Padding(padding: EdgeInsets.only(bottom: 35), child: Icon(Icons.location_on, size: 50, color: Colors.red))),
          // Hiển thị địa chỉ trên cùng
          Positioned(
            top: 20, left: 15, right: 15,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8), boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 5)]),
              child: Text(_address, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
          // Nút xác nhận trả về toàn bộ Object cho màn hình Đăng tin
          Positioned(
            bottom: 40, left: 50, right: 50,
            child: SizedBox(
              height: 50,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                onPressed: () {
                  // ĐÚNG LUẬT: Trả về Map chứa đủ thông tin Backend cần
                  Navigator.pop(context, {
                    "latlng": _lastPos,
                    "address": _address,
                    "province": _province,
                    "district": _district,
                    "ward": _ward,
                  });
                },
                child: const Text("XÁC NHẬN VỊ TRÍ", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}