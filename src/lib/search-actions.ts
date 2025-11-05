'use server';

import { strapiFetch, absolutizeMedia, qs } from "@/lib/strapi.server";

export interface MerchantSearchData {
  id: string | number;
  name: string;
  slug: string;
  logo: string;
  website: string;
}

/**
 * Fetch all merchants for instant search (minimal fields only)
 * This is called once on page load to populate the search cache
 * Uses the same approach as /shop page for consistency
 */
export async function getAllMerchantsForSearch(market: string = 'tw'): Promise<MerchantSearchData[]> {
  try {
    // Use the same merchant params as /shop page for consistency
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "merchant_name",
      "fields[2]": "slug",
      "fields[3]": "summary",
      "fields[4]": "website",
      "fields[5]": "affiliate_link",
      "sort[0]": "merchant_name:asc",
      "pagination[page]": "1",
      "pagination[pageSize]": "500", // Get more merchants like shop page
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const merchantsData = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(merchantParams)}`, {
      revalidate: 3600, // Cache for 1 hour
      tag: `search:all-merchants:${market}`
    });
    
    const merchants = (merchantsData?.data || []).map((merchant: any) => ({
      id: merchant.id,
      name: merchant.merchant_name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
      website: merchant.website || merchant.affiliate_link || "",
    }));

    console.log(`[getAllMerchantsForSearch] Loaded ${merchants.length} merchants for market ${market}`);
    return merchants;
  } catch (error: any) {
    console.error('[getAllMerchantsForSearch] Error:', error);
    return [];
  }
}
