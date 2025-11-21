// src/lib/seo.server.ts
import 'server-only';
import { strapiFetch, qs, getStartsAtFilterParams } from '@/lib/strapi.server';

// MERCHANT SEO (seo_title, seo_description, seo_canonical, seo_noindex)
export async function getMerchantSEO(slug: string, revalidate = 300) {
  const params = {
    'filters[page_slug][$eq]': slug,
    'fields[0]': 'id',
    'fields[1]': 'documentId',
    'fields[2]': 'merchant_name',
    'fields[3]': 'page_slug',
    'fields[4]': 'seo_title',
    'fields[5]': 'seo_description',
    'fields[6]': 'canonical_url',
    'fields[7]': 'robots',
  };

  return strapiFetch<{ data: any[] }>(`/api/merchants?${qs(params)}`, {
    revalidate,
    tag: `merchant:${slug}`
  });
}

// Get coupons for merchant (for SEO generation)
// Fetches ACTIVE coupons sorted by priority for SEO title/description generation
export async function getMerchantCouponsForSEO(merchantId: string, market = 'tw', revalidate = 300) {
  const params = {
    'filters[merchant][documentId][$eq]': merchantId,
    'filters[market][key][$eq]': market,
    'filters[coupon_status][$eq]': 'active',
    ...getStartsAtFilterParams(), // Filter out scheduled coupons (starts_at in the future)
    'fields[0]': 'id',
    'fields[1]': 'documentId',
    'fields[2]': 'coupon_title',
    'fields[3]': 'value',
    'fields[4]': 'expires_at',
    'fields[5]': 'priority',
    'sort': 'priority:asc',
    'pagination[pageSize]': '10', // Only need first 10 for SEO
  };

  const response = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, {
    revalidate,
    tag: `coupons:${merchantId}`
  });

  // Transform Strapi v5 attributes format to flat structure for SEO functions
  if (response?.data) {
    response.data = response.data.map((item: any) => ({
      id: item.id || item.documentId,
      documentId: item.documentId,
      coupon_title: item.attributes?.coupon_title || item.coupon_title,
      value: item.attributes?.value || item.value,
      expires_at: item.attributes?.expires_at || item.expires_at,
      priority: item.attributes?.priority || item.priority || 0,
    }));
  }

  return response;
}

// TOPIC SEO (if you have topics)
export async function getTopicSEO(slug: string, revalidate = 300) {
  const params = {
    'filters[page_slug][$eq]': slug,
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'page_slug',
    'fields[3]': 'seo_title',
    'fields[4]': 'seo_description',
    'fields[5]': 'canonical_url',
    'fields[6]': 'robots',
  };

  return strapiFetch<{ data: any[] }>(`/api/special-offers?${qs(params)}`, {
    revalidate,
    tag: `special-offer:${slug}`
  });
}

/**
 * Parse HK sitemap to extract merchant slugs
 * Caches the result for performance
 */
let hkMerchantSlugsCache: Set<string> | null = null;
let hkMerchantSlugsCacheTime: number = 0;
const HK_SITEMAP_CACHE_TTL = 3600 * 1000; // 1 hour in milliseconds

async function parseHKMerchantSitemap(): Promise<Set<string>> {
  const now = Date.now();
  
  // Return cached result if still valid
  if (hkMerchantSlugsCache && (now - hkMerchantSlugsCacheTime) < HK_SITEMAP_CACHE_TTL) {
    return hkMerchantSlugsCache;
  }

  try {
    const sitemapUrl = 'https://dealy.hk/shop-sitemap.xml';
    const response = await fetch(sitemapUrl, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      console.warn(`[parseHKMerchantSitemap] Failed to fetch sitemap: ${response.status}`);
      return new Set();
    }

    const xml = await response.text();
    const slugs = new Set<string>();

    // Parse XML to extract merchant slugs from /shop/ URLs
    // Pattern: <loc>https://dealy.hk/shop/{slug}</loc>
    const urlPattern = /<loc>https?:\/\/dealy\.hk\/shop\/([^<]+)<\/loc>/gi;
    let match;
    
    while ((match = urlPattern.exec(xml)) !== null) {
      const slug = match[1].trim();
      if (slug) {
        slugs.add(slug);
      }
    }

    // Update cache
    hkMerchantSlugsCache = slugs;
    hkMerchantSlugsCacheTime = now;

    console.log(`[parseHKMerchantSitemap] Parsed ${slugs.size} HK merchant slugs from sitemap`);
    return slugs;
  } catch (error) {
    console.error('[parseHKMerchantSitemap] Error parsing HK sitemap:', error);
    return new Set();
  }
}

/**
 * Hardcoded mapping of TW merchant_name to HK merchant slug
 * Generated from HK sitemap: https://dealy.hk/shop-sitemap.xml
 * Format: { 'TW merchant_name': 'HK slug' }
 * 
 * This mapping is used for hreflang tags to link TW and HK versions of same merchant.
 * If a merchant is not in this mapping, the system will try to match by normalized name.
 * 
 * To update: When new merchants are added, match TW merchant_name to HK slug and add here.
 */
const MERCHANT_NAME_TO_HK_SLUG_MAPPING: Record<string, string> = {
  // Travel & Booking
  'Agoda': 'agoda',
  'Booking.com': 'booking-com',
  'Expedia': 'expedia',
  'Hotels.com': 'hotels-com',
  'Klook': 'klook',
  'KKday': 'kkday',
  'Trip.com': 'trip-com',
  'Rakuten Travel': 'rakuten-travel',
  'Cathay Pacific': 'cathay-pacific',
  'HK Express': 'hk-express',
  'Qatar Airways': 'qatar-airways',
  'HK Ticketing': 'hk-ticketing',
  'Cityline': 'cityline',
  'Wingon Travel': 'wingon-travel',
  
  // Fashion & Beauty
  'Farfetch': 'farfetch',
  'ASOS': 'asos',
  'The Outnet': 'the-outnet',
  'Zalora': 'zalora-hk',
  'Nike': 'nike-hk',
  'Adidas': 'adidas-hk',
  'Uniqlo': 'uniqlo',
  'GU': 'gu',
  'Levi\'s': 'levis',
  'Vans': 'vans',
  'New Balance': 'new-balance',
  'Puma': 'puma',
  'Crocs': 'crocs',
  'Teva': 'teva',
  'Arena': 'arena',
  'The North Face': 'the-north-face',
  'Calvin Klein': 'calvin-klein',
  'Polo Ralph Lauren': 'polo-ralph-lauren',
  'Armani': 'armani',
  'Tory Burch': 'tory-burch',
  'Charles & Keith': 'charles-keith',
  'American Eagle': 'american-eagle',
  'UGG': 'ugg',
  'End Clothing': 'end-clothing',
  'Harrods': 'harrods',
  'Harvey Nichols': 'harvey-nichols',
  'Lane Crawford': 'lane-crawford',
  'The Hut': 'the-hut',
  'Catalog': 'catalog',
  
  // Beauty & Cosmetics
  'Sephora': 'sephora-hk',
  'Sasa': 'sasa',
  'Lookfantastic': 'lookfantastic',
  'Strawberrynet': 'strawberrynet-hk',
  'YesStyle': 'yesstyle',
  'Stylevana': 'stylevana',
  'Olive Young': 'olive-young-global',
  'Medicube': 'medicube',
  'Shu Uemura': 'shu-uemura',
  'Shiseido': 'shiseido',
  'Laneige': 'laneige',
  'Innisfree': 'innisfree',
  'The Body Shop': 'the-body-shop',
  'L\'Occitane': 'loccitane',
  'Melvita': 'melvita',
  'Origins': 'origins',
  'Clinique': 'clinique',
  'Estée Lauder': 'estee-lauder',
  'MAC': 'mac',
  'Bobbi Brown': 'bobbi-brown',
  'YSL Beauty': 'ysl-beauty',
  'Lancôme': 'lancome',
  'Kiehl\'s': 'kiehls',
  'Kerastase': 'kerastase',
  'Jo Malone': 'jo-malone',
  'NARS': 'nars',
  'Clarins': 'clarins',
  'Fancl': 'fancl',
  'Olay': 'olay',
  'Olens': 'olens',
  'Hapa Kristin': 'hapa-kristin',
  'Mentholatum': 'mentholatum',
  
  // Electronics & Tech
  'Apple': 'apple',
  'Samsung': 'samsung',
  'Microsoft': 'microsoft',
  'Lenovo': 'lenovo',
  'LG': 'lg',
  'Razer': 'razer',
  'Logitech': 'logitech',
  'MSI': 'msi',
  'Dyson': 'dyson',
  'Steam': 'steam',
  'McAfee': 'mcafee',
  'Code Academy': 'code-academy',
  
  // Retail & Shopping
  'IKEA': 'ikea',
  'MUJI': 'muji',
  'eBay': 'ebay',
  'Amazon Japan': 'amazon-japan',
  'Gmarket': 'gmarket',
  'Taobao': 'taobao',
  'Pinkoi': 'pinkoi',
  'Buyandship': 'buyandship',
  'Gethemall': 'gethemall',
  'Zinomall': 'zinomall',
  'ShopBack': 'shopback',
  
  // Health & Wellness
  'iHerb': 'iherb',
  'MyProtein': 'myprotein',
  'MyVitamins': 'myvitamins',
  'PHD': 'phd',
  'Emma': 'emma',
  'Sinomax': 'sinomax',
  'Ulike': 'ulike',
  
  // Food & Dining
  'Foodpanda': 'foodpanda',
  'OpenRice': 'openrice',
  'Pizza Hut': 'pizza-hut',
  'McDonald\'s': 'mcdonalds',
  '7-Eleven': '7-eleven',
  'Circle K': 'circle-k',
  
  // Pharmacy & Health
  'Watsons': 'watsons',
  'Mannings': 'mannings',
  'Parknshop': 'parknshop',
  'Aeon': 'aeon',
  'Wingon': 'wingon',
  'Fortress': 'fortress',
  'Broadway': 'broadway',
  'Price.com': 'price-com',
  
  // Books & Education
  'Eslite': 'eslite',
  'Joint Publishing': 'joint-publishing',
  
  // Services
  'Netvigator': 'netvigator',
  'Octopus': 'octopus',
  'PayMe': 'payme',
  'Alipay HK': 'alipay-hk',
  'Starr Insurance': 'starr-insurance',
  'Bowtie Insurance': 'bowtie-insurance',
  'The Club': 'the-club',
  'YOHO': 'yoho',
  'Marathon': 'marathon',
  'TSL': 'tsl',
  'Keeta': 'keeta',
  'Birdie': 'birdie',
  'Hopegoo': 'hopegoo',
  'Juice': 'juice',
  'Elecboy': 'elecboy',
  'Qpets': 'qpets',
  'HKTVmall': 'hktvmall',
  
  // Sports & Lifestyle
  'Wilson': 'wilson',
  'Hyundai': 'hyundai',
  
  // Additional merchants
  'Love Bonito': 'love-bonito',
  'Chow Sang Sang': 'chow-sang-sang',
  'Fila': 'fila',
  'Mabelle': 'mabelle',
  'Macy\'s': 'macy',
};

/**
 * Find alternate merchant in different market
 * For TW -> HK: Uses sitemap parsing + merchant_name mapping
 * For HK -> TW: Queries Strapi CMS by merchant_name
 * 
 * @param merchantName - The merchant_name to search for
 * @param currentMarket - Current market key (e.g., 'tw' or 'hk')
 * @param alternateMarket - Alternate market key (e.g., 'hk' or 'tw')
 * @param revalidate - Cache revalidation time in seconds
 * @returns The page_slug of the alternate merchant, or null if not found
 */
export async function findAlternateMerchant(
  merchantName: string,
  currentMarket: string,
  alternateMarket: string,
  revalidate = 300
): Promise<string | null> {
  if (!merchantName || currentMarket === alternateMarket) {
    return null;
  }

  // TW -> HK: Use sitemap + mapping
  if (currentMarket === 'tw' && alternateMarket === 'hk') {
    try {
      // First, check hardcoded mapping
      if (MERCHANT_NAME_TO_HK_SLUG_MAPPING[merchantName]) {
        const hkSlug = MERCHANT_NAME_TO_HK_SLUG_MAPPING[merchantName];
        // Verify slug exists in sitemap
        const hkSlugs = await parseHKMerchantSitemap();
        if (hkSlugs.has(hkSlug)) {
          return hkSlug;
        }
      }

      // If no mapping, try to find by merchant_name normalization
      // This is a fallback - ideally all merchants should be in the mapping
      const hkSlugs = await parseHKMerchantSitemap();
      
      // Try to match by normalizing merchant name to slug format
      const normalizedName = merchantName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Check if normalized name matches any HK slug
      if (hkSlugs.has(normalizedName)) {
        return normalizedName;
      }

      // Try partial match (e.g., "Farfetch" -> "farfetch")
      for (const slug of hkSlugs) {
        if (slug.includes(normalizedName) || normalizedName.includes(slug)) {
          return slug;
        }
      }

      return null;
    } catch (error) {
      console.error(`[findAlternateMerchant] Error finding HK merchant for ${merchantName}:`, error);
      return null;
    }
  }

  // HK -> TW: Query Strapi CMS (same database)
  if (currentMarket === 'hk' && alternateMarket === 'tw') {
    try {
      const params = {
        'filters[merchant_name][$eq]': merchantName,
        'filters[market][key][$eq]': alternateMarket,
        'fields[0]': 'page_slug',
        'fields[1]': 'merchant_name',
        'pagination[pageSize]': '1',
      };

      const response = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(params)}`, {
        revalidate,
        tag: `alternate-merchant:${merchantName}:${alternateMarket}`
      });

      if (response?.data && response.data.length > 0) {
        const alternateMerchant = response.data[0];
        return alternateMerchant.page_slug || null;
      }

      return null;
    } catch (error) {
      console.error(`[findAlternateMerchant] Error finding TW merchant for ${merchantName}:`, error);
      return null;
    }
  }

  return null;
}
