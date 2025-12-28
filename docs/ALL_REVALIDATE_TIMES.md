# Complete List of All Revalidate Times

## Page-Level Revalidation (`export const revalidate`)

| Page Type | File | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| **Homepage** | `app/page.tsx` | 86400 | 24 hours | TW, HK |
| **Merchant Detail** | `app/shop/[id]/page.tsx` | 43200 | 12 hours | TW, HK |
| **Merchant List** | `app/shop/page.tsx` | 3600 | 1 hour | TW, HK |
| **Category Detail** | `app/category/[categorySlug]/page.tsx` | 172800 | 48 hours | TW, HK |
| **Special Offer Detail** | `app/special-offers/[id]/page.tsx` | 3600 | 1 hour | TW, HK |
| **Special Offer List** | `app/special-offers/page.tsx` | 3600 | 1 hour | TW, HK |
| **Legal Page** | `app/[slug]/page.tsx` | 2592000 | 30 days | TW, HK |
| **Blog Post** | `app/blog/[page_slug]/page.tsx` | 2592000 | 30 days | TW, HK |
| **Blog Homepage** | `app/blog/page.tsx` | 86400 | 24 hours | TW |
| **Blog Homepage** | `app/blog/page.tsx` | 3600 | 1 hour | HK ⚠️ |
| **Sitemaps** | `app/*-sitemap.xml/route.ts` | 259200 | 72 hours (3 days) | TW, HK |

---

## Data Fetching Revalidation (in `strapiFetch` calls)

### Merchant Pages (`app/shop/[id]/page.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Merchant Images | ~442 | 43200 | 12 hours | TW, HK |
| Merchant Categories | ~485 | 43200 | 12 hours | TW, HK |
| Merchant Data | ~689 | 43200 | 12 hours | TW, HK |
| Merchant Coupons | ~718 | 43200 | 12 hours | TW, HK |
| **Hotstore Merchants** | ~729 | **3600** | **1 hour** | TW, HK |
| Related Merchant Coupons | ~767 | 43200 | 12 hours | TW, HK |

### Category Pages (`app/category/[categorySlug]/page.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Category Data | ~37 | 172800 | 48 hours | TW, HK |
| Category Relations | ~100-107 | 172800 | 48 hours | TW, HK |
| Category Coupons | ~180-187 | 86400 | 24 hours | TW, HK |
| Debug (categories) | ~120-127 | 60 | 1 minute | TW, HK |

### Blog Pages (`app/blog/[page_slug]/page.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Blog Post Data | ~46 | 2592000 | 30 days | TW, HK |
| Related Merchants | ~141 | 2592000 | 30 days | TW, HK |
| Related Blogs | ~172 | 2592000 | 30 days | TW, HK |
| Blog Images | ~201 | 2592000 | 30 days | TW, HK |
| Blog Sections | ~246 | 2592000 | 30 days | TW, HK |
| Blog Content Tables | ~437 | 2592000 | 30 days | TW, HK |

### Blog Homepage (`app/blog/page.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Blog Posts | ~48 | 86400 | 24 hours | TW |
| Blog Categories | ~80 | 86400 | 24 hours | TW |

### Legal Pages (`app/[slug]/page.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Legal Data | ~31 | 2592000 | 30 days | TW, HK |
| Legal Content | ~81 | 2592000 | 30 days | TW, HK |
| Legal Relations | ~151 | 2592000 | 30 days | TW, HK |

### Special Offer Pages (`app/special-offers/[id]/page.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Special Offer Data | ~25 | 3600 | 1 hour | TW, HK |
| Special Offer Relations | ~97 | 3600 | 1 hour | TW, HK |
| Debug (special-offers) | ~108 | 60 | 1 minute | TW, HK |

### Layout (`app/layout.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Hotstore Merchants | ~90-91 | 3600 | 1 hour | TW, HK |
| Search Merchants | ~144-158 | 3600 | 1 hour | TW, HK |

### Homepage (`app/page.tsx`)

| Data Type | Line | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| Homepage Data | (via `getHomePageByMarket`) | 86400 | 24 hours | TW, HK |

---

## API Route Revalidation (`export const revalidate`)

| API Route | File | Time (seconds) | Time (readable) | Site |
|-----------|------|----------------|-----------------|------|
| **Merchant Coupon API** | `app/api/merchant-coupon/route.ts` | 86400 | 24 hours | TW, HK |
| **Hotstore API** | `app/api/hotstore/route.ts` | 3600 | 1 hour | TW, HK |
| **Search API** | `app/api/search/route.ts` | 86400 | 24 hours | TW, HK |
| **Coupon Track Click** | `app/api/coupons/[id]/track-click/route.ts` | 0 | No cache | TW, HK |

---

## Library Function Revalidation

### Coupon Queries (`src/lib/coupon-queries.ts`)

| Function | Line | Time (seconds) | Time (readable) | Site |
|----------|------|----------------|-----------------|------|
| `getCouponsForMerchant` | ~54 | 86400 | 24 hours | TW, HK |
| `getTopCouponForMerchant` | ~116 | 86400 | 24 hours | TW, HK |
| `getAllActiveCoupons` | ~181 | 86400 | 24 hours | TW, HK |

### SEO Server (`src/lib/seo.server.ts`)

| Function | Default Time | Time (readable) | Site |
|----------|--------------|-----------------|------|
| `getMerchantSEO` | 21600 | 6 hours | TW, HK |
| `getMerchantCouponsForSEO` | 21600 | 6 hours | TW, HK |
| `getTopicSEO` | 300 | 5 minutes | TW, HK |
| `getBlogSEO` | 300 | 5 minutes | TW, HK |
| `getCategorySEO` | 300 | 5 minutes | TW, HK |
| `getLegalSEO` | 300 | 5 minutes | TW, HK |
| `getSpecialOfferSEO` | 300 | 5 minutes | TW, HK |
| Next.js Image Optimization | 3600 | 1 hour | TW, HK |

### Search Actions (`src/lib/search-actions.ts`)

| Function | Line | Time (seconds) | Time (readable) | Site |
|----------|------|----------------|-----------------|------|
| `getAllMerchantsForSearch` | ~37 | 3600 | 1 hour | TW, HK |

### Domain Config (`src/lib/domain-config.ts`)

| Function | Line | Time (seconds) | Time (readable) | Site |
|----------|------|----------------|-----------------|------|
| `getMarketLocale` | ~66 | 86400 | 24 hours | TW, HK |

### Coupons (`src/lib/coupons.ts`)

| Function | Line | Time (seconds) | Time (readable) | Site |
|----------|------|----------------|-----------------|------|
| Various coupon functions | ~119, 147, 175, 221, 258, 262 | Variable (`revalidateSec`) | Variable | TW, HK |
| Popup coupon | ~195 | 60 | 1 minute | TW, HK |

### Merchants (`src/lib/merchants.ts`)

| Function | Default Time | Time (readable) | Site |
|----------|--------------|-----------------|------|
| `searchMerchants` | 60 | 1 minute | TW, HK |

### Categories (`src/lib/categories.ts`)

| Function | Default Time | Time (readable) | Site |
|----------|--------------|-----------------|------|
| `searchCategories` | 60 | 1 minute | TW, HK |

---

## Sitemap Revalidation

| Sitemap Type | File | Time (seconds) | Time (readable) | Site |
|--------------|------|----------------|-----------------|------|
| Main Sitemap | `app/sitemap.xml/route.ts` | 259200 | 72 hours (3 days) | TW, HK |
| Blog Sitemap | `app/blog-sitemap.xml/route.ts` | 259200 | 72 hours (3 days) | TW, HK |
| Category Sitemap | `app/category-sitemap.xml/route.ts` | 259200 | 72 hours (3 days) | TW, HK |
| Shop Sitemap | `app/shop-sitemap.xml/route.ts` | 259200 | 72 hours (3 days) | TW, HK |
| Page Sitemap | `app/page-sitemap.xml/route.ts` | 259200 | 72 hours (3 days) | TW, HK |
| Topic Page Sitemap | `app/topicpage-sitemap.xml/route.ts` | 259200 | 72 hours (3 days) | TW, HK |

---

## Summary by Time Duration

### 0 seconds (No cache)
- `app/api/coupons/[id]/track-click/route.ts` - Track click API

### 60 seconds (1 minute)
- `app/category/[categorySlug]/page.tsx` - Debug categories
- `app/special-offers/[id]/page.tsx` - Debug special-offers
- `src/lib/coupons.ts` - Popup coupon
- `src/lib/merchants.ts` - `searchMerchants` (default)
- `src/lib/categories.ts` - `searchCategories` (default)

### 300 seconds (5 minutes)
- `src/lib/seo.server.ts` - `getTopicSEO`, `getBlogSEO`, `getCategorySEO`, `getLegalSEO`, `getSpecialOfferSEO` (defaults)

### 3600 seconds (1 hour)
- `app/shop/page.tsx` - Merchant list page
- `app/special-offers/[id]/page.tsx` - Special offer detail page
- `app/special-offers/page.tsx` - Special offer list page
- `app/blog/page.tsx` - Blog homepage (HK only) ⚠️
- `app/shop/[id]/page.tsx` - Hotstore merchants
- `app/layout.tsx` - Hotstore merchants, search merchants
- `app/api/hotstore/route.ts` - Hotstore API
- `src/lib/search-actions.ts` - Search merchants
- `src/lib/seo.server.ts` - Next.js image optimization

### 21600 seconds (6 hours)
- `src/lib/seo.server.ts` - `getMerchantSEO`, `getMerchantCouponsForSEO` (defaults)

### 43200 seconds (12 hours)
- `app/shop/[id]/page.tsx` - Merchant detail page (page-level and all data fetches)

### 86400 seconds (24 hours)
- `app/page.tsx` - Homepage
- `app/blog/page.tsx` - Blog homepage (TW only)
- `app/category/[categorySlug]/page.tsx` - Category coupons
- `app/api/merchant-coupon/route.ts` - Merchant coupon API
- `app/api/search/route.ts` - Search API
- `app/search/page.tsx` - Search page
- `src/lib/coupon-queries.ts` - All coupon query functions
- `src/lib/domain-config.ts` - Market locale
- `src/lib/homepage.ts` - Homepage data

### 172800 seconds (48 hours)
- `app/category/[categorySlug]/page.tsx` - Category detail page (page-level and category data)

### 259200 seconds (72 hours / 3 days)
- All sitemap routes

### 2592000 seconds (30 days / 1 month)
- `app/[slug]/page.tsx` - Legal pages
- `app/blog/[page_slug]/page.tsx` - Blog posts

---

## ⚠️ Inconsistencies Found

1. **Blog Homepage**: TW uses 24 hours (86400), HK uses 1 hour (3600) - should be consistent
2. **Hotstore Merchants**: Uses 1 hour (3600) in merchant pages, but this might be too frequent if hotstore data doesn't change often

---

## Notes

- All times are in seconds
- Page-level `export const revalidate` applies to the entire page
- Data fetching `revalidate` in `strapiFetch` applies to individual API calls
- API route `export const revalidate` applies to the API endpoint
- Debug revalidate times (60 seconds) are likely for development/testing

