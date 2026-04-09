import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewService } from './review.service';

@Controller('review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  createReview(
    @Request() req,
    @Body() body: { dealId: string; rating: number; comment?: string },
  ) {
    return this.reviewService.createReview(req.user.id, body.dealId, body.rating, body.comment);
  }

  @Get('check/:dealId')
  @UseGuards(JwtAuthGuard)
  hasReviewed(@Request() req, @Param('dealId') dealId: string) {
    return this.reviewService.hasReviewed(req.user.id, dealId);
  }

  @Get('user/:userId')
  getUserReviews(@Param('userId') userId: string) {
    return this.reviewService.getUserReviews(userId);
  }
}
