import { NextResponse } from 'next/server';
import { strapiFetch, qs, absolutizeMedia, rewriteImageUrl } from '@/lib/strapi.server';

export const dynamic = 'force-dynamic'; // Uses request.url for searchParams
export const revalidate = 15552000; // 6 months (180 days) - hotstore data rarely changes

const CACHE_CONTROL = 'public, s-maxage=15552000, stale-while-revalidate=604800';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const marketKey = searchParams.get('market') || 'tw';

    const hotstoreRes = await strapiFetch<{ data: any[] }>(`/api/hotstores?${qs({
      "filters[market][key][$eq]": marketKey,
      "populate[merchants][fields][0]": "id",
      "populate[merchants][fields][1]": "merchant_name",
      "populate[merchants][fields][2]": "page_slug",
      "populate[merchants][populate][logo][fields][0]": "url",
    })}`, { 
      revalidate: 15552000, // 6 months (180 days) - hotstore data rarely changes 
      tag: `hotstore:${marketKey}` 
    });

    let hotstoreMerchants: any[] = [];
    if (hotstoreRes.data && hotstoreRes.data.length > 0) {
      const hotstore = hotstoreRes.data[0];
      
      let merchantsFromCMS = [];
      if (Array.isArray(hotstore?.merchants)) {
        if (hotstore.merchants[0]?.data) {
          merchantsFromCMS = hotstore.merchants.map((item: any) => item.data || item);
        } else {
          merchantsFromCMS = hotstore.merchants;
        }
      } else if (hotstore?.merchants?.data) {
        merchantsFromCMS = hotstore.merchants.data;
      }

      hotstoreMerchants = merchantsFromCMS.map((merchant: any) => ({
        id: merchant.id.toString(),
        name: merchant.merchant_name || merchant.name || '',
        slug: merchant.page_slug || '',
        logoUrl: merchant.logo?.url ? rewriteImageUrl(absolutizeMedia(merchant.logo.url)) : null,
      }));
    }

    return NextResponse.json(
      { merchants: hotstoreMerchants },
      { headers: { 'Cache-Control': CACHE_CONTROL } }
    );
  } catch (error) {
    console.error('Error fetching hotstore merchants:', error);
    return NextResponse.json(
      { merchants: [] },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

