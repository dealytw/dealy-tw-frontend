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
    name: 'Dealy TW',
  },
  'dealy.hk': {
    domain: 'dealy.hk',
    market: 'hk',
    locale: 'zh-HK', // For i18n/Next.js (short format, commonly supported)
    hreflang: 'zh-Hant-HK', // For SEO output (full format with script)
    alternateDomain: 'dealy.tw',
    alternateLocale: 'zh-TW', // For i18n/Next.js
    alternateHreflang: 'zh-Hant-TW', // For SEO output
    name: 'Dealy HK',
  },
  'www.dealy.tw': {
    domain: 'dealy.tw',
    market: 'tw',
    locale: 'zh-TW', // For i18n/Next.js
    hreflang: 'zh-Hant-TW', // For SEO output
    alternateDomain: 'dealy.hk',
    alternateLocale: 'zh-HK', // For i18n/Next.js
    alternateHreflang: 'zh-Hant-HK', // For SEO output
    name: 'Dealy TW',
  },
  'www.dealy.hk': {
    domain: 'dealy.hk',
    market: 'hk',
    locale: 'zh-HK', // For i18n/Next.js
    hreflang: 'zh-Hant-HK', // For SEO output
    alternateDomain: 'dealy.tw',
    alternateLocale: 'zh-TW', // For i18n/Next.js
    alternateHreflang: 'zh-Hant-TW', // For SEO output
    name: 'Dealy HK',
  },
} as const;

export type DomainConfig = typeof DOMAIN_CONFIG[keyof typeof DOMAIN_CONFIG];

/**
 * Get domain configuration based on hostname (client-side only)
 * Client-side: Uses window.location.hostname
 */
export function getDomainConfig(): DomainConfig {
  if (typeof window === 'undefined') {
    // Server-side fallback - should not be called in client components
    // Default to TW
    return DOMAIN_CONFIG['dealy.tw'];
  }
  
  const hostname = window.location.hostname;
  return DOMAIN_CONFIG[hostname as keyof typeof DOMAIN_CONFIG] || DOMAIN_CONFIG['dealy.tw'];
}

