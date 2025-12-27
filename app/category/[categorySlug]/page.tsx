// app/category/[categorySlug]/page.tsx - Server Component with ISR
import { notFound } from 'next/navigation';
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs, getStartsAtFilterParams, rewriteImageUrl } from '@/lib/strapi.server';
import CategoryView from './category-view';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';

export const revalidate = 172800; // ISR - revalidate every 48 hours - category content is relatively static
export const dynamic = 'auto'; // Allow on-demand ISR for dynamic routes (generates on first request, then caches)

export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ categorySlug: string }> 
}) {
  const { categorySlug } = await params;
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  const marketKey = market.toLowerCase();
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
  const ogImageUrl = `${siteUrl}/dealytwlogo.svg`;
  const ogImageAlt = 'Dealy TW 台灣最新優惠平台';
  
  try {
    // Fetch category data for SEO - use page_slug (unique identifier)
    // Only fetch categories with market = tw (this is a TW site)
    const categoryRes = await strapiFetch<{ data: any[] }>(
      `/api/categories?${qs({
        "filters[page_slug][$eq]": categorySlug,
        "filters[market][key][$eq]": marketKey,
        "fields[0]": "name",
        "fields[1]": "page_slug",
        "fields[2]": "hreflang_alternate_url",
        "populate[market][fields][0]": "key",
      })}`,
      { revalidate: 172800, tag: `category:${categorySlug}` } // Cache for 48 hours
    );
    
    const category = categoryRes?.data?.[0];
    
    if (category) {
      const title = `${category.name} 優惠與折扣`;
      const description = `精選 ${category.name} 最新優惠與折扣合集。`;
      
      // Extract alternate URL(s) from hreflang_alternate_url field (comma-separated text)
      const alternateUrl = category.attributes?.hreflang_alternate_url || category.hreflang_alternate_url || null;
      
      return pageMeta({
        title,
        description,
        path: `/category/${categorySlug}`,
        ogImageUrl,
        ogImageAlt,
        alternateUrl, // Pass alternate URL(s) from CMS hreflang_alternate_url field (comma-separated)
      });
    }
  } catch (error) {
    console.error('[CategoryPage] Error fetching category SEO data:', error);
  }
  
  // Fallback metadata
  return pageMeta({
    title: `${categorySlug} 優惠與折扣`,
    description: `精選 ${categorySlug} 最新優惠與折扣合集。`,
    path: `/category/${categorySlug}`,
    ogImageUrl,
    ogImageAlt,
    alternateUrl: null, // No alternate URL for fallback
  });
}

export default async function CategoryPage({ 
  params
}: { 
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  const marketKey = market.toLowerCase();

  try {
    // Fetch category by page_slug - use explicit fields like merchant page
    // Only fetch categories with market = tw (this is a TW site)
    const categoryRes = await strapiFetch<{ data: any[] }>(`/api/categories?${qs({
      "filters[page_slug][$eq]": categorySlug,
      "filters[market][key][$eq]": marketKey,
      "fields[0]": "id",
      "fields[1]": "name",
      "fields[2]": "page_slug",
      "fields[3]": "hreflang_alternate_url",
      "populate[market][fields][0]": "key",
      "populate[merchants][fields][0]": "id",
      "populate[merchants][fields][1]": "merchant_name",
      "populate[merchants][fields][2]": "page_slug",
      "populate[merchants][fields][3]": "summary",
      "populate[merchants][populate][logo][fields][0]": "url",
      "populate[merchants][populate][market][fields][0]": "key",
    })}`, { 
          revalidate: 172800, // Cache for 48 hours
      tag: `category:${categorySlug}` 
    });
    
    console.log(`[CategoryPage] Fetch result for ${categorySlug}:`, {
      hasData: !!categoryRes?.data,
      dataLength: categoryRes?.data?.length || 0,
      firstItem: categoryRes?.data?.[0] || null,
    });
    
    if (!categoryRes?.data || categoryRes.data.length === 0) {
      console.error(`[CategoryPage] Category not found: ${categorySlug}`);
      // Debug: try to fetch all categories to see what's available
      try {
        const allCategoriesRes = await strapiFetch<{ data: any[] }>(
          `/api/categories?${qs({ 
            "fields[0]": "page_slug", 
            "fields[1]": "name", 
            "pagination[pageSize]": "100" 
          })}`,
          { revalidate: 60, tag: 'categories:debug' }
        );
        const allSlugs = (allCategoriesRes?.data || []).map((cat: any) => ({ 
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

    // Extract merchants from category relation
    // Handle all possible formats for oneToMany relation (same pattern as merchant page):
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
    
    // Filter merchants by market (only show merchants for current market)
    merchantsFromCMS = merchantsFromCMS.filter((merchant: any) => {
      if (!merchant) return false;
      const merchantMarket = merchant.market?.key || merchant.market;
      return merchantMarket?.toLowerCase() === marketKey;
    });

    // Transform merchants and fetch first (priority 1) active coupon for each
    const merchantsWithCoupons = await Promise.all(
      merchantsFromCMS.map(async (merchant: any) => {
        try {
          // Fetch priority 1 active coupon for this merchant in the current market
          const couponData = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs({
            "filters[merchant][id][$eq]": merchant.id.toString(),
            "filters[market][key][$eq]": marketKey,
            "filters[coupon_status][$eq]": "active",
            ...getStartsAtFilterParams(), // Filter out scheduled coupons (starts_at in the future)
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
            revalidate: 86400, // Cache for 24 hours - coupons don't change frequently
            tag: `merchant:${merchant.page_slug}` 
          });
          
          const firstCoupon = couponData?.data?.[0] || null;

          // Rewrite merchant logo to custom /upload domain
          const merchantLogoUrl = merchant.logo?.url
            ? rewriteImageUrl(absolutizeMedia(merchant.logo.url))
            : "/api/placeholder/120/120";

          return {
            id: merchant.id.toString(),
            name: merchant.merchant_name || merchant.name,
            slug: merchant.page_slug,
            logo: merchantLogoUrl,
            description: merchant.summary || "",
            firstCouponTitle: firstCoupon?.coupon_title || null,
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
          console.error(`[CategoryPage] Error fetching coupon for merchant ${merchant.page_slug}:`, error);

          const merchantLogoUrl = merchant.logo?.url
            ? rewriteImageUrl(absolutizeMedia(merchant.logo.url))
            : "/api/placeholder/120/120";

          return {
            id: merchant.id.toString(),
            name: merchant.merchant_name || merchant.name,
            slug: merchant.page_slug,
            logo: merchantLogoUrl,
            description: merchant.summary || "",
            firstCouponTitle: null,
            firstCoupon: null
          };
        }
      })
    );

    // Separate merchants and coupons for the view
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

    // Extract alternate URL(s) from hreflang_alternate_url field (comma-separated text)
    const alternateUrl = categoryData.attributes?.hreflang_alternate_url || categoryData.hreflang_alternate_url || null;

    // Fetch blogs for this category
    // Blogs are linked directly to Category (same as merchants), so use the category page_slug or ID
    let categoryBlogs: any[] = [];
    try {
      const categoryId = categoryData.id || categoryData.attributes?.id;
      const categoryDocumentId = categoryData.documentId || categoryData.attributes?.documentId;
      
      if (categoryId || categoryDocumentId) {
        // Try filtering by category page_slug first (more reliable for manyToMany relations)
        // If that doesn't work, fall back to ID
        const blogRes = await strapiFetch<{ data: any[] }>(`/api/blogs?${qs({
          "filters[publishedAt][$notNull]": "true",
          "filters[market][key][$eq]": marketKey,
          "filters[categories][page_slug][$eq]": categorySlug, // Filter by category page_slug (same as category slug)
          "fields[0]": "id",
          "fields[1]": "blog_title",
          "fields[2]": "page_slug",
          "fields[3]": "intro_text",
          "fields[4]": "publishedAt",
          "sort[0]": "publishedAt:desc",
          "pagination[pageSize]": "10", // Limit to 10 for sidebar
          "populate[thumbnail][fields][0]": "url",
        })}`, {
          revalidate: 172800, // Cache for 48 hours
          tag: `category-blogs:${categorySlug}`
        });

        console.log(`[CategoryPage] Fetched blogs for category ${categorySlug} (page_slug filter):`, {
          blogCount: blogRes?.data?.length || 0,
          blogs: blogRes?.data?.map((b: any) => ({ 
            id: b.id, 
            title: b.blog_title || b.attributes?.blog_title,
            categories: b.categories 
          }))
        });

        const domainConfig = getDomainConfigServer();
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

        categoryBlogs = (blogRes?.data || []).map((post: any) => {
          const thumbnailUrl = post.thumbnail?.url 
            ? rewriteImageUrl(absolutizeMedia(post.thumbnail.url), siteUrl)
            : '/placeholder.svg';
          
          return {
            id: post.id,
            title: post.blog_title || post.attributes?.blog_title || '',
            subtitle: post.intro_text || post.attributes?.intro_text || '',
            image: thumbnailUrl,
            slug: post.page_slug || post.attributes?.page_slug || '',
            publishedAt: post.publishedAt || post.createdAt,
          };
        });
      }
    } catch (error) {
      console.error('[CategoryPage] Error fetching category blogs:', error);
      // Continue without blogs - sidebar won't show
    }

    return (
      <>
        <CategoryView 
          category={{
            id: categoryData.id,
            name: categoryData.name,
            slug: categoryData.page_slug, // Map page_slug to slug for frontend
            summary: "", // Category doesn't have summary field
          }}
          merchants={merchants}
          coupons={coupons}
          categorySlug={categorySlug}
          alternateUrl={alternateUrl}
          categoryBlogs={categoryBlogs}
        />
        {/* Breadcrumb JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      </>
    );

  } catch (error) {
    console.error('[CategoryPage] Error fetching category data:', error);
    notFound();
  }
}
