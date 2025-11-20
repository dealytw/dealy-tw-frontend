// src/lib/seo.server.ts
import 'server-only';
import { strapiFetch, qs, getStartsAtFilterParams } from '@/lib/strapi.server';

// MERCHANT SEO (seo_title, seo_description, seo_canonical, seo_noindex)
export async function getMerchantSEO(slug: string, revalidate = 300) {
  const params = {
    'filters[page_slug][$eq]': slug,
    'fields[0]': 'id',
    'fields[1]': 'documentId',
    'fields[2]': 'merchant_name',
    'fields[3]': 'page_slug',
    'fields[4]': 'seo_title',
    'fields[5]': 'seo_description',
    'fields[6]': 'canonical_url',
    'fields[7]': 'robots',
  };

  return strapiFetch<{ data: any[] }>(`/api/merchants?${qs(params)}`, {
    revalidate,
    tag: `merchant:${slug}`
  });
}

// Get coupons for merchant (for SEO generation)
// Fetches ACTIVE coupons sorted by priority for SEO title/description generation
export async function getMerchantCouponsForSEO(merchantId: string, market = 'tw', revalidate = 300) {
  const params = {
    'filters[merchant][documentId][$eq]': merchantId,
    'filters[market][key][$eq]': market,
    'filters[coupon_status][$eq]': 'active',
    ...getStartsAtFilterParams(), // Filter out scheduled coupons (starts_at in the future)
    'fields[0]': 'id',
    'fields[1]': 'documentId',
    'fields[2]': 'coupon_title',
    'fields[3]': 'value',
    'fields[4]': 'expires_at',
    'fields[5]': 'priority',
    'sort': 'priority:asc',
    'pagination[pageSize]': '10', // Only need first 10 for SEO
  };

  const response = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, {
    revalidate,
    tag: `coupons:${merchantId}`
  });

  // Transform Strapi v5 attributes format to flat structure for SEO functions
  if (response?.data) {
    response.data = response.data.map((item: any) => ({
      id: item.id || item.documentId,
      documentId: item.documentId,
      coupon_title: item.attributes?.coupon_title || item.coupon_title,
      value: item.attributes?.value || item.value,
      expires_at: item.attributes?.expires_at || item.expires_at,
      priority: item.attributes?.priority || item.priority || 0,
    }));
  }

  return response;
}

// TOPIC SEO (if you have topics)
export async function getTopicSEO(slug: string, revalidate = 300) {
  const params = {
    'filters[page_slug][$eq]': slug,
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'page_slug',
    'fields[3]': 'seo_title',
    'fields[4]': 'seo_description',
    'fields[5]': 'canonical_url',
    'fields[6]': 'robots',
  };

  return strapiFetch<{ data: any[] }>(`/api/special-offers?${qs(params)}`, {
    revalidate,
    tag: `special-offer:${slug}`
  });
}
