import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Design System v2 — "Vietnamese Warm Minimal"
///
/// Port từ web (web/tailwind.config.ts) để 2 platform đồng bộ visual identity.
/// - Primary scale 50-900 thay vì 3 const cũ
/// - Cream warm #FFFBF5 làm background thay xám lạnh
/// - Ink scale thay textSecondary/border ad-hoc
/// - Radius 3 cấp (sm/md/lg) + shadow tinted primary mờ + motion timing
///
/// Backwards compat: giữ các const cũ (primary, primaryDark, primaryLight,
/// background, surface, border, textPrimary, textSecondary, etc) nên code
/// hiện có chưa refactor vẫn chạy bình thường. Widget mới dùng tokens v2.
class AppTheme {
  // ═══════════════════════════════════════════════════════════════════
  // PHASE C v2 TOKENS
  // ═══════════════════════════════════════════════════════════════════

  // ─── Primary scale (Emerald 50-900) ───────────────────
  static const Color primary50  = Color(0xFFECFDF5);
  static const Color primary100 = Color(0xFFD1FAE5);
  static const Color primary200 = Color(0xFFA7F3D0);
  static const Color primary300 = Color(0xFF6EE7B7);
  static const Color primary400 = Color(0xFF34D399);
  static const Color primary500 = Color(0xFF10B981); // = primary
  static const Color primary600 = Color(0xFF059669); // = primaryDark
  static const Color primary700 = Color(0xFF047857);
  static const Color primary800 = Color(0xFF065F46);
  static const Color primary900 = Color(0xFF064E3B);

  // ─── Cream warm scale ─────────────────────────────────
  static const Color cream      = Color(0xFFFFFBF5); // body bg ấm thay xám lạnh
  static const Color cream50    = Color(0xFFFFFEFB);
  static const Color cream100   = Color(0xFFFFFBF5);
  static const Color cream200   = Color(0xFFFDF6E9);
  static const Color cream300   = Color(0xFFF9EFDC);

  // ─── Ink scale (text + border + surface mute) ────────
  static const Color ink50  = Color(0xFFFAFAFC);
  static const Color ink100 = Color(0xFFF4F4F8);
  static const Color ink200 = Color(0xFFE5E5EE);
  static const Color ink300 = Color(0xFFCFCFDD); // = border (mới)
  static const Color ink400 = Color(0xFFA8A8BD);
  static const Color ink500 = Color(0xFF7A7A92); // = textSecondary thay #6B7280
  static const Color ink600 = Color(0xFF52526B);
  static const Color ink700 = Color(0xFF2D2D44);
  static const Color ink800 = Color(0xFF1A1A2E); // = textPrimary
  static const Color ink900 = Color(0xFF0F0F1B);

  // ─── Radius scale ─────────────────────────────────────
  static const double radiusSm = 6;
  static const double radiusMd = 12; // default cho card/button/input
  static const double radiusLg = 16;
  static const double radiusXl = 20;

  // ─── Shadow scale (tinted primary mờ thay đen tinh) ───
  static const List<BoxShadow> shadowSoft = [
    BoxShadow(color: Color(0x0A10B981), blurRadius: 2, offset: Offset(0, 1)),
    BoxShadow(color: Color(0x0D0F0F1B), blurRadius: 3, offset: Offset(0, 1)),
  ];
  static const List<BoxShadow> shadowCard = [
    BoxShadow(color: Color(0x1210B981), blurRadius: 14, offset: Offset(0, 4)),
    BoxShadow(color: Color(0x0A0F0F1B), blurRadius: 4, offset: Offset(0, 2)),
  ];
  static const List<BoxShadow> shadowElevated = [
    BoxShadow(color: Color(0x1A10B981), blurRadius: 32, offset: Offset(0, 12)),
    BoxShadow(color: Color(0x0F0F0F1B), blurRadius: 12, offset: Offset(0, 4)),
  ];

  // ─── Motion ───────────────────────────────────────────
  static const Curve easeWarm    = Cubic(0.4, 0.0, 0.2, 1.0);
  static const Curve easeBounce  = Cubic(0.68, -0.55, 0.265, 1.55);
  static const Duration durFast    = Duration(milliseconds: 150);
  static const Duration durMedium  = Duration(milliseconds: 250);
  static const Duration durSlow    = Duration(milliseconds: 400);
  static const Duration durSlower  = Duration(milliseconds: 600);

  // ═══════════════════════════════════════════════════════════════════
  // BACKWARDS COMPATIBILITY — alias cho các const cũ
  // (Giữ tất cả widget hiện tại chạy không break)
  // ═══════════════════════════════════════════════════════════════════
  static const Color primary       = primary500;
  static const Color primaryDark   = primary600;
  static const Color primaryLight  = primary100;
  static const Color background    = cream;          // ĐỔI: xám #F2F3F5 → cream warm
  static const Color surface       = Color(0xFFFFFFFF);
  static const Color border        = ink200;         // ĐỔI: #E2E5EA → ink200 #E5E5EE (gần như giống)
  static const Color textPrimary   = ink800;
  static const Color textSecondary = ink500;         // ĐỔI: #6B7280 → ink500 #7A7A92
  static const Color success       = Color(0xFF22C55E);
  static const Color warning       = Color(0xFFF59E0B);
  static const Color error         = Color(0xFFEF4444);

  // ─── Semantic colors (VN marketplace) ────────────────
  static const Color priceColor    = Color(0xFFE53935);
  static const Color freeColor     = primary500;
  static const Color soldColor     = Color(0xFF9E9E9E);
  static const Color ctaOrange     = Color(0xFFF57C00);

  // ─── Gold tokens (Bump VIP/Plus tier) ────────────────
  static const Color goldDark   = Color(0xFFC9A84A);
  static const Color goldLight  = Color(0xFFF4D36A);
  static const Color goldOrange = Color(0xFFFFa500);

  // ─── Theme ────────────────────────────────────────────
  static ThemeData get light {
    final beVietnamPro = GoogleFonts.beVietnamProTextTheme();
    return ThemeData(
      colorScheme: ColorScheme.fromSeed(seedColor: primary),
      scaffoldBackgroundColor: background, // = cream warm
      useMaterial3: true,
      textTheme: beVietnamPro,
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        elevation: 0,
        scrolledUnderElevation: 1,
        centerTitle: true,
        titleTextStyle: GoogleFonts.beVietnamPro(
          color: textPrimary,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: textPrimary),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surface,
        selectedItemColor: primary,
        unselectedItemColor: textSecondary,
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 52),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(radiusMd),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: cream100, // ĐỔI: surface trắng → cream100 ấm
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: ink200),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: ink200),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(radiusMd),
          borderSide: const BorderSide(color: primary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      cardTheme: const CardTheme(
        color: surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(radiusMd)),
          side: BorderSide(color: ink200),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSm)),
      ),
    );
  }
}
