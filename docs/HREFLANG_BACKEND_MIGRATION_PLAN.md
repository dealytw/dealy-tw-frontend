# Hreflang Backend Migration Plan

## Overview

Move hreflang merchant matching from frontend runtime lookup to backend CMS storage for better performance, stability, and scalability.

**Current State:**
- Frontend performs runtime lookup via `findAlternateMerchant()`
- Uses hardcoded mapping + sitemap parsing + name normalization
- Multiple API calls and network requests per page load
- Unstable if sitemap is unavailable

**Target State:**
- Alternate merchant reference stored directly in merchant collection
- Frontend simply reads the field (no lookup needed)
- Middleware/script handles matching logic
- Single database query, no external dependencies

---

## Phase 1: Database Schema Changes

### 1.1 Add Relation Field to Merchant Collection

**File:** `dealy-tw-cms/src/api/merchant/content-types/merchant/schema.json`

**Add field:**
```json
{
  "alternate_merchant": {
    "type": "relation",
    "relation": "manyToOne",
    "target": "api::merchant.merchant",
    "inversedBy": null
  },
  "alternate_merchant_slug": {
    "type": "string",
    "required": false,
    "description": "Cached slug of alternate merchant (for quick access without populate)"
  }
}
```

**Why both fields?**
- `alternate_merchant`: Full relation for admin UI and future use
- `alternate_merchant_slug`: Cached string for frontend performance (no populate needed)

### 1.2 Update TypeScript Types

**File:** `dealy-tw-cms/types/generated/contentTypes.d.ts` (auto-generated, but verify)

**File:** `dealy-tw-frontend/src/lib/types.ts` (add to Merchant interface)

---

## Phase 2: Migration Script

### 2.1 Create Migration Script

**File:** `dealy-tw-cms/scripts/migrate-alternate-merchants.mjs`

**Purpose:**
- Populate `alternate_merchant` and `alternate_merchant_slug` for all existing merchants
- Use existing hardcoded mapping + sitemap parsing logic
- Match TW merchants to HK merchants (and vice versa)

**Logic:**
1. Fetch all TW merchants
2. For each merchant:
   - Check hardcoded mapping first
   - If not found, try name normalization
   - If found, query HK merchant by slug
   - Update TW merchant with `alternate_merchant` relation and `alternate_merchant_slug`
3. Repeat for HK → TW
4. Log results and unmatched merchants

**Features:**
- Dry-run mode (preview changes)
- Batch processing (avoid timeout)
- Resume capability (skip already matched)
- Detailed logging

### 2.2 Run Migration

```bash
cd dealy-tw-cms
node scripts/migrate-alternate-merchants.mjs --dry-run  # Preview
node scripts/migrate-alternate-merchants.mjs           # Execute
```

---

## Phase 3: Middleware/Automation

### 3.1 Strapi Lifecycle Hook

**File:** `dealy-tw-cms/src/api/merchant/content-types/merchant/lifecycles.ts`

**Purpose:** Auto-match new merchants when created/updated

**Logic:**
```typescript
async beforeCreate(event) {
  // If alternate_merchant not set, try to find match
  if (!event.params.data.alternate_merchant) {
    const match = await findAlternateMerchantMatch(
      event.params.data.merchant_name,
      event.params.data.market
    );
    if (match) {
      event.params.data.alternate_merchant = match.id;
      event.params.data.alternate_merchant_slug = match.page_slug;
    }
  }
}
```

### 3.2 Admin UI Enhancement (Optional)

**File:** Custom Strapi plugin or component

**Features:**
- "Find Alternate Merchant" button in admin UI
- Manual override if auto-match is wrong
- Bulk matching tool for existing merchants

### 3.3 Scheduled Job (Optional)

**File:** `dealy-tw-cms/scripts/sync-alternate-merchants.mjs`

**Purpose:** Periodic sync to catch new merchants or fix mismatches

**Schedule:** Weekly cron job

---

## Phase 4: Frontend Updates

### 4.1 Update `getMerchantSEO()` Function

**File:** `dealy-tw-frontend/src/lib/seo.server.ts`

**Change:**
```typescript
export async function getMerchantSEO(slug: string, revalidate = 300) {
  const params = {
    'filters[page_slug][$eq]': slug,
    'fields[0]': 'id',
    'fields[1]': 'documentId',
    'fields[2]': 'merchant_name',
    'fields[3]': 'page_slug',
    'fields[4]': 'seo_title',
    'fields[5]': 'seo_description',
    'fields[6]': 'canonical_url',
    'fields[7]': 'robots',
    'fields[8]': 'alternate_merchant_slug',  // ← Add this
    // ... rest
  };
  // ...
}
```

### 4.2 Update `generateMetadata()` Function

**File:** `dealy-tw-frontend/app/shop/[id]/page.tsx`

**Change:**
```typescript
// OLD: Runtime lookup
let alternateMerchantSlug: string | null = null;
try {
  alternateMerchantSlug = await findAlternateMerchant(name, marketKey, alternateMarket, 300);
} catch (error) {
  // ...
}

// NEW: Read from merchant field
const alternateMerchantSlug = merchant.alternate_merchant_slug || null;
```

### 4.3 Remove Old Lookup Logic

**Files to update:**
- `dealy-tw-frontend/src/lib/seo.server.ts` - Remove or deprecate `findAlternateMerchant()`
- Keep `parseHKMerchantSitemap()` for migration script only

---

## Phase 5: Testing & Validation

### 5.1 Test Cases

1. **Existing Merchants:**
   - Verify all merchants in mapping have `alternate_merchant_slug` populated
   - Check hreflang tags appear in HTML

2. **New Merchants:**
   - Create new TW merchant → verify auto-match works
   - Create new HK merchant → verify auto-match works
   - Create unmatched merchant → verify no errors

3. **Edge Cases:**
   - Merchants with special characters in name
   - Merchants with same name in both markets
   - Merchants that exist in one market only

### 5.2 Performance Testing

- Measure page load time before/after
- Verify no sitemap API calls during page load
- Check database query performance

---

## Phase 6: Cleanup

### 6.1 Remove Deprecated Code

**Files:**
- `dealy-tw-frontend/src/lib/seo.server.ts` - Remove `findAlternateMerchant()` (or keep as fallback)
- Remove hardcoded `MERCHANT_NAME_TO_HK_SLUG_MAPPING` (or keep for migration only)

### 6.2 Update Documentation

- Update `HK_MERCHANT_HREFLANG_MAPPING.md` to reflect new approach
- Document new field in merchant schema
- Update API documentation

---

## Implementation Order

1. ✅ **Phase 1**: Add database fields (5 min)
2. ✅ **Phase 2**: Create and run migration script (30 min)
3. ✅ **Phase 3**: Add lifecycle hooks (15 min)
4. ✅ **Phase 4**: Update frontend code (20 min)
5. ✅ **Phase 5**: Test thoroughly (30 min)
6. ✅ **Phase 6**: Cleanup (10 min)

**Total Estimated Time:** ~2 hours

---

## Benefits

### Performance
- ✅ **Zero runtime lookups** - No sitemap parsing, no name matching
- ✅ **Single database query** - Alternate slug included in merchant fetch
- ✅ **No external dependencies** - No sitemap API calls
- ✅ **Faster page loads** - Reduced metadata generation time

### Stability
- ✅ **No network failures** - No external API calls
- ✅ **Consistent results** - Admin-controlled matching
- ✅ **Easy debugging** - Can see matches in CMS admin

### Scalability
- ✅ **Multi-site ready** - Can add more markets easily
- ✅ **Admin-friendly** - Non-technical users can manage matches
- ✅ **Future-proof** - Foundation for advanced features

---

## Rollback Plan

If issues arise:
1. Keep old `findAlternateMerchant()` function as fallback
2. Add feature flag: `USE_ALTERNATE_MERCHANT_FIELD`
3. If field is null, fall back to old lookup logic
4. Gradually migrate merchants and enable feature flag

---

## Future Enhancements

1. **Multi-market support:** Add `alternate_merchants` (array) for 3+ markets
2. **Auto-sync job:** Periodic sync with external sitemaps
3. **Admin UI:** Visual matching interface with suggestions
4. **Analytics:** Track match accuracy and manual overrides

