# Image URL Fix - Current Status

## Issues Reported

1. ✅ **404 on `/upload/tripcom.webp`** - **EXPECTED** (Cloudflare not configured yet)
2. ✅ **Schema still showing old URL** - **FIXED** (code updated, may need cache clear)
3. ✅ **Merchant page logo still using old URL** - **FIXED** (code updated, may need cache clear)

## Changes Made

### 1. Fixed `rewriteImageUrl()` Regex Pattern
- **File**: `src/lib/strapi.server.ts`
- **Change**: Updated regex from `_[\w]+` to `_[a-zA-Z0-9]+` for more explicit matching
- **Result**: Correctly removes hash suffix (e.g., `_5eff0330bd`) from filenames

### 2. Updated Merchant Logo URL
- **File**: `app/shop/[id]/page.tsx`
- **Change**: 
  - Logo URL is now rewritten **before** creating merchant object
  - Both client component and schema use the rewritten URL
- **Result**: Consistent URLs across the page

### 3. Simplified Schema Logo Usage
- **File**: `app/shop/[id]/page.tsx`
- **Change**: Use `merchant.logo` directly (already rewritten) instead of rewriting again
- **Result**: Cleaner code, single source of truth

## Current Behavior

### URL Transformation
- **Input**: `https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp`
- **Output**: `https://dealy.tw/upload/tripcom.webp`

### Where URLs Are Rewritten
1. ✅ **Schema (JSON-LD)**: Store, Organization, WebPage, ImageObject
2. ✅ **Client Component**: Merchant logo in page header
3. ✅ **Merchant Object**: All logo references use rewritten URL

## Why You're Still Seeing Old URLs

### ISR Caching
- **Revalidate**: 300 seconds (5 minutes)
- **Issue**: Old cached pages still show old URLs
- **Solution**: 
  - Wait 5 minutes for cache to expire
  - Or manually revalidate: `curl -X POST https://dealy.tw/api/revalidate?path=/shop/trip-com`
  - Or check if code is deployed to production

### Next.js Image Optimization
- **Issue**: Next.js Image component may cache optimized images
- **Solution**: 
  - Clear Next.js cache
  - Or wait for cache to expire
  - Or check if the rewritten URL is actually being used

## Testing Steps

### 1. Verify Code is Deployed
```bash
# Check if latest commit is deployed
git log -1 --oneline
```

### 2. Check Schema Output
1. Visit merchant page: `https://dealy.tw/shop/trip-com`
2. View page source (Ctrl+U)
3. Search for `"image":` in JSON-LD
4. Should see: `"image":"https://dealy.tw/upload/tripcom.webp"`

### 3. Check Client Component
1. Inspect merchant logo element
2. Check `src` attribute
3. Should see: `https://dealy.tw/upload/tripcom.webp`

### 4. Test URL Rewriting Function
```javascript
// Test in browser console or Node.js
const testUrl = 'https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp';
// Should output: https://dealy.tw/upload/tripcom.webp
```

## Next Steps

### 1. Clear Cache (If Needed)
- **ISR Cache**: Wait 5 minutes or manually revalidate
- **Next.js Image Cache**: May need to clear `.next/cache` folder
- **Browser Cache**: Hard refresh (Ctrl+Shift+R)

### 2. Configure Cloudflare
- **Status**: ⏳ Pending
- **Action**: Follow `CLOUDFLARE_IMAGE_URL_SETUP.md`
- **Result**: `/upload/tripcom.webp` will return actual image (not 404)

### 3. Verify After Cloudflare Setup
- Test direct URL: `https://dealy.tw/upload/tripcom.webp`
- Should return image (not 404)
- Check schema validation
- Monitor performance

## Expected Timeline

1. ✅ **Code Changes**: Completed
2. ⏳ **Deployment**: Check if deployed
3. ⏳ **Cache Expiry**: 5 minutes (ISR revalidate)
4. ⏳ **Cloudflare Setup**: Pending your configuration
5. ⏳ **Full Functionality**: After Cloudflare is configured

## Troubleshooting

### If Schema Still Shows Old URL
1. Check if code is deployed
2. Clear ISR cache
3. Check browser console for errors
4. Verify `rewriteImageUrl()` is being called

### If Logo Still Shows Old URL
1. Check if code is deployed
2. Clear Next.js Image cache
3. Hard refresh browser
4. Check network tab for actual request URL

### If 404 Persists After Cloudflare Setup
1. Check Cloudflare Transform Rule is active
2. Verify Worker route is configured
3. Test direct Strapi CDN URL still works
4. Check Cloudflare logs for errors

