# Image & Link Usage Audit

## 📸 Next/Image Status

### ✅ Already Using `next/image`:
- `Header.tsx` - Logo (with priority)
- `NavigationMenu.tsx` - Logo
- `DealyCouponCard.tsx` - Merchant logos
- `CouponCard.tsx` - Merchant logos  
- `RelatedMerchantCouponCard.tsx` - Merchant logos
- `MerchantSidebar.tsx` - Merchant logos
- `DealySidebar.tsx` - Merchant logos
- `CouponModal.tsx` - Merchant logos

### ❌ Still Using `<img>` (Need Conversion):

1. **`app/page-client.tsx`** (Line 402)
   - Category icon in "2025優惠主題一覽" section
   - Size: ~96x96px

2. **`app/shop/[id]/page-client.tsx`** (Lines 426, 510)
   - Merchant logo (mobile view) - Line 426
   - Merchant logo in coupon modal - Line 510
   - Sizes: ~48x48px, ~80x80px

3. **`app/special-offers/special-offers-client.tsx`** (Line 169)
   - Merchant logo in featured merchants section
   - Size: ~64x64px

4. **`app/category/[categorySlug]/category-view.tsx`** (Line 96)
   - Merchant logo in category merchants grid
   - Size: ~96x96px

5. **`app/search/search-results.tsx`** (Line 160)
   - Merchant logo in search results
   - Size: ~80x80px

6. **`app/blog/[slug]/article-view.tsx`** (Line 166)
   - Featured image (cover image)
   - Size: Full width, ~256px height

7. **`app/shop/merchant-index.tsx`** (Line 117)
   - Merchant logo in merchant grid
   - Size: ~128x128px

**Total: 8 `<img>` tags remaining**

---

## 🔗 Next/Link Status

### ✅ Already Using `next/link`:
- `Header.tsx` - Logo link, submit-coupons link
- `NavigationMenu.tsx` - Logo links
- `RelatedMerchantCouponCard.tsx` - Uses Link (but not actively used)

### ⚠️ Using `router.push()` Instead of Link:
- `NavigationMenu.tsx` - Navigation links use `router.push()` via button clicks
- `app/page-client.tsx` - Some navigation uses `router.push()`

### ❌ Using Plain `<a>` Tags (Should Convert to `Link`):

1. **`src/components/Footer.tsx`** - Multiple internal links:
   - `/shop` - All merchants
   - `/category/travel` - Travel category
   - `/category/shopping` - Shopping category  
   - `/special-offers` - Special offers
   - `/shop/klook` - Klook merchant
   - `/shop/trip` - Trip.com merchant
   - `/shop/agoda` - Agoda merchant
   - `/shop/booking` - Booking.com merchant
   - `/about` - About page
   - `/submit-coupons` - Contact/Submit coupons
   - `/privacy` - Privacy policy
   - `/terms` - Terms of service

2. **`src/components/Header.tsx`** (Line 43)
   - `/shop` - All merchants link (in desktop nav)

**Total: 13 internal links using `<a>` instead of `Link`**

---

## ⚡ Does `next/link` Slow Down Internal Link Clicks?

### **Answer: NO - It Actually SPEEDS THEM UP!**

**Why `next/link` is FASTER:**

1. **Client-Side Navigation**
   - Uses JavaScript routing (no full page reload)
   - Preserves React state and component tree
   - Only fetches new data, not entire HTML/CSS/JS again

2. **Automatic Prefetching**
   - Links in viewport are prefetched automatically
   - Links are prefetched on hover (desktop)
   - Pages are ready instantly when clicked

3. **Performance Benefits:**
   - **No white flash** (full page reload)
   - **Faster perceived load time** (instant navigation)
   - **Lower bandwidth** (only JSON data, not full HTML)
   - **Better UX** (smooth transitions, preserved scroll position)

**Comparison:**

| Method | Speed | User Experience |
|--------|-------|----------------|
| `<a href="/page">` | Slow (full reload) | White flash, resets state |
| `router.push('/page')` | Fast (client-side) | Smooth, but no prefetch |
| `<Link href="/page">` | **Fastest** (prefetched) | **Instant, best UX** |

**Best Practice:**
- ✅ Use `<Link>` for **all internal links** (same domain)
- ✅ Use `<a>` for **external links** (different domain)
- ✅ Use `router.push()` only for **programmatic navigation** (forms, buttons)

---

## 📋 Recommendations

### Priority 1: Convert Remaining Images
All remaining `<img>` tags should be converted to `next/image` for:
- Automatic WebP/AVIF conversion
- Responsive images with `sizes`
- Lazy loading (except above-fold)
- Better Core Web Vitals (LCP)

### Priority 2: Convert Footer Links
Footer has 13 internal links using `<a>` - convert to `Link` for:
- Automatic prefetching
- Faster navigation
- Better SEO (crawler can detect internal links)

### Priority 3: Consider NavigationMenu
Currently uses `router.push()` - could use `Link` for prefetching, but button-based navigation is acceptable for mobile menus.

---

## 🎯 Summary

- **Images**: 8 remaining `<img>` tags (mostly merchant logos and category icons)
- **Links**: 13 internal links using `<a>` (mostly in Footer)
- **Performance**: `next/link` **speeds up** navigation, doesn't slow it down
- **Action**: Convert images and links for better performance and SEO

