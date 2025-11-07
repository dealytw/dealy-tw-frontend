# Cloudflare 設定指南

## 目標
優化 `/upload/*` 圖片請求的快取和性能

## 前置條件
- ✅ 域名已連接到 Cloudflare
- ✅ DNS 記錄已設定
- ✅ SSL/TLS 已啟用（自動）

---

## 步驟 1: 設定 Page Rules（推薦）

### 1.1 進入 Page Rules
1. 登入 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 選擇域名 `dealy.tw`
3. 左側選單：**Rules** → **Page Rules**

### 1.2 建立新規則
點擊 **Create Page Rule**

**URL Pattern:**
```
dealy.tw/upload/*
```

**Settings (按順序添加):**

1. **Cache Level**
   - 選擇：`Cache Everything`
   - 說明：快取所有 `/upload/*` 請求

2. **Edge Cache TTL**
   - 選擇：`1 month`
   - 說明：在 Cloudflare 邊緣節點快取 1 個月

3. **Browser Cache TTL**
   - 選擇：`1 month`
   - 說明：瀏覽器快取 1 個月

4. **Cache Deception Armor**
   - 選擇：`On`（可選）
   - 說明：防止快取欺騙攻擊

**最終設定：**
```
URL: dealy.tw/upload/*
Settings:
  ✓ Cache Level: Cache Everything
  ✓ Edge Cache TTL: 1 month
  ✓ Browser Cache TTL: 1 month
  ✓ Cache Deception Armor: On
```

點擊 **Save and Deploy**

---

## 步驟 2: 驗證快取設定（可選）

### 2.1 檢查快取狀態
1. 訪問：`https://dealy.tw/upload/tripcom_5eff0330bd.webp`
2. 打開瀏覽器開發者工具（F12）
3. 查看 **Network** 標籤
4. 檢查響應標頭：

**應該看到：**
```
CF-Cache-Status: HIT (已快取) 或 MISS (未快取，第一次)
Cache-Control: public, max-age=31536000, immutable
```

### 2.2 測試快取
1. **第一次請求**：應該看到 `CF-Cache-Status: MISS`
2. **第二次請求**（幾秒後）：應該看到 `CF-Cache-Status: HIT`
3. 如果看到 `HIT`，表示快取正常運作

---

## 步驟 3: 優化設定（進階，可選）

### 3.1 啟用 Auto Minify（可選）
1. **Speed** → **Optimization** → **Auto Minify**
2. 對圖片無影響，但可以優化其他資源

### 3.2 啟用 Brotli 壓縮
1. **Speed** → **Optimization** → **Compression**
2. 確保 **Brotli** 已啟用
3. 可以進一步壓縮圖片傳輸

### 3.3 設定 Always Online（可選）
1. **Caching** → **Configuration**
2. 啟用 **Always Online**
3. 即使 Next.js 伺服器暫時不可用，也能提供快取的圖片

---

## 步驟 4: 監控和驗證

### 4.1 檢查 Analytics
1. **Analytics** → **Performance**
2. 查看快取命中率（Cache Hit Ratio）
3. 目標：應該 > 80%

### 4.2 測試性能
使用工具測試：
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [WebPageTest](https://www.webpagetest.org/)

**預期改善：**
- 圖片載入時間：減少 50-80%
- 伺服器負載：減少 70-90%（快取命中時）

---

## 步驟 5: 清除快取（如需要）

### 5.1 清除特定 URL
1. **Caching** → **Configuration** → **Purge Cache**
2. 選擇 **Custom Purge**
3. 輸入：`https://dealy.tw/upload/tripcom_5eff0330bd.webp`
4. 點擊 **Purge**

### 5.2 清除所有快取
1. **Caching** → **Configuration** → **Purge Cache**
2. 選擇 **Purge Everything**
3. ⚠️ 注意：這會清除所有快取，影響性能

---

## 常見問題

### Q1: 為什麼圖片還是 404？
**A:** 檢查：
1. Next.js API route 是否正常運作
2. Strapi CDN URL 是否正確
3. 瀏覽器開發者工具中的實際請求 URL

### Q2: 快取沒有生效？
**A:** 檢查：
1. Page Rule 是否正確設定
2. URL Pattern 是否匹配（注意大小寫）
3. 等待幾分鐘讓規則生效

### Q3: 如何強制更新快取？
**A:** 
1. 使用 **Purge Cache** 清除特定 URL
2. 或修改檔名（Strapi 會自動生成新的 hash）

### Q4: 快取會影響 SEO 嗎？
**A:** 不會。快取只影響性能，不影響 SEO。Schema 中的 URL 仍然正確。

---

## 預期效果

### 性能提升
- **首次載入**：200-500ms（經過 Next.js）
- **快取後**：10-50ms（從 Cloudflare 邊緣節點）
- **提升**：80-95% 的響應時間改善

### 成本降低
- **伺服器負載**：減少 70-90%（快取命中時）
- **頻寬成本**：減少（從 Cloudflare 提供，而非原始伺服器）

### 用戶體驗
- **更快的圖片載入**
- **更好的 Core Web Vitals 分數**
- **更穩定的服務**（即使 Next.js 暫時不可用）

---

## 檢查清單

- [ ] Page Rule 已建立
- [ ] URL Pattern 正確：`dealy.tw/upload/*`
- [ ] Cache Level 設為 `Cache Everything`
- [ ] Edge Cache TTL 設為 `1 month`
- [ ] Browser Cache TTL 設為 `1 month`
- [ ] 測試圖片 URL 可正常訪問
- [ ] 檢查 `CF-Cache-Status` 標頭
- [ ] 驗證快取命中率 > 80%
- [ ] 監控性能改善

---

## 進階設定（可選）

### 使用 Cloudflare Workers（進階）
如果需要更複雜的邏輯（如 hash 映射），可以使用 Workers：

1. **Workers & Pages** → **Create Application**
2. 建立 Worker 處理 `/upload/*` 請求
3. 在 Worker 中實現 hash 映射邏輯

**但當前 Next.js API route 方案已經足夠，不需要 Workers。**

---

## 總結

### 必須設定
1. ✅ **Page Rule** 用於 `/upload/*` 快取

### 建議設定
2. ✅ **Brotli 壓縮**
3. ✅ **Always Online**

### 可選設定
4. ⏳ **Workers**（僅在需要複雜邏輯時）

### 監控
5. ✅ **Analytics** 查看快取命中率
6. ✅ **Performance** 測試工具驗證改善

完成以上設定後，圖片請求將從 Cloudflare 邊緣節點提供，大幅提升性能和用戶體驗！

