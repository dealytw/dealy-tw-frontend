# Hreflang Implementation Plan for Non-Merchant Pages

## Current State Analysis

### ✅ Pages WITH hreflang (working):
1. **Homepage** (`/`) - Uses `pageMeta` with path `/` → Gets hreflang via `mainPages` list
2. **Blog home** (`/blog`) - Uses `pageMeta` with path `/blog` → Gets hreflang via `mainPages` list
3. **Special offers index** (`/special-offers`) - Uses `pageMeta` with path `/special-offers` → Gets hreflang via `mainPages` list
4. **Shop index** (`/shop`) - Uses `pageMeta` with path `/shop` → Gets hreflang via `mainPages` list

### ❌ Pages WITHOUT hreflang (need implementation):
1. **Category pages** (`/category/[categorySlug]`) - Uses `pageMeta` with path `/category/${categorySlug}` → **NO hreflang** (not in mainPages, not merchant page)
2. **Blog posts** (`/blog/[page_slug]`) - Uses `pageMeta` with path `/blog/${page_slug}` → **NO hreflang** (not in mainPages, not merchant page)
3. **Special offers detail** (`/special-offers/[id]`) - Uses `pageMeta` with path `/special-offers/${slug}` → **NO hreflang** (not in mainPages, not merchant page)
4. **Legal pages** (`/[slug]`) - Uses `pageMeta` with path `/${slug}` → **NO hreflang** (not in mainPages, not merchant page)

### ⚠️ Pages with special handling:
1. **Merchant pages** (`/shop/[id]`) - Uses CMS `hreflang_alternate` field (different slugs) → **Keep as-is** (will handle separately later)

## Implementation Plan

### Step 1: Update `getHreflangLinks` function

**Location:** `src/seo/meta.ts`

**Current logic:**
- `mainPages` list: `['/', '/shop', '/special-offers', '/blog']`
- Only adds alternate hreflang for pages in `mainPages` list
- Merchant pages use CMS alternate URL

**New logic needed:**
- Detect pages with same slugs that should have hreflang:
  - Category pages: `/category/[slug]` → Same slug on both sites
  - Blog posts: `/blog/[slug]` → Same slug on both sites
  - Special offers detail: `/special-offers/[slug]` → Same slug on both sites
  - Legal pages: `/[slug]` → Same slug on both sites (if exists on both)

**Implementation:**
```typescript
// Pages that have same slugs on both domains (should get hreflang)
const pagesWithSameSlug = [
  '/category/',      // Category pages
  '/blog/',          // Blog posts (not /blog index)
  '/special-offers/', // Special offers detail (not /special-offers index)
  // Legal pages: /[slug] - handled separately (check if exists on both)
];

// Check if this is a page with same slug on both domains
const isPageWithSameSlug = pagesWithSameSlug.some(prefix => 
  currentPath.startsWith(prefix) && currentPath !== prefix.replace('/', '')
);

// For pages with same slugs, add alternate domain with same path
if (isPageWithSameSlug) {
  links.push({
    hreflang: config.alternateHreflang,
    href: `${alternateDomainUrl}${currentPath}`
  });
}
```

### Step 2: Handle Legal Pages

Legal pages (`/[slug]`) need special handling because:
- They may not exist on both domains
- Need to check if the same slug exists on the alternate domain

**Options:**
1. **Simple approach:** Always add hreflang for legal pages (assume they exist on both)
2. **Complex approach:** Check CMS to see if same slug exists on alternate domain

**Recommendation:** Start with simple approach (Option 1), can enhance later if needed.

### Step 3: Update Both Frontends

Apply the same changes to:
- `dealy-tw-frontend/src/seo/meta.ts`
- `dealy-hk-frontend/src/seo/meta.ts`

## Expected Output

### Category Page Example:
```html
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/category/travel" />
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/category/travel" />
```

### Blog Post Example:
```html
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/blog/some-post" />
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/blog/some-post" />
```

### Special Offer Detail Example:
```html
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/special-offers/summer-sale" />
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/special-offers/summer-sale" />
```

## Testing Checklist

- [ ] Homepage hreflang still works
- [ ] Blog home hreflang still works
- [ ] Special offers index hreflang still works
- [ ] Category pages now have hreflang
- [ ] Blog posts now have hreflang
- [ ] Special offers detail now have hreflang
- [ ] Legal pages now have hreflang (if applicable)
- [ ] Merchant pages still use CMS alternate URL (unchanged)
- [ ] Test on both TW and HK frontends

## Notes

- **Merchant pages:** Keep current implementation (using CMS `hreflang_alternate` field) - will handle separately later
- **Legal pages:** May need enhancement later to check if slug exists on both domains
- **Future:** Consider adding `x-default` hreflang tag for all pages

