# Core Web Vitals (CWV) 追蹤設置指南

## 📋 概述

Core Web Vitals (CWV) 追蹤已實現並啟用。此追蹤會自動收集以下指標：
- **LCP** (Largest Contentful Paint) - 載入效能
- **CLS** (Cumulative Layout Shift) - 視覺穩定性
- **INP** (Interaction to Next Paint) - 互動性

## ✅ 已完成的工作

1. ✅ 安裝 `web-vitals` 套件
2. ✅ 更新 `CWVTracker` 組件以支援 GA4/GTM
3. ✅ 啟用 CWVTracker 在 `app/layout.tsx`
4. ✅ 自動發送到 dataLayer 和 GA4

## 📊 追蹤的數據

每個 Web Vital 指標會發送以下數據：

| 參數名稱 | 說明 | 範例值 |
|---------|------|--------|
| `event` | 事件名稱 | `"web_vitals"` |
| `metric_name` | 指標名稱 | `"LCP"`, `"CLS"`, `"INP"` |
| `value` | 指標數值 | `2500` (LCP/INP 毫秒), `100` (CLS 千分之一) |
| `rating` | 評級 | `"good"`, `"needs-improvement"`, `"poor"` |
| `delta` | 變化值 | `150` (毫秒) |
| `metric_id` | 唯一 ID | `"v3-1234567890-1234567890123"` |
| `page_location` | 完整 URL | `"https://dealy.tw/shop/tripcom"` |
| `page_path` | 頁面路徑 | `"/shop/tripcom"` |
| `timestamp` | 時間戳記 | `"2024-01-01T12:00:00.000Z"` |

## 🎯 SLOs (Service Level Objectives)

| 指標 | 目標 (p75) | 說明 |
|------|-----------|------|
| **LCP** | < 2.5s | 最大內容繪製時間 |
| **CLS** | < 0.1 | 累積版面配置位移 |
| **INP** | < 200ms | 互動到下次繪製時間 |

## 🔧 GTM 設置步驟

### 步驟 1: 建立自訂變數

1. 前往 GTM → **變數** → **新增**
2. 建立以下資料層變數：

| 資料層變數名稱 | 變數名稱 | 說明 |
|--------------|---------|------|
| `metric_name` | `DLV - Metric Name` | 指標名稱 (LCP/CLS/INP) |
| `value` | `DLV - CWV Value` | 指標數值 |
| `rating` | `DLV - CWV Rating` | 評級 (good/needs-improvement/poor) |
| `delta` | `DLV - CWV Delta` | 變化值 |
| `metric_id` | `DLV - CWV Metric ID` | 唯一 ID |
| `page_location` | `DLV - Page Location` | 完整 URL |
| `page_path` | `DLV - Page Path` | 頁面路徑 |

### 步驟 2: 建立觸發器

1. 前往 GTM → **觸發條件** → **新增**
2. 選擇 **「自訂事件」**
3. 設定：
   - **事件名稱**: `web_vitals`
   - **觸發條件名稱**: `Trigger - Web Vitals`

### 步驟 3: 建立 GA4 事件標籤

1. 前往 GTM → **標籤** → **新增**
2. 選擇 **「Google Analytics: GA4 事件」**
3. 設定：
   - **設定標籤**: 選擇您的 GA4 Configuration 標籤
   - **事件名稱**: `web_vitals`
   - **事件參數**: 點擊「新增列」，加入以下參數：

| 參數名稱 | 值（使用變數） |
|---------|--------------|
| `metric_name` | `{{DLV - Metric Name}}` |
| `value` | `{{DLV - CWV Value}}` |
| `rating` | `{{DLV - CWV Rating}}` |
| `delta` | `{{DLV - CWV Delta}}` |
| `metric_id` | `{{DLV - CWV Metric ID}}` |
| `page_location` | `{{DLV - Page Location}}` |
| `page_path` | `{{DLV - Page Path}}` |

4. **觸發條件**: 選擇 `Trigger - Web Vitals`
5. **標籤名稱**: `GA4 Event - Web Vitals`
6. 點擊 **「儲存」**

### 步驟 4: 建立個別指標標籤（可選）

如果您想要分別追蹤每個指標（LCP、CLS、INP），可以建立三個獨立的標籤：

#### LCP 標籤
- **事件名稱**: `LCP`
- **觸發條件**: 建立新觸發器，條件為 `metric_name` 等於 `LCP`
- **參數**: 同上

#### CLS 標籤
- **事件名稱**: `CLS`
- **觸發條件**: 建立新觸發器，條件為 `metric_name` 等於 `CLS`
- **參數**: 同上

#### INP 標籤
- **事件名稱**: `INP`
- **觸發條件**: 建立新觸發器，條件為 `metric_name` 等於 `INP`
- **參數**: 同上

## 📈 在 GA4 中查看數據

### 即時報告
1. 前往 GA4 → **報表** → **即時**
2. 在「事件數（最後 30 分鐘）」中應該看到 `web_vitals` 事件
3. 點擊事件名稱查看詳細參數

### 事件報告
1. 前往 GA4 → **報表** → **參與度** → **事件**
2. 尋找 `web_vitals` 事件
3. 點擊事件名稱查看所有參數和統計數據

### 建立自訂報告

#### 報告 1: Web Vitals 總覽
- **維度**: `metric_name`, `rating`
- **指標**: `事件計數`, `平均 value`
- **篩選器**: `事件名稱 = web_vitals`

#### 報告 2: 按評級統計
- **維度**: `rating`
- **指標**: `事件計數`
- **篩選器**: `事件名稱 = web_vitals`

#### 報告 3: 按頁面統計
- **維度**: `page_path`, `metric_name`
- **指標**: `事件計數`, `平均 value`
- **篩選器**: `事件名稱 = web_vitals`

## 🧪 測試方法

### 1. 瀏覽器 Console 檢查
```javascript
// 檢查 dataLayer
window.dataLayer

// 過濾 web_vitals 事件
window.dataLayer.filter(e => e.event === 'web_vitals')
```

### 2. GTM Preview Mode
1. 開啟 GTM Preview Mode
2. 瀏覽網站並與頁面互動
3. 在 GTM Preview 面板中應該看到 `web_vitals` 事件
4. 檢查「資料層」區域應該看到所有參數

### 3. GA4 即時報告
1. 前往 GA4 → **報表** → **即時**
2. 瀏覽網站並與頁面互動
3. 應該在「事件數（最後 30 分鐘）」中看到 `web_vitals` 事件

## 📝 開發模式日誌

在開發模式下（`NODE_ENV=development`），CWVTracker 會在 Console 中輸出日誌：

```
[CWV] LCP: { value: '2500ms', rating: 'good', delta: '150ms' }
[CWV] CLS: { value: '0.050', rating: 'good', delta: '50ms' }
[CWV] INP: { value: '180ms', rating: 'good', delta: '20ms' }
```

## ⚠️ 注意事項

### 1. CLS 數值格式
- **dataLayer**: CLS 值會乘以 1000（例如：0.1 → 100）
- **GA4**: 同樣使用乘以 1000 的值
- **原因**: 保持整數格式，避免小數點精度問題

### 2. 指標觸發時機
- **LCP**: 頁面載入時觸發一次
- **CLS**: 頁面載入期間持續監測，最終值在頁面卸載時發送
- **INP**: 用戶互動時觸發（可能多次）

### 3. 去重
- 每個指標都有唯一的 `metric_id`
- 可以用於去重和追蹤同一指標的多個測量值

## 🔍 疑難排解

### 問題 1: 看不到 web_vitals 事件
- **檢查**: 確認 `web-vitals` 套件已安裝
- **檢查**: 確認 CWVTracker 組件已啟用（在 `app/layout.tsx` 中）
- **檢查**: 瀏覽器 Console 是否有錯誤

### 問題 2: 數據不完整
- **檢查**: 確認所有自訂變數已正確建立
- **檢查**: 確認觸發條件的事件名稱是 `web_vitals`（完全一致）

### 問題 3: 數值異常
- **LCP/INP**: 應該以毫秒為單位（例如：2500 = 2.5秒）
- **CLS**: 應該以千分之一為單位（例如：100 = 0.1）

## ✅ 完成檢查清單

- [ ] `web-vitals` 套件已安裝
- [ ] CWVTracker 組件已啟用
- [ ] 所有自訂變數已建立
- [ ] `web_vitals` 觸發器已建立
- [ ] GA4 事件標籤已建立
- [ ] 在 GTM Preview Mode 中測試成功
- [ ] 在 GA4 即時報告中看到事件
- [ ] 已發布 GTM 變更

---

**最後更新**: 2024-11-11
**狀態**: ✅ 已實現並啟用

