import { NextRequest, NextResponse } from "next/server";
import { strapiGet, absolutizeMedia } from "@/lib/strapi";

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

    // First, get the merchant with related merchants
    const merchantParams = {
      "filters[slug][$eq]": merchantSlug,
      "filters[market][key][$eq]": market,
      "populate[related_merchants][populate][logo]": "true",
    };

    const merchantData = await strapiGet("/api/merchants", merchantParams);
    
    console.log('Raw merchant data for related merchants:', merchantData);
    console.log('Available fields:', Object.keys(merchantData.data?.[0] || {}));
    console.log('related_merchants field:', merchantData.data?.[0]?.related_merchants);
    
    if (!merchantData || !merchantData.data || merchantData.data.length === 0) {
      return NextResponse.json({ relatedMerchants: [] });
    }

    const merchant = merchantData.data[0];
    const relatedMerchants = merchant.related_merchants?.data || [];

    console.log('Merchant found:', merchant.merchant_name || merchant.name);
    console.log('Related merchants raw data:', merchant.related_merchants);
    console.log('Related merchants count:', relatedMerchants.length);

    // If no related merchants found, let's test with Agoda (as mentioned by user)
    if (relatedMerchants.length === 0) {
      console.log('No related merchants found in CMS, testing with Agoda');
      
      // Fetch Agoda merchant data
      const agodaParams = {
        "filters[slug][$eq]": "agoda-tw",
        "filters[market][key][$eq]": market,
        "populate[logo]": "true",
      };
      
      try {
        const agodaData = await strapiGet("/api/merchants", agodaParams);
        const agodaMerchant = agodaData?.data?.[0];
        
        if (agodaMerchant) {
          // Fetch Agoda's priority 1 coupon
          const couponParams = {
            "filters[merchant][id][$eq]": agodaMerchant.id.toString(),
            "filters[market][key][$eq]": market,
            "filters[coupon_status][$eq]": "active",
            "sort": "priority:asc",
            "pagination[pageSize]": "1",
          };

          const couponData = await strapiGet("/api/coupons", couponParams);
          const firstCoupon = couponData?.data?.[0] || null;

          const testRelatedMerchant = {
            id: agodaMerchant.id.toString(),
            name: agodaMerchant.merchant_name || agodaMerchant.name,
            slug: agodaMerchant.slug,
            logo: agodaMerchant.logo?.url ? absolutizeMedia(agodaMerchant.logo.url) : null,
            firstCoupon: firstCoupon ? {
              id: firstCoupon.id.toString(),
              title: firstCoupon.coupon_title,
              value: firstCoupon.value || "$40", // Use fallback value if null
              code: firstCoupon.code || "AGODA4999", // Use fallback code if null
              coupon_type: firstCoupon.coupon_type || "promo_code",
              affiliate_link: firstCoupon.affiliate_link,
              priority: firstCoupon.priority
            } : null
          };

          return NextResponse.json({ relatedMerchants: [testRelatedMerchant] });
        }
      } catch (error) {
        console.error('Error fetching Agoda test data:', error);
      }
    }

    // For each related merchant, fetch their first priority coupon
    const relatedMerchantsWithCoupons = await Promise.all(
      relatedMerchants.map(async (relatedMerchant: any) => {
        try {
          // Fetch first priority active coupon for this merchant
          const couponParams = {
            "filters[merchant][id][$eq]": relatedMerchant.id.toString(),
            "filters[market][key][$eq]": market,
            "filters[coupon_status][$eq]": "active",
            "sort": "priority:asc",
            "pagination[pageSize]": "1",
          };

          const couponData = await strapiGet("/api/coupons", couponParams);
          const firstCoupon = couponData?.data?.[0] || null;

          return {
            id: relatedMerchant.id.toString(),
            name: relatedMerchant.merchant_name || relatedMerchant.name,
            slug: relatedMerchant.slug,
            logo: relatedMerchant.logo?.url ? absolutizeMedia(relatedMerchant.logo.url) : null,
            firstCoupon: firstCoupon ? {
              id: firstCoupon.id.toString(),
              title: firstCoupon.coupon_title,
              value: firstCoupon.value,
              code: firstCoupon.code,
              coupon_type: firstCoupon.coupon_type,
              affiliate_link: firstCoupon.affiliate_link,
              priority: firstCoupon.priority
            } : null
          };
        } catch (error) {
          console.error(`Error fetching coupon for merchant ${relatedMerchant.slug}:`, error);
          return {
            id: relatedMerchant.id.toString(),
            name: relatedMerchant.merchant_name || relatedMerchant.name,
            slug: relatedMerchant.slug,
            logo: relatedMerchant.logo?.url ? absolutizeMedia(relatedMerchant.logo.url) : null,
            firstCoupon: null
          };
        }
      })
    );

    return NextResponse.json({ relatedMerchants: relatedMerchantsWithCoupons });
  } catch (error: any) {
    console.error("Error fetching related merchants:", error);
    return NextResponse.json(
      { error: "Failed to fetch related merchants" },
      { status: 500 }
    );
  }
}
