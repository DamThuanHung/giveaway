import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary = Color(0xFF1B4EA3);
  static const Color border = Color(0xFFE2E5EA);

  static ThemeData get light {
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: primary),
      scaffoldBackgroundColor: const Color(0xFFF7F8FA),
      useMaterial3: true,
    );
  }
}