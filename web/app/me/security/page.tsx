"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { sendLinkEmailOtp, confirmLinkEmail } from "@/lib/auth";

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
        <div className="text-center py-20 text-gray-500">Đang tải...</div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-primary-light to-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-7">
          <Link href="/me/" className="text-sm text-gray-500 hover:text-primary mb-2 inline-block">
            ← Quay lại Hồ sơ
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">🔐 Bảo mật tài khoản</h1>
          <p className="text-gray-600 text-sm mt-1">
            Liên kết email/SĐT phụ để đăng nhập linh hoạt + khôi phục khi mất tài khoản chính
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Email chính */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-500 mb-1">EMAIL CHÍNH</div>
          <div className="font-bold text-navy">{user.email || "—"}</div>
          <p className="text-xs text-gray-500 mt-2">
            Email đăng nhập chính. Liên hệ admin để thay đổi.
          </p>
        </div>

        {/* SĐT */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-500 mb-1">SỐ ĐIỆN THOẠI</div>
          <div className="font-bold text-navy">{user.phone || "Chưa liên kết"}</div>
          <p className="text-xs text-gray-500 mt-2">
            Liên kết SĐT chỉ thực hiện được trên app mobile (xác minh OTP qua Firebase).
            <br />
            <a
              href="https://play.google.com/store/apps/details?id=vn.traotay.app"
              target="_blank"
              rel="noopener"
              className="text-primary hover:underline"
            >
              Tải app
            </a>{" "}
            để liên kết SĐT.
          </p>
        </div>

        {/* Liên kết email phụ */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-500 mb-1">LIÊN KẾT EMAIL PHỤ</div>
          <p className="text-xs text-gray-500 mb-4">
            Email phụ giúp khôi phục tài khoản khi mất quyền truy cập email chính. Tối đa 1 email phụ.
          </p>

          {step === "idle" && (
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email-phu@example.com"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
              />
              <button
                onClick={onSend}
                disabled={pending}
                className="bg-primary hover:bg-primary-dark text-white font-bold px-5 rounded-lg disabled:opacity-60"
              >
                {pending ? "..." : "Gửi OTP"}
              </button>
            </div>
          )}

          {step === "sent" && (
            <div>
              <p className="text-sm text-gray-700 mb-2">
                Mã OTP đã gửi tới <strong>{email}</strong>:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  inputMode="numeric"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-center tracking-widest font-bold focus:outline-none focus:border-primary"
                  maxLength={6}
                />
                <button
                  onClick={onConfirm}
                  disabled={pending || otp.length !== 6}
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-5 rounded-lg disabled:opacity-60"
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
                className="text-sm text-gray-500 hover:text-primary mt-3"
              >
                ← Đổi email khác
              </button>
            </div>
          )}

          {msg && (
            <div
              className={`mt-3 text-sm rounded-lg px-3 py-2 ${msg.type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}
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
