# API Call Reduction Plan

## Current Situation ⚠️
- **TW Market:** >100K API calls/month (exceeded Essential plan limit)
- **HK Market:** Expected similar or higher usage
- **Essential Plan Limit:** 100K calls/month ❌ **Already exceeded**
- **Pro Plan:** 1M calls/month ($75/month) ✅ **Required**

## Immediate Action Required
**Upgrade to Pro Plan NOW** - TW alone already exceeds Essential limit

Then optimize to reduce usage and costs.

---

## API Call Sources Analysis

### 1. Admin App - Client-Side Fetching ⚠️ **LIKELY MAJOR SOURCE**

**Problem:** Admin app uses `cache: 'no-store'` for ALL requests
- **Location:** `dealy-admin-app/src/api/strapiClient.ts:47`
- **Impact:** Every admin action = fresh API call (no caching)
- **Frequency:** Could be 1000s of calls per day from admin usage

**Current Code:**
```typescript
export async function sfetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    cache: 'no-store', // ❌ NO CACHING - Every request hits API
  });
}
```

**Estimated Impact:** Could be **30-50%** of total API calls if admin is heavily used

### 2. Frontend (Next.js) - Server-Side Fetching

#### High-Frequency Calls (Need Optimization)
- **Search API** (`/api/search`): `revalidate: 60` (1 minute) ⚠️
  - **Impact:** High-frequency user searches = many API calls
  - **Optimization:** Increase to 300s (5 minutes)

- **Merchant pages**: `revalidate: 300` (5 minutes)
  - **Impact:** Popular merchant pages = frequent revalidation
  - **Optimization:** Increase to 3600s (1 hour) for less dynamic content

- **Merchant Coupon API**: `revalidate: 300` (5 minutes)
  - **Optimization:** Increase to 3600s (1 hour)

#### Low-Frequency Calls (OK)
- **Sitemaps**: `revalidate: 86400` (24 hours) ✅
- **Blog posts**: `revalidate: 86400` (24 hours) ✅
- **Category pages**: `revalidate: 3600` (1 hour) ✅
- **Homepage**: `revalidate: 3600` (1 hour) ✅

---

## Optimization Strategies

### Strategy 1: Fix Admin App Caching ⚠️ **HIGHEST IMPACT**

**Problem:** Admin app makes every request fresh with `cache: 'no-store'`

**Solution: Add Client-Side Caching**
```typescript
// Add simple in-memory cache
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute for admin (data needs to be fresh)

export async function sfetch(path: string, init: RequestInit = {}) {
  // Check cache for GET requests only
  if ((init.method === 'GET' || !init.method) && !init.body) {
    const cached = cache.get(path);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache HIT] ${path}`);
      return cached.data;
    }
  }
  
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_TOKEN}`,
      ...(init.headers || {}),
    },
    // Remove 'no-store' for GET requests - let browser cache
    cache: (init.method === 'GET' || !init.method) ? 'default' : 'no-store',
  });
  
  if (res.status === 401) { 
    throw new Error('Unauthorized - Check API token permissions'); 
  }
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  
  const contentType = res.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return null;
  }
  
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  
  // Cache GET responses
  if ((init.method === 'GET' || !init.method) && !init.body && data) {
    cache.set(path, { data, timestamp: Date.now() });
    console.log(`[Cache SET] ${path}`);
  }
  
  return data;
}
```

**Estimated Impact:** **30-50% reduction** if admin is major source

### Strategy 2: Increase Revalidation Times (Frontend)

#### A. Search API - Increase from 60s to 300s
**Current:** `revalidate: 60` (1 minute)
**Change to:** `revalidate: 300` (5 minutes)
**Impact:** Reduces search API calls by **80%** (60s → 300s = 5x reduction)

**Files to update:**
- `app/api/search/route.ts:43` - Change `revalidate: 60` to `revalidate: 300`
- `app/api/search/route.ts:108` - Change `revalidate: 60` to `revalidate: 300`
- `app/search/page.tsx:63` - Change `revalidate: 60` to `revalidate: 300`
- `app/search/page.tsx:125` - Change `revalidate: 60` to `revalidate: 300`

#### B. Merchant Pages - Increase from 300s to 3600s
**Current:** `revalidate: 300` (5 minutes)
**Change to:** `revalidate: 3600` (1 hour)
**Impact:** Reduces merchant page API calls by **83%** (300s → 3600s = 12x reduction)

**Files to update:**
- `app/shop/[id]/page.tsx:442` - Change `revalidate: 300` to `revalidate: 3600`
- `app/shop/[id]/page.tsx:621` - Change `revalidate: 300` to `revalidate: 3600`
- `app/shop/[id]/page.tsx:650` - Change `revalidate: 300` to `revalidate: 3600`
- `src/lib/seo.server.ts:6` - Change default `revalidate = 300` to `revalidate = 3600`
- `src/lib/seo.server.ts:27` - Change default `revalidate = 300` to `revalidate = 3600`

#### C. Merchant Coupon API - Increase from 300s to 3600s
**Current:** `revalidate: 300` (5 minutes)
**Change to:** `revalidate: 3600` (1 hour)
**Impact:** Reduces coupon API calls by **83%**

**Files to update:**
- `app/api/merchant-coupon/route.ts:5` - Change `revalidate = 300` to `revalidate = 3600`
- `app/api/merchant-coupon/route.ts:40` - Change `revalidate: 300` to `revalidate: 3600`
- `src/lib/coupon-queries.ts:54` - Change `revalidate: 300` to `revalidate: 3600`
- `src/lib/coupon-queries.ts:116` - Change `revalidate: 300` to `revalidate: 3600`
- `src/lib/coupon-queries.ts:181` - Change `revalidate: 300` to `revalidate: 3600`

### Strategy 3: Enable Strapi Response Caching

Enable Strapi's built-in caching to reduce database queries:
```javascript
// In Strapi config (dealy-tw-cms/config/plugins.js or similar)
module.exports = {
  'rest-cache': {
    enabled: true,
    config: {
      provider: {
        name: 'memory',
        options: {
          max: 32767,
          maxAge: 1000 * 60 * 5, // 5 minutes
        },
      },
      strategy: {
        contentTypes: [
          'api::merchant.merchant',
          'api::coupon.coupon',
          'api::category.category',
        ],
      },
    },
  },
};
```

**Impact:** Reduces database queries, faster responses

---

## Implementation Plan

### Phase 1: Quick Wins (30-50% reduction) - 1-2 hours

1. **Fix Admin App Caching** (Highest impact if admin is major source)
   - **File:** `dealy-admin-app/src/api/strapiClient.ts`
   - **Impact:** 30-50% reduction (if admin is major source)
   - **Time:** 30 minutes

2. **Increase Search API revalidation** (60s → 300s)
   - **Files:** `app/api/search/route.ts`, `app/search/page.tsx`
   - **Impact:** 20-30% reduction
   - **Time:** 15 minutes

3. **Increase Merchant Page revalidation** (300s → 3600s)
   - **Files:** `app/shop/[id]/page.tsx`, `src/lib/seo.server.ts`
   - **Impact:** 30-40% reduction
   - **Time:** 30 minutes

4. **Increase Merchant Coupon API revalidation** (300s → 3600s)
   - **Files:** `app/api/merchant-coupon/route.ts`, `src/lib/coupon-queries.ts`
   - **Impact:** 10-20% reduction
   - **Time:** 15 minutes

**Total Estimated Reduction:** **50-70%** of current API calls

### Phase 2: Advanced Optimizations (Additional 10-20%) - 2-3 hours

5. **Enable Strapi Response Caching**
   - **Impact:** Faster responses, fewer database queries
   - **Time:** 1 hour

6. **Optimize Query Patterns**
   - Reduce unnecessary populates
   - Use field selection more aggressively
   - **Time:** 1-2 hours

---

## Expected Results

### Before Optimization
- **TW:** >100K calls/month
- **HK:** ~100K+ calls/month (projected)
- **Total:** ~200K+ calls/month
- **Plan Needed:** Pro ($75/month) ✅

### After Optimization (Phase 1)
- **TW:** ~30-50K calls/month (50-70% reduction)
- **HK:** ~30-50K calls/month
- **Total:** ~60-100K calls/month
- **Plan Needed:** Pro ($75/month) ✅ **But with 90% headroom**

### After Optimization (Phase 2)
- **TW:** ~25-40K calls/month
- **HK:** ~25-40K calls/month
- **Total:** ~50-80K calls/month
- **Plan Needed:** Pro ($75/month) ✅ **With 92-95% headroom**

---

## Recommendation

### Immediate: Upgrade to Pro Plan
- **TW alone exceeds Essential limit** → Pro required
- **Cost:** $75/month
- **Limit:** 1M calls/month (plenty of headroom)

### Then: Implement Optimizations
- **Goal:** Reduce usage by 50-70%
- **Benefit:** 
  - Faster site (longer cache = faster pages)
  - Lower risk (90%+ headroom)
  - Better performance overall
- **Time:** 1-2 hours for Phase 1

### Long-term Strategy
1. ✅ **Upgrade to Pro** (required now)
2. ✅ **Implement Phase 1 optimizations** (reduce usage)
3. 📊 **Monitor for 1 month** (track actual reduction)
4. 💰 **Consider:** If usage drops to <100K/month, could downgrade to Essential (but unlikely with 2 markets)

---

## Next Steps

1. ✅ **Upgrade to Pro Plan** (required immediately)
2. 🔧 **Implement Phase 1 optimizations** (I can help with this)
3. 📊 **Monitor API usage** for 1 month
4. 🎯 **Target:** Reduce to <200K/month (80% headroom on Pro plan)

Would you like me to implement the Phase 1 optimizations now?
