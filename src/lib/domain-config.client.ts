// Client-safe domain configuration (no server-only imports)
// This file can be safely imported in Client Components

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

