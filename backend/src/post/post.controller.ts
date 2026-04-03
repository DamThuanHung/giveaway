import { Body, Controller, Get, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PostService } from './post.service';
import { diskStorage } from 'multer'; // Thêm cái này
import { extname } from 'path'; // Thêm cái này

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getPosts() {
    return this.postService.getAllPosts();
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      storage: diskStorage({
        destination: './uploads', // Nơi lưu file vật lý
        filename: (req, file, cb) => {
          // Tạo tên file duy nhất để không bị trùng (vd: image-12345.jpg)
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createPost(
    @Body() body: any, 
    @UploadedFiles() files: any[] 
  ) {
    // Bây giờ 'files' sẽ chứa thông tin 'filename' đã được lưu trên đĩa
    return this.postService.createPost(body, files);
  }
}