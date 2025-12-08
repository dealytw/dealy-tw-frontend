# Rendered HTML Audit - adidas.com.tw Page

**Date**: 2025-01-08  
**Page**: `/shop/adidas.com.tw`

## ✅ VERIFIED (Present in HTML)

### 1. Basic Meta Tags
- ✅ `<meta name="viewport" content="width=device-width, initial-scale=1"/>` - Present
- ✅ `<title>` - Present and correct
- ✅ `<meta name="description">` - Present
- ✅ `<meta name="robots">` - Present with detailed directives
- ✅ `<meta name="googlebot">` - Present with max-snippet, max-image-preview, max-video-preview
- ✅ `<link rel="canonical">` - Present

### 2. Hreflang Tags
- ✅ `<link rel="alternate" hrefLang="zh-TW" href="https://dealy.tw/shop/adidas.com.tw"/>` - Present
- ✅ `<link rel="alternate" hrefLang="zh-HK" href="https://dealy.hk/shop/adidas-hk"/>` - Present

### 3. Open Graph Tags (Partial)
- ✅ `<meta property="og:title">` - Present
- ✅ `<meta property="og:description">` - Present
- ✅ `<meta property="og:url">` - Present
- ✅ `<meta property="og:site_name">` - Present
- ✅ `<meta property="og:locale">` - Present
- ✅ `<meta property="og:type">` - Present (article)
- ✅ `<meta property="article:modified_time">` - Present
- ✅ `<meta property="article:section">` - Present (時裝)
- ❌ **MISSING**: `<meta property="og:image">`
- ❌ **MISSING**: `<meta property="og:image:secure_url">`
- ❌ **MISSING**: `<meta property="og:image:alt">`

### 4. Twitter Cards (Partial)
- ✅ `<meta name="twitter:card">` - Present (summary_large_image)
- ✅ `<meta name="twitter:title">` - Present
- ✅ `<meta name="twitter:description">` - Present
- ❌ **MISSING**: `<meta name="twitter:image">`

### 5. Favicon
- ✅ All favicon links present (ICO, PNG sizes, SVG, Apple touch icon)

### 6. Structured Data (JSON-LD)
- ✅ WebSite schema - Present
- ✅ Organization schema - Present
- ✅ BreadcrumbList schema - Present
- ✅ Store schema - Present
- ✅ WebPage schema - Present (with datePublished and dateModified)
- ✅ ItemList schema - Present
- ✅ FAQPage schema - Present
- ✅ HowTo schema - Present

### 7. Semantic HTML
- ✅ `<main>` with `itemScope` and `itemType` - Present
- ✅ `<article>` tags for coupons - Present
- ✅ `<section>` tags - Present
- ✅ `<nav>` for breadcrumb - Present
- ✅ `<time>` tag for last updated date - Present

---

## ❌ CRITICAL ISSUES FOUND

### 1. Missing OG Images
**Status**: ❌ **CRITICAL**

**Issue**: 
- Code generates `ogImageUrl` and passes it to `pageMeta()`
- `pageMeta()` creates `ogImages` array with `url`, `secureUrl`, and `alt`
- But **OG image tags are NOT appearing in rendered HTML**

**Expected in HTML**:
```html
<meta property="og:image" content="https://dealy.tw/upload/adidas_177b7eb320.webp" />
<meta property="og:image:secure_url" content="https://dealy.tw/upload/adidas_177b7eb320.webp" />
<meta property="og:image:alt" content="adidas 愛迪達優惠碼" />
```

**Actual in HTML**: ❌ None of these tags are present

**Impact**: **HIGH** - No social sharing preview = lower CTR = slower ranking

**Root Cause**: Next.js Metadata API may not be rendering the `images` array correctly, or the image URL is undefined/null.

---

### 2. Missing Twitter Image
**Status**: ❌ **CRITICAL**

**Issue**:
- Code sets `twitter.images = ogImageUrl ? [ogImageUrl] : undefined`
- But `twitter:image` tag is NOT appearing in rendered HTML

**Expected in HTML**:
```html
<meta name="twitter:image" content="https://dealy.tw/upload/adidas_177b7eb320.webp" />
```

**Actual in HTML**: ❌ Tag is missing

**Impact**: **HIGH** - No Twitter card preview = lower social CTR

---

## 🔍 Root Cause Analysis

### Possible Causes:
1. **`ogImageUrl` is undefined** - The merchant logo/ogImage might not be fetched correctly
2. **Next.js Metadata API issue** - The `images` array format might not be correct
3. **Image URL format issue** - The URL might not be in the expected format

### Code Flow:
1. `app/shop/[id]/page.tsx` line 587-599: Fetches and sets `ogImageUrl`
2. Line 610: Passes `ogImageUrl` to `pageMeta()`
3. `src/seo/meta.ts` line 235-239: Creates `ogImages` array
4. Line 249: Sets `openGraph.images = ogImages`
5. Line 285: Sets `twitter.images = ogImageUrl ? [ogImageUrl] : undefined`

### Next.js Metadata API Format:
According to Next.js docs, `images` should be:
```typescript
images: [
  {
    url: string,
    secureUrl?: string,
    alt?: string,
  }
]
```

This matches what the code is doing, so the issue is likely that `ogImageUrl` is undefined.

---

## 🛠️ Fix Applied

### ✅ Fixed: Removed invalid `secureUrl` property
**Issue**: Next.js Metadata API doesn't support `secureUrl` property in `images` array. This was likely causing Next.js to ignore the entire images array.

**Fix Applied**:
- Removed `secureUrl` from `ogImages` array in `src/seo/meta.ts`
- Next.js automatically generates `og:image:secure_url` for HTTPS URLs

### ✅ Fixed: Added fallback OG image
**Issue**: If merchant logo/ogImage is not available, `ogImageUrl` would be undefined.

**Fix Applied**:
- Added fallback to use favicon if no merchant image is available
- Added logging to debug OG image generation

### Next Steps:
1. **Deploy and test** - Verify OG images now appear in rendered HTML
2. **Test with Facebook Debugger** - Check if OG images render correctly
3. **Verify with multiple merchants** - Ensure fix works for all merchants

---

## 📊 Impact Summary

| Issue | Impact | Priority |
|-------|--------|----------|
| Missing `og:image` | HIGH - No social preview | CRITICAL |
| Missing `twitter:image` | HIGH - No Twitter preview | CRITICAL |
| All other SEO elements | ✅ Working correctly | - |

---

## ✅ What's Working Well

1. **Hreflang tags** - ✅ Correctly rendered
2. **Structured data** - ✅ All schemas present and correct
3. **Semantic HTML** - ✅ Proper use of `<article>`, `<section>`, `<nav>`, `<time>`
4. **Meta tags** - ✅ All basic and advanced meta tags present
5. **Favicon** - ✅ Complete favicon setup
6. **Robots meta** - ✅ Detailed directives present

---

## 🎯 Action Items

1. **URGENT**: Fix OG image rendering - Debug why `ogImageUrl` isn't creating OG image tags
2. **URGENT**: Fix Twitter image rendering - Same issue as OG images
3. Verify with multiple merchants to see if issue is widespread
4. Add fallback OG image for merchants without logos
5. Test OG images with Facebook Debugger after fix

---

## 📝 Notes

- The code structure looks correct - the issue is likely that `ogImageUrl` is undefined for this merchant
- Need to check if `merchantLogo` or `merchantOgImage` are being fetched correctly
- The merchant logo URL in the HTML is: `https://dealy.tw/upload/adidas_177b7eb320.webp` - this should be used for OG image

