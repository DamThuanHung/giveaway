import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { join } from 'path';
import * as fs from 'fs';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);

  onModuleInit() {
    if (admin.apps.length > 0) return;
    const keyPath = join(process.cwd(), 'firebase-service-account.json');
    if (!fs.existsSync(keyPath)) {
      this.logger.warn('firebase-service-account.json not found — FCM disabled');
      return;
    }
    admin.initializeApp({
      credential: admin.credential.cert(keyPath),
    });
    this.logger.log('Firebase Admin initialized');
  }

  async sendToToken(token: string, title: string, body: string, data?: Record<string, string>) {
    if (admin.apps.length === 0) return;
    try {
      await admin.messaging().send({
        token,
        notification: { title, body },
        data: data ?? {},
        android: {
          priority: 'high',
          notification: { sound: 'default', clickAction: 'FLUTTER_NOTIFICATION_CLICK' },
        },
        apns: {
          payload: { aps: { sound: 'default', badge: 1 } },
        },
      });
    } catch (err) {
      this.logger.error(`FCM send failed: ${err.message}`);
    }
  }
}
