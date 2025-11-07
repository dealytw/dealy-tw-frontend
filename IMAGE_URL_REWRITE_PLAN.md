# Image URL Rewrite Plan

## Goal
Convert Strapi CDN image URLs to custom domain URLs:
- **From**: `https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp`
- **To**: `https://dealy.tw/upload/tripcom.webp`

## Analysis

### Current Flow
1. Strapi CMS returns relative URLs: `/uploads/tripcom_5eff0330bd.webp`
2. `absolutizeMedia()` converts to: `https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp`
3. Used in:
   - Schema generation (Store, Organization, WebPage, ImageObject)
   - Next.js `<Image>` components
   - Various pages and components

### Problem
- Strapi CDN URLs are not SEO-friendly
- Hash suffixes (`_5eff0330bd`) make URLs less clean
- Custom domain (`dealy.tw/upload/`) is better for branding and SEO

## Solution Options

### Option A: Frontend URL Rewriting (Recommended) ✅
**Approach**: Create a URL rewriting function that converts Strapi CDN URLs to custom domain URLs.

**Pros**:
- Full control over URL format
- No infrastructure changes needed
- Works immediately
- Can extract clean filenames (remove hash)

**Cons**:
- Need to handle filename extraction logic
- Must apply in multiple places

**Implementation**:
1. Create `rewriteImageUrl()` function in `src/lib/strapi.server.ts`
2. Extract base filename from Strapi URL (remove hash suffix)
3. Convert to `https://{domain}/upload/{clean-filename}`
4. Apply in:
   - Schema generation (Store, Organization, WebPage, ImageObject)
   - Anywhere `absolutizeMedia()` is used for images

**Filename Extraction Logic**:
- Input: `https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp`
- Extract: `tripcom_5eff0330bd.webp`
- Remove hash: `tripcom.webp` (regex: `_[\w]+\.webp` → `.webp`)
- Output: `https://dealy.tw/upload/tripcom.webp`

### Option B: Cloudflare Transform Rules
**Approach**: Use Cloudflare Workers/Transform Rules to rewrite URLs at the edge.

**Pros**:
- Clean separation of concerns
- No frontend code changes
- Edge-level rewriting

**Cons**:
- Requires Cloudflare configuration
- Need to handle file serving/proxying
- Less control over filename extraction

**Implementation**:
1. Frontend outputs clean URLs: `https://dealy.tw/upload/tripcom.webp`
2. Cloudflare Transform Rule rewrites to: `https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp`
3. Cloudflare serves the file

### Option C: Next.js API Route Proxy
**Approach**: Create `/api/upload/[filename]` route that proxies to Strapi CDN.

**Pros**:
- Works without Cloudflare
- Can handle caching

**Cons**:
- Extra API route overhead
- Less clean URLs (`/api/upload/` vs `/upload/`)

## Recommended Approach: Option A (Frontend URL Rewriting)

### Implementation Steps

#### Step 1: Create URL Rewriting Function
**File**: `src/lib/strapi.server.ts`

```typescript
/**
 * Rewrites Strapi CDN image URLs to custom domain URLs
 * Example: https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp
 *       -> https://dealy.tw/upload/tripcom.webp
 */
export function rewriteImageUrl(url: string | null | undefined, domain?: string): string {
  if (!url) return "";
  
  // If already a custom domain URL, return as-is
  if (url.includes('/upload/')) {
    return url;
  }
  
  // Extract filename from Strapi CDN URL
  const urlObj = new URL(url);
  const pathname = urlObj.pathname; // e.g., /tripcom_5eff0330bd.webp
  
  // Remove hash suffix (e.g., _5eff0330bd) from filename
  // Pattern: _[alphanumeric] before file extension
  const cleanFilename = pathname.replace(/_[\w]+(\.[^.]+)$/, '$1');
  // Result: /tripcom.webp
  
  // Get domain from environment or parameter
  const targetDomain = domain || process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw';
  
  // Build clean URL
  return `${targetDomain}/upload${cleanFilename}`;
}
```

#### Step 2: Update Schema Generation
**File**: `app/shop/[id]/page.tsx`

Replace:
```typescript
const pageImage = merchant.logo || undefined;
```

With:
```typescript
const pageImage = merchant.logo ? rewriteImageUrl(merchant.logo, siteUrl) : undefined;
```

Also update:
```typescript
logo: merchant.logo ? rewriteImageUrl(merchant.logo, siteUrl) : undefined,
```

#### Step 3: Update Image URLs Throughout Codebase
Apply `rewriteImageUrl()` in:
- `app/shop/[id]/page.tsx` (schema generation)
- `src/lib/homepage-loader.ts` (homepage images)
- `app/layout.tsx` (search merchants)
- `src/lib/search-actions.ts` (search results)
- Any other places using `absolutizeMedia()` for images

**Note**: Keep `absolutizeMedia()` for non-image media or internal use, but wrap image URLs with `rewriteImageUrl()`.

#### Step 4: Cloudflare Configuration (Optional but Recommended)
Set up Cloudflare to serve files from `/upload/*`:
- **Option 4a**: Proxy to Strapi CDN
  - Transform Rule: `https://dealy.tw/upload/*` → `https://ingenious-charity-13f9502d24.media.strapiapp.com/*`
  - Need to map clean filename back to hashed filename (requires lookup or pattern matching)

- **Option 4b**: Upload files to Cloudflare R2 or origin server
  - Store clean filenames in `/upload/` directory
  - Serve directly from origin
  - Best performance, but requires file sync

## Decision: Frontend or Cloudflare?

**Answer: Both (Hybrid Approach)**

1. **Frontend**: Rewrite URLs in code (schema, components)
   - Clean URLs in HTML/JSON-LD
   - Better SEO
   - No infrastructure dependency

2. **Cloudflare**: Handle file serving (optional)
   - If files are stored on origin: serve directly
   - If files are on Strapi CDN: proxy/rewrite at edge
   - Improves performance and caching

## Next Steps

1. ✅ **Frontend Work** (Required):
   - Create `rewriteImageUrl()` function
   - Apply to schema generation
   - Apply to image components

2. ⏳ **Cloudflare Work** (Optional):
   - Decide: proxy to Strapi CDN or serve from origin
   - Configure Transform Rules or file serving
   - Test file accessibility

## Testing Checklist

- [ ] Schema URLs use custom domain
- [ ] Image components display correctly
- [ ] Files are accessible at new URLs
- [ ] No broken images
- [ ] SEO validation passes
- [ ] Performance not impacted

