import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../theme/app_theme.dart';

class RadiusMapResult {
  final double lat;
  final double lng;
  final double radius; // km
  final String label;

  const RadiusMapResult({required this.lat, required this.lng, required this.radius, required this.label});
}

class RadiusMapPicker extends StatefulWidget {
  final RadiusMapResult? initial;
  final ValueChanged<RadiusMapResult> onConfirm;

  const RadiusMapPicker({super.key, this.initial, required this.onConfirm});

  @override
  State<RadiusMapPicker> createState() => _RadiusMapPickerState();
}

class _RadiusMapPickerState extends State<RadiusMapPicker> {
  final _mapController = MapController();
  LatLng _center = const LatLng(21.0285, 105.8542); // Hà Nội default
  double _radius = 5.0; // km
  bool _locating = false;
  String _label = 'Vị trí hiện tại';

  @override
  void initState() {
    super.initState();
    if (widget.initial != null) {
      _center = LatLng(widget.initial!.lat, widget.initial!.lng);
      _radius = widget.initial!.radius;
      _label = widget.initial!.label;
    } else {
      _detectLocation();
    }
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  Future<void> _detectLocation() async {
    setState(() => _locating = true);
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        setState(() => _locating = false);
        return;
      }
      final pos = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.medium)
          .timeout(const Duration(seconds: 8));
      final latlng = LatLng(pos.latitude, pos.longitude);
      setState(() {
        _center = latlng;
        _label = 'Vị trí hiện tại';
        _locating = false;
      });
      _mapController.move(latlng, 13);
    } catch (_) {
      setState(() => _locating = false);
    }
  }

  String _radiusLabel(double r) {
    if (r < 1) return '${(r * 1000).toStringAsFixed(0)}m';
    return '${r.toStringAsFixed(r == r.roundToDouble() ? 0 : 1)}km';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Map
        Expanded(
          child: Stack(
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: _center,
                  initialZoom: 13,
                  onTap: (_, latlng) {
                    setState(() {
                      _center = latlng;
                      _label = '${latlng.latitude.toStringAsFixed(4)}, ${latlng.longitude.toStringAsFixed(4)}';
                    });
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.chovatang.app',
                  ),
                  // Vòng tròn bán kính
                  CircleLayer(
                    circles: [
                      CircleMarker(
                        point: _center,
                        radius: _radius * 1000, // metres
                        useRadiusInMeter: true,
                        color: AppTheme.primary.withOpacity(0.15),
                        borderColor: AppTheme.primary.withOpacity(0.6),
                        borderStrokeWidth: 2,
                      ),
                    ],
                  ),
                  // Marker trung tâm
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _center,
                        width: 36,
                        height: 36,
                        child: const Icon(Icons.location_pin, color: AppTheme.primary, size: 36),
                      ),
                    ],
                  ),
                ],
              ),

              // Nút GPS
              Positioned(
                bottom: 16, right: 16,
                child: FloatingActionButton.small(
                  backgroundColor: Colors.white,
                  onPressed: _locating ? null : _detectLocation,
                  child: _locating
                      ? const SizedBox(width: 18, height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary))
                      : const Icon(Icons.my_location, color: AppTheme.primary),
                ),
              ),
            ],
          ),
        ),

        // Slider + Info
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Icon(Icons.home_outlined, color: AppTheme.textSecondary, size: 18),
                  Expanded(
                    child: SliderTheme(
                      data: SliderTheme.of(context).copyWith(
                        activeTrackColor: AppTheme.primary,
                        thumbColor: AppTheme.primary,
                        inactiveTrackColor: AppTheme.border,
                        overlayColor: AppTheme.primary.withOpacity(0.1),
                        trackHeight: 3,
                      ),
                      child: Slider(
                        value: _radius,
                        min: 1,
                        max: 50,
                        divisions: 49,
                        onChanged: (v) => setState(() => _radius = v),
                      ),
                    ),
                  ),
                  const Icon(Icons.directions_car_outlined, color: AppTheme.textSecondary, size: 18),
                ],
              ),
              Text(
                'Trong vòng ${_radiusLabel(_radius)} từ vị trí của bạn',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
            ],
          ),
        ),

        // Nút Áp dụng
        Padding(
          padding: EdgeInsets.fromLTRB(20, 8, 20, MediaQuery.of(context).padding.bottom + 12),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () {
                Navigator.pop(context);
                widget.onConfirm(RadiusMapResult(
                  lat: _center.latitude,
                  lng: _center.longitude,
                  radius: _radius,
                  label: '${_radiusLabel(_radius)} quanh $_label',
                ));
              },
              child: const Text('Áp dụng', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
        ),
      ],
    );
  }
}
