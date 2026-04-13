import {
  Body, Controller, Delete, Get, Param, Patch, Post,
  Query, Request, UploadedFiles, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { PostService } from './post.service';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
    },
  }),
};

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

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
  @UseInterceptors(FilesInterceptor('images', 5, multerOptions))
  createPost(@Request() req, @Body() body: any, @UploadedFiles() files: any[]) {
    return this.postService.createPost(body, files, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updatePost(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.postService.updatePost(id, req.user.id, body);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  updateStatus(@Param('id') id: string, @Request() req, @Body() body: { status: string }) {
    return this.postService.updateStatus(id, req.user.id, body.status);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deletePost(@Param('id') id: string, @Request() req) {
    return this.postService.deletePost(id, req.user.id);
  }
}
