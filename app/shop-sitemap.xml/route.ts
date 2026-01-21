import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'
import { getDailyUpdatedTimeIso } from '@/lib/jsonld'

// Daily refresh: keep sitemap <lastmod> aligned with "每日更新" UI.
export const revalidate = 86400 // 24 hours

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800' // 24 hours + SWR

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  // Hardcode market to 'tw' - this is the TW frontend, always filter for TW market only
  const market = 'tw'

  // Fetch all merchants dynamically from CMS
  // Only include published merchants (publishedAt exists)
  let merchantPages: Array<{ url: string; lastmod: string }> = []
  try {
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "filters[publishedAt][$notNull]": "true", // Only published merchants
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "merchant_name:asc",
    }

    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 86400, tag: 'sitemap:merchants' } // 24 hours
    )

    merchantPages = (merchantsData?.data || [])
      .filter((merchant: any) => merchant.publishedAt) // Double-check published status
      .map((merchant: any) => {
        const slug = String(merchant.page_slug || merchant.slug || '')
        const url = `${baseUrl}/shop/${slug}`
        // Intentionally set to "today" to match the UI's "每日更新" semantics.
        // Use a per-merchant deterministic jitter so each <lastmod> is different.
        const lastmod = getDailyUpdatedTimeIso(`tw-shop-sitemap:${slug || 'unknown'}`)
        return { url, lastmod }
      })
  } catch (error) {
    console.error('Error fetching merchants for sitemap:', error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${merchantPages.map(page => `  <url>
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
