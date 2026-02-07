import { NextResponse } from 'next/server'
import { getDomainConfig } from '@/lib/domain-config'
import { getShopSitemapData } from '@/lib/sitemap-data'
import { escapeXml } from '@/lib/sitemap-utils'

export const revalidate = 86400 // 24 hours
const SITEMAP_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800'
const MARKET = 'tw'

export async function GET() {
  try {
    const domainConfig = getDomainConfig()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`

    const { pages } = await getShopSitemapData(baseUrl, MARKET)

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((page) => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': SITEMAP_CACHE_CONTROL,
      },
    })
  } catch (error) {
    console.error('[shop-sitemap.xml] Error:', error)
    return new NextResponse('Service Unavailable', { status: 503 })
  }
}
