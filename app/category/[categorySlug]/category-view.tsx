"use client";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryCouponCard from "@/components/CategoryCouponCard";
// Removed Next.js Image import - using regular img tags for fixed resolution

interface Merchant {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  firstCouponTitle?: string | null;
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
  categorySlug: string;
}

export default function CategoryView({ 
  category, 
  merchants, 
  coupons, 
  categorySlug 
}: CategoryViewProps) {


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
              本分類熱門商戶
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6">
              {merchants.map((merchant) => (
                <Link
                  key={merchant.id}
                  href={`/shop/${merchant.slug}`}
                  className="text-center group"
                >
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full shadow-lg overflow-hidden bg-white group-hover:shadow-xl transition-shadow">
                    <img 
                      src={merchant.logo} 
                      alt={merchant.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">{merchant.name}</h3>
                  {merchant.firstCouponTitle && (
                    <p className="text-xs text-gray-600 leading-tight px-2">{merchant.firstCouponTitle}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Coupons Section */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            本分類熱門優惠
          </h2>
          
          {coupons.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <CategoryCouponCard
                    key={coupon.id}
                    coupon={{
                      id: coupon.id,
                      title: coupon.title,
                      code: coupon.code,
                      discount: coupon.discount,
                      coupon_type: coupon.coupon_type,
                      affiliate_link: coupon.affiliate_link,
                      merchant: {
                        name: coupon.merchant.name,
                        logo: coupon.merchant.logo,
                        slug: coupon.merchant.slug,
                      },
                    }}
                  />
                ))}
              </div>
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
