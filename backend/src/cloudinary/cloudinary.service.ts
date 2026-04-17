import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  async deleteByUrl(url: string): Promise<void> {
    try {
      const parts = url.split('/');
      const folder = parts[parts.length - 2];
      const filename = parts[parts.length - 1].split('.')[0];
      await cloudinary.uploader.destroy(`${folder}/${filename}`);
    } catch (_) {}
  }
}
