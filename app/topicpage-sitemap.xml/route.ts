import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'

// Long cache: sitemaps are heavily crawled; keep edge-cached to reduce Strapi API calls.
export const revalidate = 259200 // 72 hours (3 days)

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=259200, stale-while-revalidate=86400' // 72 hours

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const currentDate = new Date()
  
  // Hardcode market to 'tw' - this is the TW frontend, always filter for TW market only
  const marketKey = 'tw'

  // Fetch all special offers (topicpage) from CMS
  // Only include published special offers (publishedAt exists) and filter by market (TW only)
  let topicPages: Array<{ url: string; lastmod: string }> = []
  try {
    const topicParams = {
      "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
      "filters[publishedAt][$notNull]": true, // Only published special offers
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "publishedAt:desc",
    }

    const topicsData = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs(topicParams)}`,
      { revalidate: 259200, tag: 'sitemap:topics' } // 72 hours
    )

    if (topicsData?.data && Array.isArray(topicsData.data)) {
      topicPages = topicsData.data
        .filter((topic: any) => topic.publishedAt && topic.page_slug) // Double-check published status and slug exists
        .map((topic: any) => ({
          url: `${baseUrl}/special-offers/${topic.page_slug}`,
          lastmod: topic.updatedAt 
            ? new Date(topic.updatedAt).toISOString() 
            : (topic.publishedAt ? new Date(topic.publishedAt).toISOString() : currentDate.toISOString()),
        }))
    }
  } catch (error) {
    console.error('Error fetching special offers for sitemap:', error)
    // Continue with empty array - return valid empty sitemap
  }

  // Always return valid XML, even if empty
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${topicPages.length > 0 ? topicPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
  </url>`).join('\n') : ''}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}

