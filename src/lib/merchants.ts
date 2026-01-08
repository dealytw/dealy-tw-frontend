// src/lib/merchants.ts - Typed merchant data helpers

import { strapiFetch, qs } from './strapi.server';
import { getMerchantTag } from './constants';

// TypeScript interfaces for merchant data
export interface Merchant {
  id: number;
  merchant_name: string;
  page_slug: string;
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

export interface MerchantResponse {
  data: Merchant[];
  meta?: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Get merchant by slug with minimal populate
export async function getMerchantBySlug(slug: string, market = 'tw', revalidate = 300): Promise<MerchantResponse> {
  const params = {
    'filters[page_slug][$eq]': slug,
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'merchant_name',
    'fields[2]': 'page_slug',
    'fields[3]': 'summary',
    'fields[4]': 'website',
    'fields[5]': 'affiliate_link',
    'fields[6]': 'store_description',
    'fields[7]': 'faqs',
    'fields[8]': 'how_to',
    'fields[9]': 'page_layout',
    'fields[10]': 'is_featured',
    'fields[11]': 'seo_title',
    'fields[12]': 'seo_description',
    'fields[13]': 'canonical_url',
    'fields[14]': 'priority',
    'fields[15]': 'robots',
    'populate[logo][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
    'populate[useful_links][fields][0]': 'link_title',
    'populate[useful_links][fields][1]': 'url',
  };

  return strapiFetch<MerchantResponse>(`/api/merchants?${qs(params)}`, { 
    revalidate, 
    tag: getMerchantTag(slug) 
  });
}

// Get merchants list with pagination
export async function getMerchantsList(market = 'tw', page = 1, pageSize = 20, revalidate = 300): Promise<MerchantResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'merchant_name',
    'fields[2]': 'page_slug',
    'fields[3]': 'summary',
    'fields[4]': 'website',
    'fields[5]': 'affiliate_link',
    'sort': 'merchant_name:asc',
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'populate[logo][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  return strapiFetch<MerchantResponse>(`/api/merchants?${qs(params)}`, { 
    revalidate, 
    tag: `merchants:${market}` 
  });
}

// Get featured merchants
export async function getFeaturedMerchants(market = 'tw', limit = 6, revalidate = 300): Promise<MerchantResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'filters[is_featured][$eq]': 'true',
    'fields[0]': 'id',
    'fields[1]': 'merchant_name',
    'fields[2]': 'page_slug',
    'fields[3]': 'summary',
    'fields[4]': 'priority',
    'sort': 'priority:desc',
    'pagination[pageSize]': limit.toString(),
    'populate[logo][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  return strapiFetch<MerchantResponse>(`/api/merchants?${qs(params)}`, { 
    revalidate, 
    tag: `featured-merchants:${market}` 
  });
}

// Get related merchants (excluding current merchant)
export async function getRelatedMerchants(currentSlug: string, market = 'tw', limit = 6, revalidate = 300): Promise<MerchantResponse> {
  const params = {
    'filters[page_slug][$ne]': currentSlug, // Exclude current merchant
    'filters[market][key][$eq]': market,
    'filters[is_featured][$eq]': 'true',
    'fields[0]': 'id',
    'fields[1]': 'merchant_name',
    'fields[2]': 'page_slug',
    'fields[3]': 'summary',
    'fields[4]': 'priority',
    'sort': 'priority:desc',
    'pagination[pageSize]': limit.toString(),
    'populate[logo][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  return strapiFetch<MerchantResponse>(`/api/merchants?${qs(params)}`, { 
    revalidate, 
    tag: `related-merchants:${currentSlug}` 
  });
}

// Search merchants by name/slug/summary
export async function searchMerchants(query: string, market = 'tw', limit = 20, revalidate = 60): Promise<MerchantResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'merchant_name',
    'fields[2]': 'page_slug',
    'fields[3]': 'summary',
    'fields[4]': 'website',
    'fields[5]': 'affiliate_link',
    'sort': 'merchant_name:asc',
    'pagination[pageSize]': limit.toString(),
    'populate[logo][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  // Note: Client-side filtering will be applied since Strapi search is complex
  const response = await strapiFetch<MerchantResponse>(`/api/merchants?${qs(params)}`, { 
    revalidate, 
    tag: `search-merchants:${market}` 
  });

  // Client-side filtering
  const searchQuery = query.toLowerCase();
  const filteredMerchants = response.data.filter((merchant) => {
    const name = merchant.merchant_name?.toLowerCase() || '';
    const page_slug = merchant.page_slug?.toLowerCase() || '';
    const summary = merchant.summary?.toLowerCase() || '';
    return name.includes(searchQuery) || page_slug.includes(searchQuery) || summary.includes(searchQuery);
  });

  return {
    ...response,
    data: filteredMerchants.slice(0, limit)
  };
}
