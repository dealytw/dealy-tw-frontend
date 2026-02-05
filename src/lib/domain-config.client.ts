// Client-safe domain configuration (no server-only imports)
// This file can be safely imported in Client Components

export const DOMAIN_CONFIG = {
  'dealy.tw': {
    domain: 'dealy.tw',
    market: 'tw',
    locale: 'zh-TW', // For i18n/Next.js (short format, commonly supported)
    hreflang: 'zh-Hant-TW', // For SEO output (full format with script)
    alternateDomain: 'dealy.hk',
    alternateLocale: 'zh-HK', // For i18n/Next.js
    alternateHreflang: 'zh-Hant-HK', // For SEO output
    name: 'Dealy TW 台灣最新優惠平台',
  },
  'dealy.hk': {
    domain: 'dealy.hk',
    market: 'hk',
    locale: 'zh-HK', // For i18n/Next.js (short format, commonly supported)
    hreflang: 'zh-Hant-HK', // For SEO output (full format with script)
    alternateDomain: 'dealy.tw',
    alternateLocale: 'zh-TW', // For i18n/Next.js
    alternateHreflang: 'zh-Hant-TW', // For SEO output
    name: 'Dealy HK 香港最新優惠平台',
  },
  'www.dealy.tw': {
    domain: 'dealy.tw',
    market: 'tw',
    locale: 'zh-TW', // For i18n/Next.js
    hreflang: 'zh-Hant-TW', // For SEO output
    alternateDomain: 'dealy.hk',
    alternateLocale: 'zh-HK', // For i18n/Next.js
    alternateHreflang: 'zh-Hant-HK', // For SEO output
    name: 'Dealy TW 台灣最新優惠平台',
  },
  'www.dealy.hk': {
    domain: 'dealy.hk',
    market: 'hk',
    locale: 'zh-HK', // For i18n/Next.js
    hreflang: 'zh-Hant-HK', // For SEO output
    alternateDomain: 'dealy.tw',
    alternateLocale: 'zh-TW', // For i18n/Next.js
    alternateHreflang: 'zh-Hant-TW', // For SEO output
    name: 'Dealy HK 香港最新優惠平台',
  },
} as const;

export type DomainConfig = typeof DOMAIN_CONFIG[keyof typeof DOMAIN_CONFIG];

/**
 * Get domain configuration based on hostname
 * Client-side: Uses window.location.hostname
 * Server-side: Uses NEXT_PUBLIC_SITE_URL for hydration consistency (avoids React #418)
 */
export function getDomainConfig(): DomainConfig {
  if (typeof window === 'undefined') {
    // Server-side: use env to match client (avoids hydration mismatch)
    const siteUrl = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SITE_URL || '' : '';
    if (siteUrl.includes('dealy.hk')) return DOMAIN_CONFIG['dealy.hk'];
    if (siteUrl.includes('dealy.tw')) return DOMAIN_CONFIG['dealy.tw'];
    return DOMAIN_CONFIG['dealy.tw'];
  }

  const hostname = window.location.hostname;
  return DOMAIN_CONFIG[hostname as keyof typeof DOMAIN_CONFIG] || DOMAIN_CONFIG['dealy.tw'];
}

