# Sitemap SEO Improvement Plan

## Current State Analysis

### ✅ What's Working
- Basic structure follows XML sitemap protocol
- Proper priority distribution (1.0 for homepage, descending for others)
- Appropriate change frequencies
- Includes main navigation pages

### ❌ Critical Issues

1. **Hardcoded Data (Not Dynamic)**
   - Merchant pages are hardcoded (only 10 merchants listed)
   - Categories are hardcoded (might not match CMS)
   - Special offers are hardcoded (might not match CMS)
   - Missing blog posts entirely
   - Missing legal pages

2. **Inaccurate lastModified Dates**
   - All pages show same timestamp (build time)
   - Should use actual `updatedAt` from CMS

3. **Missing Dynamic Content**
   - Only includes ~10 merchants, but site has 60+ merchants
   - Categories should be fetched from CMS
   - Special offers should be fetched from CMS
   - Blog posts not included at all

4. **SEO Issues**
   - `/search` page included (should be excluded - it's noindex)
   - `/coupons-demo` included (probably should be excluded)
   - No image sitemap for merchant logos

5. **Not Scalable**
   - Will break when merchants/categories are added in CMS
   - No consideration for sitemap index if URLs exceed 50k

## Recommended Improvements

### Phase 1: Make Sitemap Dynamic (HIGH PRIORITY)
- [ ] Fetch all merchants from CMS dynamically
- [ ] Fetch all categories from CMS dynamically  
- [ ] Fetch all special offers from CMS dynamically
- [ ] Fetch all blog posts from CMS
- [ ] Use actual `updatedAt` dates from CMS

### Phase 2: SEO Optimization (HIGH PRIORITY)
- [ ] Exclude noindex pages (`/search`)
- [ ] Remove or exclude demo pages (`/coupons-demo`)
- [ ] Add proper priority distribution:
  - Homepage: 1.0
  - Merchant pages: 0.8-0.9 (high value)
  - Category pages: 0.7-0.8
  - Blog posts: 0.6-0.7
  - Special offers: 0.8 (seasonal, high traffic)
  - Legal pages: 0.3 (low priority)

### Phase 3: Advanced Features (MEDIUM PRIORITY)
- [ ] Create sitemap index if URLs exceed 50k
- [ ] Add image sitemap for merchant logos
- [ ] Implement lastModified based on actual CMS data
- [ ] Add changefreq based on content update patterns:
  - Merchants: daily (coupons change frequently)
  - Categories: weekly
  - Blog posts: monthly (unless frequently updated)
  - Special offers: daily (seasonal)

### Phase 4: Content Management (LOW PRIORITY)
- [ ] Exclude expired coupons/pages
- [ ] Handle archived merchants
- [ ] Filter by market (TW only for dealy.tw)

## Implementation Strategy

### Recommended Approach:
1. **Make sitemap async** - Use Next.js 13+ async sitemap support
2. **Fetch from CMS** - Use existing `strapiFetch` utility
3. **Cache appropriately** - Use ISR with 24-hour revalidation
4. **Handle errors gracefully** - Fallback to basic structure if CMS fails

### Expected URL Count:
- Homepage: 1
- Static pages: ~3-4
- Merchants: ~60+ (dynamically fetched)
- Categories: ~10+ (dynamically fetched)
- Special offers: ~5-10 (dynamically fetched)
- Blog posts: variable (dynamically fetched)
- **Total: ~100-200 URLs** (well under 50k limit, no index needed yet)

## Comparison with Industry Standards

### Leading Coupon Sites Typically Include:
1. ✅ All merchant pages
2. ✅ All category pages
3. ✅ All active coupons (or merchant pages with coupons)
4. ✅ Blog/guide articles
5. ✅ Seasonal/promotional pages
6. ❌ Search pages (usually excluded)
7. ❌ User-generated content pages
8. ✅ Legal/info pages (low priority)

### Your Site Should Match:
- ✅ All merchants (currently only 10 hardcoded)
- ✅ All categories (currently only 10 hardcoded)
- ✅ Blog posts (currently missing)
- ✅ Special offers (currently only 5 hardcoded)
- ❌ Search page (should be excluded)
- ⚠️ Demo pages (consider excluding)

## Priority Ranking

1. **CRITICAL**: Make merchants dynamic (affects 50+ URLs)
2. **CRITICAL**: Make categories dynamic (affects 10+ URLs)
3. **HIGH**: Add blog posts (affects content discovery)
4. **HIGH**: Fix lastModified dates (affects crawling efficiency)
5. **MEDIUM**: Exclude noindex pages
6. **MEDIUM**: Add image sitemap
7. **LOW**: Sitemap index structure (not needed yet)

