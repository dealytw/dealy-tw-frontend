import { NextRequest, NextResponse } from "next/server";
import { strapiFetch, absolutizeMedia, qs } from "@/lib/strapi.server";

export const runtime = 'nodejs';          // ensure server envs
export const revalidate = 300;          // cache this API response

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

    // Build query parameters with explicit fields and minimal populate
    const queryParams = {
      "filters[slug][$eq]": id,
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "merchant_name", 
      "fields[2]": "slug",
      "fields[3]": "summary",
      "fields[4]": "store_description",
      "fields[5]": "faqs",
      "fields[6]": "how_to",
      "fields[7]": "website",
      "fields[8]": "affiliate_link",
      "fields[9]": "page_layout",
      "fields[10]": "is_featured",
      "fields[11]": "seo_title",
      "fields[12]": "seo_description",
      "fields[13]": "canonical_url",
      "fields[14]": "priority",
      "fields[15]": "robots",
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
      "populate[useful_links][fields][0]": "link_title",
      "populate[useful_links][fields][1]": "url",
    };

    const merchantData = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(queryParams)}`, {
      revalidate: 300,
      tag: `merchant:${id}`,
    });

    if (!merchantData || !merchantData.data || merchantData.data.length === 0) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    // Debug: Log the raw merchant data to see available fields
    console.log('Raw merchant data:', merchantData.data[0]);
    console.log('Available fields:', Object.keys(merchantData.data[0]));
    console.log('store_description field:', merchantData.data[0].store_description);
    console.log('useful_links field:', merchantData.data[0].useful_links);

    // Transform the data to match our frontend structure
    const merchant = merchantData.data[0];
    const transformedMerchant = {
      id: merchant.id,
      name: merchant.merchant_name || merchant.name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : null,
      description: merchant.summary || merchant.description || "",
      store_description: merchant.store_description || "", // Re-enabled store_description field
      faqs: merchant.faqs || [], // Raw rich text data like store_description
      how_to: merchant.how_to || [], // Raw rich text data for how-to section
      useful_links: merchant.useful_links || [], // Component field with link_title and url
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
      publishedAt: merchant.publishedAt,
      relatedMerchants: [] // Will be populated separately
    };

    return NextResponse.json(transformedMerchant, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  } catch (error: any) {
    console.error("Error fetching merchant:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant data" },
      { status: 500 }
    );
  }
}
