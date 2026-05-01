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

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("traotay:auth"));
}

const API_BASE =
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

export async function loginSendOtp(email: string): Promise<{ ok: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/user/email-login/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, message: data.message || (res.ok ? "Đã gửi OTP" : "Lỗi gửi OTP") };
}

export async function loginVerifyOtp(
  email: string,
  otp: string
): Promise<{ ok: boolean; token?: string; user?: AuthUser; message: string }> {
  const res = await fetch(`${API_BASE}/user/email-login/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: data.message || "Mã OTP không đúng" };
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
    message: "Đăng nhập thành công",
  };
}

/// Verify token còn valid + sync user state. Gọi khi mount app.
export async function fetchMyProfile(): Promise<AuthUser | null> {
  const res = await authFetch("/user/me");
  if (!res.ok) return null;
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
