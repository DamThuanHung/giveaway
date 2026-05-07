"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { sendLinkEmailOtp, confirmLinkEmail } from "@/lib/auth";
import { WebPushToggle } from "@/components/WebPushToggle";

export default function SecurityPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"idle" | "sent">("idle");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login/?next=/me/security/");
  }, [user, authLoading, router]);

  async function onSend() {
    if (!email.trim() || !email.includes("@")) {
      setMsg({ type: "err", text: "Email không hợp lệ" });
      return;
    }
    setPending(true);
    setMsg(null);
    const res = await sendLinkEmailOtp(email.trim().toLowerCase());
    setPending(false);
    if (!res.ok) {
      setMsg({ type: "err", text: res.message });
      return;
    }
    setStep("sent");
    setMsg({ type: "ok", text: "Đã gửi mã OTP — kiểm tra hộp thư (kể cả Spam)" });
  }

  async function onConfirm() {
    if (otp.length !== 6) {
      setMsg({ type: "err", text: "Nhập đủ 6 chữ số" });
      return;
    }
    setPending(true);
    setMsg(null);
    const res = await confirmLinkEmail(email.trim().toLowerCase(), otp);
    setPending(false);
    if (!res.ok) {
      setMsg({ type: "err", text: res.message });
      return;
    }
    setMsg({ type: "ok", text: "✓ " + res.message });
    setStep("idle");
    setEmail("");
    setOtp("");
    await refresh?.();
  }

  if (authLoading || !user) {
    return (
      <>
        <Header />
        <div className="text-center py-20 text-ink-500">Đang tải...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-2xl mx-auto px-4 py-7 md:py-8">
          <Link href="/me/" className="text-sm text-ink-500 hover:text-primary-600 mb-2 inline-block transition-colors duration-150">
            ← Quay lại Hồ sơ
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">🔐 Bảo mật tài khoản</h1>
          <p className="text-ink-600 text-sm mt-1">
            Liên kết email/SĐT phụ để đăng nhập linh hoạt + khôi phục khi mất tài khoản chính
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <WebPushToggle />

        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          <div className="text-xs font-semibold text-ink-500 mb-1.5 tracking-wide">EMAIL CHÍNH</div>
          <div className="font-bold text-ink-900">{user.email || "—"}</div>
          <p className="text-xs text-ink-500 mt-2">
            Email đăng nhập chính. Liên hệ admin để thay đổi.
          </p>
        </div>

        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          <div className="text-xs font-semibold text-ink-500 mb-1.5 tracking-wide">SỐ ĐIỆN THOẠI</div>
          <div className="font-bold text-ink-900">{user.phone || "Chưa liên kết"}</div>
          <p className="text-xs text-ink-500 mt-2">
            Liên kết SĐT chỉ thực hiện được trên app mobile (xác minh OTP qua Firebase).
            <br />
            <a
              href="https://play.google.com/store/apps/details?id=vn.traotay.app"
              target="_blank"
              rel="noopener"
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              Tải app
            </a>{" "}
            để liên kết SĐT.
          </p>
        </div>

        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          <div className="text-xs font-semibold text-ink-500 mb-1.5 tracking-wide">LIÊN KẾT EMAIL PHỤ</div>
          <p className="text-xs text-ink-500 mb-4">
            Email phụ giúp khôi phục tài khoản khi mất quyền truy cập email chính. Tối đa 1 email phụ.
          </p>

          {step === "idle" && (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email-phu@example.com"
                className="flex-1 bg-cream-100 border border-ink-200 rounded-md px-3 py-2.5 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-150 ease-warm"
              />
              <button
                onClick={onSend}
                disabled={pending}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm disabled:opacity-60"
              >
                {pending ? "..." : "Gửi OTP"}
              </button>
            </div>
          )}

          {step === "sent" && (
            <div>
              <p className="text-sm text-ink-700 mb-2">
                Mã OTP đã gửi tới <strong>{email}</strong>:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  className="flex-1 bg-cream-100 border border-ink-200 rounded-md px-3 py-2.5 text-center tracking-widest font-bold focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-150 ease-warm"
                  maxLength={6}
                />
                <button
                  onClick={onConfirm}
                  disabled={pending || otp.length !== 6}
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-5 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm disabled:opacity-60"
                >
                  {pending ? "..." : "Xác nhận"}
                </button>
              </div>
              <button
                onClick={() => {
                  setStep("idle");
                  setOtp("");
                  setMsg(null);
                }}
                className="text-sm text-ink-500 hover:text-primary-600 mt-3 transition-colors duration-150"
              >
                ← Đổi email khác
              </button>
            </div>
          )}

          {msg && (
            <div
              className={`mt-3 text-sm rounded-md px-3 py-2 ${
                msg.type === "ok"
                  ? "bg-primary-100 border border-primary-200 text-primary-800"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              {msg.text}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
