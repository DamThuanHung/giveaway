import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private prisma: PrismaService) {}

  // 1. Lấy tất cả bài đăng và tự động tạo link ảnh
  async getAllPosts() {
    try {
      const posts = await this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return posts.map((post) => ({
        ...post,
        // Khắc phục rủi ro ảnh trống: Nếu có label thì nối link, không thì để null
        imageUrl: post.imageLabel
          ? `http://10.0.2.2:3800/uploads/${post.imageLabel}`
          : null,
      }));
    } catch (error) {
      throw new BadRequestException('Lỗi khi lấy danh sách: ' + error.message);
    }
  }

  // 2. Tạo bài đăng mới (Giữ nguyên logic xử lý giá và ảnh của bạn)
  async createPost(data: any, files: any[]) {
    try {
      const priceStr = data.price ? data.price.toString().replace(/[^\d]/g, '') : '0';
      const parsedPrice = parseInt(priceStr, 10) || 0;
      const imageFilenames = files ? files.map((file) => file.filename) : [];

      return await this.prisma.post.create({
        data: {
          title: data.title || 'Không tiêu đề',
          description: data.description || '',
          price: parsedPrice,
          latitude: parseFloat(data.latitude) || 0.0,
          longitude: parseFloat(data.longitude) || 0.0,
          itemCategory: data.itemCategory || 'Khác',
          province: data.province || '',
          district: data.district || '',
          ward: data.ward || '',
          addressDetail: data.addressDetail || '',
          listingType: data.listingType || 'donated',
          imageLabel: imageFilenames.length > 0 ? imageFilenames[0] : '',
          status: 'available',
        },
      });
    } catch (error) {
      console.error('❌ LỖI PRISMA:', error);
      throw new BadRequestException('Không thể lưu vào Database: ' + error.message);
    }
  }
}