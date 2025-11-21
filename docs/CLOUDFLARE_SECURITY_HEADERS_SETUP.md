# Cloudflare 安全標頭設置指南

## 概述

本指南將幫助你在 Cloudflare 中設置安全標頭，確保所有資源（包括靜態文件）都有適當的安全標頭。

## 前置要求

- Cloudflare 帳號
- `dealy.tw` 域名已添加到 Cloudflare
- 管理員權限

---

## 步驟 1: 啟用 HSTS（推薦先做）

### 1.1 登入 Cloudflare Dashboard
1. 訪問 https://dash.cloudflare.com
2. 選擇 `dealy.tw` 域名

### 1.2 啟用 HSTS
1. 左側菜單：**SSL/TLS**
2. 點擊 **Edge Certificates** 標籤
3. 向下滾動找到 **HTTP Strict Transport Security (HSTS)**
4. 點擊 **Enable HSTS**
5. 在彈出窗口中：
   - ✅ 勾選 **Enable HSTS**
   - ✅ 勾選 **Apply HSTS policy to subdomains** (includeSubDomains)
   - ✅ 勾選 **Enable HSTS preload** (可選，但推薦)
   - **Max Age**: 選擇 `12 months` (31536000 秒)
6. 點擊 **Save**

**注意**: HSTS preload 需要提交到 [HSTS Preload List](https://hstspreload.org/)，這是一個可選步驟。

---

## 步驟 2: 設置 Transform Rules（添加安全標頭）

### 2.1 訪問 Transform Rules
1. 在 Cloudflare Dashboard 中，選擇 `dealy.tw` 域名
2. 左側菜單：**Rules**
3. 點擊 **Transform Rules**
4. 選擇 **Response Headers** 標籤

### 2.2 創建規則 1: 基本安全標頭（所有資源）

1. 點擊 **Create rule**
2. **Rule name**: `Security Headers - All Resources`
3. **When incoming requests match**:
   - **Field**: `Hostname`
   - **Operator**: `equals`
   - **Value**: `dealy.tw`
   - 點擊 **Add condition** 添加第二個條件：
     - **Field**: `Hostname`
     - **Operator**: `equals`
     - **Value**: `www.dealy.tw` (如果使用 www)
4. **Then the settings are**:
   - 點擊 **Set static** 下拉菜單，選擇 **Set response header**
   - 點擊 **Add header** 添加以下標頭：

#### Header 1: Referrer-Policy
- **Header name**: `Referrer-Policy`
- **Value**: `strict-origin-when-cross-origin`
- 點擊 **Add**

#### Header 2: X-Content-Type-Options
- **Header name**: `X-Content-Type-Options`
- **Value**: `nosniff`
- 點擊 **Add**

#### Header 3: X-Frame-Options
- **Header name**: `X-Frame-Options`
- **Value**: `SAMEORIGIN`
- 點擊 **Add**

5. 點擊 **Deploy** 保存規則

### 2.3 創建規則 2: HSTS Header（如果未在 SSL/TLS 中啟用）

**注意**: 如果已在步驟 1 中啟用 HSTS，可以跳過此步驟。

1. 點擊 **Create rule**
2. **Rule name**: `HSTS Header`
3. **When incoming requests match**:
   - **Field**: `Hostname`
   - **Operator**: `equals`
   - **Value**: `dealy.tw`
4. **Then the settings are**:
   - 點擊 **Set static** → **Set response header**
   - **Header name**: `Strict-Transport-Security`
   - **Value**: `max-age=31536000; includeSubDomains; preload`
   - 點擊 **Deploy**

---

## 步驟 3: 驗證設置

### 3.1 使用瀏覽器開發者工具
1. 訪問 https://dealy.tw
2. 打開開發者工具 (F12)
3. 切換到 **Network** 標籤
4. 刷新頁面
5. 選擇任意請求（例如主頁或 JS 文件）
6. 查看 **Response Headers**，應該看到：
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`

### 3.2 使用命令行工具
```bash
# 檢查主頁
curl -I https://dealy.tw

# 檢查靜態資源
curl -I https://dealy.tw/_next/static/chunks/main.js

# 檢查圖片
curl -I https://dealy.tw/_next/image?url=...
```

應該看到所有安全標頭都在響應中。

### 3.3 使用在線工具
- [SecurityHeaders.com](https://securityheaders.com/?q=https://dealy.tw)
- [Mozilla Observatory](https://observatory.mozilla.org/analyze/dealy.tw)

---

## 步驟 4: 測試靜態資源

### 4.1 檢查 Next.js 靜態文件
訪問以下 URL 並檢查 Response Headers：
- `https://dealy.tw/_next/static/chunks/[hash].js`
- `https://dealy.tw/_next/image?url=...`
- `https://dealy.tw/upload/[image].webp`

所有這些資源都應該包含安全標頭。

---

## 步驟 5: 重新運行 Screaming Frog

1. 打開 Screaming Frog SEO Spider
2. 輸入 URL: `https://dealy.tw`
3. 開始爬取
4. 檢查 **Security** 標籤
5. 應該看到安全標頭警告大幅減少或消失

---

## 常見問題

### Q1: 規則沒有生效？
**A**: 
- 確認規則已 **Deploy**
- 清除 Cloudflare 緩存：**Caching** → **Configuration** → **Purge Everything**
- 等待 1-2 分鐘讓規則生效

### Q2: 某些資源仍然缺少標頭？
**A**: 
- 確認規則的 **Hostname** 條件正確
- 檢查是否有其他規則覆蓋了這些標頭
- 確認資源是通過 Cloudflare 提供的（不是直接從源服務器）

### Q3: HSTS preload 需要多久？
**A**: 
- 提交到 HSTS Preload List 後，通常需要 1-2 週才能被瀏覽器採用
- 這是一個可選步驟，不影響基本 HSTS 功能

### Q4: 是否會影響性能？
**A**: 
- 不會。添加響應標頭對性能影響微乎其微（< 1ms）
- Cloudflare 在邊緣處理，不會增加源服務器負擔

---

## 規則優先級

如果有多個規則，Cloudflare 會按以下順序處理：
1. **Page Rules** (最高優先級)
2. **Transform Rules**
3. **Origin 響應標頭** (最低優先級)

如果 Next.js 已經設置了標頭，Cloudflare 的規則會覆蓋它們（這正是我們想要的）。

---

## 完成後的檢查清單

- [ ] HSTS 已在 SSL/TLS 設置中啟用
- [ ] Transform Rule 1 已創建並部署（基本安全標頭）
- [ ] Transform Rule 2 已創建並部署（如果需要）
- [ ] 使用瀏覽器開發者工具驗證標頭
- [ ] 使用命令行工具驗證標頭
- [ ] 使用 SecurityHeaders.com 驗證
- [ ] 重新運行 Screaming Frog 確認問題解決
- [ ] 清除 Cloudflare 緩存

---

## 維護

### 更新規則
1. 訪問 **Rules** → **Transform Rules** → **Response Headers**
2. 找到要修改的規則
3. 點擊規則名稱進行編輯
4. 修改後點擊 **Save and Deploy**

### 監控
定期檢查：
- SecurityHeaders.com 評分
- Screaming Frog 掃描結果
- Cloudflare Analytics 中的安全事件

---

## 參考資源

- [Cloudflare Transform Rules 文檔](https://developers.cloudflare.com/rules/transform/)
- [HSTS Preload List](https://hstspreload.org/)
- [SecurityHeaders.com](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

---

## 備註

- 這些設置會應用到所有通過 Cloudflare 的流量
- 如果使用多個域名（dealy.tw, dealy.hk 等），需要為每個域名重複設置
- 建議在非高峰時段進行設置和測試

