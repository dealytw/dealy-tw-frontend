<?php
/**
 * WordPress Hreflang Implementation
 * 
 * Add this to your WordPress theme's functions.php or create a custom plugin
 * 
 * This is a TEMPORARY solution until WordPress migration to Next.js
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
 * 
 * Format: 'hk-slug' => 'tw-slug'
 * 
 * Note: If a HK merchant is not in this mapping, hreflang will only show
 * self + x-default (which is acceptable for SEO)
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
 * Add this hook in functions.php or header.php
 */
function dealy_output_hreflang_tags() {
    echo "\n    " . dealy_generate_hreflang_tags() . "\n";
}
add_action('wp_head', 'dealy_output_hreflang_tags', 1);

/**
 * Also add canonical tag (self-referential)
 */
function dealy_output_canonical_tag() {
    $current_url = 'https://dealy.hk' . $_SERVER['REQUEST_URI'];
    echo sprintf(
        "\n    <link rel=\"canonical\" href=\"%s\" />\n",
        esc_url($current_url)
    );
}
add_action('wp_head', 'dealy_output_canonical_tag', 2);

