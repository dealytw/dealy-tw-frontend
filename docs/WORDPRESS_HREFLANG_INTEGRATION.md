# WordPress Hreflang 整合指南

## 現有代碼分析

你的 `functions.php` 中有以下舊的 hreflang 代碼需要**移除或替換**：

1. **第 6-8 行**：簡單的 hreflang="zh-HK" 輸出
2. **第 1875-1879 行**：只為 shop 頁面輸出 x-default
3. **第 1984-1997 行**：`dealy_hreflang_tags()` 函數（簡單版本）

## 整合步驟

### 步驟 1: 移除舊的 hreflang 代碼

**移除第 6-8 行**：
```php
// 刪除這三行：
add_action('wp_head', function() {
    echo '<link rel="alternate" hreflang="zh-HK" href="' . esc_url( home_url( add_query_arg( null, null ) ) ) . '" />' . "\n";
});
```

**移除第 1875-1879 行**：
```php
// 刪除這五行：
add_action('wp_head', function () {
    if (is_singular('shop')) {
        echo '<link rel="alternate" hreflang="x-default" href="' . esc_url( rtrim(get_permalink(), '/') ) . '">' . "\n";
    }
}, 1);
```

**替換第 1984-1997 行**：
```php
// 刪除整個 dealy_hreflang_tags() 函數和它的 add_action
function dealy_hreflang_tags() {
    // ... 整個函數 ...
}
add_action( 'wp_head', 'dealy_hreflang_tags' );
```

### 步驟 2: 在文件末尾添加新的完整 hreflang 代碼

在 `functions.php` 的最後（在 `?>` 之前，如果有的話），添加以下代碼：

```php
/**
 * Dealy HK Hreflang Implementation (Complete)
 * Temporary solution until WordPress migration to Next.js
 * 
 * Replaces old simple hreflang implementation with merchant mapping support
 */

/**
 * Mapping: HK merchant slug → TW merchant slug
 * 
 * Auto-generated from sitemaps:
 * - HK: https://dealy.hk/shop-sitemap.xml (145 merchants)
 * - TW: https://dealy.tw/shop-sitemap.xml (70 merchants)
 * 
 * Generated: 2025-11-21
 * Total mappings: 40 merchants
 */
function dealy_get_hk_to_tw_mapping() {
    return [
        'adidas-hk' => 'adidas.com.tw',
        'agoda' => 'agoda.com',
        'asos' => 'asos.com',
        'bobbi-brown' => 'bobbibrown.com.tw',
        'booking-com' => 'booking.com',
        'calvin-klein' => 'calvinklein.com.tw',
        'chow-sang-sang' => 'chow-sang-sang-tw',
        'clinique' => 'clinique.com.tw',
        'dyson' => 'dyson.tw',
        'end-clothing' => 'endclothing.com',
        'estee-lauder' => 'esteelauder.com.tw',
        'expedia' => 'expedia.com.tw',
        'farfetch' => 'farfetch.com',
        'fila' => 'fila.com.tw',
        'harvey-nichols' => 'harveynichols.com',
        'hotels-com' => 'tw.hotels.com',
        'iherb' => 'tw.iherb.com',
        'jo-malone' => 'jomalone.com.tw',
        'kkday' => 'kkday.com',
        'klook' => 'klook.com',
        'lancome' => 'lancome.com.tw',
        'lenovo' => 'lenovo.com',
        'lg' => 'lg.com',
        'lookfantastic' => 'lookfantastic.com',
        'love-bonito' => 'lovebonito.com',
        'msi' => 'tw.msi.com',
        'nike-hk' => 'nike.com',
        'olive-young-global' => 'global.oliveyoung.com',
        'pinkoi' => 'pinkoi.com',
        'pizza-hut' => 'pizzahut.com.tw',
        'polo-ralph-lauren' => 'ralphlauren.com.tw',
        'puma' => 'tw.puma.com',
        'qatar-airways' => 'qatarairways.com',
        'rakuten-travel' => 'travel.rakuten.com',
        'samsung' => 'samsung.com',
        'sephora-hk' => 'sephora.com',
        'strawberrynet-hk' => 'strawberrynet.com',
        'taobao' => 'taobao.com',
        'the-body-shop' => 'thebodyshop.com.tw',
        'trip-com' => 'trip.com',
    ];
}

/**
 * Get current page path (without domain)
 */
function dealy_get_current_path() {
    return $_SERVER['REQUEST_URI'];
}

/**
 * Extract merchant slug from URL
 * Example: /shop/farfetch → farfetch
 */
function dealy_extract_merchant_slug($path) {
    if (preg_match('#/shop/([^/]+)#', $path, $matches)) {
        return $matches[1];
    }
    return null;
}

/**
 * Generate hreflang tags for current page
 */
function dealy_generate_hreflang_tags() {
    $current_path = dealy_get_current_path();
    $current_domain = 'https://dealy.hk';
    $alternate_domain = 'https://dealy.tw';
    $default_domain = 'https://dealy.tw'; // x-default always points to TW
    
    $tags = [];
    
    // Always add self reference (HK)
    $tags[] = sprintf(
        '<link rel="alternate" hreflang="zh-HK" href="%s%s" />',
        esc_url($current_domain),
        esc_attr($current_path)
    );
    
    // Check if this is a merchant page
    $merchant_slug = dealy_extract_merchant_slug($current_path);
    
    if ($merchant_slug) {
        // Merchant page: find TW version
        $mapping = dealy_get_hk_to_tw_mapping();
        
        if (isset($mapping[$merchant_slug])) {
            $tw_slug = $mapping[$merchant_slug];
            $tw_path = '/shop/' . $tw_slug;
            
            $tags[] = sprintf(
                '<link rel="alternate" hreflang="zh-TW" href="%s%s" />',
                esc_url($alternate_domain),
                esc_attr($tw_path)
            );
        }
    } else {
        // Main page: same path on both domains
        $main_pages = ['/', '/shop', '/special-offers', '/blog'];
        
        if (in_array($current_path, $main_pages) || $current_path === '') {
            $tags[] = sprintf(
                '<link rel="alternate" hreflang="zh-TW" href="%s%s" />',
                esc_url($alternate_domain),
                esc_attr($current_path)
            );
        }
    }
    
    // Always add x-default (points to TW)
    $default_path = $current_path;
    if ($merchant_slug) {
        $mapping = dealy_get_hk_to_tw_mapping();
        if (isset($mapping[$merchant_slug])) {
            $default_path = '/shop/' . $mapping[$merchant_slug];
        }
    }
    
    $tags[] = sprintf(
        '<link rel="alternate" hreflang="x-default" href="%s%s" />',
        esc_url($default_domain),
        esc_attr($default_path)
    );
    
    return implode("\n    ", $tags);
}

/**
 * Output hreflang tags in <head>
 * Priority 1: Early in head (before other meta tags)
 */
function dealy_output_hreflang_tags() {
    echo "\n    " . dealy_generate_hreflang_tags() . "\n";
}
add_action('wp_head', 'dealy_output_hreflang_tags', 1);

/**
 * Also add canonical tag (self-referential)
 * Priority 2: After hreflang, before other meta tags
 * 
 * Note: If Rank Math or another plugin already outputs canonical,
 * you may want to remove this function or adjust priority
 */
function dealy_output_canonical_tag() {
    // Check if canonical already exists (Rank Math usually handles this)
    // Only add if not already present
    $current_url = 'https://dealy.hk' . $_SERVER['REQUEST_URI'];
    echo sprintf(
        "\n    <link rel=\"canonical\" href=\"%s\" />\n",
        esc_url($current_url)
    );
}
// Uncomment the line below if you want to add canonical tag
// add_action('wp_head', 'dealy_output_canonical_tag', 2);
```

## 重要注意事項

### 1. Canonical 標籤
- 你的網站使用 **Rank Math**，它通常會自動處理 canonical 標籤
- 新代碼中的 `dealy_output_canonical_tag()` 函數預設是**註釋掉的**
- 如果 Rank Math 已經輸出 canonical，**不要啟用**這個函數（避免重複）
- 如果 Rank Math 沒有輸出 canonical，可以取消註釋 `add_action` 行

### 2. 優先級設置
- `dealy_output_hreflang_tags`: priority 1（最早輸出）
- `dealy_output_canonical_tag`: priority 2（如果需要啟用）

### 3. 測試
部署後，訪問以下頁面並檢查源碼：
- 主頁：`https://dealy.hk/`
- 商家頁面：`https://dealy.hk/shop/farfetch`
- 應該看到正確的 hreflang 標籤

## 快速整合清單

- [ ] 移除第 6-8 行的舊 hreflang 代碼
- [ ] 移除第 1875-1879 行的舊 x-default 代碼
- [ ] 移除第 1984-1997 行的 `dealy_hreflang_tags()` 函數
- [ ] 在文件末尾添加新的完整 hreflang 代碼
- [ ] 檢查 Rank Math 是否已輸出 canonical（如果是，保持 `dealy_output_canonical_tag` 註釋）
- [ ] 保存文件並測試

## 預期輸出

### 主頁 (`https://dealy.hk/`)
```html
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/" />
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/" />
<link rel="alternate" hreflang="x-default" href="https://dealy.tw/" />
```

### 商家頁面 (`https://dealy.hk/shop/farfetch`)
```html
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/shop/farfetch" />
<link rel="alternate" hreflang="zh-TW" href="https://dealy.tw/shop/farfetch.com" />
<link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/farfetch.com" />
```

### 沒有映射的商家頁面
```html
<link rel="alternate" hreflang="zh-HK" href="https://dealy.hk/shop/some-merchant" />
<link rel="alternate" hreflang="x-default" href="https://dealy.tw/shop/some-merchant" />
```

