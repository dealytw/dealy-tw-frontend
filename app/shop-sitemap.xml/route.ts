import { NextResponse } from 'next/server'
import { getDomainConfig } from '@/lib/domain-config'
import { getShopSitemapData } from '@/lib/sitemap-data'

export const revalidate = 86400 // 24 hours
const SITEMAP_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800'

export async function GET() {
  const domainConfig = getDomainConfig()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const market = 'tw'

  const { pages } = await getShopSitemapData(baseUrl, market)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}
