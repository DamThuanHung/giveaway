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
      // Cooldown 60s before resend
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
      router.push(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 my-12 shadow-sm">
      <div className="text-center mb-6">
        <img
          src="/assets/icon_512.png"
          alt="Trao Tay"
          className="w-16 h-16 mx-auto rounded-2xl mb-4"
        />
        <h1 className="text-2xl font-extrabold text-navy">
          {step === "email" ? "Đăng nhập" : "Xác minh mã OTP"}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {step === "email"
            ? "Nhập email để nhận mã OTP, không cần mật khẩu"
            : `Mã 6 số đã gửi tới ${email}`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={onSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@example.com"
              autoFocus
              required
              className="w-full border border-gray-300 rounded-lg px-3.5 py-3 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi mã OTP"}
          </button>
          <p className="text-xs text-gray-500 text-center pt-2">
            Bằng việc đăng nhập, bạn đồng ý với{" "}
            <Link href="/terms.html" className="text-primary hover:underline">
              Điều khoản
            </Link>
            {" và "}
            <Link href="/privacy.html" className="text-primary hover:underline">
              Chính sách quyền riêng tư
            </Link>
            .
          </p>
        </form>
      ) : (
        <form onSubmit={onVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
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
              className="w-full border border-gray-300 rounded-lg px-3.5 py-3 text-center text-2xl tracking-[0.5em] font-bold focus:outline-none focus:border-primary"
            />
          </div>
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
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
              className="text-gray-500 hover:text-gray-700"
            >
              ← Đổi email
            </button>
            <button
              type="button"
              onClick={onSendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-primary hover:underline disabled:text-gray-400 disabled:no-underline"
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
      <Suspense fallback={<div className="text-center py-20 text-gray-500">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  );
}
