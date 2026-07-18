// Nguồn nội dung: tài liệu học tập chính thức "外食業特定技能２号 技能測定試験 学習テキスト"
// do 一般社団法人 日本フードサービス協会 (OTAFF) biên soạn, 令和５年１２月２７日.
// Cấu trúc Phần/Chương bám sát đúng mục lục (目次) gốc của 4 tài liệu, không tự đặt lại thứ tự.

export type Part = {
  id: string;
  emoji: string;
  titleVi: string;
  titleJa: string;
};

export type Chapter = {
  id: string;
  partId: string;
  order: number;
  titleVi: string;
  titleJa: string;
};

export type ExerciseType = "quiz" | "vocab" | "translation" | "reorder" | "judgment" | "planning";

export type QuizQuestion = {
  id: string;
  chapterId: string;
  questionJa: string;
  questionVi: string;
  options: { ja: string; vi: string }[];
  correctIndex: number;
  explanationVi: string;
  /** Trích dẫn nguyên văn tiếng Nhật từ tài liệu OTAFF làm căn cứ cho đáp án đúng. */
  sourceQuoteJa: string;
  /** Số trang nội bộ (in ở cuối trang) trong tài liệu OTAFF gốc chứa trích dẫn trên. */
  sourcePage: number;
};

/**
 * 判断試験 (phán đoán tình huống) + câu tính toán — mô phỏng phần 実技試験 của đề thi thật.
 * TÌNH HUỐNG (scenario) do AI tự soạn, KHÔNG trích dẫn nguyên văn — nhưng đáp án đúng + giải thích
 * bắt buộc bám đúng 1 quy tắc/số liệu đã có `sourceQuoteJa`/`sourcePage` xác minh trong OTAFF gốc
 * (tái dùng citation đã verify ở QUESTIONS/TRANSLATIONS/REORDERS cùng chương, không tạo quy tắc mới).
 * kind="judgment": chọn hành động/xử lý đúng theo tình huống.
 * kind="calculation": tính toán số liệu dựa trên công thức/tỷ lệ đã có trong tài liệu gốc.
 */
export type ScenarioQuestion = {
  id: string;
  chapterId: string;
  kind: "judgment" | "calculation";
  scenarioJa: string;
  scenarioVi: string;
  questionJa: string;
  questionVi: string;
  options: { ja: string; vi: string }[];
  correctIndex: number;
  explanationVi: string;
  sourceQuoteJa: string;
  sourcePage: number;
};

/**
 * 計画立案試験 (lập kế hoạch/quy trình) — mô phỏng phần 実技試験 của đề thi thật.
 * TÌNH HUỐNG do AI tự soạn; các BƯỚC (steps) phải là quy trình thật bám đúng `sourceQuoteJa`/`sourcePage`
 * đã xác minh trong OTAFF gốc, chỉ đổi thứ tự hiển thị (xáo trộn) chứ không tự bịa bước mới.
 * Khác với ReorderQuestion (ghép từng cụm từ thành 1 câu, chỉ hiện nghĩa sau khi ghép xong):
 * ở đây mỗi "step" là 1 bước quy trình độc lập, hiển thị SONG SONG ja+vi ngay từ đầu — vì bài kiểm tra
 * logic thứ tự quy trình, không phải kiểm tra ngữ pháp câu.
 */
export type PlanningQuestion = {
  id: string;
  chapterId: string;
  scenarioJa: string;
  scenarioVi: string;
  /** Các bước theo đúng thứ tự thật (sẽ bị xáo trộn khi hiển thị cho người học). */
  steps: { ja: string; vi: string }[];
  sourceQuoteJa: string;
  sourcePage: number;
};

/** Tên tài liệu gốc OTAFF tương ứng với mỗi Phần, dùng để hiển thị cùng trích dẫn. */
export const SOURCE_DOC_BY_PART: Record<string, string> = {
  "store-management": "外食業特定技能２号技能測定試験学習テキスト【店舗運営】",
  hygiene: "外食業特定技能２号技能測定試験学習テキスト【衛生管理】",
  cooking: "外食業特定技能２号技能測定試験学習テキスト【飲食物調理】",
  "customer-service": "外食業特定技能２号技能測定試験学習テキスト【接客全般】",
};

export const PARTS: Part[] = [
  {
    id: "store-management",
    emoji: "🏪",
    titleVi: "Quản lý cửa hàng",
    titleJa: "店舗運営",
  },
  {
    id: "hygiene",
    emoji: "🧼",
    titleVi: "Vệ sinh an toàn thực phẩm",
    titleJa: "衛生管理",
  },
  {
    id: "cooking",
    emoji: "🍳",
    titleVi: "Chế biến món ăn",
    titleJa: "飲食物調理",
  },
  {
    id: "customer-service",
    emoji: "🙇",
    titleVi: "Tiếp khách",
    titleJa: "接客全般",
  },
];

export const CHAPTERS: Chapter[] = [
  // Phần 1: 店舗運営 — Quản lý cửa hàng (8 chương)
  { id: "sm-ch1", partId: "store-management", order: 1, titleJa: "総論　外食産業の店舗運営", titleVi: "Tổng quan vận hành cửa hàng ngành ẩm thực" },
  { id: "sm-ch2", partId: "store-management", order: 2, titleJa: "店舗運営に必要な計数管理", titleVi: "Quản lý số liệu cần thiết để vận hành cửa hàng" },
  { id: "sm-ch3", partId: "store-management", order: 3, titleJa: "発注管理と検収（検品と収納）管理", titleVi: "Quản lý đặt hàng và kiểm hàng/nhập kho" },
  { id: "sm-ch4", partId: "store-management", order: 4, titleJa: "販売管理", titleVi: "Quản lý bán hàng" },
  { id: "sm-ch5", partId: "store-management", order: 5, titleJa: "顧客管理", titleVi: "Quản lý khách hàng" },
  { id: "sm-ch6", partId: "store-management", order: 6, titleJa: "雇用管理", titleVi: "Quản lý lao động, tuyển dụng" },
  { id: "sm-ch7", partId: "store-management", order: 7, titleJa: "人材の育成指導", titleVi: "Đào tạo, phát triển nhân sự" },
  { id: "sm-ch8", partId: "store-management", order: 8, titleJa: "防火・防災管理", titleVi: "Quản lý phòng cháy chữa cháy" },

  // Phần 2: 衛生管理 — Vệ sinh an toàn thực phẩm (5 chương)
  { id: "hy-ch1", partId: "hygiene", order: 1, titleJa: "食品衛生の現状", titleVi: "Hiện trạng vệ sinh thực phẩm" },
  { id: "hy-ch2", partId: "hygiene", order: 2, titleJa: "食品衛生管理の基本（食中毒予防の3原則と5S活動）", titleVi: "Cơ bản quản lý vệ sinh (3 nguyên tắc phòng ngộ độc + hoạt động 5S)" },
  { id: "hy-ch3", partId: "hygiene", order: 3, titleJa: "HACCPに沿った衛生管理", titleVi: "Quản lý vệ sinh theo HACCP" },
  { id: "hy-ch4", partId: "hygiene", order: 4, titleJa: "一般的な衛生管理の基準14項目の詳細", titleVi: "Chi tiết 14 tiêu chuẩn vệ sinh chung" },
  { id: "hy-ch5", partId: "hygiene", order: 5, titleJa: "食品調理・提供工程における適切な衛生管理のポイント", titleVi: "Điểm cần lưu ý về vệ sinh trong chế biến, phục vụ" },

  // Phần 3: 飲食物調理 — Chế biến món ăn (7 chương)
  { id: "ck-ch1", partId: "cooking", order: 1, titleJa: "食材（原材料）に関する注意点", titleVi: "Lưu ý về nguyên liệu thực phẩm" },
  { id: "ck-ch2", partId: "cooking", order: 2, titleJa: "下処理に関する注意点", titleVi: "Lưu ý về sơ chế" },
  { id: "ck-ch3", partId: "cooking", order: 3, titleJa: "各調理方法に関する注意点", titleVi: "Lưu ý về từng phương pháp nấu" },
  { id: "ck-ch4", partId: "cooking", order: 4, titleJa: "調理機器、器具・備品などに関する注意点", titleVi: "Lưu ý về thiết bị, dụng cụ bếp" },
  { id: "ck-ch5", partId: "cooking", order: 5, titleJa: "労働安全衛生に関する注意点", titleVi: "Lưu ý về an toàn lao động" },
  { id: "ck-ch6", partId: "cooking", order: 6, titleJa: "食品の流通", titleVi: "Lưu thông thực phẩm" },
  { id: "ck-ch7", partId: "cooking", order: 7, titleJa: "食品添加物", titleVi: "Phụ gia thực phẩm" },

  // Phần 4: 接客全般 — Tiếp khách (5 chương)
  { id: "cs-ch1", partId: "customer-service", order: 1, titleJa: "接客に関する知識", titleVi: "Kiến thức tiếp khách" },
  { id: "cs-ch2", partId: "customer-service", order: 2, titleJa: "食に関する知識", titleVi: "Kiến thức về ẩm thực (dị ứng, rượu, hạn sử dụng...)" },
  { id: "cs-ch3", partId: "customer-service", order: 3, titleJa: "店舗管理に関する知識", titleVi: "Kiến thức quản lý cửa hàng (mở/đóng cửa, thu ngân...)" },
  { id: "cs-ch4", partId: "customer-service", order: 4, titleJa: "クレーム対応に関する知識", titleVi: "Xử lý khiếu nại" },
  { id: "cs-ch5", partId: "customer-service", order: 5, titleJa: "緊急時の対応に関する知識", titleVi: "Xử lý tình huống khẩn cấp" },
];

/**
 * KIỂM KÊ NỘI DUNG — sm-ch1 (総論 外食産業の店舗運営, trang 1-2, gồm cả 参考１ QSC Standard).
 * Quy trình Bước A-B-C: tách NGUYÊN VĂN từng câu (theo dấu 。) VÀ từng mục liệt kê
 * (①②③, ・, ア・イ・ウ tách riêng dù không có dấu chấm) theo đúng thứ tự xuất hiện trong nguồn.
 * Mỗi dòng dưới đây bắt buộc có 1 trong 2: id câu hỏi đã phủ, HOẶC lý do loại bỏ tường minh.
 * Không được để trống — dòng trống = chưa xong, phải quay lại xử lý (Bước C).
 *
 * ── (1) 外食産業の成功のポイント — trang 1 ──
 *  S1  外食産業は立地産業→商圏限定されている                    → tr-sm1-1, ro-sm1-1
 *  S2  1回に使用する金額（客単価）も決して大きくはない            → ro-sm1-6
 *  S3  損益分岐点を超え継続には繰り返し来店してもらう以外に方法なし → sm-11
 *  S4  心のこもったサービス・快適な雰囲気・適正価格で安定提供      → tr-sm1-8
 *  S5  QSC定義（Quality・Service・Cleanliness）                 → sm-1
 *  S6  QSCスタンダード維持・向上→客数増加が可能                  → sm-19
 *  S7  業態に見合った雰囲気（Atmosphere=A）も重要                → tr-sm1-5, ro-sm1-5, vc-sm1-5
 *  S8  今後サービスの質が一層重要になる                          → tr-sm1-6 (gộp chung với S9)
 *  S9  その本質は「働く人の質」                                 → tr-sm1-6
 *  S10 「サービスはお客様の数だけある」                          → ro-sm1-7
 *  S11 マニュアルを超えた気配り・個別対応が求められる             → tr-sm1-10
 *  S12 ホスピタリティ定義（お客様の喜び=自分の喜び）              → sm-2, tr-sm1-3, ro-sm1-3, vc-sm1-4
 *  S13 ホスピタリティは店内チーム仲間にも重要                    → tr-sm1-11
 *  S14 生産性アップのためロボット化が進行（料理運び・バッシング）  → sm-18, ro-sm1-8, vc-sm1-12(ロボット化)
 *  S15 業態問わず人でなければできないホスピタリティが重要になる    → tr-sm1-7
 *  S16 QSCA+Hが必要                                            → sm-2, tr-sm1-2
 *
 * ── (2) 店舗を運営管理する人とマネジメント — trang 1-2 ──
 *  S17 店舗責任者の呼称（店長・副店長・店長代理・時間帯責任者）    → sm-12, vc-sm1-20, vc-sm1-21
 *  S18 時間帯責任者はデイリーワーク中で店長職務を代行する人        → sm-7, tr-sm1-4, ro-sm1-4
 *  [見出し] ①時間帯責任者の職能                                 → LOẠI: tiêu đề mục, không phải nội dung kiểm tra được
 *  ・対象時間帯の店舗オペレーション（QSCスタンダード維持）責任者   → sm-7 (gộp trong đáp án đúng)
 *  ・対象となる時間帯のマネジメント※（従業員の育成とトレーニング含む）→ sm-7 (gộp), tr-sm1-9
 *  ※原価管理に関する発注・検品収納管理                          → sm-13
 *  ※水道光熱費などコスト管理                                    → sm-13, vc-sm1-19
 *  ※顧客管理（カスタマリーリレーションやクレーム対応）           → sm-13, vc-sm1-18
 *  ※人件費に関する時間管理や不足要員の手配                       → sm-13
 *  具体的な職務...詳細は勤務する店舗の店長に確認します            → LOẠI: câu thủ tục hành chính, không có nội dung kiểm tra được
 *  ②時間帯責任者はQSCスタンダードを理解しトレーニング・顧客接点で具現化 → tr-sm1-9
 *  Q＝商品のクオリティのスタンダードを維持                       → sm-21
 *  S＝接客サービスのスタンダードを教育・トレーニングして徹底       → sm-21
 *  C＝クリンリネス（清潔な状態）のベースは清掃・補充点検作業の徹底  → sm-20, vc-sm1-16
 *
 * ── 参考１ QSC Standard（15 mục, 3 danh sách） — trang 2 ──
 *  Q優先順位 1.品質一定化 2.熱冷 3.早く出す 4.同時同卓提供 5.気配り → ro-sm1-9 (toàn bộ thứ tự); sm-14/sm-15 (chi tiết mục 3); vc-sm1-17(同時同卓)
 *  S優先順位 1.定型サービス 2.声 3.笑顔 4.動作 5.気配り           → ro-sm1-10 (toàn bộ thứ tự); sm-16 (mục 1); vc-sm1-13/14/23/24
 *  C優先順位 1.みだしなみ 2.拾掃拭 3.週間清掃 4.メンテ 5.気配り     → ro-sm1-11 (toàn bộ thứ tự); sm-17 (mục 1); vc-sm1-15/25/26
 *  気配り（愛） lặp lại ở cả Q5/S5/C5                            → vc-sm1-22 (1 vocab chung, không lặp 3 lần vì cùng 1 từ)
 *  ©出典：清水均著 商業界『フードサービス攻めのマネジメント』       → LOẠI: ghi chú bản quyền nguồn tham khảo, không phải kiến thức thi
 *
 * KẾT LUẬN soát lần 2 (sau khi bổ sung sm-11..sm-21, tr-sm1-6..11, ro-sm1-6..11, vc-sm1-11..26):
 * Toàn bộ câu/mục trong trang 1-2 đã có id câu hỏi hoặc lý do loại bỏ tường minh. Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — sm-ch2 (店舗運営に必要な計数管理, trang 3-12, gồm cả 参考２ và 参考３).
 * LƯU Ý QUAN TRỌNG: mục lục gốc cho thấy chương này trải dài đến hết trang 12 (chương 3 mới bắt đầu ở
 * trang 13) — lần soạn đầu (sm-3..sm-10, trước khi có quy trình Bước A-B-C) và lượt bổ sung đầu của
 * phiên này (sm-22..sm-36) chỉ phủ trang 3-6, BỎ SÓT hoàn toàn 参考２ (trang 7) và 参考３ (trang 8-12) —
 * đã phát hiện và bổ sung bằng sm-37..sm-52 trong lượt soát này. Nguồn được đối chiếu lại bằng cách trích
 * xuất PDF gốc thật (không dựa trí nhớ) — xem ghi chú kỹ thuật trong lịch sử quyết định bên dưới.
 *
 * ── （１）店舗運営に必要な指数用語の定義 — trang 3-4 ──
 *  S1  店舗責任者の最大のミッションは営業利益を最大化すること         → LOẠI: câu dẫn nhập tổng quát
 *  S2  営業利益＝売上高－運営経費（原価/人件費/販売管理費/水道光熱費/施設費）→ LOẠI: liệt kê hạng mục chi phí, không có định nghĩa/công thức đơn lẻ để trắc nghiệm hoá tốt; đã có ý qua sm-37 (荒利益)
 *  S3  つまり売上高を最大化し運営経費を最小化すること                → LOẠI: câu tổng kết của S1-S2
 *  S4  そのために次のような指数がある（dẫn nhập）                    → LOẠI
 *  S5  店舗責任者がコントロールできる6指数の liệt kê                 → sm-22, ro-sm2-1, tr-sm2-1
 *  S6  【人時】とはマンアワー（tiêu đề nhỏ）                        → LOẠI: tiêu đề mục
 *  S7  マン-アワー định nghĩa từ điển 大辞泉（nguồn ngoài OTAFF）      → LOẠI: trích dẫn từ điển bên ngoài, không phải nội dung cốt lõi; khái niệm 人時 đã ngầm phủ qua vc-sm2-1/4/9
 *  S8  人時売上高の定義（従業員1人1時間の売上高）                    → sm-3 (đã có trước khi có quy trình), vc-sm2-1
 *  S9  １日の売上高÷１日の総労働時間=人時売上高                      → sm-3
 *  S10 売上高大きく総労働時間少なければ人時売上高は大きくなる（diễn giải logic mở rộng）→ LOẠI: hệ quả suy ra trực tiếp từ công thức đã kiểm tra ở sm-3, không phải dữ kiện độc lập mới
 *  S11 客数を総労働時間で割ったものが人時接客数（định nghĩa）         → sm-23
 *  S12 客数÷総労働時間数＝人時接客数                                → sm-23
 *  S13 1人当たり何人対応したかという指数（diễn giải ý nghĩa）        → LOẠI: đã gộp trong explanationVi của sm-23
 *  S14 一般的にファストフード業界は高くファミレスは低い              → sm-24, tr-sm2-2
 *  S15 フルサービスレストランでは客席サービスに労働時間を割かれるため → LOẠI: giải thích nguyên nhân bổ sung của S14, đã gộp trong explanationVi sm-24
 *  S16 店舗責任者はあるべき人時接客数を維持しているかウォッチする責務 → LOẠI: mô tả nhiệm vụ chung chung, không có dữ kiện định lượng cụ thể
 *  S17 （人時売上高と人時接客数の関連は参考２参照）                  → LOẠI: câu tham chiếu chéo nội bộ tài liệu
 *  S18 人時生産性の定義（従業員1人1時間の粗利益/荒利益、ghi chú thuật ngữ）→ sm-25 (định nghĩa), vc-sm2-2
 *  S19 １日の粗利益÷１日の総労働時間=人時生産性                      → sm-25
 *  S20 粗利益同じで総労働時間少なければ人時生産性大きくなる（diễn giải mở rộng）→ LOẠI: hệ quả trực tiếp từ công thức sm-25
 *  S21 そのポイントは人材育成により能力を高めること                  → LOẠI: gợi ý quản lý chung chung, không có dữ kiện cụ thể
 *  S22 粗利益とは売上高から原価を差し引いたもの                      → sm-37 (cùng khái niệm 荒利益=売上高－原価, tài liệu dùng 粗利益/荒利益 thay nhau — đã ghi chú ở S18)
 *  S23 標準原価が設定より多くなれば粗利益は減少し人時生産性は小さくなる（diễn giải nhân quả）→ LOẠI: hệ quả mở rộng, không phải dữ kiện mới
 *  S24 ポイントは調理工程・分量を守り発注管理徹底で食材ロス削減       → LOẠI: gợi ý quản lý chung, trùng tinh thần với sm-5 (ポーション/廃棄ロス/棚卸ミス)
 *  S25 人時生産性は企業側の指数と見られがちだが実際は賃金の源泉       → sm-26, tr-sm2-3, ro-sm2-2
 *  S26 人時生産性×労働分配率＝支払える1時間当たり人件費              → sm-49
 *  S27 労働分配率とは粗利益に占める人件費の割合                      → sm-27, tr-sm2-4, ro-sm2-3
 *  S28 フードサービス業の適正値は35～40％                          → sm-4 (đã có trước)
 *  S29 人件費÷粗利益＝労働分配率（適正値35～40％）                   → LOẠI: cùng công thức với S27/S28 dưới dạng ký hiệu toán, không tạo câu hỏi trùng lặp thứ 3
 *  S30 適正値に幅がある lý do本部/CK管理部門・設備投資→経営効率化    → LOẠI: giải thích bối cảnh mở rộng phức tạp, ý chính đã gộp trong explanationVi sm-28
 *  S31 企業全体で適正値内に収めるには店舗労働分配率を40％以下に       → sm-28, tr-sm2-5, ro-sm2-4
 *
 * ── （原価管理とは） — trang 4-5 ──
 *  S32 原価高を売上高で割り100を掛けたものが原価率                   → sm-29, tr-sm2-6
 *  S33 メニュー決定時の標準原価、分量超過でロス発生・要因は教育不足   → LOẠI: trùng tinh thần với sm-5 (nguyên nhân quản lý giá vốn), không tạo câu hỏi thứ 2
 *  S34 原価率管理のポイント：ア.ポーションを守る イ.廃棄ロスを減らす ウ.棚卸ミスをなくす → sm-5 (đã có trước)
 *  S35 店舗責任者は月1回原価率差異を本部指示受け対策実行             → LOẠI: mô tả quy trình hành chính nội bộ
 *  S36 原価率差異の算出方法は以下のとおり（dẫn nhập trước công thức） → LOẠI
 *  S37 （月間個別メニューの販売数×標準原価）の総和÷月間売上高＝標準原価率 → sm-30 (đã sửa lại đúng nguyên văn KHÔNG có ×100, khác với phiên bản 参考３ ở S-formula4 CÓ ×100 — xem ghi chú lịch sử quyết định)
 *  S38 標準原価率を米国では理論上の原価率（セオロリカル原価率）と呼ぶ → sm-31, tr-sm2-7, ro-sm2-5
 *  S39 （前月末棚卸し額＋当月仕入れ額－当月末棚卸し額）÷月間売上高＝実際原価率 → LOẠI: trùng khái niệm với sm-40 (công thức tương đương ở 参考３ trang 8, có ×100), không tạo câu hỏi thứ 2
 *  S40 標準原価率－実際原価率＝原価率差異                            → LOẠI: cấu trúc tương tự sm-41 (chênh lệch thực tế-tiêu chuẩn), đã đủ đại diện qua sm-41 + sm-6
 *  S41 差異の適正範囲は±0.5%が基準値                               → sm-6 (đã có trước)
 *  S42 範囲を超えたらア/イ/ウのどれが原因か見つけ対策を打つのが職務   → LOẠI: mô tả nhiệm vụ chung, không có dữ kiện định lượng mới
 *
 * ── （２）労働時間をコントロールするためには — trang 5 ──
 *  S43 企業の考え方や業態・客単価で2つの方法（dẫn nhập）             → LOẠI: đã ngầm phủ qua sm-8/sm-32
 *  S44 客単価1,200円以下→人時接客数基準、1,800円超・アルコール比率高→人時売上高基準 → sm-8 (đã có trước, phần đầu), sm-32 (phần sau)
 *  S45 オペレーションとはワークスケジュール作成・QSC維持・日々運営    → LOẠI: định nghĩa mô tả, không phải dữ kiện phân biệt rõ để trắc nghiệm hoá tốt
 *  S46 客単価1,200～1,800円は企業の考え方で使い分け（ghi chú ngoại lệ）→ LOẠI: thông tin phụ nhỏ
 *  S47 月間売上高予算÷客単価÷人時接客数＝月間計画総労働時間数（công式 tổng quát）→ LOẠI: đã có ví dụ số cụ thể ở S48/sm-33
 *  S48 月間売上高予算1,200万円÷客単価800円÷人時接客数5人＝月間計画総労働3,000時間 → sm-33
 *  S49 月間売上高予算÷人時売上高＝月間計画総労働時間数（công式 tổng quát）→ LOẠI: trùng cấu trúc S47, đã có ví dụ cụ thể
 *  S50 月間売上高予算1,200万円÷人時売上高5,000円＝月間計画総労働2,400時間 → sm-34
 *  S51 どちらの場合も月間計画総労働時間を日々の売上予測に基づき振り分ける → LOẠI: mô tả quy trình, không có dữ kiện định lượng
 *
 * ── trang 6 ──
 *  S52 振り分ける際は昼夜来店状況・ピークタイム・曜日性を把握し予測    → LOẠI: mô tả quy trình thực tế
 *  S53 具体的には前年実績・地域催事なども調べ週間単位で作成           → LOẠI: mô tả quy trình
 *  S54 売上実績推移に合わせ週間単位ベースで日々調整                  → LOẠI
 *  S55 結果、人件費率が適正範囲に収まり予算達成できる                → LOẠI: câu tổng kết
 *  S56 その月の人時接客数/人時売上高と表現する理由＝繁忙月/閑散月がある → sm-35, tr-sm2-9, ro-sm2-6
 *  S57 繁忙月は人時接客数・人時売上高を高く設定、閑散月はP/A労働時間を減らす → sm-50
 *  S58 売上＝客数×客単価なので客数を増やすことは売上高を上げること    → sm-51
 *  S59 客数を増やすには固定客リピート率向上と新規顧客獲得の両方        → LOẠI: đã gộp ý trong explanationVi sm-52
 *  S60 固定客リピート率向上にはQSCをブラッシュアップする努力が必要     → sm-52
 *  S61 新規顧客獲得もリピート率向上に伴い口コミ・SNSで増える           → LOẠI: hệ quả bổ sung, không phải dữ kiện độc lập mới
 *  S62 推奨メニューをお勧め（サジェスティブセールス）→注文点数増・一品単価増→客単価上昇 → LOẠI: trùng khái niệm サジェスティブセールス đã kiểm tra ở sm-32/sm-48/vc-sm2-10
 *  S63 商品説明正確→サービス質向上、お客様自らオーダーで抵抗感なく客単価上昇 → LOẠI: giải thích tâm lý bổ sung
 *  S64 客単価＝注文点数×一品平均単価                                → sm-36, tr-sm2-8
 *  S65 上記（２）～（４）は店舗責任者の意思で実施可能                → LOẠI: câu tổng kết
 *  S66 お客様に応じてお勧めを変え感想を聞きフォローすればサービス向上  → LOẠI: gợi ý thực hành mở rộng
 *
 * ── 参考２ 人件費管理指数の計算例 — trang 7 (chỉ có tiêu đề, nội dung thực tế ở trang 8) ──
 *  （参考２）人件費管理指数の計算例（tiêu đề)                        → LOẠI: tiêu đề mục, nội dung ở trang 8
 *
 * ── 参考３ 計数管理公式問題例 — trang 8 (7 công thức + 2 bảng ví dụ) ──
 *  F1  売上高－原価＝荒利益                                        → sm-37
 *  F2  原価率＋荒利益率＝100％                                      → sm-38
 *  F3  個別標準原価÷そのメニューの価格×100＝個別標準原価率           → sm-39
 *  F4  標準原価率＝（各メニュー個別販売数×各メニュー個別標準原価）の総和÷当月売上高×100 → LOẠI: cùng khái niệm với sm-30 (bản thân bài, không ×100), đây là bản 参考３ (có ×100) — đã đại diện đủ qua sm-30 + sm-40, không tạo câu hỏi thứ 3 trùng cấu trúc
 *  F5  当月実際原価率＝（前月末棚卸し額＋当月仕入額－当月末棚卸し額）÷当月売上高×100 → sm-40
 *  F6  当月実際原価－当月標準原価＝当月ロス額（プラスはロス、マイナスは逆ざや） → sm-41
 *  F7  当月実際原価率－当月標準原価率＝当月ロス率（基準値±0.5%以内）  → LOẠI: trùng khái niệm với sm-6 (基準値±0.5%) đã kiểm tra ở phần thân bài
 *  Bảng A ハンバーグ（売価600円、原価合計190円、標準原価率31.7%、荒利益410円、荒利益率68.3%） → sm-42
 *  Bảng B 目玉焼きハンバーグ（cùng dạng bài với Bảng A）             → LOẠI: cùng dạng tính toán với Bảng A (sm-42), không tạo câu hỏi trùng lặp
 *
 * ── 参考３ tiếp — trang 9 (biểu đồ 30/70/40% + 3 câu hỏi mẫu có đáp án) ──
 *  Biểu đồ 原価30%＋荒利益70%＝100%、荒利益の中で人件費40%           → LOẠI: minh họa trực quan cho F1/F2, không có dữ kiện mới ngoài 2 câu hỏi mẫu bên dưới
 *  Q1  売上高12,000千円のとき原価/荒利益/人件費はいくらか（答 3,600/8,400/3,360千円） → sm-45
 *  Q2  実働時間2,500時間のとき1時間当たり売上高/荒利益/人件費と呼び名（答 4,800円=人時売上高、3,360円=人時生産性、1,344円=人件費） → LOẠI: tên gọi 人時売上高/人時生産性 đã kiểm tra ở sm-3/sm-25; con số 1,344円 (人件費/giờ) không đủ ý nghĩa độc lập để tách câu hỏi riêng
 *  Q3  荒利益に占める人件費40%の比率名と適正範囲（答 労働分配率、35～40%） → LOẠI: trùng hoàn toàn với sm-4/sm-27/sm-28 đã kiểm tra
 *
 * ── 参考３ tiếp — trang 10-11 (マグロ寿司専門店の詳細計算例) ──
 *  Đề bài: マグロ寿司専門店、売価150円、切り身1枚40円、シャリ20gで20円      → LOẠI: dữ kiện đề bài, đã dùng trong sm-43/sm-44
 *  標準原価÷メニュー売価×100＝標準原価率／メニュー売価－原価＝荒利益額／荒利益額÷メニュー売価×100＝荒利益率（または100%－標準原価率） → LOẠI: cùng công thức với F1-F3 dạng biến thể, đã kiểm tra qua sm-37/sm-38/sm-39
 *  標準原価60円・荒利益額90円・標準原価率40.0%・荒利益率60.0%（図❶）       → sm-43
 *  当月標準原価＝標準原価×当月販売数＝60円×100個＝6,000円、当月標準原価率6,000÷15,000×100=40.0% → LOẠI: mở rộng số lượng của sm-43, cùng kết quả 40.0%, không tạo câu hỏi trùng lặp
 *  前月末棚卸（マグロ切り身20枚×40円=800円＋シャリ300g×1円=300円=1,100円）    → LOẠI: dữ kiện trung gian, chỉ dùng để tính đáp án sm-44
 *  当月末棚卸（マグロ切り身30枚×40円=1,200円＋シャリ250g×1円=250円=1,450円）  → LOẠI: dữ kiện trung gian
 *  当月仕入（マグロ切り身120枚×40円=4,800円＋シャリ2,300g×1円=2,300円=7,100円）→ LOẠI: dữ kiện trung gian
 *  当月実際原価＝(前月末棚卸額＋当月仕入額)－当月末棚卸額＝6,750円、実際原価率45.0% → sm-44 (phần công thức + kết quả 6,750円 đã cite trong sourceQuoteJa)
 *  実際原価－標準原価＝ロス額＝750円、ロス率5%                              → sm-44
 *  荒利益は1番目の利益、ここから人件費・水光熱費・家賃等を払い残りが利益、ロスなければ全て利益 → tr-sm2-10, ro-sm2-7
 *
 * ── 参考３ tiếp — trang 12 (人時売上高/人時接客数/客単価の実践問題) ──
 *  前提：1日平均売上高360,000円、客数300人、実働時間75時間                  → LOẠI: dữ kiện đề bài, dùng chung cho sm-46/sm-47
 *  売上高÷実働時間＝人時売上高＝360,000÷75＝4,800円                        → sm-46
 *  客数÷実働時間＝人時接客数＝300÷75＝4人                                  → LOẠI: cùng dạng công thức đã kiểm tra ở sm-23, chỉ khác số liệu áp dụng
 *  人時売上高を5,000円にする2つの方法：実働時間を3時間減らす／売上高を増やす（客単価を50円上げる） → sm-47
 *  現状客単価＝360,000÷300＝1,200円、目標客単価1,250円（差50円）             → LOẠI: dữ kiện trung gian để tính sm-47, không tách câu hỏi riêng
 *  店長としてできること：ワークスケジュール（実働時間）のコントロール         → LOẠI: đã gộp ý trong explanationVi sm-47
 *  店長としてできること：お薦め販売（サジェスティブセールス）                 → sm-48
 *  ピーク時の回転率を上げるため客席数に合わせたご案内や中間下げを徹底、スタンバイ徹底・料理のスピード提供 → LOẠI: chi tiết thao tác vận hành bổ sung, không phải dữ kiện định lượng cốt lõi để trắc nghiệm hoá — 2 thuật ngữ 中間下げ/スタンバイ đã đưa vào vc-sm2-23/vc-sm2-24
 *  ©出典：清水均著／商業界 (2 lần, cuối 参考２ và cuối 参考３)                → LOẠI: ghi chú bản quyền nguồn tham khảo, không phải kiến thức thi
 *
 * KẾT LUẬN soát lần 2 (sau khi phát hiện thiếu 参考２/参考３ ở lượt soát đầu, bổ sung sm-37..sm-52,
 * tr-sm2-10, ro-sm2-7, vc-sm2-19..24, và sửa lại sm-30 cho khớp nguyên văn không có ×100):
 * Toàn bộ đơn vị nội dung từ trang 3 đến hết trang 12 đã có id câu hỏi hoặc lý do loại bỏ tường minh.
 * Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — sm-ch3 (発注管理と検収（検品と収納）管理, trang 13-16).
 * LƯU Ý: mục lục ghi chương này bắt đầu trang 13, chương 4 (販売管理) bắt đầu trang 16 — nhưng nội dung
 * chương 3 thực tế kéo dài đến GIỮA trang 16 (đoạn ví dụ về thịt bò và kết luận trách nhiệm quản lý),
 * tiêu đề "４．販売管理" chỉ xuất hiện sau đó cùng trang. Nguồn đối chiếu bằng PDF gốc trích xuất thật
 * (otaff_1.pdf, xem [[feedback_pdf_source_reverify_after_compact]]).
 *
 * ── （１）発注管理と発注の仕組みづくりの参考例 — trang 13 ──
 *  ① 仕込み量と仕入れ量の標準化
 *  S1  過剰な食材在庫は品質劣化・ロス・無駄な仕入コスト・資金繰り悪影響           → sm-53
 *  S2  仕入れ量は売上計画・配送スケジュールに合わせ品切れなく多すぎない適正量を確保→ LOẠI: mô tả mục tiêu chung, đã gộp tinh thần trong sm-53/sm-54
 *  S3  標準化には売上に対する各食材必要量の算出が必要                          → LOẠI: dẫn nhập trước ví dụ cụ thể
 *  S4  具体例(売上10万円ごとの分析、レジ記録・伝票分析)                        → LOẠI: ví dụ minh họa quy trình, không có định nghĩa/công thức cốt lõi
 *  S5  具体例(US サーロイン200g10枚等の仕込み量逆算)                          → LOẠI: ví dụ chi tiết quá cụ thể, không mang tính đại diện tổng quát
 *  S6  「売上別仕込み一覧表」「売上別発注一覧表」作成、業者別にすると便利         → LOẠI: tên gọi công cụ quản lý nội bộ, không phải kiến thức định lượng cốt lõi
 *  S7  季節・曜日変動に対応でき的確な発注・仕込みがシステム化できる（kết luận）    → LOẠI: câu tổng kết
 *  ② 配送スケジュールを確認する
 *  S8  納入業者ごとに配送スケジュール確認が必要（dẫn nhập）                     → LOẠI
 *  S9  具体例(月木発注・火金納品、120%の在庫確保)                             → sm-55 (câu hỏi tính toán cụ thể)
 *  S10 火曜納品時は火水木の売上計画×120%を確保                                → sm-55
 *  S11 金曜納品時は金土日月の売上計画×120%を確保                              → LOẠI: cùng cấu trúc công thức với S10, đã đủ đại diện qua sm-55, không tạo câu hỏi thứ 2 trùng lặp
 *  S12 売上予測精度が高ければ110%でも良い                                    → LOẠI: chi tiết ngoại lệ nhỏ, không phải kiến thức cốt lõi
 *  S13 発注＝各食材の適正在庫量－発注時点での在庫量                            → sm-54
 *  S14 大手チェーン店の自動発注システム(CKから毎日配送、棚卸しインプットのみ)     → sm-56
 *  S15 ファストフードチェーンのオーダーエントリー・AI活用の自動発注              → LOẠI: mở rộng bổ sung của S14, cùng khái niệm 自動発注システム, không tạo câu hỏi thứ 2
 *  S16 今後は中小店でも自動発注システム運用が可能に（kết luận）                 → LOẠI
 *
 * ── （２）正しい棚卸しと検収（検品と収納）作業のポイント — trang 14-16 ──
 *  ① 棚卸しの正しい進め方
 *  S17 実地棚卸しは発注量決定・在庫品質管理のため毎日実施必要                   → sm-57
 *  S18 期末・月末棚卸しは財務・原価管理面から重要、的確・厳正に                 → LOẠI: nhấn mạnh bổ sung, cùng tinh thần với S17
 *  S19 実地棚卸しのポイント ア〜カ (6項目: サンプル処理/返品まとめ/空箱捨てる/秤等準備/2人カウント/相互確認) → sm-58 (mục オ, đại diện điểm quan trọng nhất của danh sách)
 *  S20 ※オとカは期末棚卸しの際に実施（発注の実地棚卸しは1人でも良い）           → sm-59
 *  ② 棚卸しの集計と提出に当たってのポイント
 *  S21 ア〜カ (6項目: 単位数量確認/転記ミス/単価ミス/計算ミス/サイン/期日提出)   → sm-60
 *  S22 正しく実施すれば1ヶ月の努力が原価管理・適正在庫日数として正確に表現される → LOẠI: câu tổng kết
 *  ③ 検収作業のポイント
 *  S23 適正な発注は正確な実地棚卸しを元に。品切れ機会損失防止、過剰在庫ロス防止のため → LOẠI: lý do nền tảng, đã gộp tinh thần trong sm-64/sm-65
 *  S24 A)発注数量 B)納品書の数量 C)現品の数量と品質の3つを確認               → sm-61
 *  S25 基本は発注量（発注書のコピー）を元に検品実施                          → sm-62
 *  S26 ア〜オ (5項目: 納品書形式確認/品質確認/納品日時確認/先入れ先出し/日付記入) → sm-63 (mục エ, đại diện điểm quan trọng nhất)
 *  ■原価管理と検収作業の重要性
 *  S27 売上予測に基づく適正発注量と実際納品数量確認が重要（dẫn nhập）          → LOẠI
 *  S28 多ければ売れ残り発生→品質劣化→ロス                                   → sm-64
 *  S29 少なければ品切れ→不評→販売機会損失(チャンスロス)→客数ダウン            → sm-65
 *  S30 数量通りでも品質基準(産地/等級/規格/サイズ/鮮度熟成度/色/温度)に合わなければロス → LOẠI: đã gộp khái niệm 品質基準 vào vc-sm3-11, không tạo câu hỏi riêng để tránh trùng lặp với sm-66
 *  S31 品質基準に合わなければクオリティ維持できない、書面契約すべき             → LOẠI: câu tổng kết dẫn tới khuyến nghị (ý chính "書面契約" khá quan trọng nhưng đã gộp vào explanationVi nếu cần — quyết định LOẠI để tránh câu hỏi quá vụn)
 *  S32 具体例(しゃぶしゃぶ用和牛ロース肉サイズ基準外→標準歩留まり超えロス→原価率上昇) → sm-70
 *  S33 具体例(ドリップ出た状態→肉質劣化→その場で返品)                       → LOẠI: mở rộng của S32, cùng ví dụ minh họa, không tạo câu hỏi thứ 2
 *  S34 検収(検品・収納)作業の定義(数量+品質基準チェック、常温/冷凍/冷蔵に分け保管) → sm-66
 *  S35 具体例(マグロ発注10kg、納品書10kg、現品6kg→気づかず4kgの見えないロス2万円) → sm-67
 *  S36 調理関係者はロス=廃棄ロスと思いがちだが検収時不足に気づかなければ見えないロス発生 → sm-68
 *  S37 具体例(納品書12kg=現品12kgでも発注10kgなら2kg多い→廃棄ロス+支払い増加)  → sm-69
 *  S38 店舗管理責任者はA)B)C)確認する正しい検収作業の重要性を理解し徹底（kết luận）→ LOẠI: câu tổng kết, đã gộp ý nghĩa qua sm-61/sm-66/tr-sm3-9
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 13-16 (phần thuộc chương 発注管理と検収) đã có id câu hỏi
 * hoặc lý do loại bỏ tường minh. Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — sm-ch4 (販売管理, trang 16-17).
 * LƯU Ý: tương tự sm-ch3, chương này bắt đầu GIỮA trang 16 (sau khi sm-ch3 kết thúc) và kết thúc GIỮA
 * trang 17 (trước khi tiêu đề "５．顧客管理" xuất hiện). Nội dung có cấu trúc liệt kê (1)-(10) rõ ràng.
 *
 *  S1  販売管理の定義（計画どおり売上高を作るため販売促進の内容を管理すること）        → sm-71
 *  S2  販売促進の項目リスト(メニュー改定/季節メニュー/セット割引/時間帯割引/割引券/ポイント制度/WEB/宅配/持ち帰り/電子化支払い/電子化予約) → LOẠI: liệt kê tổng quan, mỗi mục quan trọng đã tách câu hỏi riêng ở (1)-(10) bên dưới
 *  S3  多くの項目がある中で効果測定・効率判断のため管理が必要（kết luận）              → LOẠI: câu tổng kết
 *  (1) S4  ABC分析の定義(売上順/売れ個数順、累計70%=A、70-90%=B、90-100%=C)          → sm-72
 *  S5  この割合は各事業体により変化する                                          → LOẠI: chi tiết bổ sung nhỏ, đã gộp trong explanationVi sm-72
 *  S6  C判定メニューは余り売れないと判断し次回改定から外す対象                      → sm-73
 *  (2) S7  季節メニューもABC分析の中で位置づけにより成否判断できる                   → LOẠI: mở rộng áp dụng của khái niệm ABC phân tích đã kiểm tra ở sm-72, không tạo câu hỏi thứ 2 trùng lặp
 *  (3) S8  セット割引商品の定義(数種類まとめ注文で割安)+ランチセット効果(回転率UP→売上向上) → sm-74
 *  (4) S9  時間帯割引商品はアイドルタイム用値引きで来店客誘引                       → sm-75
 *  (5) S10 割引券の目的(再来店促進)+渡すタイミング(レジ精算時、来店時に渡すと売上を下げる要因) → sm-76
 *  (6) S11 ポイント制度は客を囲い込む施策、複数回来店促進、割引券と共にリピーター獲得に有効 → sm-77
 *  (7) S12 WEBサイトは主にホームページ、割引券貼付で新規顧客獲得手段として有効        → sm-78
 *  (8) S13 宅配サービスはWEBと一体、来店動機ない人にも販売可、新規顧客開拓につながる    → sm-79
 *  (9) S14 支払いの電子化は来店選択の一つ、現金ないときカード/スマホ決済理由で来店     → sm-80
 *  (10) S15 予約はWEB主だが電話対応も可、高齢者も予約しやすくグループ客獲得に貢献     → sm-81
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 16-17 (phần thuộc chương 販売管理) đã có id câu hỏi hoặc lý
 * do loại bỏ tường minh. Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — sm-ch5 (顧客管理, trang 17, chương rất ngắn — chỉ 1 trang, 3 đoạn (1)(2)(3)).
 *  S1  客の3分類(固定顧客=高頻度来店/準固定顧客=ときどき来店/新規顧客)                → tr-sm5-1, ro-sm5-1, vc-sm5-1/2/3
 *  S2  客数減少傾向の原因は主に固定顧客と準固定顧客の目減り                          → sm-82
 *  S3  交通量の多い駅周辺は新規顧客率が高く、それ以外は固定+準固定顧客の比率が高い     → sm-83
 *  S4  顧客管理の定義(準固定顧客→固定客、新規顧客→準固定顧客/固定顧客)               → sm-84, tr-sm5-2, ro-sm5-2
 *  (1) S5 固定顧客の目減りを減らすには品質維持+顔を覚え「いつもありがとうございます」+好みのメニュー・席を覚える → sm-85, tr-sm5-3
 *  (2) S6 準固定顧客を固定顧客にするには顔を思い出すことが大切→同様に挨拶すれば来店頻度UP → sm-86, tr-sm5-4, ro-sm5-3
 *  (3) S7 新規顧客にはQSCレベルを全体的に上げることで再来店につながる                → sm-87, tr-sm5-5, ro-sm5-4
 *  S8  友人・知人への推奨→口コミで新規顧客来店の機会につながる                       → sm-88
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 17 (phần thuộc chương 顧客管理) đã có id câu hỏi hoặc được
 * gộp trực tiếp vào câu hỏi liền kề (chương ngắn, không có nội dung dư thừa cần loại bỏ).
 *
 *
 * KIỂM KÊ NỘI DUNG — sm-ch6 (雇用管理, trang 18-19, chương pháp luật lao động dày đặc số liệu).
 * ── （１）労働時間と割増賃金 — trang 18 ──
 *  S1  原則1日8時間/1週40時間（một số ngành <10 lao động: 週44時間）                  → sm-89
 *  S2  40時間超えるには36協定を締結し労働基準監督署に届出                             → sm-90
 *  S3  時間外労働は割増賃金25%以上                                                  → sm-91
 *  S4  深夜労働(22時-翌5時)も割増賃金25%以上                                         → sm-92
 *  S5  深夜労働が残業(時間外労働)にもなっていれば50%以上                              → sm-93
 *  S6  労働時間延長は原則月45時間/年360時間以内                                      → sm-94
 *  S7  残業月60時間まで通常割増、超えた時間は50%                                     → sm-95
 *  S8  深夜労働のみ：25%以上                                                       → LOẠI: trùng với S4 (đã kiểm tra ở sm-92), là dòng đầu của bảng tổng hợp 4 trường hợp
 *  S9  時間外労働と重複：50%以上                                                    → LOẠI: trùng với S5 (đã kiểm tra ở sm-93)
 *  S10 休日労働と重複：60%以上                                                      → sm-96
 *  S11 月超60時間残業労働と重複：75%以上                                             → sm-97
 * ── （２）休憩時間、休日 — trang 18 ──
 *  S12 労働時間6時間超→45分以上、8時間超→60分以上の休憩を途中に与える                  → sm-98
 *  S13 休憩時間を始業直後や終業直前に設定することはできない                           → sm-99
 *  S14 休日は週1日か4週間で4日以上                                                  → sm-100
 * ── （３）年次有給休暇 — trang 18-19 ──
 *  ① S15 雇入れ6ヶ月経過+全労働日8割以上出勤で有給休暇発生                            → sm-101
 *  S16 勤務時間・勤務日数により付与日数が異なる（dẫn nhập bảng）                       → LOẠI: dẫn nhập trước bảng
 *  S17 ア.一般労働者(週5日以上/週30時間以上)の付与日数表(0.5年=10日...6.5年以上=20日)   → sm-102
 *  S18 イ.週30時間未満労働者の付与日数表(theo tổ hợp 週所定労働日数×継続勤務期間, bảng phức tạp) → LOẠI: bảng tỷ lệ theo giờ bán thời gian quá chi tiết (28 ô số liệu), không trắc nghiệm hoá hợp lý trong phạm vi 1 câu; nguyên tắc chung (6 tháng+80%) đã kiểm tra ở sm-101, bảng đầy đủ số liệu để tham khảo khi làm việc thực tế
 *  ② S19 労働者の時季指定が事業の正常な運営を妨げる場合、使用者に時季変更権             → sm-103
 *  ③ S20 使用者は10日以上付与される労働者に年5日の有給休暇取得させる義務               → sm-104
 * ── （４）採用面接の仕方 — trang 19 (7 bước) ──
 *  ① S21 履歴書確認（年齢は証明書提示+写真と本人一致確認）                            → sm-105
 *  ② S22 所定フォーマットに必要事項記載してもらう                                    → LOẠI: bước thủ tục hành chính đơn giản, không có dữ kiện định lượng
 *  ③ S23 希望職種を確認する                                                       → LOẠI: bước thủ tục ngắn, đã gộp tinh thần trong sm-106 (xác nhận nguyện vọng ứng viên)
 *  ④ S24 採用したい時間帯と希望時間帯を確認し合わなければ変更可能か確認                → sm-106
 *  ⑤ S25 店のルール(出退勤/勤務態度など)を説明し守ってもらえるか確認                   → LOẠI: trùng tinh thần với ハウスルール đã kiểm tra ở sm-108 (áp dụng cho ngày đầu làm việc), ở bước phỏng vấn chỉ là xác nhận sơ bộ
 *  ⑥ S26 相手の要望を聞く                                                         → LOẠI: bước ngắn, đã gộp tinh thần trong sm-106
 *  ⑦ S27 採用の場合でもその場で告げない（理由は関係部署の了承を得るため）              → sm-107
 * ── （５）採用初日のオリエンテーションと基礎訓練 — trang 19 (4 bước) ──
 *  ① S28 初日はオリエンテーションとハウスルールで基本を教える                         → sm-108
 *  ② S29 店舗の設備や配置を説明案内(ストアツアー)し、スタッフを紹介                    → sm-109
 *  ③ S30 配置される部署の責任者を紹介し教育訓練プログラムを説明                        → LOẠI: bước thủ tục giới thiệu, khái niệm 教育訓練プログラム đã đưa vào vc-sm6-17
 *  ④ S31 定型サービスの基礎と基本作業のトレーニング(あいさつ/姿勢/スマイル/下げ物/洗い場) → LOẠI: liệt kê kỹ năng cụ thể sẽ được đào tạo chi tiết hơn ở chương 7 (人材の育成指導), tránh trùng lặp phạm vi giữa 2 chương; khái niệm 定型サービス đã đưa vào vc-sm6-19
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 18-19 (phần thuộc chương 雇用管理) đã có id câu hỏi hoặc lý
 * do loại bỏ tường minh. Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — sm-ch7 (人材の育成指導, trang 20-21).
 * ── （１）スキルを教えるスタンダードとなる要素 — trang 20 ──
 *  S1  7要素liệt kê(目的/方法/道具/手順/量/質/時間) mỗi mục có định nghĩa riêng               → sm-110 (tổng quan+loại trừ), sm-111(量), sm-112(質) — 5 mục còn lại (目的/方法/道具/手順/時間) gộp trong đáp án đúng của sm-110 nhưng không tách câu riêng để tránh 7 câu hỏi liên tiếp cùng cấu trúc
 * ── （２）人材育成の基本体系 — trang 20 ──
 *  S2  4段階liệt kê(教育=芽を引き出す/導入=方向付ける/訓練=反復練習する/啓発=開発する)          → sm-113(thứ tự), sm-114(教育定義), vc-sm7-4(啓発), vc-sm7-16(訓練), vc-sm7-17(導入) — 訓練・導入 phủ qua vocab thay vì thêm câu quiz trùng cấu trúc với sm-114
 *  S3  この段階は店や職場の責任者（マネージャー）が担当する必要がある                        → sm-115
 * ── （３）重要なサービスの型の体得 — trang 20 ──
 *  S4  接客サービスの基本は「型」を学び反復練習をする中で体得する                            → sm-116, tr-sm7-2, ro-sm7-1
 * ── （４）大切な発声練習 — trang 20 ──
 *  S5  サービスを表現する要素は「態度・表情・言葉遣い」                                     → sm-117, tr-sm7-3
 *  S6  言葉そのものより言葉遣いや表情のほうが影響大                                        → sm-118
 *  S7  言葉遣いのポイントは声の大きさ・トーン・語調                                        → sm-119, ro-sm7-2
 *  S8  トーンの定義(音質、音の高低、抑揚)                                                → sm-120, ro-sm7-3
 *  S9  語調の定義(リズム/口調、語尾の強弱)                                                → sm-121
 *  S10 ホスピタリティサービスを目指すには美しい日本語+感情豊かな表現、基礎訓練は発声練習       → sm-122
 * ── （５）OJTとOFFJTの基礎知識 — trang 21 ──
 *  ① S11 OJTの定義(実地訓練)                                                          → sm-123, tr-sm7-4, ro-sm7-4
 *  S12 OFFJTの定義(理念・知識、集合教育)                                                 → sm-124, tr-sm7-5
 *  S13 新人育成プログラムはOJT+OFFJT組み合わせ、現場に近いほどOJT比率UP                     → sm-125, tr-sm7-6, ro-sm7-5
 *  ② S14 OJTの原則ⅰ（マンツーマン）                                                     → sm-126
 *  S15 OJTの原則ⅱ（1人でできるまで）                                                    → sm-127
 *  S16 OJTの原則ⅲ（一連の長い作業は区切ってトレーニングする）                              → LOẠI: nguyên tắc ngắn bổ sung, ít trọng tâm hơn ⅰⅱ, không tạo câu hỏi thứ 3 để tránh dàn trải quá mỏng
 *  S17 現場トレーニングでチェックすべき項目(視線/表情/声の出し方/姿勢/手の使い方)             → sm-128, vc-sm7-18(視線)
 * ── （６）トレーニングの4ステップ — trang 21 ──
 *  S18 4ステップ(①導入=習う気持ちにさせる ②掲示=やって見せる ③適用=やらせてみる ④的確にフォローアップ) → sm-129 (gộp cả thứ tự và nội dung 4 bước trong 1 câu để tránh 4 câu hỏi liên tiếp cùng cấu trúc), vc-sm7-9(掲示), vc-sm7-10(適用), vc-sm7-11(フォローアップ)
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 20-21 (phần thuộc chương 人材の育成指導) đã có id câu hỏi
 * hoặc lý do loại bỏ tường minh. Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — sm-ch8 (防火・防災管理, trang 22-24) + phần liên quan của 参考６ (trang 27).
 * GHI CHÚ QUAN TRỌNG VỀ 参考４ VÀ 参考５: đã rà soát toàn bộ text trích xuất từ PDF gốc (otaff_1.pdf) —
 * cả hai mục này CHỈ xuất hiện dưới dạng tiêu đề + dòng bản quyền (「©出典：...」), KHÔNG có bất kỳ nội
 * dung bảng/từ vựng/danh sách nào trích xuất được trong text layer (khác hẳn 参考１/２/３/６ đều có đầy
 * đủ nội dung dạng text). Nhiều khả năng 参考４ (最重要接客用語集) và 参考５ (緊急時の行動基準) được trình
 * bày dưới dạng hình ảnh/đồ họa trong PDF gốc mà công cụ trích xuất text hiện có không đọc được — ĐÂY
 * LÀ GIỚI HẠN THẬT của kỹ thuật đang dùng, không phải bỏ sót do chủ quan. Không tạo câu hỏi cho 2 mục
 * này để tránh bịa nội dung không có căn cứ. Nếu sau này có công cụ OCR/đọc ảnh, cần bổ sung riêng.
 *
 * ── （１）防火管理者 — trang 22 ──
 *  S1  店舗ごとに防火管理者を配置しなければならない                                  → LOẠI: câu mở đầu ngắn, ý chính đã gộp vào tr-sm8-1/ro-sm8-1
 *  S2  防火管理者の定義(消防計画作成+防火管理業務を計画的に行う責任者)                → sm-130, ro-sm8-1
 *  S3  選任要件(管理的・監督的地位、店長かそれに匹敵、知識・技能を有する)              → sm-131
 *  S4  防火管理新規講習受講+資格+消防機関へ選任届出                                  → sm-132
 *  S5  防火管理業務10項目liệt kê                                                  → sm-133 (dạng loại trừ, đại diện 6/10 mục trong sourceQuote); 4 mục còn lại (火気監督/防火教育/火災地震時対応/消防機関連絡/その他) không tách câu riêng vì cùng cấu trúc liệt kê, đã đủ đại diện
 * ── （２）火災の基礎知識 — trang 22-23 ──
 *  S6  燃焼三要素                                                                → sm-134, tr-sm8-2, ro-sm8-2
 *  S7  具体例(調理油+ガスコンロ火花で引火→建屋に燃え広がる)                         → LOẠI: ví dụ minh họa, ý chính (nguồn nhiệt gây cháy) đã gộp trong sm-134
 *  S8  ア除去消火法                                                                → sm-135
 *  S9  イ窒息消火法+具体例(フライヤー+毛布)                                         → sm-136
 *  S10 ウ冷却消火法+具体例(消火器で放水)                                            → sm-137
 *  S11 エ希釈消火法+具体例(アルコール+水)                                           → sm-138
 *  S12 オ科学的消火法+具体例(スプリンクラー)                                        → sm-139
 * ── （３）避難でのポイント — trang 23 ──
 *  S13 火災時の死因(焼死・有毒ガス)+避難方法(顔を床に近づけビニール袋)               → sm-140, sm-141, tr-sm8-3, ro-sm8-3
 *  S14 誘導灯の日頃点灯チェック                                                     → LOẠI: điểm bổ sung ngắn, không đủ dữ kiện tách câu hỏi riêng có ý nghĩa
 * ── （４）防火対策 — trang 23 (7項目) ──
 *  S15 廊下等死角の整理整頓、可燃物を置かない                                       → sm-142 (dạng loại trừ, đại diện mục①②③)
 *  S16 物置倉庫に施錠                                                              → sm-142 (đại diện)
 *  S17 出入口を限定し確認監視                                                       → sm-142, tr-sm8-4, ro-sm8-4
 *  S18 臨時従業員の顔を把握し不審者と間違えない                                     → sm-143
 *  S19 客と従業員トイレ共有で監視                                                   → LOẠI: biện pháp bổ sung cụ thể, cùng tinh thần với S18/S20
 *  S20 死角に監視カメラ・巡回監視                                                   → LOẠI: đã gộp khái niệm 死角 vào vc-sm8-8, không tạo câu hỏi riêng để tránh trùng lặp với sm-142
 *  S21 内装材に不燃材使用                                                          → LOẠI: chi tiết vật liệu xây dựng, ít trọng tâm cho kỳ thi kỹ năng nhà hàng
 * ── （５）消防訓練の実施 — trang 23 ──
 *  S22 年1回避難訓練、手順・役割決め、消火器使い方周知                              → sm-144, tr-sm8-5, ro-sm8-5
 * ── （６）具体的な対策 — trang 24 (6項目チェックリスト) ──
 *  S23 6項目liệt kê(火災報知器/フード内ダンパー/ガスホース/湯沸かし種火/自動洗浄機/配電盤) → sm-145 (dạng loại trừ, đại diện đủ cả 6 mục trong sourceQuote)
 * ── （７）マニュアルの確認 — trang 24 (3項目) ──
 *  S24 3項目liệt kê(消防署通報/お客様避難誘導/従業員役割分担)                        → sm-146
 *
 * ── 参考６ マネジメント基本用語 — trang 26-27 (chỉ liệt kê thuật ngữ CHƯA được kiểm tra ở chương trước) ──
 *  [OJT][OffJT] → LOẠI: đã kiểm tra đầy đủ ở sm-ch7 (sm-123, sm-124), không lặp lại
 *  [オペレーション] → vc-sm8-13
 *  [客単価] → LOẠI: đã kiểm tra ở sm-ch2
 *  [QSC] → LOẠI: đã kiểm tra ở sm-ch1
 *  [経営理念] → sm-150, tr-sm8-7, ro-sm8-6
 *  [原価率] → LOẠI: đã kiểm tra ở sm-ch2
 *  [人事考課] → vc-sm8-15
 *  [スタンダード] → vc-sm8-14
 *  [トレーナー][トレーニー] → LOẠI: đã kiểm tra ở sm-ch7
 *  [トレーニングプログラム] → vc-sm8-16
 *  [人時売上高][人時生産性][人時接客数] → LOẠI: đã kiểm tra ở sm-ch1/sm-ch2
 *  [マネジメントサイクル] → sm-147, tr-sm8-8, vc-sm8-17
 *  [予算制度] → sm-148, vc-sm8-18
 *  [労働生産性] → sm-149, vc-sm8-20
 *  [労働分配率] → LOẠI: đã kiểm tra ở sm-ch2
 *  [ワークスケジュール] → vc-sm8-19
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 22-24 (phần thuộc chương 防火・防災管理) và các thuật ngữ mới
 * của 参考６ đã có id câu hỏi hoặc lý do loại bỏ tường minh. 参考４/参考５ không trích xuất được nội dung
 * text — đã ghi rõ giới hạn kỹ thuật ở đầu mục này thay vì bỏ sót âm thầm.
 *
 * === HOÀN TẤT PHẦN 1: 店舗運営 (Quản lý cửa hàng) — 8/8 chương (sm-ch1 → sm-ch8) ===
 *
 *
 * === BẮT ĐẦU PHẦN 2: 衛生管理 (Vệ sinh an toàn thực phẩm) — nguồn: otaff_2.pdf (file PDF riêng biệt,
 * đánh số trang lại từ 1) ===
 *
 * KIỂM KÊ NỘI DUNG — hy-ch1 (食品衛生の現状, trang 1-2, chương ngắn — chỉ 2 mục nhỏ).
 * ── （１）食品衛生法の目的 — trang 1 ──
 *  S1  「食」は常に安全で安心なものでなくてはならない（dẫn nhập）                    → tr-hy1-1, ro-hy1-1
 *  S2  食品等事業者は食品衛生法に定められた内容を守らなくてはならない                 → hy-2, tr-hy1-5
 *  S3  食品衛生法第一条の目的（飲食起因の衛生上の危害防止、国民の健康保護）            → hy-1, tr-hy1-2, ro-hy1-2
 * ── （２）食中毒の発生状況 — trang 1-2 ──
 *  S4  食中毒事件数・患者数の推移は図1-1参照（dẫn nhập biểu đồ）                     → LOẠI: câu dẫn tới biểu đồ, số liệu cụ thể đã có ở S5/S6
 *  S5  近年1,000件前後発生、患者数は平成25年以降25,000人を下回り減少傾向             → hy-3, hy-4
 *  S6  令和3年以降はコロナ行動制限の影響で減少した可能性（ghi chú thận trọng）        → LOẠI: giả thuyết mở, không phải dữ kiện khẳng định để trắc nghiệm hoá
 *  S7  約90%以上が有害微生物(細菌/ウイルス/寄生虫)が原因                            → hy-5, tr-hy1-3, vc-hy1-3/4/5/6
 *  S8  令和4年事件数上位3(アニサキス566件/カンピロバクター185件/ノロウイルス63件)      → hy-6
 *  S9  令和4年患者数上位4(ノロウイルス2175人/ウエルシュ菌1465人/カンピロバクター822人/サルモネラ698人) → hy-7
 *  S10 食中毒以外に異物混入・食物アレルギー対策も重要課題                           → hy-8, tr-hy1-4, ro-hy1-3
 *  S11 食中毒統計は厚生労働省が毎年更新、参照URL                                    → LOẠI: hướng dẫn tra cứu bên ngoài, không phải kiến thức thi; URL không đưa vào sourceQuote để tránh trích dẫn link
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 1-2 (chương 食品衛生の現状) đã có id câu hỏi hoặc lý do loại
 * bỏ tường minh. Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — hy-ch2 (食品衛生管理の基本～食中毒予防の3原則と5S活動～, trang 3-4).
 * ── （１）食中毒予防の3原則 — trang 3-4 ──
 *  S1  3原則「つけない・増やさない・やっつける」は重要な原則、一般衛生管理・HACCPの基礎               → hy-9, tr-hy2-1, ro-hy2-1
 *  ① つけない
 *  S2  少量感染の定義（O157/ノロウイルスは10-100個で感染）                                       → hy-10, tr-hy2-2, ro-hy2-2
 *  S3  「つけない」対策はノロウイルス等の少量感染対策で特に重要                                     → hy-11
 *  S4  持ち込まない・拡げないが重要要素（dẫn nhập）                                              → LOẠI: dẫn nhập trước 2 mục con, nội dung cụ thể ở S6/S8
 *  S5  汚染経路（食品取扱者/原材料/施設設備/器具容器）を遮断し二次汚染を防ぐ                          → vc-hy2-5(二次汚染), không tạo câu hỏi riêng vì đã gộp khái niệm vào vocab
 *  S6  持ち込まない具体策（健康管理/清潔な作業着履物/手洗い/汚染包装材の持ち込み制限）                 → hy-12
 *  S7  拡げない：不顕性感染の食品取扱者が施設汚染→拡大すると食中毒発生、拡げなければリスク低い          → vc-hy2-6(不顕性感染), ý chính đã gộp trong explanationVi hy-13
 *  S8  拡げない具体策（手洗い/おう吐物処理/トイレ清潔/二枚貝器具の洗浄消毒）                          → hy-13
 *  ② 増やさない
 *  S9  食品付着の細菌は室温放置で増殖、最適温度時間を与えないことが重要                              → LOẠI: nguyên lý chung, đã gộp trong explanationVi hy-14/hy-15
 *  S10 ウイルスは食品中で増えないためこの原則は適用できない（ngoại lệ quan trọng）                   → hy-14
 *  S11 具体策：冷蔵冷凍庫温度確認/迅速処理/低温10℃以下または高温60℃以上保管                          → hy-15
 *  ③ やっつける
 *  S12 有害微生物の多くは熱に弱く中心部十分加熱で死滅、寄生虫は冷凍でも死滅                          → hy-18, tr-hy2-4, ro-hy2-4
 *  S13 加熱基準：中心部75℃で1分以上（ノロウイルス汚染の恐れは85-90℃で90秒以上）                     → hy-16, hy-17
 *  S14 必要に応じ野菜類等を次亜塩素酸ナトリウムで殺菌                                             → vc-hy2-8
 * ── （２）5S活動の衛生管理への応用 — trang 4 ──
 *  S15 食品関係施設の5S活動は職場環境改善だけでなく衛生管理にも有効                                → tr-hy2-5
 *  S16 5S活動は食中毒予防3原則「つけない」実践に不可欠+異物混入防止対策の基礎                        → hy-24, ro-hy2-5
 *  S17 5S=5要素構成(整理/整頓/清掃/清潔/習慣)、頭文字が全てS                                     → hy-19
 *  S18 ①整理の定義                                                                        → hy-20, vc-hy2-9
 *  S19 ②整頓の定義                                                                        → hy-21, tr-hy2-6, vc-hy2-10(定位置)
 *  S20 ③清掃の定義（食品施設では洗浄消毒で微生物汚染も除去）                                     → hy-22
 *  S21 ④清潔の定義                                                                        → vc-hy2-11
 *  S22 ⑤習慣の定義                                                                        → hy-23, tr-hy2-7
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 3-4 (chương 食中毒予防の3原則と5S活動) đã có id câu hỏi hoặc
 * lý do loại bỏ tường minh. Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — hy-ch3 (HACCPに沿った衛生管理, trang 5-6).
 * ── （１）「HACCPに沿った衛生管理」の制度化 — trang 5 ──
 *  S1  食品衛生法は「HACCPに沿った衛生管理」を基準として定める（dẫn nhập）                      → LOẠI: dẫn nhập, nội dung cụ thể ở S2
 *  S2  基準は2つで構成（一般的な衛生管理の基準+重要工程管理の取組の基準）                        → hy-25, tr-hy3-1
 *  S3  営業者は2つの基準に従い自らの施設の公衆衛生上の措置を定めて遵守                           → LOẠI: câu tổng kết nghĩa vụ, đã gộp trong explanationVi hy-25
 *  S4  小規模営業者はHACCPの考え方を取り入れた衛生管理の手引書を活用可、その場合14項目順守が重要      → hy-26
 *  S5  営業許可更新時・保健所定期立入検査で食品衛生監視票に基づき実施状況確認、項目ごと採点          → hy-27, tr-hy3-2
 * ── （２）すべての営業者が実施しなければならないこと — trang 5 (4項目) ──
 *  S6  ①衛生管理計画の作成                                                                → hy-29, tr-hy3-3, ro-hy3-2
 *  S7  ②手引書の作成                                                                     → hy-28 (đại diện trong danh sách loại trừ)
 *  S8  ③記録と保存                                                                       → hy-28 (đại diện)
 *  S9  ④定期的な検証                                                                     → hy-30
 * ── （３）一般的な衛生管理の基準14項目 — trang 5-6 (chỉ liệt kê tên, chi tiết từng mục sẽ ở hy-ch4) ──
 *  S10 14項目liệt kê(①食品衛生責任者...⑭そのほか)                                          → hy-31 (dạng loại trừ, đại diện đủ tên 14 mục trong sourceQuote); chi tiết nội dung từng mục để dành cho hy-ch4 (một chương riêng theo đúng cấu trúc mục lục gốc), không lặp lại ở đây để tránh trùng phạm vi 2 chương
 * ── （４）重要工程管理の取組みのための基準 — trang 6 ──
 *  S11 コーデックス委員会のHACCP7原則に基づく「HACCPに基づく衛生管理」を大規模事業者などに義務付け     → hy-32, hy-33
 *  【HACCP7原則】
 *  S12 ①危害要因の分析                                                                   → hy-34, tr-hy3-4
 *  S13 ②重要管理点の決定                                                                  → hy-35, ro-hy3-3
 *  S14 ③管理基準の設定                                                                    → hy-36
 *  S15 ④モニタリング方法の設定                                                             → hy-37
 *  S16 ⑤改善措置の設定                                                                    → hy-38, tr-hy3-5
 *  S17 ⑥検証方法の設定                                                                    → hy-39, ro-hy3-4
 *  S18 ⑦記録の作成                                                                       → hy-40
 *  S19 小規模営業者などへの弾力的運用（業界団体作成+厚労省確認の手引書に基づき対応可）              → tr-hy3-6, vc-hy3-13
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 5-6 (chương HACCPに沿った衛生管理) đã có id câu hỏi hoặc lý
 * do loại bỏ tường minh (bao gồm việc chủ động để chi tiết 14項目 cho hy-ch4 — chương riêng theo đúng
 * cấu trúc mục lục gốc). Không còn dòng trống.
 *
 *
 * KIỂM KÊ NỘI DUNG — hy-ch4 (一般的な衛生管理の基準14項目の詳細, trang 7-30).
 * CHƯƠNG DÀI NHẤT trong toàn bộ app (~24 trang, gấp 4-6 lần chương thông thường). Với các mục liệt kê
 * cực dày (ví dụ: 11 hạng mục清掃 chi tiết cách/tần suất dọn từng khu vực, danh sách vật dụng vệ sinh...),
 * áp dụng nguyên tắc đã dùng ở sm-ch6/sm-ch8: 1-2 câu hỏi ĐẠI DIỆN cho mỗi cụm nội dung cùng cấu trúc
 * (thường là mục có số liệu/quy định cụ thể nhất hoặc rủi ro cao nhất), các mục còn lại trong cùng cụm
 * ghi rõ "LOẠI: cùng cấu trúc với mục đã hỏi" thay vì tạo hàng chục câu hỏi lặp mẫu.
 *
 * ── （１）食品衛生責任者などの選任 — trang 7 ── → hy-41 (điều kiện), hy-42 (nghĩa vụ)
 * ── （２）施設の衛生管理 — trang 7-9 (11 mục con①-⑪ tần suất/cách dọn từng khu vực) ──
 *  ①内壁床(毎日) → hy-43 | ②排水溝(毎日) → hy-44 | ③レンジフード(định kỳ) → hy-45 (lý do火災)
 *  ④天井給排気口ダクト → LOẠI: cùng cấu trúc định kỳ-tùy độ bẩn với③, đã đại diện qua hy-45
 *  ⑤冷蔵冷凍庫内 → hy-46 (nhiệt độ) | ⑥(không thấy số trong bản gốc, có thể là lỗi đánh số nguồn hoặc gộp vào⑤/⑦) → LOẠI
 *  ⑦照明器具 → LOẠI: cùng cấu trúc định kỳ với③④, đã đại diện
 *  ⑧倉庫 → LOẠI: cùng cấu trúc, đã đại diện qua hy-45/46; điểm riêng "không đặt trực tiếp xuống sàn" đã gộp vc-hy4 nếu cần
 *  ⑨トイレ(毎日) → hy-47 (thứ tự dọn tránh lan ô nhiễm — điểm đặc thù nhất trong mục này)
 *  ⑩窓出入口網戸 → hy-48 (nguyên tắc đóng cửa nhận hàng)
 *  ⑪調理施設周辺 → LOẠI: cùng cấu trúc định kỳ, đã đại diện
 *  2)清掃用具の取り扱い → hy-49 (bảo quản treo lên)
 *  3)調理施設での動物飼育は厳禁 → hy-50
 * ── （３）設備などの衛生管理 — trang 10-16 ──
 *  目的に応じた器具類の使用区分 → LOẠI: nguyên tắc chung, đã gộp trong explanationVi các câu liên quan
 *  (３)-1 洗浄・消毒・保管:
 *   洗浄と消毒の定義・使い分け → hy-51 | ①食器類洗浄方法 → LOẠI: quy trình thao tác cơ bản, không có số liệu đặc biệt
 *   ②調理器具類洗浄(まな板) → hy-52 (lý do không dùng thớt gỗ) | ③④⑤フードカッター等洗浄 → LOẠI: cùng cấu trúc với②
 *   ⑥洗浄剤の種類と特性(表4-1) → hy-53 | ⑦洗浄剤の使用基準 → hy-54, hy-55
 *   消毒の定義 → tr-hy4-3 | ①加熱消毒 → hy-56 | 薬剤消毒(次亜塩素酸/アルコール) → hy-57
 *   消毒保管庫(熱風/紫外線) → LOẠI: cùng cấu trúc thiết bị, không có số liệu riêng ngoài tuổi thọ đèn UV (đã ở hy-58 thuộc phần điểm kiểm)
 *   ②③電子レンジ・シンク消毒 → LOẠI: cùng cấu trúc với①
 *   食器・器具の保管(3項目) → LOẠI: nguyên tắc chung (tủ có cửa/nắp), không có số liệu đặc biệt để trắc nghiệm hoá tốt
 *  (３)-2 計器類・装置、手洗い設備の管理:
 *   ①中心温度計の点検(校正) → LOẠI: đã đưa khái niệm 校正 vào vc-hy4-5, nội dung định tính không đủ để tách câu hỏi riêng có ý nghĩa
 *   ②紫外線殺菌灯の点検(寿命3000時間) → hy-58 | ③殺菌装置点検 → LOẠI: cùng cấu trúc với②
 *   手洗い設備の整備(液体石けん等) → hy-59; các điểm khác (センサー式給水栓、ペーパータオル等) → LOẠI: chi tiết thiết bị, không có số liệu định lượng riêng
 * ── （４）使用水などの管理 — trang 17-18 ──
 *  水道水または飲用に適する水の使用義務 → hy-60 | 水質検査年1回 → hy-61 | 使用水の種類(水道水/専用水道/簡易専用水道等) → hy-62 (専用水道定義, đại diện)
 *  日常点検(色濁り臭い味、1日1回) → hy-63 | 定期検査(簡易専用水道等、年1回) → LOẠI: cùng số liệu năm1回 với hy-61, không lặp
 *  滅菌装置点検(残留塩素0.1ppm以上) → hy-64 | 問題があった時の対応(水使用停止+保健所連絡) → LOẠI: quy trình ứng phó, ý chính đã gộp trong explanationVi hy-64
 *  記録の保存(1年間以上) → hy-65
 * ── （５）ねずみ及び昆虫対策 — trang 18-19 ──
 *  駆除頻度(年2回以上) → hy-66 | クマねずみ・ドブねずみの違い → hy-67
 *  ハエ侵入発生防止(網戸、排水溝清掃等) → LOẠI: cùng tinh thần với biện pháp chung đã nêu; trọng tâm riêng "tránh phun thuốc" → hy-69
 *  ゴキブリ駆除(4手法：噴霧/燻煙/駆除剤/捕殺) → LOẠI: liệt kê 4 phương pháp kỹ thuật, không phải kiến thức cốt lõi kỳ thi kỹ năng nhà hàng; điểm quan trọng nhất (xác gián sau diệt) → hy-68
 *  ねずみ駆除(物理的/忌避/薬剤) → LOẠI: cùng cấu trúc liệt kê phương pháp, đã đại diện qua hy-66/67
 * ── （６）廃棄物及び排水の取扱い — trang 19-20 ──
 *  廃棄物処理法の目的 → hy-70 | ゴミ処理責任(事業者みずから) → hy-71 | ゴミ処理の具体的手順(分別/密封等) → LOẠI: quy trình thao tác chi tiết, không có số liệu riêng
 *  排水処理(下水道法) → hy-72
 * ── （７）食品等取扱者の衛生管理 — trang 21-24 ──
 *  ノロウイルス80%食品取扱者由来 → hy-73 | 胃腸炎症状時の対応 → hy-74 | 無症状病原体保有者 → hy-75
 *  作業着・帽子・履物の着用 → LOẠI: quy tắc trang phục chung, không có số liệu riêng
 *  マスク着用 → hy-76 | 手袋着用(再使用禁止) → hy-77 | 手洗いのタイミング → hy-78
 * ── （８）情報の提供 — trang 24-26 ──
 *  消費者への安全情報(調理法・保存法) → LOẠI: nguyên tắc chung
 *  アレルゲン表示義務8品目 → hy-79 | 外食店のアレルゲン情報提供義務(任意) → hy-80
 *  保健所への情報提供が必要な場合 → hy-81 | 外食事業者ができる食物アレルギー対応(4項目) → LOẠI: gợi ý thực hành, không có số liệu định lượng riêng để trắc nghiệm hoá tốt
 * ── （９）回収・廃棄について — trang 27-28 ──
 *  食品リコール報告制度(2021年6月1日) → hy-82 | 自主回収と回収命令の違い → hy-83
 *  届出対象・不要な回収事例 → LOẠI: liệt kê ví dụ minh họa, ý chính (2 loại vi phạm) đã gộp trong explanationVi hy-82/83
 * ── （１０）運搬・販売 — trang 28-29 ──
 *  運搬時温度管理(予冷、迅速な積み下ろし) → hy-84 | 運搬時間管理 → LOẠI: nguyên tắc chung, cùng tinh thần với hy-84
 *  運搬車管理 → LOẠI: nguyên tắc chung | 販売時ロードライン → hy-85 | 計り売り表示免除 → hy-86
 * ── （１１）教育訓練 — trang 29 ──
 *  主な教育訓練項目(6項目) → hy-87 (dạng loại trừ, đại diện đủ 6 mục)
 * ── （１２）そのほか（記録と保存） — trang 30 ──
 *  基本的な記録項目(4項目) → LOẠI: liệt kê loại thông tin cần ghi, không có số liệu riêng
 *  記録が必要な理由(4項目) → hy-88 (dạng loại trừ, đại diện đủ 4 lý do)
 *
 * KẾT LUẬN: toàn bộ 12 mục lớn (１)-(１２) của hy-ch4 đã có id câu hỏi đại diện hoặc lý do loại bỏ tường
 * minh cho từng cụm nội dung cùng cấu trúc. Đây là chương duy nhất áp dụng mức độ "đại diện cụm" thay vì
 * "1 câu/1 đơn vị" do khối lượng cực lớn — quyết định này đã ghi rõ lý do ở đầu mục, không phải bỏ sót
 * âm thầm. 48 câu trắc nghiệm (hy-41..hy-88), 12 dịch câu, 8 sắp xếp câu, 25 từ vựng.
 *
 *
 * KIỂM KÊ NỘI DUNG — hy-ch5 (食品調理・提供工程における適切な衛生管理のポイント, trang 31-34,
 * CHƯƠNG CUỐI Phần 2 衛生管理). Sau trang 34 chỉ còn mục "（参考）" không có nội dung text trích xuất
 * được (trang 35-36, tương tự trường hợp 参考４/５ ở sm-ch8 — khả năng cao là hình ảnh/đồ họa) rồi đến
 * trang bản quyền/lời cảm ơn kết thúc toàn bộ tài liệu.
 * ── （１）食材の適切な下処理と保管 — trang 31 ──
 *  ①包丁まな板布巾用途別専用 → hy-89, ro-hy5-1 | ②作業区域設備目的別配置 → LOẠI: nguyên tắc bố trí chung, không có số liệu riêng
 *  ③有害微生物増殖と二次汚染注意(具体的温度:肉魚10℃以下/生食魚介4℃以下/果実野菜10℃前後) → hy-90
 *  ④下処理使用器具の洗浄保管 → LOẠI: cùng cấu trúc với quy trình rửa/khử trùng đã kiểm tra ở hy-ch4
 * ── （２）食材の解凍と保管 — trang 31-32 ──
 *  ①表面温度を低く保つ(ドリップ抑制) → hy-91, tr-hy5-8, ro-hy5-2
 *  ②解凍法選択: 冷蔵庫内解凍(推奨) → hy-92 | 流水解凍 → LOẠI: giải pháp trung tính, không có điểm cấm/khuyến nghị đặc biệt
 *  電子レンジ解凍(ムラ注意) → hy-94 | 自然・室温解凍(CẤM) → hy-93, tr-hy5-2
 * ── （３）食材の加熱処理とその後の取扱い — trang 32-33 ──
 *  ①加熱調理の基本(75℃1分/二枚貝等85-90℃90秒) → LOẠI: trùng hoàn toàn với nguyên tắc "やっつける" đã kiểm tra ở hy-ch2 (sourcePage 4), không lặp lại để tránh trùng lặp thật sự giữa 2 chương
 *  ②芽胞形成菌に注意(ボツリヌス菌/ウエルシュ菌/セレウス菌、100℃でも死滅せず) → hy-95, tr-hy5-3, vc-hy5-4/5/6
 *  ③加熱調理後の冷却保管(危険温度帯10-60℃、大量調理施設衛生管理マニュアル30分以内20℃/1時間以内10℃) → hy-96, hy-97, tr-hy5-4, ro-hy5-3
 *  ④加熱後食品の温蔵保管(65℃以上) → hy-98 | ⑤加熱前後の二次汚染注意(専用器具) → hy-99, tr-hy5-5, ro-hy5-1(dùng chung ý với①)
 * ── （４）加熱工程のない食材の取扱い — trang 33 ──
 *  ①使用原材料の細菌を減らす(野菜果実流水洗浄+塩素系消毒剤) → hy-100
 *  ②調理段階での二次汚染防止(加工前手洗い、和える際手袋) → hy-101
 *  ③食材食品の冷却保管(危険温度帯回避、10℃以下) → LOẠI: cùng số liệu危険温度帯 đã kiểm tra ở hy-96, không lặp lại
 * ── （５）盛り付け作業 — trang 33-34 ──
 *  ①盛り付け前チェック項目(手洗い/冷却/清潔な台容器/不要物を置かない/マスク帽子手袋) → LOẠI: liệt kê checklist dài, ý chính (3要素quan trọng nhất) đã ở hy-102
 *  盛り付け3つの重要事項(有害微生物をつけない/食中毒菌を増やさない/異物混入を起こさない) → hy-102, ro-hy5-4
 *  ②盛り付け時留意点(素手禁止+使い捨て手袋+清潔な箸トング) → hy-103, tr-hy5-6
 *  手袋器具破損時の対応 → LOẠI: quy trình xử lý sự cố nhỏ, không phải kiến thức cốt lõi
 *  提供前の最終確認(不足品・異物) → hy-104
 * ── （６）調理済み食品の適切な取扱い — trang 34 ──
 *  ①汚染させない保管(フタ付き容器/ラップ、未加熱原材料との接触防止) → hy-105, tr-hy5-7, ro-hy5-5
 *  ②適した温度での保管(温蔵65℃以上/常温15-25℃/冷蔵10℃以下/冷凍-15℃以下) → hy-106
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 31-34 (chương調理・提供工程の衛生管理) đã có id câu hỏi hoặc
 * lý do loại bỏ tường minh (bao gồm 1 trường hợp trùng lặp thật sự với hy-ch2 đã chủ động không lặp lại).
 * Không còn dòng trống.
 *
 * === HOÀN TẤT PHẦN 2: 衛生管理 (Vệ sinh an toàn thực phẩm) — 5/5 chương (hy-ch1 → hy-ch5) ===
 *
 *
 * === BẮT ĐẦU PHẦN 3: 飲食物調理 (Chế biến món ăn/đồ uống) — otaff_3.pdf, 25 trang ===
 * Mục lục xác nhận qua PAGE 3 của bản trích xuất: 7 chương (ck-ch1→ck-ch7) + phụ lục
 * （参考）キッチン基本用語 (trang 18) ở cuối tài liệu.
 *
 * KIỂM KÊ NỘI DUNG — ck-ch1 (食材（原材料）に関する注意点, trang 1-5).
 * ── （１）肉類について — trang 1-2 ──
 *  ①肉類の主な種類: 牛肉部位名称の根拠(牛部分肉取引規格) → ck-1 | 豚肉の特徴(月齢若い、ばら肉以外均一) → ck-2
 *   鶏肉部位名称の根拠(食鶏小売規格) → ck-3
 *  ②保存や調理における注意点: 死後硬直→熟成→軟化のプロセス → ck-4 | 加熱による変性(60℃熱凝固) → ck-5
 *   柔らかくする方法(筋を切る/肉たたき/しょうが汁) → ck-6 | すね肉等コラーゲン分解 → ck-7
 *   うまみを逃さない加熱法(強火→弱火) → ck-8 | 結着肉の食中毒防止 → ck-9
 *  【肉の鮮度の見分け方】牛肉個別 → ck-10 | 豚肉・鶏肉個別 → ck-11 | 全肉類共通4項目 → ck-12
 *  【肉の保存の注意点】冷凍肉の緩慢解凍法+ドリップ汚染防止 → ck-13
 * ── （２）魚介類について — trang 2-3 ──
 *  魚介類の定義 → ck-14 | 旬の意味 → ck-15 | 加熱調理の基本(強火→弱火) → ck-16 | くさみを取る方法 → ck-17
 *  【魚の鮮度の見分け方】(NOT-listed形式で全項目網羅) → ck-18
 *  【魚の保存について】貝類が最も早く傷む → ck-19
 *  【魚の下ろし方】三枚おろし・五枚おろし+フグ処理資格 → ck-20, ck-21
 *  【魚の盛り付け方】一尾魚/切り身魚、和食/洋食 → ck-22
 * ── （３）野菜・果実類などについて — trang 3-4 ──
 *  流通野菜数(150種類)+分類 → ck-23 | 一般成分(水分80-90%等) → ck-24 | 生食vs加熱調理の量 → ck-25
 *  青菜のゆで方(クロロフィル) → ck-26 | ごぼう・れんこんの褐変防止 → ck-27 | 生野菜への塩 → ck-28
 *  【野菜の鮮度の見分け方】代表野菜7種の組み合わせ → ck-29
 *  【野菜の保存について】常温/冷蔵の使い分け+根葉の切り離し → ck-30
 * ── （４）国産食材について — trang 4-5 ──
 *  ①和牛について: 4品種の全体像 → ck-31 | 黒毛和牛(95%以上、脂肪交雑) → ck-32
 *   褐毛和種(熊本・高知) → ck-33 | 日本短角種(岩手) → ck-34 | 無角和種(山口) → ck-35
 *  ②主な伝統野菜: 定義+具体例リスト → ck-36 | 地域の食文化における役割 → ck-37
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 1-5 (chương食材（原材料）に関する注意点) đã có id câu hỏi.
 * Không còn dòng trống. 37 câu trắc nghiệm (ck-1..ck-37, correctIndex xoay vòng 0-1-2-3 chủ động ngay
 * từ lúc soạn để tránh lệch phân bố — rút kinh nghiệm từ các chương trước), 13 dịch câu (tr-ck1-1..13),
 * 9 sắp xếp câu (ro-ck1-1..9), 46 từ vựng (vc-ck1-1..46, correctIndex cũng xoay vòng chủ động).
 *
 *
 * KIỂM KÊ NỘI DUNG — ck-ch2 (下処理に関する注意点, trang 5-6, chương ngắn).
 * ── （１）下処理の目的 — trang 5 ──
 *  下処理の定義(洗浄/あく抜き/切れ目/乾物もどす) → ck-38 | 状態悪いと味・食感悪化 → ck-39
 *  下処理中の注意(微生物増やさない+二次汚染防止) → ck-40
 * ── （２）野菜の下処理について — trang 5 ──
 *  洗浄(汚れ少ないものから1枚ずつ+最後流水) → ck-41 | 葉物の洗い方(根元広げ丁寧に) → ck-42
 *  泥つきの洗い方(たわし+流水) → ck-43 | 水にさらす(いも類・なすのあく抜き) → ck-44
 *  酢水につける(れんこん・ごぼう白くなる) → ck-45 | 塩でもむ(きゅうり・キャベツ、浸透圧) → ck-46
 * ── （３）肉の下処理について — trang 5 ──
 *  筋に切れ目を入れる理由(加熱で縮み反り返る防止) → ck-47 | 肉たたきの効果(形整え縮まずやわらかい) → ck-48
 * ── （４）魚介類の下処理について — trang 5-6 (①-⑤の手順) ──
 *  ①うろこを落とす(尾→頭、専用取り器/包丁の背) → ck-49
 *  ②えらを取る(腹上えらぶた開き刃先で切る) → ck-50
 *  ③内臓をとりだす(切り身/尾頭付きの違い) → ck-51
 *  ④水洗い(手早く流水+水気ふきとる) → ck-52
 *  ⑤頭を取る(腹びれ後ろ→胸びれ後ろ斜めに中骨まで) → ck-53
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 5-6 (chương下処理に関する注意点) đã có id câu hỏi. Không còn
 * dòng trống. 16 câu trắc nghiệm (ck-38..ck-53, correctIndex xoay vòng đều 0-1-2-3, mỗi giá trị 4 câu),
 * 6 dịch câu (tr-ck2-1..6), 5 sắp xếp câu (ro-ck2-1..5), 20 từ vựng (vc-ck2-1..20, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — ck-ch3 (各調理方法に関する注意点, trang 6-7).
 * ── （１）加熱調理 — trang 6 ──
 *  調理の定義 → ck-54 | 調理計画の大切さ(効率+食材/エネルギー節約) → ck-55
 *  加熱調理の定義+効果(消化吸収・栄養) → ck-56
 *  茹でる → ck-57 | 煮る → ck-58 | 揚げる → ck-59 | 焼く → ck-60 | 炒める(複数食材の順番) → ck-61 | 蒸す → ck-62
 *  参考：油の劣化: 揚げ続けると酸化(色香り悪化+粘り+泡立ち) → ck-63
 *   劣化防止4点(NOT-listed形式で網羅: 空気/長時間加熱/直射日光/不純物) → ck-64
 * ── （２）非加熱調理 — trang 6-7 ──
 *  定義(混合撹拌冷却) → ck-65 | 交差汚染・二次汚染リスク高い理由 → ck-66
 *  混合・撹拌の定義 → ck-67 | 冷却の定義 → ck-68
 *  注意事項: 手で和える時手袋 → ck-69 | 菜箸トング洗浄済み/ボール洗浄済み/完成品ラップ冷蔵 → LOẠI: cùng cấu
 *   trúc quy tắc vệ sinh dụng cụ đã kiểm tra tương tự ở hy-ch4, không lặp lại chi tiết
 *  参考：凍結した食品の解凍: 生食用冷凍魚介類(低温時間かけ) → ck-70
 *   凍結前未加熱冷凍食品・フライ半製品(凍ったまま調理/レンジ) → ck-71
 *   野菜果実冷凍で歯ざわり失う+青菜類ブランチング理由で生食用冷凍品なし → ck-72
 * ── （３）調理計画について — trang 7 ──
 *  調理計画作成の目的 → ck-73 | 調理マニュアルの主な内容4項目(NOT-listed形式) → ck-74
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 6-7 (chương各調理方法に関する注意点) đã có id câu hỏi hoặc lý
 * do loại bỏ tường minh (1 cụm quy tắc vệ sinh dụng cụ trùng cấu trúc với nội dung đã kiểm tra ở hy-ch4).
 * Không còn dòng trống. 21 câu trắc nghiệm (ck-54..ck-74, correctIndex xoay vòng 0-1-2-3), 6 dịch câu
 * (tr-ck3-1..6), 6 sắp xếp câu (ro-ck3-1..6), 20 từ vựng (vc-ck3-1..20, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — ck-ch4 (調理機器、器具・備品などに関する注意点, trang 7-10).
 * Ghi chú phạm vi: "業務用の主な機器については、１号テキストを参照してください。２号テキストでは、
 * 主な機器の使用に関する注意点を紹介します。" — chương này CHỈ nói lưu ý khi SỬ DỤNG thiết bị, không dạy
 * vận hành cơ bản (thuộc giáo trình cấp 1, ngoài phạm vi app).
 * ── （１）調理機器について — trang 7-8 ──
 *  Dẫn nhập phạm vi → ck-75
 *  ①主な熱機器: tự động điều nhiệt+nhiệt kế không tiếp xúc → ck-76
 *   ガスレンジ:換気(CO中毒) → ck-77 | バーナー汚れ(trouble) → ck-78
 *   スチームコンベクションオーブン: 掃除手順 → ck-79 | やけど注意 → ck-80
 *   フライヤー: AV値基準 → ck-81
 *   その他(蒸し器/茹で麺器/グリドル/炊飯器/焼き物器/ジェットオーブン/回転釜 — 7 mục checklist, áp dụng "đại
 *   diện cụm": chọn mục炊飯器試食nghiêm ngặt nhất làm đại diện) → ck-82 (các mục còn lại LOẠI: cùng cấu
 *   trúc "kiểm tra thiết bị định kỳ", đã đại diện)
 *  ②主な冷機器: mục đích(bảo quản+cấp đông nhanh) → ck-83
 * ── 続き（１）調理機器について — trang 9 ──
 *  【冷蔵庫・冷凍庫】雑菌つきやすい箇所(扉パッキン等) → ck-84 | パッキン破損/冷却装置汚れ/庫内掃除 →
 *   LOẠI: cùng cấu trúc checklist vệ sinh tủ lạnh đã đại diện qua ck-84 | 氷用スコップ衛生管理 → ck-85
 *  ③主な洗浄・消毒機器: 食器回転数と売上直結 → ck-86 | 洗浄温度/すすぎ温度基準 → ck-87
 * ── （２）調理器具・備品について — trang 9-10 ──
 *  導入(食材直接触れるため清潔重要) → LOẠI: nguyên tắc chung, đã gộp trong explanationVi các câu liên quan
 *  【包丁、まな板】使い分け分類 → ck-88 | 鋼製包丁手入れ → ck-89 | まな板保管 → ck-90
 *  参考：包丁の種類(8種): 柳刃(刺身) → ck-91 | 出刃(魚さばく) → ck-92 | 菜切/薄刃(野菜用2種の違い) → ck-93
 *   牛刀/三徳(汎用2種の違い) → ck-94 | ペティナイフ/中華包丁 → LOẠI: cùng cấu trúc liệt kê đặc điểm dao
 *   chuyên dụng, đã đại diện đủ qua ck-91..94 (4/6 loại dao đã hỏi, còn lại giữ trong vc-ck4)
 *  【容器関係】スチールたわし禁止 → ck-95
 *  【フライパン・鍋】フッ素加工手入れ → ck-96 | 鉄フライパン手入れ → ck-97 | 鍋の素材選び基準 → ck-100
 * ── （３）計測機器類について — trang 10 ──
 *  精度管理の重要性 → ck-98 | 温度計校正の重要性(食中毒対策) → ck-99
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 7-10 (chương調理機器、器具・備品などに関する注意点) đã có id câu
 * hỏi hoặc lý do loại bỏ tường minh. Áp dụng "đại diện cụm" cho 2 danh sách liệt kê dày (7 mục checklist
 * thiết bị nhiệt khác, 6 loại dao chuyên dụng) — không phải bỏ sót. Không còn dòng trống. 26 câu trắc
 * nghiệm (ck-75..ck-100, correctIndex xoay vòng 0-1-2-3), 8 dịch câu (tr-ck4-1..8), 6 sắp xếp câu
 * (ro-ck4-1..6), 24 từ vựng (vc-ck4-1..24, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — ck-ch5 (労働安全衛生に関する注意点, trang 11-15).
 * Ghi chú kỹ thuật: đầu trang 15 (ngay sau "...で事業者に次の措置が義" ở cuối trang 14) xuất hiện một khối
 * ký tự lỗi font/encoding không đọc được (nhiều khả năng là biểu đồ/bảng số liệu 令和４年労働災害発生状況
 * bị OCR sai, tương tự trường hợp 参考４/５ ở sm-ch8 và （参考）ở hy-ch5) — không dùng làm nguồn trích dẫn,
 * chỉ dùng phần text thuần đọc được ngay sau đó ("務付けられています。" trở đi).
 * ── （１）飲食店の労働災害の発生状況 — trang 11 ──
 *  事故第1位「転倒」約3割 → ck-101 | 事故順位2-4位(切れこすれ/高温低温接触/動作反動) → ck-102
 *  全産業比較で高い類型(切れこすれ+高温低温接触、過去5年減少せず) → ck-103 | 若年層被災目立つ特徴 → ck-104
 * ── （２）飲食店における労働安全管理の必要性 — trang 11 ──
 *  現状課題(法令義務なし→取組不十分) → ck-105 | 防止策(担当者を決め取組) → ck-106
 * ── （３）危険の見える化 — trang 11-13 ──
 *  目的・効果(可視化→効果的安全活動) → ck-107 | できること(危険認識+注意喚起) → ck-108
 *  転倒/切傷の見える化写真例(濡れた床/グレーチング/包丁/シンク等) → LOẠI: caption ảnh minh họa lặp cấu trúc,
 *   ý chính "trực quan hóa nguy hiểm cụ thể" đã hỏi qua ck-107/108, không tách câu riêng cho từng caption
 *  見える化した作業マニュアル作成法 → ck-109 | やけど/腰痛の見える化例(荷物を体に近づける、đại diện) → ck-110
 *  ハザードマップ活用 → ck-111 | 定期的な従業員指導 → ck-112
 * ── （４）具体的な労働災害防止策 — trang 14-15 ──
 *  5S活動内容(整理整頓清掃清潔習慣) → ck-113
 *  「転倒」防止: 主原因(濡れ床の滑り+通路のつまづき) → ck-114 | 重い荷物運搬時のリスク低減策 → ck-115
 *  「切れ・こすれ」防止(NOT-listed形式で代表: 刃物目線/ゴム手袋/ゴミ袋鋭利物等) → ck-116
 *   プルトップ缶でも発生する注意 → ck-117
 *  「高温のものとの接触」防止: フライヤー防護具 → ck-118 | コーヒーフィルター高温注意 → ck-119
 *   熱湯寸胴鍋運搬時の転倒=火傷リスク → ck-120
 *   厨房内熱中症リスク → LOẠI: chỉ 1 câu nhắc nhở ngắn, không có số liệu/quy tắc cụ thể để trắc nghiệm
 *   hoá tốt, cùng tinh thần "cẩn thận môi trường nóng" với cụm 高温のものとの接触 đã hỏi ở trên
 *  【食品加工機械の法規制など】(労働安全衛生規則): 切断機・切削機の危険防止措置 → ck-121
 *   粉砕機/混合機/ロール機/成形機共通原則(NOT-listed形式で代表、機械停止義務) → ck-122
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 11-15 (chương労働安全衛生に関する注意点) đã có id câu hỏi hoặc lý
 * do loại bỏ tường minh (caption ảnh minh họa 見える化 lặp cấu trúc + 1 đoạn OCR lỗi không đọc được). Không
 * còn dòng trống. 22 câu trắc nghiệm (ck-101..ck-122, correctIndex xoay vòng 0-1-2-3), 8 dịch câu
 * (tr-ck5-1..8), 6 sắp xếp câu (ro-ck5-1..6), 20 từ vựng (vc-ck5-1..20, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — ck-ch6 (食品の流通, trang 15 — chương ngắn nhất Phần 3, chỉ 4 đơn vị nội dung).
 *  流通の定義 → ck-123 | 経由先の流れ(生産者→出荷事業者→卸売市場等→消費者) → ck-124
 *  卸売市場の6つの機能(NOT-listed形式) → ck-125 | 卸売市場の役割(安定供給システム) → ck-126
 *  飲食店の仕入先4種類(NOT-listed形式) → ck-127 | 業務用専門スーパーとは → ck-128
 *  卸売業者(通信販売も含む) → ck-129 | 仕入先選択の重要性(コンセプト+メリデメ) → ck-130
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 15 (chương食品の流通) đã có id câu hỏi. Không còn dòng trống.
 * 8 câu trắc nghiệm (ck-123..ck-130, correctIndex xoay vòng đều), 4 dịch câu (tr-ck6-1..4), 3 sắp xếp câu
 * (ro-ck6-1..3), 12 từ vựng (vc-ck6-1..12, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — ck-ch7 (食品添加物, trang 16-17) — CHƯƠNG CUỐI Phần 3.
 * ── Dẫn nhập — trang 16 ──
 *  食品添加物の定義 → ck-131 | 食品安全委員会の役割 → ck-132 | 指定添加物とは → ck-133
 *  4つの種類(NOT-listed形式) → ck-134
 * ── 添加物の種類と用途例（表、16項目） — trang 16-17 ──
 *  甘味料 → ck-135 | 着色料 → ck-136 | 保存料 → ck-137 | 増粘剤・安定剤・ゲル化剤・糊剤 → ck-138
 *  酸化防止剤 → ck-139 | 発色剤 → ck-140 | 漂白剤 → ck-141 | 防カビ剤 → ck-142 | 膨張剤 → ck-143
 *  香料 → ck-144 | 酸味料 → ck-145 | 調味料 → ck-146 | 豆腐用凝固剤 → ck-147 | 乳化剤 → ck-148
 *  栄養強化剤 → ck-149 | ガムベース → ck-150
 *  (Toàn bộ 16 dòng trong bảng đều có câu hỏi riêng — bảng ngắn gọn, mỗi dòng là 1 đơn vị kiến thức độc
 *  lập nên không cần "đại diện cụm"; các câu dịch/sắp xếp lấy từ đoạn văn dẫn nhập vì các dòng bảng là
 *  cụm từ rút gọn không đủ cấu trúc câu hoàn chỉnh để làm bài Sắp xếp câu tự nhiên.)
 * ── （参考）キッチン基本用語 — trang 18-19 (phụ lục cuối otaff_3.pdf) ──
 *  Khác với 参考４/５ ở sm-ch8 và （参考）ở hy-ch5 (không đọc được / hình ảnh), phụ lục này CÓ text đọc được
 *  đầy đủ — một từ điển thuật ngữ nhà bếp xếp theo abc (ア→ラ), khoảng 20 mục. Gộp 16 thuật ngữ tiêu biểu
 *  nhất vào từ vựng chương này (vc-ck7-17..32): アイテム, 洗い場, 完成品基準, キッチンヘルパー,
 *  キッチンレイアウト, 経時変化, 検品, コックレスキッチン, 在庫管理, 先入れ先出し, セントラルキッチン,
 *  棚卸し, バッシング, パントリー, ポーション, レシピ. Không tạo câu hỏi trắc nghiệm riêng cho phụ lục này vì
 *  nội dung mang tính định nghĩa thuật ngữ nghiệp vụ chung (không thuộc phạm vi 食品添加物 của chương),
 *  phù hợp với từ vựng hơn là trắc nghiệm hiểu bài.
 *
 * KẾT LUẬN: toàn bộ 16 dòng bảng + 4 đơn vị dẫn nhập (trang 16-17) đã có id câu hỏi; phụ lục trang 18-19
 * đã được xử lý bằng cách gộp vào từ vựng (không bỏ sót, đã ghi rõ lý do không tạo trắc nghiệm riêng).
 * Không còn dòng trống. 20 câu trắc nghiệm (ck-131..ck-150, correctIndex xoay vòng đều), 6 dịch câu
 * (tr-ck7-1..6), 3 sắp xếp câu (ro-ck7-1..3, ít hơn thường lệ vì nguồn chủ yếu là bảng liệt kê không có
 * câu hoàn chỉnh), 32 từ vựng (vc-ck7-1..32: 16 từ nhóm phụ gia + 16 từ phụ lục kitchen glossary).
 *
 * === HOÀN TẤT PHẦN 3: 飲食物調理 (Chế biến món ăn/đồ uống) — 7/7 chương (ck-ch1 → ck-ch7) ===
 *
 *
 * === BẮT ĐẦU PHẦN 4: 接客全般 (Tiếp khách tổng quát) — otaff_4.pdf, 27 trang ===
 * Mục lục xác nhận qua PAGE 3-4 của bản trích xuất: 5 chương (cs-ch1→cs-ch5) + phụ lục
 * （参考）サービス基本用語 (trang 20, chiếm 8 trang cuối tài liệu 20-27).
 *
 * KIỂM KÊ NỘI DUNG — cs-ch1 (接客に関する知識, trang 1-8 — CHƯƠNG LỚN NHẤT Phần 4, 8 trang).
 * Dẫn nhập vai trò店舗責任者/時間帯責任者 → cs-1, cs-2
 * ── （１）接客サービスについて — trang 1-2 ──
 *  ①おもてなし特性 → cs-3 | ②顧客満足(期待上回る/下回る) → cs-4 | ③QSCA定義 → cs-5
 *  料理の品質チェック(3項目、NOT-listed) → cs-6 | サービスチェック(11項目ア-ス, NOT-listed đại diện) → cs-7
 *  清潔感チェック(10項目ア-コ, NOT-listed đại diện) → cs-8 | 雰囲気チェック(4項目ア-エ, NOT-listed) → cs-9
 * ── （２）接客における基本動作 — trang 2-4 ──
 *  ニコニコハキハキキビキビ3原則 → cs-10 | ①あいさつ理由 → cs-11 | ②スマイル&アイコンタクト意味 → cs-12
 *  ③服装身だしなみ目的 → cs-13 | ④すれ違い時対応 → cs-14 | ⑤お辞儀基本 → cs-15
 * ── （３）食のマナーについて — trang 4 ──
 *  基本(社内基準どおり提供) → cs-16 | ①和食マナー(NOT-listed) → cs-17 | ②洋食マナー → cs-18
 *  ③中国料理マナー(NOT-listed) → cs-19
 * ── （４）配慮が必要なお客様への対応 — trang 5 ──
 *  基本姿勢(率先対応) → cs-20 | 転倒防止確認 → cs-21 | 他の配慮項目(NOT-listed) → cs-22
 * ── （５）適切な配膳について — trang 5-6 ──
 *  配膳のベストタイミング → cs-23 | お子様優先配膳 → cs-24 | テイクアウト渡し方 → cs-25
 * ── （６）接客基本用語とその使い方 — trang 6 ──
 *  ①接客用語の役目 → cs-26 | 敬語+態度目線表情一致 → cs-27 | ④サジェスティブセールス → cs-28
 *  ⑤電話対応 → cs-29 | ②③よく間違える用語/注意すべき言葉づかい → LOẠI: chỉ nêu quy trình phát hiện-sửa
 *  tại chỗ, không có nội dung cụ thể định lượng để trắc nghiệm hoá tốt
 * ── （７）サービスの優先順位 — trang 6-7 ──
 *  サービスの流れ8段階 → cs-30 | 優先順位6段階+理由 → cs-31
 * ── （８）顧客管理 — trang 7 ──
 *  カスタマーリレーションズ定義 → cs-32 | 参考:個人情報保護 → cs-33
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 1-7 (chương接客に関する知識) đã có id câu hỏi hoặc lý do loại bỏ
 * tường minh. Áp dụng "đại diện cụm" cho các checklist QSCA cực dày (11+10+4 mục) theo đúng nguyên tắc đã
 * dùng ở hy-ch4/ck-ch4. Không còn dòng trống. 33 câu trắc nghiệm (cs-1..cs-33, correctIndex xoay vòng
 * 0-1-2-3), 8 dịch câu (tr-cs1-1..8), 6 sắp xếp câu (ro-cs1-1..6), 24 từ vựng (vc-cs1-1..24, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — cs-ch2 (食に関する知識, trang 8-10).
 * Dẫn nhập: lý do cần kiến thức ẩm thực(客xem nhân viên là chuyên gia) → cs-34
 * ── （１）食物アレルギーについて — trang 8-9 ──
 *  Nguy cơ nghiêm trọng nhất(sốc phản vệ) → cs-35 | Lý do nắm rõ nguyên liệu → cs-36
 *  Cách xử lý nguy cơ nhiễm chéo(記載掲示情報提供) → cs-37 | Rủi ro thông tin sai(責任問題) → cs-38
 *  ア特定原材料8品目 → cs-39 | イそばうどん同じ釜 → cs-40
 * ── （２）お酒の取扱いについて — trang 9 ──
 *  ア-ウ 3 lưu ý(NOT-listed形式) → cs-41
 * ── （３）消費期限と賞味期限の違いについて — trang 9-10 ──
 *  消費期限定義 → cs-42 | 賞味期限定義 → cs-43 | どちらの管理をより厳しく → cs-44
 *  開封後の保証消失 → cs-45 | 開封後使用ルール → cs-46
 * ── （４）味覚について — trang 10 ──
 *  味クレーム対応 → cs-47 | 再発防止(原因究明+店内共有) → cs-48
 * ── （５）食の多様化について — trang 10 ──
 *  ハラールのアルコール制限 → cs-49 | ムスリムベジタリアン対応 → cs-50 | 食の多様化の概要 → cs-51
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 8-10 (chương食に関する知識) đã có id câu hỏi. Không còn dòng
 * trống. 18 câu trắc nghiệm (cs-34..cs-51, correctIndex xoay vòng đều), 6 dịch câu (tr-cs2-1..6), 4 sắp
 * xếp câu (ro-cs2-1..4), 16 từ vựng (vc-cs2-1..16, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — cs-ch3 (店舗管理に関する知識, trang 10-16).
 * ── （１）開店準備、閉店作業 — trang 10-11 ──
 *  Mục đích 2 công đoạn → cs-52 | ①開店準備: 空調機電源trước tiên → cs-53
 *  調理設備30分前 → cs-54 | BGM照明/従業員出勤/身だしなみ(NOT-listed đại diện) → cs-55 | 欠勤対応 → cs-56
 *  ②閉店作業: ラストオーダー調整 → cs-57 | レジ締め不足過金原因調査 → cs-58
 *  食材処理/火の元/セキュリティ(NOT-listed đại diện) → cs-59
 *  参考:フロア係の1日仕事の流れ例(trang 12) → LOẠI: hình ảnh/sơ đồ minh họa, không có text đọc được
 * ── （２）清掃作業（調理場以外） — trang 13 ──
 *  清潔感と来店動機 → cs-60 | ①清掃のポイント: 店舗責任者自ら指導理由 → cs-61
 *  モップ正しい使い方 → cs-62 | 洗剤希釈濃度 → cs-63 | 窓ガラススクイジー → cs-64 | 清掃スケジュール → cs-65
 *  参考:クレンリネス作業マニュアル例(trang 14) → LOẠI: hình ảnh minh họa, không có text đọc được
 * ── （３）現金とキャッシュレス決済の知識 — trang 16 ──
 *  釣銭在庫確認 → cs-66 | 新決済方法導入時対応 → cs-67
 * ── （４）レジ操作の重要さ — trang 16 ──
 *  現金有り高一致の重要性 → cs-68 | 誤差の意味 → cs-69 | 実際多い/少ない場合の違い → cs-70
 * ── （５）夜間金庫の対応 — trang 16 ──
 *  二人で投入する理由(防犯) → cs-71 | 翌日用釣銭の保管場所(店内金庫) → cs-72
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 10-16 (chương店舗管理に関する知識) đã có id câu hỏi hoặc lý do
 * loại bỏ tường minh (2 phụ lục hình ảnh/sơ đồ không có text đọc được, tương tự các phụ lục hình ảnh đã
 * gặp ở sm-ch8/hy-ch5). Không còn dòng trống. 21 câu trắc nghiệm (cs-52..cs-72, correctIndex xoay vòng
 * đều), 6 dịch câu (tr-cs3-1..6), 5 sắp xếp câu (ro-cs3-1..5), 16 từ vựng (vc-cs3-1..16, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — cs-ch4 (クレーム対応に関する知識, trang 16-18).
 * ── （１）お客様からのクレームへの対応 — trang 16-17 ──
 *  Vị trí của khiếu nại(tư liệu cải thiện chất lượng) → cs-73
 *  ①ア Báo cáo ngay + cửa hàng trưởng xử lý trực tiếp → cs-74 | イ Xin lỗi+tiễn khách lúc ra về → cs-75
 *  ウ Tài liệu tham khảo(参考１+特定技能1号) → cs-76
 *  ②クレーム対応のポイント(trang 17) → LOẠI: chỉ có tiêu đề + hình ảnh/sơ đồ minh họa, không có text đọc
 *  được (giống 2 phụ lục đã gặp ở cs-ch3)
 * ── （２）異物混入発生時の対応 — trang 18 ──
 *  ①基本対応: sự việc→xin lỗi ngay → cs-77
 *  ア Đa số khiếu nại là dị vật/tóc → cs-78 | tra nguồn lẫn+kiểm tra tác phong nhân viên → cs-79
 *  イ Lông khác(mi/mày/cơ thể) xác định nguồn+phổ biến toàn nhân viên → cs-80
 *  ウ Xác nhận làm lại/hủy hóa đơn → cs-81
 *  ②異物混入防止のポイント: ア đèn bẫy côn trùng hỏng → cs-82 | イ vị trí lắp đặt tránh thu hút → cs-83
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 16-18 (chương クレーム対応に関する知識) đã có id câu hỏi hoặc lý
 * do loại bỏ tường minh (1 phụ lục hình ảnh không đọc được). Không còn dòng trống. 11 câu trắc nghiệm
 * (cs-73..cs-83, correctIndex xoay vòng đều), 5 dịch câu (tr-cs4-1..5), 4 sắp xếp câu (ro-cs4-1..4),
 * 12 từ vựng (vc-cs4-1..12, xoay vòng đều).
 *
 *
 * KIỂM KÊ NỘI DUNG — cs-ch5 (緊急時の対応に関する知識, trang 18-19) — CHƯƠNG CUỐI CÙNG toàn bộ app.
 * ── （１）体調不良者が発生した場合の対応 — trang 18 ──
 *  Nguyên tắc cơ bản(bình tĩnh+theo chỉ dẫn người đi cùng) → cs-84
 *  Không có người đi cùng(còn tỉnh→theo ý khách/bất tỉnh→gọi cấp cứu) → cs-85
 *  Xử lý vật lý(không bế dậy, giữ nguyên tư thế) → cs-86
 * ── ①事例と主な対応方法 — trang 19 ──
 *  ア Động kinh(theo người đi cùng/không có→cấp cứu) → cs-87 | イ Ngừng tim(AED+cấp cứu đồng thời) → cs-88
 *  ウ Huấn luyện AED định kỳ → cs-89 | エ Tài liệu tham khảo(特定技能1号事例対応方法) → cs-90
 * ── （２）緊急時の行動基準 — trang 19 ──
 *  Chỉ là con trỏ tham chiếu("「店舗運営」のテキストに記載") → cs-91 (dạng câu hỏi về nguồn tham chiếu,
 *  không phải nội dung mới — nội dung thật đã nằm trọn trong sm-ch1..8 của Phần 1 rồi)
 * ── （参考）サービス基本用語 — trang 20-21 (phụ lục CUỐI CÙNG toàn bộ app) ──
 *  Khác các phụ lục hình ảnh trước, phụ lục này CÓ text đọc được đầy đủ (giống trường hợp ck-ch7). Gộp
 *  19 thuật ngữ tiêu biểu vào từ vựng (vc-cs5-13..31): アイドルタイム, カフェテリア, 客席レイアウト,
 *  客層, 苦情処理, 口コミ, クレンリネス, サービスステーション, サービングタイム, サイドワーク,
 *  サジェスティブセールス, CS(カスタマーサティスファクション), 主力商品, テーブルサービス,
 *  テーブルセッティング, 同時同卓提供, ピークタイム, フェア, 来店頻度. (ホスピタリティ đã có ở cs-ch1,
 *  không lặp lại). Không tạo câu hỏi trắc nghiệm riêng vì đây là từ điển thuật ngữ nghiệp vụ chung, phù
 *  hợp từ vựng hơn trắc nghiệm hiểu bài — cùng cách xử lý đã áp dụng cho phụ lục ck-ch7.
 *
 * KẾT LUẬN: toàn bộ đơn vị nội dung trang 18-19 (chương緊急時の対応に関する知識) đã có id câu hỏi hoặc lý
 * do xử lý tường minh (mục (2) là con trỏ tham chiếu, phụ lục cuối đã gộp vào từ vựng). Không còn dòng
 * trống. 8 câu trắc nghiệm (cs-84..cs-91, correctIndex xoay vòng đều), 4 dịch câu (tr-cs5-1..4), 3 sắp
 * xếp câu (ro-cs5-1..3), 31 từ vựng (vc-cs5-1..31: 12 từ nội dung chính + 19 từ phụ lục cuối).
 *
 * === HOÀN TẤT PHẦN 4: 接客全般 (Tiếp khách tổng quát) — 5/5 chương (cs-ch1 → cs-ch5) ===
 * === HOÀN TẤT TOÀN BỘ APP /dac-dinh — 25/25 CHƯƠNG (Phần 1→4, sm/hy/ck/cs) ===
 */
export const QUESTIONS: QuizQuestion[] = [
  {
    id: "sm-1",
    chapterId: "sm-ch1",
    questionJa: "外食産業の成功に必要な「QSC」とは何の頭文字か。",
    questionVi: "\"QSC\" — yếu tố cần thiết để thành công trong ngành dịch vụ ăn uống — là viết tắt của gì?",
    options: [
      { ja: "Quantity（量）・Speed（速度）・Cost（コスト）", vi: "Số lượng · Tốc độ · Chi phí" },
      { ja: "Quality（品質）・Safety（安全）・Comfort（快適さ）", vi: "Chất lượng · An toàn · Thoải mái" },
      { ja: "Quality（品質）・Service（サービス）・Cleanliness（清潔さ）", vi: "Chất lượng · Dịch vụ · Sạch sẽ" },
      { ja: "Quick（早さ）・Service（サービス）・Clean（清潔）", vi: "Nhanh · Dịch vụ · Sạch" },
    ],
    correctIndex: 2,
    explanationVi:
      "QSC = Quality (chất lượng món ăn) + Service (dịch vụ tận tâm) + Cleanliness (sạch sẽ). Đây là 3 yếu tố cốt lõi để thành công trong ngành ăn uống, theo tài liệu OTAFF.",
    sourceQuoteJa:
      "外食産業として成功するためには、QSC（Quality＝商品の品質、Service＝心のこもったサービス、Cleanliness＝清潔さ）が不可欠です。",
    sourcePage: 1,
  },
  {
    id: "sm-2",
    chapterId: "sm-ch1",
    questionJa: "QSCA+Hの「A」と「H」は何を表すか。",
    questionVi: "Trong mô hình \"QSCA+H\", chữ \"A\" và \"H\" đại diện cho điều gì?",
    options: [
      { ja: "A＝Atmosphere（雰囲気）、H＝Hospitality（おもてなしの心）", vi: "A = Bầu không khí cửa hàng, H = Tinh thần phục vụ tận tâm" },
      { ja: "A＝Advertising（広告）、H＝Hygiene（衛生）", vi: "A = Quảng cáo, H = Vệ sinh" },
      { ja: "A＝Attitude（態度）、H＝Habit（習慣）", vi: "A = Thái độ, H = Thói quen" },
      { ja: "A＝Ambition（意欲）、H＝Harmony（調和）", vi: "A = Ý chí, H = Sự hài hòa" },
    ],
    correctIndex: 0,
    explanationVi:
      "Ngoài QSC, cửa hàng còn cần Atmosphere (bầu không khí, ánh sáng, âm nhạc phù hợp với mô hình quán) và Hospitality (tinh thần đặt niềm vui của khách làm niềm vui của mình).",
    sourceQuoteJa: "外食産業を成功させるために必要なものはQSCA+Hです。",
    sourcePage: 1,
  },
  {
    id: "sm-7",
    chapterId: "sm-ch1",
    questionJa: "時間帯責任者の職能に含まれるものはどれか。",
    questionVi: "Trách nhiệm của \"người phụ trách theo khung giờ\" (時間帯責任者) bao gồm điều gì?",
    options: [
      { ja: "本部の年間経営計画の策定", vi: "Lập kế hoạch kinh doanh năm cho trụ sở chính" },
      { ja: "全店舗の原価率を決定すること", vi: "Quyết định tỷ lệ giá vốn cho toàn bộ chuỗi cửa hàng" },
      { ja: "新規出店場所の選定", vi: "Chọn địa điểm mở cửa hàng mới" },
      { ja: "対象時間帯のQSCスタンダード維持と従業員の育成・トレーニング", vi: "Duy trì tiêu chuẩn QSC và đào tạo nhân viên trong khung giờ phụ trách" },
    ],
    correctIndex: 3,
    explanationVi:
      "時間帯責任者 (người phụ trách theo khung giờ, thay mặt cửa hàng trưởng) có 2 vai trò: duy trì QSC standard trong khung giờ đó, và quản lý nhân sự (đào tạo, phân công) trong khung giờ đó.",
    sourceQuoteJa:
      "時間帯責任者は、店舗オペレーションのデイリーワークの中で時間帯における店長の職務を代行する人です。",
    sourcePage: 1,
  },
  {
    id: "sm-3",
    chapterId: "sm-ch2",
    questionJa: "「人時売上高」の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Doanh thu theo giờ công\" (人時売上高) nào sau đây là đúng?",
    options: [
      { ja: "客数 ÷ 総労働時間", vi: "Số khách ÷ Tổng giờ lao động" },
      { ja: "売上高 ÷ 総労働時間", vi: "Doanh thu ÷ Tổng giờ lao động" },
      { ja: "荒利益 ÷ 総労働時間", vi: "Lợi nhuận gộp ÷ Tổng giờ lao động" },
      { ja: "売上高 ÷ 客数", vi: "Doanh thu ÷ Số khách" },
    ],
    correctIndex: 1,
    explanationVi:
      "人時売上高 (doanh thu theo giờ công) = Doanh thu 1 ngày ÷ Tổng giờ lao động 1 ngày. Chỉ số này cho biết 1 nhân viên làm việc 1 giờ tạo ra bao nhiêu doanh thu — càng cao càng tốt.",
    sourceQuoteJa: "１日の売上高÷１日の総労働時間=人時売上高",
    sourcePage: 3,
  },
  {
    id: "sm-4",
    chapterId: "sm-ch2",
    questionJa: "「労働分配率」の適正値（フードサービス業）として正しい範囲はどれか。",
    questionVi: "Giá trị hợp lý của \"Tỷ lệ phân phối lao động\" (労働分配率) trong ngành dịch vụ ăn uống là bao nhiêu?",
    options: [
      { ja: "10〜20%", vi: "10~20%" },
      { ja: "25〜30%", vi: "25~30%" },
      { ja: "50〜60%", vi: "50~60%" },
      { ja: "35〜40%", vi: "35~40%" },
    ],
    correctIndex: 3,
    explanationVi:
      "労働分配率 = Nhân công phí ÷ Lợi nhuận gộp. Giá trị hợp lý là 35~40%. Nếu vượt 45% thì kinh doanh khó khăn, trên 50% là cực kỳ nguy hiểm.",
    sourceQuoteJa:
      "フードサービス業の適正値は３５～４０％であり、この範囲内であれば継続企業として安定成長が可能となります。",
    sourcePage: 4,
  },
  {
    id: "sm-5",
    chapterId: "sm-ch2",
    questionJa: "原価率管理の3つのポイントに含まれないものはどれか。",
    questionVi: "Điều nào KHÔNG nằm trong 3 điểm quan trọng để quản lý tỷ lệ giá vốn (原価率管理)?",
    options: [
      { ja: "客単価を上げる", vi: "Tăng đơn giá trung bình mỗi khách" },
      { ja: "ポーション（既定の食材使用量）を守る", vi: "Tuân thủ định lượng nguyên liệu tiêu chuẩn (Portion)" },
      { ja: "廃棄ロスを減らす", vi: "Giảm hao hụt do bỏ đi (Loss)" },
      { ja: "棚卸ミスをなくす", vi: "Không để sai sót khi kiểm kê (tồn kho)" },
    ],
    correctIndex: 0,
    explanationVi:
      "3 điểm quản lý tỷ lệ giá vốn là: giữ đúng định lượng (ポーション), giảm hao hụt (廃棄ロス), không sai sót kiểm kê (棚卸ミス). Tăng đơn giá khách hàng thuộc về quản lý doanh thu, không phải quản lý giá vốn.",
    sourceQuoteJa:
      "原価率管理のポイントは　ア．ポーションを守る　イ．廃棄ロスを減らす　ウ．棚卸ミスをなくす　の３点です。",
    sourcePage: 5,
  },
  {
    id: "sm-6",
    chapterId: "sm-ch2",
    questionJa: "原価率差異の適正範囲（基準値）はどれか。",
    questionVi: "Phạm vi chênh lệch tỷ lệ giá vốn (giữa tiêu chuẩn và thực tế) được coi là bình thường là bao nhiêu?",
    options: [
      { ja: "±0.1%以内", vi: "Trong khoảng ±0.1%" },
      { ja: "±2.0%以内", vi: "Trong khoảng ±2.0%" },
      { ja: "±0.5%以内", vi: "Trong khoảng ±0.5%" },
      { ja: "±5.0%以内", vi: "Trong khoảng ±5.0%" },
    ],
    correctIndex: 2,
    explanationVi:
      "Chênh lệch giữa tỷ lệ giá vốn tiêu chuẩn (あるべき原価率) và tỷ lệ giá vốn thực tế được coi là bình thường nếu nằm trong khoảng ±0.5%. Vượt ngưỡng này cần tìm nguyên nhân và có biện pháp khắc phục.",
    sourceQuoteJa: "この差異の適正範囲は±０.５%が基準値です。",
    sourcePage: 5,
  },
  {
    id: "sm-8",
    chapterId: "sm-ch2",
    questionJa: "1日の平均客単価が1,200円以下の業態（ファストフードなど）で、労働時間をコントロールする際に基準とする指標はどれか。",
    questionVi: "Với mô hình đơn giá khách trung bình ≤1.200 yên/ngày (fast food...), chỉ số nào được dùng làm cơ sở để kiểm soát giờ lao động?",
    options: [
      { ja: "人時売上高", vi: "Doanh thu mỗi giờ công (人時売上高)" },
      { ja: "人時接客数", vi: "Số khách phục vụ mỗi giờ công (人時接客数)" },
      { ja: "原価率", vi: "Tỷ lệ giá vốn" },
      { ja: "労働分配率", vi: "Tỷ lệ phân phối lao động" },
    ],
    correctIndex: 1,
    explanationVi:
      "Với mô hình đơn giá thấp (≤1.200 yên), người ta dùng 人時接客数 (số khách phục vụ/giờ công) làm cơ sở lập lịch làm việc. Với mô hình đơn giá cao (>1.800 yên, có rượu, sushi cao cấp...) thì dùng 人時売上高.",
    sourceQuoteJa:
      "１日の平均客単価が１，２００円以下でオペレーションを重視するファストフードやカフェ、ファミリーレストランなどの業態の場合は人時接客数を…基準としてオペレーションが組まれます。",
    sourcePage: 5,
  },
  {
    id: "sm-9",
    chapterId: "sm-ch2",
    questionJa: "客単価を上げるための具体的な方法はどれか。",
    questionVi: "Cách cụ thể nào giúp tăng đơn giá trung bình mỗi khách (客単価)?",
    options: [
      { ja: "サジェスティブセールス（お勧め販売）で注文点数を増やす", vi: "Gợi ý bán thêm (Suggestive Selling) để tăng số món khách gọi" },
      { ja: "廃棄ロスを減らす", vi: "Giảm hao hụt do bỏ đi" },
      { ja: "棚卸しの精度を上げる", vi: "Tăng độ chính xác khi kiểm kê" },
      { ja: "労働分配率を下げる", vi: "Giảm tỷ lệ phân phối lao động" },
    ],
    correctIndex: 0,
    explanationVi:
      "客単価 = Số món gọi × Đơn giá trung bình mỗi món. Gợi ý thêm món (ví dụ tráng miệng sau bữa ăn) giúp tăng số món gọi, từ đó tăng đơn giá khách một cách tự nhiên, không gây khó chịu vì khách tự quyết định gọi thêm.",
    sourceQuoteJa:
      "来店されたお客様に積極的に推奨メニューをお勧め（サジェスティブセールス）します。",
    sourcePage: 6,
  },
  {
    id: "sm-10",
    chapterId: "sm-ch2",
    questionJa: "固定客のリピート率を上げるために重要なことはどれか。",
    questionVi: "Điều gì quan trọng để tăng tỷ lệ quay lại (Repeat rate) của khách quen (固定客)?",
    options: [
      { ja: "客単価をできるだけ高く設定する", vi: "Đặt đơn giá khách càng cao càng tốt" },
      { ja: "新規顧客の獲得だけに集中する", vi: "Chỉ tập trung thu hút khách mới" },
      { ja: "Q（品質）・S（サービス）・C（清潔感）をブラッシュアップする", vi: "Không ngừng nâng cao Chất lượng · Dịch vụ · Cảm giác sạch sẽ (QSC)" },
      { ja: "労働分配率を50%以上に上げる", vi: "Tăng tỷ lệ phân phối lao động lên trên 50%" },
    ],
    correctIndex: 2,
    explanationVi:
      "Để giữ chân khách quen quay lại, cần liên tục cải thiện QSC (chất lượng, dịch vụ, sạch sẽ). Khách mới cũng tăng lên nhờ truyền miệng/SNS khi tỷ lệ quay lại của khách quen tăng.",
    sourceQuoteJa:
      "固定客のリピート率を上げるためにはQ（品質）S（サービスの質）C（清潔感）をブラッシュアップする努力が必要です。",
    sourcePage: 6,
  },
  {
    id: "sm-11",
    chapterId: "sm-ch1",
    questionJa: "損益分岐点を超え、長年にわたり経営を継続するために唯一の方法はどれか。",
    questionVi: "Để vượt qua điểm hòa vốn và duy trì kinh doanh lâu dài, phương pháp duy nhất được nêu là gì?",
    options: [
      { ja: "商圏を毎年拡大すること", vi: "Mở rộng khu vực thương mại mỗi năm" },
      { ja: "商圏内のお客様に繰り返し来店してもらうこと", vi: "Để khách trong khu vực thương mại quay lại nhiều lần" },
      { ja: "客単価を可能な限り下げること", vi: "Hạ đơn giá khách xuống thấp nhất có thể" },
      { ja: "新商品を毎月発売すること", vi: "Ra mắt sản phẩm mới mỗi tháng" },
    ],
    correctIndex: 1,
    explanationVi:
      "Ngoài việc để khách trong khu vực thương mại quay lại nhiều lần, tài liệu nêu rõ không có cách nào khác để vượt điểm hòa vốn và duy trì kinh doanh lâu dài.",
    sourceQuoteJa:
      "それでも損益分岐点を超え、長年にわたり経営を継続するには商圏内のお客様に繰り返し来店してもらう以外に方法はありません。",
    sourcePage: 1,
  },
  {
    id: "sm-12",
    chapterId: "sm-ch1",
    questionJa: "外食産業の店舗責任者の呼称に含まれないものはどれか。",
    questionVi: "Chức danh nào sau đây KHÔNG được liệt kê là một trong các \"người chịu trách nhiệm cửa hàng\"?",
    options: [
      { ja: "本部長", vi: "Trưởng bộ phận trụ sở chính" },
      { ja: "店長", vi: "Cửa hàng trưởng" },
      { ja: "店長代理", vi: "Người đại diện cửa hàng trưởng" },
      { ja: "時間帯責任者", vi: "Người phụ trách theo khung giờ" },
    ],
    correctIndex: 0,
    explanationVi:
      "Tài liệu chỉ liệt kê 4 chức danh: 店長 (cửa hàng trưởng), 副店長 (phó cửa hàng trưởng), 店長代理 (người đại diện), 時間帯責任者 (phụ trách theo khung giờ). \"本部長\" không thuộc danh sách này.",
    sourceQuoteJa:
      "外食産業の店舗の運営について責任のある人（店舗責任者）は、店長、副店長、店長代理、時間帯責任者などと呼ばれています。",
    sourcePage: 1,
  },
  {
    id: "sm-13",
    chapterId: "sm-ch1",
    questionJa: "時間帯責任者のマネジメント業務に含まれないものはどれか。",
    questionVi: "Điều nào sau đây KHÔNG thuộc công việc quản lý (マネジメント) của người phụ trách theo khung giờ?",
    options: [
      { ja: "原価管理に関する発注・検品収納管理", vi: "Quản lý giá vốn: đặt hàng, kiểm nhận và nhập kho" },
      { ja: "顧客管理（クレーム対応など）", vi: "Quản lý khách hàng (xử lý khiếu nại...)" },
      { ja: "新規出店の意思決定", vi: "Quyết định mở cửa hàng mới" },
      { ja: "人件費に関する時間管理や不足要員の手配", vi: "Quản lý giờ công và sắp xếp nhân sự khi thiếu người" },
    ],
    correctIndex: 2,
    explanationVi:
      "4 mảng quản lý của người phụ trách khung giờ là: giá vốn (đặt hàng/kiểm hàng), chi phí điện nước, quan hệ khách hàng, giờ công nhân sự. Quyết định mở cửa hàng mới thuộc thẩm quyền cấp cao hơn, không nằm trong phạm vi này.",
    sourceQuoteJa:
      "※上記のマネジメントとは、原価管理に関する発注・検品収納管理、水道光熱費などコスト管理、顧客管理（カスタマリーリレーションやクレーム対応）、人件費に関する時間管理や不足要員の手配などです。",
    sourcePage: 1,
  },
  {
    id: "sm-14",
    chapterId: "sm-ch1",
    questionJa: "QSCのQ（クオリティ）優先順位で、ランチタイムに料理を提供する目安時間はどれか。",
    questionVi: "Theo thứ tự ưu tiên Q (Chất lượng), thời gian tiêu chuẩn để phục vụ món ăn vào bữa trưa là bao lâu?",
    options: [
      { ja: "3〜5分以内", vi: "Trong 3-5 phút" },
      { ja: "6〜8分以内", vi: "Trong 6-8 phút" },
      { ja: "10〜15分以内", vi: "Trong 10-15 phút" },
      { ja: "20分以内", vi: "Trong 20 phút" },
    ],
    correctIndex: 1,
    explanationVi: "Tiêu chuẩn Q ưu tiên số 3 quy định: bữa trưa (ランチ) phục vụ trong 6-8 phút, bữa tối (ディナー) trong 12 phút.",
    sourceQuoteJa:
      "早く出す・・・ランチ6～8分以内、ディナー12分以内（居酒屋、焼き肉店などは最初の1品が5分以内）",
    sourcePage: 2,
  },
  {
    id: "sm-15",
    chapterId: "sm-ch1",
    questionJa: "居酒屋や焼肉店など業態で、最初の1品を提供する目安時間はどれか。",
    questionVi: "Với mô hình như quán nhậu, quán nướng thịt..., thời gian tiêu chuẩn phục vụ món đầu tiên là bao lâu?",
    options: [
      { ja: "1分以内", vi: "Trong 1 phút" },
      { ja: "5分以内", vi: "Trong 5 phút" },
      { ja: "10分以内", vi: "Trong 10 phút" },
      { ja: "15分以内", vi: "Trong 15 phút" },
    ],
    correctIndex: 1,
    explanationVi: "Với quán nhậu, quán nướng thịt, món đầu tiên cần được phục vụ trong vòng 5 phút — nhanh hơn mức chung 6-8 phút của bữa trưa thông thường.",
    sourceQuoteJa:
      "早く出す・・・ランチ6～8分以内、ディナー12分以内（居酒屋、焼き肉店などは最初の1品が5分以内）",
    sourcePage: 2,
  },
  {
    id: "sm-16",
    chapterId: "sm-ch1",
    questionJa: "S（サービス）の優先順位で最初に来るものはどれか。",
    questionVi: "Trong thứ tự ưu tiên S (Dịch vụ), điều gì được xếp hạng đầu tiên?",
    options: [
      { ja: "声（発声）・・・ハキハキ", vi: "Giọng nói dứt khoát, rõ ràng" },
      { ja: "笑顔（スマイル＆ハッスル）・・・ニコニコ", vi: "Nụ cười tươi" },
      { ja: "動作（姿勢、動き）・・・キビキビ、テキパキ", vi: "Động tác nhanh nhẹn, dứt khoát" },
      { ja: "定型サービス（基本）（スマイル＆アイコンタクト）", vi: "Dịch vụ tiêu chuẩn cơ bản (mỉm cười & giao tiếp mắt)" },
    ],
    correctIndex: 3,
    explanationVi: "Ưu tiên S số 1 là 定型サービス — dịch vụ tiêu chuẩn cơ bản với mỉm cười và giao tiếp bằng ánh mắt.",
    sourceQuoteJa:
      "S（サービス）の優先順位　1.定型サービス（基本）（スマイル＆アイコンタクト）　2.声（発生）・・・ハキハキ　3.笑顔（スマイル＆ハッスル）・・・ニコニコ　4.動作（姿勢、動き）・・・キビキビ、テキパキ　5.気配り（愛）",
    sourcePage: 2,
  },
  {
    id: "sm-17",
    chapterId: "sm-ch1",
    questionJa: "C（クリンリネス）の優先順位で最初に来るものはどれか。",
    questionVi: "Trong thứ tự ưu tiên C (Sạch sẽ), điều gì được xếp hạng đầu tiên?",
    options: [
      { ja: "みだしなみ", vi: "Tác phong, trang phục chỉnh tề" },
      { ja: "拾い取る、掃き取る、拭き取る", vi: "Nhặt, quét, lau" },
      { ja: "週間清掃作業の徹底", vi: "Triệt để dọn dẹp hàng tuần" },
      { ja: "メンテナンス", vi: "Bảo trì, bảo dưỡng" },
    ],
    correctIndex: 0,
    explanationVi: "Ưu tiên C số 1 là みだしなみ — tác phong và trang phục chỉnh tề của nhân viên.",
    sourceQuoteJa:
      "C（クリンリネス）の優先順位　1.みだしなみ　2.拾い取る、掃き取る、拭き取る　3.週間清掃作業の徹底　4.メンテナンス　5.気配り（愛）",
    sourcePage: 2,
  },
  {
    id: "sm-18",
    chapterId: "sm-ch1",
    questionJa: "生産性アップのため、今後ロボット化がさらに進行するとされる作業はどれか。",
    questionVi: "Để tăng năng suất, công việc nào được dự đoán sẽ tiếp tục được robot hóa trong tương lai?",
    options: [
      { ja: "接客サービス全般", vi: "Toàn bộ dịch vụ tiếp khách" },
      { ja: "ホスピタリティ", vi: "Tinh thần hiếu khách" },
      { ja: "料理運びや下げもの（バッシング）など", vi: "Bưng bê món ăn, dọn bàn..." },
      { ja: "経営判断", vi: "Ra quyết định kinh doanh" },
    ],
    correctIndex: 2,
    explanationVi: "Robot hóa được dự đoán tiến triển ở các công việc thao tác như bưng món và dọn bàn, còn dịch vụ mang tính con người (Hospitality) vẫn quan trọng.",
    sourceQuoteJa:
      "生産性アップのため料理運びや下げもの（バッシング）など、作業に関してはロボット化がさらに進行します。",
    sourcePage: 1,
  },
  {
    id: "sm-19",
    chapterId: "sm-ch1",
    questionJa: "自店のQSCスタンダードを維持するだけでなく、より向上させることで可能となることは何か。",
    questionVi: "Việc không chỉ duy trì mà còn nâng cao hơn nữa tiêu chuẩn QSC của cửa hàng sẽ giúp đạt được điều gì?",
    options: [
      { ja: "原価率を下げること", vi: "Giảm tỷ lệ giá vốn" },
      { ja: "労働時間を短縮すること", vi: "Rút ngắn giờ lao động" },
      { ja: "家賃を下げること", vi: "Giảm tiền thuê mặt bằng" },
      { ja: "客数を増加させること", vi: "Tăng số lượng khách" },
    ],
    correctIndex: 3,
    explanationVi: "Xây dựng và không ngừng nâng cao tiêu chuẩn QSC giúp tăng số lượng khách đến cửa hàng.",
    sourceQuoteJa:
      "どんな業種・業態でも自店のあるべきQSCのスタンダード（基準とすべきレベル）をつくり、それを維持することはもちろん、より向上させることで、客数を増加させることが可能となるのです。",
    sourcePage: 1,
  },
  {
    id: "sm-20",
    chapterId: "sm-ch1",
    questionJa: "C＝クリンリネス（清潔な状態）のベースとなるものは何か。",
    questionVi: "Nền tảng của C = Clinliness (trạng thái sạch sẽ) là gì?",
    options: [
      { ja: "高価な清掃用具の導入", vi: "Đầu tư dụng cụ vệ sinh đắt tiền" },
      { ja: "清掃作業や補充点検作業の徹底", vi: "Triệt để công việc dọn dẹp và kiểm tra bổ sung hàng hóa" },
      { ja: "週1回の大掃除のみ", vi: "Chỉ tổng vệ sinh 1 lần/tuần" },
      { ja: "外部業者への完全委託", vi: "Giao khoán hoàn toàn cho đơn vị bên ngoài" },
    ],
    correctIndex: 1,
    explanationVi: "Trạng thái sạch sẽ (C) có nền tảng là việc triệt để thực hiện công việc dọn dẹp và kiểm tra/bổ sung hàng hóa hàng ngày.",
    sourceQuoteJa:
      "それらのベースとなるのは、清掃作業や補充点検作業の徹底による、あるべき店内環境C＝クリンリネス（清潔な状態）です。",
    sourcePage: 2,
  },
  {
    id: "sm-21",
    chapterId: "sm-ch1",
    questionJa: "時間帯責任者が日々のオペレーションの中で維持・徹底すべきこととして正しい組み合わせはどれか。",
    questionVi: "Trong vận hành hàng ngày, người phụ trách khung giờ cần duy trì và triệt để thực hiện điều gì?",
    options: [
      { ja: "原価率を毎日変更すること", vi: "Thay đổi tỷ lệ giá vốn mỗi ngày" },
      { ja: "Q＝商品のクオリティのスタンダードを維持、S＝接客サービスのスタンダードを教育・トレーニングして徹底", vi: "Duy trì tiêu chuẩn Q (chất lượng món ăn), giáo dục/huấn luyện triệt để tiêu chuẩn S (dịch vụ tiếp khách)" },
      { ja: "給与を毎日計算すること", vi: "Tính lương mỗi ngày" },
      { ja: "新メニューを毎日開発すること", vi: "Phát triển thực đơn mới mỗi ngày" },
    ],
    correctIndex: 1,
    explanationVi:
      "Ngoài việc duy trì nền tảng C (Clinliness) qua dọn dẹp, người phụ trách khung giờ còn phải hàng ngày duy trì tiêu chuẩn Q (chất lượng sản phẩm) và huấn luyện triệt để tiêu chuẩn S (dịch vụ tiếp khách) cho nhân viên.",
    sourceQuoteJa:
      "時間帯責任者として日々のオペレーションの中で、自店のQ＝商品のクオリティ（品質）のスタンダードを維持。更にマニュアルにあるS＝接客サービスのスタンダードを教育・トレーニングして徹底する必要があります。",
    sourcePage: 2,
  },
  {
    id: "sm-22",
    chapterId: "sm-ch2",
    questionJa: "店舗責任者がコントロールできる指数に含まれないものはどれか。",
    questionVi: "Chỉ số nào KHÔNG nằm trong nhóm chỉ số mà người quản lý cửa hàng có thể kiểm soát trực tiếp?",
    options: [
      { ja: "人時売上高", vi: "Doanh thu mỗi giờ công" },
      { ja: "原価率", vi: "Tỷ lệ giá vốn" },
      { ja: "客単価", vi: "Đơn giá trung bình mỗi khách" },
      { ja: "施設費（家賃）", vi: "Chi phí thiết bị/mặt bằng (tiền thuê)" },
    ],
    correctIndex: 3,
    explanationVi:
      "6 chỉ số quản lý cửa hàng có thể kiểm soát là: 人時売上高, 人時生産性, 原価率, 人時接客数, 客数, 客単価. Tiền thuê mặt bằng là chi phí cố định, không thuộc nhóm này.",
    sourceQuoteJa:
      "それらの中で店舗責任者がコントロールできるものは、人時売上高、人時生産性、原価率、人時接客数（接客生産性）、客数、客単価です。",
    sourcePage: 3,
  },
  {
    id: "sm-23",
    chapterId: "sm-ch2",
    questionJa: "「人時接客数」の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Số khách phục vụ mỗi giờ công\" (人時接客数) nào đúng?",
    options: [
      { ja: "売上高÷総労働時間", vi: "Doanh thu ÷ Tổng giờ lao động" },
      { ja: "荒利益÷総労働時間", vi: "Lợi nhuận gộp ÷ Tổng giờ lao động" },
      { ja: "客数÷総労働時間数", vi: "Số khách ÷ Tổng giờ lao động" },
      { ja: "客数÷客単価", vi: "Số khách ÷ Đơn giá khách" },
    ],
    correctIndex: 2,
    explanationVi: "人時接客数 = Số khách ÷ Tổng giờ lao động — cho biết 1 nhân viên phục vụ được bao nhiêu khách trong 1 giờ.",
    sourceQuoteJa: "客数÷総労働時間数＝人時接客数",
    sourcePage: 3,
  },
  {
    id: "sm-24",
    chapterId: "sm-ch2",
    questionJa: "一般的に人時接客数が高くなる業態はどれか。",
    questionVi: "Mô hình kinh doanh nào thường có chỉ số \"số khách phục vụ mỗi giờ công\" cao?",
    options: [
      { ja: "ファストフード業界", vi: "Ngành fast food" },
      { ja: "フルサービスレストラン", vi: "Nhà hàng phục vụ đầy đủ (full-service)" },
      { ja: "高級寿司専門店", vi: "Quán sushi cao cấp" },
      { ja: "焼肉専門店", vi: "Quán nướng thịt chuyên biệt" },
    ],
    correctIndex: 0,
    explanationVi:
      "Ngành fast food có 人時接客数 cao (phục vụ nhanh, nhiều khách/giờ). Nhà hàng full-service thấp hơn vì tốn nhiều giờ công cho từng bàn.",
    sourceQuoteJa:
      "一般的に、ファストフード業界は高くなり、フルサービスレストランでは低くなります。",
    sourcePage: 3,
  },
  {
    id: "sm-25",
    chapterId: "sm-ch2",
    questionJa: "「人時生産性」の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Năng suất theo giờ công\" (人時生産性) nào đúng?",
    options: [
      { ja: "売上高÷総労働時間", vi: "Doanh thu ÷ Tổng giờ lao động" },
      { ja: "客数÷総労働時間", vi: "Số khách ÷ Tổng giờ lao động" },
      { ja: "荒利益÷総労働時間数", vi: "Lợi nhuận gộp ÷ Tổng giờ lao động" },
      { ja: "人件費÷総労働時間", vi: "Nhân công phí ÷ Tổng giờ lao động" },
    ],
    correctIndex: 2,
    explanationVi: "人時生産性 = Lợi nhuận gộp (荒利益) ÷ Tổng giờ lao động — cho biết 1 giờ công tạo ra bao nhiêu lợi nhuận gộp.",
    sourceQuoteJa: "１日の粗利益÷１日の総労働時間=人時生産性",
    sourcePage: 4,
  },
  {
    id: "sm-26",
    chapterId: "sm-ch2",
    questionJa: "人時生産性は企業側の指数と見られがちだが、実際には何の源泉でもあるか。",
    questionVi: "Chỉ số năng suất theo giờ công thường bị coi là chỉ số riêng của doanh nghiệp, nhưng thực chất còn là nguồn gốc của điều gì?",
    options: [
      { ja: "広告費", vi: "Chi phí quảng cáo" },
      { ja: "従業員の賃金", vi: "Tiền lương nhân viên" },
      { ja: "家賃", vi: "Tiền thuê mặt bằng" },
      { ja: "税金", vi: "Thuế" },
    ],
    correctIndex: 1,
    explanationVi: "人時生産性 tuy hay bị coi là chỉ số riêng để doanh nghiệp tăng năng suất, nhưng thực chất chính là nguồn gốc của tiền lương nhân viên.",
    sourceQuoteJa:
      "人時生産性は企業側が生産性を上げるための指数と見られがちですが、実際には従業員の賃金の源泉でもあるのです。",
    sourcePage: 4,
  },
  {
    id: "sm-27",
    chapterId: "sm-ch2",
    questionJa: "「労働分配率」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Tỷ lệ phân phối lao động\" (労働分配率) là gì?",
    options: [
      { ja: "粗利益に占める人件費の割合", vi: "Tỷ lệ nhân công phí trong lợi nhuận gộp" },
      { ja: "売上高に占める原価の割合", vi: "Tỷ lệ giá vốn trong doanh thu" },
      { ja: "客単価に占める人件費の割合", vi: "Tỷ lệ nhân công phí trong đơn giá khách" },
      { ja: "総労働時間に占める休憩時間の割合", vi: "Tỷ lệ giờ nghỉ trong tổng giờ lao động" },
    ],
    correctIndex: 0,
    explanationVi: "労働分配率 = Nhân công phí ÷ Lợi nhuận gộp, tức tỷ lệ nhân công phí chiếm trong lợi nhuận gộp.",
    sourceQuoteJa: "労働分配率とは粗利益に占める人件費の割合です。",
    sourcePage: 4,
  },
  {
    id: "sm-28",
    chapterId: "sm-ch2",
    questionJa: "企業全体として労働分配率を適正値内に収めるには、店舗での労働分配率を何％以下に低減させる必要があるか。",
    questionVi: "Để tỷ lệ phân phối lao động của toàn doanh nghiệp nằm trong ngưỡng hợp lý, tỷ lệ này ở từng cửa hàng cần giảm xuống dưới bao nhiêu %?",
    options: [
      { ja: "30%", vi: "30%" },
      { ja: "35%", vi: "35%" },
      { ja: "40%", vi: "40%" },
      { ja: "50%", vi: "50%" },
    ],
    correctIndex: 2,
    explanationVi:
      "Vì trụ sở chính/CK cũng gánh chi phí quản lý, để cả doanh nghiệp giữ tỷ lệ phân phối lao động trong ngưỡng 35-40%, riêng từng cửa hàng cần giảm xuống dưới 40%.",
    sourceQuoteJa:
      "企業全体として労働分配率を適正値内で収めるには、店舗での労働分配率を４０％以下に低減させる必要があるのです。",
    sourcePage: 4,
  },
  {
    id: "sm-29",
    chapterId: "sm-ch2",
    questionJa: "「原価率」の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Tỷ lệ giá vốn\" (原価率) nào đúng?",
    options: [
      { ja: "原価高÷売上高×100", vi: "Giá vốn ÷ Doanh thu × 100" },
      { ja: "売上高÷原価高×100", vi: "Doanh thu ÷ Giá vốn × 100" },
      { ja: "原価高÷粗利益×100", vi: "Giá vốn ÷ Lợi nhuận gộp × 100" },
      { ja: "粗利益÷原価高×100", vi: "Lợi nhuận gộp ÷ Giá vốn × 100" },
    ],
    correctIndex: 0,
    explanationVi: "原価率 = Giá vốn ÷ Doanh thu × 100.",
    sourceQuoteJa: "原価高を売上高で割り１００を掛けたものが原価率となります。",
    sourcePage: 4,
  },
  {
    id: "sm-30",
    chapterId: "sm-ch2",
    questionJa: "「標準（あるべき）原価率」の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Tỷ lệ giá vốn tiêu chuẩn\" nào đúng?",
    options: [
      { ja: "月間売上高÷月間仕入額", vi: "Doanh thu tháng ÷ Tiền nhập hàng tháng" },
      { ja: "（月間個別メニューの販売数×標準原価）の総和÷月間売上高", vi: "Tổng (số lượng bán từng món trong tháng × giá vốn tiêu chuẩn) ÷ Doanh thu tháng" },
      { ja: "前月末棚卸額÷当月売上高", vi: "Tồn kho cuối tháng trước ÷ Doanh thu tháng này" },
      { ja: "当月仕入額÷月間売上高", vi: "Tiền nhập hàng tháng này ÷ Doanh thu tháng" },
    ],
    correctIndex: 1,
    explanationVi: "標準原価率 tính từ tổng (số lượng bán mỗi món × giá vốn tiêu chuẩn của món đó), chia cho doanh thu tháng.",
    sourceQuoteJa:
      "（月間個別メニューの販売数×標準原価）の総和÷月間売上高＝標準（あるべき）原価率",
    sourcePage: 5,
  },
  {
    id: "sm-31",
    chapterId: "sm-ch2",
    questionJa: "標準（あるべき）原価率のことを、米国では何と呼ぶか。",
    questionVi: "Tỷ lệ giá vốn tiêu chuẩn (lý thuyết) được gọi là gì ở Mỹ?",
    options: [
      { ja: "アクチュアル原価率", vi: "Actual cost rate" },
      { ja: "マージナル原価率", vi: "Marginal cost rate" },
      { ja: "スタンダード原価率", vi: "Standard cost rate (cách gọi khác)" },
      { ja: "セオロリカル原価率", vi: "Theoretical cost rate" },
    ],
    correctIndex: 3,
    explanationVi: "標準原価率 (tỷ lệ giá vốn tiêu chuẩn/lý thuyết) được gọi là セオロリカル原価率 (Theoretical Cost Rate) ở Mỹ.",
    sourceQuoteJa:
      "この標準（あるべき）原価率を、米国では理論上の原価率（セオロリカル原価率）と呼びます。",
    sourcePage: 5,
  },
  {
    id: "sm-32",
    chapterId: "sm-ch2",
    questionJa: "1日の平均客単価が1,800円を超え、アルコール比率が高い居酒屋などの業態で基準とする指標はどれか。",
    questionVi: "Với mô hình đơn giá khách trung bình >1.800 yên, tỷ lệ đồ uống có cồn cao (quán nhậu...), chỉ số nào được dùng làm cơ sở kiểm soát giờ lao động?",
    options: [
      { ja: "人時接客数", vi: "Số khách phục vụ mỗi giờ công" },
      { ja: "人時売上高", vi: "Doanh thu mỗi giờ công" },
      { ja: "原価率", vi: "Tỷ lệ giá vốn" },
      { ja: "客数", vi: "Số lượng khách" },
    ],
    correctIndex: 1,
    explanationVi:
      "Với mô hình đơn giá cao (>1.800 yên, tỷ lệ cồn cao như quán nhậu, sushi cao cấp), người ta dùng 人時売上高 làm cơ sở lập lịch làm việc — ngược với mô hình đơn giá thấp dùng 人時接客数.",
    sourceQuoteJa:
      "１日の平均客単価が１，８００円を超え、サジェスティブセールス（お奨め販売）により客単価が高まるグルメ回転寿司や高級寿司専門店、焼肉専門店などの業態や、売上高に占めるアルコール比率が高いカジュアルレストランや居酒屋系の業態の場合は人時売上高を基準としてオペレーションが組まれます。",
    sourcePage: 5,
  },
  {
    id: "sm-33",
    chapterId: "sm-ch2",
    questionJa: "月間売上高予算1,200万円、客単価800円、人時接客数5人のとき、月間計画総労働時間数はどれか。",
    questionVi: "Với ngân sách doanh thu tháng 12 triệu yên, đơn giá khách 800 yên, số khách phục vụ/giờ công là 5 người, tổng giờ lao động kế hoạch trong tháng là bao nhiêu?",
    options: [
      { ja: "2,400時間", vi: "2.400 giờ" },
      { ja: "3,500時間", vi: "3.500 giờ" },
      { ja: "4,000時間", vi: "4.000 giờ" },
      { ja: "3,000時間", vi: "3.000 giờ" },
    ],
    correctIndex: 3,
    explanationVi: "12.000.000 ÷ 800 ÷ 5 = 3.000 giờ. Công thức: Doanh thu ÷ Đơn giá khách ÷ Số khách/giờ công.",
    sourceQuoteJa:
      "月間売上高予算１,２００万円÷客単価８００円÷人時接客数５人＝月間計画総労働3,000時間",
    sourcePage: 5,
  },
  {
    id: "sm-34",
    chapterId: "sm-ch2",
    questionJa: "月間売上高予算1,200万円、人時売上高5,000円のとき、月間計画総労働時間数はどれか。",
    questionVi: "Với ngân sách doanh thu tháng 12 triệu yên, doanh thu mỗi giờ công 5.000 yên, tổng giờ lao động kế hoạch trong tháng là bao nhiêu?",
    options: [
      { ja: "2,400時間", vi: "2.400 giờ" },
      { ja: "2,000時間", vi: "2.000 giờ" },
      { ja: "3,000時間", vi: "3.000 giờ" },
      { ja: "3,600時間", vi: "3.600 giờ" },
    ],
    correctIndex: 0,
    explanationVi: "12.000.000 ÷ 5.000 = 2.400 giờ. Công thức: Doanh thu ÷ Doanh thu mỗi giờ công.",
    sourceQuoteJa:
      "月間売上高予算１,２００万円÷人時売上高５,０００円＝月間計画総労働2,400時間",
    sourcePage: 5,
  },
  {
    id: "sm-35",
    chapterId: "sm-ch2",
    questionJa: "一般的な繁忙月に含まれないものはどれか。",
    questionVi: "Tháng nào sau đây KHÔNG thuộc nhóm \"tháng cao điểm\" (繁忙月) thông thường?",
    options: [
      { ja: "3月", vi: "Tháng 3" },
      { ja: "7月", vi: "Tháng 7" },
      { ja: "6月", vi: "Tháng 6" },
      { ja: "12月", vi: "Tháng 12" },
    ],
    correctIndex: 2,
    explanationVi:
      "繁忙月 (tháng cao điểm) thường là tháng 3, 5, 7, 8, 12. 閑散月 (tháng thấp điểm) là tháng 2, 6, 10, 11 — tháng 6 thuộc nhóm thấp điểm.",
    sourceQuoteJa:
      "繁忙月（通常３月・５月・７月・８月・１２月）と閑散月（通常２月・６月・１０月・１１月）がある",
    sourcePage: 6,
  },
  {
    id: "sm-36",
    chapterId: "sm-ch2",
    questionJa: "「客単価」の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Đơn giá trung bình mỗi khách\" (客単価) nào đúng?",
    options: [
      { ja: "来店客数÷営業時間", vi: "Số khách đến ÷ Giờ mở cửa" },
      { ja: "総売上高÷総来店客数のみ", vi: "Chỉ tính bằng Tổng doanh thu ÷ Tổng số khách" },
      { ja: "一品平均単価÷注文点数", vi: "Đơn giá TB mỗi món ÷ Số món gọi" },
      { ja: "注文点数×一品平均単価", vi: "Số món gọi × Đơn giá trung bình mỗi món" },
    ],
    correctIndex: 3,
    explanationVi: "客単価 = Số món gọi × Đơn giá trung bình mỗi món — công thức được nêu rõ trong tài liệu để phân tích cách tăng đơn giá khách.",
    sourceQuoteJa: "客単価＝注文点数×一品平均単価",
    sourcePage: 6,
  },
  {
    id: "sm-37",
    chapterId: "sm-ch2",
    questionJa: "（参考３）計数管理公式問題例にある「荒利益」の計算式として正しいものはどれか。",
    questionVi: "Trong 参考３ (bài tập công thức quản lý số liệu), công thức tính \"Lợi nhuận gộp\" (荒利益) nào đúng?",
    options: [
      { ja: "売上高＋原価＝荒利益", vi: "Doanh thu + Giá vốn = Lợi nhuận gộp" },
      { ja: "原価－売上高＝荒利益", vi: "Giá vốn - Doanh thu = Lợi nhuận gộp" },
      { ja: "売上高－原価＝荒利益", vi: "Doanh thu - Giá vốn = Lợi nhuận gộp" },
      { ja: "売上高×原価率＝荒利益", vi: "Doanh thu × Tỷ lệ giá vốn = Lợi nhuận gộp" },
    ],
    correctIndex: 2,
    explanationVi: "荒利益 (lợi nhuận gộp) = Doanh thu − Giá vốn, công thức số 1 trong 7 công thức của 参考３.",
    sourceQuoteJa: "１）売上高－原価＝荒利益",
    sourcePage: 8,
  },
  {
    id: "sm-38",
    chapterId: "sm-ch2",
    questionJa: "原価率と荒利益率の関係として正しいものはどれか。",
    questionVi: "Mối quan hệ đúng giữa Tỷ lệ giá vốn và Tỷ lệ lợi nhuận gộp là gì?",
    options: [
      { ja: "原価率－荒利益率＝100％", vi: "Tỷ lệ giá vốn - Tỷ lệ lợi nhuận gộp = 100%" },
      { ja: "原価率×荒利益率＝100％", vi: "Tỷ lệ giá vốn × Tỷ lệ lợi nhuận gộp = 100%" },
      { ja: "原価率＝荒利益率", vi: "Tỷ lệ giá vốn = Tỷ lệ lợi nhuận gộp" },
      { ja: "原価率＋荒利益率＝100％", vi: "Tỷ lệ giá vốn + Tỷ lệ lợi nhuận gộp = 100%" },
    ],
    correctIndex: 3,
    explanationVi: "Tỷ lệ giá vốn và tỷ lệ lợi nhuận gộp luôn cộng lại bằng 100% doanh thu.",
    sourceQuoteJa: "２）原価率＋荒利益率＝100％",
    sourcePage: 8,
  },
  {
    id: "sm-39",
    chapterId: "sm-ch2",
    questionJa: "「個別標準原価率」の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Tỷ lệ giá vốn tiêu chuẩn của từng món\" (個別標準原価率) nào đúng?",
    options: [
      { ja: "個別標準原価÷そのメニューの価格×100＝個別標準原価率", vi: "Giá vốn tiêu chuẩn món ÷ Giá bán món × 100" },
      { ja: "そのメニューの価格÷個別標準原価×100＝個別標準原価率", vi: "Giá bán món ÷ Giá vốn tiêu chuẩn món × 100" },
      { ja: "個別標準原価×そのメニューの価格＝個別標準原価率", vi: "Giá vốn tiêu chuẩn món × Giá bán món" },
      { ja: "個別標準原価－そのメニューの価格＝個別標準原価率", vi: "Giá vốn tiêu chuẩn món - Giá bán món" },
    ],
    correctIndex: 0,
    explanationVi: "個別標準原価率 = Giá vốn tiêu chuẩn của món ÷ Giá bán món đó × 100.",
    sourceQuoteJa: "３）個別標準原価÷そのメニューの価格×100＝個別標準原価率",
    sourcePage: 8,
  },
  {
    id: "sm-40",
    chapterId: "sm-ch2",
    questionJa: "（参考３）にある当月実際原価率の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Tỷ lệ giá vốn thực tế trong tháng\" theo 参考３ nào đúng?",
    options: [
      { ja: "（当月末棚卸し額＋当月仕入額－前月末棚卸し額）÷当月売上高×100", vi: "(Tồn cuối tháng này + Nhập hàng tháng này - Tồn cuối tháng trước) ÷ Doanh thu tháng × 100" },
      { ja: "（前月末棚卸し額－当月仕入額＋当月末棚卸し額）÷当月売上高×100", vi: "(Tồn cuối tháng trước - Nhập hàng tháng này + Tồn cuối tháng này) ÷ Doanh thu tháng × 100" },
      { ja: "当月仕入額÷当月売上高×100", vi: "Chỉ lấy Tiền nhập hàng tháng này ÷ Doanh thu tháng × 100" },
      { ja: "（前月末棚卸し額＋当月仕入額－当月末棚卸し額）÷当月売上高×100", vi: "(Tồn cuối tháng trước + Nhập hàng tháng này - Tồn cuối tháng này) ÷ Doanh thu tháng × 100" },
    ],
    correctIndex: 3,
    explanationVi:
      "Giá vốn thực tế trong tháng = Tồn kho cuối tháng trước + Nhập hàng trong tháng - Tồn kho cuối tháng này, sau đó chia cho doanh thu tháng và nhân 100.",
    sourceQuoteJa: "５）当月実際原価率＝（前月末棚卸し額＋当月仕入額－当月末棚卸し額）÷当月売上高×100",
    sourcePage: 8,
  },
  {
    id: "sm-41",
    chapterId: "sm-ch2",
    questionJa: "当月ロス額（＝当月実際原価－当月標準原価）がマイナスになった場合、これを何と呼ぶか。",
    questionVi: "Nếu \"Số tiền hao hụt trong tháng\" (当月ロス額 = Giá vốn thực tế − Giá vốn tiêu chuẩn) ra kết quả âm, thì được gọi là gì?",
    options: [
      { ja: "在庫過多", vi: "Tồn kho quá nhiều" },
      { ja: "逆ざや", vi: "Chênh lệch ngược (thực tế tốn ít nguyên liệu hơn tiêu chuẩn)" },
      { ja: "棚卸ミス", vi: "Sai sót kiểm kê" },
      { ja: "販売機会損失", vi: "Mất cơ hội bán hàng" },
    ],
    correctIndex: 1,
    explanationVi:
      "当月実際原価－当月標準原価＝当月ロス額. Nếu kết quả dương gọi là ロス (hao hụt, dùng nguyên liệu nhiều hơn chuẩn), nếu âm gọi là 逆ざや (dùng ít hơn chuẩn).",
    sourceQuoteJa: "６）当月実際原価－当月標準原価＝当月ロス額　※プラスはロス、マイナスは逆ざやという",
    sourcePage: 8,
  },
  {
    id: "sm-42",
    chapterId: "sm-ch2",
    questionJa: "メニュー基準表（ハンバーグ、売価600円、原価合計190円）から算出される標準原価率はどれか。",
    questionVi: "Với bảng chuẩn món Hamburger (giá bán 600 yên, tổng giá vốn 190 yên), tỷ lệ giá vốn tiêu chuẩn tính ra là bao nhiêu?",
    options: [
      { ja: "31.7％", vi: "31.7%" },
      { ja: "68.3％", vi: "68.3%" },
      { ja: "19.0％", vi: "19.0%" },
      { ja: "60.0％", vi: "60.0%" },
    ],
    correctIndex: 0,
    explanationVi:
      "Tỷ lệ giá vốn tiêu chuẩn = 190円 ÷ 600円 × 100 ≈ 31.7%. Còn 68.3% là tỷ lệ lợi nhuận gộp (100% − 31.7%), không phải đáp án được hỏi.",
    sourceQuoteJa:
      "Ａ メニュー基準表ハンバーグ 売価 600円原材料名 単価／単位 使用量 原価ハンバーグパテ 110円／個 １個 110円デミソース 100円／100cc 50cc 50円ガロニ（添え野菜） 30円／セット １セット 30円原価合計 190円標準原価率 31.7％荒利益 410円荒利益率 68.3％",
    sourcePage: 8,
  },
  {
    id: "sm-43",
    chapterId: "sm-ch2",
    questionJa: "マグロ寿司専門店の例（売価150円、標準原価60円）で、標準原価率はいくらか。",
    questionVi: "Với ví dụ quán sushi cá ngừ chuyên biệt (giá bán 150 yên, giá vốn tiêu chuẩn 60 yên), tỷ lệ giá vốn tiêu chuẩn là bao nhiêu?",
    options: [
      { ja: "60.0％", vi: "60.0%" },
      { ja: "150.0％", vi: "150.0%" },
      { ja: "40.0％", vi: "40.0%" },
      { ja: "90.0％", vi: "90.0%" },
    ],
    correctIndex: 2,
    explanationVi: "標準原価÷メニュー売価×100＝標準原価率 → 60円÷150円×100＝40.0%.",
    sourceQuoteJa:
      "標準原価÷メニュー売価×100＝標準原価率 メニュー売価－原価＝荒利益額荒利益額÷メニュー売価×100＝荒利益率 または 100％－標準原価率＝荒利益率標準原価 60円 荒利益額 90円標準原価率 40.0％ 荒利益率 60.0％",
    sourcePage: 10,
  },
  {
    id: "sm-44",
    chapterId: "sm-ch2",
    questionJa: "同じマグロ寿司の例で、当月実際原価が6,750円、標準原価が6,000円のとき、ロス額はいくらか。",
    questionVi: "Cùng ví dụ trên, nếu giá vốn thực tế trong tháng là 6.750 yên còn giá vốn tiêu chuẩn là 6.000 yên, thì số tiền hao hụt (ロス額) là bao nhiêu?",
    options: [
      { ja: "12,750円", vi: "12.750 yên" },
      { ja: "5％", vi: "5%" },
      { ja: "750円", vi: "750 yên" },
      { ja: "6,750円", vi: "6.750 yên" },
    ],
    correctIndex: 2,
    explanationVi: "実際原価－標準原価＝ロス額 → 6,750円－6,000円＝750円. Còn 5% là tỷ lệ hao hụt (ロス率), không phải số tiền.",
    sourceQuoteJa:
      "（前月末棚卸し額＋当月仕入額）－当月末棚卸し額＝当月実際原価（1,100円＋7,100円）－1,450円＝6,750円当月実際原価÷当月売上高×100＝当月実際原価率6,750円÷15,000円×100＝45.0％実際原価－標準原価＝ロス額",
    sourcePage: 11,
  },
  {
    id: "sm-45",
    chapterId: "sm-ch2",
    questionJa: "売上高が月間12,000千円で、原価が売上高の30％を占めるとき、原価はいくらになるか。",
    questionVi: "Nếu doanh thu tháng là 12.000 nghìn yên và giá vốn chiếm 30% doanh thu, thì giá vốn là bao nhiêu?",
    options: [
      { ja: "8,400千円", vi: "8.400 nghìn yên" },
      { ja: "3,600千円", vi: "3.600 nghìn yên" },
      { ja: "4,800千円", vi: "4.800 nghìn yên" },
      { ja: "1,344千円", vi: "1.344 nghìn yên" },
    ],
    correctIndex: 1,
    explanationVi:
      "12,000千円×30％＝3,600千円 là giá vốn. Phần còn lại 8,400千円 (70%) là lợi nhuận gộp (荒利益), không phải giá vốn.",
    sourceQuoteJa:
      "売上高が月間12,000千円とすると、原価、荒利益、人件費はそれぞれいくらになるか算出せよ。原価 荒利益 人件費答 3,600千円 8,400千円 3,360千円",
    sourcePage: 9,
  },
  {
    id: "sm-46",
    chapterId: "sm-ch2",
    questionJa: "参考３の実例（1日平均売上高360,000円、実働時間75時間）で、人時売上高はいくらか。",
    questionVi: "Trong ví dụ ở 参考３ (doanh thu trung bình ngày 360.000 yên, tổng giờ làm việc thực tế 75 giờ), doanh thu mỗi giờ công là bao nhiêu?",
    options: [
      { ja: "4人", vi: "4 người" },
      { ja: "1,200円", vi: "1.200 yên" },
      { ja: "5,000円", vi: "5.000 yên" },
      { ja: "4,800円", vi: "4.800 yên" },
    ],
    correctIndex: 3,
    explanationVi: "人時売上高 = 売上高÷実働時間 → 360,000円÷75時間＝4,800円.",
    sourceQuoteJa: "計算式 売上高÷実働時間＝人時売上高360,000÷75時間＝4,800円 答 4,800円",
    sourcePage: 12,
  },
  {
    id: "sm-47",
    chapterId: "sm-ch2",
    questionJa: "参考３の実例で、人時売上高を4,800円から5,000円に上げるための2つの方法として正しい組み合わせはどれか。",
    questionVi: "Trong ví dụ ở 参考３, 2 cách để nâng doanh thu mỗi giờ công từ 4.800 yên lên 5.000 yên là gì?",
    options: [
      { ja: "客数を減らす、または原価を上げる", vi: "Giảm số khách, hoặc tăng giá vốn" },
      { ja: "実働時間を減らす、または客単価を上げる", vi: "Giảm giờ làm thực tế, hoặc tăng đơn giá khách" },
      { ja: "人件費を増やす、または原価を減らす", vi: "Tăng chi phí nhân công, hoặc giảm giá vốn" },
      { ja: "営業時間を延長する、または割引をする", vi: "Kéo dài giờ mở cửa, hoặc giảm giá" },
    ],
    correctIndex: 1,
    explanationVi:
      "2 cách: (1) giảm giờ làm thực tế 3 giờ (từ 75 xuống 72 giờ), hoặc (2) tăng đơn giá khách thêm 50 yên (từ 1.200 lên 1.250 yên) mà không đổi số khách.",
    sourceQuoteJa:
      "現在の人時売上高を5,000円にするには2つの方法がある。その2つの方法と答を書きなさい（各設問とも変動させるのは1つの要素とする）。また、そのために店長としてできることを書きなさい。答実働時間を３時間減らす。答売上高を増やす。",
    sourcePage: 12,
  },
  {
    id: "sm-48",
    chapterId: "sm-ch2",
    questionJa: "客単価を上げるために店長ができる具体策として、参考３の実例に挙げられているものはどれか。",
    questionVi: "Biện pháp cụ thể mà quản lý cửa hàng có thể làm để tăng đơn giá khách, được nêu trong ví dụ 参考３, là gì?",
    options: [
      { ja: "全メニューの値下げ", vi: "Giảm giá toàn bộ thực đơn" },
      { ja: "お薦め販売（サジェスティブセールス）", vi: "Bán hàng gợi ý, chào mời thêm (Suggestive Selling)" },
      { ja: "営業時間の短縮", vi: "Rút ngắn giờ mở cửa" },
      { ja: "スタッフの増員のみ", vi: "Chỉ tăng thêm nhân viên" },
    ],
    correctIndex: 1,
    explanationVi: "Biện pháp cụ thể để nâng đơn giá khách được nêu là お薦め販売 (bán hàng gợi ý / Suggestive Selling).",
    sourceQuoteJa: "お薦め販売（サジェスティブセールス）である。",
    sourcePage: 12,
  },
  {
    id: "sm-49",
    chapterId: "sm-ch2",
    questionJa: "「人時生産性×労働分配率」で求められるものはどれか。",
    questionVi: "Phép tính \"Năng suất mỗi giờ công × Tỷ lệ phân phối lao động\" cho ra kết quả gì?",
    options: [
      { ja: "企業として支払える１時間当たりの人件費", vi: "Chi phí nhân công doanh nghiệp có thể chi trả cho mỗi giờ lao động" },
      { ja: "1時間当たりの売上高", vi: "Doanh thu mỗi giờ" },
      { ja: "1時間当たりの原価", vi: "Giá vốn mỗi giờ" },
      { ja: "月間総労働時間", vi: "Tổng giờ lao động trong tháng" },
    ],
    correctIndex: 0,
    explanationVi: "人時生産性×労働分配率 = mức chi phí nhân công mà doanh nghiệp có thể chi trả cho mỗi giờ lao động.",
    sourceQuoteJa: "人時生産性×労働分配率＝企業として支払える１時間当たりの人件費",
    sourcePage: 4,
  },
  {
    id: "sm-50",
    chapterId: "sm-ch2",
    questionJa: "繁忙月における人時接客数・人時売上高の設定方針として正しいものはどれか。",
    questionVi: "Trong tháng cao điểm, chỉ số số khách/giờ công và doanh thu/giờ công nên được thiết lập như thế nào?",
    options: [
      { ja: "０に設定する", vi: "Đặt bằng 0" },
      { ja: "低く設定する", vi: "Đặt thấp" },
      { ja: "設定を変えない", vi: "Giữ nguyên, không đổi" },
      { ja: "高く設定する", vi: "Đặt cao hơn bình thường" },
    ],
    correctIndex: 3,
    explanationVi:
      "Tháng cao điểm doanh thu lớn, cần tăng năng suất để đảm bảo lợi nhuận nên đặt chỉ số 人時接客数・人時売上高 CAO hơn. Ngược lại tháng thấp điểm thì giảm giờ làm của nhân viên thời vụ (P/A).",
    sourceQuoteJa:
      "繁忙月は売上高が大きく、生産性を高めて利益を確保するために、人時接客数・人時売上高を高く設定します。",
    sourcePage: 6,
  },
  {
    id: "sm-51",
    chapterId: "sm-ch2",
    questionJa: "売上＝客数×客単価という式から考えると、「客数を増やす」ことは何を意味するか。",
    questionVi: "Dựa vào công thức Doanh thu = Số khách × Đơn giá khách, việc \"tăng số lượng khách\" đồng nghĩa với điều gì?",
    options: [
      { ja: "売上を減らすことになる", vi: "Làm giảm doanh thu" },
      { ja: "客単価を下げることになる", vi: "Làm giảm đơn giá khách" },
      { ja: "売上高を上げることになる", vi: "Làm tăng doanh thu" },
      { ja: "何も変わらない", vi: "Không thay đổi gì" },
    ],
    correctIndex: 2,
    explanationVi: "Vì Doanh thu = Số khách × Đơn giá khách, nên tăng số khách trực tiếp làm tăng doanh thu.",
    sourceQuoteJa: "売上＝客数×客単価なので、客数を増やすことは売上高を上げることになります。",
    sourcePage: 6,
  },
  {
    id: "sm-52",
    chapterId: "sm-ch2",
    questionJa: "固定客のリピート率を上げるために必要な努力はどれか。",
    questionVi: "Để tăng tỷ lệ khách quen quay lại, cần nỗ lực điều gì?",
    options: [
      { ja: "Q（品質）S（サービスの質）C（清潔感）をブラッシュアップする", vi: "Nâng cao Q (chất lượng), S (dịch vụ), C (sạch sẽ)" },
      { ja: "値段を毎月下げる", vi: "Giảm giá hàng tháng" },
      { ja: "店舗面積を拡大する", vi: "Mở rộng diện tích quán" },
      { ja: "スタッフの人数だけを増やす", vi: "Chỉ tăng số lượng nhân viên" },
    ],
    correctIndex: 0,
    explanationVi: "Để tăng tỷ lệ khách quen (リピート率), cần liên tục nâng cao QSC — chất lượng, dịch vụ, độ sạch sẽ — đã học ở sm-ch1.",
    sourceQuoteJa:
      "固定客のリピート率を上げるためにはQ（品質）S（サービスの質）C（清潔感）をブラッシュアップする努力が必要です。",
    sourcePage: 6,
  },
  {
    id: "sm-53",
    chapterId: "sm-ch3",
    questionJa: "過剰な食材の在庫がもたらす問題として、本文に挙げられていないものはどれか。",
    questionVi: "Vấn đề nào KHÔNG được nêu ra trong tài liệu là hậu quả của việc tồn kho nguyên liệu quá mức?",
    options: [
      { ja: "品質の劣化", vi: "Suy giảm chất lượng" },
      { ja: "無駄な仕入コストの増加", vi: "Tăng chi phí nhập hàng lãng phí" },
      { ja: "資金繰りへの悪影響", vi: "Ảnh hưởng xấu đến dòng tiền" },
      { ja: "原価率の低下", vi: "Giảm tỷ lệ giá vốn" },
    ],
    correctIndex: 3,
    explanationVi:
      "Tồn kho quá mức gây suy giảm chất lượng, hao hụt, tăng chi phí nhập hàng lãng phí và ảnh hưởng xấu đến dòng tiền — KHÔNG làm giảm tỷ lệ giá vốn (thực tế còn có xu hướng làm tăng do hao hụt).",
    sourceQuoteJa:
      "過剰な食材の在庫は品質の劣化を起こしロスにつながるだけでなく、無駄な仕入コストを増やすことになり、資金繰りにも悪影響を与えます。",
    sourcePage: 13,
  },
  {
    id: "sm-54",
    chapterId: "sm-ch3",
    questionJa: "発注量の計算式として正しいものはどれか。",
    questionVi: "Công thức tính \"Lượng đặt hàng\" (発注量) nào đúng?",
    options: [
      { ja: "各食材の発注時点での在庫量－各食材の適正在庫量＝各食材の発注量", vi: "Tồn kho hiện tại - Tồn kho hợp lý = Lượng đặt hàng" },
      { ja: "各食材の適正在庫量－各食材の発注時点での在庫量＝各食材の発注量", vi: "Tồn kho hợp lý - Tồn kho hiện tại = Lượng đặt hàng" },
      { ja: "各食材の適正在庫量×各食材の発注時点での在庫量＝各食材の発注量", vi: "Tồn kho hợp lý × Tồn kho hiện tại = Lượng đặt hàng" },
      { ja: "各食材の適正在庫量＝各食材の発注量", vi: "Tồn kho hợp lý = Lượng đặt hàng" },
    ],
    correctIndex: 1,
    explanationVi: "発注量 = Lượng tồn kho hợp lý cần có − Lượng tồn kho thực tế tại thời điểm đặt hàng.",
    sourceQuoteJa:
      "発注は[各食材の適正在庫量－各食材の発注時点での在庫量＝各食材の発注量]として納入業者別におこないます。",
    sourcePage: 13,
  },
  {
    id: "sm-55",
    chapterId: "sm-ch3",
    questionJa: "毎週月・木曜に発注、火・金曜に納品がある店で、売上計画の120％の在庫を確保する場合、火曜納品時に確保すべき在庫の根拠はどれか。",
    questionVi: "Cửa hàng đặt hàng thứ 2 và thứ 5, nhận hàng thứ 3 và thứ 6, cần giữ tồn kho bằng 120% kế hoạch doanh thu. Vào lúc nhận hàng thứ 3, căn cứ để tính lượng tồn kho cần giữ là gì?",
    options: [
      { ja: "火曜1日分の売上計画×120％", vi: "Kế hoạch doanh thu riêng thứ 3 × 120%" },
      { ja: "火・水・木曜の売上計画×120％", vi: "Kế hoạch doanh thu thứ 3-4-5 × 120%" },
      { ja: "月〜金曜全体の売上計画×120％", vi: "Kế hoạch doanh thu cả tuần thứ 2-6 × 120%" },
      { ja: "前週の実績売上×120％", vi: "Doanh thu thực tế tuần trước × 120%" },
    ],
    correctIndex: 1,
    explanationVi:
      "Hàng nhận thứ 3 phải đủ dùng đến lần nhận kế tiếp (thứ 6), tức phải che phủ 3 ngày thứ 3-4-5, nên căn cứ = Kế hoạch doanh thu thứ 3+4+5 × 120%.",
    sourceQuoteJa:
      "この場合、火曜の納品時には火・水・木曜の売上計画×１２０％の売上に必要な在庫量を確保しなければなりません。",
    sourcePage: 13,
  },
  {
    id: "sm-56",
    chapterId: "sm-ch3",
    questionJa: "大手チェーン店の自動発注システムはどのように稼働しているか。",
    questionVi: "Hệ thống đặt hàng tự động của các chuỗi lớn hoạt động như thế nào?",
    options: [
      { ja: "店長が毎回手動で発注書を作成する", vi: "Quản lý tự tay lập đơn đặt hàng mỗi lần" },
      { ja: "食材ごとの棚卸しをインプットするだけで必要量が納品される", vi: "Chỉ cần nhập số liệu kiểm kê từng nguyên liệu, hệ thống tự giao đúng lượng cần thiết" },
      { ja: "月に1回まとめて発注する", vi: "Gộp đặt hàng 1 lần mỗi tháng" },
      { ja: "納入業者が在庫を予測して自由に配送する", vi: "Nhà cung cấp tự dự đoán và giao hàng tùy ý" },
    ],
    correctIndex: 1,
    explanationVi: "Hệ thống tự động kết nối với Central Kitchen: chỉ cần nhập số liệu kiểm kê mỗi ngày, hệ thống tự tính và giao đúng lượng cần thiết.",
    sourceQuoteJa:
      "大手チェーン店の場合には、これらをシステムとして組み、セントラルキッチンなどから毎日配送があるため、食材ごとの棚卸しをインプットするだけで必要量が納品される自動発注システムが稼働しています。",
    sourcePage: 13,
  },
  {
    id: "sm-57",
    chapterId: "sm-ch3",
    questionJa: "実地棚卸しを毎日実施する必要がある理由はどれか。",
    questionVi: "Tại sao cần thực hiện kiểm kê thực tế (実地棚卸し) hàng ngày?",
    options: [
      { ja: "発注量の決定や在庫品の品質管理のため", vi: "Để quyết định lượng đặt hàng và quản lý chất lượng hàng tồn kho" },
      { ja: "従業員の勤怠を確認するため", vi: "Để kiểm tra chấm công nhân viên" },
      { ja: "税務申告の義務があるため", vi: "Vì nghĩa vụ khai thuế" },
      { ja: "本部からの指示があるときのみ", vi: "Chỉ khi có chỉ thị từ trụ sở chính" },
    ],
    correctIndex: 0,
    explanationVi: "Kiểm kê thực tế hàng ngày phục vụ 2 mục đích: quyết định lượng đặt hàng và quản lý chất lượng hàng tồn kho.",
    sourceQuoteJa: "実地棚卸しは、発注量の決定や在庫品の品質管理のためにも毎日実施する必要があります。",
    sourcePage: 14,
  },
  {
    id: "sm-58",
    chapterId: "sm-ch3",
    questionJa: "実地棚卸しのポイントのうち、「カウント担当者と記入者の2人でおこなうことが望ましい」のはどの項目か。",
    questionVi: "Trong các điểm cần lưu ý khi kiểm kê thực tế, mục nào nói \"nên có 2 người: người đếm và người ghi\"?",
    options: [
      { ja: "ア（サンプル・不良品の処理）", vi: "Mục ア (xử lý mẫu/hàng lỗi)" },
      { ja: "ウ（空箱・空ケースを捨てる）", vi: "Mục ウ (vứt hộp/thùng rỗng)" },
      { ja: "オ（カウント担当者と記入者）", vi: "Mục オ (người đếm và người ghi)" },
      { ja: "カ（正確な品名・量の相互確認）", vi: "Mục カ (xác nhận chéo tên hàng/số lượng)" },
    ],
    correctIndex: 2,
    explanationVi: "Mục オ nêu rõ: nên có 2 người — người đếm (đếm chính xác đến từng đơn vị lẻ trừ hàng chưa mở) và người ghi (xác nhận rồi ghi lại).",
    sourceQuoteJa:
      "オ カウントに当たっては、カウント担当者と記入者の２人でおこなうことが望ましい。カウント担当者が在庫を手で指し示して数え、未開封以外はバラまで正確に数え、記入者が確認して記入する",
    sourcePage: 14,
  },
  {
    id: "sm-59",
    chapterId: "sm-ch3",
    questionJa: "実地棚卸しのポイント「オ」と「カ」（2人体制でのカウント・相互確認）はいつ実施すると書かれているか。",
    questionVi: "Hai mục オ và カ (đếm 2 người, xác nhận chéo) được nêu là nên thực hiện vào lúc nào?",
    options: [
      { ja: "毎日の実地棚卸しの際に必ず実施", vi: "Bắt buộc thực hiện mỗi lần kiểm kê hàng ngày" },
      { ja: "期末棚卸しの際に実施（発注の実地棚卸しは1人でも良い）", vi: "Thực hiện vào lúc kiểm kê cuối kỳ (kiểm kê để đặt hàng thì 1 người cũng được)" },
      { ja: "新人研修のときのみ", vi: "Chỉ khi đào tạo nhân viên mới" },
      { ja: "本部の抜き打ち検査のときのみ", vi: "Chỉ khi trụ sở chính kiểm tra đột xuất" },
    ],
    correctIndex: 1,
    explanationVi: "2 mục オ・カ (2 người kiểm đếm, xác nhận chéo) chỉ bắt buộc vào lúc kiểm kê cuối kỳ; còn kiểm kê thường ngày để đặt hàng thì 1 người cũng được.",
    sourceQuoteJa: "※オとカは期末棚卸しの際に実施（発注の実地棚卸しは１人でも良い）",
    sourcePage: 14,
  },
  {
    id: "sm-60",
    chapterId: "sm-ch3",
    questionJa: "「棚卸しの集計と提出に当たってのポイント」に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được liệt kê trong \"Các điểm cần lưu ý khi tổng hợp và nộp báo cáo kiểm kê\"?",
    options: [
      { ja: "単価ミスはないか", vi: "Có sai đơn giá không" },
      { ja: "集計の計算ミスはないか", vi: "Có sai sót tính toán tổng hợp không" },
      { ja: "担当者、立ち会い者、店長のサイン", vi: "Chữ ký của người phụ trách, người chứng kiến, quản lý" },
      { ja: "翌月の販売数量を予測する", vi: "Dự đoán số lượng bán tháng sau" },
    ],
    correctIndex: 3,
    explanationVi:
      "6 điểm nêu ra là: xác nhận đơn vị/số lượng, tránh sai sót ghi chép, tránh sai đơn giá, tránh sai sót tính tổng, ký xác nhận, nộp đúng hạn — KHÔNG bao gồm dự đoán doanh số tháng sau.",
    sourceQuoteJa:
      "ア 単位と数量を確認する　イ 転記ミスや入力キーの押し間違えはないか　ウ 単価ミスはないか（特に食材変更があったものは要注意）　エ 集計の計算ミスはないか　オ 担当者、立ち会い者、店長のサイン（印）をする　カ 決められた日までに提出する",
    sourcePage: 15,
  },
  {
    id: "sm-61",
    chapterId: "sm-ch3",
    questionJa: "検収作業で確認すべき3つの項目として正しい組み合わせはどれか。",
    questionVi: "3 hạng mục cần xác nhận trong công tác kiểm nhận hàng (検収作業) là gì?",
    options: [
      { ja: "A）発注数量　B）納品書の数量　C）現品の数量と品質", vi: "A) Số lượng đặt hàng B) Số lượng trên phiếu giao hàng C) Số lượng và chất lượng hàng thực tế" },
      { ja: "A）売価　B）原価　C）荒利益", vi: "A) Giá bán B) Giá vốn C) Lợi nhuận gộp" },
      { ja: "A）納品日　B）納品業者名　C）支払い方法", vi: "A) Ngày giao B) Tên nhà cung cấp C) Phương thức thanh toán" },
      { ja: "A）賞味期限　B）製造日　C）保管温度のみ", vi: "Chỉ A) Hạn sử dụng B) Ngày sản xuất C) Nhiệt độ bảo quản" },
    ],
    correctIndex: 0,
    explanationVi: "3 hạng mục cốt lõi của kiểm nhận hàng: A) Số lượng đặt hàng, B) Số lượng trên phiếu giao hàng, C) Số lượng và chất lượng hàng thực tế.",
    sourceQuoteJa: "A）発注数量とB）納品書の数量、C）現品の数量と品質の３つを確認します。",
    sourcePage: 15,
  },
  {
    id: "sm-62",
    chapterId: "sm-ch3",
    questionJa: "検品は基本的に何を元にして実施しなければならないか。",
    questionVi: "Về cơ bản, việc kiểm hàng (検品) phải dựa trên cái gì để thực hiện?",
    options: [
      { ja: "発注量（発注書やそのコピー）", vi: "Lượng đặt hàng (đơn đặt hàng hoặc bản sao)" },
      { ja: "納入業者の口頭説明のみ", vi: "Chỉ dựa vào lời giải thích miệng của nhà cung cấp" },
      { ja: "前回納品時の記憶", vi: "Trí nhớ của lần giao hàng trước" },
      { ja: "本部が別途送るリスト", vi: "Danh sách trụ sở chính gửi riêng" },
    ],
    correctIndex: 0,
    explanationVi: "Kiểm hàng phải dựa trên lượng đặt hàng (đơn đặt hàng gốc hoặc bản sao) làm căn cứ gốc.",
    sourceQuoteJa: "基本は発注量（発注書やそのコピー）を元にして、検品を実施しなければなりません。",
    sourcePage: 15,
  },
  {
    id: "sm-63",
    chapterId: "sm-ch3",
    questionJa: "収納の際に徹底すべきこととして正しいものはどれか。",
    questionVi: "Khi cất trữ hàng vào kho, điều cần tuân thủ triệt để là gì?",
    options: [
      { ja: "後入れ先出し", vi: "Nhập sau xuất trước" },
      { ja: "先入れ先出し", vi: "Nhập trước xuất trước" },
      { ja: "ランダムに配置", vi: "Xếp ngẫu nhiên" },
      { ja: "高価な食材を優先的に取り出す", vi: "Ưu tiên lấy nguyên liệu đắt tiền trước" },
    ],
    correctIndex: 1,
    explanationVi: "Nguyên tắc thu kho: xuất hàng cũ trước (先入れ先出し / FIFO), cất đúng vị trí đã quy định.",
    sourceQuoteJa: "エ 収納は決めた場所におこない、先入れ先出しを徹底する。",
    sourcePage: 15,
  },
  {
    id: "sm-64",
    chapterId: "sm-ch3",
    questionJa: "発注した量より実際の納品量が多い場合、起こりやすい問題はどれか。",
    questionVi: "Nếu lượng giao hàng thực tế nhiều hơn lượng đã đặt, vấn đề dễ xảy ra là gì?",
    options: [
      { ja: "品切れが発生する", vi: "Xảy ra hết hàng" },
      { ja: "売れ残りが発生し、品質が劣化して使用できずロスとなる", vi: "Phát sinh hàng tồn không bán được, chất lượng suy giảm không dùng được, thành hao hụt" },
      { ja: "販売機会損失が発生する", vi: "Phát sinh tổn thất cơ hội bán hàng" },
      { ja: "何の問題も起こらない", vi: "Không có vấn đề gì" },
    ],
    correctIndex: 1,
    explanationVi: "Giao nhiều hơn đặt → tồn kho dư thừa, không bán hết, chất lượng suy giảm theo thời gian, cuối cùng phải bỏ đi (ロス). Đây khác với 品切れ (hết hàng, xảy ra khi giao ÍT hơn).",
    sourceQuoteJa: "それは発注した量より多ければ売れ残りが発生し、品質が劣化して使用できずロスとなるからです。",
    sourcePage: 15,
  },
  {
    id: "sm-65",
    chapterId: "sm-ch3",
    questionJa: "発注した量より実際の納品量が少ない場合、頻繁に発生すると何につながるか。",
    questionVi: "Nếu lượng giao hàng thực tế ít hơn lượng đã đặt và tình trạng này xảy ra thường xuyên, sẽ dẫn đến điều gì?",
    options: [
      { ja: "原価率が下がる", vi: "Tỷ lệ giá vốn giảm" },
      { ja: "顧客満足を損ね、店の信用を無くして客数ダウンに繋がる", vi: "Làm giảm sự hài lòng của khách, mất uy tín cửa hàng, khiến lượng khách sụt giảm" },
      { ja: "在庫が増えすぎる", vi: "Tồn kho tăng quá mức" },
      { ja: "従業員のモチベーションが上がる", vi: "Tăng động lực làm việc của nhân viên" },
    ],
    correctIndex: 1,
    explanationVi: "Giao ít hơn đặt → hết hàng → khách không hài lòng → nếu lặp lại thường xuyên sẽ mất uy tín và làm giảm lượng khách. Đây gọi là 販売機会損失 (tổn thất cơ hội bán hàng / チャンスロス).",
    sourceQuoteJa:
      "逆に少なければ品切れを起こし、お客様から不評の原因になります。これが売れたはずの商品を売り損ねた「販売機会損失（チャンスロス）」であり、頻繁に発生すれば顧客満足を損ね、店の信用を無くして客数ダウンに繋がります。",
    sourcePage: 15,
  },
  {
    id: "sm-66",
    chapterId: "sm-ch3",
    questionJa: "検収（検品・収納）作業の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của công tác kiểm nhận hàng (検収 = kiểm hàng + thu kho) là gì?",
    options: [
      { ja: "納品書にサインするだけの作業", vi: "Chỉ là công việc ký vào phiếu giao hàng" },
      { ja: "各食材の数量と品質基準をチェックし、常温・冷凍・冷蔵などに分け適正な保管場所に収納すること", vi: "Kiểm tra số lượng và tiêu chuẩn chất lượng từng nguyên liệu, phân loại thường/đông lạnh/lạnh rồi cất vào nơi bảo quản phù hợp" },
      { ja: "業者への支払いを処理すること", vi: "Xử lý thanh toán cho nhà cung cấp" },
      { ja: "翌日の発注書を作成すること", vi: "Lập đơn đặt hàng cho ngày hôm sau" },
    ],
    correctIndex: 1,
    explanationVi: "検収 = kiểm tra số lượng + tiêu chuẩn chất lượng của từng nguyên liệu khi giao hàng, có sự chứng kiến của nhà cung cấp, rồi phân loại và cất vào đúng nơi bảo quản.",
    sourceQuoteJa:
      "納品時に業者立ち合いの下で、各食材の「数量」と「品質基準」をチェックし、常温、冷凍・冷蔵などに分け、適正な保管場所に収納するのが検収（検品・収納）作業です。",
    sourcePage: 16,
  },
  {
    id: "sm-67",
    chapterId: "sm-ch3",
    questionJa: "マグロの発注数量10キロ、納品書10キロ、現品6キロだった場合、検収時に気づかず業者に手渡してしまうと何が起きるか。",
    questionVi: "Cá ngừ đặt 10kg, phiếu giao hàng ghi 10kg, nhưng hàng thực tế chỉ 6kg. Nếu không phát hiện khi kiểm nhận mà đã ký nhận cho nhà cung cấp, điều gì xảy ra?",
    options: [
      { ja: "4キロの見えないロス（例：2万円相当）が発生する", vi: "Phát sinh 4kg hao hụt \"vô hình\" (ví dụ tương đương 20.000 yên)" },
      { ja: "業者が自動的に4キロ分を返金する", vi: "Nhà cung cấp tự động hoàn tiền 4kg" },
      { ja: "問題は発生しない、数量は記録上一致している", vi: "Không có vấn đề gì, vì số liệu trên giấy tờ đã khớp" },
      { ja: "原価率が自動的に下がる", vi: "Tỷ lệ giá vốn tự động giảm" },
    ],
    correctIndex: 0,
    explanationVi:
      "Vì đã ký nhận theo phiếu giao hàng (10kg) trong khi thực nhận chỉ 6kg, cửa hàng vẫn phải trả tiền cho 10kg — phát sinh khoản hao hụt \"vô hình\" 4kg (không phải hao hụt do hỏng hàng) mà không ai nhận ra.",
    sourceQuoteJa:
      "例えば、仕入れ単価の高いマグロの納品書の数量（B）は１０キロと記されていても、実際に納入された現品の数量（C）が６キロの場合、検収時に気づかず納品書にサインして業者に手渡せば、この段階で４キロのロスが発生しています。仮にキロ当たり５千円のマグロなら２万円のロスです。",
    sourcePage: 16,
  },
  {
    id: "sm-68",
    chapterId: "sm-ch3",
    questionJa: "調理関係者が「ロス」と聞いて思い浮かべがちなものはどれか（本文の指摘）。",
    questionVi: "Theo tài liệu chỉ ra, người làm bếp khi nghe từ \"ロス\" (hao hụt) thường chỉ nghĩ ngay đến loại nào?",
    options: [
      { ja: "検収時に気づかない見えないロスのみ", vi: "Chỉ nghĩ đến hao hụt vô hình do không phát hiện lúc kiểm nhận" },
      { ja: "実際に食材が劣化した廃棄ロス", vi: "Hao hụt do nguyên liệu thực sự hỏng phải vứt bỏ" },
      { ja: "会計上の帳簿ミス", vi: "Sai sót sổ sách kế toán" },
      { ja: "従業員の欠勤による損失", vi: "Tổn thất do nhân viên nghỉ việc" },
    ],
    correctIndex: 1,
    explanationVi:
      "Tài liệu chỉ ra: người làm bếp thường chỉ nghĩ đến hao hụt do nguyên liệu hỏng phải vứt bỏ (廃棄ロス), mà quên mất loại hao hụt \"vô hình\" phát sinh từ sai sót khi kiểm nhận hàng (như ví dụ cá ngừ ở sm-67).",
    sourceQuoteJa:
      "調理関係者はロスといえば実際に食材が劣化した廃棄ロスを思い浮かべがちです。しかし、検収作業で現品の不足に気づかなければ、納品書を元に請求された金額を支払わないといけません。",
    sourcePage: 16,
  },
  {
    id: "sm-69",
    chapterId: "sm-ch3",
    questionJa: "納品書の数量（12キロ）と現品の数量（12キロ）が一致し品質も問題ない場合でも要注意なのはなぜか。",
    questionVi: "Vì sao dù số lượng trên phiếu giao hàng (12kg) và hàng thực tế (12kg) khớp nhau, chất lượng cũng ổn, vẫn cần lưu ý?",
    options: [
      { ja: "発注数量（10キロ）より多く納品されていれば、売れ残り廃棄ロス＋支払い増加の問題になるため", vi: "Nếu nhiều hơn lượng đã đặt (10kg), sẽ dẫn đến hàng tồn phải vứt bỏ + phải trả thêm tiền" },
      { ja: "数量が一致していれば絶対に問題は起きないため", vi: "Vì số lượng khớp thì chắc chắn không có vấn đề gì" },
      { ja: "品質確認が不要になるため", vi: "Vì không cần kiểm tra chất lượng nữa" },
      { ja: "検収作業そのものが不要になるため", vi: "Vì bản thân việc kiểm nhận trở nên không cần thiết" },
    ],
    correctIndex: 0,
    explanationVi:
      "Phiếu giao hàng khớp với hàng thực tế không có nghĩa là ĐÚNG với lượng đã ĐẶT — nếu đặt 10kg mà nhận 12kg (dù khớp giấy tờ-thực tế), phần dư 2kg vẫn dễ tồn kho, hỏng, phải vứt bỏ, và vẫn phải trả thêm tiền cho phần dư đó.",
    sourceQuoteJa:
      "仮にこのときのマグロの発注数量（A）が１０キロであったとすれば、２キロ多く納品されており問題です。売上予測に基づく発注量より多い２キロは、売れずに商品の劣化が進んで廃棄ロスになってしまいます。また、業者への支払い額も２キロ分増え問題です。",
    sourcePage: 16,
  },
  {
    id: "sm-70",
    chapterId: "sm-ch3",
    questionJa: "しゃぶしゃぶ用和牛ロース肉のサイズが基準外だった場合、どのような問題が起こるか。",
    questionVi: "Nếu kích thước miếng thịt bò thăn dùng cho lẩu shabu-shabu không đúng tiêu chuẩn, vấn đề gì xảy ra?",
    options: [
      { ja: "設定した標準歩留まりを超えてロスとなり、原価率が上がる", vi: "Vượt quá tỷ lệ thành phẩm tiêu chuẩn đã đặt ra, gây hao hụt và làm tăng tỷ lệ giá vốn" },
      { ja: "自動的に売価が上がる", vi: "Giá bán tự động tăng" },
      { ja: "問題は起きない、見た目だけの違い", vi: "Không có vấn đề gì, chỉ khác về hình thức" },
      { ja: "調理時間が短縮される", vi: "Rút ngắn thời gian chế biến" },
    ],
    correctIndex: 0,
    explanationVi: "Kích thước nguyên liệu sai chuẩn khi cắt lát sẽ làm tỷ lệ thành phẩm thực tế thấp hơn tiêu chuẩn đã đặt ra, gây hao hụt và đẩy tỷ lệ giá vốn lên cao.",
    sourceQuoteJa:
      "「しゃぶしゃぶ用 A４等級・和牛ロース肉」のロース面のサイズが大きく基準外であれば、スライスした際の大きさや背脂肪の付きが多過ぎ、メニューで示した写真どおりの盛り付けにはなりません。仮にカットして分量や見た目を写真と同じようにしても、設定した標準歩留まりを超えてロスとなり、原価率が上がります。",
    sourcePage: 16,
  },
  {
    id: "sm-71",
    chapterId: "sm-ch4",
    questionJa: "「販売管理」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Quản lý bán hàng\" (販売管理) là gì?",
    options: [
      { ja: "従業員の勤怠を管理すること", vi: "Quản lý chấm công nhân viên" },
      { ja: "計画どおりに売上高を作るためにどうすればよいかを考え、販売促進の内容を管理すること", vi: "Suy nghĩ cách để tạo ra doanh thu đúng kế hoạch, và quản lý nội dung các biện pháp xúc tiến bán hàng" },
      { ja: "食材の品質基準を管理すること", vi: "Quản lý tiêu chuẩn chất lượng nguyên liệu" },
      { ja: "店舗の防火設備を管理すること", vi: "Quản lý thiết bị phòng cháy của cửa hàng" },
    ],
    correctIndex: 1,
    explanationVi: "販売管理 = suy nghĩ cách tạo ra doanh thu đúng kế hoạch, thông qua việc quản lý các nội dung xúc tiến bán hàng (販売促進).",
    sourceQuoteJa:
      "販売管理とは、計画どおりに売上高を作るためにどうすればよいかを考えることで、販売促進の内容を管理することです。",
    sourcePage: 16,
  },
  {
    id: "sm-72",
    chapterId: "sm-ch4",
    questionJa: "メニューのABC分析について、正しい説明はどれか。",
    questionVi: "Mô tả đúng về \"Phân tích ABC\" (ABC分析) cho thực đơn là gì?",
    options: [
      { ja: "全メニューを価格順に並べ、高い順にA・B・Cを割り当てる", vi: "Xếp thực đơn theo giá, từ cao xuống thấp gán A/B/C" },
      { ja: "全メニューをランダムに3グループに分ける", vi: "Chia ngẫu nhiên thực đơn thành 3 nhóm" },
      { ja: "全メニューを売上順（または売れ個数順）に並べ、累計70％まではA、70〜90％はB、90〜100％はC", vi: "Xếp thực đơn theo doanh thu (hoặc số lượng bán), cộng dồn đến 70% là A, 70-90% là B, 90-100% là C" },
      { ja: "全メニューを調理時間順に並べる", vi: "Xếp thực đơn theo thời gian chế biến" },
    ],
    correctIndex: 2,
    explanationVi: "ABC分析: xếp toàn bộ menu theo thứ tự doanh thu (hoặc số lượng bán), nhóm A = 70% đầu, nhóm B = 70-90%, nhóm C = 90-100%. Tỷ lệ này thay đổi tùy doanh nghiệp.",
    sourceQuoteJa:
      "ABC分析とは全メニューを売上順又は売れ個数順に並べトータルの７０％を構成するメニューをAとし、７０％から９０％を構成するメニューをBとし、９０％から１００％を構成するメニューをCとします。",
    sourcePage: 16,
  },
  {
    id: "sm-73",
    chapterId: "sm-ch4",
    questionJa: "ABC分析でCと判定されたメニューはどう扱われるか。",
    questionVi: "Món ăn được xếp vào nhóm C trong phân tích ABC sẽ được xử lý như thế nào?",
    options: [
      { ja: "価格を自動的に上げる", vi: "Tự động tăng giá" },
      { ja: "無条件でメニューに残す", vi: "Vô điều kiện giữ lại trong thực đơn" },
      { ja: "セット割引商品にする", vi: "Chuyển thành sản phẩm giảm giá theo set" },
      { ja: "余り売れないと判断し、次回のメニュー改定から外す対象になる", vi: "Được đánh giá là không bán chạy, trở thành đối tượng bị loại khỏi lần cải tiến thực đơn tiếp theo" },
    ],
    correctIndex: 3,
    explanationVi: "Món thuộc nhóm C (bán ít) thường bị cân nhắc loại bỏ khỏi thực đơn ở lần cải tiến kế tiếp.",
    sourceQuoteJa: "Cと判定されたメニューは余り売れないと判断し、次回のメニュー改定から外す対象になります。",
    sourcePage: 16,
  },
  {
    id: "sm-74",
    chapterId: "sm-ch4",
    questionJa: "セット割引商品（特にランチセット）が売上向上につながる仕組みはどれか。",
    questionVi: "Cơ chế khiến sản phẩm giảm giá theo set (đặc biệt là set trưa) làm tăng doanh thu là gì?",
    options: [
      { ja: "原価が自動的に下がるため", vi: "Vì giá vốn tự động giảm" },
      { ja: "注文が集中し料理の提供が早くなり、回転率が上がるため", vi: "Vì đơn hàng tập trung, phục vụ nhanh hơn, làm tăng tỷ lệ quay vòng bàn" },
      { ja: "客単価が下がるため", vi: "Vì đơn giá khách giảm" },
      { ja: "食材の仕入れが不要になるため", vi: "Vì không cần nhập nguyên liệu nữa" },
    ],
    correctIndex: 1,
    explanationVi: "Set trưa làm đơn hàng tập trung vào ít lựa chọn hơn → bếp phục vụ nhanh hơn → tỷ lệ quay vòng bàn (回転率) tăng → doanh thu tăng.",
    sourceQuoteJa:
      "特にランチセットなどは注文を集中させることができます。その結果、料理の提供が早くなり、回転率が上がり売上が向上することになります。",
    sourcePage: 16,
  },
  {
    id: "sm-75",
    chapterId: "sm-ch4",
    questionJa: "時間帯割引商品の目的はどれか。",
    questionVi: "Mục đích của sản phẩm giảm giá theo khung giờ (時間帯割引商品) là gì?",
    options: [
      { ja: "ピークタイムの混雑をさらに増やすため", vi: "Làm tăng thêm sự đông đúc vào giờ cao điểm" },
      { ja: "従業員の休憩時間を減らすため", vi: "Giảm giờ nghỉ của nhân viên" },
      { ja: "アイドルタイム（食事時間帯以外）に来店客を誘引するため", vi: "Thu hút khách đến trong khung giờ vắng (ngoài giờ ăn chính)" },
      { ja: "原価率を上げるため", vi: "Tăng tỷ lệ giá vốn" },
    ],
    correctIndex: 2,
    explanationVi: "Giảm giá theo khung giờ nhắm vào アイドルタイム (khung giờ vắng khách, ngoài giờ ăn chính) để thu hút khách đến.",
    sourceQuoteJa:
      "時間帯割引商品は、アイドルタイム（食事時間帯以外）用に値引き商品を置くことで来店客の誘引につなげます。",
    sourcePage: 17,
  },
  {
    id: "sm-76",
    chapterId: "sm-ch4",
    questionJa: "割引券はいつ渡すべきか、また誤った渡し方をするとどうなるか。",
    questionVi: "Phiếu giảm giá nên được đưa vào lúc nào, và nếu đưa sai thời điểm thì sao?",
    options: [
      { ja: "来店時に渡すべき、レジ精算時に渡すと売上を下げる", vi: "Nên đưa lúc khách vào, đưa lúc thanh toán sẽ làm giảm doanh thu" },
      { ja: "レジ精算時に渡すべき、来店時に渡すと単純な値引きに過ぎず売上を下げる要因になる", vi: "Nên đưa lúc thanh toán, đưa lúc khách vào chỉ là giảm giá đơn thuần, làm giảm doanh thu" },
      { ja: "いつ渡しても結果は同じ", vi: "Đưa lúc nào cũng cho kết quả như nhau" },
      { ja: "SNSで事前に送るべき", vi: "Nên gửi trước qua mạng xã hội" },
    ],
    correctIndex: 1,
    explanationVi:
      "割引券 (phiếu giảm giá) nhằm mục đích khuyến khích khách QUAY LẠI lần sau, nên phải đưa lúc thanh toán (để dùng cho lần sau). Nếu đưa ngay lúc khách vào quán thì chỉ là giảm giá đơn thuần cho lượt này, làm giảm doanh thu.",
    sourceQuoteJa:
      "割引券の目的は再来店を促すためのもので、レジ精算時に渡します。ただし、来店時に渡すと単純に値引きをしているだけに過ぎないので、売上を下げる要因になります。",
    sourcePage: 17,
  },
  {
    id: "sm-77",
    chapterId: "sm-ch4",
    questionJa: "ポイント制度の目的はどれか。",
    questionVi: "Mục đích của chế độ tích điểm (ポイント制度) là gì?",
    options: [
      { ja: "新規顧客だけを対象にした一回限りの割引", vi: "Chỉ giảm giá một lần duy nhất cho khách mới" },
      { ja: "従業員の勤続年数を評価する制度", vi: "Chế độ đánh giá thâm niên nhân viên" },
      { ja: "食材の在庫を管理する制度", vi: "Chế độ quản lý tồn kho nguyên liệu" },
      { ja: "お客様を囲い込み、複数回の来店を促す施策", vi: "Biện pháp giữ chân khách hàng, khuyến khích khách quay lại nhiều lần" },
    ],
    correctIndex: 3,
    explanationVi: "ポイント制度 nhằm giữ chân khách (囲い込む), khuyến khích quay lại nhiều lần, kết hợp với phiếu giảm giá để thu hút khách quen (リピーター).",
    sourceQuoteJa:
      "ポイント制度はお客様を囲い込むための施策で、複数回の来店を促すものです。割引券とともにリピーターの獲得に有効です。",
    sourcePage: 17,
  },
  {
    id: "sm-78",
    chapterId: "sm-ch4",
    questionJa: "WEBサイトを活用する目的として正しいものはどれか。",
    questionVi: "Mục đích khi tận dụng website là gì?",
    options: [
      { ja: "割引券などを掲載し、新規顧客を獲得する手段として有効", vi: "Đăng phiếu giảm giá..., là công cụ hiệu quả để thu hút khách hàng mới" },
      { ja: "既存顧客の情報を完全に削除する", vi: "Xóa hoàn toàn thông tin khách hàng cũ" },
      { ja: "店舗の防災マニュアルを公開する", vi: "Công khai sổ tay phòng chống thiên tai của cửa hàng" },
      { ja: "従業員の給与を公開する", vi: "Công khai lương nhân viên" },
    ],
    correctIndex: 0,
    explanationVi: "WEBサイト (chủ yếu là trang chủ) là công cụ hiệu quả để thu hút khách hàng mới khi đăng tải phiếu giảm giá và thông tin khuyến mãi.",
    sourceQuoteJa:
      "WEBサイトは主にホームページになりますが、そこに割引券などを張り付けることによって、新規顧客を獲得する手段として有効です。",
    sourcePage: 17,
  },
  {
    id: "sm-79",
    chapterId: "sm-ch4",
    questionJa: "宅配サービスの利点として正しいものはどれか。",
    questionVi: "Ưu điểm của dịch vụ giao hàng tận nơi (宅配サービス) là gì?",
    options: [
      { ja: "店舗の家賃を削減できる", vi: "Giảm được tiền thuê mặt bằng" },
      { ja: "食材の仕入れコストが自動的に下がる", vi: "Tự động giảm chi phí nhập nguyên liệu" },
      { ja: "来店動機がない人にも販売でき、新規顧客開拓につながる", vi: "Bán được cho cả những người không có động lực đến quán, mở rộng khách hàng mới" },
      { ja: "調理人が不要になる", vi: "Không cần đầu bếp nữa" },
    ],
    correctIndex: 2,
    explanationVi: "宅配サービス kết hợp với WEB, nhận đơn qua mạng và giao qua đơn vị vận chuyển — bán được cho cả người không có ý định đến quán trực tiếp, mở rộng khách hàng mới.",
    sourceQuoteJa:
      "宅配サービスはWEBと一体で、WEBから注文を受け、宅配業者に配達してもらうことにより、来店動機がない人にも販売できます。やはり新規顧客開拓につながります。",
    sourcePage: 17,
  },
  {
    id: "sm-80",
    chapterId: "sm-ch4",
    questionJa: "支払いの電子化が来店を促す理由はどれか。",
    questionVi: "Vì sao việc số hóa phương thức thanh toán lại thúc đẩy khách đến quán?",
    options: [
      { ja: "現金がないときでもカードやスマートフォンで決済できるという理由で来店してくれるため", vi: "Vì khách vẫn đến được ngay cả khi không mang tiền mặt, do có thể thanh toán bằng thẻ hoặc điện thoại" },
      { ja: "電子決済は必ず現金より安いため", vi: "Vì thanh toán điện tử luôn rẻ hơn tiền mặt" },
      { ja: "電子化すると税金がかからないため", vi: "Vì thanh toán điện tử không bị đánh thuế" },
      { ja: "電子化は法律で義務付けられているため", vi: "Vì luật pháp bắt buộc phải số hóa" },
    ],
    correctIndex: 0,
    explanationVi: "支払いの電子化 là một trong các lựa chọn khiến khách quyết định ghé quán — vì dù không mang tiền mặt vẫn thanh toán được bằng thẻ/điện thoại.",
    sourceQuoteJa:
      "支払いの電子化は顧客の来店選択の一つになります。現金がないときにカードやスマートフォンで決済ができるという理由で来店してくれます。",
    sourcePage: 17,
  },
  {
    id: "sm-81",
    chapterId: "sm-ch4",
    questionJa: "予約の電子化について、本文に述べられている工夫はどれか。",
    questionVi: "Về việc số hóa đặt chỗ, tài liệu nêu ra biện pháp cân nhắc nào?",
    options: [
      { ja: "WEB予約のみを受け付け、電話予約は完全に廃止する", vi: "Chỉ nhận đặt chỗ qua WEB, bỏ hoàn toàn đặt chỗ qua điện thoại" },
      { ja: "WEBが主だが電話でも対応できるようにし、デジタルが苦手な高齢者もグループ客として獲得する", vi: "Chủ yếu qua WEB nhưng vẫn hỗ trợ qua điện thoại, để cả người cao tuổi không rành công nghệ cũng đặt được, thu hút khách đoàn" },
      { ja: "予約は一切受け付けない", vi: "Hoàn toàn không nhận đặt chỗ" },
      { ja: "予約は必ず前払いを要求する", vi: "Đặt chỗ bắt buộc phải trả trước" },
    ],
    correctIndex: 1,
    explanationVi: "予約 chủ yếu qua WEB nhưng vẫn hỗ trợ điện thoại, giúp người cao tuổi khó dùng công nghệ vẫn đặt được, từ đó góp phần thu hút khách đoàn (グループ客).",
    sourceQuoteJa:
      "予約もWEBが主ですが、電話でも対応できることで、デジタル活用が苦手な高齢者も予約がしやすくなり、グループ客獲得に貢献します。",
    sourcePage: 17,
  },
  {
    id: "sm-82",
    chapterId: "sm-ch5",
    questionJa: "客数が減少傾向となる原因として、本文が主に挙げているものはどれか。",
    questionVi: "Nguyên nhân chính khiến số lượng khách có xu hướng giảm, theo tài liệu, là gì?",
    options: [
      { ja: "新規顧客が全く来店しなくなること", vi: "Khách hàng mới hoàn toàn không đến nữa" },
      { ja: "固定顧客と準固定顧客の目減り", vi: "Sự sụt giảm của khách quen cố định và khách bán cố định" },
      { ja: "従業員の離職率が高いこと", vi: "Tỷ lệ nghỉ việc của nhân viên cao" },
      { ja: "原価率が上昇すること", vi: "Tỷ lệ giá vốn tăng" },
    ],
    correctIndex: 1,
    explanationVi: "客数が減少する傾向の原因は chủ yếu là sự sụt giảm (目減り) của 固定顧客 (khách quen cố định) và 準固定顧客 (khách bán cố định) — không phải do khách mới.",
    sourceQuoteJa: "客数が減少傾向となる原因は、主に固定顧客と準固定顧客の目減りです。",
    sourcePage: 17,
  },
  {
    id: "sm-83",
    chapterId: "sm-ch5",
    questionJa: "交通量の多い駅周辺の店では、一般的にどのような顧客構成になりやすいか。",
    questionVi: "Cửa hàng gần ga tàu, nơi lưu lượng người qua lại lớn, thường có cơ cấu khách hàng như thế nào?",
    options: [
      { ja: "固定顧客の比率が極端に高くなる", vi: "Tỷ lệ khách quen cố định cao vượt trội" },
      { ja: "新規顧客率が高くなる", vi: "Tỷ lệ khách hàng mới cao" },
      { ja: "準固定顧客だけになる", vi: "Chỉ toàn khách bán cố định" },
      { ja: "客数が常にゼロになる", vi: "Số khách luôn bằng 0" },
    ],
    correctIndex: 1,
    explanationVi: "Cửa hàng ở khu vực đông người qua lại (gần ga) thường có tỷ lệ khách mới (新規顧客率) cao hơn; các cửa hàng khác thường có tỷ lệ khách quen + khách bán cố định cao hơn.",
    sourceQuoteJa: "交通量の多い駅周辺では、新規顧客率が高くなり、それ以外の多くの店は固定顧客と準固定顧客の比率が高くなります。",
    sourcePage: 17,
  },
  {
    id: "sm-84",
    chapterId: "sm-ch5",
    questionJa: "「顧客管理」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Quản lý khách hàng\" (顧客管理) là gì?",
    options: [
      { ja: "新規顧客だけを増やし続けること", vi: "Chỉ liên tục tăng khách hàng mới" },
      { ja: "準固定顧客を固定客に、新規顧客を準固定顧客あるいは固定顧客にしていくこと", vi: "Biến khách bán cố định thành khách quen cố định, biến khách mới thành khách bán cố định hoặc khách quen cố định" },
      { ja: "固定顧客の情報を削除すること", vi: "Xóa thông tin của khách quen cố định" },
      { ja: "客単価だけを毎月引き上げること", vi: "Chỉ tăng đơn giá khách mỗi tháng" },
    ],
    correctIndex: 1,
    explanationVi: "顧客管理 = từng bước nâng cấp bậc khách hàng: khách bán cố định (準固定顧客) → khách quen cố định (固定顧客), khách mới (新規顧客) → khách bán cố định hoặc khách quen cố định.",
    sourceQuoteJa:
      "顧客管理とは準固定顧客を固定客に、新規顧客を準固定顧客あるいは固定顧客にしていくことが重要です。",
    sourcePage: 17,
  },
  {
    id: "sm-85",
    chapterId: "sm-ch5",
    questionJa: "固定顧客の目減りを減らすための具体策として正しいものはどれか。",
    questionVi: "Biện pháp cụ thể để giảm sự sụt giảm khách quen cố định là gì?",
    options: [
      { ja: "品質を落としてでも価格を下げる", vi: "Hạ giá kể cả phải giảm chất lượng" },
      { ja: "顔を覚え「いつもありがとうございます」と声をかけ、好みのメニューや席も覚える（品質は落とさない前提）", vi: "Nhớ mặt khách, chào \"cảm ơn quý khách đã luôn ủng hộ\", nhớ cả món/chỗ ngồi ưa thích (với điều kiện không hạ chất lượng)" },
      { ja: "できるだけ短時間で接客を終わらせる", vi: "Cố gắng kết thúc phục vụ trong thời gian ngắn nhất" },
      { ja: "毎回違うスタッフが対応するようにする", vi: "Mỗi lần để nhân viên khác nhau phục vụ" },
    ],
    correctIndex: 1,
    explanationVi: "Với tiền đề không hạ chất lượng, cần nhớ mặt khách quen, chào lời cảm ơn quen thuộc, và nhớ món/chỗ ngồi ưa thích của họ.",
    sourceQuoteJa:
      "固定顧客の目減りを減らすためには、当然品質は落とさないことは前提ですが、固定顧客の顔をしっかり覚え、あいさつの時「いつもありがとうございます」の一言を添え、好みのメニューや席なども覚えることです。",
    sourcePage: 17,
  },
  {
    id: "sm-86",
    chapterId: "sm-ch5",
    questionJa: "準固定顧客を固定顧客にしていくために、まず大切なことはどれか。",
    questionVi: "Để biến khách bán cố định thành khách quen cố định, điều quan trọng cần làm trước tiên là gì?",
    options: [
      { ja: "できるだけ顔を思い出すこと", vi: "Cố gắng nhớ lại mặt của khách" },
      { ja: "割引券を大量に配ること", vi: "Phát thật nhiều phiếu giảm giá" },
      { ja: "メニューの価格を下げること", vi: "Giảm giá thực đơn" },
      { ja: "来店を制限すること", vi: "Hạn chế lượt khách đến" },
    ],
    correctIndex: 0,
    explanationVi: "Trước tiên cần cố gắng nhớ lại mặt khách bán cố định (準固定顧客), rồi chào hỏi như với khách quen cố định — điều này làm tăng tần suất họ quay lại.",
    sourceQuoteJa:
      "準固定顧客を固定顧客にしていくためには、まず顔をできるだけ思い出すことが大切です。準固定顧客の顔を思い出して固定顧客同様にあいさつすれば来店頻度が増えていきます。",
    sourcePage: 17,
  },
  {
    id: "sm-87",
    chapterId: "sm-ch5",
    questionJa: "新規顧客に再来店してもらうために重要なことはどれか。",
    questionVi: "Để khiến khách hàng mới quay lại lần sau, điều quan trọng là gì?",
    options: [
      { ja: "QSCレベルを全体的に上げていくこと", vi: "Nâng cao toàn diện mức độ QSC" },
      { ja: "初回来店時に強く値引きを迫ること", vi: "Ép giảm giá mạnh ngay lần đến đầu tiên" },
      { ja: "新規顧客の情報を記録しないこと", vi: "Không ghi lại thông tin khách hàng mới" },
      { ja: "固定顧客より優先的に扱わないこと", vi: "Không ưu tiên hơn khách quen cố định" },
    ],
    correctIndex: 0,
    explanationVi: "Với khách mới, việc nâng cao toàn diện mức QSC (Chất lượng-Dịch vụ-Sạch sẽ, đã học ở sm-ch1) là điều dẫn đến khả năng họ quay lại.",
    sourceQuoteJa: "新規顧客には、QSCレベルを全体的に上げていくことにより、再来店してもらえることに繋がります。",
    sourcePage: 17,
  },
  {
    id: "sm-88",
    chapterId: "sm-ch5",
    questionJa: "口コミによって新規顧客が来店する機会はどのように生まれるか。",
    questionVi: "Cơ hội khách hàng mới đến quán qua truyền miệng (口コミ) được tạo ra như thế nào?",
    options: [
      { ja: "友人や知人に推奨してもらえることで口コミが広がる", vi: "Nhờ được bạn bè/người quen giới thiệu, tin truyền miệng lan tỏa" },
      { ja: "広告費を大量に投入することでのみ生まれる", vi: "Chỉ sinh ra khi đổ thật nhiều tiền quảng cáo" },
      { ja: "SNSを完全に停止することで生まれる", vi: "Sinh ra khi ngừng hoàn toàn mạng xã hội" },
      { ja: "既存客を減らすことで生まれる", vi: "Sinh ra bằng cách giảm khách hiện tại" },
    ],
    correctIndex: 0,
    explanationVi: "Khi khách hàng được bạn bè/người quen giới thiệu (推奨), tin truyền miệng đó tạo cơ hội cho khách hàng mới đến quán.",
    sourceQuoteJa: "また、友人や知人に推奨してもらえると、その口コミで新規顧客として来店してもらえる機会につながります。",
    sourcePage: 17,
  },
  {
    id: "sm-89",
    chapterId: "sm-ch6",
    questionJa: "使用者が労働者を働かせられる原則の労働時間はどれか。",
    questionVi: "Giờ lao động nguyên tắc mà người sử dụng lao động được phép cho người lao động làm việc là bao nhiêu?",
    options: [
      { ja: "1日6時間、1週30時間", vi: "1 ngày 6 giờ, 1 tuần 30 giờ" },
      { ja: "1日8時間、1週40時間", vi: "1 ngày 8 giờ, 1 tuần 40 giờ" },
      { ja: "1日10時間、1週50時間", vi: "1 ngày 10 giờ, 1 tuần 50 giờ" },
      { ja: "1日12時間、1週60時間", vi: "1 ngày 12 giờ, 1 tuần 60 giờ" },
    ],
    correctIndex: 1,
    explanationVi:
      "Nguyên tắc: 1 ngày 8 giờ, 1 tuần 40 giờ (riêng thương mại/điện ảnh-sân khấu/y tế vệ sinh/dịch vụ ăn uống-giải trí với dưới 10 lao động thường xuyên thì 1 tuần 44 giờ).",
    sourceQuoteJa:
      "使用者は原則として、１日８時間、１週当たり４０時間（商業、映画・演劇業（映画製作の事業を除く）、保健衛生業及び接客娯楽業（飲食店など）であって、常時使用する労働者が１０人未満の事業場は、１週当たり４４時間）以内で労働者を働かせなければなりません。",
    sourcePage: 18,
  },
  {
    id: "sm-90",
    chapterId: "sm-ch6",
    questionJa: "週40時間を超えて労働者を働かせるために、使用者側と従業員代表は何を締結し労働基準監督署に届け出る必要があるか。",
    questionVi: "Để cho người lao động làm việc quá 40 giờ/tuần, phía sử dụng lao động và đại diện nhân viên cần ký kết và nộp gì cho Sở Giám sát Tiêu chuẩn Lao động?",
    options: [
      { ja: "労働基準法第36条に基づく労使協定（36協定）", vi: "Thỏa ước lao động theo Điều 36 Luật Tiêu chuẩn Lao động (Thỏa ước 36)" },
      { ja: "就業規則の写し", vi: "Bản sao nội quy lao động" },
      { ja: "有給休暇申請書", vi: "Đơn xin nghỉ phép có lương" },
      { ja: "採用通知書", vi: "Thông báo trúng tuyển" },
    ],
    correctIndex: 0,
    explanationVi: "Cần ký thỏa ước lao động theo Điều 36 Luật Tiêu chuẩn Lao động (thường gọi là \"36協定\") và nộp cho Sở Giám sát Tiêu chuẩn Lao động thì mới được kéo dài giờ làm.",
    sourceQuoteJa:
      "４０時間を超えて働いてもらうためには、使用者側と従業員代表が労働基準法第３６条に基づく労使協定（いわゆる３６協定）を締結して労働基準監督署に届け出れば労働時間が延長できます。",
    sourcePage: 18,
  },
  {
    id: "sm-91",
    chapterId: "sm-ch6",
    questionJa: "週40時間を超えた労働（時間外労働）には、何％以上の割増賃金を支払う必要があるか。",
    questionVi: "Lao động vượt quá 40 giờ/tuần (làm thêm giờ) cần trả lương phụ trội tối thiểu bao nhiêu %?",
    options: [
      { ja: "10％以上", vi: "Từ 10% trở lên" },
      { ja: "15％以上", vi: "Từ 15% trở lên" },
      { ja: "25％以上", vi: "Từ 25% trở lên" },
      { ja: "40％以上", vi: "Từ 40% trở lên" },
    ],
    correctIndex: 2,
    explanationVi: "Lao động vượt 40 giờ/tuần (時間外労働) cần trả lương phụ trội tối thiểu 25%.",
    sourceQuoteJa: "週４０時間を超えた労働（時間外労働）時間は割増賃金（２５％以上）を支払う必要があります。",
    sourcePage: 18,
  },
  {
    id: "sm-92",
    chapterId: "sm-ch6",
    questionJa: "「深夜労働」と定義される時間帯はどれか。",
    questionVi: "Khung giờ được định nghĩa là \"lao động ban đêm\" (深夜労働) là khi nào?",
    options: [
      { ja: "20時から翌朝6時", vi: "20h đến 6h sáng hôm sau" },
      { ja: "22時から翌朝5時", vi: "22h đến 5h sáng hôm sau" },
      { ja: "0時から翌朝8時", vi: "0h đến 8h sáng hôm sau" },
      { ja: "18時から翌朝4時", vi: "18h đến 4h sáng hôm sau" },
    ],
    correctIndex: 1,
    explanationVi: "深夜労働 (lao động ban đêm) được định nghĩa là khung giờ từ 22h đến 5h sáng hôm sau, cũng cần trả lương phụ trội tối thiểu 25%.",
    sourceQuoteJa:
      "また、２２時から翌朝５時の間の労働（深夜労働）時間にも割増賃金（２５％以上）を支払う必要があり",
    sourcePage: 18,
  },
  {
    id: "sm-93",
    chapterId: "sm-ch6",
    questionJa: "深夜労働の時間帯がそのまま残業（時間外労働）にもなっている場合、割増賃金率はどれか。",
    questionVi: "Nếu khung giờ lao động ban đêm đồng thời cũng là làm thêm giờ (残業), tỷ lệ lương phụ trội là bao nhiêu?",
    options: [
      { ja: "25％以上", vi: "Từ 25% trở lên" },
      { ja: "50％以上", vi: "Từ 50% trở lên" },
      { ja: "60％以上", vi: "Từ 60% trở lên" },
      { ja: "75％以上", vi: "Từ 75% trở lên" },
    ],
    correctIndex: 1,
    explanationVi: "Khi 時間外労働 (làm thêm giờ) trùng với 深夜労働 (ban đêm), tỷ lệ phụ trội tăng lên tối thiểu 50%.",
    sourceQuoteJa:
      "その時間帯が残業（時間外労働）になっていれば５０％以上の割増賃金となります。",
    sourcePage: 18,
  },
  {
    id: "sm-94",
    chapterId: "sm-ch6",
    questionJa: "労働時間の延長は原則どの範囲内で定める必要があるか。",
    questionVi: "Việc kéo dài giờ lao động về nguyên tắc phải nằm trong phạm vi nào?",
    options: [
      { ja: "1か月30時間、1年200時間以内", vi: "1 tháng 30 giờ, 1 năm 200 giờ" },
      { ja: "1か月60時間、1年500時間以内", vi: "1 tháng 60 giờ, 1 năm 500 giờ" },
      { ja: "1か月100時間、1年1000時間以内", vi: "1 tháng 100 giờ, 1 năm 1000 giờ" },
      { ja: "1か月45時間、1年360時間以内", vi: "1 tháng 45 giờ, 1 năm 360 giờ" },
    ],
    correctIndex: 3,
    explanationVi: "Nguyên tắc: kéo dài giờ lao động tối đa 45 giờ/tháng, 360 giờ/năm.",
    sourceQuoteJa: "ただし、労働時間の延長は、１か月４５時間、１年３６０時間以内で定めることが原則です。",
    sourcePage: 18,
  },
  {
    id: "sm-95",
    chapterId: "sm-ch6",
    questionJa: "残業時間が月60時間を超えた分については、割増賃金率はどうなるか。",
    questionVi: "Phần giờ làm thêm vượt quá 60 giờ/tháng thì tỷ lệ lương phụ trội là bao nhiêu?",
    options: [
      { ja: "通常と同じ25％のまま", vi: "Vẫn giữ nguyên 25% như bình thường" },
      { ja: "50％の割増賃金となる", vi: "Trở thành 50%" },
      { ja: "割増賃金は不要になる", vi: "Không cần trả phụ trội nữa" },
      { ja: "10％に下がる", vi: "Giảm xuống còn 10%" },
    ],
    correctIndex: 1,
    explanationVi: "Đến 60 giờ làm thêm/tháng thì áp dụng mức phụ trội thông thường (25%); phần VƯỢT quá 60 giờ đó áp dụng mức 50%.",
    sourceQuoteJa: "残業時間が月６０時間までは通常の割増賃金となりますが、それを超えた時間は５０％の割増賃金となります。",
    sourcePage: 18,
  },
  {
    id: "sm-96",
    chapterId: "sm-ch6",
    questionJa: "休日労働と深夜労働が重複する場合の割増賃金率はどれか。",
    questionVi: "Khi lao động ngày nghỉ (休日労働) trùng với lao động ban đêm (深夜労働), tỷ lệ phụ trội là bao nhiêu?",
    options: [
      { ja: "25%以上", vi: "Từ 25% trở lên" },
      { ja: "50%以上", vi: "Từ 50% trở lên" },
      { ja: "60%以上", vi: "Từ 60% trở lên" },
      { ja: "75%以上", vi: "Từ 75% trở lên" },
    ],
    correctIndex: 2,
    explanationVi: "休日労働＋深夜労働 (lao động ngày nghỉ + ban đêm) trùng nhau: tỷ lệ phụ trội tối thiểu 60%.",
    sourceQuoteJa: "休日労働と重複する場合：６０%以上（休日労働＋深夜労働）",
    sourcePage: 18,
  },
  {
    id: "sm-97",
    chapterId: "sm-ch6",
    questionJa: "月60時間を超える残業労働と深夜労働が重複する場合の割増賃金率はどれか。",
    questionVi: "Khi làm thêm giờ vượt quá 60 giờ/tháng trùng với lao động ban đêm, tỷ lệ phụ trội là bao nhiêu?",
    options: [
      { ja: "50%以上", vi: "Từ 50% trở lên" },
      { ja: "60%以上", vi: "Từ 60% trở lên" },
      { ja: "75%以上", vi: "Từ 75% trở lên" },
      { ja: "100%以上", vi: "Từ 100% trở lên" },
    ],
    correctIndex: 2,
    explanationVi: "Đây là mức phụ trội cao nhất trong bảng: 超60時間残業＋深夜労働 (làm thêm vượt 60h/tháng + ban đêm) = tối thiểu 75%.",
    sourceQuoteJa: "月超６０時間残業労働と重複する場合：７５%以上（超６０時間残業＋深夜労働）",
    sourcePage: 18,
  },
  {
    id: "sm-98",
    chapterId: "sm-ch6",
    questionJa: "労働時間が8時間を超える場合、労働時間の途中に与えなければならない休憩時間はどれくらいか。",
    questionVi: "Nếu giờ lao động vượt quá 8 tiếng, cần cho nghỉ giữa giờ tối thiểu bao lâu?",
    options: [
      { ja: "30分以上", vi: "Từ 30 phút trở lên" },
      { ja: "45分以上", vi: "Từ 45 phút trở lên" },
      { ja: "60分以上", vi: "Từ 60 phút trở lên" },
      { ja: "90分以上", vi: "Từ 90 phút trở lên" },
    ],
    correctIndex: 2,
    explanationVi: "Lao động >6 giờ: nghỉ tối thiểu 45 phút. Lao động >8 giờ: nghỉ tối thiểu 60 phút.",
    sourceQuoteJa:
      "使用者は原則として、労働時間が１日６時間を超える場合は４５分以上、８時間を超える場合は６０分以上の休憩を労働時間の途中に与えなければなりません。",
    sourcePage: 18,
  },
  {
    id: "sm-99",
    chapterId: "sm-ch6",
    questionJa: "休憩時間の設定について、してはいけないことはどれか。",
    questionVi: "Về việc bố trí giờ nghỉ giữa ca, điều KHÔNG được phép làm là gì?",
    options: [
      { ja: "休憩時間を労働時間の途中に設定する", vi: "Bố trí giờ nghỉ vào giữa ca làm" },
      { ja: "休憩時間を始業直後や終業直前に設定する", vi: "Bố trí giờ nghỉ ngay sau khi bắt đầu ca hoặc ngay trước khi kết thúc ca" },
      { ja: "休憩時間を法定の長さ以上にする", vi: "Cho nghỉ dài hơn mức luật định" },
      { ja: "休憩時間中は労働から解放する", vi: "Giải phóng người lao động khỏi công việc trong giờ nghỉ" },
    ],
    correctIndex: 1,
    explanationVi: "Luật cấm bố trí giờ nghỉ ngay đầu ca (始業直後) hoặc ngay cuối ca (終業直前) — giờ nghỉ phải nằm giữa ca làm việc thực sự.",
    sourceQuoteJa: "休憩時間を始業直後や終業直前に設定することはできません。",
    sourcePage: 18,
  },
  {
    id: "sm-100",
    chapterId: "sm-ch6",
    questionJa: "使用者が労働者に与えなければならない休日の原則はどれか。",
    questionVi: "Nguyên tắc về ngày nghỉ mà người sử dụng lao động phải cho người lao động là gì?",
    options: [
      { ja: "1週間に1日、もしくは4週間を通じて4日以上", vi: "1 ngày/tuần, hoặc tối thiểu 4 ngày trong 4 tuần" },
      { ja: "1か月に1日のみ", vi: "Chỉ 1 ngày/tháng" },
      { ja: "1年間に10日のみ", vi: "Chỉ 10 ngày/năm" },
      { ja: "休日は法律で定められていない", vi: "Luật không quy định về ngày nghỉ" },
    ],
    correctIndex: 0,
    explanationVi: "休日 (ngày nghỉ) nguyên tắc: tối thiểu 1 ngày/tuần, hoặc tối thiểu 4 ngày trong mỗi chu kỳ 4 tuần.",
    sourceQuoteJa: "さらに休日は１週間に１日か、もしくは４週間を通じて４日以上与えなければなりません。",
    sourcePage: 18,
  },
  {
    id: "sm-101",
    chapterId: "sm-ch6",
    questionJa: "有給休暇が発生する条件として正しいものはどれか。",
    questionVi: "Điều kiện để phát sinh quyền nghỉ phép có lương là gì?",
    options: [
      { ja: "雇い入れの日から6か月を経過し、その期間の全労働日の8割以上出勤した場合", vi: "Sau 6 tháng kể từ ngày tuyển dụng, và đã đi làm từ 80% số ngày công trở lên trong giai đoạn đó" },
      { ja: "雇い入れ初日から自動的に発生する", vi: "Tự động phát sinh ngay từ ngày đầu tuyển dụng" },
      { ja: "1年間勤務すれば無条件で発生する", vi: "Chỉ cần làm việc 1 năm là phát sinh vô điều kiện" },
      { ja: "正社員のみに発生し、パート・アルバイトには発生しない", vi: "Chỉ phát sinh cho nhân viên chính thức, không áp dụng cho làm thêm/thời vụ" },
    ],
    correctIndex: 0,
    explanationVi: "Điều kiện: đã qua 6 tháng kể từ ngày tuyển dụng VÀ đi làm đủ từ 80% số ngày công trở lên trong giai đoạn đó (áp dụng cho cả lao động thời vụ đủ điều kiện về giờ/ngày công, xem bảng イ ở trang 19).",
    sourceQuoteJa: "① 雇い入れの日から６か月を経過しその期間の全労働日の８割以上出勤した場合、有給休暇が発生します。",
    sourcePage: 18,
  },
  {
    id: "sm-102",
    chapterId: "sm-ch6",
    questionJa: "一般の労働者（週5日以上勤務）の場合、勤続0.5年で付与される有給休暇日数はどれか。",
    questionVi: "Với lao động thông thường (làm ≥5 ngày/tuần), sau 0.5 năm thâm niên được cấp bao nhiêu ngày nghỉ phép có lương?",
    options: [
      { ja: "5日", vi: "5 ngày" },
      { ja: "15日", vi: "15 ngày" },
      { ja: "20日", vi: "20 ngày" },
      { ja: "10日", vi: "10 ngày" },
    ],
    correctIndex: 3,
    explanationVi: "Theo bảng付与日数 cho lao động thông thường: 0.5 năm=10 ngày, 1.5 năm=11, 2.5 năm=12, 3.5 năm=14, 4.5 năm=16, 5.5 năm=18, từ 6.5 năm trở lên=20 ngày.",
    sourceQuoteJa:
      "ア 一般の労働者（所定労働日数が週５日以上または週の所定労働時間が３０時間以上の労働者）勤続勤務年数（年） ０.５ １.５ ２.５ ３.５ ４.５ ５.５ ６.５以上 付与日数（日） １０ １１ １２ １４ １６ １８ ２０",
    sourcePage: 18,
  },
  {
    id: "sm-103",
    chapterId: "sm-ch6",
    questionJa: "「時季変更権」が使用者に認められるのはどのような場合か。",
    questionVi: "Người sử dụng lao động được công nhận \"quyền thay đổi thời điểm nghỉ\" (時季変更権) trong trường hợp nào?",
    options: [
      { ja: "労働者が時季指定した日に有給休暇を取得されることが事業の正常な運営を妨げる場合", vi: "Khi việc cho nghỉ phép vào đúng ngày người lao động chọn sẽ cản trở vận hành bình thường của doanh nghiệp" },
      { ja: "労働者が有給休暇を申請しなかった場合", vi: "Khi người lao động không xin nghỉ phép" },
      { ja: "労働者が遅刻した場合", vi: "Khi người lao động đi trễ" },
      { ja: "使用者が単に気分を害した場合", vi: "Khi người sử dụng lao động đơn giản là không thích" },
    ],
    correctIndex: 0,
    explanationVi: "時季変更権 chỉ được công nhận khi việc nghỉ đúng ngày người lao động chọn sẽ cản trở vận hành bình thường của doanh nghiệp — không phải quyền tùy ý từ chối nghỉ phép.",
    sourceQuoteJa:
      "労働者が時季指定した日に有給休暇を取得されることが事業の正常な運営を妨げる場合には、使用者に時季変更権が認められます。",
    sourcePage: 19,
  },
  {
    id: "sm-104",
    chapterId: "sm-ch6",
    questionJa: "使用者に課される有給休暇取得に関する義務として正しいものはどれか。",
    questionVi: "Nghĩa vụ của người sử dụng lao động liên quan đến việc cho nghỉ phép có lương là gì?",
    options: [
      { ja: "10日以上の年次有給休暇が付与される労働者について、年に5日の有給休暇を取得させる義務", vi: "Với lao động được cấp từ 10 ngày phép/năm trở lên, phải đảm bảo họ nghỉ ít nhất 5 ngày/năm" },
      { ja: "全労働者に年20日の有給休暇取得を義務付ける", vi: "Bắt buộc mọi lao động nghỉ 20 ngày/năm" },
      { ja: "有給休暇の取得は完全に労働者の自由で使用者に義務はない", vi: "Việc nghỉ phép hoàn toàn tùy ý người lao động, người sử dụng lao động không có nghĩa vụ gì" },
      { ja: "有給休暇を取得させないことが使用者の義務", vi: "Nghĩa vụ của người sử dụng lao động là KHÔNG cho nghỉ phép" },
    ],
    correctIndex: 0,
    explanationVi: "Người sử dụng lao động có nghĩa vụ đảm bảo lao động được cấp ≥10 ngày phép/năm phải thực sự nghỉ ít nhất 5 ngày/năm.",
    sourceQuoteJa: "使用者は１０日以上の年次有給休暇が付与される労働者については、年に５日の有給休暇を取得させる義務が課されています。",
    sourcePage: 19,
  },
  {
    id: "sm-105",
    chapterId: "sm-ch6",
    questionJa: "採用面接で履歴書を確認する際、年齢についてどうすべきか。",
    questionVi: "Khi kiểm tra sơ yếu lý lịch trong phỏng vấn tuyển dụng, cần làm gì với thông tin tuổi?",
    options: [
      { ja: "年齢は本人の口頭申告のみで信用する", vi: "Chỉ tin vào lời khai miệng của ứng viên về tuổi" },
      { ja: "証明書などの提示を求め、写真と本人を見比べて一致していることを確認する", vi: "Yêu cầu xuất trình giấy tờ chứng minh, đối chiếu ảnh với người thật để xác nhận khớp nhau" },
      { ja: "年齢の確認は一切不要", vi: "Hoàn toàn không cần xác nhận tuổi" },
      { ja: "年齢は履歴書に書いてあれば自動的に正しいとみなす", vi: "Cứ ghi trong sơ yếu lý lịch là mặc nhiên coi là đúng" },
    ],
    correctIndex: 1,
    explanationVi: "Cần yêu cầu xuất trình giấy tờ chứng minh (CMND/thẻ lưu trú...) và đối chiếu ảnh với người thật để xác nhận đúng là chính chủ.",
    sourceQuoteJa: "履歴書を確認する。（年齢は証明書などの提示を求め、写真と本人を見比べて一致していることを確認する）",
    sourcePage: 19,
  },
  {
    id: "sm-106",
    chapterId: "sm-ch6",
    questionJa: "採用面接で時間帯について確認すべきことはどれか。",
    questionVi: "Về khung giờ làm việc, điều cần xác nhận trong phỏng vấn tuyển dụng là gì?",
    options: [
      { ja: "採用したい時間帯と希望時間帯を確認し、合わない場合は希望時間帯の変更が可能か確認する", vi: "Xác nhận khung giờ muốn tuyển và khung giờ ứng viên mong muốn, nếu không khớp thì hỏi xem có thể đổi được không" },
      { ja: "時間帯の確認は面接では不要、入社後に決める", vi: "Không cần xác nhận khung giờ lúc phỏng vấn, để sau khi nhận việc mới quyết" },
      { ja: "希望時間帯は一切考慮しない", vi: "Hoàn toàn không xem xét khung giờ ứng viên mong muốn" },
      { ja: "必ず全時間帯対応可能な人のみ採用する", vi: "Chỉ tuyển người có thể làm mọi khung giờ" },
    ],
    correctIndex: 0,
    explanationVi: "Cần đối chiếu khung giờ cửa hàng muốn tuyển với khung giờ ứng viên mong muốn, và nếu lệch nhau thì hỏi xem có thể điều chỉnh được không.",
    sourceQuoteJa: "採用したい時間帯と希望時間帯を確認し、合わない場合は希望時間帯の変更が可能か確認する。",
    sourcePage: 19,
  },
  {
    id: "sm-107",
    chapterId: "sm-ch6",
    questionJa: "採用面接の最後の項目「⑦」で述べられている注意点はどれか。",
    questionVi: "Điểm lưu ý được nêu ở bước cuối cùng (⑦) của quy trình phỏng vấn tuyển dụng là gì?",
    options: [
      { ja: "採用の場合でも、その場でその旨を告げない（理由は関係部署に了承を得るため）", vi: "Kể cả khi quyết định tuyển, KHÔNG thông báo ngay tại chỗ (vì cần xin sự đồng ý của bộ phận liên quan)" },
      { ja: "採用の場合は必ずその場で即決を伝える", vi: "Nếu tuyển thì bắt buộc phải báo quyết định ngay tại chỗ" },
      { ja: "不採用の場合のみその場で伝える", vi: "Chỉ báo ngay tại chỗ nếu KHÔNG tuyển" },
      { ja: "結果は一切連絡しない", vi: "Không liên lạc kết quả gì cả" },
    ],
    correctIndex: 0,
    explanationVi: "Kể cả khi đã quyết định tuyển, không nên báo ngay tại buổi phỏng vấn — vì cần xin sự đồng ý (了承) từ các bộ phận liên quan trước.",
    sourceQuoteJa: "採用の場合でも、その場でその旨を告げない。理由は関係部署に了承を得るため。",
    sourcePage: 19,
  },
  {
    id: "sm-108",
    chapterId: "sm-ch6",
    questionJa: "採用初日のオリエンテーションで最初に教えることはどれか。",
    questionVi: "Trong ngày đầu định hướng nhân viên mới, điều được dạy đầu tiên là gì?",
    options: [
      { ja: "ハウスルール（出退勤の仕方、制服の着用や身だしなみルール、手洗いなどの衛生管理など）店内で働く上での基本", vi: "Nội quy nhà hàng (cách chấm công, quy định đồng phục/tác phong, vệ sinh như rửa tay...) — những điều cơ bản khi làm việc trong quán" },
      { ja: "即座に一人でホールに立たせる", vi: "Cho đứng một mình ở khu vực phục vụ ngay lập tức" },
      { ja: "給与計算の方法", vi: "Cách tính lương" },
      { ja: "本部の経営戦略資料", vi: "Tài liệu chiến lược kinh doanh của trụ sở chính" },
    ],
    correctIndex: 0,
    explanationVi: "Ngày đầu tiên bắt đầu bằng việc dạy Nội quy nhà hàng (ハウスルール) — các điều cơ bản khi làm việc: cách chấm công, đồng phục/tác phong, vệ sinh cá nhân...",
    sourceQuoteJa:
      "初日はオリエンテーションとハウスルール（出退勤の仕方、制服の着用や身だしなみルール、手洗いなどの衛生管理など）店内で働く上での基本を教えます。",
    sourcePage: 19,
  },
  {
    id: "sm-109",
    chapterId: "sm-ch6",
    questionJa: "採用初日、店舗の設備や配置を説明して案内することを何と呼ぶか。",
    questionVi: "Việc giới thiệu và hướng dẫn về thiết bị, cách bố trí cửa hàng trong ngày đầu tiên được gọi là gì?",
    options: [
      { ja: "ストアツアー", vi: "Store Tour (tham quan cửa hàng)" },
      { ja: "OJT", vi: "OJT" },
      { ja: "オリエンテーション", vi: "Orientation (định hướng chung)" },
      { ja: "ハウスルール", vi: "House Rule (nội quy)" },
    ],
    correctIndex: 0,
    explanationVi: "Việc giới thiệu thiết bị/cách bố trí cửa hàng gọi là ストアツアー (Store Tour), diễn ra sau phần dạy ハウスルール.",
    sourceQuoteJa: "次に店舗の設備や配置を説明して案内（ストアツアー）し、スタッフを紹介します。",
    sourcePage: 19,
  },
  {
    id: "sm-110",
    chapterId: "sm-ch7",
    questionJa: "トレーニング開始時にトレーニーへ説明すべき7つの要素に含まれないものはどれか。",
    questionVi: "Trong 7 yếu tố cần giải thích cho học viên khi bắt đầu đào tạo một kỹ năng, yếu tố nào KHÔNG có?",
    options: [
      { ja: "目的（何のためにおこなうのか）", vi: "Mục đích (làm để làm gì)" },
      { ja: "給与（いくらもらえるか）", vi: "Lương (được trả bao nhiêu)" },
      { ja: "道具（何を使用するのか）", vi: "Dụng cụ (dùng cái gì)" },
      { ja: "時間（完了までの標準時間）", vi: "Thời gian (thời gian chuẩn để hoàn thành)" },
    ],
    correctIndex: 1,
    explanationVi: "7 yếu tố cần giải thích trước khi đào tạo: 目的/方法/道具/手順/量/質/時間 (Mục đích/Cách làm/Dụng cụ/Trình tự/Phạm vi/Chất lượng/Thời gian) — KHÔNG bao gồm lương.",
    sourceQuoteJa:
      "あるスキル（例えばクリンリネスのための清掃作業を想像して下さい。）について、以下の要素を初めにトレーニーに説明し、指導します。① 目的 何のために、そのサービスや作業をおこなうのか② 方法 どのように、そのサービスや作業を実施するのか③ 道具 道具は何を使用するのか④ 手順 その道具をどのような順序でどのように使うのか⑤ 量 どこからどこまでが対象範囲か⑥ 質 どのレベルに仕上げるのか⑦ 時間 完了までの標準時間（あるべき時間）はどの位が適正なのか",
    sourcePage: 20,
  },
  {
    id: "sm-111",
    chapterId: "sm-ch7",
    questionJa: "スキルを教える7要素のうち「量」が指すものはどれか。",
    questionVi: "Trong 7 yếu tố dạy kỹ năng, yếu tố \"Phạm vi\" (量) chỉ điều gì?",
    options: [
      { ja: "道具は何を使用するのか", vi: "Sử dụng dụng cụ gì" },
      { ja: "どのレベルに仕上げるのか", vi: "Hoàn thiện ở mức độ nào" },
      { ja: "どこからどこまでが対象範囲か", vi: "Phạm vi đối tượng từ đâu đến đâu" },
      { ja: "完了までの標準時間", vi: "Thời gian chuẩn để hoàn thành" },
    ],
    correctIndex: 2,
    explanationVi: "「量」 = phạm vi đối tượng công việc, từ đâu đến đâu là thuộc phạm vi cần làm. (Khác với「質」= mức độ hoàn thiện.)",
    sourceQuoteJa: "⑤ 量 どこからどこまでが対象範囲か",
    sourcePage: 20,
  },
  {
    id: "sm-112",
    chapterId: "sm-ch7",
    questionJa: "スキルを教える7要素のうち「質」が指すものはどれか。",
    questionVi: "Trong 7 yếu tố dạy kỹ năng, yếu tố \"Chất lượng\" (質) chỉ điều gì?",
    options: [
      { ja: "どこからどこまでが対象範囲か", vi: "Phạm vi đối tượng từ đâu đến đâu" },
      { ja: "どのレベルに仕上げるのか", vi: "Hoàn thiện ở mức độ nào" },
      { ja: "何のためにおこなうのか", vi: "Làm để làm gì" },
      { ja: "どのように実施するのか", vi: "Thực hiện như thế nào" },
    ],
    correctIndex: 1,
    explanationVi: "「質」 = mức độ chất lượng cần đạt được khi hoàn thành công việc.",
    sourceQuoteJa: "⑥ 質 どのレベルに仕上げるのか",
    sourcePage: 20,
  },
  {
    id: "sm-113",
    chapterId: "sm-ch7",
    questionJa: "人材育成の基本体系4段階の正しい順序はどれか。",
    questionVi: "Thứ tự đúng của 4 giai đoạn trong hệ thống cơ bản đào tạo nhân sự là gì?",
    options: [
      { ja: "訓練→教育→啓発→導入", vi: "Huấn luyện → Giáo dục → Khai mở → Định hướng" },
      { ja: "教育→導入→訓練→啓発", vi: "Giáo dục → Định hướng → Huấn luyện → Khai mở" },
      { ja: "導入→啓発→教育→訓練", vi: "Định hướng → Khai mở → Giáo dục → Huấn luyện" },
      { ja: "啓発→訓練→導入→教育", vi: "Khai mở → Huấn luyện → Định hướng → Giáo dục" },
    ],
    correctIndex: 1,
    explanationVi: "Thứ tự 4 giai đoạn: 教育 (khơi gợi mầm non/tiềm năng) → 導入 (định hướng) → 訓練 (luyện tập lặp lại) → 啓発 (khai mở/phát triển).",
    sourceQuoteJa: "教育 芽を引き出す■ 導入 方向付ける■ 訓練 反復練習する■ 啓発 開発する",
    sourcePage: 20,
  },
  {
    id: "sm-114",
    chapterId: "sm-ch7",
    questionJa: "人材育成の基本体系における「教育」の意味として正しいものはどれか。",
    questionVi: "Ý nghĩa của \"Giáo dục\" (教育) trong hệ thống đào tạo nhân sự cơ bản là gì?",
    options: [
      { ja: "反復練習する", vi: "Luyện tập lặp lại" },
      { ja: "方向付ける", vi: "Định hướng" },
      { ja: "開発する", vi: "Phát triển" },
      { ja: "芽を引き出す", vi: "Khơi gợi mầm non/tiềm năng" },
    ],
    correctIndex: 3,
    explanationVi: "「教育」 trong hệ thống này nghĩa là khơi gợi ra tiềm năng (mầm non) của người học, khác với 訓練 (luyện lặp) hay 啓発 (phát triển thêm).",
    sourceQuoteJa: "教育 芽を引き出す",
    sourcePage: 20,
  },
  {
    id: "sm-115",
    chapterId: "sm-ch7",
    questionJa: "人材育成の基本体系4段階を指導するのは誰が担当する必要があるか。",
    questionVi: "Ai cần phụ trách chỉ đạo 4 giai đoạn của hệ thống đào tạo nhân sự cơ bản?",
    options: [
      { ja: "新人アルバイトのみ", vi: "Chỉ nhân viên thời vụ mới" },
      { ja: "店や職場の責任者（マネージャー）", vi: "Người phụ trách cửa hàng/nơi làm việc (Quản lý)" },
      { ja: "本部の経理担当者のみ", vi: "Chỉ nhân viên kế toán trụ sở chính" },
      { ja: "外部のコンサルタントのみ", vi: "Chỉ tư vấn viên bên ngoài" },
    ],
    correctIndex: 1,
    explanationVi: "Việc chỉ đạo 4 giai đoạn (教育・導入・訓練・啓発) cần do người phụ trách cửa hàng/nơi làm việc (マネージャー) đảm nhận.",
    sourceQuoteJa: "この段階は店や職場の責任者（マネージャー）が担当する必要があります。",
    sourcePage: 20,
  },
  {
    id: "sm-116",
    chapterId: "sm-ch7",
    questionJa: "接客サービスの基本を身につける方法として正しいものはどれか。",
    questionVi: "Phương pháp đúng để tiếp thu nền tảng dịch vụ tiếp khách là gì?",
    options: [
      { ja: "マニュアルを一度読むだけで十分", vi: "Chỉ cần đọc quy trình một lần là đủ" },
      { ja: "先輩の真似は一切禁止", vi: "Tuyệt đối cấm bắt chước tiền bối" },
      { ja: "「型」を学び、反復練習（トレーニング）をする中で体得する", vi: "Học \"khuôn mẫu\" và tự thấm nhuần qua việc luyện tập lặp lại (đào tạo)" },
      { ja: "個人の感覚だけに頼る", vi: "Chỉ dựa vào cảm tính cá nhân" },
    ],
    correctIndex: 2,
    explanationVi: "接客サービスの基本 được tiếp thu bằng cách học \"khuôn mẫu\" (型) rồi thấm nhuần qua luyện tập lặp lại.",
    sourceQuoteJa: "接客サービスの基本は「型」を学び、反復練習（トレーニング）をする中で体得することです。",
    sourcePage: 20,
  },
  {
    id: "sm-117",
    chapterId: "sm-ch7",
    questionJa: "サービスを表現する3つの要素として正しい組み合わせはどれか。",
    questionVi: "3 yếu tố thể hiện dịch vụ đúng là gì?",
    options: [
      { ja: "価格・品質・清潔さ", vi: "Giá cả - Chất lượng - Sạch sẽ" },
      { ja: "速度・正確さ・丁寧さ", vi: "Tốc độ - Chính xác - Lịch sự" },
      { ja: "経験・知識・資格", vi: "Kinh nghiệm - Kiến thức - Bằng cấp" },
      { ja: "態度・表情・言葉遣い", vi: "Thái độ - Nét mặt - Cách dùng từ" },
    ],
    correctIndex: 3,
    explanationVi: "3 yếu tố thể hiện dịch vụ: 態度 (thái độ), 表情 (nét mặt), 言葉遣い (cách dùng từ).",
    sourceQuoteJa: "サービスを表現する要素は「態度・表情・言葉遣い」です。",
    sourcePage: 20,
  },
  {
    id: "sm-118",
    chapterId: "sm-ch7",
    questionJa: "コミュニケーションにおいて、言葉そのものより大きな影響を及ぼすものはどれか。",
    questionVi: "Trong giao tiếp, điều gì có ảnh hưởng lớn hơn cả bản thân từ ngữ?",
    options: [
      { ja: "文法の正確さのみ", vi: "Chỉ sự chính xác về ngữ pháp" },
      { ja: "話す速度のみ", vi: "Chỉ tốc độ nói" },
      { ja: "言葉遣いや表情", vi: "Cách dùng từ và nét mặt" },
      { ja: "使用する単語数のみ", vi: "Chỉ số lượng từ sử dụng" },
    ],
    correctIndex: 2,
    explanationVi: "Trong giao tiếp, 言葉遣いや表情 (cách dùng từ và nét mặt) có ảnh hưởng lớn hơn chính bản thân nội dung từ ngữ.",
    sourceQuoteJa: "中でもコミュニケーションには、言葉そのものより言葉遣いや表情のほうが大きな影響を及ぼします。",
    sourcePage: 20,
  },
  {
    id: "sm-119",
    chapterId: "sm-ch7",
    questionJa: "サービスの3要素のうち「言葉遣い」のポイントとして正しいものはどれか。",
    questionVi: "Trong 3 yếu tố dịch vụ, điểm mấu chốt của \"cách dùng từ\" (言葉遣い) là gì?",
    options: [
      { ja: "使用する敬語の種類の多さ", vi: "Số lượng loại kính ngữ sử dụng nhiều hay ít" },
      { ja: "話す速度の速さのみ", vi: "Chỉ tốc độ nói nhanh" },
      { ja: "使用する語彙の難易度", vi: "Độ khó của từ vựng sử dụng" },
      { ja: "言葉そのものではなく、声の大きさやトーン、語調といった言い方", vi: "Không phải bản thân từ ngữ, mà là cách nói: độ lớn giọng, tông giọng, nhịp điệu nói" },
    ],
    correctIndex: 3,
    explanationVi: "Điểm mấu chốt của 言葉遣い không nằm ở bản thân từ ngữ, mà ở CÁCH NÓI: độ lớn giọng, トーン (tông giọng), 語調 (nhịp điệu/cách nói).",
    sourceQuoteJa:
      "サービスの３つの要素のうち「言葉遣い」のポイントは言葉そのものではなく、声の大きさやトーン、語調といった言い方が重要です。",
    sourcePage: 20,
  },
  {
    id: "sm-120",
    chapterId: "sm-ch7",
    questionJa: "「トーン」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Tone\" (トーン) trong giao tiếp là gì?",
    options: [
      { ja: "話す時のリズム（口調）や語尾の強弱", vi: "Nhịp điệu khi nói và độ mạnh/yếu ở cuối câu" },
      { ja: "使用する語彙の量", vi: "Số lượng từ vựng sử dụng" },
      { ja: "音質、音の高低や声の抑揚（イントネーション）", vi: "Chất âm, cao độ âm thanh và ngữ điệu giọng nói" },
      { ja: "話す速度のみ", vi: "Chỉ tốc độ nói" },
    ],
    correctIndex: 2,
    explanationVi: "トーン (Tone) = chất âm, cao độ âm thanh, và ngữ điệu (intonation) của giọng nói.",
    sourceQuoteJa: "トーンとは、音質、音の高低や声の抑揚（イントネーション）のことです。",
    sourcePage: 20,
  },
  {
    id: "sm-121",
    chapterId: "sm-ch7",
    questionJa: "「語調」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"nhịp điệu nói\" (語調) là gì?",
    options: [
      { ja: "音質、音の高低や声の抑揚", vi: "Chất âm, cao độ và ngữ điệu giọng nói" },
      { ja: "話す時のリズム（口調）や語尾の強弱", vi: "Nhịp điệu khi nói (giọng điệu) và độ mạnh/yếu ở cuối câu" },
      { ja: "声の大きさのみ", vi: "Chỉ độ lớn giọng nói" },
      { ja: "使用する敬語のレベル", vi: "Mức độ kính ngữ sử dụng" },
    ],
    correctIndex: 1,
    explanationVi: "語調 = nhịp điệu/giọng điệu khi nói, và độ mạnh yếu ở cuối câu — khác với トーン (chất âm/cao độ).",
    sourceQuoteJa: "語調とは話す時のリズム（口調）や語尾の強弱などです。",
    sourcePage: 20,
  },
  {
    id: "sm-122",
    chapterId: "sm-ch7",
    questionJa: "ホスピタリティサービスを目指すための基礎訓練として本文が挙げているものはどれか。",
    questionVi: "Bài huấn luyện nền tảng để hướng đến dịch vụ hiếu khách (Hospitality) được tài liệu nêu ra là gì?",
    options: [
      { ja: "計算問題の練習", vi: "Luyện giải toán" },
      { ja: "外国語の暗記", vi: "Học thuộc ngoại ngữ" },
      { ja: "発声練習", vi: "Luyện phát âm" },
      { ja: "筋力トレーニング", vi: "Tập thể lực" },
    ],
    correctIndex: 2,
    explanationVi: "美しい日本語を正しく適切に使い、感情豊かに表現するため — cơ sở huấn luyện là 発声練習 (luyện phát âm/giọng nói).",
    sourceQuoteJa:
      "ホスピタリティサービスを目指すには、美しい日本語を正しく適切に使い、感情豊かに表現することが大切です。その基礎訓練は発声練習です。",
    sourcePage: 20,
  },
  {
    id: "sm-123",
    chapterId: "sm-ch7",
    questionJa: "「OJT」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"OJT\" (On-the-Job Training) là gì?",
    options: [
      { ja: "現場を離れておこなう集合教育", vi: "Đào tạo tập trung diễn ra bên ngoài hiện trường" },
      { ja: "オンラインでのみおこなう学習", vi: "Học tập chỉ thực hiện trực tuyến" },
      { ja: "実地訓練のことで、店舗など現場でおこなうサービスや作業の技術を体得させるトレーニング", vi: "Đào tạo thực địa — huấn luyện để thấm nhuần kỹ năng dịch vụ/công việc thực hiện ngay tại hiện trường như cửa hàng" },
      { ja: "年に1回だけおこなう研修", vi: "Đào tạo chỉ diễn ra 1 lần/năm" },
    ],
    correctIndex: 2,
    explanationVi: "OJT (On-the-Job Training) = đào tạo thực địa, thấm nhuần kỹ năng ngay tại hiện trường (cửa hàng).",
    sourceQuoteJa: "OJT は実地訓練のことで、店舗など現場でおこなうサービスや作業の技術を体得させるトレーニングです。",
    sourcePage: 21,
  },
  {
    id: "sm-124",
    chapterId: "sm-ch7",
    questionJa: "「OFFJT」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"OFFJT\" (Off-the-Job Training) là gì?",
    options: [
      { ja: "店舗の現場でのみおこなう実地訓練", vi: "Chỉ đào tạo thực địa tại cửa hàng" },
      { ja: "理念や知識を教え、現場を離れておこなう集合教育", vi: "Dạy triết lý và kiến thức, là đào tạo tập trung diễn ra bên ngoài hiện trường" },
      { ja: "トレーナー1人とトレーニー1人のマンツーマン指導のみ", vi: "Chỉ huấn luyện 1-kèm-1 giữa huấn luyện viên và học viên" },
      { ja: "採用面接のプロセス", vi: "Quy trình phỏng vấn tuyển dụng" },
    ],
    correctIndex: 1,
    explanationVi: "OFFJT (Off-the-Job Training) = dạy lý thuyết/kiến thức, là hình thức đào tạo tập trung, diễn ra tách rời khỏi hiện trường làm việc.",
    sourceQuoteJa: "OFFJT は理念や知識を教えます。これは現場を離れておこなう集合教育でおこなわれます。",
    sourcePage: 21,
  },
  {
    id: "sm-125",
    chapterId: "sm-ch7",
    questionJa: "新人を育成するプログラムを作成する際のポイントはどれか。",
    questionVi: "Điểm mấu chốt khi lập chương trình đào tạo nhân viên mới là gì?",
    options: [
      { ja: "OJTとOFFJTを組み合わせ、現場に近いトレーニーほどOJTの比率を高める", vi: "Kết hợp OJT và OFFJT, với học viên càng gần hiện trường thì tỷ lệ OJT càng cao" },
      { ja: "OFFJTのみをおこない、OJTは一切不要", vi: "Chỉ cần OFFJT, hoàn toàn không cần OJT" },
      { ja: "全員に同じ比率のOJTとOFFJTを機械的に適用する", vi: "Áp dụng máy móc cùng 1 tỷ lệ OJT/OFFJT cho tất cả mọi người" },
      { ja: "OJTのみをおこない、OFFJTは一切不要", vi: "Chỉ cần OJT, hoàn toàn không cần OFFJT" },
    ],
    correctIndex: 0,
    explanationVi: "Cần kết hợp cả OJT và OFFJT; với học viên có vị trí công việc gần hiện trường phục vụ, cần tăng tỷ lệ OJT (thực hành thực địa).",
    sourceQuoteJa:
      "新人を育成するプログラムを作成する際には、OJTとOFFJTを組み合わせることがポイントです。現場に近いトレーニーを対象としたトレーニングプログラムほど、OJTの比率を高めるようにします。",
    sourcePage: 21,
  },
  {
    id: "sm-126",
    chapterId: "sm-ch7",
    questionJa: "OJTの原則「ⅰ」として正しいものはどれか。",
    questionVi: "Nguyên tắc \"ⅰ\" của OJT là gì?",
    options: [
      { ja: "10人以上のグループで一斉におこなう", vi: "Thực hiện đồng loạt cho nhóm từ 10 người trở lên" },
      { ja: "オンラインでのみおこなう", vi: "Chỉ thực hiện trực tuyến" },
      { ja: "書類のみで完結させる", vi: "Chỉ hoàn thành qua giấy tờ" },
      { ja: "トレーナー1人とトレーニー1人のマンツーマンでおこなう", vi: "Thực hiện 1-kèm-1 giữa 1 huấn luyện viên và 1 học viên" },
    ],
    correctIndex: 3,
    explanationVi: "Nguyên tắc ⅰ của OJT: thực hiện 1 huấn luyện viên - 1 học viên (マンツーマン, kèm 1-1).",
    sourceQuoteJa: "ⅰ トレーナー１人とトレーニー１人のマンツーマンでおこなう。",
    sourcePage: 21,
  },
  {
    id: "sm-127",
    chapterId: "sm-ch7",
    questionJa: "OJTの原則「ⅱ」として正しいものはどれか。",
    questionVi: "Nguyên tắc \"ⅱ\" của OJT là gì?",
    options: [
      { ja: "トレーニーが1人でそのサービスや作業ができるようになるまでおこなう", vi: "Thực hiện cho đến khi học viên có thể tự làm được công việc/dịch vụ đó một mình" },
      { ja: "1回の説明だけで終了する", vi: "Kết thúc chỉ sau 1 lần giải thích" },
      { ja: "トレーニーの希望があるときだけおこなう", vi: "Chỉ thực hiện khi học viên yêu cầu" },
      { ja: "上級者にのみおこなう", vi: "Chỉ thực hiện cho người đã có trình độ cao" },
    ],
    correctIndex: 0,
    explanationVi: "Nguyên tắc ⅱ của OJT: tiếp tục huấn luyện cho đến khi học viên có thể tự mình thực hiện được công việc/dịch vụ đó.",
    sourceQuoteJa: "ⅱ トレーニーが１人でそのサービスや作業ができるようになるまでおこなう。",
    sourcePage: 21,
  },
  {
    id: "sm-128",
    chapterId: "sm-ch7",
    questionJa: "現場でサービスや作業をトレーニングする際、チェックしなければならない項目はどれか。",
    questionVi: "Khi đào tạo dịch vụ/công việc tại hiện trường, những điều cần kiểm tra là gì?",
    options: [
      { ja: "トレーニーの給与額のみ", vi: "Chỉ mức lương của học viên" },
      { ja: "トレーニーの出身地のみ", vi: "Chỉ quê quán của học viên" },
      { ja: "トレーニーの学歴のみ", vi: "Chỉ trình độ học vấn của học viên" },
      { ja: "トレーニーの視線や表情、声の出し方や姿勢、手の使い方", vi: "Ánh mắt, nét mặt, cách phát âm, tư thế, và cách dùng tay của học viên" },
    ],
    correctIndex: 3,
    explanationVi: "Khi huấn luyện tại hiện trường, cần kiểm tra: ánh mắt, nét mặt, cách phát âm, tư thế, và cách dùng tay của học viên.",
    sourceQuoteJa:
      "現場でサービスや作業をトレーニングするには、トレーニーの視線や表情、声の出し方や姿勢、手の使い方をチェックしなければなりません。",
    sourcePage: 21,
  },
  {
    id: "sm-129",
    chapterId: "sm-ch7",
    questionJa: "トレーニングの4ステップの正しい順序と内容の組み合わせはどれか。",
    questionVi: "Thứ tự đúng và nội dung của 4 bước đào tạo là gì?",
    options: [
      { ja: "①導入(習う気持ちにさせる)→②掲示(やって見せる)→③適用(やらせてみる)→④的確にフォローアップする(チェックする)", vi: "① Dẫn nhập (tạo tinh thần muốn học) → ② Trình diễn (làm mẫu) → ③ Áp dụng (để tự làm) → ④ Theo dõi chính xác (kiểm tra)" },
      { ja: "①適用→②導入→③フォローアップ→④掲示", vi: "① Áp dụng → ② Dẫn nhập → ③ Theo dõi → ④ Trình diễn" },
      { ja: "①フォローアップ→②適用→③掲示→④導入", vi: "① Theo dõi → ② Áp dụng → ③ Trình diễn → ④ Dẫn nhập" },
      { ja: "①掲示→②フォローアップ→③導入→④適用", vi: "① Trình diễn → ② Theo dõi → ③ Dẫn nhập → ④ Áp dụng" },
    ],
    correctIndex: 0,
    explanationVi: "4 bước đào tạo theo đúng thứ tự: ① 導入 (tạo tinh thần muốn học, qua hỏi đáp/kể chuyện liên quan) → ② 掲示 (huấn luyện viên làm mẫu, vừa giải thích vừa hướng dẫn đúng trình tự) → ③ 適用 (để học viên tự làm, huấn luyện viên quan sát) → ④ theo dõi cụ thể mức độ hiểu và làm được để hỗ trợ tiếp.",
    sourceQuoteJa:
      "① 導入・・トレーニーを習う気持ちにさせる。② 掲示・・トレーナーがやって見せる。③ 適用・・トレーニーにやらせてみる。④ 的確にフォローアップする。トレーニーがどのくらい理解しているか、できたかを具体的にチェックし、フォローアップに結び付けます。",
    sourcePage: 21,
  },
  {
    id: "sm-130",
    chapterId: "sm-ch8",
    questionJa: "「防火管理者」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Người quản lý phòng cháy\" (防火管理者) là gì?",
    options: [
      { ja: "消防署の職員のこと", vi: "Là nhân viên của sở cứu hỏa" },
      { ja: "防火管理についての消防計画を作成し、防火管理上必要な業務を計画的におこなう責任者", vi: "Người chịu trách nhiệm lập kế hoạch phòng cháy và thực hiện có kế hoạch các công việc cần thiết về quản lý phòng cháy" },
      { ja: "建物の設計をおこなう建築士", vi: "Kiến trúc sư thiết kế công trình" },
      { ja: "保険会社の担当者", vi: "Nhân viên phụ trách của công ty bảo hiểm" },
    ],
    correctIndex: 1,
    explanationVi: "防火管理者 = người lập kế hoạch phòng cháy và thực hiện có kế hoạch các công việc quản lý phòng cháy, nhằm ngăn thiệt hại do hỏa hoạn ở nơi đông người sử dụng.",
    sourceQuoteJa:
      "防火管理者とは、多数の者が利用する建物などの「火災等による被害」を防止するため、防火管理についての消防計画を作成し、防火管理上必要な業務（防火管理業務）を計画的におこなう責任者を言います。",
    sourcePage: 22,
  },
  {
    id: "sm-131",
    chapterId: "sm-ch8",
    questionJa: "防火管理者として選任されるための要件はどれか。",
    questionVi: "Điều kiện để được chọn làm Người quản lý phòng cháy là gì?",
    options: [
      { ja: "アルバイト経験が1回でもあればよい", vi: "Chỉ cần có 1 lần kinh nghiệm làm thời vụ" },
      { ja: "管理的・監督的地位にある必要があり、店長またはそれに匹敵するもので、必要な知識・技能を有する", vi: "Cần ở vị trí quản lý/giám sát — là quản lý cửa hàng hoặc tương đương, có đủ kiến thức/kỹ năng cần thiết" },
      { ja: "本部の社長のみが対象", vi: "Chỉ chủ tịch trụ sở chính mới đủ điều kiện" },
      { ja: "誰でも自由になれる、要件はない", vi: "Ai cũng có thể trở thành, không có điều kiện gì" },
    ],
    correctIndex: 1,
    explanationVi: "Người quản lý phòng cháy phải ở vị trí quản lý/giám sát (là quản lý cửa hàng hoặc tương đương) và có kiến thức/kỹ năng cần thiết về phòng cháy.",
    sourceQuoteJa:
      "防火管理者として選任するための要件は、防火管理業務を適切に遂行することができる「管理的、監督的地位」にある必要があり、そのため店長又はそれに匹敵するものである必要があります。また、防火管理上必要な「知識・技能」を有している必要があります。",
    sourcePage: 22,
  },
  {
    id: "sm-132",
    chapterId: "sm-ch8",
    questionJa: "防火管理者になるための手続きとして正しいものはどれか。",
    questionVi: "Thủ tục đúng để trở thành Người quản lý phòng cháy là gì?",
    options: [
      { ja: "防火管理新規講習を受講し資格を持ち、消防機関へ選任届出をおこなう", vi: "Tham gia khóa học mới về quản lý phòng cháy, có chứng chỉ, và nộp thông báo bổ nhiệm cho cơ quan phòng cháy chữa cháy" },
      { ja: "本部にメールを送るだけでよい", vi: "Chỉ cần gửi email cho trụ sở chính là đủ" },
      { ja: "特に手続きは不要、自称すればよい", vi: "Không cần thủ tục gì, tự xưng là được" },
      { ja: "警察署に届け出るだけでよい", vi: "Chỉ cần báo cho đồn cảnh sát" },
    ],
    correctIndex: 0,
    explanationVi: "Cần tham gia khóa học mới về quản lý phòng cháy để có chứng chỉ, và nộp thông báo bổ nhiệm cho cơ quan phòng cháy chữa cháy (消防機関).",
    sourceQuoteJa:
      "防火管理者は、防火管理新規講習などを受講し資格を持っていること、さらに消防機関へ防火管理者の選任届出をおこなうことが必要となります。",
    sourcePage: 22,
  },
  {
    id: "sm-133",
    chapterId: "sm-ch8",
    questionJa: "防火管理業務の内容として、本文に挙げられていないものはどれか。",
    questionVi: "Nội dung KHÔNG được liệt kê trong công việc quản lý phòng cháy là gì?",
    options: [
      { ja: "自衛消防隊の組織を明確化する", vi: "Xác định rõ tổ chức đội cứu hỏa tự vệ" },
      { ja: "消火、通報及び避難訓練の定期的な実施", vi: "Định kỳ thực hiện diễn tập chữa cháy, báo tin, sơ tán" },
      { ja: "収容人員の管理", vi: "Quản lý số lượng người có thể chứa" },
      { ja: "従業員の給与査定をおこなう", vi: "Đánh giá lương của nhân viên" },
    ],
    correctIndex: 3,
    explanationVi: "10 công việc quản lý phòng cháy xoay quanh: tổ chức đội cứu hỏa, diễn tập, kiểm tra thiết bị, giám sát lửa, quản lý lối thoát hiểm, quản lý số người, giáo dục phòng cháy, ứng phó khẩn cấp, liên lạc cơ quan PCCC — KHÔNG bao gồm đánh giá lương nhân viên.",
    sourceQuoteJa:
      "① 自衛消防隊の組織を明確化する。② 消火、通報及び避難訓練の定期的な実施③ 消防に必要な設備、消防用水又は消火活動上必要な設備の点検及び整備④ 火気の使用又は取扱いに関する監督⑤ 避難施設又は防火上必要な構造及び設備及び設備の管理維持⑥ 収容人員の管理",
    sourcePage: 22,
  },
  {
    id: "sm-134",
    chapterId: "sm-ch8",
    questionJa: "「燃焼三要素」として正しい組み合わせはどれか。",
    questionVi: "Tổ hợp đúng của \"3 yếu tố cháy\" (燃焼三要素) là gì?",
    options: [
      { ja: "可燃物・酸素・熱源", vi: "Vật liệu cháy - Oxy - Nguồn nhiệt" },
      { ja: "水・油・空気", vi: "Nước - Dầu - Không khí" },
      { ja: "煙・炎・灰", vi: "Khói - Lửa - Tro" },
      { ja: "電気・ガス・水道", vi: "Điện - Gas - Nước" },
    ],
    correctIndex: 0,
    explanationVi: "3 yếu tố cháy: 可燃物 (vật liệu dễ cháy), 酸素 (oxy/không khí), 熱源 (nguồn nhiệt như tia lửa gas/điện/quá nhiệt).",
    sourceQuoteJa:
      "燃焼三要素は、可燃物（燃えるもの）、酸素（空気）、熱源（ガスの炎、電気の火花、過加熱など）です。",
    sourcePage: 22,
  },
  {
    id: "sm-135",
    chapterId: "sm-ch8",
    questionJa: "「除去消火法」とはどのような方法か。",
    questionVi: "Phương pháp \"Chữa cháy bằng cách loại bỏ\" (除去消火法) là gì?",
    options: [
      { ja: "ガスの元栓を閉めるなど燃えるものを取り去ることで火を消す方法", vi: "Dập lửa bằng cách loại bỏ vật cháy, ví dụ đóng van gas" },
      { ja: "布などをかぶせ酸素を遮断する方法", vi: "Phủ vải để chặn oxy" },
      { ja: "水をかけて熱を奪う方法", vi: "Dội nước để hút nhiệt" },
      { ja: "水で薄めて火を消す方法", vi: "Pha loãng bằng nước để dập lửa" },
    ],
    correctIndex: 0,
    explanationVi: "除去消火法 = loại bỏ vật liệu cháy (ví dụ đóng van gas) để dập lửa — khác với 窒息 (chặn oxy) hay 冷却 (hút nhiệt).",
    sourceQuoteJa: "ア 除去消火法 ガスの元栓を閉めるなど燃えるものを取り去ることで火を消す方法。",
    sourcePage: 22,
  },
  {
    id: "sm-136",
    chapterId: "sm-ch8",
    questionJa: "火が上がったフライヤーに毛布やシーツをかぶせて鎮火させる方法は何と呼ばれるか。",
    questionVi: "Phương pháp phủ chăn/ga trải giường lên chảo chiên đang bốc cháy để dập lửa được gọi là gì?",
    options: [
      { ja: "冷却消火法", vi: "Chữa cháy bằng làm lạnh" },
      { ja: "窒息消火法", vi: "Chữa cháy bằng chặn oxy (ngạt)" },
      { ja: "希釈消火法", vi: "Chữa cháy bằng pha loãng" },
      { ja: "科学的消火法", vi: "Chữa cháy bằng phản ứng hóa học" },
    ],
    correctIndex: 1,
    explanationVi: "窒息消火法 = phủ vải lên vật đang cháy để chặn oxy (làm cháy \"ngạt thở\") — ví dụ phủ chăn lên chảo dầu đang cháy.",
    sourceQuoteJa:
      "イ 窒息消火法 燃えている油に布などをかぶせ酸素を遮断することで火を消す方法。火が上がったフライヤーに毛布やシーツのような布をかぶせることで一気に鎮火する。",
    sourcePage: 23,
  },
  {
    id: "sm-137",
    chapterId: "sm-ch8",
    questionJa: "消火器を使って火元に放水し鎮火させる方法は何と呼ばれるか。",
    questionVi: "Phương pháp dùng bình chữa cháy phun nước vào gốc lửa để dập tắt được gọi là gì?",
    options: [
      { ja: "除去消火法", vi: "Chữa cháy bằng loại bỏ" },
      { ja: "希釈消火法", vi: "Chữa cháy bằng pha loãng" },
      { ja: "冷却消火法", vi: "Chữa cháy bằng làm lạnh" },
      { ja: "科学的消火法", vi: "Chữa cháy bằng phản ứng hóa học" },
    ],
    correctIndex: 2,
    explanationVi: "冷却消火法 = dùng nước hút nhiệt, cắt đứt sự tiếp diễn của cháy — ví dụ dùng bình chữa cháy phun nước vào gốc lửa.",
    sourceQuoteJa:
      "ウ 冷却消火法 水をかけて熱を奪い燃焼の継続を遮断することで火を消す方法。消火器を使い火元に放水することで鎮火させる。",
    sourcePage: 23,
  },
  {
    id: "sm-138",
    chapterId: "sm-ch8",
    questionJa: "床にこぼれたアルコールに引火した場合、水をかけて薄めて鎮火させる方法は何と呼ばれるか。",
    questionVi: "Khi cồn đổ trên sàn bắt lửa, phương pháp dội nước pha loãng để dập tắt được gọi là gì?",
    options: [
      { ja: "除去消火法", vi: "Chữa cháy bằng loại bỏ" },
      { ja: "窒息消火法", vi: "Chữa cháy bằng chặn oxy" },
      { ja: "冷却消火法", vi: "Chữa cháy bằng làm lạnh" },
      { ja: "希釈消火法", vi: "Chữa cháy bằng pha loãng" },
    ],
    correctIndex: 3,
    explanationVi: "希釈消火法 = pha loãng chất cháy bằng nước (áp dụng riêng cho cồn/alcohol) để dập lửa.",
    sourceQuoteJa:
      "エ 希釈消火 燃焼しているアルコールを水で薄めて火を消す方法。床にこぼれたアルコールに引火した場合は水をかけ薄めて鎮火させる。",
    sourcePage: 23,
  },
  {
    id: "sm-139",
    chapterId: "sm-ch8",
    questionJa: "スプリンクラーが水の代わりに窒素ガスや炭酸ガスを充満させて酸素と反応させないようにする消火方法は何と呼ばれるか。",
    questionVi: "Phương pháp chữa cháy khiến hệ thống sprinkler xả khí nitơ/carbonic thay vì nước, để ngăn phản ứng với oxy, được gọi là gì?",
    options: [
      { ja: "除去消火法", vi: "Chữa cháy bằng loại bỏ" },
      { ja: "冷却消火法", vi: "Chữa cháy bằng làm lạnh" },
      { ja: "希釈消火法", vi: "Chữa cháy bằng pha loãng" },
      { ja: "科学的消火法", vi: "Chữa cháy bằng phản ứng hóa học" },
    ],
    correctIndex: 3,
    explanationVi: "科学的消火法 = dùng khí nitơ/carbonic để ngăn phản ứng với oxy, thường được lắp sẵn thay cho nước trong hệ thống sprinkler.",
    sourceQuoteJa:
      "オ 科学的消火法 窒素ガスや炭酸ガスを充満させて酸素と反応させないようにして火を消す方法。建築当初から設備されていれば、スプリンクラーの水の代わりにガスが出て鎮火させる。",
    sourcePage: 23,
  },
  {
    id: "sm-140",
    chapterId: "sm-ch8",
    questionJa: "火災時に命を落とす主な原因として本文が挙げているものはどれか。",
    questionVi: "Nguyên nhân chính gây tử vong khi hỏa hoạn được tài liệu nêu ra là gì?",
    options: [
      { ja: "溺死のみ", vi: "Chỉ đuối nước" },
      { ja: "感電のみ", vi: "Chỉ điện giật" },
      { ja: "焼死と有毒ガスによる死亡", vi: "Chết cháy và tử vong do khí độc" },
      { ja: "転倒による骨折のみ", vi: "Chỉ gãy xương do té ngã" },
    ],
    correctIndex: 2,
    explanationVi: "Khi hỏa hoạn, nguyên nhân tử vong chính là chết cháy (焼死) và ngộ độc khí độc (有毒ガス).",
    sourceQuoteJa: "火災時に命を落とすのは焼死と有毒ガスによる死亡です。",
    sourcePage: 23,
  },
  {
    id: "sm-141",
    chapterId: "sm-ch8",
    questionJa: "煙から身を守りながら避難する方法として正しいものはどれか。",
    questionVi: "Cách sơ tán để bảo vệ bản thân khỏi khói đúng là gì?",
    options: [
      { ja: "煙は上へ上がるので、顔を床面に近づけ、大きな透明のビニール袋の中に顔を入れて避難する", vi: "Vì khói bốc lên trên, nên ghé mặt sát sàn nhà và đưa mặt vào trong túi ni-lông trong suốt lớn để thoát ra" },
      { ja: "煙の中を全力疾走する", vi: "Chạy hết tốc lực xuyên qua khói" },
      { ja: "顔を天井に向けて避難する", vi: "Sơ tán với mặt hướng lên trần nhà" },
      { ja: "濡れタオルを頭に巻くだけでよい", vi: "Chỉ cần quấn khăn ướt quanh đầu là đủ" },
    ],
    correctIndex: 0,
    explanationVi: "Vì khói bốc lên trên, cần ghé mặt gần sàn nhà, và dùng túi ni-lông trong suốt lớn trùm đầu để bảo vệ khỏi khí độc khi thoát ra ngoài.",
    sourceQuoteJa:
      "火災時に命を落とすのは焼死と有毒ガスによる死亡です。煙は上へ上がるので、顔を床面に近づけるようにし、大きな透明のビニール袋の中に顔を入れて避難することで、有毒ガスから身を守る避難が大切です。",
    sourcePage: 23,
  },
  {
    id: "sm-142",
    chapterId: "sm-ch8",
    questionJa: "防火対策として本文に挙げられていないものはどれか。",
    questionVi: "Biện pháp KHÔNG được nêu trong phần đối sách phòng cháy là gì?",
    options: [
      { ja: "死角となりやすい場所を整理整頓し可燃物を置かない", vi: "Dọn dẹp các khu vực khuất tầm nhìn, không để vật dễ cháy" },
      { ja: "物置・倉庫など普段人がいない場所に鍵をかける", vi: "Khóa các khu vực ít người qua lại như kho" },
      { ja: "死角に監視カメラを設置し巡回監視をおこなう", vi: "Lắp camera giám sát ở điểm mù và tuần tra" },
      { ja: "全ての出入口を常に開放し誰でも自由に出入りできるようにする", vi: "Luôn để mở tất cả các cửa ra vào cho ai cũng tự do đi lại" },
    ],
    correctIndex: 3,
    explanationVi: "Đối sách phòng cháy thực tế yêu cầu NGƯỢC LẠI: giới hạn cửa ra vào và giám sát người ra vào (出入口をなるべく限定し、入出者の確認・監視をおこなう), không phải mở tự do cho ai cũng vào được.",
    sourceQuoteJa:
      "① 廊下・階段室・洗面所などの死角となりやすい場所の整理・整頓をして、可燃物を置かない。② 物置・倉庫・空室など普段人がいない場所には鍵をかけて、出入りができないようにする。③ 出入口をなるべく限定し、入出者の確認・監視をおこなう。",
    sourcePage: 23,
  },
  {
    id: "sm-143",
    chapterId: "sm-ch8",
    questionJa: "臨時従業員を不審者と間違えないための対策はどれか。",
    questionVi: "Biện pháp để tránh nhầm lẫn nhân viên thời vụ với kẻ khả nghi là gì?",
    options: [
      { ja: "普段あまり見かけないアルバイト・パート・出向者の顔をよく把握しておく", vi: "Nắm rõ mặt của nhân viên thời vụ/phái cử ít khi gặp mặt" },
      { ja: "臨時従業員を店舗に一切入れない", vi: "Hoàn toàn không cho nhân viên thời vụ vào cửa hàng" },
      { ja: "全従業員に制服を着せず私服で勤務させる", vi: "Cho tất cả nhân viên mặc thường phục khi làm việc, không mặc đồng phục" },
      { ja: "監視カメラを一切設置しない", vi: "Hoàn toàn không lắp camera giám sát" },
    ],
    correctIndex: 0,
    explanationVi: "Cần nắm rõ mặt của nhân viên thời vụ/phái cử ít khi xuất hiện, để không nhầm họ với kẻ khả nghi thực sự — từ đó phòng chống xâm nhập trái phép hiệu quả hơn.",
    sourceQuoteJa:
      "普段、あまり見かけないアルバイト・パート・出向者の臨時従業員を不審者と間違えないよう顔をよく把握しておき、実際の不審者の不法侵入を防ぐ。",
    sourcePage: 23,
  },
  {
    id: "sm-144",
    chapterId: "sm-ch8",
    questionJa: "避難訓練は最低どれくらいの頻度で実施する必要があるか。",
    questionVi: "Diễn tập sơ tán cần thực hiện với tần suất tối thiểu bao nhiêu?",
    options: [
      { ja: "年に1回", vi: "1 lần/năm" },
      { ja: "月に1回", vi: "1 lần/tháng" },
      { ja: "週に1回", vi: "1 lần/tuần" },
      { ja: "5年に1回", vi: "1 lần/5 năm" },
    ],
    correctIndex: 0,
    explanationVi: "年に1回は避難訓練を実施 — tối thiểu 1 lần/năm, theo trình tự và phân công vai trò đã định trước, kèm phổ biến cách dùng bình chữa cháy.",
    sourceQuoteJa: "年に１回は避難訓練を実施します。あらかじめ決めておいた手順に従って役割を決めておこないます。",
    sourcePage: 23,
  },
  {
    id: "sm-145",
    chapterId: "sm-ch8",
    questionJa: "「具体的な対策」のチェック項目として本文に挙げられていないものはどれか。",
    questionVi: "Hạng mục KHÔNG được liệt kê trong \"Đối sách cụ thể\" là gì?",
    options: [
      { ja: "火災報知器、煙感知器が油で汚れていないか", vi: "Máy báo cháy, cảm biến khói có bị dính dầu mỡ không" },
      { ja: "ガスホースに劣化がないか", vi: "Ống dẫn gas có bị hư hỏng không" },
      { ja: "配電盤内にゴキブリの糞がないか", vi: "Trong tủ điện có phân gián không" },
      { ja: "従業員の血液型を確認する", vi: "Xác nhận nhóm máu của nhân viên" },
    ],
    correctIndex: 3,
    explanationVi: "6 hạng mục kiểm tra thực tế xoay quanh thiết bị (máy báo cháy, damper hút mùi, ống gas, bếp đun nước, máy rửa tự động, tủ điện) — KHÔNG liên quan đến nhóm máu nhân viên.",
    sourceQuoteJa:
      "① 火災報知器、煙感知器が油で汚れていないか確認してください。② フード内ダンパー（炎がダクト内に侵入しないためのシャッター）が油汚れ状態になっていないか確認してください。③ ガスホースに劣化がないか確認してください。④ 湯沸かしの種火が消えていないか確認してください。⑤ 自動洗浄機が正常に作動するか確認してください。⑥ 配電盤内にゴキブリの糞がないか確認してください。",
    sourcePage: 24,
  },
  {
    id: "sm-146",
    chapterId: "sm-ch8",
    questionJa: "「マニュアルの確認」として本文に挙げられている3項目に含まれないものはどれか。",
    questionVi: "Mục KHÔNG nằm trong 3 loại sổ tay cần xác nhận là gì?",
    options: [
      { ja: "消防署への通報マニュアル", vi: "Sổ tay báo tin cho sở cứu hỏa" },
      { ja: "お客様の避難誘導マニュアル", vi: "Sổ tay hướng dẫn sơ tán khách hàng" },
      { ja: "緊急時の従業員役割分担マニュアル", vi: "Sổ tay phân công vai trò nhân viên lúc khẩn cấp" },
      { ja: "本部への月次売上報告マニュアル", vi: "Sổ tay báo cáo doanh thu hàng tháng cho trụ sở chính" },
    ],
    correctIndex: 3,
    explanationVi: "3 loại sổ tay cần xác nhận: báo tin cho sở cứu hỏa, hướng dẫn sơ tán khách, phân công vai trò nhân viên khẩn cấp — không liên quan báo cáo doanh thu.",
    sourceQuoteJa:
      "① 消防署への通報マニュアルを確認しておいてください。② お客様の避難誘導マニュアルを確認しておいてください。③ 緊急時の従業員役割分担マニュアルを確認しておいてください。",
    sourcePage: 24,
  },
  {
    id: "sm-147",
    chapterId: "sm-ch8",
    questionJa: "（参考６）にある「マネジメントサイクル」の正しい4段階の順序はどれか。",
    questionVi: "Theo 参考６, thứ tự đúng của 4 giai đoạn \"Chu trình quản lý\" (マネジメントサイクル) là gì?",
    options: [
      { ja: "ドウ→プラン→アクション→チェック", vi: "Do → Plan → Action → Check" },
      { ja: "チェック→アクション→プラン→ドウ", vi: "Check → Action → Plan → Do" },
      { ja: "プラン（計画）→ドウ（実施）→チェック（評価）→アクション（修正行動）", vi: "Plan (kế hoạch) → Do (thực hiện) → Check (đánh giá) → Action (hành động khắc phục)" },
      { ja: "アクション→チェック→ドウ→プラン", vi: "Action → Check → Do → Plan" },
    ],
    correctIndex: 2,
    explanationVi: "マネジメントサイクル (chu trình PDCA): Plan (kế hoạch) → Do (thực hiện) → Check (đánh giá) → Action (hành động khắc phục), rồi quay lại Plan.",
    sourceQuoteJa:
      "プラン（計画）→ドウ（実施）→チェック（評価）→アクション（修正行動）→プラン（計画）という管理サイクル。",
    sourcePage: 27,
  },
  {
    id: "sm-148",
    chapterId: "sm-ch8",
    questionJa: "（参考６）にある「予算制度」の説明として正しいものはどれか。",
    questionVi: "Theo 参考６, mô tả đúng về \"Chế độ ngân sách\" (予算制度) là gì?",
    options: [
      { ja: "経営計画に基づき、年度ごとに各店の売上高や店舗貢献利益を決め、店長が月ごとに荒利益を算出し人件費など諸経費を予算化し管理する制度", vi: "Dựa trên kế hoạch kinh doanh, mỗi năm quyết định doanh thu/lợi nhuận đóng góp cho từng cửa hàng; quản lý tính lợi nhuận gộp hàng tháng và lập ngân sách các chi phí (nhân công...) để kiểm soát" },
      { ja: "従業員が自由に使える経費のこと", vi: "Là khoản chi phí nhân viên được tự do sử dụng" },
      { ja: "税務署が定める会計基準", vi: "Là chuẩn mực kế toán do cơ quan thuế quy định" },
      { ja: "本部が店舗の利益を全て回収する制度", vi: "Là chế độ trụ sở chính thu hết lợi nhuận của cửa hàng" },
    ],
    correctIndex: 0,
    explanationVi: "予算制度: dựa trên kế hoạch kinh doanh, ấn định doanh thu/lợi nhuận đóng góp theo năm cho từng cửa hàng; quản lý cửa hàng tính lợi nhuận gộp hàng tháng và lập ngân sách các chi phí có thể kiểm soát (nhân công, chi phí khác) để quản lý.",
    sourceQuoteJa:
      "経営計画に基づき、年度ごとに各店に対する売上高や店舗貢献利益が決められる。店長はその年間売上計画を元に各月ごとの荒利益を算出し、人件費や諸経費などコントロール可能費を月ごとに予算化し管理する制度。",
    sourcePage: 27,
  },
  {
    id: "sm-149",
    chapterId: "sm-ch8",
    questionJa: "（参考６）にある「労働生産性」の定義として正しいものはどれか。",
    questionVi: "Theo 参考６, định nghĩa đúng của \"Năng suất lao động\" (労働生産性) là gì?",
    options: [
      { ja: "従業員1人当たりの荒利益を示す指数、高いほど良い", vi: "Chỉ số lợi nhuận gộp trên mỗi nhân viên, càng cao càng tốt" },
      { ja: "従業員の勤続年数のみを示す指数", vi: "Chỉ số chỉ thể hiện thâm niên làm việc" },
      { ja: "店舗の面積を示す指数", vi: "Chỉ số thể hiện diện tích cửa hàng" },
      { ja: "客単価を示す指数", vi: "Chỉ số thể hiện đơn giá khách" },
    ],
    correctIndex: 0,
    explanationVi: "労働生産性 = lợi nhuận gộp tính trên mỗi nhân viên (khác với 人時生産性 vốn tính theo GIỜ lao động), càng cao càng tốt.",
    sourceQuoteJa: "従業員１人当たりの荒利益を示し、高いほど良い。",
    sourcePage: 27,
  },
  {
    id: "sm-150",
    chapterId: "sm-ch8",
    questionJa: "（参考６）にある「経営理念」の定義として正しいものはどれか。",
    questionVi: "Theo 参考６, định nghĩa đúng của \"Triết lý kinh doanh\" (経営理念) là gì?",
    options: [
      { ja: "自社（企業）を経営することにより、どのように社会に貢献するのかを明文化し示したもの", vi: "Văn bản nêu rõ doanh nghiệp sẽ đóng góp cho xã hội như thế nào thông qua việc kinh doanh" },
      { ja: "毎月の売上目標数値のみ", vi: "Chỉ là con số mục tiêu doanh thu hàng tháng" },
      { ja: "従業員の給与規定のみ", vi: "Chỉ là quy định lương nhân viên" },
      { ja: "店舗の内装デザインのみ", vi: "Chỉ là thiết kế nội thất cửa hàng" },
    ],
    correctIndex: 0,
    explanationVi: "経営理念 = văn bản làm rõ mục đích kinh doanh, đóng vai trò kim chỉ nam hành động, là tiêu chuẩn giá trị chung được toàn thể nhân viên chia sẻ.",
    sourceQuoteJa:
      "自社（企業）を経営することにより、どのように社会に貢献するのかを明文化し示したもの。経営の目的を明確にし、経営行動の指針として、お客様や商品に対し従業員全員に共有される価値判断の基準となるものである。",
    sourcePage: 27,
  },
  {
    id: "hy-1",
    chapterId: "hy-ch1",
    questionJa: "食品衛生法第一条に明記された目的として正しいものはどれか。",
    questionVi: "Mục đích được ghi rõ tại Điều 1 Luật Vệ sinh Thực phẩm Nhật Bản là gì?",
    options: [
      { ja: "外食産業の売上を最大化すること", vi: "Tối đa hóa doanh thu ngành dịch vụ ăn uống" },
      { ja: "調理師の資格試験を管理すること", vi: "Quản lý kỳ thi chứng chỉ đầu bếp" },
      { ja: "飲食に起因する衛生上の危害の発生を防止し、国民の健康の保護を図ること", vi: "Ngăn ngừa phát sinh nguy hại vệ sinh do ăn uống, bảo vệ sức khỏe toàn dân" },
      { ja: "食材の輸出入を規制すること", vi: "Kiểm soát xuất nhập khẩu nguyên liệu" },
    ],
    correctIndex: 2,
    explanationVi: "食品衛生法 (Luật Vệ sinh Thực phẩm) Điều 1 nêu rõ mục đích: ngăn ngừa nguy hại vệ sinh phát sinh từ ăn uống, qua đó bảo vệ sức khỏe toàn dân.",
    sourceQuoteJa: "食品衛生法の第一条では、その目的を「飲食に起因する衛生上の危害の発生を防止し、国民の健康の保護を図ること」と明記しています。",
    sourcePage: 1,
  },
  {
    id: "hy-2",
    chapterId: "hy-ch1",
    questionJa: "食品の製造・販売などをおこなう食品等事業者に課される義務はどれか。",
    questionVi: "Nghĩa vụ áp đặt cho các doanh nghiệp sản xuất/kinh doanh thực phẩm là gì?",
    options: [
      { ja: "毎月税務署に食材リストを提出しなければならない", vi: "Phải nộp danh sách nguyên liệu cho cơ quan thuế mỗi tháng" },
      { ja: "全メニューを毎年変更しなければならない", vi: "Phải thay đổi toàn bộ thực đơn mỗi năm" },
      { ja: "食品衛生法に定められた内容をしっかりと守らなくてはならない", vi: "Phải tuân thủ nghiêm túc nội dung được quy định trong Luật Vệ sinh Thực phẩm" },
      { ja: "外国人従業員のみ雇用しなければならない", vi: "Chỉ được thuê nhân viên nước ngoài" },
    ],
    correctIndex: 2,
    explanationVi: "Doanh nghiệp thực phẩm bắt buộc phải tuân thủ nội dung Luật Vệ sinh Thực phẩm.",
    sourceQuoteJa: "食品の製造・販売などをおこなう食品等事業者は食品衛生法に定められた内容をしっかりと守らなくてはなりません。",
    sourcePage: 1,
  },
  {
    id: "hy-3",
    chapterId: "hy-ch1",
    questionJa: "近年（令和4年時点）の食中毒事件数の傾向として正しいものはどれか。",
    questionVi: "Xu hướng số vụ ngộ độc thực phẩm gần đây (tính đến năm Reiwa 4) là gì?",
    options: [
      { ja: "年間10万件を超えている", vi: "Vượt quá 100.000 vụ/năm" },
      { ja: "年間1,000件前後で発生している", vi: "Xảy ra khoảng 1.000 vụ/năm" },
      { ja: "完全にゼロになった", vi: "Đã giảm về 0 hoàn toàn" },
      { ja: "年間100件未満である", vi: "Dưới 100 vụ/năm" },
    ],
    correctIndex: 1,
    explanationVi: "Gần đây số vụ ngộ độc thực phẩm dao động khoảng 1.000 vụ/năm.",
    sourceQuoteJa: "近年は１，０００件前後の食中毒事件が発生し",
    sourcePage: 1,
  },
  {
    id: "hy-4",
    chapterId: "hy-ch1",
    questionJa: "食中毒の患者数について、平成25（2013）年以降の傾向はどれか。",
    questionVi: "Xu hướng số bệnh nhân ngộ độc thực phẩm kể từ năm Heisei 25 (2013) là gì?",
    options: [
      { ja: "25,000人を下まわり減少傾向が認められる", vi: "Giảm xuống dưới 25.000 người, xu hướng giảm" },
      { ja: "毎年倍増している", vi: "Tăng gấp đôi mỗi năm" },
      { ja: "常に100万人を超えている", vi: "Luôn vượt quá 1 triệu người" },
      { ja: "統計が存在しない", vi: "Không có số liệu thống kê" },
    ],
    correctIndex: 0,
    explanationVi: "Từ năm 2013, số bệnh nhân ngộ độc thực phẩm giảm xuống dưới 25.000 người/năm, có xu hướng giảm (dù từ 2021 có thể do ảnh hưởng của hạn chế đi lại vì COVID-19).",
    sourceQuoteJa: "患者数は平成２５（２０１３）年以降２５，０００人を下まわり減少傾向が認められます",
    sourcePage: 1,
  },
  {
    id: "hy-5",
    chapterId: "hy-ch1",
    questionJa: "食中毒の約90%以上の原因物質として正しいものはどれか。",
    questionVi: "Khoảng trên 90% nguyên nhân gây ngộ độc thực phẩm là gì?",
    options: [
      { ja: "食品添加物のみ", vi: "Chỉ do phụ gia thực phẩm" },
      { ja: "調理器具の色", vi: "Màu sắc dụng cụ nấu ăn" },
      { ja: "食品を汚染する細菌、ウイルス、寄生虫などの有害微生物", vi: "Vi sinh vật có hại (vi khuẩn, virus, ký sinh trùng) làm ô nhiễm thực phẩm" },
      { ja: "店舗の内装デザイン", vi: "Thiết kế nội thất cửa hàng" },
    ],
    correctIndex: 2,
    explanationVi: "Trên 90% ngộ độc thực phẩm do vi sinh vật có hại (vi khuẩn, virus, ký sinh trùng) làm ô nhiễm thực phẩm gây ra.",
    sourceQuoteJa: "ほとんどの食中毒（約９０％以上）は、食品を汚染する細菌、ウイルス、寄生虫などの有害微生物が原因物質です。",
    sourcePage: 1,
  },
  {
    id: "hy-6",
    chapterId: "hy-ch1",
    questionJa: "令和4年の食中毒で、事件数が最も多かった病因物質はどれか。",
    questionVi: "Trong năm Reiwa 4, tác nhân gây ra SỐ VỤ ngộ độc thực phẩm nhiều nhất là gì?",
    options: [
      { ja: "ノロウイルス", vi: "Norovirus" },
      { ja: "カンピロバクター", vi: "Campylobacter" },
      { ja: "アニサキス（566件）", vi: "Anisakis (566 vụ)" },
      { ja: "サルモネラ属菌", vi: "Vi khuẩn Salmonella" },
    ],
    correctIndex: 2,
    explanationVi: "Xét theo SỐ VỤ, アニサキス (Anisakis, ký sinh trùng trong hải sản) đứng đầu với 566 vụ trong năm Reiwa 4, dù xét theo SỐ BỆNH NHÂN thì ノロウイルス lại đứng đầu.",
    sourceQuoteJa:
      "令和４年の食中毒の原因となった病因物質は、全事件数９６２件のうちの多い順に①アニサキス（５６６件）、②カンピロバクター（１８５件）、③ノロウイルス（６３件）で",
    sourcePage: 1,
  },
  {
    id: "hy-7",
    chapterId: "hy-ch1",
    questionJa: "令和4年の食中毒で、患者数が最も多かった病因物質はどれか。",
    questionVi: "Trong năm Reiwa 4, tác nhân gây ra SỐ BỆNH NHÂN ngộ độc thực phẩm nhiều nhất là gì?",
    options: [
      { ja: "ノロウイルス（2,175人）", vi: "Norovirus (2.175 người)" },
      { ja: "アニサキス", vi: "Anisakis" },
      { ja: "カンピロバクター", vi: "Campylobacter" },
      { ja: "ウエルシュ菌", vi: "Vi khuẩn Welchii" },
    ],
    correctIndex: 0,
    explanationVi: "Xét theo SỐ BỆNH NHÂN, ノロウイルス (Norovirus) đứng đầu với 2.175 người, dù xét theo SỐ VỤ thì アニサキス lại đứng đầu — 2 bảng xếp hạng khác nhau vì mỗi vụ Norovirus lây lan cho nhiều người hơn.",
    sourceQuoteJa:
      "全患者数６，８５６人のうち、①ノロウイルス（２，１７５人）、②ウエルシュ菌（１，４６５人）③カンピロバクター（８２２人）、④サルモネラ属菌（６９８人）でした",
    sourcePage: 1,
  },
  {
    id: "hy-8",
    chapterId: "hy-ch1",
    questionJa: "食中毒以外に、近年重要な課題となっているものとして本文に挙げられているのはどれか。",
    questionVi: "Ngoài ngộ độc thực phẩm, những vấn đề nào khác được nêu là thách thức quan trọng gần đây?",
    options: [
      { ja: "従業員の離職率のみ", vi: "Chỉ tỷ lệ nghỉ việc của nhân viên" },
      { ja: "店舗の駐車場不足のみ", vi: "Chỉ vấn đề thiếu bãi đỗ xe" },
      { ja: "メニューの多様化のみ", vi: "Chỉ vấn đề đa dạng hóa thực đơn" },
      { ja: "異物混入によるケガと食物アレルギー対策", vi: "Chấn thương do dị vật lẫn trong thức ăn và biện pháp phòng dị ứng thực phẩm" },
    ],
    correctIndex: 3,
    explanationVi: "Ngoài ngộ độc thực phẩm, tài liệu nêu rõ 2 thách thức quan trọng khác: chấn thương do dị vật lẫn trong thức ăn (異物混入) và biện pháp phòng ngừa dị ứng thực phẩm (食物アレルギー対策).",
    sourceQuoteJa: "食中毒は飲食に起因する衛生上の大きな危害ですが、近年は異物混入によるケガや、食物アレルギー対策も重要な課題になっています。",
    sourcePage: 1,
  },
  {
    id: "hy-9",
    chapterId: "hy-ch2",
    questionJa: "食中毒予防の3原則として正しい組み合わせはどれか。",
    questionVi: "Tổ hợp đúng của \"3 nguyên tắc phòng ngừa ngộ độc thực phẩm\" là gì?",
    options: [
      { ja: "冷やす・温める・保存する", vi: "Làm lạnh - Làm nóng - Bảo quản" },
      { ja: "つけない・増やさない・やっつける", vi: "Không để nhiễm - Không để sinh sôi - Tiêu diệt" },
      { ja: "洗う・切る・盛り付ける", vi: "Rửa - Cắt - Trình bày" },
      { ja: "仕入れる・調理する・提供する", vi: "Nhập hàng - Chế biến - Phục vụ" },
    ],
    correctIndex: 1,
    explanationVi: "3 nguyên tắc phòng ngừa ngộ độc thực phẩm: つけない (không để vi sinh vật nhiễm vào), 増やさない (không để chúng sinh sôi), やっつける (tiêu diệt chúng bằng nhiệt) — là nền tảng của quản lý vệ sinh nói chung và HACCP.",
    sourceQuoteJa: "食中毒予防の３原則「つけない・増やさない・やっつける」は、有害微生物による食中毒を防止するための重要な原則です。",
    sourcePage: 3,
  },
  {
    id: "hy-10",
    chapterId: "hy-ch2",
    questionJa: "「少量感染」とはどのような状態を指すか。",
    questionVi: "\"Lây nhiễm liều lượng nhỏ\" (少量感染) chỉ tình trạng gì?",
    options: [
      { ja: "1年に1回だけ感染すること", vi: "Chỉ bị nhiễm 1 lần trong năm" },
      { ja: "感染しても全く症状が出ないこと", vi: "Nhiễm nhưng hoàn toàn không có triệu chứng" },
      { ja: "腸管出血性大腸菌やノロウイルスなどが10個から100個程度の少ない量で感染すること", vi: "Vi khuẩn E.coli xuất huyết đường ruột hay Norovirus... gây lây nhiễm chỉ với khoảng 10-100 con vi sinh vật" },
      { ja: "抗生物質を少量だけ使うこと", vi: "Chỉ dùng một lượng nhỏ kháng sinh" },
    ],
    correctIndex: 2,
    explanationVi: "少量感染 = chỉ cần tiếp nhận khoảng 10-100 con vi sinh vật có hại (như E.coli O157, Norovirus) là đã đủ gây nhiễm bệnh.",
    sourceQuoteJa:
      "腸管出血性大腸菌（O１５７）やノロウイルスなどの有害微生物は、１０個から１００個程度の少ない量を摂取するだけで感染します。これを「少量感染」と言います。",
    sourcePage: 3,
  },
  {
    id: "hy-11",
    chapterId: "hy-ch2",
    questionJa: "「つけない」対策が特に重要となるのはどのような食中毒対策においてか。",
    questionVi: "Biện pháp \"không để nhiễm\" (つけない) đặc biệt quan trọng trong việc phòng ngừa loại ngộ độc thực phẩm nào?",
    options: [
      { ja: "賞味期限切れの調味料による食中毒対策のみ", vi: "Chỉ ngộ độc do gia vị hết hạn" },
      { ja: "高価格帯の食材による食中毒対策のみ", vi: "Chỉ ngộ độc do nguyên liệu giá cao" },
      { ja: "冷凍食品による食中毒対策のみ", vi: "Chỉ ngộ độc do thực phẩm đông lạnh" },
      { ja: "ノロウイルスなどの少量感染を起こす微生物による食中毒対策", vi: "Ngộ độc do vi sinh vật gây lây nhiễm liều nhỏ như Norovirus" },
    ],
    correctIndex: 3,
    explanationVi: "Vì Norovirus và các vi sinh vật gây lây nhiễm liều nhỏ chỉ cần rất ít số lượng đã gây bệnh, biện pháp つけない (ngăn không cho nhiễm ngay từ đầu) trở nên đặc biệt quan trọng với nhóm này.",
    sourceQuoteJa:
      "３原則のうち「つけない」対策は、ノロウイルスなどの少量感染を起こす微生物による食中毒対策では特に重要です。",
    sourcePage: 3,
  },
  {
    id: "hy-12",
    chapterId: "hy-ch2",
    questionJa: "有害微生物を調理場に「持ち込まない」ための具体策として正しいものはどれか。",
    questionVi: "Biện pháp cụ thể để \"không mang\" vi sinh vật có hại vào khu bếp là gì?",
    options: [
      { ja: "調理場の窓を常に開放しておく", vi: "Luôn mở cửa sổ bếp" },
      { ja: "食品取扱者の健康管理、清潔な作業着・履物の着用、手洗いの励行", vi: "Quản lý sức khỏe người xử lý thực phẩm, mặc trang phục/giày dép sạch, tích cực rửa tay" },
      { ja: "従業員の私服のまま調理させる", vi: "Để nhân viên nấu ăn với quần áo thường ngày" },
      { ja: "段ボールをそのまま調理台に置く", vi: "Đặt thùng carton trực tiếp lên bàn bếp" },
    ],
    correctIndex: 1,
    explanationVi: "「持ち込まない」cần: quản lý sức khỏe người xử lý thực phẩm, mặc đồ/giày sạch, tích cực rửa tay, và hạn chế mang bao bì ô nhiễm (thùng carton, xốp) vào khu bếp.",
    sourceQuoteJa:
      "有害微生物を調理場に持ち込まないため、具体的には、食品取扱者の健康管理、清潔な作業着や履物の着用、手洗いの励行などが不可欠です。",
    sourcePage: 3,
  },
  {
    id: "hy-13",
    chapterId: "hy-ch2",
    questionJa: "有害微生物を「拡げない」ための具体策として、本文に挙げられていないものはどれか。",
    questionVi: "Biện pháp KHÔNG được nêu để \"không lan rộng\" vi sinh vật có hại là gì?",
    options: [
      { ja: "手洗いの励行", vi: "Tích cực rửa tay" },
      { ja: "おう吐物の適切な処理", vi: "Xử lý chất nôn đúng cách" },
      { ja: "二枚貝を扱った器具の洗浄・消毒", vi: "Rửa/khử trùng dụng cụ đã dùng cho động vật 2 mảnh vỏ" },
      { ja: "従業員の給与を毎月査定する", vi: "Đánh giá lương nhân viên hàng tháng" },
    ],
    correctIndex: 3,
    explanationVi: "4 biện pháp「拡げない」nêu ra: rửa tay tích cực, xử lý chất nôn đúng cách, giữ nhà vệ sinh sạch sẽ, rửa/khử trùng dụng cụ dùng cho động vật 2 mảnh vỏ — KHÔNG liên quan đến đánh giá lương.",
    sourceQuoteJa:
      "具体的には、手洗いの励行、おう吐物の適切な処理、トイレを清潔に保つ、二枚貝を扱った器具の洗浄・消毒をおこないます。",
    sourcePage: 3,
  },
  {
    id: "hy-14",
    chapterId: "hy-ch2",
    questionJa: "「増やさない」原則が適用できない対象と、その理由として正しいものはどれか。",
    questionVi: "Đối tượng KHÔNG áp dụng được nguyên tắc \"không để sinh sôi\" (増やさない), và lý do là gì?",
    options: [
      { ja: "細菌、なぜなら常に増殖しないため", vi: "Vi khuẩn, vì vi khuẩn không bao giờ sinh sôi" },
      { ja: "ウイルス、なぜなら食品中では増えないため", vi: "Virus, vì virus không sinh sôi trong thực phẩm" },
      { ja: "寄生虫、なぜなら熱に強いため", vi: "Ký sinh trùng, vì chịu nhiệt tốt" },
      { ja: "カビ、なぜなら常温でしか繁殖しないため", vi: "Nấm mốc, vì chỉ sinh sôi ở nhiệt độ thường" },
    ],
    correctIndex: 1,
    explanationVi: "Virus KHÔNG tự sinh sôi trong thực phẩm (khác với vi khuẩn), nên nguyên tắc 増やさない (ngăn sinh sôi) không áp dụng được cho virus — đây là điểm khác biệt quan trọng cần nhớ.",
    sourceQuoteJa: "ただし、ウイルスは食品中で増えないため、この原則は適用できません。",
    sourcePage: 3,
  },
  {
    id: "hy-15",
    chapterId: "hy-ch2",
    questionJa: "「増やさない」対策として、食品を保存する適切な温度帯はどれか。",
    questionVi: "Trong biện pháp \"không để sinh sôi\", khoảng nhiệt độ thích hợp để bảo quản thực phẩm là gì?",
    options: [
      { ja: "常温（20～25℃）のみ", vi: "Chỉ nhiệt độ phòng (20-25°C)" },
      { ja: "30～40℃の範囲のみ", vi: "Chỉ trong khoảng 30-40°C" },
      { ja: "低温（10℃以下）あるいは高温（60℃以上）", vi: "Nhiệt độ thấp (dưới 10°C) hoặc nhiệt độ cao (trên 60°C)" },
      { ja: "温度は関係ない", vi: "Nhiệt độ không quan trọng" },
    ],
    correctIndex: 2,
    explanationVi: "Để tránh vi khuẩn sinh sôi, cần bảo quản thực phẩm ở nhiệt độ THẤP (dưới 10°C) hoặc CAO (trên 60°C) — tránh vùng nhiệt độ trung bình lý tưởng cho vi khuẩn phát triển.",
    sourceQuoteJa: "保存する食品の低温（１０℃以下）あるいは高温（６０℃以上）保管などです。",
    sourcePage: 3,
  },
  {
    id: "hy-16",
    chapterId: "hy-ch2",
    questionJa: "調理施設内での加熱の基本基準として正しいものはどれか。",
    questionVi: "Tiêu chuẩn cơ bản khi gia nhiệt trong bếp là gì?",
    options: [
      { ja: "食品の表面のみ100℃で数秒", vi: "Chỉ bề mặt thực phẩm đạt 100°C vài giây" },
      { ja: "常温のまま提供して問題ない", vi: "Có thể phục vụ ở nhiệt độ thường, không vấn đề gì" },
      { ja: "食品の中心部が75℃で1分間以上", vi: "Phần lõi thực phẩm đạt 75°C trong ít nhất 1 phút" },
      { ja: "冷蔵庫から出したらすぐ提供する", vi: "Lấy ra khỏi tủ lạnh là phục vụ ngay" },
    ],
    correctIndex: 2,
    explanationVi: "Tiêu chuẩn cơ bản: phần lõi thực phẩm phải đạt 75°C trong ít nhất 1 phút để tiêu diệt vi sinh vật có hại.",
    sourceQuoteJa: "調理施設内では、食品の中心部が７５℃で１分間以上（ノロウイルス汚染のおそれのある食品は８５～９０℃で９０秒間以上）加熱",
    sourcePage: 4,
  },
  {
    id: "hy-17",
    chapterId: "hy-ch2",
    questionJa: "ノロウイルス汚染のおそれのある食品の加熱基準はどれか。",
    questionVi: "Tiêu chuẩn gia nhiệt cho thực phẩm có nguy cơ nhiễm Norovirus là gì?",
    options: [
      { ja: "75℃で1分間以上", vi: "75°C trong 1 phút" },
      { ja: "85～90℃で90秒間以上", vi: "85-90°C trong ít nhất 90 giây" },
      { ja: "50℃で10分間", vi: "50°C trong 10 phút" },
      { ja: "加熱基準は特にない", vi: "Không có tiêu chuẩn gia nhiệt riêng" },
    ],
    correctIndex: 1,
    explanationVi: "Với thực phẩm nghi nhiễm Norovirus (như hàu, động vật 2 mảnh vỏ), tiêu chuẩn cao hơn: 85-90°C trong ít nhất 90 giây.",
    sourceQuoteJa: "ノロウイルス汚染のおそれのある食品は８５～９０℃で９０秒間以上",
    sourcePage: 4,
  },
  {
    id: "hy-18",
    chapterId: "hy-ch2",
    questionJa: "アニサキスなどの寄生虫はどのような方法で死滅させることができるか。",
    questionVi: "Ký sinh trùng như Anisakis có thể bị tiêu diệt bằng phương pháp nào?",
    options: [
      { ja: "常温放置でのみ死滅する", vi: "Chỉ để ở nhiệt độ thường mới tiêu diệt được" },
      { ja: "死滅させる方法は存在しない", vi: "Không có cách nào tiêu diệt được" },
      { ja: "冷凍でも死滅する", vi: "Cấp đông cũng tiêu diệt được" },
      { ja: "塩をかけるだけで死滅する", vi: "Chỉ cần rắc muối là tiêu diệt được" },
    ],
    correctIndex: 2,
    explanationVi: "Khác với vi sinh vật (chủ yếu bị tiêu diệt bằng nhiệt), ký sinh trùng như Anisakis có thể bị tiêu diệt kể cả bằng CẤP ĐÔNG.",
    sourceQuoteJa: "アニサキスなどの寄生虫は冷凍でも死滅します。",
    sourcePage: 4,
  },
  {
    id: "hy-19",
    chapterId: "hy-ch2",
    questionJa: "「5S活動」を構成する5つの要素として正しい組み合わせはどれか。",
    questionVi: "Tổ hợp đúng của 5 yếu tố cấu thành \"Hoạt động 5S\" là gì?",
    options: [
      { ja: "計画・実施・評価・改善・報告", vi: "Kế hoạch - Thực hiện - Đánh giá - Cải tiến - Báo cáo" },
      { ja: "整理・整頓・清掃・清潔・習慣", vi: "Sàng lọc - Sắp xếp - Sạch sẽ (dọn dẹp) - Săn sóc - Sẵn sàng (thói quen)" },
      { ja: "洗浄・消毒・保管・点検・記録", vi: "Rửa - Khử trùng - Bảo quản - Kiểm tra - Ghi chép" },
      { ja: "仕入れ・調理・盛付・提供・清算", vi: "Nhập hàng - Nấu - Trình bày - Phục vụ - Thanh toán" },
    ],
    correctIndex: 1,
    explanationVi: "5S活動 gồm 5 yếu tố mà tên tiếng Nhật đều bắt đầu bằng chữ La-tinh \"S\": 整理(Seiri)/整頓(Seiton)/清掃(Seisou)/清潔(Seiketsu)/習慣(Syukan).",
    sourceQuoteJa:
      "５ S 活動は、①整理（Seiri）、②整頓（Seiton）、③清掃（Seisou）、④清潔（Seiketsu）、⑤習慣（Syukan）の５つで構成され",
    sourcePage: 4,
  },
  {
    id: "hy-20",
    chapterId: "hy-ch2",
    questionJa: "5S活動の「整理」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Sàng lọc\" (整理) trong 5S là gì?",
    options: [
      { ja: "ゴミや汚れを除去する", vi: "Loại bỏ rác và vết bẩn" },
      { ja: "不要なものを処分し、必要なものは個数を明確にする", vi: "Xử lý bỏ những thứ không cần thiết, làm rõ số lượng những thứ cần thiết" },
      { ja: "使った後、必ず定位置に戻す", vi: "Sau khi dùng, luôn trả về đúng vị trí quy định" },
      { ja: "ルールを設けて教育訓練する", vi: "Lập quy tắc và đào tạo giáo dục" },
    ],
    correctIndex: 1,
    explanationVi: "整理 (Sàng lọc) = xử lý bỏ đồ không cần thiết, làm rõ số lượng đồ cần thiết còn lại — khác với 整頓 (sắp xếp vị trí).",
    sourceQuoteJa: "整理：不要なものを処分し、必要なものは個数を明確にする",
    sourcePage: 4,
  },
  {
    id: "hy-21",
    chapterId: "hy-ch2",
    questionJa: "5S活動の「整頓」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Sắp xếp\" (整頓) trong 5S là gì?",
    options: [
      { ja: "必要なものを必要な時に必要な量だけ取り出せるよう定位置に保管する", vi: "Cất giữ đồ cần thiết ở vị trí cố định để lấy ra đúng lúc, đúng số lượng cần" },
      { ja: "不要なものを処分する", vi: "Xử lý bỏ đồ không cần thiết" },
      { ja: "施設を清潔な環境に保つ", vi: "Giữ cơ sở luôn sạch sẽ" },
      { ja: "微生物汚染を除去する", vi: "Loại bỏ ô nhiễm vi sinh vật" },
    ],
    correctIndex: 0,
    explanationVi: "整頓 (Sắp xếp) = cất đồ cần thiết ở vị trí cố định (定位置) để lấy đúng lúc đúng lượng; dụng cụ dùng xong phải trả về đúng vị trí.",
    sourceQuoteJa:
      "整頓：必要なものを必要な時に必要な量だけ取り出せるように、定めた場所（定位置）に保管する（繰り返し使う用具は、使った後、必ず定位置に戻す）",
    sourcePage: 4,
  },
  {
    id: "hy-22",
    chapterId: "hy-ch2",
    questionJa: "5S活動の「清掃」について、食品関係施設ならではの意味として正しいものはどれか。",
    questionVi: "Về \"Dọn dẹp\" (清掃) trong 5S, ý nghĩa đặc thù ở cơ sở liên quan thực phẩm là gì?",
    options: [
      { ja: "ゴミを1年に1回だけ捨てればよい", vi: "Chỉ cần đổ rác 1 lần/năm" },
      { ja: "掃除は外部業者にすべて任せてよい", vi: "Có thể giao hết việc dọn dẹp cho bên ngoài" },
      { ja: "洗浄・消毒により、微生物汚染も除去する", vi: "Thông qua rửa và khử trùng, loại bỏ cả ô nhiễm vi sinh vật" },
      { ja: "床のみ掃除すればよい", vi: "Chỉ cần lau sàn là đủ" },
    ],
    correctIndex: 2,
    explanationVi: "Ở cơ sở thực phẩm, 清掃 (dọn dẹp) không chỉ là loại bỏ rác/vết bẩn thông thường, mà còn phải rửa và khử trùng để loại bỏ cả ô nhiễm vi sinh vật.",
    sourceQuoteJa: "清掃：ゴミや汚れを除去する（食品関係施設では、洗浄・消毒により、微生物汚染も除去する）",
    sourcePage: 4,
  },
  {
    id: "hy-23",
    chapterId: "hy-ch2",
    questionJa: "5S活動の「習慣」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa đúng của \"Thói quen\" (習慣) trong 5S là gì?",
    options: [
      { ja: "整理、整頓、清掃についてルールやマニュアルを設けて教育訓練し、施設の清潔が常に維持されるよう習慣化する", vi: "Lập quy tắc/sổ tay về sàng lọc-sắp xếp-dọn dẹp và đào tạo, để việc duy trì sạch sẽ trở thành thói quen thường xuyên" },
      { ja: "1回だけ大掃除をすればよい", vi: "Chỉ cần tổng vệ sinh 1 lần là đủ" },
      { ja: "新人研修のときのみおこなう", vi: "Chỉ thực hiện lúc đào tạo nhân viên mới" },
      { ja: "経営者だけが実践すればよい", vi: "Chỉ cần chủ doanh nghiệp thực hành là đủ" },
    ],
    correctIndex: 0,
    explanationVi: "習慣 (Thói quen) = lập quy tắc/sổ tay cho 3S trước (整理・整頓・清掃), đào tạo liên tục để việc giữ sạch trở thành thói quen tự nhiên, không phải việc làm 1 lần.",
    sourceQuoteJa:
      "習慣：整理、整頓、清掃についてルールやマニュアルを設けて教育訓練し、施設の清潔が常に維持されるよう習慣化する",
    sourcePage: 4,
  },
  {
    id: "hy-24",
    chapterId: "hy-ch2",
    questionJa: "5S活動は、食中毒予防の3原則のうちどれの実践に不可欠とされているか。",
    questionVi: "Hoạt động 5S được coi là không thể thiếu để thực hành nguyên tắc nào trong 3 nguyên tắc phòng ngừa ngộ độc thực phẩm?",
    options: [
      { ja: "増やさない", vi: "Không để sinh sôi" },
      { ja: "やっつける", vi: "Tiêu diệt" },
      { ja: "つけない", vi: "Không để nhiễm" },
      { ja: "3原則すべてに無関係", vi: "Không liên quan đến cả 3 nguyên tắc" },
    ],
    correctIndex: 2,
    explanationVi: "5S活動 được coi là hoạt động không thể thiếu để thực hành nguyên tắc つけない (không để vi sinh vật nhiễm vào), đồng thời cũng là nền tảng phòng chống dị vật lẫn vào thức ăn.",
    sourceQuoteJa:
      "衛生管理の５ S 活動は、食中毒予防の３原則の一つである有害微生物を「つけない」ことを実践するために欠かせない活動であるとともに、異物混入防止対策の基礎となる活動でもあります。",
    sourcePage: 4,
  },
  {
    id: "hy-25",
    chapterId: "hy-ch3",
    questionJa: "「HACCPに沿った衛生管理」の基準を構成する2つの基準として正しい組み合わせはどれか。",
    questionVi: "Tổ hợp đúng của 2 tiêu chuẩn cấu thành \"Quản lý vệ sinh theo HACCP\" là gì?",
    options: [
      { ja: "施設の広さの基準と従業員数の基準", vi: "Tiêu chuẩn diện tích cơ sở và tiêu chuẩn số nhân viên" },
      { ja: "一般的な衛生管理の基準と重要工程管理の取組の基準", vi: "Tiêu chuẩn quản lý vệ sinh chung và tiêu chuẩn quản lý công đoạn quan trọng" },
      { ja: "価格設定の基準とメニュー数の基準", vi: "Tiêu chuẩn định giá và tiêu chuẩn số lượng món" },
      { ja: "営業時間の基準と休日数の基準", vi: "Tiêu chuẩn giờ mở cửa và tiêu chuẩn số ngày nghỉ" },
    ],
    correctIndex: 1,
    explanationVi: "HACCPに沿った衛生管理 gồm 2 tiêu chuẩn: 一般的な衛生管理の基準 (mọi doanh nghiệp thực phẩm đều phải tuân thủ như nhau) và 重要工程管理の取組の基準 (quản lý riêng các công đoạn đặc biệt quan trọng để ngăn nguy hại vệ sinh).",
    sourceQuoteJa:
      "基準は、すべての食品等事業者が一律に遵守しなければならない「施設の内外の清潔保持などの一般的な衛生管理の基準」と、「食品衛生上の危害の発生を防止するために特に重要な工程を管理するための取組の基準」の２つで構成され",
    sourcePage: 5,
  },
  {
    id: "hy-26",
    chapterId: "hy-ch3",
    questionJa: "飲食店などの小規模営業者が活用できる手引書を使う場合、特に重要になることはどれか。",
    questionVi: "Khi các doanh nghiệp nhỏ (như quán ăn) sử dụng sổ tay hướng dẫn dành riêng cho mình, điều đặc biệt quan trọng là gì?",
    options: [
      { ja: "毎日従業員全員が制服を新調すること", vi: "Mỗi ngày toàn bộ nhân viên phải thay đồng phục mới" },
      { ja: "一般的な衛生管理の基準14項目の順守", vi: "Tuân thủ 14 hạng mục tiêu chuẩn quản lý vệ sinh chung" },
      { ja: "毎月店舗を改装すること", vi: "Cải tạo cửa hàng mỗi tháng" },
      { ja: "メニュー数を最小限にすること", vi: "Giảm thiểu số lượng món trong thực đơn" },
    ],
    correctIndex: 1,
    explanationVi: "Doanh nghiệp nhỏ có thể dùng sổ tay \"HACCPの考え方を取り入れた衛生管理\" do hiệp hội ngành soạn, nhưng khi đó việc tuân thủ đủ 14 hạng mục tiêu chuẩn quản lý vệ sinh chung càng trở nên quan trọng.",
    sourceQuoteJa:
      "衛生管理基準の弾力的な運用の対象となる飲食店などの小規模営業者は、事業者団体などが作成した「HACCPの考え方を取り入れた衛生管理」の手引書を活用することが可能ですが、その場合には特に一般的な衛生管理の基準１４項目の順守が重要になります",
    sourcePage: 5,
  },
  {
    id: "hy-27",
    chapterId: "hy-ch3",
    questionJa: "営業許可更新時や保健所の定期立入検査で、実施状況確認の基となる書類は何か。",
    questionVi: "Khi gia hạn giấy phép kinh doanh hoặc trong đợt thanh tra định kỳ của trung tâm y tế, tài liệu làm căn cứ xác nhận tình trạng thực hiện là gì?",
    options: [
      { ja: "従業員の履歴書", vi: "Sơ yếu lý lịch nhân viên" },
      { ja: "月次売上報告書", vi: "Báo cáo doanh thu hàng tháng" },
      { ja: "食品衛生監視票", vi: "Phiếu giám sát vệ sinh thực phẩm" },
      { ja: "メニュー表", vi: "Thực đơn" },
    ],
    correctIndex: 2,
    explanationVi: "食品衛生監視票 (Phiếu giám sát vệ sinh thực phẩm) là căn cứ để cơ quan y tế xác nhận tình trạng thực hiện quản lý vệ sinh theo HACCP, chấm điểm theo từng hạng mục.",
    sourceQuoteJa:
      "営業許可更新時や保健所による定期的な立入検査などの監視指導時には、「食品衛生監視票」に基づいて「HACCPに沿った衛生管理」の実施状況の確認を受ける必要があります。",
    sourcePage: 5,
  },
  {
    id: "hy-28",
    chapterId: "hy-ch3",
    questionJa: "「HACCPに沿った衛生管理」実施のため、すべての営業者がおこなわなければならないこととして、本文に挙げられていないものはどれか。",
    questionVi: "Điều KHÔNG được nêu trong 4 việc bắt buộc mọi doanh nghiệp phải thực hiện để triển khai quản lý vệ sinh theo HACCP là gì?",
    options: [
      { ja: "衛生管理計画の作成", vi: "Lập kế hoạch quản lý vệ sinh" },
      { ja: "記録と保存", vi: "Ghi chép và lưu trữ" },
      { ja: "定期的な検証", vi: "Kiểm chứng định kỳ" },
      { ja: "毎月の従業員給与見直し", vi: "Rà soát lương nhân viên hàng tháng" },
    ],
    correctIndex: 3,
    explanationVi: "4 việc bắt buộc: lập kế hoạch quản lý vệ sinh, lập sổ tay hướng dẫn, ghi chép và lưu trữ, kiểm chứng định kỳ — KHÔNG bao gồm việc rà soát lương.",
    sourceQuoteJa:
      "① 衛生管理計画の作成② 手引書の作成③ 記録と保存：衛生管理の実施状況を記録し、保存する。④ 定期的な検証",
    sourcePage: 5,
  },
  {
    id: "hy-29",
    chapterId: "hy-ch3",
    questionJa: "「衛生管理計画の作成」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"Lập kế hoạch quản lý vệ sinh\" là gì?",
    options: [
      { ja: "基準に基づき衛生管理計画を作成し、従業員に周知徹底を図る", vi: "Lập kế hoạch quản lý vệ sinh dựa theo tiêu chuẩn, và phổ biến triệt để cho nhân viên" },
      { ja: "計画は作成するが従業員には秘密にする", vi: "Lập kế hoạch nhưng giữ bí mật với nhân viên" },
      { ja: "計画は1度作成したら二度と変更しない", vi: "Kế hoạch chỉ lập 1 lần, không bao giờ thay đổi" },
      { ja: "計画作成は本部のみがおこない店舗は関与しない", vi: "Chỉ trụ sở chính lập kế hoạch, cửa hàng không tham gia" },
    ],
    correctIndex: 0,
    explanationVi: "Lập kế hoạch dựa theo tiêu chuẩn về quản lý vệ sinh chung và HACCP, sau đó phải phổ biến triệt để cho toàn thể nhân viên.",
    sourceQuoteJa: "衛生管理計画の作成：「一般的な衛生管理」および「HACCPに沿った衛生管理」に関する基準に基づき衛生管理計画を作成し、従業員に周知徹底を図る。",
    sourcePage: 5,
  },
  {
    id: "hy-30",
    chapterId: "hy-ch3",
    questionJa: "「定期的な検証」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"Kiểm chứng định kỳ\" là gì?",
    options: [
      { ja: "衛生管理計画・手順書の効果を定期的に検証し、必要に応じて内容を見直す", vi: "Định kỳ kiểm chứng hiệu quả của kế hoạch/sổ tay quy trình, và điều chỉnh nội dung khi cần" },
      { ja: "一度作成した計画は永久に見直さない", vi: "Kế hoạch đã lập thì không bao giờ xem lại" },
      { ja: "検証は税務署がおこなうもので営業者は関与しない", vi: "Việc kiểm chứng do cơ quan thuế thực hiện, doanh nghiệp không tham gia" },
      { ja: "検証は10年に1回で十分", vi: "Kiểm chứng 10 năm 1 lần là đủ" },
    ],
    correctIndex: 0,
    explanationVi: "定期的な検証 = định kỳ (và khi có thay đổi trong quy trình) kiểm chứng hiệu quả kế hoạch/sổ tay hướng dẫn, rồi điều chỉnh nội dung nếu cần thiết.",
    sourceQuoteJa: "定期的な検証：衛生管理計画および手順書の効果を定期的に（および工程に変更が生じた際などに）検証し（振り返り）、必要に応じて内容を見直す。",
    sourcePage: 5,
  },
  {
    id: "hy-31",
    chapterId: "hy-ch3",
    questionJa: "「一般的な衛生管理の基準14項目」に含まれないものはどれか。",
    questionVi: "Hạng mục KHÔNG nằm trong \"14 tiêu chuẩn quản lý vệ sinh chung\" là gì?",
    options: [
      { ja: "食品衛生責任者等の選任", vi: "Bổ nhiệm người phụ trách vệ sinh thực phẩm" },
      { ja: "ねずみ及び昆虫対策", vi: "Đối sách chuột và côn trùng" },
      { ja: "教育訓練", vi: "Đào tạo huấn luyện" },
      { ja: "店舗の年間広告予算", vi: "Ngân sách quảng cáo hàng năm của cửa hàng" },
    ],
    correctIndex: 3,
    explanationVi: "14 hạng mục xoay quanh vệ sinh: người phụ trách, cơ sở vật chất, thiết bị, nước sử dụng, chuột côn trùng, rác thải, người xử lý thực phẩm, kiểm thực, thông tin, thu hồi, vận chuyển, bán hàng, đào tạo, và mục khác — KHÔNG liên quan ngân sách quảng cáo.",
    sourceQuoteJa:
      "① 食品衛生責任者等の選任② 施設の衛生管理③ 設備等の衛生管理④ 使用水等の管理⑤ ねずみ及び昆虫対策⑥ 廃棄物及び排水の取扱い⑦ 食品又は添加物を取り扱う者の衛生管理⑧ 検食の実施⑨ 情報の提供⑩ 回収・廃棄⑪ 運搬⑫ 販売⑬ 教育訓練⑭ そのほか",
    sourcePage: 5,
  },
  {
    id: "hy-32",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則を定めた国際機関はどれか。",
    questionVi: "Tổ chức quốc tế đã đặt ra 7 nguyên tắc HACCP là gì?",
    options: [
      { ja: "国連教育科学文化機関（UNESCO）", vi: "UNESCO" },
      { ja: "世界貿易機関（WTO）", vi: "WTO" },
      { ja: "国際労働機関（ILO）", vi: "ILO" },
      { ja: "FAOとWHOの合同食品規格委員会（コーデックス委員会）", vi: "Ủy ban Tiêu chuẩn Thực phẩm chung của FAO và WHO (Ủy ban Codex)" },
    ],
    correctIndex: 3,
    explanationVi: "HACCP7原則 do Ủy ban Tiêu chuẩn Thực phẩm chung (コーデックス委員会) của Tổ chức Lương thực Nông nghiệp Liên Hợp Quốc (FAO) và Tổ chức Y tế Thế giới (WHO) đặt ra.",
    sourceQuoteJa:
      "重要工程管理の取組みの基準は、国連の食糧農業機関（FAO）と世界保健機関（WHO）の合同食品規格委員会（コーデックス委員会）のHACCP７原則に基づいておこなう",
    sourcePage: 6,
  },
  {
    id: "hy-33",
    chapterId: "hy-ch3",
    questionJa: "「HACCPに基づく衛生管理」（HACCP7原則を厳格に適用する方式）は主にどの事業者に義務づけられているか。",
    questionVi: "\"Quản lý vệ sinh dựa trên HACCP\" (áp dụng nghiêm ngặt 7 nguyên tắc HACCP) chủ yếu bắt buộc với đối tượng nào?",
    options: [
      { ja: "個人経営の屋台のみ", vi: "Chỉ xe đẩy bán hàng cá nhân" },
      { ja: "学生アルバイトのみ", vi: "Chỉ sinh viên làm thêm" },
      { ja: "大規模事業者など", vi: "Các doanh nghiệp quy mô lớn..." },
      { ja: "海外からの観光客向け店舗のみ", vi: "Chỉ cửa hàng phục vụ khách du lịch nước ngoài" },
    ],
    correctIndex: 2,
    explanationVi: "「HACCPに基づく衛生管理」(áp dụng nghiêm ngặt 7 nguyên tắc) được bắt buộc chủ yếu với doanh nghiệp quy mô lớn; doanh nghiệp nhỏ (như quán ăn) có thể dùng phương thức linh hoạt hơn (HACCPの考え方を取り入れた衛生管理).",
    sourceQuoteJa: "「HACCPに基づく衛生管理」を大規模事業者などに義務づけています",
    sourcePage: 6,
  },
  {
    id: "hy-34",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則の「①危害要因の分析」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"① Phân tích yếu tố nguy hại\" trong 7 nguyên tắc HACCP là gì?",
    options: [
      { ja: "各工程ごとに危害要因の一覧表を作成し、それらを管理するための措置を定めること", vi: "Lập bảng liệt kê yếu tố nguy hại theo từng công đoạn, và định ra biện pháp quản lý chúng" },
      { ja: "従業員の給与を分析すること", vi: "Phân tích lương nhân viên" },
      { ja: "競合店の価格を調査すること", vi: "Điều tra giá của đối thủ cạnh tranh" },
      { ja: "客の年齢層を分析すること", vi: "Phân tích độ tuổi khách hàng" },
    ],
    correctIndex: 0,
    explanationVi: "危害要因の分析 = lập bảng liệt kê các yếu tố có thể gây nguy hại vệ sinh theo từng công đoạn (chế biến/vận chuyển/bảo quản/bán hàng...), và định ra biện pháp quản lý (管理措置) cho từng yếu tố đó.",
    sourceQuoteJa:
      "危害要因の分析：食品又は添加物の製造、加工、調理、運搬、貯蔵又は販売の工程ごとに、食品衛生上の危害を発生させ得る要因（危害要因）の一覧表を作成し、これら危害要因を管理するための措置（管理措置）を定めること。",
    sourcePage: 6,
  },
  {
    id: "hy-35",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則の「②重要管理点の決定」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"② Xác định điểm quản lý quan trọng\" là gì?",
    options: [
      { ja: "店舗の内装を決定すること", vi: "Quyết định thiết kế nội thất cửa hàng" },
      { ja: "危害要因の発生防止に管理措置を講ずることが不可欠な工程を特定すること", vi: "Xác định công đoạn bắt buộc phải có biện pháp quản lý để ngăn phát sinh yếu tố nguy hại" },
      { ja: "従業員の勤務シフトを決定すること", vi: "Quyết định ca làm việc của nhân viên" },
      { ja: "メニューの価格を決定すること", vi: "Quyết định giá thực đơn" },
    ],
    correctIndex: 1,
    explanationVi: "重要管理点の決定 = xác định những công đoạn mà việc có biện pháp quản lý là bắt buộc (không thể thiếu) để ngăn ngừa/loại trừ/giảm yếu tố nguy hại xuống mức chấp nhận được.",
    sourceQuoteJa:
      "重要管理点の決定：①で特定された危害要因の発生の防止、排除又は許容できる水準にまで低減するために管理措置を講ずることが不可欠な工程を重要管理点として特定すること。",
    sourcePage: 6,
  },
  {
    id: "hy-36",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則の「③管理基準の設定」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"③ Thiết lập tiêu chuẩn quản lý\" là gì?",
    options: [
      { ja: "店舗の営業時間を設定すること", vi: "Thiết lập giờ mở cửa" },
      { ja: "従業員の休憩時間を設定すること", vi: "Thiết lập giờ nghỉ nhân viên" },
      { ja: "メニューの数量を設定すること", vi: "Thiết lập số lượng món trong thực đơn" },
      { ja: "個々の重要管理点で危害要因を防止・排除・低減するための基準を設定すること", vi: "Thiết lập tiêu chuẩn ở từng điểm quản lý quan trọng để ngăn/loại trừ/giảm yếu tố nguy hại" },
    ],
    correctIndex: 3,
    explanationVi: "管理基準の設定 = với mỗi điểm quản lý quan trọng (đã xác định ở nguyên tắc ②), thiết lập tiêu chuẩn cụ thể (ví dụ: nhiệt độ, thời gian) để ngăn/loại trừ/giảm yếu tố nguy hại.",
    sourceQuoteJa:
      "管理基準の設定：個々の重要管理点において、危害要因の発生の防止、排除又は許容できる水準にまで低減するための基準（管理基準）を設定すること。",
    sourcePage: 6,
  },
  {
    id: "hy-37",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則の「④モニタリング方法の設定」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"④ Thiết lập phương pháp giám sát (Monitoring)\" là gì?",
    options: [
      { ja: "重要管理点の管理実施状況を連続的または相当な頻度で確認する方法を設定すること", vi: "Thiết lập phương pháp xác nhận tình trạng thực hiện quản lý tại điểm quản lý quan trọng, liên tục hoặc với tần suất đủ dày" },
      { ja: "顧客アンケートを実施すること", vi: "Thực hiện khảo sát khách hàng" },
      { ja: "従業員の面接をおこなうこと", vi: "Phỏng vấn nhân viên" },
      { ja: "競合店を視察すること", vi: "Đi khảo sát cửa hàng đối thủ" },
    ],
    correctIndex: 0,
    explanationVi: "モニタリング方法の設定 = định ra cách thức để xác nhận (liên tục hoặc theo tần suất đủ dày) rằng việc quản lý tại điểm quản lý quan trọng đang được thực hiện đúng.",
    sourceQuoteJa:
      "モニタリング方法の設定：重要管理点の管理の実施状況について、連続的又は相当な頻度の確認（モニタリング）をするための方法を設定すること。",
    sourcePage: 6,
  },
  {
    id: "hy-38",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則の「⑤改善措置の設定」はどのような場合に適用されるか。",
    questionVi: "\"⑤ Thiết lập biện pháp cải thiện\" được áp dụng trong trường hợp nào?",
    options: [
      { ja: "モニタリングの結果、管理基準を逸脱したことが判明した場合", vi: "Khi kết quả giám sát cho thấy đã vượt quá tiêu chuẩn quản lý" },
      { ja: "毎日決まった時刻に自動的に適用される", vi: "Tự động áp dụng vào giờ cố định mỗi ngày" },
      { ja: "新メニューを発売する場合のみ", vi: "Chỉ khi ra mắt món mới" },
      { ja: "客からクレームが来た場合のみ", vi: "Chỉ khi có khiếu nại từ khách" },
    ],
    correctIndex: 0,
    explanationVi: "改善措置の設定 = định trước biện pháp cải thiện sẽ áp dụng khi kết quả モニタリング (giám sát) cho thấy đã lệch khỏi tiêu chuẩn quản lý (管理基準) đã đặt ra.",
    sourceQuoteJa:
      "改善措置の設定：個々の重要管理点において、モニタリングの結果、管理基準を逸脱したことが判明した場合の改善措置を設定すること。",
    sourcePage: 6,
  },
  {
    id: "hy-39",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則の「⑥検証方法の設定」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"⑥ Thiết lập phương pháp kiểm chứng\" là gì?",
    options: [
      { ja: "従業員の身元調査をおこなうこと", vi: "Điều tra lý lịch nhân viên" },
      { ja: "①～⑤に規定する措置の内容の効果を、定期的に検証するための手順を定めること", vi: "Định ra quy trình để định kỳ kiểm chứng hiệu quả của các biện pháp đã quy định ở nguyên tắc ①~⑤" },
      { ja: "店舗の防犯カメラを設置すること", vi: "Lắp camera an ninh cửa hàng" },
      { ja: "従業員の給与を検証すること", vi: "Kiểm chứng lương nhân viên" },
    ],
    correctIndex: 1,
    explanationVi: "検証方法の設定 = định ra quy trình để định kỳ kiểm tra xem toàn bộ các biện pháp đã thiết lập ở 5 nguyên tắc trước (①~⑤) có thực sự hiệu quả hay không.",
    sourceQuoteJa: "検証方法の設定：①～⑤に規定する措置の内容の効果を、定期的に検証するための手順を定めること。",
    sourcePage: 6,
  },
  {
    id: "hy-40",
    chapterId: "hy-ch3",
    questionJa: "HACCP7原則の「⑦記録の作成」の内容として正しいものはどれか。",
    questionVi: "Nội dung của \"⑦ Lập hồ sơ ghi chép\" là gì?",
    options: [
      { ja: "営業の規模や業態に応じて、①～⑥に規定する措置の内容に関する書面とその実施の記録を作成すること", vi: "Tùy theo quy mô/loại hình kinh doanh, lập văn bản về nội dung các biện pháp ở ①~⑥ và ghi chép việc thực hiện chúng" },
      { ja: "顧客の個人情報を無制限に収集すること", vi: "Thu thập không giới hạn thông tin cá nhân khách hàng" },
      { ja: "記録は一切不要", vi: "Hoàn toàn không cần ghi chép" },
      { ja: "記録は10年に1回作成すれば十分", vi: "10 năm ghi chép 1 lần là đủ" },
    ],
    correctIndex: 0,
    explanationVi: "記録の作成 = tùy quy mô/loại hình kinh doanh, phải có văn bản mô tả các biện pháp đã quy định ở nguyên tắc ①~⑥, cùng với hồ sơ ghi chép việc thực hiện thực tế.",
    sourceQuoteJa:
      "記録の作成：営業の規模や業態に応じて、①～⑥に規定する措置の内容に関する書面とその実施の記録を作成すること。",
    sourcePage: 6,
  },
  {
    id: "hy-41",
    chapterId: "hy-ch4",
    questionJa: "食品衛生責任者に該当する者の要件として、本文に挙げられていないものはどれか。",
    questionVi: "Điều kiện KHÔNG được nêu để trở thành Người phụ trách vệ sinh thực phẩm là gì?",
    options: [
      { ja: "調理師、製菓衛生師、栄養士などの資格を持つ者", vi: "Người có chứng chỉ đầu bếp, chuyên gia vệ sinh bánh kẹo, chuyên viên dinh dưỡng..." },
      { ja: "都道府県知事などがおこなう講習会を受講した者", vi: "Người đã tham gia khóa học do tỉnh trưởng tổ chức" },
      { ja: "食品衛生監視員または食品衛生管理者の資格要件を満たす者", vi: "Người đáp ứng điều kiện chứng chỉ giám sát viên/quản lý viên vệ sinh thực phẩm" },
      { ja: "店舗の売上高が最も高い従業員", vi: "Nhân viên tạo ra doanh thu cao nhất cửa hàng" },
    ],
    correctIndex: 3,
    explanationVi: "3 nhóm đủ điều kiện: có chứng chỉ nghề liên quan (đầu bếp, dinh dưỡng...), đáp ứng điều kiện giám sát/quản lý viên vệ sinh, hoặc đã qua khóa học do tỉnh tổ chức/công nhận — KHÔNG liên quan doanh thu.",
    sourceQuoteJa:
      "① 食品衛生監視員または食品衛生管理者の資格要件を満たす者② 調理師、製菓衛生師、栄養士、船舶料理士、と畜場法に規定する衛生管理責任者もしくは作業衛生責任者または食鳥処理の事業の規制および食鳥検査に関する法律に規定する食鳥処理衛生管理者③ 都道府県知事などがおこなう講習会または都道府県知事などが適正と認める講習会を受講した者",
    sourcePage: 7,
  },
  {
    id: "hy-42",
    chapterId: "hy-ch4",
    questionJa: "食品衛生責任者が守るべきこととして正しいものはどれか。",
    questionVi: "Điều Người phụ trách vệ sinh thực phẩm phải tuân thủ là gì?",
    options: [
      { ja: "営業者の指示を無視してよい", vi: "Có thể phớt lờ chỉ thị của người kinh doanh" },
      { ja: "定期的に実務講習会を受講し、新たな知見の習得に努める", vi: "Định kỳ tham gia khóa học thực hành, nỗ lực cập nhật kiến thức mới" },
      { ja: "一度資格を取れば二度と学ぶ必要はない", vi: "Chỉ cần lấy chứng chỉ 1 lần, không bao giờ cần học thêm" },
      { ja: "衛生管理に関与しなくてよい", vi: "Không cần tham gia quản lý vệ sinh" },
    ],
    correctIndex: 1,
    explanationVi: "Người phụ trách vệ sinh thực phẩm phải: định kỳ tham gia khóa học thực hành để cập nhật kiến thức, tuân theo chỉ thị của người kinh doanh trong việc quản lý vệ sinh, và đưa ra ý kiến cần thiết cho người kinh doanh (người kinh doanh phải tôn trọng ý kiến đó).",
    sourceQuoteJa:
      "都道府県知事などがおこなう講習会または都道府県知事などが認める講習会（実務講習会）を定期的に受講し、食品衛生に関する新たな知見の習得に努めること",
    sourcePage: 7,
  },
  {
    id: "hy-43",
    chapterId: "hy-ch4",
    questionJa: "床から1mの高さまでの内壁について、清掃の頻度として正しいものはどれか。",
    questionVi: "Tần suất dọn dẹp phần tường nội thất tính từ sàn lên đến 1m là gì?",
    options: [
      { ja: "1年に1回", vi: "1 lần/năm" },
      { ja: "1か月に1回", vi: "1 lần/tháng" },
      { ja: "毎日", vi: "Mỗi ngày" },
      { ja: "汚れたら考える", vi: "Bẩn thì mới tính đến" },
    ],
    correctIndex: 2,
    explanationVi: "Nội thất tính từ sàn lên 1m (đặc biệt quanh bàn bếp, nơi thức ăn thừa dễ bắn vào) cần được dọn dẹp MỖI NGÀY.",
    sourceQuoteJa: "内壁・床の清掃（毎日）床から１m の高さまでの内壁は毎日清掃します。",
    sourcePage: 7,
  },
  {
    id: "hy-44",
    chapterId: "hy-ch4",
    questionJa: "排水溝の清掃頻度として正しいものはどれか。",
    questionVi: "Tần suất dọn dẹp rãnh thoát nước là gì?",
    options: [
      { ja: "1週間に1回", vi: "1 lần/tuần" },
      { ja: "1か月に1回", vi: "1 lần/tháng" },
      { ja: "毎日", vi: "Mỗi ngày" },
      { ja: "清掃は不要", vi: "Không cần dọn dẹp" },
    ],
    correctIndex: 2,
    explanationVi: "排水溝 (rãnh thoát nước), giống như tường/sàn khu vực gần bàn bếp, cần được dọn dẹp MỖI NGÀY để tránh tắc nghẽn và ô nhiễm.",
    sourceQuoteJa: "排水溝の清掃（毎日）排水溝は固形物の流入を防ぎ、適切に排水されるように清掃します。",
    sourcePage: 7,
  },
  {
    id: "hy-45",
    chapterId: "hy-ch4",
    questionJa: "レンジフードの掃除を怠るとどのような危険があるか。",
    questionVi: "Nếu bỏ bê việc dọn dẹp máy hút mùi bếp, nguy cơ gì có thể xảy ra?",
    options: [
      { ja: "電気代が下がる", vi: "Tiền điện giảm" },
      { ja: "調理時間が短縮される", vi: "Rút ngắn thời gian nấu" },
      { ja: "特に危険はない", vi: "Không có nguy hiểm gì đặc biệt" },
      { ja: "グリスフィルターに油分と埃が付着し、火がついて火災の原因になる", vi: "Dầu và bụi bám vào bộ lọc mỡ, dễ bắt lửa gây hỏa hoạn" },
    ],
    correctIndex: 3,
    explanationVi: "Nếu không dọn dẹp, dầu hóa hơi tích tụ và đóng cứng trong máy hút mùi; đặc biệt bộ lọc mỡ (グリスフィルター) tích bụi lẫn dầu rất dễ bắt lửa, trở thành nguyên nhân hỏa hoạn.",
    sourceQuoteJa:
      "掃除を怠ると気化した油がレンジフード内で固化して清掃が困難になります。特にグリスフィルターはたまった油分に埃が付着し、その埃に火がついて火災の原因にもなります。",
    sourcePage: 8,
  },
  {
    id: "hy-46",
    chapterId: "hy-ch4",
    questionJa: "冷蔵庫内・冷凍庫内の温度基準として正しいものはどれか。",
    questionVi: "Tiêu chuẩn nhiệt độ trong tủ lạnh/tủ đông là gì?",
    options: [
      { ja: "冷蔵庫内は0℃以下、冷凍庫は常温", vi: "Tủ lạnh dưới 0°C, tủ đông nhiệt độ thường" },
      { ja: "冷蔵庫内は25℃以下、冷凍庫は5℃以下", vi: "Tủ lạnh dưới 25°C, tủ đông dưới 5°C" },
      { ja: "特に基準はない", vi: "Không có tiêu chuẩn nào cả" },
      { ja: "冷蔵庫内は10℃以下、冷凍庫は－15℃以下", vi: "Tủ lạnh dưới 10°C, tủ đông dưới -15°C" },
    ],
    correctIndex: 3,
    explanationVi: "冷蔵庫内は10℃以下、冷凍庫は-15℃以下 để bảo quản — nhưng vi sinh vật vẫn có thể tồn tại ở nhiệt độ thấp nên vẫn cần dọn dẹp định kỳ.",
    sourceQuoteJa: "冷蔵庫内は１０℃以下、冷凍庫は－１５℃以下に保ちますが、微生物が死滅するわけではなく低温でも生存しています",
    sourcePage: 8,
  },
  {
    id: "hy-47",
    chapterId: "hy-ch4",
    questionJa: "トイレを清掃する際、汚染を拡げないための正しい順序はどれか。",
    questionVi: "Khi dọn nhà vệ sinh, thứ tự đúng để tránh lan rộng ô nhiễm là gì?",
    options: [
      { ja: "壁・床面→便座裏→手洗設備→ドアノブ", vi: "Tường/sàn → Sau bồn cầu → Bồn rửa tay → Tay nắm cửa" },
      { ja: "履物→水洗レバー→ドアノブ→壁床", vi: "Giày dép → Cần giật nước → Tay nắm cửa → Tường/sàn" },
      { ja: "ドアノブなど手が触れる箇所→手洗設備→水洗レバー→便座・蓋・便座裏→履物→壁・床面など", vi: "Nơi tay chạm (tay nắm cửa...) → Bồn rửa tay → Cần giật nước → Bồn cầu/nắp/mặt sau → Giày dép → Tường/sàn" },
      { ja: "順序は関係ない、どこからでもよい", vi: "Không quan trọng thứ tự, dọn đâu trước cũng được" },
    ],
    correctIndex: 2,
    explanationVi: "Thứ tự dọn dẹp nhà vệ sinh nhằm tránh lan ô nhiễm: từ nơi tay hay chạm (tay nắm cửa) → bồn rửa tay → cần giật nước → bồn cầu (nắp, mặt sau) → giày dép → cuối cùng là tường/sàn.",
    sourceQuoteJa:
      "清掃時に汚染を拡げないために、「ドアノブなど手が触れる箇所」「手洗設備→コック→シンク内」「水洗レバー」「便座・蓋・便座裏」「履物」「壁・床面など」の順に掃除します。",
    sourcePage: 9,
  },
  {
    id: "hy-48",
    chapterId: "hy-ch4",
    questionJa: "調理施設の納品口について、原則として守るべきことはどれか。",
    questionVi: "Về cửa nhận hàng của cơ sở chế biến, nguyên tắc cần tuân thủ là gì?",
    options: [
      { ja: "24時間常に開放しておく", vi: "Luôn để mở 24/24" },
      { ja: "搬入時以外には扉を閉めておく", vi: "Ngoài lúc nhập hàng thì luôn đóng cửa" },
      { ja: "施錠せず誰でも出入りできるようにする", vi: "Không khóa, để ai cũng ra vào được" },
      { ja: "納品口は不要", vi: "Không cần cửa nhận hàng" },
    ],
    correctIndex: 1,
    explanationVi: "Cửa nhận hàng dễ chịu ảnh hưởng từ bụi, lá rụng, côn trùng xâm nhập khi mở — nguyên tắc là đóng cửa ngoại trừ lúc đang nhận hàng.",
    sourceQuoteJa: "搬入時以外には扉を閉めておくことが原則です。",
    sourcePage: 9,
  },
  {
    id: "hy-49",
    chapterId: "hy-ch4",
    questionJa: "清掃用具（モップやブラシ）を保管する際の正しい方法はどれか。",
    questionVi: "Cách bảo quản đúng cho dụng cụ dọn dẹp (giẻ lau, chổi) là gì?",
    options: [
      { ja: "床に直置きして保管する", vi: "Đặt trực tiếp xuống sàn để bảo quản" },
      { ja: "調理台の上に置く", vi: "Đặt trên bàn bếp" },
      { ja: "床に直置きせず、つるして保管する", vi: "Không đặt trực tiếp xuống sàn, treo lên để bảo quản" },
      { ja: "食材保管庫に一緒に入れる", vi: "Cất chung với kho bảo quản nguyên liệu" },
    ],
    correctIndex: 2,
    explanationVi: "Dụng cụ dọn dẹp phải được TREO lên, không đặt trực tiếp xuống sàn — tránh ẩm ướt gây sinh sôi vi sinh vật.",
    sourceQuoteJa: "清掃用具の保管の際には、モップやブラシが床に直置きにならないようにつるして保管してください。",
    sourcePage: 9,
  },
  {
    id: "hy-50",
    chapterId: "hy-ch4",
    questionJa: "調理施設での動物飼育について正しいものはどれか。",
    questionVi: "Về việc nuôi động vật trong cơ sở chế biến, điều đúng là gì?",
    options: [
      { ja: "調理施設内であればどこでも動物を飼育してよい", vi: "Được nuôi động vật ở bất kỳ đâu trong cơ sở chế biến" },
      { ja: "猫カフェの調理場でも動物と触れ合ってよい", vi: "Ngay cả bếp của quán cà phê mèo cũng được cho khách tiếp xúc động vật" },
      { ja: "動物カフェの客席は清掃・消毒が不要", vi: "Khu vực khách ngồi của quán thú cưng không cần dọn dẹp/khử trùng" },
      { ja: "食品または添加物を取り扱い・保存する区域では動物の飼育が禁止されている", vi: "Cấm nuôi động vật ở khu vực xử lý/bảo quản thực phẩm hoặc phụ gia" },
    ],
    correctIndex: 3,
    explanationVi: "Luật cấm nuôi động vật ở khu vực xử lý/bảo quản thực phẩm hoặc phụ gia. Với quán cà phê thú cưng, khu vực cho thú tiếp xúc CHỈ giới hạn ở khu khách ngồi, và khu vực này vẫn cần được dọn dẹp/khử trùng theo kế hoạch.",
    sourceQuoteJa:
      "「食品又は添加物を取り扱い、又は保存する区域において動物を飼育しないこと」と定めています。",
    sourcePage: 9,
  },
  {
    id: "hy-51",
    chapterId: "hy-ch4",
    questionJa: "「洗浄」と「消毒」の違いとして正しいものはどれか。",
    questionVi: "Sự khác biệt giữa \"Rửa\" (洗浄) và \"Khử trùng\" (消毒) là gì?",
    options: [
      { ja: "洗浄=汚れや異物を落とすこと、消毒=有害微生物を除くこと", vi: "Rửa = loại bỏ vết bẩn/dị vật, Khử trùng = loại bỏ vi sinh vật có hại" },
      { ja: "洗浄と消毒は全く同じ意味である", vi: "Rửa và khử trùng có nghĩa hoàn toàn giống nhau" },
      { ja: "消毒は汚れを落とすこと、洗浄は微生物を除くこと", vi: "Khử trùng = loại bỏ vết bẩn, Rửa = loại bỏ vi sinh vật" },
      { ja: "洗浄は不要で消毒だけで十分", vi: "Không cần rửa, chỉ cần khử trùng là đủ" },
    ],
    correctIndex: 0,
    explanationVi: "「洗浄」nhằm loại bỏ vết bẩn/dị vật; 「消毒」nhằm loại bỏ vi sinh vật có hại. Cần lựa chọn và kết hợp phù hợp với mục đích — không thể thay thế nhau.",
    sourceQuoteJa:
      "汚れや異物を落とす目的であれば「洗浄」をおこないます。また、有害微生物を除きたい場合には「消毒」をおこないます。",
    sourcePage: 10,
  },
  {
    id: "hy-52",
    chapterId: "hy-ch4",
    questionJa: "木製のまな板が使用しないほうが望ましいとされる理由はどれか。",
    questionVi: "Lý do thớt gỗ không được khuyến khích sử dụng là gì?",
    options: [
      { ja: "傷がつきやすく、そこに微生物が入り込みやすいため", vi: "Dễ trầy xước, và vi sinh vật dễ len vào các vết trầy đó" },
      { ja: "価格が高いため", vi: "Vì giá thành cao" },
      { ja: "重すぎて扱いにくいため", vi: "Vì quá nặng khó thao tác" },
      { ja: "色が変わりやすいため", vi: "Vì dễ đổi màu" },
    ],
    correctIndex: 0,
    explanationVi: "Thớt gỗ dễ bị trầy xước bề mặt khi dùng, và vi sinh vật dễ len vào các vết trầy đó, khó làm sạch triệt để — nên không được khuyến khích dùng.",
    sourceQuoteJa: "木製のまな板は傷がつきやすく、そこに微生物が入り込みやすいため使用しないほうが望ましいです。",
    sourcePage: 11,
  },
  {
    id: "hy-53",
    chapterId: "hy-ch4",
    questionJa: "洗浄剤の3分類として正しい組み合わせはどれか。",
    questionVi: "3 loại chất tẩy rửa được phân loại đúng là gì?",
    options: [
      { ja: "冷却剤・加熱剤・中和剤", vi: "Chất làm lạnh - Chất gia nhiệt - Chất trung hòa" },
      { ja: "中性洗剤・アルカリ性洗浄剤・酸性洗浄剤", vi: "Chất tẩy trung tính - Chất tẩy kiềm - Chất tẩy axit" },
      { ja: "液体・固体・気体", vi: "Dạng lỏng - Dạng rắn - Dạng khí" },
      { ja: "国産・輸入・混合", vi: "Nội địa - Nhập khẩu - Hỗn hợp" },
    ],
    correctIndex: 1,
    explanationVi: "3 loại chất tẩy rửa: 中性洗剤 (dùng cho dụng cụ nấu/rau củ), アルカリ性洗浄剤 (dùng cho vết dầu mỡ nặng, sàn/tường), 酸性洗浄剤 (dùng loại bỏ cặn khoáng trong máy rửa bát).",
    sourceQuoteJa: "食品製造現場で使用される洗浄剤には、手洗い用に使用する石けん、野菜・果物や食器、調理器具などに使用する中性洗剤、重度の油汚れに使用するアルカリ性洗浄剤、スケール除去に使用される酸性洗浄剤などがあります。",
    sourcePage: 12,
  },
  {
    id: "hy-54",
    chapterId: "hy-ch4",
    questionJa: "野菜または果物に洗浄剤を使用する際の基準として正しいものはどれか。",
    questionVi: "Tiêu chuẩn khi dùng chất tẩy rửa cho rau/quả là gì?",
    options: [
      { ja: "24時間以上浸けておく", vi: "Ngâm từ 24 giờ trở lên" },
      { ja: "5分間以上、洗浄剤の溶液に浸せきされないようにする", vi: "Không được ngâm trong dung dịch tẩy rửa quá 5 phút" },
      { ja: "洗浄剤の使用に制限はない", vi: "Không có giới hạn nào khi dùng chất tẩy rửa" },
      { ja: "必ず1時間以上浸ける", vi: "Bắt buộc ngâm từ 1 tiếng trở lên" },
    ],
    correctIndex: 1,
    explanationVi: "Với rau/quả, không được ngâm trong dung dịch chất tẩy rửa quá 5 phút, theo quy định sử dụng của Luật Vệ sinh Thực phẩm.",
    sourceQuoteJa: "野菜または果物に使用可能な洗浄剤の使用に際しては、使用濃度を守り、野菜または果実が５分間以上洗浄剤の溶液に浸せきされないようにしなければなりません。",
    sourcePage: 13,
  },
  {
    id: "hy-55",
    chapterId: "hy-ch4",
    questionJa: "洗浄剤を使用した後のすすぎ基準（流水を用いる場合）として正しいものはどれか。",
    questionVi: "Tiêu chuẩn tráng lại (dùng nước chảy) sau khi dùng chất tẩy rửa là gì?",
    options: [
      { ja: "野菜・果実は30秒間以上、食器は5秒間以上すすぐ", vi: "Rau/quả tráng ≥30 giây, bát đĩa tráng ≥5 giây" },
      { ja: "野菜・果実は5秒間以上、食器は30秒間以上すすぐ", vi: "Rau/quả tráng ≥5 giây, bát đĩa tráng ≥30 giây" },
      { ja: "すべて1秒ですすげば十分", vi: "Tráng 1 giây là đủ cho mọi thứ" },
      { ja: "すすぎは不要", vi: "Không cần tráng lại" },
    ],
    correctIndex: 0,
    explanationVi: "Khi dùng nước chảy để tráng: rau/quả tráng tối thiểu 30 giây, bát đĩa tráng tối thiểu 5 giây. Nếu dùng nước ngâm (không chảy), phải thay nước và tráng tối thiểu 2 lần.",
    sourceQuoteJa: "流水を用いる場合、野菜、果実は３０秒間以上、食器は５秒間以上すすぐこと、ため水を用いる場合はため水をかえて２回以上すすぐことが定められています。",
    sourcePage: 13,
  },
  {
    id: "hy-56",
    chapterId: "hy-ch4",
    questionJa: "食器類・調理器具・機械類の加熱消毒基準として正しいものはどれか。",
    questionVi: "Tiêu chuẩn khử trùng bằng nhiệt cho bát đĩa/dụng cụ/máy móc bếp là gì?",
    options: [
      { ja: "40℃で10秒間", vi: "40°C trong 10 giây" },
      { ja: "60℃で1時間", vi: "60°C trong 1 tiếng" },
      { ja: "80℃で5分間以上", vi: "80°C trong ít nhất 5 phút" },
      { ja: "常温で放置するだけ", vi: "Chỉ cần để ở nhiệt độ thường" },
    ],
    correctIndex: 2,
    explanationVi: "Bát đĩa/dụng cụ/máy móc bếp sau khi rửa: khử trùng bằng nhiệt ở 80°C trong ít nhất 5 phút. Bộ phận chịu nhiệt/khăn/khăn lau: đun sôi 100°C trong ít nhất 5 phút.",
    sourceQuoteJa: "洗浄後の食器類、調理器具・機械類は８０℃で５分間以上加熱して消毒します。フードカッターの耐熱性部品、布きん、タオルなどは１００℃で５分間以上の煮沸殺菌が有効です。",
    sourcePage: 14,
  },
  {
    id: "hy-57",
    chapterId: "hy-ch4",
    questionJa: "次亜塩素酸ナトリウムを消毒剤として使用する際の注意点はどれか。",
    questionVi: "Điểm cần lưu ý khi dùng natri hypoclorit làm chất khử trùng là gì?",
    options: [
      { ja: "手指保護のため手袋を着用し、金属腐食性があるため使用後は十分に水洗いする", vi: "Đeo găng tay bảo vệ, và vì có tính ăn mòn kim loại nên phải rửa nước kỹ sau khi dùng" },
      { ja: "金属を腐食させないので何の対策も不要", vi: "Không ăn mòn kim loại nên không cần biện pháp gì" },
      { ja: "手袋は不要、素手で扱ってよい", vi: "Không cần găng tay, có thể dùng tay không" },
      { ja: "使用後は水洗い禁止", vi: "Sau khi dùng cấm rửa nước" },
    ],
    correctIndex: 0,
    explanationVi: "次亜塩素酸ナトリウム (natri hypoclorit) có tính ăn mòn kim loại, nên cần đeo găng tay bảo vệ khi dùng, và rửa nước kỹ dụng cụ sau khi dùng để không còn dư lượng gây ăn mòn.",
    sourceQuoteJa: "手指保護のために手袋を着用します。次亜塩素酸ナトリウムは金属腐食性がありますので、使用後の器具類に残らないように十分に水洗いします。",
    sourcePage: 14,
  },
  {
    id: "hy-58",
    chapterId: "hy-ch4",
    questionJa: "紫外線殺菌灯の寿命はおよそどれくらいか。",
    questionVi: "Tuổi thọ của đèn khử trùng tia UV vào khoảng bao nhiêu?",
    options: [
      { ja: "300時間程度", vi: "Khoảng 300 giờ" },
      { ja: "3,000時間程度", vi: "Khoảng 3.000 giờ" },
      { ja: "30,000時間程度", vi: "Khoảng 30.000 giờ" },
      { ja: "永久に交換不要", vi: "Vĩnh viễn không cần thay" },
    ],
    correctIndex: 1,
    explanationVi: "Đèn khử trùng tia UV có tuổi thọ khoảng 3.000 giờ; hiệu quả khử trùng giảm dần theo thời gian sử dụng, cần theo dõi và ghi chép thời điểm thay thế.",
    sourceQuoteJa: "紫外線殺菌灯は使用時間の経過に伴って殺菌効果が減少し、その寿命は３，０００時間程度です。",
    sourcePage: 16,
  },
  {
    id: "hy-59",
    chapterId: "hy-ch4",
    questionJa: "手洗い用洗浄剤として衛生的とされるものはどれか。",
    questionVi: "Loại xà phòng rửa tay được coi là hợp vệ sinh là gì?",
    options: [
      { ja: "何度も継ぎ足して使う固形石けん", vi: "Xà phòng cục dùng đi dùng lại nhiều lần" },
      { ja: "共用のタオルに含ませた洗剤", vi: "Chất tẩy thấm trên khăn dùng chung" },
      { ja: "使い切った後補充しない容器", vi: "Bình đựng không được châm lại sau khi hết" },
      { ja: "一回ごとに使い切る液体石けん", vi: "Xà phòng lỏng dùng hết trong 1 lần" },
    ],
    correctIndex: 3,
    explanationVi: "Xà phòng lỏng dùng hết trong 1 lần (一回ごとに使い切る液体石けん) được coi là hợp vệ sinh nhất cho việc rửa tay, tránh nhiễm chéo từ việc tái sử dụng dụng cụ chứa.",
    sourceQuoteJa: "手洗い用洗浄剤は、一回ごとに使い切る液体石けんが衛生的です。",
    sourcePage: 16,
  },
  {
    id: "hy-60",
    chapterId: "hy-ch4",
    questionJa: "食品などの製造、加工、調理に使用する水として正しいものはどれか。",
    questionVi: "Loại nước được phép dùng để sản xuất/chế biến/nấu thực phẩm là gì?",
    options: [
      { ja: "「水道水」または「飲用に適する水」", vi: "\"Nước máy\" hoặc \"nước phù hợp để uống\"" },
      { ja: "雨水であれば何でもよい", vi: "Nước mưa loại nào cũng được" },
      { ja: "工業用水でも問題ない", vi: "Dùng nước công nghiệp cũng không sao" },
      { ja: "水の種類に制限はない", vi: "Không có giới hạn về loại nước" },
    ],
    correctIndex: 0,
    explanationVi: "Nước dùng để sản xuất/chế biến/nấu thực phẩm bắt buộc phải là \"nước máy\" (水道水) hoặc \"nước phù hợp để uống\" (飲用に適する水).",
    sourceQuoteJa: "食品などの製造、加工、調理に使用する水は、「水道水」又は「飲用に適する水」を使用しなければなりません。",
    sourcePage: 17,
  },
  {
    id: "hy-61",
    chapterId: "hy-ch4",
    questionJa: "「飲用に適する水」を使用する場合の水質検査頻度として正しいものはどれか。",
    questionVi: "Tần suất kiểm tra chất lượng nước khi dùng \"nước phù hợp để uống\" là gì?",
    options: [
      { ja: "1年に1回以上", vi: "Từ 1 lần/năm trở lên" },
      { ja: "10年に1回", vi: "1 lần/10 năm" },
      { ja: "検査は不要", vi: "Không cần kiểm tra" },
      { ja: "1日に1回", vi: "1 lần/ngày" },
    ],
    correctIndex: 0,
    explanationVi: "Khi dùng \"nước phù hợp để uống\" (không phải nước máy trực tiếp), phải kiểm tra chất lượng nước tối thiểu 1 lần/năm, cùng với kiểm tra định kỳ bồn chứa/thiết bị khử trùng.",
    sourceQuoteJa: "「飲用に適する水」を使用する場合には、１年１回以上の水質検査をおこない、貯水槽の清掃、殺菌装置・浄水装置の作動状況を定期的に確認しなければなりません。",
    sourcePage: 17,
  },
  {
    id: "hy-62",
    chapterId: "hy-ch4",
    questionJa: "「専用水道」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa \"đường ống nước riêng\" (専用水道) là gì?",
    options: [
      { ja: "100人を超える者に供給するもの、または1日最大給水量が20㎥を超えるもの", vi: "Cung cấp cho hơn 100 người, hoặc lượng cấp nước tối đa/ngày vượt 20m³" },
      { ja: "5人以下の家族専用の水道", vi: "Đường ống nước riêng cho gia đình dưới 5 người" },
      { ja: "市町村が管理する水道すべて", vi: "Mọi đường ống nước do chính quyền địa phương quản lý" },
      { ja: "海外から輸入した水", vi: "Nước nhập khẩu từ nước ngoài" },
    ],
    correctIndex: 0,
    explanationVi: "専用水道 (đường ống nước riêng, ví dụ ký túc xá/nhà ở công ty) được định nghĩa khi cấp nước cho >100 người, hoặc lượng cấp nước tối đa mỗi ngày >20m³.",
    sourceQuoteJa: "専用水道により供給される水：寄宿舎、社宅、療養所などにおける自家用の水道などで、①１００人を超える者に供給するものまたは、②１日最大給水量が２０㎥を超えるもの",
    sourcePage: 17,
  },
  {
    id: "hy-63",
    chapterId: "hy-ch4",
    questionJa: "使用水の日常点検について正しいものはどれか。",
    questionVi: "Về việc kiểm tra thường ngày đối với nước sử dụng, điều đúng là gì?",
    options: [
      { ja: "点検は1年に1回で十分", vi: "Kiểm tra 1 lần/năm là đủ" },
      { ja: "色だけ確認すればよい", vi: "Chỉ cần kiểm tra màu là đủ" },
      { ja: "作業開始前に色・濁り・臭い・味を確認し、1日1回以上記録する", vi: "Trước khi bắt đầu công việc, kiểm tra màu/độ đục/mùi/vị và ghi chép tối thiểu 1 lần/ngày" },
      { ja: "点検記録は不要", vi: "Không cần ghi chép kiểm tra" },
    ],
    correctIndex: 2,
    explanationVi: "Trước khi bắt đầu công việc mỗi ngày, cần kiểm tra 4 yếu tố (màu, độ đục, mùi, vị) của nước sử dụng và ghi chép lại, tối thiểu 1 lần/ngày.",
    sourceQuoteJa: "作業開始前に、「色、濁り、臭い、味」について異常の有無を確認し、記録します。点検は１日１回以上おこないます。",
    sourcePage: 17,
  },
  {
    id: "hy-64",
    chapterId: "hy-ch4",
    questionJa: "殺菌装置または浄水装置を設置している場合、確認すべき残留塩素濃度の基準はどれか。",
    questionVi: "Nếu có lắp thiết bị khử trùng/lọc nước, tiêu chuẩn nồng độ clo dư cần xác nhận là gì?",
    options: [
      { ja: "10ppm以上", vi: "Từ 10ppm trở lên" },
      { ja: "濃度確認は不要", vi: "Không cần xác nhận nồng độ" },
      { ja: "0ppmでなければならない", vi: "Phải bằng 0ppm" },
      { ja: "0.1ppm以上", vi: "Từ 0.1ppm trở lên" },
    ],
    correctIndex: 3,
    explanationVi: "Trước khi làm việc, cần xác nhận tình trạng hoạt động của thiết bị và nồng độ clo dư đạt tối thiểu 0.1ppm.",
    sourceQuoteJa: "作業開始前に異常の有無を確認し、作動状況と残留塩素濃度が０．１ppm 以上あることを確認します。",
    sourcePage: 18,
  },
  {
    id: "hy-65",
    chapterId: "hy-ch4",
    questionJa: "水質検査の結果（成績書）の保存期間として正しいものはどれか。",
    questionVi: "Thời gian lưu trữ kết quả kiểm tra chất lượng nước (giấy chứng nhận) là gì?",
    options: [
      { ja: "1週間で破棄してよい", vi: "Có thể hủy sau 1 tuần" },
      { ja: "保存の必要はない", vi: "Không cần lưu trữ" },
      { ja: "1か月間のみ", vi: "Chỉ 1 tháng" },
      { ja: "1年間以上（取り扱う食品の流通期間なども考慮）", vi: "Từ 1 năm trở lên (có xem xét thời gian lưu thông của thực phẩm...)" },
    ],
    correctIndex: 3,
    explanationVi: "Kết quả kiểm tra chất lượng nước phải lưu trữ tối thiểu 1 năm, và cần cân nhắc thêm thời gian lưu thông/hạn sử dụng của thực phẩm đang kinh doanh khi quyết định thời gian lưu trữ thực tế.",
    sourceQuoteJa: "水質検査の結果は、その成績書を１年間以上保存します。だだし、その保存期間は、取り扱う食品などの流通期間や賞味期限を考慮する必要があります。",
    sourcePage: 18,
  },
  {
    id: "hy-66",
    chapterId: "hy-ch4",
    questionJa: "ねずみおよび昆虫の駆除頻度として正しいものはどれか。",
    questionVi: "Tần suất diệt chuột và côn trùng là gì?",
    options: [
      { ja: "5年に1回", vi: "1 lần/5 năm" },
      { ja: "駆除は不要", vi: "Không cần diệt trừ" },
      { ja: "1年に2回以上、記録を1年間保管", vi: "Từ 2 lần/năm trở lên, lưu trữ hồ sơ 1 năm" },
      { ja: "1日に1回", vi: "1 lần/ngày" },
    ],
    correctIndex: 2,
    explanationVi: "Diệt chuột/côn trùng tối thiểu 2 lần/năm, lưu hồ sơ 1 năm. Nếu có khảo sát định kỳ (モニタリング) cho thấy không phát hiện chuột/côn trùng thì không bắt buộc phải diệt trừ đủ 2 lần/năm.",
    sourceQuoteJa: "ねずみおよび昆虫の駆除は、１年に２回以上は実施し、その記録を１年間保管します。",
    sourcePage: 18,
  },
  {
    id: "hy-67",
    chapterId: "hy-ch4",
    questionJa: "クマねずみとドブねずみの違いとして正しいものはどれか。",
    questionVi: "Sự khác biệt giữa chuột leo trèo (クマねずみ) và chuột cống (ドブねずみ) là gì?",
    options: [
      { ja: "両方とも全く同じ習性を持つ", vi: "Cả hai có tập tính hoàn toàn giống nhau" },
      { ja: "ドブねずみのほうが垂直移動が得意", vi: "Chuột cống giỏi di chuyển theo chiều thẳng đứng hơn" },
      { ja: "クマねずみは水辺にしか生息しない", vi: "Chuột leo trèo chỉ sống gần nước" },
      { ja: "クマねずみは垂直移動が得意で2cm程度のすき間も通り抜けるが、ドブねずみは上下の動きが苦手", vi: "Chuột leo trèo giỏi di chuyển theo chiều thẳng đứng, chui qua khe hở ~2cm; chuột cống thì kém khả năng di chuyển lên xuống" },
    ],
    correctIndex: 3,
    explanationVi: "クマねずみ giỏi di chuyển theo chiều dọc (trèo lên trần nhà, đường ống dây điện) và chui qua khe hở chỉ ~2cm; ドブねずみ ngược lại kém khả năng di chuyển lên xuống.",
    sourceQuoteJa: "クマねずみは垂直面の移動が得意で、天井の配線、床の配水管のすき間、パイプなど２㎝程度のすき間も通り抜け侵入します。一方、ドブねずみは上下の動きは苦手です。",
    sourcePage: 19,
  },
  {
    id: "hy-68",
    chapterId: "hy-ch4",
    questionJa: "ゴキブリを大量駆除した後、調理施設内で特に注意すべきことはどれか。",
    questionVi: "Sau khi diệt gián với số lượng lớn, điều cần đặc biệt lưu ý trong cơ sở chế biến là gì?",
    options: [
      { ja: "死骸はそのまま放置してよい", vi: "Có thể để nguyên xác gián" },
      { ja: "死骸は調理に利用してよい", vi: "Có thể dùng xác gián để nấu ăn" },
      { ja: "死骸が見つかりやすいので、見つけたらすぐに取り除く", vi: "Dễ tìm thấy xác gián, thấy là phải lấy bỏ ngay" },
      { ja: "特に何も注意する必要はない", vi: "Không cần lưu ý gì cả" },
    ],
    correctIndex: 2,
    explanationVi: "Sau xử lý diệt gián số lượng lớn, xác gián dễ xuất hiện trong cơ sở — cần phát hiện và loại bỏ ngay để tránh lẫn vào thức ăn hoặc bị khách nhìn thấy.",
    sourceQuoteJa: "駆除処理後の調理施設内にはゴキブリの死骸が見つかりやすいので、異物混入やお客様の目にふれないように見つけたらすぐに取り除きます。",
    sourcePage: 19,
  },
  {
    id: "hy-69",
    chapterId: "hy-ch4",
    questionJa: "食品類を取り扱う調理施設内でのハエ対策として、極力避けるべきことはどれか。",
    questionVi: "Trong biện pháp đối phó ruồi tại cơ sở chế biến, điều nên tránh tối đa là gì?",
    options: [
      { ja: "施設内で殺虫剤を噴霧すること", vi: "Xịt thuốc diệt côn trùng trong cơ sở" },
      { ja: "排水溝を清掃すること", vi: "Dọn dẹp rãnh thoát nước" },
      { ja: "生ゴミにフタをすること", vi: "Đậy nắp thùng rác thực phẩm" },
      { ja: "網戸を設置すること", vi: "Lắp lưới chống côn trùng" },
    ],
    correctIndex: 0,
    explanationVi: "Trong khu vực xử lý thực phẩm, nên tránh xịt thuốc diệt côn trùng trực tiếp — quan trọng hơn là ngăn ruồi xâm nhập và cắt nguồn phát sinh (dọn dẹp rác/rãnh thoát nước).",
    sourceQuoteJa: "食品類を取り扱う調理施設内で殺虫剤を噴霧することは極力避け、ハエの施設内への侵入を防ぐことと、発生源を断つことがもっとも重要です。",
    sourcePage: 19,
  },
  {
    id: "hy-70",
    chapterId: "hy-ch4",
    questionJa: "「廃棄物の処理及び清掃に関する法律」の目的として正しいものはどれか。",
    questionVi: "Mục đích của \"Luật xử lý chất thải và vệ sinh\" là gì?",
    options: [
      { ja: "廃棄物の適正な処理と生活環境の清潔保持、公衆衛生の向上", vi: "Xử lý đúng đắn chất thải, giữ sạch môi trường sống, nâng cao vệ sinh công cộng" },
      { ja: "従業員の給与を規定すること", vi: "Quy định lương nhân viên" },
      { ja: "メニュー価格を統一すること", vi: "Thống nhất giá thực đơn" },
      { ja: "店舗の営業時間を制限すること", vi: "Giới hạn giờ mở cửa" },
    ],
    correctIndex: 0,
    explanationVi: "Luật này nhằm hạn chế phát sinh chất thải, xử lý đúng đắn (phân loại/bảo quản/thu gom/vận chuyển/tái chế/tiêu hủy), qua đó giữ sạch môi trường sống và nâng cao vệ sinh công cộng.",
    sourceQuoteJa: "「廃棄物の処理及び清掃に関する法律」では、廃棄物の排出を抑制し、及び廃棄物の適正な分別、保管、収集、運搬、再生、処分などの処理をし、並びに生活環境を清潔にすることにより、生活環境の保全及び公衆衛生の向上を図ることを目的としています。",
    sourcePage: 19,
  },
  {
    id: "hy-71",
    chapterId: "hy-ch4",
    questionJa: "食品関係施設から出るゴミの処理責任について正しいものはどれか。",
    questionVi: "Về trách nhiệm xử lý rác từ cơ sở liên quan thực phẩm, điều đúng là gì?",
    options: [
      { ja: "処理責任はすべて自治体にある", vi: "Trách nhiệm xử lý hoàn toàn thuộc về chính quyền địa phương" },
      { ja: "処理責任は隣の店舗にある", vi: "Trách nhiệm xử lý thuộc về cửa hàng bên cạnh" },
      { ja: "原則として事業者がみずから責任をもって適切に処理する", vi: "Về nguyên tắc, doanh nghiệp phải tự chịu trách nhiệm xử lý đúng đắn" },
      { ja: "処理は誰もしなくてよい", vi: "Không ai cần xử lý cả" },
    ],
    correctIndex: 2,
    explanationVi: "Rác thải từ cơ sở kinh doanh thực phẩm (事業系一般廃棄物) về nguyên tắc doanh nghiệp phải tự chịu trách nhiệm xử lý đúng đắn.",
    sourceQuoteJa: "食品関係施設から出されるゴミは、原則として事業者がみずから責任をもって適切に処理する必要があります。",
    sourcePage: 20,
  },
  {
    id: "hy-72",
    chapterId: "hy-ch4",
    questionJa: "施設からの排水を公共の下水道に放流する場合、守ることが求められる法令はどれか。",
    questionVi: "Khi xả nước thải từ cơ sở vào hệ thống cống công cộng, luật cần tuân thủ là gì?",
    options: [
      { ja: "特に法令はない、自由に放流できる", vi: "Không có luật nào, được xả tự do" },
      { ja: "労働基準法", vi: "Luật Tiêu chuẩn Lao động" },
      { ja: "会社法", vi: "Luật Công ty" },
      { ja: "「下水道法」や自治体条例による水質基準", vi: "Tiêu chuẩn chất lượng nước theo \"Luật Cống thoát nước\" và quy định địa phương" },
    ],
    correctIndex: 3,
    explanationVi: "Khi xả nước thải ra cống công cộng, phải tuân thủ tiêu chuẩn chất lượng nước theo Luật Cống thoát nước (下水道法) và quy định của chính quyền địa phương.",
    sourceQuoteJa: "施設からの排水を公共の下水道に放流する場合には「下水道法」や自治体条例による水質基準を守ることが求められます。",
    sourcePage: 20,
  },
  {
    id: "hy-73",
    chapterId: "hy-ch4",
    questionJa: "ノロウイルス食中毒の発生原因の約80%は何に由来するとされているか。",
    questionVi: "Khoảng 80% nguyên nhân ngộ độc do Norovirus được cho là bắt nguồn từ đâu?",
    options: [
      { ja: "冷蔵庫の故障", vi: "Tủ lạnh hỏng" },
      { ja: "食品取扱者", vi: "Người xử lý thực phẩm" },
      { ja: "調理器具の材質", vi: "Chất liệu dụng cụ bếp" },
      { ja: "店舗の立地", vi: "Vị trí cửa hàng" },
    ],
    correctIndex: 1,
    explanationVi: "Khoảng 80% ngộ độc do Norovirus có nguồn gốc từ chính người xử lý thực phẩm — vì vậy quản lý sức khỏe hàng ngày và phòng ngừa lây nhiễm chéo từ họ sang thực phẩm cực kỳ quan trọng.",
    sourceQuoteJa: "ノロウイルス食中毒の発生原因の約８０％は食品取扱者に由来したものであるとの報告があります。",
    sourcePage: 21,
  },
  {
    id: "hy-74",
    chapterId: "hy-ch4",
    questionJa: "食品取扱者に下痢やおう吐などの胃腸炎症状がある場合、どうすべきか。",
    questionVi: "Nếu người xử lý thực phẩm có triệu chứng viêm dạ dày ruột (tiêu chảy, nôn mửa), cần làm gì?",
    options: [
      { ja: "マスクだけ着用すれば通常通り調理してよい", vi: "Chỉ cần đeo khẩu trang là có thể nấu ăn bình thường" },
      { ja: "調理作業に従事しない", vi: "Không tham gia công việc chế biến" },
      { ja: "手袋だけ着用すればよい", vi: "Chỉ cần đeo găng tay là đủ" },
      { ja: "症状を無視して働く", vi: "Bỏ qua triệu chứng và tiếp tục làm việc" },
    ],
    correctIndex: 1,
    explanationVi: "Người có triệu chứng viêm dạ dày ruột (tiêu chảy, nôn mửa...) TUYỆT ĐỐI không được tham gia công việc chế biến — kể cả khi không có triệu chứng vẫn có thể là người mang mầm bệnh không triệu chứng nên vẫn cần cẩn trọng.",
    sourceQuoteJa: "食品取扱者に下痢やおう吐などの胃腸炎症状がある場合は、調理作業に従事しないことが重要です。",
    sourcePage: 22,
  },
  {
    id: "hy-75",
    chapterId: "hy-ch4",
    questionJa: "「無症状病原体保有者」とはどのような人を指すか。",
    questionVi: "\"Người mang mầm bệnh không triệu chứng\" (無症状病原体保有者) chỉ người như thế nào?",
    options: [
      { ja: "病原体に感染しているが症状が出ていない人", vi: "Người đã nhiễm mầm bệnh nhưng không biểu hiện triệu chứng" },
      { ja: "一度もウイルスに感染したことがない人", vi: "Người chưa từng nhiễm virus lần nào" },
      { ja: "ワクチンを接種した人", vi: "Người đã tiêm vắc-xin" },
      { ja: "医師の資格を持つ人", vi: "Người có chứng chỉ bác sĩ" },
    ],
    correctIndex: 0,
    explanationVi: "無症状病原体保有者 = người đã nhiễm mầm bệnh (như Norovirus) nhưng không có biểu hiện triệu chứng — vẫn có khả năng lây nhiễm cho người khác/thực phẩm dù bản thân không có triệu chứng viêm dạ dày ruột.",
    sourceQuoteJa: "ノロウイルスなどに感染しても症状の出ない無症状病原体保有者が存在しますので、胃腸炎症状がなくとも注意が必要です。",
    sourcePage: 22,
  },
  {
    id: "hy-76",
    chapterId: "hy-ch4",
    questionJa: "マスクの着用が必ず必要とされる作業はどれか。",
    questionVi: "Công việc bắt buộc phải đeo khẩu trang là gì?",
    options: [
      { ja: "レジ会計のみ", vi: "Chỉ khi thu ngân" },
      { ja: "盛り付け作業など、食品に直接触れる作業", vi: "Công việc trình bày món ăn... nơi trực tiếp chạm vào thực phẩm" },
      { ja: "倉庫の在庫確認のみ", vi: "Chỉ khi kiểm kho" },
      { ja: "駐車場の案内のみ", vi: "Chỉ khi hướng dẫn bãi đỗ xe" },
    ],
    correctIndex: 1,
    explanationVi: "Khi làm công việc trực tiếp chạm vào thực phẩm (như trình bày món ăn), bắt buộc phải đeo khẩu trang để ngăn vi khuẩn từ mũi/miệng và nước bọt khi hắt hơi lây nhiễm vào thức ăn.",
    sourceQuoteJa: "盛り付け作業など、食品に直接触れる作業時は必ず着用します。",
    sourcePage: 23,
  },
  {
    id: "hy-77",
    chapterId: "hy-ch4",
    questionJa: "使い捨て手袋の使用について正しいものはどれか。",
    questionVi: "Về việc sử dụng găng tay dùng 1 lần, điều đúng là gì?",
    options: [
      { ja: "破れていなければ何度でも再使用してよい", vi: "Chưa rách thì có thể tái sử dụng nhiều lần" },
      { ja: "洗えば再使用できる", vi: "Rửa sạch là có thể dùng lại" },
      { ja: "一度使用した手袋を再使用してはいけない", vi: "Không được tái sử dụng găng tay đã dùng qua" },
      { ja: "1週間は同じ手袋でよい", vi: "Dùng 1 đôi găng tay trong cả tuần cũng được" },
    ],
    correctIndex: 2,
    explanationVi: "Găng tay dùng 1 lần (使い捨て手袋) tuyệt đối không được tái sử dụng — dù chưa rách hay bẩn, phải thay khi chuyển từ công việc \"bẩn\" sang \"sạch\" hoặc sau thời gian đeo quy định.",
    sourceQuoteJa: "一度使用した手袋を再使用してはいけません。",
    sourcePage: 23,
  },
  {
    id: "hy-78",
    chapterId: "hy-ch4",
    questionJa: "手洗いが必要なタイミングとして、本文に挙げられていないものはどれか。",
    questionVi: "Thời điểm KHÔNG được nêu là cần rửa tay là gì?",
    options: [
      { ja: "調理場に入室する前", vi: "Trước khi vào khu bếp" },
      { ja: "トイレを使用した後", vi: "Sau khi đi vệ sinh" },
      { ja: "盛り付け作業前", vi: "Trước khi trình bày món" },
      { ja: "SNSに写真を投稿する前", vi: "Trước khi đăng ảnh lên mạng xã hội" },
    ],
    correctIndex: 3,
    explanationVi: "Các thời điểm cần rửa tay: trước khi vào bếp, trước khi chạm thực phẩm, trước khi trình bày món, sau khi đi vệ sinh, sau khi chạm mặt/tóc, trước bữa ăn... — không liên quan đến việc đăng mạng xã hội.",
    sourceQuoteJa: "調理場に入室する前は有害微生物を持ち込まないために、調理場入口で必ず手を洗います。",
    sourcePage: 23,
  },
  {
    id: "hy-79",
    chapterId: "hy-ch4",
    questionJa: "食品表示法でアレルゲン表示が義務づけられている「特定原材料」8品目に含まれないものはどれか。",
    questionVi: "Nguyên liệu KHÔNG nằm trong 8 loại \"nguyên liệu đặc định\" bắt buộc ghi nhãn dị ứng theo Luật Ghi nhãn Thực phẩm là gì?",
    options: [
      { ja: "えび、かに", vi: "Tôm, cua" },
      { ja: "小麦、そば", vi: "Lúa mì, kiều mạch" },
      { ja: "卵、乳、落花生、くるみ", vi: "Trứng, sữa, lạc, óc chó" },
      { ja: "米、砂糖", vi: "Gạo, đường" },
    ],
    correctIndex: 3,
    explanationVi: "8 nguyên liệu đặc định bắt buộc ghi nhãn: えび/かに/小麦/そば/卵/乳/落花生/くるみ (tôm/cua/lúa mì/kiều mạch/trứng/sữa/lạc/óc chó) — KHÔNG bao gồm gạo hay đường.",
    sourceQuoteJa:
      "アレルギー物質（アレルゲン）表示義務のある特定原材料８品目（くるみを含む）と特定原材料に準ずる表示推奨２０品目",
    sourcePage: 25,
  },
  {
    id: "hy-80",
    chapterId: "hy-ch4",
    questionJa: "レストランなどの外食店において、アレルゲン情報の提供は義務づけられているか。",
    questionVi: "Ở các quán ăn/nhà hàng, việc cung cấp thông tin dị ứng có phải là bắt buộc không?",
    options: [
      { ja: "義務ではないが、情報提供が推奨されている", vi: "Không bắt buộc, nhưng được khuyến khích cung cấp thông tin" },
      { ja: "完全に義務であり違反すれば罰則がある", vi: "Hoàn toàn bắt buộc, vi phạm sẽ bị phạt" },
      { ja: "禁止されている", vi: "Bị cấm cung cấp" },
      { ja: "外食店には一切関係ない", vi: "Hoàn toàn không liên quan đến quán ăn" },
    ],
    correctIndex: 0,
    explanationVi: "Với hình thức bán đối diện/quán ăn (外食など), việc cung cấp thông tin dị ứng KHÔNG bắt buộc theo luật (do nguyên liệu/nguồn hàng thay đổi thường xuyên, khó đảm bảo chính xác), nhưng vẫn được khuyến khích ghi vào thực đơn.",
    sourceQuoteJa: "対面販売や店頭での量り売りをおこなう場合や、レストランのような飲食店など（以下、「外食など」）では、アレルゲン情報の提供は義務づけられていません。",
    sourcePage: 25,
  },
  {
    id: "hy-81",
    chapterId: "hy-ch4",
    questionJa: "保健所への情報提供が求められる場合として、本文に挙げられていないものはどれか。",
    questionVi: "Trường hợp KHÔNG được nêu là cần báo cáo cho trung tâm y tế là gì?",
    options: [
      { ja: "医師や複数の客から食中毒ではないかとの連絡があった場合", vi: "Khi có bác sĩ hoặc nhiều khách liên hệ nghi ngờ ngộ độc" },
      { ja: "製品の自主検査で未加熱食品から有害微生物を検出した場合", vi: "Khi tự kiểm tra phát hiện vi sinh vật có hại trong thực phẩm chưa nấu chín" },
      { ja: "製造機械の破損で異物混入の可能性がある場合", vi: "Khi máy móc hỏng có khả năng lẫn dị vật" },
      { ja: "従業員が有給休暇を申請した場合", vi: "Khi nhân viên xin nghỉ phép có lương" },
    ],
    correctIndex: 3,
    explanationVi: "Các trường hợp cần báo cáo cho trung tâm y tế (保健所): nghi ngờ ngộ độc từ bác sĩ/khách, phát hiện vi sinh vật có hại, khả năng lẫn dị vật, sản phẩm bị thu hồi từ nước ngoài — KHÔNG liên quan đến việc xin nghỉ phép của nhân viên.",
    sourceQuoteJa:
      "医師や複数のお客様から、食中毒ではないかとの連絡があった場合／製品の自主検査の結果、未加熱で食べる食品から有害微生物を検出した場合／製造機械の破損で、金属や硬質プラスチックなどの異物が製品に混入した可能性がある場合",
    sourcePage: 24,
  },
  {
    id: "hy-82",
    chapterId: "hy-ch4",
    questionJa: "食品リコール（自主回収）情報の報告制度について正しいものはどれか。",
    questionVi: "Về chế độ báo cáo thông tin thu hồi thực phẩm tự nguyện, điều đúng là gì?",
    options: [
      { ja: "2021年6月1日から、自主回収に着手した旨と状況を都道府県に届出することが義務づけられた", vi: "Từ 1/6/2021, bắt buộc báo cáo cho tỉnh khi bắt đầu thu hồi tự nguyện và tình hình thu hồi" },
      { ja: "リコールをすること自体が義務づけられている", vi: "Bản thân việc thu hồi (Recall) là bắt buộc" },
      { ja: "この制度は2000年より前からある", vi: "Chế độ này có từ trước năm 2000" },
      { ja: "報告先は警察署である", vi: "Nơi báo cáo là đồn cảnh sát" },
    ],
    correctIndex: 0,
    explanationVi: "Từ 1/6/2021, chế độ quốc gia yêu cầu: khi doanh nghiệp TỰ QUYẾT ĐỊNH thu hồi sản phẩm, phải báo cáo việc bắt đầu và tình hình thu hồi cho tỉnh — bản thân việc thu hồi không bị bắt buộc, chỉ bắt buộc BÁO CÁO nếu đã quyết định thu hồi.",
    sourceQuoteJa: "２０２１年６月１日からは国の制度として、営業者は食品リコール（自主回収）に着手した旨および回収の状況を都道府県に届出することが義務づけられました。",
    sourcePage: 27,
  },
  {
    id: "hy-83",
    chapterId: "hy-ch4",
    questionJa: "「自主回収」と行政による「回収命令」の違いとして正しいものはどれか。",
    questionVi: "Sự khác biệt giữa \"Thu hồi tự nguyện\" và \"Lệnh thu hồi\" của cơ quan hành chính là gì?",
    options: [
      { ja: "自主回収は生産者みずからの措置、回収命令は行政による法令違反品への措置", vi: "Thu hồi tự nguyện là biện pháp do chính nhà sản xuất thực hiện; lệnh thu hồi là biện pháp của cơ quan hành chính với sản phẩm vi phạm luật" },
      { ja: "両者は全く同じ意味である", vi: "Hai khái niệm này hoàn toàn giống nhau" },
      { ja: "自主回収のほうが行政の権限が強い", vi: "Thu hồi tự nguyện có quyền lực hành chính mạnh hơn" },
      { ja: "回収命令は消費者が出すもの", vi: "Lệnh thu hồi do người tiêu dùng ban hành" },
    ],
    correctIndex: 0,
    explanationVi: "自主回収 = nhà sản xuất TỰ QUYẾT ĐỊNH thu hồi khi phát hiện lỗi sản phẩm đã bán; 回収命令 = biện pháp bắt buộc do CƠ QUAN HÀNH CHÍNH ban hành đối với sản phẩm vi phạm Luật Vệ sinh Thực phẩm — 2 khái niệm khác nhau.",
    sourceQuoteJa: "自主回収とは、一度販売された製品に何らかの欠陥があることが判明した場合に、生産者が自主的に製品の回収の措置をおこなうものであり、行政による食品衛生法違反品の回収命令とは異なる措置です。",
    sourcePage: 27,
  },
  {
    id: "hy-84",
    chapterId: "hy-ch4",
    questionJa: "食品を運搬する際の温度管理として正しいものはどれか。",
    questionVi: "Khi vận chuyển thực phẩm, cách quản lý nhiệt độ đúng là gì?",
    options: [
      { ja: "積み込み前に車両を予冷し、積み降ろし作業はできるだけ迅速におこなう", vi: "Làm lạnh trước xe trước khi chất hàng, và thao tác bốc dỡ càng nhanh càng tốt" },
      { ja: "温度管理は不要", vi: "Không cần quản lý nhiệt độ" },
      { ja: "ドアはできるだけ長時間開けておく", vi: "Nên mở cửa xe càng lâu càng tốt" },
      { ja: "予冷は不要、直接積み込めばよい", vi: "Không cần làm lạnh trước, cứ chất hàng trực tiếp" },
    ],
    correctIndex: 0,
    explanationVi: "Trước khi chất hàng cần làm lạnh trước xe/container (予冷), và khi bốc/dỡ hàng phải làm nhanh vì mở cửa sẽ khiến nhiệt độ trong khoang tăng đột ngột.",
    sourceQuoteJa: "積み込み時の品温を点検して適温を保つようにします。また、必要がある場合には、食品を積み込む前に車両やコンテナの予冷をしておきます。積み降ろし作業は、ドアを開閉することで庫内温度が急激に上がるので、できるだけ迅速におこないます。",
    sourcePage: 28,
  },
  {
    id: "hy-85",
    chapterId: "hy-ch4",
    questionJa: "冷蔵・冷凍品をショーケースで販売する場合、守るべきことはどれか。",
    questionVi: "Khi bán hàng đông lạnh/ướp lạnh trong tủ trưng bày, điều cần tuân thủ là gì?",
    options: [
      { ja: "ロードライン（商品陳列の上限ライン）を守り、定期的に温度を確認・記録する", vi: "Tuân thủ vạch giới hạn (Load Line) khi trưng bày, và định kỳ kiểm tra/ghi chép nhiệt độ" },
      { ja: "陳列量に制限はない", vi: "Không có giới hạn lượng trưng bày" },
      { ja: "温度確認は不要", vi: "Không cần kiểm tra nhiệt độ" },
      { ja: "ショーケースの電源は常に切っておく", vi: "Luôn tắt nguồn tủ trưng bày" },
    ],
    correctIndex: 0,
    explanationVi: "Khi trưng bày hàng lạnh trong tủ kính, phải tuân thủ vạch giới hạn trưng bày (ロードライン) để đảm bảo luồng khí lạnh lưu thông đều, và định kỳ kiểm tra/ghi chép nhiệt độ.",
    sourceQuoteJa: "冷蔵・冷凍品をショーケースで販売する場合は、ロードライン（商品陳列の上限ライン）を守り、定期的に温度を確認して記録します。",
    sourcePage: 29,
  },
  {
    id: "hy-86",
    chapterId: "hy-ch4",
    questionJa: "計り売りする商品の表示について正しいものはどれか。",
    questionVi: "Về việc ghi nhãn hàng bán theo cân, điều đúng là gì?",
    options: [
      { ja: "表示は免除されるが、微生物汚染・異物混入防止のための衛生管理は必要", vi: "Được miễn ghi nhãn, nhưng vẫn cần quản lý vệ sinh để phòng ô nhiễm vi sinh vật/dị vật" },
      { ja: "表示も衛生管理も完全に不要", vi: "Cả ghi nhãn và quản lý vệ sinh đều hoàn toàn không cần" },
      { ja: "表示は必須、衛生管理は不要", vi: "Ghi nhãn là bắt buộc, quản lý vệ sinh thì không cần" },
      { ja: "計り売りは法律で禁止されている", vi: "Bán theo cân bị pháp luật cấm" },
    ],
    correctIndex: 0,
    explanationVi: "Hàng bán theo cân (計り売り) được miễn yêu cầu ghi nhãn, nhưng vẫn phải đảm bảo vệ sinh: rửa/khử trùng tay và dụng cụ, che đậy thực phẩm để phòng ô nhiễm vi sinh vật và dị vật.",
    sourceQuoteJa: "計り売りする商品の表示は免除されますが、微生物汚染、異物混入防止のため、手指および使用する器具の洗浄・消毒、食品の覆いなどをおこないます。",
    sourcePage: 29,
  },
  {
    id: "hy-87",
    chapterId: "hy-ch4",
    questionJa: "主な教育訓練項目として、本文に挙げられていないものはどれか。",
    questionVi: "Mục KHÔNG được nêu trong các hạng mục đào tạo huấn luyện chính là gì?",
    options: [
      { ja: "健康管理", vi: "Quản lý sức khỏe" },
      { ja: "身だしなみ", vi: "Tác phong bề ngoài" },
      { ja: "手洗いなど", vi: "Rửa tay..." },
      { ja: "店舗の不動産価値の査定", vi: "Định giá bất động sản cửa hàng" },
    ],
    correctIndex: 3,
    explanationVi: "6 hạng mục đào tạo chính: quản lý sức khỏe, tác phong, rửa tay, cách xử lý thực phẩm/dụng cụ, kiến thức phòng ngừa ngộ độc mới nhất, xử lý an toàn hóa chất — KHÔNG liên quan định giá bất động sản.",
    sourceQuoteJa:
      "① 健康管理：出勤時の健康チェック項目、体調不良時の業務対応および連絡方法など② 身だしなみ：作業着の着用、持ち込み禁止品などの厨房入室時のルールなど③ 手洗いなど：手洗い方法、手洗いのタイミング、衛生手袋の使用方法など",
    sourcePage: 29,
  },
  {
    id: "hy-88",
    chapterId: "hy-ch4",
    questionJa: "衛生管理の記録が必要な理由として、本文に挙げられていないものはどれか。",
    questionVi: "Lý do KHÔNG được nêu để giải thích tại sao cần ghi chép quản lý vệ sinh là gì?",
    options: [
      { ja: "不適切な事象を発見→改善→事故を未然に防止できる", vi: "Có thể phát hiện → cải thiện → ngăn ngừa sự cố từ những dấu hiệu bất thường" },
      { ja: "問題が起きた時の対応を迅速化できる", vi: "Giúp phản ứng nhanh khi có sự cố" },
      { ja: "店の安全性をアピールし信頼を獲得できる", vi: "Giúp quảng bá độ an toàn và tạo dựng niềm tin cho cửa hàng" },
      { ja: "従業員のボーナス額を自動計算できる", vi: "Tự động tính tiền thưởng cho nhân viên" },
    ],
    correctIndex: 3,
    explanationVi: "4 lý do ghi chép: phát hiện sớm bất thường để ngăn sự cố, phản ứng nhanh khi có vấn đề, cải thiện hiệu quả công việc, và tạo dựng niềm tin về độ an toàn của cửa hàng — KHÔNG liên quan việc tính thưởng.",
    sourceQuoteJa:
      "① 不適切な事象を「発見→改善→事故を未然に防止」② 問題が起きた時の対応の迅速化③ 作業の効率化と自主管理の推進④ お店の安全性をアピールし、信頼を獲得",
    sourcePage: 30,
  },
  {
    id: "hy-89",
    chapterId: "hy-ch5",
    questionJa: "包丁・まな板の使い方として正しいものはどれか。",
    questionVi: "Cách sử dụng dao/thớt đúng là gì?",
    options: [
      { ja: "すべての食材に同じ1本の包丁を使う", vi: "Dùng chung 1 con dao cho mọi loại nguyên liệu" },
      { ja: "まな板は1枚あれば十分", vi: "Chỉ cần 1 cái thớt là đủ" },
      { ja: "用途分けは特に必要ない", vi: "Không cần phân loại theo mục đích sử dụng" },
      { ja: "魚介類・食肉類・野菜類・加熱済み食品用にそれぞれ専用のものを使用する", vi: "Dùng riêng cho từng loại: hải sản, thịt, rau, thực phẩm đã nấu chín" },
    ],
    correctIndex: 3,
    explanationVi: "Dao/thớt cần dùng riêng cho từng loại nguyên liệu: hải sản, thịt, rau, và thực phẩm đã nấu chín — để tránh lây nhiễm chéo.",
    sourceQuoteJa: "包丁・まな板は、魚介類・食肉類・野菜類・加熱済み食品用とそれぞれ専用のものを使用します。",
    sourcePage: 31,
  },
  {
    id: "hy-90",
    chapterId: "hy-ch5",
    questionJa: "下処理後の食材の保管温度として正しいものはどれか。",
    questionVi: "Nhiệt độ bảo quản nguyên liệu sau khi sơ chế là gì?",
    options: [
      { ja: "すべて常温で保管してよい", vi: "Bảo quản ở nhiệt độ thường cho tất cả" },
      { ja: "肉・魚は10℃以下（生食用魚介類は4℃以下）、生鮮果実・野菜は10℃前後", vi: "Thịt/cá dưới 10°C (hải sản ăn sống dưới 4°C), rau quả tươi khoảng 10°C" },
      { ja: "肉・魚は40℃以上で保管", vi: "Thịt/cá bảo quản trên 40°C" },
      { ja: "保管温度に規定はない", vi: "Không có quy định về nhiệt độ bảo quản" },
    ],
    correctIndex: 1,
    explanationVi: "Sau sơ chế: thịt/cá bảo quản dưới 10°C (hải sản ăn sống dưới 4°C — nghiêm ngặt hơn), rau quả tươi khoảng 10°C.",
    sourceQuoteJa: "肉・魚：１０℃以下（生食用魚介類：４℃以下）、生鮮果実・野菜：１０℃前後。",
    sourcePage: 31,
  },
  {
    id: "hy-91",
    chapterId: "hy-ch5",
    questionJa: "食材を低温で解凍することのメリットはどれか。",
    questionVi: "Lợi ích của việc rã đông thực phẩm ở nhiệt độ thấp là gì?",
    options: [
      { ja: "解凍時間が大幅に短縮される", vi: "Rút ngắn đáng kể thời gian rã đông" },
      { ja: "食材の重量が増える", vi: "Làm tăng trọng lượng thực phẩm" },
      { ja: "特にメリットはない", vi: "Không có lợi ích gì đặc biệt" },
      { ja: "細菌の増殖を抑え、ドリップの発生も抑えられる", vi: "Ức chế vi khuẩn sinh sôi, đồng thời hạn chế rỉ dịch (drip)" },
    ],
    correctIndex: 3,
    explanationVi: "Rã đông ở nhiệt độ thấp giúp ức chế vi khuẩn sinh sôi trong quá trình rã đông, đồng thời hạn chế hiện tượng rỉ dịch (ドリップ) từ thực phẩm.",
    sourceQuoteJa: "凍結した肉や魚の解凍中に細菌の増殖を抑えるために、低温で解凍すると、ドリップの発生も抑えられます。",
    sourcePage: 31,
  },
  {
    id: "hy-92",
    chapterId: "hy-ch5",
    questionJa: "「冷蔵庫内解凍」の特徴として正しいものはどれか。",
    questionVi: "Đặc điểm của \"rã đông trong tủ lạnh\" là gì?",
    options: [
      { ja: "最も速い解凍方法である", vi: "Là phương pháp rã đông nhanh nhất" },
      { ja: "衛生管理上おこなってはいけない方法である", vi: "Là phương pháp bị cấm về mặt quản lý vệ sinh" },
      { ja: "時間はかかるが、品質保持や細菌増殖の抑制に適している", vi: "Tốn thời gian nhưng thích hợp để giữ chất lượng và ức chế vi khuẩn sinh sôi" },
      { ja: "解凍ムラが最も発生しやすい", vi: "Dễ gây rã đông không đều nhất" },
    ],
    correctIndex: 2,
    explanationVi: "Rã đông trong tủ lạnh tốn thời gian (do đối lưu không khí ở nhiệt độ thấp) nhưng phù hợp để giữ chất lượng thực phẩm và ức chế vi khuẩn sinh sôi.",
    sourceQuoteJa: "冷蔵庫内で解凍：冷蔵庫内の空気の対流によって低温環境で解凍するため、時間がかかりますが、品質の保持、細菌増殖の抑制に適しています。",
    sourcePage: 32,
  },
  {
    id: "hy-93",
    chapterId: "hy-ch5",
    questionJa: "「自然・室温解凍」がなぜ衛生管理上おこなってはいけない方法とされているか。",
    questionVi: "Vì sao \"rã đông tự nhiên/ở nhiệt độ phòng\" bị coi là phương pháp cấm về mặt quản lý vệ sinh?",
    options: [
      { ja: "電気代がかかりすぎるため", vi: "Vì tốn quá nhiều tiền điện" },
      { ja: "見た目が悪くなるため", vi: "Vì làm xấu hình thức món ăn" },
      { ja: "食材の表面で細菌が増殖する機会を与えることになるため", vi: "Vì tạo cơ hội cho vi khuẩn sinh sôi trên bề mặt thực phẩm" },
      { ja: "特に理由はない", vi: "Không có lý do gì đặc biệt" },
    ],
    correctIndex: 2,
    explanationVi: "Rã đông ở nhiệt độ phòng tạo cơ hội cho vi khuẩn sinh sôi trên bề mặt thực phẩm, đồng thời chênh lệch nhiệt độ bề mặt-bên trong gây rỉ dịch, ảnh hưởng xấu đến hương vị/chất lượng.",
    sourceQuoteJa: "自然・室温解凍：食材の表面で細菌が増殖する機会を与えることになるため、衛生管理上おこなってはいけない解凍方法です。",
    sourcePage: 32,
  },
  {
    id: "hy-94",
    chapterId: "hy-ch5",
    questionJa: "「電子レンジ解凍」の注意点として正しいものはどれか。",
    questionVi: "Điểm cần lưu ý khi \"rã đông bằng lò vi sóng\" là gì?",
    options: [
      { ja: "最も時間がかかる方法である", vi: "Là phương pháp tốn thời gian nhất" },
      { ja: "衛生的に最も優れている", vi: "Là phương pháp vệ sinh nhất" },
      { ja: "解凍ムラができやすい", vi: "Dễ bị rã đông không đều" },
      { ja: "特に注意点はない", vi: "Không có điểm cần lưu ý gì" },
    ],
    correctIndex: 2,
    explanationVi: "Rã đông bằng lò vi sóng nhanh và tiện lợi, nhưng dễ gây hiện tượng rã đông không đều (chỗ chín chỗ còn đông) — cần chú ý.",
    sourceQuoteJa: "電子レンジ解凍：短時間で解凍できるため便利ですが、解凍ムラができやすいので注意が必要です。",
    sourcePage: 32,
  },
  {
    id: "hy-95",
    chapterId: "hy-ch5",
    questionJa: "ボツリヌス菌、ウエルシュ菌、セレウス菌などの「芽胞形成菌」について正しいものはどれか。",
    questionVi: "Về \"vi khuẩn tạo bào tử\" (như Clostridium botulinum, Clostridium perfringens, Bacillus cereus), điều đúng là gì?",
    options: [
      { ja: "熱に非常に弱く、50℃ですぐに死滅する", vi: "Rất yếu với nhiệt, chết ngay ở 50°C" },
      { ja: "冷凍すれば完全に死滅する", vi: "Cấp đông là tiêu diệt hoàn toàn" },
      { ja: "熱に強い芽胞を形成するため、100℃で加熱調理しても死滅しない", vi: "Tạo bào tử chịu nhiệt cao, dù nấu ở 100°C cũng không bị tiêu diệt" },
      { ja: "加熱すら不要な安全な菌である", vi: "Là vi khuẩn an toàn, không cần gia nhiệt" },
    ],
    correctIndex: 2,
    explanationVi: "Các vi khuẩn này tạo bào tử (芽胞) chịu nhiệt rất cao — dù nấu ở 100°C vẫn KHÔNG bị tiêu diệt hoàn toàn, nên sau khi nấu vẫn cần quản lý nhiệt độ để ngăn bào tử phát triển trở lại.",
    sourceQuoteJa: "ボツリヌス菌、ウエルシュ菌、セレウス菌などの食中毒菌は、熱に強い芽胞を形成するため、加熱調理時に１００℃で加熱しても死滅しませんので、加熱調理後の食品であっても芽胞の増殖抑制のための温度管理が重要です。",
    sourcePage: 32,
  },
  {
    id: "hy-96",
    chapterId: "hy-ch5",
    questionJa: "「危険温度帯」として正しいものはどれか。",
    questionVi: "\"Vùng nhiệt độ nguy hiểm\" (危険温度帯) là khoảng nào?",
    options: [
      { ja: "10～60℃", vi: "10-60°C" },
      { ja: "0～5℃", vi: "0-5°C" },
      { ja: "80～100℃", vi: "80-100°C" },
      { ja: "－20～－10℃", vi: "-20 đến -10°C" },
    ],
    correctIndex: 0,
    explanationVi: "Vùng nhiệt độ nguy hiểm (10-60°C) là khoảng nhiệt độ thuận lợi cho vi khuẩn sinh sôi — thực phẩm sau khi nấu cần được làm nguội nhanh để giảm thiểu thời gian ở trong vùng này.",
    sourceQuoteJa: "加熱調理後に冷却する食品は、細菌の増殖が可能な危険温度帯（１０～６０℃）に置かれる時間を極力短くすることが重要です。",
    sourcePage: 32,
  },
  {
    id: "hy-97",
    chapterId: "hy-ch5",
    questionJa: "「大量調理施設衛生管理マニュアル」における加熱済み食品の冷却基準はどれか。",
    questionVi: "Theo \"Sổ tay quản lý vệ sinh cơ sở nấu ăn số lượng lớn\", tiêu chuẩn làm nguội thực phẩm đã nấu là gì?",
    options: [
      { ja: "24時間かけてゆっくり冷却すればよい", vi: "Cứ làm nguội từ từ trong 24 giờ là được" },
      { ja: "冷却基準は特にない", vi: "Không có tiêu chuẩn làm nguội nào" },
      { ja: "30分以内に20℃または1時間以内に10℃まで冷却", vi: "Làm nguội xuống 20°C trong 30 phút, hoặc xuống 10°C trong 1 tiếng" },
      { ja: "常温で自然に冷めるのを待つ", vi: "Chờ nguội tự nhiên ở nhiệt độ phòng" },
    ],
    correctIndex: 2,
    explanationVi: "Theo sổ tay này, thực phẩm nấu xong cần làm nguội xuống 20°C trong vòng 30 phút, hoặc xuống 10°C trong vòng 1 tiếng — nhằm giảm thời gian ở vùng nhiệt độ nguy hiểm.",
    sourceQuoteJa: "加熱済み食品の冷却方法について、「大量調理施設衛生管理マニュアル」では、３０分以内に２０℃または１時間以内に１０℃まで冷却することとしています。",
    sourcePage: 32,
  },
  {
    id: "hy-98",
    chapterId: "hy-ch5",
    questionJa: "加熱調理後に温蔵保管する食品の温度基準として正しいものはどれか。",
    questionVi: "Tiêu chuẩn nhiệt độ khi giữ ấm thực phẩm sau khi nấu là gì?",
    options: [
      { ja: "65℃以上を維持", vi: "Duy trì từ 65°C trở lên" },
      { ja: "20℃前後を維持", vi: "Duy trì khoảng 20°C" },
      { ja: "0℃以下を維持", vi: "Duy trì dưới 0°C" },
      { ja: "温度は自由でよい", vi: "Nhiệt độ tùy ý" },
    ],
    correctIndex: 0,
    explanationVi: "Thực phẩm giữ ấm sau khi nấu (như trong tủ hâm/Warmer) cần duy trì từ 65°C trở lên — vùng nhiệt độ mà vi khuẩn khó sinh sôi.",
    sourceQuoteJa: "加熱調理後に温蔵する食品は、速やかに保温庫（ウォーマー）などに移し、細菌が増殖しにくい温度帯（６５℃以上）を維持して保管します。",
    sourcePage: 33,
  },
  {
    id: "hy-99",
    chapterId: "hy-ch5",
    questionJa: "加熱前の食材と加熱後の食品の二次汚染を防ぐための対策はどれか。",
    questionVi: "Biện pháp phòng lây nhiễm chéo giữa nguyên liệu chưa nấu và thực phẩm đã nấu là gì?",
    options: [
      { ja: "同じ包丁を洗わずに使い回す", vi: "Dùng chung 1 con dao không rửa" },
      { ja: "特に対策は不要", vi: "Không cần biện pháp gì" },
      { ja: "それぞれ専用の包丁・まな板・食器類を使用する", vi: "Dùng riêng dao/thớt/bát đĩa cho từng loại" },
      { ja: "加熱後の食品だけ気をつければよい", vi: "Chỉ cần chú ý thực phẩm sau khi nấu" },
    ],
    correctIndex: 2,
    explanationVi: "Nguyên liệu chưa nấu và thực phẩm đã nấu phải dùng RIÊNG dao/thớt/dụng cụ/bát đĩa để ngăn lây nhiễm chéo.",
    sourceQuoteJa: "加熱前食材と加熱後の食品に使用する包丁、まな板などの器具や食器類は、それぞれ専用のものとして二次汚染の発生を防止します。",
    sourcePage: 33,
  },
  {
    id: "hy-100",
    chapterId: "hy-ch5",
    questionJa: "サラダなどに使用する野菜・果実の洗浄方法として正しいものはどれか。",
    questionVi: "Cách rửa rau/quả dùng cho món salad là gì?",
    options: [
      { ja: "十分な流水で洗浄し、必要に応じて塩素系消毒剤で消毒処理後、流水ですすぐ", vi: "Rửa kỹ bằng nước chảy, nếu cần thì khử trùng bằng chất khử trùng gốc clo rồi tráng lại bằng nước chảy" },
      { ja: "水を使わず布で拭くだけでよい", vi: "Chỉ cần lau bằng khăn, không cần dùng nước" },
      { ja: "洗浄は不要、そのまま使う", vi: "Không cần rửa, dùng luôn" },
      { ja: "熱湯で1時間煮沸する", vi: "Luộc trong nước sôi 1 tiếng" },
    ],
    correctIndex: 0,
    explanationVi: "Rau/quả dùng ăn sống cần rửa kỹ bằng nước chảy, và nếu cần thiết thì khử trùng bằng chất khử trùng gốc clo rồi tráng lại bằng nước chảy.",
    sourceQuoteJa: "サラダなどに使用する野菜・果実は、十分な流水で洗浄します。また、必要に応じて塩素系消毒剤などで消毒処理をしてから流水ですすぎ洗いします。",
    sourcePage: 33,
  },
  {
    id: "hy-101",
    chapterId: "hy-ch5",
    questionJa: "サラダなどを和える際に必ず使用すべきものはどれか。",
    questionVi: "Khi trộn salad, thứ bắt buộc phải sử dụng là gì?",
    options: [
      { ja: "素手のみ", vi: "Chỉ dùng tay không" },
      { ja: "特に何も使わなくてよい", vi: "Không cần dùng gì cả" },
      { ja: "使い捨て手袋", vi: "Găng tay dùng 1 lần" },
      { ja: "毛布", vi: "Chăn mền" },
    ],
    correctIndex: 2,
    explanationVi: "Khi trộn salad (和える), bắt buộc phải dùng găng tay dùng 1 lần (使い捨て手袋).",
    sourceQuoteJa: "和える際は、必ず使い捨て手袋を使用します。",
    sourcePage: 33,
  },
  {
    id: "hy-102",
    chapterId: "hy-ch5",
    questionJa: "盛り付け作業の際に重要な3つのことはどれか。",
    questionVi: "3 điều quan trọng cần lưu ý khi trình bày món ăn là gì?",
    options: [
      { ja: "有害微生物をつけないこと、食中毒菌を増やさないこと、異物の混入を起こさないこと", vi: "Không để nhiễm vi sinh vật có hại, không để vi khuẩn ngộ độc sinh sôi, không để lẫn dị vật" },
      { ja: "見た目、価格、速さ", vi: "Hình thức, giá cả, tốc độ" },
      { ja: "色、香り、量のみ", vi: "Chỉ màu sắc, mùi hương, số lượng" },
      { ja: "特に重要なことはない", vi: "Không có điều gì đặc biệt quan trọng" },
    ],
    correctIndex: 0,
    explanationVi: "3 điều quan trọng khi trình bày món: không để vi sinh vật có hại bám vào, không để vi khuẩn ngộ độc sinh sôi, và không để lẫn dị vật.",
    sourceQuoteJa: "盛り付け作業の際には、有害微生物を食品につけないこと、食中毒菌を増やさないこと、異物の混入を起こさないことが重要です。",
    sourcePage: 33,
  },
  {
    id: "hy-103",
    chapterId: "hy-ch5",
    questionJa: "盛り付け作業について正しいものはどれか。",
    questionVi: "Về công việc trình bày món ăn, điều đúng là gì?",
    options: [
      { ja: "素手でおこなわず、必ず使い捨て手袋と清潔な箸・トングなどの器具を使用する", vi: "Không dùng tay không, bắt buộc dùng găng tay dùng 1 lần và đũa/kẹp gắp sạch" },
      { ja: "素手のほうが衛生的なのでそれを推奨する", vi: "Tay không vệ sinh hơn nên được khuyến khích" },
      { ja: "手袋は不要、箸だけあればよい", vi: "Không cần găng tay, chỉ cần đũa" },
      { ja: "器具の清潔さは関係ない", vi: "Độ sạch của dụng cụ không quan trọng" },
    ],
    correctIndex: 0,
    explanationVi: "Trình bày món KHÔNG được dùng tay không — bắt buộc dùng găng tay dùng 1 lần cùng đũa/kẹp gắp sạch.",
    sourceQuoteJa: "盛り付けは素手でおこなわず、必ず使い捨て手袋と、清潔な箸、トングなどの器具を使用します。",
    sourcePage: 34,
  },
  {
    id: "hy-104",
    chapterId: "hy-ch5",
    questionJa: "盛り付けが完了し、お客様に提供する前にもう一度確認すべきことはどれか。",
    questionVi: "Sau khi trình bày xong, trước khi phục vụ khách cần kiểm tra lại điều gì?",
    options: [
      { ja: "不足品がないか、異物が入っていないか", vi: "Có thiếu món gì không, có lẫn dị vật không" },
      { ja: "お客様の年齢のみ", vi: "Chỉ độ tuổi của khách" },
      { ja: "店舗の売上のみ", vi: "Chỉ doanh thu cửa hàng" },
      { ja: "特に何も確認しなくてよい", vi: "Không cần kiểm tra gì cả" },
    ],
    correctIndex: 0,
    explanationVi: "Trước khi phục vụ, cần kiểm tra lại lần nữa: có thiếu món/thành phần nào không, và có lẫn dị vật vào món ăn hay đĩa không.",
    sourceQuoteJa: "盛り付けが完了し、お客様に提供する際には、もう一度、不足品がないか、異物が入っていないかなどを確認します。",
    sourcePage: 34,
  },
  {
    id: "hy-105",
    chapterId: "hy-ch5",
    questionJa: "調理済み食品を保管する際、必ずおこなうべきことはどれか。",
    questionVi: "Khi bảo quản thực phẩm đã nấu, việc bắt buộc phải làm là gì?",
    options: [
      { ja: "容器に入れず、そのまま常温に放置する", vi: "Để trần không hộp, để ở nhiệt độ phòng" },
      { ja: "未加熱原材料と同じ棚に重ねて置く", vi: "Xếp chồng lên cùng kệ với nguyên liệu chưa nấu" },
      { ja: "フタ付きの容器やラップをかけ、未加熱原材料との接触を防ぐ", vi: "Đậy nắp hộp hoặc bọc màng thực phẩm, tránh tiếp xúc với nguyên liệu chưa nấu" },
      { ja: "特に何もする必要はない", vi: "Không cần làm gì cả" },
    ],
    correctIndex: 2,
    explanationVi: "Thực phẩm đã nấu phải được đậy nắp hộp/bọc màng, tránh tiếp xúc với nguyên liệu chưa nấu, tránh ô nhiễm từ tay và dị vật.",
    sourceQuoteJa: "調理済み食品は必ずフタ付きの容器やラップをかけて保管し、未加熱原材料との接触や手指からの汚染、異物混入を防ぎます。",
    sourcePage: 34,
  },
  {
    id: "hy-106",
    chapterId: "hy-ch5",
    questionJa: "調理済み食品の保管温度の目安として正しい組み合わせはどれか。",
    questionVi: "Tổ hợp nhiệt độ bảo quản tham khảo cho thực phẩm đã nấu là gì?",
    options: [
      { ja: "温蔵65℃以上、常温15～25℃、冷蔵10℃以下、冷凍－15℃以下", vi: "Giữ ấm ≥65°C, thường 15-25°C, lạnh ≤10°C, đông ≤-15°C" },
      { ja: "すべて0℃で統一", vi: "Tất cả thống nhất ở 0°C" },
      { ja: "すべて常温でよい", vi: "Tất cả để nhiệt độ phòng là được" },
      { ja: "温度目安は存在しない", vi: "Không có tiêu chuẩn nhiệt độ tham khảo nào" },
    ],
    correctIndex: 0,
    explanationVi: "Tùy loại bảo quản: 温蔵品 (giữ ấm) ≥65°C, 常温品 (nhiệt độ thường) 15-25°C, 冷蔵品 (lạnh) ≤10°C, 冷凍品 (đông) ≤-15°C.",
    sourceQuoteJa: "温蔵品は温蔵庫内で６５℃以上、常温品は専用ケース１５～２５℃、冷蔵品は食品冷蔵庫（棚）で１０℃以下、冷凍品は食品冷凍庫内で－１５℃以下などが目安になります。",
    sourcePage: 34,
  },
  {
    id: "ck-1",
    chapterId: "ck-ch1",
    questionJa: "牛肉の部位の名称は、何によって定められているか。",
    questionVi: "Tên gọi các phần thịt bò được quy định bởi đâu?",
    options: [
      { ja: "社団法人日本食肉格付協会が定めた牛部分肉取引規格", vi: "Quy cách giao dịch thịt bò từng phần do Hiệp hội phân hạng thịt Nhật Bản quy định" },
      { ja: "農林水産省が定めた食鶏小売規格", vi: "Quy cách bán lẻ thịt gà do Bộ Nông Lâm Thủy sản quy định" },
      { ja: "各店舗が自由に決めてよい", vi: "Mỗi cửa hàng được tự do quyết định" },
      { ja: "法律上の定めはない", vi: "Không có quy định pháp luật nào" },
    ],
    correctIndex: 0,
    explanationVi: "Tên gọi các phần thịt bò được quy định theo 'Quy cách giao dịch thịt bò từng phần' do Hiệp hội phân hạng thịt Nhật Bản (xã đoàn pháp nhân) ban hành.",
    sourceQuoteJa: "牛肉の部位の名称は、社団法人日本食肉格付協会が定めた牛部分肉取引規格で定められています。",
    sourcePage: 1,
  },
  {
    id: "ck-2",
    chapterId: "ck-ch1",
    questionJa: "豚肉の特徴として正しいものはどれか。",
    questionVi: "Đặc điểm của thịt heo là gì?",
    options: [
      { ja: "牛肉より出荷月齢が高く、脂肪分が少ない", vi: "Tuổi xuất chuồng cao hơn thịt bò, ít mỡ" },
      { ja: "肉として出荷される月齢が牛肉より若く、ばら肉を除き肉質は比較的均一", vi: "Tuổi xuất chuồng để lấy thịt trẻ hơn thịt bò; trừ phần ba chỉ (bụng), chất thịt tương đối đồng đều" },
      { ja: "部位によって味に大きな差があり、臭みが強い", vi: "Vị khác nhau rất nhiều theo từng phần và có mùi hôi nặng" },
      { ja: "熟成期間が牛肉より長い", vi: "Thời gian ủ chín lâu hơn thịt bò" },
    ],
    correctIndex: 1,
    explanationVi: "Heo được xuất chuồng lấy thịt ở độ tuổi trẻ hơn bò; trừ phần ba chỉ (nhiều mỡ), chất thịt các phần khác tương đối đồng đều, không có mùi hôi dù chọn phần nào.",
    sourceQuoteJa: "豚肉は肉として出荷される月齢が牛肉より若く、脂肪分の多いばら肉を除き、肉質は比較的均一です。どの部位を選んでも臭みのないジューシーな味です。",
    sourcePage: 1,
  },
  {
    id: "ck-3",
    chapterId: "ck-ch1",
    questionJa: "鶏肉の部位の名称は、何によって定められているか。",
    questionVi: "Tên gọi các phần thịt gà được quy định bởi đâu?",
    options: [
      { ja: "社団法人日本食肉格付協会が定めた鶏部分肉取引規格", vi: "Quy cách giao dịch thịt gà từng phần do Hiệp hội phân hạng thịt Nhật Bản quy định" },
      { ja: "厚生労働省が定めた食品衛生法", vi: "Luật Vệ sinh Thực phẩm do Bộ Y tế Lao động Phúc lợi quy định" },
      { ja: "農林水産省が定めた食鶏小売規格", vi: "Quy cách bán lẻ gia cầm do Bộ Nông Lâm Thủy sản quy định" },
      { ja: "各都道府県が個別に定める", vi: "Từng tỉnh tự quy định riêng" },
    ],
    correctIndex: 2,
    explanationVi: "Tên gọi các phần thịt gà được quy định theo 'Quy cách bán lẻ gia cầm' do Bộ Nông Lâm Thủy sản ban hành.",
    sourceQuoteJa: "鶏肉の部位の名称は農林水産省が定めた食鶏小売規格により、定められています。",
    sourcePage: 1,
  },
  {
    id: "ck-4",
    chapterId: "ck-ch1",
    questionJa: "肉が死後硬直から食べごろになるまでの流れとして正しいものはどれか。",
    questionVi: "Quá trình thịt từ khi cứng xác đến khi ngon để ăn diễn ra như thế nào?",
    options: [
      { ja: "熟成→硬直→軟化を経て、即日食べごろになる", vi: "Ủ chín → cứng xác → mềm hóa, ngon để ăn ngay trong ngày" },
      { ja: "硬直したまま食べるのが最もおいしい", vi: "Ăn ngay lúc còn cứng xác là ngon nhất" },
      { ja: "冷凍すれば熟成過程は不要になる", vi: "Nếu cấp đông thì không cần quá trình ủ chín" },
      { ja: "硬直、熟成、軟化を経て、食べごろになるまで数日かかる", vi: "Trải qua cứng xác, ủ chín, mềm hóa; mất vài ngày mới ngon để ăn" },
    ],
    correctIndex: 3,
    explanationVi: "Thịt sau khi giết mổ trải qua cứng xác (死後硬直) chậm rãi, rồi đến ủ chín (熟成), mềm hóa (軟化), mất vài ngày mới đạt độ ngon.",
    sourceQuoteJa: "肉は死後硬直がゆるやかで、硬直、熟成、軟化を経て、食べごろになるまで数日かかります。",
    sourcePage: 1,
  },
  {
    id: "ck-5",
    chapterId: "ck-ch1",
    questionJa: "肉を加熱すると起こる変化として正しいものはどれか。",
    questionVi: "Khi làm nóng thịt, hiện tượng nào xảy ra?",
    options: [
      { ja: "タンパク質が変性し、縮んで肉汁が流れ出し硬くなる", vi: "Protein biến tính, co lại làm nước thịt chảy ra và thịt trở nên cứng" },
      { ja: "タンパク質が分解し、肉全体が柔らかくなる", vi: "Protein phân giải, toàn bộ thịt trở nên mềm" },
      { ja: "水分が増加し、肉が膨張する", vi: "Nước tăng lên, thịt phồng to" },
      { ja: "脂肪だけが変化し、タンパク質は変化しない", vi: "Chỉ có mỡ biến đổi, protein không thay đổi" },
    ],
    correctIndex: 0,
    explanationVi: "Khi gia nhiệt, protein (thành phần chính của thịt) biến tính, khiến thịt co lại, nước thịt chảy ra ngoài và thịt trở nên cứng; hiện tượng đông cứng nhiệt xảy ra ở khoảng 60°C.",
    sourceQuoteJa: "肉を加熱すると、肉の主成分であるタンパク質の変性※により、縮んで肉汁が流れ出し、硬くなります。※６０℃付近で熱凝固が起こり、肉が収縮して小さくなります。",
    sourcePage: 1,
  },
  {
    id: "ck-6",
    chapterId: "ck-ch1",
    questionJa: "肉が縮んで硬くなるのを防ぐ方法として本文に挙げられていないものはどれか。",
    questionVi: "Cách nào KHÔNG được nêu trong bài để tránh thịt co lại và cứng?",
    options: [
      { ja: "筋をあらかじめ切っておく", vi: "Cắt gân trước" },
      { ja: "強火で短時間だけ加熱する", vi: "Chỉ làm nóng thời gian ngắn bằng lửa lớn" },
      { ja: "肉たたきでたたく", vi: "Dùng chày đập thịt" },
      { ja: "しょうが汁など肉を柔らかくする働きがあるものにつける", vi: "Ngâm với nước gừng hoặc thứ có tác dụng làm mềm thịt" },
    ],
    correctIndex: 1,
    explanationVi: "Bài chỉ nêu 3 cách: cắt gân trước, đập bằng chày, ngâm với nước gừng... — không đề cập việc chỉ làm nóng nhanh bằng lửa lớn.",
    sourceQuoteJa: "肉が縮んで硬くなるのを防ぐためには、筋をあらかじめ切っておく、肉たたきでたたく、しょうが汁など肉を柔らかくする働きがあるものにつけておくなどの方法があります。",
    sourcePage: 1,
  },
  {
    id: "ck-7",
    chapterId: "ck-ch1",
    questionJa: "すね肉のような筋の多い部位を長時間加熱するとどうなるか。",
    questionVi: "Khi làm nóng lâu phần thịt nhiều gân như bắp chân, điều gì xảy ra?",
    options: [
      { ja: "タンパク質が凝固してさらに硬くなる", vi: "Protein đông cứng, thịt càng cứng hơn" },
      { ja: "水分がすべて失われてパサパサになる", vi: "Mất hết nước, thịt trở nên khô xác" },
      { ja: "コラーゲンが分解されて柔らかくなる", vi: "Collagen bị phân giải, thịt trở nên mềm" },
      { ja: "変化はほとんど見られない", vi: "Hầu như không có thay đổi gì" },
    ],
    correctIndex: 2,
    explanationVi: "Phần nhiều gân như bắp chân, khi gia nhiệt lâu, collagen (một loại protein) bị phân giải và thịt trở nên mềm.",
    sourceQuoteJa: "すね肉のような筋の多いものは、長時間加熱すると、タンパク質の一種であるコラーゲンが分解されて柔らかくなります。",
    sourcePage: 1,
  },
  {
    id: "ck-8",
    chapterId: "ck-ch1",
    questionJa: "肉のうまみを逃さないための一般的な加熱方法はどれか。",
    questionVi: "Cách làm nóng phổ biến để không làm mất vị ngon của thịt là gì?",
    options: [
      { ja: "最初から最後まで弱火でじっくり加熱する", vi: "Làm nóng bằng lửa nhỏ từ đầu đến cuối" },
      { ja: "常に強火のまま最後まで加熱する", vi: "Luôn dùng lửa lớn cho đến khi nấu xong" },
      { ja: "加熱時間と温度は特に重要ではない", vi: "Thời gian và nhiệt độ gia nhiệt không quan trọng" },
      { ja: "はじめに強火～中火で表面を凝固させ、その後弱火で中まで火を通す", vi: "Đầu tiên dùng lửa lớn đến vừa để làm đông bề mặt, sau đó dùng lửa nhỏ làm chín đến bên trong" },
    ],
    correctIndex: 3,
    explanationVi: "Để giữ vị ngon của thịt, thường đầu tiên dùng lửa lớn đến vừa làm đông bề mặt, giữ vị ngon bên trong, sau đó dùng lửa nhỏ làm chín từ từ đến giữa miếng thịt.",
    sourceQuoteJa: "肉のうまみを逃さないためには、加熱時間と温度の調節が重要です。一般的に、はじめに強火～中火で加熱し、表面を凝固させ、その後、弱火で中まで火を通します。",
    sourcePage: 1,
  },
  {
    id: "ck-9",
    chapterId: "ck-ch1",
    questionJa: "結着肉（成形肉）を調理する際に特に注意すべき点はどれか。",
    questionVi: "Khi chế biến thịt kết dính (thịt định hình), cần đặc biệt lưu ý điều gì?",
    options: [
      { ja: "細菌性食中毒を防止するために肉の内部までしっかり火を通す", vi: "Phải làm chín kỹ đến tận bên trong để phòng ngừa ngộ độc thực phẩm do vi khuẩn" },
      { ja: "表面だけ火を通せばよい", vi: "Chỉ cần làm chín bề mặt là đủ" },
      { ja: "冷凍のまま提供してもよい", vi: "Có thể phục vụ ngay khi còn đông lạnh" },
      { ja: "強火のみで短時間調理する", vi: "Chỉ nấu thời gian ngắn bằng lửa lớn" },
    ],
    correctIndex: 0,
    explanationVi: "Thịt kết dính/định hình có vi khuẩn có thể lẫn vào bên trong khi chế biến, nên phải làm chín kỹ đến tận bên trong để phòng ngộ độc thực phẩm do vi khuẩn.",
    sourceQuoteJa: "結着肉などの成形肉は、細菌性食中毒を防止するために肉の内部までしっかり火を通します。",
    sourcePage: 1,
  },
  {
    id: "ck-10",
    chapterId: "ck-ch1",
    questionJa: "新鮮な牛肉の見分け方として正しいものはどれか。",
    questionVi: "Cách nhận biết thịt bò tươi là gì?",
    options: [
      { ja: "艶のある淡いピンク色で脂身が白い", vi: "Màu hồng nhạt bóng, mỡ trắng" },
      { ja: "鮮やかな赤色で赤身と脂身の境目がはっきりしている", vi: "Màu đỏ tươi, ranh giới giữa phần nạc và mỡ rõ ràng" },
      { ja: "透明感のあるピンク色で皮の毛穴に凹凸がある", vi: "Màu hồng trong, lỗ chân lông trên da có gồ ghề" },
      { ja: "全体が白っぽく、境目がぼやけている", vi: "Toàn bộ hơi trắng, ranh giới mờ nhạt" },
    ],
    correctIndex: 1,
    explanationVi: "Thịt bò tươi có màu đỏ tươi, ranh giới giữa phần nạc (đỏ) và phần mỡ rõ ràng.",
    sourceQuoteJa: "牛肉：鮮やかな赤色で赤身と脂身の境目がはっきりしているものが良い。",
    sourcePage: 2,
  },
  {
    id: "ck-11",
    chapterId: "ck-ch1",
    questionJa: "豚肉と鶏肉の鮮度の見分け方の組み合わせとして正しいものはどれか。",
    questionVi: "Tổ hợp cách nhận biết độ tươi của thịt heo và thịt gà nào đúng?",
    options: [
      { ja: "豚肉：鮮やかな赤色／鶏肉：黒っぽい色", vi: "Heo: màu đỏ tươi / Gà: màu hơi đen" },
      { ja: "豚肉も鶏肉も牛肉と同じ見分け方でよい", vi: "Heo và gà dùng chung cách nhận biết như bò" },
      { ja: "豚肉：艶のある淡いピンク色で脂身は白い／鶏肉：透明感のあるピンク色で皮の毛穴に凹凸がある", vi: "Heo: hồng nhạt bóng, mỡ trắng / Gà: hồng trong, lỗ chân lông trên da gồ ghề" },
      { ja: "豚肉：白っぽく乾燥している／鶏肉：脂身が黄色い", vi: "Heo: hơi trắng và khô / Gà: mỡ vàng" },
    ],
    correctIndex: 2,
    explanationVi: "Thịt heo tươi: màu hồng nhạt bóng, phần mỡ trắng. Thịt gà tươi: màu hồng trong, lỗ chân lông trên da có độ gồ ghề.",
    sourceQuoteJa: "豚肉：艶のある淡いピンク色で脂身は白いものが良い。鶏肉：透明感のあるピンク色で皮の毛穴に凹凸があるものが良い。",
    sourcePage: 2,
  },
  {
    id: "ck-12",
    chapterId: "ck-ch1",
    questionJa: "すべての肉類に共通した鮮度の見分け方として本文に挙げられていないものはどれか。",
    questionVi: "Cách nhận biết độ tươi chung cho MỌI loại thịt nào KHÔNG được nêu trong bài?",
    options: [
      { ja: "いやなにおいがしない", vi: "Không có mùi khó chịu" },
      { ja: "ドリップ（液汁）が出ていない", vi: "Không rỉ dịch (drip)" },
      { ja: "弾力がある", vi: "Có độ đàn hồi" },
      { ja: "色が真っ白である", vi: "Màu trắng tinh" },
    ],
    correctIndex: 3,
    explanationVi: "4 điểm chung cho mọi loại thịt là: không mùi khó chịu, không rỉ dịch, có độ đàn hồi, không nhớt — không có tiêu chí 'màu trắng tinh'.",
    sourceQuoteJa: "以上のほか、すべての肉類に共通した鮮度の見分け方は以下のとおりです。・いやなにおいがしない。・ドリップ（液汁）が出ていない。・弾力がある。・ぬるぬるしていない。",
    sourcePage: 2,
  },
  {
    id: "ck-13",
    chapterId: "ck-ch1",
    questionJa: "冷凍した食肉を解凍するときの正しい方法はどれか。",
    questionVi: "Cách rã đông thịt đã đông lạnh đúng là gì?",
    options: [
      { ja: "下処理用の容器に移し、食肉・魚介類などの保管区分の冷蔵庫内で緩慢解凍する", vi: "Chuyển sang hộp sơ chế, rã đông chậm trong ngăn tủ lạnh dành cho thịt/hải sản" },
      { ja: "常温で急速に解凍する", vi: "Rã đông nhanh ở nhiệt độ phòng" },
      { ja: "電子レンジで一気に加熱解凍する", vi: "Rã đông ngay bằng lò vi sóng" },
      { ja: "水道水に直接浸けて解凍する", vi: "Ngâm trực tiếp dưới vòi nước để rã đông" },
    ],
    correctIndex: 0,
    explanationVi: "Khi rã đông thịt đông lạnh, phải chuyển sang hộp sơ chế và rã đông chậm trong ngăn tủ lạnh dành riêng cho thịt/hải sản; dùng khay hứng để dịch chảy ra không làm ô nhiễm thực phẩm/dụng cụ khác.",
    sourceQuoteJa: "冷凍した食肉を使用するときは、下処理用の容器に移し、食肉・魚介類などの保管区分の冷蔵庫内で緩慢解凍する。※解凍する際、ドリップが下に落ちるなどしてほかの食材や容器を汚染しないよう、トレイで受けるなどの工夫をすること。",
    sourcePage: 2,
  },
  {
    id: "ck-14",
    chapterId: "ck-ch1",
    questionJa: "「魚介類」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa 'hải sản (魚介類)' đúng là gì?",
    options: [
      { ja: "魚のみを指す言葉", vi: "Từ chỉ riêng cá" },
      { ja: "魚、貝類、エビ、カニを中心とした食用水産生物の総称", vi: "Tên gọi chung cho sinh vật thủy sản ăn được, chủ yếu là cá, động vật có vỏ, tôm, cua" },
      { ja: "海藻類のみを指す言葉", vi: "Từ chỉ riêng rong biển" },
      { ja: "養殖されたものだけを指す", vi: "Chỉ chỉ những loại được nuôi trồng" },
    ],
    correctIndex: 1,
    explanationVi: "魚介類 (hải sản) là tên gọi chung cho các sinh vật thủy sản ăn được, chủ yếu là cá, động vật có vỏ (nghêu sò...), tôm, cua.",
    sourceQuoteJa: "魚介類とは、魚、貝類、エビ、カニを中心とした食用水産生物の総称です。",
    sourcePage: 2,
  },
  {
    id: "ck-15",
    chapterId: "ck-ch1",
    questionJa: "魚介類の「旬」とは何を指すか。",
    questionVi: "'旬 (shun)' của hải sản chỉ điều gì?",
    options: [
      { ja: "水揚げされた直後の状態", vi: "Trạng thái ngay sau khi đánh bắt" },
      { ja: "冷凍保存に適した時期", vi: "Thời kỳ thích hợp để cấp đông bảo quản" },
      { ja: "脂肪の多い「脂ののった」時期で、一番おいしく食べられる時期", vi: "Thời kỳ nhiều mỡ, 'béo ngậy', ăn ngon nhất" },
      { ja: "価格が最も安くなる時期", vi: "Thời kỳ giá rẻ nhất" },
    ],
    correctIndex: 2,
    explanationVi: "'旬' của hải sản là thời kỳ nhiều mỡ ('béo ngậy'), là thời điểm ăn ngon nhất của loại hải sản đó.",
    sourceQuoteJa: "魚介類には旬があります。魚介類の旬とは、脂肪の多い「脂ののった」時期であり、その魚介類が一番おいしく食べられる時期をさします。",
    sourcePage: 2,
  },
  {
    id: "ck-16",
    chapterId: "ck-ch1",
    questionJa: "魚を焼く・煮る・揚げるときの基本的な加熱方法はどれか。",
    questionVi: "Cách gia nhiệt cơ bản khi nướng/kho/chiên cá là gì?",
    options: [
      { ja: "終始弱火でじっくり加熱する", vi: "Dùng lửa nhỏ từ đầu đến cuối" },
      { ja: "常に強火のまま加熱し続ける", vi: "Luôn dùng lửa lớn cho đến khi xong" },
      { ja: "加熱の順序に決まりはない", vi: "Không có thứ tự gia nhiệt cố định nào" },
      { ja: "最初に強火か中火で表面を焼き、うまみを逃がさないようにしてから弱火で中まで加熱する", vi: "Đầu tiên dùng lửa lớn hoặc vừa để nướng bề mặt, giữ vị ngon, sau đó dùng lửa nhỏ làm chín đến giữa" },
    ],
    correctIndex: 3,
    explanationVi: "Cá khi nướng/kho/chiên tận dụng tính chất protein đông lại khi gặp nhiệt: đầu tiên lửa lớn/vừa để nướng bề mặt giữ vị ngon, sau đó lửa nhỏ làm chín từ từ đến giữa.",
    sourceQuoteJa: "魚は、焼く、煮る、揚げるなどの調理をするとき、タンパク質が熱で固まる性質を利用し、最初に強火か中火で表面を焼き、うまみを逃がさないようにしてから、弱火で中までじっくり加熱します。",
    sourcePage: 2,
  },
  {
    id: "ck-17",
    chapterId: "ck-ch1",
    questionJa: "切り身魚のくさみを取るための調理法として正しいものはどれか。",
    questionVi: "Cách chế biến để khử mùi tanh của cá phi lê đúng là gì?",
    options: [
      { ja: "流水でよく洗い、ねぎやしょうがなどの香味野菜や酒、みそ、しょうゆなどの調味料を用いて加熱調理する", vi: "Rửa kỹ dưới vòi nước, dùng rau thơm như hành gừng cùng rượu, miso, xì dầu để chế biến" },
      { ja: "砂糖だけを大量に使う", vi: "Chỉ dùng nhiều đường" },
      { ja: "冷水に長時間漬けておくだけでよい", vi: "Chỉ cần ngâm nước lạnh thời gian dài" },
      { ja: "強い香水をかける", vi: "Xịt nước hoa mạnh lên" },
    ],
    correctIndex: 0,
    explanationVi: "Để khử mùi tanh của cá, rửa kỹ dưới vòi nước; với cá phi lê thì dùng rau thơm (hành, gừng) cùng gia vị như rượu, miso, xì dầu khi chế biến.",
    sourceQuoteJa: "魚のくさみを取るためには、流水でよく洗い、切り身魚の場合は、ねぎやしょうがなどの香味野菜や酒、みそ、しょうゆなどの調味料を用いて加熱調理します。",
    sourcePage: 2,
  },
  {
    id: "ck-18",
    chapterId: "ck-ch1",
    questionJa: "新鮮な魚の見分け方として本文に挙げられていないものはどれか。",
    questionVi: "Cách nhận biết cá tươi nào KHÔNG được nêu trong bài?",
    options: [
      { ja: "目が澄んでいる、落ち込んでいないもの", vi: "Mắt trong, không lõm" },
      { ja: "うろこが取れかけているもの", vi: "Vảy đang bong tróc" },
      { ja: "えらが鮮やかな赤色であるもの", vi: "Mang có màu đỏ tươi" },
      { ja: "体はかたく、色つやのあるもの", vi: "Thân chắc, có màu bóng" },
    ],
    correctIndex: 1,
    explanationVi: "Bài nêu các dấu hiệu cá tươi: mắt trong không lõm, mang đỏ tươi, bụng đàn hồi, thân chắc có màu bóng, không tanh/không mùi amoniac, vảy dính chắc đẹp — 'vảy đang bong tróc' là dấu hiệu KHÔNG tươi, ngược lại với bài.",
    sourceQuoteJa: "目が澄んでいる、落ち込んでいないもの。えらが鮮やかな赤色であるもの。腹の弾力があるもの。体はかたく、色つやのあるもの。生臭さ、アンモニア臭のしないもの。うろこがきれいについているもの。",
    sourcePage: 2,
  },
  {
    id: "ck-19",
    chapterId: "ck-ch1",
    questionJa: "魚介類の中でもっとも早く傷むのはどれか。",
    questionVi: "Trong các loại hải sản, loại nào hư hỏng NHANH nhất?",
    options: [
      { ja: "大きな魚", vi: "Cá lớn" },
      { ja: "干物", vi: "Đồ khô" },
      { ja: "貝類", vi: "Động vật có vỏ (nghêu, sò...)" },
      { ja: "冷凍された魚", vi: "Cá đã cấp đông" },
    ],
    correctIndex: 2,
    explanationVi: "Hải sản hư hỏng nhanh hơn thịt, cá càng nhỏ càng nhanh hư; trong đó động vật có vỏ (nghêu, sò...) là hư hỏng nhanh nhất.",
    sourceQuoteJa: "魚介類は肉類に比べ劣化が早く、小さな魚ほど早く傷みます。もっとも早く傷むのは貝類です。",
    sourcePage: 3,
  },
  {
    id: "ck-20",
    chapterId: "ck-ch1",
    questionJa: "「三枚おろし」と「五枚おろし」の違いとして正しいものはどれか。",
    questionVi: "Sự khác biệt giữa 'phi lê 3 phần' và 'phi lê 5 phần' đúng là gì?",
    options: [
      { ja: "三枚おろしと五枚おろしは同じ意味である", vi: "Hai cách này có nghĩa giống nhau" },
      { ja: "五枚おろしのほうが手順が少ない", vi: "Phi lê 5 phần có ít công đoạn hơn" },
      { ja: "三枚おろしはフグ専用の技法である", vi: "Phi lê 3 phần là kỹ thuật chuyên dùng cho cá nóc" },
      { ja: "三枚おろしは頭を落とし骨と身を左右に分け３分割、五枚おろしは骨に沿って身を左右上下５分割する（ヒラメなど）", vi: "Phi lê 3 phần: bỏ đầu, tách xương và thịt hai bên thành 3 phần; phi lê 5 phần: tách thịt theo xương thành 5 phần trên dưới trái phải (dùng cho cá bơn...)" },
    ],
    correctIndex: 3,
    explanationVi: "Phi lê 3 phần: bỏ đầu cá, tách xương và thịt sang hai bên thành 3 phần. Phi lê 5 phần: bỏ đầu, tách thịt dọc theo xương thành 5 phần trên-dưới-trái-phải, dùng cho cá dẹt như cá bơn (ヒラメ).",
    sourceQuoteJa: "三枚おろし：頭を落とし、骨と身を左右に分け３分割します。五枚おろし：頭を落とし、骨に添って身を左右上下５分割します。（ヒラメなど）",
    sourcePage: 3,
  },
  {
    id: "ck-21",
    chapterId: "ck-ch1",
    questionJa: "フグを調理する際の注意点として正しいものはどれか。",
    questionVi: "Lưu ý khi chế biến cá nóc (フグ) đúng là gì?",
    options: [
      { ja: "都道府県知事などが認めた専門のフグ処理者が処理する必要がある（毒をもっているため）", vi: "Vì có độc, phải do người chế biến cá nóc chuyên môn được thống đốc tỉnh công nhận thực hiện" },
      { ja: "誰でも自由に調理してよい", vi: "Ai cũng được tự do chế biến" },
      { ja: "加熱すれば毒は消えるので誰でも扱える", vi: "Chỉ cần nấu chín là hết độc, ai xử lý cũng được" },
      { ja: "冷凍すれば毒は消える", vi: "Cấp đông thì hết độc" },
    ],
    correctIndex: 0,
    explanationVi: "Cá nóc có độc, nên bắt buộc phải do người chế biến cá nóc chuyên môn được thống đốc tỉnh (hoặc cơ quan tương đương) công nhận xử lý.",
    sourceQuoteJa: "※ フグは毒をもっているので、都道府県知事などが認めた専門のフグ処理者が処理する必要があります。",
    sourcePage: 3,
  },
  {
    id: "ck-22",
    chapterId: "ck-ch1",
    questionJa: "一尾魚の盛り付け方として正しいものはどれか。",
    questionVi: "Cách bày cá nguyên con lên đĩa đúng là gì?",
    options: [
      { ja: "頭を右、腹を上にして盛り付ける", vi: "Đầu bên phải, bụng hướng lên trên" },
      { ja: "頭を左、腹を下にして盛り付け、和食の場合、付け合わせは手前に置く", vi: "Đầu bên trái, bụng hướng xuống dưới; nếu là món Nhật thì đồ ăn kèm đặt ở phía trước" },
      { ja: "頭は必ず外して盛り付ける", vi: "Luôn phải bỏ đầu cá khi bày đĩa" },
      { ja: "盛り付け方に決まりはない", vi: "Không có quy tắc bày đĩa nào cả" },
    ],
    correctIndex: 1,
    explanationVi: "Cá nguyên con: đầu bên trái, bụng hướng xuống; nếu là món ăn kiểu Nhật thì đồ ăn kèm đặt ở phía trước (gần thực khách).",
    sourceQuoteJa: "一尾魚：頭を左、腹を下に盛り付けます。付け合わせは、和食の場合は手前に置きます。",
    sourcePage: 3,
  },
  {
    id: "ck-23",
    chapterId: "ck-ch1",
    questionJa: "現在、日本の市場で流通する野菜の数はおよそどれくらいと言われているか。",
    questionVi: "Số loại rau lưu thông trên thị trường Nhật Bản hiện nay vào khoảng bao nhiêu?",
    options: [
      { ja: "約５０種類", vi: "Khoảng 50 loại" },
      { ja: "約５００種類", vi: "Khoảng 500 loại" },
      { ja: "約１５０種類", vi: "Khoảng 150 loại" },
      { ja: "約２０種類", vi: "Khoảng 20 loại" },
    ],
    correctIndex: 2,
    explanationVi: "Số loại rau lưu thông trên thị trường Nhật Bản hiện nay vào khoảng 150 loại, đa dạng gồm nhóm củ, đậu, rễ, thân, lá, quả.",
    sourceQuoteJa: "現在、日本の市場で流通する野菜の数は１５０種類ほどと言われています。その種類はイモ類、豆類、根菜類、茎菜類、葉菜類、果菜類など多様です。",
    sourcePage: 3,
  },
  {
    id: "ck-24",
    chapterId: "ck-ch1",
    questionJa: "野菜類の一般的な成分について正しいものはどれか。",
    questionVi: "Thành phần chung của rau đúng là gì?",
    options: [
      { ja: "タンパク質が主成分で、水分は少ない", vi: "Protein là thành phần chính, ít nước" },
      { ja: "脂質が非常に多く含まれる", vi: "Chứa rất nhiều chất béo" },
      { ja: "炭水化物のみで構成される", vi: "Chỉ cấu tạo từ carbohydrate" },
      { ja: "水分が８０～９０％前後と多く、タンパク質・脂質・炭水化物は少ない", vi: "Nước chiếm khoảng 80-90%, ít protein/chất béo/carbohydrate" },
    ],
    correctIndex: 3,
    explanationVi: "Rau nói chung chứa 80-90% là nước, ít protein/chất béo/carbohydrate; thành phần quan trọng gồm khoáng chất (kali, phốt pho, canxi, sắt), vitamin A (caroten), vitamin C, chất xơ.",
    sourceQuoteJa: "野菜類は一般的に水分が８０～９０％前後と多く、タンパク質、脂質、炭水化物が少ないです。野菜の重要な成分はカリウム、リン、カルシウム、鉄などの無機質、ビタミンＡ（カロテン）、ビタミンＣ、食物繊維です。",
    sourcePage: 3,
  },
  {
    id: "ck-25",
    chapterId: "ck-ch1",
    questionJa: "野菜を加熱調理することの利点として本文が挙げているものはどれか。",
    questionVi: "Lợi ích của việc nấu chín rau được nêu trong bài là gì?",
    options: [
      { ja: "柔らかくなってかさも減り、生で食べるより多く食べられる", vi: "Rau mềm ra, thể tích giảm, ăn được nhiều hơn so với ăn sống" },
      { ja: "ビタミンの損失を完全になくせる", vi: "Loại bỏ hoàn toàn tổn thất vitamin" },
      { ja: "栄養価が生のときより必ず高くなる", vi: "Giá trị dinh dưỡng luôn cao hơn khi ăn sống" },
      { ja: "調理時間が長いほど良い", vi: "Thời gian nấu càng lâu càng tốt" },
    ],
    correctIndex: 0,
    explanationVi: "Ăn sống thì tổn thất vitamin ít nhưng rau cồng kềnh nên không ăn được nhiều; khi nấu chín (luộc/xào/hấp) rau mềm ra, thể tích giảm nên ăn được nhiều hơn.",
    sourceQuoteJa: "野菜は、生で食べるとビタミンなどの損失が少ないが、かさばるため、一度に多くは食べられません。ゆでる、炒める、蒸すなど加熱調理すると、柔らかくなってかさも減り、多く食べることができます。",
    sourcePage: 3,
  },
  {
    id: "ck-26",
    chapterId: "ck-ch1",
    questionJa: "ほうれん草など青菜をゆでるときの正しい方法はどれか。",
    questionVi: "Cách luộc rau xanh như rau chân vịt đúng là gì?",
    options: [
      { ja: "少量の水で蓋をしてじっくりゆでる", vi: "Luộc kỹ với ít nước và đậy vung" },
      { ja: "たっぷりのお湯で蓋をせずにさっとゆで、水にとって冷ます", vi: "Luộc nhanh trong nhiều nước, không đậy vung, sau đó vớt vào nước lạnh để nguội" },
      { ja: "冷水からゆっくり加熱する", vi: "Đun từ nước lạnh, tăng nhiệt từ từ" },
      { ja: "電子レンジのみで加熱する", vi: "Chỉ dùng lò vi sóng để làm chín" },
    ],
    correctIndex: 1,
    explanationVi: "Chất diệp lục (クロロフィル) tạo màu xanh dễ bị phá hủy bởi nhiệt, nên phải luộc nhanh trong nhiều nước sôi, không đậy vung, rồi vớt ngay vào nước lạnh để giữ màu xanh.",
    sourceQuoteJa: "ほうれん草など青菜をゆでるときは、緑色の色素（クロロフィル）が熱に弱いので、たっぷりのお湯で蓋をせずにさっとゆで、水にとって冷まします。",
    sourcePage: 3,
  },
  {
    id: "ck-27",
    chapterId: "ck-ch1",
    questionJa: "ごぼうやれんこんを切った直後の正しい処理はどれか。",
    questionVi: "Xử lý đúng ngay sau khi cắt ngưu bàng (gobo) hoặc củ sen là gì?",
    options: [
      { ja: "そのまま常温に放置する", vi: "Để nguyên ở nhiệt độ phòng" },
      { ja: "すぐに塩をふりかける", vi: "Rắc muối lên ngay lập tức" },
      { ja: "すぐに水につけて切り口の褐変を防ぐ", vi: "Ngâm ngay vào nước để tránh vết cắt bị thâm/ngả nâu" },
      { ja: "冷凍庫に入れる", vi: "Cho ngay vào tủ đông" },
    ],
    correctIndex: 2,
    explanationVi: "Ngưu bàng, củ sen cắt xong nếu để không sẽ bị thâm (褐変); ngâm ngay vào nước sẽ ngăn được hiện tượng này.",
    sourceQuoteJa: "ごぼうやれんこんなどは切ったあと、すぐに水につけると切り口の褐変を防ぐことができます。",
    sourcePage: 4,
  },
  {
    id: "ck-28",
    chapterId: "ck-ch1",
    questionJa: "生野菜に塩をふってしばらく置くとどうなるか。",
    questionVi: "Rắc muối lên rau sống và để một lúc thì điều gì xảy ra?",
    options: [
      { ja: "水分が増えてパリパリになる", vi: "Nước tăng lên và rau giòn hơn" },
      { ja: "色が変わらない", vi: "Màu sắc không đổi" },
      { ja: "栄養価が上がる", vi: "Giá trị dinh dưỡng tăng lên" },
      { ja: "水分が出てしんなりする", vi: "Nước rỉ ra và rau mềm xuống" },
    ],
    correctIndex: 3,
    explanationVi: "Rắc muối lên rau sống và để một lúc, nước trong rau sẽ rỉ ra làm rau mềm xuống (shinnari).",
    sourceQuoteJa: "生野菜は塩をふってしばらく置いておくと、水分がでてしんなりします。",
    sourcePage: 4,
  },
  {
    id: "ck-29",
    chapterId: "ck-ch1",
    questionJa: "野菜の鮮度の見分け方として正しい組み合わせはどれか。",
    questionVi: "Tổ hợp cách nhận biết độ tươi của rau nào đúng?",
    options: [
      { ja: "トマト：皮に張りがあり光沢が良く、ヘタが元気なもの／きゅうり：張りとつやがあり、いぼがチクチクするほど鮮度が高い", vi: "Cà chua: vỏ căng bóng, cuống còn tươi / Dưa leo: căng bóng, gai càng nhọn càng tươi" },
      { ja: "トマト：皮がしなびて柔らかいもの／きゅうり：いぼが取れているもの", vi: "Cà chua: vỏ nhăn mềm / Dưa leo: gai đã mòn" },
      { ja: "たまねぎ：芽が出ているものが新鮮／にんじん：色が薄いものが良い", vi: "Hành tây: đã nảy mầm là tươi / Cà rốt: màu nhạt là tốt" },
      { ja: "キャベツ：軽いものが新鮮／だいこん：葉がしおれているものが良い", vi: "Bắp cải: càng nhẹ càng tươi / Củ cải: lá héo là tốt" },
    ],
    correctIndex: 0,
    explanationVi: "Cà chua tươi: vỏ căng bóng, cuống (hetá) còn tươi. Dưa leo tươi: căng bóng, gai càng nhọn ráp càng tươi. (Hành tây nảy mầm là dấu hiệu giảm độ tươi/vị; bắp cải nặng tay, ngoại lá tươi mọng mới tốt.)",
    sourceQuoteJa: "トマト：皮に張りがあり、光沢の良いもの。ヘタが元気なもの。きゅうり：張りとつやのあるものが新鮮。いぼがチクチクするものほど鮮度が高い。",
    sourcePage: 4,
  },
  {
    id: "ck-30",
    chapterId: "ck-ch1",
    questionJa: "野菜の保存方法として正しいものはどれか。",
    questionVi: "Cách bảo quản rau đúng là gì?",
    options: [
      { ja: "すべての野菜は必ず常温で保存する", vi: "Mọi loại rau đều phải bảo quản ở nhiệt độ phòng" },
      { ja: "ねぎ・たまねぎ・にんにくなど冷暗所常温保存が適するもの以外はラップなどに包み冷蔵庫で保存し、根や葉は切り離して保存する", vi: "Trừ hành lá/hành tây/tỏi thích hợp bảo quản nơi mát nhiệt độ thường, các loại khác bọc màng và để tủ lạnh; cắt bỏ rễ và lá để bảo quản riêng" },
      { ja: "根や葉をつけたまま保存すると鮮度が保たれる", vi: "Để nguyên rễ và lá khi bảo quản sẽ giữ được độ tươi" },
      { ja: "水分の蒸散はとくに気にしなくてよい", vi: "Không cần để ý đến sự bốc hơi nước" },
    ],
    correctIndex: 1,
    explanationVi: "Trừ những loại thích hợp bảo quản nơi mát ở nhiệt độ thường (hành lá, hành tây, tỏi...), các loại rau khác nên bọc màng thực phẩm để tránh bốc hơi nước rồi bảo quản trong tủ lạnh; rễ và lá nếu để nguyên sẽ làm giảm chất lượng nên phải cắt tách riêng.",
    sourceQuoteJa: "ねぎ、たまねぎ、にんにくなど冷暗所での常温保存が適するものを除き、水分の蒸散を抑えるため、ラップなどに包み、冷蔵庫で保存します。また、根や葉をつけておくと身の質が落ちるため、切り離して保存します。",
    sourcePage: 4,
  },
  {
    id: "ck-31",
    chapterId: "ck-ch1",
    questionJa: "和牛に含まれる４品種として正しいものはどれか。",
    questionVi: "4 giống bò được xếp vào 'wagyu' đúng là gì?",
    options: [
      { ja: "ホルスタイン種・ジャージー種・ブラウンスイス種・アンガス種", vi: "Holstein, Jersey, Brown Swiss, Angus" },
      { ja: "黒毛和種のみが和牛と認められる", vi: "Chỉ có giống lông đen mới được công nhận là wagyu" },
      { ja: "黒毛和種・褐毛和種・無角和種・日本短角種", vi: "Giống lông đen, giống lông nâu, giống không sừng, giống sừng ngắn Nhật Bản" },
      { ja: "輸入牛と交雑した牛はすべて和牛と呼ばれる", vi: "Mọi con bò lai với bò nhập khẩu đều gọi là wagyu" },
    ],
    correctIndex: 2,
    explanationVi: "'Wagyu' chỉ 4 giống: giống lông đen (黒毛和種), giống lông nâu (褐毛和種), giống không sừng (無角和種), giống sừng ngắn Nhật Bản (日本短角種) và các giống lai của chúng.",
    sourceQuoteJa: "和牛は、黒毛和種・褐毛和種・無角和種・日本短角種の４品種とそれらの交雑種のことを指します。",
    sourcePage: 4,
  },
  {
    id: "ck-32",
    chapterId: "ck-ch1",
    questionJa: "黒毛和牛の特徴として正しいものはどれか。",
    questionVi: "Đặc điểm của giống bò wagyu lông đen (黒毛和牛) đúng là gì?",
    options: [
      { ja: "和牛全体の５％程度を占め、脂肪交雑には劣る", vi: "Chiếm khoảng 5% tổng đàn wagyu, kém về vân mỡ" },
      { ja: "主産県は岩手県である", vi: "Tỉnh sản xuất chính là Iwate" },
      { ja: "毛色は黄褐色である", vi: "Màu lông là nâu vàng" },
      { ja: "和牛全体の９５％以上を占め、脂肪交雑（さし）の面で優れる", vi: "Chiếm từ 95% tổng đàn wagyu trở lên, vượt trội về vân mỡ (sashi)" },
    ],
    correctIndex: 3,
    explanationVi: "Giống lông đen chiếm từ 95% tổng đàn wagyu trở lên, đặc biệt vượt trội về vân mỡ (脂肪交雑, còn gọi là 'sashi').",
    sourceQuoteJa: "黒毛和牛：在来牛にブラウンスイス種などを交配して改良が進められた品種。毛色は黒褐単色。和牛全体の９５％以上を占め、肉質は特に脂肪交雑（いわゆる「さし」）の面で優れる。",
    sourcePage: 4,
  },
  {
    id: "ck-33",
    chapterId: "ck-ch1",
    questionJa: "褐毛和種の主産県はどこか。",
    questionVi: "Tỉnh sản xuất chính của giống bò lông nâu (褐毛和種) là đâu?",
    options: [
      { ja: "熊本県及び高知県", vi: "Kumamoto và Kochi" },
      { ja: "岩手県", vi: "Iwate" },
      { ja: "山口県", vi: "Yamaguchi" },
      { ja: "北海道", vi: "Hokkaido" },
    ],
    correctIndex: 0,
    explanationVi: "Giống lông nâu bắt nguồn từ bò Triều Tiên (朝鮮牛) nuôi tại Kumamoto và Kochi, lai với giống Simmental; tỉnh sản xuất chính là Kumamoto và Kochi.",
    sourceQuoteJa: "褐毛和種：熊本県と高知県で飼われていた朝鮮牛を基礎とした在来牛にシンメンタール種などを交配して改良が進められた品種。毛色は黄褐色。主産県は熊本県及び高知県。",
    sourcePage: 4,
  },
  {
    id: "ck-34",
    chapterId: "ck-ch1",
    questionJa: "日本短角種の特徴として正しいものはどれか。",
    questionVi: "Đặc điểm của giống bò sừng ngắn Nhật Bản (日本短角種) đúng là gì?",
    options: [
      { ja: "熊本県の朝鮮牛を基礎とした品種", vi: "Giống dựa trên bò Triều Tiên ở Kumamoto" },
      { ja: "東北地方北部の南部牛にショートホーン種を交配して改良された品種で、主産県は岩手県", vi: "Cải tạo từ bò Nanbu ở miền Bắc vùng Tohoku lai với giống Shorthorn, tỉnh sản xuất chính là Iwate" },
      { ja: "毛色は黒色である", vi: "Màu lông là đen" },
      { ja: "アバディーンアンガス種を交配した品種", vi: "Giống lai với Aberdeen Angus" },
    ],
    correctIndex: 1,
    explanationVi: "Giống sừng ngắn Nhật Bản cải tạo từ bò Nanbu nuôi ở miền Bắc vùng Tohoku, lai với giống Shorthorn; màu lông nâu đậm, tỉnh sản xuất chính là Iwate.",
    sourceQuoteJa: "日本短角種：東北地方北部で飼われていた南部牛にショートホーン種を交配して改良が進められた品種。毛色は濃褐色。主産県は岩手県。",
    sourcePage: 4,
  },
  {
    id: "ck-35",
    chapterId: "ck-ch1",
    questionJa: "無角和種の特徴として正しいものはどれか。",
    questionVi: "Đặc điểm của giống bò không sừng (無角和種) đúng là gì?",
    options: [
      { ja: "シンメンタール種を交配した品種", vi: "Giống lai với Simmental" },
      { ja: "主産県は熊本県である", vi: "Tỉnh sản xuất chính là Kumamoto" },
      { ja: "アバディーンアンガス種を交配し、毛色は黒毛和種より黒味が強い黒色で、主産県は山口県", vi: "Lai với giống Aberdeen Angus, màu lông đen đậm hơn giống lông đen, tỉnh sản xuất chính là Yamaguchi" },
      { ja: "毛色は黄褐色である", vi: "Màu lông là nâu vàng" },
    ],
    correctIndex: 2,
    explanationVi: "Giống không sừng lai bò bản địa với giống Aberdeen Angus; màu lông đen, đậm hơn cả giống lông đen (黒毛和種); tỉnh sản xuất chính là Yamaguchi.",
    sourceQuoteJa: "無角和種：在来牛にアバディーンアンガス種を交配して改良が進められた品種。毛色は黒色で黒毛和種より黒味が強い。主産県は山口県。",
    sourcePage: 4,
  },
  {
    id: "ck-36",
    chapterId: "ck-ch1",
    questionJa: "「伝統野菜（在来野菜）」とは何か。",
    questionVi: "'Rau truyền thống (伝統野菜/在来野菜)' là gì?",
    options: [
      { ja: "近代に外国から輸入された野菜のこと", vi: "Là rau du nhập từ nước ngoài vào thời cận đại" },
      { ja: "品種改良によって食べやすくなった野菜のこと", vi: "Là rau đã được cải tạo giống để dễ ăn hơn" },
      { ja: "スーパーでしか売られていない野菜のこと", vi: "Là loại rau chỉ bán trong siêu thị" },
      { ja: "昔から日本で作り続けられ、昔の姿や形のまま栽培が続けられている野菜のこと", vi: "Là loại rau được trồng liên tục từ xưa tại Nhật, vẫn giữ nguyên hình dáng như xưa" },
    ],
    correctIndex: 3,
    explanationVi: "Rau truyền thống (còn gọi là rau bản địa) là loại được trồng liên tục từ xưa tại Nhật Bản, vẫn giữ nguyên hình dáng như thời xưa, ví dụ: cà tím, ngưu bàng, hành, đại căn, xuân cúc...",
    sourceQuoteJa: "昔から日本で作り続けられている伝統野菜（在来野菜）も昔の姿や形のまま栽培が続けられています。（伝統野菜の例）なす、ふき、ねぎ、ごぼう、うど、大根、菜、きゅうり、かぼちゃ、かぶ、春菊、いも、豆・・・など",
    sourcePage: 4,
  },
  {
    id: "ck-37",
    chapterId: "ck-ch1",
    questionJa: "伝統野菜が地域において果たす役割として正しいものはどれか。",
    questionVi: "Vai trò của rau truyền thống đối với địa phương đúng là gì?",
    options: [
      { ja: "地域の食文化に重要な役割を果たしている", vi: "Đóng vai trò quan trọng trong văn hóa ẩm thực địa phương" },
      { ja: "経済的な価値はまったくない", vi: "Hoàn toàn không có giá trị kinh tế" },
      { ja: "全国どこでも同じ名称で販売される", vi: "Được bán với cùng một tên gọi trên toàn quốc" },
      { ja: "近年は栽培する地域がなくなった", vi: "Gần đây không còn địa phương nào trồng nữa" },
    ],
    correctIndex: 0,
    explanationVi: "Rau truyền thống thường được bán kèm tên gọi vùng miền đã trồng từ xưa, và đóng vai trò quan trọng trong văn hóa ẩm thực địa phương.",
    sourceQuoteJa: "どの野菜が昔から栽培されている地域の名称を付して販売されています。伝統野菜は地域の食文化に重要な役割を果たしています。",
    sourcePage: 5,
  },
  {
    id: "ck-38",
    chapterId: "ck-ch2",
    questionJa: "下処理とは何か。",
    questionVi: "Sơ chế (下処理) là gì?",
    options: [
      { ja: "調理の前にあらかじめ食材におこなう加工処理（洗浄、あくをぬく、切れ目を入れる、乾物をもどすなど）", vi: "Công đoạn xử lý sơ bộ thực hiện trước khi nấu (rửa, khử vị đắng/chát, khía dao, ngâm nở đồ khô...)" },
      { ja: "調理が終わった後に食材を片付ける作業", vi: "Công việc dọn dẹp nguyên liệu sau khi nấu xong" },
      { ja: "食材を仕入れる作業", vi: "Công việc nhập nguyên liệu" },
      { ja: "食材を廃棄する作業", vi: "Công việc vứt bỏ nguyên liệu" },
    ],
    correctIndex: 0,
    explanationVi: "Sơ chế là công đoạn xử lý sơ bộ thực hiện trước khi nấu (rửa, khử vị đắng/chát, khía dao, ngâm nở đồ khô...).",
    sourceQuoteJa: "調理の前にあらかじめ食材におこなう加工処理です。洗浄、あくをぬく、切れ目を入れる、乾物をもどすなどがあります。",
    sourcePage: 5,
  },
  {
    id: "ck-39",
    chapterId: "ck-ch2",
    questionJa: "下処理の状態が悪いとどうなるか。",
    questionVi: "Nếu sơ chế không tốt thì điều gì xảy ra?",
    options: [
      { ja: "特に影響はない", vi: "Không ảnh hưởng gì đặc biệt" },
      { ja: "料理そのものの味や食感が悪くなる", vi: "Vị và kết cấu của chính món ăn sẽ trở nên kém đi" },
      { ja: "調理時間が短くなる", vi: "Thời gian nấu sẽ ngắn lại" },
      { ja: "食材のコストが下がる", vi: "Chi phí nguyên liệu sẽ giảm" },
    ],
    correctIndex: 1,
    explanationVi: "Nếu tình trạng sơ chế không tốt, vị và kết cấu của chính món ăn sẽ trở nên kém đi.",
    sourceQuoteJa: "下処理状態が悪いと料理そのものの味や食感が悪くなります。",
    sourcePage: 5,
  },
  {
    id: "ck-40",
    chapterId: "ck-ch2",
    questionJa: "下処理中に特に注意すべきことは何か。",
    questionVi: "Khi sơ chế cần đặc biệt lưu ý điều gì?",
    options: [
      { ja: "できるだけ早く終わらせること", vi: "Làm xong càng nhanh càng tốt" },
      { ja: "香辛料を多く使うこと", vi: "Dùng nhiều gia vị cay" },
      { ja: "微生物を下処理中に増やさないこと、加熱調理済み食品などへの二次汚染を防ぐこと", vi: "Không để vi sinh vật sinh sôi trong lúc sơ chế và tránh gây ô nhiễm chéo sang thực phẩm đã nấu chín" },
      { ja: "冷蔵庫を使わないこと", vi: "Không dùng tủ lạnh" },
    ],
    correctIndex: 2,
    explanationVi: "Thực phẩm trước khi nấu có vi khuẩn gây ngộ độc/vi sinh vật gây thối rữa bám vào, nên phải tránh làm chúng sinh sôi trong lúc sơ chế và tránh gây ô nhiễm chéo (二次汚染) sang thực phẩm đã nấu chín/đã khử trùng qua tay, dụng cụ, mặt bàn.",
    sourceQuoteJa: "それら微生物を下処理中に増やさないことと、手指や調理器具・作業台を介して、加熱調理済み食品や殺菌済みの食品に汚染（二次汚染）させないことが重要になります。",
    sourcePage: 5,
  },
  {
    id: "ck-41",
    chapterId: "ck-ch2",
    questionJa: "野菜を洗浄する基本的な手順として正しいものはどれか。",
    questionVi: "Quy trình cơ bản khi rửa rau đúng là gì?",
    options: [
      { ja: "汚れの多いものから先に洗う", vi: "Rửa loại bẩn nhiều trước" },
      { ja: "水につけずにそのまま流水だけで洗う", vi: "Chỉ rửa bằng nước chảy, không ngâm" },
      { ja: "洗剤を使って念入りに洗う", vi: "Dùng chất tẩy rửa để rửa thật kỹ" },
      { ja: "汚れのすくないものから１枚ずつ水につけて洗い、最後に流水で洗う", vi: "Bắt đầu từ loại ít bẩn hơn, ngâm nước từng lá một, cuối cùng rửa lại bằng nước chảy" },
    ],
    correctIndex: 3,
    explanationVi: "Rửa rau: bắt đầu từ loại ít bẩn hơn, ngâm nước từng lá một, cuối cùng rửa lại bằng nước chảy.",
    sourceQuoteJa: "汚れのすくないものから１枚ずつ水につけて洗います。最後に流水で洗います。",
    sourcePage: 5,
  },
  {
    id: "ck-42",
    chapterId: "ck-ch2",
    questionJa: "葉物野菜を洗うときの正しい方法はどれか。",
    questionVi: "Cách rửa rau lá đúng là gì?",
    options: [
      { ja: "根元を広げるようにして葉が傷つかないように丁寧に洗う", vi: "Rửa cẩn thận bằng cách banh rộng phần gốc để không làm rách lá" },
      { ja: "根元をしっかり縛ったまま洗う", vi: "Buộc chặt phần gốc rồi mới rửa" },
      { ja: "葉を1枚ずつちぎってから洗う", vi: "Xé từng lá ra trước rồi mới rửa" },
      { ja: "洗わずにそのまま調理する", vi: "Không rửa mà nấu luôn" },
    ],
    correctIndex: 0,
    explanationVi: "Rau lá: rửa cẩn thận bằng cách banh rộng phần gốc để không làm rách lá.",
    sourceQuoteJa: "葉物は根元を広げるようにして葉が傷つかないように丁寧に洗います。",
    sourcePage: 5,
  },
  {
    id: "ck-43",
    chapterId: "ck-ch2",
    questionJa: "泥のついた野菜を洗う正しい方法はどれか。",
    questionVi: "Cách rửa rau còn dính đất đúng là gì?",
    options: [
      { ja: "水につけるだけでよい", vi: "Chỉ cần ngâm nước là đủ" },
      { ja: "たわしでよく洗って泥を落とし、最後に流水で洗う", vi: "Dùng bàn chải cọ kỹ để rửa sạch đất, cuối cùng rửa lại bằng nước chảy" },
      { ja: "洗わずに調理する", vi: "Không rửa mà nấu luôn" },
      { ja: "熱湯で洗い流す", vi: "Rửa bằng nước sôi" },
    ],
    correctIndex: 1,
    explanationVi: "Rau còn dính đất: dùng bàn chải cọ kỹ để rửa sạch đất, cuối cùng rửa lại bằng nước chảy.",
    sourceQuoteJa: "泥のついたものは、たわしでよく洗って泥を落とし、最後に流水で洗います。",
    sourcePage: 5,
  },
  {
    id: "ck-44",
    chapterId: "ck-ch2",
    questionJa: "じゃがいも、さつまいもなどのいも類やなすを冷水につける目的は何か。",
    questionVi: "Mục đích ngâm khoai tây, khoai lang, cà tím vào nước lạnh là gì?",
    options: [
      { ja: "色をきれいにするため", vi: "Để màu sắc đẹp hơn" },
      { ja: "早く煮えるようにするため", vi: "Để nấu chín nhanh hơn" },
      { ja: "あく抜きをするため", vi: "Để khử vị đắng/chát" },
      { ja: "皮をむきやすくするため", vi: "Để dễ gọt vỏ hơn" },
    ],
    correctIndex: 2,
    explanationVi: "Khoai tây, khoai lang và các loại khoai khác cùng cà tím được ngâm nước lạnh để khử vị đắng/chát (あく抜き).",
    sourceQuoteJa: "じゃがいも、さつまいもなどのいも類やなすは冷水につけてあく抜きをします。",
    sourcePage: 5,
  },
  {
    id: "ck-45",
    chapterId: "ck-ch2",
    questionJa: "れんこんやごぼうを酢水に入れるとどうなるか。",
    questionVi: "Nếu ngâm củ sen hoặc ngưu bàng vào nước giấm thì điều gì xảy ra?",
    options: [
      { ja: "黒くなる", vi: "Chuyển màu đen" },
      { ja: "柔らかくなりすぎる", vi: "Trở nên quá mềm" },
      { ja: "香りが強くなる", vi: "Mùi thơm mạnh hơn" },
      { ja: "白くなる", vi: "Chuyển màu trắng" },
    ],
    correctIndex: 3,
    explanationVi: "Củ sen, ngưu bàng khi ngâm nước giấm sẽ trở nên trắng.",
    sourceQuoteJa: "れんこんやごぼうは酢水に入れると白くなります。",
    sourcePage: 5,
  },
  {
    id: "ck-46",
    chapterId: "ck-ch2",
    questionJa: "きゅうりやキャベツを塩でもむとどうなるか。",
    questionVi: "Nếu bóp muối dưa leo hoặc bắp cải thì điều gì xảy ra?",
    options: [
      { ja: "浸透圧の作用で野菜から水分が出てしんなりする", vi: "Do tác dụng thẩm thấu, nước trong rau thoát ra làm rau mềm xuống" },
      { ja: "色が濃くなる", vi: "Màu sắc đậm hơn" },
      { ja: "腐敗が早まる", vi: "Nhanh hư hỏng hơn" },
      { ja: "特に変化はない", vi: "Không có thay đổi gì đặc biệt" },
    ],
    correctIndex: 0,
    explanationVi: "Dưa leo, bắp cải khi bóp muối: do tác dụng thẩm thấu (浸透圧), nước trong rau thoát ra làm rau mềm xuống.",
    sourceQuoteJa: "きゅうりやキャベツは塩でもむと、浸透圧の作用で野菜から水分が出てしんなりします。",
    sourcePage: 5,
  },
  {
    id: "ck-47",
    chapterId: "ck-ch2",
    questionJa: "肉の赤身と脂身の間にある筋に切れ目を入れる理由は何か。",
    questionVi: "Lý do khía dao vào gân giữa phần nạc và mỡ của thịt là gì?",
    options: [
      { ja: "見た目をよくするため", vi: "Để hình thức đẹp hơn" },
      { ja: "加熱により筋が縮み、肉が反り返るのを防ぐため", vi: "Để tránh gân co lại khi gia nhiệt làm miếng thịt bị cong lên" },
      { ja: "火の通りを遅くするため", vi: "Để làm chậm quá trình chín" },
      { ja: "味付けをしやすくするため", vi: "Để dễ ướp gia vị hơn" },
    ],
    correctIndex: 1,
    explanationVi: "Gân nằm giữa phần nạc và mỡ khi gia nhiệt sẽ co lại làm miếng thịt bị cong lên, nên phải khía dao trước để tránh hiện tượng này.",
    sourceQuoteJa: "赤身と脂身の間にある筋は加熱により縮み、肉が反り返るので、切れ目を入れます。",
    sourcePage: 5,
  },
  {
    id: "ck-48",
    chapterId: "ck-ch2",
    questionJa: "肉たたきで肉をたたく効果として正しいものはどれか。",
    questionVi: "Tác dụng của việc dùng chày đập thịt là gì?",
    options: [
      { ja: "色を白くする", vi: "Làm thịt trắng ra" },
      { ja: "水分を完全に抜く", vi: "Rút hết nước ra" },
      { ja: "形を整え、縮まずやわらかく焼ける", vi: "Chỉnh hình dạng, khi nướng không co lại và mềm hơn" },
      { ja: "臭みを消す", vi: "Khử mùi hôi" },
    ],
    correctIndex: 2,
    explanationVi: "Dùng chày đập thịt để chỉnh hình dạng, khi nướng sẽ không bị co lại và mềm hơn.",
    sourceQuoteJa: "肉たたきで肉をたたき、形を整えて焼くと、縮まずやわらかくなります。",
    sourcePage: 5,
  },
  {
    id: "ck-49",
    chapterId: "ck-ch2",
    questionJa: "魚のうろこを落とす正しい方向・方法はどれか。",
    questionVi: "Hướng/cách gạt vảy cá đúng là gì?",
    options: [
      { ja: "頭から尾の方向に、素手でこすり落とす", vi: "Theo hướng từ đầu xuống đuôi, dùng tay không chà" },
      { ja: "水につけたまま自然に取れるのを待つ", vi: "Ngâm nước rồi chờ vảy tự bong ra" },
      { ja: "包丁の刃先だけを使う", vi: "Chỉ dùng mũi dao" },
      { ja: "尾から頭の方向に向かって、専用のウロコ取りか包丁の背を使う", vi: "Theo hướng từ đuôi tiến lên đầu, dùng dụng cụ gạt vảy chuyên dụng hoặc sống dao" },
    ],
    correctIndex: 3,
    explanationVi: "Gạt vảy: theo hướng từ đuôi lên đầu, dùng dụng cụ gạt vảy chuyên dụng hoặc sống dao (nếu không có dụng cụ), tránh làm rách thịt cá.",
    sourceQuoteJa: "うろこを落とす：尾から頭の方向に向かってとります。専用のウロコ取りを使うと簡単ですが、ない場合には包丁の背を使って、身を傷つけないようにとります。",
    sourcePage: 5,
  },
  {
    id: "ck-50",
    chapterId: "ck-ch2",
    questionJa: "魚のえらを取る手順として正しいものはどれか。",
    questionVi: "Quy trình lấy mang cá đúng là gì?",
    options: [
      { ja: "魚の腹を上にしてえらぶたを開き、包丁の刃先を入れてえらと身のつなぎ部分を切り、反対側も同様にして引き出す", vi: "Lật bụng cá lên, mở nắp mang, đưa mũi dao vào cắt phần nối giữa mang và thân, làm tương tự bên kia rồi kéo mang ra" },
      { ja: "頭を完全に切り落としてから取る", vi: "Cắt lìa hoàn toàn đầu cá rồi mới lấy mang" },
      { ja: "手で無理やり引きちぎる", vi: "Dùng tay giật mạnh cho đứt ra" },
      { ja: "煮てから箸で取り除く", vi: "Nấu chín rồi dùng đũa gắp bỏ ra" },
    ],
    correctIndex: 0,
    explanationVi: "Lấy mang cá: lật bụng cá lên, mở nắp mang, đưa mũi dao vào cắt phần nối giữa mang và thân, làm tương tự bên kia rồi kéo mang ra.",
    sourceQuoteJa: "えらを取る：魚の腹を上にしてえらぶたを開き、包丁の刃先を入れ、えらと身のつなぎ部分を切ります。反対側も同じように切り、えらをひっかけるようにして引き出します。",
    sourcePage: 5,
  },
  {
    id: "ck-51",
    chapterId: "ck-ch2",
    questionJa: "魚の内臓を取り出す方法として正しい組み合わせはどれか。",
    questionVi: "Tổ hợp cách lấy nội tạng cá đúng là gì?",
    options: [
      { ja: "どちらの場合も頭を完全に切り離してから取り出す", vi: "Cả hai trường hợp đều phải cắt lìa hoàn toàn đầu trước" },
      { ja: "切り身にする場合はえらから腹までまっすぐ切って開き内臓をかき出す／尾頭付きの場合は裏側の胸びれの下を切り込んで内臓を出す", vi: "Khi làm phi lê: cắt thẳng từ mang đến bụng, mở bụng móc nội tạng ra / Khi giữ nguyên đầu-đuôi: cắt phía dưới vây ngực ở mặt sau để lấy nội tạng ra" },
      { ja: "内臓は取り除かずそのまま調理する", vi: "Không lấy nội tạng ra mà nấu luôn" },
      { ja: "内臓は必ず茹でてから取り出す", vi: "Phải luộc chín rồi mới lấy nội tạng ra" },
    ],
    correctIndex: 1,
    explanationVi: "Khi làm thành cá phi lê: cắt thẳng từ mang đến bụng, mở bụng và móc nội tạng ra. Khi giữ nguyên cả đầu-đuôi (尾頭付き): để tránh vết cắt lộ ra mặt trước cá, cắt phía dưới vây ngực ở mặt sau để lấy nội tạng ra.",
    sourceQuoteJa: "切り身にする場合：えらのところから腹のところまでまっすぐに切り、腹を開いて刃先で内臓をかきだします。尾頭付きの場合：魚の表に切り込みが見えないようにするため、裏側の胸びれの下を切り込み、内臓を出します。",
    sourcePage: 6,
  },
  {
    id: "ck-52",
    chapterId: "ck-ch2",
    questionJa: "魚を水洗いする際の正しい方法はどれか。",
    questionVi: "Cách rửa cá bằng nước đúng là gì?",
    options: [
      { ja: "ぬるま湯でゆっくり時間をかけて洗う", vi: "Rửa bằng nước ấm, làm thong thả" },
      { ja: "洗わずに水気だけふきとる", vi: "Không rửa mà chỉ lau khô nước" },
      { ja: "手早く流水で洗い流し、水気をしっかりふきとる", vi: "Rửa nhanh dưới vòi nước chảy, sau đó lau khô kỹ nước còn đọng" },
      { ja: "塩水に長時間浸けておく", vi: "Ngâm nước muối trong thời gian dài" },
    ],
    correctIndex: 2,
    explanationVi: "Rửa cá bằng nước: rửa nhanh dưới vòi nước chảy, sau đó lau khô kỹ nước còn đọng.",
    sourceQuoteJa: "水洗い：手早く流水で洗い流し、水気をしっかりふきとります。",
    sourcePage: 6,
  },
  {
    id: "ck-53",
    chapterId: "ck-ch2",
    questionJa: "魚の頭を取る手順として正しいものはどれか。",
    questionVi: "Quy trình cắt bỏ đầu cá đúng là gì?",
    options: [
      { ja: "頭を素手でねじり取る", vi: "Dùng tay vặn đầu cá ra" },
      { ja: "尾から頭に向かって一気に切り落とす", vi: "Cắt một nhát từ đuôi tới đầu" },
      { ja: "中骨を避けて皮だけ切る", vi: "Chỉ cắt da, tránh xương sống" },
      { ja: "腹びれの後ろのつけねから胸びれの後ろまで斜めに中骨まで包丁を入れ、裏返し同様にして中骨ごと頭を落とす", vi: "Từ gốc vây bụng đến sau vây ngực, đưa dao chéo xuống đến tận xương sống, lật mặt kia làm tương tự rồi cắt lìa đầu cùng xương sống" },
    ],
    correctIndex: 3,
    explanationVi: "Cắt đầu cá: từ gốc vây bụng đến sau vây ngực, đưa dao chéo xuống đến tận xương sống chính, lật mặt kia làm tương tự rồi cắt lìa đầu cùng xương sống.",
    sourceQuoteJa: "頭を取る：腹びれの後ろのつけねから胸びれの後ろまで斜めに、中骨まで包丁を入れます。裏返し同様にし、中骨ごと頭を落とします。",
    sourcePage: 6,
  },
  {
    id: "ck-54",
    chapterId: "ck-ch3",
    questionJa: "調理とは何か。",
    questionVi: "'Nấu ăn/chế biến' (調理) là gì?",
    options: [
      { ja: "食材に手を加え、衛生的で安全なものにする、味や香り、口触りをよくして美味しいものにすること", vi: "Tác động lên nguyên liệu để làm cho nó vệ sinh, an toàn, cải thiện vị, hương thơm, cảm giác khi ăn để trở nên ngon miệng" },
      { ja: "食材をそのまま提供すること", vi: "Phục vụ nguyên liệu ở dạng nguyên bản" },
      { ja: "食材を仕入れること", vi: "Nhập nguyên liệu" },
      { ja: "食材を廃棄すること", vi: "Vứt bỏ nguyên liệu" },
    ],
    correctIndex: 0,
    explanationVi: "Nấu ăn là tác động lên nguyên liệu để làm cho nó vệ sinh, an toàn, cải thiện vị, hương thơm, cảm giác khi ăn để trở nên ngon miệng.",
    sourceQuoteJa: "調理とは、食材に手を加え、衛生的で安全なものにする、味や香り、口触りをよくして美味しいものにすることです。",
    sourcePage: 6,
  },
  {
    id: "ck-55",
    chapterId: "ck-ch3",
    questionJa: "美味しい料理をタイミングよく提供するために大切なことは何か。",
    questionVi: "Điều quan trọng để phục vụ món ăn ngon đúng thời điểm là gì?",
    options: [
      { ja: "できるだけ多くの人員を投入すること", vi: "Huy động càng nhiều nhân lực càng tốt" },
      { ja: "調理の手順を考えて効率よく作業し、食材を無駄なく使用し、エネルギーの節約も考えながら調理計画をたてること", vi: "Nghĩ về quy trình nấu để làm việc hiệu quả, dùng nguyên liệu không lãng phí, lập kế hoạch nấu có tính đến tiết kiệm năng lượng" },
      { ja: "できるだけ早く一度に大量調理すること", vi: "Nấu số lượng lớn một lần càng nhanh càng tốt" },
      { ja: "調理計画は立てず臨機応変に対応すること", vi: "Không lập kế hoạch mà ứng biến tùy tình huống" },
    ],
    correctIndex: 1,
    explanationVi: "Để phục vụ món ngon đúng lúc, cần nghĩ về quy trình nấu để làm việc hiệu quả, dùng nguyên liệu không lãng phí, và lập kế hoạch nấu có tính đến tiết kiệm năng lượng (nước, gas...).",
    sourceQuoteJa: "美味しい料理をタイミングよく提供するためには、調理の手順を考えて効率よく作業することが大切です。食材を無駄なく使用し、水やガスなどのエネルギーの節約も考えながら調理計画をたて作業しましょう。",
    sourcePage: 6,
  },
  {
    id: "ck-56",
    chapterId: "ck-ch3",
    questionJa: "加熱調理の効果として正しいものはどれか。",
    questionVi: "Tác dụng của việc nấu chín bằng nhiệt là gì?",
    options: [
      { ja: "栄養価を必ず下げる", vi: "Luôn làm giảm giá trị dinh dưỡng" },
      { ja: "消化吸収を悪くする", vi: "Làm giảm khả năng tiêu hóa hấp thụ" },
      { ja: "消化吸収をよくし、栄養を高める効果がある", vi: "Có tác dụng cải thiện tiêu hóa hấp thụ và nâng cao dinh dưỡng" },
      { ja: "味や香りには影響しない", vi: "Không ảnh hưởng gì đến vị và hương thơm" },
    ],
    correctIndex: 2,
    explanationVi: "Nấu chín bằng nhiệt (luộc, kho, chiên, nướng, xào...) giúp ăn được an toàn và ngon miệng, đồng thời cải thiện tiêu hóa hấp thụ và nâng cao giá trị dinh dưỡng.",
    sourceQuoteJa: "茹でる、煮る、揚げる、焼く、炒めるなど熱を加えて、安全に美味しく食すことができる状態にしましょう。消化吸収をよくし、栄養を高める効果もあります。",
    sourcePage: 6,
  },
  {
    id: "ck-57",
    chapterId: "ck-ch3",
    questionJa: "「茹でる」の調理法として正しいものはどれか。",
    questionVi: "Cách nấu 'luộc' (茹でる) đúng là gì?",
    options: [
      { ja: "調味料の入った煮汁やだし汁で加熱する", vi: "Nấu bằng nước dùng/nước kho có gia vị" },
      { ja: "高温・多量の油で加熱する", vi: "Nấu bằng dầu nhiều ở nhiệt độ cao" },
      { ja: "高温・少量の油脂を用いて撹拌しながら加熱する", vi: "Vừa khuấy vừa nấu bằng ít dầu mỡ ở nhiệt độ cao" },
      { ja: "多量の水又は熱湯の中で加熱する", vi: "Nấu trong nhiều nước hoặc nước sôi" },
    ],
    correctIndex: 3,
    explanationVi: "Luộc (茹でる): nấu chín trong nhiều nước hoặc nước sôi.",
    sourceQuoteJa: "茹でる：多量の水又は熱湯の中で加熱します。",
    sourcePage: 6,
  },
  {
    id: "ck-58",
    chapterId: "ck-ch3",
    questionJa: "「煮る」の調理法として正しいものはどれか。",
    questionVi: "Cách nấu 'kho/ninh' (煮る) đúng là gì?",
    options: [
      { ja: "調味料の入った煮汁やだし汁で加熱する", vi: "Nấu bằng nước dùng/nước kho có gia vị" },
      { ja: "水蒸気で加熱する", vi: "Nấu bằng hơi nước" },
      { ja: "油で揚げる", vi: "Chiên bằng dầu" },
      { ja: "直火で炙る", vi: "Nướng trực tiếp trên lửa" },
    ],
    correctIndex: 0,
    explanationVi: "Kho/ninh (煮る): nấu chín bằng nước dùng hoặc nước kho có pha gia vị.",
    sourceQuoteJa: "煮る：調味料の入った煮汁やだし汁で加熱します。",
    sourcePage: 6,
  },
  {
    id: "ck-59",
    chapterId: "ck-ch3",
    questionJa: "「揚げる」の調理法の特徴として正しいものはどれか。",
    questionVi: "Đặc điểm của cách nấu 'chiên' (揚げる) là gì?",
    options: [
      { ja: "食品の水分が増加する", vi: "Nước trong thực phẩm tăng lên" },
      { ja: "高温・多量の油で加熱し、食品の水分が減少して油を吸収する", vi: "Nấu bằng nhiều dầu ở nhiệt độ cao, nước trong thực phẩm giảm đi và hấp thụ dầu" },
      { ja: "低温でじっくり加熱する", vi: "Nấu chậm ở nhiệt độ thấp" },
      { ja: "水を一切使わない蒸し料理である", vi: "Là món hấp hoàn toàn không dùng nước" },
    ],
    correctIndex: 1,
    explanationVi: "Chiên (揚げる): nấu bằng nhiều dầu ở nhiệt độ cao; nước trong thực phẩm giảm đi và thực phẩm hấp thụ dầu.",
    sourceQuoteJa: "揚げる：高温・多量の油で加熱します。食品の水分が減少し、油を吸収します。",
    sourcePage: 6,
  },
  {
    id: "ck-60",
    chapterId: "ck-ch3",
    questionJa: "「焼く」の調理法として正しいものはどれか。",
    questionVi: "Cách nấu 'nướng' (焼く) đúng là gì?",
    options: [
      { ja: "食品を頻繁にひっくり返しながら短時間で加熱する", vi: "Vừa lật liên tục vừa nấu nhanh" },
      { ja: "大量の水で煮込む", vi: "Ninh bằng nhiều nước" },
      { ja: "食品をあまり動かさず、中までじっくり火を通す", vi: "Ít di chuyển thực phẩm, làm chín kỹ đến bên trong" },
      { ja: "油をたっぷり使って揚げる", vi: "Chiên với nhiều dầu" },
    ],
    correctIndex: 2,
    explanationVi: "Nướng (焼く): ít di chuyển thực phẩm, làm chín từ từ và kỹ đến bên trong.",
    sourceQuoteJa: "焼く：食品をあまり動かさず、中までじっくり火を通します。",
    sourcePage: 6,
  },
  {
    id: "ck-61",
    chapterId: "ck-ch3",
    questionJa: "「炒める」の調理法で、複数の食材を入れるときの注意点はどれか。",
    questionVi: "Khi nấu theo kiểu 'xào' (炒める) và cho nhiều loại nguyên liệu, cần lưu ý gì?",
    options: [
      { ja: "熱の通りが早い具材から先に入れる", vi: "Cho loại chín nhanh vào trước" },
      { ja: "すべての具材を同時に入れる", vi: "Cho tất cả nguyên liệu vào cùng lúc" },
      { ja: "具材はできるだけ大きく切る", vi: "Thái nguyên liệu càng to càng tốt" },
      { ja: "熱の通りが遅い具材から先に入れて、熱の入り具合を均等にする", vi: "Cho loại chín chậm vào trước để nhiệt vào đều" },
    ],
    correctIndex: 3,
    explanationVi: "Xào (炒める): dùng ít dầu mỡ ở nhiệt độ cao, vừa khuấy vừa nấu nhanh; khi cho nhiều nguyên liệu, cho loại chín chậm vào trước để nhiệt vào đều.",
    sourceQuoteJa: "炒める：高温・少量の油脂を用いて、撹拌しながら短時間で加熱します。複数の食材を入れるとき、熱の通りが遅い具材から先に入れて熱の入り具合を均等にします。",
    sourcePage: 6,
  },
  {
    id: "ck-62",
    chapterId: "ck-ch3",
    questionJa: "「蒸す」の調理法として正しいものはどれか。",
    questionVi: "Cách nấu 'hấp' (蒸す) đúng là gì?",
    options: [
      { ja: "蒸し器やせいろなどを使って、水蒸気で加熱する", vi: "Dùng nồi hấp hoặc xửng để nấu bằng hơi nước" },
      { ja: "直接油の中に入れて加熱する", vi: "Cho trực tiếp vào dầu để nấu" },
      { ja: "熱湯に浸けたまま長時間放置する", vi: "Ngâm trong nước sôi thời gian dài" },
      { ja: "冷水から徐々に温度を上げる", vi: "Tăng nhiệt từ từ bắt đầu từ nước lạnh" },
    ],
    correctIndex: 0,
    explanationVi: "Hấp (蒸す): dùng nồi hấp hoặc xửng để nấu chín bằng hơi nước.",
    sourceQuoteJa: "蒸す：蒸し器やせいろなどを使って、水蒸気で加熱します。",
    sourcePage: 6,
  },
  {
    id: "ck-63",
    chapterId: "ck-ch3",
    questionJa: "揚げ物を揚げ続けると油はどうなるか。",
    questionVi: "Nếu liên tục chiên đồ ăn thì dầu ăn sẽ ra sao?",
    options: [
      { ja: "色や香りがよくなる", vi: "Màu và mùi trở nên tốt hơn" },
      { ja: "油が酸化され、色や香りが悪くなり、粘りが増して持続性の泡立ちが起こる", vi: "Dầu bị oxy hóa, màu và mùi kém đi, độ nhớt tăng và xuất hiện bọt khí bền" },
      { ja: "粘りがなくなりサラサラになる", vi: "Hết nhớt và trở nên loãng" },
      { ja: "特に変化しない", vi: "Không có thay đổi gì đặc biệt" },
    ],
    correctIndex: 1,
    explanationVi: "Nếu tiếp tục chiên nhiều lần, dầu sẽ bị oxy hóa, màu và mùi trở nên kém đi, độ nhớt tăng lên, mặt dầu xuất hiện bọt khí bền.",
    sourceQuoteJa: "揚げ物を揚げ続けると油が酸化され、色や香りが悪くなり粘りが増してきます。そのため、油の表面には持続性の泡立ちが起こるようになります。",
    sourcePage: 6,
  },
  {
    id: "ck-64",
    chapterId: "ck-ch3",
    questionJa: "油の劣化を防ぐための注意点として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu trong bài để phòng ngừa dầu ăn bị xuống cấp?",
    options: [
      { ja: "空気になるべくさらさない", vi: "Hạn chế để dầu tiếp xúc với không khí" },
      { ja: "直射日光に当てない", vi: "Không để dưới ánh nắng trực tiếp" },
      { ja: "毎日新しい油に完全に交換する", vi: "Thay hoàn toàn dầu mới mỗi ngày" },
      { ja: "不純物を混ぜない", vi: "Không để lẫn tạp chất" },
    ],
    correctIndex: 2,
    explanationVi: "4 điểm được nêu để phòng ngừa dầu ăn xuống cấp là: hạn chế tiếp xúc không khí, tránh gia nhiệt kéo dài, không để dưới ánh nắng trực tiếp, không để lẫn tạp chất — không có yêu cầu 'thay hoàn toàn dầu mới mỗi ngày'.",
    sourceQuoteJa: "油の劣化を防ぐためには以下の点に注意します。・空気になるべくさらさないこと・長時間の加熱を避けること・直射日光に当てないこと・不純物を混ぜないこと",
    sourcePage: 6,
  },
  {
    id: "ck-65",
    chapterId: "ck-ch3",
    questionJa: "非加熱調理とは何か。",
    questionVi: "'Chế biến không dùng nhiệt' (非加熱調理) là gì?",
    options: [
      { ja: "必ず加熱してから冷ます調理法", vi: "Phương pháp bắt buộc nấu chín rồi để nguội" },
      { ja: "電子レンジのみを使う調理法", vi: "Phương pháp chỉ dùng lò vi sóng" },
      { ja: "揚げ物や焼き物の総称", vi: "Tên gọi chung của đồ chiên và đồ nướng" },
      { ja: "熱を加えずにおこなう調理方法で、混合や撹拌、冷却などがある", vi: "Phương pháp chế biến không dùng nhiệt, gồm trộn, khuấy, làm lạnh..." },
    ],
    correctIndex: 3,
    explanationVi: "Chế biến không dùng nhiệt là phương pháp không gia nhiệt, bao gồm trộn/khuấy, làm lạnh...",
    sourceQuoteJa: "非加熱調理　熱を加えずにおこなう調理方法で、混合や撹拌、冷却などがあります。",
    sourcePage: 6,
  },
  {
    id: "ck-66",
    chapterId: "ck-ch3",
    questionJa: "非加熱調理でとくに衛生管理の注意事項を確実に守るべき理由は何か。",
    questionVi: "Lý do cần tuân thủ nghiêm ngặt lưu ý vệ sinh khi chế biến không dùng nhiệt là gì?",
    options: [
      { ja: "交差汚染・二次汚染のリスクが高いため", vi: "Vì rủi ro lây nhiễm chéo/ô nhiễm thứ cấp cao" },
      { ja: "調理時間が長くなるため", vi: "Vì thời gian nấu kéo dài hơn" },
      { ja: "コストが高くなるため", vi: "Vì chi phí cao hơn" },
      { ja: "見た目が悪くなるため", vi: "Vì hình thức món ăn kém đi" },
    ],
    correctIndex: 0,
    explanationVi: "Chế biến không dùng nhiệt có rủi ro lây nhiễm chéo/ô nhiễm thứ cấp cao, nên phải tuân thủ nghiêm ngặt các lưu ý về quản lý vệ sinh.",
    sourceQuoteJa: "非加熱調理では、交差汚染・二次汚染のリスクが高いので、衛生管理での注意事項は確実に守ることが大切です。",
    sourcePage: 7,
  },
  {
    id: "ck-67",
    chapterId: "ck-ch3",
    questionJa: "「混合・撹拌」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa 'trộn/khuấy' (混合・撹拌) đúng là gì?",
    options: [
      { ja: "食品を1種類ずつ分けて加熱すること", vi: "Nấu từng loại thực phẩm riêng biệt" },
      { ja: "２種類以上の食品や成分を均一にすること", vi: "Làm cho 2 loại thực phẩm/thành phần trở lên trở nên đồng nhất" },
      { ja: "食品の温度を下げること", vi: "Hạ nhiệt độ thực phẩm" },
      { ja: "食品を切り分けること", vi: "Thái/cắt thực phẩm" },
    ],
    correctIndex: 1,
    explanationVi: "Trộn/khuấy (混合・撹拌) là làm cho 2 loại thực phẩm hoặc thành phần trở lên trở nên đồng nhất.",
    sourceQuoteJa: "混合・撹拌：２種類以上の食品や成分を均一にすることです。",
    sourcePage: 7,
  },
  {
    id: "ck-68",
    chapterId: "ck-ch3",
    questionJa: "「冷却」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa 'làm lạnh' (冷却) đúng là gì?",
    options: [
      { ja: "食品を洗浄すること", vi: "Rửa sạch thực phẩm" },
      { ja: "食品を加熱すること", vi: "Gia nhiệt thực phẩm" },
      { ja: "食品の温度を下げるための処理", vi: "Xử lý hạ nhiệt độ thực phẩm" },
      { ja: "食品を混ぜ合わせること", vi: "Trộn lẫn thực phẩm" },
    ],
    correctIndex: 2,
    explanationVi: "Làm lạnh (冷却) là xử lý để hạ nhiệt độ thực phẩm.",
    sourceQuoteJa: "冷却：食品の温度を下げるための処理をいいます。",
    sourcePage: 7,
  },
  {
    id: "ck-69",
    chapterId: "ck-ch3",
    questionJa: "手で和えるときの正しい衛生上の注意点はどれか。",
    questionVi: "Lưu ý vệ sinh đúng khi trộn thức ăn bằng tay là gì?",
    options: [
      { ja: "手袋なしで直接和える", vi: "Trộn trực tiếp không đeo găng tay" },
      { ja: "調理の最後にだけ手を洗えばよい", vi: "Chỉ cần rửa tay vào cuối buổi nấu" },
      { ja: "使い捨て手袋は再利用してよい", vi: "Có thể tái sử dụng găng tay dùng một lần" },
      { ja: "手をよく洗った後に使い捨て手袋を着用する", vi: "Rửa tay thật sạch rồi đeo găng tay dùng một lần" },
    ],
    correctIndex: 3,
    explanationVi: "Khi trộn bằng tay: phải rửa tay thật sạch rồi đeo găng tay dùng một lần.",
    sourceQuoteJa: "手で和えるときは、手をよく洗った後に使い捨て手袋を着用します。",
    sourcePage: 7,
  },
  {
    id: "ck-70",
    chapterId: "ck-ch3",
    questionJa: "刺身のような「生食用冷凍魚介類」を解凍する正しい方法はどれか。",
    questionVi: "Cách rã đông đúng cho 'hải sản đông lạnh dùng để ăn sống' như sashimi là gì?",
    options: [
      { ja: "組織の破壊や汁の流出が起きないよう、なるべく低温で時間をかけて解凍する", vi: "Rã đông ở nhiệt độ thấp trong thời gian dài để tránh phá hủy cấu trúc và chảy nước" },
      { ja: "常温で急速に解凍する", vi: "Rã đông nhanh ở nhiệt độ phòng" },
      { ja: "熱湯にくぐらせて解凍する", vi: "Nhúng qua nước sôi để rã đông" },
      { ja: "解凍せずそのまま提供する", vi: "Phục vụ luôn mà không rã đông" },
    ],
    correctIndex: 0,
    explanationVi: "Hải sản đông lạnh dùng để ăn sống như sashimi phải được rã đông ở nhiệt độ thấp trong thời gian dài để tránh phá hủy cấu trúc và chảy nước.",
    sourceQuoteJa: "刺身のような「生食用冷凍魚介類」は、組織の破壊や汁の流出が起きないようになるべく低温で時間をかけて解凍します。",
    sourcePage: 7,
  },
  {
    id: "ck-71",
    chapterId: "ck-ch3",
    questionJa: "凍結前未加熱の冷凍食品や衣をつけたフライなどの半製品の調理法として正しいものはどれか。",
    questionVi: "Cách chế biến đúng cho thực phẩm đông lạnh chưa nấu chín trước khi đông (như đồ chiên có tẩm bột) là gì?",
    options: [
      { ja: "必ず自然解凍してから調理する", vi: "Bắt buộc rã đông tự nhiên rồi mới nấu" },
      { ja: "凍ったまま焼いたり、蒸したり、揚げたりするほか、電子レンジによる解凍や加熱調理をおこなう", vi: "Nướng, hấp, chiên khi còn đông, hoặc rã đông/nấu chín bằng lò vi sóng" },
      { ja: "常温で1日以上放置してから調理する", vi: "Để ở nhiệt độ phòng hơn 1 ngày rồi mới nấu" },
      { ja: "水につけて解凍してから調理する", vi: "Ngâm nước để rã đông rồi mới nấu" },
    ],
    correctIndex: 1,
    explanationVi: "Thực phẩm đông lạnh chưa nấu chín trước khi đông (như đồ chiên tẩm bột bán thành phẩm) được nướng/hấp/chiên ngay khi còn đông, hoặc rã đông/nấu chín bằng lò vi sóng.",
    sourceQuoteJa: "凍結前未加熱の冷凍食品や衣をつけたフライなどのそうざい半製品は凍ったまま焼いたり、蒸したり、揚げたりするほか、電子レンジによる解凍や加熱調理をおこないます。",
    sourcePage: 7,
  },
  {
    id: "ck-72",
    chapterId: "ck-ch3",
    questionJa: "青菜類の冷凍品に「生食用冷凍品」がない理由は何か。",
    questionVi: "Lý do rau xanh đông lạnh KHÔNG có loại 'dùng để ăn sống' là gì?",
    options: [
      { ja: "冷凍すると色が変わらないため", vi: "Vì đông lạnh không làm đổi màu" },
      { ja: "冷凍すると栄養価が上がるため", vi: "Vì đông lạnh làm tăng giá trị dinh dưỡng" },
      { ja: "色を保持するためブランチング（短時間60℃以上の熱を加え酵素を失活させる処理）が必要なため", vi: "Vì cần xử lý blanching (gia nhiệt ngắn ≥60°C để bất hoạt enzyme) nhằm giữ màu" },
      { ja: "青菜類は冷凍できないため", vi: "Vì rau xanh không thể cấp đông được" },
    ],
    correctIndex: 2,
    explanationVi: "Rau xanh khi cấp đông cần xử lý blanching (gia nhiệt ngắn ở ≥60°C để bất hoạt enzyme) nhằm giữ màu, nên không tồn tại loại rau xanh đông lạnh dùng để ăn sống.",
    sourceQuoteJa: "特に青菜類は色を保持するため、ブランチングといって、ごく短時間に６０℃以上の熱を加え、酵素を失活させなければならないため、生食用の冷凍品というものはありません。",
    sourcePage: 7,
  },
  {
    id: "ck-73",
    chapterId: "ck-ch3",
    questionJa: "調理計画を作成することの目的は何か。",
    questionVi: "Mục đích của việc lập kế hoạch nấu ăn là gì?",
    options: [
      { ja: "コストを増やすため", vi: "Để tăng chi phí" },
      { ja: "調理時間を長くするため", vi: "Để kéo dài thời gian nấu" },
      { ja: "スタッフの人数を減らすため", vi: "Để giảm số lượng nhân viên" },
      { ja: "次に何をすべきか、何のためにその作業をするのかを明確化し、作業の効率化及び料理の品質を維持するため", vi: "Làm rõ tiếp theo cần làm gì, làm việc đó để làm gì, từ đó nâng cao hiệu quả công việc và duy trì chất lượng món ăn" },
    ],
    correctIndex: 3,
    explanationVi: "Lập kế hoạch nấu ăn giúp làm rõ tiếp theo cần làm gì và mục đích của công việc đó, từ đó nâng cao hiệu quả làm việc và duy trì chất lượng món ăn.",
    sourceQuoteJa: "調理計画を作成することは、次に何をしなければならないか、何のためにその作業をするのかを明確化し、作業の効率化及び料理の品質を維持することができます。",
    sourcePage: 7,
  },
  {
    id: "ck-74",
    chapterId: "ck-ch3",
    questionJa: "調理マニュアルの主な内容として本文に挙げられていないものはどれか。",
    questionVi: "Nội dung nào KHÔNG được nêu trong bài là nội dung chính của sổ tay hướng dẫn nấu ăn?",
    options: [
      { ja: "顧客のクレーム対応方法", vi: "Cách xử lý khiếu nại của khách" },
      { ja: "食材の仕入、管理方法", vi: "Cách nhập/quản lý nguyên liệu" },
      { ja: "調理工程（下処理、調理、盛り付け手順など）", vi: "Quy trình nấu (sơ chế, nấu, trình bày...)" },
      { ja: "労働安全に関すること", vi: "Về an toàn lao động" },
    ],
    correctIndex: 0,
    explanationVi: "4 nội dung chính được nêu trong sổ tay hướng dẫn nấu ăn là: cách nhập/quản lý nguyên liệu, quy trình nấu (sơ chế, nấu, trình bày...), cách sử dụng/bảo trì thiết bị dụng cụ bếp, và an toàn lao động — không có mục 'cách xử lý khiếu nại của khách'.",
    sourceQuoteJa: "【主な内容】・食材の仕入、管理方法・調理工程（下処理、調理、盛り付け手順など）・厨房機器や調理器具の扱い方、手入れなど・労働安全に関すること",
    sourcePage: 7,
  },
  {
    id: "ck-75",
    chapterId: "ck-ch4",
    questionJa: "２号テキストの「調理機器、器具・備品などに関する注意点」の位置づけとして正しいものはどれか。",
    questionVi: "Vị trí của phần 'Lưu ý về thiết bị, dụng cụ, vật dụng bếp' trong giáo trình cấp 2 là gì?",
    options: [
      { ja: "業務用機器の基本は１号テキストを参照し、２号テキストでは主な機器の使用に関する注意点を紹介する", vi: "Kiến thức cơ bản về thiết bị dùng trong kinh doanh tham khảo giáo trình cấp 1; giáo trình cấp 2 giới thiệu các lưu ý khi sử dụng thiết bị chính" },
      { ja: "２号テキストがすべての機器の基本操作を一から解説する", vi: "Giáo trình cấp 2 giải thích từ đầu cách vận hành cơ bản của mọi thiết bị" },
      { ja: "機器の説明書を読む必要はない", vi: "Không cần đọc sách hướng dẫn sử dụng thiết bị" },
      { ja: "業務用機器についての内容はまったく扱わない", vi: "Hoàn toàn không đề cập đến thiết bị dùng trong kinh doanh" },
    ],
    correctIndex: 0,
    explanationVi: "Kiến thức cơ bản về thiết bị dùng trong kinh doanh tham khảo giáo trình cấp 1; giáo trình cấp 2 chỉ giới thiệu các lưu ý khi sử dụng thiết bị chính, chi tiết cụ thể phải xem sách hướng dẫn sử dụng của từng thiết bị.",
    sourceQuoteJa: "業務用の主な機器については、１号テキストを参照してください。２号テキストでは、主な機器の使用に関する注意点を紹介します。詳細については、必ずご使用の機器の取扱説明書などで確認してください。",
    sourcePage: 7,
  },
  {
    id: "ck-76",
    chapterId: "ck-ch4",
    questionJa: "自動温度調節機能がついている熱機器の確認方法として正しいものはどれか。",
    questionVi: "Cách kiểm tra đúng đối với thiết bị nhiệt có chức năng tự động điều chỉnh nhiệt độ là gì?",
    options: [
      { ja: "説明書を読むだけでよい", vi: "Chỉ cần đọc sách hướng dẫn là đủ" },
      { ja: "設定温度と実際の温度が一致しているか非接触温度計で確認する", vi: "Dùng nhiệt kế không tiếp xúc kiểm tra xem nhiệt độ cài đặt và nhiệt độ thực tế có khớp không" },
      { ja: "1年に1回だけ確認すればよい", vi: "Chỉ cần kiểm tra 1 lần/năm" },
      { ja: "触ってみて熱ければ正常と判断する", vi: "Sờ thấy nóng là coi như bình thường" },
    ],
    correctIndex: 1,
    explanationVi: "Với thiết bị có chức năng tự động điều chỉnh nhiệt độ, phải dùng nhiệt kế không tiếp xúc để kiểm tra xem nhiệt độ cài đặt và nhiệt độ thực tế có khớp nhau không.",
    sourceQuoteJa: "自動温度調節機能がついているものは、設定温度と実際の温度が一致しているか非接触温度計で確認してください。",
    sourcePage: 8,
  },
  {
    id: "ck-77",
    chapterId: "ck-ch4",
    questionJa: "ガスレンジ使用時に換気が不十分だとどうなる危険性があるか。",
    questionVi: "Nếu thông gió không đủ khi dùng bếp gas thì có nguy cơ gì?",
    options: [
      { ja: "ガス代が高くなる", vi: "Tốn thêm tiền gas" },
      { ja: "調理時間が長くなる", vi: "Thời gian nấu lâu hơn" },
      { ja: "一酸化炭素中毒を起こす恐れがあり、最悪の場合死亡事故に至ることがある", vi: "Có nguy cơ ngộ độc khí CO, trường hợp xấu nhất có thể dẫn đến tử vong" },
      { ja: "味が悪くなるだけ", vi: "Chỉ làm vị món ăn kém đi" },
    ],
    correctIndex: 2,
    explanationVi: "Nếu thông gió không đủ khi dùng bếp gas, có nguy cơ ngộ độc khí CO (một oxit cacbon), trường hợp xấu nhất có thể dẫn đến tử vong.",
    sourceQuoteJa: "換気が不十分だと一酸化炭素中毒を起こす恐れがあり、最悪の場合、死亡事故に至ることがあります。",
    sourcePage: 8,
  },
  {
    id: "ck-78",
    chapterId: "ck-ch4",
    questionJa: "バーナーキャップとその周りに汚れがこびりついているとどうなるか。",
    questionVi: "Nếu chất bẩn bám vào nắp mỏ đốt (バーナーキャップ) và xung quanh thì điều gì xảy ra?",
    options: [
      { ja: "火力が強くなりすぎる", vi: "Lửa mạnh lên quá mức" },
      { ja: "ガスの消費量が減る", vi: "Lượng gas tiêu thụ giảm" },
      { ja: "特に問題は起きない", vi: "Không có vấn đề gì đặc biệt" },
      { ja: "火がつかない、火が小さい、火が途中で消えるなど様々なトラブルにつながる", vi: "Dẫn đến nhiều sự cố như không bắt lửa, lửa nhỏ, lửa tắt giữa chừng" },
    ],
    correctIndex: 3,
    explanationVi: "Nếu chất bẩn bám vào nắp mỏ đốt và xung quanh, sẽ dẫn đến nhiều sự cố như không bắt lửa, lửa nhỏ, lửa tắt giữa chừng; luôn loại bỏ dầu mỡ/nước tràn dính vào và giữ mỏ đốt sạch sẽ để phòng ngừa hỏng hóc.",
    sourceQuoteJa: "バーナーキャップとその周りに汚れがこびりついていると、火がつかない、火が小さい、火が途中で消えるなど様々なトラブルにつながります。",
    sourcePage: 8,
  },
  {
    id: "ck-79",
    chapterId: "ck-ch4",
    questionJa: "スチームコンベクションオーブンを掃除する正しい手順はどれか。",
    questionVi: "Quy trình dọn dẹp đúng cho lò hấp-nướng đối lưu hơi nước (Combi Oven) là gì?",
    options: [
      { ja: "庫内の温度を下げ、電源を切ってから掃除をおこなう", vi: "Hạ nhiệt độ bên trong, tắt nguồn rồi mới dọn dẹp" },
      { ja: "電源を入れたまま掃除する", vi: "Dọn dẹp trong khi vẫn bật nguồn" },
      { ja: "庫内が高温のうちにすぐ掃除する", vi: "Dọn dẹp ngay khi bên trong còn nóng" },
      { ja: "水をかけるだけで掃除は不要", vi: "Chỉ cần xối nước là không cần dọn dẹp gì thêm" },
    ],
    correctIndex: 0,
    explanationVi: "Phải hạ nhiệt độ bên trong lò và tắt nguồn trước khi dọn dẹp; nếu thiết bị có chức năng tự làm sạch thì làm theo sách hướng dẫn.",
    sourceQuoteJa: "庫内の温度を下げ、電源を切ってから掃除をおこなってください。",
    sourcePage: 8,
  },
  {
    id: "ck-80",
    chapterId: "ck-ch4",
    questionJa: "加熱調理直後のスチームコンベクションオーブンで注意すべきことは何か。",
    questionVi: "Điều cần lưu ý với lò Combi Oven ngay sau khi nấu chín là gì?",
    options: [
      { ja: "すぐに扉を大きく開けてよい", vi: "Có thể mở rộng cửa ngay lập tức" },
      { ja: "庫内に高温の水蒸気が充満しているため、急に扉を開けると手や顔にやけどをする危険がある", vi: "Vì hơi nước nóng đầy bên trong, mở cửa đột ngột có nguy cơ bỏng tay/mặt" },
      { ja: "庫内の掃除をすぐにおこなう", vi: "Dọn dẹp bên trong ngay lập tức" },
      { ja: "特に注意点はない", vi: "Không có lưu ý gì đặc biệt" },
    ],
    correctIndex: 1,
    explanationVi: "Ngay sau khi nấu chín, bên trong lò Combi Oven đầy hơi nước nóng, nên mở cửa đột ngột có nguy cơ gây bỏng tay hoặc mặt.",
    sourceQuoteJa: "加熱調理直後の庫内には高温の水蒸気が充満しており、急にとびらを開けることで、手や顔にやけどをすることのないように注意が必要です。",
    sourcePage: 8,
  },
  {
    id: "ck-81",
    chapterId: "ck-ch4",
    questionJa: "フライヤーの油の交換基準として正しいものはどれか。",
    questionVi: "Tiêu chuẩn thay dầu của máy chiên (fryer) đúng là gì?",
    options: [
      { ja: "毎日必ず交換する", vi: "Bắt buộc thay mỗi ngày" },
      { ja: "1週間に1回交換すればよい", vi: "Chỉ cần thay 1 lần/tuần" },
      { ja: "油の酸化値（AV値）が3.0以上であれば、その日の営業終了時に油を交換する", vi: "Nếu chỉ số oxy hóa (AV) từ 3.0 trở lên thì thay dầu vào cuối ca làm việc ngày đó" },
      { ja: "色が変わるまでは交換不要", vi: "Chưa đổi màu thì không cần thay" },
    ],
    correctIndex: 2,
    explanationVi: "Cần kiểm tra chỉ số oxy hóa của dầu (AV value); nếu dưới 3.0 là bình thường, nếu từ 3.0 trở lên phải thay dầu vào cuối ca làm việc ngày đó.",
    sourceQuoteJa: "フライヤーの油の酸化値（AV 値３．０未満）が正常か確認してください。AV 値３．０以上であれば、その日の営業終了時に油を交換してください。",
    sourcePage: 8,
  },
  {
    id: "ck-82",
    chapterId: "ck-ch4",
    questionJa: "立体式炊飯器・卓上炊飯器で炊きあがったライスを提供する前に必ずおこなうべきことは何か。",
    questionVi: "Trước khi phục vụ cơm nấu từ nồi cơm dạng đứng/để bàn, việc bắt buộc phải làm là gì?",
    options: [
      { ja: "写真を撮る", vi: "Chụp ảnh lại" },
      { ja: "重さを量る", vi: "Cân trọng lượng" },
      { ja: "そのまま提供する", vi: "Phục vụ luôn không kiểm tra" },
      { ja: "必ず試食し、異常がある場合は提供せずオーダーストップするなどの対応を取る", vi: "Bắt buộc nếm thử; nếu có bất thường thì không phục vụ và dừng nhận đơn món đó" },
    ],
    correctIndex: 3,
    explanationVi: "Cơm nấu từ nồi cơm dạng đứng/để bàn phải được nếm thử trước; nếu phát hiện bất thường thì không phục vụ mà phải dừng nhận đơn (oder stop) hoặc xử lý phù hợp. Các thiết bị nhiệt khác (nồi hấp, máy nấu mì, bàn nướng griddle, lò nướng bánh xèo, chảo quay...) cũng cần kiểm tra định kỳ tương tự theo cùng nguyên tắc.",
    sourceQuoteJa: "立体式炊飯器、卓上炊飯器で炊きあがったライスは必ず試食してください。異常がある場合は、提供しないで、オーダーストップするなどの対応を取ってください。",
    sourcePage: 8,
  },
  {
    id: "ck-83",
    chapterId: "ck-ch4",
    questionJa: "冷機器を使用する目的として正しいものはどれか。",
    questionVi: "Mục đích sử dụng thiết bị làm lạnh là gì?",
    options: [
      { ja: "食品の保存、加熱後冷却が必要な食品について急速冷凍などをおこなう", vi: "Bảo quản thực phẩm, và cấp đông nhanh cho thực phẩm cần làm lạnh sau khi nấu" },
      { ja: "食品を温めるため", vi: "Để làm nóng thực phẩm" },
      { ja: "調理時間を短縮するため", vi: "Để rút ngắn thời gian nấu" },
      { ja: "味付けをするため", vi: "Để nêm gia vị" },
    ],
    correctIndex: 0,
    explanationVi: "Thiết bị làm lạnh dùng để bảo quản thực phẩm, và thực hiện cấp đông nhanh cho các thực phẩm cần làm lạnh sau khi nấu.",
    sourceQuoteJa: "食品の保存、加熱後冷却が必要な食品について急速冷凍などをおこないます。",
    sourcePage: 8,
  },
  {
    id: "ck-84",
    chapterId: "ck-ch4",
    questionJa: "冷蔵庫・冷凍庫で雑菌が付きやすい箇所はどこか。",
    questionVi: "Vị trí nào trong tủ lạnh/tủ đông dễ bám vi khuẩn?",
    options: [
      { ja: "庫内の中央部分のみ", vi: "Chỉ phần chính giữa bên trong" },
      { ja: "扉、取っ手、扉パッキン、扉下部", vi: "Cửa, tay nắm, gioăng cửa, phần dưới cửa" },
      { ja: "冷却装置の真裏のみ", vi: "Chỉ mặt sau thiết bị làm lạnh" },
      { ja: "どこにも雑菌はつかない", vi: "Không nơi nào bị bám vi khuẩn" },
    ],
    correctIndex: 1,
    explanationVi: "Cửa, tay nắm, gioăng cửa, phần dưới cửa là những nơi dễ bám vi khuẩn tạp trong tủ lạnh/tủ đông; cần vệ sinh và luôn giữ sạch sẽ.",
    sourceQuoteJa: "扉、取っ手、扉パッキン、扉下部は雑菌の付きやすいところです。掃除して常に清潔にしてください。",
    sourcePage: 9,
  },
  {
    id: "ck-85",
    chapterId: "ck-ch4",
    questionJa: "氷用スコップの衛生管理について正しいものはどれか。",
    questionVi: "Quản lý vệ sinh muỗng xúc đá đúng là gì?",
    options: [
      { ja: "製氷皿の中に入れっぱなしにしてよい", vi: "Có thể để nguyên trong khay làm đá" },
      { ja: "特に管理する必要はない", vi: "Không cần quản lý gì đặc biệt" },
      { ja: "不特定多数が触れるため菌の付着が多く、製氷皿や貯氷ケースの外に衛生的に保管する", vi: "Vì nhiều người chạm vào nên dễ bám vi khuẩn, phải bảo quản bên ngoài khay/hộp đựng đá một cách vệ sinh" },
      { ja: "洗浄は月に1回でよい", vi: "Chỉ cần rửa 1 lần/tháng" },
    ],
    correctIndex: 2,
    explanationVi: "Muỗng xúc đá là vật nhiều người chạm vào nên dễ bám vi khuẩn tạp; phải bảo quản bên ngoài khay làm đá hoặc hộp đựng đá một cách vệ sinh.",
    sourceQuoteJa: "氷用スコップは製氷皿や貯氷ケースの外に衛生的に保管されていることを確認してください。（スコップは不特定多数が触れるものなので菌の付着が多い）",
    sourcePage: 9,
  },
  {
    id: "ck-86",
    chapterId: "ck-ch4",
    questionJa: "洗浄機器をトラブルなく使用することが重要な理由は何か。",
    questionVi: "Lý do việc sử dụng máy rửa không gặp sự cố là quan trọng là gì?",
    options: [
      { ja: "電気代を節約できるため", vi: "Vì tiết kiệm được tiền điện" },
      { ja: "従業員の負担が減るため", vi: "Vì giảm gánh nặng cho nhân viên" },
      { ja: "見た目がきれいになるため", vi: "Vì hình thức đẹp hơn" },
      { ja: "食器の回転数が飲食店の売り上げに直結するため", vi: "Vì tốc độ quay vòng bát đĩa liên quan trực tiếp đến doanh thu nhà hàng" },
    ],
    correctIndex: 3,
    explanationVi: "Vì tốc độ quay vòng bát đĩa liên quan trực tiếp đến doanh thu nhà hàng, nên việc sử dụng máy rửa không gặp sự cố là điểm quan trọng.",
    sourceQuoteJa: "食器の回転数が飲食店の売り上げに直結するため、トラブルなく洗浄機器を使用することが重要なポイントとなります。",
    sourcePage: 9,
  },
  {
    id: "ck-87",
    chapterId: "ck-ch4",
    questionJa: "洗浄機の洗浄温度・すすぎ温度の基準として正しいものはどれか。",
    questionVi: "Tiêu chuẩn nhiệt độ rửa/tráng của máy rửa đúng là gì?",
    options: [
      { ja: "洗浄温度は60～70℃、すすぎ温度は80～90℃が基本", vi: "Nhiệt độ rửa 60-70°C, nhiệt độ tráng 80-90°C" },
      { ja: "洗浄温度もすすぎ温度も常温でよい", vi: "Cả hai nhiệt độ đều để nhiệt độ phòng là được" },
      { ja: "洗浄温度は100℃以上が基本", vi: "Nhiệt độ rửa cơ bản trên 100°C" },
      { ja: "すすぎ温度は洗浄温度より低くする", vi: "Nhiệt độ tráng thấp hơn nhiệt độ rửa" },
    ],
    correctIndex: 0,
    explanationVi: "Nhiệt độ rửa cơ bản 60-70°C, nhiệt độ tráng cơ bản 80-90°C (có pha chất trợ tráng).",
    sourceQuoteJa: "洗浄温度は６０～７０℃が基本です。すすぎ温度は８０～９０℃が基本です。（リンス剤添加）",
    sourcePage: 9,
  },
  {
    id: "ck-88",
    chapterId: "ck-ch4",
    questionJa: "包丁及びまな板の正しい使い分け方はどれか。",
    questionVi: "Cách phân loại dao/thớt đúng là gì?",
    options: [
      { ja: "すべて同じものを使い回す", vi: "Dùng chung một loại cho mọi việc" },
      { ja: "肉用、野菜用、下処理用などに分類し、使い分ける", vi: "Phân loại thành dùng cho thịt, rau, sơ chế... và dùng riêng biệt" },
      { ja: "毎日ランダムに交換して使う", vi: "Đổi ngẫu nhiên mỗi ngày" },
      { ja: "高価なものだけを使う", vi: "Chỉ dùng loại đắt tiền" },
    ],
    correctIndex: 1,
    explanationVi: "Dao và thớt phải được phân loại thành dùng cho thịt, rau, sơ chế... và dùng riêng biệt.",
    sourceQuoteJa: "包丁及びまな板は肉用、野菜用、下処理用などに分類し、使い分けてください。",
    sourcePage: 9,
  },
  {
    id: "ck-89",
    chapterId: "ck-ch4",
    questionJa: "鋼製の包丁の手入れとして正しいものはどれか。",
    questionVi: "Cách bảo dưỡng dao thép đúng là gì?",
    options: [
      { ja: "水気を残したまま保管する", vi: "Bảo quản khi vẫn còn nước" },
      { ja: "洗浄は1週間に1回でよい", vi: "Chỉ cần rửa 1 lần/tuần" },
      { ja: "使用後すぐ洗浄し、しっかり水気をふき取る。アルコールをかけた場合も蒸発後に水分が残るので清潔なペーパーで水気をふき取る", vi: "Rửa ngay sau khi dùng và lau khô kỹ; nếu xịt cồn cũng phải lau khô bằng khăn sạch vì hơi nước còn đọng lại sau khi cồn bay hơi" },
      { ja: "研ぐ必要はない", vi: "Không cần mài dao" },
    ],
    correctIndex: 2,
    explanationVi: "Dao thép dễ gỉ nên phải rửa ngay sau khi dùng và lau khô kỹ; nếu xịt cồn khi bảo quản, sau khi cồn bay hơi vẫn còn nước đọng lại nên phải lau khô bằng khăn giấy sạch.",
    sourceQuoteJa: "使用後の包丁とまな板は使用したらすぐに洗浄します。特に鋼製の包丁はさびやすいので、洗浄後、水気をふき取ります。保管の際にアルコールをかけた場合、蒸発すると水分が残りますので、清潔なペーパーで水気をふき取ってください。",
    sourcePage: 9,
  },
  {
    id: "ck-90",
    chapterId: "ck-ch4",
    questionJa: "まな板の正しい保管方法はどれか。",
    questionVi: "Cách bảo quản thớt đúng là gì?",
    options: [
      { ja: "水に浸けたまま保管する", vi: "Ngâm trong nước để bảo quản" },
      { ja: "重ねて保管する", vi: "Xếp chồng lên nhau để bảo quản" },
      { ja: "傷がついた面を下にして保管する", vi: "Để mặt bị xước xuống dưới" },
      { ja: "壁に立てかけず、まな板全体が乾燥する状態で保管する", vi: "Không dựa vào tường, bảo quản ở trạng thái toàn bộ thớt được khô ráo" },
    ],
    correctIndex: 3,
    explanationVi: "Thớt không nên dựa vào tường mà phải bảo quản ở trạng thái toàn bộ thớt khô ráo được.",
    sourceQuoteJa: "まな板は壁に立てかけず、まな板全体が乾燥する状態で保管してください。",
    sourcePage: 9,
  },
  {
    id: "ck-91",
    chapterId: "ck-ch4",
    questionJa: "刺身を切るときに主に使用する包丁はどれか。",
    questionVi: "Loại dao chủ yếu dùng để cắt sashimi là gì?",
    options: [
      { ja: "柳刃包丁（刺身包丁）", vi: "Dao Yanagiba (dao sashimi)" },
      { ja: "出刃包丁", vi: "Dao Deba" },
      { ja: "菜切包丁", vi: "Dao Nakiri" },
      { ja: "中華包丁", vi: "Dao Trung Hoa" },
    ],
    correctIndex: 0,
    explanationVi: "Dao Yanagiba (柳刃包丁): lưỡi dài, chủ yếu dùng để cắt sashimi, còn được gọi là 'dao sashimi'.",
    sourceQuoteJa: "柳刃包丁：刃渡りが長く、主に刺身を切るときに使用する包丁で「刺身包丁」とも呼びます。",
    sourcePage: 9,
  },
  {
    id: "ck-92",
    chapterId: "ck-ch4",
    questionJa: "出刃包丁の特徴として正しいものはどれか。",
    questionVi: "Đặc điểm của dao Deba (出刃包丁) là gì?",
    options: [
      { ja: "刃が非常に薄く軽い", vi: "Lưỡi rất mỏng và nhẹ" },
      { ja: "魚をさばくときに使用し、重みがあり刃に厚みもあるため骨を切ることもできる", vi: "Dùng để mổ cá, có trọng lượng và lưỡi dày nên có thể cắt được cả xương" },
      { ja: "野菜専用の包丁である", vi: "Là dao chuyên dùng cho rau" },
      { ja: "中華料理専用の包丁である", vi: "Là dao chuyên dùng cho món Trung Hoa" },
    ],
    correctIndex: 1,
    explanationVi: "Dao Deba (出刃包丁) dùng để mổ cá; có trọng lượng và lưỡi dày nên có thể cắt được cả xương.",
    sourceQuoteJa: "出刃包丁：魚をさばくときに使用する包丁です。重みがあり、刃に厚みもあるため、骨を切ったりすることもできます。",
    sourcePage: 9,
  },
  {
    id: "ck-93",
    chapterId: "ck-ch4",
    questionJa: "菜切包丁と薄刃包丁の違いとして正しいものはどれか。",
    questionVi: "Sự khác biệt giữa dao Nakiri và dao Usuba đúng là gì?",
    options: [
      { ja: "どちらも刺身専用の包丁である", vi: "Cả hai đều là dao chuyên dùng cắt sashimi" },
      { ja: "菜切包丁は魚専用、薄刃包丁は肉専用である", vi: "Dao Nakiri chuyên dùng cho cá, dao Usuba chuyên dùng cho thịt" },
      { ja: "どちらも野菜用の和包丁だが、菜切包丁はみじん切り・千切りがしやすく、薄刃包丁は皮むきや刻むのに適している", vi: "Cả hai đều là dao Nhật dùng cho rau, nhưng dao Nakiri dễ thái nhỏ/thái sợi, dao Usuba thích hợp gọt vỏ và thái nhỏ" },
      { ja: "どちらも中華料理専用の包丁である", vi: "Cả hai đều là dao chuyên dùng cho món Trung Hoa" },
    ],
    correctIndex: 2,
    explanationVi: "Dao Nakiri (菜切包丁) và dao Usuba (薄刃包丁) đều là dao Nhật thích hợp cắt rau; Nakiri dễ thái nhỏ/thái sợi hơn dao đa năng Santoku, Usuba thích hợp gọt vỏ và thái nhỏ.",
    sourceQuoteJa: "菜切包丁：日本の和包丁で、野菜を切ることに適しています。三徳包丁に比べ、野菜のみじん切りや千切りなどがしやすいです。薄刃包丁：菜切包丁と同じく日本の和包丁で、野菜を切ることに適しています。野菜の皮むきや、刻むのに適しています。",
    sourcePage: 10,
  },
  {
    id: "ck-94",
    chapterId: "ck-ch4",
    questionJa: "牛刀と三徳包丁の違いとして正しいものはどれか。",
    questionVi: "Sự khác biệt giữa dao bò (牛刀) và dao Santoku (三徳包丁) đúng là gì?",
    options: [
      { ja: "牛刀は野菜専用、三徳包丁は魚専用である", vi: "Dao bò chuyên dùng cho rau, dao Santoku chuyên dùng cho cá" },
      { ja: "どちらも刺身専用の包丁である", vi: "Cả hai đều là dao chuyên dùng cắt sashimi" },
      { ja: "三徳包丁のほうが牛刀より刃渡りが長い", vi: "Dao Santoku có lưỡi dài hơn dao bò" },
      { ja: "牛刀はもともと肉専用包丁だが肉以外にも使用でき、三徳包丁は肉・魚・野菜など様々な食材に使用できる", vi: "Dao bò vốn là dao chuyên dùng cho thịt nhưng cũng dùng được cho loại khác, dao Santoku dùng được cho nhiều loại thực phẩm như thịt, cá, rau" },
    ],
    correctIndex: 3,
    explanationVi: "Dao bò (牛刀) vốn được thiết kế chuyên dùng cho thịt nhưng cũng cắt được cả cá và rau; dao Santoku (三徳包丁) là dao đa năng dùng được cho nhiều loại thực phẩm như thịt, cá, rau.",
    sourceQuoteJa: "牛刀：もともとは肉専用包丁として設定されましたが、肉以外にも魚や野菜などを切ることにも使用できます。三徳包丁：肉、魚、野菜など様々な食材に使用できる包丁です。",
    sourcePage: 10,
  },
  {
    id: "ck-95",
    chapterId: "ck-ch4",
    questionJa: "キッチンポットやホテルパンなどの容器を洗浄するときに絶対に使用してはいけないものはどれか。",
    questionVi: "Vật dụng nào TUYỆT ĐỐI không được dùng khi rửa các dụng cụ như nồi bếp, khay chứa thức ăn?",
    options: [
      { ja: "スチールたわし", vi: "Búi cọ thép" },
      { ja: "スポンジ", vi: "Miếng bọt biển" },
      { ja: "中性洗剤", vi: "Chất tẩy rửa trung tính" },
      { ja: "布巾", vi: "Khăn lau" },
    ],
    correctIndex: 0,
    explanationVi: "Khi rửa các dụng cụ như nồi bếp, khay chứa thức ăn, phải dùng miếng bọt biển; tuyệt đối không được dùng búi cọ thép.",
    sourceQuoteJa: "キッチンポット、ホテルパン（フードパン）、ケーキバット（角盆）、ボールを洗浄するときは、スポンジを使いスチールたわしは絶対に使用しないでください。",
    sourcePage: 10,
  },
  {
    id: "ck-96",
    chapterId: "ck-ch4",
    questionJa: "フッ素加工のフライパンを手入れするときの正しい方法はどれか。",
    questionVi: "Cách bảo dưỡng đúng cho chảo chống dính (フッ素加工) là gì?",
    options: [
      { ja: "使用直後、熱いうちに水をかけて急冷する", vi: "Xối nước làm nguội ngay khi còn nóng ngay sau khi dùng" },
      { ja: "柔らかいスポンジと中性洗剤で洗い、使用直後の熱いうちに急に冷やさないようにする", vi: "Rửa bằng miếng bọt biển mềm và chất tẩy rửa trung tính, không làm nguội đột ngột khi còn nóng ngay sau khi dùng" },
      { ja: "スチールたわしでこすり洗いする", vi: "Cọ rửa bằng búi cọ thép" },
      { ja: "洗剤を使わず水だけで洗う", vi: "Chỉ rửa bằng nước, không dùng chất tẩy rửa" },
    ],
    correctIndex: 1,
    explanationVi: "Chảo chống dính phải được rửa bằng miếng bọt biển mềm và chất tẩy rửa trung tính; không được làm nguội đột ngột (xối nước) khi còn nóng ngay sau khi dùng vì sẽ làm bong tróc lớp phủ bề mặt.",
    sourceQuoteJa: "フッ素加工のフライパンは焦げ付かないように表面に特殊な加工をしています。使い終わったら、表面の加工を傷めないように、柔らかいスポンジと中性洗剤で十分に洗ってください。なお、使用直後の熱いうちに水をかけるなどして急に冷やすと表面が剥がれたりしますので、急に冷やさないでください。",
    sourcePage: 10,
  },
  {
    id: "ck-97",
    chapterId: "ck-ch4",
    questionJa: "鉄フライパンの特徴と手入れ方法として正しいものはどれか。",
    questionVi: "Đặc điểm và cách bảo dưỡng chảo gang (鉄フライパン) đúng là gì?",
    options: [
      { ja: "熱が伝わりにくいので弱火向き", vi: "Khó truyền nhiệt nên hợp lửa nhỏ" },
      { ja: "洗浄後は油をすべて拭き取る", vi: "Sau khi rửa phải lau sạch hết dầu" },
      { ja: "熱が伝わりやすく強火で手早く調理するものに向いており、使用後はたわしで洗い、水気をとばしてから内側に油をすり込む", vi: "Truyền nhiệt nhanh, hợp nấu nhanh bằng lửa lớn; sau khi dùng rửa bằng bàn chải, làm bay hết nước rồi xoa dầu vào mặt trong" },
      { ja: "洗浄は不要である", vi: "Không cần rửa" },
    ],
    correctIndex: 2,
    explanationVi: "Chảo gang truyền nhiệt nhanh nên hợp nấu nhanh bằng lửa lớn; sau khi dùng rửa bằng bàn chải khi còn ấm, lau khô nước, đun lửa vừa cho bay hết hơi nước rồi dùng khăn giấy xoa một lớp dầu mỏng vào mặt trong.",
    sourceQuoteJa: "鉄フライパンは熱が伝わりやすいので、強火で手早く調理するものに向いています。鉄フライパンは使用後、温かいうちにたわしなどで洗います。洗い終わった後は、水気をふき取り、中火で加熱し、完全に水気をとばします。キッチンペーパーなどを使用し、内側に油をすり込むように塗ります。",
    sourcePage: 10,
  },
  {
    id: "ck-98",
    chapterId: "ck-ch4",
    questionJa: "計測機器類の管理について正しいものはどれか。",
    questionVi: "Quản lý thiết bị đo lường đúng là gì?",
    options: [
      { ja: "精密機械ではないので特に管理は不要", vi: "Không phải máy móc chính xác nên không cần quản lý gì đặc biệt" },
      { ja: "1度設置したら移動しても確認不要", vi: "Đã lắp đặt 1 lần thì di chuyển cũng không cần kiểm tra lại" },
      { ja: "汚れや振動は精度に影響しない", vi: "Bụi bẩn và rung động không ảnh hưởng đến độ chính xác" },
      { ja: "精密機械なので汚れや振動が精度に影響することがあり、定期的に正しく計測できているか確認する必要がある", vi: "Vì là máy móc chính xác, bụi bẩn hoặc rung động có thể ảnh hưởng đến độ chính xác, cần kiểm tra định kỳ" },
    ],
    correctIndex: 3,
    explanationVi: "Thiết bị đo lường là máy móc chính xác nên bụi bẩn hoặc rung động có thể ảnh hưởng đến độ chính xác của phép đo; cần kiểm tra định kỳ xem có đo đúng và có hỏng hóc không. Khi di chuyển máy đo, bắt buộc phải kiểm tra lại hoạt động.",
    sourceQuoteJa: "計測機器類は精密機械なので、汚れや振動などが計測の精度に影響を及ぼすことがあります。正しく計測できているか、故障はないかなど定期的に確認する必要があります。",
    sourcePage: 10,
  },
  {
    id: "ck-99",
    chapterId: "ck-ch4",
    questionJa: "温度計の精度が低くなっている場合、どのようなリスクがあるか。",
    questionVi: "Nếu độ chính xác của nhiệt kế giảm xuống thì có rủi ro gì?",
    options: [
      { ja: "食品事故につながる可能性があるため、定期的に正しく計測できているか点検（校正）をおこなう必要がある", vi: "Có thể dẫn đến sự cố an toàn thực phẩm, nên cần kiểm tra (hiệu chuẩn) định kỳ" },
      { ja: "特にリスクはない", vi: "Không có rủi ro gì đặc biệt" },
      { ja: "料理の見た目が悪くなるだけ", vi: "Chỉ làm hình thức món ăn kém đi" },
      { ja: "コストが下がるので問題ない", vi: "Chi phí giảm nên không vấn đề gì" },
    ],
    correctIndex: 0,
    explanationVi: "Vì lý do phòng chống ngộ độc thực phẩm, quản lý nhiệt độ rất quan trọng; nếu độ chính xác của nhiệt kế giảm xuống có thể dẫn đến sự cố an toàn thực phẩm, nên phải định kỳ kiểm tra (hiệu chuẩn) xem nhiệt kế có đo chính xác không.",
    sourceQuoteJa: "食中毒対策などのため、温度管理は重要です。温度計の精度が低くなっている場合、食品事故につながります。定期的に温度計が正しく計測できているか点検（校正）をおこないましょう。",
    sourcePage: 10,
  },
  {
    id: "ck-100",
    chapterId: "ck-ch4",
    questionJa: "鍋の素材を選ぶときに考慮すべき要素として正しいものはどれか。",
    questionVi: "Yếu tố cần cân nhắc khi chọn chất liệu nồi là gì?",
    options: [
      { ja: "色だけで選べばよい", vi: "Chỉ cần chọn theo màu sắc" },
      { ja: "用途、価格、耐久性、熱源の種類などを考えて使い分ける", vi: "Cân nhắc công dụng, giá cả, độ bền, loại nguồn nhiệt để dùng phù hợp" },
      { ja: "重さだけで選べばよい", vi: "Chỉ cần chọn theo trọng lượng" },
      { ja: "素材はすべて同じなので考慮不要", vi: "Chất liệu nào cũng như nhau nên không cần cân nhắc" },
    ],
    correctIndex: 1,
    explanationVi: "Chất liệu nồi có nhiều loại (sắt, inox, nhôm, hợp kim nhôm anodized, đồng, thủy tinh, gốm sứ/nồi đất...) với hình dáng, đáy, độ sâu, độ dày khác nhau; cần cân nhắc công dụng, giá cả, độ bền, loại nguồn nhiệt để chọn dùng phù hợp.",
    sourceQuoteJa: "鍋の素材は鉄、ステンレス、アルミニウム、アルマイト、銅、ガラス、陶磁器（土鍋）などがあり、形、底、深さ、厚みが異なるものがあります。用途、価格、耐久性、熱源の種類などを考えて使い分けます。",
    sourcePage: 10,
  },
  {
    id: "ck-101",
    chapterId: "ck-ch5",
    questionJa: "飲食店の労働災害で最も多い事故は何か。",
    questionVi: "Loại tai nạn lao động phổ biến nhất tại nhà hàng là gì?",
    options: [
      { ja: "転倒（全体の約3割を占める）", vi: "Té ngã (chiếm khoảng 30% tổng số)" },
      { ja: "切れ・こすれ", vi: "Đứt/trầy xước" },
      { ja: "高温・低温物との接触", vi: "Tiếp xúc vật nóng/lạnh" },
      { ja: "動作の反動・無理な動作", vi: "Phản lực động tác/động tác gắng sức" },
    ],
    correctIndex: 0,
    explanationVi: "Tai nạn lao động phổ biến nhất tại nhà hàng là 'té ngã', chiếm khoảng 30% tổng số.",
    sourceQuoteJa: "飲食店での労働災害で最も多い事故は「転倒」で全体の約３割を占めています。",
    sourcePage: 11,
  },
  {
    id: "ck-102",
    chapterId: "ck-ch5",
    questionJa: "飲食店の労働災害で「転倒」に次いで多い事故の順として正しいものはどれか。",
    questionVi: "Thứ tự các tai nạn lao động phổ biến sau 'té ngã' tại nhà hàng đúng là gì?",
    options: [
      { ja: "高温・低温物との接触→切れ・こすれ→動作の反動・無理な動作", vi: "Tiếp xúc vật nóng/lạnh → Đứt/trầy xước → Phản lực động tác" },
      { ja: "切れ・こすれ→高温・低温物との接触→動作の反動・無理な動作", vi: "Đứt/trầy xước → Tiếp xúc vật nóng/lạnh → Phản lực động tác" },
      { ja: "動作の反動・無理な動作→切れ・こすれ→高温・低温物との接触", vi: "Phản lực động tác → Đứt/trầy xước → Tiếp xúc vật nóng/lạnh" },
      { ja: "転倒以外の事故はほとんど発生しない", vi: "Hầu như không có tai nạn nào khác ngoài té ngã" },
    ],
    correctIndex: 1,
    explanationVi: "Sau 'té ngã', thứ tự tiếp theo là: 'đứt/trầy xước' → 'tiếp xúc vật nóng/lạnh' → 'phản lực động tác/động tác gắng sức'.",
    sourceQuoteJa: "次に「切れ・こすれ」、「高温・低温物との接触」、「動作の反動・無理な動作」の順となっています。",
    sourcePage: 11,
  },
  {
    id: "ck-103",
    chapterId: "ck-ch5",
    questionJa: "飲食店の事故類別で全産業と比較して高いものとして正しいものはどれか。",
    questionVi: "Loại tai nạn nào ở nhà hàng cao hơn so với trung bình toàn ngành?",
    options: [
      { ja: "転倒のみ", vi: "Chỉ có té ngã" },
      { ja: "動作の反動・無理な動作のみ", vi: "Chỉ có phản lực động tác" },
      { ja: "「切れ・こすれ」、「高温・低温物との接触」であり、過去5年間減少していない", vi: "'Đứt/trầy xước' và 'tiếp xúc vật nóng/lạnh', không giảm trong 5 năm qua" },
      { ja: "全産業よりすべての事故が低い", vi: "Mọi loại tai nạn đều thấp hơn toàn ngành" },
    ],
    correctIndex: 2,
    explanationVi: "So với trung bình toàn ngành, tại nhà hàng 'đứt/trầy xước' và 'tiếp xúc vật nóng/lạnh' cao hơn, và không có xu hướng giảm trong 5 năm qua.",
    sourceQuoteJa: "事故の類別で全産業と比較して高いものは「切れ・こすれ」、「高温・低温物との接触」であり、これは、過去５年間減少していません。",
    sourcePage: 11,
  },
  {
    id: "ck-104",
    chapterId: "ck-ch5",
    questionJa: "飲食店に特徴的な労働災害の状況として正しいものはどれか。",
    questionVi: "Tình trạng đặc trưng về tai nạn lao động tại nhà hàng là gì?",
    options: [
      { ja: "高齢者の被災が目立つ", vi: "Người cao tuổi bị nạn nhiều" },
      { ja: "労働災害はほとんど発生しない", vi: "Hầu như không xảy ra tai nạn lao động" },
      { ja: "労働災害は主に厨房外で発生する", vi: "Tai nạn lao động chủ yếu xảy ra ngoài bếp" },
      { ja: "若年層の労働者が多く、その被災が目立っている", vi: "Có nhiều lao động trẻ tuổi, và họ bị nạn nhiều nổi bật" },
    ],
    correctIndex: 3,
    explanationVi: "Đặc trưng của nhà hàng là có nhiều lao động trẻ tuổi, và tỷ lệ họ bị tai nạn lao động nổi bật hơn.",
    sourceQuoteJa: "飲食店に特徴的な状況として、若年層の労働者が多く、その被災が目立っています。",
    sourcePage: 11,
  },
  {
    id: "ck-105",
    chapterId: "ck-ch5",
    questionJa: "飲食店における労働安全管理の現状の課題は何か。",
    questionVi: "Vấn đề hiện tại về quản lý an toàn lao động tại nhà hàng là gì?",
    options: [
      { ja: "法令上の義務付けがないことから、安全面からの取組は十分におこなわれていない", vi: "Vì không có quy định pháp luật bắt buộc, nên các biện pháp an toàn chưa được thực hiện đầy đủ" },
      { ja: "法令の規制が厳しすぎる", vi: "Quy định pháp luật quá khắt khe" },
      { ja: "すべての店舗ですでに十分対策済み", vi: "Mọi cửa hàng đều đã có biện pháp đầy đủ" },
      { ja: "労働災害は法律で完全に防止されている", vi: "Tai nạn lao động đã được luật pháp phòng ngừa hoàn toàn" },
    ],
    correctIndex: 0,
    explanationVi: "Tai nạn 'té ngã' và 'đứt/trầy xước' chiếm phần lớn tại nhà hàng, nhưng vì không có quy định pháp luật bắt buộc, nên thực tế các biện pháp an toàn chưa được thực hiện đầy đủ.",
    sourceQuoteJa: "飲食店における労働災害は「転倒」、「切れ・こすれ」が多くを占めていますが、法令上の義務付けがないことから、安全面からの取組は十分におこなわれていない現状があります。",
    sourcePage: 11,
  },
  {
    id: "ck-106",
    chapterId: "ck-ch5",
    questionJa: "飲食店で労働災害を防止するための具体的な取り組みとして正しいものはどれか。",
    questionVi: "Biện pháp cụ thể để phòng ngừa tai nạn lao động tại nhà hàng là gì?",
    options: [
      { ja: "特に対策は不要", vi: "Không cần biện pháp gì đặc biệt" },
      { ja: "労働安全の担当者を決め、防止に向けた取り組みをおこなう", vi: "Chỉ định người phụ trách an toàn lao động, thực hiện các biện pháp phòng ngừa" },
      { ja: "事故が起きてから対応すればよい", vi: "Chỉ cần xử lý sau khi xảy ra sự cố" },
      { ja: "従業員個人の注意力にすべて任せる", vi: "Phó mặc hoàn toàn cho sự chú ý cá nhân của nhân viên" },
    ],
    correctIndex: 1,
    explanationVi: "Để phòng ngừa tai nạn lao động, nhà hàng cũng nên chỉ định người phụ trách an toàn lao động và thực hiện các biện pháp phòng ngừa.",
    sourceQuoteJa: "このような労働災害を防止するため、飲食店においても、労働安全の担当者を決め、防止に向けた取り組みをおこなうなど、労働災害の防止に努めましょう。",
    sourcePage: 11,
  },
  {
    id: "ck-107",
    chapterId: "ck-ch5",
    questionJa: "職場の「危険の見える化」をおこなう目的は何か。",
    questionVi: "Mục đích thực hiện 'trực quan hóa nguy hiểm' tại nơi làm việc là gì?",
    options: [
      { ja: "見た目をきれいにするため", vi: "Để hình thức đẹp hơn" },
      { ja: "コストを削減するため", vi: "Để giảm chi phí" },
      { ja: "視覚的にとらえられない危険を可視化し、より効果的な安全活動をおこなうため", vi: "Để trực quan hóa các nguy hiểm không thể nhận biết bằng mắt thường, thực hiện hoạt động an toàn hiệu quả hơn" },
      { ja: "従業員の人数を減らすため", vi: "Để giảm số lượng nhân viên" },
    ],
    correctIndex: 2,
    explanationVi: "Nhiều nguy hiểm tiềm ẩn tại nơi làm việc không thể nhận biết bằng mắt thường. Việc trực quan hóa (biến chúng thành hình ảnh) giúp thực hiện hoạt động an toàn hiệu quả hơn.",
    sourceQuoteJa: "職場に潜む危険などは、視覚的にとらえられないものが多くあります。それらを可視化（見える化）することで、より効果的な安全活動をおこなうことができます。",
    sourcePage: 11,
  },
  {
    id: "ck-108",
    chapterId: "ck-ch5",
    questionJa: "「見える化」ができることとして正しいものはどれか。",
    questionVi: "'Trực quan hóa' giúp làm được điều gì?",
    options: [
      { ja: "従業員の給与を上げること", vi: "Tăng lương cho nhân viên" },
      { ja: "食材の在庫を管理すること", vi: "Quản lý tồn kho nguyên liệu" },
      { ja: "接客マナーを改善すること", vi: "Cải thiện phong cách phục vụ khách" },
      { ja: "危険認識や作業場の注意喚起を分かりやすく知らせること", vi: "Truyền đạt dễ hiểu về nhận thức nguy hiểm và cảnh báo tại nơi làm việc" },
    ],
    correctIndex: 3,
    explanationVi: "'Trực quan hóa' giúp truyền đạt dễ hiểu về nhận thức nguy hiểm và cảnh báo chú ý tại nơi làm việc.",
    sourceQuoteJa: "「見える化」は危険認識や作業場の注意喚起を分かりやすく知らせることができます。",
    sourcePage: 11,
  },
  {
    id: "ck-109",
    chapterId: "ck-ch5",
    questionJa: "見える化した作業マニュアルの作成方法として正しいものはどれか。",
    questionVi: "Cách tạo sổ tay thao tác đã trực quan hóa đúng là gì?",
    options: [
      { ja: "作業手順に安全な作業方法や危険個所を見える化した写真又はイラストを挿入し、作業と安全が一体となった見える化した作業マニュアルを作成する", vi: "Chèn ảnh hoặc hình minh họa đã trực quan hóa phương pháp thao tác an toàn và vị trí nguy hiểm vào quy trình thao tác, tạo sổ tay kết hợp thao tác và an toàn" },
      { ja: "文字だけで詳細に説明する", vi: "Chỉ giải thích chi tiết bằng chữ" },
      { ja: "写真やイラストは一切使わない", vi: "Hoàn toàn không dùng ảnh hay hình minh họa" },
      { ja: "マニュアルは作成せず口頭で伝える", vi: "Không tạo sổ tay mà chỉ truyền đạt bằng miệng" },
    ],
    correctIndex: 0,
    explanationVi: "Sổ tay thao tác trực quan hóa được tạo bằng cách chèn ảnh hoặc hình minh họa thể hiện phương pháp thao tác an toàn và vị trí nguy hiểm vào quy trình thao tác, kết hợp thao tác và an toàn làm một.",
    sourceQuoteJa: "作業手順に安全な作業方法や危険個所を見える化した写真又はイラストを挿入し、作業と安全が一体となった見える化した作業マニュアルを作成する。",
    sourcePage: 13,
  },
  {
    id: "ck-110",
    chapterId: "ck-ch5",
    questionJa: "「見える化」の具体例として正しいものはどれか。",
    questionVi: "Ví dụ cụ thể về 'trực quan hóa' đúng là gì?",
    options: [
      { ja: "事故が起きた後にのみ記録する", vi: "Chỉ ghi lại sau khi sự cố xảy ra" },
      { ja: "荷物を体から離して持つと腰痛の危険があるため、荷物をできるだけ体に近づけることを写真等で示す", vi: "Vì mang vật cách xa cơ thể có nguy cơ đau lưng, nên dùng ảnh minh họa việc mang vật càng gần cơ thể càng tốt" },
      { ja: "危険箇所には何も表示しない", vi: "Không hiển thị gì ở vị trí nguy hiểm" },
      { ja: "転倒事故は見える化の対象外である", vi: "Tai nạn té ngã không thuộc phạm vi trực quan hóa" },
    ],
    correctIndex: 1,
    explanationVi: "Ví dụ về trực quan hóa nguy cơ đau lưng: mang vật cách xa cơ thể có nguy cơ đau lưng, nên minh họa việc mang vật càng gần cơ thể càng tốt bằng hình ảnh.",
    sourceQuoteJa: "腰痛の危険 荷物を体から離して持つと腰痛の危険 荷物をできるだけ体に近づける",
    sourcePage: 13,
  },
  {
    id: "ck-111",
    chapterId: "ck-ch5",
    questionJa: "ハザードマップの活用方法として正しいものはどれか。",
    questionVi: "Cách sử dụng bản đồ nguy hiểm (hazard map) đúng là gì?",
    options: [
      { ja: "作成後は保管するだけでよい", vi: "Sau khi tạo chỉ cần lưu trữ" },
      { ja: "店長のみが見られるようにする", vi: "Chỉ để cửa hàng trưởng xem được" },
      { ja: "職場の危険を見える化したハザードマップを作成、掲示し、店舗で周知する", vi: "Tạo bản đồ nguy hiểm đã trực quan hóa nguy hiểm tại nơi làm việc, dán lên và phổ biến trong cửa hàng" },
      { ja: "1度作成したら二度と更新しない", vi: "Đã tạo 1 lần thì không bao giờ cập nhật lại" },
    ],
    correctIndex: 2,
    explanationVi: "Phải tạo bản đồ nguy hiểm đã trực quan hóa các nguy hiểm tại nơi làm việc, dán công khai và phổ biến cho toàn cửa hàng.",
    sourceQuoteJa: "職場の危険を見える化したハザードマップを作成、掲示し、店舗で周知する。",
    sourcePage: 13,
  },
  {
    id: "ck-112",
    chapterId: "ck-ch5",
    questionJa: "「見える化」を継続的に活かすためにおこなうべきことは何か。",
    questionVi: "Để duy trì hiệu quả của 'trực quan hóa', cần làm gì?",
    options: [
      { ja: "1度だけ指導すれば十分", vi: "Chỉ cần hướng dẫn 1 lần là đủ" },
      { ja: "新人にのみ指導する", vi: "Chỉ hướng dẫn cho nhân viên mới" },
      { ja: "マニュアルを作成したら指導は不要", vi: "Đã tạo sổ tay thì không cần hướng dẫn nữa" },
      { ja: "定期的に従業員へ指導する", vi: "Hướng dẫn định kỳ cho nhân viên" },
    ],
    correctIndex: 3,
    explanationVi: "Để duy trì hiệu quả trực quan hóa, phải định kỳ hướng dẫn lại cho nhân viên.",
    sourceQuoteJa: "定期的に従業員へ指導する。",
    sourcePage: 13,
  },
  {
    id: "ck-113",
    chapterId: "ck-ch5",
    questionJa: "5S活動の内容として正しいものはどれか。",
    questionVi: "Nội dung hoạt động 5S đúng là gì?",
    options: [
      { ja: "整理、整頓、清掃、清潔、習慣", vi: "Sàng lọc, sắp xếp, sạch sẽ (dọn dẹp), sạch sẽ (giữ gìn), thói quen" },
      { ja: "計画、実行、確認、改善、報告", vi: "Kế hoạch, thực hiện, kiểm tra, cải tiến, báo cáo" },
      { ja: "清潔、迅速、丁寧、正確、笑顔", vi: "Sạch sẽ, nhanh nhẹn, tỉ mỉ, chính xác, tươi cười" },
      { ja: "衛生、安全、品質、コスト、納期", vi: "Vệ sinh, an toàn, chất lượng, chi phí, thời hạn giao" },
    ],
    correctIndex: 0,
    explanationVi: "Hoạt động 5S gồm: 整理 (sàng lọc, loại bỏ đồ không cần), 整頓 (sắp xếp), 清掃 (dọn dẹp), 清潔 (giữ sạch sẽ), 習慣 (tạo thói quen).",
    sourceQuoteJa: "５Ｓ活動（整理、整頓、清掃、清潔、習慣）",
    sourcePage: 14,
  },
  {
    id: "ck-114",
    chapterId: "ck-ch5",
    questionJa: "飲食店の「転倒」災害の主な原因として正しいものはどれか。",
    questionVi: "Nguyên nhân chính gây tai nạn 'té ngã' tại nhà hàng là gì?",
    options: [
      { ja: "照明が明るすぎること", vi: "Ánh sáng quá chói" },
      { ja: "床が水や油で濡れていることによる「滑り」や通路の荷物などによる「つまづき」", vi: "'Trơn trượt' vì sàn ướt nước/dầu và 'vấp' do hành lý để trên lối đi" },
      { ja: "従業員の人数が多すぎること", vi: "Số lượng nhân viên quá đông" },
      { ja: "エアコンの温度設定", vi: "Cài đặt nhiệt độ điều hòa" },
    ],
    correctIndex: 1,
    explanationVi: "Tai nạn té ngã chủ yếu do 'trơn trượt' vì sàn ướt nước/dầu hoặc 'vấp' do hành lý để trên lối đi.",
    sourceQuoteJa: "転倒災害は、床が水や油で濡れていることによる「滑り」や通路の荷物などによる「つまづき」によるものが多いです。",
    sourcePage: 14,
  },
  {
    id: "ck-115",
    chapterId: "ck-ch5",
    questionJa: "重い荷物を運ぶ際の転倒リスク低減策として正しいものはどれか。",
    questionVi: "Biện pháp giảm nguy cơ té ngã khi mang vật nặng đúng là gì?",
    options: [
      { ja: "できるだけ一度にすべて運ぶ", vi: "Cố gắng mang hết trong 1 lần" },
      { ja: "両手いっぱいに抱えて運ぶ", vi: "Ôm đầy hai tay để mang" },
      { ja: "台車を使う、ひとりでは持たない、何回かに分けて運ぶ", vi: "Dùng xe đẩy, không tự mang một mình, chia làm nhiều lần" },
      { ja: "急いで一気に運ぶ", vi: "Vội vàng mang một lượt" },
    ],
    correctIndex: 2,
    explanationVi: "Khi mang vật nặng, nên dùng xe đẩy, không tự mang một mình, chia làm nhiều lần để giảm nguy cơ té ngã.",
    sourceQuoteJa: "重い荷物を運ぶ際は、台車を使う、ひとりでは持たない、何回かに分けて運ぶなど転倒リスク低減の措置をとりましょう。",
    sourcePage: 14,
  },
  {
    id: "ck-116",
    chapterId: "ck-ch5",
    questionJa: "「切れ・こすれ」災害防止ポイントとして本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu trong bài để phòng ngừa tai nạn 'đứt/trầy xước'?",
    options: [
      { ja: "刃物を使用するときは目線を外さない", vi: "Không rời mắt khỏi vật sắc khi dùng" },
      { ja: "食器を洗う時にはゴム手袋など手先を保護するものを着用する", vi: "Đeo găng cao su khi rửa chén" },
      { ja: "ゴミ袋に鋭利なものが混入している可能性があるので軍手などを着用する", vi: "Đeo găng vải vì túi rác có thể lẫn vật sắc" },
      { ja: "刃物は使い終わったらすぐに水で洗い流すだけでよい", vi: "Vật sắc dùng xong chỉ cần rửa nước là xong" },
    ],
    correctIndex: 3,
    explanationVi: "Các điểm được nêu gồm: không rời mắt khỏi vật sắc khi dùng, dọn dao vào đúng nơi quy định, cẩn thận khi cắt thực phẩm đông lạnh (dễ trượt), đeo găng cao su khi rửa chén, đeo găng vải/tạp dề dài khi xử lý túi rác (có thể lẫn vật sắc), cẩn thận với nắp/mép lon — không có ý 'chỉ cần rửa nước là xong'.",
    sourceQuoteJa: "刃物を使用するときは目線を外さないようにしましょう。使い終わった刃物は指定された場所に片づけましょう。冷凍食材をカットする際は、食材が滑ったり転がったりする恐れがあるため、注意しましょう。食器を洗う時にはゴム手袋など、手先を保護するものを着用しましょう。",
    sourcePage: 14,
  },
  {
    id: "ck-117",
    chapterId: "ck-ch5",
    questionJa: "プルトップ製の缶に関する注意点として正しいものはどれか。",
    questionVi: "Lưu ý về lon có nắp giật (pull-top) đúng là gì?",
    options: [
      { ja: "プルトップ製の缶でも「切れ・こすれ」は発生するので気を付ける", vi: "Lon nắp giật cũng có thể gây 'đứt/trầy xước' nên phải cẩn thận" },
      { ja: "プルトップ製の缶は絶対に手を切ることがない", vi: "Lon nắp giật tuyệt đối không thể làm đứt tay" },
      { ja: "プルトップ製の缶は使用禁止である", vi: "Cấm dùng lon nắp giật" },
      { ja: "プルトップ製の缶には注意点はない", vi: "Lon nắp giật không có lưu ý gì" },
    ],
    correctIndex: 0,
    explanationVi: "Ngay cả lon có nắp giật (pull-top) cũng có thể gây 'đứt/trầy xước' nên phải cẩn thận.",
    sourceQuoteJa: "プルトップ製の缶でも「切れ・こすれ」は発生するので気を付けましょう。",
    sourcePage: 14,
  },
  {
    id: "ck-118",
    chapterId: "ck-ch5",
    questionJa: "フライヤーを使う際の「高温のものとの接触」災害防止ポイントとして正しいものはどれか。",
    questionVi: "Điểm phòng ngừa tai nạn 'tiếp xúc vật nóng' khi dùng fryer đúng là gì?",
    options: [
      { ja: "素手で作業してもよい", vi: "Có thể làm việc bằng tay không" },
      { ja: "長靴、長エプロン、耐熱手袋を着用する", vi: "Mang ủng, tạp dề dài, găng tay chịu nhiệt" },
      { ja: "サンダルで作業する", vi: "Làm việc với dép lê" },
      { ja: "特に防護具は不要", vi: "Không cần đồ bảo hộ gì đặc biệt" },
    ],
    correctIndex: 1,
    explanationVi: "Khi dùng fryer, phải mang ủng, tạp dề dài, găng tay chịu nhiệt.",
    sourceQuoteJa: "フライヤーを使う際は、長靴、長エプロン、耐熱手袋を着用しましょう。",
    sourcePage: 14,
  },
  {
    id: "ck-119",
    chapterId: "ck-ch5",
    questionJa: "コーヒー抽出後のフィルターを扱う際に注意すべきことは何か。",
    questionVi: "Điều cần lưu ý khi xử lý phin lọc cà phê sau khi pha là gì?",
    options: [
      { ja: "すぐに素手で取り出してよい", vi: "Có thể lấy ra ngay bằng tay không" },
      { ja: "特に温度を気にする必要はない", vi: "Không cần để ý đến nhiệt độ" },
      { ja: "内容物が高温で熱湯が残っている場合もあるため十分注意する", vi: "Vì bên trong nóng và có thể còn nước sôi đọng lại nên phải cẩn thận" },
      { ja: "必ず冷蔵庫で冷やしてから触る", vi: "Bắt buộc phải làm lạnh trong tủ lạnh trước khi chạm vào" },
    ],
    correctIndex: 2,
    explanationVi: "Sau khi pha cà phê, phần bên trong phin lọc còn nóng và có thể còn đọng nước sôi, nên khi lấy phin lọc hoặc cà phê ra phải hết sức cẩn thận.",
    sourceQuoteJa: "コーヒー抽出後のフィルターの内容物は高温であり、熱湯が残っている場合もあるので、フィルターやコーヒーを取り出す際には十分注意しましょう。",
    sourcePage: 14,
  },
  {
    id: "ck-120",
    chapterId: "ck-ch5",
    questionJa: "熱湯を入れた寸胴鍋を運んでいるときに特に注意すべきことは何か。",
    questionVi: "Điều cần đặc biệt lưu ý khi khiêng nồi lớn đựng nước sôi là gì?",
    options: [
      { ja: "できるだけ速く歩く", vi: "Đi càng nhanh càng tốt" },
      { ja: "片手だけで運ぶ", vi: "Chỉ dùng một tay để khiêng" },
      { ja: "周りを見ずに運ぶ", vi: "Khiêng mà không nhìn xung quanh" },
      { ja: "転倒すると火傷の危険があるため注意する", vi: "Nếu té ngã sẽ có nguy cơ bị bỏng, nên phải cẩn thận" },
    ],
    correctIndex: 3,
    explanationVi: "Khi khiêng các vật đựng như nồi lớn có nước sôi, nếu bị té ngã sẽ có nguy cơ bị bỏng, nên hãy cẩn thận.",
    sourceQuoteJa: "熱湯を入れた寸胴鍋などの容器を運んでいるときの転倒は火傷の危険がありますので、注意しましょう。",
    sourcePage: 14,
  },
  {
    id: "ck-121",
    chapterId: "ck-ch5",
    questionJa: "食品加工用切断機・切削機の危険防止措置として正しいものはどれか。",
    questionVi: "Biện pháp phòng ngừa nguy hiểm cho máy cắt/máy thái thực phẩm đúng là gì?",
    options: [
      { ja: "切断に必要な部分以外の危険な部分に覆いなどを設置し、原材料の送給や取りだし時には機械の運転を停止するか用具などを使用する", vi: "Lắp nắp che ở bộ phận nguy hiểm ngoài phần cần thiết để cắt; khi đưa/lấy nguyên liệu phải dừng máy hoặc dùng dụng cụ" },
      { ja: "機械は常に稼働させたまま作業する", vi: "Luôn để máy chạy trong khi làm việc" },
      { ja: "覆いなどの設置は不要である", vi: "Không cần lắp nắp che gì cả" },
      { ja: "素手で原材料を出し入れしてよい", vi: "Có thể đưa/lấy nguyên liệu bằng tay không" },
    ],
    correctIndex: 0,
    explanationVi: "Theo Quy tắc An toàn Vệ sinh Lao động, máy cắt/thái thực phẩm phải lắp nắp che ở bộ phận nguy hiểm ngoài phần cần thiết để cắt; khi đưa nguyên liệu vào hoặc lấy ra, phải dừng máy hoặc dùng dụng cụ hỗ trợ thay vì dùng tay trực tiếp.",
    sourceQuoteJa: "食品加工用切断機や切削機による切断、切削の危険の防止 切断に必要な部分以外の危険な部分に覆いなどを設置 原材料の送給や取りだし時には、機械の運転を停止するか用具などを使用",
    sourcePage: 15,
  },
  {
    id: "ck-122",
    chapterId: "ck-ch5",
    questionJa: "食品加工用粉砕機、混合機、ロール機、成形機などに共通する危険防止の原則は何か。",
    questionVi: "Nguyên tắc chung phòng ngừa nguy hiểm cho máy nghiền, máy trộn, máy cán, máy tạo hình thực phẩm là gì?",
    options: [
      { ja: "作業効率を優先し運転を止めない", vi: "Ưu tiên hiệu quả công việc, không dừng máy" },
      { ja: "機械の目詰まりなどの調整時や掃除・給油・検査・調整をおこなう場合、危険な場合は原則として機械の運転を停止する", vi: "Khi điều chỉnh do tắc nghẽn, hoặc khi vệ sinh/tra dầu/kiểm tra/điều chỉnh máy trong trường hợp nguy hiểm, về nguyên tắc phải dừng máy" },
      { ja: "覆いや蓋の設置は不要", vi: "Không cần lắp nắp che hay nắp đậy" },
      { ja: "巻き込まれても軽傷なので問題ない", vi: "Dù bị cuốn vào cũng chỉ là thương nhẹ nên không sao" },
    ],
    correctIndex: 1,
    explanationVi: "Máy nghiền/trộn có nguy cơ rơi vào bên trong hoặc bị cuốn vào, máy cán có nguy cơ cuốn vào, máy tạo hình có nguy cơ kẹp/cuốn vào — đều phải lắp nắp che ở bộ phận nguy hiểm hoặc lỗ mở. Nguyên tắc chung: khi điều chỉnh do tắc nghẽn, hoặc khi vệ sinh/tra dầu/kiểm tra/điều chỉnh máy trong trường hợp nguy hiểm, về nguyên tắc phải dừng máy trước, kể cả khi vệ sinh phần lưỡi dao.",
    sourceQuoteJa: "機械の目詰まりなどの調整時には、原則として、機械の運転を停止するなどの措置を義務付けています。機械の掃除、給油、検査、調整の作業をおこなう場合で、危険な場合は原則として機械の運転を停止します。刃部の清掃についても同様です。",
    sourcePage: 15,
  },
  {
    id: "ck-123",
    chapterId: "ck-ch6",
    questionJa: "「流通」とは何か。",
    questionVi: "'Lưu thông' (流通) trong ngành thực phẩm là gì?",
    options: [
      { ja: "食品が生産者から消費者に届くまでの経路", vi: "Con đường thực phẩm đi từ nhà sản xuất đến tay người tiêu dùng" },
      { ja: "食品を加工する工程", vi: "Công đoạn chế biến thực phẩm" },
      { ja: "食品を廃棄する手続き", vi: "Thủ tục vứt bỏ thực phẩm" },
      { ja: "食品の味を評価する基準", vi: "Tiêu chuẩn đánh giá hương vị thực phẩm" },
    ],
    correctIndex: 0,
    explanationVi: "'Lưu thông' là con đường thực phẩm đi từ nhà sản xuất đến tay người tiêu dùng, qua các đơn vị xuất hàng như hợp tác xã nông nghiệp, chợ đầu mối, ngành chế biến và bán lẻ thực phẩm.",
    sourceQuoteJa: "食品が生産者から消費者に届くまでの経路は流通といい、生産者から農協などの出荷事業者、卸売市場や食品製造業、食品小売業などを経由して消費者の元に届きます。",
    sourcePage: 15,
  },
  {
    id: "ck-124",
    chapterId: "ck-ch6",
    questionJa: "食品が生産者から消費者に届くまでに経由する先として正しいものはどれか。",
    questionVi: "Thực phẩm đi qua những nơi nào từ nhà sản xuất đến người tiêu dùng?",
    options: [
      { ja: "生産者から直接消費者へ、経由先はない", vi: "Đi thẳng từ nhà sản xuất đến người tiêu dùng, không qua trung gian nào" },
      { ja: "生産者から農協などの出荷事業者、卸売市場や食品製造業、食品小売業などを経由する", vi: "Từ nhà sản xuất, qua đơn vị xuất hàng như hợp tác xã nông nghiệp, chợ đầu mối, ngành chế biến, ngành bán lẻ thực phẩm" },
      { ja: "消費者から生産者へ逆流する", vi: "Chảy ngược từ người tiêu dùng về nhà sản xuất" },
      { ja: "卸売市場のみを経由する", vi: "Chỉ đi qua chợ đầu mối" },
    ],
    correctIndex: 1,
    explanationVi: "Thực phẩm đi từ nhà sản xuất, qua đơn vị xuất hàng như hợp tác xã nông nghiệp, chợ đầu mối, ngành chế biến thực phẩm, ngành bán lẻ thực phẩm rồi mới đến tay người tiêu dùng.",
    sourceQuoteJa: "生産者から農協などの出荷事業者、卸売市場や食品製造業、食品小売業などを経由して消費者の元に届きます。",
    sourcePage: 15,
  },
  {
    id: "ck-125",
    chapterId: "ck-ch6",
    questionJa: "卸売市場が持つ機能として本文に挙げられていないものはどれか。",
    questionVi: "Chức năng nào KHÔNG được nêu trong bài là chức năng của chợ đầu mối (卸売市場)?",
    options: [
      { ja: "集荷", vi: "Thu gom hàng" },
      { ja: "価格形成", vi: "Hình thành giá" },
      { ja: "広告宣伝", vi: "Quảng cáo tiếp thị" },
      { ja: "決済", vi: "Thanh toán" },
    ],
    correctIndex: 2,
    explanationVi: "6 chức năng của chợ đầu mối được nêu là: thu gom hàng, hình thành giá, thanh toán, tiếp nhận/phát tin, ứng phó khi thiên tai, giữ vệ sinh — không có 'quảng cáo tiếp thị'.",
    sourceQuoteJa: "流通経路の中でも卸売市場は、①集荷、②価格形成、③決済、④情報受発信、⑤災害時対応、⑥衛生の保持機能を持ち、生鮮食料品などを安定的に供給するシステムとして運営されています。",
    sourcePage: 15,
  },
  {
    id: "ck-126",
    chapterId: "ck-ch6",
    questionJa: "卸売市場が果たす役割として正しいものはどれか。",
    questionVi: "Vai trò của chợ đầu mối là gì?",
    options: [
      { ja: "生鮮食料品の価格を毎年固定する", vi: "Cố định giá thực phẩm tươi sống mỗi năm" },
      { ja: "消費者から直接注文だけを受ける", vi: "Chỉ nhận đơn hàng trực tiếp từ người tiêu dùng" },
      { ja: "生産者の代わりに全量を廃棄する", vi: "Thay nhà sản xuất vứt bỏ toàn bộ hàng" },
      { ja: "生鮮食料品などを安定的に供給するシステムとして運営されている", vi: "Được vận hành như hệ thống cung cấp ổn định thực phẩm tươi sống" },
    ],
    correctIndex: 3,
    explanationVi: "Chợ đầu mối được vận hành như một hệ thống cung cấp ổn định các thực phẩm tươi sống.",
    sourceQuoteJa: "生鮮食料品などを安定的に供給するシステムとして運営されています。",
    sourcePage: 15,
  },
  {
    id: "ck-127",
    chapterId: "ck-ch6",
    questionJa: "飲食店の食材仕入先として本文に挙げられていないものはどれか。",
    questionVi: "Nơi nào KHÔNG được nêu trong bài là nguồn nhập nguyên liệu của nhà hàng?",
    options: [
      { ja: "個人が経営するフリーマーケット", vi: "Chợ trời do cá nhân kinh doanh" },
      { ja: "小売店（近隣商店・スーパー）", vi: "Cửa hàng bán lẻ (tiệm lân cận/siêu thị)" },
      { ja: "業務用専門スーパー", vi: "Siêu thị chuyên bán sỉ cho kinh doanh" },
      { ja: "卸売市場", vi: "Chợ đầu mối" },
    ],
    correctIndex: 0,
    explanationVi: "4 nguồn nhập nguyên liệu được nêu là: cửa hàng bán lẻ (tiệm lân cận/siêu thị), siêu thị chuyên bán sỉ cho kinh doanh, chợ đầu mối, và nhà cung cấp sỉ (bao gồm cả bán hàng qua thư/online) — không có 'chợ trời cá nhân'.",
    sourceQuoteJa: "飲食店で食材の仕入れをする際、①小売店（近隣商店・スーパー）、②業務用専門スーパー、③卸売市場、④卸売業者（通信販売も含む）など、さまざまな仕入先があります。",
    sourcePage: 15,
  },
  {
    id: "ck-128",
    chapterId: "ck-ch6",
    questionJa: "「業務用専門スーパー」とはどのような仕入先か。",
    questionVi: "'Siêu thị chuyên bán sỉ cho kinh doanh' (業務用専門スーパー) là nguồn nhập hàng như thế nào?",
    options: [
      { ja: "一般消費者しか利用できない小型店", vi: "Cửa hàng nhỏ chỉ dành cho người tiêu dùng thường" },
      { ja: "飲食店などの業務用仕入れに特化したスーパー", vi: "Siêu thị chuyên phục vụ việc nhập hàng kinh doanh cho nhà hàng, quán ăn" },
      { ja: "卸売市場の別名", vi: "Tên gọi khác của chợ đầu mối" },
      { ja: "通信販売専門の業者", vi: "Đơn vị chuyên bán hàng qua thư/online" },
    ],
    correctIndex: 1,
    explanationVi: "Siêu thị chuyên bán sỉ cho kinh doanh là một trong 4 nguồn nhập nguyên liệu, chuyên phục vụ việc nhập hàng cho các nhà hàng, quán ăn — khác với siêu thị bán lẻ thông thường.",
    sourceQuoteJa: "②業務用専門スーパー",
    sourcePage: 15,
  },
  {
    id: "ck-129",
    chapterId: "ck-ch6",
    questionJa: "「卸売業者」からの仕入れに含まれるものは何か。",
    questionVi: "Việc nhập hàng từ 'nhà cung cấp sỉ' (卸売業者) bao gồm cả điều gì?",
    options: [
      { ja: "店頭販売のみ", vi: "Chỉ bán tại quầy" },
      { ja: "卸売市場そのもの", vi: "Chính là chợ đầu mối" },
      { ja: "通信販売", vi: "Bán hàng qua thư/online" },
      { ja: "小売店経由の仕入れのみ", vi: "Chỉ nhập qua cửa hàng bán lẻ" },
    ],
    correctIndex: 2,
    explanationVi: "Nhập hàng từ nhà cung cấp sỉ bao gồm cả hình thức bán hàng qua thư/online (通信販売).",
    sourceQuoteJa: "④卸売業者（通信販売も含む）",
    sourcePage: 15,
  },
  {
    id: "ck-130",
    chapterId: "ck-ch6",
    questionJa: "仕入先を選択する際に重要なことは何か。",
    questionVi: "Điều quan trọng khi chọn nguồn nhập hàng là gì?",
    options: [
      { ja: "必ず価格が最も安いところを選ぶ", vi: "Bắt buộc chọn nơi giá rẻ nhất" },
      { ja: "1つの仕入先に固定し変えない", vi: "Cố định một nguồn duy nhất, không thay đổi" },
      { ja: "仕入先の数はできるだけ少なくする", vi: "Giảm số lượng nguồn nhập càng ít càng tốt" },
      { ja: "お店のコンセプトや各仕入先のメリット・デメリットを見極め、自店にあった仕入先を選択する", vi: "Cân nhắc concept của cửa hàng và ưu nhược điểm của từng nguồn nhập hàng để chọn nguồn phù hợp" },
    ],
    correctIndex: 3,
    explanationVi: "Khi chọn nguồn nhập hàng, cần cân nhắc concept của cửa hàng và ưu nhược điểm của từng nguồn để chọn nguồn phù hợp với cửa hàng mình.",
    sourceQuoteJa: "お店のコンセプトや各仕入先のメリット・デメリットを見極め、自店にあった仕入先を選択することが重要です。",
    sourcePage: 15,
  },
  {
    id: "ck-131",
    chapterId: "ck-ch7",
    questionJa: "食品添加物とは何か。",
    questionVi: "'Phụ gia thực phẩm' (食品添加物) là gì?",
    options: [
      { ja: "食品の製造過程において、加工や保存の目的で食品に添加されるもの", vi: "Chất được thêm vào thực phẩm với mục đích chế biến hoặc bảo quản trong quá trình sản xuất" },
      { ja: "食品そのものを指す言葉", vi: "Từ chỉ chính bản thân thực phẩm" },
      { ja: "食品を包装する容器", vi: "Bao bì đóng gói thực phẩm" },
      { ja: "食品を廃棄する処理", vi: "Quy trình vứt bỏ thực phẩm" },
    ],
    correctIndex: 0,
    explanationVi: "Chất được thêm vào thực phẩm với mục đích chế biến hoặc bảo quản trong quá trình sản xuất thực phẩm gọi là phụ gia thực phẩm.",
    sourceQuoteJa: "食品の製造過程において、加工や保存の目的で食品に添加されるものを食品添加物といいます。",
    sourcePage: 16,
  },
  {
    id: "ck-132",
    chapterId: "ck-ch7",
    questionJa: "食品安全委員会の役割として正しいものはどれか。",
    questionVi: "Vai trò của Ủy ban An toàn Thực phẩm (食品安全委員会) là gì?",
    options: [
      { ja: "添加物の価格を決定する", vi: "Quyết định giá phụ gia" },
      { ja: "動物試験などの結果をもとに食品添加物を評価し、安全性を確認する", vi: "Đánh giá phụ gia thực phẩm dựa trên kết quả thử nghiệm động vật, xác nhận độ an toàn" },
      { ja: "食品を直接製造する", vi: "Trực tiếp sản xuất thực phẩm" },
      { ja: "レストランの営業許可を出す", vi: "Cấp phép kinh doanh cho nhà hàng" },
    ],
    correctIndex: 1,
    explanationVi: "Ủy ban An toàn Thực phẩm, được thành lập theo Luật cơ bản về An toàn Thực phẩm, đánh giá phụ gia thực phẩm dựa trên kết quả thử nghiệm động vật để xác nhận độ an toàn.",
    sourceQuoteJa: "食品安全基本法に基づき設置された食品安全委員会は動物試験などの結果をもとに食品添加物を評価し、安全性を確認したものについて、厚生労働大臣が指定する「指定添加物」として、食品ごとに基準値を設定しています。",
    sourcePage: 16,
  },
  {
    id: "ck-133",
    chapterId: "ck-ch7",
    questionJa: "「指定添加物」とはどのようなものか。",
    questionVi: "'Phụ gia được chỉ định' (指定添加物) là gì?",
    options: [
      { ja: "誰でも自由に指定できる添加物", vi: "Phụ gia mà ai cũng có thể tự chỉ định" },
      { ja: "天然由来のものだけを指す", vi: "Chỉ những chất có nguồn gốc tự nhiên" },
      { ja: "食品安全委員会が安全性を確認したものについて、厚生労働大臣が指定し食品ごとに基準値を設定した添加物", vi: "Phụ gia được Ủy ban An toàn Thực phẩm xác nhận an toàn, Bộ trưởng Y tế Lao động Phúc lợi chỉ định và thiết lập giá trị tiêu chuẩn cho từng thực phẩm" },
      { ja: "外国でのみ使用が許可された添加物", vi: "Phụ gia chỉ được phép dùng ở nước ngoài" },
    ],
    correctIndex: 2,
    explanationVi: "Phụ gia được chỉ định là những chất đã được Ủy ban An toàn Thực phẩm xác nhận độ an toàn, sau đó được Bộ trưởng Y tế Lao động Phúc lợi chỉ định và thiết lập giá trị tiêu chuẩn cho từng loại thực phẩm.",
    sourceQuoteJa: "安全性を確認したものについて、厚生労働大臣が指定する「指定添加物」として、食品ごとに基準値を設定しています。",
    sourcePage: 16,
  },
  {
    id: "ck-134",
    chapterId: "ck-ch7",
    questionJa: "食品添加物の4つの種類として本文に挙げられていないものはどれか。",
    questionVi: "Loại nào KHÔNG được nêu trong 4 loại phụ gia thực phẩm?",
    options: [
      { ja: "指定添加物", vi: "Phụ gia được chỉ định" },
      { ja: "既存添加物", vi: "Phụ gia hiện có (truyền thống)" },
      { ja: "一般飲食物添加物", vi: "Phụ gia từ thực phẩm thông thường" },
      { ja: "輸入添加物", vi: "Phụ gia nhập khẩu" },
    ],
    correctIndex: 3,
    explanationVi: "4 loại phụ gia thực phẩm được nêu là: phụ gia được chỉ định (指定添加物), phụ gia hiện có/truyền thống (既存添加物, còn gọi là phụ gia tự nhiên), phụ gia từ thực phẩm thông thường (一般飲食物添加物), hương liệu tự nhiên (天然香料) — không có 'phụ gia nhập khẩu'.",
    sourceQuoteJa: "そのほか、食品添加物には、長年使用されてきた天然添加物として品目が決められている「既存添加物」、一般の食品を添加物の目的で使用した「一般飲食物添加物」、「天然香料」の４つの種類があります。",
    sourcePage: 16,
  },
  {
    id: "ck-135",
    chapterId: "ck-ch7",
    questionJa: "「甘味料」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất tạo ngọt' (甘味料) là gì?",
    options: [
      { ja: "食品に甘味を与える（例：キシリトール、アスパルテーム）", vi: "Tạo vị ngọt cho thực phẩm (ví dụ: xylitol, aspartame)" },
      { ja: "食品を着色する", vi: "Tạo màu cho thực phẩm" },
      { ja: "食品の保存性を向上させる", vi: "Cải thiện độ bền bảo quản của thực phẩm" },
      { ja: "食品に酸味を与える", vi: "Tạo vị chua cho thực phẩm" },
    ],
    correctIndex: 0,
    explanationVi: "Chất tạo ngọt (甘味料) giúp tạo vị ngọt cho thực phẩm, ví dụ: xylitol, aspartame.",
    sourceQuoteJa: "甘味料 食品に甘味を与える キシリトール、アスパルテーム",
    sourcePage: 16,
  },
  {
    id: "ck-136",
    chapterId: "ck-ch7",
    questionJa: "「着色料」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất tạo màu' (着色料) là gì?",
    options: [
      { ja: "食品に粘性を持たせる", vi: "Tạo độ nhớt cho thực phẩm" },
      { ja: "食品を着色する（例：クチナシ黄色素、食用黄色４号）", vi: "Tạo màu cho thực phẩm (ví dụ: sắc tố vàng gardenia, vàng thực phẩm số 4)" },
      { ja: "油脂などの酸化を防ぐ", vi: "Ngăn oxy hóa dầu mỡ" },
      { ja: "かびや細菌の発育を抑制する", vi: "Ức chế sự phát triển của nấm mốc, vi khuẩn" },
    ],
    correctIndex: 1,
    explanationVi: "Chất tạo màu (着色料) giúp tạo màu cho thực phẩm, ví dụ: sắc tố vàng từ gardenia, vàng thực phẩm số 4.",
    sourceQuoteJa: "着色料 食品を着色する クチナシ黄色素、食用黄色４号",
    sourcePage: 16,
  },
  {
    id: "ck-137",
    chapterId: "ck-ch7",
    questionJa: "「保存料」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất bảo quản' (保存料) là gì?",
    options: [
      { ja: "食品に香りをつける", vi: "Tạo mùi thơm cho thực phẩm" },
      { ja: "食品にうまみを与える", vi: "Tạo vị ngon (umami) cho thực phẩm" },
      { ja: "かびや細菌などの発育を抑制し、食品の保存性を向上させる（例：ソルビン酸、安息香酸ナトリウム）", vi: "Ức chế sự phát triển của nấm mốc, vi khuẩn, cải thiện độ bền bảo quản (ví dụ: acid sorbic, natri benzoat)" },
      { ja: "ケーキなどに膨らみを与える", vi: "Làm bánh nở xốp" },
    ],
    correctIndex: 2,
    explanationVi: "Chất bảo quản (保存料) ức chế sự phát triển của nấm mốc, vi khuẩn, cải thiện độ bền bảo quản của thực phẩm, ví dụ: acid sorbic, natri benzoat.",
    sourceQuoteJa: "保存料 かびや細菌などの発育を抑制し、食品の保存性を向上させる ソルビン酸、安息香酸ナトリウム",
    sourcePage: 16,
  },
  {
    id: "ck-138",
    chapterId: "ck-ch7",
    questionJa: "「増粘剤、安定剤、ゲル化剤、糊剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của nhóm 'chất làm đặc, ổn định, tạo gel, hồ hóa' là gì?",
    options: [
      { ja: "食品を漂白する", vi: "Tẩy trắng thực phẩm" },
      { ja: "栄養価を強化する", vi: "Tăng cường giá trị dinh dưỡng" },
      { ja: "豆乳を凝固させる", vi: "Làm đông sữa đậu nành" },
      { ja: "食品に粘性を持たせたり、滑らかにして食感をよくしたり、品質を安定・向上させる（例：ペクチン）", vi: "Tạo độ nhớt, làm mịn để cải thiện kết cấu, ổn định/nâng cao chất lượng (ví dụ: pectin)" },
    ],
    correctIndex: 3,
    explanationVi: "Nhóm chất làm đặc/ổn định/tạo gel/hồ hóa giúp tạo độ nhớt cho thực phẩm, làm mịn để cải thiện kết cấu, ổn định và nâng cao chất lượng, ví dụ: pectin, natri carboxymethyl cellulose.",
    sourceQuoteJa: "増粘剤、安定剤、ゲル化剤、糊剤 食品に粘性を持たせたり、滑らかにして食感をよくしたり、品質を安定、向上させる ペクチン、カルボキシメチルセルロースナトリウム",
    sourcePage: 16,
  },
  {
    id: "ck-139",
    chapterId: "ck-ch7",
    questionJa: "「酸化防止剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất chống oxy hóa' (酸化防止剤) là gì?",
    options: [
      { ja: "油脂などの酸化を防ぎ保存性をよくする（例：エリソルビン酸ナトリウム、ビタミンE）", vi: "Ngăn oxy hóa dầu mỡ, cải thiện độ bền bảo quản (ví dụ: natri erythorbate, vitamin E)" },
      { ja: "食品に酸味を与える", vi: "Tạo vị chua cho thực phẩm" },
      { ja: "肉類の色調・風味を改善する", vi: "Cải thiện màu sắc/hương vị của thịt" },
      { ja: "柑橘類などのかびの発生を防止する", vi: "Phòng ngừa nấm mốc trên trái cây họ cam quýt" },
    ],
    correctIndex: 0,
    explanationVi: "Chất chống oxy hóa (酸化防止剤) ngăn oxy hóa dầu mỡ, cải thiện độ bền bảo quản, ví dụ: natri erythorbate, vitamin E hỗn hợp.",
    sourceQuoteJa: "酸化防止剤 油脂などの酸化を防ぎ保存性をよくする エリソルビン酸ナトリウム、ミックスビタミンＥ",
    sourcePage: 17,
  },
  {
    id: "ck-140",
    chapterId: "ck-ch7",
    questionJa: "「発色剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất tạo màu ổn định cho thịt' (発色剤) là gì?",
    options: [
      { ja: "チューインガムの基材に用いる", vi: "Dùng làm chất nền cho kẹo cao su" },
      { ja: "肉類の色調・風味を改善する（例：亜硝酸ナトリウム、硝酸ナトリウム）", vi: "Cải thiện màu sắc/hương vị của thịt (ví dụ: natri nitrit, natri nitrat)" },
      { ja: "食品に甘味を与える", vi: "Tạo vị ngọt cho thực phẩm" },
      { ja: "水と油を均一に乳化させる", vi: "Nhũ hóa đều nước và dầu" },
    ],
    correctIndex: 1,
    explanationVi: "Chất tạo màu ổn định (発色剤) giúp cải thiện màu sắc và hương vị của thịt, ví dụ: natri nitrit, natri nitrat.",
    sourceQuoteJa: "発色剤 肉類の色調・風味を改善する 亜硝酸ナトリウム、硝酸ナトリウム",
    sourcePage: 17,
  },
  {
    id: "ck-141",
    chapterId: "ck-ch7",
    questionJa: "「漂白剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất tẩy trắng' (漂白剤) là gì?",
    options: [
      { ja: "食品にうまみを与える", vi: "Tạo vị ngon (umami) cho thực phẩm" },
      { ja: "豆乳を凝固させる", vi: "Làm đông sữa đậu nành" },
      { ja: "食品を漂白し、白くきれいにする（例：亜硫酸ナトリウム、次亜硫酸ナトリウム）", vi: "Tẩy trắng thực phẩm cho sạch đẹp (ví dụ: natri sulfit, natri hyposulfit)" },
      { ja: "栄養価を強化する", vi: "Tăng cường giá trị dinh dưỡng" },
    ],
    correctIndex: 2,
    explanationVi: "Chất tẩy trắng (漂白剤) giúp tẩy trắng thực phẩm cho sạch đẹp, ví dụ: natri sulfit, natri hyposulfit.",
    sourceQuoteJa: "漂白剤 食品を漂白し、白くきれいにする 亜硫酸ナトリウム、次亜硫酸ナトリウム",
    sourcePage: 17,
  },
  {
    id: "ck-142",
    chapterId: "ck-ch7",
    questionJa: "「防カビ剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất chống nấm mốc' (防カビ剤) là gì?",
    options: [
      { ja: "食品に香りをつける", vi: "Tạo mùi thơm cho thực phẩm" },
      { ja: "食品に酸味を与える", vi: "Tạo vị chua cho thực phẩm" },
      { ja: "ケーキなどに膨らみを与える", vi: "Làm bánh nở xốp" },
      { ja: "柑橘類などのかびの発生を防止する（例：オルトフェニルフェノール）", vi: "Phòng ngừa nấm mốc trên trái cây họ cam quýt (ví dụ: orthophenylphenol)" },
    ],
    correctIndex: 3,
    explanationVi: "Chất chống nấm mốc (防カビ剤) phòng ngừa nấm mốc phát sinh trên trái cây họ cam quýt, ví dụ: orthophenylphenol, diphenyl.",
    sourceQuoteJa: "防カビ剤 柑橘類などのかびの発生を防止する オルトフェニルフェノール、ジフェニル",
    sourcePage: 17,
  },
  {
    id: "ck-143",
    chapterId: "ck-ch7",
    questionJa: "「膨張剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất tạo xốp/nở' (膨張剤) là gì?",
    options: [
      { ja: "ケーキなどに膨らみを与える（例：炭酸水素ナトリウム、焼ミョウバン）", vi: "Làm bánh nở xốp (ví dụ: natri bicarbonat, phèn nung)" },
      { ja: "食品を着色する", vi: "Tạo màu cho thực phẩm" },
      { ja: "油脂などの酸化を防ぐ", vi: "Ngăn oxy hóa dầu mỡ" },
      { ja: "かびや細菌の発育を抑制する", vi: "Ức chế sự phát triển của nấm mốc, vi khuẩn" },
    ],
    correctIndex: 0,
    explanationVi: "Chất tạo xốp/nở (膨張剤) giúp bánh (như cake) nở xốp, ví dụ: natri bicarbonat, phèn nung.",
    sourceQuoteJa: "膨張剤 ケーキなどに膨らみを与える 炭酸水素ナトリウム、焼ミョウバン",
    sourcePage: 17,
  },
  {
    id: "ck-144",
    chapterId: "ck-ch7",
    questionJa: "「香料」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'hương liệu' (香料) là gì?",
    options: [
      { ja: "食品に粘性を持たせる", vi: "Tạo độ nhớt cho thực phẩm" },
      { ja: "食品に香りをつける（例：オレンジ香料、バニリン）", vi: "Tạo mùi thơm cho thực phẩm (ví dụ: hương cam, vanillin)" },
      { ja: "肉類の色調を改善する", vi: "Cải thiện màu sắc của thịt" },
      { ja: "水と油を乳化させる", vi: "Nhũ hóa nước và dầu" },
    ],
    correctIndex: 1,
    explanationVi: "Hương liệu (香料) tạo mùi thơm cho thực phẩm, ví dụ: hương cam, vanillin.",
    sourceQuoteJa: "香料 食品に香りをつける オレンジ香料、バニリン",
    sourcePage: 17,
  },
  {
    id: "ck-145",
    chapterId: "ck-ch7",
    questionJa: "「酸味料」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất tạo vị chua' (酸味料) là gì?",
    options: [
      { ja: "食品を漂白する", vi: "Tẩy trắng thực phẩm" },
      { ja: "栄養価を強化する", vi: "Tăng cường giá trị dinh dưỡng" },
      { ja: "食品に酸味を与える（例：クエン酸、乳酸）", vi: "Tạo vị chua cho thực phẩm (ví dụ: acid citric, acid lactic)" },
      { ja: "豆乳を凝固させる", vi: "Làm đông sữa đậu nành" },
    ],
    correctIndex: 2,
    explanationVi: "Chất tạo vị chua (酸味料) tạo vị chua cho thực phẩm, ví dụ: acid citric, acid lactic.",
    sourceQuoteJa: "酸味料 食品に酸味を与える クエン酸、乳酸",
    sourcePage: 17,
  },
  {
    id: "ck-146",
    chapterId: "ck-ch7",
    questionJa: "「調味料」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất điều vị' (調味料) là gì?",
    options: [
      { ja: "食品に甘味を与える", vi: "Tạo vị ngọt cho thực phẩm" },
      { ja: "かびの発生を防止する", vi: "Phòng ngừa nấm mốc" },
      { ja: "ケーキに膨らみを与える", vi: "Làm bánh nở xốp" },
      { ja: "食品にうまみを与える（例：L-グルタミン酸ナトリウム）", vi: "Tạo vị ngon umami cho thực phẩm (ví dụ: natri L-glutamat, bột ngọt)" },
    ],
    correctIndex: 3,
    explanationVi: "Chất điều vị (調味料) tạo vị ngon (umami) cho thực phẩm, ví dụ: natri L-glutamat, natri 5'-inosinat.",
    sourceQuoteJa: "調味料 食品にうまみを与える L-グルタミン酸ナトリウム、5’-イノシン酸二ナトリウム",
    sourcePage: 17,
  },
  {
    id: "ck-147",
    chapterId: "ck-ch7",
    questionJa: "「豆腐用凝固剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất làm đông đậu phụ' (豆腐用凝固剤) là gì?",
    options: [
      { ja: "豆腐を作る際に豆乳を凝固させる（例：塩化マグネシウム）", vi: "Làm đông sữa đậu nành khi làm đậu phụ (ví dụ: magie clorua)" },
      { ja: "食品を着色する", vi: "Tạo màu cho thực phẩm" },
      { ja: "油脂の酸化を防ぐ", vi: "Ngăn oxy hóa dầu mỡ" },
      { ja: "食品に香りをつける", vi: "Tạo mùi thơm cho thực phẩm" },
    ],
    correctIndex: 0,
    explanationVi: "Chất làm đông đậu phụ (豆腐用凝固剤) dùng để làm đông sữa đậu nành khi làm đậu phụ, ví dụ: magie clorua (nigari), glucono delta-lactone.",
    sourceQuoteJa: "豆腐用凝固剤 豆腐を作る際に豆乳を凝固させる 塩化マグネシウム、グルコノデルタラクトン",
    sourcePage: 17,
  },
  {
    id: "ck-148",
    chapterId: "ck-ch7",
    questionJa: "「乳化剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất nhũ hóa' (乳化剤) là gì?",
    options: [
      { ja: "食品にうまみを与える", vi: "Tạo vị ngon (umami) cho thực phẩm" },
      { ja: "水と油を均一に乳化させる（例：グリセリン脂肪酸エステル、植物レシチン）", vi: "Nhũ hóa đều nước và dầu (ví dụ: ester acid béo glycerin, lecithin thực vật)" },
      { ja: "食品を漂白する", vi: "Tẩy trắng thực phẩm" },
      { ja: "かびの発生を防止する", vi: "Phòng ngừa nấm mốc" },
    ],
    correctIndex: 1,
    explanationVi: "Chất nhũ hóa (乳化剤) giúp nước và dầu hòa trộn đều với nhau, ví dụ: ester acid béo glycerin, lecithin thực vật.",
    sourceQuoteJa: "乳化剤 水と油を均一に乳化させる グリセリン脂肪酸エステル、植物レシチン",
    sourcePage: 17,
  },
  {
    id: "ck-149",
    chapterId: "ck-ch7",
    questionJa: "「栄養強化剤」の目的・効果として正しいものはどれか。",
    questionVi: "Mục đích/tác dụng của 'chất tăng cường dinh dưỡng' (栄養強化剤) là gì?",
    options: [
      { ja: "食品に酸味を与える", vi: "Tạo vị chua cho thực phẩm" },
      { ja: "ケーキに膨らみを与える", vi: "Làm bánh nở xốp" },
      { ja: "栄養価を強化する（例：ビタミンC、乳酸カルシウム）", vi: "Tăng cường giá trị dinh dưỡng (ví dụ: vitamin C, calci lactat)" },
      { ja: "水と油を乳化させる", vi: "Nhũ hóa nước và dầu" },
    ],
    correctIndex: 2,
    explanationVi: "Chất tăng cường dinh dưỡng (栄養強化剤) giúp nâng cao giá trị dinh dưỡng của thực phẩm, ví dụ: vitamin C, calci lactat.",
    sourceQuoteJa: "栄養強化剤 栄養価を強化する ビタミンＣ、乳酸カルシウム",
    sourcePage: 17,
  },
  {
    id: "ck-150",
    chapterId: "ck-ch7",
    questionJa: "チューインガムの基材に用いる添加物の種類は何か。",
    questionVi: "Loại phụ gia dùng làm chất nền cho kẹo cao su là gì?",
    options: [
      { ja: "調味料", vi: "Chất điều vị" },
      { ja: "酸味料", vi: "Chất tạo vị chua" },
      { ja: "栄養強化剤", vi: "Chất tăng cường dinh dưỡng" },
      { ja: "ガムベース（例：エステルガム、チクル）", vi: "Chất nền kẹo cao su (ví dụ: ester gum, chicle)" },
    ],
    correctIndex: 3,
    explanationVi: "Chất nền kẹo cao su (ガムベース) dùng làm nguyên liệu nền cho kẹo cao su, ví dụ: ester gum, chicle.",
    sourceQuoteJa: "ガムベース チューインガムの基材に用いる エステルガム、チクル",
    sourcePage: 17,
  },
  {
    id: "cs-1",
    chapterId: "cs-ch1",
    questionJa: "店舗責任者や時間帯責任者に求められる役割として正しいものはどれか。",
    questionVi: "Vai trò được yêu cầu đối với người phụ trách cửa hàng/người phụ trách theo khung giờ là gì?",
    options: [
      { ja: "料理の内容、サービスの内容、清潔感の問題、手違い、クレーム対応などの接客全般の責任者として行動すること", vi: "Đảm nhận vai trò chịu trách nhiệm toàn diện về nội dung món ăn, dịch vụ, vấn đề vệ sinh, sai sót, xử lý khiếu nại" },
      { ja: "厨房での調理作業のみをおこなうこと", vi: "Chỉ làm công việc nấu ăn trong bếp" },
      { ja: "経理業務のみをおこなうこと", vi: "Chỉ làm công việc kế toán" },
      { ja: "広告宣伝のみをおこなうこと", vi: "Chỉ làm công việc quảng cáo" },
    ],
    correctIndex: 0,
    explanationVi: "Để khách hàng đánh giá và hài lòng, người phụ trách cửa hàng (như cửa hàng trưởng) và người phụ trách theo khung giờ phải đảm nhận vai trò chịu trách nhiệm toàn diện về tiếp khách: nội dung món ăn, dịch vụ, vấn đề vệ sinh, sai sót, xử lý khiếu nại.",
    sourceQuoteJa: "飲食店においてお客様に評価・満足してもらうため、店舗責任者（店長など）や時間帯責任者は、料理の内容、サービスの内容、清潔感の問題、手違い、クレーム対応などの接客全般の責任者として行動することが求められます。",
    sourcePage: 1,
  },
  {
    id: "cs-2",
    chapterId: "cs-ch1",
    questionJa: "従業員に対して店舗責任者に求められることとして正しいものはどれか。",
    questionVi: "Điều được yêu cầu đối với người phụ trách cửa hàng khi đối với nhân viên là gì?",
    options: [
      { ja: "従業員の給与を決定すること", vi: "Quyết định lương nhân viên" },
      { ja: "QSCスタンダードを始めとする接客全般の実践モデル（手本）となること", vi: "Trở thành hình mẫu thực hành cho toàn bộ hoạt động tiếp khách, bắt đầu từ tiêu chuẩn QSC" },
      { ja: "従業員の採用面接のみをおこなうこと", vi: "Chỉ phỏng vấn tuyển dụng nhân viên" },
      { ja: "従業員のシフトのみを管理すること", vi: "Chỉ quản lý lịch làm việc nhân viên" },
    ],
    correctIndex: 1,
    explanationVi: "Người phụ trách cửa hàng còn phải trở thành hình mẫu thực hành (làm gương) cho toàn bộ hoạt động tiếp khách bắt đầu từ tiêu chuẩn QSC, đồng thời đóng vai trò người hướng dẫn/quản lý qua việc hoàn thiện sổ tay thao tác, đào tạo và quản lý khách hàng.",
    sourceQuoteJa: "また、従業員に対しては、QSC スタンダード（基準）を始めとする接客全般の実践モデル（手本）となることが求められるほか、作業マニュアルの整備・見直し、教育とトレーニング、顧客管理など、従業員の指導者・管理者の役割も果たすことが求められます。",
    sourcePage: 1,
  },
  {
    id: "cs-3",
    chapterId: "cs-ch1",
    questionJa: "日本における接客サービスの特性は何か。",
    questionVi: "Đặc trưng của dịch vụ tiếp khách tại Nhật Bản là gì?",
    options: [
      { ja: "効率を最優先すること", vi: "Ưu tiên hiệu quả trên hết" },
      { ja: "価格の安さのみを重視すること", vi: "Chỉ chú trọng giá rẻ" },
      { ja: "「おもてなし」（＝ホスピタリティ）", vi: "'Omotenashi' (=hospitality, lòng hiếu khách)" },
      { ja: "接客をおこなわないこと", vi: "Không thực hiện tiếp khách" },
    ],
    correctIndex: 2,
    explanationVi: "Đặc trưng của dịch vụ tiếp khách tại Nhật Bản là 'omotenashi' (=hospitality) — tinh thần hiếu khách.",
    sourceQuoteJa: "日本における接客サービスの特性として、「おもてなし」（＝ホスピタリティ）があります。",
    sourcePage: 1,
  },
  {
    id: "cs-4",
    chapterId: "cs-ch1",
    questionJa: "顧客満足について正しいものはどれか。",
    questionVi: "Điều đúng về sự hài lòng của khách hàng là gì?",
    options: [
      { ja: "期待を上回っても再来店率は変わらない", vi: "Dù vượt kỳ vọng thì tỷ lệ quay lại cũng không đổi" },
      { ja: "期待を下回ってもクレームは広がらない", vi: "Dù không đạt kỳ vọng thì khiếu nại cũng không lan truyền" },
      { ja: "お客様は事前に期待を持たずに来店する", vi: "Khách hàng đến quán mà không có kỳ vọng trước" },
      { ja: "期待を上回れば十分に満足して再来店する確率が増加し、下回れば不満を感じ、クレーム情報は広がりやすい", vi: "Nếu vượt kỳ vọng, khả năng khách hài lòng và quay lại tăng lên; nếu không đạt, khách sẽ bất mãn và thông tin khiếu nại dễ lan truyền" },
    ],
    correctIndex: 3,
    explanationVi: "Nếu vượt kỳ vọng, khách hàng sẽ hài lòng và khả năng quay lại làm khách quen tăng lên. Ngược lại, nếu không đạt kỳ vọng, khách sẽ bất mãn, không quay lại, và có thể kể lại cho bạn bè — thông tin khiếu nại lan truyền nhanh, làm giảm cả lượng khách tiềm năng.",
    sourceQuoteJa: "この期待を上回れば、十分に満足して帰り、リピーターとして再来店する確率は増加します。逆に期待を下回れば不満を感じて再来店はなく、場合によっては友人や知人にそのクレームを伝えます。クレームに関する情報は広がりやすく、潜在的なお客様まで減少させてしまいます。",
    sourcePage: 1,
  },
  {
    id: "cs-5",
    chapterId: "cs-ch1",
    questionJa: "顧客満足に関係する要因「QSCA」とは何の頭文字か。",
    questionVi: "'QSCA' — yếu tố liên quan đến sự hài lòng của khách hàng — là viết tắt của gì?",
    options: [
      { ja: "Quality（料理の品質）、Service（サービス）、Cleanliness（清潔感）、Atmosphere（雰囲気）", vi: "Chất lượng món ăn, Dịch vụ, Sạch sẽ, Bầu không khí" },
      { ja: "Quantity、Speed、Cost、Ability", vi: "Số lượng, Tốc độ, Chi phí, Năng lực" },
      { ja: "Quality、Style、Comfort、Attitude", vi: "Chất lượng, Phong cách, Thoải mái, Thái độ" },
      { ja: "Quick、Safe、Clean、Affordable", vi: "Nhanh, An toàn, Sạch, Giá phải chăng" },
    ],
    correctIndex: 0,
    explanationVi: "4 yếu tố liên quan đến giá trị/sự hài lòng của khách hàng là: chất lượng món ăn (Quality), dịch vụ (Service), sạch sẽ (Cleanliness), bầu không khí (Atmosphere).",
    sourceQuoteJa: "顧客満足、価値（Value）に関係する要因として、料理の品質（Quality）、サービス（Service）、清潔感（Cleanliness）、雰囲気（Atmosphere）があります。",
    sourcePage: 1,
  },
  {
    id: "cs-6",
    chapterId: "cs-ch1",
    questionJa: "「料理の品質（Quality）」のチェック項目として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là mục kiểm tra 'Chất lượng món ăn' (Quality)?",
    options: [
      { ja: "いつも通りの味・分量・盛り付けで提供できているか", vi: "Có phục vụ đúng vị/lượng/cách bày như thường lệ không" },
      { ja: "料理の値段が競合店より安いか", vi: "Giá món có rẻ hơn đối thủ cạnh tranh không" },
      { ja: "メニューが清潔な状態で提供されているか", vi: "Món ăn có được phục vụ trong tình trạng sạch sẽ không" },
      { ja: "注文通りに適正な温度や状態、時間で提供されているか", vi: "Có phục vụ đúng nhiệt độ/trạng thái/thời gian theo yêu cầu không" },
    ],
    correctIndex: 1,
    explanationVi: "3 mục kiểm tra 'Chất lượng món ăn' được nêu: vị/lượng/cách bày như thường lệ, món ăn sạch sẽ khi phục vụ, phục vụ đúng nhiệt độ/trạng thái/thời gian theo yêu cầu — không có mục so sánh giá với đối thủ.",
    sourceQuoteJa: "〇料理の品質（Quality）ア いつも通りの味・分量・盛り付けで提供できているか確認してください。イ メニューが清潔な状態で提供されているか確認してください。ウ 注文通りに適正な温度や状態、時間で提供されているか確認してください。",
    sourcePage: 1,
  },
  {
    id: "cs-7",
    chapterId: "cs-ch1",
    questionJa: "「サービス（Service）」のチェック項目として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là mục kiểm tra 'Dịch vụ' (Service)?",
    options: [
      { ja: "従業員が笑顔とアイコンタクト、正しい姿勢や声で応対しているか", vi: "Nhân viên có phục vụ bằng nụ cười, giao tiếp bằng mắt, tư thế/giọng nói đúng không" },
      { ja: "フルサービスのお店でオーダー受けが放置されていないか", vi: "Ở quán full-service, việc nhận order có bị bỏ mặc không" },
      { ja: "従業員の給与が業界平均より高いか", vi: "Lương nhân viên có cao hơn mức trung bình ngành không" },
      { ja: "出来上がった料理が適正な温度や状態で、適正な時間内に配膳されているか", vi: "Món ăn hoàn thành có được bày ra đúng nhiệt độ/trạng thái, trong thời gian hợp lý không" },
    ],
    correctIndex: 2,
    explanationVi: "Các mục kiểm tra 'Dịch vụ' gồm: nụ cười/giao tiếp bằng mắt/tư thế đúng, không bỏ mặc order, phục vụ đúng nhiệt độ/thời gian, phục vụ giữa bữa, dọn bàn sau khi khách về... — không có mục về 'lương nhân viên'.",
    sourceQuoteJa: "〇サービス（Service）ア 従業員が笑顔とアイコンタクト、正しい姿勢や声で応対しているか確認してください。カ フルサービスのお店でオーダー（注文）受けが放置されていないか確認してください。キ 出来上がった料理が、適正な温度や状態で、適正な時間内にお客様のテーブルに配膳されているか確認してください。",
    sourcePage: 2,
  },
  {
    id: "cs-8",
    chapterId: "cs-ch1",
    questionJa: "「清潔感（Cleanliness）」のチェック項目として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là mục kiểm tra 'Sạch sẽ' (Cleanliness)?",
    options: [
      { ja: "客席周りに汚れやほこりがないか", vi: "Khu vực bàn ghế có bụi bẩn không" },
      { ja: "客用トイレに異臭がなく清潔感があるか", vi: "Nhà vệ sinh khách có mùi lạ và sạch sẽ không" },
      { ja: "接客する従業員の制服に汚れやほつれがないか", vi: "Đồng phục nhân viên tiếp khách có bẩn/sờn không" },
      { ja: "従業員の勤続年数が長いか", vi: "Nhân viên có thâm niên làm việc lâu năm không" },
    ],
    correctIndex: 3,
    explanationVi: "Các mục kiểm tra 'Sạch sẽ' gồm: khu vực bàn ghế, đồ dùng trên bàn, chén đĩa, sàn, cửa sổ, đèn, đồ trang trí, nhà vệ sinh khách, đồng phục nhân viên... — không có mục về 'thâm niên làm việc'.",
    sourceQuoteJa: "〇清潔感（Cleanliness）ア 客席周りに汚れやほこりがないか確認してください。ケ 客用トイレをチェックし、異臭がなく清潔感があるか確認してください。コ 接客する従業員の制服が汚れやほつれなどがないか確認してください。",
    sourcePage: 2,
  },
  {
    id: "cs-9",
    chapterId: "cs-ch1",
    questionJa: "「雰囲気（Atmosphere）」のチェック項目として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là mục kiểm tra 'Bầu không khí' (Atmosphere)?",
    options: [
      { ja: "従業員の勤務歴を客に説明しているか", vi: "Có giải thích thâm niên nhân viên cho khách không" },
      { ja: "店内空調温度が快適かどうか", vi: "Nhiệt độ điều hòa trong quán có dễ chịu không" },
      { ja: "BGMの選曲は適切であり、適度な音量で流れているか", vi: "Nhạc nền có phù hợp và âm lượng vừa phải không" },
      { ja: "点灯すべき電飾看板、イルミネーションが点いているか", vi: "Bảng hiệu điện/đèn trang trí cần bật có đang sáng không" },
    ],
    correctIndex: 0,
    explanationVi: "Các mục kiểm tra 'Bầu không khí' gồm: nhiệt độ điều hòa, ánh sáng đèn, bảng hiệu điện/đèn trang trí, nhạc nền (BGM) — không có mục 'giới thiệu thâm niên nhân viên cho khách'.",
    sourceQuoteJa: "〇雰囲気（Atmosphere）ア 店内空調温度が快適かどうか確認してください。エ BGM の選曲は適切であり、適度な音量で流れているか確認してください。ウ 点灯すべき電飾看板、イルミネーションが点いているか確認してください。",
    sourcePage: 2,
  },
  {
    id: "cs-10",
    chapterId: "cs-ch1",
    questionJa: "客席内における動作の基本3つとは何か。",
    questionVi: "3 nguyên tắc cơ bản về hành động trong khu vực bàn khách là gì?",
    options: [
      { ja: "ゆっくり、静かに、丁寧に", vi: "Chậm rãi, im lặng, tỉ mỉ" },
      { ja: "ニコニコ、ハキハキ、キビキビ", vi: "Cười tươi, nói rõ ràng, nhanh nhẹn" },
      { ja: "速く、大声で、力強く", vi: "Nhanh, to tiếng, mạnh mẽ" },
      { ja: "控えめに、無言で、ゆったりと", vi: "Khiêm tốn, im lặng, thong thả" },
    ],
    correctIndex: 1,
    explanationVi: "3 nguyên tắc cơ bản về hành động trong khu vực bàn khách là: Nico-nico (luôn cười tươi), Haki-haki (trả lời câu hỏi khách rõ ràng, chính xác), Kibi-kibi (không đi lề mề, phản ứng nhanh).",
    sourceQuoteJa: "客席内における動作の基本は、ニコニコ、ハキハキ、キビキビの３つです。",
    sourcePage: 2,
  },
  {
    id: "cs-11",
    chapterId: "cs-ch1",
    questionJa: "従業員へのあいさつが重要な一番目の理由は何か。",
    questionVi: "Lý do quan trọng nhất của việc chào hỏi giữa nhân viên là gì?",
    options: [
      { ja: "規則だから仕方なくおこなう", vi: "Vì là quy định nên bắt buộc phải làm" },
      { ja: "お客様に見せるためのパフォーマンス", vi: "Để trình diễn cho khách xem" },
      { ja: "心を合わせ、チームワークで仕事をしたいという意思表示をするため", vi: "Để thể hiện ý muốn đồng lòng, làm việc theo tinh thần đồng đội" },
      { ja: "上司の評価を上げるため", vi: "Để tăng đánh giá từ cấp trên" },
    ],
    correctIndex: 2,
    explanationVi: "Chào hỏi giữa nhân viên thể hiện ý muốn 'hôm nay làm việc vui vẻ, đồng lòng, theo tinh thần đồng đội, mong được hợp tác', và đối phương cũng đáp lại tương tự — như một cái bắt tay bằng tâm ý.",
    sourceQuoteJa: "従業員へのあいさつが重要な一番目の理由は、「今日は気持ちよく、心を合わせ、チームワークで仕事をしたいので、よろしくお願いします」との意思表示をし、相手も「こちらこそよろしくお願いします」、心で握手を交わしている状態にするためです。",
    sourcePage: 3,
  },
  {
    id: "cs-12",
    chapterId: "cs-ch1",
    questionJa: "従業員同士の「スマイル＆アイコンタクト」が持つ意味は何か。",
    questionVi: "Ý nghĩa của 'nụ cười và giao tiếp bằng mắt' giữa các nhân viên là gì?",
    options: [
      { ja: "単なる形式的な挨拶", vi: "Chỉ là lời chào mang tính hình thức" },
      { ja: "競争心を煽るため", vi: "Để kích thích tinh thần cạnh tranh" },
      { ja: "仕事の速さを競うため", vi: "Để thi đua tốc độ làm việc" },
      { ja: "「今日も楽しく仕事しましょうね」という意味で、チームワークよく楽しい雰囲気を作り出す", vi: "Mang ý nghĩa 'hôm nay cùng làm việc vui vẻ nhé', tạo nên bầu không khí vui vẻ và đồng đội" },
    ],
    correctIndex: 3,
    explanationVi: "Nụ cười và giao tiếp bằng mắt giữa các nhân viên mang ý nghĩa 'hôm nay cùng làm việc vui vẻ nhé', tạo ra bầu không khí phục vụ vui vẻ và đồng đội, từ đó nâng cao chất lượng dịch vụ đối với khách hàng.",
    sourceQuoteJa: "従業員同士が笑顔と目線を交わし合う（スマイル＆アイコンタクト）は、「今日も楽しく仕事しましょうね」という意味があります。チームワークよく楽しく接客をする雰囲気を作り出します。その結果、お客様に対するサービスの質が上がります。",
    sourcePage: 3,
  },
  {
    id: "cs-13",
    chapterId: "cs-ch1",
    questionJa: "清潔な服装、きちんとした身だしなみを整えることの目的は何か。",
    questionVi: "Mục đích của việc mặc trang phục sạch sẽ, chỉnh chu tác phong là gì?",
    options: [
      { ja: "お客様に安心感を与え、気持ちよく食事ができる雰囲気を作り出すこと", vi: "Tạo cảm giác an tâm cho khách, tạo bầu không khí thoải mái khi ăn uống" },
      { ja: "従業員のコストを削減すること", vi: "Giảm chi phí cho nhân viên" },
      { ja: "店の売上を直接増やすこと", vi: "Trực tiếp tăng doanh thu cửa hàng" },
      { ja: "競合店との差別化のためだけ", vi: "Chỉ để tạo khác biệt với đối thủ" },
    ],
    correctIndex: 0,
    explanationVi: "Trang phục sạch sẽ, tác phong chỉnh chu tạo cảm giác an tâm cho khách hàng, giúp tạo ra bầu không khí thoải mái khi dùng bữa.",
    sourceQuoteJa: "清潔な服装、きちんとした身だしなみを整えることは、お客様に安心感を与え、気持ちよく食事ができる雰囲気を作り出します。",
    sourcePage: 3,
  },
  {
    id: "cs-14",
    chapterId: "cs-ch1",
    questionJa: "お客様とすれ違う際の正しい立ち振る舞いはどれか。",
    questionVi: "Cách ứng xử đúng khi đi ngang qua khách là gì?",
    options: [
      { ja: "そのまま無視して通り過ぎる", vi: "Cứ thế đi qua, không để ý" },
      { ja: "脇に寄って立ち止まり、会釈してお客様優先でお通しする", vi: "Đứng nép sang bên, cúi đầu chào nhẹ và nhường khách đi trước" },
      { ja: "急いで走り抜ける", vi: "Vội vàng chạy qua" },
      { ja: "大きな声で挨拶しながら通り過ぎる", vi: "Vừa chào to vừa đi qua" },
    ],
    correctIndex: 1,
    explanationVi: "Khi đi ngang qua khách, phải đứng nép sang bên, cúi đầu chào nhẹ (eshaku) và nhường khách đi trước; khi đang bưng món cũng ứng xử tương tự.",
    sourceQuoteJa: "お客様とすれ違う際は脇に寄って立ち止まり、会釈してお客様優先でお通しします。料理を運んでいる場合も同様に対応してください。",
    sourcePage: 3,
  },
  {
    id: "cs-15",
    chapterId: "cs-ch1",
    questionJa: "お辞儀の基本として正しいものはどれか。",
    questionVi: "Nguyên tắc cơ bản của cúi chào (お辞儀) là gì?",
    options: [
      { ja: "できるだけ速く頭を下げる", vi: "Cúi đầu càng nhanh càng tốt" },
      { ja: "目を合わせたまま頭だけ下げる", vi: "Chỉ cúi đầu trong khi vẫn nhìn thẳng vào mắt" },
      { ja: "姿勢を正し、背筋を伸ばしたまま腰から折るようにして頭を下げ、一旦止めてゆっくりと上げる", vi: "Chỉnh tư thế thẳng lưng, cúi gập từ eo, dừng lại một chút rồi từ từ ngẩng lên" },
      { ja: "手を叩きながら頭を下げる", vi: "Vừa vỗ tay vừa cúi đầu" },
    ],
    correctIndex: 2,
    explanationVi: "Cúi chào đúng cách: đứng đối diện người đối thoại, giữ tư thế thẳng lưng, cúi gập người từ eo, dừng lại một chút rồi từ từ ngẩng lên.",
    sourceQuoteJa: "ポイントは相手に正体し姿勢を正し、背筋を伸ばしたまま腰から折るようにして頭を下げ、一旦止めてゆっくりと上げることです。",
    sourcePage: 3,
  },
  {
    id: "cs-16",
    chapterId: "cs-ch1",
    questionJa: "食のマナーにおいて基本となることは何か。",
    questionVi: "Điều cơ bản trong quy tắc ứng xử khi ăn (食のマナー) là gì?",
    options: [
      { ja: "すべての料理を一度に提供すること", vi: "Phục vụ tất cả món cùng một lúc" },
      { ja: "料理の説明を一切しないこと", vi: "Hoàn toàn không giải thích về món ăn" },
      { ja: "お客様が要求しない限り何もしないこと", vi: "Không làm gì trừ khi khách yêu cầu" },
      { ja: "社内基準（サービスマニュアル）どおりに料理が提供されているか", vi: "Món ăn có được phục vụ đúng theo tiêu chuẩn nội bộ (sổ tay dịch vụ) không" },
    ],
    correctIndex: 3,
    explanationVi: "Quy tắc ứng xử khi ăn khác nhau tùy món Nhật, món Tây, món Trung Hoa, nhưng điều cơ bản quan trọng nhất là món ăn có được phục vụ đúng theo tiêu chuẩn nội bộ (sổ tay dịch vụ) hay không.",
    sourceQuoteJa: "食のマナーは、和食、洋食、中国料理によって異なりますが、基本は社内基準（サービスマニュアル）どおりに料理が提供されているかが重要です。",
    sourcePage: 4,
  },
  {
    id: "cs-17",
    chapterId: "cs-ch1",
    questionJa: "和食のマナーとして本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu trong quy tắc ứng xử món Nhật (和食)?",
    options: [
      { ja: "料理をすべて一度にまとめて提供する", vi: "Phục vụ tất cả món gộp lại cùng một lúc" },
      { ja: "主賓から料理が提供されているか", vi: "Món ăn có được phục vụ cho khách chính trước không" },
      { ja: "食事のペースに合わせて料理が提供されているか", vi: "Món ăn có được phục vụ theo nhịp độ ăn của khách không" },
      { ja: "料理の説明をしているか", vi: "Có giải thích về món ăn không" },
    ],
    correctIndex: 0,
    explanationVi: "Quy tắc món Nhật được nêu: phục vụ đúng theo tiêu chuẩn nội bộ, phục vụ theo nhịp độ ăn, phục vụ cho khách chính trước, giải thích món ăn, dọn đồ đúng thời điểm — không có ý 'phục vụ tất cả cùng lúc'.",
    sourceQuoteJa: "① 和食のマナー ア 社内基準（サービスマニュアル）どおりに料理が提供されているか確認してください。イ 食事のペースに合わせて料理が提供されているか確認してください。ウ 主賓から料理が提供されているか確認してください。エ 料理の説明をしているか確認してください。",
    sourcePage: 4,
  },
  {
    id: "cs-18",
    chapterId: "cs-ch1",
    questionJa: "洋食のマナーとして正しいものはどれか。",
    questionVi: "Quy tắc ứng xử món Tây (洋食) đúng là gì?",
    options: [
      { ja: "皿に食べ物が少しでも残っていれば絶対に下げない", vi: "Còn chút thức ăn trên đĩa là tuyệt đối không dọn" },
      { ja: "皿に食べ物が残っていないときは、フォーク・ナイフの置き方に関わらず皿を下げる", vi: "Khi trên đĩa không còn thức ăn, dọn đĩa bất kể cách đặt dao nĩa" },
      { ja: "フォークとナイフの位置だけで判断し、食べ物の有無は見ない", vi: "Chỉ phán đoán qua vị trí dao nĩa, không xem còn thức ăn hay không" },
      { ja: "提供が遅れている料理があっても気にしない", vi: "Có món bị chậm cũng không quan tâm" },
    ],
    correctIndex: 1,
    explanationVi: "Với món Tây: khi trên đĩa không còn thức ăn, phải dọn đĩa bất kể cách đặt dao/nĩa như thế nào; đồng thời chú ý các món bị phục vụ chậm.",
    sourceQuoteJa: "皿に食べ物が残っていないときは、フォーク・ナイフの置き方に関わらず皿を下げているか確認してください。",
    sourcePage: 4,
  },
  {
    id: "cs-19",
    chapterId: "cs-ch1",
    questionJa: "中国料理マナーとして本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu trong quy tắc ứng xử món Trung Hoa?",
    options: [
      { ja: "取り分け用の小皿、スプーンや菜箸が足りているか", vi: "Có đủ chén nhỏ chia phần, muỗng, đũa gắp dùng chung không" },
      { ja: "必要な調味料が揃っているか", vi: "Có đủ gia vị cần thiết không" },
      { ja: "料理を運ぶ順番をお客様に事前に投票してもらう", vi: "Cho khách bình chọn trước thứ tự mang món ra" },
      { ja: "必要に応じて食べ方や飲み方を説明しているか", vi: "Có giải thích cách ăn/uống khi cần thiết không" },
    ],
    correctIndex: 2,
    explanationVi: "Quy tắc món Trung Hoa được nêu: đủ chén nhỏ/muỗng/đũa dùng chung, giải thích cách ăn/uống khi cần, đủ gia vị cần thiết, không có món nào bị chậm — không có ý 'cho khách bình chọn thứ tự món'.",
    sourceQuoteJa: "③ 中国料理マナー ア 社内基準（サービスマニュアル）どおりに料理が提供されているか確認してください。イ 取り分け用の小皿、スプーンや菜箸が足りているか確認してください。ウ 必要に応じて食べ方や飲み方を説明しているか確認してください。エ 必要な調味料が揃っているか確認してください。",
    sourcePage: 4,
  },
  {
    id: "cs-20",
    chapterId: "cs-ch1",
    questionJa: "配慮が必要なお客様への対応の基本姿勢として正しいものはどれか。",
    questionVi: "Thái độ cơ bản khi phục vụ khách cần được quan tâm đặc biệt là gì?",
    options: [
      { ja: "言われた場合のみ対応する", vi: "Chỉ xử lý khi khách yêu cầu" },
      { ja: "特別な対応は一切しない", vi: "Hoàn toàn không có xử lý đặc biệt" },
      { ja: "すべて店長に任せる", vi: "Giao hết cho cửa hàng trưởng xử lý" },
      { ja: "言われなくとも見て判断できる場合は率先して対応する", vi: "Dù không được yêu cầu, nếu quan sát mà nhận biết được thì chủ động xử lý trước" },
    ],
    correctIndex: 3,
    explanationVi: "Nếu khách nói ra thì đương nhiên phải xử lý, nhưng ngay cả khi khách không nói mà nhân viên có thể quan sát và nhận biết được, cũng cần chủ động xử lý trước.",
    sourceQuoteJa: "言われれば当然ですが、言われなくとも見て判断できる場合は率先して対応することが必要です。",
    sourcePage: 5,
  },
  {
    id: "cs-21",
    chapterId: "cs-ch1",
    questionJa: "転倒防止のために確認すべきこととして正しいものはどれか。",
    questionVi: "Điều cần kiểm tra để phòng ngừa té ngã là gì?",
    options: [
      { ja: "お客様のテーブルの下や通路が濡れていたり、油汚れや食材ゴミが落ちたりしていないか", vi: "Kiểm tra gầm bàn/lối đi của khách có bị ướt, dính dầu mỡ hoặc rác thực phẩm rơi không" },
      { ja: "お客様の年齢を確認すること", vi: "Kiểm tra tuổi của khách" },
      { ja: "お客様の注文金額を確認すること", vi: "Kiểm tra số tiền order của khách" },
      { ja: "お客様の座席番号を記録すること", vi: "Ghi lại số bàn của khách" },
    ],
    correctIndex: 0,
    explanationVi: "Để phòng ngừa té ngã, phải kiểm tra gầm bàn/lối đi của khách có bị ướt, dính dầu mỡ hoặc rác thực phẩm rơi hay không.",
    sourceQuoteJa: "お客様のテーブルの下や通路が濡れていたり、油汚れや食材ゴミなどが落ちたりしていないか確認してください。（転倒防止のため）",
    sourcePage: 5,
  },
  {
    id: "cs-22",
    chapterId: "cs-ch1",
    questionJa: "配慮が必要なお客様への対応として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là biện pháp hỗ trợ khách cần quan tâm đặc biệt?",
    options: [
      { ja: "食物アレルギーの有無をお伺いする", vi: "Hỏi về dị ứng thực phẩm" },
      { ja: "すべてのお客様に割引券を配る", vi: "Phát phiếu giảm giá cho mọi khách" },
      { ja: "どのテーブルが車椅子に対応できるか確認しておく", vi: "Kiểm tra trước bàn nào phù hợp cho xe lăn" },
      { ja: "どのテーブルが補助犬同伴のお客様に適しているか確認しておく", vi: "Kiểm tra trước bàn nào phù hợp cho khách đi cùng chó hỗ trợ" },
    ],
    correctIndex: 1,
    explanationVi: "Các biện pháp được nêu: hỏi dị ứng thực phẩm, chuẩn bị quà cho trẻ em, kiểm tra bàn phù hợp xe lăn, kiểm tra bàn phù hợp chó dẫn đường — không có 'phát phiếu giảm giá cho mọi khách'.",
    sourceQuoteJa: "ア お客様に食物アレルギーの有無をお伺いしているか確認してください。エ どのテーブルが車椅子に対応できるか確認しておいてください。オ どのテーブルが補助犬同伴のお客様に適しているか確認しておいてください。",
    sourcePage: 5,
  },
  {
    id: "cs-23",
    chapterId: "cs-ch1",
    questionJa: "料理が配膳されるときについて正しいものはどれか。",
    questionVi: "Về thời điểm món ăn được phục vụ, điều đúng là gì?",
    options: [
      { ja: "お客様にとって特に重要な瞬間ではない", vi: "Không phải khoảnh khắc đặc biệt quan trọng với khách" },
      { ja: "できるだけゆっくり配膳するのがよい", vi: "Nên bày món càng chậm càng tốt" },
      { ja: "お客様にとって最も期待が高まる瞬間であり、テーブル全員に遅れなく配膳されることがベスト", vi: "Là khoảnh khắc kỳ vọng của khách lên cao nhất, tốt nhất là tất cả người trên bàn được phục vụ không chậm trễ" },
      { ja: "最初に注文した人にだけ配膳すればよい", vi: "Chỉ cần bày món cho người order đầu tiên" },
    ],
    correctIndex: 2,
    explanationVi: "Thời điểm món ăn được bày ra là khoảnh khắc kỳ vọng của khách lên cao nhất; tốt nhất là toàn bộ khách trên cùng một bàn được phục vụ không chậm trễ và cùng đón nhận khoảnh khắc đó.",
    sourceQuoteJa: "料理が配膳されるときがお客様にとって最も期待が高まる瞬間です。テーブル全員のお客様の料理が遅れなく配膳され、そのときを迎えられることがベストです。",
    sourcePage: 5,
  },
  {
    id: "cs-24",
    chapterId: "cs-ch1",
    questionJa: "同時提供の際、最優先で配膳すべきものは何か。",
    questionVi: "Khi phục vụ đồng thời, món nào cần ưu tiên bày trước nhất?",
    options: [
      { ja: "最も高額な料理", vi: "Món đắt tiền nhất" },
      { ja: "店長が指定した料理", vi: "Món do cửa hàng trưởng chỉ định" },
      { ja: "最後に注文した料理", vi: "Món order sau cùng" },
      { ja: "お子様の料理", vi: "Món của trẻ em" },
    ],
    correctIndex: 3,
    explanationVi: "Ngay cả khi phục vụ đồng thời, món ăn của trẻ em phải được bày ra trước tiên.",
    sourceQuoteJa: "同時提供であっても、お子様の料理が一番先に配膳されているか確認してください。",
    sourcePage: 5,
  },
  {
    id: "cs-25",
    chapterId: "cs-ch1",
    questionJa: "店内飲食後にテイクアウト商品を渡す際の正しい対応はどれか。",
    questionVi: "Cách phục vụ đúng khi giao món mang về sau khi ăn tại quán là gì?",
    options: [
      { ja: "帰る直前にテイクアウト商品を渡し、食べられる期限（消費期限）も必ず伝える", vi: "Đưa món mang về ngay trước lúc khách ra về, đồng thời báo hạn sử dụng (消費期限)" },
      { ja: "来店直後にすぐ渡す", vi: "Đưa ngay khi khách vừa đến" },
      { ja: "消費期限は伝えなくてよい", vi: "Không cần báo hạn sử dụng" },
      { ja: "レジで会計せずに渡す", vi: "Đưa mà không cần thanh toán tại quầy" },
    ],
    correctIndex: 0,
    explanationVi: "Với khách ăn tại quán và có mang thêm món về, phải đưa món mang về ngay trước lúc khách ra về, và bắt buộc phải báo hạn sử dụng (消費期限) của món đó.",
    sourceQuoteJa: "店内飲食をした後、商品をテイクアウトするお客様の料理は、帰る直前にテイクアウト商品をお渡ししているか確認してください。食べられる期限（消費期限）も必ず伝えてください。",
    sourcePage: 5,
  },
  {
    id: "cs-26",
    chapterId: "cs-ch1",
    questionJa: "接客用語の最も重要な役目は何か。",
    questionVi: "Vai trò quan trọng nhất của thuật ngữ tiếp khách là gì?",
    options: [
      { ja: "店のブランドを宣伝すること", vi: "Quảng cáo thương hiệu cửa hàng" },
      { ja: "お客様の意思を確認したり、店側の状況などを伝えたりすること", vi: "Xác nhận ý muốn của khách và truyền đạt tình hình từ phía cửa hàng" },
      { ja: "従業員同士の私語をすること", vi: "Nói chuyện phiếm giữa nhân viên" },
      { ja: "料理の値段を交渉すること", vi: "Thương lượng giá món ăn" },
    ],
    correctIndex: 1,
    explanationVi: "Vai trò quan trọng nhất của thuật ngữ tiếp khách là xác nhận ý muốn của khách hàng và truyền đạt tình hình từ phía cửa hàng.",
    sourceQuoteJa: "接客用語の最も重要な役目は、お客様の意思を確認したり、店側の状況などを伝えたりすることです。",
    sourcePage: 6,
  },
  {
    id: "cs-27",
    chapterId: "cs-ch1",
    questionJa: "お客様に接する際に日本語について求められることは何か。",
    questionVi: "Yêu cầu về tiếng Nhật khi tiếp khách là gì?",
    options: [
      { ja: "できるだけ簡単な言葉だけを使う", vi: "Chỉ dùng từ ngữ đơn giản nhất có thể" },
      { ja: "敬語は使わなくてよい", vi: "Không cần dùng kính ngữ" },
      { ja: "常に丁寧な言葉遣いで接し、態度や目線、表情も言葉と一致させる", vi: "Luôn dùng lời lẽ lịch sự, đồng thời thái độ/ánh mắt/biểu cảm phải khớp với lời nói" },
      { ja: "方言を積極的に使う", vi: "Chủ động dùng phương ngữ" },
    ],
    correctIndex: 2,
    explanationVi: "Tiếng Nhật có kính ngữ, khi tiếp khách phải luôn dùng lời lẽ lịch sự; đồng thời thái độ, ánh mắt, biểu cảm khi nói cũng phải khớp với lời nói.",
    sourceQuoteJa: "日本語には敬語があり、お客様には常に丁寧な言葉遣いで接することが求められます。また、話す態度や目線、表情も言葉と一致させる必要があります。",
    sourcePage: 6,
  },
  {
    id: "cs-28",
    chapterId: "cs-ch1",
    questionJa: "「サジェスティブセールス」とは何か。",
    questionVi: "'Bán hàng gợi ý' (サジェスティブセールス) là gì?",
    options: [
      { ja: "お客様の注文を無視すること", vi: "Bỏ qua order của khách" },
      { ja: "最も安いメニューだけを勧めること", vi: "Chỉ gợi ý món rẻ nhất" },
      { ja: "強引に大量注文させること", vi: "Ép khách order số lượng lớn" },
      { ja: "お得なメニューや新メニュー、お客様の嗜好に合ったメニューなどを推奨し、満足度を向上させること", vi: "Gợi ý thực đơn có lợi, thực đơn mới, hoặc món hợp khẩu vị khách để nâng cao sự hài lòng" },
    ],
    correctIndex: 3,
    explanationVi: "Vì khách hàng không nắm hết mọi thông tin thực đơn khi order, việc gợi ý thực đơn có lợi hơn, thực đơn mới, món hợp khẩu vị khách, hoặc tráng miệng sau bữa ăn giúp nâng cao sự hài lòng của khách.",
    sourceQuoteJa: "お客様はメニューの情報をすべて把握して注文している訳ではないので、よりお得なメニューや新メニュー、お客様の嗜好に合ったメニュー、食後のデザートなどを推奨することで、お客様の満足度を向上させます。",
    sourcePage: 6,
  },
  {
    id: "cs-29",
    chapterId: "cs-ch1",
    questionJa: "電話対応で求められることとして正しいものはどれか。",
    questionVi: "Điều được yêu cầu khi trả lời điện thoại là gì?",
    options: [
      { ja: "相手の表情が見えないので、明るく分かりやすく聞きやすい言葉で対応する", vi: "Vì không thấy biểu cảm đối phương, phải trả lời bằng giọng vui vẻ, dễ hiểu, dễ nghe" },
      { ja: "できるだけ早口で話す", vi: "Nói càng nhanh càng tốt" },
      { ja: "相手の質問には答えず一方的に話す", vi: "Không trả lời câu hỏi mà chỉ nói một chiều" },
      { ja: "専門用語をできるだけ多く使う", vi: "Dùng càng nhiều thuật ngữ chuyên môn càng tốt" },
    ],
    correctIndex: 0,
    explanationVi: "Vì không thấy được biểu cảm của đối phương qua điện thoại, cần trả lời bằng giọng vui vẻ, dễ hiểu, dễ nghe, và trả lời rõ ràng điều đối phương muốn biết.",
    sourceQuoteJa: "電話は相手の表情が見えないので、明るく分かりやすく聞きやすい言葉で対応することが求められます。また、相手が聞きたいことを分かりやすく答えることが必要です。",
    sourcePage: 6,
  },
  {
    id: "cs-30",
    chapterId: "cs-ch1",
    questionJa: "サービスの流れとして正しいものはどれか。",
    questionVi: "Quy trình phục vụ đúng là gì?",
    options: [
      { ja: "注文受け→ご案内→料理提供→水の提供→レジ精算", vi: "Nhận order → Đón khách → Phục vụ món → Phục vụ nước → Thanh toán" },
      { ja: "ご案内→水・おしぼり・メニューの提供→注文受け→料理提供→中間下げ→デザート・ドリンクの提供→レジ精算→下げ", vi: "Đón khách → Phục vụ nước/khăn/thực đơn → Nhận order → Phục vụ món → Dọn giữa bữa → Phục vụ tráng miệng/đồ uống → Thanh toán → Dọn bàn" },
      { ja: "レジ精算→ご案内→注文受け→料理提供", vi: "Thanh toán → Đón khách → Nhận order → Phục vụ món" },
      { ja: "下げ→料理提供→注文受け→ご案内", vi: "Dọn bàn → Phục vụ món → Nhận order → Đón khách" },
    ],
    correctIndex: 1,
    explanationVi: "Quy trình phục vụ chuẩn: đón khách → phục vụ nước/khăn ướt/thực đơn → nhận order → phục vụ món → dọn giữa bữa → phục vụ tráng miệng/đồ uống → thanh toán → dọn bàn. Tuy nhiên khi thiếu nhân lực, các bước này có thể xảy ra đồng thời.",
    sourceQuoteJa: "サービスの流れは、ご案内→水・おしぼり・メニューの提供→注文受け→料理提供→中間下げ→デザート・ドリンクの提供→レジ精算→下げとなりますが、接客人員が少なく、これらのサービスが複数同時に発生してしまうことがあります。",
    sourcePage: 6,
  },
  {
    id: "cs-31",
    chapterId: "cs-ch1",
    questionJa: "接客人員が少なく複数のサービスが同時発生した場合の優先順位として正しいものはどれか。",
    questionVi: "Thứ tự ưu tiên khi nhiều dịch vụ xảy ra đồng thời do thiếu nhân lực là gì?",
    options: [
      { ja: "①下げ②デザート③注文受け④ご案内⑤レジ精算⑥料理提供", vi: "①Dọn bàn②Tráng miệng③Nhận order④Đón khách⑤Thanh toán⑥Phục vụ món" },
      { ja: "①ご案内②注文受け③料理提供④レジ精算⑤デザート⑥下げ", vi: "①Đón khách②Nhận order③Phục vụ món④Thanh toán⑤Tráng miệng⑥Dọn bàn" },
      { ja: "①料理提供②レジ精算③ご案内④注文受け⑤デザート・ドリンクの提供⑥下げ", vi: "①Phục vụ món②Thanh toán③Đón khách④Nhận order⑤Tráng miệng/đồ uống⑥Dọn bàn" },
      { ja: "優先順位はなく、来た順に対応する", vi: "Không có thứ tự ưu tiên, xử lý theo thứ tự đến trước" },
    ],
    correctIndex: 2,
    explanationVi: "Thứ tự ưu tiên: ①phục vụ món②thanh toán③đón khách④nhận order⑤tráng miệng/đồ uống⑥dọn bàn. Ưu tiên phục vụ món trước vì để lâu món sẽ nguội, giảm ngon miệng, khách không quay lại; thanh toán đứng thứ 2 vì khách chờ thanh toán có thể được xoa dịu bằng lời nói.",
    sourceQuoteJa: "その時の優先順位は、①料理提供②レジ精算③ご案内④注文受け⑤デザート・ドリンクの提供⑥下げとなります。料理提供を優先し、レジ精算が２番目に来るのは、待たせすぎると料理が冷めて美味しさが低下し再来店してもらえないからです。また、レジ精算のお客様は声掛けで待ってもらえるからです。",
    sourcePage: 7,
  },
  {
    id: "cs-32",
    chapterId: "cs-ch1",
    questionJa: "顧客管理（カスタマーリレーションズ）とは何か。",
    questionVi: "'Quản lý khách hàng' (顧客管理/Customer Relations) là gì?",
    options: [
      { ja: "顧客データを機械的に保存するだけの作業", vi: "Chỉ đơn thuần là lưu trữ dữ liệu khách hàng" },
      { ja: "クレームを受けたときだけおこなう対応", vi: "Chỉ xử lý khi nhận khiếu nại" },
      { ja: "新規顧客の獲得のみを指す", vi: "Chỉ nói đến việc thu hút khách hàng mới" },
      { ja: "積極的にお客様と店との、より良い関係づくりをみずから図ること", vi: "Chủ động xây dựng mối quan hệ tốt đẹp hơn giữa khách hàng và cửa hàng" },
    ],
    correctIndex: 3,
    explanationVi: "Quản lý khách hàng ở đây không chỉ là quản lý dữ liệu khách mà là chủ động xây dựng mối quan hệ tốt đẹp hơn giữa khách hàng và cửa hàng (Customer Relations).",
    sourceQuoteJa: "ここでいう顧客管理とは単に顧客データを管理するのではなく、積極的にカスタマーリレーションズ＝お客様と店との、より良い関係づくりをみずから図ることです。",
    sourcePage: 8,
  },
  {
    id: "cs-33",
    chapterId: "cs-ch1",
    questionJa: "個人情報保護について正しいものはどれか。",
    questionVi: "Điều đúng về bảo vệ thông tin cá nhân là gì?",
    options: [
      { ja: "顧客データに氏名・住所・電話番号など個人を特定できる情報が含まれる場合、漏えいや紛失、不正利用が発生しないよう十分注意し、従業員を指導・監督する必要がある", vi: "Nếu dữ liệu khách hàng có chứa thông tin định danh cá nhân (tên, địa chỉ, số điện thoại...), phải hết sức chú ý tránh rò rỉ/thất lạc/sử dụng sai mục đích, và hướng dẫn/giám sát nhân viên" },
      { ja: "個人情報は自由に第三者へ渡してよい", vi: "Có thể tự do đưa thông tin cá nhân cho bên thứ ba" },
      { ja: "個人情報保護のルールは従業員に周知する必要はない", vi: "Không cần phổ biến quy tắc bảo vệ thông tin cá nhân cho nhân viên" },
      { ja: "個人情報が含まれるデータは特に管理しなくてよい", vi: "Dữ liệu chứa thông tin cá nhân không cần quản lý gì đặc biệt" },
    ],
    correctIndex: 0,
    explanationVi: "Nếu dữ liệu khách hàng chứa thông tin định danh cá nhân như tên, địa chỉ, số điện thoại, phải hết sức chú ý để tránh rò rỉ, thất lạc, bị nhân viên sử dụng sai mục đích, và phải hướng dẫn/giám sát nhân viên tuân thủ quy tắc.",
    sourceQuoteJa: "顧客データに、氏名、住所、電話番号など、個人を特定できる「個人情報」が含まれる場合は、漏えいや紛失、従業員による不正利用や本来の目的以外での利用などが発生しないよう、十分に注意する必要があります。そのため、従業員にルールを守るよう、指導・監督することが重要です。",
    sourcePage: 8,
  },
  {
    id: "cs-34",
    chapterId: "cs-ch2",
    questionJa: "外食業に携わる人が食に関する知識を持つべき理由は何か。",
    questionVi: "Lý do người làm trong ngành dịch vụ ăn uống cần có kiến thức về ẩm thực là gì?",
    options: [
      { ja: "お客様から見れば全員プロフェッショナルとみなされるため", vi: "Vì trong mắt khách hàng, ai cũng được coi là chuyên gia" },
      { ja: "法律で義務付けられているだけだから", vi: "Chỉ vì luật pháp bắt buộc" },
      { ja: "給料が上がるから", vi: "Vì lương sẽ tăng" },
      { ja: "特に理由はない", vi: "Không có lý do gì đặc biệt" },
    ],
    correctIndex: 0,
    explanationVi: "Người làm trong ngành dịch vụ ăn uống, trong mắt khách hàng, ai cũng được coi là chuyên gia. Do đó, việc có kiến thức về ẩm thực là điều đương nhiên.",
    sourceQuoteJa: "外食業に携わる人はお客様から見れば全員プロフェッショナルとみなされます。したがって、食に関する知識は知っていて当然となります。",
    sourcePage: 8,
  },
  {
    id: "cs-35",
    chapterId: "cs-ch2",
    questionJa: "食物アレルギーのお客様が該当食材を知らずに食べて発症した場合、最悪どうなる可能性があるか。",
    questionVi: "Nếu khách bị dị ứng thực phẩm ăn phải thực phẩm gây dị ứng mà không biết, trường hợp xấu nhất có thể xảy ra điều gì?",
    options: [
      { ja: "軽い発疹が出るだけ", vi: "Chỉ nổi mẩn nhẹ" },
      { ja: "アナフィラキシーショックを起こして呼吸困難になり死亡することもある", vi: "Có thể bị sốc phản vệ dẫn đến khó thở và tử vong" },
      { ja: "味覚が一時的に変わるだけ", vi: "Chỉ thay đổi vị giác tạm thời" },
      { ja: "特に何も起こらない", vi: "Không có gì xảy ra cả" },
    ],
    correctIndex: 1,
    explanationVi: "Nếu khách bị dị ứng thực phẩm ăn phải thực phẩm gây dị ứng mà không biết, trường hợp xấu nhất có thể bị sốc phản vệ dẫn đến khó thở và tử vong.",
    sourceQuoteJa: "食物アレルギーのお客様が知らずに該当する食材を食べて発症すると、最悪の場合、アナフィラキシーショックを起こして呼吸困難になり死亡することもあります。",
    sourcePage: 8,
  },
  {
    id: "cs-36",
    chapterId: "cs-ch2",
    questionJa: "料理に使用されている原材料・食材を正しく把握しておく理由は何か。",
    questionVi: "Lý do cần nắm rõ nguyên liệu/thực phẩm dùng trong món ăn là gì?",
    options: [
      { ja: "コストを計算するため", vi: "Để tính chi phí" },
      { ja: "レシピを他店にコピーされないため", vi: "Để tránh bị quán khác sao chép công thức" },
      { ja: "お客様からの問合せに対応できるようにするため", vi: "Để có thể trả lời khi khách hỏi" },
      { ja: "仕入れ業者を評価するため", vi: "Để đánh giá nhà cung cấp" },
    ],
    correctIndex: 2,
    explanationVi: "Cần nắm rõ nguyên liệu/thực phẩm dùng trong món ăn để có thể trả lời khi khách hàng hỏi.",
    sourceQuoteJa: "料理に使用されている原材料、食材を正しく把握し、お客様からの問合せに対応できるようにしておくことが重要です。",
    sourcePage: 8,
  },
  {
    id: "cs-37",
    chapterId: "cs-ch2",
    questionJa: "コンタミネーション（混入）の恐れがあるものへの対応として正しいものはどれか。",
    questionVi: "Cách xử lý đúng với những thứ có nguy cơ nhiễm chéo (コンタミネーション) là gì?",
    options: [
      { ja: "何も伝えず提供する", vi: "Phục vụ mà không thông báo gì" },
      { ja: "該当するお客様のみ個別に口頭で伝える必要はない", vi: "Không cần nói riêng cho từng khách liên quan" },
      { ja: "メニューから完全に削除する", vi: "Xóa hoàn toàn khỏi thực đơn" },
      { ja: "メニューや店内に記載・掲示するなど、こちらから情報提供する", vi: "Chủ động cung cấp thông tin bằng cách ghi/dán thông báo trên thực đơn hoặc trong quán" },
    ],
    correctIndex: 3,
    explanationVi: "Với những thứ khách không thể tự nhận biết qua thực đơn/hình ảnh (như nước sốt) hoặc có nguy cơ nhiễm chéo, việc chủ động ghi chú/dán thông báo trên thực đơn hoặc trong quán để cung cấp thông tin là hiệu quả.",
    sourceQuoteJa: "コンタミネーション（混入）のおそれがあるものについては、メニューや店内に記載・掲示するなど、こちらから情報提供することも有効です。",
    sourcePage: 8,
  },
  {
    id: "cs-38",
    chapterId: "cs-ch2",
    questionJa: "食物アレルギーに関する情報提供で注意すべきことは何か。",
    questionVi: "Điều cần lưu ý khi cung cấp thông tin về dị ứng thực phẩm là gì?",
    options: [
      { ja: "情報提供した内容が誤っていたり、最新の情報でなかったりしたことで事故になった場合、責任問題となることがある", vi: "Nếu thông tin cung cấp sai hoặc không cập nhật dẫn đến sự cố, có thể phát sinh vấn đề trách nhiệm" },
      { ja: "一度提供した情報は二度と更新しなくてよい", vi: "Thông tin đã cung cấp một lần thì không cần cập nhật lại" },
      { ja: "間違った情報でも提供しないよりはよい", vi: "Thông tin sai vẫn còn hơn không cung cấp" },
      { ja: "情報提供は法律で禁止されている", vi: "Việc cung cấp thông tin bị pháp luật cấm" },
    ],
    correctIndex: 0,
    explanationVi: "Nếu thông tin cung cấp bị sai hoặc không phải thông tin mới nhất, dẫn đến xảy ra sự cố, có thể phát sinh vấn đề trách nhiệm, nên cần hết sức chú ý.",
    sourceQuoteJa: "情報提供した内容が誤っていたり、最新の情報でなかったりしたことで、事故になった場合は、責任問題となることがありますので、十分に注意する必要があります。",
    sourcePage: 8,
  },
  {
    id: "cs-39",
    chapterId: "cs-ch2",
    questionJa: "特定原材料8品目として正しいものはどれか。",
    questionVi: "8 nguyên liệu dị ứng đặc biệt (特定原材料) đúng là gì?",
    options: [
      { ja: "米、大豆、とうもろこし、じゃがいも、にんじん、たまねぎ、キャベツ、トマト", vi: "Gạo, đậu nành, ngô, khoai tây, cà rốt, hành tây, bắp cải, cà chua" },
      { ja: "卵、乳、小麦、そば、落花生、えび、かに、くるみ", vi: "Trứng, sữa, lúa mì, kiều mạch, đậu phộng, tôm, cua, óc chó" },
      { ja: "牛肉、豚肉、鶏肉、羊肉、馬肉、鴨肉、鹿肉、猪肉", vi: "Thịt bò, heo, gà, cừu, ngựa, vịt, hươu, lợn rừng" },
      { ja: "塩、砂糖、酢、醤油、味噌、みりん、酒、油", vi: "Muối, đường, giấm, xì dầu, miso, mirin, rượu, dầu ăn" },
    ],
    correctIndex: 1,
    explanationVi: "8 nguyên liệu dị ứng đặc biệt là: trứng, sữa, lúa mì, kiều mạch (soba), đậu phộng, tôm, cua, óc chó.",
    sourceQuoteJa: "特定原材料８品目（卵、乳、小麦、そば、落花生、えび、かに、くるみ）が入っているメニューを把握しており、ほかの従業員も把握しているか確認してください。",
    sourcePage: 8,
  },
  {
    id: "cs-40",
    chapterId: "cs-ch2",
    questionJa: "そばとうどんを同じ釜でゆでている店舗では何をすべきか。",
    questionVi: "Quán nào luộc mì soba và udon chung một nồi thì phải làm gì?",
    options: [
      { ja: "うどんの提供をやめる", vi: "Ngừng phục vụ udon" },
      { ja: "何もする必要はない", vi: "Không cần làm gì" },
      { ja: "そのことをお客様に伝える", vi: "Thông báo điều đó cho khách" },
      { ja: "そばの提供をやめる", vi: "Ngừng phục vụ soba" },
    ],
    correctIndex: 2,
    explanationVi: "Quán luộc mì soba và udon chung một nồi phải thông báo điều đó cho khách, vì đây là nguy cơ nhiễm chéo với người dị ứng kiều mạch (soba).",
    sourceQuoteJa: "そばとうどんを同じ釜でゆでている店舗では、そのことをお客様に伝えているか確認してください。",
    sourcePage: 9,
  },
  {
    id: "cs-41",
    chapterId: "cs-ch2",
    questionJa: "お酒を提供する際の注意点として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là lưu ý khi phục vụ rượu bia?",
    options: [
      { ja: "未成年者や車両などの運転者にお酒を提供しない", vi: "Không phục vụ rượu cho người chưa thành niên/người điều khiển phương tiện" },
      { ja: "賞味期限があるお酒は期限を確認して提供する", vi: "Kiểm tra hạn dùng nếu rượu có ghi hạn" },
      { ja: "冷やして提供するお酒はよく冷えているか確認する", vi: "Kiểm tra độ lạnh khi phục vụ rượu ướp lạnh" },
      { ja: "お酒は必ず無料で提供する", vi: "Luôn phục vụ rượu miễn phí" },
    ],
    correctIndex: 3,
    explanationVi: "Các lưu ý được nêu: không phục vụ rượu cho người chưa thành niên/người điều khiển phương tiện, kiểm tra hạn sử dụng nếu có, kiểm tra độ lạnh khi phục vụ lạnh — không có ý 'luôn phục vụ miễn phí'.",
    sourceQuoteJa: "ア 未成年者や車両などの運転者にお酒を提供しないよう注意してください。イ 賞味期限があるお酒は期限を確認して提供しているか確認してください。ウ 冷やして提供するお酒はよく冷えているか確認してください。",
    sourcePage: 9,
  },
  {
    id: "cs-42",
    chapterId: "cs-ch2",
    questionJa: "「消費期限」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa 'hạn sử dụng' (消費期限) đúng là gì?",
    options: [
      { ja: "定められた方法により保存した場合、腐敗・変敗など品質劣化に伴い安全性を欠くおそれがないと認められる期限", vi: "Nếu bảo quản đúng cách quy định, là hạn được công nhận không có nguy cơ mất an toàn do hư hỏng/biến chất" },
      { ja: "賞味期限と全く同じ意味", vi: "Có ý nghĩa hoàn toàn giống hạn dùng tốt nhất" },
      { ja: "製造から1年間という固定の期間", vi: "Là khoảng thời gian cố định 1 năm kể từ sản xuất" },
      { ja: "店が自由に決めてよい期間", vi: "Là khoảng thời gian cửa hàng tự do quyết định" },
    ],
    correctIndex: 0,
    explanationVi: "Hạn sử dụng: nếu bảo quản đúng phương pháp quy định, là hạn (thể hiện bằng ngày tháng năm) được công nhận không có nguy cơ mất an toàn do hư hỏng/biến chất hoặc suy giảm chất lượng khác; nếu bảo quản đúng cách khi chưa mở nắp thì không phát sinh vấn đề vệ sinh an toàn thực phẩm. Không được ăn thực phẩm đã quá hạn sử dụng.",
    sourceQuoteJa: "消費期限：定められた方法により保存した場合において、腐敗、変敗その他の品質（状態）の劣化に伴い安全性を欠くことになるおそれがないと認められる期限を示す年月日のことで、開封前の状態で定められた方法により保存すれば食品衛生上の問題が生じないと認められるものです。そのため、消費期限を過ぎた食品は食べないようにしてください。",
    sourcePage: 9,
  },
  {
    id: "cs-43",
    chapterId: "cs-ch2",
    questionJa: "「賞味期限」の定義として正しいものはどれか。",
    questionVi: "Định nghĩa 'hạn dùng tốt nhất' (賞味期限) đúng là gì?",
    options: [
      { ja: "消費期限と全く同じ意味", vi: "Có ý nghĩa hoàn toàn giống hạn sử dụng" },
      { ja: "定められた方法により保存した場合、期待されるすべての品質の保持が十分に可能であると認められる期限", vi: "Nếu bảo quản đúng cách quy định, là hạn được công nhận có thể duy trì đầy đủ mọi chất lượng như kỳ vọng" },
      { ja: "食品を安全に食べられる絶対的な最終日", vi: "Là ngày cuối cùng tuyệt đối có thể ăn an toàn" },
      { ja: "賞味期限を過ぎたら必ず食べられなくなる", vi: "Quá hạn dùng tốt nhất thì chắc chắn không ăn được nữa" },
    ],
    correctIndex: 1,
    explanationVi: "Hạn dùng tốt nhất: nếu bảo quản đúng phương pháp quy định, là hạn được công nhận có thể duy trì đầy đủ mọi chất lượng như kỳ vọng. Tuy nhiên, dù đã quá hạn này, chất lượng đôi khi vẫn được duy trì, nên không nhất thiết là không thể ăn được ngay — người tiêu dùng cần tự phán đoán từng trường hợp cụ thể.",
    sourceQuoteJa: "賞味期限：定められた方法により保存した場合において、期待されるすべての品質の保持が十分に可能であると認められる期限を示す年月日のことです。ただし、当該期限を超えた場合であっても、これらの品質が保持されていることがあります。このため、賞味期限を過ぎた食品であっても、必ずしもすぐに食べられなくなるわけではありませんので、それぞれの食品が食べられるかどうかについては、消費者が個別に判断する必要があります。",
    sourcePage: 9,
  },
  {
    id: "cs-44",
    chapterId: "cs-ch2",
    questionJa: "消費期限と賞味期限のうち、より厳しく管理すべきものはどちらか。",
    questionVi: "Giữa hạn sử dụng và hạn dùng tốt nhất, loại nào cần quản lý nghiêm ngặt hơn?",
    options: [
      { ja: "賞味期限がある食材", vi: "Thực phẩm có hạn dùng tốt nhất" },
      { ja: "どちらも同じレベルで管理すればよい", vi: "Cả hai quản lý cùng mức độ là được" },
      { ja: "消費期限がある食材", vi: "Thực phẩm có hạn sử dụng" },
      { ja: "管理の厳しさに差はない", vi: "Mức độ nghiêm ngặt quản lý không khác nhau" },
    ],
    correctIndex: 2,
    explanationVi: "Cả thực phẩm quá hạn sử dụng và quá hạn dùng tốt nhất đều không được phục vụ, nhưng thực phẩm có hạn sử dụng cần được quản lý nghiêm ngặt hơn (vì liên quan trực tiếp đến an toàn).",
    sourceQuoteJa: "消費期限、賞味期限とも過ぎたものは提供してはいけませんが、管理をより厳しくするものは消費期限がある食材です。",
    sourcePage: 10,
  },
  {
    id: "cs-45",
    chapterId: "cs-ch2",
    questionJa: "消費期限・賞味期限の保証について正しいものはどれか。",
    questionVi: "Điều đúng về sự bảo đảm của hạn sử dụng/hạn dùng tốt nhất là gì?",
    options: [
      { ja: "開封後も無期限にメーカーが保証する", vi: "Sau khi mở nắp, nhà sản xuất vẫn bảo hành vô thời hạn" },
      { ja: "保存方法が違っても期限は変わらない", vi: "Dù bảo quản khác cách thì hạn cũng không đổi" },
      { ja: "一度開封しても保証は変わらない", vi: "Mở nắp một lần thì sự bảo đảm cũng không đổi" },
      { ja: "未開封で決められた保存状態での期限であり、一度開封したり異なる保存方法をしたりするとメーカーの保証はなくなる", vi: "Là hạn áp dụng khi chưa mở nắp và bảo quản đúng cách quy định; nếu đã mở nắp hoặc bảo quản khác cách, sự bảo đảm của nhà sản xuất sẽ mất hiệu lực" },
    ],
    correctIndex: 3,
    explanationVi: "Cả hạn sử dụng và hạn dùng tốt nhất đều là hạn áp dụng khi thực phẩm còn nguyên chưa mở nắp và được bảo quản theo đúng cách quy định; nếu đã mở nắp một lần hoặc bảo quản theo cách khác, sự bảo đảm của nhà sản xuất sẽ không còn hiệu lực.",
    sourceQuoteJa: "消費期限、賞味期限は、ともに未開封で、かつ、決められた保存状態での期限で、一度開封してしまったり、異なる保存方法をしてしまったりするとメーカーの保証はなくなります。",
    sourcePage: 10,
  },
  {
    id: "cs-46",
    chapterId: "cs-ch2",
    questionJa: "一度開封したものはどのように使用すべきか。",
    questionVi: "Thực phẩm đã mở nắp một lần thì phải sử dụng như thế nào?",
    options: [
      { ja: "店あるいは会社で決めた使用期間ルールで使用する", vi: "Sử dụng theo quy tắc thời gian sử dụng do cửa hàng/công ty quy định" },
      { ja: "メーカー表示の期限のまま無期限に使用してよい", vi: "Vẫn dùng theo hạn ghi trên bao bì vô thời hạn" },
      { ja: "できるだけ長く保管してから使う", vi: "Bảo quản càng lâu càng tốt rồi mới dùng" },
      { ja: "すぐに廃棄しなければならない", vi: "Phải vứt bỏ ngay lập tức" },
    ],
    correctIndex: 0,
    explanationVi: "Thực phẩm đã mở nắp một lần phải được sử dụng theo quy tắc thời gian sử dụng do cửa hàng hoặc công ty tự quy định.",
    sourceQuoteJa: "一度開封したものは、店あるいは会社で決めた使用期間ルールで使用します。",
    sourcePage: 10,
  },
  {
    id: "cs-47",
    chapterId: "cs-ch2",
    questionJa: "お客様から味がおかしいとクレームがあった場合の正しい対応はどれか。",
    questionVi: "Cách xử lý đúng khi khách khiếu nại vị món ăn có vấn đề là gì?",
    options: [
      { ja: "クレームを無視する", vi: "Phớt lờ khiếu nại" },
      { ja: "自分で味を確認し、作った従業員に工程を確認する", vi: "Tự mình kiểm tra vị và hỏi lại quy trình với nhân viên đã làm món đó" },
      { ja: "すぐに全額返金するだけで済ませる", vi: "Chỉ cần hoàn tiền toàn bộ ngay là xong" },
      { ja: "お客様の味覚のせいにする", vi: "Đổ lỗi cho khẩu vị của khách" },
    ],
    correctIndex: 1,
    explanationVi: "Khi khách khiếu nại vị món ăn có vấn đề, phải tự mình kiểm tra vị và hỏi lại quy trình chế biến với nhân viên đã làm món đó.",
    sourceQuoteJa: "お客様から味がおかしいとクレームがあった場合、自分で味を確認し、作った従業員に工程を確認してください。",
    sourcePage: 10,
  },
  {
    id: "cs-48",
    chapterId: "cs-ch2",
    questionJa: "味の問題が発見された場合、再発防止のためにすべきことは何か。",
    questionVi: "Để phòng ngừa tái diễn khi phát hiện vấn đề về vị món ăn, cần làm gì?",
    options: [
      { ja: "担当した従業員だけに口頭で注意する", vi: "Chỉ nhắc miệng nhân viên phụ trách" },
      { ja: "特に何もしなくてよい", vi: "Không cần làm gì đặc biệt" },
      { ja: "原因を見つけ、問題点を店内で共有する", vi: "Tìm nguyên nhân và chia sẻ vấn đề trong nội bộ cửa hàng" },
      { ja: "次回から同じメニューを提供しない", vi: "Từ lần sau không phục vụ món đó nữa" },
    ],
    correctIndex: 2,
    explanationVi: "Nếu có vấn đề, phải tìm ra nguyên nhân và chia sẻ vấn đề đó trong nội bộ cửa hàng để phòng ngừa tái diễn.",
    sourceQuoteJa: "問題があった場合、原因を見つけ再発防止のため、問題点を店内で共有してください。",
    sourcePage: 10,
  },
  {
    id: "cs-49",
    chapterId: "cs-ch2",
    questionJa: "ハラール（イスラム圏での原材料基準）について正しいものはどれか。",
    questionVi: "Điều đúng về Halal (tiêu chuẩn nguyên liệu theo đạo Hồi) là gì?",
    options: [
      { ja: "アルコールを使った料理も問題ない", vi: "Món dùng cồn cũng không sao" },
      { ja: "豚肉以外はすべて自由に使える", vi: "Ngoài thịt heo thì dùng gì cũng được" },
      { ja: "特に制限はない", vi: "Không có giới hạn gì đặc biệt" },
      { ja: "アルコールは使えないため、食材にアルコールをかけることはできない", vi: "Không được dùng cồn, nên không thể rưới rượu lên nguyên liệu" },
    ],
    correctIndex: 3,
    explanationVi: "Halal (tiêu chuẩn nguyên liệu theo đạo Hồi) không cho phép dùng cồn, nên không thể rưới rượu lên nguyên liệu thực phẩm.",
    sourceQuoteJa: "特に、ハラール（イスラム圏での原材料基準）ではアルコールは使えないため、食材にアルコールをかけることはできませんので注意してください。",
    sourcePage: 10,
  },
  {
    id: "cs-50",
    chapterId: "cs-ch2",
    questionJa: "ムスリムやベジタリアンなどのお客様が来店したときに望まれる対応はどれか。",
    questionVi: "Cách phục vụ được khuyến nghị khi khách theo đạo Hồi hoặc ăn chay đến quán là gì?",
    options: [
      { ja: "できるだけそのお客様が食べられないものを除いて確認を取ってから料理を提供する", vi: "Cố gắng loại bỏ những thứ khách không ăn được, xác nhận rồi mới phục vụ" },
      { ja: "通常のメニューをそのまま提供する", vi: "Cứ phục vụ thực đơn thông thường" },
      { ja: "特別な確認は不要", vi: "Không cần xác nhận gì đặc biệt" },
      { ja: "来店を断る", vi: "Từ chối phục vụ" },
    ],
    correctIndex: 0,
    explanationVi: "Khi khách theo đạo Hồi (Muslim), ăn chay v.v. đến quán, nên cố gắng loại trừ những thứ khách không ăn được, xác nhận với khách rồi mới phục vụ món ăn.",
    sourceQuoteJa: "ムスリムやベジタリアンなどのお客様が来店したときは、できるだけそのお客様が食べられないものを除いて確認を取ってから料理を提供することが望まれます。",
    sourcePage: 10,
  },
  {
    id: "cs-51",
    chapterId: "cs-ch2",
    questionJa: "食の多様化に関する説明として正しいものはどれか。",
    questionVi: "Giải thích đúng về sự đa dạng hóa ẩm thực (食の多様化) là gì?",
    options: [
      { ja: "日本では食の多様化に対応する必要はない", vi: "Nhật Bản không cần ứng phó với đa dạng hóa ẩm thực" },
      { ja: "ハラール、ベジタリアン、ヴィーガンなど、多様な食の背景を持つお客様への配慮が必要", vi: "Cần quan tâm đến khách có nền tảng ẩm thực đa dạng như Halal, ăn chay, thuần chay" },
      { ja: "すべての外国人客は同じ食習慣を持つ", vi: "Mọi khách nước ngoài đều có cùng thói quen ăn uống" },
      { ja: "食の多様化はレストランには関係ない", vi: "Đa dạng hóa ẩm thực không liên quan gì đến nhà hàng" },
    ],
    correctIndex: 1,
    explanationVi: "Sự đa dạng hóa ẩm thực đã được giải thích trong giáo trình cấp 1 về Halal, ăn chay (vegetarian), thuần chay (vegan) — cho thấy cần quan tâm đến khách có nền tảng ẩm thực đa dạng.",
    sourceQuoteJa: "食の多様化については特定技能１号のテキストでハラール、ベジタリアン、ヴィーガンについて説明しました。",
    sourcePage: 10,
  },
  {
    id: "cs-52",
    chapterId: "cs-ch3",
    questionJa: "開店準備と閉店作業の目的として正しいものはどれか。",
    questionVi: "Mục đích của công tác chuẩn bị mở cửa và đóng cửa là gì?",
    options: [
      { ja: "開店準備はお客様に気持ちよく来店してもらうためのもので、閉店作業は安全確認と次の日の準備のためのもの", vi: "Chuẩn bị mở cửa là để khách hàng đến quán một cách thoải mái, còn công tác đóng cửa là để xác nhận an toàn và chuẩn bị cho khách ngày hôm sau" },
      { ja: "開店準備は経費削減のためのもの", vi: "Chuẩn bị mở cửa chỉ để tiết kiệm chi phí" },
      { ja: "閉店作業は従業員の残業時間を増やすためのもの", vi: "Công tác đóng cửa là để tăng giờ làm thêm cho nhân viên" },
      { ja: "どちらも特に目的はない", vi: "Cả hai công tác đều không có mục đích gì đặc biệt" },
    ],
    correctIndex: 0,
    explanationVi: "Chuẩn bị mở cửa nhằm giúp khách hàng đến quán một cách thoải mái, còn công tác đóng cửa nhằm xác nhận an toàn và chuẩn bị cho khách hàng ngày hôm sau.",
    sourceQuoteJa: "開店準備はお客様に気持ちよく来店してもらうためのもので、閉店作業は安全確認と次の日のお客様のために準備するためのものです。",
    sourcePage: 10,
  },
  {
    id: "cs-53",
    chapterId: "cs-ch3",
    questionJa: "客席の開店準備で最初におこなうべきことは何か。",
    questionVi: "Việc đầu tiên cần làm khi chuẩn bị mở cửa cho khu vực bàn khách là gì?",
    options: [
      { ja: "BGMをかける", vi: "Bật nhạc nền" },
      { ja: "空調機の電源を入れること（店内の温度調整には時間がかかるため）", vi: "Bật nguồn máy điều hòa (vì điều chỉnh nhiệt độ trong quán cần thời gian)" },
      { ja: "テーブルを拭くこと", vi: "Lau bàn" },
      { ja: "従業員の点呼をとること", vi: "Điểm danh nhân viên" },
    ],
    correctIndex: 1,
    explanationVi: "Việc đầu tiên cần làm là bật nguồn máy điều hòa, vì việc tăng/giảm nhiệt độ trong quán cần thời gian, phải bật trước để đạt nhiệt độ tối ưu khi mở cửa.",
    sourceQuoteJa: "客席については、開店準備は最初に空調機の電源を入れているか確認してください。店内の温度を上げたり下げたりするには時間がかかるので、開店時に最適にするために必要です。",
    sourcePage: 10,
  },
  {
    id: "cs-54",
    chapterId: "cs-ch3",
    questionJa: "フライヤーやグリドル、湯煎などの調理設備はいつスイッチを入れるべきか。",
    questionVi: "Nên bật công tắc các thiết bị bếp như chảo chiên, bàn nướng, bồn ủ nhiệt vào lúc nào?",
    options: [
      { ja: "開店直後", vi: "Ngay sau khi mở cửa" },
      { ja: "閉店直前", vi: "Ngay trước khi đóng cửa" },
      { ja: "開店30分前", vi: "30 phút trước khi mở cửa" },
      { ja: "営業中いつでもよい", vi: "Bất cứ lúc nào trong giờ mở cửa" },
    ],
    correctIndex: 2,
    explanationVi: "Các thiết bị như chảo chiên, bàn nướng, bồn ủ nhiệt cần thời gian sau khi bật công tắc/mồi lửa mới có thể sử dụng được, nên phải bật/mồi lửa từ 30 phút trước khi mở cửa.",
    sourceQuoteJa: "調理設備については、フライヤー、グリドル、湯煎などはスイッチを入れたり、点火したりしてから使用できるようになるまでに時間がかかるので、開店３０分前にスイッチを入れたり点火したりしているか確認してください。",
    sourcePage: 11,
  },
  {
    id: "cs-55",
    chapterId: "cs-ch3",
    questionJa: "開店準備のチェック項目として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là mục kiểm tra khi chuẩn bị mở cửa?",
    options: [
      { ja: "BGMや照明が開店時間までに作動しているか", vi: "Nhạc nền/ánh sáng có hoạt động đúng giờ mở cửa không" },
      { ja: "予定どおりの従業員が出勤しているか", vi: "Nhân viên có đến làm đúng lịch không" },
      { ja: "従業員の身だしなみが正しいか", vi: "Tác phong nhân viên có đúng chuẩn không" },
      { ja: "当日の天気予報を確認しているか", vi: "Có kiểm tra dự báo thời tiết trong ngày không" },
    ],
    correctIndex: 3,
    explanationVi: "Các mục kiểm tra chuẩn bị mở cửa được nêu: BGM/ánh sáng hoạt động đúng giờ, nhân viên đến đúng lịch, gọi điện xác nhận nhân viên chưa đến, liên hệ nhân viên khác khi có người nghỉ, tác phong nhân viên đúng chuẩn — không có mục 'kiểm tra dự báo thời tiết'.",
    sourceQuoteJa: "ウ BGM や照明などが開店時間までに作動しているか確認してください。エ 予定どおりの従業員が出勤しているか確認してください。キ 従業員の身だしなみが正しいか確認してください。",
    sourcePage: 11,
  },
  {
    id: "cs-56",
    chapterId: "cs-ch3",
    questionJa: "従業員が欠勤の場合、正しい対応はどれか。",
    questionVi: "Khi nhân viên nghỉ làm, cách xử lý đúng là gì?",
    options: [
      { ja: "ほかの従業員に連絡をして出勤を要請する", vi: "Liên lạc nhân viên khác để yêu cầu đến làm thay" },
      { ja: "そのまま人手不足で営業する", vi: "Cứ vận hành với tình trạng thiếu người" },
      { ja: "店を臨時休業にする", vi: "Đóng cửa tạm thời" },
      { ja: "何もせず様子を見る", vi: "Không làm gì, chờ xem tình hình" },
    ],
    correctIndex: 0,
    explanationVi: "Khi có nhân viên nghỉ làm, phải liên lạc nhân viên khác để yêu cầu đến làm thay.",
    sourceQuoteJa: "欠勤の場合、ほかの従業員に連絡をして出勤を要請してください。",
    sourcePage: 11,
  },
  {
    id: "cs-57",
    chapterId: "cs-ch3",
    questionJa: "ラストオーダーのタイミングをキッチン担当者と確認・調整する目的は何か。",
    questionVi: "Mục đích xác nhận/điều chỉnh thời điểm gọi món cuối với bếp là gì?",
    options: [
      { ja: "厨房の在庫を減らすため", vi: "Để giảm tồn kho bếp" },
      { ja: "ギリギリに入店したお客様への配慮をするため", vi: "Để quan tâm đến khách vào quán sát giờ đóng cửa" },
      { ja: "従業員の残業を減らすため", vi: "Để giảm giờ làm thêm của nhân viên" },
      { ja: "食材コストを削減するため", vi: "Để cắt giảm chi phí nguyên liệu" },
    ],
    correctIndex: 1,
    explanationVi: "Việc xác nhận và điều chỉnh thời điểm gọi món cuối với bộ phận bếp nhằm quan tâm đến những khách vào quán sát giờ đóng cửa.",
    sourceQuoteJa: "ラストオーダーのタイミングをキッチンの担当者と確認し、調整しているか確認してください。（ギリギリに入店したお客様への配慮をしてください）",
    sourcePage: 11,
  },
  {
    id: "cs-58",
    chapterId: "cs-ch3",
    questionJa: "レジ締めで不足又は過金が出た場合の正しい対応はどれか。",
    questionVi: "Cách xử lý đúng khi sổ quỹ bị thiếu hoặc dư tiền là gì?",
    options: [
      { ja: "金額を無視して次の日に持ち越す", vi: "Bỏ qua số tiền lệch, để dồn qua ngày mai" },
      { ja: "従業員に弁償させるだけで済ませる", vi: "Chỉ bắt nhân viên bồi thường là xong" },
      { ja: "原因を調べる", vi: "Tìm hiểu nguyên nhân" },
      { ja: "店長の給料から補填する", vi: "Bù từ lương của cửa hàng trưởng" },
    ],
    correctIndex: 2,
    explanationVi: "Khi sổ quỹ bị thiếu hoặc dư tiền, phải tìm hiểu nguyên nhân.",
    sourceQuoteJa: "レジ締めで不足又は過金が出た場合、原因を調べているか確認してください。",
    sourcePage: 11,
  },
  {
    id: "cs-59",
    chapterId: "cs-ch3",
    questionJa: "閉店作業のチェック項目として本文に挙げられていないものはどれか。",
    questionVi: "Điều nào KHÔNG được nêu là mục kiểm tra khi đóng cửa?",
    options: [
      { ja: "翌日への持ち越し食材を正しく処理をしているか", vi: "Nguyên liệu để lại ngày mai có được xử lý đúng không" },
      { ja: "火の元の安全確認ができているか", vi: "Đã xác nhận an toàn nguồn lửa chưa" },
      { ja: "セキュリティー装置が適正にセットされているか", vi: "Thiết bị an ninh đã được cài đặt đúng chưa" },
      { ja: "翌日の予約状況をすべて確認しているか", vi: "Đã kiểm tra hết tình hình đặt bàn ngày mai chưa" },
    ],
    correctIndex: 3,
    explanationVi: "Các mục kiểm tra đóng cửa được nêu: xử lý đúng nguyên liệu tồn qua ngày sau, kiểm tra an toàn nguồn lửa, cài đặt đúng thiết bị an ninh, xác nhận thời điểm gọi món cuối, kiểm tra sai lệch quỹ — không có mục 'kiểm tra hết đặt bàn ngày mai'.",
    sourceQuoteJa: "ウ 翌日への持ち越し食材を正しく処理をしているか確認してください。エ 火の元の安全確認ができているか確認してください。オ セキュリティー装置がある場合、適正にセットされているか確認してください。",
    sourcePage: 11,
  },
  {
    id: "cs-60",
    chapterId: "cs-ch3",
    questionJa: "店舗の清潔感について正しいものはどれか。",
    questionVi: "Điều đúng về cảm giác sạch sẽ của cửa hàng là gì?",
    options: [
      { ja: "誰でも見た目で清潔感を感じたなら、その店を利用する動機の一つになる", vi: "Nếu ai cũng cảm nhận được sự sạch sẽ qua vẻ ngoài, đó sẽ là một trong những động lực để họ dùng quán đó" },
      { ja: "清潔感は来店動機とは無関係", vi: "Cảm giác sạch sẽ không liên quan gì đến động lực đến quán" },
      { ja: "清潔感は従業員だけが気にすればよい", vi: "Chỉ nhân viên cần quan tâm đến sự sạch sẽ" },
      { ja: "清潔感の基準は店舗ごとに設定不要", vi: "Không cần đặt tiêu chuẩn sạch sẽ riêng cho từng cửa hàng" },
    ],
    correctIndex: 0,
    explanationVi: "Nếu ai cũng cảm nhận được sự sạch sẽ qua vẻ ngoài, đó sẽ là một trong những động lực để họ sử dụng quán đó.",
    sourceQuoteJa: "誰でも見た目で清潔感を感じたなら、その店を利用する動機の一つになります。",
    sourcePage: 13,
  },
  {
    id: "cs-61",
    chapterId: "cs-ch3",
    questionJa: "清掃の教育訓練を最初に誰がおこなうべきか。",
    questionVi: "Ai nên là người đầu tiên đào tạo về dọn dẹp vệ sinh?",
    options: [
      { ja: "新人従業員", vi: "Nhân viên mới" },
      { ja: "店舗責任者みずから", vi: "Chính người phụ trách cửa hàng" },
      { ja: "外部の清掃業者", vi: "Công ty vệ sinh bên ngoài" },
      { ja: "アルバイトのリーダー", vi: "Trưởng nhóm nhân viên bán thời gian" },
    ],
    correctIndex: 1,
    explanationVi: "Đào tạo dọn dẹp phải do chính người phụ trách cửa hàng hướng dẫn đầu tiên; nếu giao cho nhân viên khác, có thể dẫn đến việc học sai cách.",
    sourceQuoteJa: "清掃の教育訓練は、一番最初に店舗責任者みずから指導しなければなりません。ほかの従業員に任せると、間違った覚え方をすることがあります。",
    sourcePage: 13,
  },
  {
    id: "cs-62",
    chapterId: "cs-ch3",
    questionJa: "モップの正しい使い方はどれか。",
    questionVi: "Cách dùng cây lau nhà (mop) đúng là gì?",
    options: [
      { ja: "糸を束ねたまま前へ進みながら拭く", vi: "Để nguyên sợi lau bó lại, tiến về phía trước khi lau" },
      { ja: "円を描くように速く拭く", vi: "Lau nhanh theo hình tròn" },
      { ja: "糸を広げて「８」の字を描き、後ろへ下がりながら拭く", vi: "Banh sợi lau ra, vẽ hình số 8 và lùi dần về sau khi lau" },
      { ja: "水を使わず乾いたまま拭く", vi: "Lau khô, không dùng nước" },
    ],
    correctIndex: 2,
    explanationVi: "Cách dùng mop đúng: banh sợi lau ra, vẽ hình số 8 và lùi dần về sau trong khi lau.",
    sourceQuoteJa: "モップを正しく使っている（糸を広げて「８」の字を描き後ろへ下がりながら拭く）か、確認してください。",
    sourcePage: 13,
  },
  {
    id: "cs-63",
    chapterId: "cs-ch3",
    questionJa: "洗剤を使用する際に注意すべきことは何か。",
    questionVi: "Điều cần lưu ý khi dùng chất tẩy rửa là gì?",
    options: [
      { ja: "できるだけ濃い濃度で使う", vi: "Dùng nồng độ càng đậm đặc càng tốt" },
      { ja: "水で薄めず原液のまま使う", vi: "Dùng nguyên chất, không pha loãng với nước" },
      { ja: "濃度は気にしなくてよい", vi: "Không cần để ý nồng độ" },
      { ja: "正しい希釈濃度で使う", vi: "Dùng đúng nồng độ pha loãng quy định" },
    ],
    correctIndex: 3,
    explanationVi: "Khi dùng chất tẩy rửa, phải dùng đúng nồng độ pha loãng quy định.",
    sourceQuoteJa: "洗剤などを正しい希釈濃度で使っているか、確認してください。",
    sourcePage: 13,
  },
  {
    id: "cs-64",
    chapterId: "cs-ch3",
    questionJa: "窓ガラスを清掃する正しい方法はどれか。",
    questionVi: "Cách lau kính cửa sổ đúng là gì?",
    options: [
      { ja: "スクイジーを使って正しい手順でふく", vi: "Dùng dụng cụ gạt kính (squeegee) theo đúng quy trình" },
      { ja: "乾いた布だけでこする", vi: "Chỉ chà bằng khăn khô" },
      { ja: "洗剤を使わずに水だけでふく", vi: "Chỉ lau bằng nước, không dùng chất tẩy rửa" },
      { ja: "手順は特に決まっていない", vi: "Không có quy trình cố định nào" },
    ],
    correctIndex: 0,
    explanationVi: "Kính cửa sổ phải được lau bằng dụng cụ gạt kính (squeegee) theo đúng quy trình.",
    sourceQuoteJa: "窓ガラスはスクイジーを使って正しい手順でふいているか、確認してください。",
    sourcePage: 13,
  },
  {
    id: "cs-65",
    chapterId: "cs-ch3",
    questionJa: "清掃スケジュールについて正しいものはどれか。",
    questionVi: "Điều đúng về lịch trình dọn dẹp vệ sinh là gì?",
    options: [
      { ja: "すべて毎日おこなえばよい", vi: "Làm mỗi ngày là đủ cho mọi việc" },
      { ja: "日ごと、週ごと、月ごとのスケジュールが実行されているか確認する必要がある", vi: "Cần kiểm tra lịch trình theo ngày, tuần, tháng có được thực hiện không" },
      { ja: "清掃スケジュールは作成不要", vi: "Không cần lập lịch trình dọn dẹp" },
      { ja: "月に1回だけおこなえば十分", vi: "Chỉ cần làm 1 lần/tháng là đủ" },
    ],
    correctIndex: 1,
    explanationVi: "Cần kiểm tra xem lịch trình dọn dẹp (theo ngày, theo tuần, theo tháng) có được thực hiện đầy đủ không.",
    sourceQuoteJa: "清掃スケジュール（日ごと、週ごと、月ごと）が実行されているか、確認してください。",
    sourcePage: 13,
  },
  {
    id: "cs-66",
    chapterId: "cs-ch3",
    questionJa: "釣銭在庫について確認すべきこととして正しいものはどれか。",
    questionVi: "Điều cần kiểm tra về tồn quỹ tiền lẻ (釣銭) là gì?",
    options: [
      { ja: "釣銭在庫は確認不要", vi: "Không cần kiểm tra tồn quỹ tiền lẻ" },
      { ja: "釣銭在庫は多ければ多いほどよい", vi: "Tồn quỹ tiền lẻ càng nhiều càng tốt" },
      { ja: "釣銭在庫が十分か、また不足が予想される場合の対応をあらかじめ確認しておく", vi: "Kiểm tra tồn quỹ có đủ không, và chuẩn bị trước cách xử lý khi dự đoán sẽ thiếu" },
      { ja: "釣銭在庫は月末にのみ確認すればよい", vi: "Chỉ cần kiểm tra vào cuối tháng" },
    ],
    correctIndex: 2,
    explanationVi: "Cần kiểm tra tồn quỹ tiền lẻ có đủ không, và chuẩn bị sẵn cách xử lý cho trường hợp dự đoán sẽ thiếu.",
    sourceQuoteJa: "釣銭在庫が十分か確認してください。釣銭在庫の不足が予想される場合の対応をあらかじめ確認しておいてください。",
    sourcePage: 16,
  },
  {
    id: "cs-67",
    chapterId: "cs-ch3",
    questionJa: "新しいキャッシュレス決済方法が導入された場合の対応はどれか。",
    questionVi: "Cách xử lý khi có phương thức thanh toán không tiền mặt mới được áp dụng là gì?",
    options: [
      { ja: "導入しないよう店長に進言する", vi: "Đề nghị cửa hàng trưởng không áp dụng" },
      { ja: "従業員には知らせなくてよい", vi: "Không cần thông báo cho nhân viên" },
      { ja: "お客様が使うまで対応を考えなくてよい", vi: "Không cần nghĩ cách xử lý cho đến khi có khách dùng" },
      { ja: "その処理方法を熟知しておく", vi: "Nắm vững cách xử lý phương thức đó" },
    ],
    correctIndex: 3,
    explanationVi: "Khi có phương thức thanh toán không tiền mặt mới được áp dụng, phải nắm vững cách xử lý phương thức đó.",
    sourceQuoteJa: "新しいキャッシュレス決済方法が導入された場合、その処理方法を熟知しておいてください。",
    sourcePage: 16,
  },
  {
    id: "cs-68",
    chapterId: "cs-ch3",
    questionJa: "レジを締めた時に重要なことは何か。",
    questionVi: "Điều quan trọng khi chốt sổ quỹ (レジ締め) là gì?",
    options: [
      { ja: "ロール上の現金有り高と、実際の現金有り高が一致していること", vi: "Số tiền mặt ghi trên cuộn giấy và số tiền mặt thực tế phải khớp nhau" },
      { ja: "できるだけ早く締めること", vi: "Chốt sổ càng nhanh càng tốt" },
      { ja: "金額を確認せず次の日に回すこと", vi: "Không kiểm tra số tiền, để dồn qua ngày sau" },
      { ja: "現金のみを数え、レシートは無視すること", vi: "Chỉ đếm tiền mặt, bỏ qua hóa đơn" },
    ],
    correctIndex: 0,
    explanationVi: "Khi chốt sổ quỹ, điều quan trọng là số tiền mặt ghi trên cuộn giấy và số tiền mặt thực tế phải khớp nhau.",
    sourceQuoteJa: "レジを締めた時、ロール上の現金有り高と、実際の現金有り高が一致していることが重要です。",
    sourcePage: 16,
  },
  {
    id: "cs-69",
    chapterId: "cs-ch3",
    questionJa: "レジ締めで誤差が出るということは何を意味するか。",
    questionVi: "Việc sổ quỹ bị lệch có nghĩa là gì?",
    options: [
      { ja: "従業員が休憩を多く取ったこと", vi: "Nhân viên nghỉ giải lao nhiều" },
      { ja: "受け取るべき代金を少なくあるいは多く受け取っているか、お客様に渡すべき釣銭を少なくあるいは多く渡していること", vi: "Thu tiền của khách ít hơn hoặc nhiều hơn mức đúng, hoặc trả tiền thối ít hơn hoặc nhiều hơn mức đúng" },
      { ja: "店の電気代が高くなったこと", vi: "Tiền điện của quán tăng cao" },
      { ja: "お客様の人数が多かったこと", vi: "Số lượng khách đông" },
    ],
    correctIndex: 1,
    explanationVi: "Việc sổ quỹ bị lệch có nghĩa là thu tiền của khách ít hơn hoặc nhiều hơn mức đúng, hoặc trả tiền thối ít hơn hoặc nhiều hơn mức đúng.",
    sourceQuoteJa: "誤差が出るということは、受け取るべき代金を少なくあるいは多く受け取っているか、お客様に渡すべき釣銭を少なくあるいは多く渡しているかのどちらかです。",
    sourcePage: 16,
  },
  {
    id: "cs-70",
    chapterId: "cs-ch3",
    questionJa: "実際の現金有り高がロール上の現金有り高より多い場合、どうなる可能性があるか。",
    questionVi: "Nếu số tiền mặt thực tế nhiều hơn số ghi trên sổ quỹ thì có thể dẫn đến điều gì?",
    options: [
      { ja: "店に損失が発生する", vi: "Cửa hàng bị thiệt hại" },
      { ja: "何も問題は起きない", vi: "Không có vấn đề gì xảy ra" },
      { ja: "お客様に損失が発生し、信頼を損ね客数を減らす要因になる", vi: "Khách hàng bị thiệt hại, làm mất lòng tin và là nguyên nhân giảm lượng khách" },
      { ja: "従業員の給料が上がる", vi: "Lương nhân viên tăng lên" },
    ],
    correctIndex: 2,
    explanationVi: "Nếu tiền mặt thực tế ít hơn số ghi trên sổ quỹ, cửa hàng sẽ chịu thiệt hại; ngược lại nếu tiền mặt thực tế nhiều hơn, khách hàng sẽ chịu thiệt hại (bị thu thừa hoặc trả thiếu tiền thối), làm mất lòng tin và là nguyên nhân giảm lượng khách.",
    sourceQuoteJa: "ロール上の現金有り高より実際の現金有り高が少なければ、店に損失が発生することになり、逆に、実際の現金有り高が多ければ、お客様に損失が発生することになり、信頼を損ね客数を減らす要因になります。",
    sourcePage: 16,
  },
  {
    id: "cs-71",
    chapterId: "cs-ch3",
    questionJa: "売上金を夜間金庫に投入する際の正しいルールはどれか。",
    questionVi: "Quy tắc đúng khi nộp tiền doanh thu vào két đêm (夜間金庫) là gì?",
    options: [
      { ja: "一人でおこなえばよい", vi: "Một người làm là đủ" },
      { ja: "翌日用の釣銭も一緒に投入する", vi: "Nộp luôn cả tiền lẻ dùng cho ngày mai" },
      { ja: "入金票は不要", vi: "Không cần phiếu nộp tiền" },
      { ja: "必ず二人でおこなう（防犯のため）", vi: "Bắt buộc phải có hai người thực hiện (vì lý do phòng chống trộm cắp)" },
    ],
    correctIndex: 3,
    explanationVi: "Sau khi đóng cửa, chốt sổ quỹ, cho tiền mặt và phiếu nộp tiền vào túi quy định rồi nộp vào két đêm; việc này bắt buộc phải có hai người thực hiện vì lý do phòng chống trộm cắp.",
    sourceQuoteJa: "閉店後レジ締めをおこない、所定のバッグに現金と入金票を入れて投入します。この時必ず二人でおこなってください。理由は防犯のためです。",
    sourcePage: 16,
  },
  {
    id: "cs-72",
    chapterId: "cs-ch3",
    questionJa: "翌日用の釣銭はどこに保管すべきか。",
    questionVi: "Tiền lẻ dùng cho ngày hôm sau nên được cất giữ ở đâu?",
    options: [
      { ja: "店内金庫", vi: "Két sắt trong cửa hàng" },
      { ja: "夜間金庫", vi: "Két đêm (bên ngoài)" },
      { ja: "従業員の個人ロッカー", vi: "Tủ đồ cá nhân của nhân viên" },
      { ja: "レジの引き出しにそのまま置く", vi: "Để nguyên trong ngăn kéo máy tính tiền" },
    ],
    correctIndex: 0,
    explanationVi: "Tiền lẻ dùng cho ngày hôm sau phải được cất giữ trong két sắt trong cửa hàng.",
    sourceQuoteJa: "ただし、翌日用の釣銭は店内金庫に保管してください。",
    sourcePage: 16,
  },
  {
    id: "cs-73",
    chapterId: "cs-ch4",
    questionJa: "クレームについて正しいものはどれか。",
    questionVi: "Điều đúng về khiếu nại của khách là gì?",
    options: [
      { ja: "なるべく受けたくないものだが、店の質的改善につながる大きな材料でもある", vi: "Là điều ai cũng không muốn nhận, nhưng cũng là tư liệu quan trọng để cải thiện chất lượng cửa hàng" },
      { ja: "クレームは店にとって何の意味もない", vi: "Khiếu nại không có ý nghĩa gì đối với cửa hàng" },
      { ja: "クレームは必ず無視すべきである", vi: "Phải luôn phớt lờ khiếu nại" },
      { ja: "クレームは法律違反である", vi: "Khiếu nại là hành vi vi phạm pháp luật" },
    ],
    correctIndex: 0,
    explanationVi: "Thông thường ai cũng không muốn nhận khiếu nại, nhưng mặt khác khiếu nại cũng là tư liệu quan trọng để cải thiện chất lượng cửa hàng, nên khi có cơ hội nhận được tư liệu đó, thái độ xử lý cũng nên thay đổi.",
    sourceQuoteJa: "クレームはなるべく受けたくないと考えるのが普通ですが、一方クレームは店の質的改善につながる大きな材料でもあります。ですからその材料をもらえる機会となれば、対応する態度も変わってくるはずです。",
    sourcePage: 16,
  },
  {
    id: "cs-74",
    chapterId: "cs-ch4",
    questionJa: "どんな小さな苦情でも正しい対応はどれか。",
    questionVi: "Dù là khiếu nại nhỏ đến đâu, cách xử lý đúng là gì?",
    options: [
      { ja: "アルバイトに任せて終わらせる", vi: "Giao cho nhân viên bán thời gian rồi cho qua" },
      { ja: "部下から報告させ、店長が迅速に直接テーブルまで行き対応する", vi: "Để nhân viên cấp dưới báo cáo, cửa hàng trưởng nhanh chóng đến tận bàn xử lý" },
      { ja: "翌日にまとめて対応する", vi: "Gộp lại xử lý vào ngày hôm sau" },
      { ja: "クレームカードに記入するだけでよい", vi: "Chỉ cần ghi vào thẻ khiếu nại là đủ" },
    ],
    correctIndex: 1,
    explanationVi: "Dù là khiếu nại nhỏ đến đâu cũng phải để nhân viên cấp dưới báo cáo, và cửa hàng trưởng phải nhanh chóng đến tận bàn xử lý trực tiếp.",
    sourceQuoteJa: "どんな小さな苦情でも部下から報告させ、店長が迅速に直接テーブルまで行き対応します。",
    sourcePage: 16,
  },
  {
    id: "cs-75",
    chapterId: "cs-ch4",
    questionJa: "実際に苦情が発生した場合、お客様のお帰りの際の正しい対応はどれか。",
    questionVi: "Khi thực sự xảy ra khiếu nại, cách ứng xử đúng lúc khách ra về là gì?",
    options: [
      { ja: "特に何もしなくてよい", vi: "Không cần làm gì đặc biệt" },
      { ja: "担当者だけがお詫びすればよい", vi: "Chỉ nhân viên phụ trách xin lỗi là đủ" },
      { ja: "担当者と店長が丁重にお詫びし、お見送りをする", vi: "Nhân viên phụ trách và cửa hàng trưởng xin lỗi trang trọng và tiễn khách" },
      { ja: "割引券を渡すだけで済ませる", vi: "Chỉ cần đưa phiếu giảm giá là xong" },
    ],
    correctIndex: 2,
    explanationVi: "Khi thực sự xảy ra khiếu nại, lúc khách ra về phải để nhân viên phụ trách và cửa hàng trưởng xin lỗi trang trọng một lần nữa và tiễn khách.",
    sourceQuoteJa: "実際に苦情が発生した場合、お帰りの際にもう一度、担当者と店長が丁重にお詫びし、お見送りをします。",
    sourcePage: 16,
  },
  {
    id: "cs-76",
    chapterId: "cs-ch4",
    questionJa: "クレーム対応において参考にすべき資料として正しいものはどれか。",
    questionVi: "Tài liệu tham khảo khi xử lý khiếu nại đúng là gì?",
    options: [
      { ja: "競合店のクレーム対応マニュアル", vi: "Sổ tay xử lý khiếu nại của quán đối thủ" },
      { ja: "インターネット上の口コミ", vi: "Bình luận trên internet" },
      { ja: "従業員の個人的な経験談のみ", vi: "Chỉ dựa vào kinh nghiệm cá nhân của nhân viên" },
      { ja: "（参考１）クレーム対応のポイントや特定技能１号のテキストに記載している「クレーム対応手順の例」", vi: "'(Tham khảo 1) Điểm chính khi xử lý khiếu nại' và 'Ví dụ quy trình xử lý khiếu nại' trong giáo trình cấp 1" },
    ],
    correctIndex: 3,
    explanationVi: "Ngoài các nguyên tắc cơ bản, nên tham khảo '(Tham khảo 1) Điểm chính khi xử lý khiếu nại' và 'Ví dụ quy trình xử lý khiếu nại' được ghi trong giáo trình cấp 1 để xử lý phù hợp.",
    sourceQuoteJa: "このほか、以下の（参考１）クレーム対応のポイントや特定技能１号のテキストに記載している「クレーム対応手順の例」などを参考に対応します。",
    sourcePage: 16,
  },
  {
    id: "cs-77",
    chapterId: "cs-ch4",
    questionJa: "異物混入発生時の基本的な対応はどれか。",
    questionVi: "Cách xử lý cơ bản khi phát hiện dị vật lẫn trong món ăn là gì?",
    options: [
      { ja: "事実を確認したらすぐにお詫びをする", vi: "Sau khi xác nhận sự việc, xin lỗi ngay" },
      { ja: "お客様が気づかなければ何もしない", vi: "Nếu khách không để ý thì không cần làm gì" },
      { ja: "まず責任者を探してから対応する", vi: "Trước tiên phải tìm người chịu trách nhiệm rồi mới xử lý" },
      { ja: "1週間かけてゆっくり調査する", vi: "Điều tra chậm rãi trong 1 tuần" },
    ],
    correctIndex: 0,
    explanationVi: "Khi phát hiện dị vật lẫn trong món ăn, theo nguyên tắc 'xử lý cơ bản đối với khiếu nại' đã nêu ở mục (1), sau khi xác nhận sự việc phải xin lỗi ngay.",
    sourceQuoteJa: "（１）①の「クレームに対する基本的な対応」に沿い、事実を確認したらすぐにお詫びをしてください。",
    sourcePage: 18,
  },
  {
    id: "cs-78",
    chapterId: "cs-ch4",
    questionJa: "クレームの大半を占める原因は何か。",
    questionVi: "Nguyên nhân chiếm phần lớn trong các khiếu nại là gì?",
    options: [
      { ja: "味の濃さ", vi: "Vị đậm nhạt" },
      { ja: "異物混入で、とりわけ多いのが髪の毛の混入", vi: "Dị vật lẫn trong món ăn, đặc biệt phổ biến nhất là lẫn tóc" },
      { ja: "料理の提供スピード", vi: "Tốc độ phục vụ món ăn" },
      { ja: "店内の温度", vi: "Nhiệt độ trong quán" },
    ],
    correctIndex: 1,
    explanationVi: "Phần lớn khiếu nại là do dị vật lẫn trong món ăn, đặc biệt phổ biến nhất là tóc.",
    sourceQuoteJa: "クレームの大半は異物混入で、とりわけ多いのが髪の毛の混入です。",
    sourcePage: 18,
  },
  {
    id: "cs-79",
    chapterId: "cs-ch4",
    questionJa: "髪の毛が混入した場合の対応として正しいものはどれか。",
    questionVi: "Cách xử lý đúng khi phát hiện tóc lẫn trong món ăn là gì?",
    options: [
      { ja: "混入経路は調べなくてよい", vi: "Không cần tìm đường lẫn vào" },
      { ja: "すぐに料理をすべて廃棄するだけでよい", vi: "Chỉ cần vứt bỏ hết món ăn ngay" },
      { ja: "どこで混入したかを調べ、再発しないよう従業員の身だしなみを確認する", vi: "Tìm nơi tóc lẫn vào, kiểm tra tác phong nhân viên để tránh tái diễn" },
      { ja: "お客様に謝罪せず提供し直すだけでよい", vi: "Không xin lỗi khách, chỉ cần phục vụ lại là đủ" },
    ],
    correctIndex: 2,
    explanationVi: "Khi phát hiện tóc lẫn trong món ăn, phải tìm nơi tóc lẫn vào và kiểm tra tác phong của nhân viên để tránh tái diễn.",
    sourceQuoteJa: "どこで混入したかを調べ、再発しないよう従業員の身だしなみを確認してください。",
    sourcePage: 18,
  },
  {
    id: "cs-80",
    chapterId: "cs-ch4",
    questionJa: "髪の毛以外の毛（まつげ、眉毛、体毛など）が混入した場合の対応はどれか。",
    questionVi: "Cách xử lý khi lẫn loại lông khác không phải tóc (lông mi, lông mày, lông cơ thể...) là gì?",
    options: [
      { ja: "髪の毛の場合と違い、何もしなくてよい", vi: "Khác với trường hợp tóc, không cần làm gì" },
      { ja: "従業員だけが知っていればよい", vi: "Chỉ cần nhân viên biết là đủ" },
      { ja: "混入経緯は調べなくてよい", vi: "Không cần tìm hiểu quá trình lẫn vào" },
      { ja: "何の毛であるか、また混入した経緯を調べ特定して、再発防止を全従業員に周知する", vi: "Xác định là loại lông gì, tìm hiểu quá trình lẫn vào, rồi phổ biến cho toàn thể nhân viên để phòng ngừa tái diễn" },
    ],
    correctIndex: 3,
    explanationVi: "Với các loại lông khác ngoài tóc (lông mi, lông mày, lông cơ thể...), cũng phải xác định là loại lông gì, tìm hiểu và xác định quá trình lẫn vào, rồi phổ biến cho toàn thể nhân viên để phòng ngừa tái diễn.",
    sourceQuoteJa: "髪の毛以外（まつげ、眉毛、体毛など）でも、何の毛であるか、また、混入した経緯を調べ特定して、再発防止を全従業員に周知してください。",
    sourcePage: 18,
  },
  {
    id: "cs-81",
    chapterId: "cs-ch4",
    questionJa: "異物混入があったお客様への確認対応として正しいものはどれか。",
    questionVi: "Cách xác nhận đúng với khách khi có dị vật lẫn trong món ăn là gì?",
    options: [
      { ja: "まず作り直してよいか確認し、不要と言われれば伝票をキャンセルする対応を素早くおこなう", vi: "Trước tiên xác nhận khách có muốn làm lại món không; nếu không cần, nhanh chóng hủy hóa đơn" },
      { ja: "確認せず自動的に作り直す", vi: "Không xác nhận mà tự động làm lại" },
      { ja: "料金をそのまま請求する", vi: "Vẫn tính tiền như bình thường" },
      { ja: "お客様に選択肢を与えない", vi: "Không cho khách lựa chọn gì" },
    ],
    correctIndex: 0,
    explanationVi: "Trước tiên phải xác nhận với khách xem có muốn làm lại món hay không; nếu khách nói không cần, phải nhanh chóng hủy hóa đơn. Nếu cửa hàng có quy định xử lý thêm, phải tuân theo quy định đó.",
    sourceQuoteJa: "お客様にはまず、作り直してよいか確認し、作り直し不要と言われれば伝票をキャンセルする対応を素早くおこなってください。それ以上の対応が店のルールで決まっている場合は、それに従ってください。",
    sourcePage: 18,
  },
  {
    id: "cs-82",
    chapterId: "cs-ch4",
    questionJa: "捕虫器について確認すべきこととして正しいものはどれか。",
    questionVi: "Điều cần kiểm tra về đèn bẫy côn trùng (捕虫器) là gì?",
    options: [
      { ja: "設置は不要", vi: "Không cần lắp đặt" },
      { ja: "捕虫器のランプが切れていないか確認する", vi: "Kiểm tra xem bóng đèn của đèn bẫy có bị cháy không" },
      { ja: "1年に1回だけ確認すればよい", vi: "Chỉ cần kiểm tra 1 lần/năm" },
      { ja: "従業員が個人で管理すればよい", vi: "Để từng nhân viên tự quản lý là đủ" },
    ],
    correctIndex: 1,
    explanationVi: "Sau tóc, nguyên nhân phổ biến thứ hai là côn trùng lẫn vào; nếu quán có lắp đèn bẫy côn trùng, phải kiểm tra xem bóng đèn có bị cháy không.",
    sourceQuoteJa: "髪の毛の次に多いのが虫の混入です。そのために捕虫器をつけている場合、捕虫器のランプが切れていないか確認してください。",
    sourcePage: 18,
  },
  {
    id: "cs-83",
    chapterId: "cs-ch4",
    questionJa: "厨房に捕虫器を設置する場合の注意点は何か。",
    questionVi: "Lưu ý khi lắp đèn bẫy côn trùng trong bếp là gì?",
    options: [
      { ja: "できるだけ明るい場所に置く", vi: "Đặt ở nơi càng sáng càng tốt" },
      { ja: "お客様席から見える位置に置く", vi: "Đặt ở vị trí khách nhìn thấy được" },
      { ja: "捕虫器のランプが厨房以外から見えていないか確認する（見えると虫を外から誘引してしまう）", vi: "Kiểm tra xem đèn bẫy có bị nhìn thấy từ bên ngoài bếp không (nếu nhìn thấy sẽ thu hút côn trùng từ bên ngoài)" },
      { ja: "窓際に必ず設置する", vi: "Bắt buộc phải đặt gần cửa sổ" },
    ],
    correctIndex: 2,
    explanationVi: "Nếu đèn bẫy côn trùng được lắp trong bếp, phải kiểm tra xem đèn có bị nhìn thấy từ bên ngoài bếp không, vì nếu nhìn thấy sẽ ngược lại thu hút côn trùng từ bên ngoài vào.",
    sourceQuoteJa: "厨房に捕虫器が設置されている場合は、捕虫器のランプが厨房以外から見えていないか確認してください。見えていると逆に虫を外から誘引することになります。",
    sourcePage: 18,
  },
  {
    id: "cs-84",
    chapterId: "cs-ch5",
    questionJa: "お客様で体調不良者が発生した場合の基本原則はどれか。",
    questionVi: "Nguyên tắc cơ bản khi có khách bị khó chịu trong người là gì?",
    options: [
      { ja: "決して慌てずに、同伴者がいれば同伴者の指示に従う", vi: "Tuyệt đối không hoảng loạn, nếu có người đi cùng thì làm theo chỉ dẫn của người đó" },
      { ja: "すぐに料理の返金を提案する", vi: "Ngay lập tức đề nghị hoàn tiền món ăn" },
      { ja: "他の従業員には知らせない", vi: "Không báo cho nhân viên khác biết" },
      { ja: "お客様に立ち上がるよう促す", vi: "Thúc giục khách đứng dậy" },
    ],
    correctIndex: 0,
    explanationVi: "Khi có khách bị khó chịu trong người, tuyệt đối không được hoảng loạn, nếu có người đi cùng thì làm theo chỉ dẫn của người đó.",
    sourceQuoteJa: "お客様で体調不良者が発生した場合、決して慌てずに、同伴者がいれば同伴者の指示に従ってください。",
    sourcePage: 18,
  },
  {
    id: "cs-85",
    chapterId: "cs-ch5",
    questionJa: "同伴者がいない体調不良のお客様への対応として正しいものはどれか。",
    questionVi: "Cách xử lý đúng khi khách bị khó chịu mà không có người đi cùng là gì?",
    options: [
      { ja: "意識の有無に関わらず放置する", vi: "Bỏ mặc dù còn tỉnh hay bất tỉnh" },
      { ja: "意識がある場合はご本人の意思に従い、意識はない場合はすぐに救急車を呼ぶ", vi: "Nếu còn tỉnh táo thì làm theo ý muốn của khách; nếu bất tỉnh thì gọi xe cấp cứu ngay" },
      { ja: "意識がなくても救急車は呼ばない", vi: "Dù bất tỉnh cũng không gọi xe cấp cứu" },
      { ja: "すぐに店の外に移動させる", vi: "Ngay lập tức di chuyển khách ra ngoài quán" },
    ],
    correctIndex: 1,
    explanationVi: "Nếu không có người đi cùng: khi khách còn tỉnh táo thì làm theo ý muốn của khách; khi khách bất tỉnh thì phải gọi xe cấp cứu ngay.",
    sourceQuoteJa: "同伴者がいない場合、意識がある場合はご本人の意思に従い、意識はない場合はすぐに救急車を呼んでください。",
    sourcePage: 18,
  },
  {
    id: "cs-86",
    chapterId: "cs-ch5",
    questionJa: "体調不良のお客様への物理的な対応として正しいものはどれか。",
    questionVi: "Cách xử lý về mặt thể chất đối với khách bị khó chịu là gì?",
    options: [
      { ja: "すぐに立たせて歩かせる", vi: "Ngay lập tức đỡ khách đứng dậy và đi lại" },
      { ja: "水を無理に飲ませる", vi: "Ép khách uống nước" },
      { ja: "むやみに抱き起こさず、そのままの状態で待機する", vi: "Không tùy tiện bế khách dậy, giữ nguyên tư thế và chờ đợi" },
      { ja: "体を強く揺さぶって意識を確認する", vi: "Lắc mạnh người khách để kiểm tra ý thức" },
    ],
    correctIndex: 2,
    explanationVi: "Không được tùy tiện bế khách dậy, mà phải giữ nguyên tư thế của khách và chờ đợi.",
    sourceQuoteJa: "むやみに抱き起こさず、そのままの状態で待機してください。",
    sourcePage: 18,
  },
  {
    id: "cs-87",
    chapterId: "cs-ch5",
    questionJa: "てんかん発作で倒れたお客様への対応として正しいものはどれか。",
    questionVi: "Cách xử lý khi khách bị ngã do lên cơn động kinh là gì?",
    options: [
      { ja: "すぐに抱き起こして座らせる", vi: "Ngay lập tức bế khách dậy và cho ngồi" },
      { ja: "口に物を入れて舌を守る", vi: "Nhét vật vào miệng để bảo vệ lưỡi" },
      { ja: "周囲から離れて見守るだけ", vi: "Tránh xa và chỉ đứng nhìn" },
      { ja: "付き添いの方がいれば、その方の指示に従う。いない場合はすぐに救急車を呼ぶ", vi: "Nếu có người đi cùng thì làm theo chỉ dẫn của người đó; nếu không có thì gọi xe cấp cứu ngay" },
    ],
    correctIndex: 3,
    explanationVi: "Với khách bị ngã do lên cơn động kinh: nếu có người đi cùng thì làm theo chỉ dẫn của người đó; nếu không có người đi cùng thì phải gọi xe cấp cứu ngay.",
    sourceQuoteJa: "てんかん発作で倒れたお客様には、付き添いの方がいれば、その方の指示に従ってください。付き添いの方がいない場合は、すぐに救急車を呼んでください。",
    sourcePage: 19,
  },
  {
    id: "cs-88",
    chapterId: "cs-ch5",
    questionJa: "心停止を起こしたお客様への対応として正しいものはどれか。",
    questionVi: "Cách xử lý khi khách bị ngừng tim là gì?",
    options: [
      { ja: "AED（自動体外式除細動器）をすぐに当て、同時に救急車を呼ぶ", vi: "Dùng máy AED (máy khử rung tim tự động) ngay lập tức, đồng thời gọi xe cấp cứu" },
      { ja: "意識が戻るまで何もせず待つ", vi: "Không làm gì, chờ khách tỉnh lại" },
      { ja: "心臓マッサージのみおこない救急車は呼ばない", vi: "Chỉ xoa bóp tim, không gọi xe cấp cứu" },
      { ja: "AEDは訓練を受けた人だけが使えるので何もしない", vi: "Vì AED chỉ người đã qua đào tạo mới dùng được nên không làm gì" },
    ],
    correctIndex: 0,
    explanationVi: "Với khách bị ngừng tim, phải dùng máy AED (máy khử rung tim tự động) ngay lập tức, đồng thời gọi xe cấp cứu.",
    sourceQuoteJa: "心停止を起こしたお客様には、AED（自動体外式除細動器）をすぐに当ててください。そして同時に救急車を呼んでください。",
    sourcePage: 19,
  },
  {
    id: "cs-89",
    chapterId: "cs-ch5",
    questionJa: "AED（自動体外式除細動器）の使い方についてどうすべきか。",
    questionVi: "Cần làm gì với cách sử dụng AED (máy khử rung tim tự động)?",
    options: [
      { ja: "使い方を学ぶ必要はない", vi: "Không cần học cách dùng" },
      { ja: "使い方の訓練を定期的に実施する", vi: "Thực hiện đào tạo định kỳ về cách sử dụng" },
      { ja: "店長だけが知っていればよい", vi: "Chỉ cần cửa hàng trưởng biết là đủ" },
      { ja: "1度だけ学べば十分", vi: "Chỉ cần học 1 lần là đủ" },
    ],
    correctIndex: 1,
    explanationVi: "Phải thực hiện đào tạo định kỳ về cách sử dụng máy AED.",
    sourceQuoteJa: "AED（自動体外式除細動器）の使い方の訓練を定期的に実施してください。",
    sourcePage: 19,
  },
  {
    id: "cs-90",
    chapterId: "cs-ch5",
    questionJa: "緊急時対応において参考にすべき資料はどれか。",
    questionVi: "Tài liệu tham khảo khi xử lý tình huống khẩn cấp là gì?",
    options: [
      { ja: "競合店のマニュアル", vi: "Sổ tay của quán đối thủ" },
      { ja: "インターネットの情報のみ", vi: "Chỉ dựa vào thông tin trên internet" },
      { ja: "特定技能１号のテキストに記載している「事例と主な対応方法」", vi: "'Ví dụ tình huống và cách xử lý chính' được ghi trong giáo trình cấp 1" },
      { ja: "参考にすべき資料はない", vi: "Không có tài liệu tham khảo nào" },
    ],
    correctIndex: 2,
    explanationVi: "Ngoài các nội dung đã nêu, nên tham khảo 'Ví dụ tình huống và cách xử lý chính' được ghi trong giáo trình cấp 1 để xử lý phù hợp.",
    sourceQuoteJa: "このほか、特定技能１号のテキストに記載している「事例と主な対応方法」などを参考に対応します。",
    sourcePage: 19,
  },
  {
    id: "cs-91",
    chapterId: "cs-ch5",
    questionJa: "「緊急時の行動基準」についてどこに記載されているか。",
    questionVi: "'Tiêu chuẩn hành động khi khẩn cấp' được ghi ở đâu?",
    options: [
      { ja: "本テキストにすべて新しく記載されている", vi: "Được ghi hoàn toàn mới trong giáo trình này" },
      { ja: "食に関する知識のテキスト", vi: "Trong phần kiến thức ẩm thực" },
      { ja: "クレーム対応のテキスト", vi: "Trong phần xử lý khiếu nại" },
      { ja: "「店舗運営」のテキストに記載", vi: "Được ghi trong giáo trình 'Vận hành cửa hàng'" },
    ],
    correctIndex: 3,
    explanationVi: "Nội dung 'Tiêu chuẩn hành động khi khẩn cấp' được ghi trong giáo trình 'Vận hành cửa hàng' (店舗運営 — chính là nội dung đã học đầy đủ ở Phần 1 sm-ch1~8), không lặp lại chi tiết ở đây.",
    sourceQuoteJa: "「店舗運営」のテキストに記載",
    sourcePage: 19,
  },
];

export type TranslationDirection = "ja-to-vi" | "vi-to-ja";

export type TranslationQuestion = {
  id: string;
  chapterId: string;
  direction: TranslationDirection;
  /** Câu nguồn cần dịch — tiếng Nhật nếu direction=ja-to-vi, tiếng Việt nếu direction=vi-to-ja. */
  prompt: string;
  /** 4 phương án bằng ngôn ngữ đích (ngược lại với prompt). */
  options: string[];
  correctIndex: number;
  /** Trích dẫn nguyên văn tiếng Nhật từ tài liệu OTAFF làm căn cứ. */
  sourceQuoteJa: string;
  sourcePage: number;
};

// v1: mới có nội dung cho chương sm-ch1 để làm trọn 1 chương mẫu trước khi nhân rộng.
export const TRANSLATIONS: TranslationQuestion[] = [
  {
    id: "tr-sm1-1",
    chapterId: "sm-ch1",
    direction: "ja-to-vi",
    prompt: "外食産業は、立地産業であるため商圏は限定されています。",
    options: [
      "Ngành dịch vụ ăn uống không phụ thuộc vào địa điểm nên có thể mở ở bất cứ đâu.",
      "Ngành dịch vụ ăn uống là ngành phụ thuộc vào địa điểm, nên phạm vi thương mại (khu vực thu hút khách) bị giới hạn.",
      "Ngành dịch vụ ăn uống chỉ thành công khi mở ở trung tâm thành phố lớn.",
      "Ngành dịch vụ ăn uống có phạm vi thương mại không giới hạn.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "外食産業は、立地産業であるため商圏は限定されています。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-2",
    chapterId: "sm-ch1",
    direction: "vi-to-ja",
    prompt: "Để ngành dịch vụ ăn uống thành công, QSC là điều không thể thiếu.",
    options: [
      "外食産業として成功するためには、QSCは不要です。",
      "外食産業として成功するためには、価格だけが重要です。",
      "外食産業として失敗する原因はQSCです。",
      "外食産業として成功するためには、QSCが不可欠です。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "外食産業として成功するためには、QSCが不可欠です。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-3",
    chapterId: "sm-ch1",
    direction: "ja-to-vi",
    prompt: "「お客様の喜びを自分の喜びとする心」をホスピタリティといいます。",
    options: [
      "\"Tinh thần lấy niềm vui của khách làm niềm vui của chính mình\" được gọi là Hospitality (lòng hiếu khách).",
      "\"Tinh thần chỉ quan tâm đến lợi nhuận của cửa hàng\" được gọi là Hospitality.",
      "\"Tinh thần luôn đúng giờ\" được gọi là Hospitality.",
      "\"Tinh thần cạnh tranh với đối thủ\" được gọi là Hospitality.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "「お客様の喜びを自分の喜びとする心」をホスピタリティ（Hospitality=H）といいます。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-4",
    chapterId: "sm-ch1",
    direction: "vi-to-ja",
    prompt: "Người phụ trách theo khung giờ là người thay mặt cửa hàng trưởng đảm nhận công việc trong khung giờ đó.",
    options: [
      "時間帯責任者は、本部の経営計画を決定する人です。",
      "時間帯責任者は、店長より上の役職です。",
      "時間帯責任者は、店舗オペレーションのデイリーワークの中で時間帯における店長の職務を代行する人です。",
      "時間帯責任者は、アルバイトの採用を一切おこないません。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "時間帯責任者は、店舗オペレーションのデイリーワークの中で時間帯における店長の職務を代行する人です。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-5",
    chapterId: "sm-ch1",
    direction: "ja-to-vi",
    prompt: "業態に見合った店のBGMや照明など店の雰囲気（Atmosphere）も重要です。",
    options: [
      "Âm nhạc trong quán không quan trọng bằng chất lượng món ăn.",
      "Bầu không khí của quán (nhạc nền, ánh sáng...) phù hợp với mô hình kinh doanh cũng rất quan trọng.",
      "Ánh sáng trong quán nên luôn để tối để tiết kiệm điện.",
      "Mô hình kinh doanh không liên quan gì đến bầu không khí quán.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "業態に見合った店のBGMや照明など店の雰囲気（Atmosphere=A）も重要です。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-6",
    chapterId: "sm-ch1",
    direction: "ja-to-vi",
    prompt: "今後はサービスの質が一層重要になります。その本質は「働く人の質」です。",
    options: [
      "Từ nay trở đi, giá cả sẽ quan trọng hơn chất lượng dịch vụ.",
      "Chất lượng dịch vụ không còn quan trọng trong tương lai.",
      "Từ nay trở đi, chất lượng dịch vụ sẽ ngày càng quan trọng hơn. Bản chất của nó chính là \"chất lượng của người làm việc\".",
      "Bản chất của dịch vụ là công nghệ hiện đại.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "今後はサービスの質が一層重要になります。その本質はそれぞれの店で「働く人の質」です。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-7",
    chapterId: "sm-ch1",
    direction: "vi-to-ja",
    prompt: "Dù là mô hình kinh doanh nào, dịch vụ đầy tinh thần hiếu khách mà chỉ con người mới làm được sẽ ngày càng trở nên quan trọng hơn.",
    options: [
      "業態によっては、ホスピタリティは不要になります。",
      "業態に関わらず人でなければできないホスピタリティにあふれた接客サービスは、より重要になります。",
      "ロボットがホスピタリティを完全に代替します。",
      "接客サービスは今後重要ではなくなります。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "業態に関わらず人でなければできないホスピタリティにあふれた接客サービスは、より重要になります。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-8",
    chapterId: "sm-ch1",
    direction: "ja-to-vi",
    prompt: "心のこもったサービスで、明るく・楽しく・快適な雰囲気の中で適正な価格で安定して提供し続けることが大切です。",
    options: [
      "Điều quan trọng nhất là giá phải rẻ nhất thị trường.",
      "Không cần duy trì bầu không khí quán, chỉ cần món ăn ngon.",
      "Dịch vụ tận tâm không liên quan đến việc kinh doanh ổn định.",
      "Điều quan trọng là tiếp tục phục vụ ổn định với giá cả hợp lý, trong bầu không khí tươi sáng - vui vẻ - thoải mái, bằng dịch vụ tận tâm.",
    ],
    correctIndex: 3,
    sourceQuoteJa:
      "そのためには、おいしく魅力にあふれた商品を心のこもったサービスで気持ち良く、明るく・楽しく・快適な雰囲気の中で適正な価格で安定して提供し続けることが大切です。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-9",
    chapterId: "sm-ch1",
    direction: "vi-to-ja",
    prompt: "Người phụ trách theo khung giờ cần hiểu rõ tiêu chuẩn QSC phù hợp, huấn luyện cấp dưới, và hiện thực hóa điều đó tại điểm tiếp xúc với khách hàng.",
    options: [
      "時間帯責任者はQSCスタンダードを理解する必要はありません。",
      "時間帯責任者の役割はトレーニングのみです。",
      "時間帯責任者は自店の業態や客単価に見合ったQSCのスタンダードを的確に理解し、部下にトレーニングし、オペレーションをとおして顧客接点で具現化させる必要があります。",
      "時間帯責任者は顧客接点に関与しません。",
    ],
    correctIndex: 2,
    sourceQuoteJa:
      "時間帯責任者は自店の業態や客単価に見合ったQSCのスタンダード（あるべき基準）を的確に理解し、部下にトレーニングし、オペレーションをとおして顧客接点で具現化させる必要があります。",
    sourcePage: 2,
  },
  {
    id: "tr-sm1-10",
    chapterId: "sm-ch1",
    direction: "ja-to-vi",
    prompt: "お客様の立場に立った、マニュアルを超えた気配りや個別対応のサービスが求められます。",
    options: [
      "Chỉ cần làm đúng theo quy trình chuẩn (manual) là đủ.",
      "Cần có dịch vụ quan tâm chu đáo vượt ra ngoài quy trình chuẩn và phục vụ theo từng cá nhân, đứng trên lập trường của khách hàng.",
      "Không cần quan tâm đến từng khách hàng cá nhân.",
      "Dịch vụ cá nhân hóa chỉ dành cho khách VIP.",
    ],
    correctIndex: 1,
    sourceQuoteJa:
      "お客様の立場に立ったマニュアル（定型サービス）を超えた気配りや、思いやりにあふれた個別対応のサービスが求められます。",
    sourcePage: 1,
  },
  {
    id: "tr-sm1-11",
    chapterId: "sm-ch1",
    direction: "vi-to-ja",
    prompt: "Tinh thần hiếu khách này cũng quan trọng đối với các đồng nghiệp cùng làm việc trong cửa hàng.",
    options: [
      "この心はお客様に対してのみ重要です。",
      "この心は店長にのみ求められます。",
      "この心はアルバイトには不要です。",
      "この心は店内のチームで働く仲間に対しても重要です。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "この心は店内のチームで働く仲間に対しても重要です。",
    sourcePage: 1,
  },
  {
    id: "tr-sm2-1",
    chapterId: "sm-ch2",
    direction: "ja-to-vi",
    prompt:
      "それらの中で店舗責任者がコントロールできるものは、人時売上高、人時生産性、原価率、人時接客数（接客生産性）、客数、客単価です。",
    options: [
      "Trong số các chỉ số đó, chỉ có tiền thuê mặt bằng và thuế là điều mà cửa hàng có thể kiểm soát.",
      "Người quản lý cửa hàng không thể kiểm soát bất kỳ chỉ số nào trong số đó.",
      "Trong số các chỉ số đó, những chỉ số mà người quản lý cửa hàng có thể kiểm soát là: doanh thu mỗi giờ công, năng suất mỗi giờ công, tỷ lệ giá vốn, số khách phục vụ mỗi giờ công (năng suất phục vụ), số lượng khách, và đơn giá khách.",
      "Trong số các chỉ số đó, chỉ có số lượng khách là chỉ số duy nhất kiểm soát được.",
    ],
    correctIndex: 2,
    sourceQuoteJa:
      "それらの中で店舗責任者がコントロールできるものは、人時売上高、人時生産性、原価率、人時接客数（接客生産性）、客数、客単価です。",
    sourcePage: 3,
  },
  {
    id: "tr-sm2-2",
    chapterId: "sm-ch2",
    direction: "vi-to-ja",
    prompt: "Nhìn chung, ngành fast food có chỉ số này cao, còn nhà hàng phục vụ đầy đủ (full-service) thì thấp hơn.",
    options: [
      "一般的に、フルサービスレストランは高くなり、ファストフード業界では低くなります。",
      "一般的に、ファストフード業界は高くなり、フルサービスレストランでは低くなります。",
      "一般的に、居酒屋業界は高くなり、寿司業界では低くなります。",
      "一般的に、すべての業態で同じ数値になります。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "一般的に、ファストフード業界は高くなり、フルサービスレストランでは低くなります。",
    sourcePage: 3,
  },
  {
    id: "tr-sm2-3",
    chapterId: "sm-ch2",
    direction: "ja-to-vi",
    prompt:
      "人時生産性は企業側が生産性を上げるための指数と見られがちですが、実際には従業員の賃金の源泉でもあるのです。",
    options: [
      "Năng suất theo giờ công chỉ có ý nghĩa đối với doanh nghiệp, không liên quan gì đến tiền lương nhân viên.",
      "Năng suất theo giờ công là chỉ số dùng để tính thuế doanh nghiệp.",
      "Năng suất theo giờ công không có ý nghĩa thực tế nào trong quản lý cửa hàng.",
      "Năng suất theo giờ công tuy hay bị coi là chỉ số để doanh nghiệp tăng năng suất, nhưng thực chất đây cũng chính là nguồn gốc của tiền lương nhân viên.",
    ],
    correctIndex: 3,
    sourceQuoteJa:
      "人時生産性は企業側が生産性を上げるための指数と見られがちですが、実際には従業員の賃金の源泉でもあるのです。",
    sourcePage: 4,
  },
  {
    id: "tr-sm2-4",
    chapterId: "sm-ch2",
    direction: "vi-to-ja",
    prompt: "Tỷ lệ phân phối lao động là tỷ lệ nhân công phí chiếm trong lợi nhuận gộp.",
    options: [
      "労働分配率とは粗利益に占める人件費の割合です。",
      "労働分配率とは売上高に占める原価の割合です。",
      "労働分配率とは客単価に占める人件費の割合です。",
      "労働分配率とは総労働時間に占める休憩時間の割合です。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "労働分配率とは粗利益に占める人件費の割合です。",
    sourcePage: 4,
  },
  {
    id: "tr-sm2-5",
    chapterId: "sm-ch2",
    direction: "ja-to-vi",
    prompt:
      "企業全体として労働分配率を適正値内で収めるには、店舗での労働分配率を４０％以下に低減させる必要があるのです。",
    options: [
      "Để cả doanh nghiệp giữ tỷ lệ phân phối lao động trong ngưỡng hợp lý, cần tăng tỷ lệ phân phối lao động ở từng cửa hàng lên trên 40%.",
      "Tỷ lệ phân phối lao động không cần kiểm soát ở cấp cửa hàng.",
      "Để cả doanh nghiệp giữ tỷ lệ phân phối lao động trong ngưỡng hợp lý, cần giảm tỷ lệ phân phối lao động ở từng cửa hàng xuống dưới 40%.",
      "Cần giảm tỷ lệ phân phối lao động xuống dưới 10% ở từng cửa hàng.",
    ],
    correctIndex: 2,
    sourceQuoteJa:
      "企業全体として労働分配率を適正値内で収めるには、店舗での労働分配率を４０％以下に低減させる必要があるのです。",
    sourcePage: 4,
  },
  {
    id: "tr-sm2-6",
    chapterId: "sm-ch2",
    direction: "vi-to-ja",
    prompt: "Tỷ lệ giá vốn được tính bằng cách lấy giá vốn chia cho doanh thu rồi nhân với 100.",
    options: [
      "原価高を売上高で割り１００を掛けたものが原価率となります。",
      "売上高を原価高で割り１００を掛けたものが原価率となります。",
      "原価高に売上高を掛けたものが原価率となります。",
      "原価高から売上高を引いたものが原価率となります。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "原価高を売上高で割り１００を掛けたものが原価率となります。",
    sourcePage: 4,
  },
  {
    id: "tr-sm2-7",
    chapterId: "sm-ch2",
    direction: "ja-to-vi",
    prompt: "この標準（あるべき）原価率を、米国では理論上の原価率（セオロリカル原価率）と呼びます。",
    options: [
      "Tỷ lệ giá vốn tiêu chuẩn này chỉ được sử dụng ở Nhật Bản, không có khái niệm tương đương ở nước khác.",
      "Tỷ lệ giá vốn tiêu chuẩn (lý thuyết) này, ở Mỹ được gọi là tỷ lệ giá vốn lý thuyết (Theoretical Cost Rate).",
      "Tỷ lệ giá vốn tiêu chuẩn này ở Mỹ được gọi là tỷ lệ giá vốn thực tế (Actual Cost Rate).",
      "Khái niệm tỷ lệ giá vốn tiêu chuẩn không tồn tại trong ngành nhà hàng ở Mỹ.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "この標準（あるべき）原価率を、米国では理論上の原価率（セオロリカル原価率）と呼びます。",
    sourcePage: 5,
  },
  {
    id: "tr-sm2-8",
    chapterId: "sm-ch2",
    direction: "vi-to-ja",
    prompt: "Đơn giá khách được tính bằng số món gọi nhân với đơn giá trung bình mỗi món.",
    options: [
      "客単価＝来店客数×営業時間",
      "客単価＝総売上高÷原価高",
      "客単価＝人時売上高×総労働時間",
      "客単価＝注文点数×一品平均単価",
    ],
    correctIndex: 3,
    sourceQuoteJa: "客単価＝注文点数×一品平均単価",
    sourcePage: 6,
  },
  {
    id: "tr-sm2-9",
    chapterId: "sm-ch2",
    direction: "ja-to-vi",
    prompt: "繁忙月（通常３月・５月・７月・８月・１２月）と閑散月（通常２月・６月・１０月・１１月）がある",
    options: [
      "Có tháng cao điểm (thường là tháng 3, 5, 7, 8, 12) và tháng thấp điểm (thường là tháng 2, 6, 10, 11).",
      "Doanh thu của nhà hàng luôn ổn định như nhau ở mọi tháng trong năm, không có tháng cao điểm hay thấp điểm.",
      "Tháng cao điểm chỉ có tháng 1 và tháng 12, còn lại đều là tháng thấp điểm.",
      "Tháng thấp điểm là những tháng có doanh thu cao nhất trong năm.",
    ],
    correctIndex: 0,
    sourceQuoteJa:
      "繁忙月（通常３月・５月・７月・８月・１２月）と閑散月（通常２月・６月・１０月・１１月）がある",
    sourcePage: 6,
  },
  {
    id: "tr-sm2-10",
    chapterId: "sm-ch2",
    direction: "ja-to-vi",
    prompt:
      "荒利益は１番目の利益といわれ、ここから人件費や水光熱費に代表される諸経費、家賃などを支払い、残ったものが利益となるからだ。",
    options: [
      "Lợi nhuận gộp không liên quan gì đến các chi phí khác của cửa hàng.",
      "Lợi nhuận gộp được gọi là lợi nhuận thứ nhất, vì từ đây phải chi trả các khoản chi phí khác như nhân công, điện nước, tiền thuê mặt bằng..., phần còn lại mới là lợi nhuận thực sự.",
      "Lợi nhuận gộp chính là lợi nhuận cuối cùng của cửa hàng, không cần trừ thêm chi phí nào.",
      "Chỉ có tiền thuê mặt bằng mới được trừ từ lợi nhuận gộp.",
    ],
    correctIndex: 1,
    sourceQuoteJa:
      "荒利益は１番目の利益といわれ、ここから人件費や水光熱費に代表される諸経費、家賃などを支払い、残ったものが利益となるからだ。",
    sourcePage: 11,
  },
  {
    id: "tr-sm3-1",
    chapterId: "sm-ch3",
    direction: "ja-to-vi",
    prompt:
      "過剰な食材の在庫は品質の劣化を起こしロスにつながるだけでなく、無駄な仕入コストを増やすことになり、資金繰りにも悪影響を与えます。",
    options: [
      "Tồn kho nguyên liệu quá mức chỉ ảnh hưởng đến hình thức món ăn, không liên quan chi phí.",
      "Tồn kho nguyên liệu quá mức không chỉ gây suy giảm chất lượng dẫn đến hao hụt, mà còn làm tăng chi phí nhập hàng lãng phí, ảnh hưởng xấu đến dòng tiền.",
      "Tồn kho nguyên liệu càng nhiều thì dòng tiền càng tốt.",
      "Tồn kho nguyên liệu quá mức chỉ là vấn đề của bộ phận kế toán.",
    ],
    correctIndex: 1,
    sourceQuoteJa:
      "過剰な食材の在庫は品質の劣化を起こしロスにつながるだけでなく、無駄な仕入コストを増やすことになり、資金繰りにも悪影響を与えます。",
    sourcePage: 13,
  },
  {
    id: "tr-sm3-2",
    chapterId: "sm-ch3",
    direction: "vi-to-ja",
    prompt: "Kiểm kê thực tế cần được thực hiện hàng ngày, để quyết định lượng đặt hàng và quản lý chất lượng hàng tồn kho.",
    options: [
      "実地棚卸しは、月に１回だけ実施すれば十分です。",
      "実地棚卸しは、税務署の指示があるときのみ実施します。",
      "実地棚卸しは、発注量の決定や在庫品の品質管理のためにも毎日実施する必要があります。",
      "実地棚卸しは、在庫品の品質管理には関係ありません。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "実地棚卸しは、発注量の決定や在庫品の品質管理のためにも毎日実施する必要があります。",
    sourcePage: 14,
  },
  {
    id: "tr-sm3-3",
    chapterId: "sm-ch3",
    direction: "ja-to-vi",
    prompt: "基本は発注量（発注書やそのコピー）を元にして、検品を実施しなければなりません。",
    options: [
      "Kiểm hàng có thể thực hiện tùy ý, không cần căn cứ vào đâu.",
      "Kiểm hàng chỉ cần dựa vào lời nói của nhà cung cấp.",
      "Kiểm hàng là trách nhiệm của nhà cung cấp, không phải cửa hàng.",
      "Về cơ bản, việc kiểm hàng phải dựa trên lượng đặt hàng (đơn đặt hàng hoặc bản sao) làm căn cứ.",
    ],
    correctIndex: 3,
    sourceQuoteJa: "基本は発注量（発注書やそのコピー）を元にして、検品を実施しなければなりません。",
    sourcePage: 15,
  },
  {
    id: "tr-sm3-4",
    chapterId: "sm-ch3",
    direction: "vi-to-ja",
    prompt: "Nếu lượng giao hàng nhiều hơn lượng đã đặt, sẽ phát sinh hàng tồn không bán được, chất lượng suy giảm không dùng được, thành hao hụt.",
    options: [
      "それは発注した量より少なければ売れ残りが発生します。",
      "それは発注した量より多ければ売れ残りが発生し、品質が劣化して使用できずロスとなるからです。",
      "納品量は発注量と関係なくロスが発生します。",
      "納品量が多いほど利益が増えます。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "それは発注した量より多ければ売れ残りが発生し、品質が劣化して使用できずロスとなるからです。",
    sourcePage: 15,
  },
  {
    id: "tr-sm3-5",
    chapterId: "sm-ch3",
    direction: "ja-to-vi",
    prompt: "逆に少なければ品切れを起こし、お客様から不評の原因になります。",
    options: [
      "Nếu ít hơn thì khách hàng sẽ hài lòng hơn vì hàng luôn tươi mới.",
      "Số lượng giao hàng ít hay nhiều đều không ảnh hưởng đến khách hàng.",
      "Hết hàng luôn được khách hàng đánh giá tích cực.",
      "Ngược lại, nếu ít hơn sẽ gây hết hàng, trở thành nguyên nhân khiến khách hàng không hài lòng.",
    ],
    correctIndex: 3,
    sourceQuoteJa: "逆に少なければ品切れを起こし、お客様から不評の原因になります。",
    sourcePage: 15,
  },
  {
    id: "tr-sm3-6",
    chapterId: "sm-ch3",
    direction: "vi-to-ja",
    prompt: "Vì vậy, cần làm rõ tiêu chuẩn chất lượng của từng nguyên liệu với nhà cung cấp và ký hợp đồng bằng văn bản.",
    options: [
      "したがって納入業者との契約は口約束で十分です。",
      "したがって納入業者とは各食材の品質基準を明確にし、書面で契約すべきです。",
      "品質基準は店舗ごとに違っても問題ありません。",
      "納入業者を頻繁に変更することが重要です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "したがって納入業者とは各食材の品質基準を明確にし、書面で契約すべきです。",
    sourcePage: 15,
  },
  {
    id: "tr-sm3-7",
    chapterId: "sm-ch3",
    direction: "ja-to-vi",
    prompt:
      "納品時に業者立ち合いの下で、各食材の「数量」と「品質基準」をチェックし、常温、冷凍・冷蔵などに分け、適正な保管場所に収納するのが検収（検品・収納）作業です。",
    options: [
      "Công tác kiểm nhận hàng chỉ là việc ký nhận vào phiếu giao hàng.",
      "Công tác kiểm nhận hàng không cần có mặt nhà cung cấp.",
      "Công tác kiểm nhận hàng là việc kiểm tra \"số lượng\" và \"tiêu chuẩn chất lượng\" của từng nguyên liệu khi giao hàng (có nhà cung cấp chứng kiến), rồi phân loại thường/đông lạnh/lạnh và cất vào nơi bảo quản phù hợp.",
      "Công tác kiểm nhận hàng chỉ áp dụng cho hàng đông lạnh.",
    ],
    correctIndex: 2,
    sourceQuoteJa:
      "納品時に業者立ち合いの下で、各食材の「数量」と「品質基準」をチェックし、常温、冷凍・冷蔵などに分け、適正な保管場所に収納するのが検収（検品・収納）作業です。",
    sourcePage: 16,
  },
  {
    id: "tr-sm3-8",
    chapterId: "sm-ch3",
    direction: "vi-to-ja",
    prompt: "Người làm bếp khi nghe đến \"hao hụt\" thường chỉ nghĩ ngay đến hao hụt do vứt bỏ nguyên liệu đã hỏng thực sự.",
    options: [
      "調理関係者はロスについて全く関心がありません。",
      "調理関係者は見えないロスのことしか考えません。",
      "調理関係者はロスの計算を毎日おこないます。",
      "調理関係者はロスといえば実際に食材が劣化した廃棄ロスを思い浮かべがちです。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "調理関係者はロスといえば実際に食材が劣化した廃棄ロスを思い浮かべがちです。",
    sourcePage: 16,
  },
  {
    id: "tr-sm3-9",
    chapterId: "sm-ch3",
    direction: "ja-to-vi",
    prompt:
      "店舗管理責任者は、原価管理におけるA）発注数量　B）納品書の数量　C）現品の数量と品質の３つを確認する正しい検収作業の重要性を理解し、徹底しなければなりません。",
    options: [
      "Người phụ trách quản lý cửa hàng chỉ cần xác nhận số lượng trên phiếu giao hàng là đủ.",
      "Người phụ trách quản lý cửa hàng cần hiểu rõ và triệt để thực hiện tầm quan trọng của việc kiểm nhận hàng đúng cách — xác nhận đủ 3 hạng mục A) lượng đặt hàng B) lượng trên phiếu giao hàng C) lượng và chất lượng hàng thực tế, trong công tác quản lý giá vốn.",
      "Việc kiểm nhận hàng không phải trách nhiệm của người phụ trách quản lý cửa hàng.",
      "Chỉ cần kiểm tra chất lượng, không cần kiểm tra số lượng.",
    ],
    correctIndex: 1,
    sourceQuoteJa:
      "店舗管理責任者は、原価管理におけるA）発注数量　B）納品書の数量　C）現品の数量と品質の３つを確認する正しい検収作業の重要性を理解し、徹底しなければなりません。",
    sourcePage: 16,
  },
  {
    id: "tr-sm4-1",
    chapterId: "sm-ch4",
    direction: "ja-to-vi",
    prompt: "販売管理とは、計画どおりに売上高を作るためにどうすればよいかを考えることで、販売促進の内容を管理することです。",
    options: [
      "Quản lý bán hàng là quản lý chấm công và lương của nhân viên bán hàng.",
      "Quản lý bán hàng là suy nghĩ cách để tạo ra doanh thu đúng kế hoạch, thông qua việc quản lý nội dung các biện pháp xúc tiến bán hàng.",
      "Quản lý bán hàng là quản lý kho nguyên liệu đầu vào.",
      "Quản lý bán hàng chỉ liên quan đến việc tuyển dụng nhân viên mới.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "販売管理とは、計画どおりに売上高を作るためにどうすればよいかを考えることで、販売促進の内容を管理することです。",
    sourcePage: 16,
  },
  {
    id: "tr-sm4-2",
    chapterId: "sm-ch4",
    direction: "vi-to-ja",
    prompt: "Phân tích ABC là xếp toàn bộ thực đơn theo thứ tự doanh thu (hoặc số lượng bán).",
    options: [
      "ABC分析とは全メニューを調理時間順に並べることです。",
      "ABC分析とは全メニューを価格の高い順に並べることです。",
      "ABC分析とは全メニューを売上順又は売れ個数順に並べることです。",
      "ABC分析とは全メニューをランダムに並べることです。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "ABC分析とは全メニューを売上順又は売れ個数順に並べ",
    sourcePage: 16,
  },
  {
    id: "tr-sm4-3",
    chapterId: "sm-ch4",
    direction: "ja-to-vi",
    prompt: "特にランチセットなどは注文を集中させることができます。その結果、料理の提供が早くなり、回転率が上がり売上が向上することになります。",
    options: [
      "Set trưa làm đơn hàng phân tán, khiến phục vụ chậm hơn.",
      "Set trưa không có ảnh hưởng gì đến tốc độ phục vụ.",
      "Set trưa chỉ có tác dụng giảm giá, không ảnh hưởng doanh thu.",
      "Đặc biệt set trưa có thể làm đơn hàng tập trung. Kết quả là phục vụ nhanh hơn, tỷ lệ quay vòng bàn tăng, doanh thu tăng theo.",
    ],
    correctIndex: 3,
    sourceQuoteJa:
      "特にランチセットなどは注文を集中させることができます。その結果、料理の提供が早くなり、回転率が上がり売上が向上することになります。",
    sourcePage: 16,
  },
  {
    id: "tr-sm4-4",
    chapterId: "sm-ch4",
    direction: "vi-to-ja",
    prompt: "Mục đích của phiếu giảm giá là khuyến khích khách quay lại, nên được đưa lúc thanh toán tại quầy.",
    options: [
      "割引券の目的は再来店を促すためのもので、レジ精算時に渡します。",
      "割引券の目的は新規顧客の獲得のみで、来店時に渡します。",
      "割引券は従業員に配るためのものです。",
      "割引券は本部が直接お客様に郵送します。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "割引券の目的は再来店を促すためのもので、レジ精算時に渡します。",
    sourcePage: 17,
  },
  {
    id: "tr-sm4-5",
    chapterId: "sm-ch4",
    direction: "ja-to-vi",
    prompt: "ポイント制度はお客様を囲い込むための施策で、複数回の来店を促すものです。",
    options: [
      "Chế độ tích điểm chỉ dùng để tính lương nhân viên.",
      "Chế độ tích điểm là biện pháp giữ chân khách hàng, khuyến khích khách quay lại nhiều lần.",
      "Chế độ tích điểm không có tác dụng giữ chân khách hàng.",
      "Chế độ tích điểm chỉ áp dụng cho khách hàng mới.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "ポイント制度はお客様を囲い込むための施策で、複数回の来店を促すものです。",
    sourcePage: 17,
  },
  {
    id: "tr-sm4-6",
    chapterId: "sm-ch4",
    direction: "vi-to-ja",
    prompt: "Dịch vụ giao hàng tận nơi kết hợp với website, có thể bán được cho cả những người không có động lực đến quán.",
    options: [
      "宅配サービスは来店したお客様だけを対象にしています。",
      "宅配サービスは店内飲食の代わりにはなりません。",
      "宅配サービスはWEBと一体で、来店動機がない人にも販売できます。",
      "宅配サービスはWEBとは無関係に運営されます。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "宅配サービスはWEBと一体で、WEBから注文を受け、宅配業者に配達してもらうことにより、来店動機がない人にも販売できます。",
    sourcePage: 17,
  },
  {
    id: "tr-sm4-7",
    chapterId: "sm-ch4",
    direction: "ja-to-vi",
    prompt: "支払いの電子化は顧客の来店選択の一つになります。現金がないときにカードやスマートフォンで決済ができるという理由で来店してくれます。",
    options: [
      "Số hóa phương thức thanh toán là một trong các lý do khách chọn đến quán — vì dù không có tiền mặt vẫn thanh toán được bằng thẻ hoặc điện thoại.",
      "Số hóa phương thức thanh toán khiến khách hàng e ngại và ít đến quán hơn.",
      "Số hóa phương thức thanh toán không liên quan đến quyết định đến quán của khách.",
      "Số hóa phương thức thanh toán chỉ áp dụng cho khách VIP.",
    ],
    correctIndex: 0,
    sourceQuoteJa:
      "支払いの電子化は顧客の来店選択の一つになります。現金がないときにカードやスマートフォンで決済ができるという理由で来店してくれます。",
    sourcePage: 17,
  },
  {
    id: "tr-sm5-1",
    chapterId: "sm-ch5",
    direction: "ja-to-vi",
    prompt: "お客様は固定顧客（高頻度来店）、準固定顧客（ときどき来店）、新規顧客に大別されます。",
    options: [
      "Khách hàng chỉ có 1 loại duy nhất, không cần phân loại.",
      "Khách hàng được chia lớn thành 3 nhóm: khách quen cố định (đến thường xuyên), khách bán cố định (thỉnh thoảng đến), và khách hàng mới.",
      "Khách hàng chỉ được chia theo độ tuổi.",
      "Khách hàng mới luôn chiếm tỷ lệ cao nhất ở mọi cửa hàng.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "お客様は固定顧客（高頻度来店）、準固定顧客（ときどき来店）、新規顧客に大別されます。",
    sourcePage: 17,
  },
  {
    id: "tr-sm5-2",
    chapterId: "sm-ch5",
    direction: "vi-to-ja",
    prompt: "Quản lý khách hàng là biến khách bán cố định thành khách quen cố định, biến khách mới thành khách bán cố định hoặc khách quen cố định.",
    options: [
      "顧客管理とは新規顧客を全員拒否することです。",
      "顧客管理とは固定顧客の情報を毎月削除することです。",
      "顧客管理とは準固定顧客を固定客に、新規顧客を準固定顧客あるいは固定顧客にしていくことです。",
      "顧客管理とは客単価を毎月引き上げることです。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "顧客管理とは準固定顧客を固定客に、新規顧客を準固定顧客あるいは固定顧客にしていくことが重要です。",
    sourcePage: 17,
  },
  {
    id: "tr-sm5-3",
    chapterId: "sm-ch5",
    direction: "ja-to-vi",
    prompt:
      "固定顧客の目減りを減らすためには、当然品質は落とさないことは前提ですが、固定顧客の顔をしっかり覚え、あいさつの時「いつもありがとうございます」の一言を添え、好みのメニューや席なども覚えることです。",
    options: [
      "Để giảm sụt giảm khách quen, cần hạ giá bán thấp nhất có thể, không cần quan tâm chất lượng.",
      "Để giảm sụt giảm khách quen cố định (với điều kiện không hạ chất lượng), cần nhớ mặt khách, chào thêm câu \"cảm ơn quý khách đã luôn ủng hộ\", và nhớ cả món/chỗ ngồi ưa thích.",
      "Để giảm sụt giảm khách quen, chỉ cần gửi tin nhắn quảng cáo hàng tuần.",
      "Khách quen cố định không cần chăm sóc đặc biệt gì.",
    ],
    correctIndex: 1,
    sourceQuoteJa:
      "固定顧客の目減りを減らすためには、当然品質は落とさないことは前提ですが、固定顧客の顔をしっかり覚え、あいさつの時「いつもありがとうございます」の一言を添え、好みのメニューや席なども覚えることです。",
    sourcePage: 17,
  },
  {
    id: "tr-sm5-4",
    chapterId: "sm-ch5",
    direction: "vi-to-ja",
    prompt: "Nhớ lại mặt khách bán cố định rồi chào hỏi như với khách quen cố định sẽ làm tăng tần suất họ quay lại.",
    options: [
      "準固定顧客の顔を思い出して固定顧客同様にあいさつすれば来店頻度が増えていきます。",
      "準固定顧客には割引券を渡す必要はありません。",
      "準固定顧客の顔を覚える必要はありません。",
      "準固定顧客は放っておいても自然に固定顧客になります。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "準固定顧客の顔を思い出して固定顧客同様にあいさつすれば来店頻度が増えていきます。",
    sourcePage: 17,
  },
  {
    id: "tr-sm5-5",
    chapterId: "sm-ch5",
    direction: "ja-to-vi",
    prompt: "新規顧客には、QSCレベルを全体的に上げていくことにより、再来店してもらえることに繋がります。",
    options: [
      "Với khách hàng mới, việc nâng cao toàn diện mức QSC sẽ dẫn đến khả năng họ quay lại.",
      "Khách hàng mới không bao giờ quay lại dù QSC có tốt đến đâu.",
      "QSC chỉ quan trọng đối với khách quen cố định, không liên quan khách mới.",
      "Khách hàng mới chỉ quan tâm đến giá rẻ, không quan tâm QSC.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "新規顧客には、QSCレベルを全体的に上げていくことにより、再来店してもらえることに繋がります。",
    sourcePage: 17,
  },
  {
    id: "tr-sm6-1",
    chapterId: "sm-ch6",
    direction: "ja-to-vi",
    prompt: "使用者は原則として、１日８時間、１週当たり４０時間以内で労働者を働かせなければなりません。",
    options: [
      "Người sử dụng lao động có thể cho làm việc bao nhiêu giờ tùy ý, không giới hạn.",
      "Giờ làm việc tối đa là 12 giờ/ngày theo quy định chung.",
      "Về nguyên tắc, người sử dụng lao động phải giới hạn giờ làm của người lao động trong 8 giờ/ngày, 40 giờ/tuần.",
      "Quy định giờ làm chỉ áp dụng cho nhân viên chính thức, không áp dụng cho lao động thời vụ.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "使用者は原則として、１日８時間、１週当たり４０時間以内で労働者を働かせなければなりません。",
    sourcePage: 18,
  },
  {
    id: "tr-sm6-2",
    chapterId: "sm-ch6",
    direction: "vi-to-ja",
    prompt: "Để cho làm việc quá 40 giờ, phía sử dụng lao động và đại diện nhân viên cần ký kết thỏa ước lao động (thường gọi là Thỏa ước 36) và nộp cho Sở Giám sát Tiêu chuẩn Lao động.",
    options: [
      "４０時間を超えて働いてもらうためには、使用者側と従業員代表が労働基準法第３６条に基づく労使協定（いわゆる３６協定）を締結して労働基準監督署に届け出れば労働時間が延長できます。",
      "４０時間を超えて働かせることは、いかなる場合も法律で禁止されています。",
      "労使協定は口約束で十分であり、届け出は不要です。",
      "労働基準監督署への届け出は年に１回でよいものとされています。",
    ],
    correctIndex: 0,
    sourceQuoteJa:
      "４０時間を超えて働いてもらうためには、使用者側と従業員代表が労働基準法第３６条に基づく労使協定（いわゆる３６協定）を締結して労働基準監督署に届け出れば労働時間が延長できます。",
    sourcePage: 18,
  },
  {
    id: "tr-sm6-3",
    chapterId: "sm-ch6",
    direction: "ja-to-vi",
    prompt: "休憩時間を始業直後や終業直前に設定することはできません。",
    options: [
      "Giờ nghỉ chỉ được bố trí ngay sau khi bắt đầu ca làm việc.",
      "Giờ nghỉ chỉ được bố trí ngay trước khi kết thúc ca làm việc.",
      "Không có quy định nào về thời điểm bố trí giờ nghỉ.",
      "Không được bố trí giờ nghỉ ngay sau khi bắt đầu ca hoặc ngay trước khi kết thúc ca.",
    ],
    correctIndex: 3,
    sourceQuoteJa: "休憩時間を始業直後や終業直前に設定することはできません。",
    sourcePage: 18,
  },
  {
    id: "tr-sm6-4",
    chapterId: "sm-ch6",
    direction: "vi-to-ja",
    prompt: "Ngoài ra, cần cho người lao động nghỉ tối thiểu 1 ngày/tuần, hoặc tối thiểu 4 ngày trong mỗi 4 tuần.",
    options: [
      "休日は１か月に１日与えれば十分です。",
      "さらに休日は１週間に１日か、もしくは４週間を通じて４日以上与えなければなりません。",
      "休日を与える義務はありません。",
      "休日は年末年始のみ与えれば十分です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "さらに休日は１週間に１日か、もしくは４週間を通じて４日以上与えなければなりません。",
    sourcePage: 18,
  },
  {
    id: "tr-sm6-5",
    chapterId: "sm-ch6",
    direction: "ja-to-vi",
    prompt: "雇い入れの日から６か月を経過しその期間の全労働日の８割以上出勤した場合、有給休暇が発生します。",
    options: [
      "Nếu đã qua 6 tháng kể từ ngày tuyển dụng và đi làm từ 80% số ngày công trở lên trong giai đoạn đó, quyền nghỉ phép có lương sẽ phát sinh.",
      "Nghỉ phép có lương phát sinh ngay từ ngày đầu tiên đi làm.",
      "Nghỉ phép có lương chỉ phát sinh sau 3 năm làm việc liên tục.",
      "Nghỉ phép có lương không liên quan đến tỷ lệ đi làm.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "雇い入れの日から６か月を経過しその期間の全労働日の８割以上出勤した場合、有給休暇が発生します。",
    sourcePage: 18,
  },
  {
    id: "tr-sm6-6",
    chapterId: "sm-ch6",
    direction: "vi-to-ja",
    prompt: "Khi việc cho nghỉ đúng ngày người lao động chọn sẽ cản trở vận hành bình thường của doanh nghiệp, người sử dụng lao động được công nhận quyền thay đổi thời điểm nghỉ.",
    options: [
      "使用者はいつでも自由に労働者の有給休暇を拒否できます。",
      "時季変更権は労働者にのみ認められる権利です。",
      "労働者が時季指定した日に有給休暇を取得されることが事業の正常な運営を妨げる場合には、使用者に時季変更権が認められます。",
      "有給休暇の時季は使用者が一方的に決定します。",
    ],
    correctIndex: 2,
    sourceQuoteJa:
      "労働者が時季指定した日に有給休暇を取得されることが事業の正常な運営を妨げる場合には、使用者に時季変更権が認められます。",
    sourcePage: 19,
  },
  {
    id: "tr-sm6-7",
    chapterId: "sm-ch6",
    direction: "ja-to-vi",
    prompt: "採用の場合でも、その場でその旨を告げない。理由は関係部署に了承を得るため。",
    options: [
      "Nếu quyết định tuyển, phải thông báo ngay lập tức không được trì hoãn.",
      "Kể cả khi quyết định tuyển, không thông báo ngay tại chỗ — lý do là cần xin sự đồng ý từ các bộ phận liên quan.",
      "Chỉ thông báo kết quả qua thư, không bao giờ nói trực tiếp.",
      "Việc thông báo kết quả tuyển dụng không cần xin ý kiến ai.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "採用の場合でも、その場でその旨を告げない。理由は関係部署に了承を得るため。",
    sourcePage: 19,
  },
  {
    id: "tr-sm6-8",
    chapterId: "sm-ch6",
    direction: "vi-to-ja",
    prompt: "Tiếp theo, giới thiệu và hướng dẫn (Store Tour) về thiết bị và cách bố trí cửa hàng, rồi giới thiệu các nhân viên.",
    options: [
      "次にスタッフの給与明細を配布します。",
      "次に本部への出張を命じます。",
      "次に有給休暇の申請方法のみを説明します。",
      "次に店舗の設備や配置を説明して案内（ストアツアー）し、スタッフを紹介します。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "次に店舗の設備や配置を説明して案内（ストアツアー）し、スタッフを紹介します。",
    sourcePage: 19,
  },
  {
    id: "tr-sm7-1",
    chapterId: "sm-ch7",
    direction: "ja-to-vi",
    prompt: "人を育てるには、以下を体系立てて実施することが大切です。",
    options: [
      "Không cần hệ thống hóa gì cả, cứ đào tạo tùy hứng là được.",
      "Để đào tạo con người, việc thực hiện có hệ thống theo trình tự dưới đây là điều quan trọng.",
      "Đào tạo con người là việc bất khả thi.",
      "Chỉ cần đào tạo một lần duy nhất là đủ cho cả sự nghiệp.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "人を育てるには、以下を体系立てて実施することが大切です。",
    sourcePage: 20,
  },
  {
    id: "tr-sm7-2",
    chapterId: "sm-ch7",
    direction: "vi-to-ja",
    prompt: "Cơ sở của dịch vụ tiếp khách là học \"khuôn mẫu\" rồi thấm nhuần qua luyện tập lặp lại.",
    options: [
      "接客サービスの基本は「型」を学び、反復練習（トレーニング）をする中で体得することです。",
      "接客サービスの基本はマニュアルを一度読むだけで十分です。",
      "接客サービスに「型」は不要です。",
      "接客サービスは生まれつきの才能のみで決まります。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "接客サービスの基本は「型」を学び、反復練習（トレーニング）をする中で体得することです。",
    sourcePage: 20,
  },
  {
    id: "tr-sm7-3",
    chapterId: "sm-ch7",
    direction: "ja-to-vi",
    prompt: "サービスを表現する要素は「態度・表情・言葉遣い」です。",
    options: [
      "Chỉ có giá cả mới thể hiện được chất lượng dịch vụ.",
      "Yếu tố thể hiện dịch vụ chỉ là tốc độ phục vụ.",
      "Các yếu tố thể hiện dịch vụ là \"thái độ, nét mặt, cách dùng từ\".",
      "Dịch vụ không cần thể hiện qua bất kỳ yếu tố nào.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "サービスを表現する要素は「態度・表情・言葉遣い」です。",
    sourcePage: 20,
  },
  {
    id: "tr-sm7-4",
    chapterId: "sm-ch7",
    direction: "vi-to-ja",
    prompt: "OJT là đào tạo thực địa, huấn luyện để thấm nhuần kỹ năng dịch vụ/công việc thực hiện ngay tại hiện trường như cửa hàng.",
    options: [
      "OJTは実地訓練のことで、店舗など現場でおこなうサービスや作業の技術を体得させるトレーニングです。",
      "OJTは現場を離れておこなう集合教育です。",
      "OJTはオンラインでのみおこなう学習です。",
      "OJTは年に1回だけおこなう研修です。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "OJTは実地訓練のことで、店舗など現場でおこなうサービスや作業の技術を体得させるトレーニングです。",
    sourcePage: 21,
  },
  {
    id: "tr-sm7-5",
    chapterId: "sm-ch7",
    direction: "ja-to-vi",
    prompt: "OFFJTは理念や知識を教えます。これは現場を離れておこなう集合教育でおこなわれます。",
    options: [
      "OFFJT chỉ diễn ra tại hiện trường làm việc.",
      "OFFJT dạy triết lý và kiến thức, là hình thức đào tạo tập trung diễn ra tách rời khỏi hiện trường.",
      "OFFJT là quy trình phỏng vấn tuyển dụng.",
      "OFFJT chỉ huấn luyện kỹ năng tay chân, không dạy kiến thức.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "OFFJTは理念や知識を教えます。これは現場を離れておこなう集合教育でおこなわれます。",
    sourcePage: 21,
  },
  {
    id: "tr-sm7-6",
    chapterId: "sm-ch7",
    direction: "vi-to-ja",
    prompt: "Khi lập chương trình đào tạo nhân viên mới, điểm mấu chốt là kết hợp OJT và OFFJT.",
    options: [
      "新人を育成するプログラムを作成する際には、OJTのみを使うことがポイントです。",
      "新人を育成するプログラムを作成する際には、OFFJTのみを使うことがポイントです。",
      "新人を育成するプログラムを作成する際には、OJTとOFFJTを組み合わせることがポイントです。",
      "新人育成プログラムは作成する必要がありません。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "新人を育成するプログラムを作成する際には、OJTとOFFJTを組み合わせることがポイントです。",
    sourcePage: 21,
  },
  {
    id: "tr-sm7-7",
    chapterId: "sm-ch7",
    direction: "ja-to-vi",
    prompt: "トレーニーがどのくらい理解しているか、できたかを具体的にチェックし、フォローアップに結び付けます。",
    options: [
      "Cần kiểm tra cụ thể mức độ học viên hiểu và làm được đến đâu, rồi gắn kết với việc theo dõi hỗ trợ tiếp theo.",
      "Không cần kiểm tra gì sau khi huấn luyện xong.",
      "Chỉ cần hỏi miệng một câu là đủ, không cần quan sát thực tế.",
      "Việc theo dõi hỗ trợ chỉ dành cho nhân viên cấp quản lý.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "トレーニーがどのくらい理解しているか、できたかを具体的にチェックし、フォローアップに結び付けます。",
    sourcePage: 21,
  },
  {
    id: "tr-sm8-1",
    chapterId: "sm-ch8",
    direction: "ja-to-vi",
    prompt: "店舗ごとに防火管理者を配置しなければなりません。",
    options: [
      "Chỉ trụ sở chính mới cần Người quản lý phòng cháy.",
      "Người quản lý phòng cháy là chức danh không bắt buộc.",
      "Mỗi cửa hàng đều bắt buộc phải bố trí một Người quản lý phòng cháy.",
      "Mỗi vùng chỉ cần 1 Người quản lý phòng cháy cho tất cả cửa hàng.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "店舗ごとに防火管理者を配置しなければなりません。",
    sourcePage: 22,
  },
  {
    id: "tr-sm8-2",
    chapterId: "sm-ch8",
    direction: "vi-to-ja",
    prompt: "3 yếu tố cháy là vật liệu dễ cháy, oxy (không khí), và nguồn nhiệt (như tia lửa gas, tia điện, quá nhiệt).",
    options: [
      "燃焼三要素は、可燃物（燃えるもの）、酸素（空気）、熱源（ガスの炎、電気の火花、過加熱など）です。",
      "燃焼三要素は、水、油、風です。",
      "燃焼三要素は、煙、灰、熱です。",
      "燃焼にはただ1つの要素しか必要ありません。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "燃焼三要素は、可燃物（燃えるもの）、酸素（空気）、熱源（ガスの炎、電気の火花、過加熱など）です。",
    sourcePage: 22,
  },
  {
    id: "tr-sm8-3",
    chapterId: "sm-ch8",
    direction: "ja-to-vi",
    prompt: "煙は上へ上がるので、顔を床面に近づけるようにし、大きな透明のビニール袋の中に顔を入れて避難することで、有毒ガスから身を守る避難が大切です。",
    options: [
      "Khi sơ tán nên đứng thẳng và hít thở sâu để có nhiều oxy.",
      "Túi ni-lông không có tác dụng gì khi sơ tán trong hỏa hoạn.",
      "Vì khói bốc lên trên nên cần ghé mặt sát sàn nhà, đưa mặt vào túi ni-lông trong suốt lớn để tự bảo vệ khỏi khí độc khi sơ tán.",
      "Nên bò sát trần nhà vì khói tụ ở dưới sàn.",
    ],
    correctIndex: 2,
    sourceQuoteJa:
      "煙は上へ上がるので、顔を床面に近づけるようにし、大きな透明のビニール袋の中に顔を入れて避難することで、有毒ガスから身を守る避難が大切です。",
    sourcePage: 23,
  },
  {
    id: "tr-sm8-4",
    chapterId: "sm-ch8",
    direction: "vi-to-ja",
    prompt: "Về cơ bản cần định kỳ đóng cửa ra vào và giám sát/xác nhận người ra vào.",
    options: [
      "出入口をなるべく限定し、入出者の確認・監視をおこなう。",
      "出入口は常に全開放にしておく。",
      "入出者の確認は不要である。",
      "出入口は年に1回だけ確認すればよい。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "出入口をなるべく限定し、入出者の確認・監視をおこなう。",
    sourcePage: 23,
  },
  {
    id: "tr-sm8-5",
    chapterId: "sm-ch8",
    direction: "ja-to-vi",
    prompt: "年に１回は避難訓練を実施します。あらかじめ決めておいた手順に従って役割を決めておこないます。",
    options: [
      "Diễn tập sơ tán chỉ cần thực hiện 1 lần trong đời làm việc.",
      "Diễn tập sơ tán không cần phân công vai trò trước.",
      "Diễn tập sơ tán chỉ dành cho quản lý cửa hàng.",
      "Diễn tập sơ tán được thực hiện tối thiểu 1 lần/năm, tuân theo trình tự và phân công vai trò đã định trước.",
    ],
    correctIndex: 3,
    sourceQuoteJa: "年に１回は避難訓練を実施します。あらかじめ決めておいた手順に従って役割を決めておこないます。",
    sourcePage: 23,
  },
  {
    id: "tr-sm8-6",
    chapterId: "sm-ch8",
    direction: "vi-to-ja",
    prompt: "Cần làm rõ tổ chức của đội cứu hỏa tự vệ.",
    options: [
      "自衛消防隊の組織を明確化する。",
      "自衛消防隊は組織する必要がない。",
      "自衛消防隊は消防署が代わりに組織する。",
      "自衛消防隊の組織は毎年解散させる。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "自衛消防隊の組織を明確化する。",
    sourcePage: 22,
  },
  {
    id: "tr-sm8-7",
    chapterId: "sm-ch8",
    direction: "ja-to-vi",
    prompt: "自社（企業）を経営することにより、どのように社会に貢献するのかを明文化し示したもの。",
    options: [
      "Bảng lương chi tiết của toàn bộ nhân viên.",
      "Văn bản nêu rõ doanh nghiệp sẽ đóng góp cho xã hội như thế nào thông qua việc kinh doanh.",
      "Thực đơn chính thức của cửa hàng.",
      "Báo cáo doanh thu hàng quý.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "自社（企業）を経営することにより、どのように社会に貢献するのかを明文化し示したもの。",
    sourcePage: 27,
  },
  {
    id: "tr-sm8-8",
    chapterId: "sm-ch8",
    direction: "vi-to-ja",
    prompt: "Chu trình quản lý: Plan (kế hoạch) → Do (thực hiện) → Check (đánh giá) → Action (hành động khắc phục) → quay lại Plan.",
    options: [
      "プラン（計画）→ドウ（実施）→チェック（評価）→アクション（修正行動）→プラン（計画）という管理サイクル。",
      "アクション→プラン→ドウ→チェックという管理サイクル。",
      "管理サイクルというものは存在しない。",
      "チェックのみを繰り返す管理サイクル。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "プラン（計画）→ドウ（実施）→チェック（評価）→アクション（修正行動）→プラン（計画）という管理サイクル。",
    sourcePage: 27,
  },
  {
    id: "tr-hy1-1",
    chapterId: "hy-ch1",
    direction: "ja-to-vi",
    prompt: "人の健康を維持、増進するための「食」は常に安全で安心なものでなくてはなりません。",
    options: [
      "Ăn uống không liên quan gì đến sức khỏe con người.",
      "An toàn thực phẩm chỉ quan trọng đối với trẻ em.",
      "\"Ăn uống\" phục vụ việc duy trì và nâng cao sức khỏe con người luôn phải an toàn và đáng tin cậy.",
      "Sức khỏe con người không phụ thuộc vào chế độ ăn uống.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "人の健康を維持、増進するための「食」は常に安全で安心なものでなくてはなりません。",
    sourcePage: 1,
  },
  {
    id: "tr-hy1-2",
    chapterId: "hy-ch1",
    direction: "vi-to-ja",
    prompt: "Mục đích của Luật Vệ sinh Thực phẩm là ngăn ngừa phát sinh nguy hại vệ sinh do ăn uống, qua đó bảo vệ sức khỏe toàn dân.",
    options: [
      "食品衛生法の目的は外食産業の利益を最大化することです。",
      "食品衛生法の目的は「飲食に起因する衛生上の危害の発生を防止し、国民の健康の保護を図ること」です。",
      "食品衛生法には目的の規定がありません。",
      "食品衛生法の目的は輸出入の規制のみです。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "食品衛生法の第一条では、その目的を「飲食に起因する衛生上の危害の発生を防止し、国民の健康の保護を図ること」と明記しています。",
    sourcePage: 1,
  },
  {
    id: "tr-hy1-3",
    chapterId: "hy-ch1",
    direction: "ja-to-vi",
    prompt: "ほとんどの食中毒（約90％以上）は、食品を汚染する細菌、ウイルス、寄生虫などの有害微生物が原因物質です。",
    options: [
      "Hầu hết ngộ độc thực phẩm (trên khoảng 90%) có nguyên nhân là vi sinh vật có hại như vi khuẩn, virus, ký sinh trùng làm ô nhiễm thực phẩm.",
      "Ngộ độc thực phẩm chỉ do nhiệt độ bảo quản gây ra.",
      "Vi khuẩn không bao giờ gây ngộ độc thực phẩm.",
      "Chỉ có virus mới gây ngộ độc thực phẩm, vi khuẩn thì không.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "ほとんどの食中毒（約９０％以上）は、食品を汚染する細菌、ウイルス、寄生虫などの有害微生物が原因物質です。",
    sourcePage: 1,
  },
  {
    id: "tr-hy1-4",
    chapterId: "hy-ch1",
    direction: "vi-to-ja",
    prompt: "Ngộ độc thực phẩm là nguy hại vệ sinh lớn liên quan đến ăn uống, nhưng gần đây chấn thương do dị vật lẫn trong thức ăn và biện pháp phòng dị ứng thực phẩm cũng trở thành thách thức quan trọng.",
    options: [
      "食中毒だけが唯一の衛生上の課題です。",
      "異物混入は食品衛生とは無関係です。",
      "食物アレルギーは重要な課題ではありません。",
      "食中毒は飲食に起因する衛生上の大きな危害ですが、近年は異物混入によるケガや、食物アレルギー対策も重要な課題になっています。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "食中毒は飲食に起因する衛生上の大きな危害ですが、近年は異物混入によるケガや、食物アレルギー対策も重要な課題になっています。",
    sourcePage: 1,
  },
  {
    id: "tr-hy1-5",
    chapterId: "hy-ch1",
    direction: "ja-to-vi",
    prompt: "食品の製造・販売などをおこなう食品等事業者は食品衛生法に定められた内容をしっかりと守らなくてはなりません。",
    options: [
      "Các doanh nghiệp sản xuất/kinh doanh thực phẩm phải tuân thủ nghiêm túc nội dung quy định trong Luật Vệ sinh Thực phẩm.",
      "Chỉ doanh nghiệp lớn mới cần tuân thủ Luật Vệ sinh Thực phẩm.",
      "Luật Vệ sinh Thực phẩm chỉ mang tính khuyến nghị, không bắt buộc.",
      "Doanh nghiệp thực phẩm có thể tự chọn tuân thủ hay không.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "食品の製造・販売などをおこなう食品等事業者は食品衛生法に定められた内容をしっかりと守らなくてはなりません。",
    sourcePage: 1,
  },
  {
    id: "tr-hy2-1",
    chapterId: "hy-ch2",
    direction: "ja-to-vi",
    prompt: "食中毒予防の３原則「つけない・増やさない・やっつける」は、有害微生物による食中毒を防止するための重要な原則です。",
    options: [
      "3 nguyên tắc này chỉ áp dụng cho nhà hàng cao cấp.",
      "3 nguyên tắc phòng ngừa ngộ độc thực phẩm \"không để nhiễm - không để sinh sôi - tiêu diệt\" là những nguyên tắc quan trọng để phòng ngừa ngộ độc do vi sinh vật có hại.",
      "3 nguyên tắc này không liên quan đến vi sinh vật.",
      "3 nguyên tắc này chỉ cần áp dụng 1 lần duy nhất khi mở quán.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "食中毒予防の３原則「つけない・増やさない・やっつける」は、有害微生物による食中毒を防止するための重要な原則です。",
    sourcePage: 3,
  },
  {
    id: "tr-hy2-2",
    chapterId: "hy-ch2",
    direction: "vi-to-ja",
    prompt: "Vi khuẩn E.coli xuất huyết đường ruột (O157) hay Norovirus... chỉ cần khoảng 10-100 con là đã gây lây nhiễm.",
    options: [
      "腸管出血性大腸菌は10万個以上でなければ感染しません。",
      "ノロウイルスは食品中で感染力を失います。",
      "腸管出血性大腸菌（O１５７）やノロウイルスなどの有害微生物は、１０個から１００個程度の少ない量を摂取するだけで感染します。",
      "少量感染という概念は存在しません。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "腸管出血性大腸菌（O１５７）やノロウイルスなどの有害微生物は、１０個から１００個程度の少ない量を摂取するだけで感染します。",
    sourcePage: 3,
  },
  {
    id: "tr-hy2-3",
    chapterId: "hy-ch2",
    direction: "ja-to-vi",
    prompt: "ただし、ウイルスは食品中で増えないため、この原則は適用できません。",
    options: [
      "Tuy nhiên, vì virus không sinh sôi trong thực phẩm nên nguyên tắc này không áp dụng được cho virus.",
      "Virus sinh sôi trong thực phẩm nhanh hơn vi khuẩn.",
      "Nguyên tắc \"không để sinh sôi\" áp dụng cho mọi loại vi sinh vật như nhau.",
      "Virus chỉ sinh sôi ở nhiệt độ cao.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "ただし、ウイルスは食品中で増えないため、この原則は適用できません。",
    sourcePage: 3,
  },
  {
    id: "tr-hy2-4",
    chapterId: "hy-ch2",
    direction: "vi-to-ja",
    prompt: "Vì đa số vi sinh vật có hại yếu với nhiệt, nên có thể tiêu diệt bằng cách gia nhiệt đầy đủ phần lõi thực phẩm.",
    options: [
      "有害微生物は熱に強いため、加熱しても死滅しません。",
      "食品の表面だけ加熱すれば十分です。",
      "有害微生物は冷却によってのみ死滅します。",
      "有害微生物の多くは熱に弱いため、食品の中心部を十分に加熱することで死滅します。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "有害微生物の多くは熱に弱いため、食品の中心部を十分に加熱することで死滅します。",
    sourcePage: 4,
  },
  {
    id: "tr-hy2-5",
    chapterId: "hy-ch2",
    direction: "ja-to-vi",
    prompt: "食品関係施設における５ S 活動は、職場環境の改善だけでなく衛生管理にも有効です。",
    options: [
      "Hoạt động 5S chỉ có tác dụng trang trí, không liên quan vệ sinh.",
      "Hoạt động 5S tại cơ sở liên quan thực phẩm không chỉ cải thiện môi trường làm việc mà còn hiệu quả cho quản lý vệ sinh.",
      "Hoạt động 5S chỉ áp dụng cho văn phòng, không áp dụng cho bếp.",
      "Hoạt động 5S là hoạt động không bắt buộc, có thể bỏ qua.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "食品関係施設における５ S 活動は、職場環境の改善だけでなく衛生管理にも有効です。",
    sourcePage: 4,
  },
  {
    id: "tr-hy2-6",
    chapterId: "hy-ch2",
    direction: "vi-to-ja",
    prompt: "Sắp xếp: cất giữ đồ cần thiết ở vị trí cố định để lấy ra đúng lúc, đúng số lượng cần; dụng cụ dùng lặp lại thì sau khi dùng phải trả về đúng vị trí.",
    options: [
      "整頓：必要なものを必要な時に必要な量だけ取り出せるように、定めた場所（定位置）に保管する（繰り返し使う用具は、使った後、必ず定位置に戻す）",
      "整理：不要なものを処分し、必要なものは個数を明確にする",
      "清掃：ゴミや汚れを除去する",
      "習慣：ルールやマニュアルを設けて教育訓練する",
    ],
    correctIndex: 0,
    sourceQuoteJa:
      "整頓：必要なものを必要な時に必要な量だけ取り出せるように、定めた場所（定位置）に保管する（繰り返し使う用具は、使った後、必ず定位置に戻す）",
    sourcePage: 4,
  },
  {
    id: "tr-hy2-7",
    chapterId: "hy-ch2",
    direction: "ja-to-vi",
    prompt: "習慣：整理、整頓、清掃についてルールやマニュアルを設けて教育訓練し、施設の清潔が常に維持されるよう習慣化する",
    options: [
      "Thói quen: lập quy tắc/sổ tay về sàng lọc-sắp xếp-dọn dẹp và đào tạo, để việc duy trì sạch sẽ trở thành thói quen thường xuyên.",
      "Thói quen: chỉ cần tổng vệ sinh 1 lần trong năm.",
      "Thói quen: không cần đào tạo gì, tự nhiên sẽ hình thành.",
      "Thói quen: chỉ áp dụng cho nhân viên mới.",
    ],
    correctIndex: 0,
    sourceQuoteJa:
      "習慣：整理、整頓、清掃についてルールやマニュアルを設けて教育訓練し、施設の清潔が常に維持されるよう習慣化する",
    sourcePage: 4,
  },
  {
    id: "tr-hy3-1",
    chapterId: "hy-ch3",
    direction: "ja-to-vi",
    prompt:
      "基準は、すべての食品等事業者が一律に遵守しなければならない「施設の内外の清潔保持などの一般的な衛生管理の基準」と、「食品衛生上の危害の発生を防止するために特に重要な工程を管理するための取組の基準」の２つで構成され",
    options: [
      "Vì virus không sinh sôi trong thực phẩm nên đây không phải nguyên tắc chung.",
      "Tiêu chuẩn này chỉ gồm 1 phần duy nhất, không chia nhỏ.",
      "Tiêu chuẩn gồm 2 phần: \"tiêu chuẩn quản lý vệ sinh chung\" (mọi doanh nghiệp phải tuân thủ như nhau, như giữ sạch trong ngoài cơ sở) và \"tiêu chuẩn quản lý công đoạn quan trọng\" (để ngăn nguy hại vệ sinh thực phẩm).",
      "Tiêu chuẩn này chỉ áp dụng cho nhà máy sản xuất lớn, không áp dụng cho quán ăn.",
    ],
    correctIndex: 2,
    sourceQuoteJa:
      "基準は、すべての食品等事業者が一律に遵守しなければならない「施設の内外の清潔保持などの一般的な衛生管理の基準」と、「食品衛生上の危害の発生を防止するために特に重要な工程を管理するための取組の基準」の２つで構成され",
    sourcePage: 5,
  },
  {
    id: "tr-hy3-2",
    chapterId: "hy-ch3",
    direction: "vi-to-ja",
    prompt: "Phiếu giám sát vệ sinh thực phẩm là căn cứ để xác nhận tình trạng thực hiện quản lý vệ sinh theo HACCP.",
    options: [
      "食品衛生監視票は営業者が自由に破棄してよい書類です。",
      "食品衛生監視票に基づいて「HACCPに沿った衛生管理」の実施状況の確認を受ける必要があります。",
      "食品衛生監視票は保健所には一切提出しません。",
      "食品衛生監視票は5年に1回だけ確認されます。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "「食品衛生監視票」に基づいて「HACCPに沿った衛生管理」の実施状況の確認を受ける必要があります。",
    sourcePage: 5,
  },
  {
    id: "tr-hy3-3",
    chapterId: "hy-ch3",
    direction: "ja-to-vi",
    prompt: "衛生管理計画の作成：「一般的な衛生管理」および「HACCPに沿った衛生管理」に関する基準に基づき衛生管理計画を作成し、従業員に周知徹底を図る。",
    options: [
      "Lập kế hoạch quản lý vệ sinh: chỉ cần lập một lần rồi cất trong tủ, không cần thông báo cho ai.",
      "Lập kế hoạch quản lý vệ sinh: dựa theo tiêu chuẩn về quản lý vệ sinh chung và HACCP, lập kế hoạch rồi phổ biến triệt để cho nhân viên.",
      "Lập kế hoạch quản lý vệ sinh: chỉ cần thông báo miệng, không cần văn bản.",
      "Lập kế hoạch quản lý vệ sinh: là công việc riêng của bộ phận kế toán.",
    ],
    correctIndex: 1,
    sourceQuoteJa:
      "衛生管理計画の作成：「一般的な衛生管理」および「HACCPに沿った衛生管理」に関する基準に基づき衛生管理計画を作成し、従業員に周知徹底を図る。",
    sourcePage: 5,
  },
  {
    id: "tr-hy3-4",
    chapterId: "hy-ch3",
    direction: "vi-to-ja",
    prompt: "Phân tích yếu tố nguy hại: lập bảng liệt kê yếu tố nguy hại theo từng công đoạn chế biến/vận chuyển/bảo quản/bán hàng, và định ra biện pháp quản lý chúng.",
    options: [
      "危害要因の分析：従業員の給与を工程ごとに分析すること。",
      "危害要因の分析：食品又は添加物の製造、加工、調理、運搬、貯蔵又は販売の工程ごとに、食品衛生上の危害を発生させ得る要因（危害要因）の一覧表を作成し、これら危害要因を管理するための措置（管理措置）を定めること。",
      "危害要因の分析は年に1回だけ実施すれば十分である。",
      "危害要因の分析は保健所のみがおこなうものである。",
    ],
    correctIndex: 1,
    sourceQuoteJa:
      "危害要因の分析：食品又は添加物の製造、加工、調理、運搬、貯蔵又は販売の工程ごとに、食品衛生上の危害を発生させ得る要因（危害要因）の一覧表を作成し、これら危害要因を管理するための措置（管理措置）を定めること。",
    sourcePage: 6,
  },
  {
    id: "tr-hy3-5",
    chapterId: "hy-ch3",
    direction: "ja-to-vi",
    prompt: "改善措置の設定：個々の重要管理点において、モニタリングの結果、管理基準を逸脱したことが判明した場合の改善措置を設定すること。",
    options: [
      "Thiết lập biện pháp cải thiện: định trước biện pháp sẽ áp dụng nếu kết quả giám sát cho thấy đã lệch khỏi tiêu chuẩn quản lý tại từng điểm quản lý quan trọng.",
      "Thiết lập biện pháp cải thiện: chỉ áp dụng khi có khiếu nại từ khách hàng.",
      "Thiết lập biện pháp cải thiện: là công việc không bắt buộc, tùy ý doanh nghiệp.",
      "Thiết lập biện pháp cải thiện: chỉ cần thực hiện 1 lần khi mở quán.",
    ],
    correctIndex: 0,
    sourceQuoteJa:
      "改善措置の設定：個々の重要管理点において、モニタリングの結果、管理基準を逸脱したことが判明した場合の改善措置を設定すること。",
    sourcePage: 6,
  },
  {
    id: "tr-hy3-6",
    chapterId: "hy-ch3",
    direction: "vi-to-ja",
    prompt: "Doanh nghiệp nhỏ có thể áp dụng linh hoạt, dựa theo sổ tay hướng dẫn do hiệp hội ngành soạn và đã được Bộ Y tế Lao động Phúc lợi xác nhận.",
    options: [
      "小規模営業者などは、業界団体が作成し、厚生労働省で確認した手引書に基づいて対応することが可能。",
      "小規模営業者は一切の基準から除外される。",
      "小規模営業者は独自に基準を作ってよい、確認は不要。",
      "小規模営業者は大規模事業者と全く同じ手続きが必須である。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "小規模営業者などへの弾力的運用：小規模な営業者などは、業界団体が作成し、厚生労働省で確認した手引書に基づいて対応することが可能。",
    sourcePage: 6,
  },
  {
    id: "tr-hy4-1",
    chapterId: "hy-ch4",
    direction: "ja-to-vi",
    prompt: "食品衛生責任者は施設の食品衛生について一定の責任を果たす者であることから、次のいずれかに該当する者とされています。",
    options: [
      "Ai cũng có thể trở thành Người phụ trách vệ sinh thực phẩm, không cần điều kiện gì.",
      "Người phụ trách vệ sinh thực phẩm không cần chịu trách nhiệm gì.",
      "Vì là người phải chịu một phần trách nhiệm nhất định về vệ sinh thực phẩm của cơ sở, nên Người phụ trách vệ sinh thực phẩm phải thuộc một trong các đối tượng sau.",
      "Chỉ chủ doanh nghiệp mới được làm Người phụ trách vệ sinh thực phẩm.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "食品衛生責任者は施設の食品衛生について一定の責任を果たす者であることから、次のいずれかに該当する者とされています。",
    sourcePage: 7,
  },
  {
    id: "tr-hy4-2",
    chapterId: "hy-ch4",
    direction: "vi-to-ja",
    prompt: "\"Rửa\" và \"Khử trùng\" cần được phân biệt sử dụng khéo léo tùy theo mục đích.",
    options: [
      "「洗浄」と「消毒」は完全に同じ作業です。",
      "「洗浄」だけをおこなえば十分です。",
      "「消毒」は不要な作業です。",
      "「洗浄」と「消毒」は上手に使い分ける必要があります。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "「洗浄」と「消毒」は上手に使い分ける必要があります。",
    sourcePage: 10,
  },
  {
    id: "tr-hy4-3",
    chapterId: "hy-ch4",
    direction: "ja-to-vi",
    prompt: "「消毒」とは「人畜に対して病原性のある微生物（細菌、ウイルスなど）を不活化させ、感染を防止すること」と説明されます。",
    options: [
      "\"Khử trùng\" chỉ đơn giản là lau bụi bề mặt.",
      "\"Khử trùng\" là công đoạn không có tác dụng gì với vi khuẩn.",
      "\"Khử trùng\" được giải thích là \"làm bất hoạt vi sinh vật gây bệnh cho người/vật nuôi (vi khuẩn, virus...) để phòng ngừa lây nhiễm\".",
      "\"Khử trùng\" chỉ áp dụng được cho đồ vật kim loại.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "「消毒」とは「人畜に対して病原性のある微生物（細菌、ウイルスなど）を不活化させ、感染を防止することで、薬物・煮沸・蒸気・日光などによる方法がある。」と説明されます。",
    sourcePage: 14,
  },
  {
    id: "tr-hy4-4",
    chapterId: "hy-ch4",
    direction: "vi-to-ja",
    prompt: "Ngộ độc thực phẩm hoặc bệnh truyền nhiễm qua đường nước có nguy cơ gây thiệt hại trên phạm vi rộng, số bệnh nhân đông và bùng phát tập thể.",
    options: [
      "水を介する食中毒は絶対に発生しません。",
      "水質は食中毒と全く関係ありません。",
      "水を介する食中毒や感染症は、その被害が広範囲で患者数が多く集団発生になる危険性があります。",
      "水を介する感染症は個人にしか影響しません。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "水を介する食中毒や感染症は、その被害が広範囲で患者数が多く集団発生になる危険性があります。",
    sourcePage: 17,
  },
  {
    id: "tr-hy4-5",
    chapterId: "hy-ch4",
    direction: "ja-to-vi",
    prompt: "ねずみやハエ、ゴキブリなどの昆虫は、食中毒菌や感染症を引き起こす有害微生物の運搬役となり、異物混入の原因にもなります。",
    options: [
      "Chuột và côn trùng hoàn toàn vô hại với thực phẩm.",
      "Chỉ có ruồi mới gây hại, chuột và gián thì không.",
      "Côn trùng chỉ gây phiền toái về mặt thẩm mỹ, không ảnh hưởng vệ sinh.",
      "Chuột, ruồi, gián và các loại côn trùng khác đóng vai trò vận chuyển vi sinh vật có hại gây ngộ độc/bệnh truyền nhiễm, và còn là nguyên nhân gây lẫn dị vật vào thức ăn.",
    ],
    correctIndex: 3,
    sourceQuoteJa: "ねずみやハエ、ゴキブリなどの昆虫は、食中毒菌や感染症を引き起こす有害微生物の運搬役となり、異物混入の原因にもなります。",
    sourcePage: 18,
  },
  {
    id: "tr-hy4-6",
    chapterId: "hy-ch4",
    direction: "vi-to-ja",
    prompt: "Vệ sinh thực phẩm bắt đầu từ rửa tay và kết thúc cũng bằng rửa tay. Điểm khởi đầu của phòng ngừa ngộ độc thực phẩm chính là rửa tay.",
    options: [
      "食品衛生に手洗いは全く関係ありません。",
      "手洗いは調理の最後にだけおこなえばよいものです。",
      "食中毒予防の原点は換気です。",
      "「食品衛生は、手洗いにはじまって手洗いで終わる。食中毒予防の原点は、手洗い」といわれます。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "「食品衛生は、手洗いにはじまって手洗いで終わる。食中毒予防の原点は、手洗い」といわれます。",
    sourcePage: 23,
  },
  {
    id: "tr-hy4-7",
    chapterId: "hy-ch4",
    direction: "ja-to-vi",
    prompt: "食物アレルギーとは、食品に含まれる特定のアレルギー物質（アレルゲン）を摂取することで生じるアレルギー反応のことです。",
    options: [
      "Dị ứng thực phẩm chỉ xảy ra khi ăn quá no.",
      "Dị ứng thực phẩm là phản ứng dị ứng phát sinh khi tiêu thụ chất gây dị ứng đặc thù (allergen) có trong thực phẩm.",
      "Dị ứng thực phẩm không liên quan đến thành phần thực phẩm.",
      "Dị ứng thực phẩm chỉ xảy ra với trẻ em.",
    ],
    correctIndex: 1,
    sourceQuoteJa: "食物アレルギーとは、食品に含まれる特定のアレルギー物質（アレルゲン）を摂取することで生じるアレルギー反応のことです。",
    sourcePage: 25,
  },
  {
    id: "tr-hy4-8",
    chapterId: "hy-ch4",
    direction: "vi-to-ja",
    prompt: "Thu hồi tự nguyện là biện pháp do nhà sản xuất tự nguyện thực hiện khi phát hiện sản phẩm đã bán có khiếm khuyết nào đó.",
    options: [
      "自主回収とは行政が強制的に命令するものです。",
      "自主回収は消費者が自分でおこなうものです。",
      "自主回収とは、一度販売された製品に何らかの欠陥があることが判明した場合に、生産者が自主的に製品の回収の措置をおこなうものです。",
      "自主回収は違法行為です。",
    ],
    correctIndex: 2,
    sourceQuoteJa: "自主回収とは、一度販売された製品に何らかの欠陥があることが判明した場合に、生産者が自主的に製品の回収の措置をおこなうものであり、行政による食品衛生法違反品の回収命令とは異なる措置です。",
    sourcePage: 27,
  },
  {
    id: "tr-hy4-9",
    chapterId: "hy-ch4",
    direction: "ja-to-vi",
    prompt: "販売品は適切な量を仕入れ、納品時に異常がないか確認します。",
    options: [
      "Hàng bán có thể nhập vô hạn số lượng, không cần kiểm tra.",
      "Kiểm tra hàng giao chỉ cần thực hiện 1 lần/năm.",
      "Hàng bán cần nhập với lượng phù hợp, và kiểm tra xem có bất thường không khi giao hàng.",
      "Lượng nhập hàng không ảnh hưởng đến chất lượng bán.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "販売品は適切な量を仕入れ、納品時に異常がないか確認します。",
    sourcePage: 28,
  },
  {
    id: "tr-hy4-10",
    chapterId: "hy-ch4",
    direction: "vi-to-ja",
    prompt: "Tùy theo thời điểm tuyển dụng mới hoặc kinh nghiệm làm việc, cần tận dụng cơ hội đào tạo/OJT để trang bị kiến thức và kỹ thuật cần thiết cho vị trí/công việc tại thời điểm đó.",
    options: [
      "新規採用時にはいかなる研修も不要です。",
      "新規採用時や従事経験に応じて、その時点の立場や担当業務に必要な知識や技術を研修やOJTの機会を活用することで、常に衛生レベルの維持、向上を図ります。",
      "OJTは経験豊富な社員には不要です。",
      "研修は入社1年後にのみおこないます。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "新規採用時や従事経験に応じて、その時点の立場や担当業務に必要な知識や技術を研修やOJTの機会を活用することで、常に衛生レベルの維持、向上を図ります。",
    sourcePage: 29,
  },
  {
    id: "tr-hy4-11",
    chapterId: "hy-ch4",
    direction: "ja-to-vi",
    prompt: "継続的な点検と記録によって、データの変化からトラブル発生の予兆を把握し、作業工程の改善や機械の補修などの対策を早めにとることができます。",
    options: [
      "Ghi chép không có tác dụng phát hiện dấu hiệu sự cố.",
      "Chỉ cần kiểm tra 1 lần duy nhất là đủ, không cần liên tục.",
      "Nhờ kiểm tra và ghi chép liên tục, có thể nắm bắt dấu hiệu trước của sự cố qua sự thay đổi dữ liệu, từ đó sớm cải thiện quy trình hoặc sửa chữa máy móc.",
      "Dữ liệu ghi chép chỉ dùng để trang trí báo cáo.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "継続的な点検と記録によって、データの変化からトラブル発生の予兆を把握し、作業工程の改善や機械の補修などの対策を早めにとることができ、結果的に食中毒などの重大事故の未然防止が可能となります。",
    sourcePage: 30,
  },
  {
    id: "tr-hy4-12",
    chapterId: "hy-ch4",
    direction: "vi-to-ja",
    prompt: "Bằng cách xử lý đúng đắn chất thải và nước thải, có thể duy trì môi trường sạch sẽ ở cơ sở và khu vực xung quanh.",
    options: [
      "廃棄物（ゴミ）および排水（汚水）を適切に処理することで、常に施設と周辺の環境を清潔に保ちます。",
      "廃棄物と排水の処理は環境に何の影響も与えません。",
      "廃棄物は処理せずそのまま放置してよい。",
      "排水処理は年に1回だけおこなえば十分。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "廃棄物（ゴミ）および排水（汚水）を適切に処理することで、常に施設と周辺の環境を清潔に保ちます。",
    sourcePage: 20,
  },
  {
    id: "tr-hy5-1",
    chapterId: "hy-ch5",
    direction: "ja-to-vi",
    prompt: "食材の下処理工程では、泥、汚れ、異物、有害微生物などをできるだけ除去し、下処理後には二次汚染や有害な微生物の増殖の機会を与えないように保管します。",
    options: [
      "Công đoạn sơ chế không cần quan tâm đến vi sinh vật.",
      "Sau sơ chế có thể để nguyên liệu ở bất kỳ đâu.",
      "Ở công đoạn sơ chế, cần loại bỏ tối đa bùn đất/vết bẩn/dị vật/vi sinh vật có hại, và sau sơ chế phải bảo quản sao cho không tạo cơ hội lây nhiễm chéo hoặc vi sinh vật sinh sôi.",
      "Sơ chế chỉ cần rửa qua loa là đủ.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "食材の下処理工程では、泥、汚れ、異物、有害微生物などをできるだけ除去し、下処理後には二次汚染や有害な微生物の増殖の機会を与えないように保管します。",
    sourcePage: 31,
  },
  {
    id: "tr-hy5-2",
    chapterId: "hy-ch5",
    direction: "vi-to-ja",
    prompt: "Rã đông tự nhiên/ở nhiệt độ phòng là phương pháp không được phép áp dụng về mặt quản lý vệ sinh.",
    options: [
      "自然・室温解凍は、最も推奨される解凍方法です。",
      "自然・室温解凍に問題はありません。",
      "自然・室温解凍は法律で義務づけられています。",
      "自然・室温解凍は、衛生管理上おこなってはいけない解凍方法です。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "自然・室温解凍：食材の表面で細菌が増殖する機会を与えることになるため、衛生管理上おこなってはいけない解凍方法です。",
    sourcePage: 32,
  },
  {
    id: "tr-hy5-3",
    chapterId: "hy-ch5",
    direction: "ja-to-vi",
    prompt: "ボツリヌス菌、ウエルシュ菌、セレウス菌などの食中毒菌は、熱に強い芽胞を形成するため、加熱調理時に100℃で加熱しても死滅しません。",
    options: [
      "Các vi khuẩn này chết ngay khi gặp nhiệt độ phòng.",
      "Các vi khuẩn này không tồn tại trong thực phẩm đã nấu chín.",
      "Các vi khuẩn ngộ độc như Clostridium botulinum, Clostridium perfringens, Bacillus cereus tạo bào tử chịu nhiệt cao, nên dù nấu ở 100°C cũng không bị tiêu diệt.",
      "Chỉ cần rửa tay là đủ để tiêu diệt các vi khuẩn này.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "ボツリヌス菌、ウエルシュ菌、セレウス菌などの食中毒菌は、熱に強い芽胞を形成するため、加熱調理時に１００℃で加熱しても死滅しません。",
    sourcePage: 32,
  },
  {
    id: "tr-hy5-4",
    chapterId: "hy-ch5",
    direction: "vi-to-ja",
    prompt: "Thực phẩm làm nguội sau khi nấu cần rút ngắn tối đa thời gian ở vùng nhiệt độ nguy hiểm (10-60°C) nơi vi khuẩn có thể sinh sôi.",
    options: [
      "加熱調理後の食品は温度管理をする必要がありません。",
      "危険温度帯は0～5℃のことです。",
      "冷却時間は長ければ長いほど良いとされています。",
      "加熱調理後に冷却する食品は、細菌の増殖が可能な危険温度帯（10～60℃）に置かれる時間を極力短くすることが重要です。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "加熱調理後に冷却する食品は、細菌の増殖が可能な危険温度帯（１０～６０℃）に置かれる時間を極力短くすることが重要です。",
    sourcePage: 32,
  },
  {
    id: "tr-hy5-5",
    chapterId: "hy-ch5",
    direction: "ja-to-vi",
    prompt: "加熱前食材と加熱後の食品に使用する包丁、まな板などの器具や食器類は、それぞれ専用のものとして二次汚染の発生を防止します。",
    options: [
      "Dao, thớt và các dụng cụ/bát đĩa dùng cho nguyên liệu chưa nấu và thực phẩm đã nấu phải được dùng riêng biệt để phòng ngừa lây nhiễm chéo.",
      "Có thể dùng chung 1 con dao cho cả nguyên liệu sống và đồ đã nấu.",
      "Việc dùng riêng dụng cụ chỉ là khuyến nghị, không quan trọng.",
      "Lây nhiễm chéo không xảy ra trong nhà bếp.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "加熱前食材と加熱後の食品に使用する包丁、まな板などの器具や食器類は、それぞれ専用のものとして二次汚染の発生を防止します。",
    sourcePage: 33,
  },
  {
    id: "tr-hy5-6",
    chapterId: "hy-ch5",
    direction: "vi-to-ja",
    prompt: "Khi trình bày món, không được dùng tay không, bắt buộc phải dùng găng tay dùng 1 lần cùng đũa/kẹp gắp sạch.",
    options: [
      "盛り付けは素手でおこなわず、必ず使い捨て手袋と、清潔な箸、トングなどの器具を使用します。",
      "盛り付けは素手が最も清潔な方法です。",
      "盛り付け時に手袋は不要です。",
      "箸やトングは使わなくてもよいです。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "盛り付けは素手でおこなわず、必ず使い捨て手袋と、清潔な箸、トングなどの器具を使用します。",
    sourcePage: 34,
  },
  {
    id: "tr-hy5-7",
    chapterId: "hy-ch5",
    direction: "ja-to-vi",
    prompt: "調理済み食品は必ずフタ付きの容器やラップをかけて保管し、未加熱原材料との接触や手指からの汚染、異物混入を防ぎます。",
    options: [
      "Thực phẩm đã nấu phải luôn đậy nắp hộp hoặc bọc màng, để tránh tiếp xúc với nguyên liệu chưa nấu, ô nhiễm từ tay và lẫn dị vật.",
      "Thực phẩm đã nấu không cần đậy nắp gì cả.",
      "Nguyên liệu chưa nấu và thực phẩm đã nấu có thể để chung một hộp.",
      "Tay chạm vào thực phẩm đã nấu không gây vấn đề gì.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "調理済み食品は必ずフタ付きの容器やラップをかけて保管し、未加熱原材料との接触や手指からの汚染、異物混入を防ぎます。",
    sourcePage: 34,
  },
  {
    id: "tr-hy5-8",
    chapterId: "hy-ch5",
    direction: "vi-to-ja",
    prompt: "Khi rã đông thịt/cá đông lạnh, để ức chế vi khuẩn sinh sôi, việc rã đông ở nhiệt độ thấp còn giúp hạn chế phát sinh hiện tượng rỉ dịch.",
    options: [
      "凍結した肉や魚の解凍中に細菌の増殖を抑えるために、低温で解凍すると、ドリップの発生も抑えられます。",
      "解凍時に細菌の増殖を心配する必要はありません。",
      "高温で解凍するほうがドリップを防げます。",
      "ドリップは解凍とは無関係の現象です。",
    ],
    correctIndex: 0,
    sourceQuoteJa: "凍結した肉や魚の解凍中に細菌の増殖を抑えるために、低温で解凍すると、ドリップの発生も抑えられます。",
    sourcePage: 31,
  },
  {
    id: "tr-ck1-1",
    chapterId: "ck-ch1",
    direction: "ja-to-vi",
    prompt: "豚肉は肉として出荷される月齢が牛肉より若く、脂肪分の多いばら肉を除き、肉質は比較的均一です。",
    options: [
      "Heo được xuất chuồng lấy thịt ở độ tuổi trẻ hơn bò; trừ phần ba chỉ nhiều mỡ, chất thịt các phần khác tương đối đồng đều.",
      "Heo được xuất chuồng lấy thịt ở độ tuổi già hơn bò; mọi phần thịt đều nhiều mỡ như nhau.",
      "Heo chỉ có một phần thịt duy nhất được sử dụng để chế biến.",
      "Chất lượng thịt heo phụ thuộc hoàn toàn vào phần ba chỉ.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "豚肉は肉として出荷される月齢が牛肉より若く、脂肪分の多いばら肉を除き、肉質は比較的均一です。",
    sourcePage: 1,
  },
  {
    id: "tr-ck1-2",
    chapterId: "ck-ch1",
    direction: "vi-to-ja",
    prompt: "Khi làm nóng thịt, do protein (thành phần chính của thịt) biến tính, thịt co lại, nước thịt chảy ra và trở nên cứng.",
    options: [
      "肉を冷凍すると、肉の主成分である水分が蒸発し、膨張して柔らかくなります。",
      "肉を加熱すると、肉の主成分であるタンパク質の変性により、縮んで肉汁が流れ出し、硬くなります。",
      "肉を加熱すると、脂肪だけが溶けて肉全体が液体になります。",
      "肉を加熱しても、タンパク質は変化しません。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "肉を加熱すると、肉の主成分であるタンパク質の変性※により、縮んで肉汁が流れ出し、硬くなります。",
    sourcePage: 1,
  },
  {
    id: "tr-ck1-3",
    chapterId: "ck-ch1",
    direction: "ja-to-vi",
    prompt: "魚介類とは、魚、貝類、エビ、カニを中心とした食用水産生物の総称です。",
    options: [
      "Hải sản chỉ riêng cá, không bao gồm động vật có vỏ.",
      "Hải sản là tên gọi chung cho các loại rau biển.",
      "Hải sản là tên gọi chung cho sinh vật thủy sản ăn được, chủ yếu là cá, động vật có vỏ, tôm, cua.",
      "Hải sản chỉ chỉ những loài được nuôi trồng nhân tạo.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "魚介類とは、魚、貝類、エビ、カニを中心とした食用水産生物の総称です。",
    sourcePage: 2,
  },
  {
    id: "tr-ck1-4",
    chapterId: "ck-ch1",
    direction: "vi-to-ja",
    prompt: "Vì cá nóc có độc, việc chế biến bắt buộc phải do người chế biến cá nóc chuyên môn được thống đốc tỉnh công nhận thực hiện.",
    options: [
      "フグは毒がないので、誰でも自由に調理してよいとされています。",
      "フグは加熱すれば誰でも安全に調理できます。",
      "フグは冷凍すれば毒が消えるため、資格は不要です。",
      "フグは毒をもっているので、都道府県知事などが認めた専門のフグ処理者が処理する必要があります。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "フグは毒をもっているので、都道府県知事などが認めた専門のフグ処理者が処理する必要があります。",
    sourcePage: 3,
  },
  {
    id: "tr-ck1-5",
    chapterId: "ck-ch1",
    direction: "ja-to-vi",
    prompt: "現在、日本の市場で流通する野菜の数は１５０種類ほどと言われています。",
    options: [
      "Hiện nay, số loại rau lưu thông trên thị trường Nhật Bản vào khoảng 150 loại.",
      "Hiện nay, số loại rau lưu thông trên thị trường Nhật Bản vào khoảng 15 loại.",
      "Hiện nay, rau không còn được bán trên thị trường Nhật Bản.",
      "Hiện nay, số loại rau lưu thông trên thị trường Nhật Bản vào khoảng 1.500 loại.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "現在、日本の市場で流通する野菜の数は１５０種類ほどと言われています。",
    sourcePage: 3,
  },
  {
    id: "tr-ck1-6",
    chapterId: "ck-ch1",
    direction: "vi-to-ja",
    prompt: "Khi luộc rau xanh như rau chân vịt, vì chất diệp lục dễ bị phá hủy bởi nhiệt nên phải luộc nhanh trong nhiều nước sôi, không đậy vung, rồi vớt vào nước lạnh để nguội.",
    options: [
      "ほうれん草など青菜をゆでるときは、少量の水で蓋をしてじっくり長時間ゆでます。",
      "ほうれん草など青菜をゆでるときは、緑色の色素（クロロフィル）が熱に弱いので、たっぷりのお湯で蓋をせずにさっとゆで、水にとって冷まします。",
      "ほうれん草など青菜は生で食べるのが唯一正しい調理法です。",
      "ほうれん草など青菜は電子レンジでのみ調理すべきです。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "ほうれん草など青菜をゆでるときは、緑色の色素（クロロフィル）が熱に弱いので、たっぷりのお湯で蓋をせずにさっとゆで、水にとって冷まします。",
    sourcePage: 3,
  },
  {
    id: "tr-ck1-7",
    chapterId: "ck-ch1",
    direction: "ja-to-vi",
    prompt: "ごぼうやれんこんなどは切ったあと、すぐに水につけると切り口の褐変を防ぐことができます。",
    options: [
      "Ngưu bàng, củ sen sau khi cắt nên để ngoài không khí để tránh thâm.",
      "Ngưu bàng, củ sen sau khi cắt không cần xử lý gì cả.",
      "Ngưu bàng, củ sen sau khi cắt, nếu ngâm ngay vào nước sẽ tránh được vết cắt bị thâm.",
      "Ngưu bàng, củ sen sau khi cắt nên rắc muối ngay để tránh thâm.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "ごぼうやれんこんなどは切ったあと、すぐに水につけると切り口の褐変を防ぐことができます。",
    sourcePage: 4,
  },
  {
    id: "tr-ck1-8",
    chapterId: "ck-ch1",
    direction: "vi-to-ja",
    prompt: "Wagyu chỉ 4 giống: giống lông đen, giống lông nâu, giống không sừng, giống sừng ngắn Nhật Bản và các giống lai của chúng.",
    options: [
      "和牛はホルスタイン種のみを指します。",
      "和牛はすべての国産牛を指す言葉です。",
      "和牛は輸入牛のみを指します。",
      "和牛は、黒毛和種・褐毛和種・無角和種・日本短角種の４品種とそれらの交雑種のことを指します。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "和牛は、黒毛和種・褐毛和種・無角和種・日本短角種の４品種とそれらの交雑種のことを指します。",
    sourcePage: 4,
  },
  {
    id: "tr-ck1-9",
    chapterId: "ck-ch1",
    direction: "ja-to-vi",
    prompt: "魚介類は肉類に比べ劣化が早く、小さな魚ほど早く傷みます。もっとも早く傷むのは貝類です。",
    options: [
      "Hải sản hư hỏng nhanh hơn thịt, cá càng nhỏ càng nhanh hư; hư nhanh nhất là động vật có vỏ.",
      "Hải sản hư hỏng chậm hơn thịt rất nhiều.",
      "Cá càng lớn thì càng nhanh hư hỏng.",
      "Trong các loại hải sản, cá lớn là hư hỏng nhanh nhất.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "魚介類は肉類に比べ劣化が早く、小さな魚ほど早く傷みます。もっとも早く傷むのは貝類です。",
    sourcePage: 3,
  },
  {
    id: "tr-ck1-10",
    chapterId: "ck-ch1",
    direction: "vi-to-ja",
    prompt: "Đầu tiên dùng lửa lớn hoặc vừa để nướng bề mặt cá, giữ vị ngon, sau đó dùng lửa nhỏ làm chín từ từ đến giữa.",
    options: [
      "魚は終始弱火でじっくり加熱するのが基本です。",
      "魚は、最初に強火か中火で表面を焼き、うまみを逃がさないようにしてから、弱火で中までじっくり加熱します。",
      "魚は常に強火のまま加熱し続けます。",
      "魚の加熱には順序の決まりはありません。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "魚は、焼く、煮る、揚げるなどの調理をするとき、タンパク質が熱で固まる性質を利用し、最初に強火か中火で表面を焼き、うまみを逃がさないようにしてから、弱火で中までじっくり加熱します。",
    sourcePage: 2,
  },
  {
    id: "tr-ck1-11",
    chapterId: "ck-ch1",
    direction: "ja-to-vi",
    prompt: "伝統野菜は地域の食文化に重要な役割を果たしています。",
    options: [
      "Rau truyền thống không có vai trò gì trong văn hóa địa phương.",
      "Rau truyền thống chỉ được trồng ở nước ngoài.",
      "Rau truyền thống đóng vai trò quan trọng trong văn hóa ẩm thực địa phương.",
      "Rau truyền thống đã bị cấm bán trên thị trường.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "伝統野菜は地域の食文化に重要な役割を果たしています。",
    sourcePage: 5,
  },
  {
    id: "tr-ck1-12",
    chapterId: "ck-ch1",
    direction: "vi-to-ja",
    prompt: "Trước khi phục vụ, khi bày cá nguyên con lên đĩa: đầu bên trái, bụng hướng xuống; nếu là món kiểu Nhật thì đồ ăn kèm đặt ở phía trước.",
    options: [
      "一尾魚：頭を右、腹を上に盛り付け、洋食の場合は付け合わせを奥に置きます。",
      "一尾魚は盛り付け方に決まりはありません。",
      "一尾魚は必ず頭を外して盛り付けます。",
      "一尾魚：頭を左、腹を下に盛り付けます。付け合わせは、和食の場合は手前に置きます。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "一尾魚：頭を左、腹を下に盛り付けます。付け合わせは、和食の場合は手前に置きます。",
    sourcePage: 3,
  },
  {
    id: "tr-ck1-13",
    chapterId: "ck-ch1",
    direction: "ja-to-vi",
    prompt: "肉のうまみを逃さないためには、加熱時間と温度の調節が重要です。",
    options: [
      "Để giữ vị ngon của thịt, việc điều chỉnh thời gian và nhiệt độ gia nhiệt là quan trọng.",
      "Vị ngon của thịt không liên quan gì đến thời gian hay nhiệt độ gia nhiệt.",
      "Chỉ cần gia nhiệt càng lâu càng giữ được vị ngon.",
      "Vị ngon của thịt chỉ phụ thuộc vào loại gia vị sử dụng.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "肉のうまみを逃さないためには、加熱時間と温度の調節が重要です。",
    sourcePage: 1,
  },
  {
    id: "tr-ck2-1",
    chapterId: "ck-ch2",
    direction: "ja-to-vi",
    prompt: "下処理状態が悪いと料理そのものの味や食感が悪くなります。",
    options: [
      "Nếu tình trạng sơ chế không tốt thì vị và kết cấu của chính món ăn sẽ trở nên kém đi.",
      "Nếu tình trạng sơ chế không tốt thì không ảnh hưởng gì.",
      "Nếu tình trạng sơ chế không tốt thì món ăn sẽ ngon hơn.",
      "Sơ chế chỉ ảnh hưởng đến màu sắc của món ăn.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "下処理状態が悪いと料理そのものの味や食感が悪くなります。",
    sourcePage: 5,
  },
  {
    id: "tr-ck2-2",
    chapterId: "ck-ch2",
    direction: "vi-to-ja",
    prompt: "Rau còn dính đất phải dùng bàn chải cọ kỹ để rửa sạch đất, cuối cùng rửa lại bằng nước chảy.",
    options: [
      "泥のついたものは、水につけるだけでよいです。",
      "泥のついたものは、たわしでよく洗って泥を落とし、最後に流水で洗います。",
      "泥のついたものは洗わずに調理します。",
      "泥のついたものは熱湯をかけるだけでよいです。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "泥のついたものは、たわしでよく洗って泥を落とし、最後に流水で洗います。",
    sourcePage: 5,
  },
  {
    id: "tr-ck2-3",
    chapterId: "ck-ch2",
    direction: "ja-to-vi",
    prompt: "きゅうりやキャベツは塩でもむと、浸透圧の作用で野菜から水分が出てしんなりします。",
    options: [
      "Dưa leo, bắp cải khi bóp muối thì không có gì thay đổi.",
      "Dưa leo, bắp cải khi bóp muối chỉ đậm màu hơn.",
      "Dưa leo, bắp cải khi bóp muối: do tác dụng thẩm thấu, nước trong rau thoát ra làm rau mềm xuống.",
      "Dưa leo, bắp cải khi bóp muối sẽ có mùi thơm mạnh hơn.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "きゅうりやキャベツは塩でもむと、浸透圧の作用で野菜から水分が出てしんなりします。",
    sourcePage: 5,
  },
  {
    id: "tr-ck2-4",
    chapterId: "ck-ch2",
    direction: "vi-to-ja",
    prompt: "Gân nằm giữa phần nạc và mỡ khi gia nhiệt sẽ co lại làm miếng thịt cong lên, nên phải khía dao trước.",
    options: [
      "赤身と脂身の間にある筋は加熱しても変化しません。",
      "赤身と脂身の間にある筋は取り除く必要はありません。",
      "赤身と脂身の間にある筋は冷やすと縮みます。",
      "赤身と脂身の間にある筋は加熱により縮み、肉が反り返るので、切れ目を入れます。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "赤身と脂身の間にある筋は加熱により縮み、肉が反り返るので、切れ目を入れます。",
    sourcePage: 5,
  },
  {
    id: "tr-ck2-5",
    chapterId: "ck-ch2",
    direction: "ja-to-vi",
    prompt: "うろこを落とす：尾から頭の方向に向かってとります。",
    options: [
      "Gạt vảy cá: gạt theo hướng từ đuôi tiến lên đầu.",
      "Gạt vảy cá: gạt theo hướng từ đầu xuống đuôi.",
      "Vảy cá không cần gạt trước khi nấu.",
      "Gạt vảy cá chỉ thực hiện sau khi nấu chín.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "うろこを落とす：尾から頭の方向に向かってとります。",
    sourcePage: 5,
  },
  {
    id: "tr-ck2-6",
    chapterId: "ck-ch2",
    direction: "vi-to-ja",
    prompt: "Rửa cá bằng nước: rửa nhanh dưới vòi nước chảy, sau đó lau khô kỹ nước còn đọng.",
    options: [
      "水洗いは時間をかけてぬるま湯でおこないます。",
      "水洗い：手早く流水で洗い流し、水気をしっかりふきとります。",
      "水洗いは不要です。",
      "水洗いは塩水でおこないます。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "水洗い：手早く流水で洗い流し、水気をしっかりふきとります。",
    sourcePage: 6,
  },
  {
    id: "tr-ck3-1",
    chapterId: "ck-ch3",
    direction: "ja-to-vi",
    prompt: "調理とは、食材に手を加え、衛生的で安全なものにする、味や香り、口触りをよくして美味しいものにすることです。",
    options: [
      "Nấu ăn là tác động lên nguyên liệu để làm cho nó vệ sinh, an toàn, cải thiện vị, hương thơm, cảm giác khi ăn để trở nên ngon miệng.",
      "Nấu ăn là công việc phục vụ nguyên liệu ở dạng nguyên bản, không cần xử lý gì.",
      "Nấu ăn chỉ đơn thuần là làm nóng thực phẩm.",
      "Nấu ăn không liên quan gì đến vệ sinh an toàn thực phẩm.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "調理とは、食材に手を加え、衛生的で安全なものにする、味や香り、口触りをよくして美味しいものにすることです。",
    sourcePage: 6,
  },
  {
    id: "tr-ck3-2",
    chapterId: "ck-ch3",
    direction: "vi-to-ja",
    prompt: "Xào (炒める) dùng ít dầu mỡ ở nhiệt độ cao, vừa khuấy vừa nấu nhanh; khi cho nhiều nguyên liệu, cho loại chín chậm vào trước để nhiệt vào đều.",
    options: [
      "炒めるは低温でじっくり長時間加熱する調理法です。",
      "炒める：高温・少量の油脂を用いて、撹拌しながら短時間で加熱します。複数の食材を入れるとき、熱の通りが遅い具材から先に入れて熱の入り具合を均等にします。",
      "炒めるは水を大量に使う調理法です。",
      "炒めるは食材を動かさずじっくり焼く調理法です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "炒める：高温・少量の油脂を用いて、撹拌しながら短時間で加熱します。複数の食材を入れるとき、熱の通りが遅い具材から先に入れて熱の入り具合を均等にします。",
    sourcePage: 6,
  },
  {
    id: "tr-ck3-3",
    chapterId: "ck-ch3",
    direction: "ja-to-vi",
    prompt: "油の劣化を防ぐためには以下の点に注意します。空気になるべくさらさないこと、長時間の加熱を避けること、直射日光に当てないこと、不純物を混ぜないこと。",
    options: [
      "Không cần chú ý gì khi dầu ăn xuống cấp.",
      "Chỉ cần thay dầu mới hàng ngày là đủ, không cần lưu ý gì khác.",
      "Để phòng ngừa dầu ăn xuống cấp, cần lưu ý: hạn chế tiếp xúc không khí, tránh gia nhiệt kéo dài, không để dưới ánh nắng trực tiếp, không để lẫn tạp chất.",
      "Dầu ăn không bao giờ bị xuống cấp dù dùng bao lâu.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "油の劣化を防ぐためには以下の点に注意します。・空気になるべくさらさないこと・長時間の加熱を避けること・直射日光に当てないこと・不純物を混ぜないこと",
    sourcePage: 6,
  },
  {
    id: "tr-ck3-4",
    chapterId: "ck-ch3",
    direction: "vi-to-ja",
    prompt: "Chế biến không dùng nhiệt có rủi ro lây nhiễm chéo/ô nhiễm thứ cấp cao, nên phải tuân thủ nghiêm ngặt lưu ý về quản lý vệ sinh.",
    options: [
      "非加熱調理はリスクが低いので特に注意は不要です。",
      "非加熱調理は加熱調理より安全です。",
      "非加熱調理では衛生管理は重要ではありません。",
      "非加熱調理では、交差汚染・二次汚染のリスクが高いので、衛生管理での注意事項は確実に守ることが大切です。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "非加熱調理では、交差汚染・二次汚染のリスクが高いので、衛生管理での注意事項は確実に守ることが大切です。",
    sourcePage: 7,
  },
  {
    id: "tr-ck3-5",
    chapterId: "ck-ch3",
    direction: "ja-to-vi",
    prompt: "刺身のような「生食用冷凍魚介類」は、組織の破壊や汁の流出が起きないようになるべく低温で時間をかけて解凍します。",
    options: [
      "Hải sản đông lạnh dùng để ăn sống như sashimi phải được rã đông ở nhiệt độ thấp trong thời gian dài để tránh phá hủy cấu trúc và chảy nước.",
      "Hải sản đông lạnh dùng để ăn sống nên rã đông càng nhanh càng tốt.",
      "Hải sản đông lạnh dùng để ăn sống không cần rã đông trước khi dùng.",
      "Hải sản đông lạnh dùng để ăn sống nên rã đông bằng lò vi sóng.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "刺身のような「生食用冷凍魚介類」は、組織の破壊や汁の流出が起きないようになるべく低温で時間をかけて解凍します。",
    sourcePage: 7,
  },
  {
    id: "tr-ck3-6",
    chapterId: "ck-ch3",
    direction: "vi-to-ja",
    prompt: "Việc lập kế hoạch nấu ăn giúp làm rõ tiếp theo cần làm gì, làm việc đó để làm gì, từ đó nâng cao hiệu quả công việc và duy trì chất lượng món ăn.",
    options: [
      "調理計画は必要ありません。",
      "調理計画を作成することは、次に何をしなければならないか、何のためにその作業をするのかを明確化し、作業の効率化及び料理の品質を維持することができます。",
      "調理計画はコストを増やすためのものです。",
      "調理計画は一度作成したら二度と見直す必要はありません。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "調理計画を作成することは、次に何をしなければならないか、何のためにその作業をするのかを明確化し、作業の効率化及び料理の品質を維持することができます。",
    sourcePage: 7,
  },
  {
    id: "tr-ck4-1",
    chapterId: "ck-ch4",
    direction: "ja-to-vi",
    prompt: "換気が不十分だと一酸化炭素中毒を起こす恐れがあり、最悪の場合、死亡事故に至ることがあります。",
    options: [
      "Nếu thông gió không đủ, có nguy cơ ngộ độc khí CO, trường hợp xấu nhất có thể dẫn đến tử vong.",
      "Nếu thông gió không đủ thì chỉ tốn thêm gas.",
      "Thông gió không ảnh hưởng gì đến an toàn.",
      "Thông gió chỉ cần thiết vào mùa hè.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "換気が不十分だと一酸化炭素中毒を起こす恐れがあり、最悪の場合、死亡事故に至ることがあります。",
    sourcePage: 8,
  },
  {
    id: "tr-ck4-2",
    chapterId: "ck-ch4",
    direction: "vi-to-ja",
    prompt: "Nếu chỉ số oxy hóa dầu (AV) từ 3.0 trở lên thì phải thay dầu vào cuối ca làm việc ngày đó.",
    options: [
      "AV値が１．０未満であれば油を毎日交換します。",
      "AV 値３．０以上であれば、その日の営業終了時に油を交換してください。",
      "AV値は油の交換には関係ありません。",
      "AV値が高いほど油は新鮮です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "AV 値３．０以上であれば、その日の営業終了時に油を交換してください。",
    sourcePage: 8,
  },
  {
    id: "tr-ck4-3",
    chapterId: "ck-ch4",
    direction: "ja-to-vi",
    prompt: "扉、取っ手、扉パッキン、扉下部は雑菌の付きやすいところです。掃除して常に清潔にしてください。",
    options: [
      "Cửa, tay nắm không cần vệ sinh thường xuyên.",
      "Chỉ có bên trong tủ mới cần vệ sinh.",
      "Cửa, tay nắm, gioăng cửa, phần dưới cửa là những nơi dễ bám vi khuẩn. Hãy vệ sinh và luôn giữ sạch sẽ.",
      "Gioăng cửa không bao giờ bị bám bẩn.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "扉、取っ手、扉パッキン、扉下部は雑菌の付きやすいところです。掃除して常に清潔にしてください。",
    sourcePage: 9,
  },
  {
    id: "tr-ck4-4",
    chapterId: "ck-ch4",
    direction: "vi-to-ja",
    prompt: "Muỗng xúc đá vì nhiều người chạm vào nên dễ bám vi khuẩn, phải bảo quản bên ngoài khay/hộp đựng đá một cách vệ sinh.",
    options: [
      "氷用スコップは製氷皿の中に入れたままでよいです。",
      "氷用スコップは洗浄不要です。",
      "氷用スコップは不特定多数が触れないので清潔です。",
      "氷用スコップは不特定多数が触れるものなので菌の付着が多く、製氷皿や貯氷ケースの外に衛生的に保管されていることを確認してください。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "氷用スコップは製氷皿や貯氷ケースの外に衛生的に保管されていることを確認してください。（スコップは不特定多数が触れるものなので菌の付着が多い）",
    sourcePage: 9,
  },
  {
    id: "tr-ck4-5",
    chapterId: "ck-ch4",
    direction: "ja-to-vi",
    prompt: "包丁及びまな板は肉用、野菜用、下処理用などに分類し、使い分けてください。",
    options: [
      "Dao và thớt phải được phân loại thành loại dùng cho thịt, rau, sơ chế... và dùng riêng biệt.",
      "Dao và thớt chỉ cần một loại dùng chung cho mọi việc.",
      "Dao và thớt không cần phân loại.",
      "Dao và thớt chỉ cần phân loại theo màu sắc.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "包丁及びまな板は肉用、野菜用、下処理用などに分類し、使い分けてください。",
    sourcePage: 9,
  },
  {
    id: "tr-ck4-6",
    chapterId: "ck-ch4",
    direction: "vi-to-ja",
    prompt: "Dao Yanagiba lưỡi dài, chủ yếu dùng để cắt sashimi, còn gọi là 'dao sashimi'.",
    options: [
      "出刃包丁は刃渡りが長く、主に刺身を切るときに使用する包丁です。",
      "柳刃包丁：刃渡りが長く、主に刺身を切るときに使用する包丁で「刺身包丁」とも呼びます。",
      "三徳包丁は主に刺身専用の包丁です。",
      "中華包丁は刺身専用の包丁です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "柳刃包丁：刃渡りが長く、主に刺身を切るときに使用する包丁で「刺身包丁」とも呼びます。",
    sourcePage: 9,
  },
  {
    id: "tr-ck4-7",
    chapterId: "ck-ch4",
    direction: "ja-to-vi",
    prompt: "計測機器類は精密機械なので、汚れや振動などが計測の精度に影響を及ぼすことがあります。",
    options: [
      "Thiết bị đo lường không cần bảo dưỡng.",
      "Bụi bẩn và rung động không ảnh hưởng đến thiết bị đo lường.",
      "Thiết bị đo lường là máy móc chính xác, nên bụi bẩn hoặc rung động có thể ảnh hưởng đến độ chính xác của phép đo.",
      "Thiết bị đo lường chỉ cần kiểm tra một lần khi mua.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "計測機器類は精密機械なので、汚れや振動などが計測の精度に影響を及ぼすことがあります。",
    sourcePage: 10,
  },
  {
    id: "tr-ck4-8",
    chapterId: "ck-ch4",
    direction: "vi-to-ja",
    prompt: "Chảo chống dính không được làm nguội đột ngột ngay sau khi dùng vì lớp phủ bề mặt có thể bị bong tróc.",
    options: [
      "フッ素加工のフライパンは使用直後、水をかけて急に冷やしてもかまいません。",
      "フッ素加工のフライパンは急に冷やすほうが長持ちします。",
      "フッ素加工のフライパンには冷やし方の注意点はありません。",
      "フッ素加工のフライパンは、使用直後の熱いうちに水をかけるなどして急に冷やすと表面が剥がれたりしますので、急に冷やさないでください。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "フッ素加工のフライパンは、使用直後の熱いうちに水をかけるなどして急に冷やすと表面が剥がれたりしますので、急に冷やさないでください。",
    sourcePage: 10,
  },
  {
    id: "tr-ck5-1",
    chapterId: "ck-ch5",
    direction: "ja-to-vi",
    prompt: "飲食店での労働災害で最も多い事故は「転倒」で全体の約３割を占めています。",
    options: [
      "Tai nạn lao động phổ biến nhất tại nhà hàng là 'té ngã', chiếm khoảng 30% tổng số.",
      "Tai nạn lao động phổ biến nhất tại nhà hàng là 'bỏng', chiếm khoảng 30% tổng số.",
      "Nhà hàng hầu như không có tai nạn lao động nào.",
      "Tai nạn lao động phổ biến nhất tại nhà hàng là 'đứt tay', chiếm khoảng 30% tổng số.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "飲食店での労働災害で最も多い事故は「転倒」で全体の約３割を占めています。",
    sourcePage: 11,
  },
  {
    id: "tr-ck5-2",
    chapterId: "ck-ch5",
    direction: "vi-to-ja",
    prompt: "Vì không có quy định pháp luật bắt buộc, nên thực tế các biện pháp an toàn tại nhà hàng chưa được thực hiện đầy đủ.",
    options: [
      "飲食店ではすべての安全対策が法律で義務付けられています。",
      "法令上の義務付けがないことから、安全面からの取組は十分におこなわれていない現状があります。",
      "飲食店には労働災害対策は不要です。",
      "安全対策は完全に実施されているので問題ありません。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "法令上の義務付けがないことから、安全面からの取組は十分におこなわれていない現状があります。",
    sourcePage: 11,
  },
  {
    id: "tr-ck5-3",
    chapterId: "ck-ch5",
    direction: "ja-to-vi",
    prompt: "職場に潜む危険などは、視覚的にとらえられないものが多くあります。それらを可視化（見える化）することで、より効果的な安全活動をおこなうことができます。",
    options: [
      "Không cần trực quan hóa vì nguy hiểm luôn nhìn thấy được.",
      "Trực quan hóa chỉ tốn thêm chi phí, không có tác dụng gì.",
      "Nhiều nguy hiểm tiềm ẩn tại nơi làm việc không thể nhận biết bằng mắt thường. Việc trực quan hóa (biến chúng thành hình ảnh) giúp thực hiện hoạt động an toàn hiệu quả hơn.",
      "Trực quan hóa chỉ áp dụng cho các công ty lớn.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "職場に潜む危険などは、視覚的にとらえられないものが多くあります。それらを可視化（見える化）することで、より効果的な安全活動をおこなうことができます。",
    sourcePage: 11,
  },
  {
    id: "tr-ck5-4",
    chapterId: "ck-ch5",
    direction: "vi-to-ja",
    prompt: "Khi mang vật nặng, nên dùng xe đẩy, không tự mang một mình, chia làm nhiều lần để giảm nguy cơ té ngã.",
    options: [
      "重い荷物はできるだけ一度に運ぶべきです。",
      "重い荷物は両手いっぱいに抱えて運ぶべきです。",
      "重い荷物は誰にも手伝ってもらわず運ぶべきです。",
      "重い荷物を運ぶ際は、台車を使う、ひとりでは持たない、何回かに分けて運ぶなど転倒リスク低減の措置をとりましょう。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "重い荷物を運ぶ際は、台車を使う、ひとりでは持たない、何回かに分けて運ぶなど転倒リスク低減の措置をとりましょう。",
    sourcePage: 14,
  },
  {
    id: "tr-ck5-5",
    chapterId: "ck-ch5",
    direction: "ja-to-vi",
    prompt: "転倒災害は、床が水や油で濡れていることによる「滑り」や通路の荷物などによる「つまづき」によるものが多いです。",
    options: [
      "Tai nạn té ngã chủ yếu do 'trơn trượt' vì sàn ướt nước/dầu hoặc 'vấp' do hành lý để trên lối đi.",
      "Tai nạn té ngã chủ yếu do ánh sáng quá chói.",
      "Tai nạn té ngã hầu như không xảy ra tại nhà hàng.",
      "Tai nạn té ngã chỉ xảy ra vào mùa mưa.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "転倒災害は、床が水や油で濡れていることによる「滑り」や通路の荷物などによる「つまづき」によるものが多いです。",
    sourcePage: 14,
  },
  {
    id: "tr-ck5-6",
    chapterId: "ck-ch5",
    direction: "vi-to-ja",
    prompt: "Khi dùng fryer, phải mang ủng, tạp dề dài, găng tay chịu nhiệt.",
    options: [
      "フライヤーを使う際は素手で作業してもかまいません。",
      "フライヤーを使う際は、長靴、長エプロン、耐熱手袋を着用しましょう。",
      "フライヤーを使う際はサンダルで作業するべきです。",
      "フライヤーを使う際は防護具は一切不要です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "フライヤーを使う際は、長靴、長エプロン、耐熱手袋を着用しましょう。",
    sourcePage: 14,
  },
  {
    id: "tr-ck5-7",
    chapterId: "ck-ch5",
    direction: "ja-to-vi",
    prompt: "熱湯を入れた寸胴鍋などの容器を運んでいるときの転倒は火傷の危険がありますので、注意しましょう。",
    options: [
      "Khiêng nồi nước sôi thì không cần lưu ý gì đặc biệt.",
      "Khiêng nồi nước sôi chỉ cần đi thật nhanh.",
      "Khi khiêng các vật đựng như nồi lớn có nước sôi, nếu bị té ngã sẽ có nguy cơ bị bỏng, nên hãy cẩn thận.",
      "Nồi nước sôi không bao giờ gây bỏng dù có té ngã.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "熱湯を入れた寸胴鍋などの容器を運んでいるときの転倒は火傷の危険がありますので、注意しましょう。",
    sourcePage: 14,
  },
  {
    id: "tr-ck5-8",
    chapterId: "ck-ch5",
    direction: "vi-to-ja",
    prompt: "Khi điều chỉnh do máy bị tắc nghẽn, về nguyên tắc phải dừng máy trước — đây là quy định bắt buộc.",
    options: [
      "機械が目詰まりしても運転を止める必要はありません。",
      "機械の調整は運転中におこなうのが基本です。",
      "機械の目詰まり調整は誰でも自由な方法でおこなってよいです。",
      "機械の目詰まりなどの調整時には、原則として、機械の運転を停止するなどの措置を義務付けています。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "機械の目詰まりなどの調整時には、原則として、機械の運転を停止するなどの措置を義務付けています。",
    sourcePage: 15,
  },
  {
    id: "tr-ck6-1",
    chapterId: "ck-ch6",
    direction: "ja-to-vi",
    prompt: "食品が生産者から消費者に届くまでの経路は流通といい、生産者から農協などの出荷事業者、卸売市場や食品製造業、食品小売業などを経由して消費者の元に届きます。",
    options: [
      "Con đường thực phẩm đi từ nhà sản xuất đến tay người tiêu dùng gọi là lưu thông, đi qua đơn vị xuất hàng như hợp tác xã nông nghiệp, chợ đầu mối, ngành chế biến thực phẩm, ngành bán lẻ thực phẩm rồi đến tay người tiêu dùng.",
      "Thực phẩm luôn đi thẳng từ nhà sản xuất đến người tiêu dùng, không qua trung gian nào.",
      "Lưu thông chỉ nói về việc vận chuyển bằng xe tải.",
      "Lưu thông là quá trình chế biến thực phẩm tại nhà máy.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "食品が生産者から消費者に届くまでの経路は流通といい、生産者から農協などの出荷事業者、卸売市場や食品製造業、食品小売業などを経由して消費者の元に届きます。",
    sourcePage: 15,
  },
  {
    id: "tr-ck6-2",
    chapterId: "ck-ch6",
    direction: "vi-to-ja",
    prompt: "Chợ đầu mối có 6 chức năng: thu gom hàng, hình thành giá, thanh toán, tiếp nhận/phát tin, ứng phó khi thiên tai, giữ vệ sinh, và vận hành như hệ thống cung cấp ổn định thực phẩm tươi sống.",
    options: [
      "卸売市場の機能は集荷のみです。",
      "卸売市場は、①集荷、②価格形成、③決済、④情報受発信、⑤災害時対応、⑥衛生の保持機能を持ち、生鮮食料品などを安定的に供給するシステムとして運営されています。",
      "卸売市場には特に機能はありません。",
      "卸売市場は消費者が直接利用する小売店です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "卸売市場は、①集荷、②価格形成、③決済、④情報受発信、⑤災害時対応、⑥衛生の保持機能を持ち、生鮮食料品などを安定的に供給するシステムとして運営されています。",
    sourcePage: 15,
  },
  {
    id: "tr-ck6-3",
    chapterId: "ck-ch6",
    direction: "ja-to-vi",
    prompt: "飲食店で食材の仕入れをする際、①小売店（近隣商店・スーパー）、②業務用専門スーパー、③卸売市場、④卸売業者（通信販売も含む）など、さまざまな仕入先があります。",
    options: [
      "Nhà hàng chỉ có thể nhập nguyên liệu từ một nguồn duy nhất.",
      "Nhà hàng không được phép tự chọn nguồn nhập hàng.",
      "Khi nhập nguyên liệu, nhà hàng có nhiều nguồn khác nhau: cửa hàng bán lẻ (tiệm lân cận/siêu thị), siêu thị chuyên bán sỉ cho kinh doanh, chợ đầu mối, nhà cung cấp sỉ (bao gồm cả bán hàng qua thư/online).",
      "Nhà hàng chỉ được nhập hàng từ chợ đầu mối.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "飲食店で食材の仕入れをする際、①小売店（近隣商店・スーパー）、②業務用専門スーパー、③卸売市場、④卸売業者（通信販売も含む）など、さまざまな仕入先があります。",
    sourcePage: 15,
  },
  {
    id: "tr-ck6-4",
    chapterId: "ck-ch6",
    direction: "vi-to-ja",
    prompt: "Việc cân nhắc concept của cửa hàng và ưu nhược điểm của từng nguồn nhập hàng để chọn nguồn phù hợp với cửa hàng mình là điều quan trọng.",
    options: [
      "仕入先は価格だけで選べばよいです。",
      "仕入先は一度決めたら変更してはいけません。",
      "仕入先のメリット・デメリットは考慮する必要がありません。",
      "お店のコンセプトや各仕入先のメリット・デメリットを見極め、自店にあった仕入先を選択することが重要です。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "お店のコンセプトや各仕入先のメリット・デメリットを見極め、自店にあった仕入先を選択することが重要です。",
    sourcePage: 15,
  },
  {
    id: "tr-ck7-1",
    chapterId: "ck-ch7",
    direction: "ja-to-vi",
    prompt: "食品の製造過程において、加工や保存の目的で食品に添加されるものを食品添加物といいます。",
    options: [
      "Chất được thêm vào thực phẩm với mục đích chế biến hoặc bảo quản trong quá trình sản xuất thực phẩm gọi là phụ gia thực phẩm.",
      "Phụ gia thực phẩm là tên gọi khác của nguyên liệu chính.",
      "Phụ gia thực phẩm là bao bì đóng gói thực phẩm.",
      "Phụ gia thực phẩm là quy trình vứt bỏ thực phẩm hỏng.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "食品の製造過程において、加工や保存の目的で食品に添加されるものを食品添加物といいます。",
    sourcePage: 16,
  },
  {
    id: "tr-ck7-2",
    chapterId: "ck-ch7",
    direction: "vi-to-ja",
    prompt: "Ủy ban An toàn Thực phẩm được thành lập theo Luật cơ bản về An toàn Thực phẩm, đánh giá phụ gia thực phẩm dựa trên kết quả thử nghiệm trên động vật để xác nhận độ an toàn.",
    options: [
      "食品安全委員会は添加物の価格を決めます。",
      "食品安全基本法に基づき設置された食品安全委員会は動物試験などの結果をもとに食品添加物を評価し、安全性を確認します。",
      "食品安全委員会はレストランの営業許可を出します。",
      "食品安全委員会は食品を直接製造します。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "食品安全基本法に基づき設置された食品安全委員会は動物試験などの結果をもとに食品添加物を評価し、安全性を確認したものについて、厚生労働大臣が指定する「指定添加物」として、食品ごとに基準値を設定しています。",
    sourcePage: 16,
  },
  {
    id: "tr-ck7-3",
    chapterId: "ck-ch7",
    direction: "ja-to-vi",
    prompt: "保存料 かびや細菌などの発育を抑制し、食品の保存性を向上させる",
    options: [
      "Chất bảo quản dùng để tạo màu cho thực phẩm.",
      "Chất bảo quản dùng để tạo vị ngọt cho thực phẩm.",
      "Chất bảo quản ức chế sự phát triển của nấm mốc, vi khuẩn, giúp cải thiện độ bền bảo quản của thực phẩm.",
      "Chất bảo quản không có tác dụng gì đặc biệt.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "保存料 かびや細菌などの発育を抑制し、食品の保存性を向上させる",
    sourcePage: 16,
  },
  {
    id: "tr-ck7-4",
    chapterId: "ck-ch7",
    direction: "vi-to-ja",
    prompt: "Chất chống oxy hóa giúp ngăn ngừa quá trình oxy hóa của dầu mỡ và cải thiện độ bền bảo quản.",
    options: [
      "酸化防止剤は食品に甘味を与えます。",
      "酸化防止剤は肉類の色調を改善します。",
      "酸化防止剤は食品を漂白します。",
      "酸化防止剤 油脂などの酸化を防ぎ保存性をよくする",
    ],
    correctIndex: 3,
    sourceQuoteJa: "酸化防止剤 油脂などの酸化を防ぎ保存性をよくする",
    sourcePage: 17,
  },
  {
    id: "tr-ck7-5",
    chapterId: "ck-ch7",
    direction: "ja-to-vi",
    prompt: "調味料 食品にうまみを与える",
    options: [
      "Chất điều vị giúp tạo vị ngon (umami) cho thực phẩm.",
      "Chất điều vị giúp tạo màu cho thực phẩm.",
      "Chất điều vị giúp khử mùi hôi của thực phẩm.",
      "Chất điều vị giúp bảo quản thực phẩm lâu hơn.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "調味料 食品にうまみを与える",
    sourcePage: 17,
  },
  {
    id: "tr-ck7-6",
    chapterId: "ck-ch7",
    direction: "vi-to-ja",
    prompt: "Chất nhũ hóa giúp làm cho nước và dầu hòa trộn đều với nhau.",
    options: [
      "乳化剤は食品に酸味を与えます。",
      "乳化剤 水と油を均一に乳化させる",
      "乳化剤はかびの発生を防止します。",
      "乳化剤は栄養価を強化します。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "乳化剤 水と油を均一に乳化させる",
    sourcePage: 17,
  },
  {
    id: "tr-cs1-1",
    chapterId: "cs-ch1",
    direction: "ja-to-vi",
    prompt: "日本における接客サービスの特性として、「おもてなし」（＝ホスピタリティ）があります。",
    options: [
      "Đặc trưng của dịch vụ tiếp khách tại Nhật Bản là 'omotenashi' (=hospitality, lòng hiếu khách).",
      "Đặc trưng của dịch vụ tiếp khách tại Nhật là giá rẻ.",
      "Nhật Bản không có đặc trưng riêng về dịch vụ tiếp khách.",
      "Đặc trưng của dịch vụ tiếp khách tại Nhật là tốc độ phục vụ nhanh nhất.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "日本における接客サービスの特性として、「おもてなし」（＝ホスピタリティ）があります。",
    sourcePage: 1,
  },
  {
    id: "tr-cs1-2",
    chapterId: "cs-ch1",
    direction: "vi-to-ja",
    prompt: "3 nguyên tắc cơ bản về hành động trong khu vực bàn khách là: Niconico (cười tươi), Hakihaki (nói rõ ràng), Kibikibi (nhanh nhẹn).",
    options: [
      "客席内における動作の基本は、ゆっくり、丁寧に、静かにの3つです。",
      "客席内における動作の基本は、ニコニコ、ハキハキ、キビキビの３つです。",
      "客席内における動作に基本はありません。",
      "客席内における動作の基本は、大声、迅速、強引の3つです。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "客席内における動作の基本は、ニコニコ、ハキハキ、キビキビの３つです。",
    sourcePage: 2,
  },
  {
    id: "tr-cs1-3",
    chapterId: "cs-ch1",
    direction: "ja-to-vi",
    prompt: "料理が配膳されるときがお客様にとって最も期待が高まる瞬間です。",
    options: [
      "Thời điểm phục vụ món ăn không quan trọng với khách.",
      "Khách hàng thường không để ý đến thời điểm phục vụ món ăn.",
      "Thời điểm món ăn được phục vụ là khoảnh khắc kỳ vọng của khách lên cao nhất.",
      "Thời điểm phục vụ món ăn chỉ quan trọng với món đắt tiền.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "料理が配膳されるときがお客様にとって最も期待が高まる瞬間です。",
    sourcePage: 5,
  },
  {
    id: "tr-cs1-4",
    chapterId: "cs-ch1",
    direction: "vi-to-ja",
    prompt: "Bán hàng gợi ý giúp giới thiệu thực đơn có lợi, thực đơn mới, hoặc món hợp khẩu vị khách, từ đó nâng cao sự hài lòng.",
    options: [
      "サジェスティブセールスはお客様の注文を減らすための手法です。",
      "サジェスティブセールスは価格の一番安いメニューだけを勧めることです。",
      "サジェスティブセールスは必要のない手法です。",
      "よりお得なメニューや新メニュー、お客様の嗜好に合ったメニューなどを推奨することで、お客様の満足度を向上させます。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "よりお得なメニューや新メニュー、お客様の嗜好に合ったメニュー、食後のデザートなどを推奨することで、お客様の満足度を向上させます。",
    sourcePage: 6,
  },
  {
    id: "tr-cs1-5",
    chapterId: "cs-ch1",
    direction: "ja-to-vi",
    prompt: "接客用語の最も重要な役目は、お客様の意思を確認したり、店側の状況などを伝えたりすることです。",
    options: [
      "Vai trò quan trọng nhất của thuật ngữ tiếp khách là xác nhận ý muốn của khách và truyền đạt tình hình từ phía cửa hàng.",
      "Vai trò quan trọng nhất của thuật ngữ tiếp khách là quảng cáo cho cửa hàng.",
      "Thuật ngữ tiếp khách không có vai trò gì đặc biệt.",
      "Vai trò quan trọng nhất của thuật ngữ tiếp khách là thương lượng giá.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "接客用語の最も重要な役目は、お客様の意思を確認したり、店側の状況などを伝えたりすることです。",
    sourcePage: 6,
  },
  {
    id: "tr-cs1-6",
    chapterId: "cs-ch1",
    direction: "vi-to-ja",
    prompt: "Khi có nhân lực ít và nhiều dịch vụ xảy ra cùng lúc, thứ tự ưu tiên là: phục vụ món ăn, thanh toán, đón khách, nhận order, phục vụ tráng miệng/đồ uống, dọn bàn.",
    options: [
      "優先順位はなく、すべて同時に対応すべきです。",
      "優先順位は、①料理提供②レジ精算③ご案内④注文受け⑤デザート・ドリンクの提供⑥下げとなります。",
      "優先順位は、まずレジ精算を最優先すべきです。",
      "優先順位は、まず下げを最優先すべきです。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "その時の優先順位は、①料理提供②レジ精算③ご案内④注文受け⑤デザート・ドリンクの提供⑥下げとなります。",
    sourcePage: 7,
  },
  {
    id: "tr-cs1-7",
    chapterId: "cs-ch1",
    direction: "ja-to-vi",
    prompt: "ここでいう顧客管理とは単に顧客データを管理するのではなく、積極的にカスタマーリレーションズ＝お客様と店との、より良い関係づくりをみずから図ることです。",
    options: [
      "Quản lý khách hàng chỉ đơn thuần là lưu trữ dữ liệu khách.",
      "Quản lý khách hàng chỉ áp dụng khi có khiếu nại.",
      "Quản lý khách hàng ở đây không chỉ là quản lý dữ liệu khách mà là chủ động xây dựng mối quan hệ tốt đẹp hơn giữa khách hàng và cửa hàng (Customer Relations).",
      "Quản lý khách hàng chỉ dành cho khách hàng mới.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "ここでいう顧客管理とは単に顧客データを管理するのではなく、積極的にカスタマーリレーションズ＝お客様と店との、より良い関係づくりをみずから図ることです。",
    sourcePage: 8,
  },
  {
    id: "tr-cs1-8",
    chapterId: "cs-ch1",
    direction: "vi-to-ja",
    prompt: "Nếu dữ liệu khách hàng có chứa thông tin cá nhân như tên, địa chỉ, số điện thoại, phải hết sức chú ý để tránh rò rỉ, thất lạc hoặc bị sử dụng sai mục đích.",
    options: [
      "個人情報が含まれていても特に注意する必要はありません。",
      "個人情報は従業員が自由に使ってよいです。",
      "個人情報の管理は法律上の義務ではありません。",
      "顧客データに、氏名、住所、電話番号など、個人を特定できる「個人情報」が含まれる場合は、漏えいや紛失、従業員による不正利用や本来の目的以外での利用などが発生しないよう、十分に注意する必要があります。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "顧客データに、氏名、住所、電話番号など、個人を特定できる「個人情報」が含まれる場合は、漏えいや紛失、従業員による不正利用や本来の目的以外での利用などが発生しないよう、十分に注意する必要があります。",
    sourcePage: 8,
  },
  {
    id: "tr-cs2-1",
    chapterId: "cs-ch2",
    direction: "ja-to-vi",
    prompt: "食物アレルギーのお客様が知らずに該当する食材を食べて発症すると、最悪の場合、アナフィラキシーショックを起こして呼吸困難になり死亡することもあります。",
    options: [
      "Nếu khách bị dị ứng thực phẩm ăn phải thực phẩm gây dị ứng mà không biết, trường hợp xấu nhất có thể bị sốc phản vệ dẫn đến khó thở và tử vong.",
      "Nếu khách bị dị ứng thực phẩm ăn phải thực phẩm gây dị ứng, chỉ bị nổi mẩn nhẹ.",
      "Dị ứng thực phẩm không gây nguy hiểm gì.",
      "Dị ứng thực phẩm chỉ ảnh hưởng đến vị giác tạm thời.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "食物アレルギーのお客様が知らずに該当する食材を食べて発症すると、最悪の場合、アナフィラキシーショックを起こして呼吸困難になり死亡することもあります。",
    sourcePage: 8,
  },
  {
    id: "tr-cs2-2",
    chapterId: "cs-ch2",
    direction: "vi-to-ja",
    prompt: "8 nguyên liệu dị ứng đặc biệt là: trứng, sữa, lúa mì, kiều mạch, đậu phộng, tôm, cua, óc chó.",
    options: [
      "特定原材料8品目は、米、大豆、とうもろこし、じゃがいもなどです。",
      "特定原材料８品目（卵、乳、小麦、そば、落花生、えび、かに、くるみ）",
      "特定原材料8品目は、牛肉、豚肉、鶏肉などです。",
      "特定原材料8品目という規定は存在しません。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "特定原材料８品目（卵、乳、小麦、そば、落花生、えび、かに、くるみ）",
    sourcePage: 8,
  },
  {
    id: "tr-cs2-3",
    chapterId: "cs-ch2",
    direction: "ja-to-vi",
    prompt: "消費期限を過ぎた食品は食べないようにしてください。",
    options: [
      "Có thể ăn thực phẩm đã quá hạn sử dụng nếu trông vẫn bình thường.",
      "Hạn sử dụng không quan trọng bằng hạn dùng tốt nhất.",
      "Không được ăn thực phẩm đã quá hạn sử dụng.",
      "Hạn sử dụng chỉ áp dụng cho đồ uống có cồn.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "消費期限を過ぎた食品は食べないようにしてください。",
    sourcePage: 9,
  },
  {
    id: "tr-cs2-4",
    chapterId: "cs-ch2",
    direction: "vi-to-ja",
    prompt: "Hạn dùng tốt nhất là hạn mà nếu bảo quản đúng cách sẽ đảm bảo đầy đủ chất lượng như kỳ vọng; qua hạn không có nghĩa là không ăn được ngay.",
    options: [
      "賞味期限は安全性に関する絶対的な期限です。",
      "賞味期限を過ぎたら即座に食べられなくなります。",
      "賞味期限と消費期限はまったく同じ意味です。",
      "賞味期限：定められた方法により保存した場合において、期待されるすべての品質の保持が十分に可能であると認められる期限を示す年月日のことです。ただし、当該期限を超えた場合であっても、これらの品質が保持されていることがあります。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "賞味期限：定められた方法により保存した場合において、期待されるすべての品質の保持が十分に可能であると認められる期限を示す年月日のことです。ただし、当該期限を超えた場合であっても、これらの品質が保持されていることがあります。",
    sourcePage: 9,
  },
  {
    id: "tr-cs2-5",
    chapterId: "cs-ch2",
    direction: "ja-to-vi",
    prompt: "お客様から味がおかしいとクレームがあった場合、自分で味を確認し、作った従業員に工程を確認してください。",
    options: [
      "Khi khách khiếu nại vị món ăn có vấn đề, hãy tự mình kiểm tra vị và hỏi lại quy trình với nhân viên đã làm món đó.",
      "Khi khách khiếu nại vị món ăn, cứ hoàn tiền ngay mà không cần kiểm tra.",
      "Khi khách khiếu nại vị món ăn, phớt lờ đi.",
      "Khi khách khiếu nại vị món ăn, đổ lỗi cho khẩu vị của khách.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "お客様から味がおかしいとクレームがあった場合、自分で味を確認し、作った従業員に工程を確認してください。",
    sourcePage: 10,
  },
  {
    id: "tr-cs2-6",
    chapterId: "cs-ch2",
    direction: "vi-to-ja",
    prompt: "Halal (tiêu chuẩn nguyên liệu theo đạo Hồi) không được dùng cồn, nên không thể rưới rượu lên nguyên liệu.",
    options: [
      "ハラールでもアルコールを自由に使ってよいです。",
      "ハラール（イスラム圏での原材料基準）ではアルコールは使えないため、食材にアルコールをかけることはできません。",
      "ハラールは豚肉以外なら何でも使えます。",
      "ハラールという基準は存在しません。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "ハラール（イスラム圏での原材料基準）ではアルコールは使えないため、食材にアルコールをかけることはできませんので注意してください。",
    sourcePage: 10,
  },
  {
    id: "tr-cs3-1",
    chapterId: "cs-ch3",
    direction: "ja-to-vi",
    prompt: "開店準備はお客様に気持ちよく来店してもらうためのもので、閉店作業は安全確認と次の日のお客様のために準備するためのものです。",
    options: [
      "Chuẩn bị mở cửa là để khách hàng đến quán một cách thoải mái, còn công tác đóng cửa là để xác nhận an toàn và chuẩn bị cho khách ngày hôm sau.",
      "Chuẩn bị mở cửa chỉ để tiết kiệm chi phí.",
      "Công tác đóng cửa là để tăng giờ làm thêm cho nhân viên.",
      "Cả hai công tác đều không có mục đích gì đặc biệt.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "開店準備はお客様に気持ちよく来店してもらうためのもので、閉店作業は安全確認と次の日のお客様のために準備するためのものです。",
    sourcePage: 10,
  },
  {
    id: "tr-cs3-2",
    chapterId: "cs-ch3",
    direction: "vi-to-ja",
    prompt: "Đào tạo dọn dẹp phải do chính người phụ trách cửa hàng hướng dẫn đầu tiên; nếu giao cho nhân viên khác, có thể dẫn đến việc học sai cách.",
    options: [
      "清掃の教育訓練は新人従業員が最初におこなうべきです。",
      "清掃の教育訓練は、一番最初に店舗責任者みずから指導しなければなりません。ほかの従業員に任せると、間違った覚え方をすることがあります。",
      "清掃の教育訓練は外部業者に完全に任せるべきです。",
      "清掃の教育訓練は不要です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "清掃の教育訓練は、一番最初に店舗責任者みずから指導しなければなりません。ほかの従業員に任せると、間違った覚え方をすることがあります。",
    sourcePage: 13,
  },
  {
    id: "tr-cs3-3",
    chapterId: "cs-ch3",
    direction: "ja-to-vi",
    prompt: "モップを正しく使っている（糸を広げて「８」の字を描き後ろへ下がりながら拭く）か、確認してください。",
    options: [
      "Không cần chú ý cách sử dụng cây lau nhà.",
      "Cây lau nhà chỉ cần lau một hướng duy nhất.",
      "Kiểm tra xem có dùng cây lau nhà đúng cách không (banh sợi lau thành hình số 8 và lùi dần về sau khi lau).",
      "Cây lau nhà không cần banh sợi ra khi lau.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "モップを正しく使っている（糸を広げて「８」の字を描き後ろへ下がりながら拭く）か、確認してください。",
    sourcePage: 13,
  },
  {
    id: "tr-cs3-4",
    chapterId: "cs-ch3",
    direction: "vi-to-ja",
    prompt: "Khi chốt sổ quỹ, số tiền mặt ghi trên cuộn giấy và số tiền mặt thực tế phải khớp nhau.",
    options: [
      "レジ締めの金額確認は不要です。",
      "レジ締めは現金のみ確認すればレシートは無視してよいです。",
      "レジ締めは月に1回だけおこなえばよいです。",
      "レジを締めた時、ロール上の現金有り高と、実際の現金有り高が一致していることが重要です。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "レジを締めた時、ロール上の現金有り高と、実際の現金有り高が一致していることが重要です。",
    sourcePage: 16,
  },
  {
    id: "tr-cs3-5",
    chapterId: "cs-ch3",
    direction: "ja-to-vi",
    prompt: "誤差が出るということは、受け取るべき代金を少なくあるいは多く受け取っているか、お客様に渡すべき釣銭を少なくあるいは多く渡しているかのどちらかです。",
    options: [
      "Việc sổ quỹ bị lệch có nghĩa là thu tiền của khách ít hơn hoặc nhiều hơn mức đúng, hoặc trả tiền thối ít hơn hoặc nhiều hơn mức đúng.",
      "Sổ quỹ bị lệch không có ý nghĩa gì đặc biệt.",
      "Sổ quỹ bị lệch chỉ do lỗi máy tính tiền.",
      "Sổ quỹ không bao giờ bị lệch nếu nhân viên trung thực.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "誤差が出るということは、受け取るべき代金を少なくあるいは多く受け取っているか、お客様に渡すべき釣銭を少なくあるいは多く渡しているかのどちらかです。",
    sourcePage: 16,
  },
  {
    id: "tr-cs3-6",
    chapterId: "cs-ch3",
    direction: "vi-to-ja",
    prompt: "Việc nộp tiền vào két đêm phải luôn thực hiện bởi hai người vì lý do phòng chống trộm cắp.",
    options: [
      "夜間金庫への投入は一人でおこなうのが基本です。",
      "この時必ず二人でおこなってください。理由は防犯のためです。",
      "夜間金庫への投入に人数の決まりはありません。",
      "防犯のためという理由は特にありません。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "この時必ず二人でおこなってください。理由は防犯のためです。",
    sourcePage: 16,
  },
  {
    id: "tr-cs4-1",
    chapterId: "cs-ch4",
    direction: "ja-to-vi",
    prompt: "クレームはなるべく受けたくないと考えるのが普通ですが、一方クレームは店の質的改善につながる大きな材料でもあります。",
    options: [
      "Thông thường ai cũng không muốn nhận khiếu nại, nhưng mặt khác khiếu nại cũng là tư liệu quan trọng để cải thiện chất lượng cửa hàng.",
      "Khiếu nại luôn luôn vô nghĩa đối với cửa hàng.",
      "Khiếu nại nên bị phớt lờ hoàn toàn.",
      "Khiếu nại là hành vi vi phạm pháp luật.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "クレームはなるべく受けたくないと考えるのが普通ですが、一方クレームは店の質的改善につながる大きな材料でもあります。",
    sourcePage: 16,
  },
  {
    id: "tr-cs4-2",
    chapterId: "cs-ch4",
    direction: "vi-to-ja",
    prompt: "Dù là khiếu nại nhỏ đến đâu cũng phải để nhân viên cấp dưới báo cáo, và cửa hàng trưởng phải nhanh chóng đến tận bàn xử lý.",
    options: [
      "小さな苦情はアルバイトが対応すればよいです。",
      "どんな小さな苦情でも部下から報告させ、店長が迅速に直接テーブルまで行き対応します。",
      "苦情は翌日にまとめて対応すればよいです。",
      "苦情はクレームカードに記入するだけで十分です。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "どんな小さな苦情でも部下から報告させ、店長が迅速に直接テーブルまで行き対応します。",
    sourcePage: 16,
  },
  {
    id: "tr-cs4-3",
    chapterId: "cs-ch4",
    direction: "ja-to-vi",
    prompt: "クレームの大半は異物混入で、とりわけ多いのが髪の毛の混入です。",
    options: [
      "Phần lớn khiếu nại là do vị món ăn quá nhạt.",
      "Phần lớn khiếu nại là do tốc độ phục vụ chậm.",
      "Phần lớn khiếu nại là do dị vật lẫn trong món ăn, đặc biệt phổ biến nhất là lẫn tóc.",
      "Khiếu nại về dị vật rất hiếm khi xảy ra.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "クレームの大半は異物混入で、とりわけ多いのが髪の毛の混入です。",
    sourcePage: 18,
  },
  {
    id: "tr-cs4-4",
    chapterId: "cs-ch4",
    direction: "vi-to-ja",
    prompt: "Trước tiên xác nhận với khách có muốn làm lại món hay không; nếu khách nói không cần, phải nhanh chóng hủy hóa đơn.",
    options: [
      "お客様に確認せず自動的に作り直します。",
      "料金はそのまま請求すればよいです。",
      "お客様には選択肢を与える必要はありません。",
      "お客様にはまず、作り直してよいか確認し、作り直し不要と言われれば伝票をキャンセルする対応を素早くおこなってください。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "お客様にはまず、作り直してよいか確認し、作り直し不要と言われれば伝票をキャンセルする対応を素早くおこなってください。",
    sourcePage: 18,
  },
  {
    id: "tr-cs4-5",
    chapterId: "cs-ch4",
    direction: "ja-to-vi",
    prompt: "厨房に捕虫器が設置されている場合は、捕虫器のランプが厨房以外から見えていないか確認してください。見えていると逆に虫を外から誘引することになります。",
    options: [
      "Nếu đèn bẫy côn trùng được lắp trong bếp, phải kiểm tra xem đèn có bị nhìn thấy từ bên ngoài bếp không, vì nếu nhìn thấy sẽ ngược lại thu hút côn trùng từ bên ngoài vào.",
      "Đèn bẫy côn trùng trong bếp không cần kiểm tra vị trí lắp đặt.",
      "Đèn bẫy côn trùng càng dễ nhìn thấy từ bên ngoài càng tốt.",
      "Đèn bẫy côn trùng không thu hút côn trùng từ bên ngoài.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "厨房に捕虫器が設置されている場合は、捕虫器のランプが厨房以外から見えていないか確認してください。見えていると逆に虫を外から誘引することになります。",
    sourcePage: 18,
  },
  {
    id: "tr-cs5-1",
    chapterId: "cs-ch5",
    direction: "ja-to-vi",
    prompt: "お客様で体調不良者が発生した場合、決して慌てずに、同伴者がいれば同伴者の指示に従ってください。",
    options: [
      "Khi có khách bị khó chịu trong người, tuyệt đối không được hoảng loạn, nếu có người đi cùng thì làm theo chỉ dẫn của người đó.",
      "Khi có khách bị khó chịu, nên nhanh chóng đưa ra khỏi quán.",
      "Khi có khách bị khó chịu, không cần quan tâm nếu khách không yêu cầu.",
      "Khi có khách bị khó chịu, nên gọi ngay cảnh sát thay vì xe cấp cứu.",
    ],
    correctIndex: 0,
    sourceQuoteJa: "お客様で体調不良者が発生した場合、決して慌てずに、同伴者がいれば同伴者の指示に従ってください。",
    sourcePage: 18,
  },
  {
    id: "tr-cs5-2",
    chapterId: "cs-ch5",
    direction: "vi-to-ja",
    prompt: "Nếu người đi cùng không có mặt, khi khách còn tỉnh táo thì làm theo ý muốn của khách, khi bất tỉnh thì gọi xe cấp cứu ngay.",
    options: [
      "同伴者がいない場合、意識の有無に関わらず何もしなくてよいです。",
      "同伴者がいない場合、意識がある場合はご本人の意思に従い、意識はない場合はすぐに救急車を呼んでください。",
      "同伴者がいない場合、必ず警察を呼ぶべきです。",
      "同伴者がいない場合、店員が勝手に判断して薬を与えます。",
    ],
    correctIndex: 1,
    sourceQuoteJa: "同伴者がいない場合、意識がある場合はご本人の意思に従い、意識はない場合はすぐに救急車を呼んでください。",
    sourcePage: 18,
  },
  {
    id: "tr-cs5-3",
    chapterId: "cs-ch5",
    direction: "ja-to-vi",
    prompt: "心停止を起こしたお客様には、AED（自動体外式除細動器）をすぐに当ててください。そして同時に救急車を呼んでください。",
    options: [
      "Khi khách bị ngừng tim, chỉ cần chờ khách tự tỉnh lại.",
      "Khi khách bị ngừng tim, chỉ cần gọi xe cấp cứu mà không cần làm gì khác.",
      "Khi khách bị ngừng tim, phải dùng máy AED (máy khử rung tim tự động) ngay lập tức, đồng thời gọi xe cấp cứu.",
      "Khi khách bị ngừng tim, không được đụng vào người khách.",
    ],
    correctIndex: 2,
    sourceQuoteJa: "心停止を起こしたお客様には、AED（自動体外式除細動器）をすぐに当ててください。そして同時に救急車を呼んでください。",
    sourcePage: 19,
  },
  {
    id: "tr-cs5-4",
    chapterId: "cs-ch5",
    direction: "vi-to-ja",
    prompt: "Phải thực hiện đào tạo định kỳ về cách sử dụng máy AED.",
    options: [
      "AEDの使い方は学ぶ必要がありません。",
      "AEDの使い方は一度だけ学べば十分です。",
      "AEDは店長だけが使い方を知っていればよいです。",
      "AED（自動体外式除細動器）の使い方の訓練を定期的に実施してください。",
    ],
    correctIndex: 3,
    sourceQuoteJa: "AED（自動体外式除細動器）の使い方の訓練を定期的に実施してください。",
    sourcePage: 19,
  },
];

export type ReorderQuestion = {
  id: string;
  chapterId: string;
  /** Các cụm từ theo đúng thứ tự để ghép thành câu hoàn chỉnh (sẽ bị xáo trộn khi hiển thị). */
  chunks: string[];
  /** Nghĩa tiếng Việt của cả câu, hiển thị sau khi ghép xong để ứng viên hiểu ý nghĩa. */
  meaningVi: string;
  sourceQuoteJa: string;
  sourcePage: number;
};

// v1: mới có nội dung cho chương sm-ch1.
export const REORDERS: ReorderQuestion[] = [
  {
    id: "ro-sm1-1",
    chapterId: "sm-ch1",
    chunks: ["外食産業は、", "立地産業であるため", "商圏は", "限定されています。"],
    meaningVi: "Ngành dịch vụ ăn uống, vì là ngành phụ thuộc vào địa điểm, nên phạm vi thương mại bị giới hạn.",
    sourceQuoteJa: "外食産業は、立地産業であるため商圏は限定されています。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-2",
    chapterId: "sm-ch1",
    chunks: ["外食産業として", "成功するためには、", "QSCが", "不可欠です。"],
    meaningVi: "Để thành công trong ngành dịch vụ ăn uống, QSC là điều không thể thiếu.",
    sourceQuoteJa: "外食産業として成功するためには、QSCが不可欠です。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-3",
    chapterId: "sm-ch1",
    chunks: ["「お客様の喜びを", "自分の喜びとする心」を", "ホスピタリティと", "いいます。"],
    meaningVi: "\"Tinh thần lấy niềm vui của khách làm niềm vui của chính mình\" được gọi là Hospitality.",
    sourceQuoteJa: "「お客様の喜びを自分の喜びとする心」をホスピタリティ（Hospitality=H）といいます。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-4",
    chapterId: "sm-ch1",
    chunks: ["時間帯責任者は、", "店舗オペレーションのデイリーワークの中で", "時間帯における店長の職務を", "代行する人です。"],
    meaningVi:
      "Người phụ trách theo khung giờ là người, trong công việc hàng ngày của cửa hàng, thay mặt cửa hàng trưởng đảm nhận công việc trong khung giờ đó.",
    sourceQuoteJa: "時間帯責任者は、店舗オペレーションのデイリーワークの中で時間帯における店長の職務を代行する人です。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-5",
    chapterId: "sm-ch1",
    chunks: ["業態に見合った", "店のBGMや照明など", "店の雰囲気も", "重要です。"],
    meaningVi: "Bầu không khí của quán (nhạc nền, ánh sáng...) phù hợp với mô hình kinh doanh cũng rất quan trọng.",
    sourceQuoteJa: "業態に見合った店のBGMや照明など店の雰囲気（Atmosphere=A）も重要です。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-6",
    chapterId: "sm-ch1",
    chunks: ["1回に使用する金額（客単価）も、", "決して", "大きくは", "ありません。"],
    meaningVi: "Số tiền sử dụng mỗi lần (đơn giá khách) cũng không hề lớn.",
    sourceQuoteJa: "また1回に使用する金額（客単価）も決して大きくはありません。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-7",
    chapterId: "sm-ch1",
    chunks: ["「サービスは", "お客様の数だけ", "ある」と", "言われます。"],
    meaningVi:
      "Người ta nói rằng \"dịch vụ có bao nhiêu kiểu thì có bấy nhiêu khách hàng\" — ý là mỗi khách cần một kiểu phục vụ riêng.",
    sourceQuoteJa: "「サービスはお客様の数だけある」と言われます。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-8",
    chapterId: "sm-ch1",
    chunks: ["生産性アップのため、", "料理運びや下げものなど", "作業に関しては", "ロボット化がさらに進行します。"],
    meaningVi:
      "Để tăng năng suất, việc robot hóa sẽ tiếp tục tiến triển đối với các công việc như bưng bê món ăn hay dọn bàn.",
    sourceQuoteJa:
      "生産性アップのため料理運びや下げもの（バッシング）など、作業に関してはロボット化がさらに進行します。",
    sourcePage: 1,
  },
  {
    id: "ro-sm1-9",
    chapterId: "sm-ch1",
    chunks: [
      "品質（味・分量・盛り付け）の一定化",
      "熱いものは厚く、冷たいものは冷たく",
      "早く出す",
      "同時同卓提供",
      "気配り（愛）",
    ],
    meaningVi:
      "Thứ tự ưu tiên của Q (Chất lượng): 1.Đồng nhất chất lượng (vị/khối lượng/cách trình bày) → 2.Nóng thì dày dặn, lạnh thì mát lạnh → 3.Phục vụ nhanh → 4.Phục vụ đồng thời cùng bàn → 5.Sự quan tâm chu đáo.",
    sourceQuoteJa:
      "Q（クオリティ）の優先順位　1.品質（味・分量・盛り付け）の一定化　2.熱いものは厚く、冷たいものは冷たく　3.早く出す・・・ランチ6～8分以内、ディナー12分以内　4.同時同卓提供　5.気配り（愛）・・・美味しくなるように心を込め調理",
    sourcePage: 2,
  },
  {
    id: "ro-sm1-10",
    chapterId: "sm-ch1",
    chunks: [
      "定型サービス（スマイル＆アイコンタクト）",
      "声（発声）・・・ハキハキ",
      "笑顔（スマイル＆ハッスル）・・・ニコニコ",
      "動作（姿勢、動き）・・・キビキビ、テキパキ",
      "気配り（愛）",
    ],
    meaningVi:
      "Thứ tự ưu tiên của S (Dịch vụ): 1.Dịch vụ tiêu chuẩn (mỉm cười & giao tiếp mắt) → 2.Giọng nói dứt khoát → 3.Nụ cười tươi → 4.Động tác nhanh nhẹn → 5.Sự quan tâm chu đáo.",
    sourceQuoteJa:
      "S（サービス）の優先順位　1.定型サービス（基本）（スマイル＆アイコンタクト）　2.声（発生）・・・ハキハキ　3.笑顔（スマイル＆ハッスル）・・・ニコニコ　4.動作（姿勢、動き）・・・キビキビ、テキパキ　5.気配り（愛）・・・お客様の立場で気づく、察する心",
    sourcePage: 2,
  },
  {
    id: "ro-sm1-11",
    chapterId: "sm-ch1",
    chunks: ["みだしなみ", "拾い取る、掃き取る、拭き取る", "週間清掃作業の徹底", "メンテナンス", "気配り（愛）"],
    meaningVi:
      "Thứ tự ưu tiên của C (Sạch sẽ): 1.Tác phong chỉnh tề → 2.Nhặt/quét/lau → 3.Triệt để dọn dẹp hàng tuần → 4.Bảo trì → 5.Sự quan tâm chu đáo.",
    sourceQuoteJa:
      "C（クリンリネス）の優先順位　1.みだしなみ　2.拾い取る、掃き取る、拭き取る　3.週間清掃作業の徹底　4.メンテナンス　5.気配り（愛）・・・設備や清掃用具を大切に扱う心",
    sourcePage: 2,
  },
  {
    id: "ro-sm2-1",
    chapterId: "sm-ch2",
    chunks: [
      "それらの中で",
      "店舗責任者が",
      "コントロールできるものは、",
      "人時売上高、人時生産性、原価率、人時接客数（接客生産性）、客数、客単価です。",
    ],
    meaningVi:
      "Trong số các chỉ số đó, những gì người quản lý cửa hàng có thể kiểm soát là: doanh thu mỗi giờ công, năng suất mỗi giờ công, tỷ lệ giá vốn, số khách phục vụ mỗi giờ công, số lượng khách, và đơn giá khách.",
    sourceQuoteJa:
      "それらの中で店舗責任者がコントロールできるものは、人時売上高、人時生産性、原価率、人時接客数（接客生産性）、客数、客単価です。",
    sourcePage: 3,
  },
  {
    id: "ro-sm2-2",
    chapterId: "sm-ch2",
    chunks: [
      "人時生産性は",
      "企業側が生産性を上げるための指数と見られがちですが、",
      "実際には",
      "従業員の賃金の源泉でもあるのです。",
    ],
    meaningVi:
      "Năng suất theo giờ công tuy hay bị coi là chỉ số để doanh nghiệp tăng năng suất, nhưng thực chất cũng chính là nguồn gốc của tiền lương nhân viên.",
    sourceQuoteJa:
      "人時生産性は企業側が生産性を上げるための指数と見られがちですが、実際には従業員の賃金の源泉でもあるのです。",
    sourcePage: 4,
  },
  {
    id: "ro-sm2-3",
    chapterId: "sm-ch2",
    chunks: ["労働分配率とは", "粗利益に占める", "人件費の", "割合です。"],
    meaningVi: "Tỷ lệ phân phối lao động là tỷ lệ nhân công phí chiếm trong lợi nhuận gộp.",
    sourceQuoteJa: "労働分配率とは粗利益に占める人件費の割合です。",
    sourcePage: 4,
  },
  {
    id: "ro-sm2-4",
    chapterId: "sm-ch2",
    chunks: [
      "企業全体として",
      "労働分配率を適正値内で収めるには、",
      "店舗での労働分配率を",
      "４０％以下に低減させる必要があるのです。",
    ],
    meaningVi:
      "Để cả doanh nghiệp giữ tỷ lệ phân phối lao động trong ngưỡng hợp lý, cần giảm tỷ lệ phân phối lao động ở từng cửa hàng xuống dưới 40%.",
    sourceQuoteJa:
      "企業全体として労働分配率を適正値内で収めるには、店舗での労働分配率を４０％以下に低減させる必要があるのです。",
    sourcePage: 4,
  },
  {
    id: "ro-sm2-5",
    chapterId: "sm-ch2",
    chunks: ["この標準（あるべき）原価率を、", "米国では", "理論上の原価率", "（セオロリカル原価率）と呼びます。"],
    meaningVi:
      "Tỷ lệ giá vốn tiêu chuẩn (lý thuyết) này, ở Mỹ được gọi là tỷ lệ giá vốn lý thuyết (Theoretical Cost Rate).",
    sourceQuoteJa: "この標準（あるべき）原価率を、米国では理論上の原価率（セオロリカル原価率）と呼びます。",
    sourcePage: 5,
  },
  {
    id: "ro-sm2-6",
    chapterId: "sm-ch2",
    chunks: ["繁忙月", "（通常３月・５月・７月・８月・１２月）と", "閑散月", "（通常２月・６月・１０月・１１月）がある"],
    meaningVi:
      "Có tháng cao điểm (thường là tháng 3, 5, 7, 8, 12) và tháng thấp điểm (thường là tháng 2, 6, 10, 11).",
    sourceQuoteJa:
      "繁忙月（通常３月・５月・７月・８月・１２月）と閑散月（通常２月・６月・１０月・１１月）がある",
    sourcePage: 6,
  },
  {
    id: "ro-sm2-7",
    chapterId: "sm-ch2",
    chunks: ["もし", "ロスを出さなければ、", "それらは", "すべて利益となるのである。"],
    meaningVi: "Nếu không để xảy ra hao hụt, thì toàn bộ phần đó đều trở thành lợi nhuận.",
    sourceQuoteJa: "もしロスを出さなければ、それらはすべて利益となるのである。",
    sourcePage: 11,
  },
  {
    id: "ro-sm3-1",
    chapterId: "sm-ch3",
    chunks: [
      "過剰な食材の在庫は",
      "品質の劣化を起こしロスにつながるだけでなく、",
      "無駄な仕入コストを増やすことになり、",
      "資金繰りにも悪影響を与えます。",
    ],
    meaningVi:
      "Tồn kho nguyên liệu quá mức không chỉ gây suy giảm chất lượng dẫn đến hao hụt, mà còn làm tăng chi phí nhập hàng lãng phí, ảnh hưởng xấu đến dòng tiền.",
    sourceQuoteJa:
      "過剰な食材の在庫は品質の劣化を起こしロスにつながるだけでなく、無駄な仕入コストを増やすことになり、資金繰りにも悪影響を与えます。",
    sourcePage: 13,
  },
  {
    id: "ro-sm3-2",
    chapterId: "sm-ch3",
    chunks: ["実地棚卸しは、", "発注量の決定や", "在庫品の品質管理のためにも", "毎日実施する必要があります。"],
    meaningVi: "Kiểm kê thực tế cần được thực hiện hàng ngày, vừa để quyết định lượng đặt hàng, vừa để quản lý chất lượng hàng tồn kho.",
    sourceQuoteJa: "実地棚卸しは、発注量の決定や在庫品の品質管理のためにも毎日実施する必要があります。",
    sourcePage: 14,
  },
  {
    id: "ro-sm3-3",
    chapterId: "sm-ch3",
    chunks: [
      "発注は",
      "[各食材の適正在庫量－各食材の発注時点での在庫量＝各食材の発注量]として",
      "納入業者別に",
      "おこないます。",
    ],
    meaningVi:
      "Việc đặt hàng được thực hiện theo từng nhà cung cấp, theo công thức: Lượng đặt hàng mỗi nguyên liệu = Lượng tồn kho hợp lý − Lượng tồn kho tại thời điểm đặt hàng.",
    sourceQuoteJa:
      "発注は[各食材の適正在庫量－各食材の発注時点での在庫量＝各食材の発注量]として納入業者別におこないます。",
    sourcePage: 13,
  },
  {
    id: "ro-sm3-4",
    chapterId: "sm-ch3",
    chunks: [
      "これが",
      "売れたはずの商品を売り損ねた",
      "「販売機会損失（チャンスロス）」であり、",
      "頻繁に発生すれば顧客満足を損ね、店の信用を無くして客数ダウンに繋がります。",
    ],
    meaningVi:
      "Đây chính là \"tổn thất cơ hội bán hàng\" (mất đi món hàng lẽ ra đã bán được) — nếu xảy ra thường xuyên sẽ làm giảm sự hài lòng của khách, mất uy tín cửa hàng và khiến lượng khách sụt giảm.",
    sourceQuoteJa:
      "これが売れたはずの商品を売り損ねた「販売機会損失（チャンスロス）」であり、頻繁に発生すれば顧客満足を損ね、店の信用を無くして客数ダウンに繋がります。",
    sourcePage: 15,
  },
  {
    id: "ro-sm3-5",
    chapterId: "sm-ch3",
    chunks: ["したがって", "納入業者とは", "各食材の品質基準を明確にし、", "書面で契約すべきです。"],
    meaningVi: "Vì vậy, cần làm rõ tiêu chuẩn chất lượng của từng nguyên liệu với nhà cung cấp và ký hợp đồng bằng văn bản.",
    sourceQuoteJa: "したがって納入業者とは各食材の品質基準を明確にし、書面で契約すべきです。",
    sourcePage: 15,
  },
  {
    id: "ro-sm3-6",
    chapterId: "sm-ch3",
    chunks: ["調理関係者は", "ロスといえば", "実際に食材が劣化した", "廃棄ロスを思い浮かべがちです。"],
    meaningVi: "Người làm bếp khi nghe đến \"hao hụt\" thường chỉ nghĩ ngay đến hao hụt do vứt bỏ nguyên liệu đã hỏng thực sự.",
    sourceQuoteJa: "調理関係者はロスといえば実際に食材が劣化した廃棄ロスを思い浮かべがちです。",
    sourcePage: 16,
  },
  {
    id: "ro-sm4-1",
    chapterId: "sm-ch4",
    chunks: ["販売管理とは、", "計画どおりに売上高を作るためにどうすればよいかを考えることで、", "販売促進の内容を", "管理することです。"],
    meaningVi: "Quản lý bán hàng là suy nghĩ cách để tạo ra doanh thu đúng kế hoạch, thông qua việc quản lý nội dung các biện pháp xúc tiến bán hàng.",
    sourceQuoteJa: "販売管理とは、計画どおりに売上高を作るためにどうすればよいかを考えることで、販売促進の内容を管理することです。",
    sourcePage: 16,
  },
  {
    id: "ro-sm4-2",
    chapterId: "sm-ch4",
    chunks: ["特にランチセットなどは", "注文を集中させることができます。", "その結果、料理の提供が早くなり、", "回転率が上がり売上が向上することになります。"],
    meaningVi: "Đặc biệt set trưa có thể làm đơn hàng tập trung. Kết quả là phục vụ nhanh hơn, tỷ lệ quay vòng bàn tăng, doanh thu tăng theo.",
    sourceQuoteJa: "特にランチセットなどは注文を集中させることができます。その結果、料理の提供が早くなり、回転率が上がり売上が向上することになります。",
    sourcePage: 16,
  },
  {
    id: "ro-sm4-3",
    chapterId: "sm-ch4",
    chunks: ["割引券の目的は", "再来店を促すためのもので、", "レジ精算時に", "渡します。"],
    meaningVi: "Mục đích của phiếu giảm giá là khuyến khích khách quay lại, nên được đưa lúc thanh toán tại quầy.",
    sourceQuoteJa: "割引券の目的は再来店を促すためのもので、レジ精算時に渡します。",
    sourcePage: 17,
  },
  {
    id: "ro-sm4-4",
    chapterId: "sm-ch4",
    chunks: ["ポイント制度は", "お客様を囲い込むための施策で、", "複数回の", "来店を促すものです。"],
    meaningVi: "Chế độ tích điểm là biện pháp giữ chân khách hàng, khuyến khích khách quay lại nhiều lần.",
    sourceQuoteJa: "ポイント制度はお客様を囲い込むための施策で、複数回の来店を促すものです。",
    sourcePage: 17,
  },
  {
    id: "ro-sm4-5",
    chapterId: "sm-ch4",
    chunks: ["予約もWEBが主ですが、", "電話でも対応できることで、", "デジタル活用が苦手な高齢者も予約がしやすくなり、", "グループ客獲得に貢献します。"],
    meaningVi: "Đặt chỗ chủ yếu qua WEB nhưng vẫn hỗ trợ qua điện thoại, giúp cả người cao tuổi không rành công nghệ cũng đặt được, góp phần thu hút khách đoàn.",
    sourceQuoteJa: "予約もWEBが主ですが、電話でも対応できることで、デジタル活用が苦手な高齢者も予約がしやすくなり、グループ客獲得に貢献します。",
    sourcePage: 17,
  },
  {
    id: "ro-sm5-1",
    chapterId: "sm-ch5",
    chunks: ["お客様は", "固定顧客（高頻度来店）、", "準固定顧客（ときどき来店）、", "新規顧客に大別されます。"],
    meaningVi: "Khách hàng được chia lớn thành 3 nhóm: khách quen cố định (đến thường xuyên), khách bán cố định (thỉnh thoảng đến), và khách hàng mới.",
    sourceQuoteJa: "お客様は固定顧客（高頻度来店）、準固定顧客（ときどき来店）、新規顧客に大別されます。",
    sourcePage: 17,
  },
  {
    id: "ro-sm5-2",
    chapterId: "sm-ch5",
    chunks: ["顧客管理とは", "準固定顧客を固定客に、", "新規顧客を準固定顧客あるいは固定顧客に", "していくことが重要です。"],
    meaningVi: "Quản lý khách hàng là biến khách bán cố định thành khách quen cố định, biến khách mới thành khách bán cố định hoặc khách quen cố định.",
    sourceQuoteJa: "顧客管理とは準固定顧客を固定客に、新規顧客を準固定顧客あるいは固定顧客にしていくことが重要です。",
    sourcePage: 17,
  },
  {
    id: "ro-sm5-3",
    chapterId: "sm-ch5",
    chunks: [
      "準固定顧客の顔を思い出して",
      "固定顧客同様に",
      "あいさつすれば",
      "来店頻度が増えていきます。",
    ],
    meaningVi: "Nhớ lại mặt khách bán cố định rồi chào hỏi như với khách quen cố định sẽ làm tăng tần suất họ quay lại.",
    sourceQuoteJa: "準固定顧客の顔を思い出して固定顧客同様にあいさつすれば来店頻度が増えていきます。",
    sourcePage: 17,
  },
  {
    id: "ro-sm5-4",
    chapterId: "sm-ch5",
    chunks: ["新規顧客には、", "QSCレベルを全体的に上げていくことにより、", "再来店してもらえることに", "繋がります。"],
    meaningVi: "Với khách hàng mới, việc nâng cao toàn diện mức QSC sẽ dẫn đến khả năng họ quay lại.",
    sourceQuoteJa: "新規顧客には、QSCレベルを全体的に上げていくことにより、再来店してもらえることに繋がります。",
    sourcePage: 17,
  },
  {
    id: "ro-sm6-1",
    chapterId: "sm-ch6",
    chunks: ["使用者は原則として、", "１日８時間、", "１週当たり４０時間以内で", "労働者を働かせなければなりません。"],
    meaningVi: "Về nguyên tắc, người sử dụng lao động phải giới hạn giờ làm của người lao động trong 8 giờ/ngày, 40 giờ/tuần.",
    sourceQuoteJa: "使用者は原則として、１日８時間、１週当たり４０時間以内で労働者を働かせなければなりません。",
    sourcePage: 18,
  },
  {
    id: "ro-sm6-2",
    chapterId: "sm-ch6",
    chunks: [
      "使用者は原則として、",
      "労働時間が１日６時間を超える場合は４５分以上、",
      "８時間を超える場合は６０分以上の休憩を",
      "労働時間の途中に与えなければなりません。",
    ],
    meaningVi: "Về nguyên tắc, nếu giờ lao động vượt 6 tiếng phải cho nghỉ tối thiểu 45 phút, vượt 8 tiếng phải cho nghỉ tối thiểu 60 phút, và giờ nghỉ phải nằm giữa ca làm việc.",
    sourceQuoteJa:
      "使用者は原則として、労働時間が１日６時間を超える場合は４５分以上、８時間を超える場合は６０分以上の休憩を労働時間の途中に与えなければなりません。",
    sourcePage: 18,
  },
  {
    id: "ro-sm6-3",
    chapterId: "sm-ch6",
    chunks: ["雇い入れの日から", "６か月を経過し", "その期間の全労働日の８割以上出勤した場合、", "有給休暇が発生します。"],
    meaningVi: "Nếu đã qua 6 tháng kể từ ngày tuyển dụng và đi làm từ 80% số ngày công trở lên trong giai đoạn đó, quyền nghỉ phép có lương sẽ phát sinh.",
    sourceQuoteJa: "雇い入れの日から６か月を経過しその期間の全労働日の８割以上出勤した場合、有給休暇が発生します。",
    sourcePage: 18,
  },
  {
    id: "ro-sm6-4",
    chapterId: "sm-ch6",
    chunks: [
      "労働者が時季指定した日に有給休暇を取得されることが",
      "事業の正常な運営を",
      "妨げる場合には、",
      "使用者に時季変更権が認められます。",
    ],
    meaningVi: "Khi việc cho nghỉ đúng ngày người lao động chọn sẽ cản trở vận hành bình thường của doanh nghiệp, người sử dụng lao động được công nhận quyền thay đổi thời điểm nghỉ.",
    sourceQuoteJa:
      "労働者が時季指定した日に有給休暇を取得されることが事業の正常な運営を妨げる場合には、使用者に時季変更権が認められます。",
    sourcePage: 19,
  },
  {
    id: "ro-sm6-5",
    chapterId: "sm-ch6",
    chunks: ["採用の場合でも、", "その場で", "その旨を", "告げない。"],
    meaningVi: "Kể cả khi quyết định tuyển, không thông báo ngay tại chỗ.",
    sourceQuoteJa: "採用の場合でも、その場でその旨を告げない。",
    sourcePage: 19,
  },
  {
    id: "ro-sm6-6",
    chapterId: "sm-ch6",
    chunks: [
      "初日はオリエンテーションと",
      "ハウスルール（出退勤の仕方、制服の着用や身だしなみルール、手洗いなどの衛生管理など）",
      "店内で働く上での",
      "基本を教えます。",
    ],
    meaningVi: "Ngày đầu tiên sẽ dạy về định hướng chung và Nội quy nhà hàng (cách chấm công, đồng phục/tác phong, vệ sinh...) — những điều cơ bản khi làm việc trong quán.",
    sourceQuoteJa:
      "初日はオリエンテーションとハウスルール（出退勤の仕方、制服の着用や身だしなみルール、手洗いなどの衛生管理など）店内で働く上での基本を教えます。",
    sourcePage: 19,
  },
  {
    id: "ro-sm7-1",
    chapterId: "sm-ch7",
    chunks: ["接客サービスの基本は", "「型」を学び、", "反復練習（トレーニング）をする中で", "体得することです。"],
    meaningVi: "Cơ sở của dịch vụ tiếp khách là học \"khuôn mẫu\" rồi thấm nhuần qua luyện tập lặp lại.",
    sourceQuoteJa: "接客サービスの基本は「型」を学び、反復練習（トレーニング）をする中で体得することです。",
    sourcePage: 20,
  },
  {
    id: "ro-sm7-2",
    chapterId: "sm-ch7",
    chunks: ["サービスの３つの要素のうち", "「言葉遣い」のポイントは", "言葉そのものではなく、", "声の大きさやトーン、語調といった言い方が重要です。"],
    meaningVi: "Trong 3 yếu tố dịch vụ, điểm mấu chốt của \"cách dùng từ\" không nằm ở bản thân từ ngữ, mà ở cách nói: độ lớn giọng, tông giọng, nhịp điệu.",
    sourceQuoteJa:
      "サービスの３つの要素のうち「言葉遣い」のポイントは言葉そのものではなく、声の大きさやトーン、語調といった言い方が重要です。",
    sourcePage: 20,
  },
  {
    id: "ro-sm7-3",
    chapterId: "sm-ch7",
    chunks: ["トーンとは、", "音質、音の高低や", "声の抑揚（イントネーション）の", "ことです。"],
    meaningVi: "Tone là chất âm, cao độ âm thanh và ngữ điệu giọng nói.",
    sourceQuoteJa: "トーンとは、音質、音の高低や声の抑揚（イントネーション）のことです。",
    sourcePage: 20,
  },
  {
    id: "ro-sm7-4",
    chapterId: "sm-ch7",
    chunks: ["OJTは", "実地訓練のことで、", "店舗など現場でおこなうサービスや作業の技術を", "体得させるトレーニングです。"],
    meaningVi: "OJT là đào tạo thực địa, huấn luyện để thấm nhuần kỹ năng dịch vụ/công việc thực hiện ngay tại hiện trường như cửa hàng.",
    sourceQuoteJa: "OJTは実地訓練のことで、店舗など現場でおこなうサービスや作業の技術を体得させるトレーニングです。",
    sourcePage: 21,
  },
  {
    id: "ro-sm7-5",
    chapterId: "sm-ch7",
    chunks: ["新人を育成するプログラムを作成する際には、", "OJTとOFFJTを", "組み合わせることが", "ポイントです。"],
    meaningVi: "Khi lập chương trình đào tạo nhân viên mới, điểm mấu chốt là kết hợp OJT và OFFJT.",
    sourceQuoteJa: "新人を育成するプログラムを作成する際には、OJTとOFFJTを組み合わせることがポイントです。",
    sourcePage: 21,
  },
  {
    id: "ro-sm8-1",
    chapterId: "sm-ch8",
    chunks: ["防火管理者とは、", "多数の者が利用する建物などの「火災等による被害」を防止するため、", "防火管理についての消防計画を作成し、", "防火管理上必要な業務を計画的におこなう責任者を言います。"],
    meaningVi: "Người quản lý phòng cháy là người chịu trách nhiệm lập kế hoạch phòng cháy chữa cháy và thực hiện có kế hoạch các công việc cần thiết, nhằm ngăn thiệt hại do hỏa hoạn ở các công trình đông người sử dụng.",
    sourceQuoteJa:
      "防火管理者とは、多数の者が利用する建物などの「火災等による被害」を防止するため、防火管理についての消防計画を作成し、防火管理上必要な業務を計画的におこなう責任者を言います。",
    sourcePage: 22,
  },
  {
    id: "ro-sm8-2",
    chapterId: "sm-ch8",
    chunks: ["燃焼三要素は、", "可燃物（燃えるもの）、", "酸素（空気）、", "熱源（ガスの炎、電気の火花、過加熱など）です。"],
    meaningVi: "3 yếu tố cháy là: vật liệu dễ cháy, oxy (không khí), và nguồn nhiệt (tia lửa gas, tia điện, quá nhiệt...).",
    sourceQuoteJa: "燃焼三要素は、可燃物（燃えるもの）、酸素（空気）、熱源（ガスの炎、電気の火花、過加熱など）です。",
    sourcePage: 22,
  },
  {
    id: "ro-sm8-3",
    chapterId: "sm-ch8",
    chunks: ["煙は上へ上がるので、", "顔を床面に近づけるようにし、", "大きな透明のビニール袋の中に顔を入れて", "避難することが大切です。"],
    meaningVi: "Vì khói bốc lên trên nên cần ghé mặt sát sàn nhà, và đưa mặt vào trong túi ni-lông trong suốt lớn để sơ tán.",
    sourceQuoteJa: "煙は上へ上がるので、顔を床面に近づけるようにし、大きな透明のビニール袋の中に顔を入れて避難することが大切です。",
    sourcePage: 23,
  },
  {
    id: "ro-sm8-4",
    chapterId: "sm-ch8",
    chunks: ["出入口を", "なるべく限定し、", "入出者の", "確認・監視をおこなう。"],
    meaningVi: "Cố gắng giới hạn cửa ra vào, và giám sát/xác nhận người ra vào.",
    sourceQuoteJa: "出入口をなるべく限定し、入出者の確認・監視をおこなう。",
    sourcePage: 23,
  },
  {
    id: "ro-sm8-5",
    chapterId: "sm-ch8",
    chunks: ["年に１回は", "避難訓練を", "実施します。", "あらかじめ決めておいた手順に従って役割を決めておこないます。"],
    meaningVi: "Diễn tập sơ tán được thực hiện tối thiểu 1 lần/năm, tuân theo trình tự và phân công vai trò đã định trước.",
    sourceQuoteJa: "年に１回は避難訓練を実施します。あらかじめ決めておいた手順に従って役割を決めておこないます。",
    sourcePage: 23,
  },
  {
    id: "ro-sm8-6",
    chapterId: "sm-ch8",
    chunks: ["自社（企業）を経営することにより、", "どのように社会に貢献するのかを", "明文化し", "示したもの。"],
    meaningVi: "Văn bản nêu rõ doanh nghiệp sẽ đóng góp cho xã hội như thế nào thông qua việc kinh doanh.",
    sourceQuoteJa: "自社（企業）を経営することにより、どのように社会に貢献するのかを明文化し示したもの。",
    sourcePage: 27,
  },
  {
    id: "ro-hy1-1",
    chapterId: "hy-ch1",
    chunks: ["人の健康を", "維持、増進するための「食」は", "常に安全で安心なもので", "なくてはなりません。"],
    meaningVi: "\"Ăn uống\" phục vụ việc duy trì và nâng cao sức khỏe con người luôn phải an toàn và đáng tin cậy.",
    sourceQuoteJa: "人の健康を維持、増進するための「食」は常に安全で安心なものでなくてはなりません。",
    sourcePage: 1,
  },
  {
    id: "ro-hy1-2",
    chapterId: "hy-ch1",
    chunks: ["食品衛生法の第一条では、", "その目的を「飲食に起因する衛生上の危害の発生を防止し、", "国民の健康の保護を図ること」と", "明記しています。"],
    meaningVi: "Điều 1 Luật Vệ sinh Thực phẩm ghi rõ mục đích là \"ngăn ngừa phát sinh nguy hại vệ sinh do ăn uống, bảo vệ sức khỏe toàn dân\".",
    sourceQuoteJa: "食品衛生法の第一条では、その目的を「飲食に起因する衛生上の危害の発生を防止し、国民の健康の保護を図ること」と明記しています。",
    sourcePage: 1,
  },
  {
    id: "ro-hy1-3",
    chapterId: "hy-ch1",
    chunks: ["食中毒は", "飲食に起因する衛生上の大きな危害ですが、", "近年は異物混入によるケガや、", "食物アレルギー対策も重要な課題になっています。"],
    meaningVi: "Ngộ độc thực phẩm là nguy hại vệ sinh lớn liên quan đến ăn uống, nhưng gần đây chấn thương do dị vật lẫn trong thức ăn và biện pháp phòng dị ứng thực phẩm cũng trở thành thách thức quan trọng.",
    sourceQuoteJa: "食中毒は飲食に起因する衛生上の大きな危害ですが、近年は異物混入によるケガや、食物アレルギー対策も重要な課題になっています。",
    sourcePage: 1,
  },
  {
    id: "ro-hy2-1",
    chapterId: "hy-ch2",
    chunks: ["食中毒予防の３原則", "「つけない・増やさない・やっつける」は、", "有害微生物による食中毒を防止するための", "重要な原則です。"],
    meaningVi: "3 nguyên tắc phòng ngừa ngộ độc thực phẩm \"không để nhiễm - không để sinh sôi - tiêu diệt\" là những nguyên tắc quan trọng để phòng ngừa ngộ độc do vi sinh vật có hại.",
    sourceQuoteJa: "食中毒予防の３原則「つけない・増やさない・やっつける」は、有害微生物による食中毒を防止するための重要な原則です。",
    sourcePage: 3,
  },
  {
    id: "ro-hy2-2",
    chapterId: "hy-ch2",
    chunks: ["腸管出血性大腸菌（O１５７）やノロウイルスなどの有害微生物は、", "１０個から１００個程度の", "少ない量を摂取するだけで", "感染します。"],
    meaningVi: "Vi khuẩn E.coli xuất huyết đường ruột (O157) hay Norovirus... chỉ cần tiếp nhận khoảng 10-100 con là đã gây lây nhiễm.",
    sourceQuoteJa: "腸管出血性大腸菌（O１５７）やノロウイルスなどの有害微生物は、１０個から１００個程度の少ない量を摂取するだけで感染します。",
    sourcePage: 3,
  },
  {
    id: "ro-hy2-3",
    chapterId: "hy-ch2",
    chunks: ["ただし、", "ウイルスは食品中で増えないため、", "この原則は", "適用できません。"],
    meaningVi: "Tuy nhiên, vì virus không sinh sôi trong thực phẩm nên nguyên tắc này không áp dụng được cho virus.",
    sourceQuoteJa: "ただし、ウイルスは食品中で増えないため、この原則は適用できません。",
    sourcePage: 3,
  },
  {
    id: "ro-hy2-4",
    chapterId: "hy-ch2",
    chunks: ["有害微生物の多くは", "熱に弱いため、", "食品の中心部を十分に加熱することで", "死滅します。"],
    meaningVi: "Vì đa số vi sinh vật có hại yếu với nhiệt, nên có thể tiêu diệt bằng cách gia nhiệt đầy đủ phần lõi thực phẩm.",
    sourceQuoteJa: "有害微生物の多くは熱に弱いため、食品の中心部を十分に加熱することで死滅します。",
    sourcePage: 4,
  },
  {
    id: "ro-hy2-5",
    chapterId: "hy-ch2",
    chunks: [
      "衛生管理の５ S 活動は、",
      "食中毒予防の３原則の一つである有害微生物を「つけない」ことを実践するために欠かせない活動であるとともに、",
      "異物混入防止対策の",
      "基礎となる活動でもあります。",
    ],
    meaningVi: "Hoạt động 5S trong quản lý vệ sinh là hoạt động không thể thiếu để thực hành nguyên tắc \"không để nhiễm\" vi sinh vật có hại, đồng thời cũng là nền tảng phòng chống dị vật lẫn vào thức ăn.",
    sourceQuoteJa:
      "衛生管理の５ S 活動は、食中毒予防の３原則の一つである有害微生物を「つけない」ことを実践するために欠かせない活動であるとともに、異物混入防止対策の基礎となる活動でもあります。",
    sourcePage: 4,
  },
  {
    id: "ro-hy3-1",
    chapterId: "hy-ch3",
    chunks: [
      "食品衛生法は",
      "食品取扱者が遵守すべき衛生管理の基準として",
      "「HACCPに沿った衛生管理」を",
      "定めています。",
    ],
    meaningVi: "Luật Vệ sinh Thực phẩm quy định \"Quản lý vệ sinh theo HACCP\" là tiêu chuẩn quản lý vệ sinh mà người xử lý thực phẩm phải tuân thủ.",
    sourceQuoteJa: "食品衛生法は食品取扱者が遵守すべき衛生管理の基準として「HACCPに沿った衛生管理」を定めています。",
    sourcePage: 5,
  },
  {
    id: "ro-hy3-2",
    chapterId: "hy-ch3",
    chunks: ["衛生管理計画の作成：", "基準に基づき衛生管理計画を作成し、", "従業員に", "周知徹底を図る。"],
    meaningVi: "Lập kế hoạch quản lý vệ sinh: dựa theo tiêu chuẩn, lập kế hoạch quản lý vệ sinh, và phổ biến triệt để cho nhân viên.",
    sourceQuoteJa: "衛生管理計画の作成：基準に基づき衛生管理計画を作成し、従業員に周知徹底を図る。",
    sourcePage: 5,
  },
  {
    id: "ro-hy3-3",
    chapterId: "hy-ch3",
    chunks: [
      "重要管理点の決定：",
      "危害要因の発生の防止、排除又は許容できる水準にまで低減するために",
      "管理措置を講ずることが不可欠な工程を",
      "重要管理点として特定すること。",
    ],
    meaningVi: "Xác định điểm quản lý quan trọng: xác định những công đoạn mà việc có biện pháp quản lý là bắt buộc để ngăn ngừa/loại trừ/giảm yếu tố nguy hại xuống mức chấp nhận được.",
    sourceQuoteJa:
      "重要管理点の決定：危害要因の発生の防止、排除又は許容できる水準にまで低減するために管理措置を講ずることが不可欠な工程を重要管理点として特定すること。",
    sourcePage: 6,
  },
  {
    id: "ro-hy3-4",
    chapterId: "hy-ch3",
    chunks: ["検証方法の設定：", "①～⑤に規定する措置の内容の効果を、", "定期的に検証するための", "手順を定めること。"],
    meaningVi: "Thiết lập phương pháp kiểm chứng: định ra quy trình để định kỳ kiểm chứng hiệu quả của các biện pháp đã quy định ở nguyên tắc ①~⑤.",
    sourceQuoteJa: "検証方法の設定：①～⑤に規定する措置の内容の効果を、定期的に検証するための手順を定めること。",
    sourcePage: 6,
  },
  {
    id: "ro-hy4-1",
    chapterId: "hy-ch4",
    chunks: ["食品衛生責任者は", "施設の食品衛生について", "一定の責任を果たす者で", "あることから、次のいずれかに該当する者とされています。"],
    meaningVi: "Vì là người phải chịu một phần trách nhiệm nhất định về vệ sinh thực phẩm của cơ sở, nên Người phụ trách vệ sinh thực phẩm phải thuộc một trong các đối tượng sau.",
    sourceQuoteJa: "食品衛生責任者は施設の食品衛生について一定の責任を果たす者であることから、次のいずれかに該当する者とされています。",
    sourcePage: 7,
  },
  {
    id: "ro-hy4-2",
    chapterId: "hy-ch4",
    chunks: ["洗浄によって", "デンプン、タンパク質および脂肪などの有機物汚れと、", "汚れに混在している有害微生物や異物などを", "できるだけ除去します。"],
    meaningVi: "Việc rửa nhằm loại bỏ tối đa các vết bẩn hữu cơ (tinh bột, protein, chất béo) cùng với vi sinh vật có hại và dị vật lẫn trong vết bẩn đó.",
    sourceQuoteJa: "洗浄によってデンプン、タンパク質および脂肪などの有機物汚れと、汚れに混在している有害微生物や異物などをできるだけ除去します。",
    sourcePage: 10,
  },
  {
    id: "ro-hy4-3",
    chapterId: "hy-ch4",
    chunks: ["水を介する", "食中毒や感染症は、", "その被害が広範囲で患者数が多く", "集団発生になる危険性があります。"],
    meaningVi: "Ngộ độc thực phẩm hoặc bệnh truyền nhiễm qua đường nước có nguy cơ gây thiệt hại trên phạm vi rộng, số bệnh nhân đông và bùng phát tập thể.",
    sourceQuoteJa: "水を介する食中毒や感染症は、その被害が広範囲で患者数が多く集団発生になる危険性があります。",
    sourcePage: 17,
  },
  {
    id: "ro-hy4-4",
    chapterId: "hy-ch4",
    chunks: ["ねずみの", "外部からの侵入を", "防ぐことが", "最も大切です。"],
    meaningVi: "Việc quan trọng nhất là ngăn chuột xâm nhập từ bên ngoài vào.",
    sourceQuoteJa: "ねずみの外部からの侵入を防ぐことが最も大切です。",
    sourcePage: 19,
  },
  {
    id: "ro-hy4-5",
    chapterId: "hy-ch4",
    chunks: ["「食品衛生は、", "手洗いにはじまって手洗いで終わる。", "食中毒予防の原点は、", "手洗い」といわれます。"],
    meaningVi: "Người ta thường nói \"Vệ sinh thực phẩm bắt đầu từ rửa tay và kết thúc cũng bằng rửa tay. Điểm khởi đầu của phòng ngừa ngộ độc thực phẩm chính là rửa tay\".",
    sourceQuoteJa: "「食品衛生は、手洗いにはじまって手洗いで終わる。食中毒予防の原点は、手洗い」といわれます。",
    sourcePage: 23,
  },
  {
    id: "ro-hy4-6",
    chapterId: "hy-ch4",
    chunks: ["自主回収とは、", "一度販売された製品に何らかの欠陥があることが判明した場合に、", "生産者が自主的に", "製品の回収の措置をおこなうものです。"],
    meaningVi: "Thu hồi tự nguyện là biện pháp do nhà sản xuất tự nguyện thực hiện khi phát hiện sản phẩm đã bán có khiếm khuyết nào đó.",
    sourceQuoteJa: "自主回収とは、一度販売された製品に何らかの欠陥があることが判明した場合に、生産者が自主的に製品の回収の措置をおこなうものです。",
    sourcePage: 27,
  },
  {
    id: "ro-hy4-7",
    chapterId: "hy-ch4",
    chunks: ["記録データを検証することにより、", "作業工程の無駄や改善点を把握し、", "作業の効率化の", "見直しをおこないます。"],
    meaningVi: "Bằng cách kiểm chứng dữ liệu ghi chép, nắm bắt được điểm lãng phí/cần cải thiện trong quy trình làm việc, từ đó rà soát lại để nâng cao hiệu quả công việc.",
    sourceQuoteJa: "記録データを検証することにより、作業工程の無駄や改善点を把握し、作業の効率化の見直しをおこないます。",
    sourcePage: 30,
  },
  {
    id: "ro-hy4-8",
    chapterId: "hy-ch4",
    chunks: ["冷蔵・冷凍品を", "ショーケースで販売する場合は、", "ロードライン（商品陳列の上限ライン）を", "守ります。"],
    meaningVi: "Khi bán hàng đông lạnh/ướp lạnh trong tủ trưng bày, cần tuân thủ vạch giới hạn trưng bày (Load Line).",
    sourceQuoteJa: "冷蔵・冷凍品をショーケースで販売する場合は、ロードライン（商品陳列の上限ライン）を守り",
    sourcePage: 29,
  },
  {
    id: "ro-hy5-1",
    chapterId: "hy-ch5",
    chunks: ["包丁・まな板は、", "魚介類・食肉類・野菜類・加熱済み食品用と", "それぞれ専用のものを", "使用します。"],
    meaningVi: "Dao và thớt cần dùng riêng cho từng loại: hải sản, thịt, rau, và thực phẩm đã nấu chín.",
    sourceQuoteJa: "包丁・まな板は、魚介類・食肉類・野菜類・加熱済み食品用とそれぞれ専用のものを使用します。",
    sourcePage: 31,
  },
  {
    id: "ro-hy5-2",
    chapterId: "hy-ch5",
    chunks: ["凍結した肉や魚の解凍中に", "細菌の増殖を抑えるために、", "低温で解凍すると、", "ドリップの発生も抑えられます。"],
    meaningVi: "Để ức chế vi khuẩn sinh sôi khi rã đông thịt/cá đông lạnh, rã đông ở nhiệt độ thấp còn giúp hạn chế phát sinh hiện tượng rỉ dịch.",
    sourceQuoteJa: "凍結した肉や魚の解凍中に細菌の増殖を抑えるために、低温で解凍すると、ドリップの発生も抑えられます。",
    sourcePage: 31,
  },
  {
    id: "ro-hy5-3",
    chapterId: "hy-ch5",
    chunks: ["加熱調理後に冷却する食品は、", "細菌の増殖が可能な危険温度帯（１０～６０℃）に置かれる時間を", "極力", "短くすることが重要です。"],
    meaningVi: "Thực phẩm làm nguội sau khi nấu cần rút ngắn tối đa thời gian ở vùng nhiệt độ nguy hiểm (10-60°C) nơi vi khuẩn có thể sinh sôi.",
    sourceQuoteJa: "加熱調理後に冷却する食品は、細菌の増殖が可能な危険温度帯（１０～６０℃）に置かれる時間を極力短くすることが重要です。",
    sourcePage: 32,
  },
  {
    id: "ro-hy5-4",
    chapterId: "hy-ch5",
    chunks: ["盛り付け作業の際には、", "有害微生物を食品につけないこと、", "食中毒菌を増やさないこと、", "異物の混入を起こさないことが重要です。"],
    meaningVi: "3 điều quan trọng khi trình bày món: không để vi sinh vật có hại bám vào, không để vi khuẩn ngộ độc sinh sôi, và không để lẫn dị vật.",
    sourceQuoteJa: "盛り付け作業の際には、有害微生物を食品につけないこと、食中毒菌を増やさないこと、異物の混入を起こさないことが重要です。",
    sourcePage: 33,
  },
  {
    id: "ro-hy5-5",
    chapterId: "hy-ch5",
    chunks: ["調理済み食品は", "必ずフタ付きの容器やラップをかけて保管し、", "未加熱原材料との接触や手指からの汚染、", "異物混入を防ぎます。"],
    meaningVi: "Thực phẩm đã nấu phải luôn đậy nắp hộp/bọc màng, tránh tiếp xúc với nguyên liệu chưa nấu, ô nhiễm từ tay và lẫn dị vật.",
    sourceQuoteJa: "調理済み食品は必ずフタ付きの容器やラップをかけて保管し、未加熱原材料との接触や手指からの汚染、異物混入を防ぎます。",
    sourcePage: 34,
  },
  {
    id: "ro-ck1-1",
    chapterId: "ck-ch1",
    chunks: ["牛肉の部位の名称は、", "社団法人日本食肉格付協会が定めた", "牛部分肉取引規格で", "定められています。"],
    meaningVi: "Tên gọi các phần thịt bò được quy định theo Quy cách giao dịch thịt bò từng phần do Hiệp hội phân hạng thịt Nhật Bản ban hành.",
    sourceQuoteJa: "牛肉の部位の名称は、社団法人日本食肉格付協会が定めた牛部分肉取引規格で定められています。",
    sourcePage: 1,
  },
  {
    id: "ro-ck1-2",
    chapterId: "ck-ch1",
    chunks: ["肉のうまみを", "逃さないためには、", "加熱時間と温度の", "調節が重要です。"],
    meaningVi: "Để giữ vị ngon của thịt, việc điều chỉnh thời gian và nhiệt độ gia nhiệt là quan trọng.",
    sourceQuoteJa: "肉のうまみを逃さないためには、加熱時間と温度の調節が重要です。",
    sourcePage: 1,
  },
  {
    id: "ro-ck1-3",
    chapterId: "ck-ch1",
    chunks: ["魚介類とは、", "魚、貝類、エビ、カニを", "中心とした食用水産生物の", "総称です。"],
    meaningVi: "Hải sản là tên gọi chung cho sinh vật thủy sản ăn được, chủ yếu là cá, động vật có vỏ, tôm, cua.",
    sourceQuoteJa: "魚介類とは、魚、貝類、エビ、カニを中心とした食用水産生物の総称です。",
    sourcePage: 2,
  },
  {
    id: "ro-ck1-4",
    chapterId: "ck-ch1",
    chunks: ["魚介類の旬とは、", "脂肪の多い「脂ののった」時期であり、", "その魚介類が一番おいしく", "食べられる時期をさします。"],
    meaningVi: "'Shun' của hải sản là thời kỳ nhiều mỡ ('béo ngậy'), chỉ thời điểm loại hải sản đó ăn ngon nhất.",
    sourceQuoteJa: "魚介類の旬とは、脂肪の多い「脂ののった」時期であり、その魚介類が一番おいしく食べられる時期をさします。",
    sourcePage: 2,
  },
  {
    id: "ro-ck1-5",
    chapterId: "ck-ch1",
    chunks: ["フグは毒をもっているので、", "都道府県知事などが認めた", "専門のフグ処理者が", "処理する必要があります。"],
    meaningVi: "Vì cá nóc có độc, việc chế biến phải do người chế biến cá nóc chuyên môn được thống đốc tỉnh công nhận thực hiện.",
    sourceQuoteJa: "フグは毒をもっているので、都道府県知事などが認めた専門のフグ処理者が処理する必要があります。",
    sourcePage: 3,
  },
  {
    id: "ro-ck1-6",
    chapterId: "ck-ch1",
    chunks: ["現在、", "日本の市場で流通する野菜の数は", "１５０種類ほどと", "言われています。"],
    meaningVi: "Hiện nay, số loại rau lưu thông trên thị trường Nhật Bản được cho là vào khoảng 150 loại.",
    sourceQuoteJa: "現在、日本の市場で流通する野菜の数は１５０種類ほどと言われています。",
    sourcePage: 3,
  },
  {
    id: "ro-ck1-7",
    chapterId: "ck-ch1",
    chunks: ["ごぼうやれんこんなどは", "切ったあと、すぐに水につけると", "切り口の褐変を", "防ぐことができます。"],
    meaningVi: "Ngưu bàng, củ sen sau khi cắt nếu ngâm ngay vào nước sẽ ngăn được vết cắt bị thâm.",
    sourceQuoteJa: "ごぼうやれんこんなどは切ったあと、すぐに水につけると切り口の褐変を防ぐことができます。",
    sourcePage: 4,
  },
  {
    id: "ro-ck1-8",
    chapterId: "ck-ch1",
    chunks: ["和牛は、", "黒毛和種・褐毛和種・無角和種・日本短角種の", "４品種とそれらの", "交雑種のことを指します。"],
    meaningVi: "Wagyu chỉ 4 giống: giống lông đen, giống lông nâu, giống không sừng, giống sừng ngắn Nhật Bản và các giống lai của chúng.",
    sourceQuoteJa: "和牛は、黒毛和種・褐毛和種・無角和種・日本短角種の４品種とそれらの交雑種のことを指します。",
    sourcePage: 4,
  },
  {
    id: "ro-ck1-9",
    chapterId: "ck-ch1",
    chunks: ["伝統野菜は", "地域の食文化に", "重要な役割を", "果たしています。"],
    meaningVi: "Rau truyền thống đóng vai trò quan trọng trong văn hóa ẩm thực địa phương.",
    sourceQuoteJa: "伝統野菜は地域の食文化に重要な役割を果たしています。",
    sourcePage: 5,
  },
  {
    id: "ro-ck2-1",
    chapterId: "ck-ch2",
    chunks: ["下処理状態が悪いと", "料理そのものの", "味や食感が", "悪くなります。"],
    meaningVi: "Nếu tình trạng sơ chế không tốt, vị và kết cấu của chính món ăn sẽ trở nên kém đi.",
    sourceQuoteJa: "下処理状態が悪いと料理そのものの味や食感が悪くなります。",
    sourcePage: 5,
  },
  {
    id: "ro-ck2-2",
    chapterId: "ck-ch2",
    chunks: ["きゅうりやキャベツは", "塩でもむと、", "浸透圧の作用で野菜から", "水分が出てしんなりします。"],
    meaningVi: "Dưa leo, bắp cải khi bóp muối: do tác dụng thẩm thấu, nước trong rau thoát ra làm rau mềm xuống.",
    sourceQuoteJa: "きゅうりやキャベツは塩でもむと、浸透圧の作用で野菜から水分が出てしんなりします。",
    sourcePage: 5,
  },
  {
    id: "ro-ck2-3",
    chapterId: "ck-ch2",
    chunks: ["赤身と脂身の間にある筋は", "加熱により縮み、", "肉が反り返るので、", "切れ目を入れます。"],
    meaningVi: "Gân nằm giữa phần nạc và mỡ khi gia nhiệt sẽ co lại làm miếng thịt cong lên, nên phải khía dao trước.",
    sourceQuoteJa: "赤身と脂身の間にある筋は加熱により縮み、肉が反り返るので、切れ目を入れます。",
    sourcePage: 5,
  },
  {
    id: "ro-ck2-4",
    chapterId: "ck-ch2",
    chunks: ["肉たたきで肉をたたき、", "形を整えて焼くと、", "縮まずに", "やわらかくなります。"],
    meaningVi: "Dùng chày đập thịt, chỉnh hình dạng rồi nướng thì sẽ không co lại và trở nên mềm hơn.",
    sourceQuoteJa: "肉たたきで肉をたたき、形を整えて焼くと、縮まずやわらかくなります。",
    sourcePage: 5,
  },
  {
    id: "ro-ck2-5",
    chapterId: "ck-ch2",
    chunks: ["水洗いは、", "手早く流水で", "洗い流し、水気を", "しっかりふきとります。"],
    meaningVi: "Rửa cá bằng nước: rửa nhanh dưới vòi nước chảy, sau đó lau khô kỹ nước còn đọng.",
    sourceQuoteJa: "水洗い：手早く流水で洗い流し、水気をしっかりふきとります。",
    sourcePage: 6,
  },
  {
    id: "ro-ck3-1",
    chapterId: "ck-ch3",
    chunks: ["調理とは、", "食材に手を加え、衛生的で安全なものにする、", "味や香り、口触りをよくして", "美味しいものにすることです。"],
    meaningVi: "Nấu ăn là tác động lên nguyên liệu để làm cho nó vệ sinh, an toàn, cải thiện vị, hương thơm, cảm giác khi ăn để trở nên ngon miệng.",
    sourceQuoteJa: "調理とは、食材に手を加え、衛生的で安全なものにする、味や香り、口触りをよくして美味しいものにすることです。",
    sourcePage: 6,
  },
  {
    id: "ro-ck3-2",
    chapterId: "ck-ch3",
    chunks: ["揚げるは、", "高温・多量の油で", "加熱し、食品の水分が減少して", "油を吸収します。"],
    meaningVi: "Chiên (揚げる): nấu ở nhiệt độ cao với nhiều dầu; nước trong thực phẩm giảm đi và hấp thụ dầu.",
    sourceQuoteJa: "揚げる：高温・多量の油で加熱します。食品の水分が減少し、油を吸収します。",
    sourcePage: 6,
  },
  {
    id: "ro-ck3-3",
    chapterId: "ck-ch3",
    chunks: ["揚げ物を揚げ続けると", "油が酸化され、", "色や香りが悪くなり", "粘りが増してきます。"],
    meaningVi: "Nếu tiếp tục chiên nhiều lần, dầu sẽ bị oxy hóa, màu và mùi trở nên kém đi, độ nhớt tăng lên.",
    sourceQuoteJa: "揚げ物を揚げ続けると油が酸化され、色や香りが悪くなり粘りが増してきます。",
    sourcePage: 6,
  },
  {
    id: "ro-ck3-4",
    chapterId: "ck-ch3",
    chunks: ["非加熱調理では、", "交差汚染・二次汚染の", "リスクが高いので、", "衛生管理での注意事項は確実に守ることが大切です。"],
    meaningVi: "Chế biến không dùng nhiệt có rủi ro lây nhiễm chéo/ô nhiễm thứ cấp cao, nên phải tuân thủ nghiêm ngặt lưu ý về quản lý vệ sinh.",
    sourceQuoteJa: "非加熱調理では、交差汚染・二次汚染のリスクが高いので、衛生管理での注意事項は確実に守ることが大切です。",
    sourcePage: 7,
  },
  {
    id: "ro-ck3-5",
    chapterId: "ck-ch3",
    chunks: ["刺身のような「生食用冷凍魚介類」は、", "組織の破壊や汁の流出が", "起きないようになるべく", "低温で時間をかけて解凍します。"],
    meaningVi: "Hải sản đông lạnh dùng để ăn sống như sashimi được rã đông ở nhiệt độ thấp trong thời gian dài để tránh phá hủy cấu trúc và chảy nước.",
    sourceQuoteJa: "刺身のような「生食用冷凍魚介類」は、組織の破壊や汁の流出が起きないようになるべく低温で時間をかけて解凍します。",
    sourcePage: 7,
  },
  {
    id: "ro-ck3-6",
    chapterId: "ck-ch3",
    chunks: ["次に何をしなければならないか、", "何のためにその作業をするのかを明確化し、", "作業の効率化", "及び料理の品質を維持することができます。"],
    meaningVi: "Việc lập kế hoạch nấu ăn giúp làm rõ tiếp theo cần làm gì và làm việc đó để làm gì, từ đó nâng cao hiệu quả công việc và duy trì chất lượng món ăn.",
    sourceQuoteJa: "次に何をしなければならないか、何のためにその作業をするのかを明確化し、作業の効率化及び料理の品質を維持することができます。",
    sourcePage: 7,
  },
  {
    id: "ro-ck4-1",
    chapterId: "ck-ch4",
    chunks: ["換気が不十分だと", "一酸化炭素中毒を", "起こす恐れがあり、最悪の場合、", "死亡事故に至ることがあります。"],
    meaningVi: "Nếu thông gió không đủ, có nguy cơ ngộ độc khí CO, trường hợp xấu nhất có thể dẫn đến tử vong.",
    sourceQuoteJa: "換気が不十分だと一酸化炭素中毒を起こす恐れがあり、最悪の場合、死亡事故に至ることがあります。",
    sourcePage: 8,
  },
  {
    id: "ro-ck4-2",
    chapterId: "ck-ch4",
    chunks: ["食品の保存、", "加熱後冷却が必要な", "食品について", "急速冷凍などをおこないます。"],
    meaningVi: "Thiết bị làm lạnh dùng để bảo quản thực phẩm, và cấp đông nhanh cho thực phẩm cần làm lạnh sau khi nấu.",
    sourceQuoteJa: "食品の保存、加熱後冷却が必要な食品について急速冷凍などをおこないます。",
    sourcePage: 8,
  },
  {
    id: "ro-ck4-3",
    chapterId: "ck-ch4",
    chunks: ["食器の回転数が", "飲食店の売り上げに直結するため、", "トラブルなく洗浄機器を", "使用することが重要なポイントとなります。"],
    meaningVi: "Vì tốc độ quay vòng bát đĩa liên quan trực tiếp đến doanh thu nhà hàng, nên việc dùng máy rửa không gặp sự cố là điểm quan trọng.",
    sourceQuoteJa: "食器の回転数が飲食店の売り上げに直結するため、トラブルなく洗浄機器を使用することが重要なポイントとなります。",
    sourcePage: 9,
  },
  {
    id: "ro-ck4-4",
    chapterId: "ck-ch4",
    chunks: ["包丁及びまな板は", "肉用、野菜用、", "下処理用などに分類し、", "使い分けてください。"],
    meaningVi: "Dao và thớt phải được phân loại thành dùng cho thịt, rau, sơ chế... và dùng riêng biệt.",
    sourceQuoteJa: "包丁及びまな板は肉用、野菜用、下処理用などに分類し、使い分けてください。",
    sourcePage: 9,
  },
  {
    id: "ro-ck4-5",
    chapterId: "ck-ch4",
    chunks: ["柳刃包丁：", "刃渡りが長く、", "主に刺身を切るときに使用する包丁で", "「刺身包丁」とも呼びます。"],
    meaningVi: "Dao Yanagiba: lưỡi dài, chủ yếu dùng để cắt sashimi, còn được gọi là 'dao sashimi'.",
    sourceQuoteJa: "柳刃包丁：刃渡りが長く、主に刺身を切るときに使用する包丁で「刺身包丁」とも呼びます。",
    sourcePage: 9,
  },
  {
    id: "ro-ck4-6",
    chapterId: "ck-ch4",
    chunks: ["計測機器類は", "精密機械なので、", "汚れや振動などが", "計測の精度に影響を及ぼすことがあります。"],
    meaningVi: "Thiết bị đo lường là máy móc chính xác, nên bụi bẩn hoặc rung động có thể ảnh hưởng đến độ chính xác của phép đo.",
    sourceQuoteJa: "計測機器類は精密機械なので、汚れや振動などが計測の精度に影響を及ぼすことがあります。",
    sourcePage: 10,
  },
  {
    id: "ro-ck5-1",
    chapterId: "ck-ch5",
    chunks: ["飲食店での労働災害で", "最も多い事故は", "「転倒」で全体の", "約３割を占めています。"],
    meaningVi: "Tai nạn lao động phổ biến nhất tại nhà hàng là 'té ngã', chiếm khoảng 30% tổng số.",
    sourceQuoteJa: "飲食店での労働災害で最も多い事故は「転倒」で全体の約３割を占めています。",
    sourcePage: 11,
  },
  {
    id: "ro-ck5-2",
    chapterId: "ck-ch5",
    chunks: ["職場に潜む", "危険などは、", "視覚的に", "とらえられないものが多くあります。"],
    meaningVi: "Nhiều nguy hiểm tiềm ẩn tại nơi làm việc không thể nhận biết bằng mắt thường.",
    sourceQuoteJa: "職場に潜む危険などは、視覚的にとらえられないものが多くあります。",
    sourcePage: 11,
  },
  {
    id: "ro-ck5-3",
    chapterId: "ck-ch5",
    chunks: ["５Ｓ活動を", "徹底することで、", "転倒災害防止と", "作業の効率化が期待できます。"],
    meaningVi: "Thực hiện triệt để hoạt động 5S giúp phòng ngừa tai nạn té ngã và nâng cao hiệu quả công việc.",
    sourceQuoteJa: "５Ｓ活動を徹底することで、転倒災害防止と作業の効率化が期待できます。",
    sourcePage: 14,
  },
  {
    id: "ro-ck5-4",
    chapterId: "ck-ch5",
    chunks: ["重い荷物を運ぶ際は、", "台車を使う、ひとりでは持たない、", "何回かに分けて運ぶなど", "転倒リスク低減の措置をとりましょう。"],
    meaningVi: "Khi mang vật nặng, nên dùng xe đẩy, không tự mang một mình, chia làm nhiều lần để giảm nguy cơ té ngã.",
    sourceQuoteJa: "重い荷物を運ぶ際は、台車を使う、ひとりでは持たない、何回かに分けて運ぶなど転倒リスク低減の措置をとりましょう。",
    sourcePage: 14,
  },
  {
    id: "ro-ck5-5",
    chapterId: "ck-ch5",
    chunks: ["フライヤーを", "使う際は、", "長靴、長エプロン、", "耐熱手袋を着用しましょう。"],
    meaningVi: "Khi dùng fryer, phải mang ủng, tạp dề dài, găng tay chịu nhiệt.",
    sourceQuoteJa: "フライヤーを使う際は、長靴、長エプロン、耐熱手袋を着用しましょう。",
    sourcePage: 14,
  },
  {
    id: "ro-ck5-6",
    chapterId: "ck-ch5",
    chunks: ["機械の目詰まりなどの", "調整時には、", "原則として、機械の運転を", "停止するなどの措置を義務付けています。"],
    meaningVi: "Khi điều chỉnh do máy bị tắc nghẽn, về nguyên tắc phải dừng máy trước — đây là quy định bắt buộc.",
    sourceQuoteJa: "機械の目詰まりなどの調整時には、原則として、機械の運転を停止するなどの措置を義務付けています。",
    sourcePage: 15,
  },
  {
    id: "ro-ck6-1",
    chapterId: "ck-ch6",
    chunks: ["お店のコンセプトや", "各仕入先のメリット・デメリットを見極め、", "自店にあった仕入先を", "選択することが重要です。"],
    meaningVi: "Việc cân nhắc concept của cửa hàng và ưu nhược điểm của từng nguồn nhập hàng để chọn nguồn phù hợp với cửa hàng mình là điều quan trọng.",
    sourceQuoteJa: "お店のコンセプトや各仕入先のメリット・デメリットを見極め、自店にあった仕入先を選択することが重要です。",
    sourcePage: 15,
  },
  {
    id: "ro-ck6-2",
    chapterId: "ck-ch6",
    chunks: ["生鮮食料品などを", "安定的に", "供給するシステムとして", "運営されています。"],
    meaningVi: "Được vận hành như một hệ thống cung cấp ổn định các thực phẩm tươi sống.",
    sourceQuoteJa: "生鮮食料品などを安定的に供給するシステムとして運営されています。",
    sourcePage: 15,
  },
  {
    id: "ro-ck6-3",
    chapterId: "ck-ch6",
    chunks: ["生産者から農協などの出荷事業者、", "卸売市場や食品製造業、", "食品小売業などを経由して", "消費者の元に届きます。"],
    meaningVi: "Từ nhà sản xuất, thực phẩm đi qua đơn vị xuất hàng như hợp tác xã nông nghiệp, chợ đầu mối, ngành chế biến thực phẩm, ngành bán lẻ thực phẩm rồi đến tay người tiêu dùng.",
    sourceQuoteJa: "生産者から農協などの出荷事業者、卸売市場や食品製造業、食品小売業などを経由して消費者の元に届きます。",
    sourcePage: 15,
  },
  {
    id: "ro-ck7-1",
    chapterId: "ck-ch7",
    chunks: ["食品の製造過程において、", "加工や保存の目的で", "食品に添加されるものを", "食品添加物といいます。"],
    meaningVi: "Chất được thêm vào thực phẩm với mục đích chế biến hoặc bảo quản trong quá trình sản xuất thực phẩm gọi là phụ gia thực phẩm.",
    sourceQuoteJa: "食品の製造過程において、加工や保存の目的で食品に添加されるものを食品添加物といいます。",
    sourcePage: 16,
  },
  {
    id: "ro-ck7-2",
    chapterId: "ck-ch7",
    chunks: ["そのほか、食品添加物には、", "長年使用されてきた天然添加物として品目が決められている「既存添加物」、", "一般の食品を添加物の目的で使用した「一般飲食物添加物」、", "「天然香料」の４つの種類があります。"],
    meaningVi: "Ngoài ra, phụ gia thực phẩm còn có 4 loại: 'phụ gia hiện có' (phụ gia tự nhiên đã dùng lâu năm, có danh mục cố định), 'phụ gia từ thực phẩm thông thường' (dùng thực phẩm thường với mục đích làm phụ gia), và 'hương liệu tự nhiên'.",
    sourceQuoteJa: "そのほか、食品添加物には、長年使用されてきた天然添加物として品目が決められている「既存添加物」、一般の食品を添加物の目的で使用した「一般飲食物添加物」、「天然香料」の４つの種類があります。",
    sourcePage: 16,
  },
  {
    id: "ro-ck7-3",
    chapterId: "ck-ch7",
    chunks: ["食品安全基本法に基づき設置された", "食品安全委員会は動物試験などの結果をもとに", "食品添加物を評価し、安全性を確認したものについて、", "厚生労働大臣が指定する「指定添加物」として、食品ごとに基準値を設定しています。"],
    meaningVi: "Ủy ban An toàn Thực phẩm được thành lập theo Luật cơ bản về An toàn Thực phẩm, đánh giá phụ gia thực phẩm dựa trên kết quả thử nghiệm động vật; những chất được xác nhận an toàn sẽ được Bộ trưởng Y tế Lao động Phúc lợi chỉ định là 'phụ gia được chỉ định' và thiết lập giá trị tiêu chuẩn cho từng loại thực phẩm.",
    sourceQuoteJa: "食品安全基本法に基づき設置された食品安全委員会は動物試験などの結果をもとに食品添加物を評価し、安全性を確認したものについて、厚生労働大臣が指定する「指定添加物」として、食品ごとに基準値を設定しています。",
    sourcePage: 16,
  },
  {
    id: "ro-cs1-1",
    chapterId: "cs-ch1",
    chunks: ["日本における", "接客サービスの特性として、", "「おもてなし」", "（＝ホスピタリティ）があります。"],
    meaningVi: "Đặc trưng của dịch vụ tiếp khách tại Nhật Bản là 'omotenashi' (=hospitality).",
    sourceQuoteJa: "日本における接客サービスの特性として、「おもてなし」（＝ホスピタリティ）があります。",
    sourcePage: 1,
  },
  {
    id: "ro-cs1-2",
    chapterId: "cs-ch1",
    chunks: ["客席内における", "動作の基本は、", "ニコニコ、ハキハキ、", "キビキビの３つです。"],
    meaningVi: "3 nguyên tắc cơ bản về hành động trong khu vực bàn khách là: cười tươi, nói rõ ràng, nhanh nhẹn.",
    sourceQuoteJa: "客席内における動作の基本は、ニコニコ、ハキハキ、キビキビの３つです。",
    sourcePage: 2,
  },
  {
    id: "ro-cs1-3",
    chapterId: "cs-ch1",
    chunks: ["料理が配膳されるときが", "お客様にとって", "最も期待が", "高まる瞬間です。"],
    meaningVi: "Thời điểm món ăn được phục vụ là khoảnh khắc kỳ vọng của khách lên cao nhất.",
    sourceQuoteJa: "料理が配膳されるときがお客様にとって最も期待が高まる瞬間です。",
    sourcePage: 5,
  },
  {
    id: "ro-cs1-4",
    chapterId: "cs-ch1",
    chunks: ["接客用語の最も重要な役目は、", "お客様の意思を確認したり、", "店側の状況などを", "伝えたりすることです。"],
    meaningVi: "Vai trò quan trọng nhất của thuật ngữ tiếp khách là xác nhận ý muốn của khách và truyền đạt tình hình từ phía cửa hàng.",
    sourceQuoteJa: "接客用語の最も重要な役目は、お客様の意思を確認したり、店側の状況などを伝えたりすることです。",
    sourcePage: 6,
  },
  {
    id: "ro-cs1-5",
    chapterId: "cs-ch1",
    chunks: ["料理提供を優先し、", "レジ精算が２番目に来るのは、", "待たせすぎると料理が冷めて美味しさが低下し", "再来店してもらえないからです。"],
    meaningVi: "Ưu tiên phục vụ món ăn trước, thanh toán đứng thứ hai vì nếu để khách chờ lâu món sẽ nguội và giảm ngon, khách sẽ không quay lại.",
    sourceQuoteJa: "料理提供を優先し、レジ精算が２番目に来るのは、待たせすぎると料理が冷めて美味しさが低下し再来店してもらえないからです。",
    sourcePage: 7,
  },
  {
    id: "ro-cs1-6",
    chapterId: "cs-ch1",
    chunks: ["ここでいう顧客管理とは", "単に顧客データを管理するのではなく、", "積極的にカスタマーリレーションズ＝", "お客様と店との、より良い関係づくりをみずから図ることです。"],
    meaningVi: "Quản lý khách hàng ở đây không chỉ là quản lý dữ liệu mà là chủ động xây dựng mối quan hệ tốt đẹp hơn giữa khách hàng và cửa hàng.",
    sourceQuoteJa: "ここでいう顧客管理とは単に顧客データを管理するのではなく、積極的にカスタマーリレーションズ＝お客様と店との、より良い関係づくりをみずから図ることです。",
    sourcePage: 8,
  },
  {
    id: "ro-cs2-1",
    chapterId: "cs-ch2",
    chunks: ["食物アレルギーのお客様が", "知らずに該当する食材を食べて発症すると、", "最悪の場合、アナフィラキシーショックを起こして", "呼吸困難になり死亡することもあります。"],
    meaningVi: "Nếu khách bị dị ứng thực phẩm ăn phải thực phẩm gây dị ứng mà không biết, trường hợp xấu nhất có thể bị sốc phản vệ dẫn đến khó thở và tử vong.",
    sourceQuoteJa: "食物アレルギーのお客様が知らずに該当する食材を食べて発症すると、最悪の場合、アナフィラキシーショックを起こして呼吸困難になり死亡することもあります。",
    sourcePage: 8,
  },
  {
    id: "ro-cs2-2",
    chapterId: "cs-ch2",
    chunks: ["消費期限を", "過ぎた", "食品は", "食べないようにしてください。"],
    meaningVi: "Không được ăn thực phẩm đã quá hạn sử dụng.",
    sourceQuoteJa: "消費期限を過ぎた食品は食べないようにしてください。",
    sourcePage: 9,
  },
  {
    id: "ro-cs2-3",
    chapterId: "cs-ch2",
    chunks: ["問題があった場合、", "原因を見つけ", "再発防止のため、", "問題点を店内で共有してください。"],
    meaningVi: "Nếu có vấn đề, hãy tìm nguyên nhân và chia sẻ vấn đề trong nội bộ cửa hàng để phòng ngừa tái diễn.",
    sourceQuoteJa: "問題があった場合、原因を見つけ再発防止のため、問題点を店内で共有してください。",
    sourcePage: 10,
  },
  {
    id: "ro-cs2-4",
    chapterId: "cs-ch2",
    chunks: ["ハラールでは", "アルコールは使えないため、", "食材にアルコールを", "かけることはできません。"],
    meaningVi: "Halal không được dùng cồn, nên không thể rưới rượu lên nguyên liệu.",
    sourceQuoteJa: "ハラールではアルコールは使えないため、食材にアルコールをかけることはできません。",
    sourcePage: 10,
  },
  {
    id: "ro-cs3-1",
    chapterId: "cs-ch3",
    chunks: ["開店準備は", "お客様に気持ちよく来店してもらうためのもので、", "閉店作業は安全確認と", "次の日のお客様のために準備するためのものです。"],
    meaningVi: "Chuẩn bị mở cửa là để khách hàng đến quán một cách thoải mái, còn công tác đóng cửa là để xác nhận an toàn và chuẩn bị cho khách ngày hôm sau.",
    sourceQuoteJa: "開店準備はお客様に気持ちよく来店してもらうためのもので、閉店作業は安全確認と次の日のお客様のために準備するためのものです。",
    sourcePage: 10,
  },
  {
    id: "ro-cs3-2",
    chapterId: "cs-ch3",
    chunks: ["清掃の教育訓練は、", "一番最初に", "店舗責任者みずから", "指導しなければなりません。"],
    meaningVi: "Đào tạo dọn dẹp phải do chính người phụ trách cửa hàng hướng dẫn đầu tiên.",
    sourceQuoteJa: "清掃の教育訓練は、一番最初に店舗責任者みずから指導しなければなりません。",
    sourcePage: 13,
  },
  {
    id: "ro-cs3-3",
    chapterId: "cs-ch3",
    chunks: ["誰でも見た目で", "清潔感を感じたなら、", "その店を利用する", "動機の一つになります。"],
    meaningVi: "Nếu ai cũng cảm nhận được sự sạch sẽ qua vẻ ngoài, đó sẽ là một trong những động lực để họ sử dụng quán đó.",
    sourceQuoteJa: "誰でも見た目で清潔感を感じたなら、その店を利用する動機の一つになります。",
    sourcePage: 13,
  },
  {
    id: "ro-cs3-4",
    chapterId: "cs-ch3",
    chunks: ["レジを締めた時、", "ロール上の現金有り高と、", "実際の現金有り高が", "一致していることが重要です。"],
    meaningVi: "Khi chốt sổ quỹ, điều quan trọng là số tiền mặt ghi trên cuộn giấy và số tiền mặt thực tế phải khớp nhau.",
    sourceQuoteJa: "レジを締めた時、ロール上の現金有り高と、実際の現金有り高が一致していることが重要です。",
    sourcePage: 16,
  },
  {
    id: "ro-cs3-5",
    chapterId: "cs-ch3",
    chunks: ["閉店後レジ締めをおこない、", "所定のバッグに", "現金と入金票を入れて", "投入します。"],
    meaningVi: "Sau khi đóng cửa, chốt sổ quỹ, cho tiền mặt và phiếu nộp tiền vào túi quy định rồi nộp vào két.",
    sourceQuoteJa: "閉店後レジ締めをおこない、所定のバッグに現金と入金票を入れて投入します。",
    sourcePage: 16,
  },
  {
    id: "ro-cs4-1",
    chapterId: "cs-ch4",
    chunks: ["クレームはなるべく", "受けたくないと考えるのが普通ですが、", "一方クレームは店の", "質的改善につながる大きな材料でもあります。"],
    meaningVi: "Thông thường ai cũng không muốn nhận khiếu nại, nhưng mặt khác khiếu nại cũng là tư liệu quan trọng để cải thiện chất lượng cửa hàng.",
    sourceQuoteJa: "クレームはなるべく受けたくないと考えるのが普通ですが、一方クレームは店の質的改善につながる大きな材料でもあります。",
    sourcePage: 16,
  },
  {
    id: "ro-cs4-2",
    chapterId: "cs-ch4",
    chunks: ["どんな小さな苦情でも", "部下から報告させ、", "店長が迅速に", "直接テーブルまで行き対応します。"],
    meaningVi: "Dù là khiếu nại nhỏ đến đâu cũng phải để nhân viên cấp dưới báo cáo, và cửa hàng trưởng phải nhanh chóng đến tận bàn xử lý.",
    sourceQuoteJa: "どんな小さな苦情でも部下から報告させ、店長が迅速に直接テーブルまで行き対応します。",
    sourcePage: 16,
  },
  {
    id: "ro-cs4-3",
    chapterId: "cs-ch4",
    chunks: ["クレームの大半は", "異物混入で、", "とりわけ多いのが", "髪の毛の混入です。"],
    meaningVi: "Phần lớn khiếu nại là do dị vật lẫn trong món ăn, đặc biệt phổ biến nhất là lẫn tóc.",
    sourceQuoteJa: "クレームの大半は異物混入で、とりわけ多いのが髪の毛の混入です。",
    sourcePage: 18,
  },
  {
    id: "ro-cs4-4",
    chapterId: "cs-ch4",
    chunks: ["お客様にはまず、", "作り直してよいか確認し、", "作り直し不要と言われれば", "伝票をキャンセルする対応を素早くおこなってください。"],
    meaningVi: "Trước tiên xác nhận với khách có muốn làm lại món hay không; nếu khách nói không cần, phải nhanh chóng hủy hóa đơn.",
    sourceQuoteJa: "お客様にはまず、作り直してよいか確認し、作り直し不要と言われれば伝票をキャンセルする対応を素早くおこなってください。",
    sourcePage: 18,
  },
  {
    id: "ro-cs5-1",
    chapterId: "cs-ch5",
    chunks: ["お客様で体調不良者が発生した場合、", "決して慌てずに、", "同伴者がいれば", "同伴者の指示に従ってください。"],
    meaningVi: "Khi có khách bị khó chịu trong người, tuyệt đối không được hoảng loạn, nếu có người đi cùng thì làm theo chỉ dẫn của người đó.",
    sourceQuoteJa: "お客様で体調不良者が発生した場合、決して慌てずに、同伴者がいれば同伴者の指示に従ってください。",
    sourcePage: 18,
  },
  {
    id: "ro-cs5-2",
    chapterId: "cs-ch5",
    chunks: ["心停止を起こしたお客様には、", "AEDをすぐに当ててください。", "そして同時に", "救急車を呼んでください。"],
    meaningVi: "Khi khách bị ngừng tim, phải dùng máy AED ngay lập tức, đồng thời gọi xe cấp cứu.",
    sourceQuoteJa: "心停止を起こしたお客様には、AEDをすぐに当ててください。そして同時に救急車を呼んでください。",
    sourcePage: 19,
  },
  {
    id: "ro-cs5-3",
    chapterId: "cs-ch5",
    chunks: ["AED（自動体外式除細動器）の", "使い方の", "訓練を", "定期的に実施してください。"],
    meaningVi: "Phải thực hiện đào tạo định kỳ về cách sử dụng máy AED (máy khử rung tim tự động).",
    sourceQuoteJa: "AED（自動体外式除細動器）の使い方の訓練を定期的に実施してください。",
    sourcePage: 19,
  },
];

export type VocabDirection = "ja-to-vi" | "vi-to-ja";

export type VocabQuestion = {
  id: string;
  chapterId: string;
  direction: VocabDirection;
  /** Từ/cụm từ được hỏi — tiếng Nhật nếu direction=ja-to-vi, tiếng Việt nếu direction=vi-to-ja. */
  term: string;
  /** 4 phương án bằng ngôn ngữ đối lập với term. */
  options: string[];
  correctIndex: number;
};

// v1: mới có nội dung cho chương sm-ch1, gom từ bảng thuật ngữ OTAFF (参考6 マネジメント基本用語)
// và các từ then chốt đã xuất hiện trong Trắc nghiệm/Dịch câu/Sắp xếp câu của chương này.
export const VOCAB: VocabQuestion[] = [
  { id: "vc-sm1-1", chapterId: "sm-ch1", direction: "ja-to-vi", term: "外食産業", options: ["Ngành nông nghiệp", "Ngành xây dựng", "Ngành dịch vụ ăn uống", "Ngành vận tải"], correctIndex: 2 },
  { id: "vc-sm1-2", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Phạm vi thương mại (khu vực thu hút khách)", options: ["商圏", "立地", "客単価", "損益分岐点"], correctIndex: 0 },
  { id: "vc-sm1-3", chapterId: "sm-ch1", direction: "ja-to-vi", term: "立地産業", options: ["Ngành công nghệ cao", "Ngành phụ thuộc vào địa điểm", "Ngành xuất khẩu", "Ngành tài chính"], correctIndex: 1 },
  { id: "vc-sm1-4", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Lòng hiếu khách, tinh thần phục vụ tận tâm", options: ["オペレーション", "マネジメント", "スタンダード", "ホスピタリティ"], correctIndex: 3 },
  { id: "vc-sm1-5", chapterId: "sm-ch1", direction: "ja-to-vi", term: "雰囲気（Atmosphere）", options: ["Bầu không khí", "Chất lượng", "Vệ sinh", "Giá cả"], correctIndex: 0 },
  { id: "vc-sm1-6", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Người phụ trách theo khung giờ", options: ["店長", "副店長", "時間帯責任者", "アルバイト"], correctIndex: 2 },
  { id: "vc-sm1-7", chapterId: "sm-ch1", direction: "ja-to-vi", term: "代行する", options: ["Từ chối", "Đảm nhận thay, làm thay", "Sa thải", "Tuyển dụng"], correctIndex: 1 },
  { id: "vc-sm1-8", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Nhiệm vụ, công việc", options: ["職務", "職場", "職業訓練", "就職"], correctIndex: 0 },
  { id: "vc-sm1-9", chapterId: "sm-ch1", direction: "ja-to-vi", term: "客単価", options: ["Tổng doanh thu", "Số lượng khách", "Chi phí nhân công", "Đơn giá trung bình mỗi khách"], correctIndex: 3 },
  { id: "vc-sm1-10", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Đào tạo, bồi dưỡng (nhân tài)", options: ["採用", "解雇", "育成", "昇進"], correctIndex: 2 },
  { id: "vc-sm1-11", chapterId: "sm-ch1", direction: "ja-to-vi", term: "損益分岐点", options: ["Điểm bán hàng", "Điểm giao hàng", "Điểm hòa vốn", "Điểm nhân sự"], correctIndex: 2 },
  { id: "vc-sm1-12", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Robot hóa, tự động hóa bằng máy móc", options: ["ロボット化", "機械化", "IT化", "自動化"], correctIndex: 0 },
  { id: "vc-sm1-13", chapterId: "sm-ch1", direction: "ja-to-vi", term: "定型サービス", options: ["Dịch vụ cao cấp", "Dịch vụ miễn phí", "Dịch vụ giao hàng", "Dịch vụ tiêu chuẩn theo mẫu có sẵn"], correctIndex: 3 },
  { id: "vc-sm1-14", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Mỉm cười & giao tiếp bằng ánh mắt", options: ["ホスピタリティ", "スマイル＆アイコンタクト", "オペレーション", "スタンダード"], correctIndex: 1 },
  { id: "vc-sm1-15", chapterId: "sm-ch1", direction: "ja-to-vi", term: "みだしなみ", options: ["Tác phong, trang phục chỉnh tề", "Kỹ năng nấu ăn", "Tốc độ phục vụ", "Quản lý tồn kho"], correctIndex: 0 },
  { id: "vc-sm1-16", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Sự sạch sẽ (chữ C trong QSC)", options: ["クオリティ", "サービス", "クリンリネス", "アトモスフィア"], correctIndex: 2 },
  { id: "vc-sm1-17", chapterId: "sm-ch1", direction: "ja-to-vi", term: "同時同卓提供", options: ["Phục vụ lần lượt từng món", "Phục vụ đồng thời tất cả món trong cùng 1 bàn", "Giao hàng tận nơi", "Đặt bàn trước"], correctIndex: 1 },
  { id: "vc-sm1-18", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Quan hệ khách hàng (chăm sóc khách hàng thân thiết)", options: ["クリンリネス", "オペレーション", "マネジメント", "カスタマリーリレーション"], correctIndex: 3 },
  { id: "vc-sm1-19", chapterId: "sm-ch1", direction: "ja-to-vi", term: "水道光熱費", options: ["Chi phí điện, nước, gas", "Chi phí nhân công", "Chi phí nguyên liệu", "Chi phí thuê mặt bằng"], correctIndex: 0 },
  { id: "vc-sm1-20", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Phó cửa hàng trưởng", options: ["店長代理", "時間帯責任者", "副店長", "アルバイト"], correctIndex: 2 },
  { id: "vc-sm1-21", chapterId: "sm-ch1", direction: "ja-to-vi", term: "店長代理", options: ["Trợ lý bếp trưởng", "Người đại diện cửa hàng trưởng", "Quản lý kho", "Nhân viên thu ngân"], correctIndex: 1 },
  { id: "vc-sm1-22", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Sự quan tâm, để ý chu đáo", options: ["気持ち", "気分", "元気", "気配り"], correctIndex: 3 },
  { id: "vc-sm1-23", chapterId: "sm-ch1", direction: "ja-to-vi", term: "声（発声）", options: ["Giọng nói, cách lên tiếng khi phục vụ", "Âm nhạc nền trong quán", "Tiếng ồn từ bếp", "Giọng nói của khách hàng"], correctIndex: 0 },
  { id: "vc-sm1-24", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Động tác, cử chỉ (tư thế, chuyển động)", options: ["態度", "表情", "動作", "姿勢のみ"], correctIndex: 2 },
  { id: "vc-sm1-25", chapterId: "sm-ch1", direction: "ja-to-vi", term: "週間清掃作業", options: ["Dọn dẹp 1 lần/tháng", "Công việc dọn dẹp định kỳ hàng tuần", "Dọn dẹp cuối năm", "Dọn dẹp khi có khách phàn nàn"], correctIndex: 1 },
  { id: "vc-sm1-26", chapterId: "sm-ch1", direction: "vi-to-ja", term: "Bảo trì, bảo dưỡng (thiết bị)", options: ["クリンリネス", "トレーニング", "マネジメント", "メンテナンス"], correctIndex: 3 },

  // sm-ch2: gom từ bảng công thức/thuật ngữ quản lý số liệu (計数管理) + từ đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-sm2-1", chapterId: "sm-ch2", direction: "ja-to-vi", term: "人時売上高", options: ["Doanh thu mỗi giờ công", "Số khách mỗi giờ công", "Chi phí nhân công mỗi giờ", "Lợi nhuận gộp mỗi giờ công"], correctIndex: 0 },
  { id: "vc-sm2-2", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Năng suất mỗi giờ công (tính từ lợi nhuận gộp)", options: ["人時売上高", "人時接客数", "人時生産性", "原価率"], correctIndex: 2 },
  { id: "vc-sm2-3", chapterId: "sm-ch2", direction: "ja-to-vi", term: "原価率", options: ["Tỷ lệ lợi nhuận", "Tỷ lệ giá vốn", "Tỷ lệ nhân công", "Tỷ lệ thuê mặt bằng"], correctIndex: 1 },
  { id: "vc-sm2-4", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Số khách phục vụ được trong mỗi giờ công", options: ["人時売上高", "客単価", "人時接客数", "労働分配率"], correctIndex: 2 },
  { id: "vc-sm2-5", chapterId: "sm-ch2", direction: "ja-to-vi", term: "客単価", options: ["Tổng doanh thu ngày", "Số lượng khách", "Đơn giá trung bình mỗi khách", "Chi phí nguyên liệu"], correctIndex: 2 },
  { id: "vc-sm2-6", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Lợi nhuận gộp", options: ["原価高", "粗利益", "人件費", "売上高"], correctIndex: 1 },
  { id: "vc-sm2-7", chapterId: "sm-ch2", direction: "ja-to-vi", term: "労働分配率", options: ["Tỷ lệ nhân công phí chiếm trong lợi nhuận gộp", "Tỷ lệ giá vốn trong doanh thu", "Tỷ lệ khách quay lại", "Tỷ lệ chiết khấu"], correctIndex: 0 },
  { id: "vc-sm2-8", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Tỷ lệ giá vốn tiêu chuẩn (lý thuyết), còn gọi là Theoretical Cost Rate", options: ["原価率", "標準原価率", "労働分配率", "人時生産性"], correctIndex: 1 },
  { id: "vc-sm2-9", chapterId: "sm-ch2", direction: "ja-to-vi", term: "総労働時間", options: ["Tổng doanh thu", "Tổng số nhân viên", "Tổng giờ lao động", "Tổng số khách"], correctIndex: 2 },
  { id: "vc-sm2-10", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Bán hàng gợi ý, chào mời thêm món/đồ uống", options: ["サジェスティブセールス", "デリバリーサービス", "セルフサービス", "カスタマーサポート"], correctIndex: 0 },
  { id: "vc-sm2-11", chapterId: "sm-ch2", direction: "ja-to-vi", term: "繁忙月", options: ["Tháng thấp điểm", "Tháng cao điểm", "Tháng nghỉ lễ", "Tháng kiểm kê"], correctIndex: 1 },
  { id: "vc-sm2-12", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Tháng thấp điểm (vắng khách)", options: ["繁忙月", "閑散月", "決算月", "開店月"], correctIndex: 1 },
  { id: "vc-sm2-13", chapterId: "sm-ch2", direction: "ja-to-vi", term: "注文点数", options: ["Số món/số lượng đơn khách gọi", "Số lượng nhân viên phục vụ", "Số bàn trong quán", "Số lần khách quay lại"], correctIndex: 0 },
  { id: "vc-sm2-14", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Đơn giá trung bình mỗi món", options: ["客単価", "一品平均単価", "原価率", "人時売上高"], correctIndex: 1 },
  { id: "vc-sm2-15", chapterId: "sm-ch2", direction: "ja-to-vi", term: "原価高", options: ["Số tiền giá vốn thực tế", "Số tiền lãi ròng", "Số tiền thuê mặt bằng", "Số tiền thuế"], correctIndex: 0 },
  { id: "vc-sm2-16", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Chi phí nhân công", options: ["原価高", "人件費", "広告費", "水道光熱費"], correctIndex: 1 },
  { id: "vc-sm2-17", chapterId: "sm-ch2", direction: "ja-to-vi", term: "客数", options: ["Số lượng khách", "Số lượng món ăn", "Số lượng nhân viên", "Số lượng bàn"], correctIndex: 0 },
  { id: "vc-sm2-18", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Quản lý bằng số liệu, con số", options: ["品質管理", "計数管理", "在庫管理", "人事管理"], correctIndex: 1 },

  // sm-ch2 (bổ sung từ 参考２/参考３ — bài toán tính toán mẫu trang 7-12).
  { id: "vc-sm2-19", chapterId: "sm-ch2", direction: "ja-to-vi", term: "荒利益率", options: ["Tỷ lệ giá vốn", "Tỷ lệ lợi nhuận gộp", "Tỷ lệ nhân công", "Tỷ lệ hao hụt"], correctIndex: 1 },
  { id: "vc-sm2-20", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Tỷ lệ giá vốn tiêu chuẩn của từng món ăn riêng lẻ", options: ["原価率", "個別標準原価率", "標準原価率", "労働分配率"], correctIndex: 1 },
  { id: "vc-sm2-21", chapterId: "sm-ch2", direction: "ja-to-vi", term: "ロス額", options: ["Số tiền hao hụt (thực tế trừ tiêu chuẩn)", "Số tiền lãi ròng", "Số tiền chiết khấu", "Số tiền đầu tư"], correctIndex: 0 },
  { id: "vc-sm2-22", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Chênh lệch ngược (thực tế dùng ít nguyên liệu hơn tiêu chuẩn)", options: ["ロス", "逆ざや", "在庫過多", "販売機会損失"], correctIndex: 1 },
  { id: "vc-sm2-23", chapterId: "sm-ch2", direction: "ja-to-vi", term: "中間下げ", options: ["Dọn bớt bát đĩa giữa bữa ăn để giữ bàn gọn gàng", "Giảm giá giữa buổi", "Dọn bàn sau khi khách về", "Đổi thực đơn giữa mùa"], correctIndex: 0 },
  { id: "vc-sm2-24", chapterId: "sm-ch2", direction: "vi-to-ja", term: "Chuẩn bị sẵn sàng, túc trực (để phục vụ nhanh)", options: ["スタンバイ", "オリエンテーション", "トレーニング", "ミーティング"], correctIndex: 0 },

  // sm-ch3: gom từ mục 発注管理と検収（検品と収納）管理 (trang 13-16) + thuật ngữ đã dùng ở 3 dạng bài kia.
  { id: "vc-sm3-1", chapterId: "sm-ch3", direction: "ja-to-vi", term: "仕込み量", options: ["Số lượng khách", "Lượng nguyên liệu cần sơ chế trước", "Giá bán món ăn", "Số lượng nhân viên"], correctIndex: 1 },
  { id: "vc-sm3-2", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Chuẩn hóa (số lượng nhập hàng)", options: ["自動化", "標準化", "システム化", "多様化"], correctIndex: 1 },
  { id: "vc-sm3-3", chapterId: "sm-ch3", direction: "ja-to-vi", term: "配送スケジュール", options: ["Lịch làm việc của nhân viên", "Lịch giao hàng của nhà cung cấp", "Thực đơn theo mùa", "Lịch bảo trì thiết bị"], correctIndex: 1 },
  { id: "vc-sm3-4", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Lượng tồn kho hợp lý, đúng chuẩn", options: ["過剰在庫", "在庫切れ", "適正在庫量", "棚卸し"], correctIndex: 2 },
  { id: "vc-sm3-5", chapterId: "sm-ch3", direction: "ja-to-vi", term: "自動発注システム", options: ["Hệ thống chấm công", "Hệ thống đặt bàn online", "Hệ thống camera an ninh", "Hệ thống đặt hàng tự động"], correctIndex: 3 },
  { id: "vc-sm3-6", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Kiểm kê thực tế", options: ["検収作業", "実地棚卸し", "発注書", "納品書"], correctIndex: 1 },
  { id: "vc-sm3-7", chapterId: "sm-ch3", direction: "ja-to-vi", term: "検収", options: ["Thanh toán hóa đơn", "Kiểm nhận hàng (kiểm hàng + thu kho)", "Lập đơn đặt hàng", "Chấm công nhân viên"], correctIndex: 1 },
  { id: "vc-sm3-8", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Kiểm hàng (đối chiếu số lượng/chất lượng khi giao)", options: ["収納", "棚卸し", "検品", "発注"], correctIndex: 2 },
  { id: "vc-sm3-9", chapterId: "sm-ch3", direction: "ja-to-vi", term: "収納", options: ["Trả lại hàng", "Hủy đơn hàng", "Giảm giá", "Cất trữ vào kho"], correctIndex: 3 },
  { id: "vc-sm3-10", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Nhập trước xuất trước (nguyên tắc thu kho)", options: ["後入れ先出し", "先入れ先出し", "ランダム配置", "先入れ後出し"], correctIndex: 1 },
  { id: "vc-sm3-11", chapterId: "sm-ch3", direction: "ja-to-vi", term: "品質基準", options: ["Tiêu chuẩn giá bán", "Tiêu chuẩn tuyển dụng", "Tiêu chuẩn chất lượng (sản địa/hạng/quy cách/độ tươi...)", "Tiêu chuẩn vệ sinh cá nhân"], correctIndex: 2 },
  { id: "vc-sm3-12", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Tổn thất cơ hội bán hàng (hết hàng)", options: ["廃棄ロス", "見えないロス", "在庫過多", "販売機会損失"], correctIndex: 3 },
  { id: "vc-sm3-13", chapterId: "sm-ch3", direction: "ja-to-vi", term: "見えないロス", options: ["Hao hụt do hàng bị hỏng", "Lợi nhuận tăng thêm", "Hao hụt vô hình (do sai sót kiểm nhận, không phải hỏng hàng)", "Chi phí quảng cáo"], correctIndex: 2 },
  { id: "vc-sm3-14", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Tỷ lệ thành phẩm tiêu chuẩn (sau khi cắt/sơ chế)", options: ["標準原価率", "労働分配率", "廃棄率", "標準歩留まり"], correctIndex: 3 },
  { id: "vc-sm3-15", chapterId: "sm-ch3", direction: "ja-to-vi", term: "発注書", options: ["Phiếu giao hàng", "Hóa đơn thanh toán", "Đơn đặt hàng", "Phiếu kiểm kê"], correctIndex: 2 },
  { id: "vc-sm3-16", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Phiếu giao hàng (do nhà cung cấp xuất khi giao)", options: ["発注書", "請求書", "納品書", "領収書"], correctIndex: 2 },
  { id: "vc-sm3-17", chapterId: "sm-ch3", direction: "ja-to-vi", term: "現品", options: ["Hàng mẫu trưng bày", "Hàng bị trả lại", "Hàng đặt trước", "Hàng thực tế nhận được"], correctIndex: 3 },
  { id: "vc-sm3-18", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Độ tươi", options: ["熟成度", "鮮度", "格付け", "産地"], correctIndex: 1 },
  { id: "vc-sm3-19", chapterId: "sm-ch3", direction: "ja-to-vi", term: "熟成度", options: ["Độ tươi", "Độ mặn", "Độ chín/ủ (của thịt, rượu...)", "Độ đặc"], correctIndex: 2 },
  { id: "vc-sm3-20", chapterId: "sm-ch3", direction: "vi-to-ja", term: "Sản địa (nơi sản xuất/nuôi trồng)", options: ["格付け", "産地", "規格", "入り数"], correctIndex: 1 },

  // sm-ch4: gom từ mục 販売管理 (trang 16-17) + thuật ngữ đã dùng ở 3 dạng bài kia.
  { id: "vc-sm4-1", chapterId: "sm-ch4", direction: "ja-to-vi", term: "販売促進", options: ["Quản lý nhân sự", "Xúc tiến bán hàng", "Kiểm soát chất lượng", "Phòng cháy chữa cháy"], correctIndex: 1 },
  { id: "vc-sm4-2", chapterId: "sm-ch4", direction: "vi-to-ja", term: "Phân tích ABC (xếp menu theo doanh thu/số lượng bán)", options: ["QSC分析", "ABC分析", "SWOT分析", "5S分析"], correctIndex: 1 },
  { id: "vc-sm4-3", chapterId: "sm-ch4", direction: "ja-to-vi", term: "売れ筋", options: ["Món ế", "Món mới ra mắt", "Món bán chạy", "Món theo mùa"], correctIndex: 2 },
  { id: "vc-sm4-4", chapterId: "sm-ch4", direction: "vi-to-ja", term: "Cải tiến/thay đổi thực đơn", options: ["メニュー廃止", "メニュー撮影", "メニュー印刷", "メニュー改定"], correctIndex: 3 },
  { id: "vc-sm4-5", chapterId: "sm-ch4", direction: "ja-to-vi", term: "セット割引商品", options: ["Sản phẩm chỉ bán vào cuối tuần", "Sản phẩm giảm giá khi mua theo set nhiều món", "Sản phẩm cao cấp không giảm giá", "Sản phẩm dành riêng cho trẻ em"], correctIndex: 1 },
  { id: "vc-sm4-6", chapterId: "sm-ch4", direction: "vi-to-ja", term: "Khung giờ vắng khách (ngoài giờ ăn chính)", options: ["アイドルタイム", "ピークタイム", "ランチタイム", "ディナータイム"], correctIndex: 0 },
  { id: "vc-sm4-7", chapterId: "sm-ch4", direction: "ja-to-vi", term: "割引券", options: ["Hóa đơn", "Biên lai", "Phiếu giảm giá", "Hợp đồng"], correctIndex: 2 },
  { id: "vc-sm4-8", chapterId: "sm-ch4", direction: "vi-to-ja", term: "Khách quen quay lại nhiều lần", options: ["新規顧客", "リピーター", "固定費", "変動費"], correctIndex: 1 },
  { id: "vc-sm4-9", chapterId: "sm-ch4", direction: "ja-to-vi", term: "囲い込む", options: ["Sa thải nhân viên", "Mở rộng chi nhánh", "Giảm giá vốn", "Giữ chân (khách hàng)"], correctIndex: 3 },
  { id: "vc-sm4-10", chapterId: "sm-ch4", direction: "vi-to-ja", term: "Khai thác/mở rộng khách hàng mới", options: ["新規顧客開拓", "固定客維持", "在庫管理", "原価管理"], correctIndex: 0 },
  { id: "vc-sm4-11", chapterId: "sm-ch4", direction: "ja-to-vi", term: "宅配サービス", options: ["Dịch vụ đặt bàn", "Dịch vụ giao hàng tận nơi", "Dịch vụ giữ xe", "Dịch vụ bảo hành"], correctIndex: 1 },
  { id: "vc-sm4-12", chapterId: "sm-ch4", direction: "vi-to-ja", term: "Số hóa (thanh toán, đặt chỗ...)", options: ["標準化", "自動化", "電子化", "多様化"], correctIndex: 2 },
  { id: "vc-sm4-13", chapterId: "sm-ch4", direction: "ja-to-vi", term: "回転率", options: ["Tỷ lệ giá vốn", "Tỷ lệ nhân công", "Tỷ lệ quay vòng bàn (khách/bàn trong 1 khoảng thời gian)", "Tỷ lệ hao hụt"], correctIndex: 2 },
  { id: "vc-sm4-14", chapterId: "sm-ch4", direction: "vi-to-ja", term: "Khách hàng cố định (đến thường xuyên)", options: ["新規顧客", "準固定顧客", "固定顧客", "一見客"], correctIndex: 2 },
  { id: "vc-sm4-15", chapterId: "sm-ch4", direction: "ja-to-vi", term: "グループ客", options: ["Khách VIP", "Khách quen thân với quản lý", "Khách nước ngoài", "Khách đi theo nhóm/đoàn"], correctIndex: 3 },

  // sm-ch5: gom từ mục 顧客管理 (trang 17) + thuật ngữ đã dùng ở 3 dạng bài kia.
  { id: "vc-sm5-1", chapterId: "sm-ch5", direction: "ja-to-vi", term: "固定顧客", options: ["Khách hàng mới", "Khách quen cố định (đến thường xuyên)", "Khách bán cố định", "Khách vãng lai"], correctIndex: 1 },
  { id: "vc-sm5-2", chapterId: "sm-ch5", direction: "vi-to-ja", term: "Khách bán cố định (thỉnh thoảng đến)", options: ["固定顧客", "新規顧客", "準固定顧客", "一見客"], correctIndex: 2 },
  { id: "vc-sm5-3", chapterId: "sm-ch5", direction: "ja-to-vi", term: "新規顧客", options: ["Khách hàng mới", "Khách quen cố định", "Nhân viên mới", "Nhà cung cấp mới"], correctIndex: 0 },
  { id: "vc-sm5-4", chapterId: "sm-ch5", direction: "vi-to-ja", term: "Sự sụt giảm, hao mòn (số lượng khách)", options: ["増加", "目減り", "拡大", "向上"], correctIndex: 1 },
  { id: "vc-sm5-5", chapterId: "sm-ch5", direction: "ja-to-vi", term: "来店頻度", options: ["Tần suất khách đến quán", "Thời gian mở cửa", "Số lượng nhân viên", "Diện tích cửa hàng"], correctIndex: 0 },
  { id: "vc-sm5-6", chapterId: "sm-ch5", direction: "vi-to-ja", term: "Truyền miệng (giới thiệu qua bạn bè/người quen)", options: ["広告", "口コミ", "看板", "チラシ"], correctIndex: 1 },
  { id: "vc-sm5-7", chapterId: "sm-ch5", direction: "ja-to-vi", term: "推奨", options: ["Giới thiệu, khuyên dùng", "Từ chối", "Cấm đoán", "Xóa bỏ"], correctIndex: 0 },
  { id: "vc-sm5-8", chapterId: "sm-ch5", direction: "vi-to-ja", term: "Lưu lượng giao thông, người qua lại", options: ["交通量", "客単価", "回転率", "在庫量"], correctIndex: 0 },
  { id: "vc-sm5-9", chapterId: "sm-ch5", direction: "ja-to-vi", term: "顧客管理", options: ["Quản lý khách hàng", "Quản lý nhân sự", "Quản lý kho", "Quản lý phòng cháy"], correctIndex: 0 },
  { id: "vc-sm5-10", chapterId: "sm-ch5", direction: "vi-to-ja", term: "Khách vãng lai (đến 1 lần, không quen biết)", options: ["固定顧客", "準固定顧客", "リピーター", "一見客"], correctIndex: 3 },

  // sm-ch6: gom từ mục 雇用管理 (trang 18-19) + thuật ngữ đã dùng ở 3 dạng bài kia.
  { id: "vc-sm6-1", chapterId: "sm-ch6", direction: "ja-to-vi", term: "割増賃金", options: ["Lương cơ bản", "Lương phụ trội (làm thêm/đêm/ngày nghỉ)", "Tiền thưởng cuối năm", "Phí bảo hiểm"], correctIndex: 1 },
  { id: "vc-sm6-2", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Làm thêm giờ (vượt giờ quy định)", options: ["深夜労働", "時間外労働", "休日労働", "所定労働"], correctIndex: 1 },
  { id: "vc-sm6-3", chapterId: "sm-ch6", direction: "ja-to-vi", term: "深夜労働", options: ["Làm việc buổi sáng sớm", "Làm việc cuối tuần", "Lao động ban đêm (22h-5h sáng)", "Làm việc ngoài trời"], correctIndex: 2 },
  { id: "vc-sm6-4", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Thỏa ước lao động theo Điều 36 (cho phép làm thêm giờ)", options: ["就業規則", "雇用契約書", "36協定", "労働条件通知書"], correctIndex: 2 },
  { id: "vc-sm6-5", chapterId: "sm-ch6", direction: "ja-to-vi", term: "労働基準監督署", options: ["Cục Thuế", "Sở Y tế", "Cục Xuất nhập cảnh", "Sở Giám sát Tiêu chuẩn Lao động"], correctIndex: 3 },
  { id: "vc-sm6-6", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Giờ nghỉ giữa ca", options: ["休日", "有給休暇", "残業時間", "休憩時間"], correctIndex: 3 },
  { id: "vc-sm6-7", chapterId: "sm-ch6", direction: "ja-to-vi", term: "有給休暇", options: ["Nghỉ không lương", "Nghỉ phép có lương", "Nghỉ thai sản", "Nghỉ ốm"], correctIndex: 1 },
  { id: "vc-sm6-8", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Quyền thay đổi thời điểm nghỉ (của người sử dụng lao động)", options: ["解雇権", "時季変更権", "指揮命令権", "懲戒権"], correctIndex: 1 },
  { id: "vc-sm6-9", chapterId: "sm-ch6", direction: "ja-to-vi", term: "勤続年数", options: ["Số giờ làm trong ngày", "Số lần nghỉ phép", "Số năm thâm niên làm việc", "Số lượng nhân viên"], correctIndex: 2 },
  { id: "vc-sm6-10", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Sơ yếu lý lịch", options: ["契約書", "履歴書", "領収書", "報告書"], correctIndex: 1 },
  { id: "vc-sm6-11", chapterId: "sm-ch6", direction: "ja-to-vi", term: "希望職種", options: ["Mức lương mong muốn", "Vị trí công việc mong muốn", "Khu vực sinh sống", "Trình độ học vấn"], correctIndex: 1 },
  { id: "vc-sm6-12", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Giờ vào ca/tan ca (chấm công)", options: ["有給休暇", "時間外労働", "休憩時間", "出退勤"], correctIndex: 3 },
  { id: "vc-sm6-13", chapterId: "sm-ch6", direction: "ja-to-vi", term: "オリエンテーション", options: ["Buổi họp cổ đông", "Buổi kiểm toán", "Buổi định hướng nhân viên mới", "Buổi phỏng vấn"], correctIndex: 2 },
  { id: "vc-sm6-14", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Nội quy cửa hàng (dành cho nhân viên)", options: ["就業規則", "36協定", "契約書", "ハウスルール"], correctIndex: 3 },
  { id: "vc-sm6-15", chapterId: "sm-ch6", direction: "ja-to-vi", term: "ストアツアー", options: ["Chuyến du lịch công ty", "Buổi kiểm tra vệ sinh", "Buổi họp toàn công ty", "Tham quan giới thiệu cửa hàng cho nhân viên mới"], correctIndex: 3 },
  { id: "vc-sm6-16", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Tác phong, vẻ ngoài chỉnh tề", options: ["接客態度", "清掃作業", "在庫管理", "身だしなみ"], correctIndex: 3 },
  { id: "vc-sm6-17", chapterId: "sm-ch6", direction: "ja-to-vi", term: "教育訓練プログラム", options: ["Chương trình khuyến mãi", "Chương trình bảo hiểm", "Chương trình đào tạo huấn luyện", "Chương trình từ thiện"], correctIndex: 2 },
  { id: "vc-sm6-18", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Toàn bộ ngày công (dùng để tính tỷ lệ đi làm)", options: ["有給休暇", "休日", "残業日", "全労働日"], correctIndex: 3 },
  { id: "vc-sm6-19", chapterId: "sm-ch6", direction: "ja-to-vi", term: "定型サービス", options: ["Dịch vụ cao cấp riêng biệt", "Dịch vụ miễn phí", "Dịch vụ giao hàng", "Dịch vụ tiêu chuẩn theo mẫu có sẵn"], correctIndex: 3 },
  { id: "vc-sm6-20", chapterId: "sm-ch6", direction: "vi-to-ja", term: "Giờ lao động quy định (theo hợp đồng)", options: ["時間外労働", "深夜労働", "休憩時間", "所定労働時間"], correctIndex: 3 },

  // sm-ch7: gom từ mục 人材の育成指導 (trang 20-21) + thuật ngữ đã dùng ở 3 dạng bài kia.
  { id: "vc-sm7-1", chapterId: "sm-ch7", direction: "ja-to-vi", term: "トレーニー", options: ["Học viên (người được đào tạo)", "Huấn luyện viên", "Quản lý cửa hàng", "Ứng viên phỏng vấn"], correctIndex: 0 },
  { id: "vc-sm7-2", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Huấn luyện viên (người đào tạo)", options: ["トレーニー", "トレーナー", "マネージャー", "オーナー"], correctIndex: 1 },
  { id: "vc-sm7-3", chapterId: "sm-ch7", direction: "ja-to-vi", term: "マンツーマン", options: ["Đào tạo theo nhóm lớn", "Đào tạo trực tuyến", "Đào tạo 1 kèm 1", "Đào tạo qua tài liệu"], correctIndex: 2 },
  { id: "vc-sm7-4", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Khơi mở, phát triển thêm (giai đoạn cuối trong 4 giai đoạn đào tạo)", options: ["教育", "導入", "訓練", "啓発"], correctIndex: 3 },
  { id: "vc-sm7-5", chapterId: "sm-ch7", direction: "ja-to-vi", term: "体得", options: ["Ghi nhớ máy móc", "Thấm nhuần, tiếp thu qua thực hành", "Quên đi", "Từ chối học"], correctIndex: 1 },
  { id: "vc-sm7-6", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Khuôn mẫu, hình mẫu chuẩn (trong dịch vụ tiếp khách)", options: ["質", "量", "型", "時間"], correctIndex: 2 },
  { id: "vc-sm7-7", chapterId: "sm-ch7", direction: "ja-to-vi", term: "ホスピタリティサービス", options: ["Dịch vụ tự động hóa", "Dịch vụ hiếu khách, tận tâm", "Dịch vụ giao hàng nhanh", "Dịch vụ miễn phí"], correctIndex: 1 },
  { id: "vc-sm7-8", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Luyện phát âm, luyện giọng", options: ["筋力トレーニング", "発声練習", "計算練習", "暗記練習"], correctIndex: 1 },
  { id: "vc-sm7-9", chapterId: "sm-ch7", direction: "ja-to-vi", term: "掲示（トレーニングの4ステップ②）", options: ["Kiểm tra hồ sơ", "Ký hợp đồng", "Trình diễn — huấn luyện viên làm mẫu", "Nghỉ giải lao"], correctIndex: 2 },
  { id: "vc-sm7-10", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Áp dụng — để học viên tự làm (bước 3 trong 4 bước đào tạo)", options: ["導入", "掲示", "適用", "フォローアップ"], correctIndex: 2 },
  { id: "vc-sm7-11", chapterId: "sm-ch7", direction: "ja-to-vi", term: "フォローアップ", options: ["Theo dõi và hỗ trợ tiếp sau đào tạo", "Sa thải nhân viên", "Tuyển dụng mới", "Tính lương"], correctIndex: 0 },
  { id: "vc-sm7-12", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Tông giọng, chất âm và ngữ điệu", options: ["語調", "トーン", "態度", "表情"], correctIndex: 1 },
  { id: "vc-sm7-13", chapterId: "sm-ch7", direction: "ja-to-vi", term: "語調", options: ["Nhịp điệu/giọng điệu khi nói và độ mạnh yếu cuối câu", "Chất âm và cao độ", "Trang phục khi phục vụ", "Tốc độ đi lại"], correctIndex: 0 },
  { id: "vc-sm7-14", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Đào tạo thực địa (tại hiện trường)", options: ["OFFJT", "OJT", "オリエンテーション", "ストアツアー"], correctIndex: 1 },
  { id: "vc-sm7-15", chapterId: "sm-ch7", direction: "ja-to-vi", term: "OFFJT", options: ["Đào tạo lý thuyết/kiến thức, tập trung ngoài hiện trường", "Đào tạo chỉ có 1 buổi", "Đào tạo bằng cách sa thải thử", "Đào tạo chỉ dành cho quản lý"], correctIndex: 0 },
  { id: "vc-sm7-16", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Luyện tập lặp lại (giai đoạn 3 trong 4 giai đoạn đào tạo)", options: ["教育", "導入", "訓練", "啓発"], correctIndex: 2 },
  { id: "vc-sm7-17", chapterId: "sm-ch7", direction: "ja-to-vi", term: "導入（人材育成の基本体系）", options: ["Định hướng", "Khơi gợi tiềm năng", "Luyện tập lặp lại", "Phát triển thêm"], correctIndex: 0 },
  { id: "vc-sm7-18", chapterId: "sm-ch7", direction: "vi-to-ja", term: "Ánh mắt (một trong các điểm cần kiểm tra khi huấn luyện)", options: ["視線", "姿勢", "手の使い方", "声の出し方"], correctIndex: 0 },

  // sm-ch8: gom từ mục 防火・防災管理 (trang 22-24) + 参考６ マネジメント基本用語 (trang 27, thuật ngữ chưa dùng ở chương trước).
  { id: "vc-sm8-1", chapterId: "sm-ch8", direction: "ja-to-vi", term: "防火管理者", options: ["Nhân viên cứu hỏa", "Cảnh sát khu vực", "Quản lý phòng cháy", "Thanh tra xây dựng"], correctIndex: 2 },
  { id: "vc-sm8-2", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Đội cứu hỏa tự vệ (nội bộ cửa hàng)", options: ["消防署", "自衛消防隊", "警察署", "救急隊"], correctIndex: 1 },
  { id: "vc-sm8-3", chapterId: "sm-ch8", direction: "ja-to-vi", term: "燃焼", options: ["Sự đông lạnh", "Sự lên men", "Sự cháy, quá trình đốt cháy", "Sự bay hơi"], correctIndex: 2 },
  { id: "vc-sm8-4", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Dập lửa, chữa cháy", options: ["消火", "延焼", "発火", "点火"], correctIndex: 0 },
  { id: "vc-sm8-5", chapterId: "sm-ch8", direction: "ja-to-vi", term: "鎮火", options: ["Bắt đầu cháy", "Dập tắt hoàn toàn đám cháy", "Cháy lan", "Khói bốc lên"], correctIndex: 1 },
  { id: "vc-sm8-6", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Đèn báo hướng thoát hiểm", options: ["防犯カメラ", "非常口", "誘導灯", "消火栓"], correctIndex: 2 },
  { id: "vc-sm8-7", chapterId: "sm-ch8", direction: "ja-to-vi", term: "不審者", options: ["Khách VIP", "Nhân viên mới", "Kẻ khả nghi", "Thanh tra nhà nước"], correctIndex: 2 },
  { id: "vc-sm8-8", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Điểm mù, điểm khuất tầm nhìn", options: ["出入口", "誘導灯", "死角", "非常階段"], correctIndex: 2 },
  { id: "vc-sm8-9", chapterId: "sm-ch8", direction: "ja-to-vi", term: "火災報知器", options: ["Máy báo cháy", "Máy rửa bát", "Máy tính tiền", "Máy điều hòa"], correctIndex: 0 },
  { id: "vc-sm8-10", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Cảm biến khói", options: ["温度計", "湿度計", "騒音計", "煙感知器"], correctIndex: 3 },
  { id: "vc-sm8-11", chapterId: "sm-ch8", direction: "ja-to-vi", term: "配電盤", options: ["Tủ lạnh", "Bồn rửa", "Tủ điện, bảng phân phối điện", "Bếp gas"], correctIndex: 2 },
  { id: "vc-sm8-12", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Thông báo (cho cơ quan cứu hỏa)", options: ["避難", "監視", "点検", "通報"], correctIndex: 3 },
  { id: "vc-sm8-13", chapterId: "sm-ch8", direction: "ja-to-vi", term: "オペレーション（参考６）", options: ["Chỉ riêng công việc thu ngân", "Chỉ riêng công việc nấu ăn", "Chỉ riêng công việc dọn dẹp", "Toàn bộ công việc vận hành tại cửa hàng"], correctIndex: 3 },
  { id: "vc-sm8-14", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Chuẩn mực/tiêu chuẩn QSC riêng của doanh nghiệp (参考６)", options: ["マニュアル", "スタンダード", "レギュレーション", "ガイドライン"], correctIndex: 1 },
  { id: "vc-sm8-15", chapterId: "sm-ch8", direction: "ja-to-vi", term: "人事考課（参考６）", options: ["Tính lương tháng", "Đánh giá thành tích/năng lực công việc của cấp dưới", "Tuyển dụng nhân viên mới", "Đào tạo kỹ năng mới"], correctIndex: 1 },
  { id: "vc-sm8-16", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Chương trình đào tạo kỹ thuật vận hành cửa hàng (参考６)", options: ["マネジメントサイクル", "予算制度", "労働分配率", "トレーニングプログラム"], correctIndex: 3 },
  { id: "vc-sm8-17", chapterId: "sm-ch8", direction: "ja-to-vi", term: "マネジメントサイクル（参考６）", options: ["Chu kỳ kiểm kê hàng tháng", "Chu kỳ thay ca nhân viên", "Chu trình quản lý Plan-Do-Check-Action", "Chu kỳ bảo trì thiết bị"], correctIndex: 2 },
  { id: "vc-sm8-18", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Chế độ ngân sách theo kế hoạch kinh doanh (参考６)", options: ["労働生産性", "経営理念", "ワークスケジュール", "予算制度"], correctIndex: 3 },
  { id: "vc-sm8-19", chapterId: "sm-ch8", direction: "ja-to-vi", term: "ワークスケジュール（参考６）", options: ["Thực đơn theo mùa", "Sổ tay phòng cháy", "Danh sách nhà cung cấp", "Bảng phân công giờ làm việc theo cá nhân/khung giờ"], correctIndex: 3 },
  { id: "vc-sm8-20", chapterId: "sm-ch8", direction: "vi-to-ja", term: "Năng suất lao động (lợi nhuận gộp/nhân viên) — khác với 人時生産性 (参考６)", options: ["労働分配率", "原価率", "回転率", "労働生産性"], correctIndex: 3 },

  // hy-ch1: gom từ mục 食品衛生の現状 (trang 1-2).
  { id: "vc-hy1-1", chapterId: "hy-ch1", direction: "ja-to-vi", term: "食品衛生法", options: ["Luật Lao động", "Luật Vệ sinh Thực phẩm", "Luật Thuế", "Luật Doanh nghiệp"], correctIndex: 1 },
  { id: "vc-hy1-2", chapterId: "hy-ch1", direction: "vi-to-ja", term: "Ngộ độc thực phẩm", options: ["食物アレルギー", "異物混入", "食中毒", "食品ロス"], correctIndex: 2 },
  { id: "vc-hy1-3", chapterId: "hy-ch1", direction: "ja-to-vi", term: "有害微生物", options: ["Chất phụ gia an toàn", "Vi sinh vật có hại", "Chất bảo quản tự nhiên", "Enzyme tiêu hóa"], correctIndex: 1 },
  { id: "vc-hy1-4", chapterId: "hy-ch1", direction: "vi-to-ja", term: "Vi khuẩn", options: ["ウイルス", "細菌", "寄生虫", "カビ"], correctIndex: 1 },
  { id: "vc-hy1-5", chapterId: "hy-ch1", direction: "ja-to-vi", term: "ウイルス", options: ["Vi khuẩn", "Ký sinh trùng", "Virus", "Nấm mốc"], correctIndex: 2 },
  { id: "vc-hy1-6", chapterId: "hy-ch1", direction: "vi-to-ja", term: "Ký sinh trùng", options: ["細菌", "ウイルス", "寄生虫", "カビ"], correctIndex: 2 },
  { id: "vc-hy1-7", chapterId: "hy-ch1", direction: "ja-to-vi", term: "アニサキス", options: ["Vi khuẩn trong thịt sống", "Virus lây qua đường hô hấp", "Ký sinh trùng thường có trong hải sản", "Nấm mốc trên bánh mì"], correctIndex: 2 },
  { id: "vc-hy1-8", chapterId: "hy-ch1", direction: "vi-to-ja", term: "Norovirus (virus gây ngộ độc phổ biến, nhiều bệnh nhân nhất)", options: ["アニサキス", "カンピロバクター", "ノロウイルス", "サルモネラ属菌"], correctIndex: 2 },
  { id: "vc-hy1-9", chapterId: "hy-ch1", direction: "ja-to-vi", term: "カンピロバクター", options: ["Virus cúm", "Ký sinh trùng trong rau", "Nấm mốc trong gạo", "Vi khuẩn Campylobacter (thường trong thịt gà sống)"], correctIndex: 3 },
  { id: "vc-hy1-10", chapterId: "hy-ch1", direction: "vi-to-ja", term: "Dị vật lẫn trong thức ăn", options: ["食物アレルギー", "食中毒", "食品ロス", "異物混入"], correctIndex: 3 },
  { id: "vc-hy1-11", chapterId: "hy-ch1", direction: "ja-to-vi", term: "食物アレルギー", options: ["Ngộ độc rượu", "Thiếu vitamin", "Ngộ độc thực phẩm", "Dị ứng thực phẩm"], correctIndex: 3 },

  // hy-ch2: gom từ mục 食中毒予防の3原則と5S活動 (trang 3-4).
  { id: "vc-hy2-1", chapterId: "hy-ch2", direction: "ja-to-vi", term: "つけない", options: ["Không để nhiễm vi sinh vật vào thực phẩm", "Không để sinh sôi", "Tiêu diệt bằng nhiệt", "Không để hết hạn"], correctIndex: 0 },
  { id: "vc-hy2-2", chapterId: "hy-ch2", direction: "vi-to-ja", term: "Không để sinh sôi (nguyên tắc 2 trong 3 nguyên tắc)", options: ["つけない", "増やさない", "やっつける", "ひろげない"], correctIndex: 1 },
  { id: "vc-hy2-3", chapterId: "hy-ch2", direction: "ja-to-vi", term: "やっつける", options: ["Không để nhiễm", "Không để sinh sôi", "Tiêu diệt vi sinh vật bằng nhiệt", "Bảo quản lạnh"], correctIndex: 2 },
  { id: "vc-hy2-4", chapterId: "hy-ch2", direction: "vi-to-ja", term: "Lây nhiễm liều lượng nhỏ (chỉ cần ít vi sinh vật đã gây bệnh)", options: ["二次汚染", "不顕性感染", "食中毒", "少量感染"], correctIndex: 3 },
  { id: "vc-hy2-5", chapterId: "hy-ch2", direction: "ja-to-vi", term: "二次汚染", options: ["Ô nhiễm chéo/lây lan (từ nguồn này sang thực phẩm khác)", "Ô nhiễm lần đầu duy nhất", "Ô nhiễm không khí", "Ô nhiễm nước biển"], correctIndex: 0 },
  { id: "vc-hy2-6", chapterId: "hy-ch2", direction: "vi-to-ja", term: "Nhiễm không triệu chứng (người mang mầm bệnh nhưng không biểu hiện)", options: ["少量感染", "二次汚染", "不顕性感染", "食中毒"], correctIndex: 2 },
  { id: "vc-hy2-7", chapterId: "hy-ch2", direction: "ja-to-vi", term: "腸管出血性大腸菌", options: ["Vi khuẩn E.coli xuất huyết đường ruột (O157)", "Virus cúm mùa", "Ký sinh trùng đường ruột", "Nấm mốc gan"], correctIndex: 0 },
  { id: "vc-hy2-8", chapterId: "hy-ch2", direction: "vi-to-ja", term: "Dung dịch natri hypoclorit (chất khử trùng phổ biến trong bếp)", options: ["エタノール", "次亜塩素酸ナトリウム", "重曹", "食塩水"], correctIndex: 1 },
  { id: "vc-hy2-9", chapterId: "hy-ch2", direction: "ja-to-vi", term: "整理（5Sの①）", options: ["Xử lý bỏ đồ không cần, làm rõ số lượng đồ cần thiết", "Cất đồ ở vị trí cố định", "Loại bỏ rác/vết bẩn", "Tạo thói quen duy trì"], correctIndex: 0 },
  { id: "vc-hy2-10", chapterId: "hy-ch2", direction: "vi-to-ja", term: "Vị trí cố định để cất đồ (dùng xong phải trả về đây)", options: ["収納場所", "定位置", "保管庫", "作業台"], correctIndex: 1 },
  { id: "vc-hy2-11", chapterId: "hy-ch2", direction: "ja-to-vi", term: "清潔（5Sの④）", options: ["Xử lý bỏ đồ không cần", "Cất đồ ở vị trí cố định", "Giữ cơ sở luôn trong môi trường sạch sẽ (nhờ 3S trước)", "Tạo thói quen duy trì"], correctIndex: 2 },
  { id: "vc-hy2-12", chapterId: "hy-ch2", direction: "vi-to-ja", term: "Trạng thái cấp đông vẫn tiêu diệt được (đặc điểm riêng của ký sinh trùng)", options: ["加熱でのみ死滅", "冷凍でも死滅", "常温で死滅", "死滅させる方法なし"], correctIndex: 1 },

  // hy-ch3: gom từ mục HACCPに沿った衛生管理 (trang 5-6).
  { id: "vc-hy3-1", chapterId: "hy-ch3", direction: "ja-to-vi", term: "HACCP", options: ["Hệ thống quản lý an toàn thực phẩm theo phân tích mối nguy và điểm kiểm soát tới hạn", "Hệ thống tính lương", "Hệ thống đặt bàn online", "Hệ thống bảo hiểm y tế"], correctIndex: 0 },
  { id: "vc-hy3-2", chapterId: "hy-ch3", direction: "vi-to-ja", term: "Tiêu chuẩn quản lý vệ sinh chung (mọi doanh nghiệp tuân thủ như nhau)", options: ["個別衛生管理基準", "一般的な衛生管理の基準", "重要工程管理の基準", "販売基準"], correctIndex: 1 },
  { id: "vc-hy3-3", chapterId: "hy-ch3", direction: "ja-to-vi", term: "重要工程管理", options: ["Quản lý công đoạn thông thường", "Quản lý lương nhân viên", "Quản lý công đoạn đặc biệt quan trọng để ngăn nguy hại vệ sinh", "Quản lý thực đơn"], correctIndex: 2 },
  { id: "vc-hy3-4", chapterId: "hy-ch3", direction: "vi-to-ja", term: "Ủy ban Tiêu chuẩn Thực phẩm chung của FAO/WHO (đặt ra HACCP 7 nguyên tắc)", options: ["WTO委員会", "コーデックス委員会", "ILO委員会", "UNESCO委員会"], correctIndex: 1 },
  { id: "vc-hy3-5", chapterId: "hy-ch3", direction: "ja-to-vi", term: "危害要因", options: ["Yếu tố có thể gây nguy hại vệ sinh thực phẩm", "Yếu tố tăng doanh thu", "Yếu tố giảm chi phí", "Yếu tố tăng lương"], correctIndex: 0 },
  { id: "vc-hy3-6", chapterId: "hy-ch3", direction: "vi-to-ja", term: "Điểm quản lý quan trọng (công đoạn bắt buộc phải kiểm soát)", options: ["管理措置", "重要管理点", "検証", "モニタリング"], correctIndex: 1 },
  { id: "vc-hy3-7", chapterId: "hy-ch3", direction: "ja-to-vi", term: "管理基準", options: ["Tiêu chuẩn cụ thể để ngăn/loại trừ/giảm yếu tố nguy hại tại điểm quản lý quan trọng", "Tiêu chuẩn tuyển dụng", "Tiêu chuẩn định giá", "Tiêu chuẩn đồng phục"], correctIndex: 0 },
  { id: "vc-hy3-8", chapterId: "hy-ch3", direction: "vi-to-ja", term: "Giám sát liên tục/định kỳ tình trạng quản lý (Monitoring)", options: ["検証", "改善措置", "モニタリング", "記録"], correctIndex: 2 },
  { id: "vc-hy3-9", chapterId: "hy-ch3", direction: "ja-to-vi", term: "改善措置", options: ["Biện pháp áp dụng khi lệch khỏi tiêu chuẩn quản lý", "Biện pháp tăng giá", "Biện pháp tuyển dụng", "Biện pháp quảng cáo"], correctIndex: 0 },
  { id: "vc-hy3-10", chapterId: "hy-ch3", direction: "vi-to-ja", term: "Kiểm chứng định kỳ hiệu quả các biện pháp", options: ["モニタリング", "改善措置", "危害要因分析", "検証"], correctIndex: 3 },
  { id: "vc-hy3-11", chapterId: "hy-ch3", direction: "ja-to-vi", term: "手引書", options: ["Sổ tay hướng dẫn (quy trình cụ thể)", "Hóa đơn", "Hợp đồng lao động", "Thực đơn"], correctIndex: 0 },
  { id: "vc-hy3-12", chapterId: "hy-ch3", direction: "vi-to-ja", term: "Phiếu giám sát vệ sinh thực phẩm (căn cứ chấm điểm khi thanh tra)", options: ["契約書", "食品衛生監視票", "履歴書", "見積書"], correctIndex: 1 },
  { id: "vc-hy3-13", chapterId: "hy-ch3", direction: "ja-to-vi", term: "弾力的運用", options: ["Áp dụng linh hoạt (cho doanh nghiệp nhỏ)", "Áp dụng cứng nhắc duy nhất 1 cách", "Không áp dụng gì cả", "Áp dụng chỉ 1 lần duy nhất"], correctIndex: 0 },
  { id: "vc-hy3-14", chapterId: "hy-ch3", direction: "vi-to-ja", term: "Kế hoạch quản lý vệ sinh", options: ["経営計画", "衛生管理計画", "販売計画", "採用計画"], correctIndex: 1 },
  { id: "vc-hy3-15", chapterId: "hy-ch3", direction: "ja-to-vi", term: "検食", options: ["Nếm thử/lưu mẫu món ăn trước khi phục vụ hàng loạt (cơ sở nấu ăn quy mô lớn)", "Kiểm tra sức khỏe nhân viên", "Kiểm kê hàng tồn kho", "Kiểm tra hóa đơn"], correctIndex: 0 },

  // hy-ch4: gom từ mục 一般的な衛生管理の基準14項目の詳細 (trang 7-30, chương dài nhất — 25 từ vựng).
  { id: "vc-hy4-1", chapterId: "hy-ch4", direction: "ja-to-vi", term: "バイオフィルム", options: ["Lớp phủ nhựa bảo vệ dụng cụ", "Màng bọc thực phẩm", "Cấu trúc màng sinh học do vi sinh vật tạo ra, khó rửa trôi", "Lớp sơn chống gỉ"], correctIndex: 2 },
  { id: "vc-hy4-2", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Chất tẩy rửa trung tính", options: ["アルカリ性洗浄剤", "酸性洗浄剤", "中性洗剤", "漂白剤"], correctIndex: 2 },
  { id: "vc-hy4-3", chapterId: "hy-ch4", direction: "ja-to-vi", term: "グリスフィルター", options: ["Bộ lọc nước uống", "Bộ lọc không khí phòng ngủ", "Bộ lọc mỡ trong máy hút mùi bếp", "Bộ lọc cà phê"], correctIndex: 2 },
  { id: "vc-hy4-4", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Khử trùng bằng nhiệt (đun sôi/gia nhiệt)", options: ["薬剤消毒", "加熱消毒", "紫外線消毒", "自然乾燥"], correctIndex: 1 },
  { id: "vc-hy4-5", chapterId: "hy-ch4", direction: "ja-to-vi", term: "校正（温度計の）", options: ["Vứt bỏ nhiệt kế cũ", "Mua nhiệt kế mới", "Hiệu chỉnh/kiểm tra độ chính xác của nhiệt kế", "Cho mượn nhiệt kế"], correctIndex: 2 },
  { id: "vc-hy4-6", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Bồn chứa nước (cần vệ sinh định kỳ)", options: ["下水道", "貯水槽", "排水溝", "給水栓"], correctIndex: 1 },
  { id: "vc-hy4-7", chapterId: "hy-ch4", direction: "ja-to-vi", term: "残留塩素", options: ["Lượng đường dư trong nước ngọt", "Độ pH của nước", "Nhiệt độ nước", "Nồng độ clo dư (trong nước đã khử trùng)"], correctIndex: 3 },
  { id: "vc-hy4-8", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Chuột leo trèo (giỏi di chuyển thẳng đứng)", options: ["ドブねずみ", "クマねずみ", "野ねずみ", "ハツカネズミ"], correctIndex: 1 },
  { id: "vc-hy4-9", chapterId: "hy-ch4", direction: "ja-to-vi", term: "ドブねずみ", options: ["Chuột leo trèo giỏi", "Chuột lang cảnh", "Chuột cống (kém di chuyển lên xuống)", "Sóc"], correctIndex: 2 },
  { id: "vc-hy4-10", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Luật Xử lý chất thải và Vệ sinh", options: ["食品衛生法", "廃棄物の処理及び清掃に関する法律", "下水道法", "労働基準法"], correctIndex: 1 },
  { id: "vc-hy4-11", chapterId: "hy-ch4", direction: "ja-to-vi", term: "事業系一般廃棄物", options: ["Rác thải công nghiệp nặng", "Rác thải phóng xạ", "Rác thải sinh hoạt thông thường từ hoạt động kinh doanh", "Rác thải y tế"], correctIndex: 2 },
  { id: "vc-hy4-12", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Người mang mầm bệnh không triệu chứng", options: ["食品衛生責任者", "無症状病原体保有者", "食品取扱者", "衛生管理者"], correctIndex: 1 },
  { id: "vc-hy4-13", chapterId: "hy-ch4", direction: "ja-to-vi", term: "特定原材料", options: ["8 nguyên liệu bắt buộc ghi nhãn dị ứng (tôm, cua, lúa mì...)", "Nguyên liệu nhập khẩu", "Nguyên liệu hữu cơ", "Nguyên liệu đắt tiền nhất"], correctIndex: 0 },
  { id: "vc-hy4-14", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Chất gây dị ứng (Allergen)", options: ["添加物", "アレルゲン", "保存料", "着色料"], correctIndex: 1 },
  { id: "vc-hy4-15", chapterId: "hy-ch4", direction: "ja-to-vi", term: "食品リコール", options: ["Thu hồi thực phẩm", "Khuyến mãi thực phẩm", "Nhập khẩu thực phẩm", "Xuất khẩu thực phẩm"], correctIndex: 0 },
  { id: "vc-hy4-16", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Vạch giới hạn trưng bày hàng (tủ lạnh/tủ đông)", options: ["賞味期限", "消費期限", "ロードライン", "陳列棚"], correctIndex: 2 },
  { id: "vc-hy4-17", chapterId: "hy-ch4", direction: "ja-to-vi", term: "予冷", options: ["Làm lạnh trước (xe/container trước khi chất hàng)", "Làm nóng trước khi phục vụ", "Ướp lạnh thực phẩm sống", "Rã đông tự nhiên"], correctIndex: 0 },
  { id: "vc-hy4-18", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Khu vực sơ chế (trong bố trí bếp)", options: ["盛り付け場", "洗い場", "下処理作業場", "納品口"], correctIndex: 2 },
  { id: "vc-hy4-19", chapterId: "hy-ch4", direction: "ja-to-vi", term: "検便", options: ["Xét nghiệm phân (kiểm tra vi khuẩn đường ruột)", "Xét nghiệm máu", "Xét nghiệm nước tiểu", "Đo huyết áp"], correctIndex: 0 },
  { id: "vc-hy4-20", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Phòng thay đồ nhân viên", options: ["更衣室", "休憩室", "会議室", "倉庫"], correctIndex: 0 },
  { id: "vc-hy4-21", chapterId: "hy-ch4", direction: "ja-to-vi", term: "ドライシステム", options: ["Hệ thống sàn khô (không để nước đọng khi vận hành)", "Hệ thống sấy khô quần áo", "Hệ thống lọc không khí", "Hệ thống báo cháy"], correctIndex: 0 },
  { id: "vc-hy4-22", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Bẫy dính (bắt gián/côn trùng)", options: ["殺虫剤", "粘着トラップ", "燻煙剤", "忌避剤"], correctIndex: 1 },
  { id: "vc-hy4-23", chapterId: "hy-ch4", direction: "ja-to-vi", term: "グリストラップ", options: ["Bẫy tách dầu mỡ trong hệ thống thoát nước bếp", "Bẫy chuột", "Bẫy ruồi", "Bẫy gián"], correctIndex: 0 },
  { id: "vc-hy4-24", chapterId: "hy-ch4", direction: "vi-to-ja", term: "Yếu tố nguy hại vệ sinh gây bởi máy móc/thiết bị hỏng", options: ["異物混入", "食物アレルギー", "労働災害", "在庫過多"], correctIndex: 0 },
  { id: "vc-hy4-25", chapterId: "hy-ch4", direction: "ja-to-vi", term: "先入れ先出し", options: ["Nhập trước xuất trước (nguyên tắc quản lý lô hàng)", "Nhập sau xuất trước", "Xuất ngẫu nhiên", "Chỉ xuất hàng mới"], correctIndex: 0 },

  // hy-ch5: gom từ mục 調理・提供工程における適切な衛生管理のポイント (trang 31-34).
  { id: "vc-hy5-1", chapterId: "hy-ch5", direction: "ja-to-vi", term: "下処理", options: ["Công đoạn sơ chế nguyên liệu", "Công đoạn thu ngân", "Công đoạn dọn bàn", "Công đoạn tuyển dụng"], correctIndex: 0 },
  { id: "vc-hy5-2", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Rã đông", options: ["冷却", "解凍", "加熱", "保温"], correctIndex: 1 },
  { id: "vc-hy5-3", chapterId: "hy-ch5", direction: "ja-to-vi", term: "ドリップ", options: ["Dịch rỉ ra khi rã đông thực phẩm", "Nước sốt chấm", "Cà phê pha phin", "Nước tương"], correctIndex: 0 },
  { id: "vc-hy5-4", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Bào tử (dạng chịu nhiệt của một số vi khuẩn)", options: ["細菌", "ウイルス", "芽胞", "カビ"], correctIndex: 2 },
  { id: "vc-hy5-5", chapterId: "hy-ch5", direction: "ja-to-vi", term: "ボツリヌス菌", options: ["Vi khuẩn Clostridium botulinum (tạo bào tử chịu nhiệt)", "Virus cúm", "Ký sinh trùng đường ruột", "Nấm men bánh mì"], correctIndex: 0 },
  { id: "vc-hy5-6", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Vi khuẩn Clostridium perfringens (thường gặp trong món hầm để nguội chậm)", options: ["セレウス菌", "ウエルシュ菌", "サルモネラ属菌", "腸炎ビブリオ"], correctIndex: 1 },
  { id: "vc-hy5-7", chapterId: "hy-ch5", direction: "ja-to-vi", term: "危険温度帯", options: ["Vùng nhiệt độ thuận lợi cho vi khuẩn sinh sôi (10-60°C)", "Vùng nhiệt độ an toàn tuyệt đối", "Vùng nhiệt độ dùng để bảo quản đông lạnh", "Vùng nhiệt độ chỉ áp dụng cho đồ uống"], correctIndex: 0 },
  { id: "vc-hy5-8", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Máy làm lạnh nhanh (Blast chiller)", options: ["真空冷却機", "ブラストチラー", "保温庫", "電子レンジ"], correctIndex: 1 },
  { id: "vc-hy5-9", chapterId: "hy-ch5", direction: "ja-to-vi", term: "真空冷却機", options: ["Máy làm lạnh chân không", "Máy hút bụi", "Máy đóng gói chân không thực phẩm khô", "Máy pha cà phê"], correctIndex: 0 },
  { id: "vc-hy5-10", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Tủ giữ ấm thức ăn (Warmer)", options: ["冷蔵庫", "保温庫（ウォーマー）", "冷凍庫", "食器戸棚"], correctIndex: 1 },
  { id: "vc-hy5-11", chapterId: "hy-ch5", direction: "ja-to-vi", term: "中心温度計", options: ["Nhiệt kế đo phần lõi thực phẩm", "Nhiệt kế đo phòng", "Nhiệt kế đo cơ thể người", "Nhiệt kế đo nước hồ bơi"], correctIndex: 0 },
  { id: "vc-hy5-12", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Trộn (rau, salad...)", options: ["炒める", "和える", "揚げる", "蒸す"], correctIndex: 1 },
  { id: "vc-hy5-13", chapterId: "hy-ch5", direction: "ja-to-vi", term: "トング", options: ["Kẹp gắp thức ăn", "Đũa dùng 1 lần", "Muỗng múc canh", "Dao lọc xương"], correctIndex: 0 },
  { id: "vc-hy5-14", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Món ăn giữ ấm (bảo quản ≥65°C)", options: ["常温品", "冷蔵品", "温蔵品", "冷凍品"], correctIndex: 2 },
  { id: "vc-hy5-15", chapterId: "hy-ch5", direction: "ja-to-vi", term: "常温品", options: ["Hàng bảo quản ở nhiệt độ thường (15-25°C)", "Hàng đông lạnh", "Hàng phải giữ ấm", "Hàng chỉ bán vào mùa đông"], correctIndex: 0 },
  { id: "vc-hy5-16", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Rỉ dịch do rã đông ở nhiệt độ phòng gây ra", options: ["低温解凍", "自然・室温解凍", "冷蔵庫内解凍", "電子レンジ解凍"], correctIndex: 1 },
  { id: "vc-hy5-17", chapterId: "hy-ch5", direction: "ja-to-vi", term: "解凍ムラ", options: ["Rã đông không đều (chỗ chín chỗ còn đông)", "Rã đông hoàn toàn đều", "Rã đông quá nhanh", "Không rã đông được"], correctIndex: 0 },
  { id: "vc-hy5-18", chapterId: "hy-ch5", direction: "vi-to-ja", term: "Dụng cụ đựng có nắp (dùng bảo quản thực phẩm)", options: ["ラップ", "フタ付き容器", "トレー", "バット"], correctIndex: 1 },

  // ck-ch1: gom từ thuật ngữ肉類/魚介類/野菜・果実類/国産食材(和牛・伝統野菜) + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-ck1-1", chapterId: "ck-ch1", direction: "ja-to-vi", term: "牛肉", options: ["Thịt bò", "Thịt heo", "Thịt gà", "Thịt cừu"], correctIndex: 0 },
  { id: "vc-ck1-2", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Thịt heo", options: ["牛肉", "豚肉", "鶏肉", "羊肉"], correctIndex: 1 },
  { id: "vc-ck1-3", chapterId: "ck-ch1", direction: "ja-to-vi", term: "鶏肉", options: ["Thịt bò", "Thịt heo", "Thịt gà", "Hải sản"], correctIndex: 2 },
  { id: "vc-ck1-4", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Bộ phận, phần (thịt)", options: ["品種", "規格", "成分", "部位"], correctIndex: 3 },
  { id: "vc-ck1-5", chapterId: "ck-ch1", direction: "ja-to-vi", term: "格付協会", options: ["Hiệp hội phân hạng (thịt)", "Hiệp hội nông dân", "Hiệp hội đầu bếp", "Hiệp hội siêu thị"], correctIndex: 0 },
  { id: "vc-ck1-6", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Quy cách giao dịch (từng phần thịt)", options: ["小売規格", "取引規格", "衛生規格", "品質規格"], correctIndex: 1 },
  { id: "vc-ck1-7", chapterId: "ck-ch1", direction: "ja-to-vi", term: "食鶏小売規格", options: ["Quy cách giao dịch thịt bò", "Quy cách chế biến cá", "Quy cách bán lẻ gia cầm", "Quy cách bảo quản rau"], correctIndex: 2 },
  { id: "vc-ck1-8", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Cứng xác (sau khi giết mổ)", options: ["熟成", "軟化", "変性", "死後硬直"], correctIndex: 3 },
  { id: "vc-ck1-9", chapterId: "ck-ch1", direction: "ja-to-vi", term: "熟成", options: ["Ủ chín (thịt)", "Đông lạnh", "Rã đông", "Thái lát"], correctIndex: 0 },
  { id: "vc-ck1-10", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Mềm hóa", options: ["硬直", "軟化", "熟成", "凝固"], correctIndex: 1 },
  { id: "vc-ck1-11", chapterId: "ck-ch1", direction: "ja-to-vi", term: "変性", options: ["Bảo quản", "Vận chuyển", "Biến tính (protein)", "Đóng gói"], correctIndex: 2 },
  { id: "vc-ck1-12", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Đông cứng do nhiệt", options: ["冷却", "解凍", "発酵", "熱凝固"], correctIndex: 3 },
  { id: "vc-ck1-13", chapterId: "ck-ch1", direction: "ja-to-vi", term: "コラーゲン", options: ["Collagen", "Vitamin C", "Chất béo", "Tinh bột"], correctIndex: 0 },
  { id: "vc-ck1-14", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Thịt kết dính, thịt định hình", options: ["生肉", "結着肉", "熟成肉", "冷凍肉"], correctIndex: 1 },
  { id: "vc-ck1-15", chapterId: "ck-ch1", direction: "ja-to-vi", term: "成形肉", options: ["Thịt tươi nguyên khối", "Thịt xông khói", "Thịt định hình (ghép từ nhiều miếng)", "Thịt sấy khô"], correctIndex: 2 },
  { id: "vc-ck1-16", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Ngộ độc thực phẩm do vi khuẩn", options: ["食物アレルギー", "化学性食中毒", "自然毒食中毒", "細菌性食中毒"], correctIndex: 3 },
  { id: "vc-ck1-17", chapterId: "ck-ch1", direction: "ja-to-vi", term: "鮮度", options: ["Độ tươi", "Độ mặn", "Độ ngọt", "Độ cay"], correctIndex: 0 },
  { id: "vc-ck1-18", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Dịch rỉ ra (từ thịt/cá đông lạnh)", options: ["スープ", "ドリップ", "ソース", "だし"], correctIndex: 1 },
  { id: "vc-ck1-19", chapterId: "ck-ch1", direction: "ja-to-vi", term: "緩慢解凍", options: ["Rã đông nhanh bằng lò vi sóng", "Đông lạnh nhanh", "Rã đông chậm (ở nhiệt độ thấp)", "Nấu chín nhanh"], correctIndex: 2 },
  { id: "vc-ck1-20", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Hải sản", options: ["野菜類", "果実類", "穀類", "魚介類"], correctIndex: 3 },
  { id: "vc-ck1-21", chapterId: "ck-ch1", direction: "ja-to-vi", term: "旬", options: ["Mùa ngon nhất (của thực phẩm)", "Giá bán", "Hạn sử dụng", "Nơi sản xuất"], correctIndex: 0 },
  { id: "vc-ck1-22", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Ăn sống, ăn tươi sống", options: ["加熱調理", "生食", "冷凍保存", "乾燥"], correctIndex: 1 },
  { id: "vc-ck1-23", chapterId: "ck-ch1", direction: "ja-to-vi", term: "刺身", options: ["Cá nướng", "Cá kho", "Sashimi (cá sống thái lát)", "Cá chiên"], correctIndex: 2 },
  { id: "vc-ck1-24", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Mùi tanh (của cá)", options: ["うまみ", "甘み", "塩気", "くさみ"], correctIndex: 3 },
  { id: "vc-ck1-25", chapterId: "ck-ch1", direction: "ja-to-vi", term: "香味野菜", options: ["Rau thơm (hành, gừng...)", "Rau ăn lá", "Rau củ", "Rau quả"], correctIndex: 0 },
  { id: "vc-ck1-26", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Phi lê 3 phần", options: ["五枚おろし", "三枚おろし", "二枚おろし", "丸ごと"], correctIndex: 1 },
  { id: "vc-ck1-27", chapterId: "ck-ch1", direction: "ja-to-vi", term: "五枚おろし", options: ["Phi lê 3 phần", "Cắt khúc", "Phi lê 5 phần (dùng cho cá dẹt)", "Nấu nguyên con"], correctIndex: 2 },
  { id: "vc-ck1-28", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Cá nóc", options: ["サケ", "マグロ", "アジ", "フグ"], correctIndex: 3 },
  { id: "vc-ck1-29", chapterId: "ck-ch1", direction: "ja-to-vi", term: "処理者", options: ["Người xử lý/chế biến (có chuyên môn)", "Người phục vụ", "Người thu ngân", "Người quản lý kho"], correctIndex: 0 },
  { id: "vc-ck1-30", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Bày trí, trình bày món ăn", options: ["調理", "盛り付け", "保存", "洗浄"], correctIndex: 1 },
  { id: "vc-ck1-31", chapterId: "ck-ch1", direction: "ja-to-vi", term: "根菜類", options: ["Nhóm rau lá", "Nhóm rau thân", "Nhóm rau củ (rễ)", "Nhóm rau quả"], correctIndex: 2 },
  { id: "vc-ck1-32", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Nhóm rau lá", options: ["根菜類", "茎菜類", "果菜類", "葉菜類"], correctIndex: 3 },
  { id: "vc-ck1-33", chapterId: "ck-ch1", direction: "ja-to-vi", term: "果菜類", options: ["Nhóm rau quả", "Nhóm rau củ", "Nhóm rau thân", "Nhóm đậu"], correctIndex: 0 },
  { id: "vc-ck1-34", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Khoáng chất, chất vô cơ", options: ["有機質", "無機質", "糖質", "脂質"], correctIndex: 1 },
  { id: "vc-ck1-35", chapterId: "ck-ch1", direction: "ja-to-vi", term: "カロテン", options: ["Vitamin C", "Vitamin B1", "Caroten (tiền vitamin A)", "Chất xơ"], correctIndex: 2 },
  { id: "vc-ck1-36", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Chất xơ thực phẩm", options: ["炭水化物", "タンパク質", "脂質", "食物繊維"], correctIndex: 3 },
  { id: "vc-ck1-37", chapterId: "ck-ch1", direction: "ja-to-vi", term: "クロロフィル", options: ["Chất diệp lục (sắc tố xanh)", "Chất tạo màu đỏ", "Chất tạo vị ngọt", "Chất bảo quản"], correctIndex: 0 },
  { id: "vc-ck1-38", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Hiện tượng thâm/ngả nâu (vết cắt)", options: ["発酵", "褐変", "腐敗", "乾燥"], correctIndex: 1 },
  { id: "vc-ck1-39", chapterId: "ck-ch1", direction: "ja-to-vi", term: "しんなり", options: ["Giòn tan", "Cứng lại", "Mềm rũ xuống (do mất nước)", "Đông cứng"], correctIndex: 2 },
  { id: "vc-ck1-40", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Bò Wagyu", options: ["乳牛", "水牛", "野牛", "和牛"], correctIndex: 3 },
  { id: "vc-ck1-41", chapterId: "ck-ch1", direction: "ja-to-vi", term: "黒毛和種", options: ["Giống bò lông đen (chiếm 95% wagyu)", "Giống bò lông nâu", "Giống bò không sừng", "Giống bò sừng ngắn"], correctIndex: 0 },
  { id: "vc-ck1-42", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Giống bò lông nâu", options: ["黒毛和種", "褐毛和種", "無角和種", "日本短角種"], correctIndex: 1 },
  { id: "vc-ck1-43", chapterId: "ck-ch1", direction: "ja-to-vi", term: "交雑種", options: ["Giống thuần chủng", "Giống nhập khẩu", "Giống lai", "Giống đột biến"], correctIndex: 2 },
  { id: "vc-ck1-44", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Vân mỡ (sashi)", options: ["赤身", "霜降り防止", "脂肪除去", "脂肪交雑"], correctIndex: 3 },
  { id: "vc-ck1-45", chapterId: "ck-ch1", direction: "ja-to-vi", term: "伝統野菜", options: ["Rau truyền thống (rau bản địa)", "Rau nhập khẩu", "Rau biến đổi gen", "Rau thủy canh"], correctIndex: 0 },
  { id: "vc-ck1-46", chapterId: "ck-ch1", direction: "vi-to-ja", term: "Rau bản địa", options: ["改良野菜", "伝統野菜", "輸入野菜", "有機野菜"], correctIndex: 1 },

  // ck-ch2: gom từ thuật ngữ下処理(野菜/肉/魚介類) + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-ck2-1", chapterId: "ck-ch2", direction: "ja-to-vi", term: "下処理", options: ["Sơ chế (xử lý sơ bộ trước khi nấu)", "Nấu chín", "Bày biện món ăn", "Bảo quản đông lạnh"], correctIndex: 0 },
  { id: "vc-ck2-2", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Khử vị đắng/chát (ngâm nước)", options: ["洗浄", "あく抜き", "乾燥", "発酵"], correctIndex: 1 },
  { id: "vc-ck2-3", chapterId: "ck-ch2", direction: "ja-to-vi", term: "乾物をもどす", options: ["Rửa rau", "Thái thịt", "Ngâm nở đồ khô", "Rã đông"], correctIndex: 2 },
  { id: "vc-ck2-4", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Ô nhiễm chéo (từ tay/dụng cụ sang thực phẩm đã nấu)", options: ["一次汚染", "化学汚染", "自然汚染", "二次汚染"], correctIndex: 3 },
  { id: "vc-ck2-5", chapterId: "ck-ch2", direction: "ja-to-vi", term: "洗浄", options: ["Rửa sạch", "Cắt thái", "Ướp gia vị", "Hấp chín"], correctIndex: 0 },
  { id: "vc-ck2-6", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Bàn chải cọ rửa (dùng cho rau/củ dính đất)", options: ["包丁", "たわし", "まな板", "ザル"], correctIndex: 1 },
  { id: "vc-ck2-7", chapterId: "ck-ch2", direction: "ja-to-vi", term: "冷水", options: ["Nước nóng", "Nước muối", "Nước lạnh", "Nước giấm"], correctIndex: 2 },
  { id: "vc-ck2-8", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Nước giấm (dùng ngâm củ sen, ngưu bàng)", options: ["塩水", "冷水", "湯", "酢水"], correctIndex: 3 },
  { id: "vc-ck2-9", chapterId: "ck-ch2", direction: "ja-to-vi", term: "浸透圧", options: ["Áp suất thẩm thấu", "Áp suất khí quyển", "Nhiệt độ đông đặc", "Độ pH"], correctIndex: 0 },
  { id: "vc-ck2-10", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Mềm rũ xuống (do mất nước)", options: ["パリパリ", "しんなり", "カリカリ", "サクサク"], correctIndex: 1 },
  { id: "vc-ck2-11", chapterId: "ck-ch2", direction: "ja-to-vi", term: "筋（すじ）", options: ["Da", "Xương", "Gân", "Mỡ"], correctIndex: 2 },
  { id: "vc-ck2-12", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Cong lên, uốn cong (khi gia nhiệt)", options: ["硬直する", "膨張する", "収縮する", "反り返る"], correctIndex: 3 },
  { id: "vc-ck2-13", chapterId: "ck-ch2", direction: "ja-to-vi", term: "肉たたき", options: ["Chày đập thịt", "Dao lọc xương", "Kẹp gắp thịt", "Thớt thái thịt"], correctIndex: 0 },
  { id: "vc-ck2-14", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Vảy cá", options: ["えら", "うろこ", "中骨", "内臓"], correctIndex: 1 },
  { id: "vc-ck2-15", chapterId: "ck-ch2", direction: "ja-to-vi", term: "ウロコ取り", options: ["Dao phi lê", "Kẹp gắp", "Dụng cụ gạt vảy cá chuyên dụng", "Bàn chải rửa rau"], correctIndex: 2 },
  { id: "vc-ck2-16", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Nắp mang (cá)", options: ["尾びれ", "胸びれ", "背びれ", "えらぶた"], correctIndex: 3 },
  { id: "vc-ck2-17", chapterId: "ck-ch2", direction: "ja-to-vi", term: "内臓", options: ["Nội tạng", "Vảy cá", "Xương sống", "Mang cá"], correctIndex: 0 },
  { id: "vc-ck2-18", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Cá nguyên con còn đầu đuôi (chưa phi lê)", options: ["切り身", "尾頭付き", "三枚おろし", "干物"], correctIndex: 1 },
  { id: "vc-ck2-19", chapterId: "ck-ch2", direction: "ja-to-vi", term: "中骨", options: ["Vây lưng", "Vảy cá", "Xương sống chính", "Mang cá"], correctIndex: 2 },
  { id: "vc-ck2-20", chapterId: "ck-ch2", direction: "vi-to-ja", term: "Ngâm nước để khử vị đắng/chát", options: ["塩でもむ", "酢水につける", "水洗い", "あく抜き"], correctIndex: 3 },

  // ck-ch3: gom từ thuật ngữ各調理方法(加熱調理/非加熱調理/調理計画) + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-ck3-1", chapterId: "ck-ch3", direction: "ja-to-vi", term: "調理", options: ["Nấu ăn / chế biến", "Rửa chén", "Bày bàn", "Thu ngân"], correctIndex: 0 },
  { id: "vc-ck3-2", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Chế biến bằng nhiệt", options: ["非加熱調理", "加熱調理", "下処理", "盛り付け"], correctIndex: 1 },
  { id: "vc-ck3-3", chapterId: "ck-ch3", direction: "ja-to-vi", term: "茹でる", options: ["Chiên", "Hấp", "Luộc", "Nướng"], correctIndex: 2 },
  { id: "vc-ck3-4", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Kho/ninh (nấu với nước dùng có gia vị)", options: ["茹でる", "焼く", "蒸す", "煮る"], correctIndex: 3 },
  { id: "vc-ck3-5", chapterId: "ck-ch3", direction: "ja-to-vi", term: "揚げる", options: ["Chiên", "Luộc", "Hấp", "Xào"], correctIndex: 0 },
  { id: "vc-ck3-6", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Xào", options: ["焼く", "炒める", "茹でる", "煮る"], correctIndex: 1 },
  { id: "vc-ck3-7", chapterId: "ck-ch3", direction: "ja-to-vi", term: "蒸す", options: ["Chiên", "Nướng", "Hấp", "Luộc"], correctIndex: 2 },
  { id: "vc-ck3-8", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Sự oxy hóa (của dầu ăn)", options: ["劣化", "変色", "発酵", "酸化"], correctIndex: 3 },
  { id: "vc-ck3-9", chapterId: "ck-ch3", direction: "ja-to-vi", term: "油の劣化", options: ["Dầu ăn bị xuống cấp/biến chất", "Dầu ăn mới", "Dầu ăn được lọc sạch", "Dầu ăn đông đặc"], correctIndex: 0 },
  { id: "vc-ck3-10", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Chế biến không dùng nhiệt", options: ["加熱調理", "非加熱調理", "下処理", "解凍"], correctIndex: 1 },
  { id: "vc-ck3-11", chapterId: "ck-ch3", direction: "ja-to-vi", term: "交差汚染", options: ["Ô nhiễm ban đầu", "Ô nhiễm không khí", "Ô nhiễm chéo", "Ô nhiễm hóa chất"], correctIndex: 2 },
  { id: "vc-ck3-12", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Trộn, khuấy (làm 2 loại thực phẩm trở lên thành đồng nhất)", options: ["冷却", "解凍", "洗浄", "混合・撹拌"], correctIndex: 3 },
  { id: "vc-ck3-13", chapterId: "ck-ch3", direction: "ja-to-vi", term: "冷却", options: ["Xử lý hạ nhiệt độ thực phẩm", "Xử lý tăng nhiệt độ", "Xử lý làm khô", "Xử lý lên men"], correctIndex: 0 },
  { id: "vc-ck3-14", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Găng tay dùng một lần", options: ["軍手", "使い捨て手袋", "ゴム手袋", "布手袋"], correctIndex: 1 },
  { id: "vc-ck3-15", chapterId: "ck-ch3", direction: "ja-to-vi", term: "生食用冷凍魚介類", options: ["Hải sản đông lạnh đã nấu chín", "Hải sản tươi chưa đông lạnh", "Hải sản đông lạnh dùng để ăn sống", "Hải sản khô"], correctIndex: 2 },
  { id: "vc-ck3-16", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Bán thành phẩm (nguyên liệu đã sơ chế một phần)", options: ["完成品", "加工品", "冷凍品", "半製品"], correctIndex: 3 },
  { id: "vc-ck3-17", chapterId: "ck-ch3", direction: "ja-to-vi", term: "ブランチング", options: ["Xử lý làm nóng ngắn để bất hoạt enzyme", "Xử lý làm lạnh sâu", "Xử lý lên men", "Xử lý khử trùng bằng tia UV"], correctIndex: 0 },
  { id: "vc-ck3-18", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Enzyme (chất xúc tác sinh học)", options: ["ビタミン", "酵素", "繊維", "脂肪"], correctIndex: 1 },
  { id: "vc-ck3-19", chapterId: "ck-ch3", direction: "ja-to-vi", term: "調理計画", options: ["Kế hoạch mua hàng", "Kế hoạch nhân sự", "Kế hoạch nấu ăn", "Kế hoạch marketing"], correctIndex: 2 },
  { id: "vc-ck3-20", chapterId: "ck-ch3", direction: "vi-to-ja", term: "Sổ tay hướng dẫn nấu ăn", options: ["メニュー表", "レシピ集", "衛生チェック表", "調理マニュアル"], correctIndex: 3 },

  // ck-ch4: gom từ thuật ngữ調理機器/調理器具備品/計測機器類(包丁の種類含む) + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-ck4-1", chapterId: "ck-ch4", direction: "ja-to-vi", term: "熱機器", options: ["Thiết bị nhiệt (bếp, lò...)", "Thiết bị làm lạnh", "Thiết bị đo lường", "Thiết bị rửa"], correctIndex: 0 },
  { id: "vc-ck4-2", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Nhiệt kế không tiếp xúc", options: ["温度計", "非接触温度計", "湿度計", "気圧計"], correctIndex: 1 },
  { id: "vc-ck4-3", chapterId: "ck-ch4", direction: "ja-to-vi", term: "換気", options: ["Vệ sinh", "Bảo trì", "Thông gió", "Chiếu sáng"], correctIndex: 2 },
  { id: "vc-ck4-4", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Ngộ độc khí CO (khí than)", options: ["食中毒", "熱中症", "感電", "一酸化炭素中毒"], correctIndex: 3 },
  { id: "vc-ck4-5", chapterId: "ck-ch4", direction: "ja-to-vi", term: "酸化値（AV値）", options: ["Chỉ số oxy hóa của dầu ăn", "Chỉ số độ mặn", "Chỉ số độ ngọt", "Chỉ số độ pH"], correctIndex: 0 },
  { id: "vc-ck4-6", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Thiết bị làm lạnh", options: ["熱機器", "冷機器", "洗浄機器", "計測機器"], correctIndex: 1 },
  { id: "vc-ck4-7", chapterId: "ck-ch4", direction: "ja-to-vi", term: "急速冷凍", options: ["Rã đông nhanh", "Nấu nhanh", "Cấp đông nhanh", "Sấy khô nhanh"], correctIndex: 2 },
  { id: "vc-ck4-8", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Gioăng cửa (tủ lạnh)", options: ["取っ手", "冷却装置", "製氷皿", "扉パッキン"], correctIndex: 3 },
  { id: "vc-ck4-9", chapterId: "ck-ch4", direction: "ja-to-vi", term: "雑菌", options: ["Vi khuẩn tạp", "Nấm men", "Enzyme", "Vitamin"], correctIndex: 0 },
  { id: "vc-ck4-10", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Muỗng xúc đá", options: ["製氷皿", "氷用スコップ", "貯氷ケース", "冷凍庫"], correctIndex: 1 },
  { id: "vc-ck4-11", chapterId: "ck-ch4", direction: "ja-to-vi", term: "洗浄機", options: ["Máy sấy", "Máy hấp", "Máy rửa (chén bát)", "Máy xay"], correctIndex: 2 },
  { id: "vc-ck4-12", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Chất trợ tráng (dùng khi tráng máy rửa)", options: ["洗浄剤", "中性洗剤", "消毒剤", "リンス剤"], correctIndex: 3 },
  { id: "vc-ck4-13", chapterId: "ck-ch4", direction: "ja-to-vi", term: "包丁", options: ["Dao", "Thớt", "Nồi", "Chảo"], correctIndex: 0 },
  { id: "vc-ck4-14", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Thớt", options: ["包丁", "まな板", "フライパン", "ボール"], correctIndex: 1 },
  { id: "vc-ck4-15", chapterId: "ck-ch4", direction: "ja-to-vi", term: "柳刃包丁", options: ["Dao lọc xương", "Dao thái rau", "Dao sashimi (lưỡi dài)", "Dao Trung Hoa"], correctIndex: 2 },
  { id: "vc-ck4-16", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Dao Deba (dùng để mổ cá, cắt xương)", options: ["柳刃包丁", "菜切包丁", "三徳包丁", "出刃包丁"], correctIndex: 3 },
  { id: "vc-ck4-17", chapterId: "ck-ch4", direction: "ja-to-vi", term: "菜切包丁", options: ["Dao rau kiểu Nhật (thái nhỏ, thái sợi)", "Dao thịt bò", "Dao cá", "Dao Trung Hoa"], correctIndex: 0 },
  { id: "vc-ck4-18", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Dao đa năng (dùng cho thịt, cá, rau)", options: ["出刃包丁", "三徳包丁", "柳刃包丁", "薄刃包丁"], correctIndex: 1 },
  { id: "vc-ck4-19", chapterId: "ck-ch4", direction: "ja-to-vi", term: "牛刀", options: ["Dao rau", "Dao cá", "Dao vốn dùng cho thịt nhưng đa năng", "Dao Trung Hoa"], correctIndex: 2 },
  { id: "vc-ck4-20", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Dao nhỏ (gọt vỏ rau củ, thao tác tỉ mỉ)", options: ["牛刀", "中華包丁", "出刃包丁", "ペティナイフ"], correctIndex: 3 },
  { id: "vc-ck4-21", chapterId: "ck-ch4", direction: "ja-to-vi", term: "中華包丁", options: ["Dao Trung Hoa (dùng cả mặt lưỡi để đập)", "Dao gọt nhỏ", "Dao lọc xương", "Dao sashimi"], correctIndex: 0 },
  { id: "vc-ck4-22", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Búi cọ thép (cấm dùng khi rửa dụng cụ)", options: ["スポンジ", "スチールたわし", "布巾", "ブラシ"], correctIndex: 1 },
  { id: "vc-ck4-23", chapterId: "ck-ch4", direction: "ja-to-vi", term: "フッ素加工", options: ["Mạ vàng", "Mạ bạc", "Lớp phủ chống dính", "Lớp phủ chống gỉ"], correctIndex: 2 },
  { id: "vc-ck4-24", chapterId: "ck-ch4", direction: "vi-to-ja", term: "Hiệu chuẩn (thiết bị đo)", options: ["清掃", "点検", "修理", "校正"], correctIndex: 3 },

  // ck-ch5: gom từ thuật ngữ労働災害/見える化/5S活動/食品加工機械 + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-ck5-1", chapterId: "ck-ch5", direction: "ja-to-vi", term: "労働災害", options: ["Tai nạn lao động", "Tai nạn giao thông", "Thiên tai", "Hỏa hoạn"], correctIndex: 0 },
  { id: "vc-ck5-2", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Té ngã", options: ["切れ・こすれ", "転倒", "やけど", "腰痛"], correctIndex: 1 },
  { id: "vc-ck5-3", chapterId: "ck-ch5", direction: "ja-to-vi", term: "切れ・こすれ", options: ["Bỏng", "Té ngã", "Đứt/trầy xước", "Đau lưng"], correctIndex: 2 },
  { id: "vc-ck5-4", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Tiếp xúc vật nóng/lạnh", options: ["転倒", "切れ・こすれ", "腰痛", "高温・低温物との接触"], correctIndex: 3 },
  { id: "vc-ck5-5", chapterId: "ck-ch5", direction: "ja-to-vi", term: "動作の反動・無理な動作", options: ["Phản lực động tác/động tác gắng sức", "Trơn trượt", "Va chạm", "Điện giật"], correctIndex: 0 },
  { id: "vc-ck5-6", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Trực quan hóa (nguy hiểm)", options: ["標準化", "見える化", "マニュアル化", "デジタル化"], correctIndex: 1 },
  { id: "vc-ck5-7", chapterId: "ck-ch5", direction: "ja-to-vi", term: "ハザードマップ", options: ["Bản đồ khách hàng", "Bản đồ tồn kho", "Bản đồ nguy hiểm", "Bản đồ doanh thu"], correctIndex: 2 },
  { id: "vc-ck5-8", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Hoạt động 5S", options: ["QSC活動", "OJT活動", "PDCA活動", "５Ｓ活動"], correctIndex: 3 },
  { id: "vc-ck5-9", chapterId: "ck-ch5", direction: "ja-to-vi", term: "整理", options: ["Sàng lọc (loại bỏ đồ không cần)", "Vệ sinh", "Sạch sẽ", "Thói quen"], correctIndex: 0 },
  { id: "vc-ck5-10", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Xe đẩy (chở hàng)", options: ["トング", "台車", "ラック", "トレー"], correctIndex: 1 },
  { id: "vc-ck5-11", chapterId: "ck-ch5", direction: "ja-to-vi", term: "耐熱手袋", options: ["Găng tay cao su", "Găng tay dùng 1 lần", "Găng tay chịu nhiệt", "Găng tay vải"], correctIndex: 2 },
  { id: "vc-ck5-12", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Say nắng/say nóng", options: ["食中毒", "感電", "脱水症", "熱中症"], correctIndex: 3 },
  { id: "vc-ck5-13", chapterId: "ck-ch5", direction: "ja-to-vi", term: "食品加工用機械", options: ["Máy chế biến thực phẩm", "Máy tính tiền", "Máy pha cà phê", "Máy lạnh"], correctIndex: 0 },
  { id: "vc-ck5-14", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Máy cắt/thái", options: ["混合機", "切断機", "成形機", "ロール機"], correctIndex: 1 },
  { id: "vc-ck5-15", chapterId: "ck-ch5", direction: "ja-to-vi", term: "粉砕機", options: ["Máy trộn", "Máy cán", "Máy nghiền", "Máy ép"], correctIndex: 2 },
  { id: "vc-ck5-16", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Nguy cơ bị cuốn vào (máy móc)", options: ["転落", "挟まれ", "感電", "巻き込まれ"], correctIndex: 3 },
  { id: "vc-ck5-17", chapterId: "ck-ch5", direction: "ja-to-vi", term: "挟まれ", options: ["Nguy cơ bị kẹp", "Nguy cơ bị bỏng", "Nguy cơ trượt ngã", "Nguy cơ điện giật"], correctIndex: 0 },
  { id: "vc-ck5-18", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Nắp che (bộ phận nguy hiểm của máy)", options: ["スイッチ", "覆い", "レバー", "センサー"], correctIndex: 1 },
  { id: "vc-ck5-19", chapterId: "ck-ch5", direction: "ja-to-vi", term: "労働安全衛生規則", options: ["Luật Vệ sinh Thực phẩm", "Luật Lao động", "Quy tắc An toàn Vệ sinh Lao động", "Luật Bảo vệ Người tiêu dùng"], correctIndex: 2 },
  { id: "vc-ck5-20", chapterId: "ck-ch5", direction: "vi-to-ja", term: "Quy trình (dòng chảy) công việc", options: ["５Ｓ活動", "ハザードマップ", "見える化", "作業手順"], correctIndex: 3 },

  // ck-ch6: gom từ thuật ngữ流通経路/卸売市場/仕入先 + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-ck6-1", chapterId: "ck-ch6", direction: "ja-to-vi", term: "流通", options: ["Lưu thông (kênh phân phối)", "Chế biến", "Bảo quản", "Tiêu hủy"], correctIndex: 0 },
  { id: "vc-ck6-2", chapterId: "ck-ch6", direction: "vi-to-ja", term: "Nhà sản xuất", options: ["消費者", "生産者", "卸売業者", "小売店"], correctIndex: 1 },
  { id: "vc-ck6-3", chapterId: "ck-ch6", direction: "ja-to-vi", term: "出荷事業者", options: ["Người tiêu dùng", "Nhà bán lẻ", "Đơn vị xuất hàng", "Nhà chế biến"], correctIndex: 2 },
  { id: "vc-ck6-4", chapterId: "ck-ch6", direction: "vi-to-ja", term: "Hợp tác xã nông nghiệp", options: ["卸売市場", "小売店", "消費者", "農協"], correctIndex: 3 },
  { id: "vc-ck6-5", chapterId: "ck-ch6", direction: "ja-to-vi", term: "卸売市場", options: ["Chợ đầu mối", "Siêu thị bán lẻ", "Cửa hàng tiện lợi", "Nhà máy chế biến"], correctIndex: 0 },
  { id: "vc-ck6-6", chapterId: "ck-ch6", direction: "vi-to-ja", term: "Thu gom hàng", options: ["決済", "集荷", "価格形成", "情報受発信"], correctIndex: 1 },
  { id: "vc-ck6-7", chapterId: "ck-ch6", direction: "ja-to-vi", term: "価格形成", options: ["Thanh toán", "Thu gom hàng", "Hình thành giá", "Giữ vệ sinh"], correctIndex: 2 },
  { id: "vc-ck6-8", chapterId: "ck-ch6", direction: "vi-to-ja", term: "Thanh toán", options: ["集荷", "情報受発信", "災害時対応", "決済"], correctIndex: 3 },
  { id: "vc-ck6-9", chapterId: "ck-ch6", direction: "ja-to-vi", term: "情報受発信", options: ["Tiếp nhận và phát tin", "Vận chuyển hàng", "Bảo quản lạnh", "Kiểm tra chất lượng"], correctIndex: 0 },
  { id: "vc-ck6-10", chapterId: "ck-ch6", direction: "vi-to-ja", term: "Thực phẩm tươi sống", options: ["加工食品", "生鮮食料品", "冷凍食品", "乾物"], correctIndex: 1 },
  { id: "vc-ck6-11", chapterId: "ck-ch6", direction: "ja-to-vi", term: "小売店", options: ["Nhà sản xuất", "Chợ đầu mối", "Cửa hàng bán lẻ", "Nhà cung cấp sỉ"], correctIndex: 2 },
  { id: "vc-ck6-12", chapterId: "ck-ch6", direction: "vi-to-ja", term: "Nhà cung cấp sỉ", options: ["小売店", "卸売市場", "業務用専門スーパー", "卸売業者"], correctIndex: 3 },

  // ck-ch7 (1/2): 16 loại phụ gia thực phẩm — gom từ bảng 添加物の種類と用途例.
  { id: "vc-ck7-1", chapterId: "ck-ch7", direction: "ja-to-vi", term: "甘味料", options: ["Chất tạo ngọt", "Chất tạo màu", "Chất bảo quản", "Chất tạo vị chua"], correctIndex: 0 },
  { id: "vc-ck7-2", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất tạo màu", options: ["甘味料", "着色料", "保存料", "漂白剤"], correctIndex: 1 },
  { id: "vc-ck7-3", chapterId: "ck-ch7", direction: "ja-to-vi", term: "保存料", options: ["Chất tạo ngọt", "Chất nhũ hóa", "Chất bảo quản (ức chế nấm mốc/vi khuẩn)", "Hương liệu"], correctIndex: 2 },
  { id: "vc-ck7-4", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất làm đặc/tạo gel", options: ["漂白剤", "発色剤", "防カビ剤", "増粘剤"], correctIndex: 3 },
  { id: "vc-ck7-5", chapterId: "ck-ch7", direction: "ja-to-vi", term: "酸化防止剤", options: ["Chất chống oxy hóa (dầu mỡ)", "Chất tạo màu", "Chất tạo ngọt", "Chất điều vị"], correctIndex: 0 },
  { id: "vc-ck7-6", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất tạo màu ổn định cho thịt", options: ["漂白剤", "発色剤", "香料", "乳化剤"], correctIndex: 1 },
  { id: "vc-ck7-7", chapterId: "ck-ch7", direction: "ja-to-vi", term: "漂白剤", options: ["Chất tạo ngọt", "Hương liệu", "Chất tẩy trắng", "Chất điều vị"], correctIndex: 2 },
  { id: "vc-ck7-8", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất chống nấm mốc (cam quýt)", options: ["酸味料", "調味料", "栄養強化剤", "防カビ剤"], correctIndex: 3 },
  { id: "vc-ck7-9", chapterId: "ck-ch7", direction: "ja-to-vi", term: "ガムベース", options: ["Chất nền kẹo cao su", "Chất bảo quản", "Chất tạo màu", "Chất nhũ hóa"], correctIndex: 0 },
  { id: "vc-ck7-10", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất tạo xốp/nở (bánh)", options: ["酸化防止剤", "膨張剤", "漂白剤", "豆腐用凝固剤"], correctIndex: 1 },
  { id: "vc-ck7-11", chapterId: "ck-ch7", direction: "ja-to-vi", term: "香料", options: ["Chất tạo ngọt", "Chất bảo quản", "Hương liệu (tạo mùi thơm)", "Chất tạo màu"], correctIndex: 2 },
  { id: "vc-ck7-12", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất tạo vị chua", options: ["甘味料", "調味料", "栄養強化剤", "酸味料"], correctIndex: 3 },
  { id: "vc-ck7-13", chapterId: "ck-ch7", direction: "ja-to-vi", term: "調味料", options: ["Chất điều vị (tạo umami)", "Chất tạo màu", "Chất chống oxy hóa", "Chất nhũ hóa"], correctIndex: 0 },
  { id: "vc-ck7-14", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất làm đông đậu phụ", options: ["乳化剤", "豆腐用凝固剤", "栄養強化剤", "香料"], correctIndex: 1 },
  { id: "vc-ck7-15", chapterId: "ck-ch7", direction: "ja-to-vi", term: "乳化剤", options: ["Chất tạo ngọt", "Chất bảo quản", "Chất nhũ hóa (hòa trộn nước-dầu)", "Chất tẩy trắng"], correctIndex: 2 },
  { id: "vc-ck7-16", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Chất tăng cường dinh dưỡng", options: ["調味料", "酸味料", "香料", "栄養強化剤"], correctIndex: 3 },

  // ck-ch7 (2/2): gom từ phụ lục （参考）キッチン基本用語 (trang 18-19, đọc được đầy đủ — khác các 参考 trước).
  { id: "vc-ck7-17", chapterId: "ck-ch7", direction: "ja-to-vi", term: "アイテム", options: ["Đơn phẩm/mục đơn lẻ trong thực đơn (item)", "Toàn bộ thực đơn", "Doanh thu", "Tồn kho"], correctIndex: 0 },
  { id: "vc-ck7-18", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Khu rửa chén (nơi tiếp giáp bếp và sảnh)", options: ["調理場", "洗い場", "パントリー", "バッシング"], correctIndex: 1 },
  { id: "vc-ck7-19", chapterId: "ck-ch7", direction: "ja-to-vi", term: "完成品基準", options: ["Thực đơn mẫu", "Giá thành món", "Tiêu chuẩn chất lượng món ăn hoàn thiện của công ty", "Danh sách nguyên liệu"], correctIndex: 2 },
  { id: "vc-ck7-20", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Phụ bếp (hỗ trợ đầu bếp)", options: ["調理長", "キッチンヘルパー", "バッシング担当", "在庫管理者"], correctIndex: 1 },
  { id: "vc-ck7-21", chapterId: "ck-ch7", direction: "ja-to-vi", term: "キッチンレイアウト", options: ["Bố trí thiết bị bếp", "Thực đơn nhà bếp", "Lịch làm việc bếp", "Ngân sách bếp"], correctIndex: 0 },
  { id: "vc-ck7-22", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Sự biến đổi chất lượng theo thời gian (sau khi sơ chế)", options: ["検品", "経時変化", "棚卸し", "鮮度管理"], correctIndex: 1 },
  { id: "vc-ck7-23", chapterId: "ck-ch7", direction: "ja-to-vi", term: "検品", options: ["Bố trí bếp", "Quản lý tồn kho", "Kiểm tra hàng nhập (số lượng, đơn giá, độ tươi...)", "Lập thực đơn"], correctIndex: 2 },
  { id: "vc-ck7-24", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Bếp không cần đầu bếp chuyên nghiệp", options: ["セントラルキッチン", "パントリー", "仕様書発注", "コックレスキッチン"], correctIndex: 3 },
  { id: "vc-ck7-25", chapterId: "ck-ch7", direction: "ja-to-vi", term: "在庫管理", options: ["Quản lý tồn kho", "Quản lý nhân sự", "Quản lý thực đơn", "Quản lý khách hàng"], correctIndex: 0 },
  { id: "vc-ck7-26", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Nhập trước xuất trước (FIFO)", options: ["棚卸し", "先入れ先出し", "検品", "鮮度管理"], correctIndex: 1 },
  { id: "vc-ck7-27", chapterId: "ck-ch7", direction: "ja-to-vi", term: "セントラルキッチン", options: ["Kho lạnh", "Khu rửa chén", "Nhà máy chế biến trung tâm (sơ chế tập trung cho chuỗi)", "Quầy thu ngân"], correctIndex: 2 },
  { id: "vc-ck7-28", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Kiểm kê tồn kho thực tế", options: ["検品", "仕様書発注", "経時変化", "棚卸し"], correctIndex: 3 },
  { id: "vc-ck7-29", chapterId: "ck-ch7", direction: "ja-to-vi", term: "バッシング", options: ["Dọn bàn sau khi khách về (thu đĩa, ly, dao nĩa...)", "Rửa chén", "Chuẩn bị nguyên liệu", "Kiểm kê kho"], correctIndex: 0 },
  { id: "vc-ck7-30", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Phòng chuẩn bị món (giữa bếp và sảnh)", options: ["洗い場", "パントリー", "キッチンレイアウト", "ポーション"], correctIndex: 1 },
  { id: "vc-ck7-31", chapterId: "ck-ch7", direction: "ja-to-vi", term: "ポーション", options: ["Giá bán", "Thực đơn", "Định lượng khẩu phần theo chuẩn", "Thời gian phục vụ"], correctIndex: 2 },
  { id: "vc-ck7-32", chapterId: "ck-ch7", direction: "vi-to-ja", term: "Công thức nấu ăn (nguyên liệu, gia vị, quy trình chi tiết)", options: ["ポーション", "検品", "棚卸し", "レシピ"], correctIndex: 3 },

  // cs-ch1: gom từ thuật ngữ接客サービス/QSCA/基本動作/接客用語/顧客管理 + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-cs1-1", chapterId: "cs-ch1", direction: "ja-to-vi", term: "おもてなし", options: ["Lòng hiếu khách (hospitality)", "Sự vội vàng", "Sự tiết kiệm", "Sự cạnh tranh"], correctIndex: 0 },
  { id: "vc-cs1-2", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Khách hàng quay lại (khách quen)", options: ["新規客", "リピーター", "団体客", "一見客"], correctIndex: 1 },
  { id: "vc-cs1-3", chapterId: "cs-ch1", direction: "ja-to-vi", term: "顧客満足", options: ["Chi phí khách hàng", "Số lượng khách", "Sự hài lòng của khách hàng", "Độ tuổi khách hàng"], correctIndex: 2 },
  { id: "vc-cs1-4", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Nụ cười & giao tiếp bằng mắt", options: ["おもてなし", "お辞儀", "身だしなみ", "スマイル＆アイコンタクト"], correctIndex: 3 },
  { id: "vc-cs1-5", chapterId: "cs-ch1", direction: "ja-to-vi", term: "身だしなみ", options: ["Tác phong, trang phục chỉnh tề", "Kỹ năng nấu ăn", "Tốc độ phục vụ", "Giọng nói"], correctIndex: 0 },
  { id: "vc-cs1-6", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Cúi chào", options: ["あいさつ", "お辞儀", "握手", "会釈"], correctIndex: 1 },
  { id: "vc-cs1-7", chapterId: "cs-ch1", direction: "ja-to-vi", term: "主賓", options: ["Nhân viên phục vụ", "Đầu bếp", "Khách chính (chủ tiệc)", "Quản lý cửa hàng"], correctIndex: 2 },
  { id: "vc-cs1-8", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Chó dẫn đường/hỗ trợ", options: ["ペット", "家畜", "盲導犬など補助犬", "野良犬"], correctIndex: 2 },
  { id: "vc-cs1-9", chapterId: "cs-ch1", direction: "ja-to-vi", term: "配膳", options: ["Bày món ra bàn cho khách", "Rửa chén", "Thu ngân", "Kiểm kê kho"], correctIndex: 0 },
  { id: "vc-cs1-10", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Mang về (takeaway)", options: ["店内飲食", "テイクアウト", "デリバリー", "予約"], correctIndex: 1 },
  { id: "vc-cs1-11", chapterId: "cs-ch1", direction: "ja-to-vi", term: "消費期限", options: ["Ngày sản xuất", "Ngày nhập kho", "Hạn sử dụng (an toàn)", "Hạn bảo hành"], correctIndex: 2 },
  { id: "vc-cs1-12", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Thuật ngữ tiếp khách", options: ["調理用語", "会計用語", "経理用語", "接客用語"], correctIndex: 3 },
  { id: "vc-cs1-13", chapterId: "cs-ch1", direction: "ja-to-vi", term: "敬語", options: ["Kính ngữ (tiếng Nhật lịch sự)", "Tiếng lóng", "Phương ngữ", "Từ chuyên ngành"], correctIndex: 0 },
  { id: "vc-cs1-14", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Bán hàng gợi ý", options: ["クレーム対応", "サジェスティブセールス", "在庫管理", "顧客管理"], correctIndex: 1 },
  { id: "vc-cs1-15", chapterId: "cs-ch1", direction: "ja-to-vi", term: "中間サービス", options: ["Dịch vụ khai vị", "Dịch vụ tráng miệng", "Dịch vụ giữa bữa ăn (tiếp nước, dọn bớt...)", "Dịch vụ thanh toán"], correctIndex: 2 },
  { id: "vc-cs1-16", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Dọn bàn sau khi khách về", options: ["配膳", "中間サービス", "検品", "バッシング"], correctIndex: 3 },
  { id: "vc-cs1-17", chapterId: "cs-ch1", direction: "ja-to-vi", term: "顧客管理", options: ["Quản lý khách hàng", "Quản lý kho", "Quản lý nhân sự", "Quản lý tài chính"], correctIndex: 0 },
  { id: "vc-cs1-18", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Xây dựng mối quan hệ tốt với khách (Customer Relations)", options: ["在庫管理", "カスタマーリレーションズ", "仕様書発注", "棚卸し"], correctIndex: 1 },
  { id: "vc-cs1-19", chapterId: "cs-ch1", direction: "ja-to-vi", term: "個人情報", options: ["Thông tin công khai", "Thông tin sản phẩm", "Thông tin định danh cá nhân", "Thông tin tài chính công ty"], correctIndex: 2 },
  { id: "vc-cs1-20", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Thông tin bị rò rỉ", options: ["新規情報", "公開情報", "更新情報", "漏えい情報"], correctIndex: 3 },
  { id: "vc-cs1-21", chapterId: "cs-ch1", direction: "ja-to-vi", term: "ホスピタリティ", options: ["Lòng hiếu khách, tinh thần phục vụ tận tâm", "Sự vội vàng", "Kỷ luật", "Chi phí"], correctIndex: 0 },
  { id: "vc-cs1-22", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Ứng biến, xử lý linh hoạt", options: ["マニュアル", "臨機応変", "規則", "慣習"], correctIndex: 1 },
  { id: "vc-cs1-23", chapterId: "cs-ch1", direction: "ja-to-vi", term: "声掛け", options: ["Im lặng phục vụ", "Ghi chú order", "Chủ động lên tiếng (báo khách chờ...)", "Kiểm tra hóa đơn"], correctIndex: 2 },
  { id: "vc-cs1-24", chapterId: "cs-ch1", direction: "vi-to-ja", term: "Ưu tiên phục vụ món ăn trước", options: ["レジ精算優先", "ご案内優先", "下げ優先", "料理提供優先"], correctIndex: 3 },

  // cs-ch2: gom từ thuật ngữ食物アレルギー/消費期限賞味期限/食の多様化 + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-cs2-1", chapterId: "cs-ch2", direction: "ja-to-vi", term: "食物アレルギー", options: ["Dị ứng thực phẩm", "Ngộ độc thực phẩm", "Không dung nạp lactose", "Béo phì"], correctIndex: 0 },
  { id: "vc-cs2-2", chapterId: "cs-ch2", direction: "vi-to-ja", term: "Sốc phản vệ", options: ["食中毒", "アナフィラキシーショック", "熱中症", "脱水症"], correctIndex: 1 },
  { id: "vc-cs2-3", chapterId: "cs-ch2", direction: "ja-to-vi", term: "コンタミネーション", options: ["Bảo quản lạnh", "Chế biến nhiệt", "Nhiễm chéo (lẫn dị nguyên)", "Đóng gói"], correctIndex: 2 },
  { id: "vc-cs2-4", chapterId: "cs-ch2", direction: "vi-to-ja", term: "8 nguyên liệu dị ứng đặc biệt (bắt buộc ghi nhãn)", options: ["一般原材料", "加工原材料", "輸入原材料", "特定原材料"], correctIndex: 3 },
  { id: "vc-cs2-5", chapterId: "cs-ch2", direction: "ja-to-vi", term: "消費期限", options: ["Hạn sử dụng (an toàn)", "Hạn dùng tốt nhất", "Ngày sản xuất", "Ngày nhập kho"], correctIndex: 0 },
  { id: "vc-cs2-6", chapterId: "cs-ch2", direction: "vi-to-ja", term: "Hạn dùng tốt nhất", options: ["消費期限", "賞味期限", "製造日", "納品日"], correctIndex: 1 },
  { id: "vc-cs2-7", chapterId: "cs-ch2", direction: "ja-to-vi", term: "未成年者", options: ["Người cao tuổi", "Người nước ngoài", "Người chưa thành niên", "Người khuyết tật"], correctIndex: 2 },
  { id: "vc-cs2-8", chapterId: "cs-ch2", direction: "vi-to-ja", term: "Tiêu chuẩn Halal (đạo Hồi)", options: ["ベジタリアン", "ヴィーガン", "グルテンフリー", "ハラール"], correctIndex: 3 },
  { id: "vc-cs2-9", chapterId: "cs-ch2", direction: "ja-to-vi", term: "ベジタリアン", options: ["Người ăn chay", "Người ăn kiêng đường", "Người dị ứng hải sản", "Người theo đạo Hồi"], correctIndex: 0 },
  { id: "vc-cs2-10", chapterId: "cs-ch2", direction: "vi-to-ja", term: "Người thuần chay (không dùng sản phẩm động vật)", options: ["ベジタリアン", "ヴィーガン", "ムスリム", "ハラール"], correctIndex: 1 },
  { id: "vc-cs2-11", chapterId: "cs-ch2", direction: "ja-to-vi", term: "ムスリム", options: ["Người ăn chay", "Người thuần chay", "Người theo đạo Hồi", "Người theo đạo Phật"], correctIndex: 2 },
  { id: "vc-cs2-12", chapterId: "cs-ch2", direction: "vi-to-ja", term: "Vị giác", options: ["嗅覚", "触覚", "聴覚", "味覚"], correctIndex: 3 },
  { id: "vc-cs2-13", chapterId: "cs-ch2", direction: "ja-to-vi", term: "再発防止", options: ["Phòng ngừa tái diễn", "Khuyến mãi", "Tuyển dụng", "Quảng cáo"], correctIndex: 0 },
  { id: "vc-cs2-14", chapterId: "cs-ch2", direction: "vi-to-ja", term: "Mở nắp/bao bì (thực phẩm)", options: ["賞味", "消費", "開封", "保存"], correctIndex: 2 },
  { id: "vc-cs2-15", chapterId: "cs-ch2", direction: "ja-to-vi", term: "保存方法", options: ["Cách chế biến", "Cách trình bày", "Cách bảo quản", "Cách order"], correctIndex: 2 },
  { id: "vc-cs2-16", chapterId: "cs-ch2", direction: "vi-to-ja", term: "Bảo hành của nhà sản xuất", options: ["店舗保証", "従業員保証", "顧客保証", "メーカーの保証"], correctIndex: 3 },

  // cs-ch3: gom từ thuật ngữ開店閉店/清掃/レジ現金管理/夜間金庫 + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-cs3-1", chapterId: "cs-ch3", direction: "ja-to-vi", term: "開店準備", options: ["Chuẩn bị mở cửa", "Chuẩn bị đóng cửa", "Kiểm kê kho", "Đào tạo nhân viên"], correctIndex: 0 },
  { id: "vc-cs3-2", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Công tác đóng cửa", options: ["開店準備", "閉店作業", "清掃作業", "レジ操作"], correctIndex: 1 },
  { id: "vc-cs3-3", chapterId: "cs-ch3", direction: "ja-to-vi", term: "ラストオーダー", options: ["Đơn hàng đầu tiên", "Đơn hàng lớn nhất", "Gọi món cuối cùng (trước khi đóng cửa)", "Đơn hàng online"], correctIndex: 2 },
  { id: "vc-cs3-4", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Chốt sổ quỹ", options: ["開店準備", "釣銭補充", "夜間金庫", "レジ締め"], correctIndex: 3 },
  { id: "vc-cs3-5", chapterId: "cs-ch3", direction: "ja-to-vi", term: "セキュリティー装置", options: ["Thiết bị an ninh", "Thiết bị nấu ăn", "Thiết bị đo lường", "Thiết bị làm lạnh"], correctIndex: 0 },
  { id: "vc-cs3-6", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Cảm giác sạch sẽ", options: ["雰囲気", "清潔感", "高級感", "安心感"], correctIndex: 1 },
  { id: "vc-cs3-7", chapterId: "cs-ch3", direction: "ja-to-vi", term: "モップ", options: ["Chổi quét", "Khăn lau", "Cây lau nhà (mop)", "Bàn chải"], correctIndex: 2 },
  { id: "vc-cs3-8", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Dụng cụ gạt kính (squeegee)", options: ["ほうき", "たわし", "ぞうきん", "スクイジー"], correctIndex: 3 },
  { id: "vc-cs3-9", chapterId: "cs-ch3", direction: "ja-to-vi", term: "希釈濃度", options: ["Nồng độ pha loãng", "Nhiệt độ sôi", "Độ pH", "Áp suất"], correctIndex: 0 },
  { id: "vc-cs3-10", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Tiền lẻ (tồn quỹ để thối)", options: ["売上金", "釣銭", "入金票", "現金有り高"], correctIndex: 1 },
  { id: "vc-cs3-11", chapterId: "cs-ch3", direction: "ja-to-vi", term: "キャッシュレス決済", options: ["Thanh toán tiền mặt", "Thanh toán trả góp", "Thanh toán không tiền mặt", "Thanh toán trước"], correctIndex: 2 },
  { id: "vc-cs3-12", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Số tiền mặt thực có", options: ["釣銭", "誤差", "入金票", "現金有り高"], correctIndex: 3 },
  { id: "vc-cs3-13", chapterId: "cs-ch3", direction: "ja-to-vi", term: "誤差", options: ["Sai lệch", "Chính xác", "Doanh thu", "Chi phí"], correctIndex: 0 },
  { id: "vc-cs3-14", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Két đêm", options: ["店内金庫", "夜間金庫", "レジ", "金融機関"], correctIndex: 1 },
  { id: "vc-cs3-15", chapterId: "cs-ch3", direction: "ja-to-vi", term: "入金票", options: ["Hóa đơn bán hàng", "Phiếu đặt hàng", "Phiếu nộp tiền", "Phiếu lương"], correctIndex: 2 },
  { id: "vc-cs3-16", chapterId: "cs-ch3", direction: "vi-to-ja", term: "Phòng chống trộm cắp/tội phạm", options: ["衛生管理", "労働安全", "品質管理", "防犯"], correctIndex: 3 },

  // cs-ch4: gom từ thuật ngữ クレーム対応/異物混入 + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-cs4-1", chapterId: "cs-ch4", direction: "ja-to-vi", term: "クレーム", options: ["Khiếu nại", "Lời khen", "Đơn đặt hàng", "Hóa đơn"], correctIndex: 0 },
  { id: "vc-cs4-2", chapterId: "cs-ch4", direction: "vi-to-ja", term: "Xin lỗi trang trọng", options: ["感謝", "丁重なお詫び", "挨拶", "説明"], correctIndex: 1 },
  { id: "vc-cs4-3", chapterId: "cs-ch4", direction: "ja-to-vi", term: "異物混入", options: ["Thiếu nguyên liệu", "Sai order", "Dị vật lẫn vào (trong món ăn)", "Nấu chưa chín"], correctIndex: 2 },
  { id: "vc-cs4-4", chapterId: "cs-ch4", direction: "vi-to-ja", term: "Tóc (lẫn trong món ăn)", options: ["まつげ", "眉毛", "体毛", "髪の毛"], correctIndex: 3 },
  { id: "vc-cs4-5", chapterId: "cs-ch4", direction: "ja-to-vi", term: "まつげ", options: ["Lông mi", "Lông mày", "Lông tay", "Móng tay"], correctIndex: 0 },
  { id: "vc-cs4-6", chapterId: "cs-ch4", direction: "vi-to-ja", term: "Lông mày", options: ["まつげ", "眉毛", "体毛", "髪の毛"], correctIndex: 1 },
  { id: "vc-cs4-7", chapterId: "cs-ch4", direction: "ja-to-vi", term: "体毛", options: ["Da đầu", "Móng", "Lông cơ thể", "Tóc giả"], correctIndex: 2 },
  { id: "vc-cs4-8", chapterId: "cs-ch4", direction: "vi-to-ja", term: "Phòng ngừa tái diễn", options: ["原因調査", "責任追及", "再発防止", "謝罪文"], correctIndex: 2 },
  { id: "vc-cs4-9", chapterId: "cs-ch4", direction: "ja-to-vi", term: "捕虫器", options: ["Đèn bẫy côn trùng", "Máy hút bụi", "Máy lọc không khí", "Bẫy chuột"], correctIndex: 0 },
  { id: "vc-cs4-10", chapterId: "cs-ch4", direction: "vi-to-ja", term: "Thu hút (côn trùng)", options: ["駆除", "誘引", "消毒", "隔離"], correctIndex: 1 },
  { id: "vc-cs4-11", chapterId: "cs-ch4", direction: "ja-to-vi", term: "伝票をキャンセルする", options: ["Ghi thêm order", "In lại hóa đơn", "Hủy hóa đơn", "Chuyển bàn"], correctIndex: 2 },
  { id: "vc-cs4-12", chapterId: "cs-ch4", direction: "vi-to-ja", term: "Sự việc thực tế (đã xác nhận)", options: ["予想", "推測", "意見", "事実"], correctIndex: 3 },

  // cs-ch5 (1/2): gom từ thuật ngữ体調不良者対応/AED + đã dùng ở Trắc nghiệm/Dịch câu/Sắp xếp câu chương này.
  { id: "vc-cs5-1", chapterId: "cs-ch5", direction: "ja-to-vi", term: "体調不良者", options: ["Người bị khó chịu trong người", "Người say rượu", "Người dị ứng", "Người khiếm thính"], correctIndex: 0 },
  { id: "vc-cs5-2", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Người đi cùng", options: ["従業員", "同伴者", "責任者", "救急隊員"], correctIndex: 1 },
  { id: "vc-cs5-3", chapterId: "cs-ch5", direction: "ja-to-vi", term: "意識", options: ["Thị giác", "Thính giác", "Ý thức, tỉnh táo", "Vị giác"], correctIndex: 2 },
  { id: "vc-cs5-4", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Xe cấp cứu", options: ["消防車", "パトカー", "タクシー", "救急車"], correctIndex: 3 },
  { id: "vc-cs5-5", chapterId: "cs-ch5", direction: "ja-to-vi", term: "てんかん発作", options: ["Cơn động kinh", "Cơn đau tim", "Cảm cúm", "Say nắng"], correctIndex: 0 },
  { id: "vc-cs5-6", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Ngừng tim", options: ["脳卒中", "心停止", "骨折", "やけど"], correctIndex: 1 },
  { id: "vc-cs5-7", chapterId: "cs-ch5", direction: "ja-to-vi", term: "AED", options: ["Bình cứu hỏa", "Hộp sơ cứu", "Máy khử rung tim tự động", "Máy đo huyết áp"], correctIndex: 2 },
  { id: "vc-cs5-8", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Đào tạo, huấn luyện", options: ["採用", "評価", "昇進", "訓練"], correctIndex: 3 },
  { id: "vc-cs5-9", chapterId: "cs-ch5", direction: "ja-to-vi", term: "抱き起こす", options: ["Đỡ dậy, bế lên", "Đặt nằm xuống", "Che chắn", "Quạt mát"], correctIndex: 0 },
  { id: "vc-cs5-10", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Chờ đợi tại chỗ", options: ["搬送", "待機", "避難", "移動"], correctIndex: 1 },
  { id: "vc-cs5-11", chapterId: "cs-ch5", direction: "ja-to-vi", term: "緊急時", options: ["Thời gian rảnh", "Giờ cao điểm", "Tình huống khẩn cấp", "Ngày lễ"], correctIndex: 2 },
  { id: "vc-cs5-12", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Máy khử rung tim tự động (tên đầy đủ)", options: ["除菌装置", "消火装置", "警報装置", "自動体外式除細動器"], correctIndex: 3 },

  // cs-ch5 (2/2): gom từ phụ lục（参考）サービス基本用語 (trang 20-21, phụ lục CUỐI CÙNG toàn bộ app — đọc được đầy đủ).
  { id: "vc-cs5-13", chapterId: "cs-ch5", direction: "ja-to-vi", term: "アイドルタイム", options: ["Khung giờ vắng khách", "Khung giờ đông khách", "Giờ nghỉ trưa", "Giờ tan ca"], correctIndex: 0 },
  { id: "vc-cs5-14", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Nhà hàng tự phục vụ kiểu cafeteria", options: ["テーブルサービス", "カフェテリア", "ファストフード", "デリバリー"], correctIndex: 1 },
  { id: "vc-cs5-15", chapterId: "cs-ch5", direction: "ja-to-vi", term: "客席レイアウト", options: ["Thực đơn món ăn", "Lịch làm việc", "Bố trí bàn ghế và lối đi", "Bảng giá"], correctIndex: 2 },
  { id: "vc-cs5-16", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Phân khúc khách hàng (nhân khẩu, giá trị...)", options: ["客単価", "来店頻度", "口コミ", "客層"], correctIndex: 3 },
  { id: "vc-cs5-17", chapterId: "cs-ch5", direction: "ja-to-vi", term: "苦情処理", options: ["Xử lý khiếu nại", "Xử lý tồn kho", "Xử lý đơn hàng", "Xử lý lương"], correctIndex: 0 },
  { id: "vc-cs5-18", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Truyền miệng (giữa bạn bè, người quen)", options: ["広告", "口コミ", "チラシ", "SNS"], correctIndex: 1 },
  { id: "vc-cs5-19", chapterId: "cs-ch5", direction: "ja-to-vi", term: "クレンリネス", options: ["Chất lượng (Q)", "Dịch vụ (S)", "Sạch sẽ (C trong QSC)", "Bầu không khí (A)"], correctIndex: 2 },
  { id: "vc-cs5-20", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Trạm phục vụ (gần lối vào, dễ quan sát toàn sảnh)", options: ["パントリー", "キッチン", "レジ", "サービスステーション"], correctIndex: 3 },
  { id: "vc-cs5-21", chapterId: "cs-ch5", direction: "ja-to-vi", term: "サービングタイム", options: ["Thời gian từ khi nhận order đến khi phục vụ món", "Thời gian dọn bàn", "Thời gian đóng cửa", "Thời gian nghỉ giữa ca"], correctIndex: 0 },
  { id: "vc-cs5-22", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Công việc phụ (dọn dẹp/bổ sung khi rảnh tay)", options: ["メインワーク", "サイドワーク", "ナイトワーク", "デスクワーク"], correctIndex: 1 },
  { id: "vc-cs5-23", chapterId: "cs-ch5", direction: "ja-to-vi", term: "サジェスティブセールス", options: ["Giảm giá đại trà", "Quảng cáo ngoài trời", "Bán hàng gợi ý (đề xuất món thêm)", "Khuyến mãi giờ vàng"], correctIndex: 2 },
  { id: "vc-cs5-24", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Sự hài lòng của khách hàng (CS)", options: ["ES", "QSC", "KPI", "カスタマーサティスファクション"], correctIndex: 3 },
  { id: "vc-cs5-25", chapterId: "cs-ch5", direction: "ja-to-vi", term: "主力商品", options: ["Món chủ lực (bán chạy, lợi nhuận cao)", "Món mới ra mắt", "Món giá rẻ nhất", "Món theo mùa"], correctIndex: 0 },
  { id: "vc-cs5-26", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Phục vụ tại bàn (khách ngồi chờ được phục vụ)", options: ["セルフサービス", "テーブルサービス", "ドライブスルー", "デリバリー"], correctIndex: 1 },
  { id: "vc-cs5-27", chapterId: "cs-ch5", direction: "ja-to-vi", term: "テーブルセッティング", options: ["Dọn bàn sau khi ăn", "Order món", "Chuẩn bị dao nĩa/ly tách trên bàn theo món", "Tính tiền"], correctIndex: 2 },
  { id: "vc-cs5-28", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Phục vụ đồng thời các món chính cùng bàn", options: ["中間サービス", "プレバッシング", "デシャップ", "同時同卓提供"], correctIndex: 3 },
  { id: "vc-cs5-29", chapterId: "cs-ch5", direction: "ja-to-vi", term: "ピークタイム", options: ["Khung giờ đông khách", "Khung giờ vắng khách", "Giờ chuẩn bị mở cửa", "Giờ đóng cửa"], correctIndex: 0 },
  { id: "vc-cs5-30", chapterId: "cs-ch5", direction: "vi-to-ja", term: "Chương trình khuyến mãi (fair, món mới/theo mùa)", options: ["セール", "フェア", "バーゲン", "キャンペーン"], correctIndex: 1 },
  { id: "vc-cs5-31", chapterId: "cs-ch5", direction: "ja-to-vi", term: "来店頻度", options: ["Đơn giá trung bình khách", "Số lượng nhân viên", "Tần suất khách quay lại trong 1 khoảng thời gian", "Diện tích cửa hàng"], correctIndex: 2 },
];

// Thí điểm Phần 1 (店舗運営, sm-ch1..8) trước khi nhân rộng — xem docs/modules/dac-dinh.md.
// Chuẩn nguồn: TÌNH HUỐNG (scenario) do AI tự soạn, KHÔNG trích dẫn nguyên văn — nhưng đáp án đúng +
// giải thích bắt buộc bám đúng 1 quy tắc/công thức/số liệu đã có sourceQuoteJa/sourcePage xác minh
// trong QUESTIONS/REORDERS cùng chương (tái dùng citation, không tạo quy tắc mới). Số liệu trong các
// câu tính toán (kind="calculation") là số liệu MỚI do AI đặt ra để áp dụng công thức thật, không phải
// số liệu trích nguyên văn từ tài liệu — công thức mới là phần được cite.
export const SCENARIOS: ScenarioQuestion[] = [
  {
    id: "sg-sm1-1",
    chapterId: "sm-ch1",
    kind: "judgment",
    scenarioJa: "あなたはある焼肉店でホールスタッフとして働いています。お客様が入店してすぐに最初の1品を注文しました。",
    scenarioVi: "Bạn làm nhân viên phục vụ tại một quán nướng thịt (焼肉店). Khách vừa vào quán liền gọi món đầu tiên.",
    questionJa: "QSCスタンダードに従うと、この最初の1品は何分以内に提供すべきか。",
    questionVi: "Theo tiêu chuẩn QSC, món đầu tiên này cần được phục vụ trong vòng bao nhiêu phút?",
    options: [
      { ja: "3分以内", vi: "Trong 3 phút" },
      { ja: "5分以内", vi: "Trong 5 phút" },
      { ja: "8分以内", vi: "Trong 8 phút" },
      { ja: "12分以内", vi: "Trong 12 phút" },
    ],
    correctIndex: 1,
    explanationVi:
      "Theo tiêu chuẩn Q ưu tiên số 3, quán nhậu/quán nướng thịt (居酒屋・焼肉店) có tiêu chuẩn riêng nhanh hơn: món đầu tiên phải ra trong 5 phút — khác với mức 6-8 phút cho bữa trưa thông thường.",
    sourceQuoteJa: "早く出す・・・ランチ6～8分以内、ディナー12分以内（居酒屋、焼き肉店などは最初の1品が5分以内）",
    sourcePage: 2,
  },
  {
    id: "sg-sm1-2",
    chapterId: "sm-ch1",
    kind: "judgment",
    scenarioJa:
      "ランチタイム中、常連のお客様から「最近このメニューの値段が高くなった気がする」というクレームが入りました。あなたはその時間帯の責任者です。",
    scenarioVi: "Trong giờ trưa, một khách quen phàn nàn \"Dạo này thấy giá món này tăng lên rồi\". Bạn đang là người phụ trách khung giờ này (時間帯責任者).",
    questionJa: "このクレーム対応は、時間帯責任者のマネジメント業務に含まれるか。",
    questionVi: "Việc xử lý khiếu nại này có thuộc phạm vi công việc quản lý của người phụ trách khung giờ không?",
    options: [
      { ja: "含まれる。顧客管理（クレーム対応）は時間帯責任者の業務の一つ", vi: "Có. Quản lý khách hàng (xử lý khiếu nại) là một trong các công việc của người phụ trách khung giờ" },
      { ja: "含まれない。価格に関することは本部の専権事項なので一切対応してはいけない", vi: "Không. Vì liên quan giá cả là thẩm quyền riêng của trụ sở chính nên tuyệt đối không được xử lý" },
      { ja: "含まれない。クレームは店長のみが対応する", vi: "Không. Chỉ cửa hàng trưởng mới được xử lý khiếu nại" },
      { ja: "含まれるが、その場で値下げを即決してよい", vi: "Có, và được quyền quyết định giảm giá ngay tại chỗ" },
    ],
    correctIndex: 0,
    explanationVi:
      "顧客管理（クレーム対応）nằm trong 4 mảng quản lý mà 時間帯責任者 phụ trách theo tài liệu (cùng với giá vốn, chi phí điện nước, giờ công nhân sự). Tuy nhiên xử lý khiếu nại không đồng nghĩa với tự ý giảm giá — cần theo đúng quy trình xử lý khiếu nại chuẩn của cửa hàng.",
    sourceQuoteJa:
      "※上記のマネジメントとは、原価管理に関する発注・検品収納管理、水道光熱費などコスト管理、顧客管理（カスタマリーリレーションやクレーム対応）、人件費に関する時間管理や不足要員の手配などです。",
    sourcePage: 1,
  },
  {
    id: "sg-sm2-1",
    chapterId: "sm-ch2",
    kind: "calculation",
    scenarioJa: "ある店舗の1日の売上高は500,000円、その日の総労働時間は100時間でした。",
    scenarioVi: "Doanh thu 1 ngày của một cửa hàng là 500.000 yên, tổng giờ lao động trong ngày là 100 giờ.",
    questionJa: "この日の人時売上高はいくらか。",
    questionVi: "Doanh thu theo giờ công (人時売上高) của ngày hôm đó là bao nhiêu?",
    options: [
      { ja: "50,000円", vi: "50.000 yên" },
      { ja: "500円", vi: "500 yên" },
      { ja: "5,000円", vi: "5.000 yên" },
      { ja: "5,000,000円", vi: "5.000.000 yên" },
    ],
    correctIndex: 2,
    explanationVi: "人時売上高 ＝ 売上高÷総労働時間 → 500,000円÷100時間＝5,000円.",
    sourceQuoteJa: "１日の売上高÷１日の総労働時間=人時売上高",
    sourcePage: 3,
  },
  {
    id: "sg-sm2-2",
    chapterId: "sm-ch2",
    kind: "calculation",
    scenarioJa: "ある月の原価高は45,000円、売上高は150,000円でした。",
    scenarioVi: "Trong một tháng, giá vốn (原価高) là 45.000 yên, doanh thu là 150.000 yên.",
    questionJa: "この月の原価率はいくらか。",
    questionVi: "Tỷ lệ giá vốn (原価率) của tháng đó là bao nhiêu?",
    options: [
      { ja: "45%", vi: "45%" },
      { ja: "30%", vi: "30%" },
      { ja: "15%", vi: "15%" },
      { ja: "3.3%", vi: "3.3%" },
    ],
    correctIndex: 1,
    explanationVi: "原価率＝原価高÷売上高×100 → 45,000円÷150,000円×100＝30%.",
    sourceQuoteJa: "原価高を売上高で割り１００を掛けたものが原価率となります。",
    sourcePage: 4,
  },
  {
    id: "sg-sm2-3",
    chapterId: "sm-ch2",
    kind: "calculation",
    scenarioJa: "あるお客様が来店し、3品を注文しました。一品当たりの平均単価は500円でした。",
    scenarioVi: "Một khách đến quán và gọi 3 món. Đơn giá trung bình mỗi món là 500 yên.",
    questionJa: "このお客様の客単価はいくらか。",
    questionVi: "Đơn giá trung bình (客単価) của vị khách này là bao nhiêu?",
    options: [
      { ja: "500円", vi: "500 yên" },
      { ja: "167円", vi: "167 yên" },
      { ja: "1,000円", vi: "1.000 yên" },
      { ja: "1,500円", vi: "1.500 yên" },
    ],
    correctIndex: 3,
    explanationVi: "客単価＝注文点数×一品平均単価 → 3×500円＝1,500円.",
    sourceQuoteJa: "客単価＝注文点数×一品平均単価",
    sourcePage: 6,
  },
  {
    id: "sg-sm2-4",
    chapterId: "sm-ch2",
    kind: "judgment",
    scenarioJa: "月末の集計で、あなたの店舗の労働分配率が48％になっていることが分かりました。",
    scenarioVi: "Vào cuối tháng, bạn phát hiện tỷ lệ phân phối lao động (労働分配率) của cửa hàng mình là 48%.",
    questionJa: "この数値についてどう判断すべきか。",
    questionVi: "Bạn nên đánh giá con số này như thế nào?",
    options: [
      { ja: "適正範囲（35～40%）を超えており、店舗としての目安（40%以下）も上回っている危険水準", vi: "Vượt ngưỡng hợp lý (35-40%), đồng thời vượt cả mức khuyến nghị cho từng cửa hàng (dưới 40%) — mức nguy hiểm" },
      { ja: "問題ない、労働分配率は高いほど良い指標だから", vi: "Không sao, vì tỷ lệ phân phối lao động càng cao càng tốt" },
      { ja: "適正範囲内なので何もしなくてよい", vi: "Nằm trong ngưỡng hợp lý nên không cần làm gì" },
      { ja: "労働分配率は原価率と無関係な指標なので無視してよい", vi: "Đây là chỉ số không liên quan gì đến tỷ lệ giá vốn nên có thể bỏ qua" },
    ],
    correctIndex: 0,
    explanationVi:
      "労働分配率 hợp lý theo OTAFF là 35-40%; để cả doanh nghiệp giữ trong ngưỡng đó, TỪNG cửa hàng cần giảm xuống dưới 40%. 48% đã vượt xa cả 2 mốc này, cần rà soát giảm giờ công hoặc tăng doanh thu.",
    sourceQuoteJa:
      "企業全体として労働分配率を適正値内で収めるには、店舗での労働分配率を４０％以下に低減させる必要があるのです。",
    sourcePage: 4,
  },
  {
    id: "sg-sm3-1",
    chapterId: "sm-ch3",
    kind: "judgment",
    scenarioJa: "マグロを10キロ発注し、納品書にも10キロと記載されていましたが、検収作業で実際に測ると6キロしかありませんでした。",
    scenarioVi: "Bạn đặt 10kg cá ngừ, phiếu giao hàng cũng ghi 10kg, nhưng khi kiểm nhận thực tế cân lại chỉ có 6kg.",
    questionJa: "このとき、あなたが取るべき正しい行動はどれか。",
    questionVi: "Trong tình huống này, hành động đúng bạn cần làm là gì?",
    options: [
      { ja: "納品書通りなので、そのままサインして受け取る", vi: "Vì khớp với phiếu giao hàng nên cứ ký nhận bình thường" },
      { ja: "現品の数量を確認し、納品書との差異をその場で業者に指摘し訂正を求める", vi: "Xác nhận số lượng thực tế, chỉ ra ngay tại chỗ chênh lệch với phiếu giao hàng và yêu cầu điều chỉnh" },
      { ja: "差異には気づいたが、少量なので無視してサインする", vi: "Nhận ra chênh lệch nhưng vì ít nên bỏ qua và vẫn ký" },
      { ja: "業者を疑うのは失礼なので確認自体をしない", vi: "Nghi ngờ nhà cung cấp là bất lịch sự nên không kiểm tra gì cả" },
    ],
    correctIndex: 1,
    explanationVi:
      "検収 đòi hỏi xác nhận cả B) số lượng trên phiếu và C) số lượng+chất lượng thực tế. Nếu ký nhận theo phiếu (10kg) trong khi thực tế chỉ 6kg, cửa hàng vẫn phải trả tiền cho phần thiếu — phát sinh khoản hao hụt \"vô hình\" như ví dụ thực tế trong tài liệu (thiếu 4kg tương đương 20.000 yên).",
    sourceQuoteJa:
      "例えば、仕入れ単価の高いマグロの納品書の数量（B）は１０キロと記されていても、実際に納入された現品の数量（C）が６キロの場合、検収時に気づかず納品書にサインして業者に手渡せば、この段階で４キロのロスが発生しています。仮にキロ当たり５千円のマグロなら２万円のロスです。",
    sourcePage: 16,
  },
  {
    id: "sg-sm3-2",
    chapterId: "sm-ch3",
    kind: "judgment",
    scenarioJa: "マグロを10キロ発注しましたが、納品書には12キロ、実際の現品も12キロで、数量も品質も一致していました。",
    scenarioVi: "Bạn đặt 10kg cá ngừ, nhưng phiếu giao hàng ghi 12kg và hàng thực tế cũng đúng 12kg, số lượng và chất lượng đều khớp nhau.",
    questionJa: "この状況について正しい理解はどれか。",
    questionVi: "Cách hiểu đúng về tình huống này là gì?",
    options: [
      { ja: "納品書と現品が一致しているので何の問題もない", vi: "Vì phiếu giao hàng khớp với hàng thực tế nên hoàn toàn không có vấn đề gì" },
      { ja: "多く納品されたのはサービスなので黙って受け取ってよい", vi: "Giao nhiều hơn là ưu đãi của nhà cung cấp nên cứ im lặng nhận" },
      { ja: "発注数量（10キロ）より2キロ多く納品されており、廃棄ロスや余分な支払いにつながる問題がある", vi: "Đã giao nhiều hơn 2kg so với lượng đặt (10kg), có thể dẫn đến hao hụt phải vứt bỏ và phải trả thêm tiền" },
      { ja: "検収作業では発注数量は確認しなくてよい", vi: "Khi kiểm nhận thì không cần đối chiếu với số lượng đã đặt" },
    ],
    correctIndex: 2,
    explanationVi:
      "Khớp giữa phiếu-thực tế không đồng nghĩa khớp với lượng ĐÃ ĐẶT. 2kg dư ra dễ tồn kho, hư hỏng, phải vứt bỏ (廃棄ロス), đồng thời cửa hàng vẫn phải trả tiền cho phần dư đó.",
    sourceQuoteJa:
      "仮にこのときのマグロの発注数量（A）が１０キロであったとすれば、２キロ多く納品されており問題です。売上予測に基づく発注量より多い２キロは、売れずに商品の劣化が進んで廃棄ロスになってしまいます。また、業者への支払い額も２キロ分増え問題です。",
    sourcePage: 16,
  },
  {
    id: "sg-sm3-3",
    chapterId: "sm-ch3",
    kind: "calculation",
    scenarioJa:
      "和牛を8キロ発注し、納品書にも8キロと記載されていましたが、検収時によく確認せずサインしてしまい、後で調べると実際は5キロしかありませんでした。仕入れ単価はキロ当たり6,000円です。",
    scenarioVi:
      "Bạn đặt 8kg thịt bò Wagyu, phiếu giao hàng cũng ghi 8kg, nhưng lúc kiểm nhận không kiểm tra kỹ mà đã ký nhận ngay — sau đó phát hiện thực tế chỉ có 5kg. Đơn giá nhập là 6.000 yên/kg.",
    questionJa: "この検収ミスによる見えないロスの金額はいくらか。",
    questionVi: "Số tiền hao hụt \"vô hình\" phát sinh từ sai sót kiểm nhận này là bao nhiêu?",
    options: [
      { ja: "18,000円", vi: "18.000 yên" },
      { ja: "48,000円", vi: "48.000 yên" },
      { ja: "30,000円", vi: "30.000 yên" },
      { ja: "3,000円", vi: "3.000 yên" },
    ],
    correctIndex: 0,
    explanationVi:
      "Thiếu 8kg−5kg＝3kg. Lỗ ẩn ＝ 3kg × 6,000円/kg ＝ 18,000円 — áp dụng đúng logic tính lỗ ẩn như ví dụ cá ngừ trong tài liệu (thiếu 4kg × 5,000円/kg = 20,000円).",
    sourceQuoteJa:
      "例えば、仕入れ単価の高いマグロの納品書の数量（B）は１０キロと記されていても、実際に納入された現品の数量（C）が６キロの場合、検収時に気づかず納品書にサインして業者に手渡せば、この段階で４キロのロスが発生しています。仮にキロ当たり５千円のマグロなら２万円のロスです。",
    sourcePage: 16,
  },
  {
    id: "sg-sm4-1",
    chapterId: "sm-ch4",
    kind: "judgment",
    scenarioJa: "あなたの店舗は昼と夜の食事時間帯以外（午後2時～5時）に客足が少なく困っています。",
    scenarioVi: "Cửa hàng của bạn gặp khó khăn vì vắng khách vào khung giờ ngoài bữa trưa và bữa tối (14h-17h).",
    questionJa: "このアイドルタイム対策として最も適切な販売促進はどれか。",
    questionVi: "Biện pháp xúc tiến bán hàng nào phù hợp nhất để đối phó với khung giờ vắng khách này?",
    options: [
      { ja: "時間帯割引商品を導入し、その時間帯だけ値引き商品を置く", vi: "Áp dụng sản phẩm giảm giá theo khung giờ, chỉ giảm giá trong khung giờ đó" },
      { ja: "ポイント制度を新たに導入する", vi: "Áp dụng mới chế độ tích điểm" },
      { ja: "全メニューを一律値上げする", vi: "Tăng giá đồng loạt toàn bộ thực đơn" },
      { ja: "宅配サービスをやめる", vi: "Ngừng dịch vụ giao hàng tận nơi" },
    ],
    correctIndex: 0,
    explanationVi: "時間帯割引商品 nhắm đúng vào アイドルタイム (khung giờ vắng khách ngoài giờ ăn chính) để thu hút khách đến — đúng với tình huống nêu.",
    sourceQuoteJa: "時間帯割引商品は、アイドルタイム（食事時間帯以外）用に値引き商品を置くことで来店客の誘引につなげます。",
    sourcePage: 17,
  },
  {
    id: "sg-sm4-2",
    chapterId: "sm-ch4",
    kind: "judgment",
    scenarioJa: "レジでお会計を終えたお客様に、次回使える割引券を渡そうとしています。",
    scenarioVi: "Bạn định đưa phiếu giảm giá cho lần sau cho một khách vừa thanh toán xong tại quầy thu ngân.",
    questionJa: "このタイミングでの割引券の渡し方は適切か。",
    questionVi: "Việc đưa phiếu giảm giá vào thời điểm này có phù hợp không?",
    options: [
      { ja: "不適切。来店直後に渡すべきだった", vi: "Không phù hợp. Lẽ ra phải đưa ngay lúc khách vừa vào quán" },
      { ja: "適切。レジ精算時に渡すのが正しいタイミングで再来店を促す", vi: "Phù hợp. Đưa lúc thanh toán là đúng thời điểm, giúp khuyến khích khách quay lại" },
      { ja: "不適切。割引券は絶対に渡してはいけない", vi: "Không phù hợp. Tuyệt đối không được đưa phiếu giảm giá" },
      { ja: "適切だが、効果は来店時に渡す場合と全く同じ", vi: "Phù hợp, nhưng hiệu quả hoàn toàn giống như đưa lúc khách vừa vào" },
    ],
    correctIndex: 1,
    explanationVi:
      "割引券 nhằm khuyến khích khách QUAY LẠI lần sau nên phải đưa lúc thanh toán. Nếu đưa ngay lúc khách vào quán thì chỉ là giảm giá đơn thuần cho lượt này, làm giảm doanh thu — khác hẳn hiệu quả.",
    sourceQuoteJa:
      "割引券の目的は再来店を促すためのもので、レジ精算時に渡します。ただし、来店時に渡すと単純に値引きをしているだけに過ぎないので、売上を下げる要因になります。",
    sourcePage: 17,
  },
  {
    id: "sg-sm4-3",
    chapterId: "sm-ch4",
    kind: "calculation",
    scenarioJa: "全メニューを売上順に並べ、累計売上構成比を計算したところ、あるメニューの累計構成比は82％でした。",
    scenarioVi: "Sau khi xếp toàn bộ thực đơn theo doanh thu và tính tỷ lệ cộng dồn, một món có tỷ lệ cộng dồn đạt 82%.",
    questionJa: "ABC分析でこのメニューはどの分類に入るか。",
    questionVi: "Theo phân tích ABC, món này thuộc nhóm nào?",
    options: [
      { ja: "A分類", vi: "Nhóm A" },
      { ja: "B分類", vi: "Nhóm B" },
      { ja: "C分類", vi: "Nhóm C" },
      { ja: "分類対象外", vi: "Không thuộc nhóm nào" },
    ],
    correctIndex: 1,
    explanationVi: "ABC分析: cộng dồn đến 70% là A, 70-90% là B, 90-100% là C. 82% nằm trong khoảng 70-90% nên thuộc nhóm B.",
    sourceQuoteJa:
      "ABC分析とは全メニューを売上順又は売れ個数順に並べトータルの７０％を構成するメニューをAとし、７０％から９０％を構成するメニューをBとし、９０％から１００％を構成するメニューをCとします。",
    sourcePage: 16,
  },
  {
    id: "sg-sm5-1",
    chapterId: "sm-ch5",
    kind: "judgment",
    scenarioJa: "駅前に立地するあなたの店舗では、来店するお客様の多くが「これまで見たことのない顔」です。",
    scenarioVi: "Cửa hàng của bạn nằm ngay trước ga tàu, phần lớn khách đến là \"những gương mặt chưa từng thấy trước đây\".",
    questionJa: "このような立地の店舗で高くなりやすい顧客構成はどれか。",
    questionVi: "Với vị trí cửa hàng như vậy, cơ cấu khách hàng nào thường có tỷ lệ cao?",
    options: [
      { ja: "固定顧客率", vi: "Tỷ lệ khách quen cố định" },
      { ja: "準固定顧客率のみ", vi: "Chỉ tỷ lệ khách bán cố định" },
      { ja: "客数が常にゼロになる", vi: "Số khách luôn bằng 0" },
      { ja: "新規顧客率", vi: "Tỷ lệ khách hàng mới" },
    ],
    correctIndex: 3,
    explanationVi:
      "Cửa hàng gần ga tàu, nơi lưu lượng người qua lại lớn, thường có tỷ lệ khách MỚI (新規顧客率) cao hơn — khác với đa số cửa hàng khác nơi tỷ lệ khách quen+bán cố định cao hơn.",
    sourceQuoteJa: "交通量の多い駅周辺では、新規顧客率が高くなり、それ以外の多くの店は固定顧客と準固定顧客の比率が高くなります。",
    sourcePage: 17,
  },
  {
    id: "sg-sm5-2",
    chapterId: "sm-ch5",
    kind: "judgment",
    scenarioJa: "常連のお客様が来店しました。あなたは以前、その方が辛い料理が苦手だと聞いたことを覚えています。",
    scenarioVi: "Một khách quen vừa đến quán. Bạn nhớ trước đây từng nghe khách này không ăn được cay.",
    questionJa: "固定顧客の目減りを防ぐ観点から、最も適切な接客はどれか。",
    questionVi: "Xét từ góc độ ngăn khách quen sụt giảm, cách phục vụ phù hợp nhất là gì?",
    options: [
      { ja: "顔と好みを覚えていることを活かし、「いつもありがとうございます」と声をかけ、辛さを控えたメニューをおすすめする", vi: "Tận dụng việc nhớ mặt và sở thích, chào \"cảm ơn quý khách luôn ủng hộ\", rồi gợi ý món ít cay" },
      { ja: "毎回初対面のように接客し、好みには一切触れない", vi: "Mỗi lần đều phục vụ như lần đầu gặp, không đề cập gì đến sở thích" },
      { ja: "覚えていることをアピールせず、価格だけを説明する", vi: "Không thể hiện việc đã nhớ, chỉ giải thích về giá" },
      { ja: "好みを覚えていたことを理由に、確認せず勝手に注文を決めて出す", vi: "Lấy lý do đã nhớ sở thích, tự ý quyết định món mà không hỏi lại khách" },
    ],
    correctIndex: 0,
    explanationVi:
      "Giảm sụt giảm khách quen cần: nhớ mặt, chào quen thuộc, và nhớ sở thích của họ (với tiền đề không hạ chất lượng). Tuy vậy vẫn cần tôn trọng quyền quyết định của khách — chỉ nên GỢI Ý dựa trên thông tin đã biết, không tự ý quyết thay.",
    sourceQuoteJa:
      "固定顧客の目減りを減らすためには、当然品質は落とさないことは前提ですが、固定顧客の顔をしっかり覚え、あいさつの時「いつもありがとうございます」の一言を添え、好みのメニューや席なども覚えることです。",
    sourcePage: 17,
  },
  {
    id: "sg-sm6-1",
    chapterId: "sm-ch6",
    kind: "calculation",
    scenarioJa: "あるスタッフの時給は1,000円です。この日、週40時間を超える時間外労働を2時間おこないました（深夜や休日ではありません）。",
    scenarioVi: "Một nhân viên có lương giờ 1.000 yên. Hôm đó nhân viên làm thêm 2 giờ vượt quá 40 giờ/tuần (không phải ban đêm, không phải ngày nghỉ).",
    questionJa: "この2時間分の割増賃金（本給とは別に加算される分）の最低額はいくらか。",
    questionVi: "Số tiền lương phụ trội tối thiểu (cộng thêm ngoài lương gốc) cho 2 giờ đó là bao nhiêu?",
    options: [
      { ja: "500円", vi: "500 yên" },
      { ja: "250円", vi: "250 yên" },
      { ja: "1,000円", vi: "1.000 yên" },
      { ja: "2,000円", vi: "2.000 yên" },
    ],
    correctIndex: 0,
    explanationVi: "時間外労働 割増率tối thiểu 25%. 2時間×1,000円×25%＝500円 là phần phụ trội cộng thêm.",
    sourceQuoteJa: "週４０時間を超えた労働（時間外労働）時間は割増賃金（２５％以上）を支払う必要があります。",
    sourcePage: 18,
  },
  {
    id: "sg-sm6-2",
    chapterId: "sm-ch6",
    kind: "calculation",
    scenarioJa:
      "あるスタッフが夜22時から24時まで（2時間）勤務しました。この時間帯はすでに週40時間を超えた残業時間にも該当します。時給は1,200円です。",
    scenarioVi: "Một nhân viên làm việc từ 22h đến 24h (2 giờ). Khung giờ này đồng thời đã là làm thêm giờ vượt quá 40 giờ/tuần. Lương giờ là 1.200 yên.",
    questionJa: "この2時間分の割増賃金（本給とは別に加算される分）の最低額はいくらか。",
    questionVi: "Số tiền lương phụ trội tối thiểu cho 2 giờ đó là bao nhiêu?",
    options: [
      { ja: "600円", vi: "600 yên" },
      { ja: "1,440円", vi: "1.440 yên" },
      { ja: "1,200円", vi: "1.200 yên" },
      { ja: "1,800円", vi: "1.800 yên" },
    ],
    correctIndex: 2,
    explanationVi: "深夜労働(22時-5時)と時間外労働が重複: 割増率tối thiểu 50%. 2時間×1,200円×50%＝1,200円.",
    sourceQuoteJa: "その時間帯が残業（時間外労働）になっていれば５０％以上の割増賃金となります。",
    sourcePage: 18,
  },
  {
    id: "sg-sm6-3",
    chapterId: "sm-ch6",
    kind: "calculation",
    scenarioJa:
      "あるスタッフは今月すでに残業時間が62時間に達しています。今夜、深夜0時から1時まで（1時間）さらに勤務してもらう予定です。時給は1,500円です。",
    scenarioVi: "Một nhân viên tháng này đã làm thêm giờ đến 62 giờ. Tối nay dự kiến làm thêm 1 giờ từ 0h đến 1h sáng. Lương giờ là 1.500 yên.",
    questionJa: "この1時間分の割増賃金（本給とは別に加算される分）の最低額はいくらか。",
    questionVi: "Số tiền lương phụ trội tối thiểu cho 1 giờ đó là bao nhiêu?",
    options: [
      { ja: "375円", vi: "375 yên" },
      { ja: "1,125円", vi: "1.125 yên" },
      { ja: "750円", vi: "750 yên" },
      { ja: "900円", vi: "900 yên" },
    ],
    correctIndex: 1,
    explanationVi:
      "Đã vượt 60 giờ làm thêm trong tháng, đồng thời trong khung giờ đêm (深夜) → áp dụng mức phụ trội cao nhất 75%. 1時間×1,500円×75%＝1,125円.",
    sourceQuoteJa: "月超６０時間残業労働と重複する場合：７５%以上（超６０時間残業＋深夜労働）",
    sourcePage: 18,
  },
  {
    id: "sg-sm6-4",
    chapterId: "sm-ch6",
    kind: "judgment",
    scenarioJa: "店長が「9時間勤務のうち、出勤してすぐの最初の10分間を休憩時間にしよう」と提案しました。",
    scenarioVi: "Quản lý cửa hàng đề xuất: \"Trong ca làm 9 tiếng, hãy tính 10 phút đầu ngay sau khi vào ca là giờ nghỉ\".",
    questionJa: "この提案は労働基準法上、問題があるか。",
    questionVi: "Đề xuất này có vi phạm Luật Tiêu chuẩn Lao động không?",
    options: [
      { ja: "問題ない。休憩時間はいつ設定してもよい", vi: "Không sao. Giờ nghỉ có thể đặt vào bất kỳ lúc nào" },
      { ja: "問題ない。10分あれば休憩時間の長さとして十分", vi: "Không sao. 10 phút là đủ độ dài cho giờ nghỉ" },
      { ja: "問題あるが、店長の裁量で決めてよい", vi: "Có vấn đề, nhưng quản lý được quyền tự quyết" },
      { ja: "問題がある。休憩時間を始業直後に設定することは認められておらず、8時間を超える勤務なら60分以上の休憩も必要", vi: "Có vấn đề. Không được phép đặt giờ nghỉ ngay sau khi vào ca, và ca vượt quá 8 tiếng cần tối thiểu 60 phút nghỉ" },
    ],
    correctIndex: 3,
    explanationVi:
      "Luật cấm bố trí giờ nghỉ ngay đầu ca (始業直後) hoặc cuối ca (終業直前). Ngoài ra ca vượt quá 8 giờ (ở đây là 9 giờ) cần tối thiểu 60 phút nghỉ (không phải 10 phút) — đề xuất sai cả 2 điểm.",
    sourceQuoteJa: "休憩時間を始業直後や終業直前に設定することはできません。",
    sourcePage: 18,
  },
  {
    id: "sg-sm7-1",
    chapterId: "sm-ch7",
    kind: "judgment",
    scenarioJa: "現場で実際の接客をしながら、先輩スタッフがつきっきりで指導する形式で新人を教えることになりました。",
    scenarioVi: "Bạn sẽ đào tạo nhân viên mới bằng hình thức: vừa phục vụ khách thực tế tại hiện trường, vừa có nhân viên đàn anh kèm sát chỉ dẫn.",
    questionJa: "この教育形式は何と呼ばれるか。",
    questionVi: "Hình thức đào tạo này được gọi là gì?",
    options: [
      { ja: "OJT", vi: "OJT" },
      { ja: "OFFJT", vi: "OFFJT" },
      { ja: "ストアツアー", vi: "Store Tour" },
      { ja: "啓発", vi: "Khai mở (啓発)" },
    ],
    correctIndex: 0,
    explanationVi:
      "OJT (実地訓練) = đào tạo ngay tại hiện trường công việc thực tế (như cửa hàng) — khác với OFFJT (đào tạo tập trung, học lý thuyết bên ngoài hiện trường).",
    sourceQuoteJa: "OJT は実地訓練のことで、店舗など現場でおこなうサービスや作業の技術を体得させるトレーニングです。",
    sourcePage: 21,
  },
  {
    id: "sg-sm8-1",
    chapterId: "sm-ch8",
    kind: "judgment",
    scenarioJa: "厨房のフライヤーで揚げ油が過熱し、突然火が上がりました。",
    scenarioVi: "Dầu trong chảo chiên ở bếp quá nóng và bất ngờ bốc cháy.",
    questionJa: "この火災に本文が挙げている最も適した消火法はどれか。",
    questionVi: "Phương pháp chữa cháy phù hợp nhất được tài liệu nêu ra cho đám cháy này là gì?",
    options: [
      { ja: "水をかけて消火する（冷却消火法）", vi: "Dội nước để dập lửa" },
      { ja: "毛布やシーツのような布をかぶせ、酸素を遮断する（窒息消火法）", vi: "Phủ chăn hoặc vải như ga trải giường lên để chặn oxy" },
      { ja: "そのまま放置し自然に消えるのを待つ", vi: "Cứ để mặc và chờ tự tắt" },
      { ja: "アルコールを混ぜて薄める", vi: "Trộn cồn vào để pha loãng" },
    ],
    correctIndex: 1,
    explanationVi: "Với dầu ăn bốc cháy trên fryer, tài liệu nêu rõ phương pháp 窒息消火法: phủ chăn/vải để chặn oxy, dập lửa ngay.",
    sourceQuoteJa:
      "イ 窒息消火法 燃えている油に布などをかぶせ酸素を遮断することで火を消す方法。火が上がったフライヤーに毛布やシーツのような布をかぶせることで一気に鎮火する。",
    sourcePage: 23,
  },
  {
    id: "sg-sm8-2",
    chapterId: "sm-ch8",
    kind: "judgment",
    scenarioJa: "厨房の床にこぼれたアルコールに、コンロの火花が引火してしまいました。",
    scenarioVi: "Cồn đổ tràn trên sàn bếp bị tia lửa từ bếp ga bén vào và bắt lửa.",
    questionJa: "この火災に対し、本文が挙げている消火法はどれか。",
    questionVi: "Phương pháp chữa cháy được tài liệu nêu ra cho trường hợp này là gì?",
    options: [
      { ja: "水をかけて薄めて鎮火させる（希釈消火法）", vi: "Dội nước pha loãng để dập lửa" },
      { ja: "毛布をかぶせるのみ（窒息消火法）", vi: "Chỉ phủ chăn (chữa cháy bằng chặn oxy)" },
      { ja: "ガスの元栓を閉めるのみ（除去消火法）", vi: "Chỉ đóng van gas (chữa cháy bằng loại bỏ)" },
      { ja: "窒素ガスが充満するのを待つのみ（科学的消火法）", vi: "Chỉ chờ khí nitơ tràn ra (chữa cháy bằng phản ứng hóa học)" },
    ],
    correctIndex: 0,
    explanationVi: "Riêng với cồn (アルコール) đổ tràn bắt lửa, tài liệu chỉ rõ phương pháp 希釈消火法: dội nước pha loãng để dập lửa.",
    sourceQuoteJa:
      "エ 希釈消火 燃焼しているアルコールを水で薄めて火を消す方法。床にこぼれたアルコールに引火した場合は水をかけ薄めて鎮火させる。",
    sourcePage: 23,
  },
  {
    id: "sg-sm8-3",
    chapterId: "sm-ch8",
    kind: "judgment",
    scenarioJa: "ガスコンロの元栓の閉め忘れが原因で、炎が上がり続けています。",
    scenarioVi: "Ngọn lửa tiếp tục cháy do quên đóng van gas ở bếp.",
    questionJa: "この場合、火を消すために本文が挙げている方法はどれか。",
    questionVi: "Phương pháp được tài liệu nêu ra để dập lửa trong trường hợp này là gì?",
    options: [
      { ja: "とにかく大量の水をかけ続ける", vi: "Cứ dội thật nhiều nước liên tục" },
      { ja: "アルコールをかけて薄める", vi: "Đổ cồn vào để pha loãng" },
      { ja: "ガスの元栓を閉めるなど、燃えるものを取り去る（除去消火法）", vi: "Đóng van gas, loại bỏ vật liệu cháy khỏi nguồn" },
      { ja: "窒素ガスが充満するのを待つ", vi: "Chờ khí nitơ tràn ra" },
    ],
    correctIndex: 2,
    explanationVi: "Khi nguồn cháy là do gas hở, phương pháp đúng là 除去消火法: đóng van gas, loại bỏ vật liệu cháy khỏi nguồn.",
    sourceQuoteJa: "ア 除去消火法 ガスの元栓を閉めるなど燃えるものを取り去ることで火を消す方法。",
    sourcePage: 22,
  },
  {
    id: "sg-sm7-2",
    chapterId: "sm-ch7",
    kind: "judgment",
    scenarioJa:
      "新人にレジ操作をOJTで教えたところ、1回説明しただけでまだ1人ではうまく操作できない様子です。トレーナーは「もう1回説明したから終わりにしよう」と考えています。",
    scenarioVi: "Bạn dạy nhân viên mới thao tác thu ngân theo OJT. Sau 1 lần giải thích, học viên vẫn chưa tự thao tác tốt được. Huấn luyện viên định \"giải thích 1 lần rồi thôi\".",
    questionJa: "OJTの原則に照らして、正しい対応はどれか。",
    questionVi: "Theo đúng nguyên tắc OJT, hành động đúng là gì?",
    options: [
      { ja: "トレーニーが1人でできるようになるまで継続する", vi: "Tiếp tục cho đến khi học viên có thể tự làm được một mình" },
      { ja: "1回説明すれば十分、それ以上は不要", vi: "Giải thích 1 lần là đủ, không cần thêm" },
      { ja: "トレーニーが希望しない限り続けなくてよい", vi: "Không cần tiếp tục trừ khi học viên yêu cầu" },
      { ja: "上級者に交代して任せる", vi: "Đổi sang giao cho người có trình độ cao hơn" },
    ],
    correctIndex: 0,
    explanationVi: "Nguyên tắc ⅱ của OJT: phải tiếp tục huấn luyện cho đến khi học viên có thể tự mình thực hiện được công việc/dịch vụ đó — không dừng lại chỉ vì đã giải thích 1 lần.",
    sourceQuoteJa: "ⅱ トレーニーが１人でそのサービスや作業ができるようになるまでおこなう。",
    sourcePage: 21,
  },
  {
    id: "sg-sm7-3",
    chapterId: "sm-ch7",
    kind: "judgment",
    scenarioJa: "新人にクリンリネス作業を教える前に、トレーナーが「目的・方法・道具・手順の4つだけ説明すれば十分」だと考えています。",
    scenarioVi: "Trước khi dạy công việc vệ sinh cho nhân viên mới, huấn luyện viên nghĩ rằng chỉ cần giải thích 4 điều \"Mục đích - Cách làm - Dụng cụ - Trình tự\" là đủ.",
    questionJa: "この考えは十分か。",
    questionVi: "Suy nghĩ này đã đủ chưa?",
    options: [
      { ja: "十分。4要素で説明は完結する", vi: "Đủ. Giải thích 4 yếu tố là hoàn chỉnh rồi" },
      { ja: "不十分。量・質・時間も含めた7要素すべてを説明する必要がある", vi: "Chưa đủ. Cần giải thích đủ cả 7 yếu tố, kể cả phạm vi/chất lượng/thời gian" },
      { ja: "不十分。むしろ道具の説明は不要", vi: "Chưa đủ, nhưng thực ra không cần giải thích về dụng cụ" },
      { ja: "十分どころか、目的の説明すら不要", vi: "Không chỉ đủ mà còn không cần giải thích cả mục đích" },
    ],
    correctIndex: 1,
    explanationVi: "7 yếu tố bắt buộc phải giải thích trước khi đào tạo: mục đích/cách làm/dụng cụ/trình tự/phạm vi/chất lượng/thời gian — chỉ dừng ở 4 yếu tố đầu là thiếu 3 yếu tố quan trọng (lượng, chất, thời gian).",
    sourceQuoteJa:
      "あるスキル（例えばクリンリネスのための清掃作業を想像して下さい。）について、以下の要素を初めにトレーニーに説明し、指導します。① 目的 何のために、そのサービスや作業をおこなうのか② 方法 どのように、そのサービスや作業を実施するのか③ 道具 道具は何を使用するのか④ 手順 その道具をどのような順序でどのように使うのか⑤ 量 どこからどこまでが対象範囲か⑥ 質 どのレベルに仕上げるのか⑦ 時間 完了までの標準時間（あるべき時間）はどの位が適正なのか",
    sourcePage: 20,
  },
  {
    id: "sg-sm8-4",
    chapterId: "sm-ch8",
    kind: "judgment",
    scenarioJa: "昨年、避難訓練を1回実施しました。店長は「昆虫駆除と同じで年2回すればよい」と言っています。",
    scenarioVi: "Năm ngoái quán đã diễn tập sơ tán 1 lần. Quản lý nói \"giống như diệt côn trùng, làm 2 lần/năm là được\".",
    questionJa: "この店長の発言は正しいか。",
    questionVi: "Phát biểu của quản lý có đúng không?",
    options: [
      { ja: "正しい。避難訓練も年2回が基準", vi: "Đúng. Diễn tập sơ tán cũng theo chuẩn 2 lần/năm" },
      { ja: "誤り。避難訓練は月1回が基準", vi: "Sai. Diễn tập sơ tán theo chuẩn 1 lần/tháng" },
      { ja: "誤り。避難訓練は年1回の実施が基準であり、昆虫駆除の頻度とは異なる", vi: "Sai. Diễn tập sơ tán theo chuẩn tối thiểu 1 lần/năm — khác với tần suất diệt côn trùng" },
      { ja: "正しい。消防訓練と昆虫駆除は同じ基準が適用される", vi: "Đúng. Diễn tập PCCC và diệt côn trùng áp dụng cùng 1 chuẩn" },
    ],
    correctIndex: 2,
    explanationVi: "Diễn tập sơ tán theo chuẩn tối thiểu 1 lần/năm — đây là quy tắc RIÊNG của chương phòng cháy, không liên quan đến tần suất diệt chuột/côn trùng (2 lần/năm) đã học ở chương Vệ sinh — hai quy tắc khác nhau, không thể áp dụng chéo.",
    sourceQuoteJa: "年に１回は避難訓練を実施します。あらかじめ決めておいた手順に従って役割を決めておこないます。",
    sourcePage: 23,
  },
  {
    id: "sg-sm1-3",
    chapterId: "sm-ch1",
    kind: "judgment",
    scenarioJa: "新人スタッフが「クリンリネス（C）を保つには、高価な清掃用具を導入すればよいですよね？」と尋ねてきました。",
    scenarioVi: "Nhân viên mới hỏi: \"Để giữ Clinliness (C) thì chỉ cần đầu tư dụng cụ vệ sinh đắt tiền là được phải không?\"",
    questionJa: "この考えに対する正しい指摘はどれか。",
    questionVi: "Nhận xét đúng cho suy nghĩ này là gì?",
    options: [
      { ja: "正しい。高価な道具ほど清潔さを保ちやすい", vi: "Đúng. Dụng cụ càng đắt tiền càng dễ giữ sạch sẽ" },
      { ja: "誤り。クリンリネスのベースは清掃作業や補充点検作業の徹底であり、道具の値段ではない", vi: "Sai. Nền tảng của Clinliness là triệt để thực hiện dọn dẹp và kiểm tra/bổ sung hàng, không phải giá tiền dụng cụ" },
      { ja: "誤り。クリンリネスは外部業者に完全委託すれば解決する", vi: "Sai. Clinliness sẽ được giải quyết nếu giao khoán hoàn toàn cho đơn vị bên ngoài" },
      { ja: "正しい。週1回の大掃除さえあれば道具の質は関係ない", vi: "Đúng. Chỉ cần tổng vệ sinh 1 lần/tuần thì chất lượng dụng cụ không quan trọng" },
    ],
    correctIndex: 1,
    explanationVi: "Nền tảng của C = Clinliness là việc TRIỆT ĐỂ thực hiện dọn dẹp và kiểm tra/bổ sung hàng hóa hàng ngày — không phải giá tiền hay chất lượng dụng cụ.",
    sourceQuoteJa: "それらのベースとなるのは、清掃作業や補充点検作業の徹底による、あるべき店内環境C＝クリンリネス（清潔な状態）です。",
    sourcePage: 2,
  },
  {
    id: "sg-sm1-4",
    chapterId: "sm-ch1",
    kind: "judgment",
    scenarioJa: "本日はディナータイムです。お客様が料理を注文してから、8分が経過しました。まだ提供できていません。",
    scenarioVi: "Hiện đang là giờ ăn tối (dinner). Đã 8 phút trôi qua kể từ khi khách gọi món mà vẫn chưa phục vụ được.",
    questionJa: "QSCスタンダードの基準に照らして、この状況をどう判断すべきか。",
    questionVi: "Theo tiêu chuẩn QSC, nên đánh giá tình huống này thế nào?",
    options: [
      { ja: "ディナーの基準は12分以内のため、8分はまだ基準内で問題ない", vi: "Chuẩn bữa tối là trong 12 phút, nên 8 phút vẫn nằm trong chuẩn, chưa có vấn đề" },
      { ja: "基準（ランチ6～8分以内）を超過しているため問題", vi: "Đã vượt chuẩn (bữa trưa trong 6-8 phút) nên có vấn đề" },
      { ja: "ディナーでも5分以内が絶対基準", vi: "Kể cả bữa tối, chuẩn tuyệt đối vẫn là trong 5 phút" },
      { ja: "時間帯によって基準は変わらない、常に一律", vi: "Chuẩn không đổi theo khung giờ, luôn là 1 mức duy nhất" },
    ],
    correctIndex: 0,
    explanationVi: "Chuẩn 'phục vụ nhanh' khác nhau theo bữa: bữa trưa 6-8 phút, bữa TỐI 12 phút (riêng quán nhậu/nướng thịt thì món đầu 5 phút). Tình huống này là dinner nên ngưỡng đúng là 12 phút — 8 phút vẫn trong chuẩn. Nhầm lẫn dùng ngưỡng lunch (6-8 phút) cho dinner là sai.",
    sourceQuoteJa: "早く出す・・・ランチ6～8分以内、ディナー12分以内（居酒屋、焼き肉店などは最初の1品が5分以内）",
    sourcePage: 2,
  },
  {
    id: "sg-sm2-5",
    chapterId: "sm-ch2",
    kind: "calculation",
    scenarioJa: "ある店舗の1日の粗利益は420,000円、総労働時間は70時間でした。",
    scenarioVi: "Lợi nhuận gộp 1 ngày của một cửa hàng là 420.000 yên, tổng giờ lao động trong ngày là 70 giờ.",
    questionJa: "この日の人時生産性はいくらか。",
    questionVi: "Năng suất theo giờ công (人時生産性) của ngày hôm đó là bao nhiêu?",
    options: [
      { ja: "29,400,000円", vi: "29.400.000 yên" },
      { ja: "490,000円", vi: "490.000 yên" },
      { ja: "6,000円", vi: "6.000 yên" },
      { ja: "60円", vi: "60 yên" },
    ],
    correctIndex: 2,
    explanationVi: "人時生産性＝粗利益÷総労働時間 → 420,000円÷70時間＝6,000円. Lưu ý: nhân 2 số (420,000×70) hay cộng lại là các lỗi sai phép tính thường gặp — công thức đúng là phép CHIA.",
    sourceQuoteJa: "１日の粗利益÷１日の総労働時間=人時生産性",
    sourcePage: 4,
  },
  {
    id: "sg-sm2-6",
    chapterId: "sm-ch2",
    kind: "calculation",
    scenarioJa: "ある店舗の月間人件費は1,200,000円、粗利益は3,000,000円でした。",
    scenarioVi: "Nhân công phí tháng của 1 cửa hàng là 1.200.000 yên, lợi nhuận gộp là 3.000.000 yên.",
    questionJa: "この店舗の労働分配率はいくらか。",
    questionVi: "Tỷ lệ phân phối lao động (労働分配率) của cửa hàng này là bao nhiêu?",
    options: [
      { ja: "4,200,000円", vi: "4.200.000 yên" },
      { ja: "1,800,000円", vi: "1.800.000 yên" },
      { ja: "250％", vi: "250%" },
      { ja: "40％", vi: "40%" },
    ],
    correctIndex: 3,
    explanationVi: "労働分配率＝人件費÷粗利益×100 → 1,200,000円÷3,000,000円×100＝40%. Lưu ý: đảo ngược tử số/mẫu số (lấy 3,000,000÷1,200,000) sẽ ra kết quả sai 250% — phải luôn lấy nhân công phí chia cho lợi nhuận gộp, không phải ngược lại.",
    sourceQuoteJa: "労働分配率とは粗利益に占める人件費の割合です。",
    sourcePage: 4,
  },
  {
    id: "sg-sm2-7",
    chapterId: "sm-ch2",
    kind: "calculation",
    scenarioJa: "あるお客様が5品を注文し、一品平均単価は400円でした。",
    scenarioVi: "Một khách gọi 5 món, đơn giá trung bình mỗi món là 400 yên.",
    questionJa: "この客単価はいくらか。",
    questionVi: "Đơn giá khách (客単価) là bao nhiêu?",
    options: [
      { ja: "2,000円", vi: "2.000 yên" },
      { ja: "80円", vi: "80 yên" },
      { ja: "405円", vi: "405 yên" },
      { ja: "395円", vi: "395 yên" },
    ],
    correctIndex: 0,
    explanationVi: "客単価＝注文点数×一品平均単価 → 5×400円＝2,000円. Lưu ý: đây là phép NHÂN, chia ngược (400÷5=80円) là lỗi sai công thức thường gặp.",
    sourceQuoteJa: "客単価＝注文点数×一品平均単価",
    sourcePage: 6,
  },
  {
    id: "sg-sm3-4",
    chapterId: "sm-ch3",
    kind: "calculation",
    scenarioJa:
      "エビを12キロ発注し、納品書にも12キロと記載されていましたが、検収時に気づかずサインしてしまい、後で実際は9キロしかなかったことが判明しました。仕入れ単価はキロ当たり4,000円です。",
    scenarioVi: "Bạn đặt 12kg tôm, phiếu giao hàng cũng ghi 12kg, nhưng lúc kiểm nhận không để ý mà đã ký nhận — sau đó phát hiện thực tế chỉ có 9kg. Đơn giá nhập là 4.000 yên/kg.",
    questionJa: "この検収ミスによる見えないロスの金額はいくらか。",
    questionVi: "Số tiền hao hụt \"vô hình\" do sai sót kiểm nhận này là bao nhiêu?",
    options: [
      { ja: "48,000円", vi: "48.000 yên" },
      { ja: "12,000円", vi: "12.000 yên" },
      { ja: "36,000円", vi: "36.000 yên" },
      { ja: "3,000円", vi: "3.000 yên" },
    ],
    correctIndex: 1,
    explanationVi: "Thiếu 12kg−9kg＝3kg. Lỗ ẩn＝3kg×4,000円/kg＝12,000円. Lưu ý các lỗi sai thường gặp: nhân đơn giá với TOÀN BỘ 12kg đặt hàng (48,000円) hoặc với 9kg hàng thực nhận (36,000円) đều sai — chỉ được nhân với phần THIẾU (3kg).",
    sourceQuoteJa:
      "例えば、仕入れ単価の高いマグロの納品書の数量（B）は１０キロと記されていても、実際に納入された現品の数量（C）が６キロの場合、検収時に気づかず納品書にサインして業者に手渡せば、この段階で４キロのロスが発生しています。仮にキロ当たり５千円のマグロなら２万円のロスです。",
    sourcePage: 16,
  },
  {
    id: "sg-sm4-4",
    chapterId: "sm-ch4",
    kind: "calculation",
    scenarioJa: "あるメニューの累計売上構成比が、ちょうど70.0％でした。",
    scenarioVi: "Một món có tỷ lệ cộng dồn doanh thu đúng bằng 70.0%.",
    questionJa: "ABC分析でこのメニューはどの分類に入るか。",
    questionVi: "Theo phân tích ABC, món này thuộc nhóm nào?",
    options: [
      { ja: "A分類", vi: "Nhóm A" },
      { ja: "B分類", vi: "Nhóm B" },
      { ja: "C分類", vi: "Nhóm C" },
      { ja: "この数値だけでは分類できない", vi: "Chỉ với con số này không thể phân loại được" },
    ],
    correctIndex: 0,
    explanationVi: "Theo định nghĩa, cộng dồn ĐẾN 70% (bao gồm mốc 70%) thuộc nhóm A; nhóm B bắt đầu từ TRÊN 70% đến 90%. Mốc 70.0% chính xác vẫn thuộc A, không phải B — dễ nhầm vì 70% là ranh giới giữa 2 nhóm.",
    sourceQuoteJa:
      "ABC分析とは全メニューを売上順又は売れ個数順に並べトータルの７０％を構成するメニューをAとし、７０％から９０％を構成するメニューをBとし、９０％から１００％を構成するメニューをCとします。",
    sourcePage: 16,
  },
  {
    id: "sg-sm5-3",
    chapterId: "sm-ch5",
    kind: "judgment",
    scenarioJa: "来店客数が減ってきたため、店長は「新規顧客の獲得キャンペーンを強化しよう」と提案しています。",
    scenarioVi: "Vì lượng khách giảm, quản lý đề xuất \"tăng cường chiến dịch thu hút khách mới\".",
    questionJa: "本文の内容に照らすと、この提案の妥当性はどうか。",
    questionVi: "Xét theo nội dung tài liệu, đề xuất này có hợp lý không?",
    options: [
      { ja: "妥当。客数減少の主原因は新規顧客が来ないことだから", vi: "Hợp lý. Vì nguyên nhân chính giảm khách là do khách mới không đến" },
      { ja: "妥当。新規顧客のみに集中すべきで既存客は無視してよい", vi: "Hợp lý. Nên chỉ tập trung vào khách mới, bỏ qua khách hiện tại" },
      { ja: "見直しが必要。客数減少の主な原因は固定顧客と準固定顧客の目減りであり、新規顧客獲得だけでは根本解決にならない", vi: "Cần xem lại. Nguyên nhân chính giảm khách là sự sụt giảm khách quen/bán cố định — chỉ thu hút khách mới không giải quyết được gốc rễ" },
      { ja: "関係ない。客数と顧客獲得施策は無関係", vi: "Không liên quan. Số lượng khách và biện pháp thu hút khách không liên quan gì nhau" },
    ],
    correctIndex: 2,
    explanationVi: "Tài liệu nêu rõ nguyên nhân CHÍNH khiến khách giảm là sự sụt giảm của khách quen cố định và khách bán cố định — không phải do thiếu khách mới. Đề xuất chỉ tập trung thu hút khách mới bỏ qua gốc rễ vấn đề.",
    sourceQuoteJa: "客数が減少傾向となる原因は、主に固定顧客と準固定顧客の目減りです。",
    sourcePage: 17,
  },
  {
    id: "sg-sm6-5",
    chapterId: "sm-ch6",
    kind: "calculation",
    scenarioJa: "あるスタッフが、すでに月の残業時間が65時間に達している状態で、深夜（23時〜24時）に1時間勤務しました。時給は1,200円です。",
    scenarioVi: "Một nhân viên đã làm thêm 65 giờ trong tháng, sau đó làm thêm 1 giờ vào đêm khuya (23h-24h). Lương giờ 1.200 yên.",
    questionJa: "この1時間分の割増賃金の最低額はいくらか。",
    questionVi: "Số tiền lương phụ trội tối thiểu cho 1 giờ này là bao nhiêu?",
    options: [
      { ja: "720円（休日労働＋深夜労働＝60％で計算）", vi: "720 yên (tính theo 60% của tổ hợp ngày nghỉ+đêm)" },
      { ja: "300円（深夜労働のみ25％で計算）", vi: "300 yên (tính theo 25% chỉ riêng đêm khuya)" },
      { ja: "600円（時間外労働のみ50％で計算）", vi: "600 yên (tính theo 50% chỉ riêng làm thêm giờ)" },
      { ja: "900円（月超60時間残業労働と深夜労働の重複＝75％で計算）", vi: "900 yên (tính theo 75% của tổ hợp vượt 60 giờ làm thêm + đêm khuya)" },
    ],
    correctIndex: 3,
    explanationVi: "Đã vượt 60 giờ làm thêm trong tháng (65h) VÀ đang trong khung giờ đêm (23h) — đây là tổ hợp cao nhất trong bảng: 'vượt 60h残業＋深夜労働' = 75%. Các đáp án khác bỏ sót 1 trong 2 yếu tố (hoặc chỉ tính đêm đơn thuần 25%, hoặc chỉ tính làm thêm giờ 50%, hoặc nhầm sang tổ hợp 60% dành cho ngày nghỉ).",
    sourceQuoteJa: "月超６０時間残業労働と重複する場合：７５%以上（超６０時間残業＋深夜労働）",
    sourcePage: 18,
  },
  // Phần 2: 衛生管理 (hy-ch1..5)
  {
    id: "sg-hy1-2",
    chapterId: "hy-ch1",
    kind: "judgment",
    scenarioJa: "新しく飲食店を開業したオーナーが「食品衛生法は大企業だけが守ればいい法律ですよね？」と質問してきました。",
    scenarioVi: "Chủ quán ăn mới khai trương hỏi: \"Luật Vệ sinh Thực phẩm chỉ cần các tập đoàn lớn tuân thủ thôi phải không?\"",
    questionJa: "この質問に対する正しい回答はどれか。",
    questionVi: "Câu trả lời đúng cho câu hỏi này là gì?",
    options: [
      { ja: "誤り。食品の製造・販売などをおこなう食品等事業者は規模を問わず食品衛生法に定められた内容を守らなくてはならない", vi: "Sai. Doanh nghiệp sản xuất/kinh doanh thực phẩm bất kể quy mô đều phải tuân thủ Luật Vệ sinh Thực phẩm" },
      { ja: "正しい。中小規模の店舗は法律の対象外", vi: "Đúng. Cửa hàng quy mô vừa và nhỏ không thuộc đối tượng áp dụng luật" },
      { ja: "正しい。個人経営の店は任意で守ればよい", vi: "Đúng. Quán cá nhân tuân thủ theo ý muốn là được" },
      { ja: "正しい。飲食店には適用されない法律", vi: "Đúng. Luật này không áp dụng cho quán ăn" },
    ],
    correctIndex: 0,
    explanationVi: "Luật Vệ sinh Thực phẩm áp dụng cho MỌI doanh nghiệp sản xuất/kinh doanh thực phẩm, không phân biệt quy mô lớn hay nhỏ.",
    sourceQuoteJa: "食品の製造・販売などをおこなう食品等事業者は食品衛生法に定められた内容をしっかりと守らなくてはなりません。",
    sourcePage: 1,
  },
  {
    id: "sg-hy3-1",
    chapterId: "hy-ch3",
    kind: "judgment",
    scenarioJa:
      "従業員5人ほどの小さな定食屋を経営しています。「HACCPに基づく衛生管理」を大企業と全く同じレベルで厳格に導入しなければならないか悩んでいます。",
    scenarioVi: "Bạn đang điều hành 1 quán cơm nhỏ với khoảng 5 nhân viên. Bạn đang phân vân liệu có bắt buộc phải áp dụng \"Quản lý vệ sinh dựa trên HACCP\" nghiêm ngặt y hệt tập đoàn lớn hay không.",
    questionJa: "この場合、正しい理解はどれか。",
    questionVi: "Trong trường hợp này, cách hiểu đúng là gì?",
    options: [
      { ja: "個人経営の店は衛生管理基準を一切守らなくてよい", vi: "Quán cá nhân hoàn toàn không cần tuân thủ tiêu chuẩn quản lý vệ sinh" },
      { ja: "「HACCPに基づく衛生管理」の厳格な適用は主に大規模事業者向けであり、小規模な店は必ずしも同じレベルを求められない", vi: "Việc áp dụng nghiêm ngặt \"Quản lý vệ sinh dựa trên HACCP\" chủ yếu dành cho doanh nghiệp lớn — quán nhỏ không nhất thiết phải theo cùng mức độ" },
      { ja: "従業員5人未満の店は法律の対象外", vi: "Quán dưới 5 nhân viên không thuộc đối tượng áp dụng luật" },
      { ja: "小規模店ほどより厳格な基準が課される", vi: "Quán càng nhỏ càng bị áp tiêu chuẩn nghiêm ngặt hơn" },
    ],
    correctIndex: 1,
    explanationVi: "「HACCPに基づく衛生管理」(áp dụng nghiêm ngặt 7 nguyên tắc) chủ yếu bắt buộc với doanh nghiệp quy mô lớn; doanh nghiệp nhỏ có thể dùng sổ tay linh hoạt hơn, nhưng vẫn phải tuân thủ đủ 14 tiêu chuẩn vệ sinh chung.",
    sourceQuoteJa: "「HACCPに基づく衛生管理」を大規模事業者などに義務づけています",
    sourcePage: 6,
  },
  {
    id: "sg-hy3-2",
    chapterId: "hy-ch3",
    kind: "judgment",
    scenarioJa: "来月、保健所の定期立入検査が予定されています。何を準備しておけば検査官が実施状況を確認しやすいか、店長に相談されました。",
    scenarioVi: "Tháng sau có đợt thanh tra định kỳ của trung tâm y tế. Cửa hàng trưởng hỏi bạn cần chuẩn bị gì để thanh tra viên dễ xác nhận tình trạng thực hiện.",
    questionJa: "検査官が実施状況を確認する基準となる書類は何か。",
    questionVi: "Tài liệu làm căn cứ để thanh tra viên xác nhận tình trạng thực hiện là gì?",
    options: [
      { ja: "従業員の履歴書", vi: "Sơ yếu lý lịch nhân viên" },
      { ja: "月次売上報告書", vi: "Báo cáo doanh thu hàng tháng" },
      { ja: "食品衛生監視票", vi: "Phiếu giám sát vệ sinh thực phẩm" },
      { ja: "メニュー表", vi: "Thực đơn" },
    ],
    correctIndex: 2,
    explanationVi: "食品衛生監視票 (Phiếu giám sát vệ sinh thực phẩm) là căn cứ để cơ quan y tế xác nhận tình trạng thực hiện quản lý vệ sinh — nên đây là tài liệu cần chuẩn bị/rà soát trước đợt thanh tra.",
    sourceQuoteJa: "営業許可更新時や保健所による定期的な立入検査などの監視指導時には、「食品衛生監視票」に基づいて「HACCPに沿った衛生管理」の実施状況の確認を受ける必要があります。",
    sourcePage: 5,
  },
  {
    id: "sg-hy1-1",
    chapterId: "hy-ch1",
    kind: "judgment",
    scenarioJa: "新人スタッフが「異物混入の対策さえしっかりやれば食中毒は防げますよね？」と質問してきました。",
    scenarioVi: "Một nhân viên mới hỏi: \"Chỉ cần làm tốt biện pháp chống dị vật lẫn vào món ăn là đủ để phòng ngừa ngộ độc thực phẩm phải không?\"",
    questionJa: "この質問に対する適切な回答はどれか。",
    questionVi: "Câu trả lời phù hợp cho câu hỏi này là gì?",
    options: [
      { ja: "異物混入対策だけで十分、微生物対策は不要", vi: "Chỉ cần biện pháp chống dị vật là đủ, không cần biện pháp vi sinh vật" },
      { ja: "食中毒の主原因（約90％以上）は有害微生物であり、手洗いや温度管理などの微生物対策こそ最も重要", vi: "Nguyên nhân chính (trên 90%) gây ngộ độc thực phẩm là vi sinh vật có hại, nên biện pháp vi sinh vật (rửa tay, quản lý nhiệt độ) mới là quan trọng nhất" },
      { ja: "食中毒対策は法律上おこなう義務がない", vi: "Luật không bắt buộc phải phòng ngừa ngộ độc thực phẩm" },
      { ja: "微生物対策より接客マナーの方が重要", vi: "Tác phong tiếp khách quan trọng hơn biện pháp vi sinh vật" },
    ],
    correctIndex: 1,
    explanationVi: "Trên 90% ngộ độc thực phẩm do vi sinh vật có hại gây ra, nên biện pháp phòng vi sinh vật (rửa tay, quản lý nhiệt độ...) mới là trọng tâm — chống dị vật lẫn là vấn đề khác, không thay thế được.",
    sourceQuoteJa: "ほとんどの食中毒（約９０％以上）は、食品を汚染する細菌、ウイルス、寄生虫などの有害微生物が原因物質です。",
    sourcePage: 1,
  },
  {
    id: "sg-hy2-1",
    chapterId: "hy-ch2",
    kind: "judgment",
    scenarioJa:
      "ノロウイルスによる食中毒が心配な季節になりました。「つけない」「増やさない」「やっつける」の3原則のうち、新人にどれが特に重要か説明することになりました。",
    scenarioVi: "Sắp vào mùa lo ngại ngộ độc do Norovirus. Bạn cần giải thích cho nhân viên mới xem nguyên tắc nào trong 3 nguyên tắc quan trọng hơn cả với virus này.",
    questionJa: "ノロウイルス対策として、なぜ「増やさない」ではなく「つけない」が特に重要なのか。",
    questionVi: "Vì sao với đối phó Norovirus, nguyên tắc \"không để lây nhiễm\" (つけない) quan trọng hơn \"không để sinh sôi\" (増やさない)?",
    options: [
      { ja: "ウイルスは加熱しても死滅しないため", vi: "Vì virus dù nấu chín cũng không chết" },
      { ja: "ウイルスは食品中では増えないため「増やさない」の原則が適用できず、手洗いなどの「つけない」対策が特に重要になる", vi: "Vì virus không sinh sôi trong thực phẩm nên nguyên tắc \"không để sinh sôi\" không áp dụng được, biện pháp \"không để lây nhiễm\" (như rửa tay) mới đặc biệt quan trọng" },
      { ja: "ウイルスは冷蔵庫内でのみ増殖するため", vi: "Vì virus chỉ sinh sôi trong tủ lạnh" },
      { ja: "「増やさない」の方が「つけない」より常に効果的なため", vi: "Vì \"không để sinh sôi\" luôn hiệu quả hơn \"không để lây nhiễm\"" },
    ],
    correctIndex: 1,
    explanationVi: "Virus KHÔNG tự sinh sôi trong thực phẩm (khác vi khuẩn), nên nguyên tắc 増やさない không áp dụng được cho virus — vì vậy 手洗い/つけない mới là biện pháp then chốt với Norovirus.",
    sourceQuoteJa: "ただし、ウイルスは食品中で増えないため、この原則は適用できません。",
    sourcePage: 3,
  },
  {
    id: "sg-hy2-2",
    chapterId: "hy-ch2",
    kind: "judgment",
    scenarioJa: "厨房内の室温は現在25℃です。調理済みの肉料理をここに3時間放置してしまいました。",
    scenarioVi: "Nhiệt độ phòng bếp hiện tại là 25°C. Món thịt đã nấu chín bị để quên ở đây 3 tiếng.",
    questionJa: "この状況は「増やさない」の観点からどう評価すべきか。",
    questionVi: "Xét từ góc độ nguyên tắc \"không để sinh sôi\", tình huống này nên được đánh giá thế nào?",
    options: [
      { ja: "問題ない。25℃は安全な温度である", vi: "Không sao. 25°C là nhiệt độ an toàn" },
      { ja: "危険。25℃は低温（10℃以下）にも高温（60℃以上）にも該当せず、細菌が増殖しやすい温度帯である", vi: "Nguy hiểm. 25°C không thuộc mức thấp (≤10°C) cũng không thuộc mức cao (≥60°C) — nằm trong vùng nhiệt độ thuận lợi cho vi khuẩn sinh sôi" },
      { ja: "問題ない。常温保存が推奨される温度である", vi: "Không sao. Đây là nhiệt độ được khuyến nghị để bảo quản thường" },
      { ja: "3時間以内であれば常に安全", vi: "Trong vòng 3 tiếng thì luôn an toàn" },
    ],
    correctIndex: 1,
    explanationVi: "Để tránh vi khuẩn sinh sôi, cần bảo quản ở nhiệt độ thấp (≤10°C) hoặc cao (≥60°C). 25°C nằm giữa 2 mốc này — vùng nhiệt độ lý tưởng cho vi khuẩn phát triển, nguy hiểm nếu để lâu.",
    sourceQuoteJa: "保存する食品の低温（１０℃以下）あるいは高温（６０℃以上）保管などです。",
    sourcePage: 3,
  },
  {
    id: "sg-hy4-1",
    chapterId: "hy-ch4",
    kind: "judgment",
    scenarioJa: "厨房の紫外線殺菌灯の使用記録を確認したところ、すでに3,200時間使用していることが分かりました。",
    scenarioVi: "Kiểm tra hồ sơ, bạn phát hiện đèn khử trùng tia UV trong bếp đã sử dụng 3.200 giờ.",
    questionJa: "この状況にどう対応すべきか。",
    questionVi: "Bạn nên xử lý tình huống này như thế nào?",
    options: [
      { ja: "寿命（約3,000時間）を超えているため、交換を検討すべき", vi: "Đã vượt tuổi thọ (khoảng 3.000 giờ) nên cần cân nhắc thay mới" },
      { ja: "まだ十分に使えるので交換不要", vi: "Vẫn còn dùng tốt nên chưa cần thay" },
      { ja: "3,200時間はまだ寿命の半分以下", vi: "3.200 giờ vẫn chưa tới nửa tuổi thọ" },
      { ja: "紫外線殺菌灯に寿命という概念はない", vi: "Đèn khử trùng UV không có khái niệm tuổi thọ" },
    ],
    correctIndex: 0,
    explanationVi: "Đèn khử trùng tia UV có tuổi thọ khoảng 3.000 giờ, hiệu quả khử trùng giảm dần theo thời gian sử dụng. 3.200 giờ đã vượt mốc này nên cần cân nhắc thay mới.",
    sourceQuoteJa: "紫外線殺菌灯は使用時間の経過に伴って殺菌効果が減少し、その寿命は３，０００時間程度です。",
    sourcePage: 16,
  },
  {
    id: "sg-hy4-2",
    chapterId: "hy-ch4",
    kind: "calculation",
    scenarioJa: "殺菌装置の作業開始前点検で、残留塩素濃度を測定したところ0.05ppmでした。",
    scenarioVi: "Khi kiểm tra thiết bị khử trùng trước ca làm, bạn đo được nồng độ clo dư là 0.05ppm.",
    questionJa: "この数値は基準を満たしているか。",
    questionVi: "Con số này có đạt tiêu chuẩn không?",
    options: [
      { ja: "満たしている。基準は0.01ppm以上", vi: "Đạt. Tiêu chuẩn là từ 0.01ppm trở lên" },
      { ja: "満たしていない。基準は0.1ppm以上必要", vi: "Không đạt. Tiêu chuẩn yêu cầu từ 0.1ppm trở lên" },
      { ja: "満たしている。残留塩素は多いほど良い", vi: "Đạt. Clo dư càng nhiều càng tốt" },
      { ja: "残留塩素の基準は存在しない", vi: "Không có tiêu chuẩn nào về clo dư" },
    ],
    correctIndex: 1,
    explanationVi: "Tiêu chuẩn yêu cầu nồng độ clo dư đạt tối thiểu 0.1ppm. 0.05ppm chưa đạt một nửa mức tối thiểu này — chưa đủ tiêu chuẩn.",
    sourceQuoteJa: "作業開始前に異常の有無を確認し、作動状況と残留塩素濃度が０．１ppm 以上あることを確認します。",
    sourcePage: 18,
  },
  {
    id: "sg-hy4-3",
    chapterId: "hy-ch4",
    kind: "judgment",
    scenarioJa: "業者による大規模なゴキブリ駆除処理をおこなった翌日、厨房の床に駆除されたゴキブリの死骸をいくつか見つけました。",
    scenarioVi: "Sau khi công ty diệt côn trùng xử lý diệt gián quy mô lớn, hôm sau bạn thấy vài xác gián trên sàn bếp.",
    questionJa: "このとき取るべき正しい対応はどれか。",
    questionVi: "Hành động đúng cần làm lúc này là gì?",
    options: [
      { ja: "死骸はそのまま放置してよい、いずれ自然になくなる", vi: "Có thể để nguyên xác gián, rồi tự nhiên sẽ hết" },
      { ja: "異物混入やお客様の目にふれないよう、見つけたらすぐに取り除く", vi: "Thấy là phải lấy bỏ ngay, tránh lẫn vào món ăn hoặc lọt vào mắt khách" },
      { ja: "死骸は次回の駆除まで保管しておく", vi: "Giữ lại xác gián đến lần diệt côn trùng tiếp theo" },
      { ja: "特に対応する必要はない", vi: "Không cần xử lý gì đặc biệt" },
    ],
    correctIndex: 1,
    explanationVi: "Sau xử lý diệt gián số lượng lớn, xác gián dễ xuất hiện — cần phát hiện và loại bỏ ngay để tránh lẫn vào thức ăn hoặc bị khách nhìn thấy.",
    sourceQuoteJa: "駆除処理後の調理施設内にはゴキブリの死骸が見つかりやすいので、異物混入やお客様の目にふれないように見つけたらすぐに取り除きます。",
    sourcePage: 19,
  },
  {
    id: "sg-hy4-4",
    chapterId: "hy-ch4",
    kind: "judgment",
    scenarioJa: "記録を確認したところ、この店舗ではねずみ・昆虫の駆除を昨年1回しか実施していませんでした。",
    scenarioVi: "Kiểm tra hồ sơ, bạn phát hiện cửa hàng này năm ngoái chỉ diệt chuột/côn trùng đúng 1 lần.",
    questionJa: "この実施状況は基準を満たしているか。",
    questionVi: "Tình trạng thực hiện này có đạt tiêu chuẩn không?",
    options: [
      { ja: "満たしていない。基準は年2回以上の実施", vi: "Không đạt. Tiêu chuẩn là từ 2 lần/năm trở lên" },
      { ja: "満たしている。年1回で十分", vi: "Đạt. 1 lần/năm là đủ" },
      { ja: "駆除の頻度に基準はない", vi: "Tần suất diệt trừ không có tiêu chuẩn nào" },
      { ja: "満たしている。5年に1回で十分", vi: "Đạt. 5 năm 1 lần là đủ" },
    ],
    correctIndex: 0,
    explanationVi: "Tiêu chuẩn yêu cầu diệt chuột/côn trùng tối thiểu 2 lần/năm và lưu hồ sơ 1 năm. Chỉ thực hiện 1 lần là chưa đạt.",
    sourceQuoteJa: "ねずみおよび昆虫の駆除は、１年に２回以上は実施し、その記録を１年間保管します。",
    sourcePage: 18,
  },
  {
    id: "sg-hy5-1",
    chapterId: "hy-ch5",
    kind: "judgment",
    scenarioJa: "冷凍しておいた鶏肉を、明日の営業に備えて解凍したいと考えています。時間には余裕があります。",
    scenarioVi: "Bạn muốn rã đông thịt gà đông lạnh để chuẩn bị cho kinh doanh ngày mai. Bạn có đủ thời gian.",
    questionJa: "衛生管理上、最も適切な解凍方法はどれか。",
    questionVi: "Xét về quản lý vệ sinh, phương pháp rã đông phù hợp nhất là gì?",
    options: [
      { ja: "室温に一晩置いて自然解凍する", vi: "Để qua đêm ở nhiệt độ phòng cho rã đông tự nhiên" },
      { ja: "時間はかかるが、冷蔵庫内で解凍する", vi: "Tốn thời gian, nhưng rã đông trong tủ lạnh" },
      { ja: "厨房の窓際の日当たりの良い場所に置いておく", vi: "Để ở chỗ gần cửa sổ có nắng trong bếp" },
      { ja: "解凍方法はどれを選んでも衛生上の差はない", vi: "Chọn phương pháp nào cũng không khác gì về vệ sinh" },
    ],
    correctIndex: 1,
    explanationVi:
      "Rã đông trong tủ lạnh tốn thời gian nhưng phù hợp để giữ chất lượng và ức chế vi khuẩn sinh sôi. Rã đông tự nhiên/nhiệt độ phòng bị cấm vì tạo cơ hội cho vi khuẩn sinh sôi trên bề mặt thực phẩm.",
    sourceQuoteJa: "冷蔵庫内で解凍：冷蔵庫内の空気の対流によって低温環境で解凍するため、時間がかかりますが、品質の保持、細菌増殖の抑制に適しています。",
    sourcePage: 32,
  },
  {
    id: "sg-hy5-2",
    chapterId: "hy-ch5",
    kind: "calculation",
    scenarioJa: "14:00に加熱調理が完了した料理を、14:35に温度チェックしたところ22℃でした。",
    scenarioVi: "Món ăn hoàn thành nấu lúc 14:00. Bạn kiểm tra nhiệt độ lúc 14:35, đo được 22°C.",
    questionJa: "この冷却状況は「大量調理施設衛生管理マニュアル」の基準を満たしているか。",
    questionVi: "Tình trạng làm nguội này có đạt tiêu chuẩn của \"Sổ tay quản lý vệ sinh cơ sở nấu ăn số lượng lớn\" không?",
    options: [
      { ja: "満たしていない。調理後35分経過しても20℃に達しておらず、30分以内20℃の基準を超過している", vi: "Không đạt. Đã qua 35 phút sau khi nấu mà vẫn chưa đạt 20°C, vượt quá mốc 30 phút/20°C" },
      { ja: "満たしている。1時間以内に10℃になれば良いので問題ない", vi: "Đạt. Chỉ cần trong 1 tiếng đạt 10°C là được nên không sao" },
      { ja: "満たしている。22℃は十分低い温度である", vi: "Đạt. 22°C đã là nhiệt độ đủ thấp" },
      { ja: "冷却時間に基準は存在しない", vi: "Không có tiêu chuẩn nào về thời gian làm nguội" },
    ],
    correctIndex: 0,
    explanationVi:
      "Theo sổ tay, cần đạt 20°C trong 30 phút HOẶC 10°C trong 1 giờ. Ở đây đã qua 35 phút (vượt mốc 30 phút) mà vẫn còn 22°C (chưa đạt 20°C) — đã vi phạm mốc đầu tiên nên chưa đạt chuẩn tại thời điểm kiểm tra.",
    sourceQuoteJa: "加熱済み食品の冷却方法について、「大量調理施設衛生管理マニュアル」では、３０分以内に２０℃または１時間以内に１０℃まで冷却することとしています。",
    sourcePage: 32,
  },
  {
    id: "sg-hy5-3",
    chapterId: "hy-ch5",
    kind: "calculation",
    scenarioJa: "温蔵庫内の唐揚げの温度を測定したところ58℃でした。",
    scenarioVi: "Bạn đo nhiệt độ món gà rán trong tủ giữ ấm, được 58°C.",
    questionJa: "この温度は温蔵保管の基準を満たしているか。",
    questionVi: "Nhiệt độ này có đạt tiêu chuẩn bảo quản giữ ấm không?",
    options: [
      { ja: "満たしていない。温蔵品の基準は65℃以上", vi: "Không đạt. Tiêu chuẩn cho món giữ ấm là từ 65°C trở lên" },
      { ja: "満たしている。温蔵品の基準は50℃以上", vi: "Đạt. Tiêu chuẩn cho món giữ ấm là từ 50°C trở lên" },
      { ja: "満たしている。58℃は十分に高い温度", vi: "Đạt. 58°C đã là nhiệt độ đủ cao" },
      { ja: "温蔵保管に温度基準は存在しない", vi: "Không có tiêu chuẩn nhiệt độ nào cho bảo quản giữ ấm" },
    ],
    correctIndex: 0,
    explanationVi: "温蔵品 (thực phẩm giữ ấm) cần đạt tối thiểu 65°C. 58°C chưa đạt mốc này, còn thiếu 7°C.",
    sourceQuoteJa: "温蔵品は温蔵庫内で６５℃以上、常温品は専用ケース１５～２５℃、冷蔵品は食品冷蔵庫（棚）で１０℃以下、冷凍品は食品冷凍庫内で－１５℃以下などが目安になります。",
    sourcePage: 34,
  },
  {
    id: "sg-hy1-3",
    chapterId: "hy-ch1",
    kind: "judgment",
    scenarioJa: "新人スタッフが「食中毒の患者数は毎年増え続けていますよね？だから対策しても意味がない」と言っています。",
    scenarioVi: "Nhân viên mới nói: \"Số bệnh nhân ngộ độc thực phẩm tăng liên tục mỗi năm phải không? Vậy có phòng ngừa cũng vô ích\".",
    questionJa: "この発言に対する正しい指摘はどれか。",
    questionVi: "Nhận xét đúng cho phát biểu này là gì?",
    options: [
      { ja: "正しい。患者数は年々倍増している", vi: "Đúng. Số bệnh nhân tăng gấp đôi mỗi năm" },
      { ja: "誤り。患者数は平成25年以降25,000人を下回り減少傾向が認められる", vi: "Sai. Từ năm Heisei 25 (2013), số bệnh nhân đã giảm xuống dưới 25.000 người, có xu hướng giảm" },
      { ja: "誤り。食中毒の患者数は統計が存在しない", vi: "Sai. Không có số liệu thống kê về số bệnh nhân ngộ độc thực phẩm" },
      { ja: "正しい。対策をしても患者数は変わらない", vi: "Đúng. Dù có phòng ngừa thì số bệnh nhân cũng không đổi" },
    ],
    correctIndex: 1,
    explanationVi: "Số liệu thực tế: từ năm 2013, số bệnh nhân ngộ độc thực phẩm đã GIẢM xuống dưới 25.000 người/năm, có xu hướng giảm dần — ngược lại hoàn toàn với nhận định 'tăng liên tục' của nhân viên mới.",
    sourceQuoteJa: "患者数は平成２５（２０１３）年以降２５，０００人を下まわり減少傾向が認められます",
    sourcePage: 1,
  },
  {
    id: "sg-hy2-3",
    chapterId: "hy-ch2",
    kind: "judgment",
    scenarioJa:
      "生ガキなど、ノロウイルス汚染のおそれがある食材を加熱調理することになりました。新人は「他の食品と同じく中心部75℃で1分間加熱すれば十分」と考えています。",
    scenarioVi: "Bạn cần nấu chín hàu sống — thực phẩm có nguy cơ nhiễm Norovirus. Nhân viên mới nghĩ \"giống các thực phẩm khác, chỉ cần gia nhiệt lõi đạt 75°C trong 1 phút là đủ\".",
    questionJa: "この考えは正しいか。",
    questionVi: "Suy nghĩ này có đúng không?",
    options: [
      { ja: "正しい。75℃1分間はすべての食品に共通する基準", vi: "Đúng. 75°C trong 1 phút là chuẩn chung cho mọi thực phẩm" },
      { ja: "誤り。生ガキは加熱してはいけない食材", vi: "Sai. Hàu sống là thực phẩm không được phép nấu chín" },
      { ja: "誤り。ノロウイルス汚染のおそれのある食品は85～90℃で90秒間以上のより高い基準が必要", vi: "Sai. Thực phẩm nghi nhiễm Norovirus cần chuẩn cao hơn: 85-90°C trong ít nhất 90 giây" },
      { ja: "正しい。ノロウイルスは加熱調理が不要", vi: "Đúng. Norovirus không cần gia nhiệt để xử lý" },
    ],
    correctIndex: 2,
    explanationVi: "Chuẩn gia nhiệt cơ bản (75°C/1 phút) chỉ áp dụng cho thực phẩm thông thường. Riêng thực phẩm có nguy cơ nhiễm Norovirus (như hàu, động vật 2 mảnh vỏ) cần chuẩn CAO HƠN: 85-90°C trong ít nhất 90 giây — khác với chuẩn chung.",
    sourceQuoteJa: "調理施設内では、食品の中心部が７５℃で１分間以上（ノロウイルス汚染のおそれのある食品は８５～９０℃で９０秒間以上）加熱",
    sourcePage: 4,
  },
  {
    id: "sg-hy3-3",
    chapterId: "hy-ch3",
    kind: "judgment",
    scenarioJa: "新人スタッフが「一般的な衛生管理の基準は、食品衛生責任者の選任と施設の衛生管理の2項目だけを守ればよい」と誤解しています。",
    scenarioVi: "Nhân viên mới hiểu nhầm rằng \"tiêu chuẩn quản lý vệ sinh chung chỉ cần tuân thủ 2 hạng mục: bổ nhiệm người phụ trách vệ sinh và quản lý vệ sinh cơ sở vật chất\".",
    questionJa: "この理解は正しいか。",
    questionVi: "Cách hiểu này có đúng không?",
    options: [
      { ja: "誤り。基準は全部で14項目あり、2項目だけでは不十分", vi: "Sai. Tiêu chuẩn có tổng cộng 14 hạng mục, chỉ 2 hạng mục là chưa đủ" },
      { ja: "正しい。この2項目だけで基準は満たされる", vi: "Đúng. Chỉ cần 2 hạng mục này là đủ đáp ứng tiêu chuẩn" },
      { ja: "誤り。基準は3項目のみ", vi: "Sai. Tiêu chuẩn chỉ có 3 hạng mục" },
      { ja: "正しい。項目数に基準はない", vi: "Đúng. Số lượng hạng mục không có quy định cụ thể" },
    ],
    correctIndex: 0,
    explanationVi: "Tiêu chuẩn quản lý vệ sinh chung có tổng cộng 14 hạng mục (từ bổ nhiệm người phụ trách đến đào tạo huấn luyện) — chỉ tuân thủ 2 hạng mục là thiếu rất nhiều.",
    sourceQuoteJa:
      "① 食品衛生責任者等の選任② 施設の衛生管理③ 設備等の衛生管理④ 使用水等の管理⑤ ねずみ及び昆虫対策⑥ 廃棄物及び排水の取扱い⑦ 食品又は添加物を取り扱う者の衛生管理⑧ 検食の実施⑨ 情報の提供⑩ 回収・廃棄⑪ 運搬⑫ 販売⑬ 教育訓練⑭ そのほか",
    sourcePage: 5,
  },
  {
    id: "sg-hy4-5",
    chapterId: "hy-ch4",
    kind: "judgment",
    scenarioJa:
      "「飲用に適する水」を使用している店舗で、店長が「毎日、色・濁り・臭いをチェックしていれば、正式な水質検査は不要」と考えています。",
    scenarioVi: "Cửa hàng dùng \"nước phù hợp để uống\". Quản lý nghĩ rằng \"chỉ cần kiểm tra màu/độ đục/mùi mỗi ngày là đủ, không cần kiểm tra chất lượng nước chính thức\".",
    questionJa: "この考えは正しいか。",
    questionVi: "Suy nghĩ này có đúng không?",
    options: [
      { ja: "正しい。日常点検だけで水質検査は不要", vi: "Đúng. Chỉ cần kiểm tra hàng ngày là đủ, không cần kiểm tra chất lượng nước" },
      { ja: "誤り。水質検査は10年に1回で十分", vi: "Sai. Kiểm tra chất lượng nước 10 năm 1 lần là đủ" },
      { ja: "正しい。水道水と同じ扱いでよい", vi: "Đúng. Có thể coi như nước máy thông thường" },
      { ja: "誤り。日常点検（色・濁り・臭い）に加え、年1回以上の正式な水質検査も必要", vi: "Sai. Ngoài kiểm tra hàng ngày (màu/độ đục/mùi), còn cần kiểm tra chất lượng nước chính thức tối thiểu 1 lần/năm" },
    ],
    correctIndex: 3,
    explanationVi: "Khi dùng 'nước phù hợp để uống' (khác nước máy trực tiếp), CẦN CẢ HAI: kiểm tra hàng ngày (màu/độ đục/mùi) VÀ kiểm tra chất lượng nước chính thức tối thiểu 1 lần/năm — không thể thay thế lẫn nhau.",
    sourceQuoteJa: "「飲用に適する水」を使用する場合には、１年１回以上の水質検査をおこない、貯水槽の清掃、殺菌装置・浄水装置の作動状況を定期的に確認しなければなりません。",
    sourcePage: 17,
  },
  {
    id: "sg-hy5-4",
    chapterId: "hy-ch5",
    kind: "judgment",
    scenarioJa: "カレーを100℃でしっかり煮込んだので、新人スタッフは「もう完全に安全、常温で何時間放置しても問題ない」と考えています。",
    scenarioVi: "Món cà ri đã được ninh kỹ ở 100°C. Nhân viên mới nghĩ \"đã hoàn toàn an toàn, để ở nhiệt độ phòng bao lâu cũng không sao\".",
    questionJa: "この考えは正しいか。",
    questionVi: "Suy nghĩ này có đúng không?",
    options: [
      { ja: "正しい。100℃で煮込めばすべての菌が死滅する", vi: "Đúng. Ninh ở 100°C thì mọi vi khuẩn đều bị tiêu diệt" },
      { ja: "誤り。ボツリヌス菌やウエルシュ菌などは熱に強い芽胞を形成し100℃加熱でも死滅しないため、加熱後も温度管理が必要", vi: "Sai. Các vi khuẩn như Clostridium botulinum, Clostridium perfringens tạo bào tử chịu nhiệt cao, không chết dù nấu ở 100°C — vẫn cần quản lý nhiệt độ sau khi nấu" },
      { ja: "誤り。カレーは加熱調理してはいけない食品", vi: "Sai. Cà ri là thực phẩm không được phép nấu chín" },
      { ja: "正しい。芽胞形成菌というものは存在しない", vi: "Đúng. Không tồn tại loại vi khuẩn tạo bào tử nào cả" },
    ],
    correctIndex: 1,
    explanationVi: "Các vi khuẩn tạo bào tử (như Clostridium botulinum, Clostridium perfringens, Bacillus cereus) chịu nhiệt rất cao — dù nấu ở 100°C vẫn KHÔNG bị tiêu diệt hoàn toàn, nên sau khi nấu vẫn cần quản lý nhiệt độ để ngăn bào tử phát triển trở lại — 'nấu chín kỹ' không đồng nghĩa với 'an toàn tuyệt đối vô thời hạn'.",
    sourceQuoteJa: "ボツリヌス菌、ウエルシュ菌、セレウス菌などの食中毒菌は、熱に強い芽胞を形成するため、加熱調理時に１００℃で加熱しても死滅しませんので、加熱調理後の食品であっても芽胞の増殖抑制のための温度管理が重要です。",
    sourcePage: 32,
  },
  // Phần 3: 飲食物調理 (ck-ch1..7)
  {
    id: "sg-ck1-1",
    chapterId: "ck-ch1",
    kind: "judgment",
    scenarioJa: "本日、鮮魚と貝類が同時に入荷しました。今夜のメニューでどちらを優先して使い切るべきか考えています。",
    scenarioVi: "Hôm nay cá tươi và động vật có vỏ (nghêu, sò) cùng về hàng. Bạn đang cân nhắc nên ưu tiên dùng hết loại nào trước cho thực đơn tối nay.",
    questionJa: "鮮度の観点から、優先して使い切るべきはどちらか。",
    questionVi: "Xét về độ tươi, nên ưu tiên dùng hết loại nào trước?",
    options: [
      { ja: "鮮魚。貝類は傷みにくいため後回しでよい", vi: "Cá tươi. Động vật có vỏ khó hỏng nên để sau cũng được" },
      { ja: "どちらも同じ速さで傷むため順序は関係ない", vi: "Cả hai hỏng nhanh như nhau nên thứ tự không quan trọng" },
      { ja: "貝類。魚介類の中でもっとも早く傷むため", vi: "Động vật có vỏ. Vì đây là loại hư hỏng nhanh nhất trong các loại hải sản" },
      { ja: "冷凍すれば順序を考える必要はない", vi: "Nếu cấp đông thì không cần nghĩ đến thứ tự nữa" },
    ],
    correctIndex: 2,
    explanationVi: "Hải sản hư hỏng nhanh hơn thịt; trong đó động vật có vỏ (nghêu, sò...) là hư hỏng nhanh nhất, nên cần ưu tiên dùng hết trước.",
    sourceQuoteJa: "魚介類は肉類に比べ劣化が早く、小さな魚ほど早く傷みます。もっとも早く傷むのは貝類です。",
    sourcePage: 3,
  },
  {
    id: "sg-ck3-1",
    chapterId: "ck-ch3",
    kind: "judgment",
    scenarioJa: "揚げ油を数日間交換せずに使い続けたところ、油の表面に泡が消えにくくなり、色も濃く粘り気が出てきました。",
    scenarioVi: "Dầu chiên đã dùng liên tục nhiều ngày không thay, bề mặt dầu xuất hiện bọt khó tan, màu đậm hơn và có độ nhớt.",
    questionJa: "この現象は何を示しているか。",
    questionVi: "Hiện tượng này cho thấy điều gì?",
    options: [
      { ja: "油の品質が向上している証拠", vi: "Bằng chứng cho thấy chất lượng dầu đang tốt lên" },
      { ja: "油が酸化して劣化している兆候であり、交換を検討すべき", vi: "Dấu hiệu dầu bị oxy hóa và xuống cấp, cần cân nhắc thay dầu" },
      { ja: "特に問題のない正常な状態", vi: "Trạng thái bình thường, không có vấn đề gì" },
      { ja: "塩分が不足しているサイン", vi: "Dấu hiệu thiếu muối" },
    ],
    correctIndex: 1,
    explanationVi: "Nếu tiếp tục chiên nhiều lần, dầu sẽ bị oxy hóa: màu và mùi kém đi, độ nhớt tăng, mặt dầu xuất hiện bọt khí bền — đây là dấu hiệu cần thay dầu.",
    sourceQuoteJa: "揚げ物を揚げ続けると油が酸化され、色や香りが悪くなり粘りが増してきます。そのため、油の表面には持続性の泡立ちが起こるようになります。",
    sourcePage: 6,
  },
  {
    id: "sg-ck3-2",
    chapterId: "ck-ch3",
    kind: "judgment",
    scenarioJa: "厨房に2種類の冷凍食材があります。①刺身用の生食用冷凍魚介類 ②衣をつけて凍結したフライ半製品。",
    scenarioVi: "Trong bếp có 2 loại thực phẩm đông lạnh: ① Hải sản đông lạnh dùng ăn sống (sashimi) ② Bán thành phẩm chiên đã tẩm bột và cấp đông.",
    questionJa: "①と②の適切な調理法の組み合わせはどれか。",
    questionVi: "Tổ hợp cách chế biến phù hợp cho ① và ② là gì?",
    options: [
      { ja: "①も②も常温で急速に解凍する", vi: "Cả ① và ② đều rã đông nhanh ở nhiệt độ phòng" },
      { ja: "①も②も凍ったまま提供する", vi: "Cả ① và ② đều phục vụ khi còn đông" },
      { ja: "①は凍ったまま提供、②は低温でゆっくり解凍する", vi: "① phục vụ khi còn đông, ② rã đông chậm ở nhiệt độ thấp" },
      { ja: "①は低温で時間をかけて解凍する／②は凍ったまま揚げるか電子レンジで解凍・加熱する", vi: "① rã đông ở nhiệt độ thấp trong thời gian dài / ② chiên khi còn đông hoặc rã đông-nấu chín bằng lò vi sóng" },
    ],
    correctIndex: 3,
    explanationVi:
      "① Hải sản đông lạnh dùng ăn sống phải rã đông ở nhiệt độ thấp, kéo dài thời gian để tránh phá hủy cấu trúc/chảy nước. ② Bán thành phẩm chiên tẩm bột được chế biến ngay khi còn đông (nướng/hấp/chiên) hoặc rã đông-nấu chín bằng lò vi sóng.",
    sourceQuoteJa:
      "刺身のような「生食用冷凍魚介類」は、組織の破壊や汁の流出が起きないようになるべく低温で時間をかけて解凍します。 凍結前未加熱の冷凍食品や衣をつけたフライなどのそうざい半製品は凍ったまま焼いたり、蒸したり、揚げたりするほか、電子レンジによる解凍や加熱調理をおこないます。",
    sourcePage: 7,
  },
  {
    id: "sg-ck4-1",
    chapterId: "ck-ch4",
    kind: "calculation",
    scenarioJa: "フライヤーの油を検査したところ、酸化値（AV値）が3.5でした。",
    scenarioVi: "Kiểm tra dầu trong máy chiên, chỉ số oxy hóa (AV) đo được là 3.5.",
    questionJa: "この結果に基づき、取るべき対応はどれか。",
    questionVi: "Dựa trên kết quả này, hành động cần làm là gì?",
    options: [
      { ja: "基準値内なので交換不要", vi: "Nằm trong ngưỡng chuẩn nên không cần thay" },
      { ja: "AV値が低いほど危険なので今すぐ使用を停止する", vi: "AV càng thấp càng nguy hiểm nên phải dừng dùng ngay" },
      { ja: "基準値（AV3.0未満が正常）を超えているため、その日の営業終了時に油を交換する", vi: "Đã vượt ngưỡng chuẩn (bình thường AV dưới 3.0), cần thay dầu vào cuối ca làm việc ngày đó" },
      { ja: "AV値と油の交換時期は無関係", vi: "Chỉ số AV không liên quan gì đến thời điểm thay dầu" },
    ],
    correctIndex: 2,
    explanationVi: "Chuẩn: AV dưới 3.0 là bình thường; từ 3.0 trở lên phải thay dầu vào cuối ca làm việc ngày đó. 3.5 đã vượt ngưỡng này.",
    sourceQuoteJa: "フライヤーの油の酸化値（AV 値３．０未満）が正常か確認してください。AV 値３．０以上であれば、その日の営業終了時に油を交換してください。",
    sourcePage: 8,
  },
  {
    id: "sg-ck4-2",
    chapterId: "ck-ch4",
    kind: "judgment",
    scenarioJa: "本日のコースでマグロの刺身を薄く美しく切り分ける作業を任されました。",
    scenarioVi: "Hôm nay bạn được giao nhiệm vụ thái cá ngừ sashimi mỏng và đẹp cho set món.",
    questionJa: "この作業に最も適した包丁はどれか。",
    questionVi: "Loại dao phù hợp nhất cho công việc này là gì?",
    options: [
      { ja: "柳刃包丁（刺身包丁）", vi: "Dao Yanagiba (dao sashimi)" },
      { ja: "出刃包丁（魚をさばく用、骨も切れる重い包丁）", vi: "Dao Deba (dùng mổ cá, nặng, cắt được cả xương)" },
      { ja: "菜切包丁（野菜専用）", vi: "Dao Nakiri (chuyên dùng cho rau)" },
      { ja: "中華包丁", vi: "Dao Trung Hoa" },
    ],
    correctIndex: 0,
    explanationVi: "Dao Yanagiba (柳刃包丁): lưỡi dài, chủ yếu dùng để cắt sashimi, còn gọi là 'dao sashimi' — phù hợp nhất cho việc thái mỏng, đẹp.",
    sourceQuoteJa: "柳刃包丁：刃渡りが長く、主に刺身を切るときに使用する包丁で「刺身包丁」とも呼びます。",
    sourcePage: 9,
  },
  {
    id: "sg-ck5-1",
    chapterId: "ck-ch5",
    kind: "judgment",
    scenarioJa: "フライヤーでの揚げ物作業を担当することになった新人スタッフが、サンダルのまま作業を始めようとしています。",
    scenarioVi: "Nhân viên mới được giao phụ trách chiên đồ ở fryer, đang định làm việc trong khi đi dép lê.",
    questionJa: "この状況で、あなたが指摘すべきことはどれか。",
    questionVi: "Trong tình huống này, điều bạn cần nhắc nhở là gì?",
    options: [
      { ja: "サンダルのままで問題ない", vi: "Đi dép lê cũng không sao" },
      { ja: "素手で作業すれば問題ない", vi: "Làm bằng tay không cũng không sao" },
      { ja: "防護具は上級者にのみ必要", vi: "Đồ bảo hộ chỉ cần cho người có kinh nghiệm" },
      { ja: "サンダルではなく、長靴・長エプロン・耐熱手袋を着用してから作業するべき", vi: "Không nên đi dép lê, phải mang ủng, tạp dề dài, găng tay chịu nhiệt trước khi làm việc" },
    ],
    correctIndex: 3,
    explanationVi: "Khi dùng fryer, bắt buộc phải mang ủng, tạp dề dài, găng tay chịu nhiệt — dép lê không đủ bảo hộ trước nguy cơ dầu nóng bắn.",
    sourceQuoteJa: "フライヤーを使う際は、長靴、長エプロン、耐熱手袋を着用しましょう。",
    sourcePage: 14,
  },
  {
    id: "sg-ck5-2",
    chapterId: "ck-ch5",
    kind: "judgment",
    scenarioJa: "食品加工用の切断機に食材が詰まってしまいました。急いでいたので、機械を止めずに手を入れて詰まりを取り除こうとしています。",
    scenarioVi: "Máy cắt thực phẩm bị kẹt nguyên liệu. Vì đang vội, bạn định thò tay vào lấy chỗ kẹt ra mà không tắt máy.",
    questionJa: "この行動は安全上、適切か。",
    questionVi: "Hành động này có an toàn không?",
    options: [
      { ja: "適切。急いでいるときは手で取り除いてよい", vi: "An toàn. Khi vội thì lấy tay ra cũng được" },
      { ja: "不適切。原材料の送給や取りだし時には機械の運転を停止するか用具を使用すべき", vi: "Không an toàn. Khi đưa/lấy nguyên liệu phải dừng máy hoặc dùng dụng cụ hỗ trợ" },
      { ja: "適切。切断機に安全上の注意点はない", vi: "An toàn. Máy cắt không có lưu ý an toàn nào cả" },
      { ja: "不適切だが、経験者なら問題ない", vi: "Không an toàn, nhưng người có kinh nghiệm thì không sao" },
    ],
    correctIndex: 1,
    explanationVi: "Máy cắt/thái thực phẩm phải lắp nắp che ở bộ phận nguy hiểm; khi đưa nguyên liệu vào hoặc lấy ra, PHẢI dừng máy hoặc dùng dụng cụ hỗ trợ thay vì dùng tay trực tiếp — không có ngoại lệ cho người có kinh nghiệm.",
    sourceQuoteJa: "食品加工用切断機や切削機による切断、切削の危険の防止 切断に必要な部分以外の危険な部分に覆いなどを設置 原材料の送給や取りだし時には、機械の運転を停止するか用具などを使用",
    sourcePage: 15,
  },
  {
    id: "sg-ck7-1",
    chapterId: "ck-ch7",
    kind: "judgment",
    scenarioJa: "ハムやソーセージなどの加工肉製品で、肉本来の赤みを保ち美味しそうな色合いに保つための添加物を選びたいと考えています。",
    scenarioVi: "Bạn muốn chọn phụ gia để giữ màu đỏ tự nhiên đẹp mắt cho các sản phẩm thịt chế biến như giăm bông, xúc xích.",
    questionJa: "この目的に適した添加物の種類はどれか。",
    questionVi: "Loại phụ gia phù hợp với mục đích này là gì?",
    options: [
      { ja: "甘味料", vi: "Chất tạo ngọt" },
      { ja: "膨張剤", vi: "Chất tạo xốp/nở" },
      { ja: "発色剤（例：亜硝酸ナトリウム）", vi: "Chất tạo màu ổn định (ví dụ: natri nitrit)" },
      { ja: "防カビ剤", vi: "Chất chống mốc" },
    ],
    correctIndex: 2,
    explanationVi: "発色剤 (chất tạo màu ổn định) giúp cải thiện màu sắc/hương vị của thịt, ví dụ natri nitrit, natri nitrat — đúng mục đích giữ màu đỏ đẹp cho thịt chế biến.",
    sourceQuoteJa: "発色剤 肉類の色調・風味を改善する 亜硝酸ナトリウム、硝酸ナトリウム",
    sourcePage: 17,
  },
  {
    id: "sg-ck7-2",
    chapterId: "ck-ch7",
    kind: "judgment",
    scenarioJa: "瓶詰めのソースを長期間保存できるようにし、かびや細菌の発育を抑えたいと考えています。",
    scenarioVi: "Bạn muốn sốt đóng chai bảo quản được lâu hơn và ức chế nấm mốc, vi khuẩn phát triển.",
    questionJa: "この目的に適した添加物の種類はどれか。",
    questionVi: "Loại phụ gia phù hợp với mục đích này là gì?",
    options: [
      { ja: "保存料（例：ソルビン酸）", vi: "Chất bảo quản (ví dụ: acid sorbic)" },
      { ja: "甘味料", vi: "Chất tạo ngọt" },
      { ja: "着色料", vi: "Chất tạo màu" },
      { ja: "酸味料", vi: "Chất tạo vị chua" },
    ],
    correctIndex: 0,
    explanationVi: "保存料 (chất bảo quản) ức chế sự phát triển của nấm mốc, vi khuẩn, cải thiện độ bền bảo quản — đúng mục đích kéo dài hạn dùng cho sốt đóng chai.",
    sourceQuoteJa: "保存料 かびや細菌などの発育を抑制し、食品の保存性を向上させる ソルビン酸、安息香酸ナトリウム",
    sourcePage: 16,
  },
  {
    id: "sg-ck1-2",
    chapterId: "ck-ch1",
    kind: "judgment",
    scenarioJa: "冷凍しておいた牛肉の塊を、明日の仕込みのために解凍する準備をしています。",
    scenarioVi: "Bạn chuẩn bị rã đông khối thịt bò đông lạnh để sơ chế cho ngày mai.",
    questionJa: "衛生管理上、正しい解凍方法はどれか。",
    questionVi: "Xét về quản lý vệ sinh, cách rã đông đúng là gì?",
    options: [
      { ja: "下処理用の容器に移し、食肉・魚介類などの保管区分の冷蔵庫内で緩慢解凍し、ドリップが他の食材を汚染しないようトレイで受ける", vi: "Chuyển sang hộp sơ chế, rã đông chậm trong ngăn tủ dành cho thịt/hải sản, dùng khay hứng để dịch rã đông không làm ô nhiễm nguyên liệu khác" },
      { ja: "常温で急速に解凍する", vi: "Rã đông nhanh ở nhiệt độ phòng" },
      { ja: "電子レンジで一気に加熱解凍する", vi: "Rã đông ngay bằng lò vi sóng" },
      { ja: "水道水に直接浸けて解凍する", vi: "Ngâm trực tiếp dưới vòi nước để rã đông" },
    ],
    correctIndex: 0,
    explanationVi: "Rã đông thịt: chuyển sang hộp sơ chế, rã đông chậm trong ngăn tủ lạnh dành riêng cho thịt/hải sản; dùng khay hứng để dịch chảy ra không làm ô nhiễm thực phẩm/dụng cụ khác.",
    sourceQuoteJa: "冷凍した食肉を使用するときは、下処理用の容器に移し、食肉・魚介類などの保管区分の冷蔵庫内で緩慢解凍する。※解凍する際、ドリップが下に落ちるなどしてほかの食材や容器を汚染しないよう、トレイで受けるなどの工夫をすること。",
    sourcePage: 2,
  },
  {
    id: "sg-ck2-1",
    chapterId: "ck-ch2",
    kind: "judgment",
    scenarioJa: "本日のメニューはなす料理です。切ったなすがすぐに変色してしまうことに気づきました。",
    scenarioVi: "Món hôm nay có cà tím. Bạn nhận thấy cà tím vừa cắt xong đã nhanh chóng bị đổi màu.",
    questionJa: "この状況で下処理として正しい対応はどれか。",
    questionVi: "Trong tình huống này, cách sơ chế đúng là gì?",
    options: [
      { ja: "冷水につけてあく抜きをする", vi: "Ngâm nước lạnh để khử vị đắng/chát" },
      { ja: "熱湯をかけて変色を止める", vi: "Dội nước sôi để chặn đổi màu" },
      { ja: "そのまま調理を続ける、対応不要", vi: "Cứ tiếp tục nấu, không cần xử lý gì" },
      { ja: "塩を大量にまぶす", vi: "Rắc thật nhiều muối" },
    ],
    correctIndex: 0,
    explanationVi: "Khoai tây, khoai lang, cà tím được ngâm nước lạnh để khử vị đắng/chát (あく抜き) — đây cũng là cách xử lý đúng khi cà tím bị thâm đen sau khi cắt.",
    sourceQuoteJa: "じゃがいも、さつまいもなどのいも類やなすは冷水につけてあく抜きをします。",
    sourcePage: 5,
  },
  {
    id: "sg-ck2-2",
    chapterId: "ck-ch2",
    kind: "judgment",
    scenarioJa: "本日、泥のついたごぼうが大量に入荷しました。すぐに切って使いたいと考えています。",
    scenarioVi: "Hôm nay ngưu bàng dính nhiều đất vừa nhập về. Bạn muốn cắt dùng ngay.",
    questionJa: "正しい洗浄方法はどれか。",
    questionVi: "Cách rửa đúng là gì?",
    options: [
      { ja: "洗わずにそのまま切って使う", vi: "Không rửa mà cắt dùng luôn" },
      { ja: "水に軽くくぐらせるだけでよい", vi: "Chỉ cần nhúng qua nước là đủ" },
      { ja: "熱湯で茹でてから泥を落とす", vi: "Luộc qua nước sôi rồi mới rửa đất" },
      { ja: "たわしでよく洗って泥を落とし、最後に流水で洗ってから切る", vi: "Dùng bàn chải cọ kỹ để rửa sạch đất, cuối cùng rửa lại bằng nước chảy rồi mới cắt" },
    ],
    correctIndex: 3,
    explanationVi: "Rau còn dính đất: dùng bàn chải cọ kỹ để rửa sạch đất, cuối cùng rửa lại bằng nước chảy — không được cắt ngay khi còn dính đất.",
    sourceQuoteJa: "泥のついたものは、たわしでよく洗って泥を落とし、最後に流水で洗います。",
    sourcePage: 5,
  },
  {
    id: "sg-ck6-1",
    chapterId: "ck-ch6",
    kind: "judgment",
    scenarioJa: "新しく開業した定食屋のオーナーです。一般のスーパーより業務用のまとまった量とサイズの食材を仕入れたいと考えています。",
    scenarioVi: "Bạn là chủ quán cơm mới khai trương. Bạn muốn nhập nguyên liệu với số lượng/kích cỡ chuyên dụng cho kinh doanh, khác với siêu thị bán lẻ thông thường.",
    questionJa: "この目的に適した仕入先はどれか。",
    questionVi: "Nguồn nhập hàng phù hợp với mục đích này là gì?",
    options: [
      { ja: "業務用専門スーパー（飲食店などの業務用仕入れに特化）", vi: "Siêu thị chuyên bán sỉ cho kinh doanh (chuyên phục vụ nhập hàng cho nhà hàng, quán ăn)" },
      { ja: "個人が経営するフリーマーケット", vi: "Chợ trời do cá nhân kinh doanh" },
      { ja: "一般消費者向けの小型コンビニ", vi: "Cửa hàng tiện lợi nhỏ dành cho người tiêu dùng thường" },
      { ja: "仕入先を持つ必要はない", vi: "Không cần có nguồn nhập hàng nào" },
    ],
    correctIndex: 0,
    explanationVi: "業務用専門スーパー là siêu thị chuyên phục vụ việc nhập hàng kinh doanh cho nhà hàng, quán ăn — phù hợp nhất với nhu cầu số lượng/kích cỡ chuyên dụng.",
    sourceQuoteJa: "②業務用専門スーパー",
    sourcePage: 15,
  },
  {
    id: "sg-ck6-2",
    chapterId: "ck-ch6",
    kind: "judgment",
    scenarioJa: "複数の仕入先から見積もりを取ったところ、A社が最安値でしたが、品質や配送スケジュールは自店のコンセプトに合っていませんでした。",
    scenarioVi: "Bạn nhận báo giá từ nhiều nhà cung cấp. Công ty A rẻ nhất, nhưng chất lượng và lịch giao hàng không phù hợp với concept quán.",
    questionJa: "この場合、正しい判断はどれか。",
    questionVi: "Trong trường hợp này, quyết định đúng là gì?",
    options: [
      { ja: "価格が最も安いA社を必ず選ぶべき", vi: "Bắt buộc chọn công ty A vì giá rẻ nhất" },
      { ja: "価格だけでなく、お店のコンセプトや各仕入先のメリット・デメリットを見極めて選ぶ", vi: "Không chỉ xét giá, mà cân nhắc concept cửa hàng và ưu nhược điểm từng nguồn để chọn" },
      { ja: "見積もりを取った以上、必ず契約しなければならない", vi: "Đã lấy báo giá thì bắt buộc phải ký hợp đồng" },
      { ja: "仕入先は一度決めたら二度と変更してはいけない", vi: "Nguồn nhập hàng đã chọn thì không bao giờ được đổi" },
    ],
    correctIndex: 1,
    explanationVi: "Khi chọn nguồn nhập hàng, cần cân nhắc concept của cửa hàng và ưu nhược điểm của từng nguồn để chọn nguồn phù hợp — không chỉ dựa vào giá rẻ nhất.",
    sourceQuoteJa: "お店のコンセプトや各仕入先のメリット・デメリットを見極め、自店にあった仕入先を選択することが重要です。",
    sourcePage: 15,
  },
  {
    id: "sg-ck1-3",
    chapterId: "ck-ch1",
    kind: "judgment",
    scenarioJa: "新人が「肉は硬直した直後が一番新鮮でおいしいはず」と考え、仕入れたばかりの肉をすぐ提供しようとしています。",
    scenarioVi: "Nhân viên mới nghĩ \"thịt lúc vừa cứng xác chắc là tươi ngon nhất\" và định phục vụ ngay thịt vừa nhập về.",
    questionJa: "この考えは正しいか。",
    questionVi: "Suy nghĩ này có đúng không?",
    options: [
      { ja: "正しい。硬直直後が最もやわらかくおいしい", vi: "Đúng. Ngay sau khi cứng xác là lúc mềm và ngon nhất" },
      { ja: "誤り。肉は硬直、熟成、軟化を経て、食べごろになるまで数日かかる", vi: "Sai. Thịt phải trải qua cứng xác, ủ chín, mềm hóa; mất vài ngày mới đạt độ ngon" },
      { ja: "誤り。肉は仕入れた瞬間から劣化が始まるため即日廃棄すべき", vi: "Sai. Thịt bắt đầu hỏng ngay từ lúc nhập nên phải vứt bỏ trong ngày" },
      { ja: "正しい。熟成という工程は不要", vi: "Đúng. Công đoạn ủ chín là không cần thiết" },
    ],
    correctIndex: 1,
    explanationVi: "Thịt sau khi giết mổ trải qua cứng xác (死後硬直) chậm rãi, rồi đến ủ chín (熟成), mềm hóa (軟化), mất vài ngày mới đạt độ ngon — phục vụ ngay lúc vừa cứng xác là SAI thời điểm.",
    sourceQuoteJa: "肉は死後硬直がゆるやかで、硬直、熟成、軟化を経て、食べごろになるまで数日かかります。",
    sourcePage: 1,
  },
  {
    id: "sg-ck2-3",
    chapterId: "ck-ch2",
    kind: "judgment",
    scenarioJa: "新人が魚のうろこを、頭から尾の方向にこすり落とそうとしています。",
    scenarioVi: "Nhân viên mới định gạt vảy cá theo hướng từ đầu xuống đuôi.",
    questionJa: "この方向は正しいか。",
    questionVi: "Hướng này có đúng không?",
    options: [
      { ja: "正しい。頭から尾の方向が基本", vi: "Đúng. Từ đầu xuống đuôi là hướng cơ bản" },
      { ja: "誤り。うろこは取る必要がない", vi: "Sai. Không cần gạt vảy" },
      { ja: "誤り。尾から頭の方向に向かって、専用のウロコ取りか包丁の背を使ってとる", vi: "Sai. Phải gạt theo hướng từ đuôi lên đầu, dùng dụng cụ chuyên dụng hoặc sống dao" },
      { ja: "正しい。どちらの方向でも問題ない", vi: "Đúng. Hướng nào cũng được, không vấn đề gì" },
    ],
    correctIndex: 2,
    explanationVi: "Gạt vảy cá phải theo hướng NGƯỢC LẠI — từ đuôi lên đầu, dùng dụng cụ gạt vảy chuyên dụng hoặc sống dao, để tránh làm rách thịt cá.",
    sourceQuoteJa: "うろこを落とす：尾から頭の方向に向かってとります。専用のウロコ取りを使うと簡単ですが、ない場合には包丁の背を使って、身を傷つけないようにとります。",
    sourcePage: 5,
  },
  {
    id: "sg-ck3-3",
    chapterId: "ck-ch3",
    kind: "judgment",
    scenarioJa: "サラダ（非加熱調理）を作る際、新人が「加熱しないから逆に安全、衛生管理は加熱調理ほど厳しくなくてよい」と考えています。",
    scenarioVi: "Khi làm salad (chế biến không dùng nhiệt), nhân viên mới nghĩ \"vì không nấu nên ngược lại an toàn hơn, không cần quản lý vệ sinh nghiêm ngặt như món có nấu\".",
    questionJa: "この考えは正しいか。",
    questionVi: "Suy nghĩ này có đúng không?",
    options: [
      { ja: "誤り。非加熱調理は交差汚染・二次汚染のリスクが高いため、衛生管理の注意事項を確実に守ることが大切", vi: "Sai. Chế biến không dùng nhiệt có rủi ro lây nhiễm chéo cao hơn, nên càng phải tuân thủ nghiêm ngặt lưu ý vệ sinh" },
      { ja: "正しい。非加熱調理は加熱調理よりリスクが低い", vi: "Đúng. Chế biến không dùng nhiệt có rủi ro thấp hơn chế biến có nấu" },
      { ja: "誤り。非加熱調理そのものが禁止されている", vi: "Sai. Bản thân việc chế biến không dùng nhiệt bị cấm hoàn toàn" },
      { ja: "正しい。手洗いや手袋の着用は不要", vi: "Đúng. Không cần rửa tay hay đeo găng tay" },
    ],
    correctIndex: 0,
    explanationVi: "Ngược lại với suy nghĩ thông thường, chế biến KHÔNG dùng nhiệt có rủi ro lây nhiễm chéo/ô nhiễm thứ cấp CAO hơn (vì không có bước nấu để tiêu diệt vi khuẩn) — nên càng phải tuân thủ nghiêm ngặt các lưu ý vệ sinh.",
    sourceQuoteJa: "非加熱調理では、交差汚染・二次汚染のリスクが高いので、衛生管理での注意事項は確実に守ることが大切です。",
    sourcePage: 7,
  },
  {
    id: "sg-ck4-3",
    chapterId: "ck-ch4",
    kind: "judgment",
    scenarioJa: "本日、丸ごとの魚をさばいて骨も切る作業があります。新人は薄刃の菜切包丁を使おうとしています。",
    scenarioVi: "Hôm nay cần mổ cá nguyên con và cắt cả xương. Nhân viên mới định dùng dao Nakiri mỏng (chuyên rau).",
    questionJa: "この選択は適切か。",
    questionVi: "Lựa chọn này có phù hợp không?",
    options: [
      { ja: "適切。菜切包丁はどんな食材にも対応できる万能包丁", vi: "Phù hợp. Dao Nakiri là dao vạn năng, dùng được cho mọi nguyên liệu" },
      { ja: "不適切。魚をさばくのに包丁の種類は関係ない", vi: "Không phù hợp. Loại dao không liên quan gì đến việc mổ cá" },
      { ja: "不適切。魚をさばく際は素手でおこなうべき", vi: "Không phù hợp. Mổ cá nên làm bằng tay không, không dùng dao" },
      { ja: "不適切。骨を切るには重みと厚みのある出刃包丁が適している", vi: "Không phù hợp. Để cắt xương cần dao Deba có trọng lượng và độ dày phù hợp" },
    ],
    correctIndex: 3,
    explanationVi: "Dao Nakiri (菜切包丁) chỉ thích hợp cắt rau, lưỡi mỏng KHÔNG cắt được xương. Để mổ cá và cắt xương cần dao Deba (出刃包丁) — có trọng lượng và độ dày phù hợp.",
    sourceQuoteJa: "出刃包丁：魚をさばくときに使用する包丁です。重みがあり、刃に厚みもあるため、骨を切ったりすることもできます。",
    sourcePage: 9,
  },
  {
    id: "sg-ck5-3",
    chapterId: "ck-ch5",
    kind: "judgment",
    scenarioJa: "新人研修で「飲食店の労働災害は転倒が一番多く、次に多いのは高温・低温物との接触だ」と教えられました。",
    scenarioVi: "Trong đào tạo nhân viên mới, có người dạy rằng \"tai nạn lao động ở nhà hàng nhiều nhất là té ngã, tiếp theo nhiều thứ hai là tiếp xúc vật nóng/lạnh\".",
    questionJa: "この説明は正しいか。",
    questionVi: "Giải thích này có đúng không?",
    options: [
      { ja: "正しい。転倒の次に多いのは高温・低温物との接触", vi: "Đúng. Sau té ngã, nhiều thứ hai là tiếp xúc vật nóng/lạnh" },
      { ja: "誤り。転倒の次に多いのは「切れ・こすれ」であり、高温・低温物との接触はその次", vi: "Sai. Sau té ngã, nhiều thứ hai là 'đứt/trầy xước', tiếp xúc vật nóng/lạnh đứng sau đó" },
      { ja: "誤り。転倒が最多という部分がそもそも間違い", vi: "Sai. Ngay từ việc cho rằng té ngã là nhiều nhất đã sai" },
      { ja: "正しい。転倒以外の事故はほとんど発生しない", vi: "Đúng. Hầu như không có tai nạn nào khác ngoài té ngã" },
    ],
    correctIndex: 1,
    explanationVi: "Thứ tự đúng: 転倒 (té ngã, ~30%) → 切れ・こすれ (đứt/trầy xước) → 高温・低温物との接触 (tiếp xúc vật nóng/lạnh) → 動作の反動・無理な動作. Nhầm thứ tự vị trí 2-3 là lỗi phổ biến.",
    sourceQuoteJa: "次に「切れ・こすれ」、「高温・低温物との接触」、「動作の反動・無理な動作」の順となっています。",
    sourcePage: 11,
  },
  {
    id: "sg-ck6-3",
    chapterId: "ck-ch6",
    kind: "judgment",
    scenarioJa: "新人が「卸売市場の機能は集荷と価格形成の2つだけ」と説明しています。",
    scenarioVi: "Nhân viên mới giải thích rằng \"chợ đầu mối chỉ có 2 chức năng: thu gom hàng và hình thành giá\".",
    questionJa: "この説明は正しいか。",
    questionVi: "Giải thích này có đúng không?",
    options: [
      { ja: "正しい。この2つの機能で十分説明できる", vi: "Đúng. 2 chức năng này là đủ để giải thích" },
      { ja: "誤り。卸売市場に「機能」という概念はない", vi: "Sai. Chợ đầu mối không có khái niệm 'chức năng'" },
      { ja: "誤り。卸売市場には集荷・価格形成・決済・情報受発信・災害時対応・衛生の保持の6つの機能がある", vi: "Sai. Chợ đầu mối có 6 chức năng: thu gom hàng, hình thành giá, thanh toán, tiếp nhận/phát tin, ứng phó thiên tai, giữ vệ sinh" },
      { ja: "正しい。決済機能は仕入先が個別に持つもので卸売市場とは無関係", vi: "Đúng. Chức năng thanh toán do từng nhà cung cấp tự có, không liên quan chợ đầu mối" },
    ],
    correctIndex: 2,
    explanationVi: "Chợ đầu mối có tổng cộng 6 chức năng (không phải 2): thu gom hàng, hình thành giá, thanh toán, tiếp nhận/phát tin, ứng phó thiên tai, giữ vệ sinh.",
    sourceQuoteJa: "流通経路の中でも卸売市場は、①集荷、②価格形成、③決済、④情報受発信、⑤災害時対応、⑥衛生の保持機能を持ち、生鮮食料品などを安定的に供給するシステムとして運営されています。",
    sourcePage: 15,
  },
  {
    id: "sg-ck7-3",
    chapterId: "ck-ch7",
    kind: "judgment",
    scenarioJa:
      "揚げ物用の油を長期間保存する際、油の酸化を防ぎたいと考えています。「かびや細菌の発育を抑える保存料を使えばよい」と考えている新人がいます。",
    scenarioVi: "Khi bảo quản dầu chiên lâu dài, bạn muốn ngăn dầu bị oxy hóa. Nhân viên mới nghĩ \"dùng chất bảo quản để ức chế nấm mốc/vi khuẩn là được\".",
    questionJa: "この考えは適切か。",
    questionVi: "Suy nghĩ này có phù hợp không?",
    options: [
      { ja: "不適切。油脂などの酸化を防ぐのは酸化防止剤の役割であり、保存料（かびや細菌の抑制）とは目的が異なる", vi: "Không phù hợp. Ngăn oxy hóa dầu mỡ là vai trò của chất chống oxy hóa — khác mục đích với chất bảo quản (ức chế nấm mốc/vi khuẩn)" },
      { ja: "適切。保存料が油脂の酸化も防いでくれる", vi: "Phù hợp. Chất bảo quản cũng ngăn được oxy hóa dầu mỡ" },
      { ja: "適切。保存料と酸化防止剤は同じもの", vi: "Phù hợp. Chất bảo quản và chất chống oxy hóa là một" },
      { ja: "不適切。油の劣化には添加物は一切効果がない", vi: "Không phù hợp. Phụ gia hoàn toàn không có tác dụng với việc dầu xuống cấp" },
    ],
    correctIndex: 0,
    explanationVi: "保存料 (chất bảo quản) và 酸化防止剤 (chất chống oxy hóa) là 2 loại phụ gia KHÁC NHAU với mục đích khác nhau: bảo quản ức chế nấm mốc/vi khuẩn, còn chống oxy hóa mới là loại đúng để ngăn dầu mỡ bị oxy hóa.",
    sourceQuoteJa: "酸化防止剤 油脂などの酸化を防ぎ保存性をよくする エリソルビン酸ナトリウム、ミックスビタミンＥ",
    sourcePage: 17,
  },
  // Phần 4: 接客全般 (cs-ch1..5)
  {
    id: "sg-cs1-1",
    chapterId: "cs-ch1",
    kind: "judgment",
    scenarioJa: "常連のお客様が予約時に電話番号と自宅住所を教えてくれました。同僚が「暇だから友達に教えてあげよう」と言っています。",
    scenarioVi: "Một khách quen cung cấp số điện thoại và địa chỉ nhà lúc đặt bàn. Đồng nghiệp của bạn nói \"Rảnh quá, kể cho bạn mình nghe luôn\".",
    questionJa: "この状況に対する正しい理解はどれか。",
    questionVi: "Cách hiểu đúng về tình huống này là gì?",
    options: [
      { ja: "適切。仲の良い同僚同士なら問題ない", vi: "Phù hợp. Đồng nghiệp thân nhau thì không sao" },
      { ja: "不適切。個人情報の漏えいや不正利用が起きないよう十分注意し、従業員を指導・監督する必要がある", vi: "Không phù hợp. Phải hết sức chú ý tránh rò rỉ/sử dụng sai mục đích thông tin cá nhân, và hướng dẫn/giám sát nhân viên" },
      { ja: "適切。個人情報は自由に第三者に伝えてよい", vi: "Phù hợp. Có thể tự do kể thông tin cá nhân cho bên thứ ba" },
      { ja: "適切。予約情報は個人情報に該当しない", vi: "Phù hợp. Thông tin đặt bàn không tính là thông tin cá nhân" },
    ],
    correctIndex: 1,
    explanationVi: "Số điện thoại/địa chỉ là thông tin định danh cá nhân — phải hết sức chú ý tránh rò rỉ, thất lạc, bị nhân viên sử dụng sai mục đích, và cần hướng dẫn/giám sát nhân viên tuân thủ quy tắc bảo mật.",
    sourceQuoteJa:
      "顧客データに、氏名、住所、電話番号など、個人を特定できる「個人情報」が含まれる場合は、漏えいや紛失、従業員による不正利用や本来の目的以外での利用などが発生しないよう、十分に注意する必要があります。そのため、従業員にルールを守るよう、指導・監督することが重要です。",
    sourcePage: 8,
  },
  {
    id: "sg-cs2-1",
    chapterId: "cs-ch2",
    kind: "judgment",
    scenarioJa: "予約の電話で、お客様から「えびアレルギーがあります」と伝えられました。",
    scenarioVi: "Khách gọi điện đặt bàn và báo trước: \"Tôi bị dị ứng tôm\".",
    questionJa: "このお客様への対応として重要なことはどれか。",
    questionVi: "Điều quan trọng khi phục vụ vị khách này là gì?",
    options: [
      { ja: "特に気にせず通常通り提供する", vi: "Không cần bận tâm, cứ phục vụ như bình thường" },
      { ja: "口頭で伝えられただけなので無視してよい", vi: "Vì chỉ nói miệng nên có thể bỏ qua" },
      { ja: "料理に使用されている原材料・食材を正しく把握し、お客様からの問合せに対応できるようにしておく", vi: "Nắm rõ nguyên liệu/thực phẩm dùng trong món ăn, để có thể trả lời khi khách hỏi" },
      { ja: "えびさえ避ければ他の原材料は確認しなくてよい", vi: "Chỉ cần tránh tôm, không cần kiểm tra nguyên liệu khác" },
    ],
    correctIndex: 2,
    explanationVi:
      "Cần nắm rõ nguyên liệu/thực phẩm dùng trong từng món để trả lời chính xác khi khách hỏi — đặc biệt quan trọng với khách có dị ứng, vì tài liệu nêu rõ hậu quả xấu nhất của dị ứng thực phẩm có thể là sốc phản vệ dẫn đến tử vong.",
    sourceQuoteJa: "料理に使用されている原材料、食材を正しく把握し、お客様からの問合せに対応できるようにしておくことが重要です。",
    sourcePage: 8,
  },
  {
    id: "sg-cs2-2",
    chapterId: "cs-ch2",
    kind: "judgment",
    scenarioJa: "厨房で、消費期限が昨日までだった食材を見つけました。見た目には問題なさそうです。",
    scenarioVi: "Bạn phát hiện trong bếp có nguyên liệu hạn sử dụng (消費期限) đã hết từ hôm qua. Nhìn bề ngoài có vẻ không sao.",
    questionJa: "この食材への正しい対応はどれか。",
    questionVi: "Cách xử lý đúng với nguyên liệu này là gì?",
    options: [
      { ja: "見た目に問題なくても、消費期限を過ぎた食材は使用しない", vi: "Dù bề ngoài không sao, nguyên liệu đã quá hạn sử dụng thì không được dùng" },
      { ja: "見た目に問題なければそのまま使用してよい", vi: "Nếu bề ngoài ổn thì cứ dùng bình thường" },
      { ja: "賞味期限と同じ扱いなので多少過ぎても問題ない", vi: "Coi như hạn dùng tốt nhất nên quá hạn chút ít không sao" },
      { ja: "加熱すれば期限切れでも安全になる", vi: "Nếu nấu chín thì dù hết hạn vẫn an toàn" },
    ],
    correctIndex: 0,
    explanationVi:
      "消費期限 (hạn sử dụng) khác với 賞味期限 (hạn dùng tốt nhất) — quá 消費期限 thì tuyệt đối không được dùng dù bề ngoài trông ổn, vì đây là hạn liên quan trực tiếp đến an toàn thực phẩm, cần quản lý nghiêm ngặt hơn.",
    sourceQuoteJa:
      "消費期限：定められた方法により保存した場合において、腐敗、変敗その他の品質（状態）の劣化に伴い安全性を欠くことになるおそれがないと認められる期限を示す年月日のことで、開封前の状態で定められた方法により保存すれば食品衛生上の問題が生じないと認められるものです。そのため、消費期限を過ぎた食品は食べないようにしてください。",
    sourcePage: 9,
  },
  {
    id: "sg-cs2-3",
    chapterId: "cs-ch2",
    kind: "judgment",
    scenarioJa: "ハラール認証を気にするお客様から「このソースにお酒は使われていますか」と聞かれました。実際にはみりん（酒類）を使用しています。",
    scenarioVi: "Một khách quan tâm đến chuẩn Halal hỏi: \"Sốt này có dùng rượu không?\" Thực tế món có dùng mirin (một loại rượu nấu ăn).",
    questionJa: "この状況を踏まえ、なぜ正確に回答することが重要か。",
    questionVi: "Dựa vào tình huống này, vì sao việc trả lời chính xác lại quan trọng?",
    options: [
      { ja: "みりんはアルコールに該当しないため伝える必要はない", vi: "Mirin không tính là cồn nên không cần báo" },
      { ja: "ハラールは豚肉にのみ関係し、調味料は関係ない", vi: "Halal chỉ liên quan đến thịt heo, không liên quan gia vị" },
      { ja: "曖昧に答えても問題ない", vi: "Trả lời mập mờ cũng không sao" },
      { ja: "ハラールではアルコールが使えないため、みりんなどアルコールを含む調味料の使用有無を正確に伝える必要がある", vi: "Vì chuẩn Halal không cho dùng cồn, nên phải báo chính xác có dùng gia vị chứa cồn như mirin hay không" },
    ],
    correctIndex: 3,
    explanationVi: "Halal không cho phép dùng cồn dưới bất kỳ hình thức nào, kể cả rưới lên nguyên liệu — mirin là rượu nấu ăn nên phải báo chính xác cho khách, không được trả lời mập mờ.",
    sourceQuoteJa: "特に、ハラール（イスラム圏での原材料基準）ではアルコールは使えないため、食材にアルコールをかけることはできませんので注意してください。",
    sourcePage: 10,
  },
  {
    id: "sg-cs3-1",
    chapterId: "cs-ch3",
    kind: "calculation",
    scenarioJa: "レジを締めたところ、ロール上の現金有り高は500,000円でしたが、実際に数えた現金は505,000円でした。",
    scenarioVi: "Khi chốt sổ quỹ, số tiền ghi trên cuộn giấy là 500.000 yên, nhưng đếm thực tế được 505.000 yên.",
    questionJa: "この5,000円の差はどのような問題を引き起こしている可能性があるか。",
    questionVi: "Khoản chênh lệch 5.000 yên này có thể cho thấy vấn đề gì?",
    options: [
      { ja: "実際有り高の方が多いため、お客様に損失（受け取り過ぎまたはお釣り不足）が発生した可能性がある", vi: "Vì tiền thực tế nhiều hơn, có thể khách hàng đã bị thiệt hại (bị thu thừa tiền hoặc trả thiếu tiền thối)" },
      { ja: "店に損失が発生した可能性がある", vi: "Có thể cửa hàng đã bị thiệt hại" },
      { ja: "特に何の問題も示していない", vi: "Không cho thấy vấn đề gì cả" },
      { ja: "従業員の残業代が増えたことを示す", vi: "Cho thấy tiền làm thêm giờ của nhân viên tăng lên" },
    ],
    correctIndex: 0,
    explanationVi:
      "500,000円(sổ) so với 505,000円(thực tế) → thực tế NHIỀU HƠN 5,000円. Theo quy tắc: nếu thực tế ÍT hơn sổ thì cửa hàng chịu thiệt hại; nếu thực tế NHIỀU hơn sổ thì khách hàng chịu thiệt hại (do bị thu thừa hoặc trả thiếu tiền thối) — ở đây là trường hợp thứ hai.",
    sourceQuoteJa: "ロール上の現金有り高より実際の現金有り高が少なければ、店に損失が発生することになり、逆に、実際の現金有り高が多ければ、お客様に損失が発生することになり、信頼を損ね客数を減らす要因になります。",
    sourcePage: 16,
  },
  {
    id: "sg-cs3-2",
    chapterId: "cs-ch3",
    kind: "judgment",
    scenarioJa: "掃除を早く終わらせたいスタッフが、洗剤を規定より濃い濃度で薄めて使おうとしています。",
    scenarioVi: "Một nhân viên muốn dọn dẹp nhanh hơn nên định pha chất tẩy rửa đậm đặc hơn nồng độ quy định.",
    questionJa: "この行動は適切か。",
    questionVi: "Hành động này có phù hợp không?",
    options: [
      { ja: "適切。濃ければ濃いほど早く汚れが落ちて良い", vi: "Phù hợp. Càng đậm đặc thì càng sạch nhanh" },
      { ja: "不適切。洗剤は必ず正しい希釈濃度で使用しなければならない", vi: "Không phù hợp. Chất tẩy rửa bắt buộc phải dùng đúng nồng độ pha loãng quy định" },
      { ja: "適切。濃度は特に気にしなくてよい", vi: "Phù hợp. Không cần để ý nồng độ" },
      { ja: "不適切だが、急いでいる時は例外的に許される", vi: "Không phù hợp, nhưng khi gấp thì được phép ngoại lệ" },
    ],
    correctIndex: 1,
    explanationVi: "Chất tẩy rửa phải luôn dùng đúng nồng độ pha loãng quy định — không có ngoại lệ vì lý do muốn làm nhanh, vì nồng độ sai có thể gây hại bề mặt/sức khỏe hoặc không đạt hiệu quả vệ sinh.",
    sourceQuoteJa: "洗剤などを正しい希釈濃度で使っているか、確認してください。",
    sourcePage: 13,
  },
  {
    id: "sg-cs3-3",
    chapterId: "cs-ch3",
    kind: "judgment",
    scenarioJa: "閉店後、レジ締めを終えたスタッフが1人で夜間金庫に売上金を投入しようとしています。",
    scenarioVi: "Sau khi đóng cửa và chốt sổ quỹ, một nhân viên định 1 mình nộp tiền doanh thu vào két đêm.",
    questionJa: "このやり方に問題はあるか。",
    questionVi: "Cách làm này có vấn đề gì không?",
    options: [
      { ja: "問題ない。1人でも構わない", vi: "Không sao. 1 người cũng được" },
      { ja: "問題ない。信頼できるスタッフなら1人でよい", vi: "Không sao. Nhân viên đáng tin cậy thì 1 người cũng được" },
      { ja: "問題がある。防犯のため必ず二人でおこなう必要がある", vi: "Có vấn đề. Vì lý do phòng chống trộm cắp, bắt buộc phải có 2 người thực hiện" },
      { ja: "問題があるが、店長の許可があれば1人でもよい", vi: "Có vấn đề, nhưng nếu quản lý cho phép thì 1 người cũng được" },
    ],
    correctIndex: 2,
    explanationVi: "Nộp tiền vào két đêm bắt buộc phải có 2 người thực hiện vì lý do phòng chống trộm cắp — không có ngoại lệ dựa trên độ tin cậy cá nhân hay sự cho phép của quản lý.",
    sourceQuoteJa: "閉店後レジ締めをおこない、所定のバッグに現金と入金票を入れて投入します。この時必ず二人でおこなってください。理由は防犯のためです。",
    sourcePage: 16,
  },
  {
    id: "sg-cs4-1",
    chapterId: "cs-ch4",
    kind: "judgment",
    scenarioJa: "料理に髪の毛が入っていたと、お客様から指摘を受けました。",
    scenarioVi: "Khách phản ánh có sợi tóc lẫn trong món ăn.",
    questionJa: "取るべき正しい対応の順序はどれか。",
    questionVi: "Thứ tự xử lý đúng cần thực hiện là gì?",
    options: [
      { ja: "まず伝票をキャンセルしてから事実確認する", vi: "Trước tiên hủy hóa đơn rồi mới xác nhận sự việc" },
      { ja: "お詫びせず、まず作り直すかどうかだけ聞く", vi: "Không xin lỗi, chỉ hỏi có muốn làm lại không" },
      { ja: "1週間かけて調査してから謝罪する", vi: "Điều tra trong 1 tuần rồi mới xin lỗi" },
      { ja: "事実を確認したらすぐにお詫びし、その後、作り直してよいか確認して不要なら伝票をキャンセルする", vi: "Xác nhận sự việc rồi xin lỗi ngay, sau đó hỏi khách có muốn làm lại không, nếu không cần thì nhanh chóng hủy hóa đơn" },
    ],
    correctIndex: 3,
    explanationVi: "Thứ tự đúng: (1) xác nhận sự việc → xin lỗi ngay; (2) hỏi khách có muốn làm lại món không, nếu không cần thì nhanh chóng hủy hóa đơn.",
    sourceQuoteJa:
      "（１）①の「クレームに対する基本的な対応」に沿い、事実を確認したらすぐにお詫びをしてください。 お客様にはまず、作り直してよいか確認し、作り直し不要と言われれば伝票をキャンセルする対応を素早くおこなってください。それ以上の対応が店のルールで決まっている場合は、それに従ってください。",
    sourcePage: 18,
  },
  {
    id: "sg-cs4-2",
    chapterId: "cs-ch4",
    kind: "judgment",
    scenarioJa: "厨房内に捕虫器を新しく設置することになりました。窓際の、外からもよく見える明るい場所に取り付けようとしています。",
    scenarioVi: "Bạn chuẩn bị lắp đèn bẫy côn trùng mới trong bếp. Định lắp ở gần cửa sổ, chỗ sáng và nhìn rõ từ bên ngoài.",
    questionJa: "この設置場所は適切か。",
    questionVi: "Vị trí lắp đặt này có phù hợp không?",
    options: [
      { ja: "適切。明るい場所ほど虫がよく捕まる", vi: "Phù hợp. Nơi càng sáng thì càng bắt được nhiều côn trùng" },
      { ja: "不適切。ランプが厨房以外から見えると、逆に虫を外から誘引してしまう", vi: "Không phù hợp. Nếu đèn bị nhìn thấy từ bên ngoài bếp sẽ ngược lại thu hút côn trùng từ bên ngoài vào" },
      { ja: "適切。窓際は換気がよく最適な場所", vi: "Phù hợp. Gần cửa sổ thoáng khí, là vị trí tối ưu" },
      { ja: "適切。お客様に見せることで衛生管理をアピールできる", vi: "Phù hợp. Cho khách thấy sẽ thể hiện được việc quản lý vệ sinh tốt" },
    ],
    correctIndex: 1,
    explanationVi: "Nếu đèn bẫy côn trùng lắp trong bếp bị nhìn thấy từ bên ngoài, sẽ ngược lại thu hút côn trùng từ bên ngoài vào — cần kiểm tra và tránh vị trí này.",
    sourceQuoteJa: "厨房に捕虫器が設置されている場合は、捕虫器のランプが厨房以外から見えていないか確認してください。見えていると逆に虫を外から誘引することになります。",
    sourcePage: 18,
  },
  {
    id: "sg-cs5-1",
    chapterId: "cs-ch5",
    kind: "judgment",
    scenarioJa: "レストランでお客様が突然てんかん発作を起こして倒れました。付き添いの方は見当たりません。",
    scenarioVi: "Một khách đột nhiên lên cơn động kinh và ngã xuống trong nhà hàng. Không thấy người đi cùng.",
    questionJa: "この場合、正しい対応はどれか。",
    questionVi: "Trong trường hợp này, cách xử lý đúng là gì?",
    options: [
      { ja: "付き添いの方がいないため、すぐに救急車を呼ぶ", vi: "Vì không có người đi cùng, phải gọi xe cấp cứu ngay" },
      { ja: "口に物を入れて舌を守る", vi: "Nhét vật vào miệng để bảo vệ lưỡi" },
      { ja: "すぐに抱き起こして座らせる", vi: "Ngay lập tức bế khách dậy và cho ngồi" },
      { ja: "周囲から離れて何もしない", vi: "Tránh xa và không làm gì cả" },
    ],
    correctIndex: 0,
    explanationVi: "Với khách bị ngã do lên cơn động kinh: nếu có người đi cùng thì làm theo chỉ dẫn của người đó; nếu KHÔNG có người đi cùng (như tình huống này) thì phải gọi xe cấp cứu ngay.",
    sourceQuoteJa: "てんかん発作で倒れたお客様には、付き添いの方がいれば、その方の指示に従ってください。付き添いの方がいない場合は、すぐに救急車を呼んでください。",
    sourcePage: 19,
  },
  {
    id: "sg-cs5-2",
    chapterId: "cs-ch5",
    kind: "judgment",
    scenarioJa: "厨房近くで倒れたお客様の意識がなく、呼吸も確認できません。店内にAEDが設置されています。",
    scenarioVi: "Một khách ngã gần khu bếp, bất tỉnh và không thấy có nhịp thở. Trong quán có lắp máy AED.",
    questionJa: "取るべき対応はどれか。",
    questionVi: "Hành động cần thực hiện là gì?",
    options: [
      { ja: "意識が戻るまで何もせず待つ", vi: "Không làm gì, chờ khách tỉnh lại" },
      { ja: "AEDをすぐに当て、同時に救急車を呼ぶ", vi: "Dùng AED ngay lập tức, đồng thời gọi xe cấp cứu" },
      { ja: "心臓マッサージのみおこない救急車は呼ばない", vi: "Chỉ xoa bóp tim, không gọi xe cấp cứu" },
      { ja: "AEDは訓練を受けた人だけが使えるので何もしない", vi: "Vì AED chỉ người đã qua đào tạo mới dùng được nên không làm gì" },
    ],
    correctIndex: 1,
    explanationVi: "Với khách bị ngừng tim (bất tỉnh, không thở), phải dùng máy AED ngay lập tức, đồng thời gọi xe cấp cứu — không chờ đợi, không chỉ dựa vào xoa bóp tim.",
    sourceQuoteJa: "心停止を起こしたお客様には、AED（自動体外式除細動器）をすぐに当ててください。そして同時に救急車を呼んでください。",
    sourcePage: 19,
  },
  {
    id: "sg-cs1-2",
    chapterId: "cs-ch1",
    kind: "judgment",
    scenarioJa:
      "杖をついたお客様が、席までの案内中に一度も「手伝ってほしい」とは言いませんでしたが、階段の手前で少し立ち止まり、周囲を見回す様子が見られました。新人スタッフは「何も言われていないから、そのまま案内を続ければよい」と考えています。",
    scenarioVi:
      "Một vị khách chống gậy, trong lúc được dẫn đến bàn, không hề nói \"xin giúp tôi\" một lần nào, nhưng trước bậc thang có dừng lại một chút và nhìn quanh. Nhân viên mới nghĩ \"vì khách không nói gì nên cứ tiếp tục dẫn đường bình thường là được\".",
    questionJa: "この新人スタッフの考えは適切か。",
    questionVi: "Suy nghĩ của nhân viên mới này có phù hợp không?",
    options: [
      { ja: "適切。言われていない以上、特別な対応をする必要はない", vi: "Phù hợp. Vì khách chưa yêu cầu nên không cần xử lý đặc biệt" },
      {
        ja: "不適切。言われなくとも見て判断できる場合は率先して対応する必要があり、階段手前で立ち止まる様子から手助けが必要か声をかけて確認すべき",
        vi: "Không phù hợp. Dù không được yêu cầu, nếu quan sát mà nhận biết được thì cần chủ động xử lý trước — thấy khách dừng lại trước bậc thang thì nên chủ động hỏi xem khách có cần giúp không",
      },
      { ja: "適切。杖を使っているお客様は自分で対応できるので気にしなくてよい", vi: "Phù hợp. Khách dùng gậy có thể tự xử lý nên không cần để ý" },
      { ja: "不適切だが、忙しい時間帯なら無視してもよい", vi: "Không phù hợp, nhưng nếu đang giờ cao điểm thì có thể bỏ qua" },
    ],
    correctIndex: 1,
    explanationVi:
      "Nếu khách nói ra thì đương nhiên phải xử lý, nhưng ngay cả khi khách không nói mà nhân viên có thể quan sát và nhận biết được (như dấu hiệu dừng lại, nhìn quanh trước bậc thang), cũng cần chủ động xử lý trước — không có ngoại lệ vì lý do bận rộn.",
    sourceQuoteJa: "言われれば当然ですが、言われなくとも見て判断できる場合は率先して対応することが必要です。",
    sourcePage: 5,
  },
  {
    id: "sg-cs1-3",
    chapterId: "cs-ch1",
    kind: "judgment",
    scenarioJa:
      "接客人員が足りない時間帯に、新しいお客様の来店・注文を終えたばかりのお客様への料理提供・会計待ちのお客様が同時に発生しました。新人スタッフは「先に来たお客様を先に案内するべき」と考え、新しいお客様のご案内を最優先しようとしています。",
    scenarioVi:
      "Vào giờ thiếu nhân lực phục vụ, cùng lúc xảy ra: khách mới đến, khách vừa order xong đang chờ món, và khách đang chờ thanh toán. Nhân viên mới nghĩ \"khách đến trước thì phải đón trước\" nên định ưu tiên đón khách mới lên hàng đầu.",
    questionJa: "この状況で最初におこなうべき対応はどれか。",
    questionVi: "Trong tình huống này, việc cần ưu tiên làm trước tiên là gì?",
    options: [
      { ja: "新しいお客様のご案内を最優先する（先に来た順に対応するべきだから）", vi: "Ưu tiên đón khách mới trước tiên (vì phải xử lý theo thứ tự đến trước)" },
      { ja: "レジ精算を最優先する（お客様を待たせるとクレームになりやすいから）", vi: "Ưu tiên thanh toán trước (vì để khách chờ dễ gây khiếu nại)" },
      {
        ja: "料理提供を最優先する（待たせすぎると料理が冷めて美味しさが低下し、再来店してもらえなくなるため）",
        vi: "Ưu tiên phục vụ món ăn trước (vì để chờ quá lâu món sẽ nguội, giảm ngon miệng, khách không quay lại)",
      },
      { ja: "優先順位を決めず、手が空いたスタッフが対応する", vi: "Không quyết định thứ tự ưu tiên, ai rảnh thì làm" },
    ],
    correctIndex: 2,
    explanationVi:
      "Khi nhiều dịch vụ xảy ra đồng thời do thiếu nhân lực, thứ tự ưu tiên là ①phục vụ món②thanh toán③đón khách④nhận order⑤tráng miệng/đồ uống⑥dọn bàn. Phục vụ món được ưu tiên số 1 vì để nguội sẽ giảm độ ngon và khách không quay lại; thanh toán đứng thứ 2 (không phải đón khách mới) vì khách chờ thanh toán có thể được xoa dịu bằng lời nói.",
    sourceQuoteJa:
      "その時の優先順位は、①料理提供②レジ精算③ご案内④注文受け⑤デザート・ドリンクの提供⑥下げとなります。料理提供を優先し、レジ精算が２番目に来るのは、待たせすぎると料理が冷めて美味しさが低下し再来店してもらえないからです。また、レジ精算のお客様は声掛けで待ってもらえるからです。",
    sourcePage: 7,
  },
  {
    id: "sg-cs2-4",
    chapterId: "cs-ch2",
    kind: "judgment",
    scenarioJa:
      "賞味期限が来月末までのソースを、3日前に開封して使っています。スタッフは「メーカー表示の期限まで、まだ日にちがあるから、開封後もそのまま同じ期限で使ってよい」と考えています。",
    scenarioVi:
      "Một chai sốt có hạn dùng tốt nhất (賞味期限) đến cuối tháng sau, đã được mở nắp từ 3 ngày trước. Nhân viên nghĩ \"hạn ghi trên bao bì vẫn còn xa nên mở rồi vẫn dùng theo đúng hạn đó là được\".",
    questionJa: "この考えは正しいか。",
    questionVi: "Suy nghĩ này có đúng không?",
    options: [
      {
        ja: "正しい。メーカー表示の期限内であれば、開封の有無に関わらずそのまま使い続けてよい",
        vi: "Đúng. Trong hạn ghi trên bao bì thì dù có mở hay không vẫn dùng tiếp được",
      },
      {
        ja: "誤り。一度開封するとメーカーの保証はなくなり、店・会社が決めた使用期間ルールに従う必要がある",
        vi: "Sai. Một khi đã mở nắp, sự bảo đảm của nhà sản xuất mất hiệu lực, phải tuân theo quy tắc thời gian sử dụng do cửa hàng/công ty quy định",
      },
      { ja: "誤り。開封した時点で即座に廃棄しなければならない", vi: "Sai. Ngay khi mở nắp phải vứt bỏ ngay lập tức" },
      { ja: "正しい。賞味期限は消費期限と違い、開封の有無を気にしなくてよい", vi: "Đúng. Khác với hạn sử dụng, hạn dùng tốt nhất không cần quan tâm việc có mở hay không" },
    ],
    correctIndex: 1,
    explanationVi:
      "Cả hạn sử dụng và hạn dùng tốt nhất đều là hạn áp dụng khi thực phẩm còn nguyên chưa mở nắp và bảo quản đúng cách quy định — một khi đã mở nắp, sự bảo đảm của nhà sản xuất mất hiệu lực, và phải chuyển sang dùng theo quy tắc thời gian sử dụng riêng do cửa hàng/công ty quy định, không còn theo hạn in trên bao bì nữa.",
    sourceQuoteJa:
      "消費期限、賞味期限は、ともに未開封で、かつ、決められた保存状態での期限で、一度開封してしまったり、異なる保存方法をしてしまったりするとメーカーの保証はなくなります。",
    sourcePage: 10,
  },
  {
    id: "sg-cs3-4",
    chapterId: "cs-ch3",
    kind: "judgment",
    scenarioJa:
      "閉店後、翌日用の釣銭とその日の売上金をまとめて同じバッグに入れ、二人で夜間金庫に投入しようとしているスタッフがいます。",
    scenarioVi: "Sau khi đóng cửa, có nhân viên định gom chung tiền lẻ dùng cho ngày mai và tiền doanh thu trong ngày vào cùng một túi, rồi cùng 2 người nộp vào két đêm.",
    questionJa: "この対応に問題はあるか。",
    questionVi: "Cách xử lý này có vấn đề gì không?",
    options: [
      { ja: "問題ない。二人でおこなっているので防犯上は適切", vi: "Không sao. Vì có 2 người thực hiện nên hợp lệ về mặt phòng chống trộm cắp" },
      {
        ja: "問題がある。翌日用の釣銭は夜間金庫ではなく店内金庫に保管しなければならない",
        vi: "Có vấn đề. Tiền lẻ dùng cho ngày mai phải cất trong két sắt trong cửa hàng, không phải két đêm",
      },
      { ja: "問題ない。夜間金庫はどんな現金でも一緒に投入してよい場所", vi: "Không sao. Két đêm là nơi có thể nộp chung mọi loại tiền mặt" },
      { ja: "問題がある。売上金は夜間金庫ではなく店内金庫に保管しなければならない", vi: "Có vấn đề. Tiền doanh thu phải cất trong két sắt trong cửa hàng chứ không phải két đêm" },
    ],
    correctIndex: 1,
    explanationVi:
      "Tiền doanh thu trong ngày đúng là phải nộp vào két đêm với 2 người thực hiện (vì lý do phòng chống trộm cắp) — điểm này đúng. Nhưng tiền lẻ dùng cho ngày hôm sau lại KHÔNG được gộp vào đó, mà phải cất riêng trong két sắt trong cửa hàng.",
    sourceQuoteJa: "ただし、翌日用の釣銭は店内金庫に保管してください。",
    sourcePage: 16,
  },
  {
    id: "sg-cs3-5",
    chapterId: "cs-ch3",
    kind: "calculation",
    scenarioJa: "レジを締めたところ、ロール上の現金有り高は300,000円でしたが、実際に数えた現金は297,000円でした。",
    scenarioVi: "Khi chốt sổ quỹ, số tiền ghi trên cuộn giấy là 300.000 yên, nhưng đếm thực tế được 297.000 yên.",
    questionJa: "この3,000円の差はどのような問題を引き起こしている可能性があるか。",
    questionVi: "Khoản chênh lệch 3.000 yên này có thể cho thấy vấn đề gì?",
    options: [
      { ja: "実際有り高の方が少ないため、店に損失が発生した可能性がある", vi: "Vì tiền thực tế ít hơn, có thể cửa hàng đã bị thiệt hại" },
      { ja: "実際有り高の方が少ないため、お客様に損失が発生した可能性がある", vi: "Vì tiền thực tế ít hơn, có thể khách hàng đã bị thiệt hại" },
      { ja: "特に何の問題も示していない", vi: "Không cho thấy vấn đề gì cả" },
      { ja: "従業員の残業代が増えたことを示す", vi: "Cho thấy tiền làm thêm giờ của nhân viên tăng lên" },
    ],
    correctIndex: 0,
    explanationVi:
      "300,000円(sổ) so với 297,000円(thực tế) → thực tế ÍT HƠN 3,000円. Theo quy tắc: nếu thực tế ÍT hơn sổ thì CỬA HÀNG chịu thiệt hại (ngược lại với trường hợp thực tế NHIỀU hơn sổ, khi đó KHÁCH HÀNG mới là bên chịu thiệt hại) — cần phân biệt rõ 2 chiều để không kết luận ngược.",
    sourceQuoteJa: "ロール上の現金有り高より実際の現金有り高が少なければ、店に損失が発生することになり、逆に、実際の現金有り高が多ければ、お客様に損失が発生することになり、信頼を損ね客数を減らす要因になります。",
    sourcePage: 16,
  },
  {
    id: "sg-cs4-3",
    chapterId: "cs-ch4",
    kind: "judgment",
    scenarioJa:
      "お客様の料理から、髪の毛ではなくまつげのような毛が見つかりました。新人スタッフは「髪の毛ではないから、特に調べずに作り直すだけでよい」と考えています。",
    scenarioVi: "Trong món ăn của khách phát hiện có sợi lông giống lông mi, không phải tóc. Nhân viên mới nghĩ \"vì không phải tóc nên không cần điều tra gì, chỉ cần làm lại món là đủ\".",
    questionJa: "この考えは適切か。",
    questionVi: "Suy nghĩ này có phù hợp không?",
    options: [
      { ja: "適切。髪の毛以外の毛は衛生上問題にならない", vi: "Phù hợp. Lông không phải tóc thì không có vấn đề vệ sinh" },
      {
        ja: "不適切。髪の毛以外の毛でも、何の毛か、混入した経緯を調べ特定し、再発防止を全従業員に周知する必要がある",
        vi: "Không phù hợp. Dù không phải tóc, vẫn phải xác định là loại lông gì, tìm hiểu quá trình lẫn vào, rồi phổ biến cho toàn thể nhân viên để phòng ngừa tái diễn",
      },
      { ja: "適切。まつげの混入は髪の毛よりも稀なので調べる必要はない", vi: "Phù hợp. Lông mi lẫn vào hiếm hơn tóc nên không cần điều tra" },
      { ja: "不適切だが、お客様に謝罪すれば十分で経緯調査は不要", vi: "Không phù hợp, nhưng chỉ cần xin lỗi khách là đủ, không cần điều tra quá trình" },
    ],
    correctIndex: 1,
    explanationVi:
      "Không chỉ tóc, mà cả các loại lông khác (lông mi, lông mày, lông cơ thể...) khi lẫn vào món ăn cũng phải xác định là loại lông gì, tìm hiểu và xác định quá trình lẫn vào, rồi phổ biến cho toàn thể nhân viên để phòng ngừa tái diễn — không thể chỉ làm lại món và xin lỗi mà bỏ qua bước điều tra.",
    sourceQuoteJa: "髪の毛以外（まつげ、眉毛、体毛など）でも、何の毛であるか、また、混入した経緯を調べ特定して、再発防止を全従業員に周知してください。",
    sourcePage: 18,
  },
  {
    id: "sg-cs5-3",
    chapterId: "cs-ch5",
    kind: "judgment",
    scenarioJa:
      "お客様がてんかん発作で倒れましたが、すぐに意識を取り戻し、会話もできる状態です。付き添いの方は見当たりません。スタッフは「意識があり本人と会話できるので、本人の希望を聞いて救急車を呼ぶかどうかを決めればよい」と考えています。",
    scenarioVi:
      "Một khách bị ngã do lên cơn động kinh, nhưng nhanh chóng tỉnh lại và có thể nói chuyện được. Không thấy người đi cùng. Nhân viên nghĩ \"vì khách còn tỉnh táo và nói chuyện được, nên hỏi ý muốn của khách rồi mới quyết định có gọi xe cấp cứu hay không\".",
    questionJa: "このスタッフの考えは適切か。",
    questionVi: "Suy nghĩ của nhân viên này có phù hợp không?",
    options: [
      { ja: "適切。意識がある場合は本人の意思に従うのが原則", vi: "Phù hợp. Nguyên tắc là khi khách còn tỉnh táo thì làm theo ý muốn của khách" },
      {
        ja: "不適切。てんかん発作の場合は、意識の有無に関わらず、付き添いの方がいなければすぐに救急車を呼ぶ必要がある",
        vi: "Không phù hợp. Với trường hợp lên cơn động kinh, bất kể còn tỉnh hay không, nếu không có người đi cùng thì phải gọi xe cấp cứu ngay",
      },
      { ja: "適切。てんかん発作は軽い症状なので救急車を呼ぶ必要はない", vi: "Phù hợp. Động kinh là triệu chứng nhẹ nên không cần gọi cấp cứu" },
      { ja: "不適切。むしろ意識があってもなくても本人の意思のみに従うべき", vi: "Không phù hợp. Ngược lại, dù tỉnh hay không cũng chỉ nên làm theo ý khách" },
    ],
    correctIndex: 1,
    explanationVi:
      "Quy tắc 'còn tỉnh táo thì theo ý khách, bất tỉnh thì gọi cấp cứu' áp dụng cho trường hợp khách khó chịu nói chung. Nhưng với riêng trường hợp lên cơn động kinh, quy tắc dựa trên yếu tố khác: nếu CÓ người đi cùng thì làm theo chỉ dẫn người đó; nếu KHÔNG có người đi cùng thì phải gọi xe cấp cứu ngay lập tức — không phụ thuộc vào việc khách còn tỉnh táo hay đã nói chuyện được.",
    sourceQuoteJa: "てんかん発作で倒れたお客様には、付き添いの方がいれば、その方の指示に従ってください。付き添いの方がいない場合は、すぐに救急車を呼んでください。",
    sourcePage: 19,
  },
];

export const PLANNINGS: PlanningQuestion[] = [
  {
    id: "pl-sm1-1",
    chapterId: "sm-ch1",
    scenarioJa: "新人スタッフに「Q（クオリティ）」の優先順位を教える研修中です。5つの項目を優先度が高い順に並べてください。",
    scenarioVi: "Bạn đang đào tạo nhân viên mới về thứ tự ưu tiên của \"Q (Chất lượng)\". Hãy sắp xếp 5 mục theo đúng thứ tự ưu tiên từ cao đến thấp.",
    steps: [
      { ja: "品質（味・分量・盛り付け）の一定化", vi: "Đồng nhất chất lượng (vị, khối lượng, cách trình bày)" },
      { ja: "熱いものは厚く、冷たいものは冷たく", vi: "Nóng thì dày dặn, lạnh thì mát lạnh" },
      { ja: "早く出す", vi: "Phục vụ nhanh" },
      { ja: "同時同卓提供", vi: "Phục vụ đồng thời cùng bàn" },
      { ja: "気配り（愛）", vi: "Sự quan tâm chu đáo" },
    ],
    sourceQuoteJa:
      "Q（クオリティ）の優先順位　1.品質（味・分量・盛り付け）の一定化　2.熱いものは厚く、冷たいものは冷たく　3.早く出す・・・ランチ6～8分以内、ディナー12分以内　4.同時同卓提供　5.気配り（愛）・・・美味しくなるように心を込め調理",
    sourcePage: 2,
  },
  {
    id: "pl-sm1-2",
    chapterId: "sm-ch1",
    scenarioJa: "新人スタッフに「S（サービス）」の優先順位を教える研修中です。5つの項目を優先度が高い順に並べてください。",
    scenarioVi: "Bạn đang đào tạo nhân viên mới về thứ tự ưu tiên của \"S (Dịch vụ)\". Hãy sắp xếp 5 mục theo đúng thứ tự ưu tiên từ cao đến thấp.",
    steps: [
      { ja: "定型サービス（スマイル＆アイコンタクト）", vi: "Dịch vụ tiêu chuẩn (mỉm cười & giao tiếp mắt)" },
      { ja: "声（発声）・・・ハキハキ", vi: "Giọng nói dứt khoát, rõ ràng" },
      { ja: "笑顔（スマイル＆ハッスル）・・・ニコニコ", vi: "Nụ cười tươi" },
      { ja: "動作（姿勢、動き）・・・キビキビ、テキパキ", vi: "Động tác nhanh nhẹn, dứt khoát" },
      { ja: "気配り（愛）", vi: "Sự quan tâm chu đáo" },
    ],
    sourceQuoteJa:
      "S（サービス）の優先順位　1.定型サービス（基本）（スマイル＆アイコンタクト）　2.声（発生）・・・ハキハキ　3.笑顔（スマイル＆ハッスル）・・・ニコニコ　4.動作（姿勢、動き）・・・キビキビ、テキパキ　5.気配り（愛）・・・お客様の立場で気づく、察する心",
    sourcePage: 2,
  },
  {
    id: "pl-sm3-1",
    chapterId: "sm-ch3",
    scenarioJa: "納品された食材を確認する検収作業をおこないます。3つの確認項目を、本文に記載されている順番に並べてください。",
    scenarioVi: "Bạn thực hiện công tác kiểm nhận nguyên liệu vừa giao đến. Hãy sắp xếp 3 hạng mục cần xác nhận theo đúng thứ tự được nêu trong tài liệu.",
    steps: [
      { ja: "発注数量", vi: "Số lượng đã đặt hàng" },
      { ja: "納品書の数量", vi: "Số lượng trên phiếu giao hàng" },
      { ja: "現品の数量と品質", vi: "Số lượng và chất lượng hàng thực tế" },
    ],
    sourceQuoteJa: "A）発注数量とB）納品書の数量、C）現品の数量と品質の３つを確認します。",
    sourcePage: 15,
  },
  {
    id: "pl-sm5-1",
    chapterId: "sm-ch5",
    scenarioJa: "顧客管理の基本方針に従い、お客様のランクをどのように引き上げていくべきか、正しい流れに並べてください。",
    scenarioVi: "Theo phương châm cơ bản của quản lý khách hàng, hãy sắp xếp đúng chuỗi nâng hạng khách hàng.",
    steps: [
      { ja: "新規顧客", vi: "Khách hàng mới" },
      { ja: "準固定顧客", vi: "Khách bán cố định" },
      { ja: "固定顧客", vi: "Khách quen cố định" },
    ],
    sourceQuoteJa: "顧客管理とは準固定顧客を固定客に、新規顧客を準固定顧客あるいは固定顧客にしていくことが重要です。",
    sourcePage: 17,
  },
  {
    id: "pl-sm6-1",
    chapterId: "sm-ch6",
    scenarioJa: "新人アルバイトスタッフの採用初日です。オリエンテーションの正しい流れを順番に並べてください。",
    scenarioVi: "Đây là ngày đầu tiên của nhân viên thời vụ mới. Hãy sắp xếp đúng thứ tự quy trình định hướng ngày đầu.",
    steps: [
      { ja: "ハウスルール（出退勤の仕方、制服の着用や身だしなみルール、手洗いなどの衛生管理など）を教える", vi: "Dạy nội quy cửa hàng (cách chấm công, đồng phục/tác phong, vệ sinh cá nhân...)" },
      { ja: "店舗の設備や配置を説明して案内（ストアツアー）し、スタッフを紹介する", vi: "Giới thiệu/hướng dẫn thiết bị và cách bố trí cửa hàng (Store Tour), giới thiệu với các nhân viên khác" },
    ],
    sourceQuoteJa:
      "初日はオリエンテーションとハウスルール（出退勤の仕方、制服の着用や身だしなみルール、手洗いなどの衛生管理など）店内で働く上での基本を教えます。次に店舗の設備や配置を説明して案内（ストアツアー）し、スタッフを紹介します。",
    sourcePage: 19,
  },
  {
    id: "pl-sm7-1",
    chapterId: "sm-ch7",
    scenarioJa: "人材育成の基本体系には4つの段階があります。新人スタッフが成長していく正しい順番に並べてください。",
    scenarioVi: "Hệ thống đào tạo nhân sự cơ bản có 4 giai đoạn. Hãy sắp xếp đúng thứ tự trưởng thành của nhân viên mới.",
    steps: [
      { ja: "教育（芽を引き出す）", vi: "Giáo dục (khơi gợi mầm non/tiềm năng)" },
      { ja: "導入（方向付ける）", vi: "Định hướng (chỉ ra phương hướng)" },
      { ja: "訓練（反復練習する）", vi: "Huấn luyện (luyện tập lặp lại)" },
      { ja: "啓発（開発する）", vi: "Khai mở (phát triển bản thân)" },
    ],
    sourceQuoteJa: "教育 芽を引き出す■ 導入 方向付ける■ 訓練 反復練習する■ 啓発 開発する",
    sourcePage: 20,
  },
  {
    id: "pl-sm7-2",
    chapterId: "sm-ch7",
    scenarioJa: "新人にサービスの「型」をOJTで教えることになりました。トレーニングの4ステップを正しい順番に並べてください。",
    scenarioVi: "Bạn sẽ đào tạo nhân viên mới về \"khuôn mẫu\" dịch vụ theo hình thức OJT. Hãy sắp xếp đúng 4 bước đào tạo.",
    steps: [
      { ja: "導入・・トレーニーを習う気持ちにさせる", vi: "Dẫn nhập — tạo tinh thần muốn học cho học viên" },
      { ja: "掲示・・トレーナーがやって見せる", vi: "Trình diễn — huấn luyện viên làm mẫu" },
      { ja: "適用・・トレーニーにやらせてみる", vi: "Áp dụng — để học viên tự làm" },
      { ja: "的確にフォローアップする", vi: "Theo dõi sát sao, kiểm tra cụ thể mức độ hiểu và làm được" },
    ],
    sourceQuoteJa:
      "① 導入・・トレーニーを習う気持ちにさせる。② 掲示・・トレーナーがやって見せる。③ 適用・・トレーニーにやらせてみる。④ 的確にフォローアップする。トレーニーがどのくらい理解しているか、できたかを具体的にチェックし、フォローアップに結び付けます。",
    sourcePage: 21,
  },
  {
    id: "pl-sm8-1",
    chapterId: "sm-ch8",
    scenarioJa:
      "火災などの緊急事態に備え、各種マニュアルの内容を事前に確認しておく必要があります。本文に挙げられている3つの確認事項を、記載されている順番に並べてください。",
    scenarioVi: "Để chuẩn bị cho tình huống khẩn cấp như hỏa hoạn, cần xác nhận trước nội dung các loại sổ tay. Hãy sắp xếp đúng thứ tự 3 mục xác nhận được nêu trong tài liệu.",
    steps: [
      { ja: "消防署への通報マニュアル", vi: "Sổ tay báo tin cho sở cứu hỏa" },
      { ja: "お客様の避難誘導マニュアル", vi: "Sổ tay hướng dẫn sơ tán khách hàng" },
      { ja: "緊急時の従業員役割分担マニュアル", vi: "Sổ tay phân công vai trò nhân viên lúc khẩn cấp" },
    ],
    sourceQuoteJa:
      "① 消防署への通報マニュアルを確認しておいてください。② お客様の避難誘導マニュアルを確認しておいてください。③ 緊急時の従業員役割分担マニュアルを確認しておいてください。",
    sourcePage: 24,
  },
  // Phần 2: 衛生管理 (hy-ch2..4)
  {
    id: "pl-hy2-1",
    chapterId: "hy-ch2",
    scenarioJa: "厨房の5S活動を新人に教える研修中です。5つの要素を正しい順番に並べてください。",
    scenarioVi: "Bạn đang đào tạo nhân viên mới về hoạt động 5S trong bếp. Hãy sắp xếp 5 yếu tố theo đúng thứ tự.",
    steps: [
      { ja: "整理（Seiri）", vi: "Sàng lọc" },
      { ja: "整頓（Seiton）", vi: "Sắp xếp" },
      { ja: "清掃（Seisou）", vi: "Sạch sẽ" },
      { ja: "清潔（Seiketsu）", vi: "Săn sóc" },
      { ja: "習慣（Syukan）", vi: "Sẵn sàng" },
    ],
    sourceQuoteJa:
      "５ S 活動は、①整理（Seiri）、②整頓（Seiton）、③清掃（Seisou）、④清潔（Seiketsu）、⑤習慣（Syukan）の５つで構成され",
    sourcePage: 4,
  },
  {
    id: "pl-hy3-1",
    chapterId: "hy-ch3",
    scenarioJa: "HACCPに基づく衛生管理計画を作成することになりました。7原則を正しい順番に並べてください。",
    scenarioVi: "Bạn cần lập kế hoạch quản lý vệ sinh theo HACCP. Hãy sắp xếp đúng thứ tự 7 nguyên tắc.",
    steps: [
      { ja: "危害要因の分析", vi: "Phân tích yếu tố nguy hại" },
      { ja: "重要管理点の決定", vi: "Xác định điểm quản lý quan trọng" },
      { ja: "管理基準の設定", vi: "Thiết lập tiêu chuẩn quản lý" },
      { ja: "モニタリング方法の設定", vi: "Thiết lập phương pháp giám sát" },
      { ja: "改善措置の設定", vi: "Thiết lập biện pháp cải thiện" },
      { ja: "検証方法の設定", vi: "Thiết lập phương pháp kiểm chứng" },
      { ja: "記録の作成", vi: "Lập hồ sơ ghi chép" },
    ],
    sourceQuoteJa:
      "危害要因の分析：食品又は添加物の製造、加工、調理、運搬、貯蔵又は販売の工程ごとに、食品衛生上の危害を発生させ得る要因（危害要因）の一覧表を作成し、これら危害要因を管理するための措置（管理措置）を定めること。 重要管理点の決定：①で特定された危害要因の発生の防止、排除又は許容できる水準にまで低減するために管理措置を講ずることが不可欠な工程を重要管理点として特定すること。 管理基準の設定：個々の重要管理点において、危害要因の発生の防止、排除又は許容できる水準にまで低減するための基準（管理基準）を設定すること。 モニタリング方法の設定：重要管理点の管理の実施状況について、連続的又は相当な頻度の確認（モニタリング）をするための方法を設定すること。 改善措置の設定：個々の重要管理点において、モニタリングの結果、管理基準を逸脱したことが判明した場合の改善措置を設定すること。 検証方法の設定：①～⑤に規定する措置の内容の効果を、定期的に検証するための手順を定めること。 記録の作成：営業の規模や業態に応じて、①～⑥に規定する措置の内容に関する書面とその実施の記録を作成すること。",
    sourcePage: 6,
  },
  {
    id: "pl-hy4-1",
    chapterId: "hy-ch4",
    scenarioJa: "新人スタッフの衛生教育訓練メニューを、本文に記載されている順番に並べてください。",
    scenarioVi: "Hãy sắp xếp chương trình đào tạo vệ sinh cho nhân viên mới theo đúng thứ tự được nêu trong tài liệu.",
    steps: [
      { ja: "健康管理（出勤時の健康チェック項目など）", vi: "Quản lý sức khỏe (kiểm tra sức khỏe khi vào ca...)" },
      { ja: "身だしなみ（作業着の着用、持ち込み禁止品など）", vi: "Tác phong (mặc đồng phục, vật cấm mang vào bếp...)" },
      { ja: "手洗いなど（手洗い方法、タイミング、衛生手袋の使用法）", vi: "Rửa tay... (cách rửa tay, thời điểm, cách dùng găng vệ sinh)" },
    ],
    sourceQuoteJa:
      "① 健康管理：出勤時の健康チェック項目、体調不良時の業務対応および連絡方法など② 身だしなみ：作業着の着用、持ち込み禁止品などの厨房入室時のルールなど③ 手洗いなど：手洗い方法、手洗いのタイミング、衛生手袋の使用方法など",
    sourcePage: 29,
  },
  // Phần 3: 飲食物調理 (ck-ch2, ck-ch6)
  {
    id: "pl-ck2-1",
    chapterId: "ck-ch2",
    scenarioJa: "仕入れた魚を調理前に下処理することになりました。正しい手順に並べてください。",
    scenarioVi: "Bạn cần sơ chế cá vừa nhập trước khi nấu. Hãy sắp xếp đúng thứ tự các bước.",
    steps: [
      { ja: "うろこを落とす", vi: "Gạt vảy" },
      { ja: "えらを取る", vi: "Lấy mang" },
      { ja: "内臓をとりだす", vi: "Lấy nội tạng" },
      { ja: "水洗いする", vi: "Rửa nước" },
      { ja: "頭を取る", vi: "Cắt bỏ đầu" },
    ],
    sourceQuoteJa:
      "うろこを落とす：尾から頭の方向に向かってとります。専用のウロコ取りを使うと簡単ですが、ない場合には包丁の背を使って、身を傷つけないようにとります。 えらを取る：魚の腹を上にしてえらぶたを開き、包丁の刃先を入れ、えらと身のつなぎ部分を切ります。反対側も同じように切り、えらをひっかけるようにして引き出します。 切り身にする場合：えらのところから腹のところまでまっすぐに切り、腹を開いて刃先で内臓をかきだします。尾頭付きの場合：魚の表に切り込みが見えないようにするため、裏側の胸びれの下を切り込み、内臓を出します。 水洗い：手早く流水で洗い流し、水気をしっかりふきとります。 頭を取る：腹びれの後ろのつけねから胸びれの後ろまで斜めに、中骨まで包丁を入れます。裏返し同様にし、中骨ごと頭を落とします。",
    sourcePage: 5,
  },
  {
    id: "pl-ck6-1",
    chapterId: "ck-ch6",
    scenarioJa: "食品が生産者から消費者に届くまでの流通経路を、正しい順番に並べてください。",
    scenarioVi: "Hãy sắp xếp đúng thứ tự các khâu lưu thông thực phẩm từ nhà sản xuất đến người tiêu dùng.",
    steps: [
      { ja: "生産者", vi: "Nhà sản xuất" },
      { ja: "農協などの出荷事業者", vi: "Đơn vị xuất hàng như hợp tác xã nông nghiệp" },
      { ja: "卸売市場や食品製造業", vi: "Chợ đầu mối, ngành chế biến thực phẩm" },
      { ja: "食品小売業", vi: "Ngành bán lẻ thực phẩm" },
    ],
    sourceQuoteJa: "生産者から農協などの出荷事業者、卸売市場や食品製造業、食品小売業などを経由して消費者の元に届きます。",
    sourcePage: 15,
  },
  // Phần 4: 接客全般 (cs-ch1)
  {
    id: "pl-cs1-1",
    chapterId: "cs-ch1",
    scenarioJa:
      "接客人員が少なく、複数のサービス（料理提供・レジ精算・ご案内・注文受け・デザート提供・下げ）が同時に必要になりました。優先順位の高い順に並べてください。",
    scenarioVi: "Do thiếu nhân lực phục vụ, nhiều dịch vụ (phục vụ món, thanh toán, đón khách, nhận order, phục vụ tráng miệng, dọn bàn) cùng cần làm một lúc. Hãy sắp xếp theo đúng thứ tự ưu tiên từ cao đến thấp.",
    steps: [
      { ja: "料理提供", vi: "Phục vụ món" },
      { ja: "レジ精算", vi: "Thanh toán" },
      { ja: "ご案内", vi: "Đón khách" },
      { ja: "注文受け", vi: "Nhận order" },
      { ja: "デザート・ドリンクの提供", vi: "Phục vụ tráng miệng/đồ uống" },
      { ja: "下げ", vi: "Dọn bàn" },
    ],
    sourceQuoteJa:
      "その時の優先順位は、①料理提供②レジ精算③ご案内④注文受け⑤デザート・ドリンクの提供⑥下げとなります。料理提供を優先し、レジ精算が２番目に来るのは、待たせすぎると料理が冷めて美味しさが低下し再来店してもらえないからです。また、レジ精算のお客様は声掛けで待ってもらえるからです。",
    sourcePage: 7,
  },
];

export function vocabByChapter(chapterId: string): VocabQuestion[] {
  return VOCAB.filter((v) => v.chapterId === chapterId);
}

export function chaptersByPart(partId: string): Chapter[] {
  return CHAPTERS.filter((c) => c.partId === partId).sort((a, b) => a.order - b.order);
}

export function questionsByChapter(chapterId: string): QuizQuestion[] {
  return QUESTIONS.filter((q) => q.chapterId === chapterId);
}

export function translationsByChapter(chapterId: string): TranslationQuestion[] {
  return TRANSLATIONS.filter((t) => t.chapterId === chapterId);
}

export function reordersByChapter(chapterId: string): ReorderQuestion[] {
  return REORDERS.filter((r) => r.chapterId === chapterId);
}

export function scenariosByChapter(chapterId: string): ScenarioQuestion[] {
  return SCENARIOS.filter((s) => s.chapterId === chapterId);
}

export function planningsByChapter(chapterId: string): PlanningQuestion[] {
  return PLANNINGS.filter((p) => p.chapterId === chapterId);
}
