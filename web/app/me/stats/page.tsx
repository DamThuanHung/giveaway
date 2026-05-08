"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { fetchMyStats } from "@/lib/auth";

type Stats = {
  totalPosts?: number;
  availablePosts?: number;
  donePosts?: number;
  totalViews?: number;
  totalFavorites?: number;
  avgRating?: number | null;
  totalReviews?: number;
  totalCompletedDeals?: number;
  responseTimeMinutes?: number | null;
};

export default function MyStatsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/login/?next=/me/stats/");
      return;
    }
    fetchMyStats().then((data) => {
      if (data) setStats(data);
      else setErr(true);
    });
  }, [user, authLoading, router]);

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
        <div className="max-w-4xl mx-auto px-4 py-7 md:py-8">
          <Link href="/me/" className="text-sm text-ink-500 hover:text-primary-600 mb-2 inline-block transition-colors duration-150">
            ← Quay lại Hồ sơ
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">📊 Thống kê người bán</h1>
          <p className="text-ink-600 text-sm mt-1">
            Tổng quan hoạt động bán hàng + đánh giá của bạn
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-6">
        {err ? (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-5 text-sm">
            ⚠ Không tải được dữ liệu thống kê — thử lại sau
          </div>
        ) : !stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-ink-200/70 rounded-md p-5 h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <StatCard icon="📦" label="Tổng bài đăng" value={stats.totalPosts ?? 0} />
              <StatCard icon="✅" label="Đã hoàn tất" value={stats.totalCompletedDeals ?? stats.donePosts ?? 0} accent="text-primary-600" />
              <StatCard icon="👀" label="Tổng lượt xem" value={stats.totalViews ?? 0} accent="text-blue-600" />
              <StatCard icon="❤️" label="Lượt yêu thích" value={stats.totalFavorites ?? 0} accent="text-rose-500" />
              <StatCard
                icon="⭐"
                label="Đánh giá TB"
                value={stats.avgRating != null ? `${stats.avgRating.toFixed(1)}/5` : "—"}
                accent="text-amber-600"
              />
              <StatCard icon="💬" label="Số lượt đánh giá" value={stats.totalReviews ?? 0} />
            </div>

            <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 mb-6">
              <h3 className="font-bold text-ink-900 mb-3">Phân bổ trạng thái bài đăng</h3>
              <div className="space-y-3">
                <BarRow
                  label="Đang hiển thị"
                  value={stats.availablePosts ?? 0}
                  total={Math.max(stats.totalPosts ?? 1, 1)}
                  color="bg-primary-500"
                />
                <BarRow
                  label="Đã hoàn tất"
                  value={stats.donePosts ?? 0}
                  total={Math.max(stats.totalPosts ?? 1, 1)}
                  color="bg-blue-500"
                />
              </div>
            </div>

            {stats.responseTimeMinutes != null && (
              <div className="bg-primary-100 border border-primary-200 rounded-md p-5">
                <h3 className="font-bold text-primary-800 mb-1">⚡ Thời gian phản hồi</h3>
                <p className="text-sm text-primary-900">
                  Bạn trả lời tin nhắn trung bình sau <strong>{stats.responseTimeMinutes}</strong> phút.
                  {stats.responseTimeMinutes < 30 && " Rất nhanh — người mua sẽ thích!"}
                </p>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = "text-ink-900",
}: {
  icon: string;
  label: string;
  value: number | string;
  accent?: string;
}) {
  return (
    <div className="bg-white border border-ink-200/70 hover:border-primary/40 hover:shadow-soft rounded-md p-5 transition duration-250 ease-warm">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-2xl font-extrabold ${accent}`}>{value}</div>
      <div className="text-xs text-ink-500 mt-1">{label}</div>
    </div>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-ink-700">{label}</span>
        <span className="font-bold text-ink-900">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-400 ease-warm`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
