"use client";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CouponCard from "@/components/CouponCard";

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
  merchant: {
    name: string;
    logo: string;
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
    console.log('Coupon clicked:', coupon);
    // TODO: Implement coupon click logic (affiliate link + modal)
  };

  const handleMerchantClick = (merchant: Merchant) => {
    router.push(`/shop/${merchant.slug}`);
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
                <div 
                  key={merchant.id} 
                  className="text-center group cursor-pointer"
                  onClick={() => handleMerchantClick(merchant)}
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg overflow-hidden bg-white p-2 group-hover:shadow-xl transition-shadow">
                    <div className="w-full h-full flex items-center justify-center">
                      <img 
                        src={merchant.logo} 
                        alt={merchant.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">{merchant.name}</h3>
                  <p className="text-xs text-gray-600 leading-tight px-2">{merchant.description}</p>
                </div>
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
                    coupon={coupon}
                    onClick={() => handleCouponClick(coupon)}
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
