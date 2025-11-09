// app/page.tsx - Server Component with ISR
import { getHomePageData } from "@/lib/homepage-loader";
import { HOME_REVALIDATE, HOME_TAG } from "@/lib/constants";
import { pageMeta } from "@/seo/meta";
import HomePageClient from "./page-client";
import type { Metadata } from "next";

// Enable ISR for this page
export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'auto'; // Allow ISR revalidation

// Generate metadata for SEO
export async function generateMetadata(): Promise<Metadata> {
  const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
  
  // Fetch homepage data to get hero background image for preload
  let heroBgUrl: string | undefined;
  try {
    const homepageData = await getHomePageData(MARKET);
    heroBgUrl = homepageData.hero?.bgUrl;
  } catch (error) {
    console.error('Error fetching homepage data for metadata:', error);
  }
  
  const baseMetadata = pageMeta({
    title: 'Dealy.TW 台灣每日最新優惠折扣平台',
    description: '全台最新優惠情報｜每日更新！ ✨',
    path: '/',
  });
  
  // Add preload link for hero background image if available
  if (heroBgUrl) {
    return {
      ...baseMetadata,
      other: {
        ...baseMetadata.other,
        'link-preload-hero-bg': (
          <link
            rel="preload"
            as="image"
            href={heroBgUrl}
            fetchPriority="high"
          />
        ),
      },
    };
  }
  
  return baseMetadata;
}

export default async function HomePage() {
  const MARKET = process.env.NEXT_PUBLIC_MARKET_KEY || "tw";
  
  try {
    // Fetch homepage data on the server
    const homepageData = await getHomePageData(MARKET);
    
    // Pass data to client component for interactivity
    return <HomePageClient initialData={homepageData} />;
  } catch (error) {
    console.error('Error fetching homepage data:', error);
    
    // Fallback data if CMS fails
    const fallbackData = {
      seo: {
        title: "Dealy.TW 台灣每日最新優惠折扣平台",
        description: "全台最新優惠情報｜每日更新！ ✨"
      },
      hero: {
        title: "Dealy.TW 台灣每日最新優惠折扣平台",
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
        heading: "今日最新最受歡迎優惠券/Promo Code/優惠碼",
        items: []
      }
    };
    
    return <HomePageClient initialData={fallbackData} />;
  }
}