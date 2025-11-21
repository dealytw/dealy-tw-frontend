# WordPress Hreflang Implementation Plan (Temporary)

## 最簡單方案：使用 Sitemap + 硬編碼映射

### 步驟 1: 解析 TW Sitemap 建立反向映射

從 `https://dealy.tw/shop-sitemap.xml` 提取所有 TW merchant slugs，建立：
- **HK slug → TW slug** 映射表

### 步驟 2: 在 WordPress 中加入 PHP 代碼

在 WordPress 主題的 `functions.php` 或 `header.php` 中加入：

1. **硬編碼映射表**（HK slug → TW slug）
2. **函數**：根據當前 URL 生成 hreflang 標籤
3. **輸出**：在 `<head>` 中輸出 hreflang 標籤

### 步驟 3: 不需要 API

- ✅ 不需要 WordPress API
- ✅ 不需要 Strapi API
- ✅ 只需要靜態映射表
- ✅ 只需要解析當前 URL

## 實作時間

- **準備映射表**：5-10 分鐘（解析 sitemap）
- **寫 PHP 代碼**：10-15 分鐘
- **測試**：5 分鐘
- **總計**：約 30 分鐘

## 維護

- 當新增商家時，更新映射表
- 遷移後可以移除（使用 Next.js 版本）

