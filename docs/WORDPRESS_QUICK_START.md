# WordPress Hreflang 快速實作指南

## 最簡單方案（約 30 分鐘）

### 步驟 1: 準備映射表（5 分鐘）

**選項 A: 使用現有映射表**
- 我已經在 `WORDPRESS_HREFLANG_CODE.php` 中準備了 145+ 商家的映射表
- 可以直接使用

**選項 B: 自動生成（如果需要更新）**
```bash
# 在 dealy-tw-frontend 目錄下
node scripts/generate-wordpress-mapping.js
# 會生成 wordpress-mapping.php
```

### 步驟 2: 在 WordPress 中加入代碼（10 分鐘）

1. **打開 WordPress 主題的 `functions.php`**
   - 路徑：`wp-content/themes/your-theme/functions.php`

2. **複製整個 `WORDPRESS_HREFLANG_CODE.php` 的內容**
   - 貼到 `functions.php` 的最後

3. **保存文件**

### 步驟 3: 測試（5 分鐘）

1. 訪問任何商家頁面：`https://dealy.hk/shop/farfetch`
2. 查看頁面源碼（右鍵 → 查看頁面源碼）
3. 在 `<head>` 部分應該看到：
   ```html
   <link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/shop/farfetch" />
   <link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/shop/farfetch.com" />
   <link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/farfetch.com" />
   <link rel="canonical" href="https://dealy.hk/shop/farfetch" />
   ```

### 步驟 4: 驗證（5 分鐘）

使用 Google Search Console 或 [hreflang Tags Testing Tool](https://technicalseo.com/tools/hreflang/) 驗證

## 不需要做的事情

- ❌ 不需要設置 WordPress API
- ❌ 不需要設置 Strapi API
- ❌ 不需要數據庫查詢
- ❌ 不需要外部服務

## 維護

當新增商家時：
1. 更新 `dealy_get_hk_to_tw_mapping()` 函數中的映射表
2. 格式：`'hk-slug' => 'tw-slug',`

## 遷移後

遷移到 Next.js 後：
- 可以移除這段 PHP 代碼
- 使用 Next.js 版本的 hreflang 實作（已經完成）

## 文件說明

- `WORDPRESS_HREFLANG_CODE.php` - 完整的 PHP 代碼（可直接使用）
- `WORDPRESS_HREFLANG_PLAN.md` - 詳細計劃
- `generate-wordpress-mapping.js` - 自動生成映射表的腳本

