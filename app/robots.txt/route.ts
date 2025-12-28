import { NextResponse } from 'next/server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'

/**
 * Dynamic robots.txt route
 * 
 * This overrides Cloudflare's managed robots.txt to ensure we have full control.
 * Next.js will prioritize this route over public/robots.txt if both exist.
 * 
 * This prevents Cloudflare's "AI Crawl Control" from injecting Content-signal
 * directives that cause "robots.txt invalid" errors and lower SEO scores.
 */
export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`

  // Clean robots.txt content (NO Content-signal directive)
  // Domain-specific: Only include sitemap for current domain
  // Explicitly allow favicon for Google crawlers (WordPress-style optimization)
  const robotsTxt = `# Block admin and API routes from crawling
User-agent: *
Disallow: /api/admin/
Disallow: /api/debug/
Disallow: /api/env-test/
Disallow: /api/hero-test/
Disallow: /api/mapper-test/
Disallow: /api/media-test/

# Explicitly allow favicon for Google crawlers (WordPress-style optimization)
Allow: /favicon.ico
Allow: /apple-touch-icon.png
Allow: /site.webmanifest

# Allow everything else
Allow: /

# Sitemap (canonical - use /sitemap.xml, not /sitemap_index.xml)
Sitemap: ${baseUrl}/sitemap.xml
`

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
    },
  })
}

