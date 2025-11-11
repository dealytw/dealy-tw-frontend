// src/lib/analytics.ts
// Google Tag Manager and GA4 tracking utilities

// 確保 dataLayer 存在
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

// 初始化 dataLayer
if (typeof window !== 'undefined' && !window.dataLayer) {
  window.dataLayer = [];
}

/**
 * 追蹤優惠券點擊（按鈕或標題）
 * 用於追蹤出站連結點擊
 */
export function trackCouponClick(params: {
  couponId: string;
  couponTitle: string;
  couponCode?: string;
  merchantName: string;
  merchantSlug?: string;
  affiliateLink: string;
  couponType: 'promo_code' | 'coupon' | 'discount';
  clickSource: 'button' | 'title'; // 區分按鈕或標題點擊
  pageLocation: string; // 當前頁面路徑
}) {
  if (typeof window === 'undefined') return;

  const eventData = {
    event: 'coupon_outbound_click',
    coupon_id: params.couponId,
    coupon_title: params.couponTitle,
    coupon_code: params.couponCode || '',
    merchant_name: params.merchantName,
    merchant_slug: params.merchantSlug || '',
    affiliate_link: params.affiliateLink,
    coupon_type: params.couponType,
    click_source: params.clickSource, // 'button' 或 'title'
    page_location: params.pageLocation,
    // 時間戳記
    timestamp: new Date().toISOString(),
  };

  // 推送到 dataLayer (GTM 使用)
  if (window.dataLayer) {
    window.dataLayer.push(eventData);
  }

  // 同時發送 GA4 事件 (如果 gtag 可用)
  if (window.gtag) {
    window.gtag('event', 'coupon_outbound_click', {
      coupon_id: params.couponId,
      coupon_title: params.couponTitle,
      coupon_code: params.couponCode || '',
      merchant_name: params.merchantName,
      merchant_slug: params.merchantSlug || '',
      coupon_type: params.couponType,
      click_source: params.clickSource,
      link_url: params.affiliateLink,
      page_location: params.pageLocation,
    });
  }

  // 使用 sendBeacon 確保追蹤在頁面跳轉前完成
  if (navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify(eventData)], {
        type: 'application/json',
      });
      // 可選：發送到後端 API 作為備份
      // navigator.sendBeacon('/api/analytics/track', blob);
    } catch (error) {
      // 靜默失敗，不影響用戶體驗
      console.debug('Analytics tracking failed:', error);
    }
  }
}

