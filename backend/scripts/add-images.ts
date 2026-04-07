import { PrismaClient } from '@prisma/client';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const uploadsDir = path.join(__dirname, '..', 'uploads');

// Mỗi category dùng một seed picsum khác nhau để ảnh phù hợp hơn
const imageSeeds = [
  10, 20, 30, 40, 50, 60, 70, 80, 90, 100,
  110, 120, 130, 140, 150, 160, 170, 180, 190, 200,
  210, 220, 230, 240,
];

function downloadImage(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dest)) { resolve(); return; }
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        downloadImage(res.headers.location!, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const posts = await prisma.post.findMany({ select: { id: true } });

  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const seed = imageSeeds[i % imageSeeds.length];
    const filename = `seed-img-${seed}.jpg`;
    const dest = path.join(uploadsDir, filename);
    const url = `https://picsum.photos/seed/${seed}/400/300`;

    process.stdout.write(`  Downloading ${filename}... `);
    try {
      await downloadImage(url, dest);
      await prisma.post.update({ where: { id: post.id }, data: { imageLabel: filename } });
      console.log('OK');
    } catch (e) {
      console.log('FAIL', e);
    }
  }

  console.log(`\n✅ Đã gán ảnh cho ${posts.length} bài đăng`);
}

main().finally(() => prisma.$disconnect());
