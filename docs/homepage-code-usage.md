# Homepage Code Usage Audit

## Overview

**Entry File**: `app/page.tsx`  
**Component Tree**: 
```
HomePage (app/page.tsx)
├── Header (components/Header.tsx)
├── Hero Section (inline)
├── Popular Merchants Section (inline)
├── Deal Categories Section (inline)
├── Coupon Rail Section (inline)
├── DealySidebar (components/DealySidebar.tsx)
└── CouponModal (components/CouponModal.tsx)
```

## SEO

**Meta Title**: Not set (uses default Next.js)  
**Meta Description**: Not set (uses default Next.js)  
**OG Image**: Not set  

**CMS Mapping Candidates**:
- `seo_title`: "Dealy.TW 台灣每日最新優惠折扣平台"
- `seo_description`: "台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡"
- `og_image`: Hero background image

## Hero

**Static Text**:
- `app/page.tsx:168`: "Dealy.TW 台灣每日最新優惠折扣平台"
- `app/page.tsx:171`: "NEVER Pay Full Price"
- `app/page.tsx:175`: "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡"
- `app/page.tsx:178`: "📦 超過 100+ 熱門商店優惠 💸折扣、優惠碼、獨家Promo Code 一次睇哂！"
- `app/page.tsx:190`: "搜尋最抵Deal" (placeholder)
- `app/page.tsx:194`: "搜尋" (button)

**Images**:
- `app/page.tsx:161`: Background image - `https://dealy.hk/wp-content/uploads/2025/06/backgroundtest1.webp`

**CMS Mapping Candidates**:
- `hero.title`: "Dealy.TW 台灣每日最新優惠折扣平台"
- `hero.subtitle`: "NEVER Pay Full Price"
- `hero.description`: "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡"
- `hero.background_image`: Background image URL
- `hero.search_placeholder`: "搜尋最抵Deal"

## Popular Merchants

**Static Text**:
- `app/page.tsx:205`: "台灣最新折扣優惠" (section heading)

**Data Structure**:
```typescript
{
  id: string;
  name: string;
  logo: string;
  description: string;
}
```

**Images**:
- Merchant logos from `https://dealy.hk/wp-content/uploads/2025/07/` and `https://dealy.hk/wp-content/uploads/2025/06/`

**CMS Mapping Candidates**:
- `popularstore.heading`: "台灣最新折扣優惠"
- `popularstore.merchants`: Array of merchant objects with `name`, `logo`, `description`

## Category Block

**Static Text**:
- `app/page.tsx:232`: "2025優惠主題一覽" (section heading)
- `app/page.tsx:252`: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。"
- `app/page.tsx:253`: "了解更多" (link text)

**Data Structure**:
```typescript
{
  id: string;
  name: string;
  icon: string;
}
```

**Images**:
- Category icons from `https://dealy.hk/wp-content/uploads/2025/08/`

**CMS Mapping Candidates**:
- `category.heading`: "2025優惠主題一覽"
- `category.categories`: Array of category objects with `name`, `icon`
- `category.disclaimer`: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。"

## Coupon Rail

**Static Text**:
- `app/page.tsx:263`: "今日最新最受歡迎優惠券/Promo Code/優惠碼" (section heading)
- `app/page.tsx:311`: "獲取優惠碼" (button text)
- `app/page.tsx:315`: "***" (hidden code placeholder)
- `app/page.tsx:329`: "COPY" (copy button)
- `app/page.tsx:341`: "獲取優惠碼" (regular coupon button)
- `app/page.tsx:356`: "顯示優惠詳情" (details summary)
- `app/page.tsx:286`: "折扣碼/ 優惠" (badge text)

**Data Structure**:
```typescript
{
  id: string;
  merchantId: string;
  logo: string;
  discount: string;
  type: string;
  couponType: "coupon" | "promo_code";
  title: string;
  timeLeft?: string;
  usageCount: number;
  description: string;
  terms?: string;
  code?: string;
  affiliateLink: string;
}
```

**Images**:
- Coupon logos from `https://dealy.hk/wp-content/uploads/2025/07/` and `https://dealy.hk/wp-content/uploads/2025/06/`

**Links**:
- `app/page.tsx:147`: `/merchant/${merchantId}#coupon-${coupon.id}` (merchant page with coupon hash)

**CMS Mapping Candidates**:
- `coupon.heading`: "今日最新最受歡迎優惠券/Promo Code/優惠碼"
- `coupon.merchants`: Array of merchant objects with top coupon data
- Each coupon needs: `title`, `discount`, `type`, `couponType`, `description`, `terms`, `code`, `affiliateLink`

## Topics

**Note**: No dedicated topics section found in current homepage. Categories section serves as topic-like functionality.

## Footer/Sidebar

### Header Component
**Static Text**:
- `components/Header.tsx:19`: "全部商店" (navigation link)
- `components/Header.tsx:23`: "搜尋最抵Deal" (search placeholder)
- `components/Header.tsx:32`: "最新快訊訊息" (button)
- `components/Header.tsx:35`: "提交優惠券" (button)

**Images**:
- `components/Header.tsx:11`: Logo - `https://dealy.hk/wp-content/uploads/2025/06/dealyhkpinklogo-01-01.svg`

**Links**:
- `components/Header.tsx:19`: `/shop` (all stores)

### DealySidebar Component
**Static Text**:
- `components/DealySidebar.tsx:52`: "熱門商店" (section heading)
- `components/DealySidebar.tsx:75`: "熱門分類" (section heading)

**Data Structure**:
```typescript
// Popular merchants
{
  id: string;
  name: string;
  logo: string;
}

// Popular categories (hashtags)
string[] // Array of hashtag strings
```

**Images**:
- Merchant logos from `https://dealy.hk/wp-content/uploads/2025/07/`

### Footer Component
**Static Text**:
- `components/Footer.tsx:10`: "ReUbird" (brand name)
- `components/Footer.tsx:12`: "最新優惠碼、折扣資訊一站式平台，幫你省更多！" (description)
- `components/Footer.tsx:32`: "快速連結" (section heading)
- `components/Footer.tsx:43`: "熱門商戶" (section heading)
- `components/Footer.tsx:54`: "支援" (section heading)
- `components/Footer.tsx:69`: "© 2025 ReUbird. 版權所有。" (copyright)
- `components/Footer.tsx:73`: "透過本站鏈接完成購物，我們可能會因此獲得佣金，而您無需額外付費。" (disclaimer)

**Links**:
- `/shop`, `/category/travel`, `/category/shopping`, `/special-offers`
- `/merchant/klook`, `/merchant/trip`, `/merchant/agoda`, `/merchant/booking`
- `/about`, `/contact`, `/privacy`, `/terms`

## External Calls

**No API calls found** - All data is currently hardcoded mock data.

**Expected API Endpoints** (for future CMS integration):
- `/api/homepages` - Homepage content
- `/api/merchants` - Merchant data
- `/api/coupons` - Coupon data
- `/api/categories` - Category data

## Environment Variables

**None currently used** - All content is hardcoded.

**Expected Environment Variables** (for future CMS integration):
- `NEXT_PUBLIC_STRAPI_URL` - Strapi API URL
- `STRAPI_TOKEN` - Strapi API token
- `NEXT_PUBLIC_MARKET_KEY` - Market key (e.g., "tw", "hk")

## CMS Mapping Candidates

### Homepage Collection
```typescript
{
  title: string; // "Dealy.TW 台灣每日最新優惠折扣平台"
  seo_title: string;
  seo_description: string;
  og_image: string;
  hero: {
    title: string;
    subtitle: string;
    description: string;
    background_image: string;
    search_placeholder: string;
  };
  popularstore: {
    heading: string;
    merchants: Merchant[];
  };
  category: {
    heading: string;
    categories: Category[];
    disclaimer: string;
  };
  coupon: {
    heading: string;
    merchants: Merchant[];
  };
  market: Market;
}
```

### Merchant Collection
```typescript
{
  merchant_name: string;
  slug: string;
  logo: string;
  description: string;
  market: Market;
  coupons: Coupon[];
}
```

### Coupon Collection
```typescript
{
  title: string;
  discount_value: string;
  type: string;
  coupon_type: "coupon" | "promo_code";
  description: string;
  terms: string;
  code: string;
  affiliate_url: string;
  usage_count: number;
  expires_at: string;
  merchant: Merchant;
}
```

### Category Collection
```typescript
{
  name: string;
  slug: string;
  icon: string;
}
```

## Conditional Rendering Requirements

- **Coupon Rail**: Only render if `todayCoupons.length > 0`
- **Time Left**: Only show if `coupon.timeLeft` exists
- **Terms**: Only show if `coupon.terms` exists
- **Promo Code Reveal**: Only show code after user clicks "獲取優惠碼"
- **Sidebar**: Only show on large screens (`hidden lg:block`)

## Arrays & Collections

### Featured Merchants (7 items)
- Minimum fields: `id`, `name`, `logo`, `description`
- Order: Preserved from array order

### Deal Categories (7 items)
- Minimum fields: `id`, `name`, `icon`
- Order: Preserved from array order

### Today's Coupons (2 items)
- Minimum fields: `id`, `merchantId`, `logo`, `discount`, `type`, `couponType`, `title`, `usageCount`, `description`, `affiliateLink`
- Optional fields: `timeLeft`, `terms`, `code`
- Order: Preserved from array order

## Editor Order Requirements

- **Merchants**: Order must be preserved (used in multiple sections)
- **Categories**: Order must be preserved
- **Coupons**: Order must be preserved
- **Sections**: Hero → Popular Merchants → Categories → Coupons → Sidebar
