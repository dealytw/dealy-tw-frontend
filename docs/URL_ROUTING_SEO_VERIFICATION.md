# URL, Routing & Deduplication SEO Verification

## ✅ 1. Consistent URL Policy

### Status: ⚠️ PARTIALLY IMPLEMENTED

**Requirements**:
- Lowercase URLs
- Consistent trailing slash policy (either all with or all without)
- 301 redirects for all variants

**Current Implementation**:
- ✅ Next.js default: No trailing slashes (routes defined without `/`)
- ✅ URLs are lowercase in CMS (slug-based)
- ❌ **Missing**: No middleware/redirects for URL normalization
  - No 301 redirect for trailing slash variants (`/shop/` → `/shop`)
  - No 301 redirect for uppercase variants (`/Shop` → `/shop`)
  - No 301 redirect for mixed case variants

**Files to Check**:
- `next.config.ts` - No `trailingSlash` config found (defaults to false)
- No middleware found for URL normalization

**Action Needed**:
```typescript
// middleware.ts (needs to be created)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // 1. Remove trailing slash (except for root)
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
    return NextResponse.redirect(url, 301);
  }
  
  // 2. Force lowercase paths
  if (url.pathname !== url.pathname.toLowerCase()) {
    url.pathname = url.pathname.toLowerCase();
    return NextResponse.redirect(url, 301);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next|_static|favicon.ico).*)'],
};
```

---

## ✅ 2. One Primary Page Per Coupon/Deal

### Status: ✅ IMPLEMENTED

**Requirements**:
- One primary page per coupon/deal
- Canonicalize to primary if multiple variants exist
- Consolidate content if needed

**Current Implementation**:
- ✅ Each merchant has one canonical URL: `/shop/[slug]`
- ✅ Each coupon belongs to one merchant
- ✅ Each special offer has one canonical URL: `/special-offers/[id]`
- ✅ Canonical URLs are set via `pageMeta()` function
- ✅ CMS supports `canonical_url` override field on merchants

**Example**:
```typescript
// app/shop/[id]/page.tsx
return pageMeta({
  title,
  description,
  path: `/shop/${id}`,
  canonicalOverride: merchant.canonical_url || undefined, // ✅ CMS override
  noindex,
});
```

**Verification**:
- [ ] Check if duplicate merchant pages exist (should be handled by slug uniqueness)
- [ ] Verify CMS enforces unique slugs

---

## ✅ 3. URL Parameters Handling

### Status: ✅ IMPLEMENTED

**Requirements**:
- Keep indexable content on clean routes
- Parameterized states use `meta robots="noindex,follow"` (not robots.txt)

**Current Implementation**:

#### Search Page ✅
```typescript
// app/search/page.tsx
export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  
  if (query) {
    return pageMeta({
      title: `搜尋「${query}」的優惠碼｜Dealy`,
      path: `/search?q=${encodeURIComponent(query)}`,
      noindex: true, // ✅ Correct - parameterized search results
    });
  }
  
  return pageMeta({
    title: '搜尋優惠碼｜Dealy',
    path: '/search',
    noindex: true, // ✅ Correct - search page itself
  });
}
```

**Good Practices**:
- ✅ Search results use `noindex: true` (parameterized)
- ✅ Base search page also noindex
- ✅ Clean routes (merchant pages, special offers) are indexable

**Verification**:
- [ ] Check if any other parameterized pages exist (filters, sorting, etc.)
- [ ] Verify all parameterized pages use `noindex: true`

---

## ⚠️ 4. Pagination

### Status: ⚠️ NEEDS IMPROVEMENT

**Requirements**:
- Page 1 canonical to base (no `?page=1`)
- Page ≥2 canonical to itself
- `rel="prev/next"` optional but recommended

**Current Implementation**:

#### Shop Index Page (`/shop`)
```typescript
// app/shop/page.tsx
export async function generateMetadata() {
  return pageMeta({
    title: '所有商店｜Dealy.TW 優惠折扣平台',
    path: '/shop', // ✅ Always uses base path (no ?page=1)
  });
}

export default async function ShopIndex({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  const { page } = await searchParams;
  const pageNum = Number(page || 1);
  // ...
}
```

**Issues Found**:
1. ✅ **GOOD**: Metadata always uses `/shop` (page 1 canonical to base)
2. ❌ **MISSING**: Page 2+ canonical should point to itself with `?page=2`
3. ❌ **MISSING**: No `rel="prev/next"` links in pagination

**Category Page** (`/category/[categorySlug]`)
- Similar issue: Metadata likely doesn't account for pagination

**Action Needed**:

```typescript
// app/shop/page.tsx - Update generateMetadata
export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  const { page } = await searchParams;
  const pageNum = Number(page || 1);
  
  // Page 1: canonical to base
  // Page 2+: canonical to itself with page parameter
  const canonicalPath = pageNum > 1 ? `/shop?page=${pageNum}` : '/shop';
  
  return pageMeta({
    title: '所有商店｜Dealy.TW 優惠折扣平台',
    description: '瀏覽所有合作商店，尋找最優惠的折扣和促銷活動。',
    path: canonicalPath,
  });
}
```

**Add rel="prev/next" Links**:
```typescript
// In page component or metadata
<link rel="prev" href={pageNum > 1 ? `/shop?page=${pageNum - 1}` : undefined} />
<link rel="next" href={pageNum < totalPages ? `/shop?page=${pageNum + 1}` : undefined} />
```

---

## 📋 Summary Checklist

### ✅ Implemented
- [x] Canonical URLs on all pages
- [x] Parameterized pages use `noindex: true` (search)
- [x] One primary page per entity (merchant, coupon, special offer)
- [x] Page 1 canonical to base (no `?page=1`)

### ⚠️ Needs Implementation
- [ ] URL normalization middleware (trailing slash, lowercase)
- [ ] 301 redirects for URL variants
- [ ] Page 2+ canonical to itself with `?page=X`
- [ ] `rel="prev/next"` links for pagination

### 🔧 Recommended Actions

1. **Create `middleware.ts`** for URL normalization:
   - Remove trailing slashes (except root)
   - Force lowercase paths
   - 301 redirect variants

2. **Update pagination metadata**:
   - Page 1: canonical to base
   - Page 2+: canonical to itself with `?page=X`

3. **Add rel="prev/next"** to paginated pages:
   - Optional but recommended for SEO
   - Helps search engines understand pagination structure

4. **Verify no duplicate content**:
   - Check CMS enforces unique slugs
   - Ensure no duplicate merchant pages
   - Verify canonical URLs are correct

---

## 📝 Notes

- Next.js default behavior: No trailing slashes (routes defined without `/`)
- Search results are correctly marked as `noindex` (parameterized)
- Pagination exists on `/shop` and `/category/[categorySlug]` pages
- Need to handle pagination canonical URLs properly

