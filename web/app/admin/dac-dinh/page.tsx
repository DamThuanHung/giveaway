"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { authFetch } from "@/lib/auth";

type LeaderboardRow = {
  userId: string;
  name: string;
  avatar: string | null;
  completedCount: number;
};

type OnlineStats = {
  onlineCount: number;
  totalAttempts: number;
  totalUsers: number;
};

const ONLINE_POLL_MS = 30_000;

export default function AdminDacDinhPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState<OnlineStats | null>(null);
  const [period, setPeriod] = useState<"day" | "week">("day");
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = !!user && user.role === "admin";

  const loadOnline = useCallback(async () => {
    try {
      const res = await authFetch("/admin/dac-dinh/online?minutes=10");
      if (!res.ok) return;
      const data = await res.json();
      setStats({
        onlineCount: data.onlineCount ?? 0,
        totalAttempts: data.totalAttempts ?? 0,
        totalUsers: data.totalUsers ?? 0,
      });
    } catch {
      // giữ giá trị cũ nếu lỗi mạng tạm thời
    }
  }, []);

  const loadLeaderboard = useCallback(async (p: "day" | "week") => {
    setLoadingData(true);
    setError(null);
    try {
      const res = await authFetch(`/admin/dac-dinh/leaderboard?period=${p}&limit=20`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard ?? []);
    } catch {
      setError("Không tải được bảng xếp hạng. Thử lại sau.");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    loadOnline();
    const interval = setInterval(loadOnline, ONLINE_POLL_MS);
    return () => clearInterval(interval);
  }, [authLoading, isAdmin, loadOnline]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) return;
    loadLeaderboard(period);
  }, [authLoading, isAdmin, period, loadLeaderboard]);

  if (authLoading) {
    return (
      <>
        <Header />
        <section className="max-w-3xl mx-auto px-4 py-16 text-center text-ink-500">Đang tải...</section>
        <Footer />
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <Header />
        <section className="max-w-3xl mx-auto px-4 py-16 text-center">
          <p className="text-lg font-bold text-ink-900 mb-2">🔒 Không có quyền truy cập</p>
          <p className="text-ink-500 text-sm mb-6">Trang này chỉ dành cho quản trị viên.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary hover:bg-primary-dark text-white font-semibold px-5 py-2.5 rounded-md shadow-soft transition duration-150 ease-warm"
          >
            Về trang chủ
          </button>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-3xl mx-auto px-4 py-7 md:py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">
            📊 Thống kê Luyện thi Đặc định
          </h1>
          <p className="text-ink-600 text-sm mt-1">Theo dõi hoạt động và xếp hạng người dùng /dac-dinh</p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-6">
        {/* Online + số liệu nền */}
        <div className="grid sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-ink-200/70 rounded-md shadow-card p-5 flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary-100 flex items-center justify-center text-xl shrink-0">
              🟢
            </div>
            <div>
              <p className="text-2xl font-extrabold text-ink-900">
                {stats === null ? "..." : stats.onlineCount}
              </p>
              <p className="text-xs text-ink-500">Đang online (10 phút gần nhất)</p>
            </div>
          </div>
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
            <p className="text-2xl font-extrabold text-ink-900">
              {stats === null ? "..." : stats.totalAttempts}
            </p>
            <p className="text-xs text-ink-500">Tổng lượt làm bài (toàn thời gian)</p>
          </div>
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
            <p className="text-2xl font-extrabold text-ink-900">
              {stats === null ? "..." : stats.totalUsers}
            </p>
            <p className="text-xs text-ink-500">Tổng người từng thử (toàn thời gian)</p>
          </div>
        </div>
        <p className="text-xs text-ink-400 -mt-3 mb-6">
          "Đang online" tự cập nhật mỗi 30 giây — tính theo người có mặt tại trang trong 10 phút gần nhất (không chỉ lúc vừa hoàn thành bài).
        </p>

        {/* Leaderboard */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink-900">🏆 Bảng xếp hạng</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriod("day")}
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full border transition duration-150 ease-warm ${
                period === "day"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-ink-700 border-ink-200 hover:border-primary"
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setPeriod("week")}
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-full border transition duration-150 ease-warm ${
                period === "week"
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-ink-700 border-ink-200 hover:border-primary"
              }`}
            >
              Tuần này
            </button>
          </div>
        </div>

        <p className="text-xs text-ink-400 mb-4">
          Xếp hạng theo số dạng bài (mọi chương, cả 6 dạng) đạt 100% trong khung thời gian đã chọn.
        </p>

        {loadingData && <p className="text-center text-ink-500 py-8">Đang tải...</p>}
        {error && <p className="text-center text-red-600 py-8">{error}</p>}

        {!loadingData && !error && leaderboard.length === 0 && (
          <p className="text-center text-ink-400 py-8">Chưa có ai hoàn thành dạng bài nào trong khung thời gian này.</p>
        )}

        {!loadingData && !error && leaderboard.length > 0 && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft divide-y divide-ink-200/50">
            {leaderboard.map((row, i) => (
              <div key={row.userId} className="flex items-center gap-3 p-4">
                <div
                  className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center font-bold text-sm ${
                    i === 0
                      ? "bg-amber-100 text-amber-700"
                      : i === 1
                      ? "bg-ink-100 text-ink-600"
                      : i === 2
                      ? "bg-orange-100 text-orange-700"
                      : "bg-cream-100 text-ink-500"
                  }`}
                >
                  {i + 1}
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.avatar || "/assets/icon_512.png"}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover border border-ink-200/70"
                />
                <p className="flex-1 min-w-0 font-semibold text-ink-900 text-sm truncate">{row.name}</p>
                <p className="text-sm font-bold text-primary-dark shrink-0">{row.completedCount} dạng bài</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}
