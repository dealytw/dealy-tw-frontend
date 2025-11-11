# Google Tag Manager (GTM) 設置指南

## 📋 目錄
1. [建立 GA4 配置標籤](#1-建立-ga4-配置標籤)
2. [建立自訂變數](#2-建立自訂變數)
3. [建立 coupon_outbound_click 事件觸發器](#3-建立-coupon_outbound_click-事件觸發器)
4. [建立 GA4 事件標籤](#4-建立-ga4-事件標籤)
5. [測試與驗證](#5-測試與驗證)

---

## 1. 建立 GA4 配置標籤

### 步驟 1.1: 進入 GTM 工作區
1. 登入 [Google Tag Manager](https://tagmanager.google.com/)
2. 選擇容器：`GTM-N8WGJVQS`
3. 點擊左側選單的 **「標籤」** (Tags)

### 步驟 1.2: 建立新標籤
1. 點擊右上角 **「新增」** (New) 按鈕
2. 點擊標籤設定區域

### 步驟 1.3: 選擇標籤類型
1. 在「選擇標籤類型」中，搜尋並選擇 **「Google Analytics: GA4 設定」** (Google Analytics: GA4 Configuration)
2. 如果沒有看到，可能需要先連結 GA4 帳戶

### 步驟 1.4: 設定 GA4 配置
1. **測量 ID** (Measurement ID):
   - 輸入您的 GA4 Measurement ID
   - 格式：`G-XXXXXXXXXX`
   - 可在 GA4 的「管理」→「資料串流」中找到

2. **觸發條件** (Triggering):
   - 點擊觸發條件區域
   - 選擇 **「所有網頁」** (All Pages)
   - 這會讓 GA4 在所有頁面載入時初始化

### 步驟 1.5: 命名與儲存
1. **標籤名稱**：`GA4 Configuration - All Pages`
2. 點擊 **「儲存」** (Save)

---

## 2. 建立自訂變數

自訂變數用於從 `dataLayer` 讀取優惠券點擊事件的數據。

### 步驟 2.1: 進入變數設定
1. 在 GTM 左側選單點擊 **「變數」** (Variables)
2. 在「使用者定義的變數」區域點擊 **「新增」** (New)

### 步驟 2.2: 建立第一個變數 - coupon_id
1. 點擊變數設定區域
2. 選擇 **「資料層變數」** (Data Layer Variable)
3. **資料層變數名稱**：`coupon_id`
4. **變數名稱**：`DLV - Coupon ID`
5. 點擊 **「儲存」**

### 步驟 2.3: 建立其他變數
重複步驟 2.2，建立以下變數：

| 資料層變數名稱 | 變數名稱 | 說明 |
|--------------|---------|------|
| `coupon_id` | `DLV - Coupon ID` | 優惠券 ID |
| `coupon_title` | `DLV - Coupon Title` | 優惠券標題 |
| `coupon_code` | `DLV - Coupon Code` | 優惠碼 |
| `merchant_name` | `DLV - Merchant Name` | 商家名稱 |
| `merchant_slug` | `DLV - Merchant Slug` | 商家 slug |
| `affiliate_link` | `DLV - Affiliate Link` | 出站連結 |
| `coupon_type` | `DLV - Coupon Type` | 優惠券類型 (promo_code/coupon/discount) |
| `click_source` | `DLV - Click Source` | 點擊來源 (button/title) |
| `page_location` | `DLV - Page Location` | 頁面路徑 |

**快速建立方法：**
1. 建立第一個變數後，點擊右上角 **「複製」** (Duplicate)
2. 修改變數名稱和資料層變數名稱
3. 重複此步驟建立所有變數

---

## 3. 建立 coupon_outbound_click 事件觸發器

### 步驟 3.1: 建立新觸發器
1. 在 GTM 左側選單點擊 **「觸發條件」** (Triggers)
2. 點擊右上角 **「新增」** (New)

### 步驟 3.2: 選擇觸發器類型
1. 點擊觸發條件設定區域
2. 選擇 **「自訂事件」** (Custom Event)

### 步驟 3.3: 設定觸發器
1. **事件名稱**：`coupon_outbound_click`
   - 必須與前端代碼中的 `event: 'coupon_outbound_click'` 完全一致
   
2. **此觸發條件在以下情況觸發**：
   - 選擇 **「所有自訂事件」** (All Custom Events)
   - 或選擇 **「部分自訂事件」** (Some Custom Events) 並設定：
     - 條件：`Event` 等於 `coupon_outbound_click`

3. **觸發條件名稱**：`Trigger - Coupon Outbound Click`

4. 點擊 **「儲存」**

---

## 4. 建立 GA4 事件標籤

### 步驟 4.1: 建立新標籤
1. 在 GTM 左側選單點擊 **「標籤」** (Tags)
2. 點擊右上角 **「新增」** (New)
3. 點擊標籤設定區域

### 步驟 4.2: 選擇標籤類型
1. 選擇 **「Google Analytics: GA4 事件」** (Google Analytics: GA4 Event)

### 步驟 4.3: 設定 GA4 事件
1. **設定標籤** (Configuration Tag):
   - 選擇之前建立的 **「GA4 Configuration - All Pages」**
   - 這會連結到您的 GA4 帳戶

2. **事件名稱**：`coupon_outbound_click`
   - 這會顯示在 GA4 的事件報告中

3. **事件參數** (Event Parameters):
   點擊 **「新增列」** (Add Row) 加入以下參數：

   | 參數名稱 | 值 | 說明 |
   |---------|---|------|
   | `coupon_id` | `{{DLV - Coupon ID}}` | 優惠券 ID |
   | `coupon_title` | `{{DLV - Coupon Title}}` | 優惠券標題 |
   | `coupon_code` | `{{DLV - Coupon Code}}` | 優惠碼 |
   | `merchant_name` | `{{DLV - Merchant Name}}` | 商家名稱 |
   | `merchant_slug` | `{{DLV - Merchant Slug}}` | 商家 slug |
   | `coupon_type` | `{{DLV - Coupon Type}}` | 優惠券類型 |
   | `click_source` | `{{DLV - Click Source}}` | 點擊來源 |
   | `link_url` | `{{DLV - Affiliate Link}}` | 出站連結 |
   | `page_location` | `{{DLV - Page Location}}` | 頁面路徑 |

   **注意**：使用 `{{變數名稱}}` 格式來引用變數

### 步驟 4.4: 設定觸發條件
1. **觸發條件** (Triggering):
   - 選擇之前建立的 **「Trigger - Coupon Outbound Click」**

### 步驟 4.5: 命名與儲存
1. **標籤名稱**：`GA4 Event - Coupon Outbound Click`
2. 點擊 **「儲存」**

---

## 5. 測試與驗證

### 步驟 5.1: 使用 GTM Preview Mode
1. 在 GTM 右上角點擊 **「預覽」** (Preview)
2. 輸入您的網站 URL（例如：`https://dealy.tw`）
3. 點擊 **「連線」** (Connect)

### 步驟 5.2: 測試優惠券點擊
1. 在預覽視窗中，點擊任何優惠券的按鈕或標題
2. 在 GTM Preview 面板中，您應該看到：
   - **標籤** (Tags) 區域顯示 `GA4 Event - Coupon Outbound Click` 已觸發
   - **資料層** (Data Layer) 區域顯示 `coupon_outbound_click` 事件及所有參數

### 步驟 5.3: 檢查 dataLayer
在瀏覽器 Console 中輸入：
```javascript
window.dataLayer
```
您應該看到包含 `coupon_outbound_click` 事件的陣列。

### 步驟 5.4: 驗證 GA4 即時報告
1. 前往 [Google Analytics 4](https://analytics.google.com/)
2. 選擇您的 GA4 屬性
3. 前往 **「報表」** → **「即時」** (Reports → Realtime)
4. 點擊優惠券按鈕或標題
5. 在「事件數 (最後 30 分鐘)」中應該看到 `coupon_outbound_click` 事件
6. 點擊事件名稱查看詳細參數

### 步驟 5.5: 發布變更
測試無誤後：
1. 在 GTM 中點擊右上角 **「提交」** (Submit)
2. 輸入版本名稱和說明（例如：`Add coupon click tracking`）
3. 點擊 **「發布」** (Publish)

---

## 📊 在 GA4 中查看數據

### 即時報告
- **路徑**：報表 → 即時 → 事件數
- **查看**：`coupon_outbound_click` 事件及其參數

### 事件報告
- **路徑**：報表 → 參與度 → 事件
- **查看**：所有 `coupon_outbound_click` 事件的歷史數據

### 自訂報告
1. 前往 **「探索」** (Explore)
2. 建立新的探索報告
3. 使用 `coupon_outbound_click` 事件和參數建立自訂分析

---

## 🔍 疑難排解

### 問題 1: 事件沒有觸發
- **檢查**：GTM Preview Mode 中是否看到 dataLayer 推送
- **檢查**：觸發條件的事件名稱是否正確（必須是 `coupon_outbound_click`）
- **檢查**：瀏覽器 Console 是否有 JavaScript 錯誤

### 問題 2: 參數為空
- **檢查**：變數名稱是否正確
- **檢查**：資料層變數名稱是否與 dataLayer 中的鍵名完全一致（區分大小寫）

### 問題 3: GA4 中看不到事件
- **等待**：GA4 即時報告可能需要幾分鐘更新
- **檢查**：GA4 配置標籤是否正確設定
- **檢查**：Measurement ID 是否正確

---

## ✅ 完成檢查清單

- [ ] GA4 配置標籤已建立並設定為「所有網頁」觸發
- [ ] 所有 9 個自訂變數已建立
- [ ] `coupon_outbound_click` 觸發器已建立
- [ ] GA4 事件標籤已建立並連結所有參數
- [ ] 在 GTM Preview Mode 中測試成功
- [ ] 在 GA4 即時報告中看到事件
- [ ] 已發布 GTM 變更

---

## 📝 補充說明

### dataLayer 結構範例
當用戶點擊優惠券時，dataLayer 會推送如下結構：
```javascript
{
  event: 'coupon_outbound_click',
  coupon_id: '123',
  coupon_title: 'Trip.com 優惠碼',
  coupon_code: 'SAVE20',
  merchant_name: 'Trip.com',
  merchant_slug: 'tripcom',
  affiliate_link: 'https://trip.com/...',
  coupon_type: 'promo_code',
  click_source: 'button', // 或 'title'
  page_location: '/shop/tripcom',
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

### 最佳實踐
1. **測試環境**：先在測試環境驗證所有設定
2. **版本控制**：每次變更都建立新的 GTM 版本
3. **監控**：定期檢查 GA4 事件報告確保追蹤正常
4. **文檔**：記錄所有自訂變數和觸發器的用途

---

**完成後，您的優惠券點擊追蹤系統就完全設置好了！** 🎉

