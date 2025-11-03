// app/category/[categorySlug]/page.tsx - Server Component with ISR
import { notFound } from 'next/navigation';
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import CategoryView from './category-view';

export const revalidate = 3600; // ISR - revalidate every 1 hour

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ categorySlug: string }> 
}) {
  const { categorySlug } = await params;
  
  try {
    // Fetch category SEO data from Strapi
    const categoryData = await strapiFetch<{ data: any[] }>(
      `/api/categories?filters[slug][$eq]=${categorySlug}&fields[0]=name&fields[1]=slug&fields[2]=seo_title&fields[3]=seo_description`,
      { revalidate: 3600, tag: `category:${categorySlug}` }
    );
    
    const category = categoryData?.data?.[0];
    
    if (category) {
      const title = category.seo_title || `${category.name} 優惠與折扣`;
      const description = category.seo_description || `精選 ${category.name} 最新優惠與折扣合集。`;
      
      return pageMeta({
        title,
        description,
        path: `/category/${categorySlug}`,
      });
    }
  } catch (error) {
    console.error('Error fetching category SEO data:', error);
  }
  
  // Fallback metadata
  const categoryMap: { [key: string]: string } = {
    'travel': '旅遊',
    'food': '美食', 
    'shopping': '購物',
    'entertainment': '娛樂',
    'lifestyle': '生活'
  };
  
  const categoryName = categoryMap[categorySlug] || categorySlug;
  
  return pageMeta({
    title: `${categoryName} 優惠與折扣`,
    description: `精選 ${categoryName} 最新優惠與折扣合集。`,
    path: `/category/${categorySlug}`,
  });
}

export default async function CategoryPage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ categorySlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { categorySlug } = await params;
  const { page } = await searchParams;
  const pageNum = Number(page || 1);
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

  try {
    // Fetch category data
    const categoryData = await strapiFetch<{ data: any[] }>(
      `/api/categories?filters[slug][$eq]=${categorySlug}&fields[0]=id&fields[1]=name&fields[2]=slug&fields[3]=summary`,
      { revalidate: 3600, tag: `category:${categorySlug}` }
    );

    const category = categoryData?.data?.[0];
    
    if (!category) {
      notFound();
    }

    // Fetch merchants for this category
    const merchantParams = {
      "filters[categories][slug][$eq]": categorySlug,
      "filters[market][key][$eq]": market, // Market relation filter
      "fields[0]": "id",
      "fields[1]": "merchant_name", 
      "fields[2]": "slug",
      "fields[3]": "summary",
      "sort": "merchant_name:asc",
      "pagination[page]": "1",
      "pagination[pageSize]": "20",
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const merchantsData = await strapiFetch<{ data: any[] }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 3600, tag: `category:${categorySlug}` }
    );

    // Fetch paginated coupons for this category
    const couponParams = {
      "filters[categories][slug][$eq]": categorySlug,
      "filters[market][key][$eq]": market, // Market relation filter
      "filters[coupon_status][$eq]": "active",
      "fields[0]": "id",
      "fields[1]": "coupon_title",
      "fields[2]": "coupon_type", 
      "fields[3]": "value",
      "fields[4]": "code",
      "fields[5]": "expires_at",
      "fields[6]": "user_count",
      "fields[7]": "description",
      "fields[8]": "affiliate_link",
      "fields[9]": "priority",
      "fields[10]": "last_click_at",
      "sort[0]": "priority:desc",
      "sort[1]": "last_click_at:desc",
      "pagination[page]": String(pageNum),
      "pagination[pageSize]": "20",
      "populate[merchant][fields][0]": "id",
      "populate[merchant][fields][1]": "merchant_name",
      "populate[merchant][fields][2]": "slug",
      "populate[merchant][populate][logo][fields][0]": "url",
    };

    const couponsData = await strapiFetch<{ data: any[]; meta: any }>(
      `/api/coupons?${qs(couponParams)}`,
      { revalidate: 3600, tag: `category:${categorySlug}` }
    );

    // Transform merchants data
    const merchants = (merchantsData?.data || []).map((merchant: any) => ({
      id: merchant.id.toString(),
      name: merchant.merchant_name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
      description: merchant.summary || "",
    }));

    // Transform coupons data
    const coupons = (couponsData?.data || []).map((coupon: any) => ({
      id: coupon.id.toString(),
      code: coupon.code || "",
      title: coupon.coupon_title || 'Untitled Coupon',
      description: coupon.description || "",
      discount: coupon.value || "",
      expiry: coupon.expires_at || "長期有效",
      usageCount: coupon.user_count || 0,
      merchant: {
        name: coupon.merchant?.merchant_name || 'Unknown Merchant',
        logo: coupon.merchant?.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "/api/placeholder/60/60",
      },
    }));

    return (
      <CategoryView 
        category={category}
        merchants={merchants}
        coupons={coupons}
        pagination={couponsData?.meta?.pagination}
        categorySlug={categorySlug}
      />
    );

  } catch (error) {
    console.error('Error fetching category data:', error);
    notFound();
  }
}