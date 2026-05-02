#!/usr/bin/env node
/**
 * WooCommerce Uploader — Upload translated products to WordPress/WooCommerce via REST API
 * Usage:
 *   node woo-uploader.mjs --products <products-vi.json> --images-dir <dir> [options]
 *   node woo-uploader.mjs --help
 */

import { readFileSync, readdirSync, existsSync, createReadStream } from 'fs';
import { join, basename, extname } from 'path';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

class WooCommerceClient {
  constructor({ siteUrl, username, appPassword }) {
    this.siteUrl = siteUrl.replace(/\/$/, '');
    this.auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  }

  async request(endpoint, method = 'GET', body = null) {
    const url = `${this.siteUrl}/wp-json/wc/v3${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`WooCommerce API ${method} ${endpoint} → ${res.status}: ${errText.substring(0, 300)}`);
    }
    return res.json();
  }

  async wpRequest(endpoint, method = 'GET', body = null) {
    const url = `${this.siteUrl}/wp-json/wp/v2${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': 'application/json',
      },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(url, options);
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`WP API ${method} ${endpoint} → ${res.status}: ${errText.substring(0, 300)}`);
    }
    return res.json();
  }

  // Upload image to WordPress media library
  async uploadImage(filePath) {
    const url = `${this.siteUrl}/wp-json/wp/v2/media`;
    const filename = basename(filePath);
    const ext = extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.gif': 'image/gif',
      '.webp': 'image/webp', '.svg': 'image/svg+xml',
    };
    const mimeType = mimeTypes[ext] || 'image/jpeg';

    const fileData = readFileSync(filePath);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.auth}`,
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
      body: fileData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Image upload failed for ${filename}: ${res.status} ${errText.substring(0, 200)}`);
    }

    const media = await res.json();
    return {
      id: media.id,
      url: media.source_url,
      filename,
    };
  }

  // Create or find a product category
  async ensureCategory(name) {
    // Search for existing
    const existing = await this.request(`/products/categories?search=${encodeURIComponent(name)}&per_page=100`);
    const found = existing.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (found) return found.id;

    // Create new
    const created = await this.request('/products/categories', 'POST', { name });
    return created.id;
  }

  // Create a product
  async createProduct(productData) {
    return this.request('/products', 'POST', productData);
  }
}

function getLocalImages(productSlug, imagesDir) {
  if (!imagesDir) return [];
  const productDir = join(imagesDir, productSlug);
  if (!existsSync(productDir)) return [];

  return readdirSync(productDir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f)) // Skip SVGs for WooCommerce
    .sort()
    .map(f => join(productDir, f));
}

async function uploadProducts(wc, products, imagesDir, dryRun = false) {
  console.log(`\n📤 Uploading ${products.length} products to WooCommerce...\n`);
  if (dryRun) console.log('  ⚠️  DRY RUN — no actual changes will be made\n');

  const results = [];
  const errors = [];

  // Ensure brand category exists
  let categoryId = null;
  const brand = products[0]?.brand || 'BTI Biotechnology Institute';
  try {
    if (!dryRun) {
      categoryId = await wc.ensureCategory(brand);
      console.log(`  📁 Category "${brand}" → ID ${categoryId}`);
    } else {
      console.log(`  📁 Would create/find category: "${brand}"`);
    }
  } catch (err) {
    console.error(`  ⚠️  Category error: ${err.message}`);
  }

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const slug = sanitizeSlug(product.slug || product.name);

    console.log(`\n  [${i + 1}/${products.length}] ${product.name_vi || product.name}`);

    try {
      // Upload images
      const uploadedImages = [];
      const localImages = getLocalImages(slug, imagesDir);

      if (localImages.length > 0 && !dryRun) {
        console.log(`    📸 Uploading ${localImages.length} images...`);
        for (const imgPath of localImages) {
          try {
            const uploaded = await wc.uploadImage(imgPath);
            uploadedImages.push({ id: uploaded.id, src: uploaded.url });
            console.log(`      ✅ ${uploaded.filename} → ${uploaded.url}`);
            await sleep(500);
          } catch (imgErr) {
            console.error(`      ❌ ${basename(imgPath)}: ${imgErr.message}`);
          }
        }
      } else if (dryRun) {
        console.log(`    📸 Would upload ${localImages.length} images`);
      }

      // Build WooCommerce product data
      const description = product.description_vi || product.description || '';
      const shortDescription = product.short_description_vi || '';

      // Build attributes from specs
      const attributes = Object.entries(product.specs_vi || product.specs || {}).map(([name, value], idx) => ({
        name,
        options: [String(value)],
        visible: true,
        variation: false,
      }));

      const wooProduct = {
        name: product.name_vi || `${brand} ${product.name}`,
        slug: product.slug_vi || slug,
        type: 'simple',
        status: 'draft', // Create as draft for review
        description,
        short_description: shortDescription,
        categories: categoryId ? [{ id: categoryId }] : [],
        images: uploadedImages.length > 0 ? uploadedImages : (product.images || []).map(src => ({ src })),
        attributes,
        tags: (product.tags_vi || []).map(t => ({ name: t })),
        meta_data: [
          { key: '_source_url', value: product.url || '' },
          { key: '_original_name', value: product.name || '' },
          { key: '_scraped_at', value: product.scrapedAt || '' },
        ],
      };

      if (dryRun) {
        console.log(`    📝 Would create: "${wooProduct.name}" (${attributes.length} attrs, ${uploadedImages.length || localImages.length} images)`);
        results.push({ name: wooProduct.name, status: 'dry-run' });
      } else {
        const created = await wc.createProduct(wooProduct);
        console.log(`    ✅ Created: "${created.name}" → ID ${created.id}, permalink: ${created.permalink}`);
        results.push({ id: created.id, name: created.name, permalink: created.permalink });
      }

      if (i < products.length - 1) await sleep(1000);
    } catch (err) {
      console.error(`    ❌ Error: ${err.message}`);
      errors.push({ product: product.name, error: err.message });
    }
  }

  console.log(`\n📊 Upload Summary:`);
  console.log(`   ✅ Uploaded: ${results.length}`);
  console.log(`   ❌ Errors: ${errors.length}`);

  return { results, errors };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
WooCommerce Uploader — Upload translated products to WordPress

USAGE:
  node woo-uploader.mjs --products <products-vi.json> [options]

OPTIONS:
  --products <file>       Translated products JSON (required)
  --images-dir <dir>      Directory with downloaded images
  --site-url <url>        WordPress site URL (or WORDPRESS_SITE_URL env)
  --username <user>       WordPress username (or WORDPRESS_USERNAME env)
  --app-password <pass>   WordPress app password (or WORDPRESS_APP_PASSWORD env)
  --dry-run               Preview what would be uploaded without making changes
  --help                  Show this help

ENVIRONMENT:
  WORDPRESS_SITE_URL      Site URL if --site-url not specified
  WORDPRESS_USERNAME      Username if --username not specified
  WORDPRESS_APP_PASSWORD  App password if --app-password not specified

EXAMPLES:
  # Dry run
  node woo-uploader.mjs \\
    --products /tmp/product-scraper/bti/products-vi.json \\
    --images-dir /tmp/product-scraper/bti/images/ \\
    --dry-run

  # Upload to ane.vn
  node woo-uploader.mjs \\
    --products /tmp/product-scraper/bti/products-vi.json \\
    --images-dir /tmp/product-scraper/bti/images/ \\
    --site-url https://ane.vn \\
    --username david@ane.vn \\
    --app-password "xxxx xxxx xxxx xxxx xxxx xxxx"
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const productsPath = getArg('--products');
  const imagesDir = getArg('--images-dir');
  const siteUrl = getArg('--site-url') || process.env.WORDPRESS_SITE_URL;
  const username = getArg('--username') || process.env.WORDPRESS_USERNAME;
  const appPassword = getArg('--app-password') || process.env.WORDPRESS_APP_PASSWORD;
  const dryRun = args.includes('--dry-run');

  if (!productsPath) { console.error('❌ --products is required'); process.exit(1); }
  if (!siteUrl) { console.error('❌ WordPress site URL is required'); process.exit(1); }
  if (!username) { console.error('❌ WordPress username is required'); process.exit(1); }
  if (!appPassword) { console.error('❌ WordPress app password is required'); process.exit(1); }

  const data = JSON.parse(readFileSync(productsPath, 'utf-8'));
  const products = data.products || data;

  const wc = new WooCommerceClient({ siteUrl, username, appPassword });

  console.log(`\n🌐 Target: ${siteUrl}`);
  console.log(`👤 User: ${username}`);

  await uploadProducts(wc, products, imagesDir, dryRun);
}

main().catch(err => {
  console.error(`\n💥 Fatal error: ${err.message}`);
  process.exit(1);
});
