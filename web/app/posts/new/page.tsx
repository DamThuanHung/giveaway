"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { createPost } from "@/lib/auth";
import { CATEGORIES, TOP_PROVINCES } from "@/lib/api";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function formatPriceInput(s: string): string {
  const digits = s.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  // Thêm . mỗi 3 chữ số
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export default function NewPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

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
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login/?next=/posts/new/");
  }, [user, authLoading, router]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
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
    setImages((prev) => [...prev, ...accepted]);
    setPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    if (rejectedReason) setErr(rejectedReason);
    if (fileRef.current) fileRef.current.value = "";
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(previews[idx]);
    setImages((prev) => prev.filter((_, i) => i !== idx));
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
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
      (e) => {
        setErr("Không lấy được vị trí — kiểm tra quyền truy cập trình duyệt");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (title.trim().length < 5) {
      setErr("Tiêu đề tối thiểu 5 ký tự");
      return;
    }
    if (description.trim().length < 10) {
      setErr("Mô tả tối thiểu 10 ký tự");
      return;
    }
    if (!province.trim()) {
      setErr("Chọn tỉnh/thành");
      return;
    }
    if (images.length === 0) {
      setErr("Cần ít nhất 1 ảnh");
      return;
    }

    const price =
      listingType === "give" ? 0 : parseInt(priceText.replace(/\D/g, "") || "0", 10);

    setSubmitting(true);
    const res = await createPost(
      {
        title: title.trim(),
        description: description.trim(),
        price,
        listingType,
        itemCategory: category,
        postType: "item",
        province: province.trim(),
        district: district.trim(),
        ward: ward.trim(),
        addressDetail: addressDetail.trim(),
        latitude: latitude ?? 0,
        longitude: longitude ?? 0,
      },
      images
    );
    setSubmitting(false);

    if (!res.ok) {
      setErr(res.message || "Đăng bài thất bại");
      return;
    }
    router.push(`/posts/${res.post.id}/`);
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
        <div className="max-w-4xl mx-auto px-4 py-7">
          <h1 className="text-2xl md:text-3xl font-extrabold text-navy">
            Đăng bài mới
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Miễn phí · Không giới hạn · Tin của bạn sẽ hiển thị trong vài giây
          </p>
        </div>
      </section>

      <form onSubmit={onSubmit} className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Listing type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-navy mb-3">Hình thức</h2>
          <div className="flex gap-3">
            <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition ${listingType === "sell" ? "border-primary bg-primary-light" : "border-gray-200 hover:border-gray-300"}`}>
              <input
                type="radio"
                name="listingType"
                value="sell"
                checked={listingType === "sell"}
                onChange={() => setListingType("sell")}
                className="sr-only"
              />
              <div className="text-2xl mb-1">💰</div>
              <div className="font-semibold text-navy">Đang bán</div>
              <div className="text-xs text-gray-500">Có giá tiền</div>
            </label>
            <label className={`flex-1 cursor-pointer border-2 rounded-xl p-4 text-center transition ${listingType === "give" ? "border-primary bg-primary-light" : "border-gray-200 hover:border-gray-300"}`}>
              <input
                type="radio"
                name="listingType"
                value="give"
                checked={listingType === "give"}
                onChange={() => setListingType("give")}
                className="sr-only"
              />
              <div className="text-2xl mb-1">🎁</div>
              <div className="font-semibold text-navy">Cho tặng</div>
              <div className="text-xs text-gray-500">Miễn phí</div>
            </label>
          </div>
        </div>

        {/* Title + Description */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              placeholder="VD: Tủ lạnh Toshiba 200L cũ còn dùng tốt"
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
              placeholder="Mô tả tình trạng, kích thước, lý do bán/tặng, tình trạng còn dùng tốt..."
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
                  placeholder="2.000.000"
                  className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-bold text-navy mb-1">
            Ảnh sản phẩm <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            1-{MAX_IMAGES} ảnh, mỗi ảnh tối đa 5MB. Ảnh đầu tiên sẽ là ảnh đại diện.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {previews.map((url, i) => (
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
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  aria-label="Xóa ảnh"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
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
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={onFilesPicked}
            className="hidden"
          />
        </div>

        {/* Location */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-navy">Địa chỉ</h2>
            <button
              type="button"
              onClick={getMyLocation}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg font-medium"
            >
              📍 Lấy vị trí hiện tại
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
              placeholder="VD: Hà Nội"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
            />
            <datalist id="provinces">
              {TOP_PROVINCES.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">
                Quận/Huyện
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="VD: Cầu Giấy"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-1.5">
                Phường/Xã
              </label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="VD: Dịch Vọng"
                className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy mb-1.5">
              Số nhà / Đường
            </label>
            <input
              type="text"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="VD: 123 Đường Cầu Giấy"
              className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-primary"
            />
          </div>

          {latitude != null && longitude != null && (
            <div className="text-xs bg-primary-light text-primary-dark rounded-lg px-3 py-2">
              ✓ Đã ghi nhận vị trí: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
              ⚠ {err}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl text-lg disabled:opacity-60 transition"
          >
            {submitting ? "Đang đăng..." : "Đăng tin ngay"}
          </button>
          <p className="text-xs text-gray-500 text-center mt-3">
            Bằng việc đăng tin, bạn cam kết tuân thủ <a href="/terms.html" className="text-primary hover:underline">Điều khoản</a>.
            Bài đăng sẽ tự động hiển thị, có thể chỉnh sửa qua app.
          </p>
        </div>
      </form>

      <Footer />
    </>
  );
}
