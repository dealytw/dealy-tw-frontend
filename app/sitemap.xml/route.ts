import { NextResponse } from 'next/server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'

// Long cache: sitemaps are heavily crawled; keep edge-cached to reduce Strapi API calls.
export const revalidate = 259200 // 72 hours (3 days)

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=259200, stale-while-revalidate=86400' // 72 hours

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const currentDate = new Date()

  // Build sitemap index XML
  const sitemaps = [
    `${baseUrl}/page-sitemap.xml`,
    `${baseUrl}/blog-sitemap.xml`,
    `${baseUrl}/shop-sitemap.xml`,
    `${baseUrl}/topicpage-sitemap.xml`,
    `${baseUrl}/category-sitemap.xml`,
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(url => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}

