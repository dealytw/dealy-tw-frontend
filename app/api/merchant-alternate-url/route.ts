// API route to fetch merchant hreflang_alternate URL
// This allows client-side components to get the alternate URL without exposing Strapi credentials

import { NextRequest, NextResponse } from 'next/server';
import { strapiFetch, qs } from '@/lib/strapi.server';
import { extractUrlFromRichText } from '@/src/seo/meta';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const merchantSlug = searchParams.get('slug');

  if (!merchantSlug) {
    return NextResponse.json({ error: 'Merchant slug is required' }, { status: 400 });
  }

  try {
    const marketKey = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
    const merchantRes = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
      'filters[page_slug][$eq]': merchantSlug,
      'filters[market][key][$eq]': marketKey,
      'fields[0]': 'hreflang_alternate',
    })}`, {
      revalidate: 3600, // Cache for 1 hour
      tag: `merchant-alternate:${merchantSlug}`
    });

    const merchant = merchantRes.data?.[0];
    if (!merchant) {
      return NextResponse.json({ alternateUrl: null });
    }

    // Extract hreflang_alternate from merchant data (handle both Strapi v5 attributes format and flat format)
    const hreflangAlternateField = merchant.attributes?.hreflang_alternate || merchant.hreflang_alternate;
    const alternateUrl = extractUrlFromRichText(hreflangAlternateField);

    return NextResponse.json({ alternateUrl });
  } catch (error) {
    console.error('[merchant-alternate-url] Error fetching alternate URL:', error);
    return NextResponse.json({ error: 'Failed to fetch alternate URL' }, { status: 500 });
  }
}

