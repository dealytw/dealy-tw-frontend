# Current Hreflang Implementation (Before Simplification)

## Overview
The current implementation uses complex slug-based matching to find alternate merchants between markets.

## Flow

### 1. Merchant Page Metadata Generation (`app/shop/[id]/page.tsx`)
- Calls `findAlternateMerchantBySlug(id, 'tw', 'hk', 300)`
- Passes the returned `alternateMerchantSlug` to `pageMeta()`

### 2. Alternate Merchant Lookup (`src/lib/seo.server.ts`)
**Function:** `findAlternateMerchantBySlug(pageSlug, currentMarket, alternateMarket, revalidate)`

**For TW -> HK:**
- Parses HK sitemap XML (`https://dealy.hk/shop-sitemap.xml`)
- Normalizes TW slug (e.g., "booking.com" -> "booking-com")
- Tries multiple matching strategies:
  1. Exact match
  2. With "-hk" suffix
  3. Without "-hk" suffix
  4. Partial match
- Returns HK slug if found, null otherwise

**For HK -> TW:**
- Queries Strapi CMS for TW merchant with matching slug
- Returns TW slug if found, null otherwise

### 3. Hreflang Link Generation (`src/seo/meta.ts`)
**Function:** `getHreflangLinks(currentPath, alternateMerchantSlug)`

- Always adds self-reference hreflang (e.g., `zh-TW` -> current page)
- For merchant pages: If `alternateMerchantSlug` exists, constructs URL:
  - `https://dealy.hk/shop/${alternateMerchantSlug}`
  - Uses `config.alternateHreflang` (from domain config) for hreflang code

### 4. Metadata Object
- `alternates.languages` is set with hreflang codes as keys and URLs as values
- Next.js metadata API should render these as `<link rel="alternate" hreflang="..." href="..." />` tags

## Issues with Current Approach

1. **Complex matching logic** - Multiple strategies, error-prone
2. **Sitemap parsing** - Requires fetching and parsing XML on every request (cached, but still)
3. **Slug normalization** - Complex rules for matching different slug formats
4. **Not accurate** - Matching can fail or match incorrectly
5. **Hard to maintain** - Logic spread across multiple files

## New Simplified Approach

1. **CMS Field:** `hreflang_alternate` (rich text JSON) - stores direct URL
   - Example: `https://dealy.hk/shop/trip-com`
   
2. **Frontend:**
   - Read `hreflang_alternate` from merchant data
   - Extract URL directly (no lookup needed)
   - Determine hreflang code from URL domain:
     - `dealy.hk` -> `zh-HK`
     - `dealy.sg` -> `zh-SG`
     - etc.
   - If null/empty, don't render alternate hreflang tag

3. **Benefits:**
   - ✅ Simple and direct
   - ✅ Accurate (manually set in CMS)
   - ✅ No complex matching logic
   - ✅ No sitemap parsing
   - ✅ Easy to maintain
   - ✅ Supports any domain (not just HK)

