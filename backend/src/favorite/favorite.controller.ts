import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { FavoriteService } from './favorite.service';

@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  add(@Body() body: any) {
    return this.favoriteService.addFavorite(body.userId, body.postId);
  }

  @Delete()
  remove(@Body() body: any) {
    return this.favoriteService.removeFavorite(body.userId, body.postId);
  }

  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.favoriteService.getFavorites(userId);
  }
}
