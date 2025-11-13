// app/special-offers/[id]/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SpecialOffersClient from '../special-offers-client';
import { notFound } from 'next/navigation';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';

export const revalidate = 3600; // ISR - revalidate every 60 minutes for stronger edge hit ratio
export const dynamic = 'auto'; // Allow on-demand ISR for dynamic routes (generates on first request, then caches)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  
  try {
    // Fetch special offer data for SEO - use explicit fields like merchant page
    const specialOfferRes = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs({
        "filters[page_slug][$eq]": slug,
        "fields[0]": "title",
        "fields[1]": "seo_title",
        "fields[2]": "seo_description",
      })}`,
      { revalidate: 3600, tag: `special-offer:${slug}` }
    );
    
    const specialOffer = specialOfferRes.data?.[0];
    
    if (specialOffer) {
      const title = specialOffer.seo_title || `${specialOffer.title}｜Dealy`;
      const description = specialOffer.seo_description || '精選特別優惠與限時活動';
      
      return pageMeta({
        title,
        description,
        path: `/special-offers/${slug}`,
      });
    }
  } catch (error) {
    console.error('[SpecialOfferPage] Error fetching metadata:', error);
  }
  
  // Fallback metadata
  return pageMeta({
    title: '特別優惠｜Dealy',
    description: '精選特別優惠與限時活動',
    path: `/special-offers/${slug}`,
  });
}

export default async function SpecialOfferPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: slug } = await params;

  try {
    // Use explicit populate structure like merchant page - don't use "populate=deep"
    const specialOfferRes = await strapiFetch<{ data: any[] }>(`/api/special-offers?${qs({
      "filters[page_slug][$eq]": slug,
      "fields[0]": "id",
      "fields[1]": "title",
      "fields[2]": "page_slug",
      "fields[3]": "intro",
      "fields[4]": "seo_title",
      "fields[5]": "seo_description",
      "populate[logo][fields][0]": "url",
      "populate[featured_merchants][fields][0]": "id",
      "populate[featured_merchants][fields][1]": "merchant_name",
      "populate[featured_merchants][fields][2]": "page_slug",
      "populate[featured_merchants][populate][logo][fields][0]": "url",
      "populate[coupons][fields][0]": "id",
      "populate[coupons][fields][1]": "coupon_title",
      "populate[coupons][fields][2]": "description",
      "populate[coupons][fields][3]": "value",
      "populate[coupons][fields][4]": "code",
      "populate[coupons][fields][5]": "coupon_type",
      "populate[coupons][fields][6]": "expires_at",
      "populate[coupons][fields][7]": "user_count",
      "populate[coupons][fields][8]": "display_count",
      "populate[coupons][fields][9]": "affiliate_link",
      "populate[coupons][fields][10]": "editor_tips",
      "populate[coupons][populate][merchant][fields][0]": "id",
      "populate[coupons][populate][merchant][fields][1]": "merchant_name",
      "populate[coupons][populate][merchant][fields][2]": "page_slug",
      "populate[coupons][populate][merchant][populate][logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    })}`, { 
      revalidate: 3600, 
      tag: `special-offer:${slug}` 
    });
    
    if (!specialOfferRes.data || specialOfferRes.data.length === 0) {
      console.error('[SpecialOfferPage] No special offer found with slug:', slug);
      
      // Debug: fetch all slugs
      try {
        const allSpecialOffersRes = await strapiFetch<{ data: any[] }>(
          `/api/special-offers?${qs({ "fields[0]": "page_slug", "fields[1]": "title", "pagination[pageSize]": "100" })}`,
          { revalidate: 60, tag: 'special-offers:debug' }
        );
        const allSlugs = (allSpecialOffersRes.data || []).map((so: any) => ({ slug: so.page_slug, title: so.title }));
      } catch (debugError) {
        console.error('[SpecialOfferPage] Error fetching all slugs:', debugError);
      }
      
      notFound();
    }

    const specialOffer = specialOfferRes.data[0];

    // Transform featured merchants data
    // Schema: featured_merchants is oneToMany (plural) - multiple merchants per special offer
    // Keep fallback for old singular format for backward compatibility
    let featuredMerchants: any[] = [];
    if (specialOffer.featured_merchant) {
      // Fallback for old schema format
      const merchant = specialOffer.featured_merchant;
      featuredMerchants = [{
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.page_slug,
        logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
        link: `/shop/${merchant.page_slug}`,
      }];
    } else if (Array.isArray(specialOffer.featured_merchants)) {
      // Current schema format: oneToMany relation
      featuredMerchants = specialOffer.featured_merchants.map((merchant: any) => ({
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.page_slug,
        logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
        link: `/shop/${merchant.page_slug}`,
      }));
    }

    // Transform coupons data
    // Schema: coupons is oneToMany (plural) - multiple coupons per special offer
    // Keep fallback for old singular format for backward compatibility
    let couponData: any[] = [];
    if (specialOffer.coupon) {
      // Fallback for old schema format
      couponData = [specialOffer.coupon];
    } else if (Array.isArray(specialOffer.coupons)) {
      // Current schema format: oneToMany relation
      couponData = specialOffer.coupons;
    }

    const flashDeals = couponData.map((coupon: any) => ({
      id: coupon.id?.toString(),
      coupon_title: coupon.coupon_title,
      description: coupon.description,
      value: coupon.value,
      code: coupon.code,
      coupon_type: coupon.coupon_type,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count || 0,
      display_count: coupon.display_count || coupon.user_count || 0,
      affiliate_link: coupon.affiliate_link,
      editor_tips: coupon.editor_tips,
      merchant: {
        id: coupon.merchant?.id,
        merchant_name: coupon.merchant?.merchant_name,
        slug: coupon.merchant?.page_slug,
        logo: coupon.merchant?.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "/api/placeholder/120/120",
      },
    }));

    // Build breadcrumb JSON-LD
    const domainConfig = getDomainConfigServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
    const specialOfferUrl = `${siteUrl}/special-offers/${slug}`;
    const breadcrumb = breadcrumbJsonLd([
      { name: '首頁', url: `${siteUrl}/` },
      { name: '特別優惠', url: `${siteUrl}/special-offers` },
      { name: specialOffer.title, url: specialOfferUrl },
    ]);

    return (
      <>
        <SpecialOffersClient 
          specialOffer={specialOffer}
          featuredMerchants={featuredMerchants}
          flashDeals={flashDeals}
        />
        {/* Breadcrumb JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      </>
    );
  } catch (error) {
    console.error('[SpecialOffers] Error fetching special offer data:', error);
    console.error('[SpecialOffers] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      slug,
    });
    notFound();
  }
}

