"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getStoredUser, updateMyName, uploadAvatarFile, type AuthUser } from "@/lib/auth";

/// W-01 (2026-05-20): Onboarding flow sau signup user mới.
/// Collect minimum profile (name + avatar) trước khi vào app chính —
/// tăng activation rate. Trước đó: user mới signup → empty profile →
/// vào home thấy trống → bỏ đi (activation 0%).
function OnboardingInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";

  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [step, setStep] = useState<"intro" | "profile" | "done">("intro");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.replace("/login/");
      return;
    }
    setUser(u);
    setName(u.name || "");
    setAvatarPreview(u.avatar || null);
  }, [router]);

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErr("Ảnh quá lớn, tối đa 5MB");
      return;
    }
    setErr(null);
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function onSave() {
    if (!user) return;
    if (!name.trim() || name.trim().length < 2) {
      setErr("Vui lòng nhập tên hiển thị (tối thiểu 2 ký tự)");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      // 1. Upload avatar trước (nếu có)
      if (avatarFile) {
        const url = await uploadAvatarFile(avatarFile);
        if (!url) {
          setErr("Không upload được ảnh đại diện, thử lại sau");
          setSaving(false);
          return;
        }
      }
      // 2. Update name
      const updated = await updateMyName(user.id, name.trim());
      if (!updated) {
        setErr("Không lưu được tên, thử lại sau");
        setSaving(false);
        return;
      }
      setStep("done");
    } finally {
      setSaving(false);
    }
  }

  function onSkip() {
    router.replace(next);
  }

  function onFinish() {
    router.replace(next);
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto bg-white border border-ink-200/70 rounded-md shadow-card p-8 my-12 text-center text-ink-500">
        Đang tải...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-ink-200/70 rounded-md shadow-card p-8 my-12 animate-slide-in-up">
      {step === "intro" && (
        <div>
          <div className="text-center mb-7">
            <div className="text-5xl mb-3">🎁</div>
            <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight mb-2">
              Chào mừng đến Trao Tay
            </h1>
            <p className="text-ink-500 text-sm">
              Đồ cũ người này, Báu vật người kia.
            </p>
          </div>

          <ol className="space-y-3 mb-7 text-left">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-800 font-bold text-sm flex items-center justify-center">
                🎁
              </span>
              <div>
                <p className="font-semibold text-ink-800 text-sm">Mục TẶNG MIỄN PHÍ riêng</p>
                <p className="text-ink-500 text-xs">Tách khỏi tin bán — người cần đồ thật sự không phải lọc qua tin shop.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-800 font-bold text-sm flex items-center justify-center">
                📍
              </span>
              <div>
                <p className="font-semibold text-ink-800 text-sm">Lọc theo tỉnh/quận chính xác</p>
                <p className="text-ink-500 text-xs">Đồ gần nhà, đi lấy nhanh trong ngày.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary-100 text-primary-800 font-bold text-sm flex items-center justify-center">
                💬
              </span>
              <div>
                <p className="font-semibold text-ink-800 text-sm">Chat realtime + thông báo đẩy</p>
                <p className="text-ink-500 text-xs">Phản hồi trong vài giây, không phải đợi.</p>
              </div>
            </li>
          </ol>

          <button
            onClick={() => setStep("profile")}
            className="w-full bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
          >
            Tiếp tục
          </button>
          <button
            onClick={onSkip}
            className="w-full text-ink-500 hover:text-ink-700 text-sm font-medium py-2 mt-2"
          >
            Bỏ qua, vào dùng ngay
          </button>
        </div>
      )}

      {step === "profile" && (
        <div>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight mb-2">
              Hoàn thiện hồ sơ
            </h1>
            <p className="text-ink-500 text-sm">
              Tên và ảnh giúp người mua/người nhận tin tưởng bạn hơn.
            </p>
          </div>

          <div className="flex flex-col items-center mb-5">
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer relative w-24 h-24 rounded-full bg-ink-100 border-2 border-dashed border-ink-300 hover:border-primary transition-colors duration-150 flex items-center justify-center overflow-hidden mb-2"
            >
              {avatarPreview ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatarPreview} alt="Ảnh đại diện" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl text-ink-400">📷</span>
              )}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
            <p className="text-xs text-ink-500">Bấm để chọn ảnh đại diện (tuỳ chọn)</p>
          </div>

          <div className="mb-5">
            <label htmlFor="name-input" className="block text-sm font-semibold text-ink-800 mb-1.5">
              Tên hiển thị <span className="text-red-500">*</span>
            </label>
            <input
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên anh chị (vd: Hùng, Mai, Lan...)"
              className="w-full px-4 py-3 border border-ink-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-ink-900 placeholder-ink-400"
              maxLength={50}
              autoComplete="name"
            />
            <p className="text-xs text-ink-500 mt-1">
              Hiển thị khi anh chị đăng bài hoặc nhắn tin. Có thể sửa sau.
            </p>
          </div>

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2.5 mb-4">
              {err}
            </div>
          )}

          <button
            onClick={onSave}
            disabled={saving || !name.trim() || name.trim().length < 2}
            className="w-full bg-primary hover:bg-primary-dark active:scale-[0.97] disabled:bg-ink-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
          >
            {saving ? "Đang lưu..." : "Lưu và tiếp tục"}
          </button>
          <button
            onClick={onSkip}
            disabled={saving}
            className="w-full text-ink-500 hover:text-ink-700 text-sm font-medium py-2 mt-2"
          >
            Bỏ qua, làm sau
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="text-center">
          <div className="text-6xl mb-4">🌱</div>
          <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight mb-2">
            Sẵn sàng rồi!
          </h1>
          <p className="text-ink-500 text-sm mb-7">
            Anh chị có thể bắt đầu đăng bài đầu tiên ngay bây giờ, hoặc lướt feed để xem bài người khác đăng.
          </p>

          <div className="space-y-2">
            <Link
              href="/posts/new/"
              className="block w-full bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm"
            >
              Đăng bài đầu tiên
            </Link>
            <button
              onClick={onFinish}
              className="w-full text-ink-700 hover:text-primary text-sm font-medium py-2 border border-ink-300 hover:border-primary rounded-md transition-colors duration-150"
            >
              Lướt feed trước
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto bg-white border border-ink-200/70 rounded-md shadow-card p-8 my-12 text-center text-ink-500">
          Đang tải...
        </div>
      }
    >
      <OnboardingInner />
    </Suspense>
  );
}
