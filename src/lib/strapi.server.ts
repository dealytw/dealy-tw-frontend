// src/lib/strapi.server.ts - Server-only Strapi fetch wrapper
// Note: This file should only be imported in server components
// Uses Next.js ISR (Incremental Static Regeneration) for optimal caching

import 'server-only';

type NextInit = RequestInit & { revalidate?: number; tag?: string };

export async function strapiFetch<T>(path: string, init?: NextInit) {
  const baseUrl = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
  if (!baseUrl) {
    throw new Error('STRAPI_URL or NEXT_PUBLIC_STRAPI_URL environment variable is required');
  }
  
  const url = `${baseUrl}${path}`;
  const { revalidate, tag, ...rest } = init || {};
  
  console.log('strapiFetch: Making request to', url);
  
  // Note: We use Next.js 'next' option for ISR instead of 'cache: no-store'
  // This provides better performance with automatic revalidation
  const res = await fetch(url, {
    ...rest,
    headers: {
      ...(rest?.headers || {}),
      Authorization: `Bearer ${process.env.STRAPI_TOKEN || process.env.STRAPI_API_TOKEN}`,
    },
    next: revalidate ? { revalidate, tags: tag ? [tag] : [] } : undefined,
  });
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strapi ${res.status}: ${url}\n${text.slice(0, 600)}`);
  }
  
  return (await res.json()) as T;
}

// Helper function to build query strings
export function qs(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { 
    if (v !== undefined && v !== null) sp.set(k, String(v)); 
  });
  return sp.toString();
}

/**
 * Helper function to get starts_at filter params for coupon queries
 * Filters coupons where starts_at is null OR starts_at <= today (UTC)
 * This ensures scheduled coupons (starts_at in the future) are not fetched
 * 
 * @returns Object with filter params to be merged into query params
 */
export function getStartsAtFilterParams(): Record<string, string> {
  // Get today's date in UTC (YYYY-MM-DD format)
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Return $or filter: starts_at is null OR starts_at <= today
  return {
    "filters[$or][0][starts_at][$null]": "true",
    "filters[$or][1][starts_at][$lte]": todayStr,
  };
}

// Helper function to absolutize media URLs
export function absolutizeMedia(u?: string | null) {
  if (!u) return "";
  const base = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "";
  return u.startsWith("http") ? u : `${base}${u}`;
}

/**
 * Rewrites Strapi CDN image URLs to custom domain URLs
 * Example: https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp
 *       -> https://dealy.tw/upload/tripcom_5eff0330bd.webp
 * 
 * Note: Keeps the hash in filename for direct Strapi CDN lookup via Next.js rewrite proxy
 * 
 * @param url - The original Strapi CDN URL or relative URL
 * @param domain - Optional custom domain (defaults to NEXT_PUBLIC_SITE_URL or https://dealy.tw)
 * @returns Custom domain URL (with hash preserved)
 */
export function rewriteImageUrl(url: string | null | undefined, domain?: string): string {
  if (!url) return "";
  
  // If already a custom domain URL, return as-is
  if (url.includes('/upload/')) {
    return url;
  }
  
  try {
    // Handle relative URLs (e.g., /uploads/tripcom_5eff0330bd.webp)
    let pathname: string;
    if (url.startsWith('http')) {
      const urlObj = new URL(url);
      pathname = urlObj.pathname; // e.g., /tripcom_5eff0330bd.webp or /uploads/tripcom_5eff0330bd.webp
    } else {
      pathname = url; // Already a pathname
    }
    
    // Remove /uploads/ prefix if present
    if (pathname.startsWith('/uploads/')) {
      pathname = pathname.replace('/uploads/', '/');
    } else if (pathname.startsWith('/uploads')) {
      pathname = pathname.replace('/uploads', '/');
    }
    
    // Get domain from parameter, environment, or default
    const targetDomain = domain || process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw';
    
    // Ensure targetDomain doesn't have trailing slash
    const cleanDomain = targetDomain.replace(/\/$/, '');
    
    // Keep the filename as-is (including hash) for direct Strapi CDN lookup
    // Example: /tripcom_5eff0330bd.webp -> /upload/tripcom_5eff0330bd.webp
    // The Next.js rewrite proxy will handle fetching from Strapi CDN
    
    // Build URL: https://dealy.tw/upload/tripcom_5eff0330bd.webp
    return `${cleanDomain}/upload${pathname}`;
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn('[rewriteImageUrl] Failed to parse URL:', url, error);
    return url;
  }
}
