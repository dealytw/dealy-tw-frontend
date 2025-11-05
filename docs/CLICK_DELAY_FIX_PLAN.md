# Delay Investigation & Fix Plan

## 🔍 Problem Found

**Root Cause:** `await trackCouponClick()` in `DealyCouponCard.tsx` is blocking the click handler!

### Current Flow (Blocking):
```typescript
const handleButtonClick = async () => {
  await trackCouponClick();  // ⚠️ BLOCKS HERE (1-2 seconds!)
  onClick();  // Only called AFTER API completes
};
```

The `/api/coupons/[id]/track-click` route makes TWO sequential API calls:
1. Fetch current coupon (`strapiFetch`) - ~500ms-1s
2. Update coupon (`fetch` PUT) - ~500ms-1s
**Total: ~1-2 seconds blocking**

### Why This Causes Delay:
- `await trackCouponClick()` waits for the API call to complete
- Navigation (`onClick()`) only happens AFTER tracking completes
- User experiences 1-2 second delay before redirect/new tab opens

## ✅ Solution Plan

### Option 1: Fire-and-Forget Tracking (Recommended)
**Don't await** the tracking call - execute navigation immediately:

```typescript
const handleButtonClick = () => {
  // Fire tracking (don't await - non-blocking)
  trackCouponClick().catch(() => {}); // Silently fail if needed
  
  // Execute navigation immediately (no delay)
  onClick();
};
```

**Pros:**
- ✅ Instant navigation
- ✅ Tracking still happens (just doesn't block)
- ✅ Simple change

**Cons:**
- ⚠️ Tracking might fail silently (but we already handle this)

### Option 2: Use `sendBeacon` API (Best for Analytics)
Use browser's `navigator.sendBeacon()` for non-blocking tracking:

```typescript
const trackCouponClick = () => {
  // Use sendBeacon for non-blocking, guaranteed delivery
  const blob = new Blob([JSON.stringify({ id: coupon.id })], { type: 'application/json' });
  navigator.sendBeacon(`/api/coupons/${coupon.id}/track-click`, blob);
};
```

**Pros:**
- ✅ Non-blocking (guaranteed by browser)
- ✅ Works even if page unloads (navigation happens)
- ✅ Better for analytics tracking

**Cons:**
- ⚠️ Need to modify API route to accept `sendBeacon` format
- ⚠️ Slightly more complex

### Option 3: Use `next/link` for Merchant Page (If Possible)
For the merchant page link, we could use `next/link` with a workaround:

```typescript
// Create Link component dynamically
const MerchantLink = ({ href, children }) => (
  <Link href={href} target="_blank" onClick={(e) => {
    e.preventDefault();
    window.open(href, '_blank');
  }}>
    {children}
  </Link>
);
```

**Pros:**
- ✅ Next.js prefetching benefits
- ✅ Better SEO

**Cons:**
- ⚠️ Still need to handle affiliate redirect separately
- ⚠️ `next/link` doesn't natively support `target="_blank"`

## 🎯 Recommended Fix

**Use Option 1 (Fire-and-Forget) + Option 2 (sendBeacon) hybrid:**

1. **Remove `await` from `handleButtonClick`** - Execute navigation immediately
2. **Use `sendBeacon` for tracking** - Non-blocking, guaranteed delivery
3. **Keep `<a>` tag approach** - Fast native browser handling

### Implementation:
```typescript
const trackCouponClick = () => {
  // Use sendBeacon for non-blocking tracking
  try {
    const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
    navigator.sendBeacon(`/api/coupons/${coupon.id}/track-click`, blob);
  } catch (error) {
    // Fallback to fetch if sendBeacon not supported
    fetch(`/api/coupons/${coupon.id}/track-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true  // Keep request alive even if page unloads
    }).catch(() => {}); // Silently fail
  }
};

const handleButtonClick = () => {
  // Fire tracking (non-blocking)
  trackCouponClick();
  
  // Execute navigation immediately (no delay!)
  onClick();
};
```

## 📝 About `next/link` and New Tabs

**Answer:** `next/link` doesn't natively support `target="_blank"`, but:
- We can use `Link` with `onClick` handler to open in new tab
- However, the real issue is the blocking `await`, not the link method
- `<a>` tag click is actually faster than `next/link` for programmatic navigation

## ✅ Expected Result After Fix

- ✅ Click → **Instant** redirect + new tab (no delay)
- ✅ Tracking happens in background (non-blocking)
- ✅ Better user experience (feels instant)

