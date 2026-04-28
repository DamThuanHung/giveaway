import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FavoriteService } from './favorite.service';

@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  add(@Request() req, @Body() body: { postId: string }) {
    return this.favoriteService.addFavorite(req.user.id, body.postId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  remove(@Request() req, @Body() body: { postId: string }) {
    return this.favoriteService.removeFavorite(req.user.id, body.postId);
  }

  // Trả về favorites của user đang đăng nhập. Path param :userId được giữ
  // cho backward-compat với app cũ, nhưng PHẢI khớp với token để chống leak.
  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  get(@Request() req, @Param('userId') userId: string) {
    if (userId !== req.user.id) {
      throw new ForbiddenException('Bạn chỉ xem được danh sách yêu thích của chính mình');
    }
    return this.favoriteService.getFavorites(req.user.id);
  }
}
