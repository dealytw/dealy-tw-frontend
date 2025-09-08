import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface CouponCardProps {
  coupon: {
    id: string;
    code: string;
    title: string;
    description: string;
    discount: string;
    expiry: string;
    usageCount: number;
    merchant: {
      name: string;
      logo: string;
    };
  };
  onClick: () => void;
}

const CouponCard = ({ coupon, onClick }: CouponCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={onClick}>
      {/* Top Section - Light Background */}
      <div className="p-4 bg-gray-50 flex justify-between items-start">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">適用全站商品</div>
          <h3 className="font-bold text-gray-800 text-base mb-2">
            {coupon.title}
          </h3>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span>優惠碼: {coupon.code}</span>
          </div>
        </div>
        {/* Merchant Logo */}
        <div className="flex-shrink-0 ml-4">
          <img 
            src={coupon.merchant.logo}
            alt={coupon.merchant.name}
            className="w-10 h-10 object-contain"
          />
        </div>
      </div>
      
      {/* Bottom Section - Pink Gradient */}
      <div className="bg-gradient-to-r from-pink-400 to-rose-400 p-4 flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-2xl">
            {coupon.discount}
          </div>
          <div className="text-white text-sm opacity-90">
            低消門檻: TWD 1,527
          </div>
        </div>
        <Button 
          className="bg-white text-pink-500 hover:bg-gray-100 font-medium px-4 py-2 rounded"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          馬上領
        </Button>
      </div>
    </Card>
  );
};

export default CouponCard;
