import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Đang xóa dữ liệu cũ...');
  await prisma.review.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.report.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Tạo users...');
  const hash = await bcrypt.hash('password123', 10);

  const [admin, lan, minh, hoa, duc, mai, long, thu] = await Promise.all([
    prisma.user.create({ data: {
      email: 'admin@chovatang.vn', name: 'Admin Hệ thống', password: hash,
      role: 'admin',
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin',
    }}),
    prisma.user.create({ data: {
      email: 'nguyen.thi.lan@gmail.com', name: 'Nguyễn Thị Lan', password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Lan',
    }}),
    prisma.user.create({ data: {
      email: 'tran.van.minh@gmail.com', name: 'Trần Văn Minh', password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Minh',
    }}),
    prisma.user.create({ data: {
      email: 'le.thi.hoa@gmail.com', name: 'Lê Thị Hoa', password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Hoa',
    }}),
    prisma.user.create({ data: {
      email: 'pham.van.duc@gmail.com', name: 'Phạm Văn Đức', password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Duc',
    }}),
    prisma.user.create({ data: {
      email: 'hoang.thi.mai@gmail.com', name: 'Hoàng Thị Mai', password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Mai',
    }}),
    prisma.user.create({ data: {
      email: 'dao.van.long@gmail.com', name: 'Đào Văn Long', password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Long',
    }}),
    prisma.user.create({ data: {
      email: 'bui.thi.thu@gmail.com', name: 'Bùi Thị Thu', password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Thu',
    }}),
  ]);

  console.log(`   ✅ Đã tạo ${8} users`);

  // ─── POSTS ───────────────────────────────────────────
  console.log('📦 Tạo bài đăng...');

  const postsData = [
    // ── Nội thất / Furniture ──
    {
      title: 'Bàn làm việc gỗ tự nhiên IKEA còn mới 90%',
      description: 'Bàn làm việc IKEA mặt gỗ tự nhiên, kích thước 120x60cm. Mua được 1 năm, ít dùng do chuyển nhà. Bề mặt còn đẹp, không xước, không mối mọt. Có thể tháo rời để vận chuyển. Giá gốc 3.5 triệu, bán lại để nhường chỗ.',
      price: 1200000, listingType: 'sell', itemCategory: 'furniture', status: 'available',
      province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng',
      latitude: 21.0285, longitude: 105.8041, viewCount: 47,
      authorId: lan.id,
    },
    {
      title: 'Sofa góc chữ L màu xám, 3 chỗ ngồi',
      description: 'Sofa góc chữ L bọc vải nỉ màu xám. Dùng được 2 năm, còn đàn hồi tốt. Kích thước tổng thể 280x160cm. Lý do bán: nhà tôi chuyển sang sofa da. Người mua tự thuê xe chở, mình hỗ trợ mang ra cửa.',
      price: 2800000, listingType: 'sell', itemCategory: 'furniture', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', ward: 'Phường 25',
      latitude: 10.8087, longitude: 106.7143, viewCount: 83,
      authorId: minh.id,
    },
    {
      title: 'Tủ quần áo 4 cánh màu trắng, tặng kèm móc',
      description: 'Tủ quần áo 4 cánh kích thước 160x55x220cm. Màu trắng sáng, thiết kế hiện đại. Tặng luôn bộ móc áo 20 cái. Trước nhà tiện đường xe tải vào. Ảnh thực tế, không chỉnh sửa.',
      price: 0, listingType: 'give', itemCategory: 'furniture', status: 'available',
      province: 'Hà Nội', district: 'Hoàng Mai', ward: 'Giáp Bát',
      latitude: 20.9904, longitude: 105.8389, viewCount: 156,
      authorId: hoa.id,
    },
    {
      title: 'Kệ sách 5 tầng gỗ MDF, đọc sách rất tiện',
      description: 'Kệ sách 5 tầng bằng gỗ MDF trắng. Chịu tải tốt, đã để sách nặng không bị võng. Kích thước 80x30x180cm. Có vài vết xước nhỏ ở tầng dưới, không ảnh hưởng sử dụng.',
      price: 350000, listingType: 'sell', itemCategory: 'furniture', status: 'reserved',
      province: 'Đà Nẵng', district: 'Thanh Khê', ward: 'Xuân Hà',
      latitude: 16.0670, longitude: 108.1947, viewCount: 29,
      authorId: duc.id,
    },

    // ── Gia dụng / Appliances ──
    {
      title: 'Máy giặt Samsung 8kg Inverter, bền bỉ, tiết kiệm điện',
      description: 'Máy giặt Samsung WW80J3473KW 8kg, sản xuất 2020. Lồng giặt sạch bóng, không rỉ sét. Tính năng: giặt nhanh 15 phút, chống rung, tiết kiệm điện A+++. Lý do bán: nâng cấp lên máy 10kg. Có hóa đơn mua hàng.',
      price: 4500000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 7', ward: 'Tân Phú',
      latitude: 10.7374, longitude: 106.7219, viewCount: 112,
      authorId: lan.id,
    },
    {
      title: 'Tủ lạnh Panasonic 290L, 2 ngăn, mới dùng 1 năm',
      description: 'Tủ lạnh Panasonic NR-BL307XNVN 290L. Mua tháng 3/2023, bảo hành còn 2 năm. Lạnh nhanh, ít tiêu thụ điện. Ngăn đá không bị đóng tuyết. Bán vì chuyển nhà nhỏ hơn.',
      price: 6800000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'Hà Nội', district: 'Hai Bà Trưng', ward: 'Bạch Mai',
      latitude: 21.0027, longitude: 105.8472, viewCount: 95,
      authorId: minh.id,
    },
    {
      title: 'Quạt đứng Panasonic F-409, chạy êm không tiếng ồn',
      description: 'Quạt đứng Panasonic F-409, dùng 3 năm. Điều chỉnh 3 tốc độ, xoay ngang tự động. Lưỡi quạt 9 cánh cho gió mát, êm. Vỏ ngoài còn đẹp, chỉ có vài vết bụi nhỏ.',
      price: 0, listingType: 'give', itemCategory: 'appliances', status: 'available',
      province: 'Hà Nội', district: 'Đống Đa', ward: 'Ô Chợ Dừa',
      latitude: 21.0202, longitude: 105.8401, viewCount: 74,
      authorId: hoa.id,
    },
    {
      title: 'Lò vi sóng Sharp R-G272VN-S 25L có nướng',
      description: 'Lò vi sóng Sharp 25L, kết hợp nướng. Dùng được 2 năm, hoạt động bình thường. Có đủ phụ kiện đi kèm. Đang thanh lý vì thay lò nướng khác to hơn.',
      price: 750000, listingType: 'sell', itemCategory: 'appliances', status: 'done',
      province: 'TP. Hồ Chí Minh', district: 'Gò Vấp', ward: 'Phường 14',
      latitude: 10.8378, longitude: 106.6661, viewCount: 38,
      authorId: duc.id,
    },

    // ── Điện thoại / Phone ──
    {
      title: 'iPhone 13 Pro 256GB màu Sierra Blue, zin 100%',
      description: 'iPhone 13 Pro 256GB màu Sierra Blue, mua tháng 1/2022. Dung lượng pin 89%, màn hình zin không chạm ám. Kèm hộp, sạc, cáp zin Apple. Không có Face ID lỗi, không sửa chữa. Bán vì nâng cấp iPhone 15.',
      price: 15500000, listingType: 'sell', itemCategory: 'phone', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé',
      latitude: 10.7769, longitude: 106.7009, viewCount: 234,
      authorId: mai.id,
    },
    {
      title: 'Samsung Galaxy A54 5G 128GB, mới dùng 6 tháng',
      description: 'Samsung Galaxy A54 5G màu Lime 128GB. Máy còn bảo hành chính hãng Samsung đến tháng 8/2025. Màn hình không xước, camera sắc nét. Kèm ốp lưng chính hãng và cường lực.',
      price: 6200000, listingType: 'sell', itemCategory: 'phone', status: 'available',
      province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Nghĩa Đô',
      latitude: 21.0384, longitude: 105.7998, viewCount: 67,
      authorId: long.id,
    },
    {
      title: 'Xiaomi Redmi Note 12 Pro 256GB, kèm tai nghe',
      description: 'Redmi Note 12 Pro 256GB/8GB màu đen. Tặng kèm tai nghe không dây Redmi Buds 3. Máy chạy nhanh, chụp ảnh đẹp ban đêm, sạc nhanh 67W. Lý do bán: tặng quà sinh nhật.',
      price: 4800000, listingType: 'sell', itemCategory: 'phone', status: 'reserved',
      province: 'Đà Nẵng', district: 'Hải Châu', ward: 'Thạch Thang',
      latitude: 16.0544, longitude: 108.2022, viewCount: 51,
      authorId: thu.id,
    },

    // ── Máy tính / Computer ──
    {
      title: 'MacBook Air M1 2020 Silver 8GB/256GB nguyên zin',
      description: 'MacBook Air M1 năm 2020 màu Silver. Pin dùng được 6-8 tiếng/lần sạc. Máy không dùng Touch ID bao giờ, bàn phím không bị nhão phím. Kèm hộp gốc và adapter 30W. Giá thương lượng.',
      price: 18000000, listingType: 'sell', itemCategory: 'computer', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', ward: 'Phường 1',
      latitude: 10.8036, longitude: 106.7140, viewCount: 189,
      authorId: lan.id,
    },
    {
      title: 'Màn hình Dell 24 inch Full HD IPS, góc rộng',
      description: 'Dell S2421H 24 inch Full HD IPS. Độ phân giải 1920x1080, 75Hz, thời gian phản hồi 4ms. Màn hình không dead pixel, lưng mỏng thiết kế đẹp. Dây nguồn và cáp HDMI tặng kèm.',
      price: 2200000, listingType: 'sell', itemCategory: 'computer', status: 'available',
      province: 'Hà Nội', district: 'Thanh Xuân', ward: 'Khương Đình',
      latitude: 20.9860, longitude: 105.8146, viewCount: 43,
      authorId: minh.id,
    },
    {
      title: 'Bàn phím cơ Keychron K2 V2 Brown Switch',
      description: 'Bàn phím cơ Keychron K2 Version 2, Switch Brown (tactile). Layout 75%, có đèn RGB. Kết nối Bluetooth 5.1 hoặc USB-C. Dùng 1 năm, vỏ nhôm không trầy. Switch không có vấn đề, gõ đã tay.',
      price: 1850000, listingType: 'sell', itemCategory: 'computer', status: 'available',
      province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Tràng Tiền',
      latitude: 21.0285, longitude: 105.8524, viewCount: 88,
      authorId: duc.id,
    },

    // ── Xe cộ / Vehicles ──
    {
      title: 'Xe đạp địa hình Giant ATX 610, size M khung nhôm',
      description: 'Giant ATX 610 size M màu đen/đỏ. Khung nhôm nhẹ, bộ truyền động Shimano 21 tốc độ. Đã đi khoảng 800km, lốp và xích còn tốt. Phanh đĩa cơ an toàn. Thay vì lướt mạng thì đạp xe đi nào!',
      price: 4200000, listingType: 'sell', itemCategory: 'bicycle', status: 'available',
      province: 'Hà Nội', district: 'Tây Hồ', ward: 'Nhật Tân',
      latitude: 21.0693, longitude: 105.8280, viewCount: 76,
      authorId: long.id,
    },
    {
      title: 'Xe đạp trẻ em 20 inch, tặng ngay cho bé',
      description: 'Xe đạp trẻ em bánh 20 inch màu xanh, phù hợp bé 7-11 tuổi. Có đèn báo trước, chuông kêu to. Con tôi đã lớn không dùng nữa. Tặng ngay, không bán. Ai có bé đang cần thì nhắn tin.',
      price: 0, listingType: 'give', itemCategory: 'bicycle', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Thủ Đức', ward: 'Linh Tây',
      latitude: 10.8700, longitude: 106.7712, viewCount: 201,
      authorId: thu.id,
    },
    {
      title: 'Honda Wave Alpha 2019, đi 18.000km, giấy tờ đầy đủ',
      description: 'Honda Wave Alpha 110 sản xuất 2019, màu đỏ đen. Km thực đi 18.000km, máy êm không tiêu dầu. Giấy tờ chính chủ đầy đủ, không tai nạn. Lý do bán: chuyển sang xe máy điện. Giá cố định, không thương lượng nhiều.',
      price: 14500000, listingType: 'sell', itemCategory: 'motorbike', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 12', ward: 'Hiệp Thành',
      latitude: 10.8669, longitude: 106.6296, viewCount: 167,
      authorId: mai.id,
    },

    // ── Thời trang / Fashion ──
    {
      title: 'Áo khoác da bò thật màu nâu, size L',
      description: 'Áo khoác da bò thật 100%, màu nâu vintage. Size L, phù hợp người cao 170-178cm nặng 65-75kg. Mua ở Nhật về, dùng vài lần cho dịp đặc biệt. Da mềm, không bong tróc. Giá gốc 4 triệu.',
      price: 1500000, listingType: 'sell', itemCategory: 'fashion', status: 'available',
      province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Hàng Trống',
      latitude: 21.0306, longitude: 105.8508, viewCount: 55,
      authorId: hoa.id,
    },
    {
      title: 'Túi xách nữ da tổng hợp màu be, dáng bucket',
      description: 'Túi bucket bag da PU chất lượng cao, màu be kem. Kích thước vừa phải 25x20x15cm, kèm dây đeo chéo. Bên trong có ngăn phụ có khóa kéo. Mua dùng được 5 lần, mình không hợp kiểu dáng.',
      price: 280000, listingType: 'sell', itemCategory: 'fashion', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 3', ward: 'Võ Thị Sáu',
      latitude: 10.7841, longitude: 106.6871, viewCount: 34,
      authorId: mai.id,
    },
    {
      title: 'Quần jeans Levi\'s 511 size 32, nhập Mỹ',
      description: 'Quần jeans Levi\'s 511 Slim màu indigo đậm, size 32x32. Tag chính hãng Mỹ còn nguyên. Mua từ Mỹ về nhưng mặc hơi chật, mình tăng cân. Tình trạng mới 100% chưa mặc lần nào.',
      price: 650000, listingType: 'sell', itemCategory: 'fashion', status: 'available',
      province: 'Hà Nội', district: 'Đống Đa', ward: 'Khâm Thiên',
      latitude: 21.0212, longitude: 105.8456, viewCount: 48,
      authorId: long.id,
    },

    // ── Sách / Khác ──
    {
      title: 'Bộ sách "Nhà giả kim" + "Đắc nhân tâm" + "Thiên nga đen"',
      description: 'Bán cả bộ 3 quyển sách best-seller: Nhà giả kim (Paulo Coelho), Đắc nhân tâm (Dale Carnegie), Thiên nga đen (Nassim Nicholas Taleb). Đọc xong rồi, còn mới 90%, không gạch chân. Giá bộ 3 chỉ 120k.',
      price: 120000, listingType: 'sell', itemCategory: 'other', status: 'available',
      province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Trung Hòa',
      latitude: 21.0134, longitude: 105.7972, viewCount: 22,
      authorId: thu.id,
    },
    {
      title: 'Máy ảnh Fujifilm X-T20 + kit lens 18-55mm f/2.8-4',
      description: 'Fujifilm X-T20 màu bạc kèm kit lens 18-55mm. Chụp được khoảng 15.000 tấm (shutter count thấp). Màn hình không scratch, viewfinder rõ. Kèm hộp gốc, 2 pin, sạc, dây đeo. Bán vì chuyển sang chụp phim analog.',
      price: 13500000, listingType: 'sell', itemCategory: 'other', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Đa Kao',
      latitude: 10.7883, longitude: 106.7012, viewCount: 143,
      authorId: minh.id,
    },
    {
      title: 'Đàn guitar acoustic Yamaha F310, phù hợp người mới',
      description: 'Guitar acoustic Yamaha F310 full size màu tự nhiên. Mua cho con học nhưng con không theo được. Dây mới thay, âm thanh vang. Kèm túi đựng mềm và capo. Thích hợp người mới tập.',
      price: 0, listingType: 'give', itemCategory: 'other', status: 'available',
      province: 'Đà Nẵng', district: 'Liên Chiểu', ward: 'Hòa Khánh Bắc',
      latitude: 16.0748, longitude: 108.1559, viewCount: 98,
      authorId: duc.id,
    },
    {
      title: 'Bộ dụng cụ thể dục tại nhà: tạ tay + thảm + dây kháng lực',
      description: 'Bộ 3 món tập gym tại nhà: 2 tạ đôi 5kg Adidas, thảm tập yoga 6mm màu xanh, bộ 5 dây kháng lực. Dùng 6 tháng nhưng không kiên trì được. Chất lượng còn tốt, chưa bị hao mòn nhiều.',
      price: 450000, listingType: 'sell', itemCategory: 'other', status: 'available',
      province: 'Hà Nội', district: 'Bắc Từ Liêm', ward: 'Đức Thắng',
      latitude: 21.0701, longitude: 105.7762, viewCount: 61,
      authorId: lan.id,
    },
  ];

  const createdPosts = await Promise.all(
    postsData.map(data => prisma.post.create({ data }))
  );

  console.log(`   ✅ Đã tạo ${createdPosts.length} bài đăng`);

  // ─── FAVORITES ─────────────────────────────────────
  console.log('❤️  Tạo yêu thích...');
  await Promise.all([
    prisma.favorite.create({ data: { userId: minh.id, postId: createdPosts[0].id } }),  // Minh thích bàn làm việc
    prisma.favorite.create({ data: { userId: minh.id, postId: createdPosts[8].id } }),  // Minh thích iPhone
    prisma.favorite.create({ data: { userId: mai.id,  postId: createdPosts[11].id } }), // Mai thích MacBook
    prisma.favorite.create({ data: { userId: mai.id,  postId: createdPosts[4].id } }),  // Mai thích máy giặt
    prisma.favorite.create({ data: { userId: thu.id,  postId: createdPosts[14].id } }), // Thu thích xe đạp Giant
    prisma.favorite.create({ data: { userId: thu.id,  postId: createdPosts[21].id } }), // Thu thích máy ảnh
    prisma.favorite.create({ data: { userId: hoa.id,  postId: createdPosts[9].id } }),  // Hoa thích Samsung A54
    prisma.favorite.create({ data: { userId: long.id, postId: createdPosts[12].id } }), // Long thích màn hình Dell
    prisma.favorite.create({ data: { userId: duc.id,  postId: createdPosts[1].id } }),  // Duc thích sofa
  ]);
  console.log(`   ✅ Đã tạo yêu thích`);

  // ─── DEALS ─────────────────────────────────────────
  console.log('🤝 Tạo giao dịch...');

  // Deal 1: pending — minh muốn lấy tủ quần áo miễn phí (của Hoa)
  const deal1 = await prisma.deal.create({ data: {
    postId: createdPosts[2].id,   // Tủ quần áo
    requesterId: minh.id,
    ownerId: hoa.id,
    status: 'pending',
    message: 'Chị ơi, em muốn nhận tủ về cho phòng trọ mới ạ. Em ở Hoàng Mai, tiện lấy không?',
  }});

  // Deal 2: accepted — thu muốn lấy quạt (của Hoa)
  const deal2 = await prisma.deal.create({ data: {
    postId: createdPosts[6].id,   // Quạt Panasonic
    requesterId: thu.id,
    ownerId: hoa.id,
    status: 'accepted',
    message: 'Em cần quạt đứng cho phòng ạ, nhà em gần chỗ chị, xin nhận ạ!',
  }});

  // Deal 3: completed — mai đã nhận xe đạp trẻ em (của Thu)
  const deal3 = await prisma.deal.create({ data: {
    postId: createdPosts[15].id,  // Xe đạp trẻ em
    requesterId: mai.id,
    ownerId: thu.id,
    status: 'completed',
    message: 'Con tôi đang cần xe đạp học. Xin được nhận ạ!',
  }});
  // Đánh dấu bài đã xong
  await prisma.post.update({ where: { id: createdPosts[15].id }, data: { status: 'done' } });

  // Deal 4: completed — long mua lò vi sóng (của Duc)
  const deal4 = await prisma.deal.create({ data: {
    postId: createdPosts[7].id,   // Lò vi sóng
    requesterId: long.id,
    ownerId: duc.id,
    status: 'completed',
    message: 'Anh cho em hỏi lò còn hoạt động được không ạ? Em muốn mua.',
  }});
  await prisma.post.update({ where: { id: createdPosts[7].id }, data: { status: 'done' } });

  // Deal 5: rejected — hoa bị từ chối mua kệ sách (của Duc)
  const deal5 = await prisma.deal.create({ data: {
    postId: createdPosts[3].id,   // Kệ sách (reserved)
    requesterId: hoa.id,
    ownerId: duc.id,
    status: 'rejected',
    message: 'Anh ơi, em có thể lấy kệ không ạ?',
  }});

  // Deal 6: pending — thu muốn mua bộ tạ (của Lan)
  const deal6 = await prisma.deal.create({ data: {
    postId: createdPosts[23].id,  // Bộ dụng cụ thể dục
    requesterId: thu.id,
    ownerId: lan.id,
    status: 'pending',
    message: 'Chị ơi tạ 5kg còn không ạ? Em cần tập phục hồi sau chấn thương.',
  }});

  console.log(`   ✅ Đã tạo 6 giao dịch`);

  // ─── REVIEWS ───────────────────────────────────────
  console.log('⭐ Tạo đánh giá...');
  await Promise.all([
    // Mai đánh giá Thu (chủ xe đạp) — deal3
    prisma.review.create({ data: {
      dealId: deal3.id, reviewerId: mai.id, revieweeId: thu.id,
      rating: 5, comment: 'Chị Thu rất nhiệt tình, xe đạp đúng như mô tả. Con tôi rất thích! Cảm ơn chị nhiều ❤️',
    }}),
    // Thu đánh giá Mai — deal3
    prisma.review.create({ data: {
      dealId: deal3.id, reviewerId: thu.id, revieweeId: mai.id,
      rating: 5, comment: 'Bạn Mai liên lạc nhanh, đến đúng giờ. Giao dịch suôn sẻ.',
    }}),
    // Long đánh giá Duc (bán lò vi sóng) — deal4
    prisma.review.create({ data: {
      dealId: deal4.id, reviewerId: long.id, revieweeId: duc.id,
      rating: 4, comment: 'Lò hoạt động tốt đúng như mô tả. Anh Đức hỗ trợ nhiệt tình. Trừ 1 sao vì ảnh chụp hơi tối không thấy rõ.',
    }}),
    // Duc đánh giá Long — deal4
    prisma.review.create({ data: {
      dealId: deal4.id, reviewerId: duc.id, revieweeId: long.id,
      rating: 5, comment: 'Thanh toán nhanh gọn, đúng giờ hẹn. Người mua dễ tính.',
    }}),
  ]);
  console.log(`   ✅ Đã tạo 4 đánh giá`);

  // ─── CHAT ROOMS + MESSAGES ─────────────────────────
  console.log('💬 Tạo chat rooms & tin nhắn...');

  // Room 1: Minh hỏi Lan về bàn làm việc
  const room1 = await prisma.chatRoom.create({ data: {
    postId: createdPosts[0].id, buyerId: minh.id, sellerId: lan.id,
  }});
  await prisma.message.createMany({ data: [
    { roomId: room1.id, senderId: minh.id, text: 'Chị ơi, bàn làm việc này còn không ạ? Em muốn mua!', createdAt: new Date('2026-04-01T09:00:00') },
    { roomId: room1.id, senderId: lan.id,  text: 'Còn bạn nhé! Bạn ở đâu? Mình hẹn xem thực tế trước nhé.', createdAt: new Date('2026-04-01T09:15:00') },
    { roomId: room1.id, senderId: minh.id, text: 'Em ở Cầu Giấy ạ, thuận tiện lắm. Chiều nay 5h chị có ở nhà không?', createdAt: new Date('2026-04-01T09:20:00') },
    { roomId: room1.id, senderId: lan.id,  text: 'Được, 5h chị ở nhà. Địa chỉ số 15 ngõ 78 Dịch Vọng, gọi trước 10p nhé!', createdAt: new Date('2026-04-01T09:25:00') },
    { roomId: room1.id, senderId: minh.id, text: 'Dạ em cảm ơn chị! Em sẽ tới đúng giờ 😊', createdAt: new Date('2026-04-01T09:26:00') },
  ]});

  // Room 2: Mai hỏi Duc về kệ sách
  const room2 = await prisma.chatRoom.create({ data: {
    postId: createdPosts[3].id, buyerId: mai.id, sellerId: duc.id,
  }});
  await prisma.message.createMany({ data: [
    { roomId: room2.id, senderId: mai.id, text: 'Anh ơi, kệ sách này còn không ạ? 350k đúng không?', createdAt: new Date('2026-04-02T14:00:00') },
    { roomId: room2.id, senderId: duc.id, text: 'Còn bạn ơi, đúng 350k. Bạn cần thêm thông tin gì không?', createdAt: new Date('2026-04-02T14:30:00') },
    { roomId: room2.id, senderId: mai.id, text: 'Cho em hỏi kệ cao bao nhiêu cm ạ? Em phòng trọ trần thấp.', createdAt: new Date('2026-04-02T14:35:00') },
    { roomId: room2.id, senderId: duc.id, text: 'Cao 180cm bạn nhé. Nếu thấp quá có thể cưa bớt tầng trên cùng.', createdAt: new Date('2026-04-02T15:00:00') },
    { roomId: room2.id, senderId: mai.id, text: 'Thôi anh ơi phòng em chỉ cao 2m2, hơi rủi ro quá. Em xin lỗi anh nhé 🙏', createdAt: new Date('2026-04-02T15:10:00') },
    { roomId: room2.id, senderId: duc.id, text: 'Không sao bạn, cảm ơn bạn đã quan tâm nhé!', createdAt: new Date('2026-04-02T15:15:00') },
  ]});

  // Room 3: Thu hỏi Lan về bộ dụng cụ thể dục
  const room3 = await prisma.chatRoom.create({ data: {
    postId: createdPosts[23].id, buyerId: thu.id, sellerId: lan.id,
  }});
  await prisma.message.createMany({ data: [
    { roomId: room3.id, senderId: thu.id, text: 'Chị ơi tạ 5kg còn không? Em cần tập phục hồi.', createdAt: new Date('2026-04-03T08:00:00') },
    { roomId: room3.id, senderId: lan.id, text: 'Còn đủ bộ nhé bạn. Tạ không bị hoen rỉ, thảm cũng còn mới.', createdAt: new Date('2026-04-03T08:20:00') },
    { roomId: room3.id, senderId: thu.id, text: 'Chị bán riêng tạ không ạ hay phải mua nguyên bộ?', createdAt: new Date('2026-04-03T08:25:00') },
    { roomId: room3.id, senderId: lan.id, text: 'Bán cả bộ thôi bạn nhé, giá 450k cho cả 3 món rẻ hơn mua lẻ nhiều đó.', createdAt: new Date('2026-04-03T08:30:00') },
    { roomId: room3.id, senderId: thu.id, text: 'OK chị, em lấy cả bộ luôn. Chị cho em địa chỉ ạ?', createdAt: new Date('2026-04-03T08:35:00') },
  ]});

  console.log(`   ✅ Đã tạo 3 chat rooms + ${5 + 6 + 5} tin nhắn`);

  // ─── NOTIFICATIONS ─────────────────────────────────
  console.log('🔔 Tạo thông báo...');
  await prisma.notification.createMany({ data: [
    {
      userId: hoa.id, type: 'deal', isRead: false,
      title: 'Yêu cầu nhận đồ mới',
      body: 'Trần Văn Minh muốn nhận "Tủ quần áo 4 cánh" của bạn.',
      data: JSON.stringify({ dealId: deal1.id, postId: createdPosts[2].id }),
    },
    {
      userId: thu.id, type: 'deal', isRead: false,
      title: 'Yêu cầu đã được chấp nhận!',
      body: 'Hoa đã chấp nhận yêu cầu lấy "Quạt đứng Panasonic" của bạn.',
      data: JSON.stringify({ dealId: deal2.id }),
    },
    {
      userId: mai.id, type: 'review', isRead: true,
      title: 'Bùi Thị Thu đã đánh giá bạn',
      body: 'Bạn nhận được đánh giá ⭐⭐⭐⭐⭐ từ Bùi Thị Thu.',
      data: JSON.stringify({ dealId: deal3.id }),
    },
    {
      userId: duc.id, type: 'review', isRead: false,
      title: 'Đào Văn Long đã đánh giá bạn',
      body: 'Bạn nhận được đánh giá ⭐⭐⭐⭐ từ Đào Văn Long.',
      data: JSON.stringify({ dealId: deal4.id }),
    },
    {
      userId: lan.id, type: 'chat', isRead: false,
      title: 'Tin nhắn mới từ Trần Văn Minh',
      body: 'Em ở Cầu Giấy ạ, thuận tiện lắm. Chiều nay 5h chị có ở nhà không?',
      data: JSON.stringify({ roomId: room1.id }),
    },
    {
      userId: lan.id, type: 'deal', isRead: false,
      title: 'Yêu cầu nhận đồ mới',
      body: 'Bùi Thị Thu muốn nhận "Bộ dụng cụ thể dục" của bạn.',
      data: JSON.stringify({ dealId: deal6.id }),
    },
    {
      userId: minh.id, type: 'system', isRead: true,
      title: 'Chào mừng đến với Cho và Tặng!',
      body: 'Khám phá hàng nghìn đồ đạc đang được rao tặng và thanh lý gần bạn.',
      data: null,
    },
  ]});
  console.log(`   ✅ Đã tạo 7 thông báo`);

  // ─── SUMMARY ───────────────────────────────────────
  console.log('\n🎉 Seed hoàn thành!');
  console.log('─────────────────────────────────────────');
  console.log(`👤 Users   : 8 (tất cả dùng password: password123)`);
  console.log(`📦 Posts   : ${createdPosts.length}`);
  console.log(`❤️  Favorites: 9`);
  console.log(`🤝 Deals   : 6 (2 pending, 1 accepted, 2 completed, 1 rejected)`);
  console.log(`⭐ Reviews : 4`);
  console.log(`💬 Rooms   : 3  |  Messages: 16`);
  console.log(`🔔 Notifs  : 7`);
  console.log('─────────────────────────────────────────');
  console.log('📧 Test accounts:');
  console.log('   admin@chovatang.vn        (admin)');
  console.log('   nguyen.thi.lan@gmail.com  (user)');
  console.log('   tran.van.minh@gmail.com   (user)');
  console.log('   le.thi.hoa@gmail.com      (user)');
  console.log('   pham.van.duc@gmail.com    (user)');
  console.log('   hoang.thi.mai@gmail.com   (user)');
  console.log('   dao.van.long@gmail.com    (user)');
  console.log('   bui.thi.thu@gmail.com     (user)');
  console.log('   🔑 Password: password123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
