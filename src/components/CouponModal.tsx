import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ShoppingBag, Copy, Check } from "lucide-react";
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
  const { toast } = useToast();

  if (!coupon) return null;

  const handleVisitStore = () => {
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


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 bg-white">
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

        <div className="p-6 space-y-6">
          {/* Merchant Logo */}
          <div className="flex justify-center">
            <img 
              src={coupon.merchant.logo} 
              alt={coupon.merchant.name}
              className="h-8 w-auto"
            />
          </div>
          
          {/* Main Offer Title */}
          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800 mb-2">
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
            <div className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-pink-50">
              <div className="flex items-center justify-between gap-3">
                <code className="font-mono text-lg font-bold text-gray-800 flex-1 text-center">
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
          <div className="text-sm text-gray-600 leading-relaxed">
            {coupon.description}
          </div>

          {/* Warm Tip Section */}
          {coupon.terms && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ShoppingBag className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-gray-700">
                  <p className="font-medium text-gray-800 mb-1">溫馨提示:</p>
                  <p>{coupon.terms}</p>
                </div>
              </div>
            </div>
          )}

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