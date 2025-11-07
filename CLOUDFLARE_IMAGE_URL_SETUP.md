# Cloudflare Image URL Setup Guide

## Overview
After implementing frontend URL rewriting, you need to configure Cloudflare to serve images from the custom domain path (`/upload/*`).

## Current Status
- ✅ **Frontend**: URLs are rewritten to `https://dealy.tw/upload/tripcom.webp`
- ⏳ **Cloudflare**: Needs configuration to serve files from `/upload/*`

## Option A: Cloudflare Transform Rules (Recommended for Strapi CDN)

### Step 1: Access Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your domain (`dealy.tw`)
3. Navigate to **Rules** → **Transform Rules** → **Rewrite URL**

### Step 2: Create Transform Rule

**Rule Name**: `Rewrite Image URLs to Strapi CDN`

**When incoming requests match**:
```
(http.request.uri.path matches "^/upload/")
```

**Then rewrite to**:
```
Dynamic: concat("https://ingenious-charity-13f9502d24.media.strapiapp.com", http.request.uri.path)
```

**Or use Static rewrite** (if pattern is consistent):
- **Path**: `/upload/tripcom.webp` → `/tripcom_5eff0330bd.webp`
- **Full URL**: `https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp`

### Step 3: Handle Filename Mapping

**Problem**: Frontend outputs clean filenames (`tripcom.webp`), but Strapi CDN has hashed filenames (`tripcom_5eff0330bd.webp`).

**Solution Options**:

#### Option 3a: Pattern-Based Rewrite (If hash is consistent)
If the hash pattern is predictable, use regex in Transform Rule:
```
Path: /upload/(.*)\.webp
Rewrite to: /$1_5eff0330bd.webp
```

#### Option 3b: Cloudflare Workers (Recommended)
Create a Worker to handle filename mapping:

**Worker Script** (`image-proxy.js`):
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Only handle /upload/* paths
    if (!url.pathname.startsWith('/upload/')) {
      return fetch(request);
    }
    
    // Extract filename from path
    // e.g., /upload/tripcom.webp -> tripcom.webp
    const cleanFilename = url.pathname.replace('/upload/', '');
    
    // Map clean filename to Strapi CDN filename
    // Option 1: Use a KV store for mapping
    // Option 2: Try multiple hash variations
    // Option 3: Fetch from Strapi API to get actual filename
    
    // For now, try common hash pattern
    const baseName = cleanFilename.replace('.webp', '');
    const strapiUrl = `https://ingenious-charity-13f9502d24.media.strapiapp.com/${baseName}_*.webp`;
    
    // Fetch from Strapi CDN
    const response = await fetch(strapiUrl, {
      headers: request.headers,
    });
    
    return response;
  }
}
```

**Deploy Worker**:
1. Go to **Workers & Pages** → **Create Application**
2. Name: `image-proxy`
3. Paste the script above
4. Add route: `dealy.tw/upload/*` → `image-proxy`

## Option B: Serve from Origin Server (Best Performance)

### Step 1: Upload Files to Origin
1. Sync Strapi uploads to your origin server's `/upload/` directory
2. Ensure clean filenames (without hash suffixes)
3. Set proper file permissions

### Step 2: Configure Cloudflare
1. **Page Rules** (if needed):
   - URL Pattern: `dealy.tw/upload/*`
   - Settings:
     - Cache Level: Standard
     - Edge Cache TTL: 1 month
     - Browser Cache TTL: 1 month

2. **Caching**:
   - Cloudflare will automatically cache files from origin
   - No Transform Rules needed

### Step 3: File Sync Script
Create a script to sync files from Strapi to origin:

```bash
#!/bin/bash
# sync-images.sh

STRAPI_CDN="https://ingenious-charity-13f9502d24.media.strapiapp.com"
ORIGIN_UPLOAD="/var/www/dealy.tw/public/upload"

# Fetch file list from Strapi (if API available)
# Or manually sync specific files

# Example: Download and rename
curl -o "$ORIGIN_UPLOAD/tripcom.webp" \
  "$STRAPI_CDN/tripcom_5eff0330bd.webp"
```

## Option C: Cloudflare R2 Storage (Most Scalable)

### Step 1: Create R2 Bucket
1. Go to **R2** → **Create Bucket**
2. Name: `dealy-images`
3. Enable public access

### Step 2: Upload Files
1. Sync Strapi images to R2 bucket
2. Use clean filenames (without hash)
3. Set public read permissions

### Step 3: Connect R2 to Custom Domain
1. Go to **R2** → **Manage R2 API Tokens**
2. Create public bucket
3. Use **Custom Domain** feature:
   - Domain: `dealy.tw`
   - Path: `/upload/*`
   - Point to R2 bucket

### Step 4: Configure Caching
- R2 automatically provides CDN caching
- Set appropriate Cache-Control headers

## Testing

### Test URL Rewriting
1. Visit a merchant page: `https://dealy.tw/shop/trip-com`
2. View page source
3. Check JSON-LD schema:
   ```json
   {
     "@type": "Store",
     "image": "https://dealy.tw/upload/tripcom.webp"
   }
   ```

### Test File Accessibility
1. Direct URL test: `https://dealy.tw/upload/tripcom.webp`
2. Should return the image (not 404)
3. Check response headers:
   - `Content-Type: image/webp`
   - `Cache-Control: public, max-age=...`

### Test Performance
1. Use [PageSpeed Insights](https://pagespeed.web.dev/)
2. Verify images load correctly
3. Check Core Web Vitals

## Recommended Approach

**For Quick Setup**: **Option A (Transform Rules)** with Cloudflare Workers
- Fastest to implement
- No file sync needed
- Handles filename mapping dynamically

**For Best Performance**: **Option B (Origin Server)**
- Best caching control
- No external dependencies
- Requires file sync setup

**For Scale**: **Option C (R2 Storage)**
- Unlimited bandwidth
- Built-in CDN
- Best for high traffic

## Troubleshooting

### Issue: 404 Not Found
- **Check**: Transform Rule is active
- **Check**: Worker route is configured
- **Check**: File exists on origin/R2

### Issue: Wrong Image Displayed
- **Check**: Filename mapping is correct
- **Check**: Hash suffix removal logic
- **Check**: Transform Rule regex pattern

### Issue: Slow Loading
- **Check**: Cloudflare caching is enabled
- **Check**: Origin server performance
- **Check**: R2 bucket configuration

## Next Steps

1. ✅ Frontend URL rewriting (Completed)
2. ⏳ Choose Cloudflare option (A, B, or C)
3. ⏳ Configure Cloudflare rules/workers
4. ⏳ Test image accessibility
5. ⏳ Monitor performance

## Support

If you need help with Cloudflare configuration:
- [Cloudflare Transform Rules Docs](https://developers.cloudflare.com/rules/transform/)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)

