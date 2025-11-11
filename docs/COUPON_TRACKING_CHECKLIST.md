# 優惠券點擊追蹤完整檢查清單

## ✅ 已實現追蹤的位置

### 1. **DealyCouponCard.tsx** ✅
- **位置**: `src/components/DealyCouponCard.tsx`
- **追蹤點**:
  - ✅ `handleButtonClick()` - 按鈕點擊（`clickSource: 'button'`）
  - ✅ `handleTitleClick()` - 標題點擊（`clickSource: 'title'`）
- **使用場景**: 
  - 首頁優惠券卡片
  - 商家頁面優惠券卡片
  - 特別優惠頁面優惠券卡片

### 2. **首頁 (Homepage)** ✅
- **位置**: `app/page-client.tsx`
- **函數**: `handleCouponClick()`
- **追蹤點**: 首頁優惠券 rail 點擊
- **clickSource**: `'button'`

### 3. **商家頁面 (Merchant Page)** ✅
- **位置**: `app/shop/[id]/page-client.tsx`
- **函數**: `handleCouponClick()`
- **追蹤點**: 
  - 商家頁面優惠券列表點擊
  - 過期優惠券點擊
- **clickSource**: `'button'`

### 4. **特別優惠頁面 (Special Offers)** ✅
- **位置**: `app/special-offers/special-offers-client.tsx`
- **函數**: `handleCouponClick()`
- **追蹤點**: Flash deals 優惠券點擊
- **clickSource**: `'button'`

### 5. **相關商家優惠券卡片** ✅
- **位置**: `src/components/RelatedMerchantCouponCard.tsx`
- **函數**: `handleButtonClick()`
- **追蹤點**: 相關商家優惠券按鈕點擊
- **clickSource**: `'button'`

### 6. **優惠券 Modal** ✅
- **位置**: `src/components/CouponModal.tsx`
- **函數**: `handleVisitStore()`
- **追蹤點**: Modal 中的「前往商店」按鈕點擊
- **clickSource**: `'button'`
- **注意**: Modal 沒有 merchant slug 上下文，所以 `merchantSlug` 為空字串

### 7. **搜尋結果頁面** ✅
- **位置**: `app/search/search-results.tsx`
- **函數**: `handleCouponClick()`
- **追蹤點**: 搜尋結果中的優惠券點擊
- **clickSource**: `'button'`

### 8. **分類頁面** ✅
- **位置**: `app/category/[categorySlug]/category-view.tsx`
- **函數**: `handleCouponClick()`
- **追蹤點**: 分類頁面中的優惠券點擊
- **clickSource**: `'button'`

---

## 📊 追蹤的數據變數

所有追蹤位置都會發送以下數據到 GTM/GA4：

| 變數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `coupon_id` | 優惠券 ID | `"123"` |
| `coupon_title` | 優惠券標題 | `"Trip.com 優惠碼"` |
| `coupon_code` | 優惠碼 | `"SAVE20"` |
| `merchant_name` | 商家名稱 | `"Trip.com"` |
| `merchant_slug` | 商家 slug | `"tripcom"` |
| `affiliate_link` | 出站連結 | `"https://trip.com/..."` |
| `coupon_type` | 優惠券類型 | `"promo_code"`, `"coupon"`, `"discount"` |
| `click_source` | 點擊來源 | `"button"`, `"title"` |
| `page_location` | 頁面路徑 | `"/shop/tripcom"` |
| `timestamp` | 時間戳記 | `"2024-01-01T12:00:00.000Z"` |

---

## 🔍 檢查方法

### 1. 瀏覽器 Console 檢查
```javascript
// 檢查 dataLayer
window.dataLayer

// 應該看到 coupon_outbound_click 事件
window.dataLayer.filter(e => e.event === 'coupon_outbound_click')
```

### 2. GTM Preview Mode
1. 開啟 GTM Preview Mode
2. 點擊任何優惠券按鈕或標題
3. 檢查「標籤」區域應該看到 `GA4 Event - Coupon Outbound Click` 已觸發
4. 檢查「資料層」區域應該看到所有參數

### 3. GA4 即時報告
1. 前往 GA4 → 報表 → 即時
2. 點擊優惠券按鈕或標題
3. 應該在「事件數（最後 30 分鐘）」中看到 `coupon_outbound_click` 事件

---

## ⚠️ 注意事項

### 1. Merchant Slug 可能為空
- **CouponModal**: Modal 沒有 merchant slug 上下文，所以 `merchantSlug` 為空字串
- **其他位置**: 應該都有 merchant slug

### 2. Click Source 區分
- **`'button'`**: 所有按鈕點擊（包括 Modal 按鈕）
- **`'title'`**: 僅在 `DealyCouponCard` 中點擊標題時使用

### 3. Affiliate Link 處理
- 如果 `affiliate_link` 為空或 `'#'`，會使用 `'#'` 作為預設值
- 所有位置都會檢查 `affiliate_link` 是否存在且不等於 `'#'` 才執行跳轉

---

## 🧪 測試清單

測試每個位置確保追蹤正常：

- [ ] 首頁優惠券點擊
- [ ] 商家頁面優惠券點擊（按鈕）
- [ ] 商家頁面優惠券點擊（標題）
- [ ] 特別優惠頁面優惠券點擊
- [ ] 相關商家優惠券點擊
- [ ] Modal 中的「前往商店」按鈕
- [ ] 搜尋結果頁面優惠券點擊
- [ ] 分類頁面優惠券點擊

---

## 📝 代碼位置總結

| 組件/頁面 | 文件路徑 | 函數名稱 | 狀態 |
|---------|---------|---------|------|
| DealyCouponCard | `src/components/DealyCouponCard.tsx` | `handleButtonClick`, `handleTitleClick` | ✅ |
| 首頁 | `app/page-client.tsx` | `handleCouponClick` | ✅ |
| 商家頁面 | `app/shop/[id]/page-client.tsx` | `handleCouponClick` | ✅ |
| 特別優惠頁面 | `app/special-offers/special-offers-client.tsx` | `handleCouponClick` | ✅ |
| 相關商家卡片 | `src/components/RelatedMerchantCouponCard.tsx` | `handleButtonClick` | ✅ |
| 優惠券 Modal | `src/components/CouponModal.tsx` | `handleVisitStore` | ✅ |
| 搜尋結果 | `app/search/search-results.tsx` | `handleCouponClick` | ✅ |
| 分類頁面 | `app/category/[categorySlug]/category-view.tsx` | `handleCouponClick` | ✅ |

---

**最後更新**: 2024-11-11
**狀態**: ✅ 所有位置已實現追蹤

