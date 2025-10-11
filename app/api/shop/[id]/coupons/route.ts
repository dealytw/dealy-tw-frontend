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

    // First, get the merchant by slug to get the merchant ID
    const merchantParams = {
      "filters[slug][$eq]": id,
      "filters[market][key][$eq]": market,
      "populate[market]": "true",
    };

    const merchantData = await strapiGet("/api/merchants", merchantParams);

    if (!merchantData || !merchantData.data || merchantData.data.length === 0) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const merchant = merchantData.data[0];

    // Now fetch coupons for this merchant (both active and expired)
    const couponParams = {
      "filters[merchant][id][$eq]": merchant.id.toString(),
      "filters[market][key][$eq]": market,
      "filters[coupon_status][$eq]": "active",
      "populate[merchant][populate]": "logo",
      "populate[market]": "true",
      "sort": "priority:desc,createdAt:desc",
    };

    const couponData = await strapiGet("/api/coupons", couponParams);

    const coupons = (couponData.data || []).map((coupon: any) => ({
      id: coupon.id.toString(),
      coupon_title: coupon.coupon_title,
      coupon_type: coupon.coupon_type,
      value: coupon.value,
      code: coupon.code,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count || 0,
      description: coupon.description || "",
      editor_tips: coupon.editor_tips,
      affiliate_link: coupon.affiliate_link,
      merchant: {
        id: coupon.merchant.id,
        name: coupon.merchant.merchant_name,
        slug: coupon.merchant.slug,
        logo: coupon.merchant.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "",
      },
      market: {
        key: coupon.market.key,
      },
    }));

    return NextResponse.json(coupons);
  } catch (error: any) {
    console.error("Error fetching merchant coupons:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant coupons" },
      { status: 500 }
    );
  }
}
