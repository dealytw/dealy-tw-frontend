// src/lib/floating-buttons.ts - Floating button data helpers

import { strapiFetch, qs } from './strapi.server';
import { FLOATING_BUTTON_REVALIDATE } from './constants';

// TypeScript interfaces for floating button data
export interface FloatingButton {
  id: number;
  button_label?: string;
  priority?: number;
  icon?: {
    url: string;
  };
  merchant?: {
    id: number;
    page_slug: string;
  };
  special_offer?: {
    id: number;
    page_slug: string;
  };
  market?: {
    key: string;
  };
}

export interface FloatingButtonResponse {
  data: FloatingButton[];
  meta?: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

// Get active floating buttons by market
export async function getFloatingButtons(market = 'tw', revalidate = FLOATING_BUTTON_REVALIDATE): Promise<FloatingButtonResponse> {
  const params: Record<string, string | number | undefined> = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'button_label',
    'populate[icon][fields][0]': 'url',
    'populate[merchant][fields][0]': 'id',
    'populate[merchant][fields][1]': 'page_slug',
    'populate[special_offer][fields][0]': 'id',
    'populate[special_offer][fields][1]': 'page_slug',
    'populate[market][fields][0]': 'key',
  };

  // Fetch priority field for sorting (sorted ascending = priority 1 at top, lowest at bottom)
  params['fields[2]'] = 'priority';
  params['sort'] = 'priority:asc';

  const response = await strapiFetch<FloatingButtonResponse>(`/api/floating-buttons?${qs(params)}`, { 
    revalidate, 
    tag: `floating-buttons:${market}` 
  });

  // Strapi returns in sorted order (priority:asc), but we reverse to show lowest priority at bottom
  // Priority 1 = bottom, Priority 2+ = above
  if (response.data && response.data.length > 1) {
    response.data.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  return response;
}

