# DATA AUDIT REPORT — Trao Tay Backend

**Ngày audit:** 2026-05-22  
**Auditor:** Claude (Technical Manager AI)  
**Phạm vi:** Schema, Services, Controllers — Nhất quán dữ liệu & Performance

---

## PHÁT HIỆN VẤN ĐỀ

### 🔴 CRITICAL (Cao nhất)

#### 1. **DATABASE_SCHEMA.md LỖI THỜI**

**Vấn đề:** Tài liệu không khớp với schema.prisma thực tế

**Chi tiết:**
- Docs nói có **`Deal` table** → **Không tồn tại** trong schema.prisma
- Docs nói **`Review.dealId`** → Thực tế là **`Review.postId`**
- Docs nói **`User.dealsAsOwner, User.dealsAsRequester`** → Không có relations này
- Docs nói Review unique `[dealId, reviewerId]` → Thực tế `[postId, reviewerId]`

**Ảnh hưởng:** Nhà phát triển mới đọc docs sẽ bị confuse, sai lệch implementation  
**Fix:** Cập nhật `docs/DATABASE_SCHEMA.md` khớp schema.prisma (dòng 170-197)

---

#### 2. **Post.status = 'deleted_by_admin' — VÃO DB NHƯNG KHÔNG CÓ TRONG ENUM SCHEMA**

**Vấn đề:** Code dùng status `'deleted_by_admin'` nhưng:
- Schema định nghĩa status là String (no enum)
- Không có ràng buộc DB validate giá trị valid
- Admin có thể set post status = "anything" → frontend crash

**Vị trí:** `backend/src/post/post.service.ts` (dòng 17, 99, 104)  
**Lệnh:** `const DELETED_BY_ADMIN_STATUS = 'deleted_by_admin'`

**Ảnh hưởng:** 
- Admin dashboard có thể soft-delete post thành status không được liệt kê
- Public API trả post với status lạ → frontend UI vỡ

**Fix:** 
1. Thêm vào schema.prisma post model:
   ```prisma
   // Status trong DB PHẢI là một trong những giá trị sau
   // Để chống typo admin + ensure API validation
   ```
2. Tạo enum hoặc add validation ở DB level (PostgreSQL CHECK constraint)
3. Cập nhật VALID_POST_STATUSES trong code thành reality (5 status thực sự)

---

#### 3. **Soft-delete USER — Chỉ có deletedAt, KHÔNG enforce query filter**

**Vấn đề:** 
- Schema có `User.deletedAt` (nullable DateTime)
- Nhưng **không có query nào filter theo `deletedAt`**
- Khi user delete account, code xóa hết relations nhưng không soft-delete

**Vị trí:** 
- Schema dòng 24: `deletedAt DateTime?`
- Services không filter: `user.service.ts`, `follow.service.ts`, `review.service.ts`

**Ảnh hưởng:**
- Deleted user vẫn có thể nhận notification
- Follow/favorite của deleted user vẫn tồn tại trong query
- Analytics (totalUsers) đếm cả deleted user

**Fix:**
1. Trong `user.service.ts.deleteAccount()` → set `deletedAt` thay vì xóa
2. Thêm `.where({ deletedAt: null })` vào tất cả user query:
   - `user.service.ts.getPublicUserById()`
   - `follow.service.ts.getFollowers()`, `getFollowing()`
   - `review.service.ts.getUserReviews()`
   - `post.service.ts` (include author)
3. Tạo helper `selectActiveUser()` để standardize select fields

---

#### 4. **ChatRoom.unique([buyerId, sellerId]) — Cho phép NHIỀU postId cho cùng cặp buyer-seller**

**Vấn đề:**
- Schema unique only by `[buyerId, sellerId]` — **KHÔNG unique theo postId**
- 2 user có thể chat được về post1, post2, ... trong cùng 1 room
- Controller code tìm room và nếu không có thì tạo → chỉ tạo 1 room/cặp
- Nhưng API có thể bị abuse: N cặp (buyer, seller) → N chat rooms với multiple posts

**Vị trí:** 
- Schema dòng 174: `@@unique([buyerId, sellerId])`
- Controller dòng 32-36: `getRoomByBuyerSeller()` → tìm theo 2 user, bỏ qua postId

**Ảnh hưởng:**
- User A chat với B về post1 lúc 9:00
- User A chat với B về post2 lúc 10:00
- Cùng 1 room → tin nhắn xen kẽ → **confusing**
- Client logic phải xử lý "current post in this room"

**Fix:** 
1. **Option A (khuyến khích):** Thêm `@@unique([buyerId, sellerId, postId])` vào schema
   - Migration: Xóa room cũ, tạo mới unique constraint
   - Update controller: `getRoomByBuyerSeller(buyerId, sellerId, postId)`
2. **Option B:** Giữ 1 room/cặp, nhưng khi user chat post khác → gửi system message (đã làm ở dòng 50-56, OK)

---

#### 5. **N+1 Query — `post.service.createPost()` notification fan-out**

**Vấn đề:**
```typescript
// dòng 285-308 trong post.service.ts
this.prisma.follow.findMany({ where: { followingId: userId }, select: { followerId: true } })
  .then(async (follows) => {
    // ... batch 50 followers, Promise.all mỗi batch
```
- Khi user có 1000 followers, 20 batch × 50 followers mỗi batch
- Mỗi batch là 1 batch Promise.all → 50 parallel DB writes
- Connection pool default = 10 → có thể overwhelm

**Ảnh hưởng:** Tạo bài đăng khi user có nhiều followers → slow, pool exhaustion

**Fix:** Giảm batch size hoặc tăng pool size:
```typescript
const BATCH_SIZE = 10; // reduced từ 50
const delay = 200; // increased từ 100ms
```

---

### 🟡 HIGH (Cao)

#### 6. **Missing formatPost() — Favorite & Follow feed trả imageUrl không computed**

**Vấn đề:**
```typescript
// favorite.service.ts dòng 72-75
return favorites.map((f) => ({
  ...f,
  post: f.post ? formatPost(f.post) : null,  // OK, nhưng tại sao không làm từ đầu?
}));

// follow.service.ts dòng 135
return { data: data.map(formatPost), total };  // OK
```
- Favorite endpoint apply formatPost TRONG map
- Follow feed apply từ đầu
- **Inconsistency** — nên standardize

**Fix:** Thêm include/select khi query:
```typescript
// favorite.service.ts
const favorites = await this.prisma.favorite.findMany({
  where: { userId: String(userId) },
  include: {
    post: { select: { /* all post fields */ } },
  },
  orderBy: { createdAt: 'desc' },
});
return favorites.map(f => ({
  ...f,
  post: f.post ? formatPost(f.post) : null,
}));
```

---

#### 7. **Notification type 'transaction_completed' không trong schema comment list**

**Vấn đề:**
- Schema comment (dòng 154-166) list 10 notification types
- Code `post.service.ts` dòng 431 tạo type `'transaction_completed'`
- Type này không được document

**Fix:** Cập nhật schema comment hoặc code để match

---

#### 8. **Post.images vs Post.imageLabel — Dual source of truth**

**Vấn đề:**
```typescript
// post.service.ts dòng 56-63
const images = post.images && post.images.length > 0
  ? post.images
  : (post.imageLabel ? [buildImageUrl(post.imageLabel)].filter(Boolean) : []);
```
- Lưu cả `images[]` và `imageLabel` (phục vụ backward compat)
- Dòng 268: `imageLabel: urls[0] || ''`
- Dòng 350: `imageLabel: imagesPayload[0]`
- **Double sync** → có khả năng mất đồng bộ (edit post, forget imageLabel)

**Fix:** Một trong 2 cách:
1. Xóa `imageLabel`, dùng `images[0]` everywhere
2. Giữ `imageLabel`, xóa `images`, migrate data

---

#### 9. **BumpOrder status không có cron cleanup**

**Vấn đề:**
- BumpOrder có `expiredAt` và `status` = paid | expired | cancelled | refunded
- Code webhook set `status='paid'` + `expiredAt` (dòng 146)
- Nhưng **không có cron job** để set `status='expired'` khi hết hạn
- Post `boostTier` vẫn = 2/3 dù boost đã hết hạn

**Ảnh hưởng:** Post boost vãn hiển thị sau khi hết hạn, sai sorting

**Fix:** Tạo cron job `every hour` để:
```typescript
await this.prisma.bumpOrder.updateMany({
  where: { status: 'paid', expiredAt: { lte: new Date() } },
  data: { status: 'expired' },
});
await this.prisma.post.updateMany({
  where: {
    bumpOrder: {
      some: { status: 'expired' },
    },
  },
  data: { boostTier: 0, bumpedAt: null },
});
```

---

#### 10. **PostView vs Post.viewCount — Confusion về "source of truth"**

**Vấn đề:**
- `Post.viewCount` = lifetime count (increment mỗi khi xem)
- `PostView` = daily aggregate (upsert mỗi ngày)
- Admin dashboard có thể dùng cái nào?
- `getPostById()` increment cả 2 (dòng 210-217)

**Ảnh hưởng:** Inconsistent analytics, double-counting

**Fix:** Document rõ:
- `Post.viewCount` = mobile/web legacy, không dùng cho analytics
- `PostView` = source of truth cho admin dashboard
- Hoặc deprecated `Post.viewCount`, dùng `PostView` exclusively

---

#### 11. **Review — Không enforce post.status === 'done' ở DB level**

**Vấn đề:**
```typescript
// review.service.ts dòng 26
if (post.status !== 'done') {
  throw new BadRequestException('Chỉ đánh giá được sau khi giao dịch hoàn tất');
}
```
- Kiểm tra ở application level (NestJS)
- Nếu admin/bug set post.status trực tiếp trong DB → bypass check

**Fix:** Thêm CHECK constraint vào schema:
```prisma
model Review {
  // ... fields ...
  
  // DB-level validation: post phải có status = 'done'
  // không thể tạo review cho post còn 'available'
}
```
Hoặc trigger ở Postgres.

---

### 🟢 MEDIUM (Trung bình)

#### 12. **User query không optimize select — lấy quá nhiều field**

**Vấn đề:**
```typescript
// post.service.ts dòng 173
include: { author: { select: { id: true, name: true, avatar: true } } }

// chat.service.ts dòng 16-20 (getRoomByBuyerSeller)
include: {
  post: { select: { id: true, title: true, imageLabel: true } },
  buyer: { select: { id: true, name: true, avatar: true } },
  seller: { select: { id: true, name: true, avatar: true } },
}
```
- Query lấy không cần `createdAt`, `email`, `phone` → OK
- Nhưng không consistent (một số endpoint lấy `createdAt` dòng 203)

**Fix:** Tạo helper select:
```typescript
const USER_SELECT_PUBLIC = { id: true, name: true, avatar: true };
const USER_SELECT_FULL = { ...USER_SELECT_PUBLIC, email: true, phone: true };
```

---

#### 13. **Message metadata — Lưu JSON as String, không validate**

**Vấn đề:**
```typescript
// chat.service.ts dòng 93-95
const metadata = imageUrl
  ? JSON.stringify({ type: 'image', url: imageUrl })
  : null;
```
- Lưu `metadata: String?` (text, không JSON type)
- Client phải parse lấy, không validate schema
- Có thể lưu corrupted JSON

**Fix:** Thay `metadata` thành `metadata Json?` trong schema, hoặc validate ở application

---

#### 14. **KeywordAlert.notifyMatchingUsers() — Raw SQL ILIKE, có thể escape tương thích?**

**Vấn đề:**
```typescript
// keyword-alert.service.ts dòng 71
WHERE ${combinedText} ILIKE '%' || keyword || '%'
```
- `combinedText` = lowercase từ title + description
- `keyword` từ user input (đã trim + length check)
- Dùng `||` concatenation nhưng không dùng parameterized query cho combinedText

**Fix:** Parameterize combinedText:
```typescript
const matched = await this.prisma.$queryRaw`
  SELECT DISTINCT "userId", keyword
  FROM "KeywordAlert"
  WHERE ${Prisma.sql`${combinedText}`} ILIKE '%' || keyword || '%'
`;
```

---

#### 15. **Follow.getFeed() — Lấy toàn bộ following/blocked, sau đó filter JS**

**Vấn đề:**
```typescript
// follow.service.ts dòng 102-116
const [followingRows, blockedRows] = await Promise.all([
  this.prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  }),
  this.prisma.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true },
  }),
]);
```
- Lấy tất cả following → filter JS
- Nếu user follow 1000 người, lấy 1000 IDs, tạo Set, loop
- Nên filter ở DB: `post.findMany({ where: { authorId: { in: [NOT blockedIds] } } })`

**Fix:** Thay filter NOT với DB-level exclusion

---

### 🔵 LOW (Thấp)

#### 16. **Comment code nói "cron EVERY_HOUR" nhưng không implement**

**Vị trí:** Schema comment dòng 93-95  
**Fix:** Implement cron hoặc remove comment

---

#### 17. **AdminService.deleteOldNotifications() — Không được gọi**

**Vấn đề:**
```typescript
// admin.service.ts dòng 115-121
async deleteOldNotifications() {
  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const { count } = await this.prisma.notification.deleteMany({
    where: { createdAt: { lt: threshold } },
  });
  return count;
}
```
- Method tồn tại nhưng **không được gọi từ bất kỳ controller nào**
- Notification table sẽ grow vô hạn

**Fix:** 
1. Tạo cron job để gọi method này every day
2. Hoặc expose endpoint `/admin/cleanup/notifications` (with AdminGuard)

---

#### 18. **Report auto-hide — Logic tại application, nên ở DB trigger**

**Vấn đề:**
```typescript
// report.service.ts dòng 33-41
if (reportCount >= 3) {
  await this.prisma.post.update({
    where: { id: postId },
    data: { status: 'hidden' },
  });
}
```
- Kiểm tra pending reports từ 3 user khác nhau
- Nếu concurrency cao, có thể race condition (2 report cùng lúc → 2 update)

**Fix:** Dùng DB trigger hoặc transaction:
```typescript
await this.prisma.$transaction([
  this.prisma.report.create({ data: { ... } }),
  this.prisma.$executeRaw`
    UPDATE "Post" SET status='hidden'
    WHERE id=${postId}
    AND (SELECT COUNT(DISTINCT "userId") FROM "Report" WHERE "postId"=${postId}) >= 3;
  `,
]);
```

---

## SUMMARY

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 5 |
| 🟡 HIGH | 7 |
| 🟢 MEDIUM | 3 |
| 🔵 LOW | 3 |
| **Total** | **18** |

---

## ACTION ITEMS (Priority Order)

### Week 1 (Fix CRITICAL)
- [ ] Update `docs/DATABASE_SCHEMA.md` — remove Deal, fix Review fields
- [ ] Fix `Post.status` — add DB constraint or enum
- [ ] Implement soft-delete for User — update all queries
- [ ] Fix ChatRoom unique constraint
- [ ] Reduce batch size in `createPost()` notification fan-out

### Week 2 (Fix HIGH)
- [ ] Standardize formatPost() usage
- [ ] Fix notification type documentation
- [ ] Consolidate images/imageLabel field
- [ ] Add BumpOrder expiry cron
- [ ] Clarify PostView vs viewCount
- [ ] Add DB-level review constraint
- [ ] Review query optimization

### Week 3 (Fix MEDIUM/LOW)
- [ ] Clean up code comments
- [ ] Implement notification cleanup cron
- [ ] Add transaction safety for report auto-hide
- [ ] Improve keyword alert SQL safety

---

## VERIFICATION CHECKLIST

- [ ] Ran `npm run prisma:migrate` — no errors
- [ ] Ran `npm run test` — all pass
- [ ] Ran `npm run lint` — no warnings from audit fixes
- [ ] Spot-checked 3 controllers for response shape — all correct
- [ ] Verified soft-delete queries with `.where({ deletedAt: null })`
- [ ] Confirmed BumpOrder cron running + boostTier = 0 after expiry

