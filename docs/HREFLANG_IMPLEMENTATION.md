# Hreflang Implementation for TW ↔ HK Merchant Pages

## Overview

This implementation adds hreflang tags to merchant pages to link TW and HK versions of the same merchant, improving SEO and ensuring users see the correct regional version.

## Implementation Details

### 1. Sitemap-Based Mapping (TW → HK)

For TW merchants linking to HK:
- **Source**: Parses `https://dealy.hk/shop-sitemap.xml` to get all HK merchant slugs
- **Mapping**: Uses `MERCHANT_NAME_TO_HK_SLUG_MAPPING` to map TW `merchant_name` to HK `page_slug`
- **Fallback**: If no mapping exists, tries name normalization matching
- **Cache**: Sitemap parsing is cached for 1 hour

### 2. Database Query (HK → TW)

For HK merchants linking to TW:
- **Source**: Queries Strapi CMS directly (same database)
- **Method**: Matches by `merchant_name` and `market` filter
- **Cache**: Results cached for 5 minutes

## Files Modified

1. **`src/lib/seo.server.ts`**
   - `parseHKMerchantSitemap()`: Parses HK sitemap and caches results
   - `findAlternateMerchant()`: Finds alternate merchant in different market
   - `MERCHANT_NAME_TO_HK_SLUG_MAPPING`: Hardcoded mapping table (145 merchants)

2. **`src/seo/meta.ts`**
   - `getHreflangLinks()`: Updated to support merchant pages with alternate slugs
   - `pageMeta()`: Accepts `alternateMerchantSlug` parameter

3. **`app/shop/[id]/page.tsx`**
   - `generateMetadata()`: Fetches alternate merchant and passes to `pageMeta()`

## Mapping Table

The `MERCHANT_NAME_TO_HK_SLUG_MAPPING` contains 145+ merchant mappings, organized by category:
- Travel & Booking (13 merchants)
- Fashion & Beauty (30+ merchants)
- Electronics & Tech (10+ merchants)
- Retail & Shopping (10+ merchants)
- Health & Wellness (7 merchants)
- Food & Dining (5 merchants)
- Pharmacy & Health (7 merchants)
- And more...

## How It Works

### Example: TW Merchant Page

1. User visits: `https://dealy.tw/shop/farfetch.com`
2. System:
   - Gets merchant_name: "Farfetch"
   - Looks up in mapping: `'Farfetch': 'farfetch'`
   - Verifies slug exists in HK sitemap
   - Generates hreflang tags:
     ```html
     <link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/shop/farfetch.com" />
     <link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/shop/farfetch" />
     <link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/farfetch.com" />
     ```

### Example: HK Merchant Page (Future WordPress)

1. User visits: `https://dealy.hk/shop/farfetch`
2. System (WordPress):
   - Gets merchant_name: "Farfetch"
   - Queries Strapi CMS for TW version
   - Generates hreflang tags:
     ```html
     <link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/shop/farfetch" />
     <link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/shop/farfetch.com" />
     <link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/farfetch.com" />
     ```

## Adding New Merchants

When adding a new merchant:

1. **If merchant exists in both TW and HK:**
   - Add mapping to `MERCHANT_NAME_TO_HK_SLUG_MAPPING` in `src/lib/seo.server.ts`
   - Format: `'TW Merchant Name': 'hk-slug'`
   - Example: `'New Merchant': 'new-merchant'`

2. **If merchant only exists in TW:**
   - No action needed (hreflang will only show self + x-default)

3. **If merchant only exists in HK:**
   - No action needed (WordPress will handle it)

## Maintenance

- **Sitemap Cache**: Automatically refreshes every hour
- **Mapping Updates**: Manual updates when new merchants are added
- **Fallback Matching**: Automatic name normalization for unmapped merchants

## Testing

To verify hreflang tags are working:

1. Visit a merchant page: `https://dealy.tw/shop/farfetch.com`
2. View page source
3. Check `<head>` section for hreflang tags
4. Verify all three tags are present:
   - `zh-TW` (self)
   - `zh-HK` (alternate)
   - `x-default` (default)

## SEO Benefits

✅ **Better Geo-Targeting**: Google shows correct version to users  
✅ **Reduced Duplicate Content Issues**: Clarifies regional variants  
✅ **Improved CTR**: Users see correct currency and localized content  
✅ **Follows Google Best Practices**: Proper hreflang implementation

