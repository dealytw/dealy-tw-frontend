// app/special-offers/[id]/page.tsx - Server Component with ISR
import { pageMeta } from '@/seo/meta';
import { strapiFetch, absolutizeMedia, qs, rewriteImageUrl } from '@/lib/strapi.server';
import SpecialOffersClient from '../special-offers-client';
import { notFound } from 'next/navigation';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { getDomainConfig as getDomainConfigServer } from '@/lib/domain-config';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const revalidate = 86400; // ISR - revalidate every 24 hours (same as homepage)
export const dynamic = 'auto'; // Allow on-demand ISR for dynamic routes (generates on first request, then caches)

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id: slug } = await params;
  
  // Hardcode to TW market - this is the TW frontend
  const marketKey = 'tw';
  
  try {
    // Fetch special offer data for SEO - use explicit fields like merchant page
    // Filter by market to ensure we only get TW entries (not HK entries)
    const specialOfferRes = await strapiFetch<{ data: any[] }>(
      `/api/special-offers?${qs({
        "filters[page_slug][$eq]": slug,
        "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
        "fields[0]": "title",
        "fields[1]": "seo_title",
        "fields[2]": "seo_description",
        "fields[3]": "hreflang_alternate_url",
      })}`,
      { revalidate: 86400, tag: `special-offer:${slug}` }
    );
    
    const specialOffer = specialOfferRes.data?.[0];
    
    if (specialOffer) {
      const title = specialOffer.seo_title || `${specialOffer.title}｜Dealy`;
      const description = specialOffer.seo_description || '精選特別優惠與限時活動';
      
      // Extract alternate URL(s) from hreflang_alternate_url field (comma-separated text)
      const alternateUrl = specialOffer.attributes?.hreflang_alternate_url || specialOffer.hreflang_alternate_url || null;
      
      return pageMeta({
        title,
        description,
        path: `/special-offers/${slug}`,
        alternateUrl, // Pass alternate URL(s) from CMS hreflang_alternate_url field (comma-separated)
      });
    }
  } catch (error) {
    console.error('[SpecialOfferPage] Error fetching metadata:', error);
  }
  
  // Fallback metadata
  return pageMeta({
    title: '特別優惠｜Dealy',
    description: '精選特別優惠與限時活動',
    path: `/special-offers/${slug}`,
    alternateUrl: null, // No alternate URL for fallback
  });
}

export default async function SpecialOfferPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id: slug } = await params;
  
  // Hardcode to TW market - this is the TW frontend
  const marketKey = 'tw';

  try {
    // Use explicit populate structure like merchant page - don't use "populate=deep"
    // Filter by market to ensure we only get TW entries (not HK entries)
    const specialOfferRes = await strapiFetch<{ data: any[] }>(`/api/special-offers?${qs({
      "filters[page_slug][$eq]": slug,
      "filters[market][key][$eq]": marketKey, // Filter by market (TW only)
      "fields[0]": "id",
      "fields[1]": "title",
      "fields[2]": "page_slug",
      "fields[3]": "intro",
      "fields[4]": "seo_title",
      "fields[5]": "seo_description",
      "fields[6]": "hreflang_alternate_url",
      "populate[logo][fields][0]": "url",
      "populate[featured_merchants][fields][0]": "id",
      "populate[featured_merchants][fields][1]": "merchant_name",
      "populate[featured_merchants][fields][2]": "page_slug",
      "populate[featured_merchants][populate][logo][fields][0]": "url",
      "populate[coupons][fields][0]": "id",
      "populate[coupons][fields][1]": "coupon_title",
      "populate[coupons][fields][2]": "description",
      "populate[coupons][fields][3]": "value",
      "populate[coupons][fields][4]": "code",
      "populate[coupons][fields][5]": "coupon_type",
      "populate[coupons][fields][6]": "expires_at",
      "populate[coupons][fields][7]": "user_count",
      "populate[coupons][fields][8]": "display_count",
      "populate[coupons][fields][9]": "affiliate_link",
      "populate[coupons][fields][10]": "editor_tips",
      "populate[coupons][populate][merchant][fields][0]": "id",
      "populate[coupons][populate][merchant][fields][1]": "merchant_name",
      "populate[coupons][populate][merchant][fields][2]": "page_slug",
      "populate[coupons][populate][merchant][populate][logo][fields][0]": "url",
      "populate[market][fields][0]": "key",
    })}`, { 
      revalidate: 3600, 
      tag: `special-offer:${slug}` 
    });
    
    if (!specialOfferRes.data || specialOfferRes.data.length === 0) {
      console.error('[SpecialOfferPage] No special offer found with slug:', slug);
      
      // Debug: fetch all slugs
      try {
        const allSpecialOffersRes = await strapiFetch<{ data: any[] }>(
          `/api/special-offers?${qs({ "fields[0]": "page_slug", "fields[1]": "title", "pagination[pageSize]": "100" })}`,
          { revalidate: 60, tag: 'special-offers:debug' }
        );
        const allSlugs = (allSpecialOffersRes.data || []).map((so: any) => ({ slug: so.page_slug, title: so.title }));
      } catch (debugError) {
        console.error('[SpecialOfferPage] Error fetching all slugs:', debugError);
      }
      
      notFound();
    }

    const specialOffer = specialOfferRes.data[0];

    // Transform featured merchants data
    // Schema: featured_merchants is oneToMany (plural) - multiple merchants per special offer
    // Keep fallback for old singular format for backward compatibility
    let featuredMerchants: any[] = [];
    if (specialOffer.featured_merchant) {
      // Fallback for old schema format
      const merchant = specialOffer.featured_merchant;
      const originalLogoUrl = merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120";
      const rewrittenLogoUrl = originalLogoUrl ? rewriteImageUrl(originalLogoUrl) : "/api/placeholder/120/120";
      featuredMerchants = [{
        id: merchant.id,
        name: merchant.merchant_name,
        slug: merchant.page_slug,
        logo: rewrittenLogoUrl,
        link: `/shop/${merchant.page_slug}`,
      }];
    } else if (Array.isArray(specialOffer.featured_merchants)) {
      // Current schema format: oneToMany relation
      featuredMerchants = specialOffer.featured_merchants.map((merchant: any) => {
        const originalLogoUrl = merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "/api/placeholder/120/120";
        const rewrittenLogoUrl = originalLogoUrl ? rewriteImageUrl(originalLogoUrl) : "/api/placeholder/120/120";
        return {
          id: merchant.id,
          name: merchant.merchant_name,
          slug: merchant.page_slug,
          logo: rewrittenLogoUrl,
          link: `/shop/${merchant.page_slug}`,
        };
      });
    }

    // Transform coupons data
    // Schema: coupons is oneToMany (plural) - multiple coupons per special offer
    // Keep fallback for old singular format for backward compatibility
    let couponData: any[] = [];
    if (specialOffer.coupon) {
      // Fallback for old schema format
      couponData = [specialOffer.coupon];
    } else if (Array.isArray(specialOffer.coupons)) {
      // Current schema format: oneToMany relation
      couponData = specialOffer.coupons;
    }

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
      merchant: (() => {
        const logoUrl = coupon.merchant?.logo?.url ? absolutizeMedia(coupon.merchant.logo.url) : "/api/placeholder/120/120";
        const rewrittenLogo = logoUrl ? rewriteImageUrl(logoUrl) : "/api/placeholder/120/120";
        return {
          id: coupon.merchant?.id,
          merchant_name: coupon.merchant?.merchant_name,
          slug: coupon.merchant?.page_slug,
          logo: rewrittenLogo,
        };
      })(),
    }));

    // Build breadcrumb JSON-LD
    const domainConfig = getDomainConfigServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
    const specialOfferUrl = `${siteUrl}/special-offers/${slug}`;
    const breadcrumb = breadcrumbJsonLd([
      { name: '首頁', url: `${siteUrl}/` },
      { name: '特別優惠', url: `${siteUrl}/special-offers` },
      { name: specialOffer.title, url: specialOfferUrl },
    ]);

    // Extract alternate URL(s) from hreflang_alternate_url field (comma-separated text)
    const alternateUrl = specialOffer.attributes?.hreflang_alternate_url || specialOffer.hreflang_alternate_url || null;

    return (
      <>
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
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {specialOffer.title || '✨ 限時搶購！最新快閃優惠一覽 🔔'}
              </h1>
              {specialOffer.intro && (
                <div className="text-muted-foreground mb-4 leading-relaxed whitespace-pre-line text-left" style={{ lineHeight: '1.6' }}>
                  {typeof specialOffer.intro === 'string' ? specialOffer.intro : ''}
                </div>
              )}
            </div>

            {/* Featured Merchants Section */}
            {featuredMerchants.length > 0 && (
              <section className="mb-12" aria-labelledby="featured-merchants-heading">
                <h2 id="featured-merchants-heading" className="text-2xl font-bold text-foreground mb-6 text-center">
                  優惠主題熱門商店
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {featuredMerchants.map((merchant) => (
                    <Link
                      key={merchant.id}
                      href={merchant.link}
                      className="flex flex-col items-center p-4 bg-card rounded-lg border border-border hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      <div className="w-24 h-24 mb-3 flex items-center justify-center bg-white rounded-lg p-2">
                        <img src={merchant.logo} alt={merchant.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <h3 className="font-semibold text-sm text-foreground mb-1 text-center">{merchant.name}</h3>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <SpecialOffersClient flashDeals={flashDeals} />
          </main>

          <Footer alternateUrl={alternateUrl} />
        </div>
        {/* Breadcrumb JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      </>
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

