"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponModal from "@/components/CouponModal";
import DealySidebar from "@/components/DealySidebar";
import { Button } from "@/components/ui/button";
import DealyCouponCard from "@/components/DealyCouponCard";
import SearchDropdown from "@/components/SearchDropdown";

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
  merchantSlug?: string;
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
  sidebarCategories?: {
    heading: string;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      iconUrl: string;
    }>;
  };
};

interface MerchantSliderProps {
  merchants: PopularMerchant[];
}

// Horizontal auto-scrolling slider component for merchants with infinite loop
const MerchantSlider = ({ merchants }: MerchantSliderProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || merchants.length === 0) return;

    // Clean up any existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
    }

    // Function to perform the scroll
    const performScroll = () => {
      if (!container || isPausedRef.current) return;
      
      const scrollAmount = 1; // Pixels to scroll per step
      const currentScroll = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;

      // If we've reached the end, reset to start for seamless loop
      if (currentScroll >= maxScroll - 1) {
        container.scrollLeft = 0;
      } else {
        container.scrollLeft = currentScroll + scrollAmount;
      }
    };

    // Start auto-scrolling immediately with setInterval
    // Using 16ms ≈ 60fps for smooth animation
    scrollIntervalRef.current = setInterval(performScroll, 16);

    // Cleanup on unmount
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [merchants]);

  // Duplicate merchants for seamless infinite loop
  const duplicatedMerchants = [...merchants, ...merchants];

  return (
    <div className="relative overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex gap-8 overflow-x-auto scrollbar-hide"
        style={{
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        onMouseEnter={() => {
          isPausedRef.current = true;
        }}
        onMouseLeave={() => {
          isPausedRef.current = false;
        }}
      >
        {duplicatedMerchants.map((merchant, index) => (
          <Link
            key={`${merchant.id}-${index}`}
            href={`/shop/${merchant.slug}`}
            className="flex-shrink-0 text-center group cursor-pointer w-[180px]"
          >
            <div className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg overflow-hidden bg-white group-hover:shadow-xl transition-shadow">
              <Image
                src={merchant.logoUrl}
                alt={merchant.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                sizes="96px"
                loading={index < 6 ? "eager" : "lazy"}
              />
            </div>
            <h3 className="font-semibold text-gray-800 text-sm mb-2">{merchant.name}</h3>
            <p className="text-xs text-gray-600 leading-tight px-2">
              {merchant.topCouponTitle || ""}
            </p>
          </Link>
        ))}
      </div>
      
      {/* Fade gradients on edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
    </div>
  );
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
    // Step 1: Open merchant page with coupon popup in new tab (immediate - before navigation)
    if (coupon.merchantSlug) {
      // Extract numeric ID if coupon.id already has "coupon-" prefix
      const couponId = coupon.id.startsWith('coupon-') 
        ? coupon.id.replace('coupon-', '') 
        : coupon.id;
      const merchantUrl = `/shop/${coupon.merchantSlug}#coupon-${couponId}`;
      window.open(merchantUrl, '_blank');
    } else {
      // Fallback: if no merchant slug, open modal for backward compatibility
      const transformedCoupon = transformCoupon(coupon);
      if (!transformedCoupon) {
        console.error('Failed to transform coupon for modal:', coupon);
        return;
      }
      
      setSelectedCoupon(transformedCoupon);
      setIsModalOpen(true);
    }
    
    // Step 2: Redirect current tab to affiliate link (after short delay)
    if (coupon.affiliateLink && coupon.affiliateLink !== '#') {
      setTimeout(() => {
        window.open(coupon.affiliateLink, '_self');
      }, 100);
    }
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

  const handleSearchSubmitFromDropdown = () => {
    // This will be handled by SearchDropdown component
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
              {initialData.hero?.description || "🛍 全台最新優惠情報｜每日更新！ ✨"}
            </div>
            <div className="text-lg">
              💸 精選超過 100+ 熱門網店優惠，折扣、優惠碼、獨家 Promo Code 一次看透！
            </div>
            <div className="text-lg">
              📦 最划算的好康 Deals 任你挑選！ 🧡
            </div>
          </div>
          
          {/* Search Bar - Match original design */}
          <div className="max-w-2xl mx-auto relative z-50">
            <div className="flex bg-white rounded-full shadow-lg overflow-hidden">
              <div className="flex items-center pl-6 pr-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex-1 relative">
                <SearchDropdown 
                  placeholder={initialData.hero?.searchPlaceholder || "搜尋最抵Deal"}
                  className="w-full homepage-search"
                />
              </div>
              <Button 
                type="button"
                onClick={() => {
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement;
                  if (input?.value.trim()) {
                    router.push(`/search?q=${encodeURIComponent(input.value.trim())}`);
                  }
                }}
                className="m-2 px-8 py-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-full"
              >
                搜尋
              </Button>
            </div>
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
            
            {initialData.popularMerchants.items && initialData.popularMerchants.items.length > 0 ? (
              <MerchantSlider merchants={initialData.popularMerchants.items} />
            ) : (
              <div className="w-full text-center py-8">
                <p className="text-gray-500">No merchants available. Please add merchants in Strapi CMS.</p>
              </div>
            )}
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
            
            <div className="flex flex-wrap justify-center gap-8">
              {initialData.categoryBlock.categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/special-offers/${category.slug}`}
                  className="text-center group"
                >
                  <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full shadow-lg group-hover:shadow-xl transition-shadow bg-white flex items-center justify-center">
                    {category.iconUrl ? (
                      <img
                        src={category.iconUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">{category.name}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 font-medium leading-tight">{category.name}</p>
                </Link>
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
                <DealySidebar 
                  popularMerchants={initialData.popularMerchants}
                  sidebarCategories={initialData.sidebarCategories || { heading: "熱門分類", categories: [] }}
                />
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
      
      {/* Footer */}
      <Footer />
      
      {/* Ad Link verification scripts - Only on homepage, before </body> tag */}
      {/* DISABLED: Commented out to prevent continuous POST requests when adlink not enabled */}
      {/* Uncomment when adlink is enabled in CMS */}
      {/*
      <Script id="converly-init" strategy="afterInteractive">
        {`var ConverlyCustomData = {channelId: null};`}
      </Script>
      <Script 
        id="adlink-script"
        src="https://cdn.affiliates.one/production/adlinks/1c6d7c838b3bde9154ede84d8c4ef4ab8420bf1990f82b63a3af81acecfc3323.js"
        strategy="afterInteractive"
      />
      */}
    </div>
  );
};

export default HomePageClient;
