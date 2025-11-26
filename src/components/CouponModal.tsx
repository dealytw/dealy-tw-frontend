import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    merchant: {
      name: string;
      logo: string;
    };
  } | null;
}

const CouponModal = ({ open, onOpenChange, coupon }: CouponModalProps) => {
  const [copied, setCopied] = useState(false);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const { toast } = useToast();

  if (!coupon) return null;

  const handleVisitStore = () => {
    // Track coupon click for GTM/GA4 (from modal)
    if (typeof window !== 'undefined') {
      const { trackCouponClick } = require('@/lib/analytics');
      trackCouponClick({
        couponId: coupon.id,
        couponTitle: coupon.title,
        couponCode: coupon.code,
        merchantName: coupon.merchant.name,
        merchantSlug: '', // Modal doesn't have merchant slug context
        affiliateLink: coupon.affiliateLink,
        couponType: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
        clickSource: 'button', // Modal button click
        pageLocation: window.location.pathname,
      });
    }
    
    // Open affiliate link in same tab (as requested)
    window.open(coupon.affiliateLink, '_self');
  };

  const handleCopy = async () => {
    if (!coupon.code) return;
    
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast({
        title: "優惠碼已複製",
        description: `${coupon.code} 已複製到剪貼簿`,
      });
      setTimeout(() => setCopied(false), 5000); // 5 seconds as requested
    } catch (error) {
      toast({
        title: "複製失敗",
        description: "無法複製優惠碼，請手動複製",
        variant: "destructive",
      });
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

  const handleVote = (vote: 'up' | 'down') => {
    if (userVote) return; // Already voted
    
    setUserVote(vote);
    toast({
      title: "感謝評分",
      description: vote === 'up' ? "感謝您的正面評價！" : "感謝您的反饋！",
    });
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-sm sm:max-w-md p-0 bg-white max-h-[85vh] overflow-hidden">
        <DialogTitle className="sr-only">
          {coupon.title} - {coupon.merchant.name} 優惠券
        </DialogTitle>
        
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-10 bg-pink-100 hover:bg-pink-200 text-pink-600 rounded-md p-1 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Merchant Logo */}
          <div className="flex justify-center">
            <div className="w-[110px] h-[110px] sm:w-[150px] sm:h-[150px] flex items-center justify-center">
              <img
                src={coupon.merchant.logo}
                alt={coupon.merchant.name}
                width={150}
                height={150}
                loading="lazy"
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
            </div>
          </div>
          
          {/* Main Offer Title */}
          <div className="text-center">
            <h2 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
              {coupon.title}
            </h2>
            
            {/* Usage Count */}
            <p className="text-sm text-gray-600">
              {coupon.usageCount}人已使用此優惠
            </p>
          </div>

          {/* Conditional Content based on coupon_type */}
          {coupon.coupon_type === "promo_code" ? (
            /* Promo Code Layout - Inline Code with Copy Button */
            <div className="border-2 border-dashed border-pink-300 rounded-lg p-3 sm:p-4 bg-pink-50">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <code className="font-mono text-base sm:text-lg font-bold text-gray-800 flex-1 text-center break-all">
                  {coupon.code}
                </code>
                <Button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    copied 
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "bg-pink-500 hover:bg-pink-600 text-white"
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
            /* Regular Layout - Main CTA Button */
            <Button 
              onClick={handleVisitStore}
              className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg"
            >
              {getButtonText(coupon.coupon_type)}
            </Button>
          )}

          {/* Offer Details */}
          {coupon.steps && (
            <div className="text-sm text-gray-600 leading-relaxed">
              <div className="[&>p]:mb-3 [&>ul]:mb-3 [&>ul]:pl-6 [&>ul]:list-disc [&>li]:mb-1" dangerouslySetInnerHTML={{ __html: coupon.steps }}></div>
            </div>
          )}
          {!coupon.steps && coupon.description && (
            <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
              {coupon.description}
            </div>
          )}

          {/* Warm Tip Section */}
          {coupon.terms && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-gray-800 mb-1">溫馨提示:</p>
                  <div className="[&>p]:mb-2 [&>ul]:mb-2 [&>ul]:pl-6 [&>ul]:list-disc [&>li]:mb-1" dangerouslySetInnerHTML={{ __html: coupon.terms }}></div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
              這個優惠有用嗎?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote('up')}
                disabled={userVote !== null}
                className={`p-2 rounded-full transition-all ${
                  userVote === 'up'
                    ? 'bg-green-100 text-green-600'
                    : userVote === null
                    ? 'bg-pink-50 text-pink-600 hover:bg-pink-100 hover:scale-110 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="有用"
              >
                <ThumbsUp className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleVote('down')}
                disabled={userVote !== null}
                className={`p-2 rounded-full transition-all ${
                  userVote === 'down'
                    ? 'bg-red-100 text-red-600'
                    : userVote === null
                    ? 'bg-pink-50 text-pink-600 hover:bg-pink-100 hover:scale-110 active:scale-95'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                aria-label="沒用"
              >
                <ThumbsDown className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Continue Browsing Button */}
          <Button 
            onClick={() => onOpenChange(false)}
            className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-lg"
          >
            繼續瀏覽
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponModal;