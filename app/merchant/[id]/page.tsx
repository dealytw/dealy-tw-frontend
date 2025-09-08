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

// Using typed Merchant from lib/types

const Merchant = () => {
  const params = useParams();
  const id = params?.id as string;
  const [merchant, setMerchant] = useState<TransformedShop | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [activeSection, setActiveSection] = useState("");
  const [loading, setLoading] = useState(true);

  const filters = ["全部", "最新優惠", "日本", "韓國", "本地", "內地", "信用卡"];

  // Fetch merchant data from Strapi
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        const response = await fetch(`/api/merchants/${id}`, {
          // Add cache control for preview mode
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMerchant(data);
      } catch (error) {
        console.error('Error fetching merchant:', error);
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
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMerchant();
    }
  }, [id]);

  // Auto-scroll to section based on hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(hash.substring(1));
      }
    }
  }, []);

  const handleCouponClick = (coupon: any) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      window.history.pushState(null, '', `#${sectionId}`);
    }
  };

  if (loading) {
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

  if (!merchant) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto py-12">
          <div className="text-center">Merchant not found</div>
        </div>
        <Footer />
      </div>
    );
  }

  // Render based on pageLayout from Strapi
  if (merchant.pageLayout === "blog") {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        
        {/* Blog Layout */}
        <div className="container mx-auto py-8">
          <div className="flex gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Blog Article */}
              <article className="prose prose-lg max-w-none">
                <header className="mb-8">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {merchant.name} 最新優惠資訊與使用攻略
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/api/placeholder/32/32" />
                        <AvatarFallback>DE</AvatarFallback>
                      </Avatar>
                      <span>Dealy編輯部</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>2025年9月7日</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>5分鐘閱讀</span>
                    </div>
                  </div>
                </header>

                {/* Blog Content */}
                <div className="space-y-6">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    {merchant.description}
                  </p>
                  
                  <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
                    最新優惠活動
                  </h2>
                  
                  <p className="text-gray-700 leading-relaxed">
                    以下是 {merchant.name} 目前最新的優惠活動和使用攻略，幫助你獲得最佳折扣。
                  </p>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                    優惠碼使用方法
                  </h3>
                  
                  <ol className="list-decimal list-inside space-y-2 text-gray-700">
                    <li>前往 {merchant.name} 官方網站</li>
                    <li>選擇你想要的商品或服務</li>
                    <li>在結帳頁面輸入優惠碼</li>
                    <li>確認折扣已套用後完成付款</li>
                  </ol>

                  <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
                    注意事項
                  </h3>
                  
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>優惠碼可能有使用期限</li>
                    <li>部分商品可能不適用優惠</li>
                    <li>優惠不可與其他促銷活動同時使用</li>
                    <li>最終優惠以官方網站為準</li>
                  </ul>
                </div>
              </article>

              {/* Related Coupons */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {merchant.name} 相關優惠
                </h2>
                <div className="space-y-6">
                  {/* Sample coupon for blog layout */}
                  <DealyCouponCard
                    coupon={{
                      id: "blog-coupon-1",
                      title: `${merchant.name} 限時優惠｜新用戶專享折扣`,
                      description: "新用戶註冊即可享受特別優惠，立即體驗優質服務",
                      discount: "8折",
                      discountValue: "8",
                      expiry: "2025-12-31",
                      usageCount: 128,
                      merchant: {
                        name: merchant.name,
                        logo: getMerchantLogo(merchant)
                      },
                      affiliateLink: merchant.affiliateLink
                    }}
                    onClick={() => handleCouponClick({
                      id: "blog-coupon-1",
                      code: "NEWUSER20",
                      title: `${merchant.name} 限時優惠｜新用戶專享折扣`,
                      description: "新用戶註冊即可享受特別優惠",
                      discount: "8折",
                      expiry: "2025-12-31",
                      merchant: {
                        name: merchant.name,
                        logo: getMerchantLogo(merchant)
                      },
                      affiliateLink: merchant.affiliateLink
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block w-80">
              <MerchantSidebar merchantId={id} />
            </div>
          </div>
        </div>

        <Footer />
        
        {/* Coupon Modal */}
        <CouponModal 
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          coupon={selectedCoupon}
        />
      </div>
    );
  }

  // Default: Coupon Layout
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* Coupon Layout */}
      <div className="container mx-auto py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1">
            {/* Merchant Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <Image 
                  src={getMerchantLogo(merchant)} 
                  alt={merchant.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{merchant.name}</h1>
                  <p className="text-gray-600">{merchant.website}</p>
                </div>
              </div>
              <p className="text-gray-700">{merchant.description}</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {filters.map((filter) => (
                <Button
                  key={filter}
                  variant={activeFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </Button>
              ))}
            </div>

            {/* Coupons */}
            <div className="space-y-6">
              {/* Sample coupons */}
              <DealyCouponCard
                coupon={{
                  id: "coupon-1",
                  title: `${merchant.name} 限時優惠｜新用戶專享折扣`,
                  description: "新用戶註冊即可享受特別優惠，立即體驗優質服務",
                  discount: "8折",
                  discountValue: "8",
                  expiry: "2025-12-31",
                  usageCount: 128,
                  merchant: {
                    name: merchant.name,
                    logo: merchant.logo
                  },
                  affiliateLink: merchant.affiliateLink
                }}
                onClick={() => handleCouponClick({
                  id: "coupon-1",
                  code: "NEWUSER20",
                  title: `${merchant.name} 限時優惠｜新用戶專享折扣`,
                  description: "新用戶註冊即可享受特別優惠",
                  discount: "8折",
                  expiry: "2025-12-31",
                  merchant: {
                    name: merchant.name,
                    logo: merchant.logo
                  },
                  affiliateLink: merchant.affiliateLink
                })}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-80">
            <MerchantSidebar merchantId={id} />
          </div>
        </div>
      </div>

      <Footer />
      
      {/* Coupon Modal */}
      <CouponModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        coupon={selectedCoupon}
      />
    </div>
  );
};

export default Merchant;