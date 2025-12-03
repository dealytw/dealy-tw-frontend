// src/lib/seo.server.ts
import 'server-only';
import { strapiFetch, qs, getStartsAtFilterParams } from '@/lib/strapi.server';

// MERCHANT SEO (seo_title, seo_description, seo_canonical, seo_noindex, ogImage, logo)
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
    'populate[ogImage][fields][0]': 'url',
    'populate[logo][fields][0]': 'url',
  };

  const response = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(params)}`, {
    revalidate,
    tag: `merchant:${slug}`
  });

  // Transform Strapi v5 attributes format to flat structure (supports Chinese characters)
  // This ensures merchant_name works regardless of whether populate is used
  if (response?.data) {
    response.data = response.data.map((item: any) => {
      // Handle populated fields (ogImage, logo) - check nested structures
      const getPopulatedField = (fieldName: string) => {
        const attrField = item.attributes?.[fieldName];
        const rootField = item[fieldName];
        
        // Handle nested data structure: { data: { attributes: { url: ... } } }
        if (attrField?.data) {
          return Array.isArray(attrField.data) ? attrField.data[0] : attrField.data;
        }
        if (attrField) return attrField;
        
        if (rootField?.data) {
          return Array.isArray(rootField.data) ? rootField.data[0] : rootField.data;
        }
        return rootField || null;
      };

      return {
        id: item.id || item.documentId,
        documentId: item.documentId,
        merchant_name: item.attributes?.merchant_name || item.merchant_name || '',
        page_slug: item.attributes?.page_slug || item.page_slug,
        seo_title: item.attributes?.seo_title || item.seo_title,
        seo_description: item.attributes?.seo_description || item.seo_description,
        canonical_url: item.attributes?.canonical_url || item.canonical_url,
        robots: item.attributes?.robots || item.robots,
        ogImage: getPopulatedField('ogImage'),
        logo: getPopulatedField('logo'),
      };
    });
  }

  return response;
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
 * ⚠️ TEMPORARY SOLUTION: This is a temporary hardcoded mapping.
 * When HK site migrates to Next.js, this should be replaced with a dynamic solution
 * (e.g., shared database query or API endpoint). See docs/HK_MERCHANT_HREFLANG_MAPPING.md
 * 
 * To update: When new merchants are added, match TW merchant_name to HK slug and add here.
 * Note: HK slugs may differ from TW slugs (e.g., "booking.com" → "booking-com").
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
 * Find alternate merchant by page_slug (simplified matching)
 * Matches TW page_slug to HK sitemap slugs using flexible name-based matching
 * 
 * @param pageSlug - The page_slug to search for (e.g., "adidas", "booking.com")
 * @param currentMarket - Current market key (e.g., 'tw' or 'hk')
 * @param alternateMarket - Alternate market key (e.g., 'hk' or 'tw')
 * @param revalidate - Cache revalidation time in seconds
 * @returns The page_slug of the alternate merchant, or null if not found
 */
export async function findAlternateMerchantBySlug(
  pageSlug: string,
  currentMarket: string,
  alternateMarket: string,
  revalidate = 300
): Promise<string | null> {
  if (!pageSlug || currentMarket === alternateMarket) {
    return null;
  }

  // TW -> HK: Match page_slug to HK sitemap slugs
  if (currentMarket === 'tw' && alternateMarket === 'hk') {
    try {
      const hkSlugs = await parseHKMerchantSitemap();
      
      // Normalize TW slug for matching
      const normalizedSlug = pageSlug
        .toLowerCase()
        .replace(/\./g, '-') // Convert dots to hyphens (e.g., "booking.com" -> "booking-com")
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '');
      
      // Strategy 1: Exact match (e.g., "adidas" -> "adidas")
      if (hkSlugs.has(normalizedSlug)) {
        return normalizedSlug;
      }
      
      // Strategy 2: With "-hk" suffix (e.g., "adidas" -> "adidas-hk")
      const withHkSuffix = `${normalizedSlug}-hk`;
      if (hkSlugs.has(withHkSuffix)) {
        return withHkSuffix;
      }
      
      // Strategy 3: Without "-hk" suffix (e.g., "adidas-hk" -> "adidas")
      if (normalizedSlug.endsWith('-hk')) {
        const withoutHkSuffix = normalizedSlug.slice(0, -3); // Remove "-hk"
        if (hkSlugs.has(withoutHkSuffix)) {
          return withoutHkSuffix;
        }
      }
      
      // Strategy 4: Partial match - find HK slug that contains TW slug or vice versa
      // This handles cases like "booking.com" -> "booking-com"
      for (const hkSlug of hkSlugs) {
        // Remove common suffixes/prefixes for comparison
        const hkBase = hkSlug.replace(/-hk$/, '').replace(/^hk-/, '');
        const twBase = normalizedSlug.replace(/-hk$/, '').replace(/^hk-/, '');
        
        if (hkBase === twBase || hkSlug.includes(normalizedSlug) || normalizedSlug.includes(hkBase)) {
          return hkSlug;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`[findAlternateMerchantBySlug] Error finding HK merchant for slug "${pageSlug}":`, error);
      return null;
    }
  }

  // HK -> TW: Query Strapi CMS by page_slug
  if (currentMarket === 'hk' && alternateMarket === 'tw') {
    try {
      // Normalize HK slug to TW format (remove -hk suffix, convert hyphens back to dots if needed)
      let twSlug = pageSlug.replace(/-hk$/, '').replace(/^hk-/, '');
      
      // Try to find TW merchant with this slug
      const params = {
        'filters[page_slug][$eq]': twSlug,
        'filters[market][key][$eq]': alternateMarket,
        'fields[0]': 'page_slug',
        'pagination[pageSize]': '1',
      };

      const response = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(params)}`, {
        revalidate,
        tag: `alternate-merchant:${pageSlug}:${alternateMarket}`
      });

      if (response?.data && response.data.length > 0) {
        return response.data[0].page_slug || null;
      }

      return null;
    } catch (error) {
      console.error(`[findAlternateMerchantBySlug] Error finding TW merchant for slug "${pageSlug}":`, error);
      return null;
    }
  }

  return null;
}

/**
 * Find alternate merchant in different market (DEPRECATED - use findAlternateMerchantBySlug)
 * Kept for backward compatibility
 */
export async function findAlternateMerchant(
  merchantName: string,
  currentMarket: string,
  alternateMarket: string,
  revalidate = 300
): Promise<string | null> {
  // For now, delegate to slug-based matching if we have a way to get slug from name
  // This is a fallback - prefer using findAlternateMerchantBySlug with page_slug directly
  console.warn('[findAlternateMerchant] Deprecated - use findAlternateMerchantBySlug with page_slug instead');
  
  if (!merchantName || currentMarket === alternateMarket) {
    return null;
  }

  // TW -> HK: Try hardcoded mapping first, then fallback to slug matching
  if (currentMarket === 'tw' && alternateMarket === 'hk') {
    try {
      // Check hardcoded mapping first (for special cases)
      const normalizedName = merchantName.trim();
      let hkSlug: string | undefined = MERCHANT_NAME_TO_HK_SLUG_MAPPING[normalizedName];
      
      if (!hkSlug) {
        const nameLower = normalizedName.toLowerCase();
        for (const [key, value] of Object.entries(MERCHANT_NAME_TO_HK_SLUG_MAPPING)) {
          if (key.toLowerCase() === nameLower) {
            hkSlug = value;
            break;
          }
        }
      }
      
      if (hkSlug) {
        // Verify in sitemap
        try {
          const hkSlugs = await parseHKMerchantSitemap();
          if (hkSlugs.has(hkSlug)) {
            return hkSlug;
          }
        } catch (e) {
          // Use mapping anyway if sitemap fails
        }
        return hkSlug;
      }
      
      // Fallback: Try to normalize name to slug and match
      const normalizedSlug = normalizedName
        .toLowerCase()
        .replace(/\./g, '-')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/^-|-$/g, '');
      
      return await findAlternateMerchantBySlug(normalizedSlug, currentMarket, alternateMarket, revalidate);
    } catch (error) {
      console.error(`[findAlternateMerchant] Error:`, error);
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
