---
name: ane-ui-ux-pro-max
description: ANE-branded UI/UX design intelligence — tự động áp dụng brand colors (#394787 / #f27131), giọng văn H2H, và tối ưu cho ngành thiết bị nha khoa B2B tại Việt Nam. Kế thừa 67 styles, 161 palettes, 57 font pairings từ UI UX Pro Max.
---

# ANE UI UX Pro Max

> **TL;DR**: Skill thiết kế UI/UX được cấu hình sẵn cho thương hiệu ANH & EM (ANE). Tự động áp dụng màu thương hiệu `#394787` (Primary Blue) và `#f27131` (CTA Orange), giọng văn H2H "Clinical Excellence. Human Connection.", tối ưu cho ngành thiết bị nha khoa B2B cao cấp tại thị trường Việt Nam.

## Prerequisites

Skill này kế thừa toàn bộ database của `ui-ux-pro-max`. Đảm bảo Python 3.x đã được cài đặt:

```bash
python3 --version || python --version
```

## Brand Context (LUÔN ÁP DỤNG)

Trước khi generate bất kỳ design system nào, LUÔN đọc brand context:

```bash
# Khi cần context domain ANE (BẮT BUỘC đọc trước khi generate UI)
# Agent: đọc file data/ane-brand-tokens.md và references/kb-pointers.md
```

### Màu thương hiệu ANE (BẤT BIẾN)

| Role | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| **Primary** | `#394787` | `bg-[#394787]` / `text-[#394787]` | Headers, nav, backgrounds chính |
| **CTA / Accent** | `#f27131` | `bg-[#f27131]` / `text-[#f27131]` | Buttons, links, highlights |
| **White** | `#FFFFFF` | `bg-white` | Backgrounds, text trên primary |
| **Dark Text** | `#1A1A1A` | `text-[#1A1A1A]` | Body text chính |
| **Light Gray** | `#F5F5F5` | `bg-[#F5F5F5]` | Section backgrounds |

### Giọng văn H2H (BẤT BIẾN)

| Attribute | Tiếng Việt | Ví dụ |
|-----------|-----------|-------|
| **Professional** | Chuyên nghiệp, thẩm quyền | "Thiết bị đạt chuẩn CE/FDA..." |
| **Approachable** | Gần gũi, hỗ trợ | "Đội ngũ kỹ thuật luôn sẵn sàng..." |
| **Innovative** | Tiên phong, cập nhật | "Công nghệ mới nhất từ Nhật Bản..." |
| **Trustworthy** | Minh bạch, cam kết | "Bảo hành chính hãng 100%..." |

### Quy tắc bất biến

1. **Không dùng màu khác** ngoài palette ANE — không neon, không purple/pink gradients
2. **Viết đúng tên brand**: "J. Morita" (không "Morita"), "Mectron" (không "Mectron Italy")
3. **Không hứa giá** hoặc ngày giao hàng khi chưa kiểm tra
4. **Ưu tiên tiếng Việt có dấu** — tiếng Anh chỉ khi cần

---

## How to Use This Skill

### Step 0: Load Brand Context (REQUIRED)

Luôn đọc brand tokens trước khi generate:

```
Đọc: data/ane-brand-tokens.md
Đọc: references/kb-pointers.md (nếu cần context công ty/sản phẩm cụ thể)
```

### Step 1: Analyze User Requirements

Extract key information:
- **Loại sản phẩm ANE**: J. Morita (CBCT, ghế, endo), Mectron (piezosurgery), BTI (implant), Ethoss (bone graft), v.v.
- **Loại trang**: landing page sản phẩm, wiki article, email Mautic, dashboard TwinAI, brochure
- **Đối tượng**: bác sĩ nha khoa, chủ phòng khám, trưởng khoa bệnh viện
- **Stack**: mặc định `html-tailwind` (phù hợp WordPress DENTI B2B theme)

### Step 2: Generate Design System (REQUIRED)

Sử dụng `--design-system` từ `ui-ux-pro-max` nhưng với context ANE:

```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<product_type> dental medical b2b professional" --design-system -p "ANE <Project>"
```

**Ví dụ cho ANE:**
```bash
# Landing page CBCT J. Morita
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "dental clinic medical device professional" --design-system -p "ANE J. Morita CBCT"

# Email template Mautic
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "healthcare b2b professional email" --design-system -p "ANE Mautic Email"

# Wiki article
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "medical wiki documentation clean" --design-system -p "ANE Wiki Article"
```

### Step 2b: Override với màu ANE

Sau khi có design system từ search, **LUÔN ghi đè màu** với palette ANE:

| Search result color role | Override with ANE |
|--------------------------|-------------------|
| Primary | `#394787` (ANE Blue) |
| Secondary | `#3B5998` (lighter blue) hoặc `#E8ECF4` (tint nhẹ) |
| CTA / Accent | `#f27131` (ANE Orange) |
| Background | `#FFFFFF` (white) hoặc `#F5F5F5` (light gray) |
| Text | `#1A1A1A` (dark) |
| Border | `#D1D5DB` (gray-300) |

### Step 3: Stack Guidelines (Default: html-tailwind)

```bash
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "<keyword>" --stack html-tailwind
```

### Step 4: Brand Compliance Review

Trước khi deliver, kiểm tra ANE compliance:

- [ ] Màu chính là `#394787` và `#f27131`
- [ ] Không dùng màu neon, purple/pink gradients
- [ ] Typography chuyên nghiệp, dễ đọc tiếng Việt
- [ ] Copy tiếng Việt có dấu, giọng H2H
- [ ] Không emoji làm icons (dùng SVG: Heroicons/Lucide)
- [ ] Tên brand viết đúng (J. Morita, Mectron, BTI...)
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] Tương thích WordPress DENTI B2B theme (nếu là web page)

---

## ANE-Specific Design Patterns

### Ngành: Thiết bị nha khoa B2B

| Pattern | Phù hợp cho |
|---------|-------------|
| **Trust & Authority** | Trang sản phẩm cao cấp (CBCT, laser) |
| **Feature-Rich Showcase** | Trang chi tiết sản phẩm (specs, thông số) |
| **Social Proof-Focused** | Landing page với testimonials bác sĩ |
| **Hero-Centric Design** | Brand page (J. Morita, Mectron) |
| **Minimal & Direct** | Wiki article, tài liệu kỹ thuật |

### Màu sắc — Quy tắc cho ngành y tế B2B

| Quy tắc | DO | DON'T |
|---------|-----|-------|
| Primary | Dùng `#394787` — xanh dương tin cậy | Không dùng xanh neon, cyan quá sáng |
| CTA | Dùng `#f27131` — cam ấm, rõ ràng | Không dùng đỏ (cảnh báo y tế) |
| Tương phản | 4.5:1 minimum (WCAG AA) | Text quá nhạt trên nền trắng |
| Ảnh | Ảnh thiết bị thật, phòng khám thật | Stock photo chung chung |
| Icon | SVG y tế chuyên nghiệp | Emoji, icon quá playful |

---

## Ví dụ Hoàn Chỉnh

### Ví dụ 1: Landing page J. Morita Veraview X800

**Yêu cầu**: "Thiết kế landing page cho máy CBCT J. Morita Veraview X800"

**Quy trình**:

```bash
# Step 1: Generate base design system
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "dental clinic medical device professional premium" --design-system -p "ANE Veraview X800"

# Step 2: Override colors → ANE palette
# Primary: #394787 | CTA: #f27131 | BG: #FFFFFF | Text: #1A1A1A

# Step 3: Get UX guidelines
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "trust authority conversion" --domain ux

# Step 4: Stack implementation
python3 .opencode/skills/ui-ux-pro-max/scripts/search.py "hero section product features" --stack html-tailwind
```

**Output**: Design system với Hero + Features + Specs + Social Proof, màu ANE, font chuyên nghiệp, responsive.

### Ví dụ 2: Email template Mautic

**Yêu cầu**: "Tạo email template giới thiệu sản phẩm mới Ethoss"

**Quy trình**:
1. Generate design system với query "medical b2b email professional"
2. Override màu → ANE palette
3. Layout email: header (logo ANE) + hero (sản phẩm) + features (3 cột) + CTA + footer
4. Copy: giọng H2H, tiếng Việt

---

## Pre-Delivery ANE Checklist

Trước khi deliver UI code, xác nhận:

### Brand Compliance
- [ ] Màu chính: `#394787` (primary), `#f27131` (CTA)
- [ ] Không có màu neon, purple/pink gradients
- [ ] Logo ANE hiển thị đúng (nếu có)
- [ ] Tên brand viết đúng chính tả

### Visual Quality  
- [ ] Không emoji làm icons (dùng SVG: Heroicons/Lucide)
- [ ] Icons nhất quán (24x24 viewBox, w-6 h-6)
- [ ] Hover states không gây layout shift
- [ ] Typography hỗ trợ tiếng Việt (dấu đầy đủ)

### Content
- [ ] Copy tiếng Việt có dấu đầy đủ
- [ ] Giọng văn H2H (Professional — Approachable — Trustworthy)
- [ ] Không hứa giá/ngày giao hàng khi chưa kiểm tra
- [ ] Heading sentence case (tiếng Việt)

### Interaction
- [ ] `cursor-pointer` trên tất cả clickable elements
- [ ] Hover states rõ ràng (transition 150-300ms)
- [ ] Focus states cho keyboard navigation

### Responsive
- [ ] 375px (mobile), 768px (tablet), 1024px (laptop), 1440px (desktop)
- [ ] Không horizontal scroll trên mobile

### Accessibility
- [ ] Contrast text 4.5:1 minimum
- [ ] `prefers-reduced-motion` respected
- [ ] Alt text cho tất cả ảnh
- [ ] Form inputs có labels

---

## Related Skills

- `ui-ux-pro-max` — Database gốc (67 styles, 161 palettes, search engine)
- `bmad-create-ux-design` — UX design specification workflow
- `cco-kb-skill-forge` — Forge thêm skill từ knowledge-base

## References

- `data/ane-brand-tokens.md` — ANE brand tokens đầy đủ (màu, typography, spacing, icons)
- `references/kb-pointers.md` — KB pointers (brand guidelines, messaging, products)
