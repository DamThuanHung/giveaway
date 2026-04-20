import { Body, Controller, Get, Param, Patch, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from './notification.service';
import * as bcrypt from 'bcrypt';

@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getAll(@Request() req) {
    return this.notificationService.getNotifications(req.user.id);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  getUnreadCount(@Request() req) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  markRead(@Param('id') id: string, @Request() req) {
    return this.notificationService.markRead(id, req.user.id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  markAllRead(@Request() req) {
    return this.notificationService.markAllRead(req.user.id);
  }

  @Post('fcm-token')
  @UseGuards(JwtAuthGuard)
  async saveFcmToken(@Request() req, @Body() body: { token: string }) {
    await this.prisma.user.update({
      where: { id: req.user.id },
      data: { fcmToken: body.token },
    });
    return { ok: true };
  }

  private checkDevSecret(secret?: string) {
    const expected = process.env.DEV_SECRET;
    if (!expected || secret !== expected) return false;
    return true;
  }


  // Endpoint test — chỉ dùng trong development/debug
  @Post('test-push')
  async testPush(@Body() body: { userId: string; title: string; message: string; secret?: string }) {
    if (!this.checkDevSecret(body.secret)) return { error: 'unauthorized' };
    if (!body.userId) return { error: 'userId required' };
    const user = await this.prisma.user.findUnique({
      where: { id: body.userId },
      select: { fcmToken: true, name: true },
    });
    if (!user?.fcmToken) return { error: 'no_fcm_token', name: user?.name };
    await this.notificationService.createNotification(
      body.userId,
      'deal',
      body.title || 'Thông báo test',
      body.message || 'Đây là thông báo test từ server.',
    );
    return { ok: true, tokenPreview: user.fcmToken.substring(0, 30) + '...' };
  }

  // Seed bài đăng test cho tất cả category
  @Post('dev/seed-posts')
  async seedPosts(@Body() body: { authorId: string; secret?: string }) {
    if (!this.checkDevSecret(body.secret)) return { error: 'unauthorized' };
    const authorId = body.authorId;
    if (!authorId) return { error: 'authorId required' };

    const user = await this.prisma.user.findUnique({ where: { id: authorId }, select: { id: true } });
    if (!user) return { error: 'User không tồn tại' };

    const provinces = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ'];

    const data: Record<string, { titles: string[]; prices: number[]; listingType?: string }[]> = {
      electronics: [{ titles: [
        'iPhone 14 Pro Max 256GB Like New', 'Samsung Galaxy S23 Ultra mới 95%',
        'MacBook Air M2 2022 nguyên zin', 'iPad Pro 11 inch 2021 còn bảo hành',
        'Tai nghe Sony WH-1000XM5 fullbox', 'Apple Watch Series 8 45mm GPS',
        'Laptop Dell XPS 13 i7 mới 90%', 'Máy ảnh Sony A7 III body only',
        'Loa JBL Charge 5 còn mới', 'Màn hình LG 27 inch 4K IPS',
      ], prices: [22000000, 19000000, 28000000, 16000000, 7000000, 9000000, 23000000, 35000000, 3500000, 8000000] }],
      furniture: [{ titles: [
        'Bàn làm việc gỗ tự nhiên 120cm', 'Ghế sofa da thật 3 chỗ ngồi',
        'Tủ quần áo 4 cánh gương', 'Bàn trà gỗ óc chó mặt kính',
        'Kệ sách gỗ 5 tầng trắng', 'Giường ngủ gỗ sồi 1m6',
        'Tủ bếp inox 304 cao cấp', 'Ghế văn phòng ergonomic Herman Miller',
        'Đèn sàn trang trí Nordic', 'Khung tranh treo tường nghệ thuật',
      ], prices: [2500000, 8000000, 4500000, 3200000, 1200000, 6000000, 7500000, 12000000, 800000, 500000] }],
      clothing: [{ titles: [
        'Áo khoác bomber unisex form rộng', 'Quần jean Levi\'s 501 size 32',
        'Áo len cashmere xanh navy', 'Váy maxi hoa nhí vintage',
        'Túi da thật handmade local brand', 'Giày sneaker Nike Air Max 270',
        'Áo sơ mi linen trắng oversize', 'Quần short kaki be basic',
        'Áo thun Uniqlo pack 3 cái', 'Mũ bucket streetwear mới 100%',
      ], prices: [350000, 700000, 1200000, 450000, 1500000, 2800000, 290000, 320000, 450000, 180000] }],
      kitchen: [{ titles: [
        'Nồi cơm điện Panasonic 1.8L', 'Máy xay sinh tố Philips 2 lít',
        'Lò vi sóng Sharp 25L inverter', 'Nồi chiên không dầu Tefal 4.2L',
        'Máy pha cà phê Delonghi tự động', 'Bộ nồi inox 5 chiếc Fissler',
        'Máy rửa bát Bosch 12 bộ', 'Bình đun siêu tốc Electrolux 1.7L',
        'Chảo đáy từ ceramic Tefal 28cm', 'Bộ dao bếp Zwilling 5 món',
      ], prices: [1200000, 800000, 3500000, 2800000, 9500000, 4200000, 15000000, 650000, 750000, 3800000] }],
      books: [{ titles: [
        'Đắc Nhân Tâm - Dale Carnegie mới 100%', 'Nhà Giả Kim - Paulo Coelho',
        'Tư Duy Nhanh Và Chậm bản dịch', 'Sapiens Lược Sử Loài Người',
        'Bộ 5 cuốn Harry Potter tiếng Việt', 'Atomic Habits - Thói quen nguyên tử',
        'Clean Code - Robert C Martin', 'Bộ truyện tranh Doraemon 45 tập',
        'Từ điển Anh-Việt Oxford 2024', 'Sách giáo khoa lớp 12 bộ đầy đủ',
      ], prices: [85000, 75000, 120000, 130000, 450000, 140000, 320000, 680000, 250000, 200000], listingType: 'give' }],
      toys: [{ titles: [
        'LEGO Technic 42141 McLaren Formula 1', 'Xe điều khiển từ xa địa hình 4WD',
        'Búp bê Barbie bộ sưu tập 2023', 'Bộ xếp hình gỗ Montessori cho bé',
        'Robot giáo dục lập trình Makeblock', 'Xe go-kart điện trẻ em',
        'Bộ đất nặn Play-Doh 24 màu', 'Trò chơi cờ tỷ phú Monopoly',
        'Súng nước Nerf Elite 2.0', 'Thú nhồi bông gấu Teddy 60cm',
      ], prices: [2800000, 1500000, 450000, 380000, 3200000, 8500000, 280000, 450000, 380000, 320000] }],
      sports: [{ titles: [
        'Xe đạp địa hình Giant ATX 860 2022', 'Máy chạy bộ điện Elipsport TM207',
        'Tạ đôi 10kg cao su nguyên bộ', 'Vợt cầu lông Yonex Astrox 100ZZ',
        'Giày chạy bộ Brooks Ghost 14', 'Bóng đá Nike Premier League size 5',
        'Áo bơi Speedo nam racing', 'Túi đeo chống nước Osprey 10L',
        'Thảm yoga TPE 6mm dày', 'Găng tay boxing Everlast Pro',
      ], prices: [6500000, 12000000, 800000, 4500000, 2800000, 450000, 650000, 1200000, 350000, 750000] }],
      vehicles: [{ titles: [
        'Honda Air Blade 150 2020 còn bảo hành', 'Yamaha Exciter 155 VVA 2021',
        'Xe đạp điện Vinfast Klara S 2022', 'Honda Wave Alpha 110 2019',
        'Xe tay ga Piaggio Liberty 125 2020', 'Yamaha NVX 155 ABS 2022',
        'Honda SH 150i 2021 biển HN', 'Xe đạp thể thao Trinx M136',
        'Ắc quy xe máy GS 12V-9Ah', 'Mũ bảo hiểm fullface AGV K1',
      ], prices: [35000000, 42000000, 22000000, 16000000, 48000000, 52000000, 75000000, 4500000, 550000, 3200000] }],
      beauty: [{ titles: [
        'Son môi MAC Ruby Woo fullbox', 'Kem dưỡng da Laneige Water Bank',
        'Máy rửa mặt Foreo Luna 3', 'Nước hoa Chanel N5 50ml còn 80%',
        'Bộ makeup Fenty Beauty starter kit', 'Kem chống nắng Anessa SPF50+ 60ml',
        'Máy sấy tóc Dyson Supersonic', 'Serum Vitamin C Obagi 30ml',
        'Bảng màu mắt Urban Decay Naked', 'Dầu gội Kerastase Bain Satin 250ml',
      ], prices: [450000, 850000, 2800000, 2200000, 1500000, 380000, 12000000, 1200000, 950000, 680000] }],
      pets: [{ titles: [
        'Chuồng chó lớn inox không gỉ', 'Đồ chơi mèo bộ 5 món tổng hợp',
        'Máy cho ăn tự động hẹn giờ 4L', 'Balo vận chuyển thú cưng thoáng khí',
        'Đệm ngủ thú cưng chống thấm', 'Vòng cổ GPS định vị chó mèo',
        'Máy lọc nước uống pet Petkit', 'Quần áo cho chó mùa đông size M',
        'Cào móng mèo tháp 3 tầng', 'Cát vệ sinh mèo Bentonite 5kg',
      ], prices: [1500000, 280000, 1200000, 850000, 450000, 2500000, 980000, 320000, 680000, 150000] }],
      tools: [{ titles: [
        'Máy khoan búa Bosch GBH 2-26 DRE', 'Bộ dụng cụ tua vít Wera 39 món',
        'Máy mài góc Makita GA9020 2000W', 'Thang nhôm gấp 3 đoạn 3m',
        'Bơm hơi điện 12V đa năng', 'Bộ cờ lê vòng miệng 12 cái',
        'Máy hàn điện Jasic MIG 200', 'Súng bắn đinh khí nén',
        'Kìm điện tử đa năng bộ 8', 'Tủ đựng dụng cụ di động 5 ngăn',
      ], prices: [2800000, 1500000, 3200000, 1800000, 650000, 780000, 8500000, 2200000, 450000, 3500000] }],
      food: [{ titles: [
        'Gạo ST25 đặc sản Sóc Trăng 10kg', 'Trà oolong Đài Loan hộp 300g',
        'Mật ong rừng nguyên chất 500ml', 'Cà phê rang xay Highlands 500g',
        'Nước mắm Phú Quốc 40 độ đạm', 'Hạt điều rang muối Bình Phước 1kg',
        'Trái cây sấy thập cẩm 500g', 'Rượu vang Pháp Bordeaux 750ml',
        'Bánh quy bơ Đan Mạch hộp thiếc', 'Dầu dừa nguyên chất ép lạnh 500ml',
      ], prices: [350000, 280000, 220000, 180000, 95000, 320000, 150000, 650000, 280000, 180000], listingType: 'give' }],
      baby: [{ titles: [
        'Xe đẩy em bé Joie Chrome DLX', 'Ghế ngồi ô tô trẻ em Maxi-Cosi',
        'Máy hút sữa điện đôi Medela', 'Nôi điện tự ru Combi 3 tốc độ',
        'Bộ quần áo sơ sinh 10 bộ size 3M', 'Bình sữa Avent Natural 260ml bộ 3',
        'Máy tiệt trùng bình sữa Philips', 'Địu em bé ergonomic Ergobaby',
        'Nhiệt kế điện tử hồng ngoại', 'Giường cũi trẻ em gỗ bạch đàn',
      ], prices: [8500000, 6800000, 4500000, 2800000, 350000, 680000, 2200000, 3500000, 450000, 4800000] }],
      music: [{ titles: [
        'Guitar acoustic Yamaha FG800 mới 95%', 'Đàn piano điện Casio CT-S300',
        'Trống điện Roland TD-1DMK', 'Violin 4/4 cao cấp kèm case',
        'Amply karaoke BMB DA-2500 500W', 'Micro không dây Shure BLX288',
        'Loa kéo di động Acnos SK 600W', 'Sáo trúc 6 lỗ handmade Huế',
        'Ukulele concert Mahogany 23 inch', 'Bộ trống cơ Pearl Export 5 trống',
      ], prices: [4500000, 1800000, 12000000, 3800000, 8500000, 6500000, 5500000, 280000, 950000, 18000000] }],
      realestate: [{ titles: [
        'Cho thuê phòng trọ 25m2 gần ĐH Bách Khoa', 'Bán nhà 3 tầng Cầu Giấy 45m2',
        'Cho thuê căn hộ 2PN Vinhomes Smart City', 'Nhà nguyên căn hẻm xe hơi Q.Bình Thạnh',
        'Đất nền 100m2 khu dân cư Bình Dương', 'Phòng thuê full nội thất Q.3 TPHCM',
        'Chung cư mini 38m2 Thanh Xuân HN', 'Shop 50m2 mặt tiền đường lớn',
        'Nhà phố 5 tầng gần hồ Tây HN', 'Penthouse view sông Hàn Đà Nẵng',
      ], prices: [3000000, 420000000, 12000000, 18000000, 850000000, 5500000, 180000000, 25000000, 950000000, 650000000] }],
      service: [{ titles: [
        'Sửa điện nước tận nhà 24/7', 'Dọn dẹp nhà cửa chuyên nghiệp',
        'Thiết kế logo và nhận diện thương hiệu', 'Gia sư Toán Lý Hóa lớp 10-12',
        'Chụp ảnh cưới phong cách Hàn Quốc', 'Sửa chữa điện thoại & laptop',
        'Dịch vụ chuyển nhà trọn gói', 'Cắt tóc nam tận nơi',
        'Lắp đặt camera an ninh', 'Vệ sinh máy lạnh điều hòa',
      ], prices: [150000, 200000, 2000000, 200000, 15000000, 300000, 800000, 100000, 1500000, 250000] }],
      other: [{ titles: [
        'Vé concert BlackPink Hà Nội 2024', 'Thẻ member gym 6 tháng còn hạn',
        'Voucher spa 500k giảm còn 200k', 'Bộ tranh màu nước handmade',
        'Coin game Garena 1000 điểm', 'Lịch tết đặc biệt hộp gỗ 2025',
        'Bộ sticker in nhiệt chuyển áo', 'Thẻ quà tặng Vincom 1 triệu',
        'Dịch vụ in ấn thiệp cưới 100 tờ', 'Gói data Viettel 5GB/ngày 30 ngày',
      ], prices: [2500000, 1200000, 200000, 350000, 150000, 280000, 180000, 1000000, 450000, 250000], listingType: 'give' }],
    };

    const imgSeed = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    let total = 0;

    for (const [cat, groups] of Object.entries(data)) {
      const group = groups[0];
      for (let i = 0; i < group.titles.length; i++) {
        const province = provinces[i % provinces.length];
        const listingType = group.listingType ?? (i % 4 === 0 ? 'give' : 'sell');
        const price = listingType === 'give' ? 0 : group.prices[i];
        const imgId = imgSeed[i];
        await this.prisma.post.create({
          data: {
            title: group.titles[i],
            description: `${group.titles[i]} — tình trạng tốt, chính hãng, có thể xem hàng trực tiếp. Liên hệ qua chat để biết thêm chi tiết.`,
            price,
            listingType,
            itemCategory: cat,
            province,
            authorId,
            status: 'available',
            images: [
              `https://picsum.photos/seed/${cat}${imgId}/400/300`,
              `https://picsum.photos/seed/${cat}${imgId + 1}/400/300`,
            ],
            imageLabel: `https://picsum.photos/seed/${cat}${imgId}/400/300`,
          },
        });
        total++;
      }
    }

    return { ok: true, created: total };
  }

  // Tạo dữ liệu test chat cho một userId
  @Post('dev/seed-chat')
  async seedChat(@Body() body: { userId: string; secret?: string }) {
    if (!this.checkDevSecret(body.secret)) return { error: 'unauthorized' };
    const userId = body.userId;
    if (!userId) return { error: 'userId required' };

    // Tìm post có ảnh — ưu tiên post của người khác (userId là buyer)
    // Nếu không có → dùng post của chính userId (tạo buyer giả, userId là seller)
    let post = await this.prisma.post.findFirst({
      where: { authorId: { not: userId }, status: 'available', imageLabel: { not: '' } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, authorId: true },
    });

    let buyerId = userId;
    let sellerId: string;

    if (!post) {
      // Tất cả posts đều của userId — tạo buyer giả để demo
      post = await this.prisma.post.findFirst({
        where: { authorId: userId, status: 'available', imageLabel: { not: '' } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, authorId: true },
      });
      if (!post) return { error: 'Không tìm thấy bài đăng nào để test' };

      // Tạo hoặc lấy user test buyer
      let testBuyer = await this.prisma.user.findFirst({ where: { phone: '+840000000000' } });
      if (!testBuyer) {
        testBuyer = await this.prisma.user.create({
          data: {
            phone: '+840000000000',
            name: 'Nguyễn Văn Test',
            avatar: 'https://picsum.photos/seed/testbuyer/100/100',
          },
        });
      }
      buyerId = testBuyer.id;
      sellerId = userId;
    } else {
      sellerId = post.authorId;
    }

    // Lấy tên người gửi tin nhắn cuối (sellerId gửi tin cuối)
    const senderUser = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { name: true },
    });
    const senderName = senderUser?.name ?? 'Người dùng';

    // Tạo hoặc lấy chat room
    let room = await this.prisma.chatRoom.findFirst({
      where: { postId: post.id, buyerId },
    });
    if (!room) {
      room = await this.prisma.chatRoom.create({
        data: { postId: post.id, buyerId, sellerId },
      });
    }

    // Thêm tin nhắn test
    await this.prisma.message.createMany({
      data: [
        { roomId: room.id, senderId: sellerId, text: 'Xin chào! Bạn cần hỗ trợ gì không?', isRead: true },
        { roomId: room.id, senderId: buyerId, text: 'Bạn ơi, món này còn không ạ?', isRead: true },
        { roomId: room.id, senderId: sellerId, text: 'Còn bạn nhé! Bạn có muốn nhận không?', isRead: false },
      ],
      skipDuplicates: false,
    });

    // Gửi notification với roomId để test deep link (gửi cho userId - người dùng đang test)
    await this.notificationService.createNotification(
      userId,
      'chat',
      `Tin nhắn mới từ ${senderName}`,
      `Bạn nhận được tin nhắn mới từ "${senderName}" về bài viết "${post.title}"`,
      JSON.stringify({ roomId: room.id, postTitle: post.title }),
    );

    return { ok: true, roomId: room.id, postTitle: post.title };
  }

  // Setup toàn bộ dữ liệu test: tạo seller giả, seed bài, tạo chat rooms cho userId
  @Post('dev/setup-test')
  async setupTest(@Body() body: { userId: string; secret?: string }) {
    if (!this.checkDevSecret(body.secret)) return { error: 'unauthorized' };
    const { userId } = body;
    if (!userId) return { error: 'userId required' };

    // Tạo hoặc lấy test seller
    let testSeller = await this.prisma.user.findFirst({ where: { phone: '+841111111111' } });
    if (!testSeller) {
      testSeller = await this.prisma.user.create({
        data: {
          phone: '+841111111111',
          name: 'Trần Thị Test',
          avatar: 'https://picsum.photos/seed/testseller/100/100',
        },
      });
    }

    // Seed 5 bài từ test seller với ảnh
    const categories = ['electronics', 'clothing', 'furniture', 'books', 'toys'];
    const titles = [
      'iPhone 13 Pro Max 256GB còn BH',
      'Váy hoa vintage size M mới 90%',
      'Bàn làm việc gỗ tự nhiên',
      'Bộ sách kỹ năng mềm 10 cuốn',
      'Đồ chơi Lego City 500 miếng',
    ];
    const createdPosts: string[] = [];
    for (let i = 0; i < 5; i++) {
      const img = `https://picsum.photos/seed/seller${i + 10}/400/300`;
      const post = await this.prisma.post.create({
        data: {
          title: titles[i],
          description: `${titles[i]} — tình trạng tốt, có thể xem hàng trực tiếp.`,
          price: i === 0 ? 8500000 : i === 2 ? 1200000 : 0,
          listingType: i === 0 || i === 2 ? 'sell' : 'give',
          itemCategory: categories[i],
          status: 'available',
          authorId: testSeller.id,
          imageLabel: img,
          images: [img, `https://picsum.photos/seed/seller${i + 20}/400/300`],
          province: 'Hồ Chí Minh',
        },
      });
      createdPosts.push(post.id);
    }

    // Tạo 3 chat room cho userId với 3 bài đầu
    const rooms: string[] = [];
    for (let i = 0; i < 3; i++) {
      let room = await this.prisma.chatRoom.findFirst({
        where: { postId: createdPosts[i], buyerId: userId },
      });
      if (!room) {
        room = await this.prisma.chatRoom.create({
          data: { postId: createdPosts[i], buyerId: userId, sellerId: testSeller.id },
        });
      }
      await this.prisma.message.createMany({
        data: [
          { roomId: room.id, senderId: testSeller.id, text: 'Xin chào! Bạn muốn hỏi gì không ạ?', isRead: true },
          { roomId: room.id, senderId: userId, text: 'Bạn ơi, món này còn không?', isRead: true },
          { roomId: room.id, senderId: testSeller.id, text: 'Còn bạn nhé! Bạn muốn nhận không?', isRead: false },
        ],
        skipDuplicates: false,
      });
      rooms.push(room.id);
    }

    return { ok: true, sellerId: testSeller.id, posts: createdPosts.length, rooms: rooms.length };
  }

  // Xóa toàn bộ thông báo của một userId (dùng để dọn dữ liệu test)
  @Post('dev/clear-notifications')
  async clearNotifications(@Body() body: { userId: string; secret?: string }) {
    if (!this.checkDevSecret(body.secret)) return { error: 'unauthorized' };
    if (!body.userId) return { error: 'userId required' };
    const { count } = await this.prisma.notification.deleteMany({ where: { userId: body.userId } });
    return { ok: true, deleted: count };
  }

  // Dọn sạch toàn bộ dữ liệu test + tạo 10 acc test + bài đăng đủ category
  @Post('dev/reset-test-data')
  async resetTestData(@Body() body: { secret?: string }) {
    if (!this.checkDevSecret(body.secret)) return { error: 'unauthorized' };

    // 1. Xóa các test user cũ (phone bắt đầu bằng +8400000000 hoặc +84111)
    const oldTestUsers = await this.prisma.user.findMany({
      where: { OR: [{ phone: { startsWith: '+8490000000' } }, { phone: { startsWith: '+8400000000' } }, { email: { endsWith: '@test.com' } }] },
      select: { id: true },
    });
    const oldIds = oldTestUsers.map(u => u.id);
    if (oldIds.length > 0) {
      // Xóa messages, chatrooms, notifications, posts, favorites của các user này
      await this.prisma.message.deleteMany({ where: { senderId: { in: oldIds } } });
      await this.prisma.chatRoom.deleteMany({ where: { OR: [{ buyerId: { in: oldIds } }, { sellerId: { in: oldIds } }] } });
      await this.prisma.notification.deleteMany({ where: { userId: { in: oldIds } } });
      await this.prisma.post.deleteMany({ where: { authorId: { in: oldIds } } });
      await this.prisma.user.deleteMany({ where: { id: { in: oldIds } } });
    }

    // Xóa bài picsum của bất kỳ user nào (là bài seeded cũ)
    await this.prisma.post.deleteMany({ where: { imageLabel: { startsWith: 'https://picsum.photos' } } });

    // 2. Tạo 10 acc test
    const categories = [
      'electronics', 'furniture', 'clothing', 'kitchen', 'books',
      'toys', 'sports', 'vehicles', 'beauty', 'pets',
      'tools', 'food', 'baby', 'music', 'realestate', 'service', 'other',
    ];
    const catLabels: Record<string, string> = {
      electronics: 'Điện tử', furniture: 'Nội thất', clothing: 'Thời trang',
      kitchen: 'Gia dụng', books: 'Sách', toys: 'Đồ chơi',
      sports: 'Thể thao', vehicles: 'Xe cộ', beauty: 'Làm đẹp',
      pets: 'Thú cưng', tools: 'Đồ nghề', food: 'Thực phẩm',
      baby: 'Mẹ & Bé', music: 'Nhạc cụ', realestate: 'Bất động sản',
      service: 'Rao dịch vụ', other: 'Khác',
    };
    const provinces = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ',
                       'Huế', 'Nha Trang', 'Vũng Tàu', 'Đà Lạt', 'Bình Dương'];

    let totalPosts = 0;
    const createdUsers: { email: string; phone: string; posts: number }[] = [];

    const hashedPassword = await bcrypt.hash('123456', 10);

    for (let i = 0; i < 10; i++) {
      const phone = `+8490000000${i + 1}`;
      const email = `${i + 1}@test.com`;
      const name = `Test User ${i + 1}`;
      const user = await this.prisma.user.create({
        data: {
          phone, email, name, password: hashedPassword,
          avatar: `https://picsum.photos/seed/testuser${i + 1}/100/100`,
        },
      });

      // Mỗi user có 1 bài cho MỖI trong 17 danh mục
      for (let j = 0; j < categories.length; j++) {
        const cat = categories[j];
        const seed = (i + 1) * 100 + j * 7;
        const isGive = (i + j) % 3 !== 0;
        await this.prisma.post.create({
          data: {
            title: `${catLabels[cat]} cần tìm chỗ mới — acc ${name}`,
            description: `Đồ ${catLabels[cat].toLowerCase()} còn tốt, dùng ít. Liên hệ qua chat.`,
            price: isGive ? 0 : (i + 1) * 150000,
            listingType: isGive ? 'give' : 'sell',
            itemCategory: cat,
            status: 'available',
            authorId: user.id,
            province: provinces[i],
            imageLabel: `https://picsum.photos/seed/${seed}/400/300`,
            images: [
              `https://picsum.photos/seed/${seed}/400/300`,
              `https://picsum.photos/seed/${seed + 50}/400/300`,
            ],
          },
        });
        totalPosts++;
      }

      createdUsers.push({ email, phone, posts: categories.length });
    }

    return { ok: true, users: createdUsers.length, totalPosts, password: '123456', accounts: createdUsers };
  }
}
