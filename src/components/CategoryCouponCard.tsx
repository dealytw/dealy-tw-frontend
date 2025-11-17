import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

interface CategoryCouponCardProps {
  coupon: {
    id: string;
    title: string;
    code?: string;
    discount: string;
    coupon_type?: string;
    affiliate_link?: string;
    merchant: {
      name: string;
      logo: string;
      slug?: string;
    };
  };
}

const CategoryCouponCard = ({ coupon }: CategoryCouponCardProps) => {
  // Extract discount value from coupon discount string
  const extractDiscountValue = (value: string) => {
    if (!value) return "優惠";
    
    // Handle percentage discounts (e.g., "8折", "12%", "20% OFF")
    if (value.includes("折") || value.includes("%")) {
      return value;
    }
    
    // Handle fixed amount discounts (e.g., "$40", "$4,999", "$300")
    const currencyMatch = value.match(/\$?(\d+(?:,\d+)*)/);
    if (currencyMatch) {
      return `$${currencyMatch[1]}`;
    }
    
    return value;
  };

  const discountValue = extractDiscountValue(coupon.discount);

  // Format title as: "merchant name - 精選優惠 (coupon value)"
  const formattedTitle = `${coupon.merchant.name} - 精選優惠 (${discountValue})`;

  // Helper function to get button text based on coupon type
  const getButtonText = (couponType?: string) => {
    switch (couponType) {
      case "promo_code":
        return "馬上領";
      case "coupon":
        return "馬上領";
      case "discount":
        return "馬上領";
      default:
        return "馬上領";
    }
  };

  const handleButtonClick = () => {
    // Track coupon click for GTM/GA4
    if (typeof window !== 'undefined') {
      const { trackCouponClick } = require('@/lib/analytics');
      trackCouponClick({
        couponId: coupon.id,
        couponTitle: coupon.title,
        couponCode: coupon.code,
        merchantName: coupon.merchant.name,
        merchantSlug: coupon.merchant.slug || '',
        affiliateLink: coupon.affiliate_link || '#',
        couponType: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
        clickSource: 'button',
        pageLocation: window.location.pathname,
      });
    }
    
    // Parallel actions (no delays, no setTimeout)
    // Action 1: Open merchant page (new tab) - using <a> tag (faster than window.open)
    if (coupon.merchant.slug) {
      const merchantUrl = `/shop/${coupon.merchant.slug}#coupon-${coupon.id}`;
      const link = document.createElement('a');
      link.href = merchantUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    // Action 2: Redirect current tab to affiliate link (instant, no delay)
    if (coupon.affiliate_link && coupon.affiliate_link !== '#') {
      window.location.href = coupon.affiliate_link;
    }
  };

  return (
    <article className="relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 min-h-[220px] flex flex-col">
      {/* Top Section - White Background */}
      <div className="p-4 pb-3 flex-1">
        {/* 適用全站商品 */}
        <div className="text-xs text-gray-500 mb-2">適用全站商品</div>
        
        {/* Coupon Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 leading-tight pr-20">
          {formattedTitle}
        </h3>
        
        {/* View More Button - Small, under title, yellow background, brown text */}
        {coupon.merchant.slug && (
          <Link href={`/shop/${coupon.merchant.slug}`} className="mb-3 inline-block">
            <Button 
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full"
              style={{
                fontSize: '0.7rem',
                padding: '0.25rem 0.75rem',
                lineHeight: '1.2',
                whiteSpace: 'nowrap',
              }}
            >
              查看更多 {coupon.merchant.name} 優惠
            </Button>
          </Link>
        )}
        
        {/* Thumbnail Image */}
        <div className="absolute top-3 right-3 w-16 h-16 rounded overflow-hidden bg-gray-100">
          {coupon.merchant.logo ? (
            <Image
              src={coupon.merchant.logo}
              alt={coupon.merchant.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              sizes="64px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
              {coupon.merchant.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section - Pink to Red Gradient */}
      <div className="bg-gradient-to-r from-pink-500 to-red-500 px-4 py-3 flex items-center justify-between mt-auto">
        <div className="text-white">
          <div className="text-lg font-bold">{discountValue}</div>
        </div>
        
        <Button 
          className="bg-white text-pink-500 hover:bg-gray-50 font-medium px-4 py-2 rounded border border-red-300"
          size="sm"
          onClick={handleButtonClick}
        >
          {getButtonText(coupon.coupon_type)}
        </Button>
      </div>
    </article>
  );
};

export default CategoryCouponCard;

