import {
  BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post,
  Query, Request, UploadedFile, UploadedFiles, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { PostService } from './post.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const multerOptions = {
  storage: memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 }, // 5MB/ảnh, tối đa 10 ảnh
};

@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  getPosts(@Query() query: any, @Request() req: any) {
    return this.postService.getAllPosts({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit), 50) : 20,
      search: query.search,
      province: query.province,
      provinces: query.provinces ? (query.provinces as string).split(',') : undefined,
      listingType: query.listingType,
      itemCategory: query.itemCategory,
      postType: query.postType,
      subType: query.subType,
      minPrice: query.minPrice ? parseInt(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseInt(query.maxPrice) : undefined,
      status: query.status,
      viewerId: req?.user?.id,
      lat: query.lat ? parseFloat(query.lat) : undefined,
      lng: query.lng ? parseFloat(query.lng) : undefined,
      radius: query.radius ? parseFloat(query.radius) : undefined,
      sortBy: query.sortBy,
    });
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  getMyPosts(@Request() req, @Query('status') status?: string) {
    return this.postService.getMyPosts(req.user.id, status);
  }

  @Get('user/:userId')
  getUserPosts(@Param('userId') userId: string) {
    return this.postService.getMyPosts(userId, 'available');
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@Request() req) {
    return this.postService.getMyStats(req.user.id);
  }

  @Get(':id')
  getPostById(@Param('id') id: string) {
    return this.postService.getPostById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 50, ttl: 3_600_000 } }) // 50 post/giờ/user
  @UseInterceptors(FilesInterceptor('images', 10, multerOptions))
  async createPost(@Request() req, @Body() body: CreatePostDto, @UploadedFiles() files: any[]) {
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        imageUrls = await Promise.all(
          files.map(f => this.cloudinaryService.uploadBuffer(f.buffer, 'traotay/posts', f.mimetype))
        );
      } catch (e: any) {
        const msg = e?.message ?? e?.error?.message ?? JSON.stringify(e) ?? 'unknown';
        throw new BadRequestException(`Upload ảnh thất bại: ${msg}`);
      }
    }
    return this.postService.createPost(body, imageUrls, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updatePost(@Param('id') id: string, @Request() req, @Body() body: UpdatePostDto) {
    return this.postService.updatePost(id, req.user.id, body);
  }

  /// Upload 1 ảnh cho post — trả URL public. Dùng khi user thêm ảnh mới
  /// trong màn Sửa bài đăng (edit). Frontend sau đó gọi PATCH /post/:id với
  /// body.images = [URLs cũ giữ + URL mới upload].
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('image', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  async uploadPostImage(@UploadedFile() file: any) {
    if (!file || !file.buffer) throw new BadRequestException('Thiếu file');
    try {
      const url = await this.cloudinaryService.uploadBuffer(file.buffer, 'traotay/posts', file.mimetype);
      return { url };
    } catch (e: any) {
      throw new BadRequestException(`Upload thất bại: ${e?.message ?? 'unknown'}`);
    }
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Request() req, @Body() body: { status: string }) {
    return this.postService.updateStatus(id, req.user.id, body.status);
  }

  @Post(':id/bump')
  @UseGuards(JwtAuthGuard)
  bumpPost(@Param('id') id: string, @Request() req) {
    return this.postService.bumpPost(id, req.user.id);
  }

  /**
   * Author đánh dấu bài đã hoàn thành giao dịch với 1 partner cụ thể.
   * → status='done' + completedWithUserId + completedAt
   * → Notification cho partner: "X đã xác nhận giao dịch xong với bạn"
   * → Cả 2 có thể tạo review từ giờ.
   */
  @Post(':id/complete')
  @UseGuards(JwtAuthGuard)
  completePost(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { partnerId: string },
  ) {
    return this.postService.completePost(id, req.user.id, body.partnerId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id') id: string, @Request() req) {
    return this.postService.deletePost(id, req.user.id);
  }
}
