import { NextRequest, NextResponse } from "next/server";
import { strapiGet } from "@/lib/strapi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        { error: "Merchant ID is required" },
        { status: 400 }
      );
    }

    // Fetch merchant data from Strapi
    const merchantData = await strapiGet(`/api/shops/${id}`, {
      "populate": "logo"
    });

    if (!merchantData || !merchantData.data) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Transform the data to match our frontend structure
    const merchant = merchantData.data;
    const transformedMerchant = {
      id: merchant.id,
      name: merchant.merchant_name || merchant.name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? `https://cms.dealy.hk${merchant.logo.url}` : null,
      description: merchant.summary || merchant.description || "",
      website: merchant.website || "",
      affiliateLink: merchant.affiliate_link || merchant.affiliateLink || "",
      pageLayout: merchant.page_layout || "coupon",
      isFeatured: merchant.is_featured || false,
      market: merchant.market || "TW",
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
