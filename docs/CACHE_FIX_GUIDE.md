# Cache Fix Guide - Restoring Cloudflare Caching

## Current Problem

Your cache headers show:
```
Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate
CF-Cache-Status: BYPASS
X-Vercel-Cache: MISS
```

**This means:**
- ❌ Cloudflare is NOT caching your pages
- ❌ Every request hits Vercel origin (slower, more expensive)
- ❌ No edge caching benefits

## Root Cause

Next.js ISR pages should automatically send proper cache headers, but Vercel may override them in certain conditions:
1. **Preview/Development deployments** - Always send `no-cache`
2. **During revalidation** - Temporarily sends `no-cache` (normal)
3. **Vercel settings** - May have caching disabled
4. **Missing explicit headers** - Middleware needs to set them

## Solution Applied

### 1. Updated Middleware (`middleware.ts`)

Added explicit cache headers for ISR pages:

```typescript
// Set cache headers based on page type
- Homepage: 1 hour cache
- Merchant pages: 6 hours cache  
- Blog pages: 24 hours cache
- Category pages: 1 hour cache
- Search pages: No cache (SSR)
```

**Cache Headers Added:**
```
Cache-Control: public, s-maxage={time}, stale-while-revalidate=86400, max-age=0
```

**What this means:**
- `public` - Can be cached by CDN (Cloudflare)
- `s-maxage=3600` - Cache at edge for 1 hour (or page-specific time)
- `stale-while-revalidate=86400` - Serve stale content while revalidating (up to 24h)
- `max-age=0` - Browser should revalidate (but CDN caches)

### 2. Verify Vercel Settings

Check your Vercel project settings:

1. Go to **Vercel Dashboard** → Your Project → **Settings** → **General**
2. Check **"Edge Network"** section
3. Ensure **"Caching"** is enabled
4. Check **"Build & Development Settings"**
   - Ensure **"Framework Preset"** is set to **Next.js**
   - Check **"Output Directory"** (should be empty/default)

### 3. Verify Deployment Type

Make sure you're checking **Production** deployment, not Preview:

- ✅ Production: `https://dealy.tw/` (should cache)
- ❌ Preview: `https://dealy-tw-*.vercel.app/` (won't cache)

## Testing After Fix

### Step 1: Deploy Changes

```bash
cd dealy-tw-frontend
git add middleware.ts
git commit -m "Add cache headers for ISR pages"
git push origin main
```

### Step 2: Wait for Deployment

Wait for Vercel to deploy (check Vercel dashboard).

### Step 3: Test Cache Headers

Run the PowerShell script:
```powershell
cd dealy-tw-frontend
.\check-cache-headers.ps1
```

**Expected Results (GOOD):**
```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400, max-age=0
CF-Cache-Status: HIT (or MISS on first request)
X-Vercel-Cache: HIT (or MISS on first request)
```

**Bad Results (Still broken):**
```
Cache-Control: private, no-cache, no-store, max-age=0
CF-Cache-Status: BYPASS
```

### Step 4: Test Multiple Requests

1. **First Request** (should be MISS, then cached):
```powershell
$r = Invoke-WebRequest -Uri "https://dealy.tw/" -Method Head -UseBasicParsing
$r.Headers['CF-Cache-Status']  # Should be "MISS"
```

2. **Second Request** (should be HIT):
```powershell
$r = Invoke-WebRequest -Uri "https://dealy.tw/" -Method Head -UseBasicParsing
$r.Headers['CF-Cache-Status']  # Should be "HIT"
```

## Additional Fixes (If Still Not Working)

### Option A: Check Vercel Environment Variables

Ensure you don't have:
- `VERCEL_ENV=preview` (should be `production`)
- `NEXT_PUBLIC_VERCEL_ENV=preview` (should be `production`)

### Option B: Force Cache Headers in `next.config.ts`

If middleware doesn't work, add to `next.config.ts`:

```typescript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate=86400, max-age=0',
        },
      ],
    },
  ];
}
```

**⚠️ Warning:** This applies to ALL pages. Use middleware approach instead (more flexible).

### Option C: Check Cloudflare Settings

1. Go to **Cloudflare Dashboard** → Your Domain → **Caching** → **Configuration**
2. Ensure **"Caching Level"** is set to **"Standard"** or **"Aggressive"**
3. Check **"Browser Cache TTL"** - Should be **"Respect Existing Headers"**

## Expected Cache Behavior

### After Fix:

| Page Type | Cache Time | Revalidation |
|-----------|------------|--------------|
| Homepage | 1 hour | Every hour |
| Merchant | 6 hours | Every 6 hours |
| Blog | 24 hours | Every 24 hours |
| Category | 1 hour | Every hour |
| Search | No cache | Always fresh (SSR) |

### Cache Flow:

```
User Request
  ↓
Cloudflare (checks cache)
  ↓
  ├─ HIT → Return cached page (fast!)
  └─ MISS → Forward to Vercel
      ↓
      Vercel Edge (checks ISR cache)
      ↓
      ├─ HIT → Return cached page
      └─ MISS → Generate page (ISR)
          ↓
          Return page + Cache headers
          ↓
          Cloudflare caches it
```

## Monitoring

### Check Cloudflare Cache Hit Ratio:

1. Go to **Cloudflare Dashboard** → **Analytics** → **Caching**
2. Look for **"Cache Hit Ratio"**
3. Should be **>80%** after fix

### Check Vercel Analytics:

1. Go to **Vercel Dashboard** → **Analytics**
2. Check **"Edge Cache Hit Rate"**
3. Should increase after fix

## Troubleshooting

### If cache headers still show `no-cache`:

1. **Check deployment type**: Make sure it's Production, not Preview
2. **Clear Cloudflare cache**: Cloudflare → Caching → Purge Everything
3. **Wait 5 minutes**: Let changes propagate
4. **Test again**: Run `check-cache-headers.ps1`

### If CF-Cache-Status is always BYPASS:

1. **Check Cloudflare SSL/TLS**: Should be "Full" or "Full (strict)"
2. **Check Cloudflare Page Rules**: May have rules bypassing cache
3. **Check Cloudflare Transform Rules**: May be modifying headers

### If X-Vercel-Cache is always MISS:

1. **Check Vercel project settings**: Ensure caching is enabled
2. **Check deployment**: Must be Production deployment
3. **Check Next.js version**: Should be 13+ for proper ISR support

## Summary

✅ **Fixed**: Middleware now adds explicit cache headers  
✅ **Next**: Deploy and test  
✅ **Expected**: `CF-Cache-Status: HIT` after first request  
✅ **Monitor**: Check Cloudflare cache hit ratio  

After deploying, your pages should cache properly and Cloudflare will serve them from edge, making your site faster and reducing Vercel costs.

