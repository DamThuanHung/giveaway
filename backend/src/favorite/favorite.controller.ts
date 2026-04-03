import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { FavoriteService } from './favorite.service';

@Controller('favorite')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post()
  add(@Body() body: any) {
    return this.favoriteService.addFavorite(
      Number(body.userId),
      Number(body.postId),
    );
  }

  @Delete()
  remove(@Body() body: any) {
    return this.favoriteService.removeFavorite(
      Number(body.userId),
      Number(body.postId),
    );
  }

  @Get(':userId')
  get(@Param('userId') userId: string) {
    return this.favoriteService.getFavorites(Number(userId));
  }
}