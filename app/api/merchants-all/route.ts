import { NextRequest, NextResponse } from "next/server";
import { strapiFetch, absolutizeMedia, qs } from "@/lib/strapi.server";

export const runtime = 'nodejs';

/**
 * API route to fetch all merchants for search prefetching
 * Uses the same approach as /shop page for consistency
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

    // Use the same merchant params as /shop page for consistency
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "merchant_name",
      "fields[2]": "slug",
      "fields[3]": "summary",
      "fields[4]": "website",
      "fields[5]": "affiliate_link",
      "sort[0]": "merchant_name:asc",
      "pagination[page]": "1",
      "pagination[pageSize]": "500", // Get more merchants like shop page
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const merchantsData = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(merchantParams)}`, {
      revalidate: 3600, // Cache for 1 hour
      tag: `search:all-merchants:${market}`
    });
    
    // Transform merchants data - same structure as shop page
    const merchants = (merchantsData?.data || []).map((merchant: any) => ({
      id: merchant.id,
      name: merchant.merchant_name, // Map merchant_name to name
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
      website: merchant.website || merchant.affiliate_link || "",
    }));

    return NextResponse.json({
      merchants,
      count: merchants.length,
      market
    });

  } catch (error: any) {
    console.error('[merchants-all API] Error:', error);
    return NextResponse.json(
      { 
        error: "Failed to fetch merchants", 
        details: error.message,
        merchants: [],
        count: 0
      },
      { status: 500 }
    );
  }
}
