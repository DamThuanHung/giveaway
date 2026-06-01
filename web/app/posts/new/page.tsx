"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { createPost } from "@/lib/auth";
import { CATEGORIES, TOP_PROVINCES } from "@/lib/api";

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

export default function NewPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

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

  // Special category fields
  const [subType, setSubType] = useState("rent");        // realestate: rent|sell · jobs: full-time...
  const [priceUnit, setPriceUnit] = useState("month");   // month|day|total|sqm|hour
  const [areaText, setAreaText] = useState("");          // realestate diện tích m²
  const [bedrooms, setBedrooms] = useState(1);           // realestate phòng ngủ
  const [serviceArea, setServiceArea] = useState("");    // service: phạm vi · jobs: tên công ty

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // Per-field error map cho inline validation (UI_UX_STANDARDS §7.3)
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  // Validators inline — return string error nếu invalid, null nếu OK
  const validators = {
    title: (v: string) => v.trim().length < 5 ? 'Tiêu đề tối thiểu 5 ký tự' : null,
    description: (v: string) => v.trim().length < 10 ? 'Mô tả tối thiểu 10 ký tự (nên 50+ để dễ giao dịch)' : null,
    province: (v: string) => !v.trim() ? 'Chọn tỉnh/thành để người mua tìm thấy' : null,
    price: (v: string) => {
      if (listingType === 'give') return null;
      const n = parseInt(v.replace(/\D/g, ''), 10);
      if (!v || isNaN(n)) return 'Nhập giá (VNĐ)';
      if (n < 1000) return 'Giá tối thiểu 1.000đ';
      if (n > 999_000_000_000) return 'Giá quá lớn';
      return null;
    },
  };

  function validateField(name: keyof typeof validators, value: string) {
    const e = validators[name](value);
    setFieldErr((prev) => {
      const next = { ...prev };
      if (e) next[name] = e;
      else delete next[name];
      return next;
    });
  }

  const isRealestate = category === "realestate";
  const isService = category === "service";
  const isJob = category === "jobs";
  const isSpecial = isRealestate || isService || isJob;
  const postType = postTypeOf(category);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login/?next=/posts/new/");
  }, [user, authLoading, router]);

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onCategoryChange(newCat: string) {
    setCategory(newCat);
    // Reset listingType về 'sell' nếu category không phù hợp 'give'
    if (newCat === "realestate" || newCat === "jobs" || newCat === "service") {
      setListingType("sell");
    }
    // Clear orphan data + set priceUnit default theo category
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
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setLatitude(lat);
        setLongitude(lng);
        setErr(null);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=vi`,
            { headers: { 'User-Agent': 'TraoTay/1.0' } }
          );
          const data = await res.json();
          const addr = data.address || {};

          const street = addr.road || addr.pedestrian || addr.footway || '';
          const wardName = addr.suburb || addr.quarter || addr.neighbourhood || '';
          const districtName = addr.city_district || addr.district || '';
          const rawProvince = addr.city || addr.state || '';
          const cleanProvince = rawProvince
            .replace(/^Tỉnh\s+/i, '')
            .replace(/^Thành phố\s+/i, '')
            .replace(/^TP\.\s+/i, '');

          if (cleanProvince) setProvince(cleanProvince);
          if (districtName) setDistrict(districtName);
          if (wardName) setWard(wardName);
          if (street) setAddressDetail(street);
        } catch {
          // Tọa độ đã lưu, điền địa chỉ thất bại — user tự nhập
        }
      },
      () => {
        setErr("Không lấy được vị trí — kiểm tra quyền truy cập trình duyệt");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    // Run all validators trước submit để show inline + scroll lên field đầu tiên
    const allErrors: Record<string, string> = {};
    const titleErr = validators.title(title);
    if (titleErr) allErrors.title = titleErr;
    const descErr = validators.description(description);
    if (descErr) allErrors.description = descErr;
    const provErr = validators.province(province);
    if (provErr) allErrors.province = provErr;
    if (!isSpecial && listingType !== 'give') {
      const priceE = validators.price(priceText);
      if (priceE) allErrors.price = priceE;
    }
    if (Object.keys(allErrors).length > 0) {
      setFieldErr(allErrors);
      setErr("Vui lòng sửa các lỗi đỏ phía trên");
      // Scroll lên field đầu tiên có error
      const first = ['title', 'description', 'price', 'province'].find((k) => allErrors[k]);
      if (first && typeof window !== 'undefined') {
        const el = document.querySelector(`[aria-describedby="${first}-err"]`) as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el?.focus();
      }
      return;
    }
    if (images.length === 0) {
      setErr("Cần ít nhất 1 ảnh");
      return;
    }

    const priceRaw = priceText.replace(/\D/g, "");
    const price = listingType === "give" ? 0 : (priceRaw ? parseInt(priceRaw, 10) : 0);

    // Build payload — mirror logic mobile create_post_tab.dart:190-210
    const fields: Record<string, string | number | null | undefined> = {
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
    };

    if (isRealestate) {
      fields.subType = subType;
      fields.priceUnit = priceUnit;
      fields.bedrooms = bedrooms;
      if (areaText.trim()) fields.area = areaText.trim();
    } else if (isService) {
      fields.priceUnit = priceUnit;
      if (serviceArea.trim()) fields.serviceArea = serviceArea.trim();
    } else if (isJob) {
      fields.subType = subType;
      fields.priceUnit = priceUnit;
      // Mobile dùng cùng field `serviceArea` cho 2 mục đích khác nhau:
      // - service: Phạm vi phục vụ (vd "Quận 1, Quận 3")
      // - jobs: Tên công ty / Nhà tuyển dụng
      // Backend chấp nhận field chung tên `serviceArea`.
      if (serviceArea.trim()) fields.serviceArea = serviceArea.trim();
    }

    setSubmitting(true);
    const res = await createPost(fields, images);
    setSubmitting(false);

    if (!res.ok) {
      setErr(res.message || "Đăng bài thất bại");
      return;
    }
    router.push(`/me/posts/?new=${res.post.id}`);
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

  const inputCls = "w-full bg-cream-100 border border-ink-200 rounded-md px-3.5 py-2.5 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-200 transition duration-150 ease-warm";
  const labelCls = "block text-sm font-semibold text-ink-800 mb-1.5";

  return (
    <>
      <Header />

      <section className="bg-gradient-warm border-b border-ink-200/50">
        <div className="max-w-4xl mx-auto px-4 py-7 md:py-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-ink-900 tracking-tight">
            Đăng bài mới
          </h1>
          <p className="text-ink-600 text-sm mt-1">
            Miễn phí · Không giới hạn · Tin của bạn sẽ hiển thị trong vài giây
          </p>
        </div>
      </section>

      <form onSubmit={onSubmit} className="max-w-4xl mx-auto px-4 py-8 space-y-5">
        {/* ─── Danh mục — đặt LÊN ĐẦU vì các trường khác phụ thuộc ─── */}
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
              {isRealestate && "🏠 Đăng tin Bất động sản — cần thêm diện tích, số phòng và đơn vị giá."}
              {isService && "🛠️ Đăng tin Dịch vụ — cần phạm vi phục vụ và đơn vị giá."}
              {isJob && "💼 Đăng tin Tuyển dụng — cần hình thức làm việc, tên công ty và mức lương."}
            </p>
          )}
        </div>

        {/* ─── Hình thức (chỉ hiện khi item thường) ─── */}
        {!isSpecial && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
            <h2 className="font-bold text-ink-900 mb-3 tracking-tight">Hình thức</h2>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`cursor-pointer border-2 rounded-md p-4 text-center transition duration-150 ease-warm ${
                  listingType === "sell"
                    ? "border-primary bg-primary-100 shadow-soft"
                    : "border-ink-200 hover:border-ink-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="sell"
                  checked={listingType === "sell"}
                  onChange={() => setListingType("sell")}
                  className="sr-only"
                />
                <div className="text-3xl mb-1.5">💰</div>
                <div className="font-semibold text-ink-900">Đang bán</div>
                <div className="text-xs text-ink-500">Có giá tiền</div>
              </label>
              <label
                className={`cursor-pointer border-2 rounded-md p-4 text-center transition duration-150 ease-warm ${
                  listingType === "give"
                    ? "border-primary bg-primary-100 shadow-soft"
                    : "border-ink-200 hover:border-ink-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="listingType"
                  value="give"
                  checked={listingType === "give"}
                  onChange={() => setListingType("give")}
                  className="sr-only"
                />
                <div className="text-3xl mb-1.5">🎁</div>
                <div className="font-semibold text-ink-900">Cho tặng</div>
                <div className="text-xs text-ink-500">Miễn phí</div>
              </label>
            </div>
          </div>
        )}

        {/* ─── Tiêu đề + Mô tả ─── */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
          <div>
            <label className={labelCls}>
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value.slice(0, 100));
                if (fieldErr.title) validateField('title', e.target.value);
              }}
              onBlur={(e) => validateField('title', e.target.value)}
              aria-invalid={!!fieldErr.title}
              aria-describedby={fieldErr.title ? 'title-err' : undefined}
              placeholder={
                isRealestate ? "VD: Cho thuê căn hộ 2PN Cầu Giấy 8.5tr/tháng"
                : isService ? "VD: Sửa chữa điều hòa tại nhà — Quận 1"
                : isJob ? "VD: Tuyển nhân viên kế toán — Hà Nội"
                : "VD: Tủ lạnh Toshiba 200L cũ còn dùng tốt"
              }
              className={`${inputCls} ${fieldErr.title ? '!border-red-500 !ring-red-200' : ''}`}
            />
            {fieldErr.title ? (
              <p id="title-err" role="alert" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span aria-hidden="true">⚠️</span> {fieldErr.title}
              </p>
            ) : (
              <p className="text-xs text-ink-400 mt-1">{title.length}/100 ký tự</p>
            )}
          </div>

          <div>
            <label className={labelCls}>
              Mô tả chi tiết <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value.slice(0, 2000));
                if (fieldErr.description) validateField('description', e.target.value);
              }}
              onBlur={(e) => validateField('description', e.target.value)}
              aria-invalid={!!fieldErr.description}
              aria-describedby={fieldErr.description ? 'desc-err' : undefined}
              rows={6}
              placeholder={
                isRealestate ? "Mô tả nội thất, hướng, tiện ích xung quanh, điều kiện thuê..."
                : isService ? "Mô tả dịch vụ, kinh nghiệm, thời gian phục vụ..."
                : isJob ? "Mô tả công việc, yêu cầu, quyền lợi, thời gian làm việc..."
                : "Mô tả tình trạng, kích thước, lý do bán/tặng, tình trạng còn dùng tốt..."
              }
              className={`${inputCls} ${fieldErr.description ? '!border-red-500 !ring-red-200' : ''}`}
            />
            {fieldErr.description ? (
              <p id="desc-err" role="alert" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span aria-hidden="true">⚠️</span> {fieldErr.description}
              </p>
            ) : (
              <p className="text-xs text-ink-400 mt-1">{description.length}/2000 ký tự</p>
            )}
          </div>

          {/* Giá item thường — chỉ hiện khi item & sell */}
          {!isSpecial && listingType !== "give" && (
            <div>
              <label className={labelCls}>Giá (VNĐ)</label>
              <input
                type="text"
                inputMode="numeric"
                value={priceText}
                onChange={(e) => setPriceText(formatPriceInput(e.target.value))}
                placeholder="2.000.000 — Để trống nếu thương lượng"
                className={inputCls}
              />
            </div>
          )}
        </div>

        {/* ─── Trường chuyên biệt cho realestate ─── */}
        {isRealestate && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
            <h2 className="font-bold text-ink-900 tracking-tight">Thông tin bất động sản</h2>

            <div>
              <label className={labelCls}>Loại tin <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                <ChipBtn
                  selected={subType === "rent"}
                  onClick={() => { setSubType("rent"); setPriceUnit("month"); }}
                  label="Cho thuê"
                />
                <ChipBtn
                  selected={subType === "sell"}
                  onClick={() => { setSubType("sell"); setPriceUnit("total"); }}
                  label="Bán"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Giá (VNĐ)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceText}
                  onChange={(e) => setPriceText(formatPriceInput(e.target.value))}
                  placeholder="Để trống = thương lượng"
                  className={inputCls}
                />
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
                <input
                  type="text"
                  inputMode="decimal"
                  value={areaText}
                  onChange={(e) => setAreaText(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="VD: 45"
                  className={inputCls}
                />
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

        {/* ─── Trường chuyên biệt cho service ─── */}
        {isService && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
            <h2 className="font-bold text-ink-900 tracking-tight">Thông tin dịch vụ</h2>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Giá (VNĐ)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceText}
                  onChange={(e) => setPriceText(formatPriceInput(e.target.value))}
                  placeholder="Để trống = thương lượng"
                  className={inputCls}
                />
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
              <input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value.slice(0, 100))}
                placeholder="VD: Quận 1, Quận 3, TP.HCM"
                className={inputCls}
              />
            </div>
          </div>
        )}

        {/* ─── Trường chuyên biệt cho jobs ─── */}
        {isJob && (
          <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
            <h2 className="font-bold text-ink-900 tracking-tight">Thông tin tuyển dụng</h2>

            <div>
              <label className={labelCls}>Hình thức làm việc <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {JOB_SUBTYPES.map((opt) => (
                  <ChipBtn
                    key={opt.value}
                    selected={subType === opt.value}
                    onClick={() => setSubType(opt.value)}
                    label={opt.label}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className={labelCls}>Tên công ty / Nhà tuyển dụng</label>
              <input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value.slice(0, 100))}
                placeholder="VD: Công ty TNHH ABC"
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={labelCls}>Mức lương (VNĐ)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={priceText}
                  onChange={(e) => setPriceText(formatPriceInput(e.target.value))}
                  placeholder="Để trống = thỏa thuận"
                  className={inputCls}
                />
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

        {/* ─── Ảnh ─── */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          <h2 className="font-bold text-ink-900 mb-1 tracking-tight">
            Ảnh sản phẩm <span className="text-red-500">*</span>
          </h2>
          <p className="text-xs text-ink-500 mb-3">
            1-{MAX_IMAGES} ảnh, mỗi ảnh tối đa 5MB. Ảnh đầu tiên sẽ là ảnh đại diện.
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {previews.map((url, i) => (
              <div key={url} className="relative aspect-square bg-cream-100 rounded-md overflow-hidden group border border-ink-200/70">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-soft">
                    ẢNH BÌA
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm transition-colors duration-150"
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
                className="aspect-square border-2 border-dashed border-ink-300 hover:border-primary text-ink-400 hover:text-primary rounded-md flex flex-col items-center justify-center transition duration-150 ease-warm bg-cream-100/50 hover:bg-primary-100/30"
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

        {/* ─── Địa chỉ ─── */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-ink-900 tracking-tight">Địa chỉ</h2>
            <button
              type="button"
              onClick={getMyLocation}
              className="text-sm bg-ink-100 hover:bg-ink-200 px-3 py-1.5 rounded-md font-medium transition duration-150 ease-warm"
            >
              📍 Lấy vị trí hiện tại
            </button>
          </div>

          <div>
            <label className={labelCls}>
              Tỉnh/Thành phố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              list="provinces"
              value={province}
              onChange={(e) => {
                setProvince(e.target.value);
                if (fieldErr.province) validateField('province', e.target.value);
              }}
              onBlur={(e) => validateField('province', e.target.value)}
              aria-invalid={!!fieldErr.province}
              aria-describedby={fieldErr.province ? 'province-err' : undefined}
              placeholder="VD: Hà Nội"
              className={`${inputCls} ${fieldErr.province ? '!border-red-500 !ring-red-200' : ''}`}
            />
            <datalist id="provinces">
              {TOP_PROVINCES.map((p) => <option key={p} value={p} />)}
            </datalist>
            {fieldErr.province && (
              <p id="province-err" role="alert" className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <span aria-hidden="true">⚠️</span> {fieldErr.province}
              </p>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Quận/Huyện</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="VD: Cầu Giấy"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Phường/Xã</label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="VD: Dịch Vọng"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Số nhà / Đường</label>
            <input
              type="text"
              value={addressDetail}
              onChange={(e) => setAddressDetail(e.target.value)}
              placeholder="VD: 123 Đường Cầu Giấy"
              className={inputCls}
            />
          </div>

          {latitude != null && longitude != null && (
            <div className="text-xs bg-primary-100 text-primary-800 rounded-md px-3 py-2 border border-primary-200">
              ✓ Đã ghi nhận vị trí: {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </div>
          )}
        </div>

        {/* ─── Submit ─── */}
        <div className="bg-white border border-ink-200/70 rounded-md shadow-soft p-5">
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 mb-4 text-sm">
              ⚠ {err}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark active:scale-[0.97] text-white font-bold py-4 rounded-md text-lg shadow-card hover:shadow-elevated disabled:opacity-60 transition duration-250 ease-warm"
          >
            {submitting ? "Đang đăng..." : "Đăng tin ngay"}
          </button>
          <p className="text-xs text-ink-500 text-center mt-3 leading-relaxed">
            Bằng việc đăng tin, bạn cam kết tuân thủ{" "}
            <a href="/terms.html" className="text-primary-600 hover:text-primary-700 hover:underline">
              Điều khoản
            </a>
            . Bài đăng sẽ tự động hiển thị, có thể chỉnh sửa qua app.
          </p>
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
