// app/special-offers/[topicSlug]/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SpecialOffersClient from '../special-offers-client';
import { notFound } from 'next/navigation';

export const revalidate = 3600; // ISR - revalidate every 60 minutes for stronger edge hit ratio
export const dynamic = 'auto'; // Allow on-demand ISR for dynamic routes (generates on first request, then caches)

export async function generateMetadata({ params }: { params: Promise<{ topicSlug: string }> }) {
  const { topicSlug } = await params;
  
  try {
    // Fetch topic data for SEO - match slug exactly (UID field)
    const topicRes = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs({
        "filters[slug][$eq]": topicSlug, // Exact match for UID field
        "fields[0]": "title",
        "fields[1]": "seo_title",
        "fields[2]": "seo_description",
      })}`,
      { revalidate: 3600, tag: `special-offer:${topicSlug}` }
    );
    
    const topic = topicRes.data?.[0];
    
    if (topic) {
      const title = topic.seo_title || `${topic.title}｜Dealy`;
      const description = topic.seo_description || '精選特別優惠與限時活動';
      
      return pageMeta({
        title,
        description,
        path: `/special-offers/${topicSlug}`,
      });
    }
  } catch (error) {
    console.error('[SpecialOffers] Error fetching topic metadata:', error);
  }
  
  // Fallback metadata
  return pageMeta({
    title: '特別優惠｜Dealy',
    description: '精選特別優惠與限時活動',
    path: `/special-offers/${topicSlug}`,
  });
}

export default async function SpecialOfferTopic({ 
  params 
}: { 
  params: Promise<{ topicSlug: string }> 
}) {
  const { topicSlug } = await params;
  
  console.log(`[SpecialOffers] Fetching topic with slug: "${topicSlug}"`);
  
  try {
    // First, try to fetch with slug filter (exact match for UID field)
    const topicParams = {
      "filters[slug][$eq]": topicSlug,
      "populate": "deep", // Populate all relations recursively
    };

    const apiUrl = `/api/special-offers?${qs(topicParams)}`;
    console.log(`[SpecialOffers] API URL: ${apiUrl}`);
    
    let topicRes = await strapiFetch<{ data: any[] }>(
      apiUrl,
      { revalidate: 3600, tag: `special-offer:${topicSlug}` }
    );
    
    console.log(`[SpecialOffers] Response data length: ${topicRes.data?.length || 0}`);
    
    // If no results, try to fetch all slugs to debug
    if (!topicRes.data || topicRes.data.length === 0) {
      console.warn(`[SpecialOffers] No results found with slug "${topicSlug}". Fetching all slugs to debug...`);
      const allTopicsRes = await strapiFetch<{ data: any[] }>(
        `/api/special-offers?${qs({ "fields[0]": "slug", "fields[1]": "title", "pagination[pageSize]": "100" })}`,
        { revalidate: 60, tag: 'special-offers:debug' }
      );
      const allSlugs = (allTopicsRes.data || []).map((t: any) => ({ slug: t.slug, title: t.title }));
      console.log(`[SpecialOffers] Available slugs in CMS:`, allSlugs);
      console.error(`[SpecialOffers] Requested slug "${topicSlug}" not found in available slugs`);
    } else {
      console.log(`[SpecialOffers] Found topic:`, {
        id: topicRes.data[0].id,
        title: topicRes.data[0].title,
        slug: topicRes.data[0].slug,
        publishedAt: topicRes.data[0].publishedAt,
      });
    }
    
    const topic = topicRes.data?.[0];
    
    if (!topic) {
      console.error(`[SpecialOffers] No topic found with slug: "${topicSlug}"`);
      console.error(`[SpecialOffers] This could mean: 1) Slug doesn't exist 2) Not published 3) Wrong slug format`);
      notFound();
    }

    // Transform featured merchants data
    // Handle both singular and plural (in case schema allows multiple)
    const featuredMerchantData = topic.featured_merchant 
      ? (Array.isArray(topic.featured_merchant) ? topic.featured_merchant : [topic.featured_merchant])
      : (topic.featured_merchants || []);
    
    const featuredMerchants = featuredMerchantData.map((merchant: any) => ({
      id: merchant.id,
      name: merchant.merchant_name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
      link: `/shop/${merchant.slug}`,
    }));

    // Transform coupons data
    // Handle both singular and plural (in case schema allows multiple)
    const couponData = topic.coupon
      ? (Array.isArray(topic.coupon) ? topic.coupon : [topic.coupon])
      : (topic.coupons || []);
    
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
        topic={topic}
        featuredMerchants={featuredMerchants}
        flashDeals={flashDeals}
      />
    );
  } catch (error) {
    console.error('[SpecialOffers] Error fetching special offers data:', error);
    console.error('[SpecialOffers] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      topicSlug,
    });
    notFound();
  }
}
