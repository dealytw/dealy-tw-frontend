import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'

// Long cache: sitemaps are heavily crawled; keep edge-cached to reduce Strapi API calls.
export const revalidate = 604800 // 7 days

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=604800, stale-while-revalidate=86400'

// Escape XML special characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const currentDate = new Date()
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastmod: currentDate.toISOString(),
    },
    {
      url: `${baseUrl}/shop`,
      lastmod: currentDate.toISOString(),
    },
    {
      url: `${baseUrl}/special-offers`,
      lastmod: currentDate.toISOString(),
    },
  ]

  // Fetch all legal pages from CMS
  let legalPages: Array<{ url: string; lastmod: string }> = []
  try {
    const legalParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "pagination[pageSize]": "100",
      "sort[0]": "title:asc",
    }

    const legalsData = await strapiFetch<{ data: any[] }>(
      `/api/legals?${qs(legalParams)}`,
      { revalidate: 604800, tag: 'sitemap:legals' }
    )

    legalPages = (legalsData?.data || []).map((legal: any) => ({
      url: `${baseUrl}/${legal.page_slug || legal.slug}`,
      lastmod: legal.updatedAt ? new Date(legal.updatedAt).toISOString() : currentDate.toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching legal pages for sitemap:', error)
    // Continue without legal pages if fetch fails (non-critical)
  }

  const allPages = [...staticPages, ...legalPages]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
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
}

