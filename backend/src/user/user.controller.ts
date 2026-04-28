import {
  Body, Controller, Delete, Get, Param, Patch, Post, Request,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post('phone-login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  phoneLogin(@Body() body: { idToken: string }) {
    if (!body.idToken) throw new Error('Thiếu idToken');
    return this.userService.phoneLogin(body.idToken);
  }

  @Post('dev/login')
  devLogin(@Body() body: { email: string; secret: string }) {
    return this.userService.devLogin(body.email, body.secret);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req) {
    return this.userService.getUserById(req.user.id);
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  updateUser(@Param('id') id: string, @Request() req, @Body() body: any) {
    return this.userService.updateUser(id, req.user.id, body);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  }))
  async uploadAvatar(@Request() req, @UploadedFile() file: any) {
    const url = await this.cloudinaryService.uploadBuffer(file.buffer, 'traotay/avatars', file.mimetype);
    return this.userService.uploadAvatar(req.user.id, url);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getUsers() {
    return this.userService.getUsers();
  }

  @Post('block/:blockedId')
  @UseGuards(JwtAuthGuard)
  blockUser(@Request() req, @Param('blockedId') blockedId: string) {
    return this.userService.blockUser(req.user.id, blockedId);
  }

  @Delete('block/:blockedId')
  @UseGuards(JwtAuthGuard)
  unblockUser(@Request() req, @Param('blockedId') blockedId: string) {
    return this.userService.unblockUser(req.user.id, blockedId);
  }

  @Get('blocked/list')
  @UseGuards(JwtAuthGuard)
  getBlockedUsers(@Request() req) {
    return this.userService.getBlockedUsers(req.user.id);
  }

  // ─── Email OTP Login ──────────────────────────────────────────────────────
  @Post('email-login/send')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  sendEmailLoginOtp(@Body() body: { email: string }) {
    return this.userService.sendEmailLoginOtp(body.email);
  }

  @Post('admin-login/send')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  sendAdminLoginOtp(@Body() body: { email: string }) {
    return this.userService.sendEmailLoginOtp(body.email, true);
  }

  @Post('email-login/verify')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  verifyEmailLoginOtp(@Body() body: { email: string; otp: string }) {
    return this.userService.verifyEmailLoginOtp(body.email, body.otp);
  }

  // ─── Liên kết email dự phòng ──────────────────────────────────────────────
  @Post('link-email/send')
  @UseGuards(JwtAuthGuard)
  sendLinkEmailOtp(@Request() req, @Body() body: { email: string }) {
    return this.userService.sendLinkEmailOtp(req.user.id, body.email);
  }

  @Post('link-email/confirm')
  @UseGuards(JwtAuthGuard)
  confirmLinkEmail(@Request() req, @Body() body: { email: string; otp: string }) {
    return this.userService.confirmLinkEmail(req.user.id, body.email, body.otp);
  }

  // ─── Liên kết SĐT dự phòng ────────────────────────────────────────────────
  @Post('link-phone')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  linkPhone(@Request() req, @Body() body: { idToken: string }) {
    if (!body.idToken) throw new Error('Thiếu idToken');
    return this.userService.linkPhone(req.user.id, body.idToken);
  }

  @Get('block/check/:targetId')
  @UseGuards(JwtAuthGuard)
  checkBlocked(@Request() req, @Param('targetId') targetId: string) {
    return this.userService.isBlocked(req.user.id, targetId).then(isBlocked => ({ isBlocked }));
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  deleteAccount(@Request() req) {
    return this.userService.deleteAccount(req.user.id);
  }
}
