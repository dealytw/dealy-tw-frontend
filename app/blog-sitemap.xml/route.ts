import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'

export const revalidate = 86400 // ISR - revalidate every 24 hours

export async function GET() {
  const baseUrl = 'https://www.dealy.tw'
  const currentDate = new Date()

  // Fetch all blog posts dynamically from CMS
  // Only include published posts (publishedAt exists)
  let blogPages: Array<{ url: string; lastmod: string; changefreq: string; priority: string }> = []
  try {
    const blogParams = {
      "filters[publishedAt][$notNull]": true, // Only published posts
      "fields[0]": "slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "publishedAt:desc",
    }

    const blogData = await strapiFetch<{ data: any[] }>(
      `/api/posts?${qs(blogParams)}`,
      { revalidate: 86400, tag: 'sitemap:blog' }
    )

    blogPages = (blogData?.data || [])
      .filter((post: any) => post.publishedAt) // Double-check published status
      .map((post: any) => ({
        url: `${baseUrl}/blog/${post.slug}`,
        lastmod: post.updatedAt 
          ? new Date(post.updatedAt).toISOString() 
          : (post.publishedAt ? new Date(post.publishedAt).toISOString() : currentDate.toISOString()),
        changefreq: 'monthly',
        priority: '0.6',
      }))
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogPages.map(page => `  <url>
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

