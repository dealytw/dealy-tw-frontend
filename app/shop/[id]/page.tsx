"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealyCouponCard from "@/components/DealyCouponCard";
import MerchantSidebar from "@/components/MerchantSidebar";
import CouponModal from "@/components/CouponModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronRight, HelpCircle, Clock, User, Calendar, ArrowUp } from "lucide-react";
import { getMerchantLogo } from "@/lib/data";
import { TransformedShop } from "@/types/cms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CouponCard from "@/components/CouponCard";

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

const Merchant = () => {
  const params = useParams();
  const id = params?.id as string;
  const [merchant, setMerchant] = useState<TransformedShop | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<any[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");
  const filters = ["全部", "最新優惠", "日本", "韓國", "本地", "內地", "信用卡"];

  // Mock expired coupons data (from lovable project)
  const mockExpiredCoupons = [{
    id: "expired1",
    title: "Trip.com日本酒店折扣低至 4 折｜夏遊日本星級酒店【最新】",
    description: "日本夏季酒店打折少見優惠 4 折，特別是東京的三井花園與帝國飯店這類高評分住宿，在暑假期段訂房更容易撞到好價。如果想縮短旅遊打卡人潮，這波促銷是千手的好時機。",
    discount: "4折",
    discountValue: "4",
    expiry: "已過期",
    merchant: {
      name: "Trip.com",
      logo: "https://cdn.trip.com/images/logo/trip-logo.svg"
    },
    affiliateLink: "https://hk.trip.com"
  }, {
    id: "expired2",
    title: "Trip.com App限定｜機票限時9折起＋可賺里數兼 Trip Coins【限時快閃】",
    description: "先登入Trip.com App，開啟靈活日期搜尋功能可以撈到靚價，避開週末、選早晚時段更易中。當舖行李政策，必要時預先加購寄艙。熱門航點如大阪、首爾、曼谷、台北等座位緊張，先撈票再安排行程！",
    discount: "9折",
    discountValue: "9",
    expiry: "已過期",
    merchant: {
      name: "Trip.com",
      logo: "https://cdn.trip.com/images/logo/trip-logo.svg"
    },
    affiliateLink: "https://hk.trip.com"
  }];

  // Mock related merchants data
  const relatedMerchants = [{
    name: "Agoda",
    discount: "$40",
    type: "代碼",
    users: "50",
    logo: "/api/placeholder/48/48"
  }, {
    name: "Booking.com",
    discount: "8折",
    type: "折扣",
    users: "44",
    logo: "/api/placeholder/48/48"
  }, {
    name: "Expedia",
    discount: "12%",
    type: "OFF",
    users: "42",
    logo: "/api/placeholder/48/48"
  }, {
    name: "Qatar Airways",
    discount: "$4,999",
    type: "折扣",
    users: "43",
    logo: "/api/placeholder/48/48"
  }];

  // Mock FAQ data
  const faqs = [{
    question: "Trip.com HK提供哪些付款選項？",
    answer: "Trip.com支援Visa、JCB、MasterCard、UnionPay、American Express、Discover、Diners Club International、PayPal、Google Pay、Apple Pay、Trip Coins及禮品卡。"
  }, {
    question: "Trip.com的付款流程是什麼？",
    answer: "1. 選擇付款方式 2. 輸入持卡人姓名、卡號、到期日及安全碼 3. 確認付款詳情並提交。"
  }, {
    question: "Trip.com有提供旅遊積分嗎？",
    answer: "有，Trip Coins可用於預訂機票、酒店及其他旅遊服務，可透過消費及促銷活動獲得。"
  }, {
    question: "Trip.com支援哪些平台付款？",
    answer: "支援iOS、Android、桌面網頁及手機網頁，不同付款方式在各平台的支援度略有不同。"
  }];

  // Fetch merchant data and coupons from Strapi
  useEffect(() => {
    const fetchData = async () => {
      try {
        const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
        
        // Fetch merchant data
        const merchantResponse = await fetch(`/api/shop/${id}?market=${market}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!merchantResponse.ok) {
          throw new Error(`HTTP error! status: ${merchantResponse.status}`);
        }
        
        const merchantData = await merchantResponse.json();
        setMerchant(merchantData);

        // Fetch coupons for this merchant
        const couponsResponse = await fetch(`/api/shop/${id}/coupons?market=${market}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (couponsResponse.ok) {
          const couponsData = await couponsResponse.json();
          
          // Separate active and expired coupons
          const today = new Date().toISOString().split('T')[0];
          const activeCoupons = couponsData.filter((coupon: any) => 
            !coupon.expires_at || coupon.expires_at >= today
          );
          const expiredCoupons = couponsData.filter((coupon: any) => 
            coupon.expires_at && coupon.expires_at < today
          );
          
          setCoupons(activeCoupons);
          setExpiredCoupons(expiredCoupons.length > 0 ? expiredCoupons : mockExpiredCoupons);
        }
      } catch (error) {
        console.error('Error fetching merchant data:', error);
        // Fallback data for development
        setMerchant({
          id: 1,
          name: "Trip.com",
          slug: id,
          logo: null,
          description: "Trip.com 是中國領先的線上旅遊平台",
          website: "hk.trip.com",
          affiliateLink: "https://hk.trip.com",
          pageLayout: "coupon", // Default layout
          isFeatured: false,
          market: "HK",
          seoTitle: "",
          seoDescription: "",
          canonicalUrl: "",
          priority: 0,
          robots: "index,follow",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          publishedAt: new Date().toISOString()
        });
        setCoupons([]);
        setExpiredCoupons(mockExpiredCoupons);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Auto-scroll to section based on hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  const handleCouponClick = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);

    // Open affiliate link in same tab and popup in new tab (as requested)
    window.open(coupon.affiliateLink, '_self');
    setTimeout(() => {
      window.open(window.location.href + `#coupon-${coupon.id}`, '_blank');
    }, 100);
  };

  // Transform CMS coupons to DealyCouponCard format
  const transformCoupon = (coupon: any) => ({
    id: coupon.id,
    code: coupon.code,
    title: coupon.coupon_title,
    description: extractTextFromRichText(coupon.description),
    discount: coupon.value,
    discountValue: coupon.value.replace(/[^\d]/g, ''),
    expiry: coupon.expires_at || "長期有效",
    usageCount: coupon.user_count || 0,
    steps: extractTextFromRichText(coupon.editor_tips),
    terms: extractTextFromRichText(coupon.editor_tips),
    affiliateLink: coupon.affiliate_link,
    couponType: coupon.coupon_type === "promo_code" ? "promo_code" : "coupon",
    merchant: {
      name: coupon.merchant.name,
      logo: coupon.merchant.logo,
    }
  });

  if (!merchant) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto py-12">
          <div className="text-center">Loading...</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Affiliate Disclaimer */}
      <div className="bg-gray-50 border-b border-gray-200 py-1 px-2">
        <div className="max-w-full mx-auto px-2">
          <p className="text-[8px] text-gray-600 text-center leading-tight">
            透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
          </p>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-4">
        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2">
            {/* Page Title */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center lg:hidden">
                {merchant.logo && (
                  <img 
                    src={merchant.logo} 
                    alt={merchant.name} 
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mb-2">
                  <h1 className="text-lg md:text-3xl font-bold text-gray-900">
                    {merchant.name}優惠碼2025｜9月最新折扣與信用卡優惠
                  </h1>
                  <p className="text-xs text-gray-600 sm:mb-1">
                    最近更新： 2025/09/04 （每日更新）
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-6">
              {merchant.description || `${merchant.name}優惠碼限時登場！透過信用卡專屬折扣或指定 Promo Code，即享機票、酒店、高鐵優惠，助你即省更多。`}
            </p>
            
            {/* Filter Section */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {merchant.name}優惠碼總整理（每日更新）｜Promo code／Discount code
              </h2>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {filters.map(filter => (
                  <Badge 
                    key={filter} 
                    variant={activeFilter === filter ? "default" : "outline"} 
                    className={`cursor-pointer px-3 py-1 text-sm ${activeFilter === filter ? "bg-blue text-white border-blue" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`} 
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Continued Content */}
            <div className="space-y-8">
              {/* Active Coupons */}
              <div className="space-y-0">
                {coupons.map(coupon => (
                  <div key={coupon.id} id={`coupon-${coupon.id}`}>
                    <DealyCouponCard coupon={transformCoupon(coupon)} onClick={() => handleCouponClick(coupon)} />
                  </div>
                ))}
              </div>

              {/* Expired Coupons Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">已過期但仍可嘗試</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {expiredCoupons.map(coupon => (
                    <div key={coupon.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className="text-center min-w-[80px]">
                          <div className="w-12 h-12 mb-2 mx-auto flex items-center justify-center">
                            <img src={coupon.merchant?.logo || merchant.logo} alt={coupon.merchant?.name || merchant.name} className="max-w-full max-h-full object-contain" />
                          </div>
                          <div className="text-lg font-bold text-purple-600">{coupon.discount}</div>
                          <div className="text-sm text-gray-500">優惠</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">折扣碼/優惠</div>
                          <h3 className="text-sm font-medium text-blue-600 mb-2">{coupon.title}</h3>
                          <Button className="bg-purple-400 hover:bg-purple-500 text-white text-sm px-6 py-2 mb-2" onClick={() => window.open(coupon.affiliateLink, '_blank')}>
                            獲取優惠券 ➤
                          </Button>
                          <p className="text-xs text-gray-600">{coupon.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Related Merchants Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">同類商戶折扣優惠</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedMerchants.map((merchant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg overflow-hidden bg-white text-sm">
                      {/* Header */}
                      <div className="px-3 pt-2 pb-1 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">適用全站商品</span>
                          <div className="w-6 h-6">
                            <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Main Content */}
                      <div className="px-3 py-2">
                        <h3 className="text-xs font-medium text-gray-900 mb-2 line-clamp-2">
                          {merchant.name} - 精選優惠 ({merchant.discount}折扣)
                        </h3>
                        
                        <div className="flex items-center gap-1 mb-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          <span className="text-xs text-gray-700">優惠碼: {merchant.name.toUpperCase()}4999</span>
                        </div>
                      </div>
                      
                      {/* Pink Bottom Section */}
                      <div className="bg-pink-400 px-3 py-2 flex items-center justify-between text-white">
                        <div>
                          <div className="text-sm font-bold">{merchant.discount}</div>
                          <div className="text-xs opacity-90">低消門檻: TWD 1,527</div>
                        </div>
                        <Button 
                          className="bg-white text-pink-500 hover:bg-gray-50 px-2 py-1 text-xs font-medium"
                          onClick={() => window.open(`/shop/${merchant.name.toLowerCase()}`, '_blank')}
                        >
                          馬上領
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* FAQ Section */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    常見問題
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                      <h4 className="font-medium text-pink-600 mb-2 flex items-start gap-2">
                        <span className="text-pink-500 mt-1">?</span>
                        {faq.question}
                      </h4>
                      <p className="text-sm text-gray-600 ml-6">{faq.answer}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Related Blog Categories */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">相關購物分類及攻略</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {["最新快閃優惠", "旅遊優惠大集合", "優惠碼使用教學", "信用卡優惠大全", "會員攻略"].map((category, index) => (
                      <Badge key={index} variant="outline" className="cursor-pointer px-3 py-1 text-sm border-gray-300 hover:bg-gray-50">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* How to Use Coupons Guide */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-pink-600 flex items-center gap-2">
                    💗 如何於{merchant.name}使用優惠碼
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="font-medium">1) 先在本頁按「顯示優惠碼」/「獲取折扣」</p>
                    <p className="font-medium">2) 登入 {merchant.name} 帳戶</p>
                    <p className="font-medium">3) 選擇產品加入購物車</p>
                    <p className="font-medium">4) 結帳頁輸入或套用優惠</p>
                    <p className="font-medium">5) 確認折扣已生效再付款。</p>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold text-lg mb-4">詳細步驟</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-2">由本頁進入優惠</h5>
                        <p className="text-sm text-gray-600">按「顯示優惠碼」或「獲取折扣」前往 {merchant.name}（部分優惠需經指定連結才會顯發）。</p>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">登入／建立帳戶</h5>
                        <p className="text-sm text-gray-600">建議先登入以保留訂單與顯示會員價（如有）。</p>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">搜尋與選擇</h5>
                        <p className="text-sm text-gray-600">輸入城市／景點、日期與人數，挑選標示支援優惠的酒店／機票／門票產品，加入購物車。</p>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">進入結帳頁</h5>
                        <p className="text-sm text-gray-600">填寫旅客資料後，於結帳頁找到「優惠碼」/「折扣代碼」/「優惠券」區域。</p>
                      </div>

                      <div>
                        <h5 className="font-medium mb-2">輸入或套用優惠</h5>
                        <p className="text-sm text-gray-600">有代碼：貼上本頁顯示的優惠碼一按「套用」。</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">聯絡我們</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      ✍️ 你的名字
                    </Label>
                    <Input id="name" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      💗 你的電郵
                    </Label>
                    <Input id="email" type="email" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                      ✍️ 你的信息 （歡迎任何意見或問題）
                    </Label>
                    <Textarea id="message" rows={6} className="mt-1" />
                  </div>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2">
                    📧提交
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <MerchantSidebar merchant={merchant} coupons={coupons} expiredCoupons={expiredCoupons} />
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-blue-600 mb-4">
            <span className="cursor-pointer hover:underline">Dealy.HK 最新優惠平台</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="cursor-pointer hover:underline">所有商店</span>
            <ChevronRight className="w-4 h-4 mx-2" />
            <span className="text-gray-600">{merchant.name}</span>
          </div>
        </div>
      </main>

      {/* Coupon Modal */}
      <CouponModal open={isModalOpen} onOpenChange={setIsModalOpen} coupon={selectedCoupon} />
    </div>
  );
};

export default Merchant;