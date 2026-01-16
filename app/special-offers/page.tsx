// app/special-offers/page.tsx - Server Component with ISR (Index page)
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SpecialOffersIndexClient from './special-offers-index-client';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const revalidate = 86400; // ISR - revalidate every 24 hours (same as homepage)

export async function generateMetadata() {
  return pageMeta({
    title: '特別優惠｜Dealy',
    description: '精選特別優惠與限時活動',
    path: '/special-offers',
  });
}

export default async function SpecialOffersIndex() {
  const market = 'tw'; // Hardcoded for TW frontend
  
  try {
    // Fetch special offers for TW only
    const specialOffersParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "title", 
      "fields[2]": "page_slug",
      "fields[3]": "intro",
      "fields[4]": "seo_title",
      "fields[5]": "seo_description",
      "sort": "createdAt:desc",
      "pagination[pageSize]": "20",
    };

    const specialOffersRes = await strapiFetch<{ data: any[]; meta: any }>(
      `/api/special-offers?${qs(specialOffersParams)}`,
      { revalidate: 86400, tag: `special-offers:index:${market}` }
    );
    
    const specialOffers = specialOffersRes.data || [];
    
    if (specialOffers.length === 0) {
      notFound();
    }

    // Transform special offers data for the index page
    const transformedSpecialOffers = specialOffers.map((specialOffer: any) => ({
      id: specialOffer.id,
      title: specialOffer.title,
      slug: specialOffer.page_slug,
      intro: specialOffer.intro,
      seo_title: specialOffer.seo_title,
      seo_description: specialOffer.seo_description,
      link: `/special-offers/${specialOffer.page_slug}`,
    }));

    return (
      <div className="min-h-screen bg-background">
        <Header />

        {/* Affiliate Disclaimer */}
        <div className="bg-muted/30 border-b border-border py-2 px-4">
          <div className="container mx-auto">
            <p className="text-xs text-muted-foreground text-center">
              透過本站鏈接完成購物可享，我們可能會因此獲得佣金，而您無需額外付費。
              <Link href="/legal-disclaimer" className="text-primary hover:underline ml-1">
                了解更多
              </Link>
            </p>
          </div>
        </div>

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">✨ 特別優惠專區 🔔</h1>
            <p className="text-muted-foreground mb-4">精選最新特別優惠與限時活動，助您以最優惠價格入手心水產品</p>
            <p className="text-sm text-orange-600 font-medium">⭐ 定期更新最新優惠資訊，立即查看所有特別優惠！</p>
          </div>

          <SpecialOffersIndexClient specialOffers={transformedSpecialOffers} />
        </main>

        <Footer />
      </div>
    );
  } catch (error) {
    console.error('Error fetching special offers index data:', error);
    notFound();
  }
}