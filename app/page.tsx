// app/page.tsx - Server Component with ISR
// Redeployment trigger
import { getHomePageData } from "@/lib/homepage-loader";
import { HOME_REVALIDATE, HOME_TAG } from "@/lib/constants";
import { pageMeta } from "@/seo/meta";
import HomeCouponRailClient from "./page-client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import HomeHeroSearchClient from "./HomeHeroSearchClient";
import HomeMerchantSliderClient from "./HomeMerchantSliderClient";
import { webPageJsonLd, popularMerchantsItemListJsonLd, getDailyUpdatedTime } from "@/lib/jsonld";
import { getDomainConfig as getDomainConfigServer, getMarketLocale } from "@/lib/domain-config";

// Enable ISR for this page
export const revalidate = 86400; // Revalidate every 24 hours - homepage content is relatively static
// IMPORTANT: Force static ISR so the homepage is cacheable at Cloudflare/Vercel.
// If this page becomes dynamic (e.g. due to cookies()/headers() or no-store fetch),
// Vercel will emit `Cache-Control: private, no-store...` which makes Cloudflare BYPASS.
export const dynamic = 'force-static';

// Generate metadata for SEO
export async function generateMetadata() {
  const MARKET = "tw"; // Hardcoded for TW frontend
  const domainConfig = getDomainConfigServer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
  const ogImageUrl = `${siteUrl}/og-image.png`;
  const ogImageAlt = 'Dealy TW 台灣最新優惠平台';
  
  try {
    // Fetch homepage data to get SEO fields
    const homepageData = await getHomePageData(MARKET);
    
    return pageMeta({
      title: homepageData.seo.title,
      description: homepageData.seo.description,
      path: '/',
      ogImageUrl,
      ogImageAlt,
    });
  } catch (error) {
    console.error('Error fetching homepage metadata:', error);
    // Fallback metadata
    return pageMeta({
      title: 'Dealy TW 台灣最新優惠碼及折扣平台｜每日更新網購優惠',
      description: '精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。',
      path: '/',
      ogImageUrl,
      ogImageAlt,
    });
  }
}

function renderHomePage(homepageData: any) {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main id="main-content">
        <section className="py-8 md:py-16 px-4 relative z-10">
          {homepageData.hero?.bgUrl && (
            <div className="absolute inset-0 z-0">
              <img
                src={homepageData.hero.bgUrl}
                alt=""
                width={1920}
                height={1080}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          )}
          <div className="container mx-auto text-center relative z-10 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-800 mb-3 md:mb-4">
              {homepageData.hero?.title || "Dealy TW 台灣每日最新優惠折扣平台"}
            </h1>
            <div className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-4 md:mb-6">
              {homepageData.hero?.subtitle || "NEVER Pay Full Price"}
            </div>
            <div className="space-y-1.5 text-gray-700 mb-4 md:mb-8">
              <div className="text-xs sm:text-sm md:text-base whitespace-pre-line">
                {"🛍 全台最新優惠情報｜每日更新 ✨\n💸 精選 100+ 熱門網店優惠：折扣、優惠碼、獨家 Promo Code 一次看透！\n✈️ 旅遊優惠｜🛒 網購優惠｜💳 信用卡優惠｜📱 支付／付款折扣（行動支付／刷卡回饋等）"}
              </div>
            </div>
            <HomeHeroSearchClient placeholder={homepageData.hero?.searchPlaceholder || "搜尋超值好康"} />
          </div>
        </section>

        {homepageData.popularMerchants && (
          <section className="py-6 md:py-12 px-4 relative z-0">
            <div className="container mx-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-6 md:mb-12 text-gray-800">
                {homepageData.popularMerchants?.heading || "台灣最新折扣優惠"}
              </h2>
              {homepageData.popularMerchants.items && homepageData.popularMerchants.items.length > 0 ? (
                <HomeMerchantSliderClient merchants={homepageData.popularMerchants.items} />
              ) : (
                <div className="w-full text-center py-8">
                  <p className="text-gray-500">No merchants available. Please add merchants in Strapi CMS.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {homepageData.categoryBlock?.categories && homepageData.categoryBlock.categories.length > 0 && (
          <section className="py-6 md:py-12 px-4 bg-gray-50">
            <div className="container mx-auto">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-center mb-6 md:mb-12 text-gray-800">
                {homepageData.categoryBlock?.heading || "2025優惠主題一覽"}
              </h2>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8">
                {homepageData.categoryBlock.categories.map((category: any) => (
                  <Link key={category.id} href={`/special-offers/${category.slug}`} className="text-center group">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-2 md:mb-4 overflow-hidden rounded-full shadow-lg group-hover:shadow-xl transition-shadow bg-white flex items-center justify-center">
                      {category.iconUrl ? (
                        <img
                          src={category.iconUrl}
                          alt={category.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">{category.name}</span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium leading-tight">{category.name}</p>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <p className="text-[10px] sm:text-xs text-gray-600 leading-tight">
                  {homepageData.categoryBlock.disclaimer}
                  <Link href="/legal-disclaimer" className="text-blue-600 hover:underline ml-1">
                    了解更多
                  </Link>
                </p>
              </div>
            </div>
          </section>
        )}

        <HomeCouponRailClient initialData={homepageData} />
      </main>
      <Footer />
    </div>
  );
}

export default async function HomePage() {
  const MARKET = "tw"; // Hardcoded for TW frontend
  
  try {
    // Fetch homepage data on the server
    const homepageData = await getHomePageData(MARKET);
    
    // Get domain config and locale for WebPage schema
    const domainConfig = getDomainConfigServer();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${domainConfig.domain}`;
    let marketLocale: string;
    try {
      marketLocale = await getMarketLocale(MARKET);
    } catch (error) {
      console.error('[HomePage] Error fetching market locale, using fallback:', error);
      marketLocale = 'zh-Hant-TW'; // Default fallback for TW
    }
    
    // Get daily updated time for freshness signal (matches merchant pages)
    const dailyUpdatedTime = getDailyUpdatedTime();
    const dateModified = dailyUpdatedTime.toISOString().replace('Z', '+08:00');
    // Use a fixed date for datePublished (when site was launched or homepage was first created)
    // For now, use a date 6 months ago as placeholder - should be replaced with actual creation date from CMS
    const datePublished = '2025-06-17T21:57:37+08:00'; // TODO: Get from CMS if available
    
    // Generate WebPage JSON-LD for homepage with dates
    const webPageSchema = webPageJsonLd({
      name: homepageData.seo.title,
      url: siteUrl,
      description: homepageData.seo.description,
      locale: marketLocale,
      siteId: `${siteUrl}#website`,
      datePublished: datePublished,
      dateModified: dateModified,
    });
    
    // Generate ItemList schema for popular merchants (matching HK format)
    const popularMerchantsList = homepageData.popularMerchants?.items || [];
    const itemListSchema = popularMerchantsItemListJsonLd(
      popularMerchantsList.map(m => ({ name: m.name, slug: m.slug })),
      homepageData.popularMerchants?.heading || '熱門商店',
      siteUrl
    );
    
    // Pass data to client component for interactivity
    // Note: Hero image preload is handled automatically by Next.js Image component with priority prop
    return (
      <>
        {renderHomePage(homepageData)}
        {/* WebPage JSON-LD for homepage */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageSchema, null, 0),
          }}
        />
        {/* ItemList JSON-LD for popular merchants (matching HK format) */}
        {itemListSchema && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(itemListSchema, null, 0),
            }}
          />
        )}
      </>
    );
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    
    // Fallback data if CMS fails
    const fallbackData = {
      seo: {
        title: "Dealy TW 台灣最新優惠碼及折扣平台｜每日更新網購優惠",
        description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。"
      },
      hero: {
        title: "Dealy TW 台灣最新優惠碼及折扣平台｜每日更新網購優惠",
        subtitle: "NEVER Pay Full Price",
        description: "🛍 全台最新優惠情報｜每日更新！ ✨",
        bgUrl: "",
        searchPlaceholder: "搜尋最抵Deal"
      },
      popularMerchants: {
        heading: "台灣最新折扣優惠",
        items: []
      },
      categoryBlock: {
        heading: "2025優惠主題一覽",
        categories: [],
        disclaimer: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。"
      },
      couponRail: {
        heading: "本日最新最受歡迎折扣碼/優惠券/Promo Code",
        items: []
      }
    };
    
    return renderHomePage(fallbackData);
  }
}