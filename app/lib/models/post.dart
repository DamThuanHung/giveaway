class Post {
  final String id;
  final String title;
  final String description;
  final int price;

  final String province;
  final String district;
  final String ward;
  final String addressDetail;

  final String listingType;
  final String itemCategory;
  final String status;

  final String imageLabel;
  final List<String>? images;

  final double latitude;
  final double longitude;

  final String? authorId;
  final String? authorName;
  final String? authorAvatar;
  final DateTime? createdAt;
  final int viewCount;
  final DateTime? bumpedAt;
  final int boostTier; // 0=none 1=free-bump 2=plus 3=vip (PayOS sẽ fill khi done)

  // BĐS & Dịch vụ
  final String postType;      // item | realestate | service
  final String? subType;      // rent | sell (BĐS)
  final double? area;         // m²
  final int? bedrooms;
  final String? priceUnit;    // month | total | sqm | hour | day
  final String? serviceArea;

  Post({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.province,
    required this.district,
    required this.ward,
    required this.addressDetail,
    required this.listingType,
    required this.itemCategory,
    required this.status,
    required this.imageLabel,
    this.images,
    this.latitude = 0.0,
    this.longitude = 0.0,
    this.authorId,
    this.authorName,
    this.authorAvatar,
    this.createdAt,
    this.viewCount = 0,
    this.bumpedAt,
    this.boostTier = 0,
    this.postType = 'item',
    this.subType,
    this.area,
    this.bedrooms,
    this.priceUnit,
    this.serviceArea,
  });

  /// Thời gian tương đối — dùng trên badge ảnh PostCard
  String get timeAgo {
    if (createdAt == null) return '';
    final diff = DateTime.now().difference(createdAt!);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return formattedDate;
  }

  /// Format ngày đăng — dùng trong card kết quả: "09/04/2026"
  String get formattedDate {
    if (createdAt == null) return '';
    final d = createdAt!.toLocal();
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';
  }

  /// Format ngày giờ đăng — dùng trong chi tiết: "09/04/2026 14:30"
  String get formattedDateTime {
    if (createdAt == null) return '';
    final d = createdAt!.toLocal();
    final time = '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    return '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year} $time';
  }

  // TẠO LỐI TẮT: Giúp các màn hình cũ dùng "imageUrl" vẫn không bị lỗi
  String? get imageUrl => (images != null && images!.isNotEmpty) ? images![0] : null;

  bool get isRealestate => postType == 'realestate';
  bool get isService => postType == 'service';
  bool get isJob => postType == 'job';

  String get subTypeLabel {
    switch (subType) {
      case 'rent': return 'Cho thuê';
      case 'sell': return 'Bán';
      // Job types
      case 'full-time': return 'Toàn thời gian';
      case 'part-time': return 'Bán thời gian';
      case 'freelance': return 'Freelance';
      case 'intern': return 'Thực tập';
      case 'remote': return 'Remote';
      default: return '';
    }
  }

  String get priceUnitLabel {
    switch (priceUnit) {
      case 'month': return '/tháng';
      case 'total': return '';
      case 'sqm': return '/m²';
      case 'hour': return '/giờ';
      case 'day': return '/ngày';
      default: return '';
    }
  }

  /// Tên công ty (jobs dùng field serviceArea để lưu)
  String? get companyName => isJob ? serviceArea : null;

  /// Duration (giờ) boost có hiệu lực theo tier: free 24h, Plus 72h, VIP 168h
  int get _boostDurationHours {
    switch (boostTier) {
      case 3: return 168; // VIP 7 ngày
      case 2: return 72;  // Plus 3 ngày
      default: return 24; // Free 24h
    }
  }

  bool get isBoosted {
    if (bumpedAt == null) return false;
    return DateTime.now().difference(bumpedAt!).inHours < _boostDurationHours;
  }

  /// Tier hiệu lực: ưu tiên boostTier từ API, fallback về free-bump
  int get effectiveTier => boostTier > 0 ? boostTier : (isBoosted ? 1 : 0);

  /// null = có thể đẩy; non-null = đang boost hoặc cooldown, trả về chuỗi "Còn Xd Yh" hoặc "Còn Xg Yp"
  String? get bumpCountdown {
    if (bumpedAt == null) return null;
    final remaining = bumpedAt!.add(Duration(hours: _boostDurationHours)).difference(DateTime.now());
    if (remaining.isNegative) return null;
    final days = remaining.inDays;
    final hours = remaining.inHours % 24;
    final minutes = remaining.inMinutes % 60;
    if (days > 0) return 'Còn $days ngày $hours giờ';
    if (remaining.inHours > 0) return 'Còn ${remaining.inHours}g ${minutes}p';
    return 'Còn $minutes phút';
  }

  bool get isFree => listingType == 'give' || listingType == 'free';
  bool get isAvailable => status == 'available';
  bool get isReserved => status == 'reserved';
  bool get isDone => status == 'done';

  String get listingTypeLabel {
    switch (listingType) {
      case 'give':
      case 'free': return 'Tặng miễn phí';
      case 'sell': return 'Thanh lý';
      default: return 'Khác';
    }
  }

  String get itemCategoryLabel {
    switch (itemCategory) {
      case 'furniture': return 'Nội thất';
      case 'appliances': return 'Gia dụng';
      case 'bicycle': return 'Xe đạp';
      case 'motorbike': return 'Xe máy';
      case 'computer': return 'Máy tính';
      case 'phone': return 'Điện thoại';
      case 'fashion': return 'Thời trang';
      default: return 'Khác';
    }
  }

  String get statusLabel {
    switch (status) {
      case 'available': return 'Còn hàng';
      case 'reserved': return 'Đang giữ';
      case 'done': return 'Đã xong';
      default: return 'Còn hàng';
    }
  }

  String get fullAddress {
    final raw = [
      addressDetail.trim(),
      ward.trim(),
      district.trim(),
      province.trim(),
    ].where((s) => s.isNotEmpty).toList();
    // Loại bỏ phần tử trùng với phần tử liền sau
    final parts = <String>[];
    for (final s in raw) {
      if (parts.isEmpty || parts.last != s) parts.add(s);
    }
    return parts.isEmpty ? 'Chưa cập nhật' : parts.join(', ');
  }

  String get displayPrice => listingType == 'free' ? 'Miễn phí' : '$priceđ';

  Post copyWith({String? status, DateTime? bumpedAt, bool clearBumpedAt = false}) {
    return Post(
      id: id, title: title, description: description, price: price,
      province: province, district: district, ward: ward, addressDetail: addressDetail,
      listingType: listingType, itemCategory: itemCategory,
      status: status ?? this.status,
      imageLabel: imageLabel, images: images,
      latitude: latitude, longitude: longitude,
      authorId: authorId, authorName: authorName, authorAvatar: authorAvatar,
      createdAt: createdAt, viewCount: viewCount,
      bumpedAt: clearBumpedAt ? null : (bumpedAt ?? this.bumpedAt),
      boostTier: boostTier,
      postType: postType, subType: subType, area: area, bedrooms: bedrooms,
      priceUnit: priceUnit, serviceArea: serviceArea,
    );
  }

  factory Post.fromJson(Map<String, dynamic> json) {
    // Xử lý giá
    final rawPrice = json['price'];
    int parsedPrice = 0;
    if (rawPrice is int) {
      parsedPrice = rawPrice;
    } else if (rawPrice is double) parsedPrice = rawPrice.round();
    else if (rawPrice is String) parsedPrice = int.tryParse(rawPrice.trim()) ?? 0;

    // Xử lý địa chỉ
    String province = json['province']?.toString().trim() ?? '';
    String district = json['district']?.toString().trim() ?? '';
    String ward = json['ward']?.toString().trim() ?? '';
    String addressDetail = json['addressDetail']?.toString().trim() ?? '';
    final legacyLocation = json['location']?.toString().trim() ?? '';

    if (province.isEmpty && district.isEmpty && ward.isEmpty && addressDetail.isEmpty && legacyLocation.isNotEmpty) {
      addressDetail = legacyLocation;
    }

    // Xử lý danh sách ảnh từ Backend gửi về
    List<String> imageList = [];
    if (json['images'] != null && json['images'] is List) {
      imageList = List<String>.from(json['images']);
    }
    // Fallback: dùng imageUrl hoặc imageLabel nếu images rỗng
    if (imageList.isEmpty) {
      final url = json['imageUrl']?.toString() ?? '';
      if (url.isNotEmpty) {
        imageList = [url];
      } else {
        final label = json['imageLabel']?.toString() ?? '';
        if (label.startsWith('http')) imageList = [label];
      }
    }

    final author = json['author'];

    return Post(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? 'Không có tiêu đề',
      description: json['description']?.toString() ?? '',
      price: parsedPrice,
      province: province,
      district: district,
      ward: ward,
      addressDetail: addressDetail,
      listingType: json['listingType']?.toString().isNotEmpty == true ? json['listingType'] : 'sell',
      itemCategory: json['itemCategory']?.toString().isNotEmpty == true ? json['itemCategory'] : 'other',
      status: json['status']?.toString().isNotEmpty == true ? json['status'] : 'available',
      imageLabel: json['imageLabel']?.toString() ?? '',
      images: imageList,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0.0,
      authorId: json['authorId']?.toString() ?? author?['id']?.toString(),
      authorName: author?['name']?.toString(),
      authorAvatar: author?['avatar']?.toString(),
      createdAt: json['createdAt'] != null ? DateTime.tryParse(json['createdAt'].toString()) : null,
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      bumpedAt: json['bumpedAt'] != null ? DateTime.tryParse(json['bumpedAt'].toString()) : null,
      boostTier: (json['boostTier'] as num?)?.toInt() ?? 0,
      postType: json['postType']?.toString().isNotEmpty == true ? json['postType'] : 'item',
      subType: json['subType']?.toString(),
      area: (json['area'] as num?)?.toDouble(),
      bedrooms: (json['bedrooms'] as num?)?.toInt(),
      priceUnit: json['priceUnit']?.toString(),
      serviceArea: json['serviceArea']?.toString(),
    );
  }
}