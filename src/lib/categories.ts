// src/lib/categories.ts - Typed category data helpers

import { strapiFetch, qs } from './strapi.server';
import { getCategoryTag, MERCHANT_REVALIDATE } from './constants';

// TypeScript interfaces for category data
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: {
    url: string;
  };
  merchants?: Array<{
    id: number;
    merchant_name: string;
    slug: string;
    logo?: {
      url: string;
    };
  }>;
  market?: {
    key: string;
  };
}

export interface CategoryResponse {
  data: Category[];
  meta?: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Get category by slug
export async function getCategoryBySlug(slug: string, market = 'tw', revalidate = MERCHANT_REVALIDATE): Promise<CategoryResponse> {
  const params = {
    'filters[slug][$eq]': slug,
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'name',
    'fields[2]': 'slug',
    'fields[3]': 'description',
    'populate[icon][fields][0]': 'url',
    'populate[merchants][fields][0]': 'id',
    'populate[merchants][fields][1]': 'merchant_name',
    'populate[merchants][fields][2]': 'slug',
    'populate[merchants][populate][logo][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  return strapiFetch<CategoryResponse>(`/api/categories?${qs(params)}`, { 
    revalidate, 
    tag: getCategoryTag(slug) 
  });
}

// Get categories list
export async function getCategoriesList(market = 'tw', page = 1, pageSize = 20, revalidate = MERCHANT_REVALIDATE): Promise<CategoryResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'name',
    'fields[2]': 'slug',
    'fields[3]': 'description',
    'sort': 'name:asc',
    'pagination[page]': page.toString(),
    'pagination[pageSize]': pageSize.toString(),
    'populate[icon][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  return strapiFetch<CategoryResponse>(`/api/categories?${qs(params)}`, { 
    revalidate, 
    tag: `categories:${market}` 
  });
}

// Get featured categories
export async function getFeaturedCategories(market = 'tw', limit = 10, revalidate = MERCHANT_REVALIDATE): Promise<CategoryResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'name',
    'fields[2]': 'slug',
    'fields[3]': 'description',
    'sort': 'name:asc',
    'pagination[pageSize]': limit.toString(),
    'populate[icon][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  return strapiFetch<CategoryResponse>(`/api/categories?${qs(params)}`, { 
    revalidate, 
    tag: `featured-categories:${market}` 
  });
}

// Search categories
export async function searchCategories(query: string, market = 'tw', limit = 20, revalidate = 60): Promise<CategoryResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'name',
    'fields[2]': 'slug',
    'fields[3]': 'description',
    'sort': 'name:asc',
    'pagination[pageSize]': limit.toString(),
    'populate[icon][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
  };

  // Note: Client-side filtering will be applied since Strapi search is complex
  const response = await strapiFetch<CategoryResponse>(`/api/categories?${qs(params)}`, { 
    revalidate, 
    tag: `search-categories:${market}` 
  });

  // Client-side filtering
  const searchQuery = query.toLowerCase();
  const filteredCategories = response.data.filter((category) => {
    const name = category.name?.toLowerCase() || '';
    const slug = category.slug?.toLowerCase() || '';
    const description = category.description?.toLowerCase() || '';
    return name.includes(searchQuery) || slug.includes(searchQuery) || description.includes(searchQuery);
  });

  return {
    ...response,
    data: filteredCategories.slice(0, limit)
  };
}
