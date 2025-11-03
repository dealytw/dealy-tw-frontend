# Metadata & Structured Data SEO Verification

## ✅ 1. generateMetadata() per Route

### Status: ✅ IMPLEMENTED

**Requirements**:
- Title (<60 chars)
- Description (~150 chars)
- Canonical
- OG/Twitter

**Current Implementation**:

#### ✅ Homepage (`/`)
- Location: `app/page.tsx`
- Uses `pageMeta()` function
- ✅ Title, description, canonical, OG/Twitter

#### ✅ Shop Index (`/shop`)
- Location: `app/shop/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Uses `pageMeta()` with title, description, canonical

#### ✅ Merchant Pages (`/shop/[id]`)
- Location: `app/shop/[id]/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Auto-generates title/description from coupons if CMS doesn't have overrides
- ✅ Supports CMS override (`merchant.seo_title`, `merchant.seo_description`)
- ✅ Canonical with override support (`merchant.canonical_url`)
- ✅ OG image support (`merchant.ogImage?.url`)
- ✅ OG/Twitter metadata

#### ✅ Special Offers Index (`/special-offers`)
- Location: `app/special-offers/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Uses `pageMeta()`

#### ✅ Special Offer Pages (`/special-offers/[id]`)
- Location: `app/special-offers/[id]/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Uses CMS `seo_title` and `seo_description`
- ✅ Uses `pageMeta()`

#### ✅ Category Pages (`/category/[categorySlug]`)
- Location: `app/category/[categorySlug]/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Uses CMS SEO fields

#### ✅ Blog Posts (`/blog/[slug]`)
- Location: `app/blog/[slug]/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Uses CMS SEO fields

#### ✅ Legal Pages (`/[slug]`)
- Location: `app/[slug]/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Uses CMS SEO fields

#### ✅ Search Page (`/search`)
- Location: `app/search/page.tsx`
- ✅ `generateMetadata()` implemented
- ✅ Uses `noindex: true` for parameterized results

**Issues to Check**:
- [ ] Verify title lengths are <60 chars (check generated titles)
- [ ] Verify description lengths are ~150 chars (check generated descriptions)

---

## ✅ 2. Structured Data (JSON-LD)

### Status: ✅ MOSTLY IMPLEMENTED

#### ✅ Sitewide: Organization + WebSite

**Location**: `app/layout.tsx`

**Implementation**:
```typescript
// WebSite with sitelinks search box
websiteJsonLd({ 
  siteName: domainConfig.name, 
  siteUrl: siteUrl, 
  searchUrl: `${siteUrl}/search`, // ✅ Sitelinks search box
  locale: marketLocale
})

// Organization
organizationJsonLd({ 
  name: domainConfig.name, 
  url: siteUrl, 
  logo: `${siteUrl}/favicon.svg`,
  sameAs: [alternateUrl] // ✅ Links to other domain
})
```

**Status**: ✅ FULLY IMPLEMENTED
- ✅ WebSite with `potentialAction` (SearchAction) for sitelinks search box
- ✅ Organization with logo and sameAs

---

#### ✅ Breadcrumbs: BreadcrumbList

**Location**: `app/shop/[id]/page.tsx`

**Implementation**:
```typescript
const breadcrumb = breadcrumbJsonLd([
  { name: '首頁', url: `${siteUrl}/` },
  { name: '商家', url: `${siteUrl}/shop` },
  { name: merchant.name, url: merchantUrl },
]);
```

**Status**: ✅ IMPLEMENTED
- ✅ BreadcrumbList on merchant pages
- ✅ Proper hierarchy: Home → Shop → Merchant

**Missing**:
- [ ] Breadcrumbs on special offer pages
- [ ] Breadcrumbs on category pages
- [ ] Breadcrumbs on blog posts

---

#### ✅ Merchant Hub: Organization (merchant) or Brand

**Location**: `app/shop/[id]/page.tsx`

**Implementation**:
```typescript
const merchantOrg = organizationJsonLd({
  name: merchant.name,
  url: merchantUrl,
  logo: merchant.logo || undefined,
  sameAs: (merchant.useful_links || []).map((l: any) => l?.url).filter(Boolean),
});
```

**Status**: ✅ IMPLEMENTED
- ✅ Uses Organization type (not Brand)
- ✅ Includes name, url, logo
- ✅ Includes sameAs (useful links)

**Note**: Currently uses `Organization`, not `Brand`. Consider using `Brand` if merchants are brands:
```typescript
{
  '@type': 'Brand',
  name: merchant.name,
  url: merchantUrl,
  logo: merchant.logo,
}
```

---

#### ⚠️ Coupon/Deal: Offer

**Location**: `app/shop/[id]/page.tsx` - `offersItemListJsonLd()`

**Current Implementation**:
```typescript
// src/lib/jsonld.ts
export function offersItemListJsonLd(coupons: Array<{...}>) {
  const items = coupons.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'Offer',
      name: c.value || c.title || '優惠',
      description: (c.title || '').slice(0, 160),
      availability: c.status === 'expired' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      validThrough: toTaipeiIso(c.expires_at), // ✅ Has validThrough
      url: c.url,
      sku: c.code || undefined,
      priceCurrency: undefined, // ❌ MISSING
    },
  }));
}
```

**Requirements**:
- ✅ `validThrough` - IMPLEMENTED
- ❌ `priceCurrency` - MISSING (set to `undefined`)
- ❌ `price` - MISSING (not included)
- ❌ `seller` - MISSING (merchant information)

**Action Needed**:
```typescript
item: {
  '@type': 'Offer',
  name: c.value || c.title || '優惠',
  description: (c.title || '').slice(0, 160),
  availability: c.status === 'expired' ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
  validThrough: toTaipeiIso(c.expires_at),
  url: c.url,
  sku: c.code || undefined,
  priceCurrency: 'TWD', // ✅ Add currency (or 'HKD' for HK)
  price: '0', // ✅ Add price (0 for free coupons, or parse from value)
  seller: { // ✅ Add seller
    '@type': 'Organization',
    name: merchant.name,
    url: merchantUrl,
  },
}
```

---

#### ❌ Ratings: AggregateRating

**Status**: ❌ NOT IMPLEMENTED

**Requirements**:
- Only if real ratings exist
- Should include `ratingValue`, `reviewCount`, `bestRating`, `worstRating`

**Current**: No rating/review system found in codebase

**Action Needed**:
- If ratings are available in CMS, add AggregateRating JSON-LD
- Example structure:
```typescript
{
  '@type': 'AggregateRating',
  ratingValue: '4.5',
  reviewCount: '100',
  bestRating: '5',
  worstRating: '1'
}
```

---

#### ⚠️ Open Graph: Dynamic OG Images

**Status**: ⚠️ PARTIALLY IMPLEMENTED

**Current Implementation**:
- ✅ `pageMeta()` function supports `ogImageUrl` parameter
- ✅ Merchant pages use `merchant.ogImage?.url` if available
- ❌ **Not using `@vercel/og` for dynamic image generation**
- ❌ Static OG images in layout (hardcoded)

**Requirements**:
- Dynamic OG images per page (e.g., `@vercel/og`)
- Include merchant, discount, expiry in image

**Current OG Images**:
- Layout: `"https://lovable.dev/opengraph-image-p98pqg.png"` (static, hardcoded)
- Merchant pages: Uses `merchant.ogImage?.url` from CMS (if available)

**Action Needed**:
1. Install `@vercel/og`: `npm install @vercel/og`
2. Create `app/opengraph-image.tsx` for dynamic OG image generation
3. Or create route handler `app/shop/[id]/opengraph-image/route.tsx`
4. Include merchant name, discount value, expiry date in image

**Example**:
```typescript
// app/shop/[id]/opengraph-image/route.tsx
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  // Fetch merchant data
  const merchant = await getMerchant(params.id);
  
  return new ImageResponse(
    (
      <div style={{ display: 'flex', ... }}>
        <h1>{merchant.name}</h1>
        <p>Discount: {merchant.topCoupon?.value}</p>
        <p>Expires: {merchant.topCoupon?.expires_at}</p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 📋 Summary Checklist

### ✅ Implemented
- [x] `generateMetadata()` on all routes
- [x] Title, description, canonical, OG/Twitter on all pages
- [x] Sitewide Organization + WebSite JSON-LD
- [x] WebSite includes sitelinks search box
- [x] BreadcrumbList on merchant pages
- [x] Organization (merchant) on merchant pages
- [x] Offer structured data (ItemList with Offers)
- [x] Offer includes `validThrough`

### ⚠️ Needs Improvement
- [ ] Verify title lengths <60 chars
- [ ] Verify description lengths ~150 chars
- [ ] Add `priceCurrency` to Offer schema
- [ ] Add `price` to Offer schema
- [ ] Add `seller` to Offer schema
- [ ] Breadcrumbs on special offer pages
- [ ] Breadcrumbs on category pages
- [ ] Breadcrumbs on blog posts
- [ ] Dynamic OG images with `@vercel/og`

### ❌ Missing
- [ ] AggregateRating (if ratings exist)
- [ ] Dynamic OG image generation per page

---

## 🔧 Recommended Actions

### Priority 1: Fix Offer Schema
Add missing fields to `offersItemListJsonLd()`:
- `priceCurrency`: 'TWD' or 'HKD' (based on market)
- `price`: Parse from coupon value or set to '0' for free
- `seller`: Merchant Organization object

### Priority 2: Add Breadcrumbs
Add BreadcrumbList to:
- Special offer pages
- Category pages
- Blog posts

### Priority 3: Dynamic OG Images
Implement `@vercel/og` for:
- Merchant pages (with merchant name, discount, expiry)
- Special offer pages
- Blog posts

### Priority 4: Title/Description Length Validation
Add validation to ensure:
- Titles are <60 chars
- Descriptions are ~150 chars

---

## 📝 Notes

- Most structured data is well-implemented
- Merchant pages have comprehensive JSON-LD
- Offer schema needs priceCurrency, price, and seller fields
- OG images are static; consider dynamic generation for better social sharing
- No rating system currently, so AggregateRating is not needed yet

