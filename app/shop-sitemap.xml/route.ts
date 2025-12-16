import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'

// Long cache: sitemaps are heavily crawled; keep edge-cached to reduce Strapi API calls.
export const revalidate = 604800 // 7 days

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=604800, stale-while-revalidate=86400'

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const currentDate = new Date()
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw'

  // Fetch all merchants dynamically from CMS
  // Only include published merchants (publishedAt exists)
  let merchantPages: Array<{ url: string; lastmod: string }> = []
  try {
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "filters[publishedAt][$notNull]": true, // Only published merchants
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "merchant_name:asc",
    }

    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 604800, tag: 'sitemap:merchants' }
    )

    merchantPages = (merchantsData?.data || [])
      .filter((merchant: any) => merchant.publishedAt) // Double-check published status
      .map((merchant: any) => ({
        url: `${baseUrl}/shop/${merchant.page_slug || merchant.slug}`,
        lastmod: merchant.updatedAt ? new Date(merchant.updatedAt).toISOString() : currentDate.toISOString(),
      }))
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

