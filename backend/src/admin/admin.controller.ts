import { Controller, Get, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ─── Dashboard stats ──────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ─── Posts ────────────────────────────────────────
  @Get('posts')
  getPosts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllPosts(+page, +limit, status, search);
  }

  @Patch('posts/:id/hide')
  hidePost(@Param('id') id: string) {
    return this.adminService.hidePost(id);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  // ─── Users ────────────────────────────────────────
  @Get('users')
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(+page, +limit, search);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body('isBanned') isBanned: boolean) {
    return this.adminService.banUser(id, isBanned);
  }

  // ─── Reports ──────────────────────────────────────
  @Get('reports')
  getReports(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllReports(+page, +limit, status);
  }

  @Patch('reports/:id')
  resolveReport(@Param('id') id: string, @Body('action') action: 'resolved' | 'dismissed') {
    return this.adminService.resolveReport(id, action);
  }
}
