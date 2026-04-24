import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  onModuleInit() {
    if (admin.apps.length > 0) return;

    // Ưu tiên 1: env var FCM_SERVICE_ACCOUNT (Docker / production)
    const envJson = process.env.FCM_SERVICE_ACCOUNT;
    if (envJson) {
      try {
        const serviceAccount = JSON.parse(envJson);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        this.logger.log('Firebase Admin initialized from env var');
        return;
      } catch (e: any) {
        this.logger.error('FCM_SERVICE_ACCOUNT parse error: ' + e.message);
      }
    }

    // Ưu tiên 2: file local (dùng khi dev)
    const keyPath = join(process.cwd(), 'firebase-service-account.json');
    if (!fs.existsSync(keyPath)) {
      this.logger.warn('firebase-service-account.json not found — FCM disabled');
      return;
    }
    admin.initializeApp({ credential: admin.credential.cert(keyPath) });
    this.logger.log('Firebase Admin initialized from file');
  }

  isReady(): boolean {
    return admin.apps.length > 0;
  }

  async sendToToken(token: string, title: string, body: string, data?: Record<string, string>): Promise<{ ok: boolean; error?: string; invalidToken?: boolean }> {
    if (admin.apps.length === 0) return { ok: false, error: 'FCM not initialized' };
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: { title, body: body ?? '', ...(data ?? {}) },
        android: {
          priority: 'high',
          notification: {
            channelId: 'high_importance_channel',
            sound: 'default',
          },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
      return { ok: true };
    } catch (err: any) {
      // Invalid/expired token — signal caller để xóa khỏi DB
      const invalidToken =
        err?.code === 'messaging/registration-token-not-registered' ||
        err?.code === 'messaging/invalid-registration-token' ||
        err?.code === 'messaging/invalid-argument';
      if (invalidToken) {
        this.logger.warn(`FCM token invalid, should be cleared: ${token.substring(0, 20)}...`);
      } else {
        this.logger.error(`FCM send failed: ${err.message}`);
      }
      return { ok: false, error: err.message, invalidToken };
    }
  }
}
