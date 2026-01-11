import { NextRequest, NextResponse } from "next/server";
import { strapiFetch, qs, getStartsAtFilterParams } from "@/lib/strapi.server";

export const runtime = 'nodejs';
export const revalidate = 86400; // Cache for 24 hours - coupons don't change frequently

const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantSlug = searchParams.get('merchant');
    const market = searchParams.get('market') || 'tw';
    
    if (!merchantSlug) {
      return NextResponse.json(
        { error: "Merchant slug is required" },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    // Fetch the first priority active coupon for the merchant with explicit fields
    const params = {
      "filters[merchant][page_slug][$eq]": merchantSlug,
      "filters[market][key][$eq]": market,
      "filters[coupon_status][$eq]": "active",
      ...getStartsAtFilterParams(), // Filter out scheduled coupons (starts_at in the future)
      "fields[0]": "id",
      "fields[1]": "coupon_title",
      "fields[2]": "value",
      "fields[3]": "code",
      "fields[4]": "coupon_type",
      "fields[5]": "affiliate_link",
      "fields[6]": "priority",
      "sort": "priority:asc",
      "pagination[page]": "1",
      "pagination[pageSize]": "1",
    };

    const couponData = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, {
      revalidate: 86400, // Cache for 24 hours - coupons don't change frequently
      tag: `merchant-coupon:${merchantSlug}`,
    });
    
    if (!couponData || !couponData.data || couponData.data.length === 0) {
      return NextResponse.json({ coupon: null }, { headers: { 'Cache-Control': CACHE_CONTROL } });
    }

    const coupon = couponData.data[0];
    return NextResponse.json({
      coupon: {
        id: coupon.id.toString(),
        title: coupon.coupon_title,
        value: coupon.value,
        code: coupon.code,
        coupon_type: coupon.coupon_type,
        affiliate_link: coupon.affiliate_link,
        priority: coupon.priority
      }
    }, { headers: { 'Cache-Control': CACHE_CONTROL } });
  } catch (error: any) {
    console.error("Error fetching merchant coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant coupon" },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
