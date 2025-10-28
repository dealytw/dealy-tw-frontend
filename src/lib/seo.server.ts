// src/lib/seo.server.ts
import 'server-only';
import { strapiFetch, qs } from '@/lib/strapi.server';

// MERCHANT SEO (seo_title, seo_description, seo_canonical, seo_noindex)
export async function getMerchantSEO(slug: string, revalidate = 300) {
  const params = {
    'filters[slug][$eq]': slug,
    'fields[0]': 'id',
    'fields[1]': 'merchant_name',
    'fields[2]': 'slug',
    'fields[3]': 'seo_title',
    'fields[4]': 'seo_description',
    'fields[5]': 'canonical_url',
    'fields[6]': 'robots',
  };

  return strapiFetch<{ data: any[] }>(`/api/merchants?${qs(params)}`, {
    revalidate,
    tag: `merchant:${slug}`
  });
}

// Get coupons for merchant (for SEO generation)
export async function getMerchantCouponsForSEO(merchantId: string, market = 'tw', revalidate = 300) {
  const params = {
    'filters[merchant][documentId][$eq]': merchantId,
    'filters[market][key][$eq]': market,
    'filters[coupon_status][$eq]': 'active',
    'fields[0]': 'coupon_title',
    'fields[1]': 'value',
    'fields[2]': 'expires_at',
    'sort': 'priority:asc',
    'pagination[pageSize]': '10', // Only need first 10 for SEO
  };

  return strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, {
    revalidate,
    tag: `coupons:${merchantId}`
  });
}

// TOPIC SEO (if you have topics)
export async function getTopicSEO(slug: string, revalidate = 300) {
  const params = {
    'filters[slug][$eq]': slug,
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'slug',
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
