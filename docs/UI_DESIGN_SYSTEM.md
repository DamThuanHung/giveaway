# UI DESIGN SYSTEM — Hệ thống thiết kế giao diện

> **Mục đích:** Mọi màn hình, widget, component trong Flutter app PHẢI tuân thủ file này.
> AI phải đọc file này trước khi viết bất kỳ UI code nào.

---

## 1. Màu sắc (Color Palette)

```dart
// Nguồn: app/lib/theme/app_theme.dart
```

| Token | Hex | Dùng cho |
|---|---|---|
| `primary` | `#1B4EA3` | Nút chính, AppBar, icon active |
| `primaryLight` | `#E8EEFA` | Background chip, tag selected |
| `background` | `#F7F8FA` | Scaffold background toàn app |
| `surface` | `#FFFFFF` | Card, BottomSheet, Dialog |
| `border` | `#E2E5EA` | Divider, border input, card border |
| `textPrimary` | `#1A1A2E` | Tiêu đề, nội dung chính |
| `textSecondary` | `#6B7280` | Phụ đề, metadata, placeholder |
| `success` | `#22C55E` | Badge "Tặng miễn phí", trạng thái OK |
| `warning` | `#F59E0B` | Cảnh báo, giá tiền |
| `error` | `#EF4444` | Lỗi, xóa, báo cáo |
| `overlay` | `#00000066` | Overlay ảnh, modal backdrop |

### Quy tắc màu sắc
- **KHÔNG** dùng màu hardcode trong widget — luôn dùng token từ `AppTheme` hoặc `Theme.of(context)`
- `listingType: give` → hiển thị badge màu `success` ("Miễn phí")
- `listingType: sell` → hiển thị giá màu `warning`
- Nút destructive (xóa, báo cáo) → màu `error`

---

## 2. Typography (Kiểu chữ)

| Style | Size | Weight | Dùng cho |
|---|---|---|---|
| `headlineLarge` | 24sp | Bold (700) | Tên app, màn hình chào |
| `headlineMedium` | 20sp | SemiBold (600) | Tiêu đề màn hình (AppBar title) |
| `titleLarge` | 18sp | SemiBold (600) | Tiêu đề bài đăng, section header |
| `titleMedium` | 16sp | Medium (500) | Tên người dùng, label form |
| `bodyLarge` | 15sp | Regular (400) | Nội dung mô tả |
| `bodyMedium` | 14sp | Regular (400) | Nội dung thứ cấp, metadata |
| `bodySmall` | 12sp | Regular (400) | Timestamp, hint text |
| `labelLarge` | 14sp | SemiBold (600) | Text trong Button |
| `labelSmall` | 11sp | Medium (500) | Badge, chip, tag |

### Quy tắc typography
- Font mặc định: hệ thống (Roboto trên Android, SF Pro trên iOS)
- Line height: 1.4× font size
- **KHÔNG** dùng `TextStyle` inline — dùng `Theme.of(context).textTheme.*`
- Số dòng tối đa cho tiêu đề bài đăng trong card: **2 dòng** (`maxLines: 2, overflow: TextOverflow.ellipsis`)

---

## 3. Spacing & Layout

### Grid system
- Base unit: **4px**
- Padding màn hình: `16px` (left, right)
- Gap giữa các section: `16px`
- Gap giữa các item nhỏ: `8px`

### Spacing tokens
| Token | Value | Dùng cho |
|---|---|---|
| `xs` | 4px | Gap icon + text, padding nhỏ |
| `sm` | 8px | Padding internal card, gap item |
| `md` | 16px | Padding màn hình, section gap |
| `lg` | 24px | Khoảng cách section lớn |
| `xl` | 32px | Padding top màn hình login |

### Border Radius
| Component | Radius |
|---|---|
| Card bài đăng | `12px` |
| Button chính | `10px` |
| Input field | `10px` |
| Chip / Tag / Badge | `20px` (pill) |
| Avatar | `50%` (tròn) |
| BottomSheet | `20px` (top) |
| Dialog | `16px` |
| Thumbnail nhỏ | `8px` |

---

## 4. Component Patterns

### 4.1 PostCard (Card bài đăng)
```
┌─────────────────────────────┐
│  [Ảnh 4:3 hoặc 1:1]        │
│  [Badge: Miễn phí/Giá tiền] │ ← overlay góc trái dưới ảnh
├─────────────────────────────┤
│  Tiêu đề (max 2 dòng)       │
│  Địa điểm · Thời gian        │
│  [❤ Yêu thích]              │ ← góc phải
└─────────────────────────────┘
```
- Aspect ratio ảnh: **4:3** (không dùng 16:9)
- Badge giá/miễn phí: overlay phía dưới-trái ảnh
- Tap vào card → navigate đến `PostDetailScreen`
- Long-press → không có action (tránh nhầm)

### 4.2 Button
```dart
// Nút chính
ElevatedButton(
  style: ElevatedButton.styleFrom(
    backgroundColor: AppTheme.primary,
    foregroundColor: Colors.white,
    minimumSize: Size(double.infinity, 52),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  ),
)

// Nút phụ
OutlinedButton(
  style: OutlinedButton.styleFrom(
    side: BorderSide(color: AppTheme.primary),
    minimumSize: Size(double.infinity, 52),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
  ),
)
```
- Chiều cao nút: **52px** (đủ tap target)
- Full-width trong form
- Không dùng `TextButton` cho action quan trọng

### 4.3 Input Field
```dart
InputDecoration(
  filled: true,
  fillColor: Colors.white,
  border: OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: AppTheme.border),
  ),
  focusedBorder: OutlineInputBorder(
    borderRadius: BorderRadius.circular(10),
    borderSide: BorderSide(color: AppTheme.primary, width: 1.5),
  ),
  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
)
```

### 4.4 AppBar
```dart
AppBar(
  backgroundColor: Colors.white,
  elevation: 0,
  scrolledUnderElevation: 1,
  centerTitle: true, // Luôn center title
  titleTextStyle: TextStyle(
    color: AppTheme.textPrimary,
    fontSize: 18,
    fontWeight: FontWeight.w600,
  ),
  iconTheme: IconThemeData(color: AppTheme.textPrimary),
)
```
- AppBar LUÔN trắng, chữ đen — không dùng primary color cho AppBar
- Luôn có back button khi không phải root screen

### 4.5 Loading State
```dart
// Toàn màn hình
Center(child: CircularProgressIndicator(color: AppTheme.primary))

// Trong list (pagination)
Padding(
  padding: EdgeInsets.all(16),
  child: Center(child: CircularProgressIndicator()),
)

// Nút đang xử lý
ElevatedButton(
  onPressed: null, // disable
  child: SizedBox(
    width: 20, height: 20,
    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
  ),
)
```

### 4.6 Empty State
```dart
// Khi list rỗng
Center(
  child: Column(
    mainAxisAlignment: MainAxisAlignment.center,
    children: [
      Icon(Icons.inbox_outlined, size: 64, color: Colors.grey[300]),
      SizedBox(height: 16),
      Text('Chưa có dữ liệu', style: bodyMedium.copyWith(color: textSecondary)),
    ],
  ),
)
```

### 4.7 Error State
```dart
Center(
  child: Column(
    children: [
      Icon(Icons.wifi_off, size: 64, color: Colors.grey[300]),
      SizedBox(height: 16),
      Text('Không thể tải dữ liệu', ...),
      SizedBox(height: 16),
      OutlinedButton(onPressed: retry, child: Text('Thử lại')),
    ],
  ),
)
```

### 4.8 SnackBar / Toast
```dart
// Thành công
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(
    content: Text('Thành công!'),
    backgroundColor: AppTheme.success,
    behavior: SnackBarBehavior.floating,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
  ),
);

// Lỗi
// backgroundColor: AppTheme.error
```
- **LUÔN** dùng `floating` behavior
- Không dùng Alert Dialog cho thông báo đơn giản — dùng SnackBar

### 4.9 Ảnh bài đăng
```dart
// URL chuẩn
String imageUrl = '${ApiService.baseUrl}/uploads/$filename';

// Luôn có errorBuilder
Image.network(
  imageUrl,
  fit: BoxFit.cover,
  errorBuilder: (context, error, stackTrace) => Container(
    color: Colors.grey[100],
    child: Icon(Icons.broken_image_outlined, color: Colors.grey[400]),
  ),
  loadingBuilder: (context, child, progress) =>
    progress == null ? child : Center(child: CircularProgressIndicator()),
)
```

---

## 5. Navigation & Bottom Bar

### Bottom Navigation (4 tabs)
| Tab | Icon | Label |
|---|---|---|
| 0 | `Icons.home_outlined` / `Icons.home` | Trang chủ |
| 1 | `Icons.add_circle_outline` / `Icons.add_circle` | Đăng tin |
| 2 | `Icons.favorite_outline` / `Icons.favorite` | Yêu thích |
| 3 | `Icons.chat_bubble_outline` / `Icons.chat_bubble` | Tin nhắn |
| 4 | `Icons.person_outline` / `Icons.person` | Hồ sơ |

- Icon unselected: `outline` variant
- Icon selected: `filled` variant + màu `primary`
- Label luôn hiển thị (không ẩn label)

### Navigation rules
- Push màn hình mới: `Navigator.push(...)`
- Back về tab gốc: `Navigator.popUntil(context, (r) => r.isFirst)`
- Không nested Navigator trừ khi thực sự cần

---

## 6. List & Grid Layout

### Màn hình Home (danh sách bài đăng)
- Layout: **GridView 2 cột** (mobile portrait)
- `crossAxisSpacing: 8`, `mainAxisSpacing: 8`
- Padding ngoài: `16px`

### Danh sách tin nhắn
- Layout: **ListView** (1 cột)
- Item height: 72px
- Avatar: 48px tròn bên trái

---

## 7. Icon Guidelines

- Icon set: **Material Icons** (đã có trong Flutter)
- Kích thước icon thông thường: `24px`
- Kích thước icon trong card nhỏ: `20px`
- Kích thước icon empty state: `64px`
- **KHÔNG** dùng icon package bên thứ ba trừ khi được approve

---

## 8. Accessibility & Polish

- Tap target tối thiểu: **48×48px**
- Luôn có `tooltip` cho icon button
- Text contrast ratio ≥ 4.5:1
- Màn hình có scroll → dùng `CustomScrollView` hoặc `SingleChildScrollView` + `physics: BouncingScrollPhysics()`
- Keyboard avoidance: `resizeToAvoidBottomInset: true` (default)
- Tất cả list phải có pull-to-refresh (`RefreshIndicator`)
