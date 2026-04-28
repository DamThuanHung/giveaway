import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class CloudinaryService implements OnModuleInit {
  private client: Minio.Client;
  private bucket: string;
  private publicUrl: string;

  async onModuleInit() {
    this.bucket = process.env.MINIO_BUCKET ?? 'traotay';
    this.publicUrl = (process.env.MINIO_PUBLIC_URL ?? 'http://localhost:9000').replace(/\/$/, '');

    // Production phải set credentials thật. Fallback "minioadmin/minioadmin123" chỉ
    // dùng cho dev local — nếu prod missing env, throw để fail fast thay vì chạy
    // ngầm với credentials default (rủi ro: bucket policy + endpoint bị compromise).
    const accessKey = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
    const secretKey = process.env.MINIO_SECRET_KEY ?? 'minioadmin123';
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.MINIO_ACCESS_KEY || !process.env.MINIO_SECRET_KEY) {
        throw new Error('MINIO_ACCESS_KEY/MINIO_SECRET_KEY không được set ở production');
      }
    }

    this.client = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
      port: parseInt(process.env.MINIO_PORT ?? '9000'),
      useSSL: (process.env.MINIO_USE_SSL ?? 'false') === 'true',
      accessKey,
      secretKey,
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

  /** Kiểm tra magic bytes để chắc file thật sự là ảnh, không tin MIME từ client */
  private detectImage(buffer: Buffer): { ext: string; mime: string } | null {
    if (buffer.length < 12) return null;
    const hex = buffer.slice(0, 4).toString('hex');
    if (hex.startsWith('ffd8ff')) return { ext: 'jpg', mime: 'image/jpeg' };
    if (hex === '89504e47') return { ext: 'png', mime: 'image/png' };
    if (buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') {
      return { ext: 'webp', mime: 'image/webp' };
    }
    return null;
  }

  async uploadBuffer(buffer: Buffer, folder: string, mimeType?: string): Promise<string> {
    if (!buffer || buffer.length === 0) {
      throw new BadRequestException('File rỗng');
    }
    if (buffer.length > MAX_UPLOAD_SIZE) {
      throw new BadRequestException('Ảnh vượt quá 5MB');
    }
    // KHÔNG dựa vào mimeType từ request header (client untrusted, có thể sai
    // dù bytes thực tế là JPEG/PNG/WebP hợp lệ). Magic bytes mới là source of truth.
    const detected = this.detectImage(buffer);
    if (!detected) {
      throw new BadRequestException('Chỉ hỗ trợ ảnh JPEG, PNG hoặc WebP');
    }

    const filename = `${folder}/${randomUUID()}.${detected.ext}`;
    await this.client.putObject(this.bucket, filename, buffer, buffer.length, {
      'Content-Type': detected.mime,
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
