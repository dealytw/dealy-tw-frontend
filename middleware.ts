import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * URL Normalization Middleware + Cache Headers
 * 
 * Handles:
 * 1. Trailing slash removal (except root) - 301 redirect
 * 2. Lowercase path enforcement - 301 redirect
 * 3. Preserves query parameters and hash
 * 4. Adds proper cache headers for ISR pages
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  let hasRedirect = false;

  // Skip API routes, Next.js internals, and static files
  const pathname = url.pathname;
  
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_static/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // 1. Remove trailing slash (except for root)
  if (pathname !== '/' && pathname.endsWith('/')) {
    url.pathname = pathname.slice(0, -1);
    hasRedirect = true;
  }

  // 2. Force lowercase paths (case-insensitive redirect)
  const lowerPathname = url.pathname.toLowerCase();
  if (url.pathname !== lowerPathname) {
    url.pathname = lowerPathname;
    hasRedirect = true;
  }

  // If any normalization needed, issue 301 redirect
  if (hasRedirect) {
    return NextResponse.redirect(url, 301);
  }

  // 3. Add cache headers for ISR pages (only for HTML pages, not during revalidation)
  const response = NextResponse.next();
  
  // Skip cache headers if this is a revalidation request
  const isRevalidation = 
    request.headers.get('x-vercel-revalidate') !== null ||
    request.headers.get('x-prerender-revalidate') !== null ||
    request.nextUrl.searchParams.has('x-vercel-revalidate');
  
  if (!isRevalidation) {
    // Determine cache time based on page type (matching ISR revalidate times)
    let sMaxAge = 86400; // Default: 24 hours (homepage)
    let staleWhileRevalidate = 2592000; // 30 days - serve stale content while revalidating
    
    // Homepage: 24 hours (ISR: 86400s)
    if (pathname === '/') {
      sMaxAge = 86400; // 24 hours
    }
    // Merchant pages: 12 hours (ISR: 43200s)
    else if (pathname.startsWith('/shop/')) {
      sMaxAge = 43200; // 12 hours
    }
    // Blog pages: 30 days (ISR: 2592000s)
    else if (pathname.startsWith('/blog/')) {
      sMaxAge = 2592000; // 30 days
    }
    // Category pages: 48 hours (ISR: 172800s)
    else if (pathname.startsWith('/category/')) {
      sMaxAge = 172800; // 48 hours
    }
    // Other content pages (legal): 30 days (ISR: 2592000s)
    else if (!pathname.startsWith('/search') && !pathname.startsWith('/api/')) {
      sMaxAge = 2592000; // 30 days
    }
    // Search pages: no cache (SSR)
    else {
      return response; // Don't add cache headers for search/API
    }
    
    // Set cache headers for Cloudflare and Vercel Edge
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}, max-age=0`
    );
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon|icon|.*\\.(?:ico|png|jpg|jpeg|svg|gif|webp|css|js|woff|woff2|ttf|eot)).*)',
  ],
};

