# CODE FIXES — Chi tiết sửa cho từng vấn đề audit

---

## FIX #1: Update DATABASE_SCHEMA.md

**File:** `docs/DATABASE_SCHEMA.md`

**Thay đổi:** Xóa section `Deal` (dòng 170-182), fix `Review` description

```markdown
### `Review`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | `String` (cuid) | PK |
| `postId` | `String` | FK → `Post.id` (bài đăng đã hoàn thành) |
| `reviewerId` | `String` | FK → `User.id` (người viết review) |
| `revieweeId` | `String` | FK → `User.id` (người nhận review) |
| `rating` | `Int` | 1–5 sao |
| `comment` | `String?` | Nhận xét |
| `createdAt` | `DateTime` | Tự động |
| `updatedAt` | `DateTime` | Tự động |

**Unique:** `[postId, reviewerId]` — mỗi user chỉ review 1 bài 1 lần

**Flow:** Post status = 'done' → cả author + partner có thể tạo review → updateReview() cho 24h đầu
```

**Xóa:** 
- User relations: `dealsAsOwner`, `dealsAsRequester`

---

## FIX #2: Add Post.status DB constraint

**File:** `backend/prisma/schema.prisma`

**Thêm enum hoặc check constraint:**

```prisma
// Option A: Enum (nếu muốn type-safe ở Prisma)
enum PostStatus {
  available    // còn hàng
  reserved     // đã chấp nhận deal, chờ hoàn thành
  done         // đã trao tặng/bán xong
  hidden       // bị report, tự ẩn hoặc admin ẩn
  archived     // user archive (draft hoặc old)
  deleted_by_admin // admin soft-delete
}

model Post {
  // ...
  status PostStatus @default("available")  // thay String
  // ...
}
```

**Hoặc Option B: PostgreSQL CHECK constraint (nếu giữ String)**

```prisma
model Post {
  // ...
  status String @default("available")
  
  @@check("status IN ('available', 'reserved', 'done', 'hidden', 'archived', 'deleted_by_admin')")
}
```

**Migration:**

```sql
-- migration file: 20260522_add_post_status_constraint.sql

-- Option A: Add enum type
CREATE TYPE "PostStatus" AS ENUM ('available', 'reserved', 'done', 'hidden', 'archived', 'deleted_by_admin');

ALTER TABLE "Post" ALTER COLUMN "status" TYPE "PostStatus" USING "status"::"PostStatus";

-- Option B: Add check
ALTER TABLE "Post" ADD CONSTRAINT "Post_status_valid" 
  CHECK (status IN ('available', 'reserved', 'done', 'hidden', 'archived', 'deleted_by_admin'));
```

**Update code:**

```typescript
// post.service.ts — replace string literals
const VALID_POST_STATUSES = ['available', 'reserved', 'done', 'hidden', 'archived', 'deleted_by_admin'] as const;
```

---

## FIX #3: Implement soft-delete for User

**File:** `backend/src/user/user.service.ts`

**Thay đổi deleteAccount():**

```typescript
async deleteAccount(userId: string) {
  // Soft delete: set deletedAt thay vì xóa record
  const user = await this.prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      // Optional: clear sensitive data
      email: null,
      phone: null,
      fcmToken: null,
      avatar: null,
    },
  });

  return { ok: true, message: 'Tài khoản đã xóa' };
}

// Helper: select for active users only
export const ACTIVE_USER_WHERE = { deletedAt: null };

async getPublicUserById(id: string) {
  const user = await this.prisma.user.findFirst({
    where: { id, ...ACTIVE_USER_WHERE },
    select: {
      id: true,
      name: true,
      avatar: true,
      createdAt: true,
    },
  });
  if (!user) throw new NotFoundException('User không tồn tại');
  return user;
}
```

**Update follow.service.ts:**

```typescript
import { ACTIVE_USER_WHERE } from '../user/user.service';

async getFollowers(userId: string) {
  const rows = await this.prisma.follow.findMany({
    where: { followingId: userId, follower: ACTIVE_USER_WHERE },
    include: {
      follower: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => r.follower);
}

async getFollowing(userId: string) {
  const rows = await this.prisma.follow.findMany({
    where: { followerId: userId, following: ACTIVE_USER_WHERE },
    include: {
      following: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => r.following);
}

async getFeed(userId: string, page = 1, limit = 20) {
  // ...
  const where = {
    authorId: { in: visibleAuthorIds },
    status: 'available',
    author: ACTIVE_USER_WHERE,  // thêm dòng này
  };
  // ...
}
```

**Update review.service.ts:**

```typescript
async getUserReviews(userId: string, page = 1, limit = 20) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const skip = (safePage - 1) * safeLimit;

  // Verify user exists and not deleted
  const user = await this.prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw new NotFoundException('User không tồn tại');

  const where = { revieweeId: userId };
  const [reviews, stats] = await Promise.all([
    this.prisma.review.findMany({
      where: {
        ...where,
        reviewer: { deletedAt: null },  // chỉ lấy review từ user active
      },
      include: {
        reviewer: { select: { id: true, name: true, avatar: true } },
        post: { select: { id: true, title: true, listingType: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: safeLimit,
    }),
    this.prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  // ...
}
```

---

## FIX #4: ChatRoom unique constraint

**File 1:** `backend/prisma/schema.prisma`

```prisma
model ChatRoom {
  id        String    @id @default(cuid())
  buyerId   String
  postId    String
  sellerId  String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  buyer     User      @relation("BuyerRooms", fields: [buyerId], references: [id])
  post      Post      @relation(fields: [postId], references: [id])
  seller    User      @relation("SellerRooms", fields: [sellerId], references: [id])
  messages  Message[]

  // Changed: now unique by cặp buyer-seller-post
  @@unique([buyerId, sellerId, postId])
  // Remove old unique: @@unique([buyerId, sellerId])
}
```

**File 2:** `backend/src/chat/chat.service.ts`

```typescript
async getRoomByBuyerSeller(buyerId: string, sellerId: string, postId?: string) {
  // Nếu có postId, tìm room cụ thể cho post này
  // Nếu không, tìm room gần đây nhất (backward compat)
  
  if (postId) {
    return this.prisma.chatRoom.findUnique({
      where: { buyerId_sellerId_postId: { buyerId, sellerId, postId } },
      include: { /* ... */ },
    });
  }

  // Fallback: find most recent room
  return this.prisma.chatRoom.findFirst({
    where: { OR: [{ buyerId, sellerId }, { buyerId: sellerId, sellerId: buyerId }] },
    orderBy: { updatedAt: 'desc' },
    include: { /* ... */ },
  });
}

async createRoom(postId: string, buyerId: string, sellerId: string) {
  if (buyerId === sellerId) {
    throw new ForbiddenException('Không thể chat với chính mình');
  }
  const post = await this.prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!post) throw new ForbiddenException('Bài đăng không tồn tại');
  if (post.authorId !== sellerId) {
    throw new ForbiddenException('Bài đăng không thuộc người bán này');
  }

  const blocked = await this.prisma.blockedUser.findFirst({
    where: {
      OR: [
        { blockerId: buyerId, blockedId: sellerId },
        { blockerId: sellerId, blockedId: buyerId },
      ],
    },
  });
  if (blocked) throw new ForbiddenException('Không thể tạo phòng chat (đã bị chặn)');

  // Upsert: tạo nếu chưa có, nếu có thì trả room cũ
  return this.prisma.chatRoom.upsert({
    where: { buyerId_sellerId_postId: { buyerId, sellerId, postId } },
    create: { postId, buyerId, sellerId },
    update: { updatedAt: new Date() },
    include: { /* ... */ },
  });
}
```

**File 3:** `backend/src/chat/chat.controller.ts`

```typescript
async getOrCreateRoom(
  @Request() req,
  @Body() body: {
    postId: string;
    sellerId: string;
    postTitle?: string;
    extraPosts?: { id: string; title: string }[];
  },
) {
  const buyerId = req.user.id;
  const hasExtra = body.extraPosts && body.extraPosts.length > 0;

  // Tìm room cho post cụ thể này
  let room = await this.chatService.getRoomByBuyerSeller(
    buyerId,
    body.sellerId,
    body.postId,  // thêm postId
  );

  if (!room) {
    room = await this.chatService.createRoom(body.postId, buyerId, body.sellerId);
  }

  // ... rest of code
}
```

**Migration:**

```sql
-- Xóa old unique, tạo new unique
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_buyerId_sellerId_key";
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_buyerId_sellerId_postId_key" 
  UNIQUE ("buyerId", "sellerId", "postId");
```

---

## FIX #5: Reduce batch size in post.service.createPost()

**File:** `backend/src/post/post.service.ts` (dòng 285-308)

```typescript
// Thay từ BATCH_SIZE = 50 xuống 10-15, delay 200-300ms
const BATCH_SIZE = 10;  // reduced
const BATCH_DELAY_MS = 200;  // increased

if (userId) {
  this.prisma.follow.findMany({ 
    where: { followingId: userId }, 
    select: { followerId: true } 
  })
    .then(async (follows) => {
      if (follows.length === 0) return;
      const author = await this.prisma.user.findUnique({ 
        where: { id: userId }, 
        select: { name: true } 
      });
      const authorName = author?.name ?? 'Ai đó';
      
      for (let i = 0; i < follows.length; i += BATCH_SIZE) {
        const batch = follows.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(f =>
          this.notification.createNotification(
            f.followerId,
            'new_post',
            'Bài đăng mới từ người bạn theo dõi',
            `${authorName} vừa đăng: "${post.title}"`,
            JSON.stringify({ postId: post.id }),
          ).catch(() => {}),
        ));
        // Delay between batches
        if (i + BATCH_SIZE < follows.length) {
          await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
        }
      }
    })
    .catch(() => {});
}
```

---

## FIX #6: BumpOrder expiry cron

**File:** `backend/src/bump/bump.cron.ts` (new file)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BumpCronService {
  private readonly logger = new Logger(BumpCronService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireBoostOrders() {
    const now = new Date();
    try {
      // 1. Mark expired orders
      const expired = await this.prisma.bumpOrder.updateMany({
        where: {
          status: 'paid',
          expiredAt: { lte: now },
        },
        data: { status: 'expired' },
      });

      // 2. Reset boostTier for expired posts
      if (expired.count > 0) {
        await this.prisma.post.updateMany({
          where: {
            bumpOrder: {
              some: {
                status: 'expired',
                postId: { not: null },
              },
            },
          },
          data: { boostTier: 0, bumpedAt: null },
        });

        this.logger.log(`[BumpCron] Expired ${expired.count} boost orders and reset posts`);
      }
    } catch (error) {
      this.logger.error(`[BumpCron] Error expiring boosts: ${error}`);
    }
  }
}
```

**File:** `backend/src/app.module.ts`

```typescript
import { ScheduleModule } from '@nestjs/schedule';
import { BumpCronService } from './bump/bump.cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    // ... other imports
  ],
  providers: [BumpCronService],
})
export class AppModule {}
```

---

## FIX #7: Notification cleanup cron

**File:** `backend/src/admin/admin.cron.ts` (new file)

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdminService } from './admin.service';

@Injectable()
export class AdminCronService {
  private readonly logger = new Logger(AdminCronService.name);

  constructor(private adminService: AdminService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldNotifications() {
    try {
      const count = await this.adminService.deleteOldNotifications();
      this.logger.log(`[AdminCron] Cleaned up ${count} old notifications`);
    } catch (error) {
      this.logger.error(`[AdminCron] Error cleaning notifications: ${error}`);
    }
  }
}
```

**File:** `backend/src/app.module.ts` (update)

```typescript
import { AdminCronService } from './admin/admin.cron.service';

@Module({
  providers: [BumpCronService, AdminCronService],
})
export class AppModule {}
```

---

## FIX #8: Consolidate images/imageLabel

**Option: Deprecate imageLabel, use images[0]**

**File:** `backend/src/post/post.service.ts`

```typescript
// Remove buildImageUrl() logic if not used elsewhere
// Use: post.images[0] directly

export function formatPost(post: any) {
  const images = post.images && post.images.length > 0 ? post.images : [];
  return {
    ...post,
    imageUrl: images[0] ?? null,
    images,
  };
}
```

**File:** `backend/src/post/post.service.ts` (createPost)

```typescript
const post = await this.prisma.post.create({
  data: {
    // ... other fields
    images: urls,
    imageLabel: urls[0] || '',  // giữ tạm cho backward compat
    // ...
  },
});
```

**Migration:** Khôi phục data từ `images[0]` thành `imageLabel` nếu cần

---

## FIX #9: Review DB-level constraint

**File:** `backend/prisma/schema.prisma`

```prisma
model Review {
  id         String   @id @default(cuid())
  postId     String
  reviewerId String
  revieweeId String
  rating     Int
  comment    String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  post       Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  reviewee   User     @relation("ReviewReceived", fields: [revieweeId], references: [id])
  reviewer   User     @relation("ReviewGiven", fields: [reviewerId], references: [id])

  @@unique([postId, reviewerId])
  @@index([revieweeId])
  @@index([postId])

  // DB-level: post phải có status = 'done' để có review
  @@check("EXISTS(SELECT 1 FROM \"Post\" WHERE \"Post\".\"id\" = \"Review\".\"postId\" AND \"Post\".\"status\" = 'done')")
}
```

**Hoặc Postgres trigger:**

```sql
CREATE FUNCTION check_review_post_done()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "Post"
    WHERE id = NEW."postId" AND status = 'done'
  ) THEN
    RAISE EXCEPTION 'Post must be done before creating review';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_review_post_done_trigger
BEFORE INSERT ON "Review"
FOR EACH ROW
EXECUTE FUNCTION check_review_post_done();
```

---

## FIX #10: Fix Follow.getFeed() — Push filter to DB

**File:** `backend/src/follow/follow.service.ts`

```typescript
async getFeed(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);

  // Get following IDs
  const following = await this.prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  if (followingIds.length === 0) return { data: [], total: 0 };

  // Get blocked IDs
  const blocked = await this.prisma.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  });
  const blockedIds = new Set(blocked.map((b) => b.blockedId));

  // Filter NOT in blocked
  const visibleIds = followingIds.filter((id) => !blockedIds.has(id));

  if (visibleIds.length === 0) return { data: [], total: 0 };

  // DB-level filter + format
  const [data, total] = await Promise.all([
    this.prisma.post.findMany({
      where: {
        authorId: { in: visibleIds },
        status: 'available',
        author: { deletedAt: null },  // filter active authors
      },
      include: {
        author: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    }),
    this.prisma.post.count({
      where: {
        authorId: { in: visibleIds },
        status: 'available',
        author: { deletedAt: null },
      },
    }),
  ]);

  return { data: data.map(formatPost), total };
}
```

---

## Testing Checklist

Sau mỗi fix, verify:

```bash
# Test individual service
npm run test -- review.service.spec

# Lint check
npm run lint

# Type check
npm run build

# Integration test (nếu có)
npm run test:e2e

# Manually test endpoint
curl -X POST http://localhost:3800/review \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"postId":"...", "rating":5}'
```

