import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

interface CouponCardProps {
  coupon: {
    id: string;
    coupon_title: string;
    coupon_type: "promo_code" | "coupon" | "auto_discount";
    value: string;
    code?: string;
    expires_at?: string;
    user_count: number;
    description: string;
    editor_tips?: string;
    affiliate_link: string;
    merchant: {
      name: string;
      logo: string;
    };
  };
  onGetCode?: (coupon: any) => void;
}

const CouponCard = ({ coupon, onGetCode }: CouponCardProps) => {
  const [isCodeRevealed, setIsCodeRevealed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const calculateTimeLeft = (expiresAt?: string) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}小時${minutes}分${seconds}秒`;
  };

  const handleGetCode = () => {
    if (coupon.coupon_type === "promo_code" && coupon.code) {
      setIsCodeRevealed(true);
    }
    if (onGetCode) {
      onGetCode(coupon);
    }
  };

  const timeLeft = calculateTimeLeft(coupon.expires_at);

  return (
    <Card className="overflow-hidden border border-gray-200">
      <div className="flex flex-col md:flex-row">
        {/* Left: Logo and Badge */}
        <div className="md:w-48 p-6 bg-gray-50 flex flex-col items-center justify-center">
          <div className="w-20 h-20 mb-4 flex items-center justify-center">
            {coupon.merchant.logo ? (
              <Image 
                src={coupon.merchant.logo} 
                alt={coupon.merchant.name}
                width={80}
                height={80}
                className="max-w-full max-h-full object-contain"
                sizes="80px"
                loading="lazy"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Logo</span>
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600 mb-1">{coupon.value}</div>
            <div className="text-sm text-gray-600 px-3 py-1 bg-white rounded-full">
              {coupon.coupon_type === "promo_code" ? "優惠碼" : 
               coupon.coupon_type === "coupon" ? "優惠券" : "自動折扣"}
            </div>
            <div className="text-xs text-gray-500 mt-2">折扣碼/ 優惠</div>
          </div>
        </div>
        
        {/* Right: Content */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 leading-tight">
            {coupon.coupon_title}
          </h3>
          
          {timeLeft && (
            <div className="text-sm text-orange-600 mb-3">
              ⏳ {timeLeft}
            </div>
          )}
          
          <div className="flex items-center gap-4 mb-4">
            {coupon.coupon_type === "promo_code" ? (
              <Button 
                onClick={handleGetCode}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg px-6 py-2"
              >
                獲取優惠碼
              </Button>
            ) : (
              <Button 
                onClick={handleGetCode}
                className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg px-6 py-2"
              >
                獲取優惠
              </Button>
            )}
            
            {isCodeRevealed && coupon.code && (
              <div className="border-2 border-dashed border-gray-300 px-3 py-2 rounded-lg bg-gray-50">
                <span className="font-mono text-lg font-bold">{coupon.code}</span>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 mb-3">
            {coupon.user_count} 人已使用
          </div>
          
          <div className="text-sm text-gray-700 leading-relaxed mb-4">
            {coupon.description}
          </div>
          
          {coupon.editor_tips && (
            <details className="mt-4">
              <summary 
                className="text-sm text-blue-600 cursor-pointer hover:underline flex items-center gap-1"
                onClick={() => setShowDetails(!showDetails)}
              >
                <span className="text-blue-600">▶</span>
                顯示優惠詳情
              </summary>
              <div className="mt-3 text-sm text-gray-600 whitespace-pre-line">
                {coupon.editor_tips}
              </div>
            </details>
          )}
        </div>
      </div>
    </Card>
  );
};

export default CouponCard;