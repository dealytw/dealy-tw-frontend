# Sitemap Issues Analysis

## Issues Found

### 1. `eppiocemhmnlbhjplcgkofciiegomcon` in XML

**What it is:**
- This is a **Chrome browser extension ID** being injected into the XML
- The extension is modifying the page content before you see it
- **This is NOT in your actual sitemap XML** - it's being added by your browser

**How to verify:**
1. View the sitemap source (right-click → View Page Source)
2. Or use `curl https://dealy.tw/shop-sitemap.xml` from terminal
3. The extension script won't be in the actual XML

**Solution:**
- This is a browser-side issue, not a code issue
- Your sitemap XML is correct
- Users/crawlers will see the clean XML without the extension script

**Common extensions that inject scripts:**
- Ad blockers
- SEO tools
- Privacy extensions
- Developer tools

---

### 2. XML Namespace: `http://www.sitemaps.org/schemas/sitemap/0.9`

**Status:** ✅ **CORRECT**

This is the **official XML namespace** for sitemaps according to the [sitemaps.org protocol](https://www.sitemaps.org/protocol.html).

**Your code:**
```typescript
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
```

**This is correct** - no changes needed.

---

### 3. 72 Merchants in CMS but Only 70 in Sitemap

**Possible Reasons:**

#### A. Unpublished Merchants (Most Likely)
The sitemap only includes **published** merchants:
```typescript
"filters[publishedAt][$notNull]": true, // Only published merchants
```

**Check:**
- Are all 72 merchants published in Strapi?
- Do they have `publishedAt` set?
- Are any in "Draft" status?

#### B. Missing `page_slug`
The sitemap requires `page_slug`:
```typescript
url: `${baseUrl}/shop/${merchant.page_slug || merchant.slug}`
```

**Check:**
- Do all 72 merchants have a `page_slug` field set?
- Are any `page_slug` values empty/null?

#### C. Wrong Market Filter
The sitemap filters by market:
```typescript
"filters[market][key][$eq]": market, // market = 'tw'
```

**Check:**
- Are all 72 merchants assigned to the 'tw' market?
- Are any assigned to a different market (hk, my, sg, etc.)?

#### D. Caching (24-hour cache)
The sitemap is cached for 24 hours:
```typescript
export const revalidate = 86400 // ISR - revalidate every 24 hours
```

**If merchants were recently published:**
- They won't appear until cache expires (24 hours)
- Or until manual revalidation

**How to check:**
1. Check Strapi CMS:
   - Count total merchants with `market = 'tw'`
   - Count published merchants (`publishedAt` not null)
   - Count merchants with `page_slug` set

2. Check sitemap cache:
   - Last revalidation time
   - When was sitemap last generated?

3. Force revalidation:
   - Call `/api/revalidate?secret=YOUR_SECRET` with tag `sitemap:merchants`
   - Or wait 24 hours for automatic revalidation

---

## How to Debug

### Step 1: Check Strapi Data
```sql
-- In Strapi database (if you have access)
SELECT 
  COUNT(*) as total_merchants,
  COUNT(CASE WHEN publishedAt IS NOT NULL THEN 1 END) as published,
  COUNT(CASE WHEN page_slug IS NOT NULL AND page_slug != '' THEN 1 END) as with_slug
FROM merchants
WHERE market_id = (SELECT id FROM sites WHERE key = 'tw');
```

### Step 2: Check Sitemap Generation
Add logging to `app/shop-sitemap.xml/route.ts`:
```typescript
console.log('Total merchants fetched:', merchantsData?.data?.length || 0);
console.log('Merchants with publishedAt:', 
  merchantsData?.data?.filter((m: any) => m.publishedAt).length
);
console.log('Merchants with page_slug:', 
  merchantsData?.data?.filter((m: any) => m.page_slug).length
);
console.log('Final merchantPages count:', merchantPages.length);
```

### Step 3: Force Revalidation
```bash
# Revalidate sitemap manually
curl -X POST "https://dealy.tw/api/revalidate?secret=YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tags": ["sitemap:merchants"]}'
```

---

## Most Likely Cause

**Unpublished merchants** - 2 merchants are likely:
- In "Draft" status (not published)
- Or `publishedAt` is null

**Quick Fix:**
1. Go to Strapi CMS
2. Check all 72 merchants
3. Ensure all have `publishedAt` set
4. Publish any that are in draft

**Then:**
- Wait 24 hours for cache to expire
- Or manually revalidate the sitemap

---

## Recommendations

### 1. Add Debug Logging
Add logging to see what's being filtered:
```typescript
const allMerchants = merchantsData?.data || [];
const publishedMerchants = allMerchants.filter((m: any) => m.publishedAt);
const withSlug = publishedMerchants.filter((m: any) => m.page_slug);

console.log('[Sitemap] Debug:', {
  total: allMerchants.length,
  published: publishedMerchants.length,
  withSlug: withSlug.length,
  missing: allMerchants.length - withSlug.length
});
```

### 2. Reduce Cache Time (Optional)
If you want faster updates:
```typescript
export const revalidate = 3600 // 1 hour instead of 24 hours
```

### 3. Add Error Handling
Log which merchants are being excluded:
```typescript
const excluded = allMerchants.filter((m: any) => !m.publishedAt || !m.page_slug);
if (excluded.length > 0) {
  console.warn('[Sitemap] Excluded merchants:', excluded.map(m => ({
    id: m.id,
    name: m.merchant_name,
    published: !!m.publishedAt,
    slug: m.page_slug
  })));
}
```

---

## Summary

1. ✅ **`eppiocemhmnlbhjplcgkofciiegomcon`** - Browser extension, not in actual XML
2. ✅ **XML namespace** - Correct, no changes needed
3. ⚠️ **72 vs 70 merchants** - Likely 2 unpublished merchants or missing `page_slug`

**Action:** Check Strapi CMS for unpublished merchants or missing `page_slug` values.


