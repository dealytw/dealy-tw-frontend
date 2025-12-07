import { Button } from "@/components/ui/button";
import Link from "next/link";

interface RelatedMerchantCouponCardProps {
  relatedMerchant: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    firstCoupon: {
      id: string;
      title: string;
      value: string;
      code?: string;
      coupon_type: string;
      affiliate_link: string;
      priority: number;
    } | null;
  };
}

const RelatedMerchantCouponCard = ({ relatedMerchant }: RelatedMerchantCouponCardProps) => {
  // Coupon is now guaranteed from server (merchants without coupons are filtered out)
  // Keep safety check for defensive programming
  const coupon = relatedMerchant.firstCoupon;

  if (!coupon) {
    return null;
  }
  
  // Extract discount value from coupon value string
  const extractDiscountValue = (value: string) => {
    if (!value) return "優惠";
    
    // Handle percentage discounts (e.g., "8折", "12%")
    if (value.includes("折") || value.includes("%")) {
      return value;
    }
    
    // Handle fixed amount discounts (e.g., "$40", "$4,999")
    const currencyMatch = value.match(/\$?(\d+(?:,\d+)*)/);
    if (currencyMatch) {
      return `$${currencyMatch[1]}`;
    }
    
    return value;
  };

  const discountValue = extractDiscountValue(coupon.value);
  const couponTitle = `${relatedMerchant.name} - 精選優惠 (${discountValue}折扣)`;

  // Helper function to get button text based on coupon type
  const getButtonText = (couponType?: string) => {
    switch (couponType) {
      case "promo_code":
        return "獲取優惠碼";
      case "coupon":
        return "獲取優惠券";
      case "discount":
        return "獲取折扣";
      default:
        return "獲取優惠碼"; // Default fallback
    }
  };

  const handleButtonClick = () => {
    if (coupon) {
      // Track coupon click for GTM/GA4
      if (typeof window !== 'undefined') {
        const { trackCouponClick } = require('@/lib/analytics');
        trackCouponClick({
          couponId: coupon.id.toString(),
          couponTitle: coupon.title,
          couponCode: coupon.code,
          merchantName: relatedMerchant.name,
          merchantSlug: relatedMerchant.slug,
          affiliateLink: coupon.affiliate_link || '#',
          couponType: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
          clickSource: 'button',
          pageLocation: window.location.pathname,
        });
      }
      
      // Parallel actions (no delays, no setTimeout)
      // Action 1: Open merchant page (new tab) - using <a> tag (faster than window.open)
      const baseUrl = window.location.href.split('#')[0]; // Remove existing hash
      const relatedMerchantUrl = baseUrl.replace(`/shop/${window.location.pathname.split('/').pop()}`, `/shop/${relatedMerchant.slug}`);
      const merchantUrl = relatedMerchantUrl + `#coupon-${coupon.id}`;
      const link = document.createElement('a');
      link.href = merchantUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Action 2: Redirect current tab to affiliate link (instant, no delay)
      if (coupon.affiliate_link && coupon.affiliate_link !== '#') {
        window.location.href = coupon.affiliate_link;
      }
    }
  };

  return (
    <article className="relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 min-h-[220px] flex flex-col">
      {/* Main Content */}
      <div className="p-3 pb-0 flex-1 flex flex-col">
        {/* Merchant Logo - Smaller */}
        <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {relatedMerchant.logo ? (
            <img
              src={relatedMerchant.logo}
              alt={relatedMerchant.name}
              width={150}
              height={150}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              {relatedMerchant.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Coupon Title */}
        <h3 className="text-xs font-medium text-gray-900 mb-1.5 text-center leading-tight">
          {couponTitle}
        </h3>

        {/* View More Button - Below title, pale grey background, with shadow */}
        {relatedMerchant.slug && (
          <Link href={`/shop/${relatedMerchant.slug}`} className="mb-0 flex justify-center">
            <Button 
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow"
              style={{
                fontSize: '0.65rem',
                padding: '0.2rem 0.6rem',
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
              }}
            >
              查看更多
            </Button>
          </Link>
        )}
      </div>

      {/* Pink Footer */}
      <div className="bg-pink-500 px-3 py-2 flex items-center justify-between mt-0">
        <div className="text-white">
          <div className="text-base font-bold">{discountValue} 折扣</div>
        </div>
        
        <Button 
          className="bg-white text-pink-500 hover:bg-gray-50 font-medium px-3 py-1.5 text-sm"
          size="sm"
          onClick={handleButtonClick}
        >
          {getButtonText(coupon.coupon_type)}
        </Button>
      </div>
    </article>
  );
};

export default RelatedMerchantCouponCard;
