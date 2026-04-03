import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:cho_va_tang/main.dart';

void main() {
  testWidgets('App khởi động và hiển thị màn hình chính', (WidgetTester tester) async {
    // Đảm bảo tên lớp ở đây khớp với file main.dart (ChoVaTangApp)
    await tester.pumpWidget(const ChoVaTangApp());

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}