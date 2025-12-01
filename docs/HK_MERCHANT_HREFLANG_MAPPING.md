# HK Merchant Hreflang Mapping

## Overview

This document describes the temporary hardcoded mapping between TW (Taiwan) merchant names and HK (Hong Kong) merchant slugs for hreflang tag implementation.

**⚠️ IMPORTANT: This is a temporary solution.** The HK site will migrate to Next.js later, at which point this hardcoded mapping should be replaced with a dynamic solution (e.g., shared database query or API endpoint).

## Purpose

The hreflang tags help search engines understand that TW and HK merchant pages are alternate versions of the same content. This mapping ensures that:
- TW merchant pages link to their HK equivalents
- HK merchant pages link to their TW equivalents
- Search engines serve the correct regional version to users

## Mapping Format

The mapping is stored in `src/lib/seo.server.ts` as `MERCHANT_NAME_TO_HK_SLUG_MAPPING`.

Format: `{ 'TW merchant_name': 'HK slug' }`

### Example

```typescript
'Booking.com': 'booking-com',  // TW: /shop/booking.com → HK: /shop/booking-com
'Nike': 'nike-hk',              // TW: /shop/nike → HK: /shop/nike-hk
```

## Slug Differences

HK slugs may differ from TW slugs due to:
- URL encoding differences (e.g., `booking.com` → `booking-com`)
- Market-specific naming (e.g., `nike` → `nike-hk`, `sephora` → `sephora-hk`)
- Hyphenation differences

## Current Implementation

1. **Primary Method**: Hardcoded mapping in `MERCHANT_NAME_TO_HK_SLUG_MAPPING`
2. **Fallback Method**: Dynamic sitemap parsing from `https://dealy.hk/shop-sitemap.xml`
3. **Fallback Method 2**: Name normalization and partial matching

## Migration Plan (Future)

When HK site migrates to Next.js:

1. **Option A**: Shared Strapi database query
   - Query merchants by `merchant_name` across markets
   - No hardcoded mapping needed

2. **Option B**: API endpoint
   - HK site exposes `/api/merchants/alternate?name={merchant_name}&market=tw`
   - TW site calls this endpoint for hreflang links

3. **Option C**: Shared merchant identifier
   - Add `global_merchant_id` field to Strapi
   - Match by ID instead of name/slug

## Maintenance

To add new merchant mappings:

1. Identify TW merchant name (from Strapi CMS)
2. Identify HK merchant slug (from HK sitemap or site)
3. Add entry to `MERCHANT_NAME_TO_HK_SLUG_MAPPING` in `src/lib/seo.server.ts`
4. Update this document if needed

## Slug Differences Examples

| TW Merchant Name | TW Slug | HK Slug | Notes |
|-----------------|---------|---------|-------|
| Booking.com | `booking.com` | `booking-com` | Dots converted to hyphens |
| Nike | `nike` | `nike-hk` | Market-specific suffix |
| Sephora | `sephora` | `sephora-hk` | Market-specific suffix |
| Olive Young | `olive-young` | `olive-young-global` | Different naming |
| Levi's | `levis` | `levis` | Apostrophe removed in both |

## Last Updated

- Date: 2025-01-XX
- Source: HK sitemap: https://dealy.hk/shop-sitemap.xml
- Total Mappings: ~150+ merchants
- All merchants from HK sitemap have been mapped

