import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'

export const revalidate = 86400 // ISR - revalidate every 24 hours

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const currentDate = new Date()

  // Fetch all categories dynamically from CMS
  let categoryPages: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = []
  try {
    const categoryParams = {
      "fields[0]": "slug",
      "fields[1]": "updatedAt",
      "pagination[pageSize]": "100",
      "sort[0]": "name:asc",
    }

    const categoriesData = await strapiFetch<{ data: any[] }>(
      `/api/categories?${qs(categoryParams)}`,
      { revalidate: 86400, tag: 'sitemap:categories' }
    )

    categoryPages = (categoriesData?.data || []).map((category: any) => ({
      url: `${baseUrl}/category/${category.slug}`,
      lastmod: category.updatedAt ? new Date(category.updatedAt).toISOString() : currentDate.toISOString(),
      changefreq: 'weekly',
      priority: '0.7',
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

