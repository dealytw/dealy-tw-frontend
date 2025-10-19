import { NextRequest, NextResponse } from "next/server";
import { strapiGet } from "@/lib/strapi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantSlug = searchParams.get('merchant');
    const market = searchParams.get('market') || 'tw';
    
    if (!merchantSlug) {
      return NextResponse.json(
        { error: "Merchant slug is required" },
        { status: 400 }
      );
    }

    // Fetch the first priority active coupon for the merchant
    const params = {
      "filters[merchant][slug][$eq]": merchantSlug,
      "filters[market][key][$eq]": market,
      "filters[coupon_status][$eq]": "active",
      "sort": "priority:asc",
      "pagination[pageSize]": "1",
    };

    const couponData = await strapiGet("/api/coupons", params);
    
    if (!couponData || !couponData.data || couponData.data.length === 0) {
      return NextResponse.json({ coupon: null });
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
    });
  } catch (error: any) {
    console.error("Error fetching merchant coupon:", error);
    return NextResponse.json(
      { error: "Failed to fetch merchant coupon" },
      { status: 500 }
    );
  }
}
