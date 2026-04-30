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
