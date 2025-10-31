// app/special-offers/[topicSlug]/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SpecialOffersClient from '../special-offers-client';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR - revalidate every 60 minutes for stronger edge hit ratio
export const dynamic = 'auto'; // Allow on-demand ISR for dynamic routes (generates on first request, then caches)

export async function generateMetadata({ params }: { params: Promise<{ topicSlug: string }> }) {
  const { topicSlug: slug } = await params;
  
  try {
    // Fetch special offer data for SEO - match slug exactly (UID field)
    const specialOfferRes = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs({
        "filters[slug][$eq]": slug, // Exact match for UID field
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
    console.error('[SpecialOffers] Error fetching special offer metadata:', error);
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
  params: Promise<{ topicSlug: string }> 
}) {
  const { topicSlug: slug } = await params;
  
  console.log(`[SpecialOffers] Fetching special offer with slug: "${slug}"`);
  
  try {
    // Fetch special offer data with slug filter (exact match for UID field)
    const specialOfferParams = {
      "filters[slug][$eq]": slug,
      "populate": "deep", // Populate all relations recursively
    };

    const apiUrl = `/api/special-offers?${qs(specialOfferParams)}`;
    console.log(`[SpecialOffers] API URL: ${apiUrl}`);
    
    let specialOfferRes = await strapiFetch<{ data: any[] }>(
      apiUrl,
      { revalidate: 3600, tag: `special-offer:${slug}` }
    );
    
    console.log(`[SpecialOffers] Response data length: ${specialOfferRes.data?.length || 0}`);
    
    // If no results, try to fetch all slugs to debug
    if (!specialOfferRes.data || specialOfferRes.data.length === 0) {
      console.warn(`[SpecialOffers] No results found with slug "${slug}". Fetching all slugs to debug...`);
      const allSpecialOffersRes = await strapiFetch<{ data: any[] }>(
        `/api/special-offers?${qs({ "fields[0]": "slug", "fields[1]": "title", "pagination[pageSize]": "100" })}`,
        { revalidate: 60, tag: 'special-offers:debug' }
      );
      const allSlugs = (allSpecialOffersRes.data || []).map((so: any) => ({ slug: so.slug, title: so.title }));
      console.log(`[SpecialOffers] Available slugs in CMS:`, allSlugs);
      console.error(`[SpecialOffers] Requested slug "${slug}" not found in available slugs`);
    } else {
      console.log(`[SpecialOffers] Found special offer:`, {
        id: specialOfferRes.data[0].id,
        title: specialOfferRes.data[0].title,
        slug: specialOfferRes.data[0].slug,
        publishedAt: specialOfferRes.data[0].publishedAt,
      });
    }
    
    const specialOffer = specialOfferRes.data?.[0];
    
    if (!specialOffer) {
      console.error(`[SpecialOffers] No special offer found with slug: "${slug}"`);
      console.error(`[SpecialOffers] This could mean: 1) Slug doesn't exist 2) Not published 3) Wrong slug format`);
      notFound();
    }

    // Transform featured merchants data
    // Handle both singular and plural (in case schema allows multiple)
    const featuredMerchantData = specialOffer.featured_merchant 
      ? (Array.isArray(specialOffer.featured_merchant) ? specialOffer.featured_merchant : [specialOffer.featured_merchant])
      : (specialOffer.featured_merchants || []);

    const featuredMerchants = featuredMerchantData.map((merchant: any) => ({
      id: merchant.id,
      name: merchant.merchant_name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
      link: `/shop/${merchant.slug}`,
    }));

    // Transform coupons data
    // Handle both singular and plural (in case schema allows multiple)
    const couponData = specialOffer.coupon
      ? (Array.isArray(specialOffer.coupon) ? specialOffer.coupon : [specialOffer.coupon])
      : (specialOffer.coupons || []);

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
