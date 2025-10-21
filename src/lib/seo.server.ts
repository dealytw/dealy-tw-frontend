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
