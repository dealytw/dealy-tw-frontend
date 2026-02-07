import { NextResponse } from 'next/server'
import { getDomainConfig } from '@/lib/domain-config'
import { getCategorySitemapData } from '@/lib/sitemap-data'
import { escapeXml } from '@/lib/sitemap-utils'

export const revalidate = 259200 // 72 hours
const SITEMAP_CACHE_CONTROL = 'public, s-maxage=259200, stale-while-revalidate=86400'
const MARKET = 'tw'

export async function GET() {
  try {
    const domainConfig = getDomainConfig()
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`

    const { pages } = await getCategorySitemapData(baseUrl, MARKET)

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
    console.error('[category-sitemap.xml] Error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw'
    const nowUtc = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${escapeXml(`${baseUrl}/category`)}</loc>
    <lastmod>${nowUtc}</lastmod>
  </url>
</urlset>`
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=86400',
      },
    })
  }
}
