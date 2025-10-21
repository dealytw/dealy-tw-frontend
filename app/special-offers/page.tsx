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
    // Fetch all topics for the index page (without market filter for now)
    const topicParams = {
      "fields[0]": "id",
      "fields[1]": "title", 
      "fields[2]": "slug",
      "fields[3]": "intro",
      "fields[4]": "seo_title",
      "fields[5]": "seo_description",
      "sort": "createdAt:desc",
      "pagination[pageSize]": "20",
    };

    const topicsRes = await strapiFetch<{ data: any[]; meta: any }>(
      `/api/special-offers?${qs(topicParams)}`,
      { revalidate: 600, tag: 'special-offers:index' }
    );
    
    const topics = topicsRes.data || [];
    
    if (topics.length === 0) {
      notFound();
    }

    // Transform topics data for the index page
    const transformedTopics = topics.map((topic: any) => ({
      id: topic.id,
      title: topic.title,
      slug: topic.slug,
      intro: topic.intro,
      seo_title: topic.seo_title,
      seo_description: topic.seo_description,
      link: `/special-offers/${topic.slug}`,
    }));

    return (
      <SpecialOffersIndexClient 
        topics={transformedTopics}
      />
    );
  } catch (error) {
    console.error('Error fetching special offers index data:', error);
    notFound();
  }
}