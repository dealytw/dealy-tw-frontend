# Turnstile CSP Fix – PR Summary

## Goal
Fix CSP violations for Cloudflare Turnstile so it loads only on contact form pages (`/shop/*`), without site-wide CSP relaxation.

---

## Summary of Changes

### 1. Turnstile Scope (No Code Change)
- **Location**: `app/shop/[id]/ContactFormClient.tsx`
- Turnstile is already scoped: loaded via `next/script` (lazyOnload) only when `ContactFormClient` mounts
- Contact form appears only on `/shop/[id]` (merchant detail pages)
- `api.js` is NOT loaded globally

### 2. Backend: Per-IP Rate Limit
**Files**: `app/api/contact/route.ts` (HK + TW)

- Added in-memory per-IP rate limit: **10 requests/minute**
- Returns generic success (200) when exceeded (same as other blocks)
- Existing protections kept: honeypot, pageLoadTs, Turnstile verification

### 3. CSP: Route-Specific Turnstile Allowlist
**Files**: `next.config.ts` (HK + TW)

- **Base CSP** (all pages): unchanged; no Turnstile
- **Shop CSP** (`/shop/:path*`): adds Turnstile allowlist

**Turnstile additions (shop routes only):**
- `script-src`: `https://challenges.cloudflare.com`
- `frame-src`: `https://challenges.cloudflare.com`
- `connect-src`: `https://challenges.cloudflare.com`

GTM/GA allowlist unchanged; no new `unsafe-*` directives.

---

## File Paths Changed

| File | Change |
|------|--------|
| `dealy-hk-frontend/app/api/contact/route.ts` | Per-IP rate limit (10/min) |
| `dealy-tw-frontend/app/api/contact/route.ts` | Per-IP rate limit (10/min) |
| `dealy-hk-frontend/next.config.ts` | Route-specific CSP for `/shop/*` |
| `dealy-tw-frontend/next.config.ts` | Route-specific CSP for `/shop/*` |

---

## Final CSP Header Strings

### Base (non-shop routes)
```
default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://www.gstatic.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://*.googleapis.com https://*.strapiapp.com https://cms.dealy.tw https://cms.dealy.hk https://cms.dealy.sg https://cms.dealy.jp https://cms.dealy.kr; frame-src 'self' https://www.googletagmanager.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests
```

### Shop routes (`/shop/:path*`)
Same as base, plus:
- `script-src`: `... https://challenges.cloudflare.com`
- `frame-src`: `... https://challenges.cloudflare.com`
- `connect-src`: `... https://challenges.cloudflare.com`

---

## Route Matchers

| Source | Headers |
|--------|---------|
| `/:path*` | Base CSP (no Turnstile) |
| `/shop/:path*` | CSP with Turnstile allowlist |
| `/_next/static/:path*` | Common headers only |
| `/_next/image/:path*` | Common headers only |
| `/upload/:path*` | Common headers only |

---

## Verification Checklist

### 1. No CSP Violation
- [ ] Open DevTools → Console on a merchant page (e.g. `/shop/tripcom`)
- [ ] Confirm no CSP errors for `challenges.cloudflare.com`
- [ ] Open a non-shop page (e.g. `/`, `/blog`) and confirm no Turnstile-related CSP errors

### 2. Turnstile Renders
- [ ] Go to a merchant page (e.g. `/shop/tripcom`)
- [ ] Scroll to contact form
- [ ] Confirm Turnstile widget appears (checkbox or challenge)
- [ ] Ensure `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set in Vercel

### 3. Submit Verifies
- [ ] Submit contact form with valid Turnstile token → success
- [ ] Submit without completing Turnstile → blocked (generic success message)
- [ ] Submit 11+ times in 1 minute from same IP → rate limited (generic success)
- [ ] Ensure `TURNSTILE_SECRET_KEY` is set in Vercel production

### 4. CSP Headers
- [ ] `curl -I https://dealy.tw/shop/tripcom` → `Content-Security-Policy` includes `challenges.cloudflare.com`
- [ ] `curl -I https://dealy.tw/` → `Content-Security-Policy` does NOT include `challenges.cloudflare.com`

---

## Env Vars Required

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client-side Turnstile widget |
| `TURNSTILE_SECRET_KEY` | Server-side verification (production) |
