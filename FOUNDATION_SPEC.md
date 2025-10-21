# Foundation Spec - Dealy.TW Frontend Development Guidelines

## 🎯 Project Conventions (DO NOT CHANGE LATER)

### Rendering Defaults
- **Content pages** = Server Components + ISR
- **Search/filters** = SSR (`cache: 'no-store'`)
- **Static pages** = SSG (or ISR with long window)

### Caching & Tags
- **Page-level**: `export const revalidate = 300`
- **Fetch-level**: `{ next: { revalidate, tags: ['home' | 'merchant:${slug}' | 'category:${slug}'] } }`
- **On-demand revalidate**: `/api/revalidate` with shared secret

### Populate Policy
- **BAN `populate=*`** - Never use wildcard populate
- **Only use explicit `fields[]`** and minimal `populate[relation][fields][]=url`

### Lists
- **Always include** `pagination[page]`, `pagination[pageSize]`
- **Include any sort fields** in `fields[]`

### Security
- **Strapi token stays server-only** (never `NEXT_PUBLIC_*`)
- **All Strapi fetches** go through server-only helpers

---

## 🔧 Environment & Runtime Setup

### 1. Environment Variables (.env.local)
```bash
STRAPI_URL=https://cms.dealy.tw
STRAPI_API_TOKEN=YOUR_READONLY_TOKEN
NEXT_PUBLIC_SITE_URL=https://www.dealy.tw
REVALIDATE_SECRET=YOUR_SECRET
```

### 2. Next.js Configuration (next.config.js)
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: '.' },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};
module.exports = nextConfig;
```

---

## 📊 Data Layer Architecture

### Server-Only Strapi Helper (`src/lib/strapi.server.ts`)
```typescript
// Central fetch with auth + ISR
export async function strapiFetch<T>(
  path: string, 
  init?: RequestInit & { revalidate?: number; tag?: string }
) {
  const url = `${process.env.STRAPI_URL}${path}`;
  const { revalidate, tag, ...rest } = init || {};
  
  return fetch(url, {
    ...rest,
    headers: {
      ...(rest?.headers || {}),
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
    next: revalidate ? { revalidate, tags: tag ? [tag] : [] } : undefined,
  }).then(r => {
    if (!r.ok) throw new Error(`Strapi error ${r.status}: ${url}`);
    return r.json() as Promise<T>;
  });
}

// Query string builder
export function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k,v]) => { 
    if (v !== undefined && v !== null) sp.set(k, String(v)); 
  });
  return sp.toString();
}

// Media URL absolutizer
export function absolutizeMedia(u?: string | null) {
  if (!u) return "";
  const base = process.env.STRAPI_URL || "";
  return u.startsWith("http") ? u : `${base}${u}`;
}
```

---

## 🏗️ Component Patterns

### Server Component Pattern
```typescript
// app/merchants/[slug]/page.tsx
import { strapiFetch, qs } from '@/lib/strapi.server';

export const revalidate = 300; // 5 minutes ISR

export default async function MerchantPage({ params }: { params: { slug: string } }) {
  const { slug } = await params;
  
  const merchantData = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
    "filters[slug][$eq]": slug,
    "fields[0]": "id",
    "fields[1]": "merchant_name",
    "fields[2]": "slug",
    "populate[logo][fields][0]": "url",
  })}`, { 
    revalidate: 300, 
    tag: `merchant:${slug}` 
  });

  return <MerchantClient merchant={merchantData.data[0]} />;
}
```

### API Route Pattern
```typescript
// app/api/merchants/route.ts
import { strapiFetch, qs } from '@/lib/strapi.server';

export const runtime = 'node';
export const revalidate = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = url.searchParams.get('page') ?? '1';
  const pageSize = url.searchParams.get('pageSize') ?? '20';

  const data = await strapiFetch<{ data: any[]; meta: any }>(`/api/merchants?${qs({
    "fields[0]": "id",
    "fields[1]": "merchant_name",
    "fields[2]": "slug",
    "pagination[page]": page,
    "pagination[pageSize]": pageSize,
    "populate[logo][fields][0]": "url",
  })}`, { 
    revalidate: 300, 
    tag: 'merchants:list' 
  });

  return Response.json(data);
}
```

---

## 🚫 What NOT to Do

### ❌ Banned Patterns
```typescript
// NEVER do this
const data = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/merchants?populate=*`);

// NEVER do this
const data = await strapiGet("/api/merchants", { "populate[logo]": "true" });

// NEVER do this
export async function GET() {
  const data = await fetch(`${process.env.STRAPI_URL}/api/merchants`);
  return Response.json(data);
}
```

### ❌ Security Violations
```typescript
// NEVER expose server tokens
NEXT_PUBLIC_STRAPI_TOKEN=... // ❌ WRONG

// NEVER use client-side Strapi fetches
"use client";
const data = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/merchants`); // ❌ WRONG
```

---

## ✅ What TO Do

### ✅ Correct Patterns
```typescript
// ✅ Use server-only helpers
const data = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
  "fields[0]": "id",
  "fields[1]": "merchant_name",
  "populate[logo][fields][0]": "url",
})}`, { revalidate: 300, tag: 'merchants:list' });

// ✅ Use explicit fields
"fields[0]": "id",
"fields[1]": "merchant_name",
"fields[2]": "slug",

// ✅ Use minimal populate
"populate[logo][fields][0]": "url",

// ✅ Include pagination
"pagination[page]": "1",
"pagination[pageSize]": "20",

// ✅ Include sort fields in fields[]
"fields[0]": "priority", // if sorting by priority
"sort": "priority:desc",
```

---

## 🏷️ Cache Tag Conventions

### Tag Naming Pattern
- **Merchant**: `merchant:${slug}`
- **Category**: `category:${slug}`
- **Homepage**: `home`
- **Merchants List**: `merchants:${market}`
- **Coupons**: `coupons:${merchantId}`

### Revalidation Strategy
```typescript
// On content update in Strapi
POST /api/revalidate
{
  "tag": "merchant:agoda-tw",
  "path": "/shop/agoda-tw",
  "secret": "your-secret"
}
```

---

## 📈 Performance Standards

### Response Time Targets
- **API Routes**: < 200ms (cached), < 500ms (uncached)
- **Page Loads**: < 1s (with ISR)
- **Search Results**: < 300ms (SSR)

### Payload Size Limits
- **Single Entity**: < 5KB
- **List Endpoints**: < 50KB
- **Search Results**: < 100KB

---

## 🔍 Quality Checklist

### Before Committing
- [ ] No `populate=*` anywhere
- [ ] All fetches use `strapiFetch` from `strapi.server.ts`
- [ ] Explicit `fields[]` for all queries
- [ ] Proper `revalidate` and `tags` set
- [ ] Pagination included for lists
- [ ] Server-only tokens (no `NEXT_PUBLIC_*`)
- [ ] Error handling implemented
- [ ] TypeScript types defined

### Performance Check
- [ ] Response times under targets
- [ ] Payload sizes reasonable
- [ ] Cache hit rates > 80%
- [ ] No client-side Strapi fetches

---

## 🚀 Migration Checklist

### When Adding New Features
1. **Create server component** with ISR
2. **Use `strapiFetch`** with explicit fields
3. **Set proper cache tags**
4. **Add pagination** for lists
5. **Test performance** meets standards
6. **Update webhook config** if needed

### When Modifying Existing Features
1. **Check current pattern** follows foundation spec
2. **Update to new pattern** if needed
3. **Preserve merchant page** functionality
4. **Test all affected endpoints**
5. **Update documentation** if needed

---

## 📚 Reference Files

### Core Files (DO NOT MODIFY WITHOUT APPROVAL)
- `src/lib/strapi.server.ts` - Server-only Strapi helpers
- `app/api/revalidate/route.ts` - On-demand revalidation
- `app/shop/[id]/page.tsx` - Merchant page (PROTECTED)
- `app/shop/[id]/page-client.tsx` - Merchant client (PROTECTED)

### Documentation Files
- `WEBHOOK_CONFIGURATION.md` - Webhook setup guide
- `performance-test.js` - Performance testing script
- `webhook-test.js` - Webhook validation script

---

## 🎯 Success Metrics

### Performance KPIs
- **API Response Time**: < 200ms average
- **Cache Hit Rate**: > 85%
- **Page Load Time**: < 1s
- **Bundle Size**: Optimized

### Quality KPIs
- **Zero `populate=*`** instances
- **100% server-only** Strapi fetches
- **Proper error handling** on all endpoints
- **Type safety** maintained

---

## 🚨 Emergency Procedures

### If Merchant Page Breaks
1. **STOP** all changes immediately
2. **Revert** to last working commit
3. **Check** `app/shop/[id]/page.tsx` is untouched
4. **Verify** `app/shop/[id]/page-client.tsx` is intact
5. **Test** merchant page functionality
6. **Resume** with merchant page protection

### If Performance Degrades
1. **Check** for `populate=*` usage
2. **Verify** explicit fields are used
3. **Confirm** ISR is working
4. **Test** cache invalidation
5. **Monitor** response times

---

**This Foundation Spec is the single source of truth for all frontend development. Follow it religiously to maintain performance, security, and consistency.** 🎯
