import { NextResponse } from 'next/server'
import { strapiFetch, qs } from '@/lib/strapi.server'
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config'

// Daily refresh: keep sitemap <lastmod> aligned with "每日更新" UI.
export const revalidate = 86400 // 24 hours

const SITEMAP_CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800' // 24 hours + SWR

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) }
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  // Compute offset by comparing "same instant" rendered in timeZone vs UTC.
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = dtf.formatToParts(date)
  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  )
  return asUTC - date.getTime()
}

function stableDailyJitterMinutes(seed: string, y: number, m: number, d: number) {
  // Deterministic "random" (0..59) that changes each day.
  const s = `${seed}:${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % 60
}

function dailyLastmodIso(timeZone: string, seed: string) {
  const now = new Date()
  const { year, month, day } = getDatePartsInTimeZone(now, timeZone)
  const jitterMin = stableDailyJitterMinutes(seed, year, month, day)
  const offsetMs = getTimeZoneOffsetMs(timeZone, now)
  // Build a timestamp representing 00:jitter in the target timezone, then convert to UTC ISO.
  const localMidnightAsUTC = Date.UTC(year, month - 1, day, 0, jitterMin, 0)
  return new Date(localMidnightAsUTC - offsetMs).toISOString()
}

export async function GET() {
  const domainConfig = getDomainConfigServer()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`
  const lastmodToday = dailyLastmodIso('Asia/Taipei', 'tw-shop-sitemap')
  // Hardcode market to 'tw' - this is the TW frontend, always filter for TW market only
  const market = 'tw'

  // Fetch all merchants dynamically from CMS
  // Only include published merchants (publishedAt exists)
  let merchantPages: Array<{ url: string; lastmod: string }> = []
  try {
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "filters[publishedAt][$notNull]": "true", // Only published merchants
      "fields[0]": "page_slug",
      "fields[1]": "updatedAt",
      "fields[2]": "publishedAt",
      "pagination[pageSize]": "500",
      "sort[0]": "merchant_name:asc",
    }

    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 86400, tag: 'sitemap:merchants' } // 24 hours
    )

    merchantPages = (merchantsData?.data || [])
      .filter((merchant: any) => merchant.publishedAt) // Double-check published status
      .map((merchant: any) => ({
        url: `${baseUrl}/shop/${merchant.page_slug || merchant.slug}`,
        // Intentionally set to "today" to match the UI's "每日更新" semantics.
        // This ensures /shop URLs show a fresh <lastmod> daily.
        lastmod: lastmodToday,
      }))
  } catch (error) {
    console.error('Error fetching merchants for sitemap:', error)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${merchantPages.map(page => `  <url>
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
