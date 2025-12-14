import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: '.' },
  eslint: {
    // Temporarily ignore ESLint during builds until we fix the issues
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during builds
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      // Strapi local dev
      { protocol: "http", hostname: "localhost", port: "1337", pathname: "/uploads/**" },
      // Strapi Cloud / Prod domains
      { protocol: "https", hostname: "**.strapiapp.com", pathname: "/uploads/**" },
      { protocol: "https", hostname: "ingenious-charity-13f9502d24.media.strapiapp.com", pathname: "/**" },
      { protocol: "https", hostname: "cms.dealy.tw", pathname: "/uploads/**" },
      { protocol: "https", hostname: "cms.dealy.hk", pathname: "/uploads/**" },
      { protocol: "https", hostname: "cms.dealy.sg", pathname: "/uploads/**" },
      { protocol: "https", hostname: "cms.dealy.jp", pathname: "/uploads/**" },
      { protocol: "https", hostname: "cms.dealy.kr", pathname: "/uploads/**" },
      // Generic HTTPS pattern for any domain
      { protocol: "https", hostname: "**" },
    ],
    // Only generate/serve WebP from the optimizer for Google Search Engine compatibility
    formats: ['image/webp'],
    // Optimize image loading
    minimumCacheTTL: 60,
    // CDN caching through Next.js Image Optimization API
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Rewrite proxy for /upload/* to Strapi CDN
  // This allows clean URLs like https://dealy.tw/upload/tripcom.webp
  // The API route /api/upload/[filename] will handle hash mapping
  async rewrites() {
    return [
      {
        source: '/upload/:path*',
        destination: '/api/upload/:path*',
      },
    ];
  },
  // Security headers
  async headers() {
    // Common security headers for all resources
    const commonHeaders = [
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
    ];

    // Full security headers for HTML pages
    const fullHeaders = [
      ...commonHeaders,
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://www.google.com https://www.gstatic.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https: blob:",
          "font-src 'self' data:", // Only allow self-hosted fonts and data URIs - use browser default fonts (blocks external font loading from extensions/third-party scripts)
          "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://*.googleapis.com https://*.strapiapp.com https://cms.dealy.tw https://cms.dealy.hk https://cms.dealy.sg https://cms.dealy.jp https://cms.dealy.kr",
          "frame-src 'self' https://www.googletagmanager.com",
          "object-src 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'self'",
          "upgrade-insecure-requests",
        ].join('; '),
      },
    ];

    return [
      // Apply full headers to HTML pages (exclude static assets)
      {
        source: '/:path*',
        headers: fullHeaders,
      },
      // Apply basic security headers to Next.js static assets (JS, CSS, images)
      {
        source: '/_next/static/:path*',
        headers: commonHeaders,
      },
      // Apply basic security headers to Next.js image optimization API
      {
        source: '/_next/image/:path*',
        headers: commonHeaders,
      },
      // Apply basic security headers to uploaded images
      {
        source: '/upload/:path*',
        headers: commonHeaders,
      },
    ];
  },
};

export default nextConfig;
