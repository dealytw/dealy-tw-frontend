# 🚀 Quick Reference Card - Dealy.TW Frontend

## ⚡ Essential Patterns

### Server Component + ISR
```typescript
export const revalidate = 300;
const data = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
  "fields[0]": "id",
  "fields[1]": "merchant_name", 
  "populate[logo][fields][0]": "url",
})}`, { revalidate: 300, tag: 'merchants:list' });
```

### API Route + ISR
```typescript
export const runtime = 'node';
export const revalidate = 300;
// Use strapiFetch + qs + explicit fields
```

### Search/Filter (SSR)
```typescript
const data = await strapiFetch(`/api/search?${qs(params)}`, { 
  cache: 'no-store' 
});
```

## 🚫 NEVER DO
- ❌ `populate=*`
- ❌ `NEXT_PUBLIC_STRAPI_TOKEN`
- ❌ Client-side Strapi fetches
- ❌ Missing pagination on lists

## ✅ ALWAYS DO
- ✅ Explicit `fields[]`
- ✅ Minimal `populate[relation][fields][]=url`
- ✅ `revalidate` + `tags`
- ✅ Server-only helpers
- ✅ Pagination for lists

## 🏷️ Cache Tags
- `merchant:${slug}`
- `category:${slug}`
- `merchants:${market}`
- `home`

## 📊 Performance Targets
- API: < 200ms (cached)
- Pages: < 1s (ISR)
- Payload: < 50KB

## 🛡️ Protected Files
- `app/shop/[id]/page.tsx` - DO NOT TOUCH
- `app/shop/[id]/page-client.tsx` - DO NOT TOUCH
- `src/lib/strapi.server.ts` - Core helper

---
**Follow FOUNDATION_SPEC.md for complete guidelines** 📚
