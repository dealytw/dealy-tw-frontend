import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getDailyUpdatedTime } from "@/lib/jsonld";

// Helper function to render rich text with formatting preserved (same as page-client)
function renderRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText.map(item => {
      if (item.type === "paragraph") {
        let paragraphContent = "";
        if (item.children && Array.isArray(item.children)) {
          paragraphContent = item.children.map((child: any) => {
            if (child.bold) return `<strong>${child.text || ""}</strong>`;
            if (child.italic) return `<em>${child.text || ""}</em>`;
            return child.text || "";
          }).join("");
        } else {
          paragraphContent = item.text || "";
        }
        // Wrap paragraph content in <p> tag for proper line breaks
        return `<p>${paragraphContent}</p>`;
      }
      if (item.type === "list") {
        const listItems = item.children?.map((child: any) => {
          if (child.children && Array.isArray(child.children)) {
            return child.children.map((grandChild: any) => grandChild.text || "").join("");
          }
          return child.text || "";
        }).join("</li><li>") || "";
        return `<ul><li>${listItems}</li></ul>`;
      }
      return item.text || "";
    }).join("");
  }
  return "";
}

// Helper function to extract text from Strapi rich text (for fallback)
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
  hotstoreMerchants?: Array<{
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  }>;
}

const MerchantSidebar = ({ merchant, coupons, expiredCoupons = [], hotstoreMerchants = [] }: MerchantSidebarProps) => {
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

  // Get daily updated time (server-side, always today's date)
  const dailyUpdatedTime = getDailyUpdatedTime();
  // Format date as YYYY/MM/DD to match merchant page format
  const lastUpdatedDate = merchant.lastUpdatedDate || dailyUpdatedTime.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

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
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
          <h3 className="text-xl font-bold text-blue-600 mb-4">{merchant.name}</h3>
          
          <a
            href={merchant.site_url || merchant.affiliateLink || merchant.website || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 text-center rounded-md transition-colors"
          >
            前往查看
          </a>
        </div>

        {/* Daily Verification Badge */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-sm font-semibold">今日已驗證有效優惠</span>
          </div>
          <p className="text-xs text-gray-500">最近更新日期：{lastUpdatedDate}</p>
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
          
          {/* Desktop Share Buttons - Hidden on mobile */}
          <div className="hidden md:block mt-4 pt-4 border-t">
            <h4 className="font-semibold text-gray-800 mb-3">分享</h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  const title = merchant.name;
                  const encodedUrl = encodeURIComponent(url);
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
                }}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="分享到 Facebook"
              >
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  const title = merchant.name;
                  const encodedUrl = encodeURIComponent(url);
                  const encodedTitle = encodeURIComponent(title);
                  window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, '_blank');
                }}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="分享到 WhatsApp"
              >
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .96 4.534.96 10.09c0 1.744.413 3.379 1.144 4.826L.06 24l9.305-2.533a11.714 11.714 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.89-11.89a11.898 11.898 0 00-3.48-8.413Z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  const title = merchant.name;
                  const encodedUrl = encodeURIComponent(url);
                  const encodedTitle = encodeURIComponent(title);
                  window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, '_blank');
                }}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="分享到 X"
              >
                <svg className="w-5 h-5 text-black" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </button>
              <button
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.href : '';
                  navigator.clipboard.writeText(url);
                }}
                className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 transition-colors"
                aria-label="複製連結"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Store Description Card - Separate card below useful links, above popular stores */}
      {merchant.store_description && (
        <Card className="p-4">
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: renderRichText(merchant.store_description) }}></div>
        </Card>
      )}

      {/* Popular Merchants Section */}
      <Card className="p-4">
        <div className="bg-yellow-100 text-center py-2 px-4 rounded-lg mb-4">
          <h3 className="text-sm font-semibold text-gray-800">熱門商店</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {hotstoreMerchants && hotstoreMerchants.length > 0 ? (
            hotstoreMerchants.map((merchant) => (
              <Link
                key={merchant.id}
                href={`/shop/${merchant.slug}`}
                className="text-center group"
              >
                <div className="w-12 h-12 mx-auto mb-1 border rounded-full overflow-hidden bg-white flex items-center justify-center p-1 group-hover:shadow-md transition-shadow">
                  {merchant.logoUrl ? (
                    <img
                      src={merchant.logoUrl}
                      alt={merchant.name}
                      width={48}
                      height={48}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-400">{merchant.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-gray-600 font-medium leading-tight truncate">
                  {merchant.name}
                </p>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-4">
              <p className="text-[10px] text-gray-500">No merchants available</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MerchantSidebar;
