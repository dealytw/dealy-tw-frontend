// src/seo/meta.ts
// This file is server-only (used in Server Components)
import { getDomainConfig } from '@/lib/domain-config';

export function canonical(pathOrAbs?: string) {
  if (!pathOrAbs) return undefined;
  if (pathOrAbs.startsWith('http')) return pathOrAbs;
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  return `${base}${pathOrAbs.startsWith('/') ? pathOrAbs : `/${pathOrAbs}`}`;
}

/**
 * Generate hreflang links for cross-domain SEO
 * Supports both main pages and merchant pages with alternate merchant matching
 * 
 * @param currentPath - Current page path (e.g., "/shop/farfetch")
 * @param alternateMerchantSlug - Optional: slug of alternate merchant in other market (e.g., "farfetch" for HK when on TW)
 */
export function getHreflangLinks(
  currentPath: string,
  alternateMerchantSlug?: string | null
): Array<{ hreflang: string; href: string }> {
  const config = getDomainConfig();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${config.domain}`;
  const alternateUrl = `https://${config.alternateDomain}`;
  
  // x-default should always point to TW domain (primary/default)
  const defaultUrl = 'https://dealy.tw';
  
  // Main pages that exist on both domains
  const mainPages = ['/', '/shop', '/special-offers', '/blog'];
  
  // Check if this is a main page
  const isMainPage = mainPages.includes(currentPath) || currentPath === '';
  
  // Check if this is a merchant page (starts with /shop/)
  const isMerchantPage = currentPath.startsWith('/shop/') && currentPath !== '/shop';
  
  // Build hreflang links
  const links: Array<{ hreflang: string; href: string }> = [];
  
  // Always add self reference
  links.push({
    hreflang: config.hreflang,
    href: `${baseUrl}${currentPath}`
  });
  
  // For main pages, add alternate domain with same path
  if (isMainPage) {
    links.push({
      hreflang: config.alternateHreflang,
      href: `${alternateUrl}${currentPath}`
    });
  }
  
  // For merchant pages, add alternate if we have the alternate merchant slug
  if (isMerchantPage && alternateMerchantSlug) {
    const alternatePath = `/shop/${alternateMerchantSlug}`;
    links.push({
      hreflang: config.alternateHreflang,
      href: `${alternateUrl}${alternatePath}`
    });
  }
  
  // Always add x-default pointing to TW domain
  // For merchant pages without alternate, use current path (will redirect to TW version if exists)
  links.push({
    hreflang: 'x-default',
    href: `${defaultUrl}${currentPath}`
  });
  
  return links;
}

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;              // e.g. "/shop/klook"
  canonicalOverride?: string; // absolute or path
  noindex?: boolean;
  ogImageUrl?: string;
  includeHreflang?: boolean; // Whether to include hreflang tags (default: true)
  alternateMerchantSlug?: string | null; // Optional: slug of alternate merchant in other market for hreflang
};

export function pageMeta({
  title,
  description,
  path,
  canonicalOverride,
  noindex,
  ogImageUrl,
  includeHreflang = true,
  alternateMerchantSlug,
}: PageMetaInput) {
  const url = canonical(canonicalOverride ?? path);
  const robots = noindex ? { index: false, follow: false, nocache: true } : undefined;
  
  // Generate hreflang links (with alternate merchant slug if provided)
  const hreflangLinks = includeHreflang && path ? getHreflangLinks(path, alternateMerchantSlug) : [];
  const alternates: { canonical?: string; languages?: Record<string, string> } = {};
  
  if (url) {
    alternates.canonical = url;
  }
  
  if (hreflangLinks.length > 0) {
    alternates.languages = Object.fromEntries(
      hreflangLinks.map(link => [link.hreflang, link.href])
    );
  }

  // Get domain config for site name and locale
  const config = getDomainConfig();
  const siteName = config.name || 'Dealy TW 台灣最新優惠平台';
  
  // Convert locale for og:locale (e.g., "zh-Hant-TW" -> "zh_TW")
  let ogLocale = 'zh_TW';
  if (config.locale === 'zh-Hant-HK') {
    ogLocale = 'zh_HK';
  } else if (config.locale === 'zh-Hant-TW') {
    ogLocale = 'zh_TW';
  }

  return {
    title,
    description,
    alternates: Object.keys(alternates).length > 0 ? alternates : undefined,
    robots: robots || {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-snippet': -1,
        'max-image-preview': 'large',
        'max-video-preview': -1,
      },
    },
    openGraph: {
      url,
      type: 'website',
      title,
      description,
      siteName,
      locale: ogLocale,
      images: ogImageUrl ? [{ url: ogImageUrl }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}
