"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DealyCouponCard from "@/components/DealyCouponCard";
import CouponModal from "@/components/CouponModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, Clock, User, Calendar, ArrowUp } from "lucide-react";

const MerchantBlog = () => {
  const params = useParams();
  const id = params?.id as string;
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  // Table of contents for the blog
  const tableOfContents = [{
    id: "klook-coupons-2025",
    title: "2025 Klook優惠碼懶人包"
  }, {
    id: "new-user-offers",
    title: "Klook 新用戶優惠"
  }, {
    id: "credit-card-offers",
    title: "Klook 信用卡優惠"
  }, {
    id: "overseas-activities",
    title: "Klook 海外租車及活動優惠"
  }, {
    id: "local-experiences",
    title: "Klook 本地及海外景點優惠"
  }, {
    id: "faqs",
    title: "常見問題"
  }, {
    id: "how-to-use",
    title: "如何使用Klook優惠碼"
  }];

  // Mock Klook data
  const coupons = [{
    id: "klook1",
    code: "KLOOKVISAHK150",
    couponType: "promo_code" as const,
    title: "Klook優惠碼｜Visa 預訂活動即減高達HK$150（香港適用）【Promo Code】",
    description: "以 Visa 付款於 Klook App/官網 預訂活動，使用折扣碼單筆 HK$1,500+ → 立減 HK$150。",
    discount: "減 HK$150",
    discountValue: "150",
    expiry: "2026/03/31",
    usageCount: 128,
    steps: "1. 前往 Klook App 或官網\n2. 選擇活動並完成預訂資料\n3. 付款頁面選擇 Visa 信用卡\n4. 輸入優惠碼：KLOOKVISAHK150\n5. 確認折扣已套用後完成付款",
    terms: "本優惠僅限 Visa 信用卡付款，最低消費 HK$1,500，優惠有效期至 2026/03/31，數量有限，先到先得。不可與其他優惠同時使用。",
    affiliateLink: "https://www.klook.com/",
    merchant: {
      name: "Klook",
      logo: "/api/placeholder/48/48"
    }
  }, {
    id: "klook2",
    code: "KLOOK100NEW",
    couponType: "promo_code" as const,
    title: "Klook新戶優惠碼｜首次預訂立減HK$100【新用戶專享】",
    description: "新用戶首次在Klook預訂活動，滿HK$800即可使用此優惠碼減HK$100。",
    discount: "減 HK$100",
    discountValue: "100",
    expiry: "2026/12/31",
    usageCount: 256,
    steps: "1. 註冊Klook新帳戶\n2. 選擇心儀活動加入購物車\n3. 確保訂單金額達HK$800\n4. 結帳時輸入優惠碼\n5. 完成付款享受優惠",
    terms: "此優惠僅限新用戶首次使用，最低消費HK$800，每人限用一次。",
    affiliateLink: "https://www.klook.com/",
    merchant: {
      name: "Klook",
      logo: "/api/placeholder/48/48"
    }
  }, {
    id: "klook3",
    couponType: "coupon" as const,
    title: "Klook信用卡優惠｜指定銀行信用卡享9折優惠【銀行合作】",
    description: "使用指定銀行信用卡在Klook預訂，可享全單9折優惠，最高減HK$200。",
    discount: "9折",
    discountValue: "10",
    expiry: "長期有效",
    usageCount: 89,
    terms: "適用於指定銀行信用卡，包括恒生、中銀、滙豐等。詳情請查看各銀行條款。",
    affiliateLink: "https://www.klook.com/",
    merchant: {
      name: "Klook",
      logo: "/api/placeholder/48/48"
    }
  }];

  const handleCouponClick = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
    window.open(coupon.affiliateLink, '_self');
    setTimeout(() => {
      window.open(window.location.href + `#coupon-${coupon.id}`, '_blank');
    }, 100);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Auto scroll to coupon if hash is present
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#coupon-')) {
      const couponId = hash.replace('#coupon-', '');
      const element = document.getElementById(`coupon-${couponId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        const coupon = coupons.find(c => c.id === couponId);
        if (coupon) {
          setSelectedCoupon(coupon);
          setIsModalOpen(true);
        }
      }
    }
  }, []);

  return <div className="min-h-screen bg-white">
      <Header />
      
      {/* Affiliate Disclaimer */}
      <div className="bg-gray-50 border-b border-gray-200 py-1 px-2">
        <div className="max-w-full mx-auto px-2">
          <p className="text-[8px] text-gray-600 text-center leading-tight">
            透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
          </p>
        </div>
      </div>

      {/* Hero Section with Colorful Background */}
      <div className="bg-gradient-to-br from-orange-400 via-pink-400 to-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-300/20 to-purple-600/20"></div>
        <div className="container mx-auto px-4 py-12 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="text-white text-sm font-medium">🔥 持續更新</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
              【Klook優惠碼2025】9月最新Promo Code及全年信用卡優惠懶人包！
            </h1>
            <p className="text-xl text-white/90 mb-6">
              Promo Code/新戶優惠/全年信用卡優惠
            </p>
            <div className="flex items-center justify-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>2025年9月最新</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>每日更新</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative illustration area */}
        <div className="absolute right-4 top-8 w-32 h-32 opacity-20">
          <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-4xl">🎫</span>
          </div>
        </div>
      </div>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <article className="lg:col-span-3">
            {/* Author Info */}
            <div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
              <Avatar className="w-12 h-12">
                <AvatarImage src="/api/placeholder/48/48" />
                <AvatarFallback>Sarah</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-gray-900">by Sarah</p>
                <p className="text-sm text-gray-600">發佈於9月最新優惠 🔥</p>
              </div>
            </div>

            {/* Article Introduction */}
            <div className="prose prose-lg max-w-none mb-8">
              <p className="text-lg text-gray-700 leading-relaxed">
                2025年9月最新Klook優惠碼大放送！不論你是定期訂酒店的Staycation、自助遊，下午茶或是想"搞Party"活動，使用以下整理的Klook折扣都能夠更享有折！
              </p>
              <p className="text-gray-700 leading-relaxed">
                在這個文章，<span className="text-orange-600 font-medium">ReUbird</span> 小編會為你一次收錄最新最齊Klook優惠碼，Klook Promo Code、Discount Code、全年信用卡優惠，幫助戶能夠95折優惠，JR週票等，通過有系統的整理内查看各優惠！
              </p>
              <p className="text-gray-700 leading-relaxed">
                使用Klook優惠碼的方法非常簡單，只需在<span className="text-blue-600 font-medium">結帳頁面輸入</span>，然後在付款時輸入優惠碼即可！
              </p>
              <p className="text-gray-700 leading-relaxed mb-6">
                別忘了將這頁加入書籤，隨時查看以下最新優惠，省更多錢！
              </p>
            </div>

            {/* 2025 Klook Coupons Section */}
            <section id="klook-coupons-2025" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">2025 Klook優惠碼懶人包：</h2>
              
              <div className="bg-orange-50 border-l-4 border-orange-400 p-6 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-orange-800 mb-2">
                      1. Klook「我愛我來」夏日優惠
                    </h3>
                    <ul className="space-y-2 text-orange-700">
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook 夏日旅遊優惠</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook 夏日旅遊系統優惠</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook 海外租車及交通優惠</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook 本地及海外景點優惠</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook 海外玩樂優惠</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mb-8">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">
                      2. Klook 9月信用卡優惠碼
                    </h3>
                    <ul className="space-y-2 text-blue-700">
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook x Visa</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook x JCB</strong> 🔥</span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook x 恒生</strong></span>
                      </li>
                      <li className="flex items-start">
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span><strong>Klook x 中銀</strong></span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Coupons Display */}
            <section className="mb-12">
              <div className="space-y-0">
                {coupons.map(coupon => <div key={coupon.id} id={`coupon-${coupon.id}`}>
                    <DealyCouponCard coupon={coupon} onClick={() => handleCouponClick(coupon)} />
                  </div>)}
              </div>
            </section>

            {/* New User Offers Section */}
            <section id="new-user-offers" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Klook 新用戶優惠</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-green-800 mb-4">新戶首次預訂優惠</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-700 mb-2">🎁 新用戶專享</h4>
                    <p className="text-sm text-gray-600 mb-3">首次註冊即享HK$100優惠碼</p>
                    <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">
                      立即註冊領取
                    </Button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-700 mb-2">💰 加碼優惠</h4>
                    <p className="text-sm text-gray-600 mb-3">預訂滿HK$800再減HK$50</p>
                    <Button className="bg-green-600 hover:bg-green-700 text-white text-sm">
                      查看詳情
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Credit Card Offers Section */}
            

            {/* FAQs Section */}
            <section id="faqs" className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">常見問題</h2>
              <div className="space-y-4">
                {[{
                q: "Klook優惠碼如何使用？",
                a: "在結帳頁面找到「優惠碼」或「Promo Code」欄位，輸入代碼後點擊「套用」即可。"
              }, {
                q: "可以同時使用多個優惠碼嗎？",
                a: "一般情況下，每筆訂單只能使用一個優惠碼，建議選擇折扣最大的代碼使用。"
              }, {
                q: "優惠碼過期了還能用嗎？",
                a: "過期的優惠碼通常無法使用，建議使用前確認有效期限。"
              }].map((faq, index) => <Card key={index} className="border-l-4 border-orange-400">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-orange-600 mb-2">{faq.q}</h4>
                      <p className="text-sm text-gray-600">{faq.a}</p>
                    </CardContent>
                  </Card>)}
              </div>
            </section>

            {/* How to Use Section */}
            <section id="how-to-use" className="mb-12">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-pink-600 flex items-center gap-2">
                    💗 如何於Klook使用優惠碼
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <p className="font-medium">1) 先在本頁按「顯示優惠碼」/「獲取折扣」</p>
                    <p className="font-medium">2) 登入 Klook 帳戶</p>
                    <p className="font-medium">3) 選擇活動加入購物車</p>
                    <p className="font-medium">4) 結帳頁輸入或套用優惠</p>
                    <p className="font-medium">5) 確認折扣已生效再付款。</p>
                  </div>

                  <div className="mt-6">
                    <h4 className="font-bold text-lg mb-4">詳細步驟</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <h5 className="font-medium mb-2">由本頁進入優惠</h5>
                        <p className="text-sm text-gray-600">按「顯示優惠碼」或「獲取折扣」前往 Klook（部分優惠需經指定連結才會顯發）。</p>
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
            </section>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              {/* Table of Contents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">目錄</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <nav className="space-y-2">
                    {tableOfContents.map(item => <button key={item.id} onClick={() => scrollToSection(item.id)} className={`block w-full text-left text-sm p-2 rounded hover:bg-gray-100 transition-colors ${activeSection === item.id ? 'bg-orange-100 text-orange-600 font-medium' : 'text-gray-600'}`}>
                        {item.title}
                      </button>)}
                  </nav>
                </CardContent>
              </Card>

              {/* CTA Card */}
              <Card className="bg-gradient-to-br from-orange-500 to-pink-500 text-white">
                <CardContent className="p-6 text-center">
                  <h3 className="text-lg font-bold mb-3">立即開始省錢！</h3>
                  <p className="text-sm opacity-90 mb-4">
                    使用以上優惠碼預訂Klook活動，享受更多折扣優惠
                  </p>
                  <Button className="bg-white text-orange-600 hover:bg-gray-100 w-full">
                    前往 Klook
                  </Button>
                </CardContent>
              </Card>

              {/* WhatsApp Share */}
              <Card>
                <CardContent className="p-4 text-center">
                  <Button className="bg-green-500 hover:bg-green-600 text-white w-full" onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(window.location.href)}`, '_blank')}>
                    💬 WhatsApp 分享
                  </Button>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </main>

      {/* Coupon Modal */}
      <CouponModal open={isModalOpen} onOpenChange={setIsModalOpen} coupon={selectedCoupon} />
      
      <Footer />
    </div>;
};

export default MerchantBlog;
