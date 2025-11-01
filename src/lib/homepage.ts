// src/lib/homepage.ts - Typed homepage data helpers

import { strapiFetch, qs } from './strapi.server';
import { HOME_REVALIDATE, HOME_TAG } from './constants';

// TypeScript interfaces for homepage data
export interface HomePage {
  id: number;
  title: string;
  seo_title?: string;
  seo_description?: string;
  hero?: {
    title?: string;
    subtitle?: string;
    description?: string;
    search_placeholder?: string;
    background?: {
      url: string;
    };
  };
  category?: {
    merchants?: Array<{
      id: number;
      merchant_name: string;
      slug: string;
      logo?: {
        url: string;
      };
    }>;
    categories?: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  };
  coupon?: {
    merchants?: Array<{
      id: number;
      merchant_name: string;
      slug: string;
      logo?: {
        url: string;
      };
    }>;
  };
  topicpage?: {
    special_offers?: Array<{
      id: number;
      title: string;
      slug: string;
      intro?: string;
      seo_title?: string;
      seo_description?: string;
      logo?: {
        url: string;
      };
    }>;
    heading?: string;
    disclaimer?: string;
  };
  popularstore?: {
    heading?: string;
  };
  market?: {
    key: string;
  };
}

export interface HomePageResponse {
  data: HomePage[];
  meta?: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Get homepage by market key - Using original working populate structure with Foundation Spec
export async function getHomePageByMarket(market = 'tw', revalidate = HOME_REVALIDATE): Promise<HomePageResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'seo_title',
    'fields[3]': 'seo_description',
    'populate[hero][populate][background][fields][0]': 'url',
    'populate[category][populate][merchants][populate][logo][fields][0]': 'url',
    'populate[coupon][populate][merchants][populate][logo][fields][0]': 'url',
    'populate[category][populate][categories]': 'true',
    'populate[topicpage][populate][special_offers][populate][logo][fields][0]': 'url', // Populate logo for special offers
    'populate[market]': 'true',
    'pagination[pageSize]': '1',
  };

  return strapiFetch<HomePageResponse>(`/api/home-pages?${qs(params)}`, { 
    revalidate, 
    tag: `${HOME_TAG}:${market}` 
  });
}

// Get homepage with minimal data (for performance)
export async function getHomePageMinimal(market = 'tw', revalidate = HOME_REVALIDATE): Promise<HomePageResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'seo_title',
    'fields[3]': 'seo_description',
    'populate[hero][fields][0]': 'title',
    'populate[hero][fields][1]': 'subtitle',
    'populate[hero][fields][2]': 'description',
    'populate[hero][fields][3]': 'search_placeholder',
    'populate[hero][populate][background][fields][0]': 'url',
    'populate[market][fields][0]': 'key',
    'pagination[pageSize]': '1',
  };

  return strapiFetch<HomePageResponse>(`/api/home-pages?${qs(params)}`, { 
    revalidate, 
    tag: `${HOME_TAG}:${market}:minimal` 
  });
}
