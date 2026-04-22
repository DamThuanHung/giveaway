import { Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  async onModuleInit() {
    this.bucket = process.env.MINIO_BUCKET ?? 'traotay';
    this.publicUrl = (process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000').replace(/\/$/, '');

    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: parseInt(process.env.MINIO_PORT ?? '9000'),
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin123',
    });

    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket);
      await this.client.setBucketPolicy(this.bucket, JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        }],
      }));
    }
  }

  async uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
    const filename = `${folder}/${randomUUID()}.jpg`;
    await this.client.putObject(this.bucket, filename, buffer, buffer.length, {
      'Content-Type': 'image/jpeg',
    });
    return `${this.publicUrl}/${this.bucket}/${filename}`;
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const prefix = `${this.publicUrl}/${this.bucket}/`;
      if (!url.startsWith(prefix)) return;
      const objectName = url.slice(prefix.length);
      await this.client.removeObject(this.bucket, objectName);
    } catch (_) {}
  }
}
