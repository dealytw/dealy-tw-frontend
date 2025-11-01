# Multi-Domain SEO Implementation Plan
## dealy.hk (HK) ↔ dealy.tw (TW)

### Overview
Two separate domains serving the same company's content but for different regions:
- **dealy.hk** - Hong Kong market (zh-HK)
- **dealy.tw** - Taiwan market (zh-TW)

---

## SEO Requirements Checklist

### 1. **Hreflang Tags** ⚠️ CRITICAL
**Purpose**: Tell search engines about alternate language/region versions of each page

**Implementation**:
- Add `<link rel="alternate" hreflang="zh-HK" href="...">` on dealy.tw pages
- Add `<link rel="alternate" hreflang="zh-TW" href="...">` on dealy.hk pages  
- Add `<link rel="alternate" hreflang="x-default" href="...">` for default/fallback

**Where**: In `<head>` of every page (layout.tsx + individual page metadata)

**Example for `/shop/agoda`**:
```html
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/shop/agoda" />
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/shop/agoda" />
<link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/agoda" />
```

---

### 2. **HTML Lang Attribute** ✅ PARTIALLY DONE
**Current**: `lang="zh-HK"` in layout.tsx (WRONG for TW site)
**Fix**: Dynamic based on domain/market:
- dealy.tw → `lang="zh-TW"`
- dealy.hk → `lang="zh-HK"`

---

### 3. **Schema Markup - inLanguage** ⚠️ NEEDS UPDATE
**Current**: Hardcoded to `zh-TW` in `websiteJsonLd()`
**Fix**: Make dynamic based on domain:
- `inLanguage: "zh-TW"` for dealy.tw
- `inLanguage: "zh-HK"` for dealy.hk

**Files to update**:
- `src/lib/jsonld.ts` - websiteJsonLd, organizationJsonLd, webPageJsonLd
- All page-level schema (shop/[id], special-offers/[id], blog/[slug])

---

### 4. **Canonical URLs** ✅ ALREADY IMPLEMENTED
**Current**: Using canonical URLs correctly
**Enhancement**: Ensure canonical points to the correct domain (no cross-domain canonicals)

---

### 5. **Sitemap - Hreflang Annotations** ⚠️ NEEDED
**Current**: Sitemaps don't include hreflang
**Fix**: Add `<xhtml:link>` tags in sitemaps pointing to alternate versions

**Example**:
```xml
<url>
  <loc>https://dealy.tw/shop/agoda</loc>
  <xhtml:link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/shop/agoda"/>
  <xhtml:link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/shop/agoda"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/agoda"/>
</url>
```

---

### 6. **Language Switcher Component** 📋 NEW FEATURE
**Requirements**:
- Dropdown selector (like EverySaving)
- Options: 中文 (HK), 中文 (TW)
- On click: Redirect to equivalent page on other domain
- Store preference in localStorage

**SEO Considerations**:
- Use proper `<a>` tags with `hreflang` attributes
- Ensure robots can crawl the links
- Use JavaScript redirect only if necessary (prefer direct links)

---

### 7. **Page Mapping Logic** 📋 NEEDED
**Critical**: Need to ensure equivalent pages exist on both domains

**Mapping Examples**:
- `/shop/agoda` (TW) ↔ `/shop/agoda` (HK) - Same slug
- `/special-offers/1111-deals` (TW) ↔ `/special-offers/1111-deals` (HK)
- `/blog/some-post` (TW) ↔ `/blog/some-post` (HK)

**Considerations**:
- What if page doesn't exist on other domain? (show 404 or hide switcher option?)
- What if slug is different? (need CMS mapping field?)

---

## Implementation Priority

### Phase 1: Critical SEO (Must Do First)
1. ✅ Fix HTML `lang` attribute (currently wrong on TW site)
2. ✅ Add hreflang tags to all pages
3. ✅ Update schema `inLanguage` to match region
4. ✅ Update sitemaps with hreflang annotations

### Phase 2: Language Switcher UI
5. Create language switcher component
6. Add to header/footer
7. Implement cross-domain navigation logic

### Phase 3: Enhanced SEO
8. Add `sameAs` links in Organization schema (point to other domain)
9. Consider geo-targeting in Google Search Console
10. Add structured data for language variants

---

## Code Changes Required

### 1. Create Domain Detection Helper
```typescript
// src/lib/domain-config.ts
export const DOMAIN_CONFIG = {
  'dealy.tw': {
    market: 'tw',
    locale: 'zh-TW',
    name: 'Dealy TW',
    alternateDomain: 'dealy.hk',
    alternateLocale: 'zh-HK',
  },
  'dealy.hk': {
    market: 'hk',
    locale: 'zh-HK',
    name: 'Dealy HK',
    alternateDomain: 'dealy.tw',
    alternateLocale: 'zh-TW',
  },
} as const;

export function getCurrentDomainConfig() {
  if (typeof window !== 'undefined') {
    return DOMAIN_CONFIG[window.location.hostname as keyof typeof DOMAIN_CONFIG] || DOMAIN_CONFIG['dealy.tw'];
  }
  // Server-side: use env var or request headers
  const domain = process.env.NEXT_PUBLIC_SITE_URL?.includes('dealy.hk') ? 'dealy.hk' : 'dealy.tw';
  return DOMAIN_CONFIG[domain];
}
```

### 2. Update Layout.tsx
- Make `lang` attribute dynamic
- Add hreflang meta tags to head

### 3. Update JSON-LD Functions
- Make `inLanguage` dynamic
- Add `sameAs` to Organization schema

### 4. Update Page Metadata
- Add hreflang to pageMeta() function
- Pass alternate URLs to metadata

### 5. Update Sitemap Routes
- Add xhtml:link tags for hreflang

### 6. Create Language Switcher Component
- Client component with dropdown
- Cross-domain navigation
- localStorage preference

---

## Potential Issues & Solutions

### Issue 1: Page doesn't exist on other domain
**Solution**: Check if page exists before showing switcher option, or always show but handle 404 gracefully

### Issue 2: Different slugs for same content
**Solution**: Add `alternate_slug` or `cross_domain_slug` field in CMS, or use mapping table

### Issue 3: Merchant/coupon not available in both markets
**Solution**: Filter switcher to only show if equivalent page exists

### Issue 4: SEO impact of cross-domain redirects
**Solution**: Use direct links (not redirects) in language switcher for better SEO

---

## Testing Checklist

- [ ] Verify hreflang tags in HTML source
- [ ] Test language switcher on both domains
- [ ] Verify schema inLanguage is correct
- [ ] Check sitemap has hreflang annotations
- [ ] Test Google Search Console for hreflang validation
- [ ] Verify no broken cross-domain links
- [ ] Check canonical URLs are correct
- [ ] Test mobile language switcher UI

---

## Resources
- [Google hreflang guide](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [Schema.org inLanguage](https://schema.org/inLanguage)
- [Sitemap hreflang](https://developers.google.com/search/docs/specialty/international/localized-versions#sitemap)

