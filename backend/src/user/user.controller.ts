import {
  Body, Controller, Delete, Get, Param, Patch, Post, Request,
  UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() body: any) {
    return this.userService.createUser(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.userService.login(body);
  }

  @Post('phone-login')
  phoneLogin(@Body() body: { idToken: string }) {
    if (!body.idToken) throw new Error('Thiếu idToken');
    return this.userService.phoneLogin(body.idToken);
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

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req,
    @Body() body: { oldPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(req.user.id, body.oldPassword, body.newPassword);
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `avatar-${suffix}${extname(file.originalname)}`);
      },
    }),
  }))
  uploadAvatar(@Request() req, @UploadedFile() file: any) {
    return this.userService.uploadAvatar(req.user.id, file.filename);
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
  sendEmailLoginOtp(@Body() body: { email: string }) {
    return this.userService.sendEmailLoginOtp(body.email);
  }

  @Post('email-login/verify')
  verifyEmailLoginOtp(@Body() body: { email: string; otp: string }) {
    return this.userService.verifyEmailLoginOtp(body.email, body.otp);
  }

  // ─── Quên mật khẩu ───────────────────────────────────────────────────────
  @Post('forgot-password/send')
  sendForgotPasswordOtp(@Body() body: { email: string }) {
    return this.userService.sendForgotPasswordOtp(body.email);
  }

  @Post('forgot-password/reset')
  resetPassword(@Body() body: { email: string; otp: string; newPassword: string }) {
    return this.userService.resetPassword(body.email, body.otp, body.newPassword);
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

  @Get('block/check/:targetId')
  @UseGuards(JwtAuthGuard)
  checkBlocked(@Request() req, @Param('targetId') targetId: string) {
    return this.userService.isBlocked(req.user.id, targetId).then(isBlocked => ({ isBlocked }));
  }
}
