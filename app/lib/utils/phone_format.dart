/// Chuẩn hoá số điện thoại người dùng nhập theo mã vùng đã chọn (`+84` VN hoặc
/// `+81` Nhật Bản) thành định dạng E.164 mà Firebase Phone Auth yêu cầu.
/// Dùng chung cho phone_login_screen.dart và link_phone_screen.dart.
String formatPhoneWithDialCode(String raw, String dialCode) {
  final digits = raw.replaceAll(RegExp(r'\D'), '');
  final cc = dialCode.replaceAll('+', ''); // "84" hoặc "81"
  if (digits.startsWith('0')) return '+$cc${digits.substring(1)}';
  if (digits.startsWith(cc)) return '+$digits';
  return '+$cc$digits';
}
