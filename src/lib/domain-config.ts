// Domain and locale configuration for multi-domain SEO
// Uses Market.defaultLocale from CMS to determine language

export const DOMAIN_CONFIG = {
  'dealy.tw': {
    domain: 'dealy.tw',
    market: 'tw',
    locale: 'zh-TW',
    hreflang: 'zh-TW',
    alternateDomain: 'dealy.hk',
    alternateLocale: 'zh-HK',
    alternateHreflang: 'zh-HK',
    name: 'Dealy TW',
  },
  'dealy.hk': {
    domain: 'dealy.hk',
    market: 'hk',
    locale: 'zh-HK',
    hreflang: 'zh-HK',
    alternateDomain: 'dealy.tw',
    alternateLocale: 'zh-TW',
    alternateHreflang: 'zh-TW',
    name: 'Dealy HK',
  },
  'www.dealy.tw': {
    domain: 'dealy.tw',
    market: 'tw',
    locale: 'zh-TW',
    hreflang: 'zh-TW',
    alternateDomain: 'dealy.hk',
    alternateLocale: 'zh-HK',
    alternateHreflang: 'zh-HK',
    name: 'Dealy TW',
  },
  'www.dealy.hk': {
    domain: 'dealy.hk',
    market: 'hk',
    locale: 'zh-HK',
    hreflang: 'zh-HK',
    alternateDomain: 'dealy.tw',
    alternateLocale: 'zh-TW',
    alternateHreflang: 'zh-TW',
    name: 'Dealy HK',
  },
} as const;

export type DomainConfig = typeof DOMAIN_CONFIG[keyof typeof DOMAIN_CONFIG];

/**
 * Get domain configuration based on hostname or environment
 * Server-side: Uses NEXT_PUBLIC_SITE_URL or request headers
 * Client-side: Uses window.location.hostname
 */
export function getDomainConfig(): DomainConfig {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return DOMAIN_CONFIG[hostname as keyof typeof DOMAIN_CONFIG] || DOMAIN_CONFIG['dealy.tw'];
  }
  
  // Server-side: check environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (siteUrl.includes('dealy.hk')) {
    return DOMAIN_CONFIG['dealy.hk'];
  }
  
  // Default to TW
  return DOMAIN_CONFIG['dealy.tw'];
}

/**
 * Convert Market.defaultLocale enum to HTML lang attribute
 * "zh-Hant-HK" -> "zh-HK"
 * "zh-Hant-TW" -> "zh-TW"
 */
export function localeToHtmlLang(locale?: string): string {
  if (!locale) return 'zh-TW'; // Default fallback
  
  if (locale === 'zh-Hant-HK') return 'zh-HK';
  if (locale === 'zh-Hant-TW') return 'zh-TW';
  
  return locale; // Return as-is if not matched
}

/**
 * Convert Market.defaultLocale enum to hreflang code
 * "zh-Hant-HK" -> "zh-HK"
 * "zh-Hant-TW" -> "zh-TW"
 */
export function localeToHreflang(locale?: string): string {
  if (!locale) return 'zh-TW'; // Default fallback
  
  if (locale === 'zh-Hant-HK') return 'zh-HK';
  if (locale === 'zh-Hant-TW') return 'zh-TW';
  
  return locale; // Return as-is if not matched
}

/**
 * Get market locale from CMS
 * Fetches Market record to get defaultLocale
 */
export async function getMarketLocale(marketKey: string = 'tw') {
  try {
    const { strapiFetch, qs } = await import('@/lib/strapi.server');
    
    const marketRes = await strapiFetch<{ data: any[] }>(
      `/api/sites?${qs({
        "filters[key][$eq]": marketKey.toUpperCase(),
        "fields[0]": "defaultLocale",
        "fields[1]": "key",
      })}`,
      { revalidate: 86400, tag: `market:${marketKey}` } // Cache for 24h
    );
    
    const market = marketRes.data?.[0];
    return market?.defaultLocale || 'zh-Hant-TW'; // Default fallback
  } catch (error) {
    console.error('[DomainConfig] Error fetching market locale:', error);
    // Fallback based on market key
    return marketKey.toLowerCase() === 'hk' ? 'zh-Hant-HK' : 'zh-Hant-TW';
  }
}

