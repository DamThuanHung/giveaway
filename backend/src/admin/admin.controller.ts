import { Controller, Get, Patch, Post, Delete, Param, Query, Body, UseGuards, Request, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { AnalyticsCronService } from './analytics-cron.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private analyticsCron: AnalyticsCronService,
  ) {}

  // ─── Dashboard stats ──────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('top')
  getTop(
    @Query('limit') limit = '5',
    @Query('period') period: 'day' | 'week' | 'month' | 'year' | 'all' = 'all',
  ) {
    const allowed = ['day', 'week', 'month', 'year', 'all'] as const;
    const safePeriod = (allowed as readonly string[]).includes(period) ? period : 'all';
    return this.adminService.getTop(+limit, safePeriod as any);
  }

  // ─── Posts ────────────────────────────────────────
  @Get('posts')
  getPosts(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('authorId') authorId?: string,
  ) {
    return this.adminService.getAllPosts(+page, +limit, status, search, authorId);
  }

  @Patch('posts/:id/hide')
  hidePost(@Request() req, @Param('id') id: string) {
    return this.adminService.hidePost(req.user.id, id);
  }

  @Patch('posts/:id/unhide')
  unhidePost(@Request() req, @Param('id') id: string) {
    return this.adminService.unhidePost(req.user.id, id);
  }

  @Patch('posts/:id/restore')
  restorePost(@Request() req, @Param('id') id: string) {
    return this.adminService.restorePost(req.user.id, id);
  }

  @Post('posts/:id/grant-bump')
  grantBump(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { tier: 'plus' | 'vip'; days: number; reason: string },
  ) {
    return this.adminService.grantBump(req.user.id, id, body);
  }

  @Get('posts/:id')
  getPostDetail(@Param('id') id: string) {
    return this.adminService.getPostDetail(id);
  }

  @Delete('posts/:id')
  deletePost(@Request() req, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.deletePost(req.user.id, id, reason);
  }

  // ─── Users ────────────────────────────────────────
  @Get('users')
  getUsers(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('banned') banned?: string,
  ) {
    return this.adminService.getAllUsers(+page, +limit, search, role, banned);
  }

  @Patch('users/:id/ban')
  banUser(@Request() req, @Param('id') id: string, @Body('isBanned') isBanned: boolean, @Body('reason') reason?: string) {
    return this.adminService.banUser(req.user.id, id, isBanned, reason);
  }

  @Post('users/bulk-ban')
  bulkBanUsers(@Request() req, @Body() body: { ids: string[]; reason?: string }) {
    return this.adminService.bulkBanUsers(req.user.id, body.ids, body.reason);
  }

  @Patch('users/:id/role')
  setUserRole(@Request() req, @Param('id') id: string, @Body('role') role: 'admin' | 'user') {
    return this.adminService.setUserRole(req.user.id, id, role);
  }

  @Get('users/:id')
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
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

  @Get('reports/:id')
  getReportDetail(@Param('id') id: string) {
    return this.adminService.getReportDetail(id);
  }

  @Patch('reports/:id')
  resolveReport(@Request() req, @Param('id') id: string, @Body('action') action: 'resolved' | 'dismissed') {
    return this.adminService.resolveReport(req.user.id, id, action);
  }

  // ─── Revenue / BumpOrders ─────────────────────────
  @Get('revenue')
  getRevenue() {
    return this.adminService.getRevenueStats();
  }

  @Get('revenue/timeline')
  getRevenueTimeline(
    @Query('days') days = '30',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.adminService.getRevenueTimeline(+days, from, to);
  }

  @Get('bump-orders')
  getBumpOrders(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
  ) {
    return this.adminService.getBumpOrders(+page, +limit, status);
  }

  /// Export full CSV — không phân trang, scope theo from/to. Cap 10.000 dòng.
  @Get('bump-orders/export')
  async exportBumpOrders(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('status') status?: string,
  ) {
    const csv = await this.adminService.exportBumpOrdersCsv(from, to, status);
    const ts = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="traotay-orders-${ts}.csv"`);
    res.send('﻿' + csv);
  }

  // ─── Category management ──────────────────────────
  @Get('categories')
  getCategories() {
    return this.adminService.getAllCategories();
  }

  @Post('categories')
  createCategory(@Request() req, @Body() body: { value: string; label: string; icon?: string; sortOrder?: number }) {
    return this.adminService.createCategory(req.user.id, body);
  }

  @Patch('categories/:id')
  updateCategory(@Request() req, @Param('id') id: string, @Body() body: { label?: string; icon?: string | null; sortOrder?: number; enabled?: boolean }) {
    return this.adminService.updateCategory(req.user.id, id, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteCategory(req.user.id, id);
  }

  // ─── Refund management ────────────────────────────
  @Post('bump-orders/:id/refund')
  refundBumpOrder(@Request() req, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.refundBumpOrder(req.user.id, id, reason);
  }

  // ─── Chat moderation ──────────────────────────────
  @Get('chats')
  getChats(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('search') search?: string,
    @Query('postId') postId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.adminService.getAllChatRooms(+page, +limit, search, postId, userId);
  }

  @Get('chats/:roomId')
  getChatRoom(@Param('roomId') roomId: string) {
    return this.adminService.getChatRoomDetail(roomId);
  }

  @Get('chats/:roomId/messages')
  getChatMessages(
    @Param('roomId') roomId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.adminService.getChatMessages(roomId, +page, +limit);
  }

  @Delete('chats/messages/:messageId')
  deleteMessage(@Request() req, @Param('messageId') messageId: string, @Body('reason') reason?: string) {
    return this.adminService.deleteMessage(req.user.id, messageId, reason);
  }

  // ─── Review moderation ────────────────────────────
  @Get('reviews')
  getReviews(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('rating') rating?: string,
    @Query('search') search?: string,
    @Query('postId') postId?: string,
  ) {
    return this.adminService.getAllReviews(+page, +limit, rating ? +rating : undefined, search, postId);
  }

  @Get('reviews/:id')
  getReviewDetail(@Param('id') id: string) {
    return this.adminService.getReviewDetail(id);
  }

  @Delete('reviews/:id')
  deleteReview(@Request() req, @Param('id') id: string, @Body('reason') reason?: string) {
    return this.adminService.deleteReview(req.user.id, id, reason);
  }

  // ─── Broadcast notification ───────────────────────
  @Post('notification/broadcast')
  broadcast(
    @Request() req,
    @Body() body: { segment: 'all' | 'active_30d' | 'inactive_30d' | 'admin'; title: string; body: string; data?: string },
  ) {
    return this.adminService.broadcastNotification(
      req.user.id,
      body.segment,
      body.title,
      body.body,
      body.data,
    );
  }

  @Get('notification/broadcasts')
  getBroadcasts(@Query('page') page = '1', @Query('limit') limit = '20') {
    return this.adminService.getBroadcastHistory(+page, +limit);
  }

  @Get('notification/segment-preview')
  previewSegment(@Query('segment') segment: 'all' | 'active_30d' | 'inactive_30d' | 'admin') {
    return this.adminService.previewBroadcastSegment(segment);
  }

  // ─── Audit log ────────────────────────────────────
  @Get('audit')
  getAuditLog(
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('adminId') adminId?: string,
  ) {
    return this.adminService.getAuditLog(+page, +limit, targetType, targetId, adminId);
  }

  // ─── Analytics ────────────────────────────────────
  @Get('analytics')
  getAnalytics(@Query('period') period = 'week') {
    const allowed = ['day', 'week', 'month', 'year'];
    return this.adminService.getAnalytics(allowed.includes(period) ? (period as any) : 'week');
  }

  @Post('analytics/send-report')
  sendAnalyticsReport() {
    return this.analyticsCron.sendDailyReport().then(() => ({ message: 'Đã gửi báo cáo' }));
  }

  // ─── System health ────────────────────────────────
  @Get('health-detail')
  getHealthDetail() {
    return this.adminService.getHealthDetail();
  }
}
