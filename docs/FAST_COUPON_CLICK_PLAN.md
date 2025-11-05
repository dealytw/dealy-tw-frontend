# Fast Coupon Button Click Plan

## 🎯 Goal
Make coupon button clicks instant with parallel actions:
1. Redirect to affiliate link (same tab) - **instant**
2. Open merchant page in new tab (server-rendered) - **instant**

## ✅ Requirements
- ✅ Keep merchant pages stable (no 500 errors)
- ✅ Server fetch only (use SearchProvider merchant data - already server-fetched)
- ✅ No client-side prefetching (merchant pages are server-rendered)
- ✅ Use `<a>` tag instead of `window.open()` for new tab
- ✅ Parallel actions (no delays)
- ✅ No `setTimeout` - immediate execution

## 📋 Current Implementation Analysis

### Current Flow:
1. **Homepage** (`page-client.tsx`):
   - Opens merchant page in new tab (`window.open()`)
   - Waits 100ms (`setTimeout`)
   - Redirects to affiliate link in same tab (`window.open(..., '_self')`)

2. **Merchant Page** (`page-client.tsx`):
   - Opens merchant page in new tab (`window.open()`)
   - Waits 100ms (`setTimeout`)
   - Redirects to affiliate link in same tab (`window.open(..., '_self')`)

3. **DealyCouponCard**:
   - Calls `onClick()` handler
   - No direct access to merchant slug

### Issues:
- ❌ `setTimeout` delays (100ms) slow down the experience
- ❌ No prefetching - merchant pages load on demand
- ❌ Sequential execution (new tab → wait → redirect)

## 🚀 Solution Plan

### Phase 1: Server-Side Merchant Data (Already Done!)
**Location:** `app/layout.tsx` → `SearchProvider`

**Status:** ✅ Already implemented!
- Merchant data is server-fetched in `layout.tsx` using `strapiFetch`
- Passed to `SearchProvider` as `initialMerchants` prop
- All merchant data available without client-side API calls

**Note:** Merchant pages are server-rendered (using `dynamic = 'force-static'` or `dynamic = 'auto'`), so they're already server-fetched. No client-side prefetching needed!

### Phase 2: Add merchantSlug to DealyCouponCard
**Location:** `src/components/DealyCouponCard.tsx`

**Action:**
- Add `merchantSlug?: string` prop to `DealyCouponCardProps`
- Use it for building merchant page URL (no prefetching needed - pages are server-rendered)

### Phase 3: Update handleCouponClick for Parallel Actions
**Location:** `app/page-client.tsx`, `app/shop/[id]/page-client.tsx`, `app/special-offers/special-offers-client.tsx`

**Action:**
- Remove `setTimeout` delays
- Execute both actions in parallel:
  - `window.location.href = affiliateLink` (same tab - instant redirect)
  - Programmatically click `<a>` tag with `target="_blank"` (new tab - faster than `window.open()`)

**Why `<a>` tag instead of `window.open()`?**
- Native browser link handling is faster than `window.open()`
- Better prefetching compatibility with Next.js
- More reliable cross-browser behavior
- Can leverage browser's native prefetching

**Implementation:**
```typescript
const handleCouponClick = (coupon: any) => {
  // Track click
  trackCouponClick();
  
  // Parallel actions (no delays)
  if (coupon.merchantSlug) {
    // Action 1: Open merchant page (new tab) - instant (server-rendered)
    // Use native <a> tag for better performance than window.open()
    const merchantUrl = `/shop/${coupon.merchantSlug}#coupon-${coupon.id}`;
    const link = document.createElement('a');
    link.href = merchantUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  if (coupon.affiliateLink && coupon.affiliateLink !== '#') {
    // Action 2: Redirect to affiliate link (same tab) - instant
    window.location.href = coupon.affiliateLink;
  }
};
```

### Phase 4: Pass merchantSlug from Parent Components
**Location:** `app/page-client.tsx`, `app/shop/[id]/page-client.tsx`, `app/special-offers/special-offers-client.tsx`

**Action:**
- Pass `merchantSlug` prop to `DealyCouponCard`
- Extract from coupon data or merchant data

**Implementation:**
```typescript
<DealyCouponCard 
  coupon={transformedCoupon}
  merchantSlug={coupon.merchantSlug || merchant.slug}
  onClick={() => handleCouponClick(coupon)}
/>
```

## 🔧 Technical Details

### Can a click trigger both affiliate redirect and merchant page?
**Answer:** Yes! We use:
- `window.location.href = affiliateLink` for same-tab redirect (instant)
- Programmatically clicked `<a>` tag with `target="_blank"` for new-tab navigation (faster than `window.open()`)
- Both actions happen in parallel (no delays)

### Why not use `next/link` directly?
- `next/link` doesn't support `target="_blank"` natively (it navigates in the same tab)
- We need to trigger TWO actions from ONE click (affiliate redirect + merchant page)
- Using programmatic `<a>` tag click is faster and more reliable than `window.open()`
- Merchant pages are already server-rendered, so no prefetching needed

### Server-Side Fetching Confirmation:
- ✅ Merchant data: Server-fetched in `layout.tsx` via `strapiFetch`
- ✅ Merchant pages: Server-rendered (using `dynamic = 'force-static'` or `dynamic = 'auto'`)
- ✅ No client-side API calls: All data comes from server
- ✅ No `router.prefetch()`: Pages are already server-rendered, browsers can cache them

## 📝 Files to Modify

1. ✅ `src/components/DealyCouponCard.tsx` - Add `merchantSlug` prop
2. ✅ `app/page-client.tsx` - Parallel actions + pass merchantSlug
3. ✅ `app/shop/[id]/page-client.tsx` - Parallel actions + pass merchantSlug
4. ✅ `app/special-offers/special-offers-client.tsx` - Parallel actions + pass merchantSlug
5. ✅ `src/components/RelatedMerchantCouponCard.tsx` - Update for parallel actions

## ✅ Success Criteria

- ✅ No `setTimeout` delays in coupon click handlers
- ✅ Affiliate link redirects instantly (same tab)
- ✅ Merchant page opens instantly (new tab, server-rendered)
- ✅ Both actions happen in parallel
- ✅ Uses SearchProvider merchant data (server-fetched)
- ✅ No client-side API calls for prefetching
- ✅ Merchant pages remain stable (no 500 errors)

