import { Body, Controller, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @Request() req,
    @Body() body: { postId: string; rating: number; comment?: string },
  ) {
    return this.reviewService.createReview(req.user.id, body.postId, body.rating, body.comment);
  }

  @Patch(':postId')
  @UseGuards(JwtAuthGuard)
  updateReview(
    @Request() req,
    @Param('postId') postId: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.reviewService.updateReview(req.user.id, postId, body.rating, body.comment);
  }

  @Get('check/:postId')
  @UseGuards(JwtAuthGuard)
  hasReviewed(@Request() req, @Param('postId') postId: string) {
    return this.reviewService.hasReviewed(req.user.id, postId);
  }

  @Get('user/:userId')
  getUserReviews(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reviewService.getUserReviews(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }
}
