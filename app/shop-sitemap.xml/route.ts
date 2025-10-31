import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'

export const revalidate = 86400 // ISR - revalidate every 24 hours

export async function GET() {
  const baseUrl = 'https://www.dealy.tw'
  const currentDate = new Date()
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw'

  // Fetch all merchants dynamically from CMS
  let merchantPages: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = []
  try {
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "slug",
      "fields[1]": "updatedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "merchant_name:asc",
    }

    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 86400, tag: 'sitemap:merchants' }
    )

    merchantPages = (merchantsData?.data || []).map((merchant: any) => ({
      url: `${baseUrl}/shop/${merchant.slug}`,
      lastmod: merchant.updatedAt ? new Date(merchant.updatedAt).toISOString() : currentDate.toISOString(),
      changefreq: 'daily',
      priority: '0.8',
    }))
  } catch (error) {
    console.error('Error fetching merchants for sitemap:', error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${merchantPages.map(page => `  <url>
    <loc>${page.url}</loc>
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

