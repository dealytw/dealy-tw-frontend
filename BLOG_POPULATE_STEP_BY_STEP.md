# Blog Page Populate - Step by Step Plan

## Status: ✅ Route works with minimal populate
- Confirmed: Issue is with populate syntax, not routing

## Step-by-Step Implementation Plan

### Step 1: Add `blog_sections` text fields only (like `useful_links`)
**Pattern:** Same as merchant page `useful_links` (repeatable component, text fields only)
```typescript
"populate[blog_sections][fields][0]": "h2_blog_section_title",
"populate[blog_sections][fields][1]": "blog_texts",
```
**Expected:** ✅ Should work (same pattern as `useful_links`)

### Step 2: Add `blog_table` text fields only
**Pattern:** Same as `blog_sections` (repeatable component, text fields only)
```typescript
"populate[blog_table][fields][0]": "table_h3",
"populate[blog_table][fields][1]": "table_title",
"populate[blog_table][fields][2]": "table_description",
"populate[blog_table][fields][3]": "table_promo_code",
"populate[blog_table][fields][4]": "landingpage",
"populate[blog_table][fields][5]": "table_date",
```
**Expected:** ✅ Should work (same pattern as `useful_links`)

### Step 3: Add `related_merchants` and `related_blogs` (relations)
**Pattern:** Same as merchant page (many-to-many relations)
```typescript
"populate[related_merchants][fields][0]": "id",
"populate[related_merchants][fields][1]": "merchant_name",
"populate[related_merchants][fields][2]": "page_slug",
"populate[related_merchants][populate][logo][fields][0]": "url",
"populate[related_blogs][fields][0]": "id",
"populate[related_blogs][fields][1]": "blog_title",
"populate[related_blogs][fields][2]": "page_slug",
"populate[related_blogs][fields][3]": "createdAt",
"populate[related_blogs][fields][4]": "updatedAt",
```
**Expected:** ✅ Should work (same pattern as merchant page)

### Step 4: Add `blog_coupon` relation (text fields first)
**Pattern:** Relation to Coupon collection (like `related_merchants`)
```typescript
"populate[blog_coupon][fields][0]": "id",
"populate[blog_coupon][fields][1]": "coupon_title",
"populate[blog_coupon][fields][2]": "value",
"populate[blog_coupon][fields][3]": "code",
"populate[blog_coupon][fields][4]": "affiliate_link",
"populate[blog_coupon][fields][5]": "coupon_type",
"populate[blog_coupon][fields][6]": "expires_at",
"populate[blog_coupon][fields][7]": "priority",
"populate[blog_coupon][fields][8]": "display_count",
"populate[blog_coupon][fields][9]": "coupon_status",
"populate[blog_coupon][fields][10]": "description",
"populate[blog_coupon][fields][11]": "editor_tips",
"populate[blog_coupon][populate][market][fields][0]": "key",
```
**Expected:** ✅ Should work (relation, not repeatable component)

### Step 5: Add `blog_coupon.merchant.logo` nested populate
**Pattern:** Nested populate on relation (like `related_merchants.logo`)
```typescript
"populate[blog_coupon][populate][merchant][fields][0]": "id",
"populate[blog_coupon][populate][merchant][fields][1]": "merchant_name",
"populate[blog_coupon][populate][merchant][fields][2]": "page_slug",
"populate[blog_coupon][populate][merchant][populate][logo][fields][0]": "url",
```
**Expected:** ⚠️ May need separate fetch (nested populate on relation within relation)

### Step 6: Add `blog_sections.blog_image` nested populate (SEPARATE FETCH)
**Pattern:** Media fields in repeatable components need separate fetch
```typescript
// Main query: text fields only
"populate[blog_sections][fields][0]": "h2_blog_section_title",
"populate[blog_sections][fields][1]": "blog_texts",

// Separate query for images:
const imagesRes = await strapiFetch(`/api/blogs?${qs({
  "filters[id][$eq]": blogId,
  "populate[blog_sections][populate][blog_image][fields][0]": "url",
})}`);
```
**Expected:** ✅ Should work (separate fetch avoids route 404)

## Key Insights

1. **Repeatable Components (text fields):** ✅ Works in main query (like `useful_links`)
2. **Repeatable Components (media fields):** ❌ Needs separate fetch
3. **Relations (text fields):** ✅ Works in main query
4. **Relations (nested media):** ✅ Works in main query (like `related_merchants.logo`)
5. **Relations within Relations (nested media):** ⚠️ May need separate fetch

## Implementation Order

1. ✅ Step 1: `blog_sections` text fields
2. ✅ Step 2: `blog_table` text fields  
3. ✅ Step 3: `related_merchants` and `related_blogs`
4. ✅ Step 4: `blog_coupon` text fields
5. ⚠️ Step 5: `blog_coupon.merchant.logo` (test if works in main query)
6. ✅ Step 6: `blog_sections.blog_image` (separate fetch)

