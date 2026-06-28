import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface CreatorInfo {
  creator_avatar_url: string;
  creator_username: string;
  creator_nickname: string;
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
}

export interface PublishParams {
  videoUrl: string;
  caption: string;
  privacyLevel: string;
  disclosure: { enabled: boolean; brandOrganic: boolean; brandedContent: boolean };
  disableComment: boolean;
  disableDuet: boolean;
  disableStitch: boolean;
}

// State OAuth tạm — chỉ 1 admin dùng tool này nên Map in-memory đủ, không cần Redis/DB.
// TTL 5 phút phòng trường hợp bấm "Kết nối" rồi bỏ giữa đường.
const PENDING_STATES = new Map<string, number>();
const STATE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class TiktokService {
  private readonly logger = new Logger(TiktokService.name);
  private readonly clientKey = process.env.TIKTOK_CLIENT_KEY || '';
  private readonly clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
  private readonly redirectUri = process.env.TIKTOK_REDIRECT_URI || 'https://api.traotay.com.vn/admin/tiktok/callback';

  constructor(private prisma: PrismaService) {}

  get configured() {
    return !!(this.clientKey && this.clientSecret);
  }

  // ─── OAuth ──────────────────────────────────────────────────────────────

  buildAuthUrl(): string {
    const state = randomBytes(16).toString('hex');
    PENDING_STATES.set(state, Date.now() + STATE_TTL_MS);
    const params = new URLSearchParams({
      client_key: this.clientKey,
      scope: 'user.info.basic,video.publish',
      response_type: 'code',
      redirect_uri: this.redirectUri,
      state,
    });
    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  validateState(state: string): boolean {
    const expiry = PENDING_STATES.get(state);
    PENDING_STATES.delete(state);
    return !!expiry && expiry > Date.now();
  }

  async exchangeCodeForToken(code: string) {
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      }),
    });
    const body = await res.json() as any;
    if (!body.access_token) throw new Error(body.error_description || JSON.stringify(body));

    await this.saveCredential(body);
  }

  private async saveCredential(body: { access_token: string; refresh_token: string; expires_in: number; open_id: string }) {
    const expiresAt = new Date(Date.now() + body.expires_in * 1000);
    const existing = await this.prisma.tiktokCredential.findFirst();
    const data = {
      openId: body.open_id,
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt,
    };
    if (existing) {
      await this.prisma.tiktokCredential.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.tiktokCredential.create({ data });
    }
  }

  // Tự refresh nếu access_token hết hạn trong vòng 5 phút tới — tránh request
  // thật bị lỗi 401 giữa lúc đang gọi API.
  private async getValidAccessToken(): Promise<string> {
    const cred = await this.prisma.tiktokCredential.findFirst();
    if (!cred) throw new Error('Chưa kết nối tài khoản TikTok');

    if (cred.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
      return cred.accessToken;
    }

    this.logger.log('Access token TikTok gần hết hạn — refresh...');
    const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: this.clientKey,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: cred.refreshToken,
      }),
    });
    const body = await res.json() as any;
    if (!body.access_token) throw new Error(body.error_description || JSON.stringify(body));

    await this.saveCredential(body);
    return body.access_token;
  }

  isConnected(): Promise<boolean> {
    return this.prisma.tiktokCredential.findFirst().then(c => !!c);
  }

  // ─── Creator info ───────────────────────────────────────────────────────

  async getCreatorInfo(): Promise<CreatorInfo> {
    const token = await this.getValidAccessToken();
    const res = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
    });
    const body = await res.json() as any;
    if (body.error?.code && body.error.code !== 'ok') throw new Error(body.error.message);
    return body.data;
  }

  // ─── Publish (PULL_FROM_URL — dùng lại video đã render+upload MinIO) ───────

  async publish(params: PublishParams) {
    const token = await this.getValidAccessToken();

    const post_info: Record<string, unknown> = {
      title: params.caption,
      privacy_level: params.privacyLevel,
      disable_comment: params.disableComment,
      disable_duet: params.disableDuet,
      disable_stitch: params.disableStitch,
    };
    if (params.disclosure.enabled) {
      post_info.brand_content_toggle = params.disclosure.brandedContent;
      post_info.brand_organic_toggle = params.disclosure.brandOrganic;
    }

    const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        post_info,
        source_info: { source: 'PULL_FROM_URL', video_url: params.videoUrl },
      }),
    });
    const initBody = await initRes.json() as any;
    const publishId = initBody.data?.publish_id;
    if (!publishId) throw new Error(initBody.error?.message || JSON.stringify(initBody));

    // Poll status — pattern giống postInstagramReel trong scripts/social/post-all.js
    // (Instagram cũng xử lý video bất đồng bộ, cùng lý do cần poll thay vì publish ngay).
    let status = 'PROCESSING_DOWNLOAD';
    let failReason: string | undefined;
    for (let attempt = 0; attempt < 20; attempt++) {
      await new Promise(r => setTimeout(r, 3000));
      const statusRes = await fetch('https://open.tiktokapis.com/v2/post/publish/status/fetch/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ publish_id: publishId }),
      });
      const statusBody = await statusRes.json() as any;
      status = statusBody.data?.status;
      failReason = statusBody.data?.fail_reason;
      if (status === 'PUBLISH_COMPLETE' || status === 'FAILED') break;
    }

    return { publishId, status, failReason };
  }
}
