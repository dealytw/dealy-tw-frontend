import { NextResponse } from 'next/server'

export const revalidate = 86400 // ISR - revalidate every 24 hours

export async function GET() {
  const baseUrl = 'https://www.dealy.tw'
  const currentDate = new Date()

  // Build sitemap index XML
  const sitemaps = [
    `${baseUrl}/page-sitemap.xml`,
    `${baseUrl}/blog-sitemap.xml`,
    `${baseUrl}/shop-sitemap.xml`,
    `${baseUrl}/topicpage-sitemap.xml`,
    `${baseUrl}/category-sitemap.xml`,
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(url => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${currentDate.toISOString()}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

