/// Format số tiền VND theo chuẩn người Việt: 1500000 → "1.500.000".
/// Dấu phân cách hàng nghìn là dấu chấm (`.`) — KHÔNG phải phẩy như US.
String formatVndAmount(int amount) {
  if (amount == 0) return '0';
  final s = amount.abs().toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write('.');
    buf.write(s[i]);
  }
  return amount < 0 ? '-${buf.toString()}' : buf.toString();
}

/// Format giá có suffix `đ`: 1500000 → "1.500.000đ".
String formatVndPrice(int amount) => '${formatVndAmount(amount)}đ';

/// Format số tiền Yên Nhật theo chuẩn: 15000 → "¥15,000" (phẩy hàng nghìn, không thập phân).
String formatJpyPrice(int amount) {
  if (amount == 0) return '¥0';
  final s = amount.abs().toString();
  final buf = StringBuffer();
  for (var i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 == 0) buf.write(',');
    buf.write(s[i]);
  }
  final sign = amount < 0 ? '-' : '';
  return '$sign¥$buf';
}

/// Format giá theo quốc gia của bài đăng — "VN" → VNĐ (mặc định), "JP" → Yên.
String formatPrice(int amount, {String country = 'VN'}) =>
    country == 'JP' ? formatJpyPrice(amount) : formatVndPrice(amount);
