// app/special-offers/[topicSlug]/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SpecialOffersClient from '../special-offers-client';
import { notFound } from 'next/navigation';

export const revalidate = 600; // ISR - revalidate every 10 minutes

export async function generateMetadata({ params: { topicSlug } }: { params: { topicSlug: string } }) {
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  
  try {
    // Fetch topic data for SEO
    const topicRes = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?filters[slug][$eq]=${topicSlug}&filters[market][key][$eq]=${market}&fields[0]=title&fields[1]=seo_title&fields[2]=seo_description`,
      { revalidate: 600, tag: `special-offer:${topicSlug}` }
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
    console.error('Error fetching topic metadata:', error);
  }
  
  // Fallback metadata
  return pageMeta({
    title: '特別優惠｜Dealy',
    description: '精選特別優惠與限時活動',
    path: `/special-offers/${topicSlug}`,
  });
}

export default async function SpecialOfferTopic({ 
  params: { topicSlug } 
}: { 
  params: { topicSlug: string } 
}) {
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  
  try {
    // Fetch topic data with featured merchants and coupons
    const topicParams = {
      "filters[slug][$eq]": topicSlug,
      "fields[0]": "id",
      "fields[1]": "title", 
      "fields[2]": "slug",
      "fields[3]": "intro",
      "populate[featured_merchants]": "true",
      "populate[coupons]": "true",
    };

    const topicRes = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs(topicParams)}`,
      { revalidate: 600, tag: `special-offer:${topicSlug}` }
    );
    
    const topic = topicRes.data?.[0];
    
    if (!topic) {
      notFound();
    }

    // Transform featured merchants data
    const featuredMerchants = (topic.featured_merchants || []).map((merchant: any) => ({
      id: merchant.id,
      name: merchant.merchant_name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
      link: `/shop/${merchant.slug}`,
    }));

    // Transform coupons data (using 'coupons' field instead of 'flash_deals')
    const flashDeals = (topic.coupons || []).map((coupon: any) => ({
      id: coupon.id?.toString(),
      coupon_title: coupon.coupon_title,
      description: coupon.description,
      value: coupon.value,
      code: coupon.code,
      coupon_type: coupon.coupon_type,
      expires_at: coupon.expires_at,
      user_count: coupon.user_count,
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
    console.error('Error fetching special offers data:', error);
    notFound();
  }
}
