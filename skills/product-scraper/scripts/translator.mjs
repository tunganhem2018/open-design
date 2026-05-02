#!/usr/bin/env node
/**
 * Product Translator — Translate scraped product data to Vietnamese using Anthropic API
 * Usage:
 *   node translator.mjs --products <products.json> --output <output.json> [--api-key <key>]
 *   node translator.mjs --help
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithClaude(apiKey, product) {
  const prompt = `You are a professional dental equipment translator specializing in Vietnamese dental terminology. 
Translate the following dental implant product information from English to Vietnamese.

RULES:
- Translate product descriptions naturally into Vietnamese dental professional language
- Keep brand names in English (BTI Biotechnology Institute, etc.)
- Keep model names/product names in English (e.g. "3.0 Interna", "CORE-X") 
- Translate technical spec LABELS to Vietnamese but keep VALUES in English where appropriate
- Create an SEO-optimized Vietnamese product title format: "[Brand] [Model] - [Mô tả ngắn tiếng Việt]"
- Create a compelling Vietnamese marketing description suitable for B2B dental equipment sales
- Add relevant Vietnamese dental keywords naturally
- The description should be professional, targeting dentists and dental clinics in Vietnam
- Output MUST be valid JSON

PRODUCT DATA:
${JSON.stringify(product, null, 2)}

Return a JSON object with these fields:
{
  "name_vi": "Vietnamese product title for WooCommerce",
  "short_description_vi": "Vietnamese short description (2-3 sentences, marketing-focused)",
  "description_vi": "Full Vietnamese HTML description including specs table and features",
  "slug_vi": "URL slug in Vietnamese-friendly format (lowercase, hyphens, no diacritics)",
  "specs_vi": { "Vietnamese spec label": "value", ... },
  "tags_vi": ["relevant", "Vietnamese", "tags"],
  "category_vi": "Vietnamese category name"
}

Return ONLY the JSON object, no markdown code fences or other text.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON from response (handle potential markdown fences)
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  return JSON.parse(jsonStr);
}

async function translateAllProducts(apiKey, products) {
  console.log(`\n🌐 Translating ${products.length} products to Vietnamese using Claude ${MODEL}...\n`);

  const translated = [];
  const errors = [];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    try {
      console.log(`  [${i + 1}/${products.length}] ${product.name}...`);
      const translation = await translateWithClaude(apiKey, {
        name: product.name,
        brand: product.brand,
        description: product.description,
        specs: product.specs,
        additionalFeatures: product.additionalFeatures,
      });

      translated.push({
        ...product,
        ...translation,
        translated: true,
      });

      console.log(`    ✅ → ${translation.name_vi}`);

      // Rate limit: wait between API calls
      if (i < products.length - 1) await sleep(1500);
    } catch (err) {
      console.error(`    ❌ Translation failed: ${err.message}`);
      errors.push({ product: product.name, error: err.message });
      // Keep original product without translation
      translated.push({ ...product, translated: false });
    }
  }

  console.log(`\n📊 Translation Summary:`);
  console.log(`   ✅ Translated: ${translated.filter(p => p.translated).length}`);
  console.log(`   ❌ Failed: ${errors.length}`);

  return { translated, errors };
}

// ── CLI ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Product Translator — Translate products to Vietnamese using Anthropic Claude

USAGE:
  node translator.mjs --products <products.json> --output <output.json> [options]

OPTIONS:
  --products <file>     JSON file from scraper.mjs (required)
  --output <file>       Output file for translated products (required)
  --api-key <key>       Anthropic API key (or set ANTHROPIC_API_KEY env var)
  --help                Show this help

ENVIRONMENT:
  ANTHROPIC_API_KEY     API key if --api-key not specified

EXAMPLES:
  # Translate scraped products
  ANTHROPIC_API_KEY=sk-xxx node translator.mjs \\
    --products /tmp/product-scraper/bti/products.json \\
    --output /tmp/product-scraper/bti/products-vi.json
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
  const outputPath = getArg('--output');
  const apiKey = getArg('--api-key') || process.env.ANTHROPIC_API_KEY;

  if (!productsPath) { console.error('❌ --products is required'); process.exit(1); }
  if (!outputPath) { console.error('❌ --output is required'); process.exit(1); }
  if (!apiKey || apiKey === 'sk-your-key-here') {
    console.error('❌ Anthropic API key is required. Use --api-key or ANTHROPIC_API_KEY env var');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(productsPath, 'utf-8'));
  const products = data.products || data;

  const { translated, errors } = await translateAllProducts(apiKey, products);

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify({
    translationDate: new Date().toISOString(),
    model: MODEL,
    totalProducts: products.length,
    totalTranslated: translated.filter(p => p.translated).length,
    totalErrors: errors.length,
    products: translated,
    errors,
  }, null, 2));

  console.log(`\n💾 Saved to ${outputPath}`);
}

main().catch(err => {
  console.error(`\n💥 Fatal error: ${err.message}`);
  process.exit(1);
});
