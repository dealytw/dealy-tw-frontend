// /projects/dealy-tw-frontend/src/lib/transformers.ts
import { 
  Shop, 
  Coupon, 
  Topic, 
  TransformedShop, 
  TransformedCoupon, 
  TransformedTopic 
} from "@/types/cms";

// Transform Strapi Shop to clean format
export function transformShop(shop: Shop): TransformedShop {
  return {
    id: shop.id,
    name: shop.attributes.merchant_name,
    slug: shop.attributes.slug,
    logo: shop.attributes.logo?.data?.attributes?.url || null,
    description: shop.attributes.summary || shop.attributes.store_description || null,
    website: shop.attributes.site_url || null,
    affiliateLink: shop.attributes.default_affiliate_link || null,
    pageLayout: shop.attributes.pageLayout || "coupon",
    isFeatured: shop.attributes.is_featured || false,
    market: shop.attributes.market?.data ? {
      id: shop.attributes.market.data.id,
      name: shop.attributes.market.data.attributes.name,
      key: shop.attributes.market.data.attributes.key,
      defaultLocale: shop.attributes.market.data.attributes.defaultLocale,
    } : null,
    category: shop.attributes.category?.data ? {
      id: shop.attributes.category.data.id,
      name: shop.attributes.category.data.attributes.name,
      slug: shop.attributes.category.data.attributes.slug,
    } : null,
    seoTitle: shop.attributes.seo_title || null,
    seoDescription: shop.attributes.seo_description || null,
    canonicalUrl: shop.attributes.canonical_url || null,
    priority: shop.attributes.priority || 0,
    robots: shop.attributes.robots || "index,follow",
    createdAt: shop.attributes.createdAt,
    updatedAt: shop.attributes.updatedAt,
    publishedAt: shop.attributes.publishedAt || null,
  };
}

// Transform Strapi Coupon to clean format
export function transformCoupon(coupon: Coupon): TransformedCoupon {
  return {
    id: coupon.id,
    title: coupon.attributes.coupon_title,
    slug: coupon.attributes.coupon_uid,
    type: coupon.attributes.coupon_type,
    code: coupon.attributes.code || null,
    affiliateLink: coupon.attributes.affiliate_link,
    startDate: coupon.attributes.starts_at || null,
    expiryDate: coupon.attributes.expires_at || null,
    description: coupon.attributes.description || null,
    editorTips: coupon.attributes.editor_tips || null,
    discountValue: coupon.attributes.value || null,
    priority: coupon.attributes.priority || 0,
    status: coupon.attributes.coupon_status,
    usageCount: coupon.attributes.user_count || 0,
    lastClickAt: coupon.attributes.last_click_at || null,
    displayCount: coupon.attributes.display_count || 0,
    merchant: coupon.attributes.merchant?.data ? transformShop(coupon.attributes.merchant.data) : null,
    market: coupon.attributes.market?.data ? {
      id: coupon.attributes.market.data.id,
      name: coupon.attributes.market.data.attributes.name,
      key: coupon.attributes.market.data.attributes.key,
      defaultLocale: coupon.attributes.market.data.attributes.defaultLocale,
    } : null,
    createdAt: coupon.attributes.createdAt,
    updatedAt: coupon.attributes.updatedAt,
    publishedAt: coupon.attributes.publishedAt || null,
  };
}

// Transform Strapi Topic to clean format
export function transformTopic(topic: Topic): TransformedTopic {
  return {
    id: topic.id,
    title: topic.attributes.title,
    slug: topic.attributes.slug,
    intro: topic.attributes.intro || null,
    seoTitle: topic.attributes.seo_title || null,
    seoDescription: topic.attributes.seo_description || null,
    featuredMerchants: topic.attributes.featured_merchants?.map(fm => ({
      id: fm.id,
      merchant: fm.merchant?.data ? transformShop(fm.merchant.data) : null
    })) || [],
    flashDeals: topic.attributes.flash_deals?.map(fd => ({
      id: fd.id,
      coupon: fd.coupon?.data ? transformCoupon(fd.coupon.data) : null
    })) || [],
    market: topic.attributes.market?.data ? {
      id: topic.attributes.market.data.id,
      name: topic.attributes.market.data.attributes.name,
      key: topic.attributes.market.data.attributes.key,
      defaultLocale: topic.attributes.market.data.attributes.defaultLocale
    } : null,
    createdAt: topic.attributes.createdAt,
    updatedAt: topic.attributes.updatedAt,
    publishedAt: topic.attributes.publishedAt || null,
  };
}

// Transform collections
export function transformShops(shops: Shop[]): TransformedShop[] {
  return shops.map(transformShop);
}

export function transformCoupons(coupons: Coupon[]): TransformedCoupon[] {
  return coupons.map(transformCoupon);
}

export function transformTopics(topics: Topic[]): TransformedTopic[] {
  return topics.map(transformTopic);
}

// Transform Strapi HomePage to clean format
export function transformHomePage(homePage: HomePage): TransformedHomePage {
  return {
    id: homePage.id,
    title: homePage.attributes.title,
    hero: homePage.attributes.hero?.map(hero => ({
      id: hero.id,
      backgroundImage: hero.background?.data?.attributes?.url || null,
      title: hero.title,
      subtitle: hero.subtitle || null,
      showSearch: hero.showSearch || true,
    })) || [],
    featuredStores: homePage.attributes.popularstore ? {
      id: homePage.attributes.popularstore.id,
      heading: homePage.attributes.popularstore.heading,
      merchants: homePage.attributes.popularstore.merchants?.data?.map(transformShop) || [],
    } : null,
    categorySection: homePage.attributes.category ? {
      id: homePage.attributes.category.id,
      heading: homePage.attributes.category.heading,
      merchants: homePage.attributes.category.merchants?.data?.map(transformShop) || [],
      categories: homePage.attributes.category.categories?.data?.map(cat => ({
        id: cat.id,
        name: cat.attributes.name,
        slug: cat.attributes.slug,
      })) || [],
    } : null,
    couponSection: homePage.attributes.coupon ? {
      id: homePage.attributes.coupon.id,
      heading: homePage.attributes.coupon.heading,
      merchants: homePage.attributes.coupon.merchants?.data?.map(transformShop) || [],
    } : null,
    topicSection: homePage.attributes.topicpage ? {
      id: homePage.attributes.topicpage.id,
      heading: homePage.attributes.topicpage.heading,
      topics: homePage.attributes.topicpage.topics?.data?.map(transformTopic) || [],
    } : null,
    seoTitle: homePage.attributes.seo_title || null,
    seoDescription: homePage.attributes.seo_description || null,
    market: homePage.attributes.market?.data ? {
      id: homePage.attributes.market.data.id,
      name: homePage.attributes.market.data.attributes.name,
      key: homePage.attributes.market.data.attributes.key,
      defaultLocale: homePage.attributes.market.data.attributes.defaultLocale,
    } : null,
    createdAt: homePage.attributes.createdAt,
    updatedAt: homePage.attributes.updatedAt,
    publishedAt: homePage.attributes.publishedAt || null,
  };
}
