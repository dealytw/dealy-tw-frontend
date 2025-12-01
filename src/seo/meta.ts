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
    console.log(`[getHreflangLinks] Added HK hreflang for merchant page: ${config.alternateHreflang} -> ${alternateUrl}${alternatePath}`);
  } else if (isMerchantPage && !alternateMerchantSlug) {
    console.log(`[getHreflangLinks] Merchant page but no alternateMerchantSlug provided (path: ${currentPath})`);
  }
  
  return links;
}

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;              // e.g. "/shop/klook"
  canonicalOverride?: string; // absolute or path
  noindex?: boolean;
  ogImageUrl?: string;
  ogImageAlt?: string;        // Alt text for og:image (e.g., merchant name)
  ogType?: 'website' | 'article'; // Open Graph type (default: 'website')
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
  ogImageAlt,
  ogType = 'website',
  includeHreflang = true,
  alternateMerchantSlug,
}: PageMetaInput) {
  const url = canonical(canonicalOverride ?? path);
  const robots = noindex ? { index: false, follow: false, nocache: true } : undefined;
  
  // Debug: Log hreflang generation
  console.log(`[pageMeta] Generating metadata for path: ${path}, alternateMerchantSlug: ${alternateMerchantSlug || 'null'}, includeHreflang: ${includeHreflang}`);
  
  // Generate hreflang links (with alternate merchant slug if provided)
  const hreflangLinks = includeHreflang && path ? getHreflangLinks(path, alternateMerchantSlug) : [];
  console.log(`[pageMeta] Generated ${hreflangLinks.length} hreflang links:`, hreflangLinks);
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

  // Build Open Graph image object with alt text if provided
  const ogImages = ogImageUrl ? [{
    url: ogImageUrl,
    ...(ogImageAlt && { alt: ogImageAlt }),
  }] : undefined;

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
      type: ogType,
      title,
      description,
      siteName,
      locale: ogLocale,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}
