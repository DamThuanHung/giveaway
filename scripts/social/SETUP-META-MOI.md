# Prompt cho Gemini in Chrome — Lấy lại token Meta cho Trao Tay (dùng đúng tài khoản cũ)

> Lý do: máy chủ cũ (EC2) bị sập, mất hết token Facebook/Instagram/Threads. Cần lấy lại token mới cho đúng 3 tài khoản đang dùng từ trước tới giờ — **không tạo tài khoản mới, không đổi gì**:
> - Facebook Page: **"Câu chuyện cuộc sống"** (id `1134105193114852`)
> - Instagram: **@damthuanhung** (đã link sẵn với Trang trên)
> - Threads: **@traotaythread**

Copy toàn bộ phần dưới đây dán vào Gemini in Chrome (hoặc làm tay theo từng bước):

---

Tôi cần bạn giúp tôi lấy lại access token cho Facebook, Instagram và Threads để khôi phục hệ thống đăng bài tự động cho app "Trao Tay" — dùng đúng các tài khoản đã có sẵn, không tạo tài khoản mới. Hãy làm từng bước, dừng lại hỏi tôi nếu cần xác nhận hoặc nhập mã OTP/mật khẩu.

**Bước 1 — Lấy Facebook Page Access Token (loại never-expire)**
1. Vào developers.facebook.com/tools/explorer
2. Chọn App **"Trao Tay Marketing"** (app id `2220152625497171`)
3. Chọn loại token: **User Token**, quyền cần: `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`
4. Bấm "Generate Access Token", đăng nhập nếu được hỏi, đồng ý quyền
5. Vào **Access Token Debugger** (developers.facebook.com/tools/debug/accesstoken), dán token vừa lấy, bấm **"Extend Access Token"** (không cần App Secret) — token lúc này sẽ never-expire
6. Dùng token đã extend, gọi (dán URL này vào thanh địa chỉ trình duyệt):
   `https://graph.facebook.com/v19.0/me/accounts?access_token=<USER_TOKEN_ĐÃ_EXTEND>`
7. Tìm Trang **"Câu chuyện cuộc sống"** (id `1134105193114852`) trong kết quả trả về, copy giá trị `access_token` đi kèm — đây là FB_PAGE_ACCESS_TOKEN. FB_PAGE_ID = `1134105193114852` (đã biết sẵn).

**Bước 2 — Lấy Instagram token**
1. Vẫn dùng Page Access Token ở Bước 1, gọi:
   `https://graph.facebook.com/v19.0/1134105193114852?fields=instagram_business_account&access_token=<PAGE_ACCESS_TOKEN>`
2. Kết quả trả về trường `instagram_business_account.id` — nên khớp với IG_ACCOUNT_ID đã biết (`17841404573682152`), nếu khác thì lấy giá trị mới này
3. IG_ACCESS_TOKEN dùng chung luôn Page Access Token ở Bước 1 (không cần token riêng)

**Bước 3 — Lấy lại token Threads (@traotaythread)**
1. Vào developers.facebook.com/apps/2220152625497171 (app "Trao Tay Marketing")
2. Vào mục "Threads API" ở sidebar trái → tab Cài đặt
3. Tìm khung **"Công cụ tạo mã người dùng"** → nếu đã có dòng cho @traotaythread, bấm sinh token mới; nếu không thấy, vào Vai trò trong ứng dụng → Vai trò → Thêm người → chọn "Người dùng thử Threads" → nhập `traotaythread` → gửi lời mời, rồi dùng điện thoại đã đăng nhập @traotaythread vào `threads.com/settings/website_permissions` → tab "Lời mời" → Chấp nhận, quay lại Dashboard sinh token
4. Copy access token vừa sinh — đây là THREADS_ACCESS_TOKEN
5. Gọi `https://graph.threads.net/v1.0/me?access_token=<TOKEN_VỪA_LẤY>` để lấy `id` — đây là THREADS_USER_ID (nên khớp `28323442200578470`)

**Kết quả cần gửi lại cho tôi (4 giá trị, 2 ID còn lại đã biết sẵn):**
```
FB_PAGE_ACCESS_TOKEN=
IG_ACCESS_TOKEN=        (thường trùng FB_PAGE_ACCESS_TOKEN)
THREADS_ACCESS_TOKEN=
THREADS_USER_ID=        (để đối chiếu, nên là 28323442200578470)
```

---

Sau khi có đủ các giá trị trên, gửi lại cho em (hungdam) — em sẽ tự cập nhật `.env` trên VPS mới + đối chiếu bài đã đăng trên Threads (để không đăng trùng) + bật lại cron, không cần anh làm thêm gì về kỹ thuật.
