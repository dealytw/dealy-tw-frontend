// app/special-offers/[id]/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SpecialOffersClient from '../special-offers-client';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR - revalidate every 60 minutes for stronger edge hit ratio
export const dynamic = 'auto'; // Allow on-demand ISR for dynamic routes (generates on first request, then caches)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  
  try {
    // Fetch special offer data for SEO - use explicit fields like merchant page
    const specialOfferRes = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs({
        "filters[slug][$eq]": slug,
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
  
  console.log('[SpecialOfferPage] Fetching data for', { slug });
  console.log('Environment check:', {
    STRAPI_URL: process.env.STRAPI_URL,
    NEXT_PUBLIC_STRAPI_URL: process.env.NEXT_PUBLIC_STRAPI_URL,
    STRAPI_TOKEN: process.env.STRAPI_TOKEN ? 'exists' : 'missing'
  });

  try {
    // Use explicit populate structure like merchant page - don't use "populate=deep"
    const specialOfferRes = await strapiFetch<{ data: any[] }>(`/api/special-offers?${qs({
      "filters[slug][$eq]": slug,
      "fields[0]": "id",
      "fields[1]": "title",
      "fields[2]": "slug",
      "fields[3]": "intro",
      "fields[4]": "seo_title",
      "fields[5]": "seo_description",
      "populate[logo][fields][0]": "url",
      "populate[featured_merchant][fields][0]": "id",
      "populate[featured_merchant][fields][1]": "merchant_name",
      "populate[featured_merchant][fields][2]": "slug",
      "populate[featured_merchant][populate][logo][fields][0]": "url",
      "populate[coupon][fields][0]": "id",
      "populate[coupon][fields][1]": "coupon_title",
      "populate[coupon][fields][2]": "description",
      "populate[coupon][fields][3]": "value",
      "populate[coupon][fields][4]": "code",
      "populate[coupon][fields][5]": "coupon_type",
      "populate[coupon][fields][6]": "expires_at",
      "populate[coupon][fields][7]": "user_count",
      "populate[coupon][fields][8]": "display_count",
      "populate[coupon][fields][9]": "affiliate_link",
      "populate[coupon][fields][10]": "editor_tips",
      "populate[coupon][populate][merchant][fields][0]": "id",
      "populate[coupon][populate][merchant][fields][1]": "merchant_name",
      "populate[coupon][populate][merchant][fields][2]": "slug",
      "populate[coupon][populate][merchant][populate][logo][fields][0]": "url",
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
          `/api/special-offers?${qs({ "fields[0]": "slug", "fields[1]": "title", "pagination[pageSize]": "100" })}`,
          { revalidate: 60, tag: 'special-offers:debug' }
        );
        const allSlugs = (allSpecialOffersRes.data || []).map((so: any) => ({ slug: so.slug, title: so.title }));
        console.log('[SpecialOfferPage] Available slugs in CMS:', allSlugs);
      } catch (debugError) {
        console.error('[SpecialOfferPage] Error fetching all slugs:', debugError);
      }
      
      notFound();
    }

    const specialOffer = specialOfferRes.data[0];
    console.log('[SpecialOfferPage] Found special offer:', {
      id: specialOffer.id,
      title: specialOffer.title,
      slug: specialOffer.slug,
    });

    // Transform featured merchants data
    // Schema shows featured_merchant is manyToOne (singular), but handle both formats
    let featuredMerchants: any[] = [];
    if (specialOffer.featured_merchant) {
      const merchant = specialOffer.featured_merchant;
      featuredMerchants = [{
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.slug,
        logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
        link: `/shop/${merchant.slug}`,
      }];
    } else if (Array.isArray(specialOffer.featured_merchants)) {
      featuredMerchants = specialOffer.featured_merchants.map((merchant: any) => ({
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.slug,
        logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
        link: `/shop/${merchant.slug}`,
      }));
    }

    // Transform coupons data
    // Schema shows coupon is manyToOne (singular), but handle both formats
    let couponData: any[] = [];
    if (specialOffer.coupon) {
      couponData = [specialOffer.coupon];
    } else if (Array.isArray(specialOffer.coupons)) {
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
        slug: coupon.merchant?.slug,
        logo: coupon.merchant?.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "/api/placeholder/120/120",
      },
    }));

    return (
      <SpecialOffersClient 
        specialOffer={specialOffer}
        featuredMerchants={featuredMerchants}
        flashDeals={flashDeals}
      />
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

