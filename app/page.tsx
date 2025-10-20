"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import CouponModal from "@/components/CouponModal";
import DealySidebar from "@/components/DealySidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CouponCard from "@/components/CouponCard";
import { Search } from "lucide-react";

// Types matching homepage-code-usage.json
type PopularMerchant = {
  id: number;
  name: string;
  slug: string;
  logoUrl: string;
  description: string;
  topCouponTitle?: string;
};

type CategoryBadge = {
  id: number;
  name: string;
  slug: string;
  iconUrl: string;
};

type CouponRailItem = {
  id: string;
  merchantId: string;
  logo: string;
  discount: string;
  type: string;
  couponType: "coupon" | "promo_code" | "auto_discount";
  title: string;
  timeLeft?: string;
  usageCount: number;
  description: string;
  terms?: string;
  code?: string;
  affiliateLink: string;
  expiresAt?: string; // Raw expiry date for client-side calculation
};

type HomePageData = {
  seo: {
    title: string;
    description: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    bgUrl: string;
    searchPlaceholder: string;
  };
  popularMerchants: {
    heading: string;
    items: PopularMerchant[];
  };
  categoryBlock: {
    heading: string;
    categories: CategoryBadge[];
    disclaimer: string;
  };
  couponRail: {
    heading: string;
    items: CouponRailItem[];
  };
};

const Index = () => {
  const router = useRouter();
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());
  const [homepageData, setHomepageData] = useState<HomePageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate time left on client side to avoid hydration mismatch
  const calculateTimeLeft = (expiresAt?: string): string | null => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    
    if (expiry <= now) return null;
    
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${diffHours} 小時 ${diffMinutes} 分 ${diffSeconds} 秒`;
  };

  // Fetch homepage data from CMS
  useEffect(() => {
    async function fetchHomepageData() {
      try {
        const response = await fetch('/api/homepage');
        const result = await response.json();
        if (result.ok && result.data) {
          setHomepageData(result.data);
        } else {
          throw new Error('Invalid API response');
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
        // Fallback to mock data if CMS fails
        setHomepageData({
          seo: {
            title: "Dealy.TW 台灣每日最新優惠折扣平台",
            description: "台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡"
          },
          hero: {
            title: "Dealy.TW 台灣每日最新優惠折扣平台",
            subtitle: "NEVER Pay Full Price",
            description: "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡",
            bgUrl: "",
            searchPlaceholder: "搜尋最抵Deal"
          },
          popularMerchants: {
            heading: "台灣最新折扣優惠",
            items: []
          },
          categoryBlock: {
            heading: "2025優惠主題一覽",
            categories: [],
            disclaimer: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。"
          },
          couponRail: {
            heading: "今日最新最受歡迎優惠券/Promo Code/優惠碼",
            items: []
          }
        });
      } finally {
        setLoading(false);
      }
    }

    fetchHomepageData();
  }, []);

  const handleCouponClick = (coupon: CouponRailItem) => {
    if (coupon.couponType === "promo_code" && !revealedCodes.has(coupon.id)) {
      // Just reveal the code, don't open modal yet
      setRevealedCodes(prev => new Set(prev).add(coupon.id));
      return;
    }
    
    // Open affiliate link in same tab
    window.open(coupon.affiliateLink, '_self');
    
    // Open merchant page in new tab with coupon hash for popup and auto-scroll
    setTimeout(() => {
      window.open(`/shop/${coupon.merchantId}#coupon-${coupon.id}`, '_blank');
    }, 100);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const query = formData.get('search') as string;
    if (query && query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  if (!homepageData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg text-red-600">載入失敗</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* CMS: hero.background - with fallback */}
      <section className="py-16 px-4" style={{
        backgroundImage: homepageData.hero?.bgUrl ? `url(${homepageData.hero.bgUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="container mx-auto text-center">
          {/* CMS: hero.title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {homepageData.hero?.title || "Dealy.TW 台灣每日最新優惠折扣平台"}
          </h1>
          {/* CMS: hero.subtitle */}
          <div className="text-2xl font-semibold text-gray-700 mb-6">
            {homepageData.hero?.subtitle || "NEVER Pay Full Price"}
          </div>
          <div className="space-y-2 text-gray-700 mb-8">
            <div className="text-lg">
              {homepageData.hero?.description || "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡"}
            </div>
            <div className="text-lg">
              📦 超過 100+ 熱門商店優惠 💸折扣、優惠碼、獨家Promo Code 一次睇哂！
            </div>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <form onSubmit={handleSearchSubmit} className="flex bg-white rounded-full shadow-lg overflow-hidden">
              <div className="flex items-center pl-6 pr-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                name="search"
                placeholder={homepageData.hero?.searchPlaceholder || "搜尋最抵Deal"}
                className="flex-1 py-4 px-2 text-lg outline-none"
                required
              />
              <Button 
                type="submit"
                className="m-2 px-8 py-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-full"
              >
                搜尋
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Popular Merchants */}
      {homepageData.popularMerchants && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            {/* CMS: popularstore.heading */}
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
              {homepageData.popularMerchants?.heading || "台灣最新折扣優惠"}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-8">
              {homepageData.popularMerchants.items && homepageData.popularMerchants.items.length > 0 ? (
                homepageData.popularMerchants.items.map((merchant) => (
                  <div 
                    key={merchant.id} 
                    className="text-center group cursor-pointer"
                    onClick={() => window.location.href = `/shop/${merchant.slug}`}
                  >
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg overflow-hidden bg-white p-2 group-hover:shadow-xl transition-shadow">
                      <div className="w-full h-full flex items-center justify-center">
                                    <img
                                      src={merchant.logoUrl}
                                      alt={merchant.name}
                                      className="max-w-full max-h-full object-contain"
                                    />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">{merchant.name}</h3>
                    <p className="text-xs text-gray-600 leading-tight px-2">
                      {merchant.topCouponTitle || merchant.description}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-500">No merchants available. Please add merchants in Strapi CMS.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Category Block */}
      {homepageData.categoryBlock?.categories && homepageData.categoryBlock.categories.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto">
            {/* CMS: category.heading */}
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
              {homepageData.categoryBlock?.heading || "2025優惠主題一覽"}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
              {homepageData.categoryBlock.categories.map((category) => (
                <div key={category.id} className="text-center group cursor-pointer">
                  <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full shadow-lg group-hover:shadow-xl transition-shadow bg-white flex items-center justify-center">
                                  <img
                                    src={category.iconUrl}
                                    alt={category.name}
                                    className="w-full h-full object-cover"
                                  />
                  </div>
                  <p className="text-sm text-gray-700 font-medium leading-tight">{category.name}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <p className="text-sm text-gray-600">
                {homepageData.categoryBlock.disclaimer}
                <a href="#" className="text-blue-600 hover:underline ml-1">了解更多</a>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Coupon Rail */}
      {homepageData.couponRail?.items && homepageData.couponRail.items.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            {/* CMS: coupon.heading */}
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
              {homepageData.couponRail?.heading || "今日最新最受歡迎優惠券/Promo Code/優惠碼"}
            </h2>
            
            <div className="flex gap-8">
              {/* Main Content */}
              <div className="flex-1 space-y-8">
                {homepageData.couponRail.items.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={{
                      id: coupon.id,
                      coupon_title: coupon.title,
                      coupon_type: coupon.couponType,
                      value: coupon.discount,
                      code: coupon.code,
                      expires_at: coupon.expiresAt,
                      user_count: coupon.usageCount,
                      description: coupon.description,
                      editor_tips: coupon.terms,
                      affiliate_link: coupon.affiliateLink,
                      merchant: {
                        name: coupon.title.split(' ')[0], // Extract merchant name from title
                        logo: coupon.logo,
                      },
                    }}
                    onGetCode={(couponData) => {
                      if (couponData.affiliate_link) {
                        window.open(couponData.affiliate_link, '_blank');
                      }
                    }}
                  />
                ))}
              </div>
              {/* Sidebar */}
              <div className="hidden lg:block">
                <DealySidebar />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Coupon Modal */}
      <CouponModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        coupon={selectedCoupon}
      />
    </div>
  );
};

export default Index;