/**
 * Tạo 3 tài khoản test với 10 bài đăng đa dạng category mỗi người.
 * Chạy: npx ts-node scripts/seed-test-accounts.ts
 * Không xóa dữ liệu cũ.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  console.log('👤 Tạo 3 tài khoản test...');

  const [a1, a2, a3] = await Promise.all([
    prisma.user.upsert({
      where: { email: 'test.an@chovatang.vn' },
      update: {},
      create: {
        email: 'test.an@chovatang.vn',
        name: 'Nguyễn Văn An (Test)',
        password: hash,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=An',
      },
    }),
    prisma.user.upsert({
      where: { email: 'test.binh@chovatang.vn' },
      update: {},
      create: {
        email: 'test.binh@chovatang.vn',
        name: 'Trần Thị Bình (Test)',
        password: hash,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Binh',
      },
    }),
    prisma.user.upsert({
      where: { email: 'test.cuong@chovatang.vn' },
      update: {},
      create: {
        email: 'test.cuong@chovatang.vn',
        name: 'Lê Văn Cường (Test)',
        password: hash,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Cuong',
      },
    }),
  ]);

  console.log(`   ✅ Acc 1: test.an@chovatang.vn`);
  console.log(`   ✅ Acc 2: test.binh@chovatang.vn`);
  console.log(`   ✅ Acc 3: test.cuong@chovatang.vn`);
  console.log(`   🔑 Password: 123456`);

  console.log('\n📦 Tạo bài đăng...');

  const posts = [
    // ════ NGUYỄN VĂN AN — 10 bài ════
    {
      title: 'Điều hòa Daikin 1.5HP inverter, tiết kiệm điện',
      description: 'Điều hòa Daikin FTKC35UAVMV 1.5HP inverter. Dùng 2 năm, làm lạnh cực nhanh. Không cần bơm ga, máy vận hành êm. Tặng kèm remote và giá đỡ. Lý do bán: chuyển nhà sang căn nhỏ hơn không cần.',
      price: 7500000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'Hà Nội', district: 'Đống Đa', ward: 'Láng Thượng',
      latitude: 21.0178, longitude: 105.8113, viewCount: 88, authorId: a1.id,
    },
    {
      title: 'Máy lọc nước RO Kangaroo 9 lõi, uống được ngay',
      description: 'Máy lọc nước Kangaroo KG09A3 9 lõi lọc RO. Lắp được 1 năm, vừa thay bộ lõi mới. Lọc sạch 99.9% vi khuẩn, nước trong uống ngay không cần đun sôi. Tháo đường ống và di chuyển dễ dàng.',
      price: 2800000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Quan Hoa',
      latitude: 21.0341, longitude: 105.7988, viewCount: 55, authorId: a1.id,
    },
    {
      title: 'iPhone 14 128GB màu Midnight, pin 94%',
      description: 'iPhone 14 128GB màu Midnight. Dung lượng pin 94%, màn hình Super Retina không bị ám. Máy có Face ID hoạt động tốt, không trầy xước. Kèm hộp, sạc 20W, cáp Lightning. Bán vì lên iPhone 15 Pro.',
      price: 17800000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Lý Thái Tổ',
      latitude: 21.0285, longitude: 105.8524, viewCount: 203, authorId: a1.id,
    },
    {
      title: 'Tai nghe Sony WH-1000XM4, chống ồn đỉnh',
      description: 'Sony WH-1000XM4 màu đen. Chống ồn ANC hàng đầu thị trường. Pin 30 tiếng nghe nhạc, sạc nhanh 10 phút = 5 tiếng. Kết nối đa điểm 2 thiết bị cùng lúc. Kèm túi đựng và cáp 3.5mm. Còn bảo hành.',
      price: 5200000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'Hà Nội', district: 'Thanh Xuân', ward: 'Nhân Chính',
      latitude: 20.9938, longitude: 105.8085, viewCount: 142, authorId: a1.id,
    },
    {
      title: 'Áo vest công sở nam xanh navy, size 42',
      description: 'Áo vest đơn nam chất vải polyester cao cấp, màu xanh navy. Size 42 (phù hợp người cao 170-175cm, vai 43cm). Mặc 3 lần trong các buổi họp, còn như mới. Giặt khô lần cuối trước khi bán.',
      price: 320000, listingType: 'sell', itemCategory: 'clothing', status: 'available',
      province: 'Hà Nội', district: 'Đống Đa', ward: 'Nam Đồng',
      latitude: 21.0159, longitude: 105.8432, viewCount: 38, authorId: a1.id,
    },
    {
      title: 'Ghế gaming DXRacer Formula màu đen đỏ',
      description: 'Ghế gaming DXRacer Formula F08 màu đen đỏ. Tựa lưng ngả 135 độ, có gối đầu và gối lưng. Bánh xe cao su trơn trên sàn gỗ. Dùng 1.5 năm, da PU còn tốt không bong tróc. Tháo rời vận chuyển được.',
      price: 3200000, listingType: 'sell', itemCategory: 'furniture', status: 'available',
      province: 'Hà Nội', district: 'Hoàng Mai', ward: 'Tương Mai',
      latitude: 20.9876, longitude: 105.8534, viewCount: 76, authorId: a1.id,
    },
    {
      title: 'Xe scooter điện Vinfast Feliz S, đi 3 tháng',
      description: 'Vinfast Feliz S màu trắng ngọc, mua tháng 1/2026. Đi được khoảng 800km, pin vẫn đầy 100%. Tốc độ tối đa 50km/h, phạm vi 120km/lần sạc. Giấy tờ đăng ký xe đầy đủ. Lý do bán: nhà có xe ô tô rồi.',
      price: 22000000, listingType: 'sell', itemCategory: 'vehicle', status: 'available',
      province: 'Hà Nội', district: 'Bắc Từ Liêm', ward: 'Minh Khai',
      latitude: 21.0612, longitude: 105.7720, viewCount: 189, authorId: a1.id,
    },
    {
      title: 'Bộ sách "Sapiens" + "Homo Deus" của Yuval Noah Harari',
      description: 'Bộ 2 quyển sách Sapiens (Lược sử loài người) và Homo Deus (Lược sử tương lai) bản dịch tiếng Việt. Đọc một lần, không gạch chân, gáy còn thẳng. Giá gốc 250k/quyển, bán bộ 2 giá hữu nghị.',
      price: 180000, listingType: 'sell', itemCategory: 'book', status: 'available',
      province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng Hậu',
      latitude: 21.0216, longitude: 105.7906, viewCount: 27, authorId: a1.id,
    },
    {
      title: 'Bộ đồ chơi LEGO City 60367 — Máy bay phản lực',
      description: 'LEGO City 60367 Passenger Airplane, 913 miếng. Mua tặng con nhưng con không thích. Hộp nguyên seal, chưa mở. Kèm hóa đơn mua tại Toy Kingdom tháng 2/2026. Giá gốc 1.2 triệu.',
      price: 850000, listingType: 'sell', itemCategory: 'toy', status: 'available',
      province: 'Hà Nội', district: 'Long Biên', ward: 'Bồ Đề',
      latitude: 21.0350, longitude: 105.8879, viewCount: 64, authorId: a1.id,
    },
    {
      title: 'Máy pha cà phê Delonghi Dedica, barista tại nhà',
      description: 'DeLonghi Dedica EC685M màu bạc. Pha espresso và cappuccino ngon chuẩn barista. Dùng 8 tháng, thường xuyên vệ sinh máy. Kèm portafilter, tamper và 1 gói cà phê nguyên chất Ý. Xuất xứ châu Âu.',
      price: 4800000, listingType: 'sell', itemCategory: 'other', status: 'available',
      province: 'Hà Nội', district: 'Tây Hồ', ward: 'Quảng An',
      latitude: 21.0646, longitude: 105.8310, viewCount: 95, authorId: a1.id,
    },

    // ════ TRẦN THỊ BÌNH — 10 bài ════
    {
      title: 'Nồi chiên không dầu Philips 4.1L, chiên giòn không béo',
      description: 'Philips HD9252/91 4.1L màu đen. Công suất 1400W, timer 60 phút. Dùng gần 1 năm, còn bảo hành hãng 1 năm nữa. Khay chiên rửa được bằng máy rửa bát. Tặng kèm 50 công thức nấu ăn.',
      price: 1600000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 10', ward: 'Phường 12',
      latitude: 10.7737, longitude: 106.6702, viewCount: 112, authorId: a2.id,
    },
    {
      title: 'Robot hút bụi Xiaomi Mi Robot Vacuum-Mop 2 Lite',
      description: 'Xiaomi Mi Robot Vacuum-Mop 2 Lite. Hút bụi kết hợp lau nhà, lập lịch qua app. Pin 2600mAh, chạy 110 phút liên tục. Dùng 5 tháng, không có vết trầy. Tự về trạm sạc. Bán vì mua model mới hơn.',
      price: 2100000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', ward: 'Phường 12',
      latitude: 10.8003, longitude: 106.7115, viewCount: 87, authorId: a2.id,
    },
    {
      title: 'iPad Air 5 M1 64GB WiFi màu Starlight',
      description: 'iPad Air 5 thế hệ 5 chip M1, 64GB WiFi màu Starlight. Pin còn 96%, màn hình Liquid Retina không bị điểm chết. Kèm Apple Pencil 2 (tặng) và bao da keyboard. Dùng 8 tháng, dùng chủ yếu xem phim và học.',
      price: 13500000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Thành',
      latitude: 10.7719, longitude: 106.6980, viewCount: 178, authorId: a2.id,
    },
    {
      title: 'Tủ quần áo trẻ em màu hồng 3 ngăn, tặng miễn phí',
      description: 'Tủ quần áo trẻ em kích thước 60x40x120cm, màu hồng có hình gấu. Con gái lớn rồi không dùng nữa. Tặng miễn phí, chỉ cần tự đến lấy. Địa chỉ Quận 10 TP.HCM, có thể đặt lịch đến xem trước.',
      price: 0, listingType: 'give', itemCategory: 'furniture', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 10', ward: 'Phường 14',
      latitude: 10.7768, longitude: 106.6645, viewCount: 145, authorId: a2.id,
    },
    {
      title: 'Váy maxi hoa nhí màu xanh mint, size S',
      description: 'Váy maxi hoa nhí nền xanh mint, chất vải lụa mát mẻ. Size S (vòng ngực 82, vòng eo 64). Mặc một lần chụp ảnh, giặt tay nhẹ nhàng. Không bị xù hay phai màu. Phù hợp mặc đi biển hoặc dạo phố.',
      price: 150000, listingType: 'sell', itemCategory: 'clothing', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 3', ward: 'Phường 9',
      latitude: 10.7811, longitude: 106.6823, viewCount: 43, authorId: a2.id,
    },
    {
      title: 'Xe đạp thể thao Giant Escape 3 City, size S',
      description: 'Giant Escape 3 City màu xanh lá, size S (phù hợp người cao 155-165cm). Dùng 1 năm, lốp còn tốt, phanh tay đĩa cơ an toàn. Shimano 21 tốc độ, tay lái thẳng. Có đèn pin và chắn bùn đi kèm. Bán vì bầu.',
      price: 3800000, listingType: 'sell', itemCategory: 'vehicle', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 7', ward: 'Phú Mỹ',
      latitude: 10.7297, longitude: 106.7177, viewCount: 67, authorId: a2.id,
    },
    {
      title: 'Bộ truyện Doraemon 45 tập đầy đủ, bìa cứng',
      description: 'Bộ truyện Doraemon đầy đủ 45 tập bản bìa cứng NXB Kim Đồng. Còn khá mới, không rách, không bị ẩm. Đóng gói cẩn thận giao ship. Kèm tặng bộ bookmarks Doraemon 10 cái. Thích hợp cho bé 6-12 tuổi.',
      price: 450000, listingType: 'sell', itemCategory: 'book', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Bình Chánh', ward: 'Bình Chánh',
      latitude: 10.6893, longitude: 106.6125, viewCount: 92, authorId: a2.id,
    },
    {
      title: 'Bộ đồ chơi nhà bếp cho bé gái, 32 món inox giả',
      description: 'Bộ đồ chơi nhà bếp 32 món: nồi, chảo, bát, đĩa, dao, muỗng làm từ nhựa ABS an toàn (BPA-free). Màu hồng pastel dễ thương. Còn đầy đủ không mất món. Bé lớn rồi không chơi, tặng bé khác.',
      price: 0, listingType: 'give', itemCategory: 'toy', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Tân Phú', ward: 'Tây Thạnh',
      latitude: 10.7977, longitude: 106.6276, viewCount: 78, authorId: a2.id,
    },
    {
      title: 'Máy chiếu Xiaomi Wanbo T2 Max, phòng khách mini',
      description: 'Máy chiếu Xiaomi Wanbo T2 Max 1080p Full HD, độ sáng 650 ANSI lumen. Kết nối WiFi, Bluetooth, HDMI, USB. Android 9 tích hợp xem YouTube/Netflix. Dùng 6 tháng, lumen không bị giảm. Kèm màn chiếu 80 inch.',
      price: 4200000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 5', ward: 'Phường 2',
      latitude: 10.7540, longitude: 106.6763, viewCount: 134, authorId: a2.id,
    },
    {
      title: 'Cây đàn ukulele soprano gỗ mahogany, tặng kèm túi',
      description: 'Đàn ukulele soprano 21 inch gỗ mahogany màu nâu tự nhiên. Dây Aquila còn mới. Đã lên dây chuẩn. Tặng kèm túi đựng mềm, capo và picks. Âm thanh ấm, phù hợp người mới học. Bán vì không có thời gian.',
      price: 280000, listingType: 'sell', itemCategory: 'other', status: 'available',
      province: 'TP. Hồ Chí Minh', district: 'Quận 9', ward: 'Long Bình',
      latitude: 10.8282, longitude: 106.8031, viewCount: 51, authorId: a2.id,
    },

    // ════ LÊ VĂN CƯỜNG — 10 bài ════
    {
      title: 'Máy rửa bát Bosch SMS25AW00G 12 bộ, âm dưới bếp',
      description: 'Máy rửa bát Bosch SMS25AW00G 12 bộ. Lắp âm tủ bếp, hoạt động cực êm (48dB). 5 chương trình rửa, tiêu thụ 12L nước/mẻ. Dùng 2 năm, không bị rỉ, vòi phun còn tốt. Bán vì chuyển nhà sang căn không có slot lắp máy rửa.',
      price: 9500000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'Đà Nẵng', district: 'Hải Châu', ward: 'Bình Hiên',
      latitude: 16.0678, longitude: 108.2208, viewCount: 73, authorId: a3.id,
    },
    {
      title: 'Bếp từ đôi Sunhouse SHB9121MT, công suất 3600W',
      description: 'Bếp từ đôi Sunhouse SHB9121MT, công suất 3600W (2x1800W). Mặt kính Schott Ceran (Đức) chịu nhiệt tốt. 9 mức nhiệt, hẹn giờ 99 phút. Dùng 1 năm, mặt kính không bị xước. Tặng kèm nồi áp suất điện từ.',
      price: 1800000, listingType: 'sell', itemCategory: 'appliances', status: 'available',
      province: 'Đà Nẵng', district: 'Cẩm Lệ', ward: 'Hòa Thọ Đông',
      latitude: 16.0216, longitude: 108.2065, viewCount: 48, authorId: a3.id,
    },
    {
      title: 'Laptop Dell XPS 13 9310 i7-1165G7 16GB/512GB',
      description: 'Dell XPS 13 9310 cấu hình i7-1165G7, RAM 16GB LPDDR4X, SSD 512GB NVMe. Màn hình 13.4 inch FHD+ IPS 500 nit. Pin còn 7-8 tiếng sử dụng thực tế. Máy dùng 1.5 năm cho công việc văn phòng. Không nhiệt, không lag.',
      price: 19500000, listingType: 'sell', itemCategory: 'electronics', status: 'available',
      province: 'Đà Nẵng', district: 'Ngũ Hành Sơn', ward: 'Mỹ An',
      latitude: 16.0188, longitude: 108.2529, viewCount: 167, authorId: a3.id,
    },
    {
      title: 'Bàn ăn gỗ sồi 4 ghế, phong cách Scandinavian',
      description: 'Bộ bàn ăn 4 người gỗ sồi tự nhiên, chân kim loại sơn đen. Kích thước bàn 120x70cm. Ghế nệm vải màu xám nhạt, chân gỗ sồi. Dùng 1 năm, không bị xước, không xiêu. Giao trong phạm vi Đà Nẵng.',
      price: 5800000, listingType: 'sell', itemCategory: 'furniture', status: 'available',
      province: 'Đà Nẵng', district: 'Thanh Khê', ward: 'Thạc Gián',
      latitude: 16.0622, longitude: 108.1885, viewCount: 92, authorId: a3.id,
    },
    {
      title: 'Giày Nike Air Max 270 size 42, fullbox còn bảo hành',
      description: 'Nike Air Max 270 màu đen trắng, size 42 EU (27cm). Mua tại Nike Outlet, còn hộp đầy đủ. Mang 2 lần rồi (đi sự kiện), đế air bubble chưa bị xẹp. Chưa giặt. Bán vì mua nhầm size (thực dùng 43).',
      price: 1800000, listingType: 'sell', itemCategory: 'clothing', status: 'available',
      province: 'Đà Nẵng', district: 'Liên Chiểu', ward: 'Hòa Khánh Nam',
      latitude: 16.0527, longitude: 108.1578, viewCount: 85, authorId: a3.id,
    },
    {
      title: 'Xe máy Yamaha Exciter 150 2020, côn tay phân khối nhỏ',
      description: 'Yamaha Exciter 150 2020 màu đen nhám. Đi 23.000km, bảo dưỡng định kỳ tại hãng. Máy êm không tiêu nhớt, côn và phanh nhẹ tay. Giấy tờ chính chủ, không tai nạn, không ngập nước. Xe ngầu, phù hợp bạn trẻ.',
      price: 31000000, listingType: 'sell', itemCategory: 'vehicle', status: 'available',
      province: 'Đà Nẵng', district: 'Sơn Trà', ward: 'An Hải Tây',
      latitude: 16.0596, longitude: 108.2432, viewCount: 201, authorId: a3.id,
    },
    {
      title: 'Tủ sách trẻ em 30 quyển: Khoa học, Lịch sử, Thiên nhiên',
      description: 'Tặng bộ 30 quyển sách thiếu nhi: 10 quyển khoa học vui, 10 quyển lịch sử VN, 10 quyển khám phá thiên nhiên. Sách NXB Kim Đồng và NXB Trẻ. Không bị ố vàng, không rách. Con tôi lên cấp 2 không đọc nữa.',
      price: 0, listingType: 'give', itemCategory: 'book', status: 'available',
      province: 'Đà Nẵng', district: 'Hải Châu', ward: 'Nam Dương',
      latitude: 16.0548, longitude: 108.2096, viewCount: 63, authorId: a3.id,
    },
    {
      title: 'Bộ đồ chơi xe lửa Thomas & Friends 60 món',
      description: 'Bộ đồ chơi đường ray xe lửa Thomas & Friends, 60 món gồm: 3 đầu tàu có pin, hơn 50 thanh ray ghép nối, cầu, trạm dừng. Nhựa cao cấp an toàn. Bé 6 tuổi không chơi nữa. Tặng toàn bộ, miễn phí.',
      price: 0, listingType: 'give', itemCategory: 'toy', status: 'available',
      province: 'Đà Nẵng', district: 'Cẩm Lệ', ward: 'Khuê Trung',
      latitude: 16.0337, longitude: 108.2174, viewCount: 109, authorId: a3.id,
    },
    {
      title: 'Bộ vợt cầu lông Victor TK-F (2 vợt + bao + cầu)',
      description: 'Bộ 2 vợt cầu lông Victor TK-F series frame aluminum. Kèm bao đựng 2 ngăn và 1 hộp cầu lông Victor Gold (12 quả). Dùng 4 tháng, cước còn tốt chưa cần đan lại. Phù hợp trình độ phong trào.',
      price: 750000, listingType: 'sell', itemCategory: 'other', status: 'available',
      province: 'Đà Nẵng', district: 'Ngũ Hành Sơn', ward: 'Khuê Mỹ',
      latitude: 16.0054, longitude: 108.2625, viewCount: 44, authorId: a3.id,
    },
    {
      title: 'Camera hành trình Garmin Dash Cam 65W, góc 180 độ',
      description: 'Garmin Dash Cam 65W, góc quay 180 độ, Full HD 1080p. Tự động bật khi nổ máy, lưu video liên tục. Phát hiện va chạm tự khóa video. Dùng 6 tháng trên ô tô Mazda, nay bán xe nên thanh lý luôn. Kèm thẻ nhớ 64GB.',
      price: 2600000, listingType: 'sell', itemCategory: 'other', status: 'available',
      province: 'Đà Nẵng', district: 'Liên Chiểu', ward: 'Hòa Hiệp Bắc',
      latitude: 16.0937, longitude: 108.1552, viewCount: 58, authorId: a3.id,
    },
  ];

  const created = await Promise.all(posts.map(p => prisma.post.create({ data: p })));
  console.log(`   ✅ Đã tạo ${created.length} bài đăng`);

  // Gán ảnh ngẫu nhiên từ picsum
  const seeds = [300, 310, 320, 330, 340, 350, 360, 370, 380, 390,
                 400, 410, 420, 430, 440, 450, 460, 470, 480, 490,
                 500, 510, 520, 530, 540, 550, 560, 570, 580, 590];

  console.log('\n🖼️  Gán ảnh mẫu...');
  await Promise.all(created.map((post, i) =>
    prisma.post.update({
      where: { id: post.id },
      data: { imageLabel: `seed-img-${seeds[i] ?? 300}.jpg` },
    })
  ));
  console.log(`   ✅ Đã gán ảnh (dùng lại ảnh từ scripts/add-images.ts)`);

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║         TEST ACCOUNTS ĐÃ SẴN SÀNG       ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  test.an@chovatang.vn      / 123456      ║');
  console.log('║  test.binh@chovatang.vn    / 123456      ║');
  console.log('║  test.cuong@chovatang.vn   / 123456      ║');
  console.log('╚══════════════════════════════════════════╝');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
