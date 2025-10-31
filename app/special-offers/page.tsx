// app/special-offers/page.tsx - Server Component with ISR (Index page)
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SpecialOffersIndexClient from './special-offers-index-client';
import { notFound } from 'next/navigation';

export const revalidate = 600; // ISR - revalidate every 10 minutes

export async function generateMetadata() {
  return pageMeta({
    title: '特別優惠｜Dealy',
    description: '精選特別優惠與限時活動',
    path: '/special-offers',
  });
}

export default async function SpecialOffersIndex() {
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';
  
  try {
    // Fetch all special offers for the index page (without market filter for now)
    const specialOffersParams = {
      "fields[0]": "id",
      "fields[1]": "title", 
      "fields[2]": "slug",
      "fields[3]": "intro",
      "fields[4]": "seo_title",
      "fields[5]": "seo_description",
      "sort": "createdAt:desc",
      "pagination[pageSize]": "20",
    };

    const specialOffersRes = await strapiFetch<{ data: any[]; meta: any }>(
      `/api/special-offers?${qs(specialOffersParams)}`,
      { revalidate: 600, tag: 'special-offers:index' }
    );
    
    const specialOffers = specialOffersRes.data || [];
    
    if (specialOffers.length === 0) {
      notFound();
    }

    // Transform special offers data for the index page
    const transformedSpecialOffers = specialOffers.map((specialOffer: any) => ({
      id: specialOffer.id,
      title: specialOffer.title,
      slug: specialOffer.slug,
      intro: specialOffer.intro,
      seo_title: specialOffer.seo_title,
      seo_description: specialOffer.seo_description,
      link: `/special-offers/${specialOffer.slug}`,
    }));

    return (
      <SpecialOffersIndexClient 
        specialOffers={transformedSpecialOffers}
      />
    );
  } catch (error) {
    console.error('Error fetching special offers index data:', error);
    notFound();
  }
}