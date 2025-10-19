"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DealyCouponCardProps {
  coupon: {
    id: string;
    code?: string;
    title: string;
    description: string;
    discount: string;
    discountValue: string;
    expiry: string;
    usageCount: number;
    steps?: string;
    terms?: string;
    affiliateLink: string;
    coupon_type?: "promo_code" | "coupon" | "discount";
    timeLeft?: string;
    merchant: {
      name: string;
      logo: string;
    };
  };
  onClick: () => void;
}

const DealyCouponCard = ({
  coupon,
  onClick
}: DealyCouponCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealedCode, setRevealedCode] = useState(false);
  const { toast } = useToast();

  // Get button text based on coupon_type
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

  // Determine coupon type - use coupon_type from CMS, fallback to code detection
  const couponType = coupon.coupon_type || (coupon.code ? "promo_code" : "coupon");
  const discountType = coupon.code ? "代碼" : "優惠";

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast({
        title: "優惠碼已複製",
        description: `${code} 已複製到剪貼簿`
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "複製失敗",
        description: "無法複製優惠碼，請手動複製",
        variant: "destructive"
      });
    }
  };

  const handleButtonClick = () => {
    if (couponType === "promo_code" && !revealedCode) {
      // Just reveal the code for promo codes
      setRevealedCode(true);
      return;
    }

    // For regular coupons or already revealed promo codes, trigger the click handler
    onClick();
  };

  return (
    <Card className="overflow-hidden mb-8 rounded-l-2xl rounded-r-3xl shadow-lg border-2 border-orange-100">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col md:flex-row">
        {/* Left: Logo and Badge */}
        <div className="md:w-48 p-6 bg-gray-50 flex flex-col items-center justify-center">
          <div className="w-20 h-20 mb-4 flex items-center justify-center">
            <img src={coupon.merchant.logo} alt={coupon.merchant.name} className="max-w-full max-h-full object-contain" />
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600 mb-1">{coupon.discount}</div>
            <div className="text-sm text-gray-600 px-3 py-1 bg-white rounded-full">
              {discountType}
            </div>
            <div className="text-xs text-gray-500 mt-2">折扣碼/ 優惠</div>
          </div>
        </div>
        
        {/* Right: Content */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 leading-tight">
            {coupon.title}
          </h3>
          
          {coupon.timeLeft && (
            <div className="text-sm text-orange-600 mb-3">
              ⏳ {coupon.timeLeft}
            </div>
          )}
          
          <div className="text-xs text-red-500 mb-3 flex items-center gap-2">
            <span>優惠期限 {coupon.expiry}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{coupon.usageCount} 人已使用</span>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            {couponType === "promo_code" ? (
              <div className="flex items-center">
                {!revealedCode ? (
                  <div className="inline-flex items-center cursor-pointer" onClick={handleButtonClick}>
                    <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium px-6 py-2.5 rounded-l-full border-0 pointer-events-none">
                      {getButtonText(couponType)}
                    </Button>
                    <div className="bg-white border-2 border-dashed border-gray-400 rounded-r-full px-3 py-2.5 flex items-center justify-center">
                      <span className="text-black text-xs font-bold">***</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center border-2 border-dashed border-gray-400 rounded">
                    <span className="font-mono text-lg px-4 py-2 bg-gray-50">
                      {coupon.code}
                    </span>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-l-none" onClick={() => coupon.code && handleCopy(coupon.code)}>
                      COPY
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-full border-0" onClick={handleButtonClick}>
                {getButtonText(couponType)}
              </Button>
            )}
          </div>
          
          {/* Removed top yellow note section */}

          <Button variant="ghost" size="sm" onClick={e => {
            e.stopPropagation();
            setShowDetails(!showDetails);
          }} className="text-xs text-blue-600 p-0 h-auto hover:underline">
            {showDetails ? '隐藏優惠詳情' : '顯示優惠詳情'}
            {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>

          {showDetails && (
            <div className="mt-3 space-y-3">
              {coupon.steps && (
                <div className="text-sm">
                  <div className="text-gray-700 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: coupon.steps }}></div>
                </div>
              )}
            </div>
          )}

          {/* Bottom yellow note - moved outside foldable section */}
          {coupon.terms && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <div className="font-medium text-yellow-800 mb-1">⚠️ 溫馨提示：</div>
                  <div className="text-yellow-700">{coupon.terms}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex items-start gap-2 p-4">
          {/* Left: Logo and Discount - Slimmer */}
          <div className="flex-shrink-0 w-12">
            <div className="w-10 h-8 mb-1 flex items-center justify-center">
              <img src={coupon.merchant.logo} alt={coupon.merchant.name} className="max-w-full max-h-full object-contain" />
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-pink-600 break-words leading-tight">
                {coupon.discount.replace('HK', '')}
              </div>
              <div className="text-xs text-gray-500 px-1 py-0.5 bg-white rounded-full border text-xs">
                {discountType}
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-800 mb-2 leading-tight">
              {coupon.title}
            </h3>
            
            {coupon.timeLeft && (
              <div className="text-xs text-orange-600 mb-2">
                ⏳ {coupon.timeLeft}
              </div>
            )}
            
            <div className="text-xs text-red-500 mb-3 flex items-center gap-2">
              <span>優惠期限 {coupon.expiry}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">{coupon.usageCount} 人已使用</span>
            </div>

            {/* Mobile Buttons - Same as Desktop */}
            <div className="flex items-center gap-4 mb-3">
              {couponType === "promo_code" ? (
                <div className="flex items-center">
                  {!revealedCode ? (
                    <div className="inline-flex items-center cursor-pointer" onClick={handleButtonClick}>
                      <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium px-4 py-2 rounded-l-full border-0 pointer-events-none text-xs">
                        {getButtonText(couponType)}
                      </Button>
                      <div className="bg-white border-2 border-dashed border-gray-400 rounded-r-full px-2 py-2 flex items-center justify-center">
                        <span className="text-black text-xs font-bold">***</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center border-2 border-dashed border-gray-400 rounded">
                      <span className="font-mono text-sm px-3 py-2 bg-gray-50">
                        {coupon.code}
                      </span>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-l-none text-xs" onClick={() => coupon.code && handleCopy(coupon.code)}>
                        COPY
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-medium px-4 py-2 rounded-full border-0 text-xs" onClick={handleButtonClick}>
                  {getButtonText(couponType)}
                </Button>
              )}
            </div>

            {/* Removed mobile top yellow note section */}

            {/* Mobile Details Toggle */}
            <Button variant="ghost" size="sm" onClick={e => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }} className="text-xs text-blue-600 p-0 h-auto hover:underline">
              {showDetails ? '隱藏優惠詳情' : '顯示優惠詳情'}
              {showDetails ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
            </Button>

            {showDetails && (
              <div className="mt-3 space-y-3">
                {coupon.steps && (
                  <div className="text-xs">
                    <div className="text-gray-700 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: coupon.steps }}></div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile bottom yellow note - moved outside foldable section */}
            {coupon.terms && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-medium text-yellow-800 mb-1">⚠️ 溫馨提示：</div>
                    <div className="text-yellow-700">{coupon.terms}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DealyCouponCard;
