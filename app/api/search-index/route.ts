import { NextResponse } from 'next/server';
import { strapiFetch, absolutizeMedia, qs, rewriteImageUrl } from '@/lib/strapi.server';

export const runtime = 'nodejs';

// Hard cache for 7 days (saves Strapi + CPU).
export const revalidate = 604800; // 7 days
const CACHE_CONTROL = 'public, s-maxage=604800, stale-while-revalidate=2592000'; // 7d + 30d SWR

// Hardcode market for TW frontend. No fallback accepted.
const MARKET_KEY = 'tw';

export async function GET() {
  try {
    const merchantParams = {
      'filters[market][key][$eq]': MARKET_KEY,
      'fields[0]': 'id',
      'fields[1]': 'merchant_name',
      'fields[2]': 'page_slug',
      'fields[3]': 'site_url',
      'sort[0]': 'merchant_name:asc',
      'pagination[page]': '1',
      // Keep payload bounded but large enough for instant search.
      'pagination[pageSize]': '1000',
      'populate[logo][fields][0]': 'url',
      'populate[market][fields][0]': 'key',
    } as Record<string, string>;

    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate, tag: `search-index:merchants:${MARKET_KEY}` }
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dealy.tw';

    const merchants = (merchantsData?.data || []).map((merchant: any) => {
      const logoUrl = merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : '';
      return {
        id: merchant.id,
        name: merchant.merchant_name || '',
        slug: merchant.page_slug || '',
        logo: logoUrl ? rewriteImageUrl(logoUrl, siteUrl) : '',
        website: merchant.site_url || merchant.website || '',
      };
    });

    return NextResponse.json(
      { merchants },
      { headers: { 'Cache-Control': CACHE_CONTROL } }
    );
  } catch (error) {
    console.error('[search-index] Error building merchant index:', error);
    return NextResponse.json(
      { merchants: [] },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

