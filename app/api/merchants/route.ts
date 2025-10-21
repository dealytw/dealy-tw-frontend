import { NextRequest, NextResponse } from "next/server";
import { strapiFetch, absolutizeMedia, qs } from "@/lib/strapi.server";

export const runtime = 'nodejs';
export const revalidate = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '100';

    const params = {
      "filters[market][key][$eq]": market, // Market relation filter
      "fields[0]": "id",
      "fields[1]": "merchant_name",
      "fields[2]": "slug",
      "fields[3]": "summary",
      "fields[4]": "default_affiliate_link",
      "sort": "merchant_name:asc",
      "pagination[page]": page,
      "pagination[pageSize]": pageSize,
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const merchantsData = await strapiFetch<{ data: any[]; meta: any }>(`/api/merchants?${qs(params)}`, {
      revalidate: 300,
      tag: `merchants:${market}`,
    });

    if (!merchantsData || !merchantsData.data) {
      return NextResponse.json({ error: "No merchants found" }, { status: 404 });
    }

    const merchants = merchantsData.data.map((merchant: any) => {
      // Determine the letter for alphabetical grouping
      let letter = merchant.merchant_name.charAt(0).toUpperCase();
      
      // Check if the first character is Chinese (CJK Unified Ideographs)
      const firstChar = merchant.merchant_name.charAt(0);
      const isChinese = /[\u4e00-\u9fff]/.test(firstChar);
      
      // If the name starts with Chinese, always use the first letter of the slug
      if (isChinese) {
        letter = merchant.slug.charAt(0).toUpperCase();
      }
      
      return {
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.slug,
        logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
        letter: letter,
        description: merchant.summary || "",
        affiliateLink: merchant.default_affiliate_link || "",
        market: market.toUpperCase(),
      };
    });

    return NextResponse.json({
      merchants,
      pagination: merchantsData.meta?.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json(
      { error: "Failed to fetch merchants", details: error.message },
      { status: 500 }
    );
  }
}
