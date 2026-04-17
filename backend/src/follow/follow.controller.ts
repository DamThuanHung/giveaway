import { Controller, Post, Delete, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FollowService } from './follow.service';

@Controller('follow')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  // POST /follow/:userId — theo dõi
  @Post(':userId')
  @UseGuards(JwtAuthGuard)
  follow(@Request() req, @Param('userId') userId: string) {
    return this.followService.follow(req.user.id, userId);
  }

  // DELETE /follow/:userId — bỏ theo dõi
  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  unfollow(@Request() req, @Param('userId') userId: string) {
    return this.followService.unfollow(req.user.id, userId);
  }

  // GET /follow/:userId/status — kiểm tra đang theo dõi chưa
  @Get(':userId/status')
  @UseGuards(JwtAuthGuard)
  status(@Request() req, @Param('userId') userId: string) {
    return this.followService.getStatus(req.user.id, userId);
  }

  // GET /follow/:userId/followers — danh sách người theo dõi
  @Get(':userId/followers')
  getFollowers(@Param('userId') userId: string) {
    return this.followService.getFollowers(userId);
  }

  // GET /follow/:userId/following — danh sách đang theo dõi
  @Get(':userId/following')
  getFollowing(@Param('userId') userId: string) {
    return this.followService.getFollowing(userId);
  }

  // GET /follow/:userId/counts — số lượng followers & following
  @Get(':userId/counts')
  getCounts(@Param('userId') userId: string) {
    return this.followService.getCounts(userId);
  }

  // GET /follow/feed — feed bài đăng từ người đang theo dõi
  @Get('feed')
  @UseGuards(JwtAuthGuard)
  getFeed(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.followService.getFeed(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
