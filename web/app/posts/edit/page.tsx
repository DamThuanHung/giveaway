"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { authFetch, updatePost, uploadPostImageFile } from "@/lib/auth";
import { CATEGORIES, TOP_PROVINCES } from "@/lib/api";
import { compressImages } from "@/lib/imageCompress";

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

function formatPriceInput(s: string): string {
  const digits = s.replace(/\D/g, "").slice(0, 12);
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function postTypeOf(category: string): "item" | "realestate" | "service" | "job" {
  if (category === "realestate") return "realestate";
  if (category === "service") return "service";
  if (category === "jobs") return "job";
  return "item";
}

const JOB_SUBTYPES: { value: string; label: string }[] = [
  { value: "full-time", label: "Toàn thời gian" },
  { value: "part-time", label: "Bán thời gian" },
  { value: "freelance", label: "Freelance" },
  { value: "intern", label: "Thực tập" },
  { value: "remote", label: "Remote" },
];

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
  const [category, setCategory] = useState("electronics");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const [subType, setSubType] = useState("rent");
  const [priceUnit, setPriceUnit] = useState("month");
  const [areaText, setAreaText] = useState("");
  const [bedrooms, setBedrooms] = useState(1);
  const [serviceArea, setServiceArea] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isRealestate = category === "realestate";
  const isService = category === "service";
  const isJob = category === "jobs";
  const isSpecial = isRealestate || isService || isJob;
  const postType = postTypeOf(category);

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
      const cat = p.itemCategory || "electronics";
      setCategory(cat);
      setProvince(p.province || "");
      setDistrict(p.district || "");
      setWard(p.ward || "");
      setAddressDetail(p.addressDetail || "");
      setLatitude(p.latitude || null);
      setLongitude(p.longitude || null);
      setExistingImages((p.images || []).filter(Boolean));

      // Load fields chuyên biệt nếu có
      setSubType(p.subType || (cat === "jobs" ? "full-time" : "rent"));
      setPriceUnit(p.priceUnit || (cat === "jobs" || cat === "service" ? "hour" : "month"));
      setAreaText(p.area != null ? String(p.area) : "");
      setBedrooms(p.bedrooms != null ? p.bedrooms : 1);
      setServiceArea(p.serviceArea || "");
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

  function onCategoryChange(newCat: string) {
    setCategory(newCat);
    if (newCat === "realestate" || newCat === "jobs" || newCat === "service") {
      setListingType("sell");
    }
    setAreaText("");
    setServiceArea("");
    setBedrooms(1);
    if (newCat === "realestate") {
      setSubType("rent");
      setPriceUnit("month");
    } else if (newCat === "jobs") {
      setSubType("full-time");
      setPriceUnit("month");
    } else if (newCat === "service") {
      setPriceUnit("hour");
    }
  }

  async function onFilesPicked(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (fileRef.current) fileRef.current.value = "";
    if (files.length === 0) return;
    const totalNow = existingImages.length + newFiles.length;
    const remaining = MAX_IMAGES - totalNow;
    const candidates: File[] = [];
    let rejectedReason: string | null = null;
    for (const f of files.slice(0, remaining)) {
      if (!/^image\//.test(f.type)) {
        rejectedReason = "Chỉ chấp nhận ảnh";
        continue;
      }
      candidates.push(f);
    }

    setCompressing(true);
    const { compressed, errors } = await compressImages(candidates);
    setCompressing(false);

    const accepted = compressed.filter((f) => f.size <= MAX_IMAGE_SIZE);
    if (compressed.length > accepted.length) rejectedReason = "Ảnh sau khi nén vẫn vượt 5MB";
    if (errors.length > 0) rejectedReason = errors[0];

    setNewFiles((prev) => [...prev, ...accepted]);
    setNewPreviews((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))]);
    if (rejectedReason) setErr(rejectedReason);
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
    const priceRaw = priceText.replace(/\D/g, "");
    const price = listingType === "give" ? 0 : (priceRaw ? parseInt(priceRaw, 10) : 0);

    const body: Record<string, any> = {
      title: title.trim(),
      description: description.trim(),
      price,
      listingType: isSpecial ? "sell" : listingType,
      itemCategory: category,
      postType,
      province: province.trim(),
      district: district.trim(),
      ward: ward.trim(),
      addressDetail: addressDetail.trim(),
      latitude: latitude ?? 0,
      longitude: longitude ?? 0,
      images: finalImages,
    };

    if (isRealestate) {
      body.subType = subType;
      body.priceUnit = priceUnit;
      body.bedrooms = bedrooms;
      body.area = areaText.trim() ? Number(areaText.trim()) : null;
    } else if (isService) {
      body.priceUnit = priceUnit;
      body.serviceArea = serviceArea.trim() || null;
    } else if (isJob) {
      body.subType = subType;
      body.priceUnit = priceUnit;
      body.serviceArea = serviceArea.trim() || null;
    }

    const res = await updatePost(postId, body);
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
        <div className="text-center py-20 text-ink-500">Đang tải...</div>
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
          <p className="font-semibold text-ink-900 mb-2">Bài đăng không tồn tại</p>
          <Link href="/me/" className="text-primary-600 hover:text-primary-700 hover:underline">Về trang của tôi</Link>
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
          <p className="font-semibold text-ink-900 mb-2">Bạn không có quyền sửa bài này</p>
          <Link href={`/posts/${postId}/`} className="text-primary-600 hover:text-primary-700 hover:underline">Xem bài</Link>
        </div>
        <Footer />
      </>
    );
  }

  const totalImages = existingImages.length + newFiles.length;
  const inputCls = "w-full bg-cream-100 border border-ink-200 rounded-md px-3.5 py-2.5 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-150 ease-warm";
  const labelCls = "block text-sm font-semibold text-ink-800 mb-1.5";

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-4xl mx-auto px-4 py-7 md:py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">Sửa bài đăng</h1>
          <p className="text-ink-600 text-sm mt-1">Thay đổi sẽ áp dụng ngay sau khi lưu</p>
        </div>
      </section>

      <form onSubmit={onSubmit} className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          <label className={labelCls}>
            Danh mục <span className="text-red-500">*</span>
          </label>
          <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={inputCls}>
            {Object.entries(CATEGORIES).map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
          {isSpecial && (
            <p className="text-xs text-primary-700 mt-2 bg-primary-100 border border-primary-200 rounded-md px-3 py-2 leading-relaxed">
              {isRealestate && "🏠 Tin Bất động sản — cần diện tích, số phòng và đơn vị giá."}
              {isService && "🛠️ Tin Dịch vụ — cần phạm vi phục vụ và đơn vị giá."}
              {isJob && "💼 Tin Tuyển dụng — cần hình thức làm việc, tên công ty và mức lương."}
            </p>
          )}
        </div>

        {!isSpecial && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
            <h2 className="font-bold text-ink-900 mb-3 tracking-tight">Hình thức</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className={`cursor-pointer border-2 rounded-md p-4 text-center transition duration-150 ease-warm ${listingType === "sell" ? "border-primary bg-primary-100 shadow-soft" : "border-ink-200 hover:border-ink-300 bg-white"}`}>
                <input type="radio" name="listingType" value="sell" checked={listingType === "sell"} onChange={() => setListingType("sell")} className="sr-only" />
                <div className="text-3xl mb-1.5">💰</div>
                <div className="font-semibold text-ink-900">Đang bán</div>
                <div className="text-xs text-ink-500">Có giá tiền</div>
              </label>
              <label className={`cursor-pointer border-2 rounded-md p-4 text-center transition duration-150 ease-warm ${listingType === "give" ? "border-primary bg-primary-100 shadow-soft" : "border-ink-200 hover:border-ink-300 bg-white"}`}>
                <input type="radio" name="listingType" value="give" checked={listingType === "give"} onChange={() => setListingType("give")} className="sr-only" />
                <div className="text-3xl mb-1.5">🎁</div>
                <div className="font-semibold text-ink-900">Cho tặng</div>
                <div className="text-xs text-ink-500">Miễn phí</div>
              </label>
            </div>
          </div>
        )}

        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
          <div>
            <label className={labelCls}>Tiêu đề <span className="text-red-500">*</span></label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} className={inputCls} />
            <p className="text-xs text-ink-400 mt-1">{title.length}/100 ký tự</p>
          </div>

          <div>
            <label className={labelCls}>Mô tả chi tiết <span className="text-red-500">*</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 2000))} rows={6} className={inputCls} />
            <p className="text-xs text-ink-400 mt-1">{description.length}/2000 ký tự</p>
          </div>

          {!isSpecial && listingType !== "give" && (
            <div>
              <label className={labelCls}>Giá (VNĐ)</label>
              <input
                type="text"
                inputMode="numeric"
                value={priceText}
                onChange={(e) => setPriceText(formatPriceInput(e.target.value))}
                placeholder="Để trống nếu thương lượng"
                className={inputCls}
              />
            </div>
          )}
        </div>

        {isRealestate && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
            <h2 className="font-bold text-ink-900 tracking-tight">Thông tin bất động sản</h2>

            <div>
              <label className={labelCls}>Loại tin <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <ChipBtn selected={subType === "rent"} onClick={() => { setSubType("rent"); setPriceUnit("month"); }} label="Cho thuê" />
                <ChipBtn selected={subType === "sell"} onClick={() => { setSubType("sell"); setPriceUnit("total"); }} label="Bán" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Giá (VNĐ)</label>
                <input type="text" inputMode="numeric" value={priceText} onChange={(e) => setPriceText(formatPriceInput(e.target.value))} placeholder="Để trống = thương lượng" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className={inputCls}>
                  {subType === "rent" ? (
                    <>
                      <option value="month">/tháng</option>
                      <option value="day">/ngày</option>
                    </>
                  ) : (
                    <>
                      <option value="total">Tổng</option>
                      <option value="sqm">/m²</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Diện tích (m²)</label>
                <input type="text" inputMode="decimal" value={areaText} onChange={(e) => setAreaText(e.target.value.replace(/[^\d.]/g, ""))} placeholder="VD: 45" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Phòng ngủ</label>
                <select value={bedrooms} onChange={(e) => setBedrooms(parseInt(e.target.value, 10))} className={inputCls}>
                  <option value={0}>Studio</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} phòng</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {isService && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
            <h2 className="font-bold text-ink-900 tracking-tight">Thông tin dịch vụ</h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Giá (VNĐ)</label>
                <input type="text" inputMode="numeric" value={priceText} onChange={(e) => setPriceText(formatPriceInput(e.target.value))} placeholder="Để trống = thương lượng" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className={inputCls}>
                  <option value="hour">/giờ</option>
                  <option value="day">/ngày</option>
                  <option value="total">Trọn gói</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Phạm vi phục vụ</label>
              <input type="text" value={serviceArea} onChange={(e) => setServiceArea(e.target.value.slice(0, 100))} placeholder="VD: Quận 1, Quận 3, TP.HCM" className={inputCls} />
            </div>
          </div>
        )}

        {isJob && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
            <h2 className="font-bold text-ink-900 tracking-tight">Thông tin tuyển dụng</h2>

            <div>
              <label className={labelCls}>Hình thức làm việc <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {JOB_SUBTYPES.map((opt) => (
                  <ChipBtn key={opt.value} selected={subType === opt.value} onClick={() => setSubType(opt.value)} label={opt.label} />
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Tên công ty / Nhà tuyển dụng</label>
              <input type="text" value={serviceArea} onChange={(e) => setServiceArea(e.target.value.slice(0, 100))} placeholder="VD: Công ty TNHH ABC" className={inputCls} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Mức lương (VNĐ)</label>
                <input type="text" inputMode="numeric" value={priceText} onChange={(e) => setPriceText(formatPriceInput(e.target.value))} placeholder="Để trống = thỏa thuận" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Đơn vị</label>
                <select value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} className={inputCls}>
                  <option value="month">/tháng</option>
                  <option value="hour">/giờ</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          <h2 className="font-bold text-ink-900 mb-1 tracking-tight">
            Ảnh sản phẩm <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-ink-500 mb-3">{totalImages}/{MAX_IMAGES} ảnh. Ảnh đầu tiên là ảnh đại diện.</p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {existingImages.map((url, i) => (
              <div key={url} className="relative aspect-square bg-cream-100 rounded-md overflow-hidden group border border-ink-200/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-soft">
                    ẢNH BÌA
                  </span>
                )}
                <button type="button" onClick={() => removeExistingImage(i)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors duration-150" aria-label="Xóa ảnh">×</button>
              </div>
            ))}
            {newPreviews.map((url, i) => (
              <div key={url} className="relative aspect-square bg-cream-100 rounded-md overflow-hidden group border border-ink-200/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ảnh mới ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-soft">
                  MỚI
                </span>
                <button type="button" onClick={() => removeNewImage(i)} className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors duration-150" aria-label="Xóa ảnh">×</button>
              </div>
            ))}
            {totalImages < MAX_IMAGES && (
              <button type="button" onClick={() => fileRef.current?.click()} disabled={compressing} className="aspect-square border-2 border-dashed border-ink-300 hover:border-primary text-ink-400 hover:text-primary rounded-md flex flex-col items-center justify-center transition duration-150 ease-warm bg-cream-100/50 hover:bg-primary-100/30 disabled:opacity-60">
                {compressing ? (
                  <>
                    <span className="text-2xl animate-pulse">⏳</span>
                    <span className="text-xs font-medium mt-1">Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📷</span>
                    <span className="text-xs font-medium mt-1">Thêm ảnh</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFilesPicked} className="hidden" />
        </div>

        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-ink-900 tracking-tight">Địa chỉ</h2>
            <button type="button" onClick={getMyLocation} className="text-sm bg-ink-100 hover:bg-ink-200 px-3 py-1.5 rounded-md font-medium transition duration-150 ease-warm">
              📍 Cập nhật vị trí
            </button>
          </div>

          <div>
            <label className={labelCls}>Tỉnh/Thành phố <span className="text-red-500">*</span></label>
            <input type="text" list="provinces" value={province} onChange={(e) => setProvince(e.target.value)} className={inputCls} />
            <datalist id="provinces">
              {TOP_PROVINCES.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quận/Huyện</label>
              <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phường/Xã</label>
              <input type="text" value={ward} onChange={(e) => setWard(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Số nhà / Đường</label>
            <input type="text" value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} className={inputCls} />
          </div>

          {latitude != null && longitude != null && (
            <div className="text-xs bg-primary-100 text-primary-800 rounded-md px-3 py-2 border border-primary-200">
              ✓ Vị trí: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </div>
          )}
        </div>

        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 mb-4 text-sm">
              ⚠ {err}
            </div>
          )}
          <div className="flex gap-3">
            <Link href={`/posts/${postId}/`} className="flex-1 text-center bg-ink-100 hover:bg-ink-200 text-ink-800 font-semibold py-4 rounded-md transition duration-150 ease-warm">
              Hủy
            </Link>
            <button type="submit" disabled={submitting} className="flex-1 bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-4 rounded-md text-lg shadow-card hover:shadow-elevated disabled:opacity-60 transition duration-250 ease-warm">
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </form>

      <Footer />
    </>
  );
}

function ChipBtn({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition duration-150 ease-warm ${
        selected
          ? "bg-primary text-white border-2 border-primary shadow-soft"
          : "bg-white text-ink-700 border-2 border-ink-200 hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </button>
  );
}

export default function EditPostPage() {
  return (
    <Suspense fallback={<><Header /><div className="text-center py-20 text-ink-500">Đang tải...</div><Footer /></>}>
      <EditPostInner />
    </Suspense>
  );
}
