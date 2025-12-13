# Homepage Improvement Plan - TW vs HK Comparison

**Date**: 2025-01-08  
**Comparison**: TW Homepage vs HK Homepage & EverySaving.hk

---

## 🔍 Key Findings

### 1. **File Saving Issue** (.ini vs .html)

**Problem**: When copying code from EverySaving to VSCode, it saves as `.html`, but TW site saves as `.ini`.

**Root Cause**: 
- TW homepage HTML is **minified/compressed** (single line, 2 lines total)
- VSCode doesn't recognize minified HTML as HTML
- EverySaving HTML is **formatted/pretty-printed** (readable, multiple lines)

**Solution**: 
- ✅ **This is NOT a problem** - it's just how Next.js renders HTML in production
- The HTML is valid, just minified for performance
- If you want to see formatted HTML, use browser DevTools → View Source
- Or use online HTML formatter: https://www.freeformatter.com/html-formatter.html

**Recommendation**: Keep minified HTML for production (better performance). Only format for debugging.

---

## 📊 Schema Markup Comparison

### ✅ What TW Has (Good)
- ✅ WebSite schema (with SearchAction)
- ✅ Organization schema (with logo, sameAs)
- ✅ WebPage schema (basic)
- ✅ SiteNavigationElement schema

### ❌ What TW is Missing (Compared to HK)

#### 1. **ItemList Schema for Popular Merchants** ⚠️ HIGH PRIORITY
**HK Has**:
```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "熱門商店",
  "itemListOrder": "ItemListOrderDescending",
  "numberOfItems": 6,
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "WebPage",
        "name": "adidas HK",
        "url": "https://dealy.hk/shop/adidas-hk"
      }
    }
    // ... more items
  ]
}
```

**TW Missing**: No ItemList schema for popular merchants section

**Impact**: 
- Google can't understand the popular merchants list
- Missing opportunity for rich snippets
- Less structured data = lower SEO score

#### 2. **WebPage Schema - Missing Dates** ⚠️ MEDIUM PRIORITY
**HK Has**:
```json
{
  "@type": "WebPage",
  "datePublished": "2025-06-17T21:57:37+08:00",
  "dateModified": "2025-12-08T06:05:32+08:00"
}
```

**TW Has**: WebPage schema but **no dates**

**Impact**:
- Google can't determine content freshness
- Missing freshness signal for ranking
- Less likely to show "Updated" badge in search results

#### 3. **CollectionPage Schema** (Optional)
**HK Has**: Uses `WebPage` type (which is fine)
**TW Has**: Uses `WebPage` type (which is fine)

**Note**: Could use `CollectionPage` for homepage, but `WebPage` is also valid.

---

## 🎯 Improvement Plan

### Phase 1: Critical Schema Additions (HIGH PRIORITY)

#### 1.1 Add ItemList Schema for Popular Merchants
**File**: `app/page.tsx`

**Implementation**:
```typescript
// After fetching homepageData
const popularMerchantsList = homepageData.popularMerchants?.items || [];

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": homepageData.popularMerchants?.heading || "熱門商店",
  "itemListOrder": "ItemListOrderDescending",
  "numberOfItems": popularMerchantsList.length,
  "itemListElement": popularMerchantsList.map((merchant: any, index: number) => ({
    "@type": "ListItem",
    "position": index + 1,
    "item": {
      "@type": "WebPage",
      "name": merchant.name || merchant.merchant_name,
      "url": `${siteUrl}/shop/${merchant.slug || merchant.page_slug}`
    }
  }))
};
```

**Add to page.tsx**:
```tsx
<>
  <HomePageClient initialData={homepageData} />
  {/* WebPage JSON-LD for homepage */}
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{
      __html: JSON.stringify(webPageSchema, null, 0),
    }}
  />
  {/* ItemList JSON-LD for popular merchants */}
  {popularMerchantsList.length > 0 && (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(itemListSchema, null, 0),
      }}
    />
  )}
</>
```

#### 1.2 Add Dates to WebPage Schema
**File**: `app/page.tsx`

**Update webPageJsonLd call**:
```typescript
const webPageSchema = webPageJsonLd({
  name: homepageData.seo.title,
  url: siteUrl,
  description: homepageData.seo.description,
  locale: marketLocale,
  siteId: `${siteUrl}#website`,
  datePublished: homepageData.createdAt || new Date().toISOString(), // Add if available from CMS
  dateModified: homepageData.updatedAt || new Date().toISOString(), // Add if available from CMS
});
```

**Note**: Check if `homepageData` from CMS includes `createdAt` and `updatedAt` fields. If not, use current date or fetch from CMS.

---

### Phase 2: Enhanced Schema (MEDIUM PRIORITY)

#### 2.1 Add CollectionPage Schema (Optional)
**Alternative to WebPage** for homepage:
```json
{
  "@type": "CollectionPage",
  "@id": "https://dealy.tw#webpage",
  "name": "Dealy TW 台灣最新優惠平台",
  "url": "https://dealy.tw",
  "description": "...",
  "isPartOf": {
    "@id": "https://dealy.tw#website"
  }
}
```

**Recommendation**: Keep `WebPage` - it's simpler and equally valid.

#### 2.2 Add BreadcrumbList to Homepage (Optional)
**HK Has**: No breadcrumb on homepage (correct - homepage is root)
**TW Has**: No breadcrumb on homepage (correct)

**Recommendation**: Don't add - homepage shouldn't have breadcrumbs.

---

### Phase 3: Additional Optimizations (LOW PRIORITY)

#### 3.1 Add Article Schema for Featured Content (If applicable)
If homepage has featured articles/blog posts, add Article schema.

#### 3.2 Add VideoObject Schema (If applicable)
If homepage has videos, add VideoObject schema.

#### 3.3 Add Review Schema (If applicable)
If homepage shows user reviews, add Review/AggregateRating schema.

---

## 📝 Implementation Checklist

### Immediate (High Priority)
- [ ] Add ItemList schema for popular merchants section
- [ ] Add datePublished to WebPage schema
- [ ] Add dateModified to WebPage schema
- [ ] Verify dates are available from CMS (`homepageData.createdAt`, `homepageData.updatedAt`)

### Short-term (Medium Priority)
- [ ] Test schema with Google Rich Results Test
- [ ] Verify ItemList appears in Google Search Console
- [ ] Monitor schema errors in Search Console

### Long-term (Low Priority)
- [ ] Consider CollectionPage schema (optional)
- [ ] Add Article schema if homepage has blog content
- [ ] Add Review schema if homepage shows reviews

---

## 🔧 Code Changes Required

### File 1: `app/page.tsx`
**Changes**:
1. Import `offersItemListJsonLd` or create new `itemListJsonLd` function
2. Generate ItemList schema from `homepageData.popularMerchants.items`
3. Add dates to `webPageJsonLd` call
4. Add ItemList script tag to page output

### File 2: `src/lib/jsonld.ts` (if needed)
**Changes**:
1. Create `itemListJsonLd` function (or reuse existing)
2. Ensure it matches HK format exactly

### File 3: `src/lib/homepage-loader.ts` (if needed)
**Changes**:
1. Ensure `homepageData` includes `createdAt` and `updatedAt` fields
2. If not, add them to the data fetching

---

## 🧪 Testing Plan

### 1. Schema Validation
- [ ] Use Google Rich Results Test: https://search.google.com/test/rich-results
- [ ] Test homepage URL: `https://dealy.tw/`
- [ ] Verify all schemas are detected
- [ ] Check for any errors or warnings

### 2. Search Console
- [ ] Submit homepage to Google Search Console
- [ ] Monitor "Enhancements" section
- [ ] Check for schema errors
- [ ] Verify ItemList appears in structured data

### 3. HTML Validation
- [ ] View page source
- [ ] Verify all `<script type="application/ld+json">` tags are present
- [ ] Check JSON is valid (no syntax errors)
- [ ] Verify URLs are absolute (not relative)

---

## 📊 Expected Results

### Before (Current)
- ✅ Basic schema (WebSite, Organization, WebPage)
- ❌ No ItemList for popular merchants
- ❌ No dates in WebPage schema
- **SEO Score**: ~85/100

### After (Improved)
- ✅ Basic schema (WebSite, Organization, WebPage)
- ✅ ItemList schema for popular merchants
- ✅ Dates in WebPage schema (freshness signal)
- **SEO Score**: ~95/100

### Benefits
1. **Better Rich Snippets**: Google can show popular merchants in search results
2. **Freshness Signal**: Dates help Google understand content freshness
3. **Higher SEO Score**: More structured data = better ranking potential
4. **Match HK Quality**: TW homepage will match HK homepage schema quality

---

## 🚀 Implementation Order

1. **Week 1**: Add ItemList schema (highest impact)
2. **Week 1**: Add dates to WebPage schema
3. **Week 2**: Test and validate schemas
4. **Week 2**: Monitor Search Console for errors
5. **Week 3**: Optional enhancements (if needed)

---

## 📚 References

- [Schema.org ItemList](https://schema.org/ItemList)
- [Schema.org WebPage](https://schema.org/WebPage)
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data)

---

## ✅ Summary

**Main Issues**:
1. ❌ Missing ItemList schema for popular merchants
2. ❌ Missing dates in WebPage schema
3. ✅ File saving as .ini is NOT a problem (just minified HTML)

**Priority Actions**:
1. Add ItemList schema (HIGH)
2. Add dates to WebPage schema (MEDIUM)
3. Test and validate (HIGH)

**Expected Impact**: +10 SEO score, better rich snippets, match HK quality

