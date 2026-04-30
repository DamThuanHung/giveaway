import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  'electronics', 'furniture', 'clothing', 'kitchen', 'books',
  'toys', 'sports', 'vehicles', 'beauty', 'pets',
  'tools', 'food', 'baby', 'music', 'realestate', 'service', 'other',
];

const postTitles: Record<string, string> = {
  electronics: 'iPhone 14 Pro Max 256GB như mới',
  furniture: 'Bàn làm việc gỗ tự nhiên 120cm',
  clothing: 'Áo khoác denim Zara size M còn mới',
  kitchen: 'Nồi cơm điện Panasonic 1.8L ít dùng',
  books: 'Bộ sách Đắc Nhân Tâm + Nhà Giả Kim',
  toys: 'Bộ lego Technic 500 mảnh đầy đủ',
  sports: 'Xe đạp địa hình Giant ATX 610 size M',
  vehicles: 'Honda Wave Alpha 2020 chính chủ',
  beauty: 'Máy rửa mặt Foreo Luna mini 3',
  pets: 'Lồng chim inox cao cấp 60cm',
  tools: 'Máy khoan Bosch 550W còn bảo hành',
  food: 'Máy ép chậm Hurom H-AA nguyên zin',
  baby: 'Xe đẩy em bé Aprica nhập Nhật',
  music: 'Đàn guitar acoustic Yamaha F310',
  realestate: 'Cho thuê phòng trọ 25m2 gần ĐH Bách Khoa',
  service: 'Dạy kèm Toán lớp 10-12 tại nhà',
  other: 'Thùng carton các size thanh lý',
};

const postDescriptions: Record<string, string> = {
  electronics: 'Máy còn rất mới, dùng được 3 tháng, pin trên 90%. Đầy đủ hộp phụ kiện.',
  furniture: 'Gỗ tự nhiên, mặt bàn rộng 120x60cm. Còn nguyên vẹn, không trầy xước.',
  clothing: 'Size M vừa người 60-65kg, dài tay, màu xanh denim classic. Mặc 2 lần.',
  kitchen: 'Dung tích 1.8L, nấu 3-4 người. Còn bảo hành 6 tháng. Tặng kèm cốc đong gạo.',
  books: 'Sách bìa cứng, in màu đẹp, không nhàu gáy. Đọc 1 lần còn như mới.',
  toys: 'Đầy đủ 500 mảnh, có hướng dẫn lắp ráp tiếng Việt. Phù hợp bé 8 tuổi trở lên.',
  sports: 'Khung nhôm nhẹ, 21 tốc độ Shimano. Đi khoảng 500km, lốp còn tốt.',
  vehicles: 'Biển Hà Nội, đăng kiểm còn 1 năm. Xe đẹp, không tai nạn, máy êm.',
  beauty: 'Dùng 20 lần, sạch kỹ. Kèm sạc USB gốc. Phù hợp da nhạy cảm.',
  pets: 'Lồng inox 304, kích thước 60x40x80cm. Phù hợp chim vẹt cỡ vừa.',
  tools: 'Công suất 550W, bộ mũi khoan đủ size. Còn bảo hành tại TGDĐ đến tháng 8.',
  food: 'Động cơ chậm 43 vòng/phút, không oxy hóa. Dùng 1 năm, hoạt động tốt.',
  baby: 'Nhập khẩu Nhật, khung nhôm nhẹ 6kg. Gấp gọn 1 tay. Bé 0-3 tuổi.',
  music: 'Âm thanh vang, dây mới thay. Kèm bao đựng và capo. Thích hợp người mới học.',
  realestate: 'Phòng 25m2, có gác lửng, toilet riêng. Điện nước chính chủ. Gần metro.',
  service: 'Giáo viên Toán 5 năm kinh nghiệm, tốt nghiệp ĐHBK. Cam kết kết quả.',
  other: 'Thùng carton size A4, A3, A2. Bán theo lô 20 thùng. Giá rẻ thanh lý kho.',
};

const provinces = [
  'Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
  'Nghệ An', 'Bình Dương', 'Đồng Nai', 'Khánh Hòa', 'Thừa Thiên Huế',
];

const categoryImages: Record<string, string[]> = {
  electronics: ['https://picsum.photos/seed/elec1/800/600', 'https://picsum.photos/seed/elec2/800/600'],
  furniture:   ['https://picsum.photos/seed/furn1/800/600', 'https://picsum.photos/seed/furn2/800/600'],
  clothing:    ['https://picsum.photos/seed/clth1/800/600', 'https://picsum.photos/seed/clth2/800/600'],
  kitchen:     ['https://picsum.photos/seed/kitch1/800/600', 'https://picsum.photos/seed/kitch2/800/600'],
  books:       ['https://picsum.photos/seed/book1/800/600', 'https://picsum.photos/seed/book2/800/600'],
  toys:        ['https://picsum.photos/seed/toy1/800/600', 'https://picsum.photos/seed/toy2/800/600'],
  sports:      ['https://picsum.photos/seed/sport1/800/600', 'https://picsum.photos/seed/sport2/800/600'],
  vehicles:    ['https://picsum.photos/seed/veh1/800/600', 'https://picsum.photos/seed/veh2/800/600'],
  beauty:      ['https://picsum.photos/seed/beau1/800/600', 'https://picsum.photos/seed/beau2/800/600'],
  pets:        ['https://picsum.photos/seed/pet1/800/600', 'https://picsum.photos/seed/pet2/800/600'],
  tools:       ['https://picsum.photos/seed/tool1/800/600', 'https://picsum.photos/seed/tool2/800/600'],
  food:        ['https://picsum.photos/seed/food1/800/600', 'https://picsum.photos/seed/food2/800/600'],
  baby:        ['https://picsum.photos/seed/baby1/800/600', 'https://picsum.photos/seed/baby2/800/600'],
  music:       ['https://picsum.photos/seed/mus1/800/600', 'https://picsum.photos/seed/mus2/800/600'],
  realestate:  ['https://picsum.photos/seed/real1/800/600', 'https://picsum.photos/seed/real2/800/600'],
  service:     ['https://picsum.photos/seed/svc1/800/600', 'https://picsum.photos/seed/svc2/800/600'],
  other:       ['https://picsum.photos/seed/oth1/800/600', 'https://picsum.photos/seed/oth2/800/600'],
};

const coords: Record<string, { lat: number; lng: number }> = {
  'Hà Nội': { lat: 21.0278, lng: 105.8342 },
  'TP. Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
  'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
  'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
  'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
  'Nghệ An': { lat: 18.6796, lng: 105.6813 },
  'Bình Dương': { lat: 11.3254, lng: 106.4772 },
  'Đồng Nai': { lat: 10.9459, lng: 107.0843 },
  'Khánh Hòa': { lat: 12.2388, lng: 109.1968 },
  'Thừa Thiên Huế': { lat: 16.4637, lng: 107.5909 },
};

async function main() {
  console.log('🗑️  Xóa toàn bộ data cũ...');
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.report.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  console.log('👤 Tạo 10 tài khoản test...');

  const users = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      prisma.user.create({
        data: {
          email: `${i + 1}@test.com`,
          name: `User ${i + 1}`,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=User${i + 1}`,
        },
      })
    )
  );
  console.log(`   ✅ Đã tạo ${users.length} users`);

  console.log('📦 Tạo bài đăng (mỗi user 17 bài, 1 bài/category)...');
  const posts: any[] = [];
  for (let u = 0; u < users.length; u++) {
    const user = users[u];
    const province = provinces[u];
    const coord = coords[province];
    for (const cat of categories) {
      const post = await prisma.post.create({
        data: {
          title: `[${u + 1}@test] ${postTitles[cat]}`,
          description: postDescriptions[cat],
          price: cat === 'realestate' ? 3500000 : cat === 'service' ? 150000 : Math.floor(Math.random() * 5000000) + 100000,
          itemCategory: cat,
          listingType: ['realestate', 'service', 'food'].includes(cat) ? 'sell' : (Math.random() > 0.5 ? 'sell' : 'give'),
          province,
          district: '',
          ward: '',
          addressDetail: '',
          latitude: coord.lat + (Math.random() - 0.5) * 0.05,
          longitude: coord.lng + (Math.random() - 0.5) * 0.05,
          status: 'available',
          authorId: user.id,
          images: categoryImages[cat],
          viewCount: Math.floor(Math.random() * 200),
          postType: ['realestate'].includes(cat) ? 'realestate' : 'item',
        },
      });
      posts.push(post);
    }
  }
  console.log(`   ✅ Đã tạo ${posts.length} bài đăng (${users.length} users × ${categories.length} categories)`);

  console.log('\n🎉 Seed hoàn thành!');
  console.log('─────────────────────────────────────────');
  console.log(`👤 Users : ${users.length} (1@test.com → 10@test.com)`);
  console.log(`📦 Posts : ${posts.length} (${categories.length} categories/user)`);
  console.log(`🔑 Password: 123456`);
  console.log('─────────────────────────────────────────');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
