import { Body, Controller, Delete, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
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

  @Get(':userId')
  @UseGuards(JwtAuthGuard)
  get(@Param('userId') userId: string) {
    return this.favoriteService.getFavorites(userId);
  }
}
