// app/shop/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs, rewriteImageUrl } from '@/lib/strapi.server';
import MerchantIndex from './merchant-index';

export const revalidate = 86400; // ISR - revalidate every 24 hours (merchants don't change often)

/**
 * Extract the first English letter from a merchant name.
 * If the name starts with Chinese or other non-English characters,
 * find the first English letter in the name.
 * Falls back to 'A' if no English letter is found.
 */
function getFirstEnglishLetter(name: string): string {
  if (!name) return 'A';
  
  // Try to find the first English letter (A-Z, a-z) in the name
  const englishLetterMatch = name.match(/[A-Za-z]/);
  if (englishLetterMatch) {
    return englishLetterMatch[0].toUpperCase();
  }
  
  // Fallback to 'A' if no English letter found
  return 'A';
}

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
      "fields[2]": "page_slug",
      "fields[3]": "summary",
      "fields[4]": "default_affiliate_link",
      "pagination[page]": String(pageNum),
      "pagination[pageSize]": "500", // Increased to fetch all merchants
      "sort[0]": "merchant_name:asc",
      "populate[logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    };

    const merchantsData = await strapiFetch<{ data: any[]; meta: any }>(
      `/api/merchants?${qs(merchantParams)}`,
      { revalidate: 3600, tag: 'merchant:list' }
    );

    // Transform merchants data
    const merchants = (merchantsData?.data || []).map((merchant: any) => {
      const logo = merchant.logo?.url
        ? rewriteImageUrl(absolutizeMedia(merchant.logo.url))
        : "/api/placeholder/120/120";

      return {
        id: merchant.id.toString(),
        name: merchant.merchant_name,
        slug: merchant.page_slug,
        logo,
        letter: getFirstEnglishLetter(merchant.merchant_name || ''),
        description: merchant.summary || '',
        affiliateLink: merchant.default_affiliate_link || '',
        market: market,
      };
    });

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