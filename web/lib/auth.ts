/**
 * Auth state quản lý local cho web (static export).
 * JWT lưu localStorage; verify lại với backend khi load app để check còn valid.
 *
 * Lý do không dùng httpOnly cookie: static export chạy trên nginx, không có
 * Node server để set cookie. JWT trong localStorage có rủi ro XSS nhưng
 * mitigated bởi CSP đã set ở nginx.
 */

const TOKEN_KEY = "traotay_token";
const USER_KEY = "traotay_user";

export type AuthUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  avatar: string | null;
  role: string;
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Notify same-tab listeners
  window.dispatchEvent(new Event("traotay:auth"));
}

/** Cập nhật cache user mà KHÔNG dispatch event — dùng bên trong syncFromToken để
 * tránh vòng lặp vô hạn: saveAuth → traotay:auth → syncFromToken → saveAuth → ... */
export function updateUserCache(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("traotay:auth"));
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.traotay.com.vn";

/// Authenticated fetch — tự gắn Authorization header.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
}

/// Map status + raw message thành tiếng Việt thân thiện cho user.
/// NestJS @Throttle trả "ThrottlerException: Too Many Requests" — dịch sang Việt.
function friendlyError(status: number, rawMessage: string | undefined): string {
  if (status === 429) {
    return "Bạn gửi quá nhanh. Vui lòng đợi 60 giây rồi thử lại.";
  }
  if (status === 0 || status >= 500) {
    return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau ít phút.";
  }
  if (!rawMessage) return `Lỗi (HTTP ${status})`;
  // Dịch một số message backend hay gặp
  if (/throttler/i.test(rawMessage)) return "Bạn gửi quá nhanh. Vui lòng đợi 60 giây rồi thử lại.";
  return rawMessage;
}

export async function loginSendOtp(email: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/user/email-login/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: friendlyError(res.status, data.message) };
  }
  return { ok: true, message: data.message || "Đã gửi mã OTP đến email" };
}

export async function loginVerifyOtp(
  email: string,
  otp: string
): Promise<{ ok: boolean; token?: string; user?: AuthUser; isNewUser?: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/user/email-login/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: friendlyError(res.status, data.message) || "Mã OTP không đúng" };
  }
  // Backend trả `accessToken` (NestJS convention), không phải `token`.
  // App mobile cũng đọc accessToken — phải match.
  const token: string | undefined = data.accessToken ?? data.token;
  if (!token || !data.user) {
    return { ok: false, message: "Phản hồi máy chủ không hợp lệ" };
  }
  return {
    ok: true,
    token,
    user: data.user,
    isNewUser: Boolean(data.isNewUser),
    message: "Đăng nhập thành công",
  };
}

/// Update name của user hiện tại. Trả về user mới sau update.
export async function updateMyName(userId: string, name: string): Promise<AuthUser | null> {
  const res = await authFetch(`/user/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ name: name.trim() }),
  });
  if (!res.ok) return null;
  // fetchMyProfile có thể throw trên network/5xx — catch để không break update flow
  return fetchMyProfile().catch(() => null);
}

/// Upload avatar — multipart form. Trả URL avatar mới.
export async function uploadAvatarFile(file: File): Promise<string | null> {
  const token = getToken();
  const fd = new FormData();
  fd.append("avatar", file);
  // KHÔNG set Content-Type: browser auto set với boundary.
  const res = await fetch(`${API_BASE}/user/avatar`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.avatar ?? null;
}

/// Tạo bài đăng mới với multipart (text fields + images files).
/// Trả về post mới hoặc null khi lỗi.
export async function createPost(
  fields: Record<string, string | number | undefined | null>,
  images: File[]
): Promise<{ ok: boolean; post?: any; message?: string }> {
  const token = getToken();
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v != null && v !== "") fd.append(k, String(v));
  }
  for (const img of images) {
    fd.append("images", img);
  }
  const res = await fetch(`${API_BASE}/post`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: data.message || `Lỗi HTTP ${res.status}` };
  }
  return { ok: true, post: data };
}

/// Verify token còn valid + sync user state. Gọi khi mount app.
/// Return null CHỈ khi backend nói rõ token sai (401/403) → caller clear auth.
/// Throw khi network error / 5xx → caller giữ cached user (lỗi tạm thời).
/// Trước fix: bất kỳ !res.ok nào cũng return null → 5xx hoặc Cloudflare timeout
/// làm user bị log-out oan ngay khi avatar vừa hiện ra.
export async function fetchMyProfile(): Promise<AuthUser | null> {
  const res = await authFetch("/user/me");
  if (res.status === 401 || res.status === 403) {
    return null; // token thật sự invalid, caller clear auth
  }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`); // lỗi tạm thời, giữ cached user
  }
  const data = await res.json();
  return {
    id: data.id,
    email: data.email,
    phone: data.phone,
    name: data.name,
    avatar: data.avatar,
    role: data.role,
  };
}

/// Upload 1 ảnh cho post → trả URL public. Dùng khi sửa bài thêm ảnh mới.
/// Frontend sau đó gọi updatePost với images=[URL cũ giữ + URL mới upload].
export async function uploadPostImageFile(file: File): Promise<string | null> {
  const token = getToken();
  const fd = new FormData();
  fd.append("image", file);
  const res = await fetch(`${API_BASE}/post/upload-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url ?? null;
}

/// Cập nhật bài đăng (text + array URLs ảnh). Backend kiểm tra authorId === user.id.
export async function updatePost(
  id: string,
  body: Record<string, any>
): Promise<{ ok: boolean; message?: string }> {
  const res = await authFetch(`/post/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message || `Lỗi HTTP ${res.status}` };
  }
  return { ok: true };
}

/// Đổi status post (vd: 'done' khi đã giao dịch xong, 'available' để hiện lại, etc).
export async function updatePostStatus(
  id: string,
  status: string,
  completedWithUserId?: string
): Promise<{ ok: boolean; message?: string }> {
  const body: any = { status };
  if (completedWithUserId) body.completedWithUserId = completedWithUserId;
  const res = await authFetch(`/post/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message || `Lỗi HTTP ${res.status}` };
  }
  return { ok: true };
}

/// Bài đăng của tôi (my posts). Filter status optional.
export async function fetchMyPosts(status?: string): Promise<any[]> {
  const path = status ? `/post/my?status=${encodeURIComponent(status)}` : "/post/my";
  const res = await authFetch(path);
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

/// Stats cho seller (tổng view, deal, response time, rating). Dùng cho /me/stats.
export async function fetchMyStats(): Promise<any | null> {
  const res = await authFetch("/post/my/stats");
  if (!res.ok) return null;
  return res.json();
}

// ─── Bump (PayOS) ────────────────────────────────────────────────────────────

export type BumpPackage = "plus_3d" | "vip_7d";

/// Tạo đơn bump → PayOS trả URL checkout. Frontend redirect tới URL đó.
export async function createBumpOrder(
  postId: string,
  pkg: BumpPackage
): Promise<{ ok: boolean; checkoutUrl?: string; orderId?: string; message?: string }> {
  const res = await authFetch(`/bump/${postId}/order`, {
    method: "POST",
    body: JSON.stringify({ package: pkg }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: data.message || `Lỗi HTTP ${res.status}` };
  }
  return {
    ok: true,
    checkoutUrl: data.checkoutUrl ?? data.paymentLinkUrl ?? data.url,
    orderId: data.orderId ?? data.id,
  };
}

/// Trạng thái boost hiện tại của post (boostTier + bumpedAt + expiredAt).
export async function fetchBumpStatus(postId: string): Promise<any | null> {
  const res = await fetch(`${API_BASE}/bump/${postId}/status`, {
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  });
  if (!res.ok) return null;
  return res.json();
}

// ─── Review ──────────────────────────────────────────────────────────────────

export async function createReview(
  postId: string,
  rating: number,
  comment?: string
): Promise<{ ok: boolean; message?: string }> {
  const res = await authFetch("/review", {
    method: "POST",
    body: JSON.stringify({ postId, rating, comment }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: data.message || `Lỗi HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function updateReview(
  postId: string,
  rating: number,
  comment?: string
): Promise<{ ok: boolean; message?: string }> {
  const res = await authFetch(`/review/${postId}`, {
    method: "PATCH",
    body: JSON.stringify({ rating, comment }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, message: data.message || `Lỗi HTTP ${res.status}` };
  }
  return { ok: true };
}

/// Check user đã review post này chưa. Trả {hasReviewed: bool, review?: {...}}.
export async function checkHasReviewed(postId: string): Promise<{ hasReviewed: boolean; review?: any }> {
  const res = await authFetch(`/review/check/${postId}`);
  if (!res.ok) return { hasReviewed: false };
  return res.json();
}

/// Đánh giá TÔI ĐÃ VIẾT cho người khác. Khác fetchUserReviews vốn lấy đánh giá NHẬN.
export async function fetchMyGivenReviews(): Promise<any[]> {
  const res = await authFetch("/review/my/given?limit=50");
  if (!res.ok) return [];
  const data = await res.json();
  return data.reviews ?? [];
}

// ─── Notifications ───────────────────────────────────────────────────────────

export async function fetchNotifications(): Promise<any[]> {
  const res = await authFetch("/notification");
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await authFetch("/notification/unread-count");
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const res = await authFetch(`/notification/${id}/read`, { method: "PATCH" });
  return res.ok;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const res = await authFetch("/notification/read-all", { method: "PATCH" });
  return res.ok;
}

// ─── Block user ──────────────────────────────────────────────────────────────

export async function blockUser(targetId: string): Promise<boolean> {
  const res = await authFetch(`/user/block/${targetId}`, { method: "POST" });
  return res.ok;
}

export async function unblockUser(targetId: string): Promise<boolean> {
  const res = await authFetch(`/user/block/${targetId}`, { method: "DELETE" });
  return res.ok;
}

export async function fetchBlockedUsers(): Promise<any[]> {
  const res = await authFetch("/user/blocked/list");
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.data ?? [];
}

// ─── Keyword alerts ──────────────────────────────────────────────────────────

export async function fetchKeywordAlerts(): Promise<string[]> {
  const res = await authFetch("/keyword-alert");
  if (!res.ok) return [];
  const data = await res.json();
  if (Array.isArray(data)) return data.map((x: any) => x.keyword ?? x);
  return data.data?.map((x: any) => x.keyword ?? x) ?? [];
}

export async function subscribeKeyword(keyword: string): Promise<boolean> {
  const res = await authFetch("/keyword-alert", {
    method: "POST",
    body: JSON.stringify({ keyword }),
  });
  return res.ok;
}

export async function unsubscribeKeyword(keyword: string): Promise<boolean> {
  const res = await authFetch("/keyword-alert", {
    method: "DELETE",
    body: JSON.stringify({ keyword }),
  });
  return res.ok;
}

// ─── Link email/SĐT phụ ──────────────────────────────────────────────────────

export async function sendLinkEmailOtp(email: string): Promise<{ ok: boolean; message: string }> {
  const res = await authFetch("/user/link-email/send", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, message: data.message || (res.ok ? "Đã gửi OTP" : "Lỗi gửi OTP") };
}

export async function confirmLinkEmail(
  email: string,
  otp: string
): Promise<{ ok: boolean; message: string }> {
  const res = await authFetch("/user/link-email/confirm", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, message: data.message || (res.ok ? "Liên kết thành công" : "Lỗi") };
}

// ─── /dac-dinh (luyện thi Đặc định kỹ năng) — ADR-0015 ────────────────────────

/// Ghi lại 1 lần hoàn thành dạng bài lên server, song song với localStorage (không thay thế).
/// Best-effort: lỗi mạng không chặn UI, chỉ đơn giản không tính vào thống kê admin lần đó.
export async function recordDacDinhAttempt(
  chapterId: string,
  exerciseType: string,
  score: number,
  total: number
): Promise<void> {
  try {
    await authFetch("/dac-dinh/attempt", {
      method: "POST",
      body: JSON.stringify({ chapterId, exerciseType, score, total }),
    });
  } catch {
    // best-effort, không chặn luồng làm bài của user
  }
}

/// Ping presence cho admin đếm "đang online" — gọi định kỳ trong lúc còn ở trang /dac-dinh,
/// không phụ thuộc đang làm bài hay chỉ xem danh sách chương. Xem ADR-0016.
export async function sendDacDinhHeartbeat(): Promise<void> {
  try {
    await authFetch("/dac-dinh/heartbeat", { method: "POST" });
  } catch {
    // best-effort
  }
}
