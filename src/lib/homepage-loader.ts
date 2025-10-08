// src/lib/homepage-loader.ts
import { absolutizeMedia, getHomePageByMarketKey } from "./strapi";
import { mapHero, mapMerchantBasic, mapCategoryBasic } from "./mappers";

export type HomePageData = {
  seo: {
    title: string;
    description: string;
  };
  hero: {
    title: string;
    subtitle: string;
    description: string;
    bgUrl: string;
    searchPlaceholder: string;
  };
  popularMerchants: {
    heading: string;
    items: Array<{
      id: number;
      name: string;
      slug: string;
      logoUrl: string;
      description: string;
      topCouponTitle?: string;
    }>;
  };
  categoryBlock: {
    heading: string;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      iconUrl: string;
    }>;
    disclaimer: string;
  };
  couponRail: {
    heading: string;
    items: Array<{
      id: string;
      merchantId: string;
      logo: string;
      discount: string;
      type: string;
      couponType: "coupon" | "promo_code";
      title: string;
      timeLeft?: string;
      usageCount: number;
      description: string;
      terms?: string;
      code?: string;
      affiliateLink: string;
      expiresAt?: string;
    }>;
  };
};

export async function getHomePageData(marketKey: string): Promise<HomePageData> {
  const hp = await getHomePageByMarketKey(marketKey);
  if (!hp) {
    console.log(`No homepage found for market: ${marketKey}, using fallback data`);
    // Return fallback data if no homepage is found
    return {
      seo: { title: "Dealy.TW 台灣每日最新優惠折扣平台", description: "台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡" },
      hero: { title: "Dealy.TW 台灣每日最新優惠折扣平台", subtitle: "NEVER Pay Full Price", description: "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡", bgUrl: "", searchPlaceholder: "搜尋最抵Deal" },
      popularMerchants: { heading: "台灣最新折扣優惠", items: [] },
      categoryBlock: { heading: "2025優惠主題一覽", categories: [], disclaimer: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。" },
      couponRail: { heading: "今日最新最受歡迎優惠券/Promo Code/優惠碼", items: [] }
    };
  }

  const a = hp ?? {}; // Data comes directly without attributes wrapper
  const rawHero = Array.isArray(a.hero) ? a.hero[0] : a.hero;

  const rel = rawHero?.background?.url; // Background URL is directly at background.url
  if (!rel) {
    console.log('Warning: hero.background is missing, using empty bgUrl');
  }
  const heroBgUrl = absolutizeMedia(rel);

  const hero = {
    bgUrl: heroBgUrl,
    title: rawHero?.title,
    subtitle: rawHero?.subtitle,
    description: rawHero?.description,
    searchPlaceholder: rawHero?.search_placeholder,
    showSearch: Boolean(rawHero?.showSearch),
  };

  // Process popular merchants from category.merchants
  const popularMerchants = a.category?.merchants?.map((merchant: any) => ({
    id: merchant.id,
    name: merchant.merchant_name,
    slug: merchant.slug,
    logoUrl: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
    description: merchant.summary || "",
    topCouponTitle: undefined, // TODO: Fetch top coupon for each merchant
  })) || [];

  // Process categories from category.categories (for 熱門分類)
  const categories = a.category?.categories?.map((category: any) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    iconUrl: "", // Categories don't have icons yet
  })) || [];

  // Process topics from topicpage.topics (for 2025優惠主題一覽)
  const topics = a.topicpage?.topics?.map((topic: any) => ({
    id: topic.id,
    name: topic.name,
    slug: topic.slug,
    iconUrl: "", // Topics don't have icons yet
  })) || [];

  // Process coupon rail merchants (for now, just use the same merchants as popular)
  const couponItems = a.coupon?.merchants?.map((merchant: any) => ({
    id: `merchant-${merchant.id}`,
    merchantId: merchant.id.toString(),
    logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
    discount: "10% OFF", // TODO: Fetch actual coupon data
    type: "discount",
    couponType: "promo_code" as const,
    title: `${merchant.merchant_name} 優惠券`,
    usageCount: 0,
    description: merchant.summary || "",
    affiliateLink: merchant.default_affiliate_link || merchant.site_url || "",
  })) || [];

  return {
    seo: { 
      title: a.title ?? hero.title ?? "Dealy.TW 台灣每日最新優惠折扣平台", 
      description: hero.description ?? "台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡" 
    },
    hero: {
      bgUrl: hero.bgUrl,
      title: hero.title ?? a.title ?? "Dealy.TW 台灣每日最新優惠折扣平台",
      subtitle: hero.subtitle ?? "NEVER Pay Full Price",
      description: hero.description ?? "🛍 台灣最新優惠網站｜每日更新 ✨ 至抵 Deal 任你揀 🧡",
      searchPlaceholder: hero.searchPlaceholder ?? "搜尋最抵Deal"
    },
    popularMerchants: { 
      heading: a.popularstore?.heading ?? "台灣最新折扣優惠", 
      items: popularMerchants 
    },
    categoryBlock: { 
      heading: a.topicpage?.heading ?? "2025優惠主題一覽", 
      categories: topics, 
      disclaimer: a.topicpage?.disclaimer ?? "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。" 
    },
    sidebarCategories: {
      heading: "熱門分類",
      categories: categories
    },
    couponRail: { 
      heading: a.coupon?.heading ?? "今日最新最受歡迎優惠券/Promo Code/優惠碼", 
      items: couponItems as any[] 
    }
  };
}