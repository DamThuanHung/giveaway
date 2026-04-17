import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── Helpers ──────────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedImages = [
  'seed-img-10.jpg','seed-img-20.jpg','seed-img-30.jpg','seed-img-40.jpg',
  'seed-img-50.jpg','seed-img-60.jpg','seed-img-70.jpg','seed-img-80.jpg',
  'seed-img-90.jpg','seed-img-100.jpg','seed-img-110.jpg','seed-img-120.jpg',
  'seed-img-130.jpg','seed-img-140.jpg','seed-img-150.jpg','seed-img-160.jpg',
  'seed-img-170.jpg','seed-img-180.jpg','seed-img-190.jpg','seed-img-200.jpg',
  'seed-img-210.jpg','seed-img-220.jpg','seed-img-230.jpg','seed-img-240.jpg',
  'seed-img-300.jpg','seed-img-310.jpg','seed-img-320.jpg','seed-img-330.jpg',
  'seed-img-340.jpg','seed-img-350.jpg','seed-img-360.jpg','seed-img-370.jpg',
  'seed-img-380.jpg','seed-img-390.jpg','seed-img-400.jpg','seed-img-410.jpg',
  'seed-img-420.jpg','seed-img-430.jpg','seed-img-440.jpg','seed-img-450.jpg',
  'seed-img-460.jpg','seed-img-470.jpg','seed-img-480.jpg','seed-img-490.jpg',
  'seed-img-500.jpg','seed-img-510.jpg','seed-img-520.jpg','seed-img-530.jpg',
  'seed-img-540.jpg','seed-img-550.jpg','seed-img-560.jpg','seed-img-570.jpg',
  'seed-img-580.jpg','seed-img-590.jpg',
];

let imgIdx = 0;
const nextImg = () => seedImages[imgIdx++ % seedImages.length];

// ── Locations ────────────────────────────────────────────────────────────────
const locations = [
  { province: 'Hà Nội', district: 'Hoàn Kiếm', ward: 'Hàng Bài', lat: 21.0285, lng: 105.8542 },
  { province: 'Hà Nội', district: 'Cầu Giấy', ward: 'Dịch Vọng', lat: 21.0358, lng: 105.7905 },
  { province: 'Hà Nội', district: 'Đống Đa', ward: 'Láng Hạ', lat: 21.0162, lng: 105.8330 },
  { province: 'Hà Nội', district: 'Hai Bà Trưng', ward: 'Bạch Mai', lat: 21.0020, lng: 105.8484 },
  { province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Bến Nghé', lat: 10.7769, lng: 106.7009 },
  { province: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', ward: 'Phường 25', lat: 10.8087, lng: 106.7143 },
  { province: 'TP. Hồ Chí Minh', district: 'Quận 7', ward: 'Tân Phú', lat: 10.7361, lng: 106.7216 },
  { province: 'TP. Hồ Chí Minh', district: 'Quận 3', ward: 'Võ Thị Sáu', lat: 10.7831, lng: 106.6942 },
  { province: 'Đà Nẵng', district: 'Hải Châu', ward: 'Thạch Thang', lat: 16.0678, lng: 108.2208 },
  { province: 'Đà Nẵng', district: 'Thanh Khê', ward: 'Thanh Khê Tây', lat: 16.0724, lng: 108.1910 },
  { province: 'Cần Thơ', district: 'Ninh Kiều', ward: 'An Hội', lat: 10.0341, lng: 105.7880 },
  { province: 'Bình Dương', district: 'Thủ Dầu Một', ward: 'Phú Cường', lat: 10.9804, lng: 106.6519 },
  { province: 'Đồng Nai', district: 'Biên Hòa', ward: 'Trung Dũng', lat: 10.9460, lng: 106.8230 },
  { province: 'Hải Phòng', district: 'Ngô Quyền', ward: 'Lạc Viên', lat: 20.8449, lng: 106.6881 },
  { province: 'Khánh Hòa', district: 'Nha Trang', ward: 'Vĩnh Nguyên', lat: 12.2388, lng: 109.1967 },
];

// ── Post templates theo category ─────────────────────────────────────────────
const templates: Record<string, Array<{ title: string; desc: string; priceRange: [number, number]; type: 'sell' | 'give' }>> = {
  electronics: [
    { title: 'Tai nghe Sony WH-1000XM4 chống ồn, còn bảo hành', desc: 'Tai nghe Sony WH-1000XM4 mua 8 tháng, chống ồn cực tốt. Còn bảo hành 4 tháng. Kèm túi đựng và cáp sạc gốc. Lý do bán: được tặng tai nghe mới.', priceRange: [3500000, 5200000], type: 'sell' },
    { title: 'Loa Bluetooth JBL Flip 5, pin trâu 12 tiếng', desc: 'Loa JBL Flip 5 màu xanh dương. Dùng 6 tháng, âm thanh to và trầm. Pin còn 90% sức khỏe. Chống nước IPX7. Kèm cáp sạc USB-C.', priceRange: [1200000, 1800000], type: 'sell' },
    { title: 'Máy ảnh Canon EOS M50 Mark II + kit 15-45mm', desc: 'Canon EOS M50 Mark II thân máy đẹp, màn hình lật 180 độ, quay 4K. Kit lens 15-45mm IS STM sắc nét. Kèm pin dự phòng, túi đựng, thẻ 64GB.', priceRange: [9000000, 13000000], type: 'sell' },
    { title: 'Điện thoại iPhone 11 128GB quốc tế, pin 87%', desc: 'iPhone 11 màu đen, 128GB, quốc tế. Pin 87%, máy không lỗi, camera đẹp. Kèm cáp, không kèm sạc. Máy dùng cá nhân, không va đập, không sửa chữa.', priceRange: [5500000, 7500000], type: 'sell' },
    { title: 'Smartwatch Samsung Galaxy Watch 4 44mm', desc: 'Samsung Galaxy Watch 4, 44mm, màu đen. Dùng 5 tháng. Đo nhịp tim, SpO2, theo dõi giấc ngủ. Pin khoảng 1,5 ngày. Kèm cáp sạc.', priceRange: [2200000, 3000000], type: 'sell' },
    { title: 'Chuột gaming Logitech G304 không dây', desc: 'Logitech G304 không dây, sensor HERO 12K, pin AA dùng 9 tháng. Dùng 4 tháng, còn rất mới. Kèm hộp, USB receiver. Đổi sang gaming có dây nên bán.', priceRange: [600000, 900000], type: 'sell' },
    { title: 'Bàn phím cơ Keychron K6 Switch Red hot swap', desc: 'Keychron K6 65%, hot swap, switch Gateron Red Linear. Layout compact tiện lợi. Bluetooth/USB. Dùng 3 tháng, gõ êm không ồn ào.', priceRange: [1400000, 2000000], type: 'sell' },
    { title: 'Màn hình LG 24" IPS Full HD 75Hz', desc: 'Màn hình LG 24MK430H-B, 24 inch IPS, Full HD, 75Hz, AMD FreeSync. Màu hiển thị đẹp, không điểm chết. Dùng 1 năm. Kèm dây HDMI và nguồn.', priceRange: [2500000, 3500000], type: 'sell' },
    { title: 'Tặng bộ phím chuột cũ cho ai cần', desc: 'Bộ bàn phím + chuột văn phòng thương hiệu thường, dùng được bình thường. Tặng ai ở gần lấy giúp, không giao hàng. Bàn phím còn đủ phím, chuột còn click tốt.', priceRange: [0, 0], type: 'give' },
  ],
  computer: [
    { title: 'Laptop Dell XPS 15 9500 i7-10750H, RTX 1650Ti', desc: 'Dell XPS 15 9500, Core i7-10750H, RAM 16GB, SSD 512GB, card rời RTX 1650Ti. Màn hình OLED 4K cảm ứng. Dùng 2 năm, pin còn 78%. Kèm sạc 130W.', priceRange: [18000000, 25000000], type: 'sell' },
    { title: 'MacBook Air M1 2020 8GB/256GB còn BH Apple', desc: 'MacBook Air M1 2020, màu Space Gray, 8GB RAM, 256GB SSD. Còn bảo hành Apple đến tháng 12/2025. Pin 200 chu kỳ. Kèm hộp, sạc magsafe.', priceRange: [16000000, 20000000], type: 'sell' },
    { title: 'PC Gaming RTX 3060 + i5-12400F full build', desc: 'Build PC: i5-12400F, B660M, RTX 3060 12GB, 16GB DDR4, SSD 500GB + HDD 1TB, case mid-tower có led. Chơi game 1440p mượt. Kèm bàn phím, chuột gaming.', priceRange: [14000000, 18000000], type: 'sell' },
    { title: 'Laptop Asus VivoBook 15 i5-1135G7 còn mới 95%', desc: 'Asus VivoBook 15, i5-1135G7, RAM 8GB, SSD 512GB, màn hình FHD 15.6". Dùng 8 tháng, mua 1 chiếc nữa nên bán. Pin 5-6 tiếng, vỏ không trầy.', priceRange: [8500000, 11000000], type: 'sell' },
    { title: 'SSD Samsung 970 EVO Plus 500GB M.2 NVMe', desc: 'SSD Samsung 970 EVO Plus 500GB M.2 NVMe còn rất mới, nâng cấp lên 1TB nên bán. Tốc độ đọc 3500MB/s, ghi 3300MB/s. Dùng 6 tháng không lỗi.', priceRange: [800000, 1200000], type: 'sell' },
    { title: 'RAM Kingston 16GB DDR4 3200MHz', desc: 'RAM Kingston HyperX Fury 16GB (2x8GB) DDR4 3200MHz. Nâng cấp lên 32GB nên bán. Chạy ổn định, không lỗi. Kèm hộp gốc.', priceRange: [500000, 800000], type: 'sell' },
    { title: 'Laptop gaming Lenovo Legion 5 Gen 6 RTX 3060', desc: 'Lenovo Legion 5 Gen 6, Ryzen 7 5800H, RTX 3060, 16GB RAM, 512GB SSD, màn hình 165Hz. Gaming máy lạnh tốt, không throttle. Dùng 1 năm.', priceRange: [18000000, 23000000], type: 'sell' },
    { title: 'Màn hình gaming ASUS TUF 27" 165Hz IPS', desc: 'ASUS TUF Gaming VG27AQ 27" IPS, 2K, 165Hz, G-Sync. Màu sắc xuất sắc, phản hồi 1ms. Dùng 1.5 năm, không điểm chết. Kèm nguồn và cáp DP.', priceRange: [5000000, 7000000], type: 'sell' },
    { title: 'Tặng laptop cũ Win 10 cho học sinh cần học', desc: 'Laptop cũ Lenovo ThinkPad T440s i5 thế hệ 4, RAM 8GB, SSD 128GB. Máy chạy ổn Win 10, dùng được Word, Excel, lướt web. Tặng cho học sinh hoàn cảnh khó khăn. Liên hệ gặp mặt.', priceRange: [0, 0], type: 'give' },
  ],
  furniture: [
    { title: 'Bàn làm việc gỗ tự nhiên 120x60cm còn mới', desc: 'Bàn làm việc mặt gỗ MDF phủ melamine, kích thước 120x60x75cm. Chân thép sơn tĩnh điện. Mua 1 năm, ít dùng do chuyển nhà. Không xước, không mối mọt.', priceRange: [900000, 1500000], type: 'sell' },
    { title: 'Giường ngủ gỗ thông 1m6 x 2m kèm đệm', desc: 'Giường gỗ thông Newwood, 1m6x2m, màu nâu tự nhiên. Kèm đệm foam dày 20cm. Dùng 3 năm còn rất tốt. Người mua tự thuê xe, hỗ trợ tháo lắp.', priceRange: [3000000, 5000000], type: 'sell' },
    { title: 'Tủ quần áo 4 cánh gương toàn thân IKEA PAX', desc: 'Tủ IKEA PAX 4 cánh, có gương toàn thân 2 cánh, thanh treo và ngăn kéo. Kích thước 200x60x236cm. Dùng 2 năm, còn tốt. Tháo ra từng miếng, có hướng dẫn lắp.', priceRange: [4000000, 6500000], type: 'sell' },
    { title: 'Kệ sách 5 tầng gỗ ép trắng, dễ tháo lắp', desc: 'Kệ sách 5 tầng, gỗ MDF trắng, kích thước 80x30x180cm. Chịu tải tốt, không oằn. Mua chuyển nhà nên bán. Tháo rời 6 miếng dễ vận chuyển.', priceRange: [400000, 700000], type: 'sell' },
    { title: 'Sofa da cao cấp 3 chỗ màu nâu cognac', desc: 'Sofa da thật 3 chỗ ngồi, màu nâu cognac sang trọng. Khung gỗ chắc chắn, đệm foam cao su non. Dùng 3 năm, da không bong tróc, không rách. Lý do: mua nhà mới thay sofa vải.', priceRange: [6000000, 9000000], type: 'sell' },
    { title: 'Bàn ăn kính cường lực 6 ghế màu trắng', desc: 'Bộ bàn ăn kính cường lực oval, 6 ghế nệm đệm trắng. Kích thước bàn 160x90cm. Dùng 2 năm sạch sẽ, không vỡ, không xước. Kèm 6 ghế đủ bộ.', priceRange: [3500000, 5500000], type: 'sell' },
    { title: 'Tặng kệ gỗ nhỏ 3 tầng cho ai cần', desc: 'Kệ gỗ nhỏ 3 tầng, kích thước 60x30x90cm, màu nâu. Dùng làm kệ sách hoặc kệ trang trí đều được. Ai ở gần Quận 7 lấy giúp mình, không giao hàng.', priceRange: [0, 0], type: 'give' },
    { title: 'Ghế văn phòng có gối đầu chỉnh độ cao', desc: 'Ghế văn phòng ngả lưng được, có gối đầu, bánh xe, chỉnh độ cao khí nén. Ngồi 8 tiếng thoải mái. Dùng 1 năm, lưng ghế còn chắc chắn.', priceRange: [1200000, 1800000], type: 'sell' },
  ],
  clothing: [
    { title: 'Áo khoác denim Levi\'s size M nam, mới 95%', desc: 'Áo khoác jeans Levi\'s size M (48-52kg), màu xanh đậm vintage. Mua ở cửa hàng chính hãng, mặc vài lần. Chất liệu dày dặn, form đẹp. Rửa sạch trước khi bán.', priceRange: [400000, 700000], type: 'sell' },
    { title: 'Váy đầm maxi hoa nhí đi biển, size S-M', desc: 'Váy maxi hoa nhí màu trắng xanh, chất voan mỏng nhẹ, thích hợp đi biển hoặc đi chơi. Size S-M (cao 155-163cm, 45-55kg). Mặc 2-3 lần còn rất đẹp.', priceRange: [150000, 280000], type: 'sell' },
    { title: 'Áo phông Uniqlo các màu size M, L mặc đẹp', desc: 'Thanh lý 5 áo phông Uniqlo cotton 100%, màu trắng, đen, xám, xanh navy, đỏ đô. Size M và L. Mặc ít, còn phom đẹp. Bán cả bộ 5 cái.', priceRange: [300000, 500000], type: 'sell' },
    { title: 'Quần jean nam Zara slim fit size 31', desc: 'Quần jean Zara slim fit màu xanh nhạt, size 31. Mặc 3-4 lần, giặt thủ công. Chất vải tốt, không phai màu. Bán vì lên cân không mặc vừa.', priceRange: [200000, 350000], type: 'sell' },
    { title: 'Áo dài truyền thống màu hồng size M mới 99%', desc: 'Áo dài lụa tơ tằm màu hồng phấn, thêu hoa sen vàng. Size M (chiều cao 155-160cm). Mặc 1 lần trong tiệc cưới, giặt khô rồi. Kèm quần trắng đồng bộ.', priceRange: [500000, 900000], type: 'sell' },
    { title: 'Giày sneaker Nike Air Force 1 size 42 real', desc: 'Nike Air Force 1 Low màu trắng size 42, mua tại Nike chính hãng. Mặc khoảng 10 lần, vệ sinh sạch. Không có hộp. Đế còn bám tốt.', priceRange: [800000, 1300000], type: 'sell' },
    { title: 'Tặng quần áo trẻ em 2-5 tuổi nhiều loại', desc: 'Gói 15 bộ quần áo trẻ em 2-5 tuổi, đủ mùa hè lẫn mùa đông. Con lớn nhanh không mặc hết. Quần áo sạch, không rách, không ố. Tặng ai có bé nhỏ.', priceRange: [0, 0], type: 'give' },
    { title: 'Túi xách da nữ thương hiệu ALDO màu camel', desc: 'Túi ALDO da PU màu camel (nâu vàng), quai ngắn và quai dài đổi được. Kích thước vừa, đựng điện thoại, ví, mỹ phẩm đủ. Dùng 6 tháng, không bong da.', priceRange: [300000, 500000], type: 'sell' },
  ],
  books: [
    { title: 'Bộ sách Đắc Nhân Tâm + 7 Thói Quen + Nghĩ Giàu', desc: 'Bộ 3 cuốn sách kỹ năng sống kinh điển: Đắc Nhân Tâm, 7 Thói Quen Để Thành Đạt, Nghĩ Giàu Làm Giàu. Sách gốc Nhà xuất bản uy tín, còn mới 90%.', priceRange: [120000, 200000], type: 'sell' },
    { title: 'Sách giáo khoa lớp 10 đủ bộ 12 môn', desc: 'Đủ 12 cuốn sách giáo khoa lớp 10 chương trình mới. Con học xong không dùng nữa. Sách còn mới, không viết, không rách. Ai có con học lớp 10 cần thì lấy.', priceRange: [0, 0], type: 'give' },
    { title: 'Truyện tranh One Piece tập 1-50 tiếng Việt', desc: 'One Piece tiếng Việt bản NXB Kim Đồng tập 1 đến 50. Tình trạng cũ nhưng đọc được, không rách bìa. Bán cả bộ 50 tập, không bán lẻ.', priceRange: [300000, 600000], type: 'sell' },
    { title: 'Sách luyện thi IELTS Cambridge 13, 14, 15', desc: 'Bộ 3 cuốn Cambridge IELTS 13, 14, 15 kèm CD. Sách nhập khẩu bản gốc. Có ghi chú bút chì nhẹ, xóa sạch được. Luyện thi xong không cần nữa.', priceRange: [200000, 350000], type: 'sell' },
    { title: 'Tủ sách kinh tế tài chính 20 cuốn', desc: '20 cuốn sách kinh tế-tài chính: Cha giàu cha nghèo, Nhà đầu tư thông minh, Dạy con làm giàu, Peter Lynch, Warren Buffett... Sách còn tốt, đọc rất bổ ích.', priceRange: [400000, 700000], type: 'sell' },
    { title: 'Giáo trình đại học Kinh tế Quốc dân nhiều môn', desc: 'Thanh lý giáo trình đại học: Kinh tế vi/vĩ mô, Kế toán, Tài chính doanh nghiệp, Marketing, Quản trị. Khoảng 15 cuốn. Ai học kinh tế cần thì lấy, tặng free.', priceRange: [0, 0], type: 'give' },
    { title: 'Từ điển Anh-Việt Nhà xuất bản Khoa học', desc: 'Từ điển Anh-Việt dày 1800 trang, NXB Khoa học và Kỹ thuật. Tình trạng còn rất tốt, bìa cứng không bong. Mua cho con nhưng con thích tra Google.', priceRange: [80000, 150000], type: 'sell' },
    { title: 'Bộ Harry Potter tiếng Việt đủ 7 tập bìa cứng', desc: 'Bộ Harry Potter đủ 7 tập bản bìa cứng đặc biệt, NXB Trẻ. Tình trạng 85%, có 2-3 cuốn bìa hơi ố vàng theo thời gian. Không mất trang, không rách.', priceRange: [500000, 800000], type: 'sell' },
  ],
  sports: [
    { title: 'Vợt cầu lông Yonex Astrox 88D Pro carbon', desc: 'Vợt Yonex Astrox 88D Pro sợi carbon toàn thân, cân nặng 4U. Mua 8 tháng, đánh khoảng 30 buổi. Cán còn tốt, mặt lưới còn căng. Kèm bao vợt.', priceRange: [1800000, 2800000], type: 'sell' },
    { title: 'Xe đạp thể thao Giant ATX 610 size M', desc: 'Giant ATX 610 khung nhôm size M (chiều cao 165-178cm), 27 tốc độ, phanh đĩa thủy lực. Dùng 1 năm, xe đi đường núi nhẹ. Gầm bảo dưỡng định kỳ. Không tai nạn.', priceRange: [5000000, 7500000], type: 'sell' },
    { title: 'Thảm yoga TPE 6mm hai lớp chống trượt', desc: 'Thảm yoga TPE 6mm dày hai lớp, kích thước 183x61cm màu xanh lá. Dùng 6 tháng, chống trượt tốt. Rửa sạch trước khi bán. Kèm dây đeo.', priceRange: [200000, 350000], type: 'sell' },
    { title: 'Bộ tạ tay 5kg x 2 + giá đỡ', desc: 'Bộ 2 quả tạ tay 5kg + 2 quả 3kg + giá đỡ để sàn. Mua khi dịch, giờ gym lại không dùng nữa. Tạ nhựa bọc xi măng, không rỉ sét. Bán cả bộ.', priceRange: [300000, 600000], type: 'sell' },
    { title: 'Giày chạy bộ Asics Gel-Nimbus 23 size 43', desc: 'Asics Gel-Nimbus 23 size 43, màu navy/xanh. Chạy khoảng 200km (3 tháng). Đế còn tốt, không mòn nhiều. Chuyển sang Brooks nên bán. Giặt sạch rồi.', priceRange: [1500000, 2500000], type: 'sell' },
    { title: 'Máy chạy bộ điện Oreni OR-12 có gấp gọn', desc: 'Máy chạy bộ điện Oreni OR-12, tốc độ 1-12km/h, chiều dài băng 110cm. Dùng 1 năm, motor còn êm, không tiếng ồn. Gấp gọn để góc phòng. Kèm hướng dẫn.', priceRange: [4000000, 6000000], type: 'sell' },
    { title: 'Tặng bộ bóng đá size 4 cũ cho câu lạc bộ', desc: 'Bộ 3 quả bóng đá size 4 còn đá được, hơi cũ. Tặng cho câu lạc bộ thiếu nhi hoặc trường học. Ai cần liên hệ lấy ở Quận Bình Tân.', priceRange: [0, 0], type: 'give' },
    { title: 'Kính bơi Speedo Biofuse 2.0 chống UV', desc: 'Kính bơi Speedo Biofuse 2.0, đệm silicon mềm, tráng chống tia UV và chống sương mờ. Mua 5 tháng, đi bơi khoảng 20 buổi. Gioăng cao su còn tốt.', priceRange: [200000, 380000], type: 'sell' },
  ],
  toys: [
    { title: 'Bộ Lego Technic 42096 Porsche 911 RSR', desc: 'Lego Technic 42096 Porsche 911 RSR, 1580 miếng. Đã lắp 1 lần rồi tháo ra, còn đủ chi tiết, có hướng dẫn gốc. Hộp hơi nhàu nhưng set còn đủ.', priceRange: [1500000, 2500000], type: 'sell' },
    { title: 'Xe điều khiển từ xa Traxxas Slash 2WD RTR', desc: 'Xe RC Traxxas Slash 2WD đủ pin chạy, tốc độ đến 55km/h. Dùng 6 tháng, đã nâng cấp lốp và giảm xóc. Kèm remote, sạc, 2 pin LiPo 5000mAh.', priceRange: [3000000, 5000000], type: 'sell' },
    { title: 'Búp bê Barbie đủ bộ 15 món phụ kiện', desc: 'Bộ búp bê Barbie Fashion gồm 3 búp bê + 15 bộ quần áo + phụ kiện. Con gái lớn không chơi nữa. Còn đầy đủ, không thiếu chi tiết quan trọng.', priceRange: [300000, 600000], type: 'sell' },
    { title: 'Đồ chơi xếp hình gỗ Montessori 50 miếng', desc: 'Bộ xếp hình gỗ Montessori 50 miếng hình dạng khác nhau, sơn màu an toàn không độc hại. Phù hợp bé 2-6 tuổi. Dùng 1 năm còn đủ bộ, không nứt vỡ.', priceRange: [200000, 380000], type: 'sell' },
    { title: 'Xe đẩy em bé Aprica Optia 360 độ còn mới', desc: 'Xe đẩy Aprica Optia quay 360 độ, ghế ngả nhiều tư thế, có mái che UV. Con lớn rồi không dùng. Dùng 1.5 năm, vải ghế có thể tháo giặt. Còn tốt.', priceRange: [3000000, 5000000], type: 'sell' },
    { title: 'Đồ chơi máy bay điều khiển DJI Mini SE', desc: 'Drone DJI Mini SE 249g, camera 2.7K, pin 30 phút, tầm xa 4km. Dùng 4 tháng khoảng 10 lần bay. Không tai nạn, không vỡ cánh. Kèm 1 pin dự phòng, túi xách.', priceRange: [5000000, 7000000], type: 'sell' },
    { title: 'Tặng đồ chơi trẻ em đủ loại cho nhà khó khăn', desc: 'Gói đồ chơi trẻ em gồm: ô tô nhựa, búp bê, bóng, tranh tô màu, bảng ghép chữ. Tặng miễn phí cho gia đình khó khăn có bé nhỏ 1-7 tuổi. Liên hệ để hẹn nhận.', priceRange: [0, 0], type: 'give' },
    { title: 'Bộ cờ vua gỗ cao cấp kèm đồng hồ đếm thời gian', desc: 'Bộ cờ vua gỗ hương tự nhiên, quân cờ nặng dạng Staunton size 4. Kèm đồng hồ đếm giờ dạng bấm cơ. Hộp gỗ đựng sang trọng. Tặng con học nhưng con thích game hơn.', priceRange: [500000, 900000], type: 'sell' },
  ],
  appliances: [
    { title: 'Máy lạnh Daikin 1.5HP inverter tiết kiệm điện', desc: 'Daikin FTKQ35WAVMV 1.5HP inverter thế hệ mới. Dùng 2 năm, gas còn đầy, bộ lọc vệ sinh xong. Lắp đặt thêm 500k. Lý do: chuyển nhà sang phòng trọ nhỏ hơn.', priceRange: [5000000, 8000000], type: 'sell' },
    { title: 'Máy giặt Samsung 8.5kg cửa trước Bubble', desc: 'Samsung WW85T4040CE/SV 8.5kg cửa trước, Bubble technology, 1400 vòng/phút. Dùng 2 năm, chạy êm, không rò rỉ. Kèm van cấp nước.', priceRange: [5500000, 8000000], type: 'sell' },
    { title: 'Tủ lạnh Panasonic 268L ngăn đá dưới', desc: 'Panasonic NR-BL307PKVN 268L ngăn đá dưới, inverter tiết kiệm điện. Dùng 3 năm, lạnh tốt, không đọng sương cửa. Chuyển nhà mua tủ side-by-side nên bán.', priceRange: [4500000, 6500000], type: 'sell' },
    { title: 'Lò vi sóng Panasonic 27L có nướng', desc: 'Panasonic NN-CT57HMYUE 27L, có chức năng nướng và hấp, 1000W. Dùng 2 năm, mặt trong sạch. Bếp mới có sẵn lò nướng nên bán lò này.', priceRange: [1500000, 2500000], type: 'sell' },
    { title: 'Máy hút bụi Dyson V10 Animal không dây', desc: 'Dyson V10 Animal cordless, pin 60 phút, 6 phụ kiện. Dùng 1 năm, hút mạnh như mới, bộ lọc vệ sinh định kỳ. Kèm trạm sạc treo tường.', priceRange: [5000000, 8000000], type: 'sell' },
    { title: 'Nồi cơm điện tử Cuckoo 1.08L cho 2-4 người', desc: 'Nồi cơm Cuckoo CRP-P1009S 1.08L áp suất, cơm dẻo mềm. Dùng 2 năm, cơm không khê. Nồi trong sáng bóng. Kèm muỗng, cốc đong gạo.', priceRange: [1200000, 2000000], type: 'sell' },
    { title: 'Tặng quạt đứng cũ Panasonic còn chạy tốt', desc: 'Quạt đứng Panasonic 3 tốc độ, đường kính cánh 40cm. Dùng 4 năm còn chạy ngon, không ồn, không rung. Mua điều hòa rồi tặng ai cần dùng.', priceRange: [0, 0], type: 'give' },
    { title: 'Máy lọc nước RO Kangaroo 8 lõi gắn tủ bếp', desc: 'Máy lọc nước RO Kangaroo Hydrogen KG100HG 8 lõi, tạo nước kiềm hydrogen. Dùng 1 năm, thay lõi định kỳ 6 tháng. Kèm hóa đơn mua hàng. Tháo tự mang.', priceRange: [4000000, 6000000], type: 'sell' },
  ],
  motorbike: [
    { title: 'Honda Vision 2022 biển HN, đi 8.000km', desc: 'Honda Vision 2022 màu trắng ngọc trai, biển Hà Nội chính chủ. Đi 8.000km, máy êm không tiêu nhớt. Lốp còn mới, phanh ABS. Giấy tờ đầy đủ sang tên dễ.', priceRange: [25000000, 32000000], type: 'sell' },
    { title: 'Yamaha Exciter 155 VVA 2021 độ nhẹ', desc: 'Exciter 155 VVA 2021 màu đen nhám, đi 15.000km. Độ nhẹ: mâm bông, pô thể thao, đèn LED. Máy chưa bung, sên nhớt thay định kỳ. Bán vì mua ô tô.', priceRange: [35000000, 42000000], type: 'sell' },
    { title: 'Xe tay ga SH Mode 125cc 2020, ít đi', desc: 'SH Mode 125cc 2020 màu xanh rêu, đi 6.000km. Xe chính chủ 1 chủ, bảo dưỡng honda định kỳ. Màu hiếm đẹp. Giá fix không thương lượng.', priceRange: [40000000, 50000000], type: 'sell' },
    { title: 'Honda Wave Alpha 2019 giấy tờ đầy đủ', desc: 'Honda Wave Alpha 110 2019 màu đỏ đen, đi 18.000km. Máy êm không tiêu dầu. Giấy tờ chính chủ. Không tai nạn. Bán vì chuyển xe máy điện.', priceRange: [12000000, 18000000], type: 'sell' },
    { title: 'Xe côn tay Yamaha FZ155i 2020 xanh đen', desc: 'FZ155i 2020 màu xanh đen, đi 22.000km. Xe côn khỏe, máy chưa can thiệp. Lốp Michelin mới thay. Sên nhông đĩa mới 5.000km. Xem xe ở Thủ Đức.', priceRange: [40000000, 50000000], type: 'sell' },
    { title: 'Suzuki GD110HU 2022, xe công nghệ tiết kiệm', desc: 'GD110HU 2022 màu trắng xanh, đi 12.000km. Xe số nhỏ tiết kiệm xăng 1.5L/100km. Dùng đi làm hàng ngày, bảo dưỡng đúng hạn. Bán vì mua Vision cho vợ.', priceRange: [16000000, 22000000], type: 'sell' },
    { title: 'Tặng xe đạp điện cũ cho ai cần đi làm', desc: 'Xe đạp điện cũ còn chạy được khoảng 30km/lần sạc. Pin yếu dần, nếu thay pin mới (~1.5tr) thì dùng ngon. Tặng cho người thực sự cần dùng đi làm, ưu tiên sinh viên.', priceRange: [0, 0], type: 'give' },
    { title: 'Xe máy điện VinFast Feliz S 2022 như mới', desc: 'VinFast Feliz S 2022 màu trắng, pin lithium, tầm xa 100km/lần sạc. Đi 5.000km, xe còn bảo hành VinFast. Không cần đăng ký, phí cầu đường 0 đồng.', priceRange: [22000000, 28000000], type: 'sell' },
  ],
  bicycle: [
    { title: 'Xe đạp địa hình MTB Giant Talon 3 27.5"', desc: 'Giant Talon 3 27.5 inch, khung nhôm M, phanh đĩa cơ, 21 tốc độ Shimano Altus. Dùng 1 năm, xe leo núi nhẹ. Bảo dưỡng sên xích định kỳ.', priceRange: [5500000, 8000000], type: 'sell' },
    { title: 'Xe đạp thành phố Peugeot LC01 size M màu đỏ', desc: 'Peugeot LC01 urban bike, khung nhôm, phanh rim Tektro, 7 tốc độ. Đèn LED trước sau dùng điện bánh xe. Dùng đi làm 1 năm, không tai nạn. Còn giấy bảo hành.', priceRange: [4000000, 6000000], type: 'sell' },
    { title: 'Xe đạp gấp Trinx Tempo 1.0 bánh 20"', desc: 'Trinx Tempo 1.0 xe gấp bánh 20 inch, 6 tốc độ, gập nhỏ gọn mang lên tàu/xe buýt được. Dùng đi làm 8 tháng. Tay lái, yên chỉnh được độ cao.', priceRange: [2500000, 4000000], type: 'sell' },
    { title: 'Xe đạp trẻ em 20 inch có bánh phụ', desc: 'Xe đạp trẻ em 20 inch màu xanh lá, có 2 bánh phụ tháo được, phanh tay 2 bên. Con lớn rồi không đi. Dùng 1.5 năm còn tốt.', priceRange: [600000, 1000000], type: 'sell' },
    { title: 'Xe đạp road Merida Scultura 100 size 52', desc: 'Merida Scultura 100 khung nhôm size 52, bánh 700c, 16 tốc độ Claris. Dùng 6 tháng, xe đua đường nhựa nhẹ và nhanh. Lốp Vittoria. Kèm đồng hồ tốc độ.', priceRange: [7000000, 10000000], type: 'sell' },
    { title: 'Tặng xe đạp cũ còn đi được cho trẻ em', desc: 'Xe đạp mini 16 inch màu hồng cho bé gái 4-8 tuổi. Lốp có thể bơm lại, phanh còn hoạt động. Tặng cho gia đình nào có bé cần học đi xe. Tự đến lấy tại Hà Đông.', priceRange: [0, 0], type: 'give' },
    { title: 'Xe đạp điện trợ lực Giant Trance E+ 1 Pro', desc: 'Giant Trance E+ 1 Pro 2021 xe điện trợ lực, motor SyncDrive Pro 85Nm, pin 500Wh, tầm xa 80km. Chạy địa hình tốt. Dùng 1 năm, còn bảo hành. Giá gốc 90 triệu.', priceRange: [45000000, 60000000], type: 'sell' },
    { title: 'Phụ kiện xe đạp: mũ bảo hiểm, găng tay, bình nước', desc: 'Combo phụ kiện đi xe đạp: mũ bảo hiểm Giro Agilis size M, găng tay Shimano size L, bình nước thể thao, đèn trước Cateye, khóa càng Kryptonite. Bán cả bộ.', priceRange: [600000, 1000000], type: 'sell' },
  ],
  other: [
    { title: 'Bộ dụng cụ sửa chữa gia dụng 58 món Ingco', desc: 'Bộ dụng cụ Ingco 58 món đầy đủ: búa, tua vít, kìm, cờ lê, thước cuộn, dao dọc giấy... Hộp nhựa xếp gọn. Mua 1 năm dùng vài lần, còn mới.', priceRange: [400000, 700000], type: 'sell' },
    { title: 'Cây đàn guitar acoustic Yamaha F310', desc: 'Guitar acoustic Yamaha F310, thùng dương, dây đồng. Dùng 2 năm, còn âm đẹp, cần không cong. Tặng bao đựng và capo. Học xong không có thời gian chơi nữa.', priceRange: [1500000, 2500000], type: 'sell' },
    { title: 'Máy ảnh phim Olympus OM-1 vintage', desc: 'Máy ảnh phim Olympus OM-1 vintage 1972, ống kính Zuiko 50mm f/1.4. Máy còn hoạt động tốt, cần thay pin 1.35V. Chụp film 35mm. Cho người yêu nhiếp ảnh film.', priceRange: [2000000, 3500000], type: 'sell' },
    { title: 'Chậu cây cảnh xương rồng đủ loại 10 chậu', desc: '10 chậu xương rồng mini đủ loại: xương rồng tai thỏ, golden barrel, cactus hình trụ... Trồng chậu đất nung và nhựa. Tặng cả 10 chậu, tự đến lấy ở Cầu Giấy.', priceRange: [0, 0], type: 'give' },
    { title: 'Bộ nồi inox 5 cái Fissler Profi Collection', desc: 'Bộ nồi Fissler Profi inox 18/10 gồm 5 cái (16, 20, 24cm + nắp). Dùng 3 năm, đáy không cong, không bám. Rửa máy được. Nâng cấp lên nồi áp suất nên bán.', priceRange: [1500000, 2500000], type: 'sell' },
    { title: 'Đàn piano điện Yamaha P-125 88 phím nặng', desc: 'Yamaha P-125 đàn piano điện 88 phím nặng GH, có Bluetooth, 24 âm sắc. Dùng 1.5 năm, phím bấm còn nhạy. Kèm sustain pedal, giá đỡ X, bench. Con thôi học nhạc.', priceRange: [8000000, 12000000], type: 'sell' },
    { title: 'Dụng cụ cắm trại: lều, túi ngủ, bếp dã ngoại', desc: 'Bộ cắm trại: lều 3 người Naturehike Cloud-up 3, túi ngủ -5°C, bếp gas dã ngoại Kovea, nồi titan 1.3L. Dùng 5 chuyến, còn tốt. Bán vì cả nhà không hay đi nữa.', priceRange: [2000000, 3500000], type: 'sell' },
    { title: 'Kính cận gọng kim loại nhiều màu mới 100%', desc: '5 gọng kính cận kim loại chính hãng, chưa lắp tròng, mới nguyên tem. Các màu: vàng gold, đen matte, bạc, rose gold, đồng. Size phù hợp mặt nhỏ đến vừa. Giá 1 cái.', priceRange: [100000, 200000], type: 'sell' },
    { title: 'Tặng đồ nội thất văn phòng thanh lý', desc: 'Văn phòng chuyển địa điểm tặng: 3 bàn làm việc gỗ ép, 5 ghế xoay, 2 tủ tài liệu, 1 giá sách. Ai ở Quận Tân Bình đến tự tháo dỡ mang về. Miễn phí hoàn toàn.', priceRange: [0, 0], type: 'give' },
  ],
};

const categories = Object.keys(templates);

// ── Users mới ────────────────────────────────────────────────────────────────
const newUsers = [
  { name: 'Bình', phone: '+84901111001' },
  { name: 'Thảo', phone: '+84901111002' },
  { name: 'Hùng', phone: '+84901111003' },
  { name: 'Linh', phone: '+84901111004' },
  { name: 'Quân', phone: '+84901111005' },
  { name: 'Phương', phone: '+84901111006' },
  { name: 'Tuấn', phone: '+84901111007' },
  { name: 'Ngọc', phone: '+84901111008' },
  { name: 'Khoa', phone: '+84901111009' },
  { name: 'Trang', phone: '+84901111010' },
];

async function main() {
  console.log('👤 Tạo 10 users mới...');

  const users = await Promise.all(
    newUsers.map(u =>
      prisma.user.create({
        data: {
          name: u.name,
          phone: u.phone,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`,
        },
      })
    )
  );
  console.log(`   ✅ Đã tạo ${users.length} users`);

  console.log('📦 Tạo bài đăng (~100 bài/user)...');

  let totalPosts = 0;

  for (const user of users) {
    const postData: any[] = [];

    // ~9-10 bài mỗi category × 11 categories ≈ 99-110 bài
    for (const cat of categories) {
      const tmplList = templates[cat];
      const postsPerCat = cat === 'other' ? 10 : 9;

      for (let i = 0; i < postsPerCat; i++) {
        const tmpl = tmplList[i % tmplList.length];
        const loc = pick(locations);
        const isGive = tmpl.type === 'give';
        const price = isGive ? 0 : rand(tmpl.priceRange[0], tmpl.priceRange[1]);
        // Làm tròn giá về bội số 50k
        const roundedPrice = isGive ? 0 : Math.round(price / 50000) * 50000;

        // Thêm biến thể nhỏ vào title để tránh trùng
        const suffix = i > 0 ? ` (${['mới 95%', 'dùng ít', 'còn bảo hành', 'giá tốt', 'thương lượng', 'fix giá', 'cần bán gấp', 'xuất ngoại'][i % 8]})` : '';

        postData.push({
          title: tmpl.title + (i > 0 ? suffix : ''),
          description: tmpl.desc,
          price: roundedPrice,
          listingType: tmpl.type,
          itemCategory: cat,
          status: pick(['available', 'available', 'available', 'done']) as any,
          province: loc.province,
          district: loc.district,
          ward: loc.ward,
          addressDetail: '',
          latitude: loc.lat + (Math.random() - 0.5) * 0.05,
          longitude: loc.lng + (Math.random() - 0.5) * 0.05,
          imageLabel: nextImg(),
          viewCount: rand(0, 200),
          authorId: user.id,
          createdAt: new Date(Date.now() - rand(0, 60) * 24 * 60 * 60 * 1000),
        });
      }
    }

    // Tạo từng batch 20 để không quá tải
    for (let i = 0; i < postData.length; i += 20) {
      await prisma.post.createMany({ data: postData.slice(i, i + 20) });
    }
    totalPosts += postData.length;
    console.log(`   ✅ ${user.name}: ${postData.length} bài`);
  }

  console.log(`\n🎉 Hoàn tất! Tổng ${users.length} users + ${totalPosts} bài đăng mới.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
