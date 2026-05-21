"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { loginSendOtp, loginVerifyOtp } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const { setAuth } = useAuth();

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  async function onSendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setErr(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErr("Email không hợp lệ");
      return;
    }
    setLoading(true);
    try {
      const res = await loginSendOtp(email.trim());
      if (!res.ok) {
        setErr(res.message);
        return;
      }
      setStep("otp");
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((c) => {
          if (c <= 1) {
            clearInterval(timer);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^\d{6}$/.test(otp.trim())) {
      setErr("Mã OTP gồm 6 chữ số");
      return;
    }
    setLoading(true);
    try {
      const res = await loginVerifyOtp(email.trim(), otp.trim());
      if (!res.ok || !res.token || !res.user) {
        setErr(res.message);
        return;
      }
      setAuth(res.token, res.user);
      // W-01 (2026-05-20): user mới signup → vào onboarding collect profile
      // trước khi redirect đến trang đích. Tăng activation rate (user mới đa số
      // bỏ luôn vì không hiểu cách dùng + chưa có profile rõ).
      if (res.isNewUser) {
        const onboardingUrl = `/onboarding/?next=${encodeURIComponent(next)}`;
        router.push(onboardingUrl);
      } else {
        router.push(next);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-ink-200/70 rounded-md shadow-card p-8 my-12 animate-slide-in-up">
      <div className="text-center mb-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/icon_512.png"
          alt="Trao Tay"
          className="w-16 h-16 mx-auto rounded-md mb-4 shadow-card"
        />
        <h1 className="text-2xl font-extrabold text-ink-900 tracking-tight">
          {step === "email" ? "Đăng nhập" : "Xác minh mã OTP"}
        </h1>
        <p className="text-ink-500 text-sm mt-1.5">
          {step === "email" ? (
            "Nhập email để nhận mã OTP, không cần mật khẩu"
          ) : (
            <>
              Mã 6 số đã gửi tới <strong className="text-ink-800">{email}</strong>
              <br />
              <span className="text-xs">Hiệu lực 5 phút · Kiểm tra cả Spam</span>
            </>
          )}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={onSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-800 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@example.com"
              autoFocus
              required
              className="w-full bg-cream-100 border border-ink-200 rounded-md px-3.5 py-3 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-150 ease-warm"
            />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
          <p className="text-xs text-ink-500 text-center pt-2 leading-relaxed">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <Link href="/terms.html" className="text-primary-600 hover:text-primary-700 hover:underline">
              Điều khoản
            </Link>
            {" và "}
            <Link href="/privacy.html" className="text-primary-600 hover:text-primary-700 hover:underline">
              Chính sách quyền riêng tư
            </Link>
            .
          </p>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-800 mb-1.5">
              Mã OTP
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="● ● ● ● ● ●"
              autoFocus
              required
              className="w-full bg-cream-100 border border-ink-200 rounded-md px-3.5 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-150 ease-warm"
            />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-3 rounded-md shadow-soft hover:shadow-card transition duration-150 ease-warm disabled:opacity-50"
          >
            {loading ? "Đang xác minh..." : "Xác nhận"}
          </button>
          <div className="flex justify-between text-sm pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setOtp("");
                setErr(null);
              }}
              className="text-ink-500 hover:text-ink-800 transition-colors duration-150"
            >
              ← Đổi email
            </button>
            <button
              type="button"
              onClick={onSendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-primary-600 hover:text-primary-700 hover:underline disabled:text-ink-400 disabled:no-underline disabled:cursor-not-allowed transition-colors duration-150"
            >
              {resendCooldown > 0
                ? `Gửi lại sau ${resendCooldown}s`
                : "Gửi lại mã"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <div className="bg-gradient-warm min-h-[calc(100vh-200px)] py-4">
        <Suspense fallback={<div className="text-center py-20 text-ink-500">Đang tải...</div>}>
          <LoginForm />
        </Suspense>
      </div>
      <Footer />
    </>
  );
}
