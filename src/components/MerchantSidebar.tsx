import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Helper function to extract text from Strapi rich text
function extractTextFromRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText.map(item => {
      if (item.children && Array.isArray(item.children)) {
        return item.children.map((child: any) => child.text || "").join("");
      }
      return item.text || "";
    }).join(" ");
  }
  return "";
}

interface MerchantSidebarProps {
  merchant: any;
  coupons: any[];
  expiredCoupons?: any[];
}

const MerchantSidebar = ({ merchant, coupons, expiredCoupons = [] }: MerchantSidebarProps) => {
  // Debug: Log merchant data to see what fields are available
  console.log('MerchantSidebar received merchant:', merchant);
  console.log('store_description:', merchant.store_description);
  
  // Combine active and expired coupons for statistics
  const allCoupons = [...coupons, ...expiredCoupons];
  
  // Calculate coupon statistics
  const promoCodeCount = allCoupons.filter(coupon => coupon.coupon_type === "promo_code").length;
  const discountCount = allCoupons.filter(coupon => coupon.coupon_type === "coupon").length;
  const totalCoupons = allCoupons.length;
  
  // Find best discount
  const bestDiscount = allCoupons.reduce((best, coupon) => {
    const currentValue = coupon.value;
    if (!best) return currentValue;
    
    // Handle null/undefined values safely
    if (!currentValue || !best) return best || currentValue;
    
    // Enhanced regex to handle currencies: TWD, HKD, USD, etc. and symbols: $, ¥, €, etc.
    const currencyPattern = /(\d+)\s*(?:TWD|HKD|USD|EUR|JPY|CNY|SGD|MYR|THB|PHP|IDR|VND|KRW|INR|AUD|CAD|GBP|CHF|NZD|SEK|NOK|DKK|PLN|CZK|HUF|RUB|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|ZAR|TRY|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|NGN|KES|UGX|TZS|ZMW|BWP|MWK|MZN|AOA|XOF|XAF|XPF|MUR|SCR|KMF|DJF|ERN|ETB|SOS|SLL|GMD|GNF|LRD|CDF|RWF|BIF|CVE|STN|SZL|LSL|NAD|BND|FJD|PGK|SBD|TOP|VUV|WST|TVD|KID|NPR|BTN|MVR|AFN|PKR|LKR|BDT|MMK|LAK|KHR|MOP)?\s*\$?\s*(%|折|off|減|扣|折|優惠)/i;
    
    const currentMatch = currentValue.match(currencyPattern);
    const bestMatch = best.match(currencyPattern);
    
    if (currentMatch && bestMatch) {
      const currentNum = parseInt(currentMatch[1]);
      const bestNum = parseInt(bestMatch[1]);
      return currentNum > bestNum ? currentValue : best;
    }
    
    return best;
  }, null);

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6 -mt-2">
      {/* Merchant Info Card */}
      <Card className="p-4">
        <div className="text-center mb-6">
          {merchant.logo && (
            <div className="w-20 h-20 mx-auto mb-4 bg-white border rounded-lg flex items-center justify-center p-2">
              <img 
                src={merchant.logo} 
                alt={merchant.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <h3 className="text-xl font-bold text-blue-600 mb-4">{merchant.name}</h3>
          
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
            onClick={() => window.open(merchant.affiliateLink || merchant.website, '_blank')}
          >
            前往查看 {merchant.website || merchant.affiliateLink}
          </Button>
        </div>

        {/* Daily Verification Badge */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm font-semibold">今日已驗證有效優惠</span>
          </div>
          <p className="text-xs text-gray-500">最近更新日期：{today}</p>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">優惠碼</span>
            <span className="font-semibold">{promoCodeCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">折扣</span>
            <span className="font-semibold">{discountCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">最佳優惠</span>
            <span className="font-semibold">{bestDiscount || "N/A"}</span>
          </div>
          <div className="flex justify-between items-center bg-yellow-50 px-3 py-2 rounded">
            <span className="text-sm font-medium">總計</span>
            <span className="font-bold">{totalCoupons}</span>
          </div>
        </div>

        {/* Useful Links */}
        <div className="border-t pt-4">
          <h4 className="font-semibold text-gray-800 mb-3">有用及相關連結</h4>
          <div className="space-y-2">
            {merchant.useful_links && Array.isArray(merchant.useful_links) && merchant.useful_links.length > 0 ? (
              merchant.useful_links.map((link: any, index: number) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  {link.link_title}
                </a>
              ))
            ) : (
              <div className="text-sm text-gray-500">Coming soon...</div>
            )}
          </div>
        </div>
      </Card>

      {/* Description Card */}
      <Card className="p-4">
        <p className="text-sm text-gray-700 leading-relaxed">
          {merchant.store_description ? extractTextFromRichText(merchant.store_description) : merchant.description || ""}
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
