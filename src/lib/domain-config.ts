// Server-only domain configuration
// This file imports server-only modules and should only be used in Server Components

import { DOMAIN_CONFIG, type DomainConfig } from './domain-config.client';

/**
 * Get domain configuration based on hostname or environment (server-side)
 * Server-side: Uses NEXT_PUBLIC_SITE_URL
 */
export function getDomainConfig(): DomainConfig {
  // Server-side: check environment variables
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  if (siteUrl.includes('dealy.hk')) {
    return DOMAIN_CONFIG['dealy.hk'];
  }
  
  // Default to TW
  return DOMAIN_CONFIG['dealy.tw'];
}

// Re-export client-safe constants and types
export { DOMAIN_CONFIG, type DomainConfig };

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
    
    // CMS stores Site.key as lowercase (e.g. "tw", "hk") but we accept any casing here.
    // Use $in to match regardless of casing.
    const keyVariants = Array.from(
      new Set([marketKey, marketKey.toLowerCase(), marketKey.toUpperCase()].filter(Boolean))
    );

    const marketRes = await strapiFetch<{ data: any[] }>(
      `/api/sites?${qs({
        "filters[key][$in]": keyVariants,
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

