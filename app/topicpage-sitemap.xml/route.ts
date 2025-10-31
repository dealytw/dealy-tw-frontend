import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'

export const revalidate = 86400 // ISR - revalidate every 24 hours

export async function GET() {
  const baseUrl = 'https://www.dealy.tw'
  const currentDate = new Date()

  // Fetch all special offers (topicpage) from CMS
  let topicPages: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = []
  try {
    const topicParams = {
      "fields[0]": "slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "publishedAt:desc",
    }

    const topicsData = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs(topicParams)}`,
      { revalidate: 86400, tag: 'sitemap:topics' }
    )

    topicPages = (topicsData?.data || []).map((topic: any) => ({
      url: `${baseUrl}/special-offers/${topic.slug}`,
      lastmod: topic.updatedAt 
        ? new Date(topic.updatedAt).toISOString() 
        : (topic.publishedAt ? new Date(topic.publishedAt).toISOString() : currentDate.toISOString()),
      changefreq: 'daily',
      priority: '0.8',
    }))
  } catch (error) {
    console.error('Error fetching special offers for sitemap:', error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${topicPages.map(page => `  <url>
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

