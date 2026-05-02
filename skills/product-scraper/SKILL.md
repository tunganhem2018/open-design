---
name: product-scraper
description: |
  Scrape product information (name, specs, images, descriptions) from external websites
  and format for WooCommerce import. Supports configurable site adapters for different
  source websites. Trigger: "scrape products", "collect products", "import products from",
  "product scraper", "crawl products", "grab product data", "migrate products".
---

# Goal

Extract complete product data (names, descriptions, specifications, images) from external
websites and produce WooCommerce-ready import files (CSV/JSON). The skill uses a modular
adapter pattern so it can be configured for any source site.

---

# Instructions

## Pipeline Overview

```text
1. Analyze Source   →  2. Discover URLs  →  3. Scrape Products  →  4. Download Images  →  5. Format Output
   (understand site)    (find all products)   (extract data)        (save locally)         (WooCommerce CSV/JSON)
```

## Step 1: Analyze the Source Website

Before scraping, understand the site structure:

1. **Check for an existing adapter** in `adapters/`. If one exists for the target site, use it.
2. **If no adapter exists**, analyze the source site:
   - Open the brand/category listing page
   - Identify the CSS selectors for: product cards, product links, product names
   - Open one product detail page
   - Identify CSS selectors for: title, description, images, specifications/features, price
   - Create a new adapter JSON file in `adapters/`

### Adapter Format

```json
{
  "name": "site-name",
  "baseUrl": "https://example.com",
  "listing": {
    "productCardSelector": ".product-card",
    "productLinkSelector": ".product-card a",
    "productNameSelector": ".product-card h3",
    "productImageSelector": ".product-card img",
    "paginationSelector": ".pagination a.next",
    "paginationStyle": "link|loadmore|scroll|none"
  },
  "detail": {
    "nameSelector": "h1",
    "brandSelector": ".brand-name",
    "descriptionSelector": ".product-description",
    "imageSelectors": [".product-gallery img", ".main-image img"],
    "priceSelector": ".price",
    "specsSelector": ".specifications li",
    "specsPattern": "^(.+?):\\s*(.+)$",
    "additionalFields": {}
  },
  "rateLimit": {
    "requestsPerSecond": 2,
    "delayBetweenPages": 1000
  }
}
```

## Step 2: Discover Product URLs

Two approaches depending on site complexity:

### A. HTTP Scraping (Static Sites — preferred, faster)
Use `scripts/scraper.mjs`:
```bash
node scripts/scraper.mjs discover \
  --url "https://example.com/category/brand" \
  --adapter adapters/site-name.json \
  --output output/urls.json
```

### B. Browser Scraping (JavaScript-heavy sites)
Use the browser subagent to:
1. Navigate to the listing page
2. Scroll/paginate to load all products
3. Extract all product URLs from the DOM
4. Save the URL list to `output/urls.json`

## Step 3: Scrape Product Data

### A. HTTP Scraping
```bash
node scripts/scraper.mjs scrape \
  --urls output/urls.json \
  --adapter adapters/site-name.json \
  --output output/products.json
```

### B. Browser Scraping
For each product URL:
1. Navigate to the product page
2. Extract all fields defined in the adapter
3. Capture image URLs
4. Append to the products JSON

### C. Hybrid: read_url_content + AI Extraction
For sites where CSS selectors are unreliable:
1. Use `read_url_content` to fetch the page
2. Parse the markdown output to extract structured data
3. Use AI reasoning to identify product fields

## Step 4: Download Images

```bash
node scripts/image-downloader.mjs \
  --products output/products.json \
  --output-dir output/images/ \
  --concurrency 3
```

Images are saved as: `output/images/{product-slug}/{index}.{ext}`

## Step 5: Format for WooCommerce

```bash
node scripts/woo-formatter.mjs \
  --products output/products.json \
  --images-dir output/images/ \
  --format csv \
  --output output/woo-import.csv
```

### WooCommerce Field Mapping

| Scraped Field | WooCommerce Field | Notes |
|---|---|---|
| name | post_title | Product name |
| description | post_content | Full HTML description |
| short_description | post_excerpt | First 200 chars of description |
| brand | tax:product_brand | Brand taxonomy |
| category | tax:product_cat | Category hierarchy |
| images[0] | images | Comma-separated image URLs/paths |
| specs.* | meta:attribute_* | Product attributes |
| price | regular_price | Price if available |
| sku | sku | Auto-generated if not available |

## Step 6: Report & Review

After scraping completes, generate a summary:
- Total products found vs scraped
- Products with missing data (incomplete fields)
- Images downloaded vs failed
- Output file locations and sizes
- Sample of 3 products for human review

---

# Examples

## Example 1: Scrape SpotImplant BTI Products

**User says:** "Scrape BTI products from spotimplant.com"

**AI does:**
1. Checks `adapters/spotimplant.json` — found!
2. Runs HTTP scraper on `https://www.spotimplant.com/en/dental-implants/bti-biotechnology-institute`
3. Discovers 17 product URLs
4. Scrapes each product detail page → extracts name, brand, technical features, images
5. Downloads 17 product images to `output/images/`
6. Generates `output/woo-import.csv` with all products
7. Reports: "✅ 17/17 products scraped, 17 images downloaded, CSV ready for import"

## Example 2: Scrape from Unknown Site

**User says:** "Scrape products from https://example-dental.com/products"

**AI does:**
1. No adapter found → analyzes site structure using browser
2. Creates `adapters/example-dental.json` with discovered selectors
3. Runs pipeline: discover → scrape → download → format
4. Reports results and saves adapter for future use

---

# Constraints

- **ALWAYS** respect rate limits — minimum 500ms between requests
- **ALWAYS** check robots.txt before scraping (warn user if disallowed)
- **NEVER** scrape sites that require authentication without explicit user consent
- **NEVER** hardcode credentials or API keys
- **ALWAYS** verify scraped data quality before formatting (check for empty fields)
- **ALWAYS** create/update the adapter file so future scrapes are faster
- **ALWAYS** save raw scraped JSON before formatting (as backup)
- **PREFER** HTTP scraping over browser scraping when possible (faster, lighter)
- **LIMIT** concurrent requests to avoid overwhelming target servers
- Output directory defaults to `/tmp/product-scraper/` for one-off scrapes, or a user-specified directory
