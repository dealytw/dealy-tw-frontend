# Frontend Optimization Audit (SEO + Speed)

**目的**: 在處理 content/keyword 之前，確保技術層面（非內容）已達最優化狀態。

**假設**: Cloudflare cache 等設定已優化 ✓

---

## 一、Cloudflare 設定檢查表（附導航指引）

完成每項後可截圖供確認。導航路徑以 Cloudflare Dashboard 左側選單為準。

### 1. Caching Level

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **Caching** → **Configuration** |
| **位置** | 頁面中的 **Caching level** 區塊 |
| **建議值** | **Standard** 或 **Aggressive** |
| **說明** | Standard = 依 query string 區分；Aggressive = 忽略 query string，快取更多 |

**截圖重點**: 顯示 Caching level 下拉選單及目前選取值

---

### 2. Browser Cache TTL

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **Caching** → **Configuration** |
| **位置** | 頁面中的 **Browser Cache TTL** 區塊 |
| **建議值** | **Respect Existing Headers** |
| **說明** | 依 origin 的 Cache-Control 決定，與 Next.js middleware 設定一致 |

**截圖重點**: 顯示 Browser Cache TTL 下拉選單及目前選取值

---

### 3. Brotli 壓縮

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **Speed** → **Optimization** |
| **位置** | **Content optimization** 區塊內的 **Brotli** |
| **建議值** | **On** / 已啟用 |
| **說明** | 壓縮 HTML/CSS/JS，減少傳輸量 |

**截圖重點**: 顯示 Brotli 為 On

---

### 4. Auto Minify（可選）

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **Speed** → **Optimization** |
| **位置** | **Content optimization** 區塊 |
| **建議值** | HTML、CSS、JavaScript 可全部勾選 |
| **說明** | 自動壓縮靜態資源 |

**截圖重點**: 顯示 Auto Minify 勾選狀態

---

### 5. /upload/* 快取規則（Page Rule 或 Cache Rule）

| 項目 | 說明 |
|------|------|
| **路徑 A** | 左側選單 → **Rules** → **Page Rules**（舊版） |
| **路徑 B** | 左側選單 → **Caching** → **Cache Rules**（新版，建議） |
| **URL 範例** | `dealy.tw/upload/*` 或 `*dealy.tw/upload/*` |
| **設定** | Cache Level: **Cache Everything**；Edge Cache TTL: **1 month**；Browser Cache TTL: **1 month** |

**Cache Rules 建立步驟**:
1. Caching → Cache Rules → **Create rule**
2. Rule name: `Upload images cache`
3. When incoming requests match: Custom filter → URI Path → contains → `/upload/`
4. Then: Cache eligibility = Eligible for cache；Edge TTL = 1 month；Browser TTL = 1 month

**截圖重點**: 顯示規則的 URL 條件及 Cache 設定

---

### 6. Always Online（可選）

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **Caching** → **Configuration** |
| **位置** | **Always Online** 開關 |
| **建議值** | **On** |
| **說明** | origin 暫時不可用時，仍可提供快取內容 |

**截圖重點**: 顯示 Always Online 為 On

---

### 7. Googlebot / Googlebot-Image 未被阻擋

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **Security** → **Bots** |
| **檢查** | 若使用 **Bot Fight Mode**（Free），無法為 Googlebot 設例外；若阻擋爬蟲，需關閉或改用 **Bot Management** |
| **路徑** | 左側選單 → **Security** → **WAF** → **Custom rules** |
| **建議** | 若有 rate limiting，可加規則：`(cf.client.bot)` → Action: Skip，讓 Cloudflare 認證的 bot 通過 |

**驗證方式**: 用 curl 模擬 Googlebot：
```bash
curl -A "Googlebot/2.1 (+http://www.google.com/bot.html)" -I "https://dealy.tw/"
# 應回 200，非 403/503
```

**截圖重點**: Security → Bots 頁面，或 WAF 中允許 verified bots 的規則

---

### 8. SSL/TLS

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **SSL/TLS** → **Overview** |
| **建議值** | **Full** 或 **Full (strict)** |
| **說明** | 確保 HTTPS 端對端加密 |

**截圖重點**: 顯示 SSL/TLS 加密模式

---

### 9. Cache Hit Ratio

| 項目 | 說明 |
|------|------|
| **路徑** | 左側選單 → **Analytics** → **Caching**（或 **Traffic**） |
| **位置** | **Cache Hit Ratio** 圖表 |
| **建議值** | **> 80%** |

**截圖重點**: 顯示 Cache Hit Ratio 圖表

---

## 二、Project 內已完成項目（無需再改）

以下項目已在 codebase 實作，你只需檢查 HTML 輸出是否正確。

### SEO（技術）

| 項目 | 狀態 | 驗證方式 |
|------|------|----------|
| Hreflang | ✓ 已實作 | View Source 搜尋 `hreflang=`，merchant/category/special-offer 頁應有 `<link rel="alternate" hreflang="zh-Hant-TW"` 等 |
| OG Image | ✓ 已實作 | Facebook Debugger / LinkedIn Post Inspector 檢查 merchant 頁 |
| Structured Data | ✓ 已實作 | [Rich Results Test](https://search.google.com/test/rich-results) 檢查 |
| Canonical、Meta、Favicon、robots.txt、Sitemap | ✓ | — |

### Speed

| 項目 | 狀態 |
|------|------|
| ISR、generateStaticParams、並行 metadata | ✓ |
| Middleware Cache-Control | ✓ |
| next/font、Script afterInteractive、CWV 追蹤 | ✓ |
| loading="lazy"、fetchPriority="high"、decoding="async" | ✓ |

### 已跳過（依你要求）

| 項目 | 說明 |
|------|------|
| next/image | 為節省 Vercel 資源，維持使用 `<img>` |

---

## 三、你需自行驗證的項目

以下為「確認輸出」，非改 code：

| # | 項目 | 驗證方式 |
|---|------|----------|
| 1 | Hreflang 出現在 HTML | View Source → 搜尋 `hreflang`，應有 `<link rel="alternate" hreflang="zh-Hant-TW" href="..." />` 等 |
| 2 | OG Image 正確 | [Facebook Debugger](https://developers.facebook.com/tools/debug/) 輸入 merchant 頁 URL，檢查預覽圖 |
| 3 | Structured Data 有效 | [Rich Results Test](https://search.google.com/test/rich-results) 輸入 merchant 頁 URL，無錯誤 |

---

## 四、快速驗證指令

```bash
# 1. 檢查 hreflang
curl -s "https://dealy.tw/shop/trip.com" | grep -o 'hreflang="[^"]*"'

# 2. 檢查 Cache headers
curl -I "https://dealy.tw/" | grep -i cache-control

# 3. 檢查 CF-Cache-Status
curl -I "https://dealy.tw/" | grep -i cf-cache

# 4. 模擬 Googlebot
curl -A "Googlebot/2.1 (+http://www.google.com/bot.html)" -I "https://dealy.tw/"
```

---

## 五、Cloudflare 檢查表總覽（勾選用）

| ☐ | 項目 | 路徑 |
|---|------|------|
| ☐ | 1. Caching Level | Caching → Configuration |
| ☐ | 2. Browser Cache TTL | Caching → Configuration |
| ☐ | 3. Brotli | Speed → Optimization |
| ☐ | 4. Auto Minify | Speed → Optimization |
| ☐ | 5. /upload/* 快取 | Rules → Page Rules 或 Caching → Cache Rules |
| ☐ | 6. Always Online | Caching → Configuration |
| ☐ | 7. Googlebot 未阻擋 | Security → Bots / WAF |
| ☐ | 8. SSL/TLS | SSL/TLS → Overview |
| ☐ | 9. Cache Hit Ratio > 80% | Analytics → Caching |

完成後可截圖各項畫面供確認。
