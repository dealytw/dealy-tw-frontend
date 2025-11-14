import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'

export const revalidate = 86400 // ISR - revalidate every 24 hours

export async function GET() {
  const baseUrl = 'https://www.dealy.tw'
  const currentDate = new Date()

  // Fetch all special offers (topicpage) from CMS
  // Only include published special offers (publishedAt exists)
  let topicPages: Array<{ url: string; lastmod: string }> = []
  try {
    const topicParams = {
      "filters[publishedAt][$notNull]": true, // Only published special offers
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "publishedAt:desc",
    }

    const topicsData = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs(topicParams)}`,
      { revalidate: 86400, tag: 'sitemap:topics' }
    )

    topicPages = (topicsData?.data || [])
      .filter((topic: any) => topic.publishedAt) // Double-check published status
      .map((topic: any) => ({
        url: `${baseUrl}/special-offers/${topic.page_slug || topic.slug}`,
        lastmod: topic.updatedAt 
          ? new Date(topic.updatedAt).toISOString() 
          : (topic.publishedAt ? new Date(topic.publishedAt).toISOString() : currentDate.toISOString()),
      }))
  } catch (error) {
    console.error('Error fetching special offers for sitemap:', error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${topicPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

