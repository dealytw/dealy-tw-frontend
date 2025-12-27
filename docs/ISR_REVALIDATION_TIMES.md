# ISR Revalidation Times - Complete List

## Current Revalidation Times

### Page-Level Revalidation (export const revalidate)

| Page Type | File | Current Time | Seconds | Hours | Days |
|-----------|------|--------------|---------|-------|------|
| **Homepage** | `app/page.tsx` | 3600 | 1 hour | 1h | - |
| **Merchant Detail** | `app/shop/[id]/page.tsx` | 21600 | 6 hours | 6h | - |
| **Merchant List** | `app/shop/page.tsx` | 3600 | 1 hour | 1h | - |
| **Category Detail** | `app/category/[categorySlug]/page.tsx` | 3600 | 1 hour | 1h | - |
| **Special Offer Detail** | `app/special-offers/[id]/page.tsx` | 3600 | 1 hour | 1h | - |
| **Special Offer List** | `app/special-offers/page.tsx` | 3600 | 1 hour | 1h | - |
| **Legal Page** | `app/[slug]/page.tsx` | 86400 | 24 hours | 24h | 1d |
| **Blog Post** | `app/blog/[page_slug]/page.tsx` | 86400 | 24 hours | 24h | 1d |
| **Blog List** | `app/blog/page.tsx` | 3600 | 1 hour | 1h | - |
| **Sitemaps** | `app/*-sitemap.xml/route.ts` | 604800 | 7 days | 168h | 7d |

### Data Fetching Revalidation (revalidate in strapiFetch)

| Data Type | File | Current Time | Seconds | Minutes | Hours |
|-----------|------|--------------|---------|---------|-------|
| **Merchant Data** | `app/shop/[id]/page.tsx` | 21600 | 6 hours | 360m | 6h |
| **Merchant Coupons** | `app/shop/[id]/page.tsx` | 21600 | 6 hours | 360m | 6h |
| **Merchant Images** | `app/shop/[id]/page.tsx` | 21600 | 6 hours | 360m | 6h |
| **Merchant Categories** | `app/shop/[id]/page.tsx` | 21600 | 6 hours | 360m | 6h |
| **Related Merchants** | `app/shop/[id]/page.tsx` | 21600 | 6 hours | 360m | 6h |
| **Hotstore Merchants** | `app/shop/[id]/page.tsx` | 3600 | 1 hour | 60m | 1h |
| **Category Data** | `app/category/[categorySlug]/page.tsx` | 3600 | 1 hour | 60m | 1h |
| **Category Coupons** ⚠️ | `app/category/[categorySlug]/page.tsx` | **300** | **5 minutes** | **5m** | - |
| **Special Offer Data** | `app/special-offers/[id]/page.tsx` | 3600 | 1 hour | 60m | 1h |
| **Legal Data** | `app/[slug]/page.tsx` | 86400 | 24 hours | 1440m | 24h |
| **Blog Data** | `app/blog/[page_slug]/page.tsx` | 86400 | 24 hours | 1440m | 24h |
| **Search Merchants** | `app/layout.tsx` | 3600 | 1 hour | 60m | 1h |
| **Hotstore (Layout)** | `app/layout.tsx` | 3600 | 1 hour | 60m | 1h |
| **SEO Data** | `src/lib/seo.server.ts` | 3600 | 1 hour | 60m | 1h |
| **Market Data** | `src/lib/domain-config.ts` | 86400 | 24 hours | 1440m | 24h |

### API Route Revalidation

| API Route | File | Current Time | Seconds | Minutes | Hours |
|-----------|------|--------------|---------|---------|-------|
| **Merchant Coupon API** ⚠️ | `app/api/merchant-coupon/route.ts` | **300** | **5 minutes** | **5m** | - |
| **Hotstore API** | `app/api/hotstore/route.ts` | 3600 | 1 hour | 60m | 1h |
| **Search API** | `app/api/search/route.ts` | 86400 | 24 hours | 1440m | 24h |
| **Coupon Queries** ⚠️ | `src/lib/coupon-queries.ts` | **300** | **5 minutes** | **5m** | - |

### Cloudflare Cache Headers (middleware.ts)

| Page Type | s-maxage | Seconds | Hours | Days |
|-----------|----------|---------|-------|------|
| **Homepage** | 28800 | 8 hours | 8h | - |
| **Merchant Pages** | 28800 | 8 hours | 8h | - |
| **Blog Pages** | 86400 | 24 hours | 24h | 1d |
| **Category Pages** | 86400 | 24 hours | 24h | 1d |
| **Other Pages** | 28800 | 8 hours | 8h | - |
| **stale-while-revalidate** | 86400 | 24 hours | 24h | 1d |

---

## ⚠️ Short Cache Times (5 minutes)

These are the **shortest cache times** that cause more frequent API calls:

1. **Category Page Coupon Fetching** (`app/category/[categorySlug]/page.tsx:180`)
   - `revalidate: 300` (5 minutes)
   - **Impact**: If a category has 50 merchants, that's 50 API calls every 5 minutes during page regeneration
   - **File**: `app/category/[categorySlug]/page.tsx` line 180

2. **Merchant Coupon API** (`app/api/merchant-coupon/route.ts:5,40`)
   - `revalidate: 300` (5 minutes)
   - **Impact**: API route regenerates every 5 minutes
   - **File**: `app/api/merchant-coupon/route.ts` lines 5, 40

3. **Coupon Queries** (`src/lib/coupon-queries.ts:54,116,181`)
   - `revalidate: 300` (5 minutes)
   - **Impact**: Coupon data queries regenerate every 5 minutes
   - **File**: `src/lib/coupon-queries.ts` lines 54, 116, 181

---

## Recommendations for Longer Cache Times

Since pages are not really dynamic, here are recommendations to reduce API calls:

### Option 1: Aggressive Caching (Recommended)

| Current | Recommended | Reason |
|---------|-------------|--------|
| Category coupons: 300s (5m) | **3600s (1h)** | Coupons don't change frequently |
| Merchant coupon API: 300s (5m) | **3600s (1h)** | Same as above |
| Coupon queries: 300s (5m) | **3600s (1h)** | Same as above |
| Homepage: 3600s (1h) | **21600s (6h)** | Homepage content is relatively static |
| Merchant pages: 21600s (6h) | **43200s (12h)** | Merchant data changes infrequently |
| Category pages: 3600s (1h) | **21600s (6h)** | Category content is relatively static |
| Special offer pages: 3600s (1h) | **21600s (6h)** | Special offers don't change hourly |

### Option 2: Very Aggressive Caching (Maximum API Reduction)

| Current | Recommended | Reason |
|---------|-------------|--------|
| Category coupons: 300s (5m) | **21600s (6h)** | Maximum reduction |
| Merchant coupon API: 300s (5m) | **21600s (6h)** | Maximum reduction |
| Coupon queries: 300s (5m) | **21600s (6h)** | Maximum reduction |
| Homepage: 3600s (1h) | **43200s (12h)** | Maximum reduction |
| Merchant pages: 21600s (6h) | **86400s (24h)** | Maximum reduction |
| Category pages: 3600s (1h) | **43200s (12h)** | Maximum reduction |
| Special offer pages: 3600s (1h) | **43200s (12h)** | Maximum reduction |

### Option 3: Balanced (Moderate Increase)

| Current | Recommended | Reason |
|---------|-------------|--------|
| Category coupons: 300s (5m) | **1800s (30m)** | Moderate increase |
| Merchant coupon API: 300s (5m) | **1800s (30m)** | Moderate increase |
| Coupon queries: 300s (5m) | **1800s (30m)** | Moderate increase |
| Homepage: 3600s (1h) | **7200s (2h)** | Moderate increase |
| Merchant pages: 21600s (6h) | **43200s (12h)** | Moderate increase |
| Category pages: 3600s (1h) | **7200s (2h)** | Moderate increase |

---

## Cloudflare/Vercel Settings to Reduce API Calls

### 1. Cloudflare Settings

**Current Setup:**
- Cache headers are set via `middleware.ts`
- `s-maxage` controls Cloudflare cache duration
- `stale-while-revalidate` allows serving stale content during revalidation

**Recommendations:**

1. **Increase `s-maxage` in middleware.ts** to match longer ISR times:
   ```typescript
   // Current: 8 hours for merchant pages
   sMaxAge = 28800; // 8 hours
   
   // Recommended: 24 hours for merchant pages
   sMaxAge = 86400; // 24 hours
   ```

2. **Increase `stale-while-revalidate`** to allow longer stale serving:
   ```typescript
   // Current: 24 hours
   staleWhileRevalidate = 86400; // 24 hours
   
   // Recommended: 7 days (604800 seconds)
   staleWhileRevalidate = 604800; // 7 days
   ```

3. **Cloudflare Dashboard Settings:**
   - Go to **Cloudflare Dashboard** → **Caching** → **Configuration**
   - Ensure **"Browser Cache TTL"** is set to **Respect Existing Headers**
   - Ensure **"Edge Cache TTL"** is set to **Respect Existing Headers**
   - Enable **"Always Online"** (serves stale content if origin is down)

### 2. Vercel Settings

**Current Setup:**
- ISR pages are automatically cached by Vercel Edge
- Cache duration is controlled by `revalidate` values

**Recommendations:**

1. **Vercel Dashboard Settings:**
   - Go to **Vercel Dashboard** → **Project Settings** → **General**
   - Ensure **"Edge Network"** → **"Caching"** is **Enabled**
   - Check **"Framework Preset"** is set to **Next.js**

2. **No Additional Settings Needed:**
   - Vercel automatically respects ISR `revalidate` times
   - Vercel Edge caches based on Next.js cache headers
   - No manual configuration needed

### 3. Manual Revalidation

**For content updates:**
- Use `/api/revalidate` endpoint to manually trigger regeneration
- This allows you to keep longer cache times but still update when needed
- Example: When a coupon is updated in CMS, call revalidate API

---

## Expected API Call Reduction

### Current (5-minute cache for coupons):
- Category page with 50 merchants: **50 API calls every 5 minutes** = 600 calls/hour
- Merchant coupon API: **1 API call every 5 minutes** = 12 calls/hour

### With 1-hour cache (Option 1):
- Category page with 50 merchants: **50 API calls every 1 hour** = 50 calls/hour (92% reduction)
- Merchant coupon API: **1 API call every 1 hour** = 1 call/hour (92% reduction)

### With 6-hour cache (Option 2):
- Category page with 50 merchants: **50 API calls every 6 hours** = 8.3 calls/hour (98.6% reduction)
- Merchant coupon API: **1 API call every 6 hours** = 0.17 calls/hour (98.6% reduction)

---

## Implementation Priority

1. **High Priority** (Biggest Impact):
   - ✅ Increase category coupon fetching from 300s → 3600s (1h)
   - ✅ Increase merchant coupon API from 300s → 3600s (1h)
   - ✅ Increase coupon queries from 300s → 3600s (1h)

2. **Medium Priority**:
   - ✅ Increase homepage from 3600s → 21600s (6h)
   - ✅ Increase category pages from 3600s → 21600s (6h)
   - ✅ Increase special offer pages from 3600s → 21600s (6h)

3. **Low Priority** (Already well cached):
   - ✅ Merchant pages: 21600s (6h) - already good
   - ✅ Legal pages: 86400s (24h) - already good
   - ✅ Blog pages: 86400s (24h) - already good
   - ✅ Sitemaps: 604800s (7d) - already good

---

## Next Steps

1. **Decide on cache times** (Option 1, 2, or 3)
2. **Update revalidate values** in the files listed above
3. **Update Cloudflare cache headers** in `middleware.ts` to match
4. **Test** that pages still update when content changes (via manual revalidation)
5. **Monitor** API call reduction

