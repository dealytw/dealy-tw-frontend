import { Card } from "@/components/ui/card";

const DealySidebar = () => {
  // Popular merchants data
  const popularMerchants = [
    {
      id: "adidas",
      name: "adidas HK",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/adidas.png"
    },
    {
      id: "nike",
      name: "Nike HK", 
      logo: "https://dealy.hk/wp-content/uploads/2025/07/nike.png"
    },
    {
      id: "puma",
      name: "Puma",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/puma.png"
    },
    {
      id: "olive-young",
      name: "OLIVE YOUNG",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/oliveyoung.png"
    },
    {
      id: "sephora",
      name: "Sephora HK",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/sephora.png"
    },
    {
      id: "trip-com",
      name: "Trip.com",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/tripcom.png"
    }
  ];

  // Popular categories data
  const popularCategories = [
    "#美妝保養", "#外賣", "#設計", "#女裝時尚", "#家具", "#旅遊",
    "#航空公司", "#機票", "#泳裝", "#美妝", "#保健品", "#電子產品",
    "#自助餐", "#手袋", "#保險", "#咖啡", "#營養補充", "#文具",
    "#保險", "#美髮護理", "#酒店住宿", "#韓國美妝", "#電商", "#食品雜貨",
    "#鞋履", "#個人護理", "#服飾"
  ];

  return (
    <div className="w-80 space-y-6">
      {/* Popular Merchants */}
      <Card className="p-6">
        <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
          <h3 className="text-sm font-semibold text-gray-800">熱門商店</h3>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {popularMerchants.map((merchant) => (
            <div key={merchant.id} className="text-center cursor-pointer group">
              <div className="w-16 h-16 mx-auto mb-2 border rounded-lg overflow-hidden bg-white flex items-center justify-center p-1 group-hover:shadow-md transition-shadow">
                <img 
                  src={merchant.logo} 
                  alt={merchant.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <p className="text-xs text-blue-600 font-medium leading-tight">
                {merchant.name}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Popular Categories */}
      <Card className="p-6">
        <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
          <h3 className="text-sm font-semibold text-gray-800">熱門分類</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {popularCategories.map((category, index) => (
            <span 
              key={index}
              className="text-xs px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full cursor-pointer hover:bg-blue-50 transition-colors"
            >
              {category}
            </span>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default DealySidebar;
