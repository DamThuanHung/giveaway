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
  // Đã sửa từ imageUrl thành images (dạng danh sách) để khớp với PostCard
  final List<String>? images;

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
  });

  // TẠO LỐI TẮT: Giúp các màn hình cũ dùng "imageUrl" vẫn không bị lỗi
  String? get imageUrl => (images != null && images!.isNotEmpty) ? images![0] : null;

  bool get isFree => listingType == 'free';
  bool get isAvailable => status == 'available';
  bool get isReserved => status == 'reserved';
  bool get isDone => status == 'done';

  String get listingTypeLabel {
    switch (listingType) {
      case 'free': return 'Cho tặng';
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
    final parts = [
      addressDetail.trim(),
      ward.trim(),
      district.trim(),
      province.trim(),
    ].where((part) => part.isNotEmpty).toList();
    return parts.isEmpty ? 'Chưa cập nhật' : parts.join(', ');
  }

  String get displayPrice => listingType == 'free' ? 'Miễn phí' : '${price}đ';

  factory Post.fromJson(Map<String, dynamic> json) {
    // Xử lý giá
    final rawPrice = json['price'];
    int parsedPrice = 0;
    if (rawPrice is int) parsedPrice = rawPrice;
    else if (rawPrice is double) parsedPrice = rawPrice.round();
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
      images: imageList, // Gán danh sách ảnh vào đây
    );
  }
}