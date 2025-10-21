"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import CouponModal from "@/components/CouponModal";
import DealySidebar from "@/components/DealySidebar";
import { Button } from "@/components/ui/button";
import DealyCouponCard from "@/components/DealyCouponCard";
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

interface HomePageClientProps {
  initialData: HomePageData;
}

const HomePageClient = ({ initialData }: HomePageClientProps) => {
  const router = useRouter();
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedCodes, setRevealedCodes] = useState<Set<string>>(new Set());

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

  // Transform CMS coupons to DealyCouponCard format (same as merchant page)
  const transformCoupon = (coupon: any) => {
    // Add null safety checks
    if (!coupon) {
      console.error('transformCoupon: coupon is null or undefined');
      return null;
    }

    // Handle different data structures - homepage vs merchant page
    let merchantData;
    if (coupon.merchant) {
      // Merchant page structure
      merchantData = coupon.merchant;
    } else if (coupon.merchantId) {
      // Homepage structure - create merchant object from available data
      merchantData = {
        merchant_name: coupon.title?.split(' ')[0] || 'Unknown Merchant',
        logo: coupon.logo || '',
      };
    } else {
      console.warn('transformCoupon: no merchant data found, using fallback', coupon.id);
      merchantData = {
        merchant_name: 'Unknown Merchant',
        logo: '',
      };
    }

    // Handle null/undefined values safely
    const value = coupon.discount || '';
    // Enhanced regex to handle currencies: TWD, HKD, USD, etc. and symbols: $, ¥, €, etc.
    const currencyPattern = /(\d+)\s*(?:TWD|HKD|USD|EUR|JPY|CNY|SGD|MYR|THB|PHP|IDR|VND|KRW|INR|AUD|CAD|GBP|CHF|NZD|SEK|NOK|DKK|PLN|CZK|HUF|RUB|BRL|MXN|ARS|CLP|COP|PEN|UYU|VEF|ZAR|TRY|ILS|AED|SAR|QAR|KWD|BHD|OMR|JOD|LBP|EGP|MAD|TND|DZD|NGN|KES|UGX|TZS|ZMW|BWP|MWK|MZN|AOA|XOF|XAF|XPF|MUR|SCR|KMF|DJF|ERN|ETB|SOS|SLL|GMD|GNF|LRD|CDF|RWF|BIF|CVE|STN|SZL|LSL|NAD|BND|FJD|PGK|SBD|TOP|VUV|WST|TVD|KID|NPR|BTN|MVR|AFN|PKR|LKR|BDT|MMK|LAK|KHR|MOP)?\s*\$?\s*(%|折|off|減|扣|折|優惠)/i;
    const discountValue = value ? value.replace(currencyPattern, '$1') : '0';
    
    return {
      id: coupon.id,
      code: coupon.code || '',
      title: coupon.title || 'Untitled Coupon',
      description: coupon.description || '',
      discount: value,
      discountValue: discountValue,
      expiry: coupon.expiresAt || "長期有效",
      usageCount: coupon.usageCount || 0,
      steps: coupon.description || '',
      terms: coupon.terms || '',
      affiliateLink: coupon.affiliateLink || '#',
      coupon_type: coupon.couponType,
      merchant: {
        name: merchantData.merchant_name || merchantData.name || 'Unknown Merchant',
        logo: merchantData.logo || '',
      }
    };
  };

  const handleCouponClick = (coupon: CouponRailItem) => {
    // Transform the coupon for the modal using the same transformation as DealyCouponCard
    const transformedCoupon = transformCoupon(coupon);
    if (!transformedCoupon) {
      console.error('Failed to transform coupon for modal:', coupon);
      return;
    }
    
    // Set the modal data
    setSelectedCoupon(transformedCoupon);
    setIsModalOpen(true);
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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      {/* CMS: hero.background - with fallback */}
      <section className="py-16 px-4" style={{
        backgroundImage: initialData.hero?.bgUrl ? `url(${initialData.hero.bgUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="container mx-auto text-center">
          {/* CMS: hero.title */}
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {initialData.hero?.title || "Dealy.TW 台灣每日最新優惠折扣平台"}
          </h1>
          {/* CMS: hero.subtitle */}
          <div className="text-2xl font-semibold text-gray-700 mb-6">
            {initialData.hero?.subtitle || "NEVER Pay Full Price"}
          </div>
          <div className="space-y-2 text-gray-700 mb-8">
            <div className="text-lg">
              {initialData.hero?.description || "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡"}
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
                placeholder={initialData.hero?.searchPlaceholder || "搜尋最抵Deal"}
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
      {initialData.popularMerchants && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            {/* CMS: popularstore.heading */}
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
              {initialData.popularMerchants?.heading || "台灣最新折扣優惠"}
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-8">
              {initialData.popularMerchants.items && initialData.popularMerchants.items.length > 0 ? (
                initialData.popularMerchants.items.map((merchant) => (
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
      {initialData.categoryBlock?.categories && initialData.categoryBlock.categories.length > 0 && (
        <section className="py-12 px-4 bg-gray-50">
          <div className="container mx-auto">
            {/* CMS: category.heading */}
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
              {initialData.categoryBlock?.heading || "2025優惠主題一覽"}
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-8">
              {initialData.categoryBlock.categories.map((category) => (
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
                {initialData.categoryBlock.disclaimer}
                <a href="#" className="text-blue-600 hover:underline ml-1">了解更多</a>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Coupon Rail */}
      {initialData.couponRail?.items && initialData.couponRail.items.length > 0 && (
        <section className="py-12 px-4">
          <div className="container mx-auto">
            {/* CMS: coupon.heading */}
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
              {initialData.couponRail?.heading || "今日最新最受歡迎優惠券/Promo Code/優惠碼"}
            </h2>
            
            <div className="flex gap-8">
              {/* Main Content */}
              <div className="flex-1 space-y-8">
                {initialData.couponRail.items.map((coupon) => {
                  const transformedCoupon = transformCoupon(coupon);
                  if (!transformedCoupon) {
                    console.error('Skipping invalid coupon:', coupon);
                    return null;
                  }
                  return (
                    <div key={coupon.id} id={`coupon-${coupon.id}`}>
                      <DealyCouponCard 
                        coupon={transformedCoupon} 
                        onClick={() => handleCouponClick(coupon)}
                        isScrolledTo={false}
                      />
                    </div>
                  );
                }).filter(Boolean)}
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

export default HomePageClient;
