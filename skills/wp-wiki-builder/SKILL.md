---
name: wp-wiki-builder
version: 1.0.0
description: |
  Build a complete WordPress Wiki system using Custom Post Types native to the denti-b2b theme.
  Creates ane_wiki CPT, taxonomies (wiki_brand, wiki_category, wiki_type), templates,
  CSS module, JSON-LD schema (Article/HowTo), and search integration.
  Target URL: ane.vn/wiki/ — no third-party plugins required.
  Use when: setting up a new wiki section, adding wiki articles, or extending wiki features.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

# WP Wiki Builder — ANE Knowledge Base

You are a WordPress developer building a native wiki system for the ANH & EM dental equipment company at `ane.vn`. The wiki must be built inside the `denti-b2b` theme without any third-party wiki plugins.

## Context

- **Theme path**: `/var/www/ane.vn/wp-content/themes/denti-b2b/`
- **Local dev path**: `/opt/ane-twin/projects/wp-ane-vn/wp-content/themes/denti-b2b/`
- **Target URL**: `ane.vn/wiki/`
- **Stack**: WordPress + WP-CLI, Yoast SEO active, WooCommerce active
- **Pattern**: Theme uses `includes/*.php` modules, loaded via `functions.php`
- **CSS pattern**: Conditional per-page CSS loaded in `functions.php` via `wp_enqueue_scripts`
- **Existing CPTs**: `ane_event`, `career` — follow same conventions

---

## Your Task

When asked to build or work on the ANE Wiki system, follow these phases:

---

## Phase 1: Detect Current State

Before writing any code, check what's already been implemented:

```bash
# Check if CPT is already registered
wp post-type list --allow-root --path=/var/www/ane.vn | grep ane_wiki

# Check if includes/wiki.php exists
ls -la /var/www/ane.vn/wp-content/themes/denti-b2b/includes/wiki.php 2>/dev/null

# Check if templates exist
ls -la /var/www/ane.vn/wp-content/themes/denti-b2b/archive-ane_wiki.php 2>/dev/null
ls -la /var/www/ane.vn/wp-content/themes/denti-b2b/single-ane_wiki.php 2>/dev/null

# Check existing wiki posts
wp post list --post_type=ane_wiki --allow-root --path=/var/www/ane.vn 2>/dev/null
```

Skip any steps already completed.

---

## Phase 2: Create `includes/wiki.php`

Create the file at: `{THEME_PATH}/includes/wiki.php`

The file must contain these sections in order:

### Section 1: CPT Registration

```php
<?php
/**
 * ANE Wiki — Custom Post Type, Taxonomies, Meta Fields, Schema
 *
 * URL structure: ane.vn/wiki/
 * No third-party plugins required.
 *
 * @package DENTI_B2B
 */

if ( ! defined( 'ABSPATH' ) ) { exit; }

/* ─────────────────────────────────────────────
   1. CUSTOM POST TYPE: ane_wiki
   ───────────────────────────────────────────── */
add_action( 'init', function() {
    register_post_type( 'ane_wiki', array(
        'labels' => array(
            'name'               => 'ANE Wiki',
            'singular_name'      => 'Wiki Article',
            'add_new_item'       => 'Thêm bài Wiki mới',
            'edit_item'          => 'Sửa bài Wiki',
            'search_items'       => 'Tìm bài Wiki',
            'not_found'          => 'Không tìm thấy bài Wiki nào.',
            'not_found_in_trash' => 'Không có bài Wiki trong thùng rác.',
        ),
        'public'        => true,
        'has_archive'   => 'wiki',
        'rewrite'       => array( 'slug' => 'wiki', 'with_front' => false ),
        'supports'      => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions', 'custom-fields', 'author' ),
        'show_in_rest'  => true,
        'menu_icon'     => 'dashicons-book-alt',
        'menu_position' => 25,
        'taxonomies'    => array(),
    ) );
} );
```

### Section 2: Taxonomies

```php
/* ─────────────────────────────────────────────
   2. TAXONOMY: wiki_brand
   ───────────────────────────────────────────── */
add_action( 'init', function() {
    register_taxonomy( 'wiki_brand', 'ane_wiki', array(
        'label'        => 'Thương hiệu',
        'hierarchical' => true,
        'rewrite'      => array( 'slug' => 'wiki/brand' ),
        'show_in_rest' => true,
    ) );

    $brands = array(
        'mectron'    => 'Mectron',
        'j-morita'   => 'J. Morita',
        'vista-apex' => 'Vista Apex',
        'bti'        => 'BTI Implants',
        'durr-dental' => 'Dürr Dental',
    );
    foreach ( $brands as $slug => $name ) {
        if ( ! term_exists( $slug, 'wiki_brand' ) ) {
            wp_insert_term( $name, 'wiki_brand', array( 'slug' => $slug ) );
        }
    }
} );

/* ─────────────────────────────────────────────
   3. TAXONOMY: wiki_category (Chủ đề)
   ───────────────────────────────────────────── */
add_action( 'init', function() {
    register_taxonomy( 'wiki_category', 'ane_wiki', array(
        'label'        => 'Chủ đề',
        'hierarchical' => true,
        'rewrite'      => array( 'slug' => 'wiki/chu-de' ),
        'show_in_rest' => true,
    ) );

    $cats = array(
        'bao-hanh'           => 'Bảo hành & Hỗ trợ',
        'thong-so-ky-thuat'  => 'Thông số kỹ thuật',
        'so-sanh-san-pham'   => 'So sánh sản phẩm',
        'kien-thuc-nha-khoa' => 'Kiến thức nha khoa',
        'chinh-sach'         => 'Chính sách',
        'an-toan-su-dung'    => 'An toàn sử dụng',
    );
    foreach ( $cats as $slug => $name ) {
        if ( ! term_exists( $slug, 'wiki_category' ) ) {
            wp_insert_term( $name, 'wiki_category', array( 'slug' => $slug ) );
        }
    }
} );

/* ─────────────────────────────────────────────
   4. TAXONOMY: wiki_type (Loại bài)
   ───────────────────────────────────────────── */
add_action( 'init', function() {
    register_taxonomy( 'wiki_type', 'ane_wiki', array(
        'label'        => 'Loại bài',
        'hierarchical' => false,
        'rewrite'      => array( 'slug' => 'wiki/loai' ),
        'show_in_rest' => true,
    ) );

    $types = array(
        'huong-dan' => 'Hướng dẫn sử dụng',
        'faq'       => 'FAQ',
        'so-sanh'   => 'So sánh',
        'thong-so'  => 'Thông số',
        'khai-niem' => 'Khái niệm',
    );
    foreach ( $types as $slug => $name ) {
        if ( ! term_exists( $slug, 'wiki_type' ) ) {
            wp_insert_term( $name, 'wiki_type', array( 'slug' => $slug ) );
        }
    }
} );
```

### Section 3: Meta Box (no ACF dependency)

```php
/* ─────────────────────────────────────────────
   5. META BOX: Wiki Settings
   ───────────────────────────────────────────── */
add_action( 'add_meta_boxes', function() {
    add_meta_box(
        'ane_wiki_meta',
        'Wiki Settings',
        'ane_wiki_meta_box_render',
        'ane_wiki',
        'side',
        'default'
    );
} );

function ane_wiki_meta_box_render( $post ) {
    wp_nonce_field( 'ane_wiki_meta_save', 'ane_wiki_nonce' );

    $difficulty    = get_post_meta( $post->ID, '_wiki_difficulty',       true ) ?: 'beginner';
    $read_time     = get_post_meta( $post->ID, '_wiki_read_time',        true ) ?: 3;
    $related_prods = get_post_meta( $post->ID, '_wiki_related_products', true );
    $visibility    = get_post_meta( $post->ID, '_wiki_visibility',       true ) ?: 'public';
    $last_reviewed = get_post_meta( $post->ID, '_wiki_last_reviewed',    true );
    ?>
    <p>
        <label><strong>Độ khó:</strong></label><br>
        <select name="wiki_difficulty" style="width:100%">
            <?php foreach ( array( 'beginner' => '🟢 Cơ bản', 'intermediate' => '🟡 Trung cấp', 'advanced' => '🔴 Nâng cao' ) as $k => $v ): ?>
                <option value="<?php echo esc_attr($k); ?>" <?php selected( $difficulty, $k ); ?>><?php echo $v; ?></option>
            <?php endforeach; ?>
        </select>
    </p>
    <p>
        <label><strong>Thời gian đọc (phút):</strong></label><br>
        <input type="number" name="wiki_read_time" value="<?php echo esc_attr( $read_time ); ?>" style="width:100%" min="1" max="60">
    </p>
    <p>
        <label><strong>ID sản phẩm WC liên quan:</strong></label><br>
        <input type="text" name="wiki_related_products" value="<?php echo esc_attr( $related_prods ); ?>" style="width:100%" placeholder="123, 456, 789">
        <small style="color:#888">Cách nhau bởi dấu phẩy</small>
    </p>
    <p>
        <label><strong>Ngày review kỹ thuật cuối:</strong></label><br>
        <input type="date" name="wiki_last_reviewed" value="<?php echo esc_attr( $last_reviewed ); ?>" style="width:100%">
    </p>
    <p>
        <label><strong>Hiển thị:</strong></label><br>
        <select name="wiki_visibility" style="width:100%">
            <option value="public"  <?php selected( $visibility, 'public'  ); ?>>🌐 Công khai</option>
            <option value="members" <?php selected( $visibility, 'members' ); ?>>🔒 Chỉ thành viên</option>
        </select>
    </p>
    <?php
}

add_action( 'save_post_ane_wiki', function( $post_id ) {
    if ( ! isset( $_POST['ane_wiki_nonce'] ) ) return;
    if ( ! wp_verify_nonce( $_POST['ane_wiki_nonce'], 'ane_wiki_meta_save' ) ) return;
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
    if ( ! current_user_can( 'edit_post', $post_id ) ) return;

    update_post_meta( $post_id, '_wiki_difficulty',       sanitize_key( $_POST['wiki_difficulty']       ?? 'beginner' ) );
    update_post_meta( $post_id, '_wiki_read_time',        absint( $_POST['wiki_read_time']               ?? 3 ) );
    update_post_meta( $post_id, '_wiki_related_products', sanitize_text_field( $_POST['wiki_related_products'] ?? '' ) );
    update_post_meta( $post_id, '_wiki_last_reviewed',    sanitize_text_field( $_POST['wiki_last_reviewed']    ?? '' ) );
    update_post_meta( $post_id, '_wiki_visibility',       sanitize_key( $_POST['wiki_visibility']        ?? 'public' ) );
} );
```

### Section 4: JSON-LD Schema

```php
/* ─────────────────────────────────────────────
   6. JSON-LD SCHEMA — Article / HowTo
   ───────────────────────────────────────────── */
add_action( 'wp_head', function() {
    if ( ! is_singular( 'ane_wiki' ) ) return;

    $post      = get_post();
    $types     = wp_get_post_terms( $post->ID, 'wiki_type', array( 'fields' => 'slugs' ) );
    $is_howto  = ! is_wp_error( $types ) && in_array( 'huong-dan', $types );

    $schema = array(
        '@context'         => 'https://schema.org',
        '@type'            => $is_howto ? 'HowTo' : 'Article',
        'name'             => get_the_title(),
        'headline'         => get_the_title(),
        'description'      => get_the_excerpt( $post ) ?: wp_trim_words( get_the_content(), 35, '...' ),
        'datePublished'    => get_the_date( 'c', $post ),
        'dateModified'     => get_the_modified_date( 'c', $post ),
        'author'           => array( '@type' => 'Organization', 'name' => 'ANH & EM Investment Development JSC' ),
        'publisher'        => array(
            '@type' => 'Organization',
            'name'  => 'ANH & EM',
            'logo'  => array(
                '@type' => 'ImageObject',
                'url'   => get_template_directory_uri() . '/assets/images/logo_web_new.webp',
            ),
        ),
        'mainEntityOfPage' => array( '@type' => 'WebPage', '@id' => get_permalink() ),
        'inLanguage'       => 'vi',
        'url'              => get_permalink(),
    );

    if ( has_post_thumbnail( $post ) ) {
        $schema['image'] = get_the_post_thumbnail_url( $post, 'large' );
    }

    // Read time as estimated duration for HowTo
    $read_time = get_post_meta( $post->ID, '_wiki_read_time', true );
    if ( $is_howto && $read_time ) {
        $schema['totalTime'] = 'PT' . absint( $read_time ) . 'M';
    }

    echo '<script type="application/ld+json" class="ane-wiki-schema">'
        . wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
        . '</script>' . "\n";
}, 1 );
```

### Section 5: Shortcodes & Integrations

```php
/* ─────────────────────────────────────────────
   7. SHORTCODE: [ane_wiki_related]
   Usage: [ane_wiki_related brand="mectron" limit="3"]
   ───────────────────────────────────────────── */
add_shortcode( 'ane_wiki_related', function( $atts ) {
    $a = shortcode_atts( array(
        'brand'    => '',
        'category' => '',
        'limit'    => 3,
        'title'    => '📚 Tài liệu kỹ thuật liên quan',
    ), $atts );

    $args = array(
        'post_type'      => 'ane_wiki',
        'post_status'    => 'publish',
        'posts_per_page' => absint( $a['limit'] ),
        'no_found_rows'  => true,
    );

    $tax_query = array();
    if ( $a['brand'] ) {
        $tax_query[] = array( 'taxonomy' => 'wiki_brand',    'field' => 'slug', 'terms' => $a['brand'] );
    }
    if ( $a['category'] ) {
        $tax_query[] = array( 'taxonomy' => 'wiki_category', 'field' => 'slug', 'terms' => $a['category'] );
    }
    if ( ! empty( $tax_query ) ) {
        $args['tax_query'] = $tax_query;
    }

    $q = new WP_Query( $args );
    if ( ! $q->have_posts() ) return '';

    $out = '<div class="ane-wiki-related"><h3>' . esc_html( $a['title'] ) . '</h3><ul>';
    while ( $q->have_posts() ) {
        $q->the_post();
        $read_time = get_post_meta( get_the_ID(), '_wiki_read_time', true );
        $time_badge = $read_time ? ' <span class="wiki-read-time">⏱ ' . absint( $read_time ) . ' phút</span>' : '';
        $out .= '<li><a href="' . esc_url( get_permalink() ) . '">' . get_the_title() . '</a>' . $time_badge . '</li>';
    }
    $out .= '</ul></div>';
    wp_reset_postdata();
    return $out;
} );

/* ─────────────────────────────────────────────
   8. VISIBILITY GATING (members-only articles)
   ───────────────────────────────────────────── */
add_filter( 'the_content', function( $content ) {
    if ( ! is_singular( 'ane_wiki' ) ) return $content;

    $visibility = get_post_meta( get_the_ID(), '_wiki_visibility', true );
    if ( $visibility !== 'members' ) return $content;
    if ( is_user_logged_in() ) return $content;

    return '<div class="wiki-members-gate" style="text-align:center;padding:60px 20px;background:#f8fafc;border-radius:12px;border:2px dashed var(--color-primary);">'
        . '<h3 style="color:var(--color-primary);">🔒 Nội dung dành cho thành viên</h3>'
        . '<p>Vui lòng <a href="' . esc_url( wp_login_url( get_permalink() ) ) . '">đăng nhập</a> để xem bài wiki này.</p>'
        . '</div>';
} );

/* ─────────────────────────────────────────────
   9. MEDICAL DISCLAIMER (auto-append)
   ───────────────────────────────────────────── */
add_filter( 'the_content', function( $content ) {
    if ( ! is_singular( 'ane_wiki' ) ) return $content;

    $disclaimer = '<div class="wiki-disclaimer" style="margin-top:40px;padding:16px 20px;background:#fff8e1;border-left:4px solid #f59e0b;border-radius:4px;font-size:0.875rem;color:#78350f;">'
        . '<strong>⚠️ Lưu ý:</strong> Thông tin trong bài viết này chỉ mang tính chất tham khảo kỹ thuật. '
        . 'Việc sử dụng thiết bị y tế nha khoa phải tuân thủ hướng dẫn của nhà sản xuất và bác sĩ có chuyên môn. '
        . 'Liên hệ <a href="/lien-he/">ANH & EM</a> để được tư vấn cụ thể.'
        . '</div>';

    return $content . $disclaimer;
}, 20 );
```

---

## Phase 3: Modify `functions.php`

Make exactly these 3 targeted edits to `functions.php`:

**Edit 1** — Add require after the `faq-accordion.php` line (~line 745):
```php
/* ─────────────────────────────────────────────
   4d. ANE WIKI — Knowledge Base CPT
   ───────────────────────────────────────────── */
require_once get_template_directory() . '/includes/wiki.php';
```

**Edit 2** — In `denti_b2b_custom_search()`, find the `post_type` array for post_query and add `'ane_wiki'`:
```php
// BEFORE:
'post_type' => array( 'post', 'ane_event' ),
// AFTER:
'post_type' => array( 'post', 'ane_event', 'ane_wiki' ),
```

**Edit 3** — In the BreadcrumbList JSON-LD action, add `ane_wiki` handler before the final `else { return; }`:
```php
} elseif ( is_singular( 'ane_wiki' ) ) {
    $items[] = array(
        '@type'    => 'ListItem',
        'position' => $position++,
        'name'     => 'Wiki',
        'item'     => home_url( '/wiki/' ),
    );
    $brands = wp_get_post_terms( get_the_ID(), 'wiki_brand' );
    if ( ! empty( $brands ) && ! is_wp_error( $brands ) ) {
        $items[] = array(
            '@type'    => 'ListItem',
            'position' => $position++,
            'name'     => $brands[0]->name,
            'item'     => get_term_link( $brands[0] ),
        );
    }
    $items[] = array(
        '@type'    => 'ListItem',
        'position' => $position++,
        'name'     => get_the_title(),
    );
```

Also add conditional CSS enqueue:
```php
// Wiki pages — load dedicated CSS
add_action( 'wp_enqueue_scripts', function() {
    if ( is_singular( 'ane_wiki' ) || is_post_type_archive( 'ane_wiki' ) || is_tax( array( 'wiki_brand', 'wiki_category', 'wiki_type' ) ) ) {
        wp_enqueue_style(
            'ane-wiki',
            get_template_directory_uri() . '/assets/css/wiki.css',
            array( 'denti-style' ),
            filemtime( get_stylesheet_directory() . '/assets/css/wiki.css' )
        );
    }
}, 101 );
```

---

## Phase 4: Create Templates

### `archive-ane_wiki.php`

The archive template must:
- Include `get_header()`
- Show a hero section: "📚 ANE Wiki — Thư Viện Kiến Thức"
- Show filter dropdowns for `wiki_brand` and `wiki_type` taxonomy
- Display posts in a 3-column card grid using class `wiki-grid`
- Each card shows: thumbnail, brand badge (colored by brand slug), title, excerpt, read time, type badge
- Include `the_posts_pagination()` at bottom
- Include `get_footer()`

Card HTML structure:
```html
<article class="wiki-card">
    <a href="{permalink}" class="wiki-card__thumb">
        {thumbnail or placeholder}
        <span class="brand-badge {brand_slug}">{brand_name}</span>
    </a>
    <div class="wiki-card__body">
        <h2 class="wiki-card__title"><a href="{permalink}">{title}</a></h2>
        <p class="wiki-card__excerpt">{excerpt 20 words}</p>
        <div class="wiki-card__meta">
            <span>⏱ {read_time} phút</span>
            <span>🏷 {wiki_type}</span>
            <span>📅 {date}</span>
        </div>
    </div>
</article>
```

### `single-ane_wiki.php`

The single template must:
- Include `get_header()`
- Show breadcrumb: Trang chủ > Wiki > [Brand] > [Title]
- Show article header: H1 title, meta bar (read time, date, brand badge, difficulty badge)
- Use a 2-column layout: `.wiki-single-layout` with main content + sidebar
- **Sidebar** contains:
  - Auto-generated TOC (JavaScript parses H2/H3 from `.wiki-content`)
  - Related wiki articles (same brand)
  - CTA box: "Cần tư vấn?" linking to `/lien-he/`
- Show `the_content()` inside `<div class="wiki-content">`
- After content: Related WooCommerce products (from `_wiki_related_products` meta IDs)
- After content: Related wiki posts (same brand, limit 3)
- Include `get_footer()`

TOC JavaScript (inline in template):
```javascript
(function() {
    const content = document.querySelector('.wiki-content');
    const toc = document.querySelector('.wiki-toc-list');
    if (!content || !toc) return;
    const headings = content.querySelectorAll('h2, h3');
    headings.forEach((h, i) => {
        const id = 'wiki-section-' + i;
        h.id = id;
        const li = document.createElement('li');
        li.className = h.tagName === 'H3' ? 'toc-sub' : 'toc-main';
        li.innerHTML = '<a href="#' + id + '">' + h.textContent + '</a>';
        toc.appendChild(li);
    });
})();
```

---

## Phase 5: Create CSS

Create `assets/css/wiki.css` with these sections:

```css
/* ─── Wiki Archive ─── */
.ane-wiki-archive .wiki-hero { ... }
.wiki-filters { display: flex; gap: 12px; margin-bottom: 32px; }
.wiki-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }

.wiki-card { background: #fff; border-radius: 12px; box-shadow: 0 2px 16px rgba(0,53,96,.08); overflow: hidden; transition: transform .2s, box-shadow .2s; }
.wiki-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,53,96,.15); }
.wiki-card__thumb { position: relative; display: block; aspect-ratio: 16/9; overflow: hidden; background: #f1f5f9; }
.wiki-card__thumb img { width: 100%; height: 100%; object-fit: cover; }

/* Brand badges — use brand slug as modifier */
.brand-badge { position: absolute; top: 12px; left: 12px; padding: 3px 10px; border-radius: 20px; font-size: .75rem; font-weight: 700; color: #fff; }
.brand-badge.mectron    { background: #005bbf; }
.brand-badge.bti        { background: #c0392b; }
.brand-badge.j-morita   { background: #003478; }
.brand-badge.vista-apex { background: #1a7a4a; }
.brand-badge.durr-dental { background: #6d28d9; }

.wiki-card__body { padding: 20px; }
.wiki-card__title { font-size: 1rem; margin: 0 0 8px; line-height: 1.4; }
.wiki-card__title a { color: #1e293b; text-decoration: none; }
.wiki-card__title a:hover { color: var(--color-primary); }
.wiki-card__excerpt { font-size: .875rem; color: #64748b; margin: 0 0 12px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.wiki-card__meta { display: flex; gap: 12px; font-size: .75rem; color: #94a3b8; flex-wrap: wrap; }

/* ─── Wiki Single ─── */
.wiki-single-header { margin-bottom: 40px; }
.wiki-meta-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin: 12px 0 24px; font-size: .875rem; color: #64748b; }
.wiki-difficulty { padding: 2px 10px; border-radius: 20px; font-size: .75rem; font-weight: 600; }
.wiki-difficulty.beginner    { background: #dcfce7; color: #15803d; }
.wiki-difficulty.intermediate { background: #fef9c3; color: #a16207; }
.wiki-difficulty.advanced    { background: #fee2e2; color: #b91c1c; }

.wiki-single-layout { display: grid; grid-template-columns: 1fr 300px; gap: 48px; align-items: start; margin-top: 32px; }
.wiki-content { min-width: 0; }
.wiki-content h2 { font-size: 1.4rem; margin: 32px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; }
.wiki-content h3 { font-size: 1.15rem; margin: 24px 0 12px; color: var(--color-primary); }
.wiki-content table { width: 100%; border-collapse: collapse; margin: 24px 0; }
.wiki-content th { background: var(--color-primary); color: #fff; padding: 10px 14px; text-align: left; }
.wiki-content td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; }
.wiki-content tr:nth-child(even) td { background: #f8fafc; }

/* ─── Sidebar & TOC ─── */
.wiki-sidebar { position: sticky; top: 100px; max-height: calc(100vh - 120px); overflow-y: auto; }
.wiki-toc { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
.wiki-toc h4 { font-size: .875rem; font-weight: 700; color: #475569; margin: 0 0 12px; text-transform: uppercase; letter-spacing: .05em; }
.wiki-toc-list { list-style: none; margin: 0; padding: 0; }
.wiki-toc-list li a { display: block; padding: 4px 0; font-size: .875rem; color: #475569; text-decoration: none; border-left: 2px solid transparent; padding-left: 10px; transition: all .15s; }
.wiki-toc-list li a:hover { color: var(--color-primary); border-left-color: var(--color-primary); }
.wiki-toc-list .toc-sub a { padding-left: 22px; font-size: .8125rem; color: #94a3b8; }

.wiki-cta { background: var(--color-primary); border-radius: 12px; padding: 24px; color: #fff; text-align: center; margin-top: 24px; }
.wiki-cta h4 { margin: 0 0 8px; color: #fff; }
.wiki-cta p { font-size: .875rem; opacity: .9; margin: 0 0 16px; }
.wiki-cta a { display: block; background: #fff; color: var(--color-primary); font-weight: 700; padding: 10px 20px; border-radius: 8px; text-decoration: none; }

/* ─── Related sections ─── */
.wiki-related-products { margin-top: 48px; padding-top: 32px; border-top: 2px solid #f1f5f9; }
.wiki-related-wiki { margin-top: 40px; }
.ane-wiki-related ul { list-style: none; padding: 0; margin: 0; }
.ane-wiki-related ul li { padding: 10px 0; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.ane-wiki-related ul li a { color: #1e293b; text-decoration: none; font-weight: 500; }
.ane-wiki-related ul li a:hover { color: var(--color-primary); }
.wiki-read-time { font-size: .75rem; color: #94a3b8; white-space: nowrap; }

/* ─── Medical Disclaimer ─── */
.wiki-disclaimer { margin-top: 40px; padding: 16px 20px; background: #fff8e1; border-left: 4px solid #f59e0b; border-radius: 4px; font-size: .875rem; color: #78350f; }

/* ─── Members Gate ─── */
.wiki-members-gate { text-align: center; padding: 60px 20px; background: #f8fafc; border-radius: 12px; border: 2px dashed var(--color-primary); }

/* ─── Responsive ─── */
@media (max-width: 1024px) {
    .wiki-grid { grid-template-columns: repeat(2, 1fr); }
    .wiki-single-layout { grid-template-columns: 1fr; }
    .wiki-sidebar { position: static; max-height: none; }
}
@media (max-width: 768px) {
    .wiki-grid { grid-template-columns: 1fr; }
    .wiki-filters { flex-direction: column; }
    .wiki-meta-bar { gap: 8px; }
}
```

---

## Phase 6: Flush & Verify

After all files are created, run verification commands:

```bash
THEME_PATH=/var/www/ane.vn/wp-content/themes/denti-b2b
WP_PATH=/var/www/ane.vn

# 1. Flush rewrite rules
wp rewrite flush --allow-root --path=$WP_PATH

# 2. Verify CPT registered
wp post-type list --allow-root --path=$WP_PATH | grep ane_wiki

# 3. Verify taxonomies
wp taxonomy list --allow-root --path=$WP_PATH | grep wiki_

# 4. Create test post
POST_ID=$(wp post create \
    --post_type=ane_wiki \
    --post_title="[TEST] Hướng dẫn Mectron Combi Touch" \
    --post_status=publish \
    --porcelain \
    --allow-root --path=$WP_PATH)

echo "Created post ID: $POST_ID"

# 5. Assign brand taxonomy
wp post term add $POST_ID wiki_brand mectron --allow-root --path=$WP_PATH
wp post term add $POST_ID wiki_type huong-dan --allow-root --path=$WP_PATH

# 6. Verify URLs return HTTP 200
SLUG=$(wp post get $POST_ID --field=post_name --allow-root --path=$WP_PATH)
echo "Testing: https://ane.vn/wiki/$SLUG/"
curl -s -o /dev/null -w "Single wiki: %{http_code}\n" https://ane.vn/wiki/$SLUG/
curl -s -o /dev/null -w "Archive:      %{http_code}\n" https://ane.vn/wiki/
curl -s -o /dev/null -w "Brand tax:    %{http_code}\n" https://ane.vn/wiki/brand/mectron/

# 7. Verify JSON-LD schema is output
SCHEMA_COUNT=$(curl -s https://ane.vn/wiki/$SLUG/ | grep -c "ane-wiki-schema")
echo "JSON-LD schema tags found: $SCHEMA_COUNT (expected: 1)"

# 8. Delete test post
wp post delete $POST_ID --force --allow-root --path=$WP_PATH
echo "Test post cleaned up."
```

Expected results:
- `ane_wiki` appears in post-type list
- `wiki_brand`, `wiki_category`, `wiki_type` appear in taxonomy list
- All URLs return HTTP 200
- JSON-LD schema count = 1

---

## Important Rules

1. **Medical disclaimer is mandatory** — always auto-appended via `the_content` filter
2. **Flush rewrite rules** after any CPT slug change, taxonomy slug change, or new registration
3. **Never use ACF** — all meta fields use native `add_meta_box` + `get/update_post_meta`
4. **No third-party wiki plugins** — everything is native WP + theme functions
5. **CSS always conditional** — never load wiki CSS globally (performance)
6. **Visibility gating** — check `_wiki_visibility` meta before showing content to guests
7. **Search** — `ane_wiki` must be included in `denti/v1/search` REST endpoint (Edit 2 in functions.php)
8. **Yoast compatibility** — CPT is `public + show_in_rest`, Yoast auto-indexes. Just enable in Yoast Settings > Search Appearance > Wiki

---

## Content Quick-Start (after installation)

Create these 5 articles first to validate the system and get quick SEO wins:

| Title | wiki_brand | wiki_type | wiki_category |
|---|---|---|---|
| Mectron Combi Touch — FAQ thường gặp | mectron | faq | bao-hanh |
| Thông số kỹ thuật Mectron Combi Touch | mectron | thong-so | thong-so-ky-thuat |
| Hướng dẫn vận hành Mectron Combi Touch | mectron | huong-dan | kien-thuc-nha-khoa |
| Chính sách bảo hành Mectron | mectron | faq | bao-hanh |
| So sánh Vista Apex vs Vista Apex X | vista-apex | so-sanh | so-sanh-san-pham |
