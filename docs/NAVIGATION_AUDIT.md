# Internal Navigation Audit Report

## 🔍 Current Status: Internal Links Not Using `next/link`

### Summary
Found **23 instances** of `router.push()` for internal navigation. Some are **appropriate** (programmatic navigation), but many should be converted to `next/link` for better performance and SEO.

---

## ✅ APPROPRIATE Uses of `router.push()` (Keep As-Is)

These are **programmatic navigation** scenarios where `router.push()` is correct:

### 1. **Form Submissions** (3 instances)
- ✅ `app/page-client.tsx` - Search form submission (line 302)
- ✅ `src/components/Header.tsx` - Search form submission (line 19)  
- ✅ `app/search/search-results.tsx` - Search form submission (line 60)

**Reason**: Form submissions are programmatic actions triggered by user input, not direct links. `router.push()` is appropriate here.

### 2. **Dynamic Navigation with State** (2 instances)
- ✅ `app/search/search-results.tsx` - Clear search button (line 109)
- ✅ `app/shop/merchant-index.tsx` - Pagination buttons (line 64)

**Reason**: These actions modify query parameters or state, not simple navigation to static pages.

### 3. **Navigation Menu** (1 instance)
- ✅ `src/components/NavigationMenu.tsx` - Mobile menu navigation (line 58)

**Reason**: Mobile menu buttons that close the drawer after navigation. Could be improved with `Link`, but acceptable for UX flow.

### 4. **Floating Action Buttons** (1 instance)
- ✅ `src/components/FloatingActionButtons.tsx` - FAB buttons (lines 16-18)

**Reason**: Floating action buttons are interactive elements, not semantic links. `router.push()` is acceptable.

---

## ❌ SHOULD CONVERT to `next/link` (18 instances)

These are **clickable elements** that should be semantic links for SEO and prefetching:

### 1. **Homepage Category Section** (1 instance)
- ❌ `app/page-client.tsx` - Category badges (line 396)
  ```tsx
  onClick={() => router.push(`/special-offers/${category.slug}`)}
  ```
  **Should be**: `<Link href={`/special-offers/${category.slug}`}>`

### 2. **Sidebar Components** (5 instances)
- ❌ `src/components/DealySidebar.tsx`:
  - Merchant cards (line 42) - Should be `<Link>` for prefetching
  - Category badges (line 81) - Should be `<Link>` for prefetching

- ❌ `src/components/MerchantSidebar.tsx`:
  - Popular merchants grid (line 172) - Should be `<Link>` for prefetching

**Reason**: These are visual links that users can click. Using `<Link>` enables prefetching and better SEO.

### 3. **Category Page** (3 instances)
- ❌ `app/category/[categorySlug]/category-view.tsx`:
  - Merchant cards (line 62) - Should be `<Link>`
  - Pagination buttons (lines 135, 148) - Could be `<Link>` for better UX

**Reason**: Merchant cards are linkable content. Pagination could use `<Link>` for prefetching next pages.

### 4. **Search Results** (1 instance)
- ❌ `app/search/search-results.tsx` - Merchant cards (line 156)
  ```tsx
  onClick={() => router.push(`/shop/${merchant.slug}`)}
  ```
  **Should be**: `<Link href={`/shop/${merchant.slug}`}>`

### 5. **Merchant Index Page** (1 instance)
- ❌ `app/shop/merchant-index.tsx` - Merchant grid click (line 60)
  ```tsx
  onClick={() => router.push(`/shop/${merchant.slug}`)}
  ```
  **Should be**: `<Link href={`/shop/${merchant.slug}`}>`

---

## 📊 Breakdown by Type

| Type | Count | Status | Action |
|------|-------|--------|--------|
| Form submissions | 3 | ✅ Keep | Appropriate |
| Dynamic/State navigation | 2 | ✅ Keep | Appropriate |
| Mobile menu | 1 | ⚠️ Optional | Could improve |
| Floating buttons | 1 | ✅ Keep | Appropriate |
| **Clickable cards/badges** | **16** | ❌ **Convert** | **Should use Link** |

---

## 🎯 Best Practice Answer

### **Is `router.push()` the best way for Next.js structure and SEO/UX?**

**Answer: NO - Not for clickable links**

### **When to Use Each:**

#### ✅ **Use `<Link>` for:**
- All clickable links to static pages
- Navigation menu items
- Card-based navigation (merchant cards, category cards)
- Any element that acts as a link
- **Benefits**: Prefetching, SEO, accessibility, instant navigation

#### ✅ **Use `router.push()` for:**
- Form submissions (after validation)
- Programmatic navigation (after user actions)
- Conditional navigation (based on state/logic)
- Dynamic query parameters
- **Benefits**: Full control, conditional logic

#### ✅ **Use `<a>` for:**
- External links (different domain)
- Download links
- Mailto/tel links
- **Benefits**: Browser default behavior

---

## 🚀 Performance Impact

### Current State (with `router.push()`):
- ❌ No prefetching
- ❌ Delayed navigation (wait for click)
- ❌ Higher latency (fetch on click)
- ❌ Missed SEO opportunities

### With `<Link>`:
- ✅ Automatic prefetching (viewport + hover)
- ✅ Instant navigation (prefetched data)
- ✅ Better SEO (crawler-friendly)
- ✅ Improved Core Web Vitals (INP)

---

## 📋 Recommendation Priority

### **High Priority** (Convert Now):
1. **Merchant cards** in sidebars (3 instances)
2. **Merchant cards** in category/search pages (2 instances)
3. **Category badges** on homepage (1 instance)

### **Medium Priority** (Nice to Have):
4. Pagination buttons (can use `<Link>` for prefetching)
5. Mobile menu navigation (can use `<Link>` but current is acceptable)

### **Low Priority** (Keep As-Is):
- Form submissions
- Floating action buttons
- Dynamic state-based navigation

---

## ✅ Summary

**Best Practice**: Use `<Link>` for **all clickable links** that navigate to static pages. Use `router.push()` only for **programmatic navigation** (forms, conditional logic, state changes).

**Current Status**: 
- ✅ 7 instances correctly using `router.push()` (forms, dynamic navigation)
- ❌ 16 instances should be converted to `<Link>` (clickable cards/badges)

**Impact**: Converting these will improve:
- Navigation speed (prefetching)
- SEO (crawler-friendly links)
- Core Web Vitals (INP improvement)
- User experience (instant navigation)

