"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { authFetch, updatePost, uploadPostImageFile } from "@/lib/auth";
import { CATEGORIES, TOP_PROVINCES } from "@/lib/api";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function formatPriceInput(s: string): string {
  const digits = s.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function EditPostInner() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get("id") || "";

  const [loadingPost, setLoadingPost] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState<"sell" | "give">("sell");
  const [priceText, setPriceText] = useState("");
  const [category, setCategory] = useState("other");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  // Hai mảng: ảnh đã có trên server (URL string) + ảnh mới chọn (File).
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auth gate
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login/?next=/posts/edit/?id=${postId}`);
      return;
    }
    if (!postId) {
      router.replace("/me/");
    }
  }, [user, authLoading, postId, router]);

  // Load post
  useEffect(() => {
    if (!user || !postId) return;
    let cancelled = false;
    (async () => {
      const res = await authFetch(`/post/${postId}`);
      if (cancelled) return;
      if (res.status === 404) {
        setNotFound(true);
        setLoadingPost(false);
        return;
      }
      if (!res.ok) {
        setErr(`Lỗi tải bài: HTTP ${res.status}`);
        setLoadingPost(false);
        return;
      }
      const p = await res.json();
      if (p.author?.id !== user.id) {
        setForbidden(true);
        setLoadingPost(false);
        return;
      }
      setTitle(p.title || "");
      setDescription(p.description || "");
      setListingType(p.listingType === "give" ? "give" : "sell");
      setPriceText(p.price ? formatPriceInput(String(p.price)) : "");
      setCategory(p.itemCategory || "other");
      setProvince(p.province || "");
      setDistrict(p.district || "");
      setWard(p.ward || "");
      setAddressDetail(p.addressDetail || "");
      setLatitude(p.latitude || null);
      setLongitude(p.longitude || null);
      setExistingImages((p.images || []).filter(Boolean));
      setLoadingPost(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, postId]);

  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const totalNow = existingImages.length + newFiles.length;
    const remaining = MAX_IMAGES - totalNow;
    const accepted: File[] = [];
    let rejectedReason: string | null = null;
    for (const f of files.slice(0, remaining)) {
      if (!/^image\//.test(f.type)) {
        rejectedReason = "Chỉ chấp nhận ảnh";
        continue;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        rejectedReason = "Ảnh tối đa 5MB/file";
        continue;
      }
      accepted.push(f);
    }
    setNewFiles((prev) => [...prev, ...accepted]);
    setNewPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    if (rejectedReason) setErr(rejectedReason);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeExistingImage(idx: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx));
  }

  function removeNewImage(idx: number) {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  function getMyLocation() {
    if (!navigator.geolocation) {
      setErr("Trình duyệt không hỗ trợ định vị");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setErr(null);
      },
      () => setErr("Không lấy được vị trí — kiểm tra quyền truy cập"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (title.trim().length < 5) return setErr("Tiêu đề tối thiểu 5 ký tự");
    if (description.trim().length < 10) return setErr("Mô tả tối thiểu 10 ký tự");
    if (!province.trim()) return setErr("Chọn tỉnh/thành");
    if (existingImages.length + newFiles.length === 0) return setErr("Cần ít nhất 1 ảnh");

    setSubmitting(true);

    // Upload từng file mới → URL. Nếu có lỗi giữa chừng → báo + dừng (đã upload thì coi như mất).
    const newUrls: string[] = [];
    for (const f of newFiles) {
      const url = await uploadPostImageFile(f);
      if (!url) {
        setErr("Upload ảnh thất bại — thử lại");
        setSubmitting(false);
        return;
      }
      newUrls.push(url);
    }

    const finalImages = [...existingImages, ...newUrls];
    const price = listingType === "give" ? 0 : parseInt(priceText.replace(/\D/g, "") || "0", 10);

    const res = await updatePost(postId, {
      title: title.trim(),
      description: description.trim(),
      price,
      listingType,
      itemCategory: category,
      province: province.trim(),
      district: district.trim(),
      ward: ward.trim(),
      addressDetail: addressDetail.trim(),
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      images: finalImages,
    });
    setSubmitting(false);

    if (!res.ok) {
      setErr(res.message || "Cập nhật thất bại");
      return;
    }
    router.push(`/posts/${postId}/`);
  }

  if (authLoading || !user || loadingPost) {
    return (
      <>
        <Header />
        <div className="text-center py-20 text-gray-500">Đang tải...</div>
        <Footer />
      </>
    );
  }

  if (notFound) {
    return (
      <>
        <Header />
        <div className="max-w-xl mx-auto py-20 text-center">
          <div className="text-5xl mb-3">😕</div>
          <p className="font-semibold text-navy mb-2">Bài đăng không tồn tại</p>
          <Link href="/me/" className="text-primary hover:underline">Về trang của tôi</Link>
        </div>
        <Footer />
      </>
    );
  }

  if (forbidden) {
    return (
      <>
        <Header />
        <div className="max-w-xl mx-auto py-20 text-center">
          <div className="text-5xl mb-3">🚫</div>
          <p className="font-semibold text-navy mb-2">Bạn không có quyền sửa bài này</p>
          <Link href={`/posts/${postId}/`} className="text-primary hover:underline">Xem bài</Link>
        </div>
        <Footer />
      </>
    );
  }

  const totalImages = existingImages.length + newFiles.length;

  return (
    <>
      <Header />

      <section className="bg-gradient-to-br from-primary-light to-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-7">
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">Sửa bài đăng</h1>
          <p className="text-gray-600 text-sm mt-1">
            Thay đổi sẽ áp dụng ngay sau khi lưu
          </p>
        </div>
      </section>

      <form onSubmit={onSubmit} className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-navy mb-3">Hình thức</h2>
          <div className="flex gap-3">
            <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition ${listingType === "sell" ? "border-primary bg-primary-light" : "border-gray-200 hover:border-gray-300"}`}>
              <input type="radio" name="listingType" value="sell" checked={listingType === "sell"} onChange={() => setListingType("sell")} className="sr-only" />
              <div className="text-2xl mb-1">💰</div>
              <div className="font-semibold text-navy">Đang bán</div>
              <div className="text-xs text-gray-500">Có giá tiền</div>
            </label>
            <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition ${listingType === "give" ? "border-primary bg-primary-light" : "border-gray-200 hover:border-gray-300"}`}>
              <input type="radio" name="listingType" value="give" checked={listingType === "give"} onChange={() => setListingType("give")} className="sr-only" />
              <div className="text-2xl mb-1">🎁</div>
              <div className="font-semibold text-navy">Cho tặng</div>
              <div className="text-xs text-gray-500">Miễn phí</div>
            </label>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1">{title.length}/100 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-gray-400 mt-1">{description.length}/2000 ký tự</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
              >
                {Object.entries(CATEGORIES).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>

            {listingType === "sell" && (
              <div>
                <label className="block text-sm font-semibold text-navy mb-1.5">
                  Giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceText}
                  onChange={(e) => setPriceText(formatPriceInput(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-navy mb-1">
            Ảnh sản phẩm <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            {totalImages}/{MAX_IMAGES} ảnh. Ảnh đầu tiên là ảnh đại diện.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {existingImages.map((url, i) => (
              <div key={url} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    ẢNH BÌA
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={url} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ảnh mới ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                  MỚI
                </span>
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
            {totalImages < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-300 hover:border-primary text-gray-400 hover:text-primary rounded-lg flex flex-col items-center justify-center transition"
              >
                <span className="text-2xl">📷</span>
                <span className="text-xs font-medium mt-1">Thêm ảnh</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFilesPicked} className="hidden" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-navy">Địa chỉ</h2>
            <button
              type="button"
              onClick={getMyLocation}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium"
            >
              📍 Cập nhật vị trí
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="provinces"
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
            />
            <datalist id="provinces">
              {TOP_PROVINCES.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Quận/Huyện</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">Phường/Xã</label>
              <input type="text" value={ward} onChange={(e) => setWard(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">Số nhà / Đường</label>
            <input type="text" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary" />
          </div>

          {latitude != null && longitude != null && (
            <div className="text-xs bg-primary-light text-primary-dark rounded-lg px-3 py-2">
              ✓ Vị trí: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              ⚠ {err}
            </div>
          )}
          <div className="flex gap-3">
            <Link
              href={`/posts/${postId}/`}
              className="flex-1 text-center bg-gray-100 hover:bg-gray-200 text-navy font-semibold py-4 rounded-xl"
            >
              Hủy
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl text-lg disabled:opacity-60 transition"
            >
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>

      <Footer />
    </>
  );
}

export default function EditPostPage() {
  return (
    <Suspense fallback={<><Header /><div className="text-center py-20 text-gray-500">Đang tải...</div><Footer /></>}>
      <EditPostInner />
    </Suspense>
  );
}
