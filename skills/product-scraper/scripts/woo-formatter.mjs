#!/usr/bin/env node
/**
 * WooCommerce Formatter — Convert scraped product data to WooCommerce import format
 * Usage:
 *   node woo-formatter.mjs --products <products.json> [--images-dir <dir>] [--format csv|json] [--output <file>]
 *   node woo-formatter.mjs --help
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname, basename, relative } from 'path';

function sanitizeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

function escapeCSV(value) {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildDescription(product) {
  let html = '';

  if (product.description) {
    html += `<p>${product.description}</p>\n`;
  }

  // Add specs as a table
  if (product.specs && Object.keys(product.specs).length > 0) {
    html += '<h3>Technical Specifications</h3>\n';
    html += '<table>\n<tbody>\n';
    for (const [key, value] of Object.entries(product.specs)) {
      html += `<tr><td><strong>${key}</strong></td><td>${value}</td></tr>\n`;
    }
    html += '</tbody>\n</table>\n';
  }

  // Add additional features
  if (product.additionalFeatures) {
    for (const [key, values] of Object.entries(product.additionalFeatures)) {
      if (Array.isArray(values) && values.length > 0) {
        html += `<h3>${key.charAt(0).toUpperCase() + key.slice(1)}</h3>\n`;
        html += '<ul>\n';
        values.forEach(v => { html += `<li>${v}</li>\n`; });
        html += '</ul>\n';
      }
    }
  }

  return html;
}

function buildShortDescription(product) {
  if (product.description) {
    const sentences = product.description.split('.').filter(s => s.trim().length > 10);
    return sentences.slice(0, 2).join('.').trim() + '.';
  }

  // Fallback: summarize from specs
  const specSummary = Object.entries(product.specs || {})
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
    .join('. ');
  return specSummary || product.name;
}

function buildAttributes(product) {
  const attrs = [];
  if (product.specs) {
    for (const [key, value] of Object.entries(product.specs)) {
      attrs.push({ name: key, value, visible: 1, global: 0 });
    }
  }
  return attrs;
}

function getLocalImages(productSlug, imagesDir) {
  if (!imagesDir) return [];
  const productDir = join(imagesDir, productSlug);
  if (!existsSync(productDir)) return [];

  return readdirSync(productDir)
    .filter(f => /\.(jpg|jpeg|png|gif|webp|svg|avif)$/i.test(f))
    .sort()
    .map(f => join(productDir, f));
}

function formatForWooCommerce(products, imagesDir) {
  return products.map((product, index) => {
    const slug = sanitizeSlug(product.slug || product.name);

    // Try to find local images, fallback to remote URLs
    let images = getLocalImages(slug, imagesDir);
    if (images.length === 0 && product.images?.length > 0) {
      images = product.images;
    }

    const description = buildDescription(product);
    const shortDescription = buildShortDescription(product);
    const attributes = buildAttributes(product);

    // WooCommerce CSV columns
    return {
      // Core fields
      type: 'simple',
      sku: `IMPORT-${slug}`,
      name: product.name,
      published: 0, // Draft — review before publishing
      is_featured: 0,
      catalog_visibility: 'visible',
      short_description: shortDescription,
      description: description,
      tax_status: 'taxable',
      in_stock: 1,
      stock: '',
      backorders_allowed: 0,
      sold_individually: 0,
      weight: '',
      length: '',
      width: '',
      height: '',
      allow_customer_reviews: 1,

      // Price
      regular_price: product.price || '',
      sale_price: '',

      // Categories & tags
      categories: product.brand || 'Imported',
      tags: Object.values(product.specs || {}).join(', '),

      // Images
      images: images.join(', '),

      // Attributes
      ...attributes.reduce((acc, attr, i) => {
        acc[`attribute_${i + 1}_name`] = attr.name;
        acc[`attribute_${i + 1}_value`] = attr.value;
        acc[`attribute_${i + 1}_visible`] = attr.visible;
        acc[`attribute_${i + 1}_global`] = attr.global;
        return acc;
      }, {}),

      // Meta
      meta_brand: product.brand,
      meta_source_url: product.url,
      meta_scraped_at: product.scrapedAt,
    };
  });
}

function toCSV(wooProducts) {
  if (wooProducts.length === 0) return '';

  // Collect all unique keys
  const allKeys = new Set();
  wooProducts.forEach(p => Object.keys(p).forEach(k => allKeys.add(k)));
  const headers = [...allKeys];

  const rows = [
    headers.map(escapeCSV).join(','),
    ...wooProducts.map(p =>
      headers.map(h => escapeCSV(p[h] || '')).join(',')
    )
  ];

  return rows.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
WooCommerce Formatter — Convert scraped data to WooCommerce import format

USAGE:
  node woo-formatter.mjs --products <products.json> [options]

OPTIONS:
  --products <file>     JSON file from scraper.mjs (required)
  --images-dir <dir>    Directory with downloaded images
  --format <type>       Output format: csv or json (default: csv)
  --output <file>       Output file path (default: stdout)
  --help                Show this help

OUTPUT FORMATS:
  csv    WooCommerce CSV Import compatible format
  json   Structured JSON for WP REST API or wp-cli import

EXAMPLES:
  # Generate CSV for WooCommerce import
  node woo-formatter.mjs \\
    --products /tmp/product-scraper/bti/products.json \\
    --images-dir /tmp/product-scraper/bti/images/ \\
    --format csv \\
    --output /tmp/product-scraper/bti/woo-import.csv

  # Generate JSON
  node woo-formatter.mjs \\
    --products /tmp/product-scraper/bti/products.json \\
    --format json \\
    --output /tmp/product-scraper/bti/woo-import.json
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
  const format = getArg('--format') || 'csv';
  const outputPath = getArg('--output');

  if (!productsPath) { console.error('❌ --products is required'); process.exit(1); }

  const data = JSON.parse(readFileSync(productsPath, 'utf-8'));
  const products = data.products || data;

  console.log(`\n📦 Formatting ${products.length} products for WooCommerce (${format})...\n`);

  const wooProducts = formatForWooCommerce(products, imagesDir);

  let output;
  if (format === 'csv') {
    output = toCSV(wooProducts);
  } else {
    output = JSON.stringify(wooProducts, null, 2);
  }

  if (outputPath) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, output);
    console.log(`✅ Saved ${format.toUpperCase()} to: ${outputPath}`);
    console.log(`   ${wooProducts.length} products formatted`);

    // Log attribute summary
    const totalAttrs = wooProducts.reduce((sum, p) => {
      return sum + Object.keys(p).filter(k => k.startsWith('attribute_')).length / 4;
    }, 0);
    console.log(`   ${Math.round(totalAttrs)} total attributes mapped`);
  } else {
    console.log(output);
  }
}

main().catch(err => {
  console.error(`\n💥 Fatal error: ${err.message}`);
  process.exit(1);
});
