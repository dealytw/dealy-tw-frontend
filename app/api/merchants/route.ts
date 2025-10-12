import { NextRequest, NextResponse } from "next/server";
import { strapiGet, absolutizeMedia } from "@/lib/strapi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

    const params = {
      "filters[market][key][$eq]": market,
      "populate[logo]": "true",
      "populate[market]": "true",
      "sort": "merchant_name:asc", // Sort A-Z by merchant name
      "pagination[pageSize]": "100", // Fetch up to 100 merchants per page
    };

    const merchantsData = await strapiGet("/api/merchants", params);

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
        website: merchant.website || "",
        affiliateLink: merchant.affiliate_link || "",
        market: merchant.market?.key || market.toUpperCase(),
      };
    });

    return NextResponse.json(merchants);
  } catch (error: any) {
    console.error('Error fetching merchants:', error);
    return NextResponse.json(
      { error: "Failed to fetch merchants", details: error.message },
      { status: 500 }
    );
  }
}
