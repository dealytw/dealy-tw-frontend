// src/lib/coupons.ts - Optimized coupon data fetching with minimal populate

import { strapiFetch, qs } from './strapi.server';

// TypeScript interfaces for Strapi v5 data
interface MerchantData {
  id: number;
  merchant_name: string;
  slug: string;
  summary?: string;
  website?: string;
  affiliate_link?: string;
  store_description?: string;
  faqs?: unknown;
  how_to?: unknown;
  page_layout?: string;
  is_featured?: boolean;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  priority?: number;
  robots?: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  logo?: {
    url: string;
  };
  market?: {
    key: string;
  };
  useful_links?: Array<{
    link_title: string;
    url: string;
  }>;
}

interface CouponData {
  id: number;
  coupon_title: string;
  coupon_type: string;
  value?: string;
  code?: string;
  expires_at?: string;
  user_count?: number;
  affiliate_link?: string;
  description?: string;
  editor_tips?: string;
  priority?: number;
  is_active?: boolean;
  coupon_status?: string;
  merchant: {
    id: number;
    merchant_name: string;
    slug: string;
    logo?: {
      url: string;
    };
  };
  market: {
    key: string;
  };
}

// Field definitions based on actual Strapi v5 structure
type MerchantScalar = 'merchant_name' | 'slug' | 'summary' | 'website' | 'affiliate_link' | 'store_description' | 'faqs' | 'how_to' | 'page_layout' | 'is_featured' | 'seo_title' | 'seo_description' | 'canonical_url' | 'priority' | 'robots';
type CouponScalar = 'coupon_title' | 'coupon_type' | 'value' | 'code' | 'expires_at' | 'user_count' | 'affiliate_link' | 'description' | 'editor_tips' | 'priority' | 'is_active' | 'coupon_status';

const MERCHANT_FIELDS: MerchantScalar[] = [
  'merchant_name', 
  'slug', 
  'summary', 
  'website', 
  'affiliate_link', 
  'store_description', 
  'faqs', 
  'how_to',
  'page_layout',
  'is_featured',
  'seo_title',
  'seo_description',
  'canonical_url',
  'priority',
  'robots'
];

const COUPON_FIELDS: CouponScalar[] = [
  'coupon_title', 
  'coupon_type', 
  'value', 
  'code', 
  'expires_at', 
  'user_count', 
  'affiliate_link', 
  'description', 
  'editor_tips', 
  'priority',
  'is_active',
  'coupon_status'
];

// Fetch merchant with minimal populate
export async function fetchMerchant(slug: string, market = 'tw', revalidateSec = 300) {
  const params = {
    'filters[slug][$eq]': slug,
    'filters[market][key][$eq]': market,
    'populate[logo][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
    'populate[useful_links][fields][0]': 'link_title',
    'populate[useful_links][fields][1]': 'url',
  };

  // Add fields dynamically
  MERCHANT_FIELDS.forEach((field, i) => {
    params[`fields[${i}]`] = field;
  });

  return strapiFetch<{ data: MerchantData[] }>(`/api/merchants?${qs(params)}`, { 
    revalidate: revalidateSec, 
    tags: [`merchant:${slug}`, 'merchants'] 
  });
}

// Fetch merchant coupons with minimal populate
export async function fetchMerchantCoupons(slug: string, market = 'tw', revalidateSec = 300) {
  const params = {
    'filters[merchant][slug][$eq]': slug,
    'filters[market][key][$eq]': market,
    'filters[is_active][$eq]': 'true', // Strapi v5 active filter
    'sort[0]': 'priority:desc',
    'sort[1]': 'createdAt:desc',
    'pagination[pageSize]': '50',
  };

  // Add coupon fields dynamically
  COUPON_FIELDS.forEach((field, i) => {
    params[`fields[${i}]`] = field;
  });

  // Minimal populate for merchant relation
  params['populate[merchant][fields][0]'] = 'merchant_name';
  params['populate[merchant][fields][1]'] = 'slug';
  params['populate[merchant][populate][logo][fields][0]'] = 'url';
  params['populate[market][fields][0]'] = 'key';

  return strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, { 
    revalidate: revalidateSec, 
    tags: [`merchant:${slug}`, 'coupons'] 
  });
}

// Fetch expired coupons for merchant
export async function fetchMerchantExpiredCoupons(slug: string, market = 'tw', revalidateSec = 300) {
  const params = {
    'filters[merchant][slug][$eq]': slug,
    'filters[market][key][$eq]': market,
    'filters[is_active][$eq]': 'false', // Expired coupons
    'sort[0]': 'priority:desc',
    'sort[1]': 'createdAt:desc',
    'pagination[pageSize]': '20',
  };

  // Add coupon fields dynamically
  COUPON_FIELDS.forEach((field, i) => {
    params[`fields[${i}]`] = field;
  });

  // Minimal populate for merchant relation
  params['populate[merchant][fields][0]'] = 'merchant_name';
  params['populate[merchant][fields][1]'] = 'slug';
  params['populate[merchant][populate][logo][fields][0]'] = 'url';
  params['populate[market][fields][0]'] = 'key';

  return strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, { 
    revalidate: revalidateSec, 
    tags: [`merchant:${slug}`, 'coupons', 'expired'] 
  });
}

// Always-fresh single coupon for popup (no cache)
export async function fetchCouponFreshById(id: string) {
  const params = {
    'filters[id][$eq]': id,
    'populate[merchant][fields][0]': 'merchant_name',
    'populate[merchant][fields][1]': 'slug',
    'populate[merchant][populate][logo][fields][0]': 'url',
  };

  // Add coupon fields dynamically
  COUPON_FIELDS.forEach((field, i) => {
    params[`fields[${i}]`] = field;
  });

  return strapiFetch<{ data: any[] }>(`/api/coupons?${qs(params)}`, { 
    revalidate: 60, // Cache for 60 seconds, then revalidate for popups
    tag: `coupon:popup:${merchantSlug}`
  });
}

// Fetch related merchants
export async function fetchRelatedMerchants(slug: string, market = 'tw', revalidateSec = 300) {
  const params = {
    'filters[slug][$ne]': slug, // Exclude current merchant
    'filters[market][key][$eq]': market,
    'filters[is_featured][$eq]': 'true', // Only featured merchants
    'populate[logo][fields][0]': 'url',
    'populate[firstCoupon][fields][0]': 'coupon_title',
    'populate[firstCoupon][fields][1]': 'value',
    'populate[firstCoupon][fields][2]': 'affiliate_link',
    'populate[firstCoupon][fields][3]': 'coupon_type',
    'sort[0]': 'priority:desc',
    'pagination[pageSize]': '6',
  };

  const merchantFields = ['merchant_name', 'slug', 'summary'];
  merchantFields.forEach((field, i) => {
    params[`fields[${i}]`] = field;
  });

  return strapiFetch<{ data: any[] }>(`/api/merchants?${qs(params)}`, { 
    revalidate: revalidateSec, 
    tags: [`merchant:${slug}`, 'related-merchants'] 
  });
}

// Search merchants and coupons
export async function searchMerchantsAndCoupons(query: string, market = 'tw', revalidateSec = 60) {
  const merchantParams = {
    'filters[market][key][$eq]': market,
    'populate[logo][fields][0]': 'url',
    'sort[0]': 'merchant_name:asc',
    'pagination[pageSize]': '20',
  };

  const merchantFields = ['merchant_name', 'slug', 'summary'];
  merchantFields.forEach((field, i) => {
    merchantParams[`fields[${i}]`] = field;
  });

  const couponParams = {
    'filters[market][key][$eq]': market,
    'filters[is_active][$eq]': 'true',
    'populate[merchant][fields][0]': 'merchant_name',
    'populate[merchant][fields][1]': 'slug',
    'populate[merchant][populate][logo][fields][0]': 'url',
    'sort[0]': 'createdAt:desc',
    'pagination[pageSize]': '20',
  };

  const couponFields = ['coupon_title', 'value', 'code', 'coupon_type', 'expires_at', 'user_count', 'affiliate_link', 'description'];
  couponFields.forEach((field, i) => {
    couponParams[`fields[${i}]`] = field;
  });

  // Note: Client-side filtering will be applied since Strapi search is complex
  const [merchantsData, couponsData] = await Promise.all([
    strapiFetch<{ data: any[] }>(`/api/merchants?${qs(merchantParams)}`, { 
      revalidate: revalidateSec, 
      tags: ['search', 'merchants'] 
    }),
    strapiFetch<{ data: any[] }>(`/api/coupons?${qs(couponParams)}`, { 
      revalidate: revalidateSec, 
      tags: ['search', 'coupons'] 
    })
  ]);

  // Client-side filtering (as per your original approach)
  const searchQuery = query.toLowerCase();
  
  const filteredMerchants = merchantsData.data.filter((merchant: any) => {
    const name = merchant.merchant_name?.toLowerCase() || '';
    const slug = merchant.slug?.toLowerCase() || '';
    const summary = merchant.summary?.toLowerCase() || '';
    return name.includes(searchQuery) || slug.includes(searchQuery) || summary.includes(searchQuery);
  });

  const filteredCoupons = couponsData.data.filter((coupon: any) => {
    const title = coupon.coupon_title?.toLowerCase() || '';
    const description = coupon.description?.toLowerCase() || '';
    const merchantName = coupon.merchant?.merchant_name?.toLowerCase() || '';
    return title.includes(searchQuery) || description.includes(searchQuery) || merchantName.includes(searchQuery);
  });

  return {
    merchants: filteredMerchants.slice(0, 20),
    coupons: filteredCoupons.slice(0, 20),
    query,
    totalResults: filteredMerchants.length + filteredCoupons.length
  };
}
