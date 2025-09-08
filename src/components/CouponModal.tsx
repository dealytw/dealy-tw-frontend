"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CouponModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: {
    id: string;
    code: string;
    title: string;
    description: string;
    discount: string;
    expiry: string;
    terms: string;
    merchant: {
      name: string;
      logo: string;
    };
    affiliateLink: string;
  } | null;
}

const CouponModal = ({ open, onOpenChange, coupon }: CouponModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!coupon) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      toast({
        title: "優惠碼已複製",
        description: `${coupon.code} 已複製到剪貼簿`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "複製失敗",
        description: "無法複製優惠碼，請手動複製",
        variant: "destructive",
      });
    }
  };

  const handleVisitStore = () => {
    // Open affiliate link in same tab (as requested)
    window.open(coupon.affiliateLink, '_self');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={coupon.merchant.logo} 
              alt={coupon.merchant.name}
              className="h-12 w-auto"
            />
          </div>
          <DialogTitle className="text-lg font-semibold text-center">
            {coupon.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Discount Badge */}
          <div className="text-center">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {coupon.discount}
            </Badge>
          </div>

          {/* Coupon Code */}
          <div className="border-2 border-dashed border-primary/20 rounded-lg p-4 bg-secondary/50">
            <div className="flex items-center justify-between gap-2">
              <code className="font-mono text-lg font-bold text-primary flex-1 text-center">
                {coupon.code}
              </code>
              <Button
                onClick={handleCopy}
                size="sm"
                variant="outline"
                className="flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="ml-1">{copied ? "已複製" : "複製"}</span>
              </Button>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground text-center">
            {coupon.description}
          </p>

          {/* Terms and Conditions */}
          {coupon.terms && (
            <div className="bg-warning-light/50 border border-warning/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                <div className="text-xs text-warning-foreground">
                  <p className="font-medium mb-1">使用條款：</p>
                  <p>{coupon.terms}</p>
                </div>
              </div>
            </div>
          )}

          {/* Expiry */}
          <p className="text-xs text-muted-foreground text-center">
            優惠期限：{coupon.expiry}
          </p>

          {/* Visit Store Button */}
          <Button 
            onClick={handleVisitStore}
            className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            前往購買
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CouponModal;
