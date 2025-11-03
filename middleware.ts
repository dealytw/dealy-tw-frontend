import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * URL Normalization Middleware
 * 
 * Handles:
 * 1. Trailing slash removal (except root) - 301 redirect
 * 2. Lowercase path enforcement - 301 redirect
 * 3. Preserves query parameters and hash
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

  return NextResponse.next();
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

