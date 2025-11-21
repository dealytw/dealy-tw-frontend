# WordPress 語言選擇器改進指南

## 現狀分析

### 當前 HK 網站語言選擇器（第 1895-1983 行）
- 使用簡單的 `▾` 字符作為下拉圖標
- 使用 `<a>` 標籤
- 樣式較簡單

### TW 網站語言選擇器特點
- 使用 ChevronDown 圖標（向下箭頭）
- 更現代的樣式（rounded-md, hover 效果）
- 使用按鈕，更好的交互體驗
- 動畫效果（旋轉箭頭）

## 改進方案

### 替換現有語言選擇器代碼

**移除第 1895-1983 行**（整個語言選擇器相關代碼），替換為以下改進版本：

```php
// Footer language switcher HTML (Improved - Similar to TW site)
function dealy_footer_lang_switcher() {
    $current_path = strtok($_SERVER['REQUEST_URI'], '?');
    
    // Map current path to TW equivalent
    $main_pages = ['/', '/shop', '/special-offers', '/blog'];
    $tw_path = in_array($current_path, $main_pages) ? $current_path : '/';
    $tw_url = 'https://dealy.tw' . $tw_path;
    ?>
    <div class="footer-lang-switcher">
        <button 
            class="footer-lang-btn" 
            type="button"
            aria-label="Switch language"
            aria-expanded="false"
            id="footer-lang-btn"
        >
            <span class="footer-lang-text">繁體中文(香港)</span>
            <svg 
                class="footer-lang-chevron" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
        </button>
        <ul class="footer-lang-menu" id="footer-lang-menu">
            <li class="is-active">
                <button 
                    type="button"
                    class="footer-lang-option"
                    data-lang="hk"
                    data-url="https://dealy.hk<?php echo esc_attr($current_path); ?>"
                >
                    繁體中文(香港)
                </button>
            </li>
            <li>
                <button 
                    type="button"
                    class="footer-lang-option"
                    data-lang="tw"
                    data-url="<?php echo esc_url($tw_url); ?>"
                >
                    繁體中文(台灣)
                </button>
            </li>
        </ul>
    </div>
<?php }
add_action('wp_footer', 'dealy_footer_lang_switcher', 20);

// Styles for footer language switcher (Improved - Similar to TW site)
function dealy_footer_lang_switcher_styles() { ?>
    <style>
        .footer-lang-switcher {
            position: relative;
            display: inline-block;
            font-size: 14px;
        }
        
        .footer-lang-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #374151; /* text-gray-700 */
            font-size: 14px;
            border-radius: 6px;
            transition: all 0.2s ease;
        }
        
        .footer-lang-btn:hover {
            background-color: #f9fafb; /* hover:bg-gray-50 */
            color: #e6007e; /* hover:text-primary */
        }
        
        .footer-lang-text {
            white-space: nowrap;
        }
        
        .footer-lang-chevron {
            width: 16px;
            height: 16px;
            transition: transform 0.2s ease;
            flex-shrink: 0;
        }
        
        .footer-lang-switcher.is-open .footer-lang-chevron {
            transform: rotate(180deg);
        }
        
        .footer-lang-menu {
            position: absolute;
            right: 0;
            bottom: 100%;
            margin-bottom: 8px;
            list-style: none;
            padding: 4px 0;
            margin: 0 0 8px 0;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            border: 1px solid #e5e7eb; /* border-gray-200 */
            min-width: 192px; /* w-48 */
            display: none;
            z-index: 50;
        }
        
        .footer-lang-switcher.is-open .footer-lang-menu {
            display: block;
        }
        
        .footer-lang-menu li {
            margin: 0;
            padding: 0;
        }
        
        .footer-lang-option {
            width: 100%;
            text-align: left;
            padding: 8px 16px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #374151; /* text-gray-700 */
            font-size: 14px;
            transition: background-color 0.2s ease;
        }
        
        .footer-lang-option:hover {
            background-color: #f9fafb; /* hover:bg-gray-50 */
        }
        
        .footer-lang-menu li.is-active .footer-lang-option {
            background-color: rgba(230, 0, 126, 0.1); /* bg-primary/10 */
            color: #e6007e; /* text-primary */
            font-weight: 500; /* font-medium */
        }
    </style>
<?php }
add_action('wp_head', 'dealy_footer_lang_switcher_styles');

// JS for opening/closing the dropdown (Improved - Similar to TW site)
function dealy_footer_lang_switcher_script() { ?>
    <script>
    (function() {
        document.addEventListener('DOMContentLoaded', function () {
            const switcher = document.querySelector('.footer-lang-switcher');
            const btn = document.querySelector('.footer-lang-btn');
            const menu = document.querySelector('.footer-lang-menu');
            const options = document.querySelectorAll('.footer-lang-option');
            
            if (!switcher || !btn || !menu) return;
            
            // Toggle dropdown
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                switcher.classList.toggle('is-open');
                btn.setAttribute('aria-expanded', switcher.classList.contains('is-open'));
            });
            
            // Handle language selection
            options.forEach(function(option) {
                option.addEventListener('click', function() {
                    const url = this.getAttribute('data-url');
                    if (url) {
                        window.location.href = url;
                    }
                });
            });
            
            // Close dropdown when clicking outside
            document.addEventListener('click', function (e) {
                if (!switcher.contains(e.target)) {
                    switcher.classList.remove('is-open');
                    btn.setAttribute('aria-expanded', 'false');
                }
            });
            
            // Close dropdown on Escape key
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && switcher.classList.contains('is-open')) {
                    switcher.classList.remove('is-open');
                    btn.setAttribute('aria-expanded', 'false');
                }
            });
        });
    })();
    </script>
<?php }
add_action('wp_footer', 'dealy_footer_lang_switcher_script', 30);
```

## 改進內容

### 1. 視覺改進
- ✅ 使用 SVG 箭頭圖標（代替 `▾` 字符）
- ✅ 添加旋轉動畫（打開時箭頭旋轉 180 度）
- ✅ 更現代的樣式（rounded, shadow, hover 效果）
- ✅ 更好的間距和對齊

### 2. 功能改進
- ✅ 使用 `<button>` 代替 `<a>` 標籤（更好的語義和可訪問性）
- ✅ 添加 `aria-expanded` 屬性（可訪問性）
- ✅ 支持 Escape 鍵關閉
- ✅ 改進的路徑映射（商家頁面映射到 TW 主頁）

### 3. 與 TW 網站的一致性
- ✅ 相同的視覺風格
- ✅ 相同的交互行為
- ✅ 相同的顏色方案（pink primary color）

## 整合步驟

1. **移除舊代碼**（第 1895-1983 行）
2. **添加新代碼**（替換為上面的改進版本）
3. **測試**：檢查下拉菜單是否正常工作

## 關於 hreflang

**重要**：移除第 1984-1997 行的 `dealy_hreflang_tags()` 函數**不會影響**語言選擇器，因為：
- 語言選擇器是 UI 組件（第 1895-1983 行）
- hreflang 函數是 SEO 標籤輸出（第 1984-1997 行）
- 兩者完全獨立

移除舊的 hreflang 函數後，新的 hreflang 實現（在文件末尾）會處理 SEO 標籤。

