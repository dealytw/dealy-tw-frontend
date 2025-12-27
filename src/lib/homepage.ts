// src/lib/homepage.ts - Typed homepage data helpers

import { strapiFetch, qs } from './strapi.server';
import { HOME_REVALIDATE, HOME_TAG } from './constants';

// Helper function to get market documentId from market key
async function getMarketDocumentId(marketKey: string): Promise<string | null> {
  try {
    const sitesResponse = await strapiFetch<{ data: any[] }>(`/api/sites?${qs({
      'pagination[pageSize]': '100',
      'fields[0]': 'documentId',
      'fields[1]': 'key',
    })}`, {
      revalidate: 86400, // Cache for 24 hours - market data doesn't change often
      tag: 'sites:all'
    });
    
    const sites = sitesResponse?.data || [];
    const foundMarket = sites.find((site: any) => site.key?.toLowerCase() === marketKey.toLowerCase());
    
    if (foundMarket?.documentId) {
      return foundMarket.documentId;
    }
    
    console.warn(`[getHomePageByMarket] Market with key "${marketKey}" not found`);
    return null;
  } catch (error) {
    console.error('[getHomePageByMarket] Error fetching sites for market documentId:', error);
    return null;
  }
}

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
  // First, get market documentId from market key
  const marketDocumentId = await getMarketDocumentId(market);
  
  if (!marketDocumentId) {
    console.error(`[getHomePageByMarket] Could not find market documentId for "${market}", returning empty response`);
    return { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 0, total: 0 } } };
  }

  const params: Record<string, string> = {
    'filters[market][documentId][$eq]': marketDocumentId, // Use documentId for filtering
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'seo_title',
    'fields[3]': 'seo_description',
    'populate[hero][populate][background][fields][0]': 'url',
    // Filter merchants by market in populated relations (using documentId)
    'populate[category][populate][merchants][filters][market][documentId][$eq]': marketDocumentId,
    'populate[category][populate][merchants][populate][logo][fields][0]': 'url',
    'populate[category][populate][merchants][populate][market][fields][0]': 'documentId',
    'populate[category][populate][merchants][populate][market][fields][1]': 'key',
    // Filter coupon merchants by market (using documentId)
    'populate[coupon][populate][merchants][filters][market][documentId][$eq]': marketDocumentId,
    'populate[coupon][populate][merchants][fields][0]': 'id',
    'populate[coupon][populate][merchants][fields][1]': 'merchant_name',
    'populate[coupon][populate][merchants][fields][2]': 'page_slug',
    'populate[coupon][populate][merchants][populate][logo][fields][0]': 'url',
    'populate[coupon][populate][merchants][populate][market][fields][0]': 'documentId',
    'populate[coupon][populate][merchants][populate][market][fields][1]': 'key',
    // Filter categories by market (using documentId)
    'populate[category][populate][categories][filters][market][documentId][$eq]': marketDocumentId,
    'populate[category][populate][categories][populate][market][fields][0]': 'documentId',
    'populate[category][populate][categories][populate][market][fields][1]': 'key',
    // Filter special offers by market (using documentId)
    'populate[topicpage][populate][special_offers][filters][market][documentId][$eq]': marketDocumentId,
    'populate[topicpage][populate][special_offers][populate][logo][fields][0]': 'url',
    'populate[topicpage][populate][special_offers][populate][market][fields][0]': 'documentId',
    'populate[topicpage][populate][special_offers][populate][market][fields][1]': 'key',
    // Populate market relation for homepage itself
    'populate[market][fields][0]': 'documentId',
    'populate[market][fields][1]': 'key',
    'pagination[pageSize]': '1',
  };

  return strapiFetch<HomePageResponse>(`/api/home-pages?${qs(params)}`, { 
    revalidate, 
    tag: `${HOME_TAG}:${market}` 
  });
}

// Get homepage with minimal data (for performance)
export async function getHomePageMinimal(market = 'tw', revalidate = HOME_REVALIDATE): Promise<HomePageResponse> {
  // First, get market documentId from market key
  const marketDocumentId = await getMarketDocumentId(market);
  
  if (!marketDocumentId) {
    console.error(`[getHomePageMinimal] Could not find market documentId for "${market}", returning empty response`);
    return { data: [], meta: { pagination: { page: 1, pageSize: 1, pageCount: 0, total: 0 } } };
  }

  const params: Record<string, string> = {
    'filters[market][documentId][$eq]': marketDocumentId, // Use documentId for filtering
    'fields[0]': 'id',
    'fields[1]': 'title',
    'fields[2]': 'seo_title',
    'fields[3]': 'seo_description',
    'populate[hero][fields][0]': 'title',
    'populate[hero][fields][1]': 'subtitle',
    'populate[hero][fields][2]': 'description',
    'populate[hero][fields][3]': 'search_placeholder',
    'populate[hero][populate][background][fields][0]': 'url',
    'populate[market][fields][0]': 'documentId',
    'populate[market][fields][1]': 'key',
    'pagination[pageSize]': '1',
  };

  return strapiFetch<HomePageResponse>(`/api/home-pages?${qs(params)}`, { 
    revalidate, 
    tag: `${HOME_TAG}:${market}:minimal` 
  });
}
