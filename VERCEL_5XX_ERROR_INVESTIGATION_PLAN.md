# Vercel 5xx Error Investigation & Fix Plan

## Current Status
- **Error Rate**: 66.8% for Vercel Functions
- **Pattern**: Intermittent spikes reaching near 100% error rates
- **Timeframe**: Last 6 hours showing frequent spikes

---

## Phase 1: Immediate Investigation (Do First)

### 1.1 Check Vercel Logs
**Action**: Go to Vercel Dashboard → Observability → Logs
- Filter by status: `5xx`
- Filter by time: Last 6 hours
- Look for:
  - Error messages
  - Stack traces
  - Which routes are failing
  - Common patterns

**Expected Findings**:
- Specific API routes causing errors
- Strapi connection failures
- Timeout errors
- Memory/CPU issues

### 1.2 Check Function Execution Times
**Action**: Vercel Dashboard → Observability → Functions
- Check execution times
- Look for timeouts (>10s for Hobby, >60s for Pro)
- Identify slow functions

**Potential Issues**:
- `strapiFetch` calls timing out
- ISR revalidation taking too long
- Complex queries with large datasets

### 1.3 Check Strapi API Health
**Action**: Test Strapi endpoints directly
```bash
# Check if Strapi is responding
curl -H "Authorization: Bearer $STRAPI_TOKEN" \
  https://cms.dealy.tw/api/merchants?pagination[pageSize]=1

# Check response times
time curl -H "Authorization: Bearer $STRAPI_TOKEN" \
  https://cms.dealy.tw/api/hotstores?filters[market][key][$eq]=tw
```

**Potential Issues**:
- Strapi API down or slow
- Authentication token expired
- Rate limiting

---

## Phase 2: Code-Level Investigation

### 2.1 Review Error Handling in `strapiFetch`
**File**: `src/lib/strapi.server.ts`

**Current Issue**:
```typescript
if (!res.ok) {
  const text = await res.text();
  throw new Error(`Strapi ${res.status}: ${url}\n${text.slice(0, 600)}`);
}
```

**Problems**:
- Throws unhandled errors → 500 responses
- No retry logic for transient failures
- No timeout handling
- No circuit breaker pattern

**Fix Needed**:
1. Add try-catch in all server components using `strapiFetch`
2. Add timeout to fetch requests
3. Add retry logic for 5xx errors
4. Add better error logging

### 2.2 Check All API Routes
**Files to Review**:
- `app/api/revalidate/route.ts` - Revalidation endpoint
- `app/api/upload/[...path]/route.ts` - Image proxy
- `app/api/hotstore/route.ts` - Hotstore API
- `app/api/merchant-coupon/route.ts` - Merchant coupons
- `app/api/search/route.ts` - Search API
- `app/api/contact/route.ts` - Contact form
- `app/api/submit-coupon/route.ts` - Submit coupon
- `app/api/coupons/[id]/track-click/route.ts` - Click tracking

**Check For**:
- Missing error handling
- Unhandled promise rejections
- Missing try-catch blocks
- Timeout issues

### 2.3 Check Server Components
**Files to Review**:
- `app/shop/[id]/page.tsx` - Merchant pages (most likely culprit)
- `app/page.tsx` - Homepage
- `app/layout.tsx` - Root layout
- `app/blog/[page_slug]/page.tsx` - Blog pages

**Check For**:
- Unhandled `strapiFetch` errors
- Missing error boundaries
- Promise.all failures not caught
- ISR revalidation errors

---

## Phase 3: Specific Fixes

### 3.1 Add Error Handling to `strapiFetch`
**Priority**: HIGH

```typescript
export async function strapiFetch<T>(path: string, init?: NextInit) {
  const baseUrl = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!baseUrl) {
    throw new Error('STRAPI_URL or NEXT_PUBLIC_STRAPI_URL environment variable is required');
  }
  
  const url = `${baseUrl}${path}`;
  const { revalidate, tag, ...rest } = init || {};
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  
  try {
    const res = await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        ...(rest?.headers || {}),
        Authorization: `Bearer ${process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN}`,
      },
      next: revalidate ? { revalidate, tags: tag ? [tag] : [] } : undefined,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`[strapiFetch] Error ${res.status} for ${url}:`, text.slice(0, 600));
      throw new Error(`Strapi ${res.status}: ${url}\n${text.slice(0, 600)}`);
    }
    
    return (await res.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`[strapiFetch] Timeout for ${url}`);
      throw new Error(`Strapi request timeout: ${url}`);
    }
    throw error;
  }
}
```

### 3.2 Add Error Boundaries to Server Components
**Priority**: HIGH

Wrap all `strapiFetch` calls in try-catch:

```typescript
// In app/shop/[id]/page.tsx
try {
  const [merchantRes, couponsRes, hotstoreRes] = await Promise.all([...]);
} catch (error) {
  console.error('[MerchantPage] Error fetching data:', error);
  // Return 404 or error page instead of 500
  notFound();
}
```

### 3.3 Add Retry Logic for Transient Failures
**Priority**: MEDIUM

```typescript
async function strapiFetchWithRetry<T>(path: string, init?: NextInit, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await strapiFetch<T>(path, init);
    } catch (error) {
      if (i === retries) throw error;
      // Only retry on 5xx errors or network errors
      if (error instanceof Error && (
        error.message.includes('500') || 
        error.message.includes('502') ||
        error.message.includes('503') ||
        error.message.includes('504') ||
        error.message.includes('timeout')
      )) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error('Unreachable');
}
```

### 3.4 Add Request Timeout Configuration
**Priority**: MEDIUM

Set appropriate timeouts for different operations:
- Merchant page fetches: 10s
- Hotstore fetches: 5s
- Image proxy: 3s
- Revalidation: 30s

### 3.5 Monitor and Alert
**Priority**: LOW

Set up Vercel alerts for:
- Error rate > 10%
- Function timeout rate > 5%
- 5xx errors > 100/hour

---

## Phase 4: Testing & Validation

### 4.1 Test Error Scenarios
1. **Strapi API Down**: Simulate by using wrong URL
2. **Slow Strapi Response**: Add delay in Strapi
3. **Network Timeout**: Test with slow network
4. **Invalid Data**: Test with malformed Strapi responses

### 4.2 Monitor After Fixes
- Watch Vercel dashboard for 24 hours
- Check error rate trends
- Verify no new error patterns

---

## Phase 5: Optimization (After Fixes)

### 5.1 Reduce Unnecessary Fetches
- Cache hotstore data longer (back to 6 months after verification)
- Use stale-while-revalidate pattern
- Prefetch critical data

### 5.2 Optimize Strapi Queries
- Reduce `populate` depth
- Use `fields` to limit data
- Add pagination limits
- Use `filters` to reduce dataset size

### 5.3 Add Circuit Breaker
- Stop making requests if error rate > 50%
- Fallback to cached data
- Resume after cooldown period

---

## Immediate Actions (Do Now)

1. ✅ **Set hotstore ISR to 5 minutes** - DONE
2. ⏳ **Check Vercel Logs** - Check Observability → Logs for 5xx errors
3. ⏳ **Identify failing routes** - Look at error patterns
4. ⏳ **Add error handling** - Wrap strapiFetch calls in try-catch
5. ⏳ **Add timeouts** - Prevent hanging requests
6. ⏳ **Test fixes** - Deploy and monitor

---

## Expected Outcomes

After implementing fixes:
- Error rate should drop to < 5%
- All 5xx errors should be logged with context
- Failed requests should return appropriate status codes (404, 500, 503)
- Timeouts should be handled gracefully
- Users should see error pages instead of blank screens

---

## Notes

- The 66.8% error rate suggests a systemic issue, not random failures
- Most likely causes:
  1. Strapi API connection issues
  2. Unhandled errors in server components
  3. Timeout issues with long-running requests
  4. Memory/CPU limits exceeded
- The intermittent pattern suggests it might be related to:
  - ISR revalidation triggering errors
  - Concurrent request limits
  - Strapi rate limiting
