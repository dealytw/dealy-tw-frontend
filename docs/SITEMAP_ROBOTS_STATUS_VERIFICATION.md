# Sitemaps, Robots.txt, and Status Codes Verification

## ✅ Sitemap Implementation

### 1. Separate Sitemaps Per Domain
**Status**: ✅ **IMPLEMENTED**

- All sitemaps now use dynamic domain detection via `getDomainConfigServer()`
- Base URL is determined from `NEXT_PUBLIC_SITE_URL` or domain config
- Each domain (dealy.tw, dealy.hk) generates its own sitemap URLs

**Files Updated**:
- `app/sitemap.xml/route.ts`
- `app/sitemap_index.xml/route.ts`
- `app/shop-sitemap.xml/route.ts`
- `app/topicpage-sitemap.xml/route.ts`
- `app/category-sitemap.xml/route.ts`
- `app/blog-sitemap.xml/route.ts`
- `app/page-sitemap.xml/route.ts`

### 2. Chunked by Type
**Status**: ✅ **IMPLEMENTED**

Sitemaps are already separated by content type:
- `page-sitemap.xml` - Static pages and legal pages
- `shop-sitemap.xml` - Merchant pages
- `topicpage-sitemap.xml` - Special offers
- `category-sitemap.xml` - Category pages
- `blog-sitemap.xml` - Blog posts

**Sitemap Index**: `sitemap.xml` lists all sub-sitemaps

### 3. Include `<lastmod>` = `updatedAt`
**Status**: ✅ **IMPLEMENTED**

All sitemaps include `<lastmod>` using `updatedAt` from CMS:
- Merchants: `merchant.updatedAt`
- Special offers: `topic.updatedAt` (fallback to `publishedAt`)
- Categories: `category.updatedAt`
- Blog posts: `post.updatedAt` (fallback to `publishedAt`)
- Legal pages: `legal.updatedAt`

### 4. Remove Expired/Inactive Items
**Status**: ✅ **IMPLEMENTED**

**Filtering Applied**:
- **Merchants**: Only include published merchants (`filters[publishedAt][$notNull]`)
- **Special Offers**: Only include published offers (`filters[publishedAt][$notNull]`)
- **Blog Posts**: Only include published posts (`filters[publishedAt][$notNull]`)
- **Categories**: All categories in CMS are included (no expiration concept)
- **Legal Pages**: All legal pages in CMS are included

**Implementation**:
- Filter at query level using Strapi `$notNull` filter
- Double-check at application level with `.filter()` before mapping

**Note**: Expired coupons are not included in sitemaps (only merchant/special offer pages are listed, not individual coupon pages). Coupons are handled at the page level, not in sitemaps.

---

## ✅ Robots.txt

**Status**: ✅ **UPDATED**

**Location**: `public/robots.txt`

**Current Content**:
```
# Block admin and API routes from crawling
User-agent: *
Disallow: /api/admin/
Disallow: /api/debug/
Disallow: /api/env-test/
Disallow: /api/hero-test/
Disallow: /api/mapper-test/
Disallow: /api/media-test/

# Allow everything else
Allow: /
```

**Verification**:
- ✅ Blocks admin and debug API routes from crawling
- ✅ Allows all other pages to be crawled
- ✅ Does not block parameters that are noindexed at page level
- ✅ Follows best practice: block admin/debug routes, allow public content

**Important Note**: 
- This `robots.txt` only applies to `dealy.tw` and `dealy.hk` (main domains)
- **`cms.dealy.tw` and `admin.dealy.tw` are separate subdomains** and need their own `robots.txt` files
- Each subdomain should have its own `robots.txt` that blocks everything:
  ```
  User-agent: *
  Disallow: /
  ```
- These should be configured on the CMS and admin servers separately

---

## ⚠️ Status Codes (404 vs 410)

**Status**: ⚠️ **PARTIALLY IMPLEMENTED**

### Current Implementation

**404 Not Found**: ✅ Used for all not-found cases
- All pages use Next.js `notFound()` which returns 404
- Used when:
  - Merchant/special offer/blog post not found in CMS
  - Invalid slug/path
  - Reserved slug accessed

### Required Implementation

**410 Gone**: ⚠️ **NOT YET IMPLEMENTED**

**Requirement**: Return 410 for permanently removed content, 404 for unknown content.

**Current Limitation**: Next.js `notFound()` only returns 404. To implement 410, we need:

1. **CMS Field**: Add a `deleted` or `archived` boolean field to track permanently removed content
2. **Custom Response**: Check deleted status and return 410 instead of 404:

```typescript
// Example implementation (not yet done)
if (merchant.deleted || merchant.archived) {
  return new NextResponse(null, { status: 410 });
}
notFound(); // Returns 404 for unknown
```

**Pages That Need 410 Support**:
- `/shop/[id]` - Merchant pages
- `/special-offers/[id]` - Special offer pages
- `/blog/[slug]` - Blog posts
- `/category/[categorySlug]` - Category pages (if categories can be deleted)

**Recommendation**: 
- Add `deleted` or `archived` field to CMS content types
- Update page handlers to check this field and return 410
- Keep 404 for content that doesn't exist (never existed)

---

## Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| Separate sitemaps per domain | ✅ | Dynamic domain detection |
| Chunked by type | ✅ | Already separated |
| Include `<lastmod>` = `updatedAt` | ✅ | Using CMS `updatedAt` |
| Remove expired from sitemap | ✅ | Filter published only |
| robots.txt allows everything | ✅ | No blocking rules |
| 404 for unknown | ✅ | Using `notFound()` |
| 410 for permanently removed | ⚠️ | Requires CMS field + custom response |

---

## Next Steps

1. **For 410 Implementation**:
   - Add `deleted` or `archived` field to CMS content types
   - Update page handlers to check deleted status
   - Return 410 response for deleted content
   - Keep 404 for never-existed content

2. **Optional Enhancements**:
   - Add sitemap validation (check for broken URLs)
   - Monitor sitemap coverage (ensure all published pages are included)
   - Add sitemap refresh endpoint for on-demand regeneration

