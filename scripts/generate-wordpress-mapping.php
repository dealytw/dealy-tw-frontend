<?php
/**
 * Generate WordPress hreflang mapping from TW sitemap
 * 
 * Usage:
 * 1. Fetch TW sitemap: https://dealy.tw/shop-sitemap.xml
 * 2. Parse to extract TW slugs
 * 3. Match with HK slugs to create reverse mapping
 * 4. Output PHP array for WordPress
 */

// HK slugs (from HK sitemap)
$hkSlugs = [
    'farfetch', 'agoda', 'klook', 'kkday', 'nike-hk', 'adidas-hk',
    // ... add all 145 HK slugs here
];

// This script should:
// 1. Parse TW sitemap XML
// 2. Extract TW slugs
// 3. Match HK slug → TW slug by merchant name
// 4. Generate PHP array

// Output format:
$mapping = [
    'farfetch' => 'farfetch.com',
    'agoda' => 'agoda',
    'klook' => 'klook',
    // ... more mappings
];

echo "<?php\n";
echo "// HK slug → TW slug mapping\n";
echo "\$hk_to_tw_mapping = [\n";
foreach ($mapping as $hk => $tw) {
    echo "    '$hk' => '$tw',\n";
}
echo "];\n";

