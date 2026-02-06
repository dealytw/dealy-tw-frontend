import { NextResponse } from 'next/server'
import { getDomainConfig } from '@/lib/domain-config'
import {
  getPageSitemapData,
  getBlogSitemapData,
  getShopSitemapData,
  getTopicpageSitemapData,
  getCategorySitemapData,
} from '@/lib/sitemap-data'

export const revalidate = 259200 // 72 hours (3 days)

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=259200, stale-while-revalidate=86400' // 72 hours

export async function GET() {
  const domainConfig = getDomainConfig()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const market = 'tw'

  const [pageData, blogData, shopData, topicpageData, categoryData] = await Promise.all([
    getPageSitemapData(baseUrl, market),
    getBlogSitemapData(baseUrl, market),
    getShopSitemapData(baseUrl, market),
    getTopicpageSitemapData(baseUrl, market),
    getCategorySitemapData(baseUrl, market),
  ])

  const sitemaps = [
    { url: `${baseUrl}/page-sitemap.xml`, lastmod: pageData.maxLastmod },
    { url: `${baseUrl}/blog-sitemap.xml`, lastmod: blogData.maxLastmod },
    { url: `${baseUrl}/shop-sitemap.xml`, lastmod: shopData.maxLastmod },
    { url: `${baseUrl}/topicpage-sitemap.xml`, lastmod: topicpageData.maxLastmod },
    { url: `${baseUrl}/category-sitemap.xml`, lastmod: categoryData.maxLastmod },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(s => `  <sitemap>
    <loc>${s.url}</loc>
    <lastmod>${s.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}
