import { NextResponse } from 'next/server'
import { getDomainConfig } from '@/lib/domain-config'
import { getTopicpageSitemapData } from '@/lib/sitemap-data'

export const revalidate = 259200 // 72 hours
const SITEMAP_CACHE_CONTROL = 'public, s-maxage=259200, stale-while-revalidate=86400'

export async function GET() {
  const domainConfig = getDomainConfig()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const marketKey = 'tw'

  const { pages } = await getTopicpageSitemapData(baseUrl, marketKey)

  const urlEntries = pages.map(
    (page) =>
      '  <url>\n    <loc>' + page.url + '</loc>\n    <lastmod>' + page.lastmod + '</lastmod>\n  </url>'
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}
