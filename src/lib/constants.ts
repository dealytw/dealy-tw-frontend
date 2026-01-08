// src/lib/constants.ts - Shared constants for caching and revalidation

export const HOME_REVALIDATE = 86400; // 24 hours
export const HOME_TAG = 'home';

export const MERCHANTS_LIST_TAG = 'merchants:list';

export const COUPON_TAG_PREFIX = 'coupon';

export const FLOATING_BUTTON_REVALIDATE = 86400; // 24 hours

// Cache tag helpers
export function getMerchantTag(slug: string): string {
  return `merchant:${slug}`;
}

export function getCategoryTag(slug: string): string {
  return `category:${slug}`;
}

export function getCouponTag(id: string): string {
  return `${COUPON_TAG_PREFIX}:${id}`;
}

export function getMerchantsListTag(market: string): string {
  return `${MERCHANTS_LIST_TAG}:${market}`;
}
