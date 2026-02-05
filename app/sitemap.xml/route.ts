import { NextResponse } from 'next/server'
import { getDomainConfig } from '@/lib/domain-config'

// Match shop-sitemap (24h) so index stays in sync with most frequently updated child
export const revalidate = 86400 // 24 hours

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=86400' // 24 hours

/** Extract max lastmod from child sitemap XML (guarantees index matches actual child content) */
function extractMaxLastmod(xml: string): string | null {
  const matches = xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)
  const lastmods = [...matches].map(m => m[1].trim())
  if (lastmods.length === 0) return null
  return lastmods.reduce((max, s) => (s > max ? s : max), lastmods[0])
}

export async function GET() {
  const domainConfig = getDomainConfig()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`

  const childUrls = [
    `${baseUrl}/page-sitemap.xml`,
    `${baseUrl}/blog-sitemap.xml`,
    `${baseUrl}/shop-sitemap.xml`,
    `${baseUrl}/topicpage-sitemap.xml`,
    `${baseUrl}/category-sitemap.xml`,
  ]

  const results = await Promise.all(
    childUrls.map(async (url) => {
      try {
        const res = await fetch(url, { next: { revalidate: 86400 } })
        const xml = await res.text()
        const lastmod = extractMaxLastmod(xml)
        return { url, lastmod }
      } catch {
        return { url, lastmod: null }
      }
    })
  )

  const nowUtc = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${results.map(({ url, lastmod }) => `  <sitemap>
    <loc>${url}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : `<lastmod>${nowUtc}</lastmod>`}
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}
