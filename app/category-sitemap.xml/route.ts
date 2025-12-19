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
  
  // Hardcode market to 'tw' - this is the TW frontend, always filter for TW market only
  const marketKey = 'tw'

  // Fetch all categories dynamically from CMS
  // Only include categories for the current market (TW only)
  let categoryPages: Array<{ url: string; lastmod: string }> = []
  try {
    const categoryParams = {
      "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "populate[market][fields][0]": "key", // Populate market relation for filtering
      "pagination[pageSize]": "100",
      "sort[0]": "name:asc",
    }

    const categoriesData = await strapiFetch<{ data: any[] }>(
      `/api/categories?${qs(categoryParams)}`,
      { revalidate: 604800, tag: 'sitemap:categories' }
    )

    // Debug: Log market filter and results
    console.log(`[CategorySitemap] Market filter: ${marketKey}, Found ${categoriesData?.data?.length || 0} categories`)

    categoryPages = (categoriesData?.data || []).map((category: any) => ({
      url: `${baseUrl}/category/${category.page_slug}`,
      lastmod: category.updatedAt ? new Date(category.updatedAt).toISOString() : currentDate.toISOString(),
    }))
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error)
    // Return empty sitemap on error
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categoryPages.map(page => `  <url>
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

