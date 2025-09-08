import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MerchantSidebarProps {
  merchantId?: string;
}

const MerchantSidebar = ({ merchantId }: MerchantSidebarProps) => {
  // Mock merchant data - in real app this would come from props or API
  const merchantData = {
    name: "Trip.com",
    logo: "https://cdn.trip.com/images/logo/trip-logo.svg",
    url: "hk.trip.com",
    affiliateLink: "https://hk.trip.com",
    stats: {
      totalCoupons: 61,
      activeCoupons: 32,
      discounts: 29,
      bestDiscount: "15%",
      lastUpdated: "2025-09-04"
    },
    links: [
      "下載Trip.com APP應用程式",
      "Trip.com 會員計劃", 
      "禮品卡",
      "住宿付款及退款",
      "常見問題",
      "條款及細則"
    ],
    description: "Trip.com 是中國領先的線上旅遊平台，隸屬攜程集團，成立於 1999 年，總部位於北京，服務全球旅客。平台支援中文、英文與多種語言介面，支援多幣種付款方式，涵蓋機票、酒店、火車票、旅遊套票與當地體驗。Trip.com 提供即時確認、真實用戶評價與活躍消費優惠，適合自由行、家庭出遊與商務旅客使用。香港用戶更可透過 Trip.com 預訂港澳 Staycation、亞洲長航線套票或大灣區高鐵車票，配合信用卡優惠或 Trip.com code，即可享最高 HK$200 折扣與免手續費優惠，讓你暢遊無阻體驗。"
  };

  return (
    <div className="space-y-6 -mt-2">
      {/* Merchant Info Card */}
      <Card className="p-4">
        <div className="text-center mb-6">
          <div className="w-20 h-20 mx-auto mb-4 bg-white border rounded-lg flex items-center justify-center p-2">
            <img 
              src={merchantData.logo} 
              alt={merchantData.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <h3 className="text-xl font-bold text-blue-600 mb-4">{merchantData.name}</h3>
          
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
            onClick={() => window.open(merchantData.affiliateLink, '_blank')}
          >
            前往查看 {merchantData.url}
          </Button>
        </div>

        {/* Daily Verification Badge */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm font-semibold">今日已驗證有效優惠</span>
          </div>
          <p className="text-xs text-gray-500">最近更新日期：{merchantData.stats.lastUpdated}</p>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">優惠碼</span>
            <span className="font-semibold">{merchantData.stats.activeCoupons}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">折扣</span>
            <span className="font-semibold">{merchantData.stats.discounts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">最佳優惠</span>
            <span className="font-semibold">{merchantData.stats.bestDiscount}</span>
          </div>
          <div className="flex justify-between items-center bg-yellow-50 px-3 py-2 rounded">
            <span className="text-sm font-medium">總計</span>
            <span className="font-bold">{merchantData.stats.totalCoupons}</span>
          </div>
        </div>

        {/* Useful Links */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-3">有用及相關連結</h4>
          <div className="space-y-2">
            {merchantData.links.map((link, index) => (
              <div key={index} className="text-sm text-blue-600 cursor-pointer hover:underline">
                {link}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Description Card */}
      <Card className="p-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {merchantData.description}
        </p>
      </Card>

      {/* Popular Merchants Section */}
      <Card className="p-4">
        <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
          <h3 className="text-sm font-semibold text-gray-800">熱門商店</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "kkday", logo: "/api/placeholder/48/48" },
            { name: "Trip.com", logo: "/api/placeholder/48/48" },
            { name: "klook", logo: "/api/placeholder/48/48" },
            { name: "SEPHORA", logo: "/api/placeholder/48/48" },
            { name: "NIKE", logo: "/api/placeholder/48/48" },
            { name: "adidas", logo: "/api/placeholder/48/48" },
            { name: "SASA", logo: "/api/placeholder/48/48" },
            { name: "DYNES", logo: "/api/placeholder/48/48" },
            { name: "dyson", logo: "/api/placeholder/48/48" },
            { name: "NET-A-PORTER", logo: "/api/placeholder/48/48" },
            { name: "Expedia", logo: "/api/placeholder/48/48" },
            { name: "agoda", logo: "/api/placeholder/48/48" },
            { name: "CATHAY PACIFIC", logo: "/api/placeholder/48/48" },
            { name: "amazon.com", logo: "/api/placeholder/48/48" },
            { name: "Apple", logo: "/api/placeholder/48/48" },
            { name: "Booking.com", logo: "/api/placeholder/48/48" },
            { name: "CHARLES & KEITH", logo: "/api/placeholder/48/48" },
          ].map((merchant, index) => (
            <div key={index} className="text-center cursor-pointer group">
              <div className="w-12 h-12 mx-auto mb-1 border rounded-full overflow-hidden bg-white flex items-center justify-center p-1 group-hover:shadow-md transition-shadow">
                <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-xs text-gray-400">{merchant.name.charAt(0)}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 font-medium leading-tight truncate">
                {merchant.name}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default MerchantSidebar;
