import { notFound } from 'next/navigation';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import { pageMeta } from '@/seo/meta';
import { getMerchantSEO } from '@/lib/seo.server';
import Merchant from './page-client';

// ISR Configuration - Critical for SEO
export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-static'; // Enable static generation

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const market = 'tw'; // Default market
  
  try {
    // Fetch merchant with SEO fields
    const res = await getMerchantSEO(id, 300);
    const merchant = res.data?.[0];

    if (!merchant) {
      return pageMeta({
        title: `${id} 優惠碼｜最新折扣與優惠券`,
        description: `精選 ${id} 最新優惠碼與折扣，限時優惠一鍵領取。`,
        path: `/shop/${id}`,
      });
    }

    const name = merchant.merchant_name || id;
    let title: string;
    let description: string;

    // Check if CMS has override values
    if (merchant.seo_title && merchant.seo_description) {
      // Use CMS override values
      title = merchant.seo_title;
      description = merchant.seo_description;
    } else {
      // Auto-generate from coupons
      const { getFirstCouponHighlights, getFirstValidCoupon, generateMerchantMetaTitle, generateMerchantMetaDescription } = await import('@/lib/seo-generation');
      const { getMerchantCouponsForSEO } = await import('@/lib/seo.server');
      
      // Fetch ACTIVE coupons for this merchant (sorted by priority)
      const couponsRes = await getMerchantCouponsForSEO(merchant.documentId, market, 300);
      const coupons = couponsRes?.data || [];
      
      console.log(`[SEO] Merchant ${merchant.merchant_name} - Fetched ${coupons.length} active coupons`);
      
      // Generate highlights and first coupon
      const highlights = getFirstCouponHighlights(coupons, name);
      const firstCoupon = getFirstValidCoupon(coupons);
      
      // Extract highlight for description
      // Format from highlights: "最抵 $800 OFF & 新客優惠 & 免運費"
      let highlight = '';
      if (highlights.includes('新客優惠')) {
        highlight = '新客優惠';
      } else if (highlights.includes('免運費')) {
        highlight = '免運費';
      } else if (highlights) {
        // Extract first value after "最抵" (e.g., "最抵 $800 OFF & ...")
        const valueMatch = highlights.match(/最抵\s*([^&]+)/);
        if (valueMatch) {
          highlight = valueMatch[1].trim();
        }
      }
      
      // Generate meta tags
      title = generateMerchantMetaTitle(name, highlights);
      description = generateMerchantMetaDescription(name, firstCoupon?.coupon_title || '限時優惠', highlight);
    }

    const noindex = merchant.robots === 'noindex,nofollow' || merchant.robots === 'noindex';

    return pageMeta({
      title,
      description,
      path: `/shop/${id}`,
      canonicalOverride: merchant.canonical_url || undefined,
      noindex,
      ogImageUrl: merchant.ogImage?.url || undefined,
    });
      } catch (error) {
    console.error('Error generating metadata:', error);
    return pageMeta({
      title: `${id} 優惠碼｜最新折扣與優惠券`,
      description: `精選 ${id} 最新優惠碼與折扣，限時優惠一鍵領取。`,
      path: `/shop/${id}`,
    });
  }
}

interface MerchantPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MerchantPage({ params, searchParams }: MerchantPageProps) {
  const { id } = await params;
  const { market } = await searchParams;
  
  const marketKey = (market as string) || process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

  console.log('MerchantPage: Fetching data for', { id, marketKey });
  console.log('Environment check:', {
    STRAPI_URL: process.env.STRAPI_URL,
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
    STRAPI_TOKEN: process.env.STRAPI_TOKEN ? 'exists' : 'missing'
  });

  try {
    // Use server-only Strapi fetch with ISR
    const [merchantRes, couponsRes] = await Promise.all([
      // Fetch merchant data with ISR (including related_merchants for manyToMany)
      strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
        "filters[slug][$eq]": id,
        "filters[market][key][$eq]": marketKey,
        "populate[logo][fields][0]": "url",
        "populate[useful_links][fields][0]": "link_title",
        "populate[useful_links][fields][1]": "url",
        "populate[related_merchants][fields][0]": "id",
        "populate[related_merchants][fields][1]": "merchant_name",
        "populate[related_merchants][fields][2]": "slug",
        "populate[related_merchants][populate][logo][fields][0]": "url",
      })}`, { 
        revalidate: 300, 
        tag: `merchant:${id}` 
      }),
      // Fetch coupons data with ISR
      strapiFetch<{ data: any[] }>(`/api/coupons?${qs({
        "filters[merchant][slug][$eq]": id,
        "filters[market][key][$eq]": marketKey,
        "sort": "priority:asc",
        "populate[merchant][fields][0]": "id",
        "populate[merchant][fields][1]": "merchant_name",
        "populate[merchant][fields][2]": "slug",
        "populate[merchant][populate][logo][fields][0]": "url",
        "populate[market][fields][0]": "key",
      })}`, { 
        revalidate: 300, 
        tag: `merchant:${id}` 
      })
    ]);

    // Extract related merchants from the merchant data already fetched
    let relatedMerchants: any[] = [];
    try {
      console.log('Extracting related merchants from merchant data');
      
      const merchant = merchantRes.data?.[0];
      console.log('Merchant related_merchants:', JSON.stringify(merchant?.related_merchants, null, 2));
      
      // Handle all possible formats for manyToMany relation:
      // 1. Direct array: [{ id, ... }]
      // 2. With data wrapper: { data: [{ id, ... }] }
      // 3. Nested: [{ data: { id, ... } }]
      let relatedFromCMS = [];
      if (Array.isArray(merchant?.related_merchants)) {
        // Check if it's nested format
        if (merchant.related_merchants[0]?.data) {
          relatedFromCMS = merchant.related_merchants.map((item: any) => item.data || item);
        } else {
          relatedFromCMS = merchant.related_merchants;
        }
      } else if (merchant?.related_merchants?.data) {
        relatedFromCMS = merchant.related_merchants.data;
      }
      
      console.log('Related merchants from CMS:', relatedFromCMS.length, relatedFromCMS);
      
      if (relatedFromCMS.length > 0) {
        // Fetch priority 1 coupon for each related merchant
        const relatedMerchantsWithCoupons = await Promise.all(
          relatedFromCMS.map(async (relatedMerchant: any) => {
            try {
              const couponData = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs({
                "filters[merchant][id][$eq]": relatedMerchant.id.toString(),
                "filters[market][key][$eq]": marketKey,
                "filters[coupon_status][$eq]": "active",
                "sort": "priority:asc",
                "pagination[pageSize]": "1",
              })}`, { 
                revalidate: 300, 
                tag: `merchant:${relatedMerchant.slug}` 
              });
              
              const firstCoupon = couponData?.data?.[0] || null;
              
              return {
                id: relatedMerchant.id.toString(),
                name: relatedMerchant.merchant_name || relatedMerchant.name,
                slug: relatedMerchant.slug,
                logo: relatedMerchant.logo?.url ? absolutizeMedia(relatedMerchant.logo.url) : null,
                firstCoupon: firstCoupon ? {
                  id: firstCoupon.id.toString(),
                  title: firstCoupon.coupon_title,
                  value: firstCoupon.value?.replace('$$', '$') || firstCoupon.value,
                  code: firstCoupon.code,
                  coupon_type: firstCoupon.coupon_type,
                  affiliate_link: firstCoupon.affiliate_link,
                  priority: firstCoupon.priority
                } : null
              };
            } catch (error) {
              console.error(`Error fetching coupon for merchant ${relatedMerchant.slug}:`, error);
              return {
                id: relatedMerchant.id.toString(),
                name: relatedMerchant.merchant_name || relatedMerchant.name,
                slug: relatedMerchant.slug,
                logo: relatedMerchant.logo?.url ? absolutizeMedia(relatedMerchant.logo.url) : null,
                firstCoupon: null
              };
            }
          })
        );
        
        relatedMerchants = relatedMerchantsWithCoupons;
      }
      
      console.log('Related merchants fetched:', relatedMerchants.length, relatedMerchants);
      } catch (error) {
      console.warn('Failed to fetch related merchants, continuing without them:', error);
      relatedMerchants = [];
    }

    if (!merchantRes.data || merchantRes.data.length === 0) {
      notFound();
    }

    const merchantData = merchantRes.data[0];
    const allCoupons = couponsRes.data || [];

    // Transform merchant data to match frontend structure
    const merchant = {
      id: merchantData.id,
      name: merchantData.merchant_name,
      slug: merchantData.slug,
      logo: merchantData.logo?.url ? absolutizeMedia(merchantData.logo.url) : null,
      description: merchantData.summary || "",
      store_description: merchantData.store_description || "",
      faqs: merchantData.faqs || [],
      how_to: merchantData.how_to || [],
      useful_links: merchantData.useful_links || [],
      website: merchantData.website || "",
      affiliateLink: merchantData.affiliate_link || "",
      pageLayout: merchantData.page_layout || "coupon",
      isFeatured: merchantData.is_featured || false,
      market: merchantData.market?.key || marketKey.toUpperCase(),
      seoTitle: merchantData.seo_title || "",
      seoDescription: merchantData.seo_description || "",
      canonicalUrl: merchantData.canonical_url || "",
      priority: merchantData.priority || 0,
      robots: merchantData.robots || "index,follow",
      createdAt: merchantData.createdAt,
      updatedAt: merchantData.updatedAt,
      publishedAt: merchantData.publishedAt,
      relatedMerchants: relatedMerchants
    };

    // Transform coupons data
    const transformedCoupons = allCoupons.map((coupon: any) => ({
      id: coupon.id.toString(),
      coupon_title: coupon.coupon_title,
      coupon_type: coupon.coupon_type,
      coupon_status: coupon.coupon_status || 'active',
      value: coupon.value,
    code: coupon.code,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count || 0,
      description: coupon.description || "",
      editor_tips: coupon.editor_tips,
      affiliate_link: coupon.affiliate_link,
    merchant: {
        id: coupon.merchant?.id || coupon.merchant,
        name: coupon.merchant?.merchant_name || coupon.merchant?.name || "Unknown",
        slug: coupon.merchant?.slug || "unknown",
        logo: coupon.merchant?.logo?.url || "",
      },
      market: {
        key: coupon.market?.key || marketKey.toUpperCase(),
      },
    }));

    // Separate active and expired coupons on server (better performance)
    const activeCoupons = transformedCoupons.filter((coupon: any) => coupon.coupon_status === 'active');
    const expiredCoupons = transformedCoupons.filter((coupon: any) => coupon.coupon_status === 'expired');

    // Pass the data to the original client component
  return (
      <Merchant 
        merchant={merchant}
        coupons={activeCoupons}
        expiredCoupons={expiredCoupons}
        relatedMerchants={relatedMerchants}
        market={marketKey}
      />
    );
  } catch (error) {
    console.error('Error fetching merchant data:', error);
    notFound();
  }
}