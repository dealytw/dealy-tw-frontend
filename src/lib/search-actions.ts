'use server';

import { strapiFetch, absolutizeMedia, qs } from "@/lib/strapi.server";

export interface SearchResult {
  merchants: Array<{
    id: string | number;
    name: string;
    slug: string;
    logo: string;
    website: string;
    type: 'merchant';
  }>;
  coupons: Array<{
    id: string | number;
    title: string;
    merchant: {
      id: string | number;
      name: string;
      slug: string;
      logo: string;
    };
    type: 'coupon';
  }>;
  error?: string;
}

export async function searchAction(query: string, market: string = 'tw'): Promise<SearchResult> {
  try {
    if (!query || query.trim().length === 0) {
      return { merchants: [], coupons: [] };
    }

    const searchQuery = query.trim();

    // Search merchants
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "merchant_name",
      "fields[2]": "slug", 
      "fields[3]": "summary",
      "fields[4]": "website",
      "fields[5]": "affiliate_link",
      "sort": "merchant_name:asc",
      "pagination[page]": "1",
      "pagination[pageSize]": "50",
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const merchantsData = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(merchantParams)}`, {
      revalidate: 60,
      tag: 'search:merchants'
    }).catch(() => ({ data: [] }));
    
    const allMerchants = merchantsData?.data || [];
    
    const merchants = allMerchants
      .filter((merchant: any) => {
        const name = merchant.merchant_name?.toLowerCase() || '';
        const slug = merchant.slug?.toLowerCase() || '';
        const summary = merchant.summary?.toLowerCase() || '';
        const website = merchant.website?.toLowerCase() || '';
        const affiliateLink = merchant.affiliate_link?.toLowerCase() || '';
        const q = searchQuery.toLowerCase();
        
        // Match in name, slug, summary, website URL, or affiliate link
        return name.includes(q) || 
               slug.includes(q) || 
               summary.includes(q) ||
               website.includes(q) ||
               affiliateLink.includes(q);
      })
      .slice(0, 20)
      .map((merchant: any) => ({
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.slug,
        logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
        website: merchant.website || merchant.affiliate_link || "",
        type: 'merchant' as const
      }));

    // Search coupons
    let coupons: any[] = [];
    try {
      const couponParams = {
        "filters[market][key][$eq]": market,
        "filters[coupon_status][$eq]": "active",
        "fields[0]": "id",
        "fields[1]": "coupon_title",
        "fields[2]": "description",
        "fields[9]": "editor_tips",
        "pagination[page]": "1",
        "pagination[pageSize]": "50",
        "populate[merchant][fields][0]": "id",
        "populate[merchant][fields][1]": "merchant_name",
        "populate[merchant][fields][2]": "slug",
        "populate[merchant][populate][logo][fields][0]": "url",
      };

      const couponData = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(couponParams)}`, {
        revalidate: 60,
        tag: 'search:coupons'
      }).catch(() => ({ data: [] }));
      
      const allCoupons = couponData?.data || [];
      
      coupons = allCoupons
        .filter((coupon: any) => {
          const title = coupon.coupon_title?.toLowerCase() || '';
          const description = coupon.description?.toLowerCase() || '';
          const tips = coupon.editor_tips?.toLowerCase() || '';
          const merchantName = coupon.merchant?.merchant_name?.toLowerCase() || '';
          const q = searchQuery.toLowerCase();
          
          return title.includes(q) || description.includes(q) || 
                 tips.includes(q) || merchantName.includes(q);
        })
        .slice(0, 20)
        .map((coupon: any) => ({
          id: coupon.id,
          title: coupon.coupon_title || 'Untitled Coupon',
          merchant: {
            id: coupon.merchant?.id,
            name: coupon.merchant?.merchant_name || 'Unknown Merchant',
            slug: coupon.merchant?.slug || '',
            logo: coupon.merchant?.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "/api/placeholder/120/120",
          },
          type: 'coupon' as const
        }));
    } catch (couponError) {
      console.error('Coupon search error:', couponError);
      coupons = [];
    }

    return {
      merchants,
      coupons,
    };
  } catch (error: any) {
    console.error('Search action error:', error);
    return {
      merchants: [],
      coupons: [],
      error: error.message || '搜尋失敗，請稍後再試'
    };
  }
}

