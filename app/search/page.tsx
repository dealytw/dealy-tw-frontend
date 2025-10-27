// app/search/page.tsx - Server Component with SSR + noindex
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs } from '@/lib/strapi.server';
import SearchResults from './search-results';

export const dynamic = 'force-dynamic'; // SSR

export async function generateMetadata({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q || '';
  
  if (query) {
    return pageMeta({
      title: `搜尋「${query}」的優惠碼｜Dealy`,
      description: `搜尋「${query}」相關的優惠碼與折扣。`,
      path: `/search?q=${encodeURIComponent(query)}`,
      noindex: true,
    });
  }
  
  return pageMeta({
    title: '搜尋優惠碼｜Dealy',
    description: '搜尋全站優惠碼與折扣。',
    path: '/search',
    noindex: true,
  });
}

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; page?: string }> 
}) {
  const { q, page } = await searchParams;
  const query = (q || '').trim();
  const pageNum = Number(page || 1);
  const market = process.env.NEXT_PUBLIC_MARKET_KEY || 'tw';

  let searchResults = {
    merchants: [],
    coupons: [],
    query: query,
    totalResults: 0
  };

  if (query) {
    try {
      // Search merchants with explicit fields and minimal populate
      const merchantParams = {
        "filters[market][key][$eq]": market, // Market relation filter
        "fields[0]": "id",
        "fields[1]": "merchant_name",
        "fields[2]": "slug", 
        "fields[3]": "summary",
        "fields[4]": "default_affiliate_link",
        "sort": "merchant_name:asc",
        "pagination[page]": "1",
        "pagination[pageSize]": "500",
        "populate[logo][fields][0]": "url",
        "populate[market][fields][0]": "key",
      };

      const merchantsData = await strapiFetch<{ data: any[] }>(`/api/merchants?${qs(merchantParams)}`, {
        cache: 'no-store' // Search should be fresh
      });
      
      const allMerchants = merchantsData?.data || [];
      
      // Filter merchants on the server side
      const merchants = allMerchants
        .filter((merchant: any) => {
          const name = merchant.merchant_name?.toLowerCase() || '';
          const slug = merchant.slug?.toLowerCase() || '';
          const summary = merchant.summary?.toLowerCase() || '';
          const searchQuery = query.toLowerCase();
          
          return name.includes(searchQuery) || slug.includes(searchQuery) || summary.includes(searchQuery);
        })
        .slice(0, 20)
        .map((merchant: any) => ({
          id: merchant.id,
          name: merchant.merchant_name,
          slug: merchant.slug,
          logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120",
          description: merchant.summary || "",
          website: merchant.website || "",
          affiliateLink: merchant.affiliate_link || "",
          market: merchant.market?.key || market.toUpperCase(),
          type: 'merchant'
        }));

      // Search coupons with explicit fields and minimal populate
      let coupons: any[] = [];
      try {
        const couponParams = {
          "filters[market][key][$eq]": market, // Market relation filter
          "filters[coupon_status][$eq]": "active",
          "fields[0]": "id",
          "fields[1]": "coupon_title",
          "fields[2]": "description",
          "fields[3]": "value",
          "fields[4]": "code",
          "fields[5]": "coupon_type",
          "fields[6]": "expires_at",
          "fields[7]": "user_count",
          "fields[8]": "affiliate_link",
          "fields[9]": "editor_tips",
          "pagination[page]": "1",
          "pagination[pageSize]": "500",
          "populate[merchant][fields][0]": "id",
          "populate[merchant][fields][1]": "merchant_name",
          "populate[merchant][fields][2]": "slug",
          "populate[merchant][populate][logo][fields][0]": "url",
          "populate[market][fields][0]": "key",
        };

        const couponData = await strapiFetch<{ data: any[] }>(`/api/coupons?${qs(couponParams)}`, {
          cache: 'no-store' // Search should be fresh
        });
        
        const allCoupons = couponData?.data || [];
        
        // Filter coupons on the server side
        coupons = allCoupons
          .filter((coupon: any) => {
            const title = coupon.coupon_title?.toLowerCase() || '';
            const description = coupon.description?.toLowerCase() || '';
            const tips = coupon.editor_tips?.toLowerCase() || '';
            const merchantName = coupon.merchant?.merchant_name?.toLowerCase() || '';
            const searchQuery = query.toLowerCase();
            
            return title.includes(searchQuery) || description.includes(searchQuery) || 
                   tips.includes(searchQuery) || merchantName.includes(searchQuery);
          })
          .slice(0, 20)
          .map((coupon: any) => ({
            id: coupon.id,
            title: coupon.coupon_title || 'Untitled Coupon',
            description: coupon.description || "",
            value: coupon.value || "",
            code: coupon.code || "",
            coupon_type: coupon.coupon_type || "promo_code",
            expires_at: coupon.expires_at || "長期有效",
            user_count: coupon.user_count || 0,
            affiliate_link: coupon.affiliate_link || "#",
            merchant: {
              id: coupon.merchant?.id,
              name: coupon.merchant?.merchant_name || 'Unknown Merchant',
              slug: coupon.merchant?.slug || '',
              logo: coupon.merchant?.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "/api/placeholder/120/120",
            },
            type: 'coupon'
          }));
      } catch (couponError) {
        console.error('Coupon search error:', couponError);
        coupons = [];
      }

      searchResults = {
        merchants,
        coupons,
        query: query,
        totalResults: merchants.length + coupons.length
      };
    } catch (error) {
      console.error('Search error:', error);
      searchResults = {
        merchants: [],
        coupons: [],
        query: query,
        totalResults: 0
      };
    }
  }

  return <SearchResults searchResults={searchResults} query={query} />;
}