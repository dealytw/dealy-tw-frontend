"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponModal from "@/components/CouponModal";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import CouponCard from "@/components/CouponCard";
import { Search, X, Store, Tag, ArrowLeft } from "lucide-react";
import Image from "next/image";

type SearchResult = {
  merchants: Array<{
    id: number;
    name: string;
    slug: string;
    logo: string;
    description: string;
    website: string;
    affiliateLink: string;
    market: string;
    type: 'merchant';
  }>;
  coupons: Array<{
    id: string;
    title: string;
    description: string;
    value: string;
    code: string;
    coupon_type: string;
    expires_at: string;
    user_count: number;
    affiliate_link: string;
    merchant: {
      id: number;
      name: string;
      slug: string;
      logo: string;
    };
    type: 'coupon';
  }>;
  query: string;
  totalResults: number;
};

interface SearchResultsProps {
  searchResults: SearchResult;
  query: string;
}

export default function SearchResults({ searchResults, query }: SearchResultsProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(query);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCouponClick = (coupon: any) => {
    // Track coupon click for GTM/GA4
    if (typeof window !== 'undefined') {
      const { trackCouponClick } = require('@/lib/analytics');
      trackCouponClick({
        couponId: coupon.id.toString(),
        couponTitle: coupon.title,
        couponCode: coupon.code,
        merchantName: coupon.merchant.name,
        merchantSlug: coupon.merchant.slug,
        affiliateLink: coupon.affiliate_link || '#',
        couponType: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
        clickSource: 'button',
        pageLocation: window.location.pathname,
      });
    }
    
    // Open affiliate link in same tab
    window.open(coupon.affiliate_link, '_self');
    
    // Open merchant page in new tab with coupon hash for popup and auto-scroll
    setTimeout(() => {
      window.open(`/shop/${coupon.merchant.slug}#coupon-${coupon.id}`, '_blank');
    }, 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Button>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <form onSubmit={handleSearchSubmit} className="flex bg-white rounded-full shadow-lg overflow-hidden border">
            <div className="flex items-center pl-6 pr-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋超值好康"
              className="flex-1 py-4 px-2 text-lg outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  router.push('/search');
                }}
                className="flex items-center px-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <Button 
              type="submit"
              className="m-2 px-8 py-2 bg-gradient-to-r from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-full"
            >
              搜尋
            </Button>
          </form>
        </div>

        {/* Search Results */}
        {searchResults.query && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-800">
                搜尋結果: "{searchResults.query}"
              </h1>
              <div className="text-gray-600">
                共找到 {searchResults.totalResults} 個結果
              </div>
            </div>
            
            {searchResults.totalResults === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">找不到相關結果</p>
                <p className="text-gray-500 text-sm mt-2">請嘗試其他關鍵字</p>
              </div>
            ) : (
              <div className="space-y-12">
                {/* Merchants Results */}
                {searchResults.merchants.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
                      <Store className="h-6 w-6" />
                      商店 ({searchResults.merchants.length})
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                      {searchResults.merchants.map((merchant) => (
                        <Link
                          key={merchant.id}
                          href={`/shop/${merchant.slug}`}
                        >
                          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                            <div className="p-6 text-center">
                              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-white p-2">
                                <Image
                                  src={merchant.logo}
                                  alt={merchant.name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-contain"
                                  sizes="80px"
                                  loading="lazy"
                                />
                              </div>
                              <h3 className="font-semibold text-gray-800 text-sm mb-2">{merchant.name}</h3>
                              <p className="text-xs text-gray-600 line-clamp-3">{merchant.description}</p>
                            </div>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coupons Results */}
                {searchResults.coupons.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
                      <Tag className="h-6 w-6" />
                      優惠券 ({searchResults.coupons.length})
                    </h2>
                    <div className="space-y-6">
                      {searchResults.coupons.map((coupon) => (
                        <CouponCard
                          key={coupon.id}
                          coupon={{
                            id: coupon.id,
                            coupon_title: coupon.title,
                            coupon_type: coupon.coupon_type,
                            value: coupon.value,
                            code: coupon.code,
                            expires_at: coupon.expires_at,
                            user_count: coupon.user_count,
                            description: coupon.description,
                            editor_tips: "",
                            affiliate_link: coupon.affiliate_link,
                            merchant: {
                              name: coupon.merchant.name,
                              logo: coupon.merchant.logo,
                            },
                          }}
                          onGetCode={(couponData) => {
                            handleCouponClick(coupon);
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!searchResults.query && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">請輸入搜尋關鍵字</p>
          </div>
        )}
      </main>

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
