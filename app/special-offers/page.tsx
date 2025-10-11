"use client";
import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealyCouponCard from "@/components/DealyCouponCard";
import CouponModal from "@/components/CouponModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const SpecialOffers = () => {
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");

  const filters = ["全部", "最新優惠碼", "最新折扣"];

  // Popular merchants data
  const popularMerchants = [
    {
      name: "adidas HK",
      title: "adidas APP 優惠券 | 首次下載送$800折扣",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/adidas.png",
      link: "/shop/adidas"
    },
    {
      name: "OLIVE YOUNG",
      title: "Olive Young OY SALE 開跑🚨限時限量「最高6折」全單券+品牌加碼券🚨",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/oliveyoung.png",
      link: "/shop/olive-young"
    },
    {
      name: "Dyson",
      title: "Dyson優惠碼🧹最新無線吸塵機 早鳥折扣減$1000 Fluffycones™ 多向吸頭",
      logo: "https://dealy.hk/wp-content/uploads/2025/06/Dyson.png",
      link: "/shop/dyson"
    },
    {
      name: "Klook",
      title: "Klook 優惠碼 🏨🚗PayMe預訂酒店 & 全球租車 減 HK$100【最新】",
      logo: "https://dealy.hk/wp-content/uploads/2025/06/klook.png",
      link: "/shop/klook"
    },
    {
      name: "Agoda",
      title: "Agoda 優惠碼🎟️—住宿即減高達 $40 🏨",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/agoda.png",
      link: "/shop/agoda"
    },
    {
      name: "Trip.com",
      title: "Trip.com優惠碼｜Visa 訂酒店/機票即減高達HK$150（香港適用）【Promo Code】",
      logo: "https://dealy.hk/wp-content/uploads/2025/07/tripcom.png",
      link: "/shop/trip-com"
    },
    {
      name: "iHerb",
      title: "iHerb優惠碼🛒29 周年食品百貨 71 折",
      logo: "https://dealy.hk/wp-content/uploads/2025/06/iherb.png",
      link: "/shop/iherb"
    }
  ];

  // Flash deals coupons data
  const flashDeals = [
    {
      id: "olive1",
      title: "Olive Young OY Sale🚨限時限量「最高6折」券+品牌加碼85折券🚨",
      description: "溫馨提示：OY Sale優惠券會於指定時間🚨限時限量發放🚨⚠️至時指定券額會於限時期內運行⚠️推薦在早期裝置等。商品推介：高端Medicube Age-R等多皮膚護理系列，BOH x ShinRx等 🩷營養助打電等理",
      discount: "6折",
      discountValue: "6",
      expiry: "2026/03/31",
      usageCount: 50,
      timeLeft: "限時優惠 🚨 最高6折+品牌加碼85折券🚨",
      steps: "1. 前往 Olive Young Global 官網或APP\n2. 選擇商品並加入購物車\n3. 結帳頁面輸入優惠碼\n4. 確認折扣已套用後完成付款",
      terms: "⚠️至時指定券額會於限時期內運行⚠️推薦在早期裝置等。商品推介：高端護膚品系列和化妝品，數量有限，先到先得。",
      affiliateLink: "https://global.oliveyoung.com",
      merchant: {
        name: "OLIVE YOUNG",
        logo: "https://dealy.hk/wp-content/uploads/2025/07/oliveyoung.png"
      }
    },
    {
      id: "klook1", 
      code: "KLOOK100HK",
      couponType: "promo_code" as const,
      title: "Klook 優惠碼🏨🚗PayMe預訂酒店 & 全球租車 減 HK$100【最新】",
      description: "透過PayMe付款預訂Klook酒店或租車服務，單筆消費滿HK$800即可享受HK$100折扣。",
      discount: "減 HK$100",
      discountValue: "100", 
      expiry: "2026/12/31",
      usageCount: 42,
      steps: "1. 前往 Klook 官網或APP\n2. 選擇酒店或租車服務\n3. 完成預訂資料填寫\n4. 付款頁面選擇PayMe\n5. 輸入優惠碼：KLOOK100HK\n6. 確認折扣後完成付款",
      terms: "最低消費 HK$800，僅限PayMe付款，優惠不可與其他促銷活動同時使用，每人限用一次。",
      affiliateLink: "https://www.klook.com/zh-HK/",
      merchant: {
        name: "Klook",
        logo: "https://dealy.hk/wp-content/uploads/2025/06/klook.png"
      }
    },
    {
      id: "agoda1",
      code: "AGODA40HK", 
      couponType: "promo_code" as const,
      title: "Agoda 優惠碼🎟️—住宿即減高達 $40 🏨",
      description: "預訂Agoda酒店住宿，使用專屬優惠碼即可享受高達HK$40的immediate折扣。",
      discount: "減 $40",
      discountValue: "40",
      expiry: "2025/12/31", 
      usageCount: 38,
      steps: "1. 前往 Agoda 官網\n2. 搜尋並選擇心儀酒店\n3. 填寫入住資料\n4. 付款頁面輸入優惠碼\n5. 確認折扣已套用後完成預訂",
      terms: "適用於全球酒店預訂，每個帳戶限用一次，不可與其他優惠疊加使用。",
      affiliateLink: "https://www.agoda.com/zh-hk/",
      merchant: {
        name: "Agoda", 
        logo: "https://dealy.hk/wp-content/uploads/2025/07/agoda.png"
      }
    }
  ];

  const handleCouponClick = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
    
    // Open affiliate link in same tab
    window.open(coupon.affiliateLink, '_self');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Affiliate Disclaimer */}
      <div className="bg-muted/30 border-b border-border py-2 px-4">
        <div className="container mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
            <a href="#" className="text-primary hover:underline ml-1">了解更多</a>
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            ✨ 限時搶購！2025最新8月快閃優惠一覽 🔔
          </h1>
          <p className="text-muted-foreground mb-2">
            💥2025 8 月精選快閃優惠全面更新中！💥無論是人氣品牌降價，獨家限時優惠 & 還是賺點數，這真會限時優惠及折扣，這真金為慳我費格優惠 🔥
          </p>
          <p className="text-muted-foreground mb-4">
            Dealy.hk 精心搜羅全港熱門的快閃優惠，助您以最抵優惠入手心水產品。無論您正在尋找技教彩這激優惠券，補洛用品，電子產品，生活百貨或服裝優惠，這裡都有合意的！
          </p>
          <p className="text-sm text-orange-600 font-medium">
            ⭐ 現在處於銷售高峰期的商店，或請請優先下波訂看所有自時最新優惠，趕緊限時買團！立即搶購！
          </p>
        </div>

        {/* Popular Merchants Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            優惠主題熱門商店
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {popularMerchants.map((merchant, index) => (
              <div 
                key={index}
                className="flex flex-col items-center p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => window.open(merchant.link, '_self')}
              >
                <div className="w-16 h-16 mb-3 flex items-center justify-center bg-white rounded-lg p-2">
                  <img 
                    src={merchant.logo}
                    alt={merchant.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <h3 className="font-semibold text-sm text-foreground mb-1 text-center">
                  {merchant.name}
                </h3>
                <p className="text-xs text-muted-foreground text-center line-clamp-2 leading-tight">
                  {merchant.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Flash Deals Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              快閃優惠
            </h2>
            
            <Button 
              variant="outline" 
              className="text-sm flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="w-4 h-4" />
              提交優惠券
            </Button>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {filters.map((filter) => (
              <Badge
                key={filter}
                variant={activeFilter === filter ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 text-sm ${
                  activeFilter === filter 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </Badge>
            ))}
          </div>

          {/* Flash Deals Grid */}
          <div className="space-y-0">
            {flashDeals.map((coupon) => (
              <div key={coupon.id} id={`coupon-${coupon.id}`}>
                <DealyCouponCard
                  coupon={coupon}
                  onClick={() => handleCouponClick(coupon)}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Coupon Modal */}
      <CouponModal 
        open={isModalOpen}
        onOpenChange={(open) => setIsModalOpen(open)}
        coupon={selectedCoupon}
      />
      
      <Footer />
    </div>
  );
};

export default SpecialOffers;
