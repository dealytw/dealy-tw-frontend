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

// Helper function to absolutize media URLs
export function absolutizeMedia(u?: string | null) {
  if (!u) return "";
  const base = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "";
  return u.startsWith("http") ? u : `${base}${u}`;
}

/**
 * Rewrites Strapi CDN image URLs to custom domain URLs
 * Example: https://ingenious-charity-13f9502d24.media.strapiapp.com/tripcom_5eff0330bd.webp
 *       -> https://dealy.tw/upload/tripcom.webp
 * 
 * @param url - The original Strapi CDN URL or relative URL
 * @param domain - Optional custom domain (defaults to NEXT_PUBLIC_SITE_URL or https://dealy.tw)
 * @returns Clean custom domain URL
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
    }
    
    // Get domain from parameter, environment, or default
    const targetDomain = domain || process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw';
    
    // Ensure targetDomain doesn't have trailing slash
    const cleanDomain = targetDomain.replace(/\/$/, '');
    
    // Remove hash suffix (e.g., _5eff0330bd) from filename
    // Pattern: _[alphanumeric] before file extension
    // Example: /tripcom_5eff0330bd.webp -> /tripcom.webp
    // Strategy: Find the last underscore before the file extension, remove hash between underscore and extension
    // This handles cases like: /tripcom_5eff0330bd.webp or /path/to/file_abc123.jpg
    const lastUnderscoreIndex = pathname.lastIndexOf('_');
    const lastDotIndex = pathname.lastIndexOf('.');
    
    // Only remove hash if underscore exists before the file extension
    if (lastUnderscoreIndex > 0 && lastDotIndex > lastUnderscoreIndex) {
      // Check if the part between underscore and dot is alphanumeric (likely a hash)
      const hashPart = pathname.substring(lastUnderscoreIndex + 1, lastDotIndex);
      if (/^[a-zA-Z0-9]+$/.test(hashPart)) {
        // Remove the hash part: /tripcom_5eff0330bd.webp -> /tripcom.webp
        const cleanFilename = pathname.substring(0, lastUnderscoreIndex) + pathname.substring(lastDotIndex);
        return `${cleanDomain}/upload${cleanFilename}`;
      }
    }
    
    // If no hash found, use pathname as-is
    const cleanFilename = pathname;
    
    // Build clean URL: https://dealy.tw/upload/tripcom.webp
    return `${cleanDomain}/upload${cleanFilename}`;
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn('[rewriteImageUrl] Failed to parse URL:', url, error);
    return url;
  }
}
