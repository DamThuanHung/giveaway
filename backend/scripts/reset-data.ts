/**
 * Reset toàn bộ dữ liệu, tạo 2 tài khoản mới với 10 bài mỗi người.
 * Chạy: npx ts-node scripts/reset-data.ts
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Xóa toàn bộ dữ liệu cũ...');
  await prisma.review.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.report.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  console.log('   ✅ Đã xóa hết\n');

  const hash = await bcrypt.hash('123456', 10);

  console.log('👤 Tạo 2 tài khoản...');
  const [a1, a2] = await Promise.all([
    prisma.user.create({ data: {
      email: 'nguyen.an@chovatang.vn',
      name: 'Nguyễn Văn An',
      password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=An',
    }}),
    prisma.user.create({ data: {
      email: 'tran.binh@chovatang.vn',
      name: 'Trần Thị Bình',
      password: hash,
      avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Binh',
    }}),
  ]);
  console.log('   ✅ nguyen.an@chovatang.vn / 123456');
  console.log('   ✅ tran.binh@chovatang.vn / 123456\n');

  console.log('📦 Tạo bài đăng...');
  const posts = [
    // ═══ NGUYỄN VĂN AN — 10 bài ═══
    {
      title: 'Laptop Dell XPS 13 i7 16GB/512GB còn bảo hành',
      description: 'Dell XPS 13 chip i7-1165G7, RAM 16GB, SSD 512GB. Màn 13.4" FHD+. Dùng 1 năm, pin 7-8 tiếng. Kèm sạc, túi chống sốc. Bán vì công ty cấp laptop mới.',
      price: 18500000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng',
      latitude: 21.0285, longitude: 105.7980, viewCount: 124, authorId: a1.id,
    },
    {
      title: 'iPhone 13 Pro 256GB Sierra Blue zin 100%',
      description: 'iPhone 13 Pro 256GB màu Sierra Blue. Pin 91%, màn hình zin không ám. Face ID hoạt động bình thường. Kèm hộp, sạc MagSafe 20W. Bán vì lên 15 Pro Max.',
      price: 16800000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Hàng Bạc',
      latitude: 21.0306, longitude: 105.8508, viewCount: 210, authorId: a1.id,
    },
    {
      title: 'Bàn làm việc gỗ cao su 120x60cm',
      description: 'Bàn làm việc gỗ cao su tự nhiên, kích thước 120x60cm, cao 75cm. Chân sắt sơn tĩnh điện đen. Mua được 8 tháng, không xước, không mối mọt. Bán vì chuyển nhà.',
      price: 1400000, listingType: 'sell', itemCategory: 'furniture', status: 'available',
      province: 'Hà Nội', district: 'Đống Đa', ward: 'Láng Hạ',
      latitude: 21.0178, longitude: 105.8245, viewCount: 67, authorId: a1.id,
    },
    {
      title: 'Ghế công thái học Ergonomic HBADA màu đen',
      description: 'Ghế công thái học HBADA tựa lưng ngả 145 độ, tay vịn 4D. Nệm lưới thoáng mát. Dùng 6 tháng, không bị xệ. Phù hợp người làm việc văn phòng tại nhà.',
      price: 2200000, listingType: 'sell', itemCategory: 'furniture', status: 'available',
      province: 'Hà Nội', district: 'Thanh Xuân', ward: 'Khương Đình',
      latitude: 20.9860, longitude: 105.8146, viewCount: 89, authorId: a1.id,
    },
    {
      title: 'Máy giặt LG 9kg Inverter AI DD, mới 95%',
      description: 'LG FV1409S4W 9kg Inverter AI DD. Sản xuất 2023, còn bảo hành 2 năm. Giặt sạch, không ồn, tiết kiệm điện. Lý do bán: gia đình chuyển sang máy giặt cửa trên.',
      price: 6500000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'Hà Nội', district: 'Bắc Từ Liêm', ward: 'Minh Khai',
      latitude: 21.0612, longitude: 105.7720, viewCount: 93, authorId: a1.id,
    },
    {
      title: 'Quần áo trẻ em size 2-4 tuổi, 20 bộ tặng luôn',
      description: 'Có 20 bộ quần áo trẻ em size 2-4 tuổi (cho bé gái). Còn mới 80%, không rách, không phai màu. Con lớn rồi không mặc được nữa. Tặng miễn phí, ai cần thì đến lấy.',
      price: 0, listingType: 'give', itemCategory: 'clothing', status: 'available',
      province: 'Hà Nội', district: 'Long Biên', ward: 'Bồ Đề',
      latitude: 21.0350, longitude: 105.8879, viewCount: 178, authorId: a1.id,
    },
    {
      title: 'Xe đạp thể thao Giant Escape 3 màu xanh',
      description: 'Giant Escape 3 City size M, màu xanh lá. Dùng 1 năm, đi khoảng 600km. Shimano 21 tốc độ, phanh đĩa cơ. Tặng kèm đèn + khóa. Bán vì chuyển sang xe điện.',
      price: 3800000, listingType: 'sell', itemCategory: 'vehicle', status: 'available',
      province: 'Hà Nội', district: 'Tây Hồ', ward: 'Nhật Tân',
      latitude: 21.0693, longitude: 105.8280, viewCount: 71, authorId: a1.id,
    },
    {
      title: 'Bộ sách kỹ năng sống 15 cuốn, tặng miễn phí',
      description: 'Tặng bộ 15 cuốn sách kỹ năng sống và phát triển bản thân: Đắc Nhân Tâm, 7 Thói Quen, Nhà Giả Kim, Tư Duy Nhanh Chậm... Đọc xong rồi, không gạch chân. Ai cần thì đến lấy.',
      price: 0, listingType: 'give', itemCategory: 'book', status: 'available',
      province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Trung Hòa',
      latitude: 21.0134, longitude: 105.7972, viewCount: 45, authorId: a1.id,
    },
    {
      title: 'Tai nghe Sony WH-1000XM5 chống ồn ANC',
      description: 'Sony WH-1000XM5 màu đen. Chống ồn ANC tốt nhất hiện tại. Pin 30 tiếng, sạc nhanh 3 phút = 3 tiếng. Dùng 4 tháng, còn bảo hành. Kèm túi đựng và cáp USB-C.',
      price: 6200000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'Hà Nội', district: 'Hoàng Mai', ward: 'Tương Mai',
      latitude: 20.9876, longitude: 105.8534, viewCount: 156, authorId: a1.id,
    },
    {
      title: 'Bộ đồ chơi LEGO Technic 42154 — xe đua F1',
      description: 'LEGO Technic 42154 Williams Racing F1 Team Car, 564 miếng. Mua tặng con nhưng con không thích. Hộp nguyên seal chưa mở. Giá gốc 1.1 triệu bán lại 700k.',
      price: 700000, listingType: 'sell', itemCategory: 'toy', status: 'available',
      province: 'Hà Nội', district: 'Hai Bà Trưng', ward: 'Bạch Mai',
      latitude: 21.0027, longitude: 105.8472, viewCount: 38, authorId: a1.id,
    },

    // ═══ TRẦN THỊ BÌNH — 10 bài ═══
    {
      title: 'iPad Pro M2 11 inch 128GB WiFi, kèm bút Apple',
      description: 'iPad Pro M2 11" 128GB WiFi màu Space Gray. Dùng 5 tháng, pin 98%. Kèm Apple Pencil 2 và bao da bàn phím. Màn hình Liquid Retina ProMotion 120Hz cực đỉnh.',
      price: 18000000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé',
      latitude: 10.7769, longitude: 106.7009, viewCount: 195, authorId: a2.id,
    },
    {
      title: 'Tủ lạnh Samsung 382L Inverter 2 cánh, tiết kiệm điện',
      description: 'Samsung RT38CG6584S9SV 382L, 2 cánh, Inverter. Sản xuất 2023, còn bảo hành 2 năm. Ngăn đông làm đá nhanh, không đóng tuyết. Bán vì chuyển sang tủ side-by-side.',
      price: 9800000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', ward: 'Phường 25',
      latitude: 10.8087, longitude: 106.7143, viewCount: 88, authorId: a2.id,
    },
    {
      title: 'Sofa da thật 3 chỗ màu nâu caramel',
      description: 'Sofa da bò thật 3 chỗ ngồi màu nâu caramel. Kích thước 220x90cm. Dùng 2 năm, da không bong tróc, đệm còn đàn hồi tốt. Người mua tự thuê xe tải, hỗ trợ khiêng ra cửa.',
      price: 8500000, listingType: 'sell', itemCategory: 'furniture', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 7', ward: 'Tân Phú',
      latitude: 10.7374, longitude: 106.7219, viewCount: 112, authorId: a2.id,
    },
    {
      title: 'Samsung Galaxy S23 Ultra 256GB màu Phantom Black',
      description: 'Samsung Galaxy S23 Ultra 256GB/12GB màu Phantom Black. Kèm bút S-Pen. Dùng 7 tháng, màn hình không xước, camera siêu đỉnh. Còn bảo hành Samsung đến tháng 6/2025.',
      price: 19500000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 3', ward: 'Võ Thị Sáu',
      latitude: 10.7841, longitude: 106.6871, viewCount: 234, authorId: a2.id,
    },
    {
      title: 'Nồi chiên không dầu Philips 6.2L XXL, gia đình lớn',
      description: 'Philips HD9270 6.2L XXL, 2500W. Chiên giòn không dầu, nướng bánh, hâm nóng. Dùng 8 tháng, khay rửa bằng máy rửa bát được. Bán vì nhà ít người ăn quá.',
      price: 2400000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 10', ward: 'Phường 12',
      latitude: 10.7737, longitude: 106.6702, viewCount: 76, authorId: a2.id,
    },
    {
      title: 'Váy đầm dự tiệc cao cấp 3 chiếc, size M',
      description: 'Thanh lý 3 chiếc váy dự tiệc cao cấp size M: 1 đầm đỏ tầng bèo, 1 đầm đen bodycon, 1 đầm xanh navy dài. Mặc mỗi cái 1-2 lần. Bán cả bộ 3 giá 600k hoặc lẻ 250k/cái.',
      price: 600000, listingType: 'sell', itemCategory: 'clothing', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 5', ward: 'Phường 2',
      latitude: 10.7540, longitude: 106.6763, viewCount: 55, authorId: a2.id,
    },
    {
      title: 'Honda Air Blade 150 2021 màu đỏ đen, ít đi',
      description: 'Honda Air Blade 150cc 2021 màu đỏ đen. Đi được 12.000km, bảo dưỡng định kỳ tại Honda. Máy êm, không tiêu dầu. Giấy tờ chính chủ đầy đủ. Xe đẹp, không tai nạn.',
      price: 38000000, listingType: 'sell', itemCategory: 'vehicle', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Gò Vấp', ward: 'Phường 14',
      latitude: 10.8378, longitude: 106.6661, viewCount: 189, authorId: a2.id,
    },
    {
      title: 'Bộ truyện tranh One Piece 60 tập, tặng miễn phí',
      description: 'Tặng bộ truyện One Piece từ tập 1 đến 60, bản NXB Kim Đồng. Còn khá mới, không bị ẩm hay rách. Em lớn rồi không đọc nữa. Ai có con nhỏ thích đọc truyện thì đến lấy.',
      price: 0, listingType: 'give', itemCategory: 'book', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Bình Chánh', ward: 'Bình Chánh',
      latitude: 10.6893, longitude: 106.6125, viewCount: 67, authorId: a2.id,
    },
    {
      title: 'Máy chiếu mini Xiaomi Mi Portable 1080p',
      description: 'Xiaomi Mi Portable Projector 2 1080p Full HD. 500 ANSI lumens, Android 9, WiFi, Bluetooth. Dùng 6 tháng, lumen chưa giảm. Kèm dây nguồn và remote. Tuyệt vời xem phim gia đình.',
      price: 5500000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Thủ Đức', ward: 'Linh Tây',
      latitude: 10.8700, longitude: 106.7712, viewCount: 143, authorId: a2.id,
    },
    {
      title: 'Đồ chơi trẻ em đa dạng, tặng cả thùng',
      description: 'Tặng 1 thùng đồ chơi trẻ em gồm: xe đồ chơi, búp bê, xếp hình, đất nặn, bộ bác sĩ... Còn đầy đủ, không hỏng. Con gái 6 tuổi không chơi nữa. Ai cần đến lấy miễn phí.',
      price: 0, listingType: 'give', itemCategory: 'toy', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 12', ward: 'Hiệp Thành',
      latitude: 10.8669, longitude: 106.6296, viewCount: 201, authorId: a2.id,
    },
  ];

  const created = await Promise.all(posts.map(p => prisma.post.create({ data: p })));
  console.log(`   ✅ Đã tạo ${created.length} bài đăng\n`);

  // Gán ảnh
  const seeds = [10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200];
  await Promise.all(created.map((post, i) =>
    prisma.post.update({
      where: { id: post.id },
      data: { imageLabel: `seed-img-${seeds[i]}.jpg` },
    })
  ));
  console.log('   ✅ Đã gán ảnh\n');

  console.log('╔═══════════════════════════════════════════╗');
  console.log('║          2 TÀI KHOẢN ĐÃ SẴN SÀNG         ║');
  console.log('╠═══════════════════════════════════════════╣');
  console.log('║  nguyen.an@chovatang.vn   / 123456        ║');
  console.log('║  tran.binh@chovatang.vn   / 123456        ║');
  console.log('╚═══════════════════════════════════════════╝');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
