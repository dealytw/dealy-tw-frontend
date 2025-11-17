import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

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
  const [coupon, setCoupon] = useState(relatedMerchant.firstCoupon);
  const [loading, setLoading] = useState(false);

  // Fetch coupon data if not already available
  useEffect(() => {
    if (!coupon && relatedMerchant.slug) {
      setLoading(true);
      fetch(`/api/merchant-coupon?merchant=${relatedMerchant.slug}&market=tw`)
        .then(res => res.json())
        .then(data => {
          if (data.coupon) {
            setCoupon(data.coupon);
          }
        })
        .catch(error => {
          console.error('Error fetching coupon:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [coupon, relatedMerchant.slug]);

  if (!coupon && !loading) {
    return null;
  }

  if (loading) {
    return (
      <article className="relative overflow-hidden bg-white rounded-lg shadow-sm border border-gray-200 min-h-[280px] flex flex-col">
        <div className="p-4 pb-0 flex-1">
          <div className="animate-pulse">
            <div className="h-16 w-16 mx-auto mb-3 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
          </div>
        </div>
        <div className="bg-pink-500 px-4 py-3 flex items-center justify-between">
          <div className="animate-pulse">
            <div className="h-6 bg-pink-300 rounded w-16"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-8 bg-pink-300 rounded w-16"></div>
          </div>
        </div>
      </article>
    );
  }

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
    <article className="relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 min-h-[280px] flex flex-col">
      {/* Main Content */}
      <div className="p-4 pb-0 flex-1 flex flex-col">
        {/* Merchant Logo - Bigger */}
        <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
          {relatedMerchant.logo ? (
            <Image
              src={relatedMerchant.logo}
              alt={relatedMerchant.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
              sizes="64px"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm text-gray-500">
              {relatedMerchant.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Coupon Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 text-center">
          {couponTitle}
        </h3>

        {/* View More Button - Below title, pale grey background, with shadow */}
        {relatedMerchant.slug && (
          <Link href={`/shop/${relatedMerchant.slug}`} className="mb-3 flex justify-center">
            <Button 
              className="bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-full shadow-sm hover:shadow-md transition-shadow"
              style={{
                fontSize: '0.7rem',
                padding: '0.25rem 0.75rem',
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
      <div className="bg-pink-500 px-4 py-3 flex items-center justify-between">
        <div className="text-white">
          <div className="text-lg font-bold">{discountValue} 折扣</div>
        </div>
        
        <Button 
          className="bg-white text-pink-500 hover:bg-gray-50 font-medium px-4 py-2"
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
