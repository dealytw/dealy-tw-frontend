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
 * We intentionally keep the full script+region (zh-Hant-XX) to match hreflang usage.
 */
export function localeToHtmlLang(locale?: string): string {
  if (!locale) return 'zh-Hant-TW'; // Default fallback
  
  // If already in full format, return as-is
  if (locale === 'zh-Hant-HK' || locale === 'zh-Hant-TW') return locale;

  // If in short format, convert to full format
  if (locale === 'zh-HK') return 'zh-Hant-HK';
  if (locale === 'zh-TW') return 'zh-Hant-TW';
  
  return locale; // Return as-is if not matched
}

/**
 * Convert Market.defaultLocale enum to hreflang code (for SEO output)
 * "zh-Hant-HK" -> "zh-Hant-HK" (keep full format with script)
 * "zh-Hant-TW" -> "zh-Hant-TW" (keep full format with script)
 * 
 * Note: hreflang should use full format (zh-Hant-XX) for SEO best practice
 * This is different from locale which uses short format (zh-XX) for i18n
 */
export function localeToHreflang(locale?: string): string {
  if (!locale) return 'zh-Hant-TW'; // Default fallback (full format)
  
  // If already in full format, return as-is
  if (locale === 'zh-Hant-HK' || locale === 'zh-Hant-TW') {
    return locale;
  }
  
  // If in short format, convert to full format
  if (locale === 'zh-HK') return 'zh-Hant-HK';
  if (locale === 'zh-TW') return 'zh-Hant-TW';
  
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
    // If CMS returns no record, fall back based on market key (don't default HK → TW).
    return market?.defaultLocale || (marketKey.toLowerCase() === 'hk' ? 'zh-Hant-HK' : 'zh-Hant-TW');
  } catch (error) {
    console.error('[DomainConfig] Error fetching market locale:', error);
    // Fallback based on market key
    return marketKey.toLowerCase() === 'hk' ? 'zh-Hant-HK' : 'zh-Hant-TW';
  }
}

