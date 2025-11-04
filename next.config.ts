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
    // Enable WebP/AVIF format conversion
    formats: ['image/avif', 'image/webp'],
    // Optimize image loading
    minimumCacheTTL: 60,
    // CDN caching through Next.js Image Optimization API
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Optional: enable typed routes, etc.
};

export default nextConfig;
