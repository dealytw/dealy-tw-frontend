// src/lib/coupon-queries.ts
import { strapiFetch, qs } from "./strapi.server";

export interface CouponData {
  id: string;
  coupon_title: string;
  coupon_type: "promo_code" | "coupon" | "auto_discount";
  value: string;
  code?: string;
  expires_at?: string;
  user_count: number;
  display_count: number;
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
      "fields[0]": "id",
      "fields[1]": "coupon_title",
      "fields[2]": "coupon_type",
      "fields[3]": "value",
      "fields[4]": "code",
      "fields[5]": "expires_at",
      "fields[6]": "user_count",
      "fields[7]": "display_count",
      "fields[8]": "description",
      "fields[9]": "editor_tips",
      "fields[10]": "affiliate_link",
      "sort": "priority:desc",
      "populate[merchant][fields][0]": "id",
      "populate[merchant][fields][1]": "merchant_name",
      "populate[merchant][fields][2]": "page_slug",
      "populate[merchant][populate][logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const response = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, {
      revalidate: 300,
      tag: `merchant-coupons:${merchantId}`,
    });
    const coupons = response.data || [];

    return coupons.map((coupon: any) => ({
      id: coupon.id.toString(),
      coupon_title: coupon.coupon_title,
      coupon_type: coupon.coupon_type,
      value: coupon.value,
      code: coupon.code,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count || 0,
      display_count: coupon.display_count || 0,
      description: coupon.description || "",
      editor_tips: coupon.editor_tips,
      affiliate_link: coupon.affiliate_link,
      merchant: {
        id: coupon.merchant.id,
        name: coupon.merchant.merchant_name,
        slug: coupon.merchant.page_slug,
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
  try {
    // Fetch priority 1 coupon specifically (sort by priority ascending, get first result)
    const params = {
      "filters[merchant][id][$eq]": merchantId,
      "filters[market][key][$eq]": marketKey,
      "filters[coupon_status][$eq]": "active",
      "fields[0]": "id",
      "fields[1]": "coupon_title",
      "fields[2]": "coupon_type",
      "fields[3]": "value",
      "fields[4]": "code",
      "fields[5]": "expires_at",
      "fields[6]": "user_count",
      "fields[7]": "display_count",
      "fields[8]": "description",
      "fields[9]": "editor_tips",
      "fields[10]": "affiliate_link",
      "sort": "priority:asc", // Priority 1 (lowest number) comes first
      "pagination[pageSize]": "1", // Only get the first (priority 1) coupon
      "populate[merchant][fields][0]": "id",
      "populate[merchant][fields][1]": "merchant_name",
      "populate[merchant][fields][2]": "page_slug",
      "populate[merchant][populate][logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const response = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, {
      revalidate: 300,
      tag: `merchant-priority1-coupon:${merchantId}:${marketKey}`,
    });
    
    const coupons = response.data || [];
    if (coupons.length === 0) {
      return null;
    }

    const coupon = coupons[0];
    return {
      id: coupon.id.toString(),
      coupon_title: coupon.coupon_title,
      coupon_type: coupon.coupon_type,
      value: coupon.value,
      code: coupon.code,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count || 0,
      display_count: coupon.display_count || 0,
      description: coupon.description || "",
      editor_tips: coupon.editor_tips,
      affiliate_link: coupon.affiliate_link,
      merchant: {
        id: coupon.merchant.id,
        name: coupon.merchant.merchant_name,
        slug: coupon.merchant.page_slug,
        logo: coupon.merchant.logo?.url || "",
      },
      market: {
        key: coupon.market.key,
      },
    };
  } catch (error) {
    console.error(`Error fetching priority 1 coupon for merchant ${merchantId}:`, error);
    return null;
  }
}

export async function getAllActiveCoupons(marketKey: string = "tw"): Promise<CouponData[]> {
  try {
    const params = {
      "filters[market][key][$eq]": marketKey,
      "filters[coupon_status][$eq]": "active",
      "fields[0]": "id",
      "fields[1]": "coupon_title",
      "fields[2]": "coupon_type",
      "fields[3]": "value",
      "fields[4]": "code",
      "fields[5]": "expires_at",
      "fields[6]": "user_count",
      "fields[7]": "display_count",
      "fields[8]": "description",
      "fields[9]": "editor_tips",
      "fields[10]": "affiliate_link",
      "sort": "priority:desc",
      "pagination[pageSize]": "50",
      "populate[merchant][fields][0]": "id",
      "populate[merchant][fields][1]": "merchant_name",
      "populate[merchant][fields][2]": "page_slug",
      "populate[merchant][populate][logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const response = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, {
      revalidate: 300,
      tag: `active-coupons:${marketKey}`,
    });
    const coupons = response.data || [];

    return coupons.map((coupon: any) => ({
      id: coupon.id.toString(),
      coupon_title: coupon.coupon_title,
      coupon_type: coupon.coupon_type,
      value: coupon.value,
      code: coupon.code,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count || 0,
      display_count: coupon.display_count || 0,
      description: coupon.description || "",
      editor_tips: coupon.editor_tips,
      affiliate_link: coupon.affiliate_link,
      merchant: {
        id: coupon.merchant.id,
        name: coupon.merchant.merchant_name,
        slug: coupon.merchant.page_slug,
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
