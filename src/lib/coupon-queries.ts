// src/lib/coupon-queries.ts
import { strapiGet } from "./strapi";

export interface CouponData {
  id: string;
  coupon_title: string;
  coupon_type: "promo_code" | "coupon" | "auto_discount";
  value: string;
  code?: string;
  expires_at?: string;
  user_count: number;
  description: string;
  editor_tips?: string;
  affiliate_link: string;
  merchant: {
    id: number;
    name: string;
    slug: string;
    logo: string;
  };
  market: {
    key: string;
  };
}

export async function getCouponsForMerchant(merchantId: string, marketKey: string = "tw"): Promise<CouponData[]> {
  try {
    const params = {
      "filters[merchant][id][$eq]": merchantId,
      "filters[market][key][$eq]": marketKey,
      "filters[coupon_status][$eq]": "active",
      "populate[merchant][populate]": "logo",
      "populate[market]": "true",
      "sort": "priority:desc,createdAt:desc",
    };

    const response = await strapiGet("/api/coupons", params);
    const coupons = response.data || [];

    return coupons.map((coupon: any) => ({
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
        logo: coupon.merchant.logo?.url || "",
      },
      market: {
        key: coupon.market.key,
      },
    }));
  } catch (error) {
    console.error("Error fetching coupons for merchant:", error);
    return [];
  }
}

export async function getTopCouponForMerchant(merchantId: string, marketKey: string = "tw"): Promise<CouponData | null> {
  const coupons = await getCouponsForMerchant(merchantId, marketKey);
  return coupons.length > 0 ? coupons[0] : null;
}

export async function getAllActiveCoupons(marketKey: string = "tw"): Promise<CouponData[]> {
  try {
    const params = {
      "filters[market][key][$eq]": marketKey,
      "filters[coupon_status][$eq]": "active",
      "filters[expires_at][$gte]": new Date().toISOString(),
      "populate[merchant][populate]": "logo",
      "populate[market]": "true",
      "sort": "priority:desc,createdAt:desc",
      "pagination[pageSize]": "50",
    };

    const response = await strapiGet("/api/coupons", params);
    const coupons = response.data || [];

    return coupons.map((coupon: any) => ({
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
        logo: coupon.merchant.logo?.url || "",
      },
      market: {
        key: coupon.market.key,
      },
    }));
  } catch (error) {
    console.error("Error fetching all active coupons:", error);
    return [];
  }
}
