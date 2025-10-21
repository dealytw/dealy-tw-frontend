// app/shop/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import MerchantIndex from './merchant-index';

export const revalidate = 3600; // ISR - revalidate every hour (merchants don't change often)

export async function generateMetadata() {
  return pageMeta({
    title: '所有商店｜Dealy.TW 優惠折扣平台',
    description: '瀏覽所有合作商店，尋找最優惠的折扣和促銷活動。',
    path: '/shop',
  });
}

export default async function ShopIndex({ 
  searchParams 
}: { 
  searchParams: Promise<{ page?: string }> 
}) {
  const { page } = await searchParams;
  const pageNum = Number(page || 1);
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

  try {
    // Fetch merchants with explicit fields and minimal populate
    const merchantParams = {
      "filters[market][key][$eq]": market,
      "fields[0]": "id",
      "fields[1]": "merchant_name",
      "fields[2]": "slug",
      "fields[3]": "summary",
      "fields[4]": "default_affiliate_link",
      "pagination[page]": String(pageNum),
      "pagination[pageSize]": "24",
      "sort[0]": "merchant_name:asc",
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const merchantsData = await strapiFetch<{ data: any[]; meta: any }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 3600, tag: 'merchant:list' }
    );

    // Transform merchants data
    const merchants = (merchantsData?.data || []).map((merchant: any) => ({
      id: merchant.id.toString(),
      name: merchant.merchant_name,
      slug: merchant.slug,
      logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
      letter: merchant.merchant_name?.charAt(0).toUpperCase() || 'A',
      description: merchant.summary || '',
      affiliateLink: merchant.default_affiliate_link || '',
      market: market,
    }));

    return (
      <MerchantIndex 
        merchants={merchants}
        pagination={merchantsData?.meta?.pagination}
        initialPage={pageNum}
      />
    );

  } catch (error) {
    console.error('Error fetching merchants:', error);
    
    // Fallback to empty state
    return (
      <MerchantIndex 
        merchants={[]}
        pagination={undefined}
        initialPage={pageNum}
      />
    );
  }
}