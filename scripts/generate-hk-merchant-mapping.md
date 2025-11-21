# Generate HK Merchant Mapping

This guide explains how to generate the `MERCHANT_NAME_TO_HK_SLUG_MAPPING` for hreflang tags.

## Method 1: Manual Mapping (Recommended for now)

1. Get HK sitemap: `https://dealy.hk/shop-sitemap.xml`
2. Extract all merchant slugs from `/shop/{slug}` URLs
3. For each TW merchant in Strapi, find the matching HK merchant by name
4. Add to `MERCHANT_NAME_TO_HK_SLUG_MAPPING` in `src/lib/seo.server.ts`

## Method 2: Automated Script (Future)

Create a script that:
1. Fetches HK sitemap
2. Fetches all TW merchants from Strapi
3. Matches by merchant_name (with normalization)
4. Generates the mapping object

## Format

```typescript
const MERCHANT_NAME_TO_HK_SLUG_MAPPING: Record<string, string> = {
  'Farfetch': 'farfetch',
  'Agoda': 'agoda',
  'Klook': 'klook',
  // ... more mappings
};
```

## Notes

- The mapping is used for TW -> HK hreflang tags
- If a merchant is not in the mapping, the system will try to match by normalized name
- For HK -> TW, we query Strapi directly (same database)

