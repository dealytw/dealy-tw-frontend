// src/lib/floating-buttons.ts - Floating button data helpers

import { strapiFetch, qs } from './strapi.server';
import { FLOATING_BUTTON_REVALIDATE } from './constants';

// TypeScript interfaces for floating button data
export interface FloatingButton {
  id: number;
  button_label?: string;
  priority: number;
  icon?: {
    url: string;
  };
  merchant?: {
    id: number;
    slug: string;
  };
  special_offer?: {
    id: number;
    slug: string;
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

// Get active floating buttons by market, sorted by priority (ascending = lowest at bottom)
export async function getFloatingButtons(market = 'tw', revalidate = FLOATING_BUTTON_REVALIDATE): Promise<FloatingButtonResponse> {
  const params = {
    'filters[market][key][$eq]': market,
    'fields[0]': 'id',
    'fields[1]': 'button_label',
    'fields[2]': 'priority',
    'sort': 'priority:asc', // Lowest priority at bottom
    'populate[icon][fields][0]': 'url',
    'populate[merchant][fields][0]': 'id',
    'populate[merchant][fields][1]': 'slug',
    'populate[special_offer][fields][0]': 'id',
    'populate[special_offer][fields][1]': 'slug',
    'populate[market][fields][0]': 'key',
  };

  return strapiFetch<FloatingButtonResponse>(`/api/floating-buttons?${qs(params)}`, { 
    revalidate, 
    tag: `floating-buttons:${market}` 
  });
}

