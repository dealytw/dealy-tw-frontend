// app/category/[categorySlug]/page.tsx - Server Component with ISR
import { notFound } from 'next/navigation';
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import CategoryView from './category-view';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';

export const revalidate = 3600; // ISR - revalidate every 1 hour

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ categorySlug: string }> 
}) {
  const { categorySlug } = await params;
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  
  try {
    // Fetch category SEO data from Strapi by page_slug (page_slug is unique)
    const categoryData = await strapiFetch<{ data: any[] }>(
      `/api/categories?${qs({
        "filters[page_slug][$eq]": categorySlug,
        "fields[0]": "name",
        "fields[1]": "page_slug",
        "fields[2]": "seo_title",
        "fields[3]": "seo_description",
      })}`,
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
  params
}: { 
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

  try {
    // Use server-only Strapi fetch with ISR - copy exact pattern from merchant page
    const categoryRes = await strapiFetch<{ data: any[] }>(`/api/categories?${qs({
      "filters[page_slug][$eq]": categorySlug,
      "fields[0]": "id",
      "fields[1]": "name",
      "fields[2]": "page_slug",
      "fields[3]": "summary",
      "populate[merchants][fields][0]": "id",
      "populate[merchants][fields][1]": "merchant_name",
      "populate[merchants][fields][2]": "page_slug",
      "populate[merchants][fields][3]": "summary",
      "populate[merchants][populate][logo][fields][0]": "url",
      "populate[merchants][populate][market][fields][0]": "key",
    })}`, { 
      revalidate: 3600, 
      tag: `category:${categorySlug}` 
    });

    if (!categoryRes.data || categoryRes.data.length === 0) {
      console.error(`[CategoryPage] Category data fetch failed for slug: ${categorySlug}`);
      
      // Debug: fetch all categories to see what's available
      try {
        const allCategoriesRes = await strapiFetch<{ data: any[] }>(
          `/api/categories?${qs({ 
            "fields[0]": "page_slug", 
            "fields[1]": "name", 
            "pagination[pageSize]": "100" 
          })}`,
          { revalidate: 60, tag: 'categories:debug' }
        );
        const allSlugs = (allCategoriesRes.data || []).map((cat: any) => ({ 
          page_slug: cat.page_slug, 
          name: cat.name 
        }));
        console.error(`[CategoryPage] Available categories:`, allSlugs);
      } catch (debugError) {
        console.error('[CategoryPage] Error fetching all categories:', debugError);
      }
      
      notFound();
    }

    const categoryData = categoryRes.data[0];
    
    console.log(`[CategoryPage] Category found: ${categoryData.name} (${categoryData.page_slug})`);

    // Extract merchants from category relation and filter by market
    // Handle all possible formats for manyToMany relation (same as merchant page):
    // 1. Direct array: [{ id, ... }]
    // 2. With data wrapper: { data: [{ id, ... }] }
    // 3. Nested: [{ data: { id, ... } }]
    let merchantsFromCMS: any[] = [];
    if (Array.isArray(categoryData?.merchants)) {
      // Check if it's nested format
      if (categoryData.merchants[0]?.data) {
        merchantsFromCMS = categoryData.merchants.map((item: any) => item.data || item);
      } else {
        merchantsFromCMS = categoryData.merchants;
      }
    } else if (categoryData?.merchants?.data) {
      merchantsFromCMS = categoryData.merchants.data;
    }
    
    console.log(`[CategoryPage] Extracted ${merchantsFromCMS.length} merchants before market filter`);
    
    // Filter merchants by market
    merchantsFromCMS = merchantsFromCMS.filter((merchant: any) => {
      if (!merchant) return false;
      const merchantMarket = merchant.market?.key || merchant.market;
      return merchantMarket?.toLowerCase() === market.toLowerCase();
    });
    
    console.log(`[CategoryPage] Found ${merchantsFromCMS.length} merchants for category ${categorySlug} in market ${market}`);

    // Transform merchants and fetch first (priority 1) coupon for each
    const merchantsWithCoupons = await Promise.all(
      merchantsFromCMS.map(async (merchant: any) => {
        try {
          // Fetch priority 1 coupon for this merchant
          const couponData = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs({
            "filters[merchant][id][$eq]": merchant.id.toString(),
            "filters[market][key][$eq]": market,
            "filters[coupon_status][$eq]": "active",
            "sort": "priority:asc",
            "pagination[pageSize]": "1",
            "fields[0]": "id",
            "fields[1]": "coupon_title",
            "fields[2]": "coupon_type",
            "fields[3]": "value",
            "fields[4]": "code",
            "fields[5]": "affiliate_link",
            "fields[6]": "priority",
            "fields[7]": "description",
          })}`, { 
            revalidate: 300, 
            tag: `merchant:${merchant.page_slug}` 
          });
          
          const firstCoupon = couponData?.data?.[0] || null;
          
          return {
            id: merchant.id.toString(),
            name: merchant.merchant_name || merchant.name,
            slug: merchant.page_slug,
            logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
            description: merchant.summary || "",
            firstCoupon: firstCoupon ? {
              id: firstCoupon.id.toString(),
              title: firstCoupon.coupon_title,
              value: firstCoupon.value?.replace('$$', '$') || firstCoupon.value,
              code: firstCoupon.code,
              coupon_type: firstCoupon.coupon_type,
              affiliate_link: firstCoupon.affiliate_link,
              priority: firstCoupon.priority,
              description: firstCoupon.description || "",
            } : null
          };
        } catch (error) {
          console.error(`Error fetching coupon for merchant ${merchant.page_slug}:`, error);
          return {
            id: merchant.id.toString(),
            name: merchant.merchant_name || merchant.name,
            slug: merchant.page_slug,
            logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
            description: merchant.summary || "",
            firstCoupon: null
          };
        }
      })
    );

    // Filter merchants that have coupons for the coupons section
    const merchants = merchantsWithCoupons;
    const coupons = merchantsWithCoupons
      .filter((m: any) => m.firstCoupon)
      .map((merchant: any) => ({
        id: merchant.firstCoupon.id,
        code: merchant.firstCoupon.code || "",
        title: merchant.firstCoupon.title || 'Untitled Coupon',
        description: merchant.firstCoupon.description || "",
        discount: merchant.firstCoupon.value || "",
        expiry: "長期有效",
        usageCount: 0,
        affiliate_link: merchant.firstCoupon.affiliate_link || '#',
        coupon_type: merchant.firstCoupon.coupon_type || 'promo_code',
        merchant: {
          name: merchant.name,
          slug: merchant.slug,
          logo: merchant.logo,
        },
      }));

    // Build breadcrumb JSON-LD
    const domainConfig = getDomainConfigServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
    const categoryUrl = `${siteUrl}/category/${categorySlug}`;
    const breadcrumb = breadcrumbJsonLd([
      { name: '首頁', url: `${siteUrl}/` },
      { name: '分類', url: `${siteUrl}/category` },
      { name: categoryData.name, url: categoryUrl },
    ]);

    return (
      <>
        <CategoryView 
          category={{
            id: categoryData.id,
            name: categoryData.name,
            slug: categoryData.page_slug, // Map page_slug to slug for frontend
            summary: categoryData.summary,
          }}
          merchants={merchants}
          coupons={coupons}
          categorySlug={categorySlug}
        />
        {/* Breadcrumb JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      </>
    );

  } catch (error) {
    console.error('Error fetching category data:', error);
    notFound();
  }
}