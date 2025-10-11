import { NextRequest, NextResponse } from "next/server";
import { strapiGet, absolutizeMedia } from "@/lib/strapi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
    
    if (!id) {
      return NextResponse.json(
        { error: "Merchant slug is required" },
        { status: 400 }
      );
    }

    // Fetch merchant data from Strapi by slug with market filtering
    const params_query = {
      "filters[slug][$eq]": id,
      "filters[market][key][$eq]": market,
      "populate[logo]": "true",
      "populate[market]": "true",
    };

    const merchantData = await strapiGet("/api/merchants", params_query);

    if (!merchantData || !merchantData.data || merchantData.data.length === 0) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Transform the data to match our frontend structure
    const merchant = merchantData.data[0];
    const transformedMerchant = {
      id: merchant.id,
      name: merchant.merchant_name || merchant.name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : null,
      description: merchant.summary || merchant.description || "",
      website: merchant.website || "",
      affiliateLink: merchant.affiliate_link || merchant.affiliateLink || "",
      pageLayout: merchant.page_layout || "coupon",
      isFeatured: merchant.is_featured || false,
      market: merchant.market?.key || market.toUpperCase(),
      seoTitle: merchant.seo_title || "",
      seoDescription: merchant.seo_description || "",
      canonicalUrl: merchant.canonical_url || "",
      priority: merchant.priority || 0,
      robots: merchant.robots || "index,follow",
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
      publishedAt: merchant.publishedAt
    };

    return NextResponse.json(transformedMerchant);
  } catch (error: any) {
    console.error("Error fetching merchant:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant data" },
      { status: 500 }
    );
  }
}
