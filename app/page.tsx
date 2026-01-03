// app/page.tsx - Server Component with ISR
// Redeployment trigger
import { getHomePageData } from "@/lib/homepage-loader";
import { HOME_REVALIDATE, HOME_TAG } from "@/lib/constants";
import { pageMeta } from "@/seo/meta";
import HomePageClient from "./page-client";
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
        <HomePageClient initialData={homepageData} />
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
    
    return <HomePageClient initialData={fallbackData} />;
  }
}