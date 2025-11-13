import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

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
  onGetCode?: (coupon: any) => void;
}

const CategoryCouponCard = ({ coupon, onGetCode }: CategoryCouponCardProps) => {
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
    if (onGetCode) {
      onGetCode(coupon);
    }
  };

  return (
    <article className="relative overflow-hidden bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
      {/* Top Section - White Background */}
      <div className="p-4 pb-0">
        {/* 適用全站商品 */}
        <div className="text-xs text-gray-500 mb-2">適用全站商品</div>
        
        {/* Coupon Title */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 leading-tight">
          {coupon.title}
        </h3>
        
        {/* Coupon Code */}
        {coupon.code && (
          <div className="flex items-center gap-1 mb-3">
            <span className="text-red-500 text-xs">•</span>
            <span className="text-xs text-gray-700">優惠碼: {coupon.code}</span>
          </div>
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
      <div className="bg-gradient-to-r from-pink-500 to-red-500 px-4 py-3 flex items-center justify-between">
        <div className="text-white">
          <div className="text-lg font-bold mb-1">{discountValue}</div>
          <div className="text-xs opacity-90">低消門檻: TWD 1,527</div>
        </div>
        
        <Button 
          className="bg-white text-pink-500 hover:bg-gray-50 font-medium px-4 py-2 rounded"
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

