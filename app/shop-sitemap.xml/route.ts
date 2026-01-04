import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'
import { parseHreflangUrls } from '@/seo/meta'

// Long cache: sitemaps are heavily crawled; keep edge-cached to reduce Strapi API calls.
export const revalidate = 259200 // 72 hours (3 days)

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=259200, stale-while-revalidate=86400' // 72 hours

/**
 * Determine hreflang code from URL domain
 * Examples:
 * - https://dealy.hk/... -> zh-HK
 * - https://dealy.sg/... -> zh-SG
 * - https://dealy.tw/... -> zh-TW
 */
function getHreflangFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    if (hostname.includes('dealy.hk')) return 'zh-HK';
    if (hostname.includes('dealy.sg')) return 'zh-SG';
    if (hostname.includes('dealy.tw')) return 'zh-TW';
    
    // Default: try to extract from domain pattern
    const match = hostname.match(/dealy\.([a-z]{2})/);
    if (match) {
      const country = match[1].toUpperCase();
      return `zh-${country}`;
    }
    
    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const currentDate = new Date()
  // Hardcode market to 'tw' - this is the TW frontend, always filter for TW market only
  const market = 'tw'
  const currentHreflang = domainConfig.hreflang // 'zh-TW'

  // Fetch all merchants dynamically from CMS
  // Only include published merchants (publishedAt exists)
  let merchantPages: Array<{ url: string; lastmod: string; alternateUrl?: string | null }> = []
  try {
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "filters[publishedAt][$notNull]": true, // Only published merchants
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "fields[3]": "hreflang_alternate_url",
      "pagination[pageSize]": "500",
      "sort[0]": "merchant_name:asc",
    }

    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 259200, tag: 'sitemap:merchants' } // 72 hours
    )

    merchantPages = (merchantsData?.data || [])
      .filter((merchant: any) => merchant.publishedAt) // Double-check published status
      .map((merchant: any) => ({
        url: `${baseUrl}/shop/${merchant.page_slug || merchant.slug}`,
        lastmod: merchant.updatedAt ? new Date(merchant.updatedAt).toISOString() : currentDate.toISOString(),
        alternateUrl: merchant.attributes?.hreflang_alternate_url || merchant.hreflang_alternate_url || null,
      }))
  } catch (error) {
    console.error('Error fetching merchants for sitemap:', error)
  }

  // Generate XML with hreflang (only if alternate URL exists)
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${merchantPages.map(page => {
    // Build hreflang links
    const hreflangLinks: Array<{ hreflang: string; href: string }> = []
    
    // Always add self
    hreflangLinks.push({
      hreflang: currentHreflang,
      href: page.url
    })
    
    // Add alternate URLs if provided (only equivalent pages, not homepage)
    if (page.alternateUrl) {
      const alternateUrls = parseHreflangUrls(page.alternateUrl)
      for (const url of alternateUrls) {
        const hreflangCode = getHreflangFromUrl(url)
        if (hreflangCode) {
          hreflangLinks.push({
            hreflang: hreflangCode,
            href: url
          })
        }
      }
    }
    
    // Generate hreflang XML tags
    const hreflangXml = hreflangLinks.map(link => 
      `    <xhtml:link rel="alternate" hreflang="${link.hreflang}" href="${link.href}"/>`
    ).join('\n')
    
    return `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
${hreflangXml}
  </url>`
  }).join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': SITEMAP_CACHE_CONTROL,
    },
  })
}

