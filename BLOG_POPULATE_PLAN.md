# Blog Page Populate Plan

## Overview
This document outlines the strategy for fetching all blog page data from Strapi CMS, including repeatable components with text fields, media fields, and relations.

## CMS Structure

### 1. Main Blog Fields
- `blog_title` (text)
- `page_slug` (text)
- `createdAt`, `updatedAt` (dates)

### 2. Repeatable Components

#### A. `blog_sections` (Repeatable Component)
- `h2_blog_section_title` (text) ✅ No nested populate
- `blog_texts` (rich text JSON) ✅ No nested populate
- `blog_image` (media) ⚠️ **NEEDS nested populate**

#### B. `blog_table` (Repeatable Component - Comparison Table)
- `table_h3` (text) ✅ No nested populate
- `table_title` (text) ✅ No nested populate
- `table_description` (text) ✅ No nested populate
- `table_promo_code` (text) ✅ No nested populate
- `landingpage` (text/URL) ✅ No nested populate
- `table_date` (text) ✅ No nested populate

### 3. Relations

#### A. `related_merchants` (Many-to-Many Relation)
- Already working ✅
- Pattern: `populate[related_merchants][fields][...]` + `populate[related_merchants][populate][logo][fields][0]: "url"`

#### B. `related_blogs` (Many-to-Many Relation)
- Already working ✅
- Pattern: `populate[related_blogs][fields][...]`

#### C. `blog_coupon` (Relation to Coupon Collection)
- ⚠️ **NEEDS populate for relation**
- ⚠️ **NEEDS nested populate for coupon media** (if coupons have logos/images)
- Pattern: `populate[blog_coupon][fields][...]` + `populate[blog_coupon][populate][logo][fields][0]: "url"` (if needed)

---

## Implementation Strategy

### Phase 1: Text Fields (Working Pattern - Like `useful_links`)

**Status:** ✅ Already implemented for `blog_sections`

**Pattern:**
```typescript
// Main query - fetch all text fields in repeatable components
"populate[blog_sections][fields][0]": "h2_blog_section_title",
"populate[blog_sections][fields][1]": "blog_texts",
"populate[blog_table][fields][0]": "table_h3",
"populate[blog_table][fields][1]": "table_title",
"populate[blog_table][fields][2]": "table_description",
"populate[blog_table][fields][3]": "table_promo_code",
"populate[blog_table][fields][4]": "landingpage",
"populate[blog_table][fields][5]": "table_date",
```

**Reference:** Merchant page `useful_links` pattern (lines 674-675)

---

### Phase 2: Media Fields (Nested Populate - Research Based)

**Status:** ⚠️ Currently fetching separately (workaround)

**Research Findings:**
- Strapi v5 supports nested populate for media in repeatable components
- Pattern: `populate[blog_sections][populate][blog_image][fields][0]: "url"`
- **Issue:** Causes Next.js route 404 when in main query

**Options:**

#### Option A: Separate Query (Current Approach) ✅
```typescript
// Main query: text fields only
"populate[blog_sections][fields][0]": "h2_blog_section_title",
"populate[blog_sections][fields][1]": "blog_texts",

// Separate query: media only
const imagesRes = await strapiFetch(`/api/blogs?${qs({
  "filters[id][$eq]": blogId,
  "populate[blog_sections][populate][blog_image][fields][0]": "url",
})}`);

// Merge results
```

**Pros:**
- ✅ Works (avoids route 404)
- ✅ Matches current working pattern

**Cons:**
- ❌ Extra API call
- ❌ More complex merge logic

#### Option B: Try Nested Populate in Main Query (To Test)
```typescript
// Attempt to include nested media in main query
"populate[blog_sections][fields][0]": "h2_blog_section_title",
"populate[blog_sections][fields][1]": "blog_texts",
"populate[blog_sections][populate][blog_image][fields][0]": "url",
```

**Pros:**
- ✅ Single query
- ✅ Simpler code

**Cons:**
- ❌ May cause route 404 (needs testing)
- ❌ Risk of breaking page

**Recommendation:** Keep Option A (separate query) for now, test Option B in development.

---

### Phase 3: Relations with Nested Media (Like `blog_coupon`)

**Status:** ⚠️ Not yet implemented

**Pattern (Based on `related_merchants`):**
```typescript
// Main query
"populate[blog_coupon][fields][0]": "id",
"populate[blog_coupon][fields][1]": "coupon_title",
"populate[blog_coupon][fields][2]": "description",
"populate[blog_coupon][fields][3]": "value",
"populate[blog_coupon][fields][4]": "code",
"populate[blog_coupon][fields][5]": "affiliate_link",
// ... other coupon fields

// Nested populate for coupon media (if coupons have logos/images)
"populate[blog_coupon][populate][logo][fields][0]": "url",
// Or if coupon has merchant relation with logo:
"populate[blog_coupon][populate][merchant][fields][0]": "id",
"populate[blog_coupon][populate][merchant][populate][logo][fields][0]": "url",
```

**Reference:** Merchant page `related_merchants` pattern (lines 676-679)

**Implementation Steps:**
1. Add `blog_coupon` populate to main query (text fields first)
2. Add nested populate for coupon media/relations
3. Test if it causes route 404
4. If 404, fetch coupons separately (like we do for `blog_image`)

---

## Complete Fetch Plan

### Main Query (Text Fields Only)
```typescript
const blogRes = await strapiFetch(`/api/blogs?${qs({
  "filters[page_slug][$eq]": page_slug,
  "fields[0]": "id",
  "fields[1]": "blog_title",
  "fields[2]": "page_slug",
  "fields[3]": "createdAt",
  "fields[4]": "updatedAt",
  
  // blog_sections - text fields only
  "populate[blog_sections][fields][0]": "h2_blog_section_title",
  "populate[blog_sections][fields][1]": "blog_texts",
  
  // blog_table - all text fields
  "populate[blog_table][fields][0]": "table_h3",
  "populate[blog_table][fields][1]": "table_title",
  "populate[blog_table][fields][2]": "table_description",
  "populate[blog_table][fields][3]": "table_promo_code",
  "populate[blog_table][fields][4]": "landingpage",
  "populate[blog_table][fields][5]": "table_date",
  
  // blog_coupon - relation fields (text only first)
  "populate[blog_coupon][fields][0]": "id",
  "populate[blog_coupon][fields][1]": "coupon_title",
  "populate[blog_coupon][fields][2]": "description",
  "populate[blog_coupon][fields][3]": "value",
  "populate[blog_coupon][fields][4]": "code",
  "populate[blog_coupon][fields][5]": "affiliate_link",
  // ... add other coupon text fields as needed
  
  // Existing relations
  "populate[related_merchants][fields][0]": "id",
  "populate[related_merchants][fields][1]": "merchant_name",
  "populate[related_merchants][fields][2]": "page_slug",
  "populate[related_merchants][populate][logo][fields][0]": "url",
  "populate[related_blogs][fields][0]": "id",
  "populate[related_blogs][fields][1]": "blog_title",
  "populate[related_blogs][fields][2]": "page_slug",
  "populate[related_blogs][fields][3]": "createdAt",
  "populate[related_blogs][fields][4]": "updatedAt",
})}`);
```

### Separate Query 1: blog_sections Media
```typescript
// Fetch blog_image URLs for blog_sections
const imagesRes = await strapiFetch(`/api/blogs?${qs({
  "filters[id][$eq]": blogId,
  "populate[blog_sections][populate][blog_image][fields][0]": "url",
})}`);

// Merge into blog_sections array
```

### Separate Query 2: blog_coupon Media (If Needed)
```typescript
// Fetch coupon media/relations if main query causes 404
const couponsRes = await strapiFetch(`/api/blogs?${qs({
  "filters[id][$eq]": blogId,
  "populate[blog_coupon][populate][logo][fields][0]": "url",
  // Or if coupon has merchant:
  "populate[blog_coupon][populate][merchant][populate][logo][fields][0]": "url",
})}`);

// Merge into blog_coupon array
```

---

## Testing Strategy

1. **Phase 1 (Text Fields):** ✅ Already working
   - Test: Add `blog_table` populate to main query
   - Expected: No 404, text fields populate correctly

2. **Phase 2 (Media Fields):** ⚠️ Current workaround working
   - Test: Try adding nested `blog_image` populate to main query
   - Expected: May cause 404, if so keep separate query

3. **Phase 3 (Relations):** ⚠️ To implement
   - Test: Add `blog_coupon` populate to main query (text only)
   - Test: Add nested populate for coupon media
   - Expected: If 404, fetch separately

---

## Implementation Order

1. ✅ **DONE:** `blog_sections` text fields in main query
2. ✅ **DONE:** `blog_image` in separate query (workaround)
3. ⏳ **TODO:** Add `blog_table` to main query
4. ⏳ **TODO:** Add `blog_coupon` to main query (text fields)
5. ⏳ **TODO:** Test nested populate for `blog_coupon` media
6. ⏳ **TODO:** If needed, fetch `blog_coupon` media separately

---

## Notes

- **Why separate queries for media?** Next.js route recognition seems to fail when nested media populate is in main query
- **Alternative:** Could try using `populate=*` or `populate=deep` but this is not recommended (performance, security)
- **Best Practice:** Explicit field selection (current approach) is better for performance and security

