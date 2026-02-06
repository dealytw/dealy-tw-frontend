import Link from "next/link";
import Image from "next/image";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Clock } from "lucide-react";
// Removed Next.js Image import - using regular img tags for fixed resolution
import CategoryCouponsGridClient from "./CategoryCouponsGridClient";

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

interface CategoryBlog {
  id: number | string;
  title: string;
  subtitle: string;
  image: string;
  slug: string;
  publishedAt?: string;
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
  alternateUrl?: string | null;
  categoryBlogs?: CategoryBlog[];
}

export default function CategoryView({ 
  category, 
  merchants, 
  coupons, 
  categorySlug,
  alternateUrl,
  categoryBlogs = []
}: CategoryViewProps) {
  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return '剛剛';
    if (diffHours < 24) return `${diffHours} 小時前`;
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
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

        {/* Coupons Section with Blog Sidebar */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">
            本分類熱門優惠
          </h2>
          
          {coupons.length > 0 ? (
            <>
              {/* If there are blogs, show 2-column layout */}
              {categoryBlogs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column - Coupons */}
                  <div className="lg:col-span-2">
                    <CategoryCouponsGridClient coupons={coupons} gridClassName="grid grid-cols-1 md:grid-cols-2 gap-6" />
                  </div>

                  {/* Right Column - Blog Sidebar (Desktop) */}
                  <aside className="lg:col-span-1">
                    <div className="sticky top-8">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">
                        相關文章
                      </h3>
                      <div className="space-y-4">
                        {categoryBlogs.map((blog) => (
                          <Link key={blog.id} href={`/blog/${blog.slug}`} className="block group">
                            <article className="space-y-3">
                              <div className="relative h-32 rounded-lg overflow-hidden">
                                <Image
                                  src={blog.image}
                                  alt={blog.title}
                                  fill
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-pink-600 transition-colors">
                                  {blog.title}
                                </h4>
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{blog.subtitle}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span suppressHydrationWarning>{formatDate(blog.publishedAt)}</span>
                                </div>
                              </div>
                            </article>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </aside>
                </div>
              ) : (
                /* If no blogs, show original single-column layout */
                <CategoryCouponsGridClient coupons={coupons} gridClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
              )}

              {/* Blog Sidebar (Mobile - Stacked at bottom) */}
              {categoryBlogs.length > 0 && (
                <div className="mt-8 lg:hidden">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    相關文章
                  </h3>
                  <div className="space-y-4">
                    {categoryBlogs.map((blog) => (
                      <Link key={blog.id} href={`/blog/${blog.slug}`} className="block group">
                        <article className="space-y-3">
                          <div className="relative h-40 rounded-lg overflow-hidden">
                            <Image
                              src={blog.image}
                              alt={blog.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-pink-600 transition-colors">
                              {blog.title}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{blog.subtitle}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span suppressHydrationWarning>{formatDate(blog.publishedAt)}</span>
                            </div>
                          </div>
                        </article>
                      </Link>
                    ))}
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
      
      <Footer alternateUrl={alternateUrl} />
    </div>
  );
}
