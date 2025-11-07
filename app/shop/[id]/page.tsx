import { notFound } from 'next/navigation';
import { strapiFetch, absolutizeMedia, qs, rewriteImageUrl } from '@/lib/strapi.server';
import { pageMeta } from '@/seo/meta';
import { getMerchantSEO } from '@/lib/seo.server';
import Merchant from './page-client';
import { breadcrumbJsonLd, organizationJsonLd, offersItemListJsonLd, faqPageJsonLd, howToJsonLd, webPageJsonLd, imageObjectJsonLd, aggregateOfferJsonLd, storeJsonLd, websiteJsonLd } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer, getMarketLocale } from '@/lib/domain-config';

// ISR Configuration - Critical for SEO
export const revalidate = 3600; // Revalidate every 60 minutes for stronger edge hit ratio
export const dynamic = 'force-static'; // Force static ISR to ensure cacheable HTML

// Expected: max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=86400

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
    const [merchantRes, couponsRes, hotstoreRes] = await Promise.all([
      // Fetch merchant data with ISR (including related_merchants for manyToMany)
      strapiFetch<{ data: any[] }>(`/api/merchants?${qs({
        "filters[slug][$eq]": id,
        "filters[market][key][$eq]": marketKey,
        "fields[0]": "merchant_name",
        "fields[1]": "slug",
        "fields[2]": "location_filtering",
        "fields[3]": "creditcard_filtering",
        "fields[4]": "summary",
        "fields[5]": "page_title_h1",
        "fields[6]": "site_url",
        "populate[logo][fields][0]": "url",
        "populate[useful_links][fields][0]": "link_title",
        "populate[useful_links][fields][1]": "url",
        "populate[related_merchants][fields][0]": "id",
        "populate[related_merchants][fields][1]": "merchant_name",
        "populate[related_merchants][fields][2]": "slug",
        "populate[related_merchants][populate][logo][fields][0]": "url",
        "populate[market][fields][0]": "key",
        "populate[market][fields][1]": "defaultLocale",
      })}`, { 
        revalidate: 300, 
        tag: `merchant:${id}` 
      }),
      // Fetch coupons data with ISR (include display_count for usage tracking)
      strapiFetch<{ data: any[] }>(`/api/coupons?${qs({
        "filters[merchant][slug][$eq]": id,
        "filters[market][key][$eq]": marketKey,
        "sort": "priority:asc",
        "fields[0]": "id",
        "fields[1]": "documentId",
        "fields[2]": "coupon_title",
        "fields[3]": "value",
        "fields[4]": "code",
        "fields[5]": "expires_at",
        "fields[6]": "affiliate_link",
        "fields[7]": "coupon_type",
        "fields[8]": "description",
        "fields[9]": "editor_tips",
        "fields[10]": "priority",
        "fields[11]": "display_count",
        "fields[12]": "coupon_status",
        "populate[merchant][fields][0]": "id",
        "populate[merchant][fields][1]": "merchant_name",
        "populate[merchant][fields][2]": "slug",
        "populate[merchant][populate][logo][fields][0]": "url",
        "populate[market][fields][0]": "key",
        "populate[market][fields][1]": "defaultLocale",
      })}`, { 
        revalidate: 300, 
        tag: `merchant:${id}` 
      }),
      // Fetch hotstore data for popular merchants section
      strapiFetch<{ data: any[] }>(`/api/hotstores?${qs({
        "filters[market][key][$eq]": marketKey,
        "populate[merchants][fields][0]": "id",
        "populate[merchants][fields][1]": "merchant_name",
        "populate[merchants][fields][2]": "slug",
        "populate[merchants][populate][logo][fields][0]": "url",
      })}`, { 
        revalidate: 3600, 
        tag: `hotstore:${marketKey}` 
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
    
    // Get market locale from merchant data or fetch separately
    const marketLocale = merchantData.market?.defaultLocale || await getMarketLocale(marketKey);
    const domainConfig = getDomainConfigServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;

    // Get Taiwan time (UTC+8) for server-side date generation
    const getTaiwanDate = () => {
      return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" }));
    };
    
    // Generate H1 title on server-side
    const taiwanDate = getTaiwanDate();
    const currentYear = taiwanDate.getFullYear();
    const currentMonth = taiwanDate.getMonth() + 1;
    const generatedH1 = `${merchantData.merchant_name}優惠碼${currentYear}｜${currentMonth}月最新折扣與信用卡優惠`;
    const h1Title = merchantData.page_title_h1 || generatedH1;
    
    // Format last updated date for server-side
    const lastUpdatedDate = taiwanDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '/');

    // Rewrite logo URL to custom domain (for both client component and schema)
    const originalLogoUrl = merchantData.logo?.url ? absolutizeMedia(merchantData.logo.url) : null;
    const rewrittenLogoUrl = originalLogoUrl ? rewriteImageUrl(originalLogoUrl, siteUrl) : null;

    // Transform merchant data to match frontend structure
    const merchant = {
      id: merchantData.id,
      name: merchantData.merchant_name,
      slug: merchantData.slug,
      logo: rewrittenLogoUrl,
      description: merchantData.summary || "",
      store_description: merchantData.store_description || "",
      faqs: merchantData.faqs || [],
      how_to: merchantData.how_to || [],
      useful_links: merchantData.useful_links || [],
      website: merchantData.website || "",
      site_url: merchantData.site_url || "",
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
      relatedMerchants: relatedMerchants,
      location_filtering: merchantData.location_filtering ?? false,
      creditcard_filtering: merchantData.creditcard_filtering ?? false,
      page_title_h1: merchantData.page_title_h1 || null,
      h1Title: h1Title, // Pre-generated H1 title from server
      lastUpdatedDate: lastUpdatedDate, // Pre-formatted date from server
    };

    // Process hotstore merchants for popular merchants section
    let hotstoreMerchants: any[] = [];
    if (hotstoreRes.data && hotstoreRes.data.length > 0) {
      const hotstore = hotstoreRes.data[0]; // Get first hotstore entry for this market
      
      // Extract merchants from hotstore.merchants
      let merchantsFromCMS = [];
      if (Array.isArray(hotstore?.merchants)) {
        if (hotstore.merchants[0]?.data) {
          merchantsFromCMS = hotstore.merchants.map((item: any) => item.data || item);
        } else {
          merchantsFromCMS = hotstore.merchants;
        }
      } else if (hotstore?.merchants?.data) {
        merchantsFromCMS = hotstore.merchants.data;
      }

      hotstoreMerchants = merchantsFromCMS.map((merchant: any) => ({
        id: merchant.id.toString(),
        name: merchant.merchant_name || merchant.name || '',
        slug: merchant.slug || '',
        logoUrl: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : null,
      }));
    }

    // Transform coupons data
    const transformedCoupons = allCoupons.map((coupon: any) => ({
      id: coupon.id.toString(),
      coupon_title: coupon.coupon_title,
      coupon_type: coupon.coupon_type,
      coupon_status: coupon.coupon_status || 'active',
      priority: coupon.priority || 0, // Include priority for sorting
      value: coupon.value,
      code: coupon.code,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count || 0,
      display_count: coupon.display_count || 0, // Add display_count for usage tracking
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

    // Separate active and expired coupons on server, then sort by priority within each group
    // Note: CMS middleware automatically changes coupon_status to 'expired' after 3 days
    const activeCoupons = transformedCoupons
      .filter((coupon: any) => coupon.coupon_status === 'active')
      .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
    
    const expiredCoupons = transformedCoupons
      .filter((coupon: any) => coupon.coupon_status === 'expired')
      .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));

    // Build JSON-LD blocks using @graph structure (matching HK site format)
    // Ensure slug is available - use id param as fallback if slug is missing
    const merchantSlug = merchant.slug || id;
    const merchantUrl = `${siteUrl}/shop/${merchantSlug}`;
    const merchantId = `${merchantUrl}#merchant`;
    const breadcrumbId = `${merchantUrl}#breadcrumb`;
    
    // Use rewritten logo for schema (already rewritten above)
    const schemaLogo = merchant.logo || undefined;
    
    // Build all schema objects with @id (using # suffix for proper referencing)
    const website = websiteJsonLd({
      siteName: 'Dealy.TW 最新優惠平台',
      siteUrl: siteUrl,
      locale: marketLocale,
    });
    
    const merchantOrg = organizationJsonLd({
      name: merchant.name,
      url: merchant.site_url || merchant.website || merchantUrl, // Use site_url from merchant collection
      logo: schemaLogo,
      sameAs: (merchant.useful_links || []).map((l: any) => l?.url).filter(Boolean),
      id: merchantId, // Use #merchant for proper referencing
    });
    
    const breadcrumb = breadcrumbJsonLd([
      { name: '首頁', url: `${siteUrl}/` },
      { name: '商家', url: `${siteUrl}/shop` },
      { name: merchant.name, url: merchantUrl },
    ], merchantUrl);
    
    // Use coupon data already fetched (activeCoupons already has description from transformedCoupons)
    const offersList = offersItemListJsonLd(
      activeCoupons.map((c: any, index: number) => ({
        value: c.value,
        title: c.coupon_title, // Use coupon_title as name (from top, already sorted)
        code: c.code,
        status: c.coupon_status,
        expires_at: c.expires_at,
        url: `${merchantUrl}#coupon-active-${index + 1}`,
        description: c.description || undefined, // Use description from coupon card (already in activeCoupons)
      })),
      merchantUrl
    );
    
    const faq = faqPageJsonLd(
      (merchant.faqs || []).map((f: any) => ({ 
        question: f?.q || f?.question || '', 
        answer: f?.a || f?.answer || '' 
      })).filter((x: any) => x.question && x.answer),
      merchantUrl // FAQPage uses merchantUrl (no #faq in reference format)
    );
    
    const pageImage = schemaLogo;
    const webPage = webPageJsonLd({
      name: merchant.name,
      url: merchantUrl,
      description: merchant.seoDescription || merchant.description || undefined,
      image: pageImage || undefined,
      dateModified: merchant.updatedAt,
      datePublished: merchant.createdAt,
      locale: marketLocale,
      siteId: `${siteUrl}#website`,
      breadcrumbId: breadcrumbId,
      merchantId: merchantId, // Use #merchant for proper referencing in about field
    });
    
    // Combine all schemas into @graph array
    const graphItems: any[] = [
      merchantOrg,
      breadcrumb,
      website,
      webPage,
    ];
    
    // Add optional schemas
    if (offersList && offersList.itemListElement?.length > 0) {
      graphItems.push(offersList);
    }
    if (faq) {
      graphItems.push(faq);
    }
    
    // Create final @graph structure
    const schemaGraph = {
      '@context': 'https://schema.org',
      '@graph': graphItems,
    };

    // Pass the data to the original client component
  return (
      <>
      <Merchant 
        merchant={merchant as any}
        coupons={activeCoupons}
        expiredCoupons={expiredCoupons}
        relatedMerchants={relatedMerchants}
        hotstoreMerchants={hotstoreMerchants}
        market={marketKey}
      />
      {/* JSON-LD script - Single @graph structure matching HK site format */}
      {/* eslint-disable @next/next/no-sync-scripts */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaGraph) }} />
      </>
    );
  } catch (error) {
    console.error('Error fetching merchant data:', error);
    notFound();
  }
}