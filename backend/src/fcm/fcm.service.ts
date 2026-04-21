import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  onModuleInit() {
    if (admin.apps.length > 0) return;

    // Ưu tiên 1: env var FCM_SERVICE_ACCOUNT (dùng trên Railway)
    const envJson = process.env.FCM_SERVICE_ACCOUNT;
    if (envJson) {
      try {
        const serviceAccount = JSON.parse(envJson);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        this.logger.log('Firebase Admin initialized from env var');
        return;
      } catch (e) {
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

  async sendToToken(token: string, title: string, body: string, data?: Record<string, string>) {
    if (admin.apps.length === 0) return;
    this.logger.log(`Sending FCM to token: ${token.substring(0, 20)}... title: "${title}"`);
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data ?? {},
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
      this.logger.log(`FCM sent successfully`);
    } catch (err) {
      this.logger.error(`FCM send failed: ${err.message}`);
    }
  }
}
