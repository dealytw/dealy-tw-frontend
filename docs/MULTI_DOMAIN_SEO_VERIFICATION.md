# Multi-Domain SEO Verification Checklist
## dealy.hk (HK) ↔ dealy.tw (TW)

### ✅ 1. Hreflang Tags Implementation

**Status**: ✅ IMPLEMENTED

**Location**: 
- `src/seo/meta.ts` - `getHreflangLinks()` function
- `app/layout.tsx` - Root layout hreflang for homepage
- Individual pages use `pageMeta()` which includes hreflang

**Implementation Details**:
- ✅ Main pages (/, /shop, /special-offers, /blog) get both `zh-HK` and `zh-TW` hreflang tags
- ✅ Specific pages (merchant pages, coupon pages) get self + `x-default` only (since pages differ)
- ✅ Uses absolute URLs: `https://dealy.hk/...` and `https://dealy.tw/...`
- ✅ `x-default` is included for all pages

**Example Output** (for homepage):
```html
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/" />
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/" />
<link rel="alternate" hreflang="x-default" href="https://dealy.tw/" />
```

**Example Output** (for `/shop/agoda`):
```html
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/shop/agoda" />
<link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/agoda" />
```

**Verification Needed**:
- [ ] Verify in browser dev tools that hreflang tags appear in `<head>` on all pages
- [ ] Check that `x-default` points to TW domain (correct default)
- [ ] Ensure all pages call `pageMeta()` with correct `path` parameter

---

### ✅ 2. HTML Lang Attribute

**Status**: ✅ IMPLEMENTED

**Location**: `app/layout.tsx` line 55

**Implementation**:
- ✅ Dynamic based on market locale from CMS
- ✅ Uses `localeToHtmlLang()` to convert CMS locale to HTML lang
- ✅ `zh-Hant-HK` → `zh-HK`
- ✅ `zh-Hant-TW` → `zh-TW`

**Code**:
```tsx
const marketLocale = await getMarketLocale(marketKey);
const htmlLang = localeToHtmlLang(marketLocale);
// ...
<html lang={htmlLang}>
```

**Verification Needed**:
- [ ] Verify `dealy.tw` shows `<html lang="zh-TW">`
- [ ] Verify `dealy.hk` shows `<html lang="zh-HK">`

---

### ✅ 3. Canonical Tags

**Status**: ✅ IMPLEMENTED

**Location**: `src/seo/meta.ts` - `canonical()` and `pageMeta()` functions

**Implementation**:
- ✅ Self-canonical (each domain points to itself)
- ✅ Uses `NEXT_PUBLIC_SITE_URL` or domain config
- ✅ No cross-domain canonicals

**Code**:
```typescript
export function canonical(pathOrAbs?: string) {
  if (!pathOrAbs) return undefined;
  if (pathOrAbs.startsWith('http')) return pathOrAbs;
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  return `${base}${pathOrAbs.startsWith('/') ? pathOrAbs : `/${pathOrAbs}`}`;
}
```

**Verification Needed**:
- [ ] Verify canonical URLs are self-referential (no cross-domain)
- [ ] Check that all pages have canonical tags in metadata

---

### ✅ 4. Schema Markup - inLanguage

**Status**: ✅ IMPLEMENTED

**Location**: 
- `src/lib/jsonld.ts` - `websiteJsonLd()` function
- `app/layout.tsx` - Root layout uses locale from CMS

**Implementation**:
- ✅ `websiteJsonLd()` accepts `locale` parameter
- ✅ Converts `zh-Hant-HK` → `zh-HK` and `zh-Hant-TW` → `zh-TW`
- ✅ Root layout passes `marketLocale` from CMS

**Code**:
```typescript
websiteJsonLd({ 
  siteName: domainConfig.name, 
  siteUrl: siteUrl, 
  searchUrl: `${siteUrl}/search`,
  locale: marketLocale  // ✅ Passed from CMS
})
```

**Verification Needed**:
- [ ] Verify JSON-LD shows `"inLanguage": "zh-TW"` on dealy.tw
- [ ] Verify JSON-LD shows `"inLanguage": "zh-HK"` on dealy.hk
- [ ] Check page-level schema (merchant pages, special offers) also use correct locale

---

### ✅ 5. Language/Locale Switcher

**Status**: ✅ IMPLEMENTED

**Location**: `src/components/LanguageSwitcher.tsx`

**Implementation**:
- ✅ Client component in footer
- ✅ Shows "繁體中文(台灣)" and "繁體中文(香港)"
- ✅ Links to appropriate domains
- ✅ No auto-redirect (user opt-in only)

**Verification Needed**:
- [ ] Verify switcher appears in footer
- [ ] Test that clicking switches to correct domain
- [ ] Ensure no IP-based auto-redirects for bots

---

### ⚠️ 6. Issues to Verify

1. **x-default should point to TW domain**
   - Current: `x-default` points to current domain (should be TW)
   - Fix needed: Hardcode `x-default` to always point to `https://dealy.tw/...`

2. **Individual pages hreflang**
   - Current: Pages use `pageMeta()` which should include hreflang
   - Verify: Check that merchant pages and special offer pages actually render hreflang tags

3. **Page-level JSON-LD locale**
   - Need to verify that merchant pages and special offer pages pass locale to `webPageJsonLd()`

---

### 📋 Testing Checklist

- [ ] **Homepage (`/`)**
  - [ ] Has hreflang: `zh-TW`, `zh-HK`, `x-default`
  - [ ] HTML lang attribute correct
  - [ ] Canonical self-referential
  - [ ] Schema inLanguage correct

- [ ] **Shop Index (`/shop`)**
  - [ ] Has hreflang: `zh-TW`, `zh-HK`, `x-default`
  - [ ] Canonical self-referential

- [ ] **Merchant Page (`/shop/[id]`)**
  - [ ] Has hreflang: `zh-TW`, `x-default` (no HK since pages differ)
  - [ ] Canonical self-referential
  - [ ] Schema inLanguage correct

- [ ] **Special Offers (`/special-offers/[id]`)**
  - [ ] Has hreflang: `zh-TW`, `x-default`
  - [ ] Canonical self-referential
  - [ ] Schema inLanguage correct

- [ ] **Language Switcher**
  - [ ] Visible in footer
  - [ ] Works correctly
  - [ ] No auto-redirect

---

### 🔧 Recommended Fixes

1. **Fix x-default to always point to TW**:
   ```typescript
   // In src/seo/meta.ts getHreflangLinks()
   { hreflang: 'x-default', href: `https://dealy.tw${currentPath}` }
   ```

2. **Verify all pages use pageMeta()**:
   - Check that all page `generateMetadata()` functions call `pageMeta()` with correct path

3. **Add locale to page-level JSON-LD**:
   - Ensure merchant pages and special offer pages pass locale to `webPageJsonLd()`

---

### 📝 Notes

- Pages are different between HK and TW (different merchants/coupons), so hreflang only links main pages
- For specific pages, only self + x-default are included (no alternate domain)
- This is correct behavior as per the plan

