import { NextRequest, NextResponse } from "next/server";
import { strapiFetch, absolutizeMedia, qs } from "@/lib/strapi.server";

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const market = searchParams.get('market') || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
    const page = searchParams.get('page') || '1';
    const pageSize = searchParams.get('pageSize') || '20';
    
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
      "fields[0]": "id",
      "populate[market][fields][0]": "key",
    };

    const merchantData = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(merchantParams)}`, {
      revalidate: 300,
      tag: `merchant:${id}`,
    });

    if (!merchantData || !merchantData.data || merchantData.data.length === 0) {
      return NextResponse.json(
        { error: "Merchant not found" },
        { status: 404 }
      );
    }

    const merchant = merchantData.data[0];

    // Now fetch coupons for this merchant with explicit fields and pagination
    const couponParams = {
      "filters[merchant][id][$eq]": merchant.id.toString(),
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "coupon_title",
      "fields[2]": "coupon_type", 
      "fields[3]": "coupon_status",
      "fields[4]": "value",
      "fields[5]": "code",
      "fields[6]": "expires_at",
      "fields[7]": "user_count",
      "fields[8]": "description",
      "fields[9]": "editor_tips",
      "fields[10]": "affiliate_link",
      "fields[11]": "priority",
      "fields[12]": "last_click_at",
      "sort[0]": "priority:desc",
      "sort[1]": "last_click_at:desc",
      "pagination[page]": page,
      "pagination[pageSize]": pageSize,
      "populate[merchant][fields][0]": "id",
      "populate[merchant][fields][1]": "merchant_name",
      "populate[merchant][fields][2]": "slug",
      "populate[merchant][populate][logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const couponData = await strapiFetch<{ data: any[]; meta: any }>(`/api/coupons?${qs(couponParams)}`, {
      revalidate: 300,
      tag: `merchant:${id}`,
    });

    const coupons = (couponData.data || []).map((coupon: any) => ({
      id: coupon.id.toString(),
      coupon_title: coupon.coupon_title,
      coupon_type: coupon.coupon_type,
      coupon_status: coupon.coupon_status, // Added missing coupon_status field
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
