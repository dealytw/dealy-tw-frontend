// src/lib/homepage-loader.ts
// Helper function to extract text from Strapi rich text
function extractTextFromRichText(richText: any): string {
  if (!richText) return "";
  if (typeof richText === "string") return richText;
  if (Array.isArray(richText)) {
    return richText.map(item => {
      if (item.children && Array.isArray(item.children)) {
        return item.children.map((child: any) => child.text || "").join("");
      }
      return item.text || "";
    }).join(" ");
  }
  return "";
}
import { absolutizeMedia } from "./strapi.server";
import { getHomePageByMarket } from "./homepage";
import { getTopCouponForMerchant } from "./coupon-queries";

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
  sidebarCategories: {
    heading: string;
    categories: Array<{
      id: number;
      name: string;
      slug: string;
      iconUrl: string;
    }>;
  };
};

export async function getHomePageData(marketKey: string): Promise<HomePageData> {
  const hpResponse = await getHomePageByMarket(marketKey);
  const hp = hpResponse.data?.[0];
  
  if (!hp) {
    console.log(`No homepage found for market: ${marketKey}, using fallback data`);
    // Return fallback data if no homepage is found
    return {
      seo: { title: "Dealy.TW 台灣每日最新優惠折扣平台", description: "全台最新優惠情報｜每日更新！ ✨" },
      hero: { title: "Dealy.TW 台灣每日最新優惠折扣平台", subtitle: "NEVER Pay Full Price", description: "🛍 全台最新優惠情報｜每日更新！ ✨", bgUrl: "", searchPlaceholder: "搜尋最抵Deal" },
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

  // Process popular merchants from category.merchants with top coupon titles
  let popularMerchants = [];
  if (a.category?.merchants) {
    for (const merchant of a.category.merchants) {
      try {
        // Fetch top coupon for this merchant
        const topCoupon = await getTopCouponForMerchant(merchant.id.toString(), marketKey);
        
        popularMerchants.push({
          id: merchant.id,
          name: merchant.merchant_name,
          slug: merchant.slug,
          logoUrl: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
          description: merchant.summary || "",
          topCouponTitle: topCoupon?.coupon_title || merchant.summary || "",
        });
      } catch (error) {
        console.error(`Error fetching coupon for merchant ${merchant.id}:`, error);
        // Fallback to description if coupon fetch fails
        popularMerchants.push({
          id: merchant.id,
          name: merchant.merchant_name,
          slug: merchant.slug,
          logoUrl: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
          description: merchant.summary || "",
          topCouponTitle: merchant.summary || "",
        });
      }
    }
  }

  // Process categories from category.categories (for 熱門分類)
  const categories = a.category?.categories?.map((category: any) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    iconUrl: "", // Categories don't have icons yet
  })) || [];

  // Process special-offers from topicpage.special_offers (for 2025優惠主題一覽)
  const specialOffers = a.topicpage?.special_offers?.map((specialOffer: any) => ({
    id: specialOffer.id,
    name: specialOffer.title,
    slug: specialOffer.slug,
    iconUrl: specialOffer.logo?.url ? absolutizeMedia(specialOffer.logo.url) : "",
  })) || [];

  // Process coupon rail merchants with real coupon data
  let couponItems = [];
  if (a.coupon?.merchants) {
    for (const merchant of a.coupon.merchants) {
      try {
        // Fetch top coupon for this merchant using the coupon query function
        const topCoupon = await getTopCouponForMerchant(merchant.id.toString(), marketKey);
        
        if (topCoupon) {
          couponItems.push({
            id: `coupon-${topCoupon.id}`,
            merchantId: merchant.id.toString(),
            merchantSlug: topCoupon.merchant.slug,
            logo: topCoupon.merchant.logo,
            discount: topCoupon.value,
            type: topCoupon.coupon_type === "promo_code" ? "優惠碼" : 
                  topCoupon.coupon_type === "coupon" ? "優惠券" : "自動折扣",
            couponType: topCoupon.coupon_type,
            title: topCoupon.coupon_title,
            usageCount: topCoupon.display_count,
            description: extractTextFromRichText(topCoupon.description),
            terms: extractTextFromRichText(topCoupon.editor_tips),
            code: topCoupon.code,
            affiliateLink: topCoupon.affiliate_link,
            expiresAt: topCoupon.expires_at,
          });
        } else {
          // No coupon found for this merchant, create placeholder
          couponItems.push({
            id: `merchant-${merchant.id}`,
            merchantId: merchant.id.toString(),
            logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
            discount: "10% OFF",
            type: "優惠券",
            couponType: "coupon" as const,
            title: `${merchant.merchant_name} 優惠券`,
            usageCount: 0,
            description: merchant.summary || "",
            terms: "",
            code: "",
            affiliateLink: merchant.affiliate_link || "",
            expiresAt: undefined,
          });
        }
      } catch (error) {
        console.error(`Error fetching coupon for merchant ${merchant.id}:`, error);
        // Fallback to placeholder
        couponItems.push({
          id: `merchant-${merchant.id}`,
          merchantId: merchant.id.toString(),
          logo: merchant.logo?.url ? absolutizeMedia(merchant.logo.url) : "",
          discount: "10% OFF",
          type: "優惠券",
          couponType: "coupon" as const,
          title: `${merchant.merchant_name} 優惠券`,
          usageCount: 0,
          description: merchant.summary || "",
          terms: "",
          code: "",
          affiliateLink: merchant.affiliate_link || "",
          expiresAt: undefined,
        });
      }
    }
  }

  return {
    seo: { 
      title: a.title ?? hero.title ?? "Dealy.TW 台灣每日最新優惠折扣平台", 
      description: hero.description ?? "全台最新優惠情報｜每日更新！ ✨" 
    },
    hero: {
      bgUrl: hero.bgUrl,
      title: hero.title ?? a.title ?? "Dealy.TW 台灣每日最新優惠折扣平台",
      subtitle: hero.subtitle ?? "NEVER Pay Full Price",
      description: hero.description ?? "🛍 全台最新優惠情報｜每日更新！ ✨",
      searchPlaceholder: hero.searchPlaceholder ?? "搜尋最抵Deal"
    },
    popularMerchants: { 
      heading: a.popularstore?.heading ?? "台灣最新折扣優惠", 
      items: popularMerchants 
    },
    categoryBlock: { 
      heading: a.topicpage?.heading ?? "2025優惠主題一覽", 
      categories: specialOffers, 
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