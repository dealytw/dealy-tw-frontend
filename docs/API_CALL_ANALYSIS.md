# API Call Consumption Analysis

## Summary

✅ **Frontend**: No constant API calls - all data fetching is server-side with ISR caching
✅ **Cloudflare**: Does NOT consume API calls when serving cached pages
✅ **Admin App**: Only makes API calls on user actions, not constantly

---

## 1. Frontend API Call Analysis

### Server-Side Rendering (SSR) with ISR
All data fetching happens **server-side** during page generation:

- **Merchant Pages**: Fetch on page generation (cached for 6 hours)
- **Category Pages**: Fetch on page generation (cached for 1 hour)
- **Legal Pages**: Fetch on page generation (cached for 24 hours)
- **Special Offer Pages**: Fetch on page generation (cached for 1 hour)
- **Homepage**: Fetch on page generation (cached for 1 hour)

### Client-Side Components
**No constant API calls found:**

1. **SearchDropdown** (`src/components/SearchDropdown.tsx`)
   - ✅ Only makes API calls when user types (debounced, 300ms)
   - ✅ Uses client-side cache for instant results
   - ✅ No polling or intervals

2. **DealyCouponCard** (`src/components/DealyCouponCard.tsx`)
   - ✅ `setInterval` only updates UI timer (every 1 second)
   - ✅ No API calls in the interval
   - ✅ API call only on coupon click (tracking)

3. **Page Client** (`app/page-client.tsx`)
   - ✅ `setInterval` only for auto-scrolling animation (UI only)
   - ✅ No API calls

4. **SearchProvider** (`src/components/SearchProvider.tsx`)
   - ✅ Uses data from server (passed as props)
   - ✅ No client-side fetching
   - ✅ No polling

### ISR Caching Behavior
```typescript
// Example from merchant page
strapiFetch('/api/merchants?...', { 
  revalidate: 21600, // 6 hours
  tag: `merchant:${id}` 
})
```

**How it works:**
1. **First request**: Fetches from Strapi API → Caches page
2. **Subsequent requests (within 6 hours)**: Serves from cache → **NO API CALL**
3. **After 6 hours**: Next request triggers background regeneration → Fetches from API
4. **During regeneration**: Serves stale cache to users → **NO API CALL for users**

---

## 2. Cloudflare + ISR Behavior

### When Cloudflare Serves Cached Pages

**Cloudflare does NOT consume API calls when serving cached pages.**

```
User Request
  ↓
Cloudflare CDN (checks cache)
  ↓
✅ Cache HIT → Serves cached HTML → NO API CALL
  OR
❌ Cache MISS → Forwards to Vercel Edge
  ↓
Vercel Edge (checks ISR cache)
  ↓
✅ Cache HIT → Serves cached page → NO API CALL
  OR
❌ Cache MISS → Next.js Server generates page
  ↓
Next.js Server (checks ISR cache)
  ↓
✅ Cache HIT → Serves cached page → NO API CALL
  OR
❌ Cache MISS → Fetches from Strapi API → API CALL
```

### Cache Headers (from `middleware.ts`)
```typescript
Cache-Control: public, s-maxage=28800, stale-while-revalidate=86400, max-age=0
```

**What this means:**
- `s-maxage=28800` (8 hours): Cloudflare caches for 8 hours
- `stale-while-revalidate=86400`: Serve stale content while revalidating (up to 24h)
- **During cache period**: Cloudflare serves cached HTML → **NO API CALL**

### API Calls Only Happen When:
1. **Cache expires** (after `s-maxage` time)
2. **Manual revalidation** (via `/api/revalidate` endpoint)
3. **First request** (no cache exists)

**Conclusion**: Cloudflare does NOT consume API calls when serving cached pages. API calls only happen during cache regeneration (background, not on every request).

---

## 3. Admin App API Call Analysis

### HreflangMatcher (`src/pages/HreflangMatcher.tsx`)

**API calls only on user actions:**

1. **On page load** (once):
   ```typescript
   useEffect(() => {
     fetchMarkets() // Fetches markets once
   }, []) // Empty deps = only on mount
   ```

2. **On "Batch Match" button click**:
   - Fetches all entries (4 API calls total)
   - Performs client-side matching
   - Updates entries via PUT requests

3. **On "Load Entries" button click** (Manual Edit tab):
   - Fetches all entries for manual editing
   - No constant polling

4. **On "Save All" button click**:
   - Batch updates all changed entries
   - No constant polling

**✅ No constant API calls when page is open but not in use**

### CouponEditor (`src/pages/CouponEditor.tsx`)

**API calls only on:**
1. **Page load** (once per market change)
2. **User actions** (create, update, delete coupons)
3. **Filter changes** (client-side filtering, no API calls)

**✅ No constant API calls when page is open but not in use**

### Caching in Admin App (`src/api/strapiClient.ts`)

```typescript
const CACHE_TTL = 60000; // 1 minute cache for admin
```

**GET requests are cached for 1 minute:**
- Reduces duplicate API calls within 1 minute
- Cache is cleared on POST/PUT/DELETE operations
- **✅ Prevents unnecessary API calls**

---

## 4. API Call Consumption Summary

### Frontend (TW/HK)
| Scenario | API Calls? |
|----------|------------|
| User visits cached page | ❌ NO |
| Cloudflare serves cached page | ❌ NO |
| Vercel serves cached ISR page | ❌ NO |
| Page regeneration (background) | ✅ YES (only during revalidation) |
| User types in search | ✅ YES (debounced, only when typing) |
| User clicks coupon | ✅ YES (tracking only) |

### Admin App
| Scenario | API Calls? |
|----------|------------|
| Page open but idle | ❌ NO |
| User clicks "Batch Match" | ✅ YES (4 calls + updates) |
| User clicks "Load Entries" | ✅ YES (4 calls) |
| User clicks "Save All" | ✅ YES (batch updates) |
| Cached GET request (< 1 min) | ❌ NO (uses cache) |

---

## 5. Recommendations

### ✅ Current Setup is Optimal

1. **Frontend**: All data fetching is server-side with ISR
2. **Cloudflare**: Properly caches pages, no API calls for cached content
3. **Admin App**: Only makes API calls on user actions, has caching

### ⚠️ Potential Issues to Watch

1. **Search API calls**: Only happens when user types (acceptable)
2. **Category page coupon fetching**: 
   - Fetches coupon for each merchant in the category (server-side, ISR cached)
   - Uses `Promise.all` for parallel fetching (efficient)
   - Each coupon fetch is cached for 5 minutes
   - **Impact**: If a category has 50 merchants, that's 50 API calls during page generation (but only once per 5 minutes due to caching)
   - **Status**: Acceptable for current scale, but could be optimized by fetching all coupons in one query
3. **Admin app cache**: 1 minute TTL is reasonable for admin use

### 📊 Expected API Call Volume

**Frontend (per day, assuming 10,000 page views):**
- Cached pages: ~0 API calls (served from cache)
- Cache regeneration: ~100-200 API calls (background, during revalidation)
- Search queries: ~500-1000 API calls (user-initiated)

**Admin App:**
- Idle: 0 API calls
- Active use: ~10-50 API calls per session (user-initiated)

---

## Conclusion

✅ **No constant API call consumption found**
✅ **Cloudflare does NOT consume API calls when serving cached pages**
✅ **Admin app only makes API calls on user actions**
✅ **All frontend data fetching is server-side with proper ISR caching**

The setup is optimal and efficient! 🎉

