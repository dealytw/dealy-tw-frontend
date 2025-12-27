// src/lib/homepage-loader.ts
// Helper function to extract text from Strapi rich text (for plain text fallback)
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
import { absolutizeMedia, rewriteImageUrl } from "./strapi.server";
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
      merchantSlug?: string;
      merchantName?: string;
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
      seo: { title: "Dealy TW 台灣最新優惠碼及折扣平台｜每日更新網購優惠", description: "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。" },
      hero: { title: "Dealy TW 台灣最新優惠碼及折扣平台｜每日更新網購優惠", subtitle: "NEVER Pay Full Price", description: "🛍 全台最新優惠情報｜每日更新！ ✨", bgUrl: "", searchPlaceholder: "搜尋最抵Deal" },
      popularMerchants: { heading: "台灣最新折扣優惠", items: [] },
      categoryBlock: { heading: "2025優惠主題一覽", categories: [], disclaimer: "通過本站連結完成購物訂單，我們可能會因此獲得佣金，而您無需額外付費。" },
      couponRail: { heading: "本日最新最受歡迎折扣碼/優惠券/Promo Code", items: [] }
    };
  }

  const a = hp ?? {}; // Data comes directly without attributes wrapper
  const rawHero = Array.isArray(a.hero) ? a.hero[0] : a.hero;

  const rel = rawHero?.background?.url; // Background URL is directly at background.url
  if (!rel) {
    console.log('Warning: hero.background is missing, using empty bgUrl');
  }
  // Rewrite hero background image URL to use custom domain
  const heroBgUrl = rel ? rewriteImageUrl(rel) : "";

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
          slug: merchant.page_slug,
          logoUrl: merchant.logo?.url ? rewriteImageUrl(merchant.logo.url) : "",
          description: merchant.summary || "",
          topCouponTitle: topCoupon?.coupon_title || "",
        });
      } catch (error) {
        console.error(`Error fetching coupon for merchant ${merchant.id}:`, error);
        // No fallback - only show first coupon title, no summary
        popularMerchants.push({
          id: merchant.id,
          name: merchant.merchant_name,
          slug: merchant.page_slug,
          logoUrl: merchant.logo?.url ? rewriteImageUrl(merchant.logo.url) : "",
          description: merchant.summary || "",
          topCouponTitle: "",
        });
      }
    }
  }

  // Process categories from category.categories (for 熱門分類)
  const categories = a.category?.categories?.map((category: any) => ({
    id: category.id,
    name: category.name,
    page_slug: category.page_slug,
    iconUrl: "", // Categories don't have icons yet
  })) || [];

  // Process special-offers from topicpage.special_offers (for 2025優惠主題一覽)
  const specialOffers = a.topicpage?.special_offers?.map((specialOffer: any) => ({
    id: specialOffer.id,
    name: specialOffer.homepage_title || specialOffer.title, // Use homepage_title, fallback to title
    slug: specialOffer.page_slug,
    iconUrl: specialOffer.logo?.url ? rewriteImageUrl(specialOffer.logo.url) : "",
  })) || [];

  // Process coupon rail merchants with real coupon data
  let couponItems = [];
  if (a.coupon?.merchants) {
    for (const merchant of a.coupon.merchants) {
      try {
        // Fetch top coupon for this merchant using the coupon query function
        const topCoupon = await getTopCouponForMerchant(merchant.id.toString(), marketKey);
        
        if (topCoupon) {
          // Use merchant.page_slug from homepage data if available, otherwise use topCoupon.merchant.slug
          const merchantSlug = merchant.page_slug || topCoupon.merchant.slug;
          couponItems.push({
            id: `coupon-${topCoupon.id}`,
            merchantId: merchant.id.toString(),
            merchantSlug: merchantSlug,
            merchantName: topCoupon.merchant.name || merchant.merchant_name || '',
            logo: topCoupon.merchant.logo ? rewriteImageUrl(topCoupon.merchant.logo) : "",
            discount: topCoupon.value,
            type: topCoupon.coupon_type === "promo_code" ? "優惠碼" : 
                  topCoupon.coupon_type === "coupon" ? "優惠券" : "自動折扣",
            couponType: topCoupon.coupon_type,
            title: topCoupon.coupon_title,
            usageCount: topCoupon.display_count,
            description: topCoupon.description, // Pass raw rich text object (will be rendered in client component)
            terms: topCoupon.editor_tips, // Pass raw rich text object (will be rendered in client component)
            code: topCoupon.code,
            affiliateLink: topCoupon.affiliate_link,
            expiresAt: topCoupon.expires_at,
          });
        } else {
          // No coupon found for this merchant, create placeholder
          couponItems.push({
            id: `merchant-${merchant.id}`,
            merchantId: merchant.id.toString(),
            merchantSlug: merchant.page_slug,
            logo: merchant.logo?.url ? rewriteImageUrl(merchant.logo.url) : "",
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
          merchantSlug: merchant.page_slug,
          logo: merchant.logo?.url ? rewriteImageUrl(merchant.logo.url) : "",
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

  // Normalize title: Replace "Dealy.HK" with "Dealy TW" for consistency
  const rawTitle = a.seo_title ?? a.title ?? hero.title ?? "Dealy TW 台灣最新優惠碼及折扣平台｜每日更新網購優惠";
  const normalizedTitle = rawTitle.replace(/Dealy\.HK/gi, 'Dealy TW').replace(/Dealy\.TW/gi, 'Dealy TW');
  
  // Enhance description with SEO keywords if not already present
  const rawDescription = a.seo_description ?? hero.description ?? "全台最新優惠情報｜每日更新！ ✨";
  let enhancedDescription = rawDescription;
  
  // Only enhance if description is the default/fallback (short description)
  // If CMS has a custom description, use it as-is
  const isDefaultDescription = !a.seo_description && (rawDescription === hero.description || rawDescription === "全台最新優惠情報｜每日更新！ ✨");
  
  if (isDefaultDescription) {
    // Use enhanced SEO-optimized description for default case
    enhancedDescription = "精選台灣最新網購優惠碼、折扣碼與網購折扣情報！Dealy TW 提供各大品牌獨家優惠券、信用卡優惠、會員禮遇及限時 Promo Code，助你精明省錢。";
  } else if (a.seo_description) {
    // CMS has custom description - use as-is (already SEO optimized by content team)
    enhancedDescription = a.seo_description;
  }

  return {
    seo: { 
      title: normalizedTitle, 
      description: enhancedDescription
    },
    hero: {
      bgUrl: hero.bgUrl,
      title: hero.title ? hero.title.replace(/Dealy\.HK/gi, 'Dealy TW').replace(/Dealy\.TW/gi, 'Dealy TW') : (a.title ? a.title.replace(/Dealy\.HK/gi, 'Dealy TW').replace(/Dealy\.TW/gi, 'Dealy TW') : "Dealy TW 台灣最新優惠碼及折扣平台｜每日更新網購優惠"),
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
      heading: a.coupon?.heading ?? "本日最新最受歡迎折扣碼/優惠券/Promo Code", 
      items: couponItems as any[] 
    }
  };
}