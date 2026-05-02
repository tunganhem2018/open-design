#!/usr/bin/env node
/**
 * Image Downloader — Download product images from scraped data
 * Usage:
 *   node image-downloader.mjs --products <products.json> --output-dir <dir> [--concurrency <n>]
 *   node image-downloader.mjs --help
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, createWriteStream } from 'fs';
import { join, basename, extname, dirname } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function getExtFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const ext = extname(pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'].includes(ext)) {
      return ext;
    }
  } catch {}
  return '.jpg'; // Default
}

function getExtFromContentType(contentType) {
  if (!contentType) return null;
  const map = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/avif': '.avif',
  };
  return map[contentType.split(';')[0].trim().toLowerCase()] || null;
}

async function downloadImage(url, destPath, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Referer': new URL(url).origin,
        }
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Determine correct extension from Content-Type
      const contentType = res.headers.get('content-type');
      const ctExt = getExtFromContentType(contentType);
      let finalPath = destPath;
      if (ctExt && extname(destPath).toLowerCase() !== ctExt) {
        finalPath = destPath.replace(/\.[^.]+$/, ctExt);
      }

      mkdirSync(dirname(finalPath), { recursive: true });

      const body = Readable.fromWeb(res.body);
      const fileStream = createWriteStream(finalPath);
      await pipeline(body, fileStream);

      return { success: true, path: finalPath, size: res.headers.get('content-length') || '?' };
    } catch (err) {
      if (attempt < retries - 1) {
        await sleep(1000 * (attempt + 1));
      } else {
        return { success: false, error: err.message };
      }
    }
  }
}

async function downloadAll(products, outputDir, concurrency = 3) {
  console.log(`\n📥 Downloading images for ${products.length} products to: ${outputDir}\n`);
  mkdirSync(outputDir, { recursive: true });

  let totalDownloaded = 0;
  let totalFailed = 0;
  const manifest = [];

  for (let pi = 0; pi < products.length; pi++) {
    const product = products[pi];
    const productSlug = sanitizeFilename(product.slug || product.name);
    const productDir = join(outputDir, productSlug);
    mkdirSync(productDir, { recursive: true });

    console.log(`  [${pi + 1}/${products.length}] ${product.name} — ${product.images?.length || 0} images`);

    const images = product.images || [];
    const downloadedPaths = [];

    // Download images with limited concurrency
    for (let i = 0; i < images.length; i += concurrency) {
      const batch = images.slice(i, i + concurrency);
      const results = await Promise.all(
        batch.map((imgUrl, j) => {
          const idx = i + j;
          const ext = getExtFromUrl(imgUrl);
          const filename = `${productSlug}-${idx + 1}${ext}`;
          const destPath = join(productDir, filename);
          return downloadImage(imgUrl, destPath);
        })
      );

      results.forEach((result, j) => {
        if (result.success) {
          totalDownloaded++;
          downloadedPaths.push(result.path);
          console.log(`    ✅ ${basename(result.path)}`);
        } else {
          totalFailed++;
          console.log(`    ❌ Image ${i + j + 1}: ${result.error}`);
        }
      });

      if (i + concurrency < images.length) await sleep(500);
    }

    manifest.push({
      slug: productSlug,
      name: product.name,
      originalUrls: images,
      downloadedPaths,
    });
  }

  // Save manifest
  const manifestPath = join(outputDir, '_manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n📊 Image Download Summary:`);
  console.log(`   ✅ Downloaded: ${totalDownloaded}`);
  console.log(`   ❌ Failed: ${totalFailed}`);
  console.log(`   📋 Manifest: ${manifestPath}`);

  return { totalDownloaded, totalFailed, manifest };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Image Downloader — Download product images from scraped data

USAGE:
  node image-downloader.mjs --products <products.json> --output-dir <dir> [options]

OPTIONS:
  --products <file>    JSON file from scraper.mjs (required)
  --output-dir <dir>   Directory to save images (required)
  --concurrency <n>    Parallel downloads (default: 3)
  --help               Show this help

EXAMPLES:
  node image-downloader.mjs \\
    --products /tmp/product-scraper/bti/products.json \\
    --output-dir /tmp/product-scraper/bti/images/
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
  const outputDir = getArg('--output-dir');
  const concurrency = parseInt(getArg('--concurrency') || '3');

  if (!productsPath) { console.error('❌ --products is required'); process.exit(1); }
  if (!outputDir) { console.error('❌ --output-dir is required'); process.exit(1); }

  const data = JSON.parse(readFileSync(productsPath, 'utf-8'));
  const products = data.products || data;

  await downloadAll(products, outputDir, concurrency);
}

main().catch(err => {
  console.error(`\n💥 Fatal error: ${err.message}`);
  process.exit(1);
});
