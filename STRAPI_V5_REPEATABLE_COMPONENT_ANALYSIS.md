# Strapi v5 Repeatable Component vs Relations Analysis

## Key Question: Why Do Repeatable Components Cause 404 But Relations Don't?

### Strapi v5 Data Storage Differences

#### 1. **Relations** (Works ✅)
```typescript
// Stored as: References to separate entities
"populate[related_merchants][populate][logo][fields][0]": "url"
```
- Relations are stored as **foreign keys/references**
- Each relation is a separate database entity
- Populate fetches related entities by ID
- **Next.js can handle this during static generation**

#### 2. **Single Components** (Works ✅ - Homepage Example)
```typescript
// Homepage uses single components (not repeatable)
"populate[hero][populate][background][fields][0]": "url"
"populate[category][populate][merchants][populate][logo][fields][0]": "url"
```
- Single components are stored as **embedded JSON objects**
- One-to-one relationship
- **Next.js handles this fine**

#### 3. **Repeatable Components** (Breaks ❌ - Blog Page)
```typescript
// Blog uses repeatable components (arrays)
"populate[blog_sections][populate][blog_image][fields][0]": "url"
```
- Repeatable components are stored as **JSON arrays**
- Each item in array needs nested populate
- **Next.js route generation may timeout/fail with arrays**

## Why Repeatable Components Cause Issues

### Hypothesis 1: Query Complexity
- **Relations**: Strapi fetches by ID (fast, indexed)
- **Repeatable Components**: Strapi must:
  1. Parse JSON array
  2. For each item, fetch nested media
  3. Return combined result
- **Result**: More complex query → longer execution → timeout during static generation

### Hypothesis 2: Next.js Static Generation
- `force-static` tries to generate page at **build time**
- Complex queries on arrays may:
  - Timeout during build
  - Cause silent failures
  - Result in route not being generated → 404

### Hypothesis 3: Strapi v5 Populate Behavior
- Repeatable components in v5 may require different populate syntax
- Array handling might be different from v4
- Nested populate on arrays might not be optimized

## Solutions to Test

### Solution 1: Change Rendering Strategy
```typescript
// Instead of force-static, use force-dynamic
export const dynamic = 'force-dynamic'; // Render on-demand, not at build time
```
**Pros:**
- Avoids build-time generation
- Query can take longer (runtime, not build)
- Route always recognized

**Cons:**
- No static generation (slower first load)
- Higher server load

### Solution 2: Alternative Strapi v5 Populate Syntax
```typescript
// Try using populate=* for repeatable component only
"populate[blog_sections]": "*",  // Populate all fields including nested
```
**Note:** This might work but goes against our explicit field selection pattern.

### Solution 3: Use generateStaticParams
```typescript
export async function generateStaticParams() {
  // Pre-generate routes at build time
  // This might help Next.js recognize routes even with complex queries
}
```

### Solution 4: Add Timeout/Error Handling
```typescript
// Add timeout to fetch
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const blogRes = await strapiFetch(..., { signal: controller.signal });
} catch (error) {
  // Handle timeout gracefully
}
```

### Solution 5: Split Query More Granularly
```typescript
// Instead of one query with all populates, split into:
// 1. Basic fields
// 2. blog_sections text
// 3. blog_sections images (separate)
// 4. blog_table (separate)
// 5. blog_coupon (separate)
```

## Recommended Testing Order

1. **Test Solution 1**: Change to `force-dynamic` - easiest, quickest test
2. **If that works**: Keep it or try to optimize back to static
3. **If that doesn't work**: Try Solution 5 (more granular splits)
4. **Last resort**: Solution 3 (generateStaticParams)

## Why ISR/SSR/SSG Matters

- **SSG (`force-static`)**: Generates at build time → timeout breaks route
- **ISR (`revalidate`)**: Regenerates on-demand → might work better
- **SSR (`force-dynamic`)**: Renders on each request → no build-time issues

**The issue is likely build-time static generation failing, not runtime fetching.**

