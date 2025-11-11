"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponCard from "@/components/CouponCard";
import Image from "next/image";

interface Merchant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
}

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  expiry: string;
  usageCount: number;
  affiliate_link?: string;
  coupon_type?: string;
  merchant: {
    name: string;
    logo: string;
    slug?: string;
  };
}

interface CategoryViewProps {
  category: {
    id: number;
    name: string;
    slug: string;
    summary?: string;
  };
  merchants: Merchant[];
  coupons: Coupon[];
  pagination?: {
    page: number;
    pageSize: number;
    pageCount: number;
    total: number;
  };
  categorySlug: string;
}

export default function CategoryView({ 
  category, 
  merchants, 
  coupons, 
  pagination,
  categorySlug 
}: CategoryViewProps) {
  const router = useRouter();

  const handleCouponClick = (coupon: Coupon) => {
    // Track coupon click for GTM/GA4
    if (typeof window !== 'undefined') {
      const { trackCouponClick } = require('@/lib/analytics');
      trackCouponClick({
        couponId: coupon.id,
        couponTitle: coupon.title,
        couponCode: coupon.code,
        merchantName: coupon.merchant.name,
        merchantSlug: coupon.merchant.slug || '',
        affiliateLink: coupon.affiliate_link || '#',
        couponType: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'discount',
        clickSource: 'button',
        pageLocation: window.location.pathname,
      });
    }
    
    // Open affiliate link in same tab
    if (coupon.affiliate_link && coupon.affiliate_link !== '#') {
      window.open(coupon.affiliate_link, '_self');
    }
    
    // Open merchant page in new tab if merchant slug is available
    if (coupon.merchant.slug) {
      setTimeout(() => {
        window.open(`/shop/${coupon.merchant.slug}#coupon-${coupon.id}`, '_blank');
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Category Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {category.name}
          </h1>
          {category.summary && (
            <p className="text-gray-600">{category.summary}</p>
          )}
        </div>

        {/* Popular Merchants Section */}
        {merchants.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-12 text-gray-800">
              熱門商店
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-8">
              {merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/shop/${merchant.slug}`}
                  className="text-center group"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg overflow-hidden bg-white p-2 group-hover:shadow-xl transition-shadow">
                    <div className="w-full h-full flex items-center justify-center">
                      <Image 
                        src={merchant.logo} 
                        alt={merchant.name}
                        width={96}
                        height={96}
                        className="max-w-full max-h-full object-contain"
                        sizes="96px"
                        loading="lazy"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">{merchant.name}</h3>
                  <p className="text-xs text-gray-600 leading-tight px-2">{merchant.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Coupons Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            {category.name}優惠券
          </h2>
          
          {coupons.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <CouponCard
                    key={coupon.id}
                    coupon={{
                      id: coupon.id,
                      coupon_title: coupon.title,
                      coupon_type: (coupon.coupon_type || 'promo_code') as 'promo_code' | 'coupon' | 'auto_discount',
                      value: coupon.discount,
                      code: coupon.code,
                      expires_at: coupon.expiry,
                      user_count: coupon.usageCount,
                      description: coupon.description,
                      affiliate_link: coupon.affiliate_link || '#',
                      merchant: {
                        name: coupon.merchant.name,
                        logo: coupon.merchant.logo,
                      },
                    }}
                    onGetCode={() => handleCouponClick(coupon)}
                  />
                ))}
              </div>
              
              {/* Pagination */}
              {pagination && pagination.pageCount > 1 && (
                <div className="mt-8 flex justify-center">
                  <div className="flex gap-2">
                    {pagination.page > 1 && (
                      <button
                        onClick={() => router.push(`/category/${categorySlug}?page=${pagination.page - 1}`)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        上一頁
                      </button>
                    )}
                    
                    <span className="px-4 py-2 bg-pink-500 text-white rounded">
                      {pagination.page} / {pagination.pageCount}
                    </span>
                    
                    {pagination.page < pagination.pageCount && (
                      <button
                        onClick={() => router.push(`/category/${categorySlug}?page=${pagination.page + 1}`)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        下一頁
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">暫無優惠券</p>
              <p className="text-gray-500 text-sm mt-2">請稍後再來查看</p>
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
