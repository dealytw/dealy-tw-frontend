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
 * Parse comma-separated URLs from hreflang_alternate_url field
 * Returns array of valid URLs (trimmed and filtered)
 * 
 * @param urlString - Comma-separated URLs (e.g., "https://dealy.hk/category/sports, https://dealy.sg/category/sports")
 * @returns Array of valid URLs
 */
export function parseHreflangUrls(urlString: string | null | undefined): string[] {
  if (!urlString || typeof urlString !== 'string') {
    return [];
  }
  
  return urlString
    .split(',')
    .map(url => url.trim())
    .filter(url => {
      // Only keep valid URLs
      return url.startsWith('http://') || url.startsWith('https://');
    });
}

/**
 * Extract URL from Strapi rich text field (hreflang_alternate) - DEPRECATED
 * Kept for backward compatibility, but prefer using hreflang_alternate_url
 * Handles string, link blocks, and paragraph blocks with links
 */
export function extractUrlFromRichText(richText: any): string | null {
  if (!richText) return null;
  
  // If it's already a string URL, return it
  if (typeof richText === 'string') {
    // Check if it's a valid URL
    if (richText.startsWith('http://') || richText.startsWith('https://')) {
      return richText.trim();
    }
    return null;
  }
  
  // If it's an array of blocks (Strapi rich text format)
  if (Array.isArray(richText)) {
    for (const block of richText) {
      // Check for link block
      if (block.type === 'link' && block.url) {
        return block.url;
      }
      
      // Check for paragraph with link
      if (block.type === 'paragraph' && block.children) {
        for (const child of block.children) {
          if (child.type === 'link' && child.url) {
            return child.url;
          }
          // Also check nested children
          if (child.children) {
            for (const nested of child.children) {
              if (nested.type === 'link' && nested.url) {
                return nested.url;
              }
            }
          }
        }
      }
    }
  }
  
  return null;
}

/**
 * Determine hreflang code from URL domain
 * Examples:
 * - https://dealy.hk/... -> zh-HK
 * - https://dealy.sg/... -> zh-SG
 * - https://dealy.tw/... -> zh-TW
 */
function getHreflangFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname.includes('dealy.hk')) return 'zh-HK';
    if (hostname.includes('dealy.sg')) return 'zh-SG';
    if (hostname.includes('dealy.tw')) return 'zh-TW';
    
    // Default: try to extract from domain pattern
    const match = hostname.match(/dealy\.([a-z]{2})/);
    if (match) {
      const country = match[1].toUpperCase();
      return `zh-${country}`;
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Generate hreflang links for cross-domain SEO
 * Supports both main pages and merchant pages with alternate URL(s) from CMS
 * 
 * @param currentPath - Current page path (e.g., "/shop/farfetch")
 * @param alternateUrl - Optional: URL(s) from CMS hreflang_alternate_url field (comma-separated, e.g., "https://dealy.hk/shop/trip-com, https://dealy.sg/shop/trip-com")
 */
export function getHreflangLinks(
  currentPath: string,
  alternateUrl?: string | null
): Array<{ hreflang: string; href: string }> {
  const config = getDomainConfig();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${config.domain}`;
  const alternateDomainUrl = `https://${config.alternateDomain}`;
  
  // Main pages that exist on both domains (index pages)
  const mainPages = ['/', '/shop', '/special-offers', '/blog'];
  
  // Check if this is a main page (index page)
  const isMainPage = mainPages.includes(currentPath) || currentPath === '';
  
  // Check if this is a merchant page (starts with /shop/ but not /shop)
  const isMerchantPage = currentPath.startsWith('/shop/') && currentPath !== '/shop';
  
  // Pages that have same slugs on both domains (should get hreflang)
  // These are dynamic routes where the slug is the same on both TW and HK sites
  // Note: Blog posts are excluded - no related blog posts should be created across markets
  const pagesWithSameSlug = [
    '/category/',      // Category pages: /category/[categorySlug]
    '/special-offers/', // Special offers detail: /special-offers/[id] (not /special-offers index)
  ];
  
  // Check if this is a page with same slug on both domains
  // Exclude index pages (already handled by isMainPage)
  const isPageWithSameSlug = pagesWithSameSlug.some(prefix => {
    if (currentPath === prefix.replace('/', '')) return false; // Exclude index pages
    return currentPath.startsWith(prefix);
  });
  
  // Check if this is a legal page (root level slug like /about, /privacy, etc.)
  // Legal pages may have same slugs on both domains
  const isLegalPage = !currentPath.startsWith('/shop') && 
                      !currentPath.startsWith('/category') && 
                      !currentPath.startsWith('/blog') && 
                      !currentPath.startsWith('/special-offers') &&
                      !currentPath.startsWith('/search') &&
                      !currentPath.startsWith('/submit-coupons') &&
                      !currentPath.startsWith('/api') &&
                      currentPath !== '/' &&
                      currentPath.split('/').length === 2; // Only one level deep (e.g., /about, not /about/terms)
  
  // Build hreflang links
  const links: Array<{ hreflang: string; href: string }> = [];
  
  // Always add self reference
  links.push({
    hreflang: config.hreflang,
    href: `${baseUrl}${currentPath}`
  });
  
  // For main pages (index pages), add alternate domain with same path
  if (isMainPage) {
    links.push({
      hreflang: config.alternateHreflang,
      href: `${alternateDomainUrl}${currentPath}`
    });
  }
  
  // For pages with same slugs (category, blog posts, special offers detail), add alternate domain with same path
  if (isPageWithSameSlug) {
    links.push({
      hreflang: config.alternateHreflang,
      href: `${alternateDomainUrl}${currentPath}`
    });
  }
  
  // For legal pages, add alternate domain with same path (assume they exist on both domains)
  if (isLegalPage) {
    links.push({
      hreflang: config.alternateHreflang,
      href: `${alternateDomainUrl}${currentPath}`
    });
  }
  
  // For merchant pages, use alternate URL(s) from CMS if provided
  // Support comma-separated URLs for multiple alternate markets
  // Note: Merchant pages may have different slugs on TW vs HK, so we use CMS alternate URL(s)
  if (isMerchantPage && alternateUrl) {
    const alternateUrls = parseHreflangUrls(alternateUrl);
    for (const url of alternateUrls) {
      const hreflangCode = getHreflangFromUrl(url);
      if (hreflangCode) {
        links.push({
          hreflang: hreflangCode,
          href: url
        });
        console.log(`[getHreflangLinks] Added alternate hreflang for merchant page: ${hreflangCode} -> ${url}`);
      } else {
        console.warn(`[getHreflangLinks] Could not determine hreflang code from URL: ${url}`);
      }
    }
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
  ogImageAlt?: string;        // Alt text for og:image (e.g., "{merchant name}優惠碼")
  ogType?: 'website' | 'article'; // Open Graph type (default: 'website')
  includeHreflang?: boolean; // Whether to include hreflang tags (default: true)
  alternateUrl?: string | null; // Optional: direct URL from CMS hreflang_alternate field (e.g., "https://dealy.hk/shop/trip-com")
  ogUpdatedTime?: string; // Optional: ISO 8601 date string for og:updated_time (e.g., "2025-09-05T16:34:48+08:00")
  articleSection?: string; // Optional: category name for article:section (e.g., "旅遊")
};

/**
 * Format date to HK format: 2025-09-05T16:34:48+08:00
 * Converts UTC date to Taiwan time (UTC+8)
 */
function formatUpdatedTime(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    // Convert to Taiwan time (UTC+8)
    const taiwanTime = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
    
    // Format as: YYYY-MM-DDTHH:mm:ss+08:00
    const year = taiwanTime.getFullYear();
    const month = String(taiwanTime.getMonth() + 1).padStart(2, '0');
    const day = String(taiwanTime.getDate()).padStart(2, '0');
    const hours = String(taiwanTime.getHours()).padStart(2, '0');
    const minutes = String(taiwanTime.getMinutes()).padStart(2, '0');
    const seconds = String(taiwanTime.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
  } catch {
    return '';
  }
}

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
  alternateUrl,
  ogUpdatedTime,
  articleSection,
}: PageMetaInput) {
  const url = canonical(canonicalOverride ?? path);
  const robots = noindex ? { index: false, follow: false, nocache: true } : undefined;
  
  // Debug: Log hreflang generation
  console.log(`[pageMeta] Generating metadata for path: ${path}, alternateUrl: ${alternateUrl || 'null'}, includeHreflang: ${includeHreflang}`);
  
  // Generate hreflang links (with alternate URL from CMS if provided)
  const hreflangLinks = includeHreflang && path ? getHreflangLinks(path, alternateUrl) : [];
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
  // Format ogImageAlt as "{merchant name}優惠碼" if provided
  // Note: Next.js automatically generates og:image:secure_url for HTTPS URLs
  const ogImages = ogImageUrl ? [{
    url: ogImageUrl,
    ...(ogImageAlt && { alt: ogImageAlt }),
  }] : undefined;

  // Build Open Graph metadata with additional fields
  const openGraph: any = {
    url,
    type: ogType,
    title,
    description,
    siteName,
    locale: ogLocale,
    images: ogImages,
  };

  // Add og:updated_time if provided (via modifiedTime)
  if (ogUpdatedTime) {
    const formattedTime = formatUpdatedTime(ogUpdatedTime);
    if (formattedTime) {
      openGraph.modifiedTime = formattedTime; // Next.js uses modifiedTime for og:updated_time
    }
  }

  // Add article:section if provided and type is article
  if (ogType === 'article' && articleSection) {
    openGraph.section = articleSection;
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
    openGraph,
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined, // twitter:image (same as og:image)
    },
  };
}
