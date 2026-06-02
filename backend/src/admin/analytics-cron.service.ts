import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Resend } from 'resend';
import { AdminService } from './admin.service';

@Injectable()
export class AnalyticsCronService {
  private readonly logger = new Logger(AnalyticsCronService.name);

  constructor(private readonly adminService: AdminService) {}

  // 8:00 sáng giờ VN (UTC+7) = 1:00 UTC
  @Cron('0 1 * * *')
  async sendDailyReport() {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = (process.env.ADMIN_EMAILS ?? '').split(',')[0].trim();
    if (!apiKey || !adminEmail) {
      this.logger.warn('RESEND_API_KEY hoặc ADMIN_EMAILS chưa cấu hình — bỏ qua gửi báo cáo');
      return;
    }

    try {
      const data = await this.adminService.getAnalytics('yesterday');
      const { web, app } = data;

      const html = `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#10b981;margin-bottom:4px">Báo cáo hôm qua — Trao Tay</h2>
          <p style="color:#6b7280;font-size:13px;margin-top:0">${new Date(Date.now() - 86400000).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr>
              <td style="padding:12px;background:#f0fdf4;border-radius:8px;text-align:center;width:25%">
                <div style="font-size:28px;font-weight:bold;color:#10b981">${web.visitors}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px">Khách ghé web</div>
              </td>
              <td style="width:8px"></td>
              <td style="padding:12px;background:#eff6ff;border-radius:8px;text-align:center;width:25%">
                <div style="font-size:28px;font-weight:bold;color:#3b82f6">${web.pageViews}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px">Lượt xem trang</div>
              </td>
              <td style="width:8px"></td>
              <td style="padding:12px;background:#fdf4ff;border-radius:8px;text-align:center;width:25%">
                <div style="font-size:28px;font-weight:bold;color:#a855f7">${web.requests}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px">Tổng request</div>
              </td>
              <td style="width:8px"></td>
              <td style="padding:12px;background:#fff7ed;border-radius:8px;text-align:center;width:25%">
                <div style="font-size:28px;font-weight:bold;color:#f97316">${app.total}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:4px">Lượt tải app</div>
              </td>
            </tr>
          </table>

          <div style="margin-top:24px;text-align:center">
            <a href="https://api.traotay.com.vn/admin.html#analytics"
               style="background:#10b981;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px">
              Xem chi tiết →
            </a>
          </div>

          <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:24px">
            Trao Tay · Báo cáo hôm qua (trọn 24h) — gửi lúc 8:00 sáng
          </p>
        </div>
      `;

      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'Trao Tay <noreply@traotay.com.vn>',
        to: adminEmail,
        subject: `📊 Báo cáo hôm qua — ${web.visitors} khách, ${app.total} lượt tải app`,
        html,
      });

      this.logger.log(`Đã gửi báo cáo analytics hàng ngày tới ${adminEmail}`);
    } catch (err) {
      this.logger.error('Gửi báo cáo analytics thất bại', err);
    }
  }
}
