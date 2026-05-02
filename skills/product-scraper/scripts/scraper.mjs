#!/usr/bin/env node
/**
 * Product Scraper — Discover product URLs and extract product data
 * Usage:
 *   node scraper.mjs discover --url <listing-url> [--adapter <adapter.json>] [--output <file>]
 *   node scraper.mjs scrape   --urls <urls.json>  [--adapter <adapter.json>] [--output <file>]
 *   node scraper.mjs full     --url <listing-url> [--adapter <adapter.json>] [--output <file>]
 *   node scraper.mjs --help
 */

import { JSDOM } from 'jsdom';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchPage(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return await res.text();
    } catch (err) {
      console.error(`  ⚠ Attempt ${i + 1}/${retries} failed for ${url}: ${err.message}`);
      if (i < retries - 1) await sleep(2000 * (i + 1));
      else throw err;
    }
  }
}

function loadAdapter(adapterPath) {
  if (!adapterPath || !existsSync(adapterPath)) return null;
  return JSON.parse(readFileSync(adapterPath, 'utf-8'));
}

function extractText(el) {
  return el?.textContent?.trim() || '';
}

// ── SpotImplant-specific extractor ───────────────────────────────────────────
// This is the built-in extractor for spotimplant.com. For other sites, the
// generic adapter-based extraction is used.

function extractSpotImplantProductUrls(html, baseUrl, brandUrl) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const urls = new Set();

  // SpotImplant uses links following the pattern /en/dental-implants/brand/product
  const brandPath = new URL(brandUrl).pathname;
  doc.querySelectorAll('a[href]').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
    const path = new URL(fullUrl).pathname;
    // Product URLs are deeper than brand URL: /en/dental-implants/brand/product
    if (path.startsWith(brandPath) && path !== brandPath && path !== brandPath + '/') {
      // Filter out anchors like #implants, #prosthetics, /edit, etc.
      if (!path.includes('#') && !path.endsWith('/edit')) {
        urls.add(fullUrl.split('#')[0].split('?')[0]);
      }
    }
  });
  return [...urls];
}

function extractSpotImplantProduct(html, url) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;

  // Name from h1 — clean up multiline artifacts (e.g. "Product Name\n By Brand®")
  let rawName = extractText(doc.querySelector('h1'));
  const name = rawName.split('\n')[0].replace(/\s+By\s+.*/i, '').trim();

  // Brand from breadcrumb or link near h1
  let brand = '';
  const breadcrumbs = doc.querySelectorAll('nav a, .breadcrumb a, ol a');
  breadcrumbs.forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.includes('/dental-implants/') && !href.includes(url.split('/').pop())) {
      brand = extractText(a);
    }
  });

  // Images from images.spotimplant.com
  const images = [];
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (src.includes('spotimplant.com') && !src.includes('logo') && !src.includes('icon')) {
      const fullSrc = src.startsWith('http') ? src : `https:${src}`;
      if (!images.includes(fullSrc)) images.push(fullSrc);
    }
  });

  // Technical features — look for list items with "Key: Value" pattern
  const specs = {};
  doc.querySelectorAll('li').forEach(li => {
    const text = extractText(li);
    const match = text.match(/^(.+?):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      // Only capture known implant spec fields
      const validKeys = [
        'Level', 'Connection Type', 'Connection Shape', 'Head Shape',
        'Body Shape', 'Apex Shape', 'Platform Switching', 'Self-tapping',
        'Material', 'Surface Treatment', 'Diameter', 'Length'
      ];
      if (validKeys.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        specs[key] = value;
      }
    }
  });

  // Description — paragraphs that are not part of nav/footer
  let description = '';
  const mainContent = doc.querySelector('main') || doc.querySelector('.content') || doc.body;
  mainContent.querySelectorAll('p').forEach(p => {
    const text = extractText(p);
    if (text.length > 50 && !text.includes('©') && !text.includes('cookie')) {
      if (!description) description = text;
      else description += '\n\n' + text;
    }
  });

  // Screwdrivers and other features
  const additionalFeatures = {};
  let currentHeader = '';
  doc.querySelectorAll('h2, h3, h4, ul li').forEach(el => {
    if (['H2', 'H3', 'H4'].includes(el.tagName)) {
      currentHeader = extractText(el).toLowerCase();
    } else if (el.tagName === 'LI' && currentHeader.includes('screwdriver')) {
      if (!additionalFeatures.screwdrivers) additionalFeatures.screwdrivers = [];
      additionalFeatures.screwdrivers.push(extractText(el));
    }
  });

  // Slug from URL
  const slug = url.split('/').filter(Boolean).pop();

  return {
    name,
    slug,
    brand: brand.replace('®', '').trim(),
    url,
    images,
    description,
    specs,
    additionalFeatures,
    scrapedAt: new Date().toISOString()
  };
}

// ── Generic adapter-based extractor ──────────────────────────────────────────

function extractGenericProductUrls(html, baseUrl, adapter) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const urls = new Set();

  const selector = adapter.listing?.productLinkSelector || 'a[href*="product"]';
  doc.querySelectorAll(selector).forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const fullUrl = href.startsWith('http') ? href : new URL(href, baseUrl).href;
    urls.add(fullUrl.split('#')[0].split('?')[0]);
  });
  return [...urls];
}

function extractGenericProduct(html, url, adapter) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const d = adapter.detail || {};

  const name = extractText(doc.querySelector(d.nameSelector || 'h1'));
  const brand = extractText(doc.querySelector(d.brandSelector || '.brand'));
  const description = extractText(doc.querySelector(d.descriptionSelector || '.description'));
  const price = extractText(doc.querySelector(d.priceSelector || '.price'));

  const images = [];
  const imgSelectors = d.imageSelectors || ['img.product-image'];
  imgSelectors.forEach(sel => {
    doc.querySelectorAll(sel).forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      if (src) {
        const fullSrc = src.startsWith('http') ? src : new URL(src, url).href;
        if (!images.includes(fullSrc)) images.push(fullSrc);
      }
    });
  });

  const specs = {};
  const specsPattern = d.specsPattern ? new RegExp(d.specsPattern) : /^(.+?):\s*(.+)$/;
  doc.querySelectorAll(d.specsSelector || '.specs li').forEach(li => {
    const text = extractText(li);
    const match = text.match(specsPattern);
    if (match) specs[match[1].trim()] = match[2].trim();
  });

  const slug = url.split('/').filter(Boolean).pop();

  return {
    name,
    slug,
    brand,
    url,
    images,
    description,
    price,
    specs,
    scrapedAt: new Date().toISOString()
  };
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function discoverCommand(listingUrl, adapter, outputPath) {
  console.log(`\n🔍 Discovering product URLs from: ${listingUrl}\n`);

  const html = await fetchPage(listingUrl);
  const baseUrl = new URL(listingUrl).origin;

  let urls;
  if (listingUrl.includes('spotimplant.com')) {
    urls = extractSpotImplantProductUrls(html, baseUrl, listingUrl);
  } else if (adapter) {
    urls = extractGenericProductUrls(html, baseUrl, adapter);
  } else {
    console.error('❌ No adapter provided and site is not a built-in. Use --adapter <file.json>');
    process.exit(1);
  }

  console.log(`✅ Found ${urls.length} product URLs:\n`);
  urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));

  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, JSON.stringify({ source: listingUrl, count: urls.length, urls }, null, 2));
    console.log(`\n💾 Saved to ${outputPath}`);
  }

  return urls;
}

async function scrapeCommand(urlsInput, adapter, outputPath, delayMs = 1500) {
  let urls;
  if (typeof urlsInput === 'string') {
    const data = JSON.parse(readFileSync(urlsInput, 'utf-8'));
    urls = data.urls || data;
  } else {
    urls = urlsInput;
  }

  console.log(`\n🕷️ Scraping ${urls.length} products...\n`);

  const products = [];
  const errors = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    try {
      console.log(`  [${i + 1}/${urls.length}] ${url}`);
      const html = await fetchPage(url);

      let product;
      if (url.includes('spotimplant.com')) {
        product = extractSpotImplantProduct(html, url);
      } else if (adapter) {
        product = extractGenericProduct(html, url, adapter);
      } else {
        console.error('  ⚠ No extractor available, skipping');
        errors.push({ url, error: 'No extractor' });
        continue;
      }

      products.push(product);
      console.log(`    ✅ ${product.name} — ${product.images.length} images, ${Object.keys(product.specs).length} specs`);

      if (i < urls.length - 1) await sleep(delayMs);
    } catch (err) {
      console.error(`    ❌ Error: ${err.message}`);
      errors.push({ url, error: err.message });
    }
  }

  console.log(`\n📊 Results: ${products.length} scraped, ${errors.length} errors`);

  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    const result = {
      scrapeDate: new Date().toISOString(),
      totalFound: urls.length,
      totalScraped: products.length,
      totalErrors: errors.length,
      products,
      errors
    };
    writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`💾 Saved to ${outputPath}`);
  }

  return products;
}

async function fullCommand(listingUrl, adapter, outputDir) {
  console.log(`\n🚀 Full scrape pipeline for: ${listingUrl}\n`);

  mkdirSync(outputDir, { recursive: true });

  // Step 1: Discover
  const urls = await discoverCommand(listingUrl, adapter, join(outputDir, 'urls.json'));

  // Step 2: Scrape
  const delayMs = adapter?.rateLimit?.delayBetweenPages || 1500;
  await scrapeCommand(urls, adapter, join(outputDir, 'products.json'), delayMs);

  console.log(`\n✅ Pipeline complete! Output in: ${outputDir}`);
  console.log('   Next steps:');
  console.log(`   1. Download images: node image-downloader.mjs --products ${join(outputDir, 'products.json')} --output-dir ${join(outputDir, 'images')}`);
  console.log(`   2. Format for WooCommerce: node woo-formatter.mjs --products ${join(outputDir, 'products.json')} --output ${join(outputDir, 'woo-import.csv')}`);
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Product Scraper — Discover and extract product data from websites

USAGE:
  node scraper.mjs <command> [options]

COMMANDS:
  discover    Find all product URLs on a listing/category page
  scrape      Extract product data from a list of URLs
  full        Run full pipeline: discover → scrape

OPTIONS:
  --url <url>           Listing/category page URL (for discover/full)
  --urls <file.json>    JSON file with product URLs (for scrape)
  --adapter <file.json> Site adapter config file
  --output <file>       Output file path (default: stdout)
  --output-dir <dir>    Output directory (for full command)
  --delay <ms>          Delay between requests in ms (default: 1500)
  --help                Show this help

EXAMPLES:
  # Discover BTI products on SpotImplant
  node scraper.mjs discover \\
    --url "https://www.spotimplant.com/en/dental-implants/bti-biotechnology-institute" \\
    --output /tmp/product-scraper/urls.json

  # Full pipeline
  node scraper.mjs full \\
    --url "https://www.spotimplant.com/en/dental-implants/bti-biotechnology-institute" \\
    --adapter ../adapters/spotimplant.json \\
    --output-dir /tmp/product-scraper/bti/
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    process.exit(0);
  }

  const command = args[0];
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
  };

  const adapterPath = getArg('--adapter');
  const adapter = loadAdapter(adapterPath);

  switch (command) {
    case 'discover': {
      const url = getArg('--url');
      if (!url) { console.error('❌ --url is required'); process.exit(1); }
      const output = getArg('--output') || null;
      await discoverCommand(url, adapter, output);
      break;
    }
    case 'scrape': {
      const urlsFile = getArg('--urls');
      if (!urlsFile) { console.error('❌ --urls is required'); process.exit(1); }
      const output = getArg('--output') || null;
      const delay = parseInt(getArg('--delay') || '1500');
      await scrapeCommand(urlsFile, adapter, output, delay);
      break;
    }
    case 'full': {
      const url = getArg('--url');
      if (!url) { console.error('❌ --url is required'); process.exit(1); }
      const outputDir = getArg('--output-dir') || '/tmp/product-scraper/output';
      await fullCommand(url, adapter, outputDir);
      break;
    }
    default:
      console.error(`❌ Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch(err => {
  console.error(`\n💥 Fatal error: ${err.message}`);
  process.exit(1);
});
