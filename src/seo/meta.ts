// src/seo/meta.ts
import { getDomainConfig } from '@/lib/domain-config';

export function canonical(pathOrAbs?: string) {
  if (!pathOrAbs) return undefined;
  if (pathOrAbs.startsWith('http')) return pathOrAbs;
  const base = process.env.NEXT_PUBLIC_SITE_URL || '';
  return `${base}${pathOrAbs.startsWith('/') ? pathOrAbs : `/${pathOrAbs}`}`;
}

/**
 * Generate hreflang links for cross-domain SEO
 * Since pages are different between HK and TW, we only link to main pages
 */
export function getHreflangLinks(currentPath: string): Array<{ hreflang: string; href: string }> {
  const config = getDomainConfig();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${config.domain}`;
  const alternateUrl = `https://${config.alternateDomain}`;
  
  // Main pages that exist on both domains
  const mainPages = ['/', '/shop', '/special-offers', '/blog'];
  
  // Only add hreflang if this is a main page (not specific merchant/coupon pages)
  const isMainPage = mainPages.includes(currentPath) || currentPath === '';
  
  if (!isMainPage) {
    // For specific pages, only add self and x-default (no alternate since pages differ)
    return [
      { hreflang: config.hreflang, href: `${baseUrl}${currentPath}` },
      { hreflang: 'x-default', href: `${baseUrl}${currentPath}` },
    ];
  }
  
  // For main pages, add both domains
  return [
    { hreflang: config.hreflang, href: `${baseUrl}${currentPath}` },
    { hreflang: config.alternateHreflang, href: `${alternateUrl}${currentPath}` },
    { hreflang: 'x-default', href: `${baseUrl}${currentPath}` },
  ];
}

type PageMetaInput = {
  title: string;
  description?: string;
  path?: string;              // e.g. "/shop/klook"
  canonicalOverride?: string; // absolute or path
  noindex?: boolean;
  ogImageUrl?: string;
  includeHreflang?: boolean; // Whether to include hreflang tags (default: true)
};

export function pageMeta({
  title,
  description,
  path,
  canonicalOverride,
  noindex,
  ogImageUrl,
  includeHreflang = true,
}: PageMetaInput) {
  const url = canonical(canonicalOverride ?? path);
  const robots = noindex ? { index: false, follow: false, nocache: true } : undefined;
  
  // Generate hreflang links
  const hreflangLinks = includeHreflang && path ? getHreflangLinks(path) : [];
  const alternates: { canonical?: string; languages?: Record<string, string> } = {};
  
  if (url) {
    alternates.canonical = url;
  }
  
  if (hreflangLinks.length > 0) {
    alternates.languages = Object.fromEntries(
      hreflangLinks.map(link => [link.hreflang, link.href])
    );
  }

  return {
    title,
    description,
    alternates: Object.keys(alternates).length > 0 ? alternates : undefined,
    robots,
    openGraph: {
      url,
      type: 'website',
      title,
      description,
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
