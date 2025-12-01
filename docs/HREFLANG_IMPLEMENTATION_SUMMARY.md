# Hreflang Backend Implementation - Quick Summary

## ✅ Recommended Approach

**Store alternate merchant reference directly in merchant collection** - This is the most stable and performant solution.

---

## Step 1: Add Fields to Merchant Schema

**File:** `dealy-tw-cms/src/api/merchant/content-types/merchant/schema.json`

Add these two fields after line 29 (after `page_slug`):

```json
"alternate_merchant": {
  "type": "relation",
  "relation": "manyToOne",
  "target": "api::merchant.merchant",
  "inversedBy": null
},
"alternate_merchant_slug": {
  "type": "string",
  "required": false,
  "description": "Cached slug of alternate merchant in other market (e.g., 'booking-com' for HK when on TW)"
}
```

**Why two fields?**
- `alternate_merchant`: Full relation (for admin UI, future features)
- `alternate_merchant_slug`: Cached string (for frontend performance - no populate needed)

---

## Step 2: Update Frontend to Use New Field

### 2.1 Update `getMerchantSEO()`

**File:** `dealy-tw-frontend/src/lib/seo.server.ts`

Add `alternate_merchant_slug` to fields array:

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
    'populate[ogImage][fields][0]': 'url',
    'populate[logo][fields][0]': 'url',
  };
  // ...
}
```

### 2.2 Update `generateMetadata()`

**File:** `dealy-tw-frontend/app/shop/[id]/page.tsx`

Replace the `findAlternateMerchant()` call with direct field access:

```typescript
// OLD CODE (REMOVE):
// let alternateMerchantSlug: string | null = null;
// try {
//   alternateMerchantSlug = await findAlternateMerchant(name, marketKey, alternateMarket, 300);
// } catch (error) {
//   console.error(`[generateMetadata] Failed to find alternate merchant for ${name}:`, error);
// }

// NEW CODE (REPLACE WITH):
const alternateMerchantSlug = merchant.alternate_merchant_slug || null;
```

---

## Step 3: Populate Existing Data

### Option A: Manual (Quick Start)
1. Go to Strapi Admin → Merchants
2. For each merchant, manually set `alternate_merchant_slug` using the existing mapping
3. Start with high-traffic merchants (Booking.com, Agoda, etc.)

### Option B: Migration Script (Recommended)
1. Create migration script (see `migrate-alternate-merchants.mjs.example`)
2. Run: `node scripts/migrate-alternate-merchants.mjs --dry-run`
3. Review results
4. Run: `node scripts/migrate-alternate-merchants.mjs`

---

## Step 4: Auto-Match New Merchants (Optional)

**File:** `dealy-tw-cms/src/api/merchant/content-types/merchant/lifecycles.ts`

```typescript
export default {
  async beforeCreate(event) {
    const { merchant_name, market, alternate_merchant_slug } = event.params.data;
    
    // If alternate not set, try to find match
    if (!alternate_merchant_slug && merchant_name) {
      const alternateMarket = market?.key === 'TW' ? 'HK' : 'TW';
      const match = await findAlternateMerchantMatch(merchant_name, alternateMarket);
      
      if (match) {
        event.params.data.alternate_merchant_slug = match.page_slug;
        // Optionally set relation too
        if (match.id) {
          event.params.data.alternate_merchant = match.id;
        }
      }
    }
  },
};
```

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

## Migration Path

1. **Phase 1:** Add fields to schema (5 min)
2. **Phase 2:** Populate existing data manually or via script (30 min)
3. **Phase 3:** Update frontend code (10 min)
4. **Phase 4:** Test and verify (15 min)
5. **Phase 5:** Add auto-matching (optional, 15 min)

**Total Time:** ~1-2 hours

---

## Rollback Plan

Keep old `findAlternateMerchant()` function as fallback:

```typescript
// Use new field if available, fallback to old lookup
const alternateMerchantSlug = merchant.alternate_merchant_slug 
  || await findAlternateMerchant(name, marketKey, alternateMarket, 300)
  || null;
```

This allows gradual migration and easy rollback if needed.

---

## Next Steps

1. ✅ Review this plan
2. ✅ Add fields to merchant schema
3. ✅ Update frontend code
4. ✅ Populate data (manual or script)
5. ✅ Test on staging
6. ✅ Deploy to production

