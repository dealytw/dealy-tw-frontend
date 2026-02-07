import { NextResponse } from 'next/server'
import { getDomainConfig } from '@/lib/domain-config'
import {
  getPageSitemapData,
  getBlogSitemapData,
  getShopSitemapData,
  getTopicpageSitemapData,
  getCategorySitemapData,
} from '@/lib/sitemap-data'
import { escapeXml, toUtcLastmod } from '@/lib/sitemap-utils'

export const revalidate = 259200 // 72 hours (3 days)
const SITEMAP_CACHE_CONTROL = 'public, s-maxage=259200, stale-while-revalidate=86400'
const MARKET = 'tw'

export async function GET() {
  try {
    const domainConfig = getDomainConfig()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`

    const results = await Promise.allSettled([
      getPageSitemapData(baseUrl, MARKET),
      getBlogSitemapData(baseUrl, MARKET),
      getShopSitemapData(baseUrl, MARKET),
      getTopicpageSitemapData(baseUrl, MARKET),
      getCategorySitemapData(baseUrl, MARKET),
    ])

    const nowUtc = toUtcLastmod(new Date())
    const sitemaps = [
      { url: `${baseUrl}/page-sitemap.xml`, lastmod: results[0].status === 'fulfilled' ? results[0].value.maxLastmod : nowUtc },
      { url: `${baseUrl}/blog-sitemap.xml`, lastmod: results[1].status === 'fulfilled' ? results[1].value.maxLastmod : nowUtc },
      { url: `${baseUrl}/shop-sitemap.xml`, lastmod: results[2].status === 'fulfilled' ? results[2].value.maxLastmod : nowUtc },
      { url: `${baseUrl}/topicpage-sitemap.xml`, lastmod: results[3].status === 'fulfilled' ? results[3].value.maxLastmod : nowUtc },
      { url: `${baseUrl}/category-sitemap.xml`, lastmod: results[4].status === 'fulfilled' ? results[4].value.maxLastmod : nowUtc },
    ]

    if (results.some((r) => r.status === 'rejected')) {
      console.error('[sitemap.xml] Some sitemaps failed:', results.map((r, i) => (r.status === 'rejected' ? `[${i}] ${r.reason}` : null)).filter(Boolean))
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((s) => `  <sitemap>
    <loc>${escapeXml(s.url)}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': SITEMAP_CACHE_CONTROL,
      },
    })
  } catch (error) {
    console.error('[sitemap.xml] Error:', error)
    return new NextResponse('Service Unavailable', { status: 503 })
  }
}
