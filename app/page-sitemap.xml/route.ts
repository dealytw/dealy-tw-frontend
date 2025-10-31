import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'

export const revalidate = 86400 // ISR - revalidate every 24 hours

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
  const baseUrl = 'https://www.dealy.tw'
  const currentDate = new Date()
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastmod: currentDate.toISOString(),
      changefreq: 'daily',
      priority: '1.0',
    },
    {
      url: `${baseUrl}/shop`,
      lastmod: currentDate.toISOString(),
      changefreq: 'daily',
      priority: '0.9',
    },
    {
      url: `${baseUrl}/special-offers`,
      lastmod: currentDate.toISOString(),
      changefreq: 'daily',
      priority: '0.9',
    },
  ]

  // Fetch all legal pages from CMS
  let legalPages: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = []
  try {
    const legalParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "slug",
      "fields[1]": "updatedAt",
      "pagination[pageSize]": "100",
      "sort[0]": "title:asc",
    }

    const legalsData = await strapiFetch<{ data: any[] }>(
      `/api/legals?${qs(legalParams)}`,
      { revalidate: 86400, tag: 'sitemap:legals' }
    )

    legalPages = (legalsData?.data || []).map((legal: any) => ({
      url: `${baseUrl}/${legal.slug}`,
      lastmod: legal.updatedAt ? new Date(legal.updatedAt).toISOString() : currentDate.toISOString(),
      changefreq: 'monthly',
      priority: '0.3',
    }))
  } catch (error) {
    console.error('Error fetching legal pages for sitemap:', error)
  }

  const allPages = [...staticPages, ...legalPages]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

