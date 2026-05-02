---
domain: design-tokens
skill: ane-ui-ux-pro-max
description: ANE brand design tokens — canonical source for colors, typography, spacing, icons, and tone applied to all ANE UI
canon: true
last_updated: 2026-05-01
---

# ANE Brand Design Tokens

> **Canonical source**. Mọi UI cho ANH & EM (ANE) phải tuân theo tokens trong file này.

---

## 1. Color Palette

### Primary Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--ane-primary` | `#394787` | `[#394787]` | Headers, nav, footer, primary buttons, brand elements |
| `--ane-primary-light` | `#4A5A9E` | `[#4A5A9E]` | Hover state cho primary |
| `--ane-primary-dark` | `#2A3568` | `[#2A3568]` | Active/pressed state |
| `--ane-primary-tint` | `#E8ECF4` | `[#E8ECF4]` | Background tint nhẹ (sections xen kẽ) |

### CTA / Accent

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--ane-cta` | `#f27131` | `[#f27131]` | CTA buttons, links, highlights |
| `--ane-cta-light` | `#F58F5E` | `[#F58F5E]` | Hover state cho CTA |
| `--ane-cta-dark` | `#D05A1E` | `[#D05A1E]` | Active/pressed state |

### Neutral Colors

| Token | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| `--ane-white` | `#FFFFFF` | `white` | Background chính |
| `--ane-off-white` | `#F5F5F5` | `[#F5F5F5]` | Section backgrounds |
| `--ane-text` | `#1A1A1A` | `[#1A1A1A]` | Body text chính |
| `--ane-text-secondary` | `#475569` | `slate-600` | Text phụ, description |
| `--ane-text-muted` | `#64748B` | `slate-500` | Caption, metadata |
| `--ane-border` | `#D1D5DB` | `gray-300` | Borders, dividers |
| `--ane-border-light` | `#E5E7EB` | `gray-200` | Borders nhẹ |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--ane-success` | `#059669` | Thành công, in-stock |
| `--ane-warning` | `#D97706` | Cảnh báo, low-stock |
| `--ane-error` | `#DC2626` | Lỗi, out-of-stock |
| `--ane-info` | `#0891B2` | Thông tin, note |

---

## 2. Typography

### Font Stack

```css
/* System font stack tối ưu cho tiếng Việt */
--ane-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--ane-font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--ane-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `h1` | 2.25rem (36px) | 1.2 | Bold (700) | Page title |
| `h2` | 1.875rem (30px) | 1.3 | Semibold (600) | Section heading |
| `h3` | 1.5rem (24px) | 1.4 | Semibold (600) | Subsection heading |
| `h4` | 1.25rem (20px) | 1.4 | Medium (500) | Card title |
| `body` | 1rem (16px) | 1.6 | Regular (400) | Body text |
| `body-sm` | 0.875rem (14px) | 1.5 | Regular (400) | Secondary text |
| `caption` | 0.75rem (12px) | 1.5 | Regular (400) | Caption, meta |

### Vietnamese Typography Rules

- **Dấu thanh**: Luôn hiển thị đầy đủ — kiểm tra font hỗ trợ Vietnamese diacritics
- **Line height**: Tăng 10-15% so với tiếng Anh để chứa dấu
- **Word break**: Không ngắt giữa từ — dùng `word-break: keep-all` hoặc `overflow-wrap: break-word`

---

## 3. Spacing Scale

```css
--ane-space-xs: 0.25rem;   /* 4px */
--ane-space-sm: 0.5rem;    /* 8px */
--ane-space-md: 1rem;      /* 16px */
--ane-space-lg: 1.5rem;    /* 24px */
--ane-space-xl: 2rem;      /* 32px */
--ane-space-2xl: 3rem;     /* 48px */
--ane-space-3xl: 4rem;     /* 64px */
--ane-space-4xl: 6rem;     /* 96px */
```

### Section Spacing

| Context | Padding Y | Padding X |
|---------|-----------|-----------|
| Section | `--ane-space-3xl` (4rem) | `--ane-space-xl` (2rem) |
| Card | `--ane-space-lg` (1.5rem) | `--ane-space-lg` |
| Container max-width | — | `1280px` (max-w-7xl) |

---

## 4. Border Radius

```css
--ane-radius-sm: 0.25rem;   /* 4px — inputs, small elements */
--ane-radius-md: 0.5rem;    /* 8px — cards, buttons */
--ane-radius-lg: 0.75rem;   /* 12px — modals, large cards */
--ane-radius-full: 9999px;  /* Pills, badges */
```

---

## 5. Shadows

```css
/* Card / elevated surface */
--ane-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--ane-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
--ane-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

/* Floating elements (navbar, modals) */
--ane-shadow-floating: 0 8px 30px rgba(0, 0, 0, 0.12);
```

---

## 6. Transitions

```css
--ane-transition-fast: 150ms ease;
--ane-transition-normal: 200ms ease;
--ane-transition-slow: 300ms ease;
```

---

## 7. Icon Set

- **Primary**: Heroicons (24px outline) — `@heroicons/vue` hoặc SVG inline
- **Medical icons**: Sử dụng custom SVG cho biểu tượng nha khoa (răng, implant, CBCT)
- **Brand logos**: SVG chính hãng từ brand partners

---

## 8. Brand Voice — H2H Copy Guidelines

### DO
- ✅ Chuyên nghiệp nhưng gần gũi — "Chúng tôi hiểu nhu cầu của bác sĩ..."
- ✅ Dẫn chứng cụ thể — "25.286+ phòng khám đã tin dùng"
- ✅ Tập trung vào lợi ích lâm sàng — "Giảm 38% liều tia X cho bệnh nhân"
- ✅ Gọi đúng tên brand — "J. Morita" (không "Morita")
- ✅ Tiếng Việt có dấu đầy đủ

### DON'T
- ❌ Không sến, không "tuyệt vời nhất", không "số 1" (trừ khi có số liệu)
- ❌ Không hứa giá khi chưa kiểm tra bảng giá hiện hành
- ❌ Không hứa ngày giao hàng khi chưa kiểm tra inventory
- ❌ Không dùng emoji thay icons
- ❌ Không casual/slang — "xịn xò", "đỉnh của chóp"

---

## 9. ANE Component Quick Reference

### Button Styles

```html
<!-- Primary Button -->
<button class="bg-[#394787] hover:bg-[#4A5A9E] text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 cursor-pointer">
  Liên hệ tư vấn
</button>

<!-- CTA Button -->
<button class="bg-[#f27131] hover:bg-[#F58F5E] text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 cursor-pointer">
  Đặt demo miễn phí
</button>

<!-- Outline Button -->
<button class="border-2 border-[#394787] text-[#394787] hover:bg-[#E8ECF4] px-6 py-3 rounded-lg font-semibold transition-colors duration-200 cursor-pointer">
  Tìm hiểu thêm
</button>
```

### Card Style

```html
<div class="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer">
  <img src="..." alt="Tên sản phẩm" class="w-full h-48 object-cover rounded-md mb-4">
  <h3 class="text-xl font-semibold text-[#1A1A1A] mb-2">Tên sản phẩm</h3>
  <p class="text-[#475569] mb-4">Mô tả ngắn về sản phẩm...</p>
  <span class="text-[#f27131] font-medium">Tìm hiểu thêm →</span>
</div>
```

### Section Header

```html
<section class="py-16 bg-[#F5F5F5]">
  <div class="max-w-7xl mx-auto px-8">
    <h2 class="text-3xl font-bold text-[#1A1A1A] mb-4">Tiêu đề section</h2>
    <p class="text-[#475569] max-w-2xl">Mô tả section — giọng H2H, chuyên nghiệp, rõ ràng.</p>
  </div>
</section>
```

---

## 10. Anti-Patterns (TUYỆT ĐỐI TRÁNH)

| Pattern | Lý do |
|---------|-------|
| Purple/pink gradients (`from-purple-500 to-pink-500`) | Không phù hợp ngành y tế B2B |
| Neon colors (`#00FF00`, `#FF00FF`) | Mất tính chuyên nghiệp |
| Dark mode mặc định | Ưu tiên light mode cho web y tế |
| Animation quá mức (spin, bounce, pulse liên tục) | Gây mất tập trung |
| Emoji làm icons | Thiếu chuyên nghiệp, không accessibility |
| Text quá nhỏ (< 14px) | Bác sĩ lớn tuổi khó đọc |
| Quá nhiều màu (> 4 màu khác nhau) | Rối mắt, mất brand identity |
