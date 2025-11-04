import { Card } from "@/components/ui/card";
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
      <Card className="relative overflow-hidden bg-white rounded-lg shadow-sm">
        <div className="p-4 pb-0">
          <div className="animate-pulse">
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
      </Card>
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
      // Step 1: Open new tab with related merchant page + modal + auto-scroll (immediate)
      const baseUrl = window.location.href.split('#')[0]; // Remove existing hash
      const relatedMerchantUrl = baseUrl.replace(`/shop/${window.location.pathname.split('/').pop()}`, `/shop/${relatedMerchant.slug}`);
      window.open(relatedMerchantUrl + `#coupon-${coupon.id}`, '_blank');
      
      // Step 2: Redirect current tab to affiliate link (after short delay)
      setTimeout(() => {
        window.open(coupon.affiliate_link, '_self');
      }, 100);
    }
  };

  return (
    <Card className="relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Merchant Logo */}
      <div className="absolute top-3 right-3 w-8 h-8 rounded-full overflow-hidden bg-gray-100">
        {relatedMerchant.logo ? (
          <Image
            src={relatedMerchant.logo}
            alt={relatedMerchant.name}
            width={32}
            height={32}
            className="w-full h-full object-cover"
            sizes="32px"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
            {relatedMerchant.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-4 pb-0">
        {/* Coupon Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 pr-12">
          {couponTitle}
        </h3>
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
    </Card>
  );
};

export default RelatedMerchantCouponCard;
