"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
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
  isScrolledTo?: boolean; // New prop to indicate if this coupon is scrolled to
}

const DealyCouponCard = ({
  coupon,
  onClick,
  isScrolledTo = false
}: DealyCouponCardProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Track coupon click
  const trackCouponClick = async () => {
    try {
      await fetch(`/api/coupons/${coupon.id}/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      // Silently fail - don't interrupt user experience
      console.error('Failed to track click:', error);
    }
  };

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

  const handleButtonClick = async () => {
    // Track the click
    await trackCouponClick();
    // Always trigger the click handler for all coupon types
    onClick();
  };
  
  const handleTitleClick = async () => {
    // Track the click
    await trackCouponClick();
    // Trigger the click handler (opens modal)
    onClick();
  };

  return (
    <Card className="overflow-hidden mb-8 rounded-l-2xl rounded-r-3xl shadow-lg border-2 border-orange-100">
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-col md:flex-row">
        {/* Left: Logo and Badge */}
        <div className="md:w-48 p-6 bg-gray-50 flex flex-col items-center justify-center">
          <div className="w-20 h-20 mb-4 flex items-center justify-center">
            {coupon.merchant.logo ? (
              <img src={coupon.merchant.logo} alt={coupon.merchant.name} className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-gray-500 text-xs font-medium">{coupon.merchant.name?.charAt(0) || '?'}</span>
              </div>
            )}
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
          <h3 
            className="text-lg font-semibold text-gray-800 mb-3 leading-tight cursor-pointer hover:text-blue-600 transition-colors"
            onClick={handleTitleClick}
          >
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
            {couponType === "promo_code" && isScrolledTo ? (
              /* Promo Code Layout - Dashed Code Block with Copy Button */
              <div className="border-2 border-dashed border-red-400 rounded-lg p-3 bg-red-50">
                <div className="flex items-center justify-between gap-3">
                  <code className="font-mono text-lg font-bold text-gray-800 flex-1 text-center">
                    {coupon.code}
                  </code>
                  <Button
                    onClick={() => coupon.code && handleCopy(coupon.code)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      copied 
                        ? "bg-green-500 hover:bg-green-600 text-white" 
                        : "bg-blue-500 hover:bg-blue-600 text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        已複製
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        複製
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Regular Layout - Standard Button */
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
              <div className="text-sm">
                <div className="font-medium text-yellow-800 mb-1">💡 溫馨提示：</div>
                <div className="text-yellow-700">{coupon.terms}</div>
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
              {coupon.merchant.logo ? (
                <img src={coupon.merchant.logo} alt={coupon.merchant.name} className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center">
                  <span className="text-gray-500 text-xs font-medium">{coupon.merchant.name?.charAt(0) || '?'}</span>
                </div>
              )}
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
            <h3 
              className="text-sm font-medium text-gray-800 mb-2 leading-tight cursor-pointer hover:text-blue-600 transition-colors"
              onClick={handleTitleClick}
            >
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
              {couponType === "promo_code" && isScrolledTo ? (
                /* Mobile Promo Code Layout - Dashed Code Block with Copy Button */
                <div className="border-2 border-dashed border-red-400 rounded-lg p-2 bg-red-50">
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-sm font-bold text-gray-800 flex-1 text-center">
                      {coupon.code}
                    </code>
                    <Button
                      onClick={() => coupon.code && handleCopy(coupon.code)}
                      className={`px-3 py-1 rounded-lg font-medium transition-colors text-xs ${
                        copied 
                          ? "bg-green-500 hover:bg-green-600 text-white" 
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }`}
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          已複製
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3 mr-1" />
                          複製
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                /* Mobile Regular Layout - Standard Button */
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
                <div className="text-xs">
                  <div className="font-medium text-yellow-800 mb-1">💡 溫馨提示：</div>
                  <div className="text-yellow-700">{coupon.terms}</div>
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
