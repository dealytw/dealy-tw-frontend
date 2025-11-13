# Security Audit: API Key Exposure Check

## Summary
✅ **All server-side fetches are properly secured. No API keys are exposed to the client.**

## Findings

### ✅ Server-Side Fetches (Secure)
All Strapi API calls are made server-side using `strapiFetch` from `@/lib/strapi.server.ts`:
- **Protected by `'server-only'` import** - Prevents client-side usage
- **Uses server-only env vars**: `STRAPI_TOKEN` or `STRAPI_API_TOKEN`
- **All page components** (shop, category, special-offers, blog, etc.) use server-side fetching
- **All API routes** (`/api/search`, `/api/hotstore`, `/api/merchant-coupon`, etc.) use server-side fetching

### ✅ Client-Side Fetches (Secure)
All client-side fetches go through Next.js API routes (server-side):
- `SearchDropdown.tsx` → `/api/search` ✅
- `NavigationMenu.tsx` → `/api/hotstore` ✅
- `RelatedMerchantCouponCard.tsx` → `/api/merchant-coupon` ✅
- `DealyCouponCard.tsx` → `/api/coupons/${id}/track-click` ✅

**No direct Strapi API calls from client components.**

### ✅ Protected Files
1. **`src/lib/strapi.server.ts`**
   - Has `'server-only'` import
   - Uses `process.env.STRAPI_TOKEN` (server-only)
   - All imports use this file

2. **`src/lib/strapi.ts`** (Legacy/Unused)
   - ✅ **Fixed**: Added `'server-only'` import to prevent accidental client usage
   - Uses `process.env.STRAPI_TOKEN` (server-only)
   - Not currently imported anywhere (appears to be legacy code)

### ✅ Environment Variables
- **Server-only (secure)**: `STRAPI_TOKEN`, `STRAPI_API_TOKEN`, `STRAPI_URL`
- **Public (safe)**: `NEXT_PUBLIC_STRAPI_URL` (only the base URL, no tokens)

### ⚠️ Note on `NEXT_PUBLIC_STRAPI_URL`
The `NEXT_PUBLIC_STRAPI_URL` is used as a fallback in `strapi.server.ts`, but this is safe because:
- It's only used in server-side code (protected by `'server-only'`)
- It's just the base URL, not an API token
- The actual authentication token comes from server-only env vars

## Recommendations
1. ✅ **Already implemented**: All server-side fetches use `strapi.server.ts` with `'server-only'` protection
2. ✅ **Already implemented**: All client-side fetches go through Next.js API routes
3. ✅ **Fixed**: Added `'server-only'` to `strapi.ts` to prevent accidental client usage

## Conclusion
**No security issues found.** All API keys are properly secured server-side, and client components only make requests to Next.js API routes (which are server-side).

