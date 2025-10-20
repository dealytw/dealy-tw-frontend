import { NextRequest, NextResponse } from "next/server";
import { strapiGet, absolutizeMedia } from "@/lib/strapi";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const market = searchParams.get('market') || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        merchants: [], 
        coupons: [],
        message: "Please provide a search query"
      });
    }

    const searchQuery = query.trim();

    // Search merchants - simplified approach
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "populate[logo]": "true",
      "populate[market]": "true",
      "sort": "merchant_name:asc",
      "pagination[pageSize]": "50",
    };

    const merchantsData = await strapiGet("/api/merchants", merchantParams);
    const allMerchants = merchantsData?.data || [];
    
    // Filter merchants on the client side for now
    const merchants = allMerchants
      .filter((merchant: any) => {
        const name = merchant.merchant_name?.toLowerCase() || '';
        const slug = merchant.slug?.toLowerCase() || '';
        const summary = merchant.summary?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();
        
        return name.includes(query) || slug.includes(query) || summary.includes(query);
      })
      .slice(0, 20)
      .map((merchant: any) => ({
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.slug,
        logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
        description: merchant.summary || "",
        website: merchant.website || "",
        affiliateLink: merchant.affiliate_link || "",
        market: merchant.market?.key || market.toUpperCase(),
        type: 'merchant'
      }));

    // Search coupons - using existing coupon API
    let coupons: any[] = [];
    try {
      const couponResponse = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'}/api/coupons?filters[market][key][$eq]=${market}&filters[is_active][$eq]=true&populate[merchant][populate][logo]=true&pagination[pageSize]=50`);
      const couponData = await couponResponse.json();
      const allCoupons = couponData?.data || [];
      
      // Filter coupons on the client side
      coupons = allCoupons
        .filter((coupon: any) => {
          const title = coupon.coupon_title?.toLowerCase() || '';
          const description = coupon.description?.toLowerCase() || '';
          const tips = coupon.editor_tips?.toLowerCase() || '';
          const merchantName = coupon.merchant?.merchant_name?.toLowerCase() || '';
          const query = searchQuery.toLowerCase();
          
          return title.includes(query) || description.includes(query) || 
                 tips.includes(query) || merchantName.includes(query);
        })
        .slice(0, 20)
        .map((coupon: any) => ({
          id: coupon.id,
          title: coupon.coupon_title || 'Untitled Coupon',
          description: coupon.description || "",
          value: coupon.value || "",
          code: coupon.code || "",
          coupon_type: coupon.coupon_type || "promo_code",
          expires_at: coupon.expires_at || "長期有效",
          user_count: coupon.user_count || 0,
          affiliate_link: coupon.affiliate_link || "#",
          merchant: {
            id: coupon.merchant?.id,
            name: coupon.merchant?.merchant_name || 'Unknown Merchant',
            slug: coupon.merchant?.slug || '',
            logo: coupon.merchant?.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "/api/placeholder/120/120",
          },
          type: 'coupon'
        }));
    } catch (couponError) {
      console.error('Coupon search error:', couponError);
      coupons = [];
    }

    return NextResponse.json({
      merchants,
      coupons,
      query: searchQuery,
      totalResults: merchants.length + coupons.length
    });

  } catch (error: any) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { 
        error: "Search failed", 
        details: error.message,
        merchants: [],
        coupons: []
      },
      { status: 500 }
    );
  }
}
